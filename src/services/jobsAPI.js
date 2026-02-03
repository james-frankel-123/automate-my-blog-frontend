/**
 * Jobs API Service - Worker Queue Integration
 *
 * Handles job creation, polling, retry, and cancel for long-running tasks:
 * - Content generation (blog posts)
 * - Website analysis
 *
 * See: docs/backend-queue-system-specification.md (Frontend Handoff)
 */

const DEFAULT_POLL_INTERVAL_MS = 2500;
const DEFAULT_MAX_POLL_ATTEMPTS = 120; // ~5 minutes at 2.5s interval

class JobsAPI {
  constructor() {
    this.baseURL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
  }

  _getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const sessionId = sessionStorage.getItem('audience_session_id');
    if (sessionId && !token) {
      headers['x-session-id'] = sessionId;
    }
    return headers;
  }

  async _request(method, path, body = null) {
    const url = `${this.baseURL}${path}`;
    const options = {
      method,
      headers: this._getHeaders(),
    };
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error(data.error || data.message || `HTTP ${response.status}`);
      err.status = response.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  /**
   * Create content generation job
   * POST /api/v1/jobs/content-generation
   * @param {Object} payload - Same shape as enhanced-blog-generation/generate
   * @returns {Promise<{ jobId: string }>}
   */
  async createContentGenerationJob(payload) {
    return this._request('POST', '/api/v1/jobs/content-generation', payload);
  }

  /**
   * Create website analysis job
   * POST /api/v1/jobs/website-analysis
   * @param {string} url - Website URL
   * @param {string} [sessionId] - Optional; can also be sent via x-session-id header
   * @returns {Promise<{ jobId: string }>}
   */
  async createWebsiteAnalysisJob(url, sessionId = null) {
    const body = { url };
    if (sessionId) body.sessionId = sessionId;
    return this._request('POST', '/api/v1/jobs/website-analysis', body);
  }

  /**
   * Get job status
   * GET /api/v1/jobs/:jobId/status
   * @param {string} jobId
   * @returns {Promise<Object>} { jobId, status, progress, currentStep, error, result, ... }
   */
  async getJobStatus(jobId) {
    return this._request('GET', `/api/v1/jobs/${jobId}/status`);
  }

  /**
   * Retry a failed job
   * POST /api/v1/jobs/:jobId/retry
   * @param {string} jobId
   * @returns {Promise<{ jobId: string }>}
   */
  async retryJob(jobId) {
    return this._request('POST', `/api/v1/jobs/${jobId}/retry`);
  }

  /**
   * Cancel a queued or running job
   * POST /api/v1/jobs/:jobId/cancel
   * @param {string} jobId
   * @returns {Promise<{ cancelled: boolean }>}
   */
  async cancelJob(jobId) {
    return this._request('POST', `/api/v1/jobs/${jobId}/cancel`);
  }

  /**
   * Build SSE stream URL for job. EventSource does not send headers; token in query.
   * @param {string} jobId
   * @returns {string}
   */
  getJobStreamUrl(jobId) {
    const path = `/api/v1/jobs/${encodeURIComponent(jobId)}/stream`;
    const url = `${this.baseURL}${path}`;
    const token = localStorage.getItem('accessToken');
    if (token) {
      return `${url}?token=${encodeURIComponent(token)}`;
    }
    const sessionId = sessionStorage.getItem('audience_session_id');
    if (sessionId) {
      return `${url}?sessionId=${encodeURIComponent(sessionId)}`;
    }
    return url;
  }

  /**
   * Connect to job progress stream (SSE).
   * @param {string} jobId
   * @param {Object} [handlers] - { onProgress?(data), onStepChange?(data), onComplete?(data), onFailed?(data), onConnected?(data), onScrapePhase?(data) }
   *   - onProgress(data) - progress-update: { progress, currentStep, phase?, detail?, estimatedTimeRemaining }
   *   - onScrapePhase(data) - scrape-phase: { phase, message, url? } (thoughts / step log)
   *   - onComplete(data) - complete: data.result is full job result
   *   - onFailed(data) - failed: { error, errorCode? }
   * @returns {Promise<Object>} Resolves with { status: 'succeeded'|'failed', result?, error?, errorCode? }
   */
  connectToJobStream(jobId, handlers = {}) {
    return new Promise((resolve, reject) => {
      const url = this.getJobStreamUrl(jobId);
      const eventSource = new EventSource(url);
      let settled = false;

      const close = () => {
        eventSource.close();
      };

      const parseData = (event) => {
        try {
          return JSON.parse(event.data || '{}');
        } catch (err) {
          console.warn('[Job SSE] Parse error:', err);
          return {};
        }
      };

      const resolveFailed = (data) => {
        if (settled) return;
        settled = true;
        const payload = data || {};
        const error = payload.error ?? payload.message ?? 'Job failed';
        const errorCode = payload.errorCode;
        if (handlers.onFailed) handlers.onFailed({ error, errorCode });
        close();
        resolve({ status: 'failed', error, errorCode });
      };

      const resolveSucceeded = (result) => {
        if (settled) return;
        settled = true;
        close();
        resolve({ status: 'succeeded', result });
      };

      // Backend may send named SSE events — only named listeners receive them
      eventSource.addEventListener('connected', (event) => {
        const data = parseData(event);
        if (handlers.onConnected) handlers.onConnected(data);
      });
      eventSource.addEventListener('progress-update', (event) => {
        const data = parseData(event);
        if (handlers.onProgress) handlers.onProgress(data);
      });
      eventSource.addEventListener('step-change', (event) => {
        const data = parseData(event);
        if (handlers.onStepChange) handlers.onStepChange(data);
        if (handlers.onProgress && (data.progress != null || data.currentStep != null)) handlers.onProgress(data);
      });
      eventSource.addEventListener('scrape-phase', (event) => {
        const data = parseData(event);
        if (handlers.onScrapePhase) handlers.onScrapePhase(data);
      });
      eventSource.addEventListener('complete', (event) => {
        const data = parseData(event);
        if (handlers.onComplete) handlers.onComplete(data);
        resolveSucceeded(data?.result ?? data);
      });
      eventSource.addEventListener('failed', (event) => {
        const data = parseData(event);
        resolveFailed(data);
      });
      eventSource.addEventListener('error', (event) => {
        const data = parseData(event);
        if (event.data != null) resolveFailed(data);
      });

      // Fallback: generic 'message' events with payload { type, data }
      eventSource.addEventListener('message', (event) => {
        try {
          const payload = JSON.parse(event.data || '{}');
          const { type, data } = payload;
          const payloadData = data ?? payload;
          switch (type) {
            case 'connected':
              if (handlers.onConnected) handlers.onConnected(payloadData);
              break;
            case 'progress-update':
              if (handlers.onProgress) handlers.onProgress(payloadData);
              break;
            case 'step-change':
              if (handlers.onStepChange) handlers.onStepChange(payloadData);
              if (handlers.onProgress && (payloadData?.progress != null || payloadData?.currentStep != null)) handlers.onProgress(payloadData);
              break;
            case 'scrape-phase':
              if (handlers.onScrapePhase) handlers.onScrapePhase(payloadData);
              break;
            case 'complete':
              if (handlers.onComplete) handlers.onComplete(payloadData);
              resolveSucceeded(payloadData?.result ?? payloadData);
              break;
            case 'failed':
            case 'error':
              resolveFailed(payloadData);
              break;
            default:
              break;
          }
        } catch (err) {
          console.warn('[Job SSE] Parse error:', err);
        }
      });

      eventSource.onerror = () => {
        if (settled) return;
        settled = true;
        close();
        reject(new Error('Job stream connection failed'));
      };
    });
  }

  /**
   * Poll job status until succeeded or failed
   * @param {string} jobId
   * @param {Object} [options]
   * @param {(status: Object) => void} [options.onProgress] - Called on each poll with status
   * @param {number} [options.pollIntervalMs] - Poll interval in ms (default 2500)
   * @param {number} [options.maxAttempts] - Max poll attempts (default 120)
   * @param {AbortSignal} [options.signal] - Abort signal to stop polling
   * @returns {Promise<Object>} Final status object (status.succeeded or status.failed)
   */
  async pollJobStatus(jobId, options = {}) {
    const {
      onProgress,
      pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
      maxAttempts = DEFAULT_MAX_POLL_ATTEMPTS,
      signal,
    } = options;

    let attempts = 0;

    const poll = async () => {
      if (signal?.aborted) {
        const err = new Error('Polling aborted');
        err.aborted = true;
        throw err;
      }

      const status = await this.getJobStatus(jobId);
      attempts += 1;

      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'succeeded' || status.status === 'failed') {
        return status;
      }

      if (attempts >= maxAttempts) {
        const err = new Error('Job polling timed out');
        err.status = status;
        throw err;
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      return poll();
    };

    return poll();
  }
}

export const jobsAPI = new JobsAPI();
export default jobsAPI;
