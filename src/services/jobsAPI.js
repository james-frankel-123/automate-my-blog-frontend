/**
 * Jobs API Service - Worker Queue Integration
 *
 * Handles job creation, polling, retry, and cancel for long-running tasks:
 * - Content generation (blog posts)
 * - Website analysis
 *
 * See: docs/backend-queue-system-specification.md (Frontend Handoff)
 */

import { getOnUnauthorized } from './api';

const DEFAULT_POLL_INTERVAL_MS = 2500;
const DEFAULT_MAX_POLL_ATTEMPTS = 120; // ~5 minutes at 2.5s interval

function clearAuthStorage() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('auth_user_cache');
}

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
      credentials: 'include', // Send cookies/credentials on cross-origin requests (CORS)
    };
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      clearAuthStorage();
      const onUnauthorized = getOnUnauthorized();
      if (typeof onUnauthorized === 'function') {
        onUnauthorized();
      }
      const err = new Error('Session expired, please log in again.');
      err.isUnauthorized = true;
      err.status = 401;
      err.data = data;
      throw err;
    }
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
