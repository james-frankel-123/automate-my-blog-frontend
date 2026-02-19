/**
 * Jobs API Service - Worker Queue Integration
 *
 * Handles job creation, polling, retry, and cancel for long-running tasks:
 * - Content generation (blog posts)
 * - Website analysis
 *
 * See: docs/backend-queue-system-specification.md (Frontend Handoff)
 * Issue #89: Phase 6 streaming polish — reconnection, rate limits, feature flag.
 */

const DEFAULT_POLL_INTERVAL_MS = 2500;
const DEFAULT_MAX_POLL_ATTEMPTS = 120; // ~5 minutes at 2.5s interval

/** Max reconnection attempts for EventSource after connection loss */
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 5;

/** Base delay (ms) for exponential backoff on reconnect */
const RECONNECT_BASE_DELAY_MS = 1000;

/** If no complete/failed event within this time, reject so caller can fall back to polling (avoids stuck "Reading your pages…") */
const DEFAULT_STREAM_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/** Check if streaming is enabled via feature flag (default: true) */
function isStreamingEnabled() {
  const val = process.env.REACT_APP_STREAMING_ENABLED;
  if (val === undefined || val === '') return true;
  return val === 'true' || val === '1';
}

/** Check if error indicates rate limit (429 or errorCode/message) */
function isRateLimitError(data) {
  if (!data) return false;
  const code = (data.errorCode || data.code || '').toString().toLowerCase();
  const msg = (data.error || data.message || '').toString().toLowerCase();
  return (
    data.status === 429 ||
    code === 'rate_limit' ||
    code === 'rate_limit_exceeded' ||
    msg.includes('rate limit') ||
    msg.includes('too many requests')
  );
}

/** User-facing message for rate limit with retry suggestion */
const RATE_LIMIT_MESSAGE =
  'Service is busy. Please wait a moment and try again.';

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
    if (sessionId) {
      headers['x-session-id'] = sessionId;
    }
    return headers;
  }

  /**
   * @param {string} method
   * @param {string} path
   * @param {Object|null} body
   * @param {{ timeoutMs?: number }} [opts] - timeoutMs: abort fetch after this many ms (default none). Use for job create to avoid hanging if backend is slow/cold.
   */
  async _request(method, path, body = null, opts = {}) {
    const url = `${this.baseURL}${path}`;
    const { timeoutMs } = opts;
    const options = {
      method,
      headers: this._getHeaders(),
    };
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }
    let controller;
    if (timeoutMs > 0) {
      controller = new AbortController();
      options.signal = controller.signal;
      setTimeout(() => controller.abort(), timeoutMs);
    }
    let response;
    try {
      response = await fetch(url, options);
    } catch (err) {
      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`Request timed out after ${timeoutMs}ms. The server may be busy or slow to respond. Try again.`);
        timeoutErr.code = 'TIMEOUT';
        throw timeoutErr;
      }
      throw err;
    }
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
    return this._request('POST', '/api/v1/jobs/content-generation', payload, {
      timeoutMs: JobsAPI.CREATE_JOB_TIMEOUT_MS,
    });
  }

  /**
   * Create website analysis job
   * POST /api/v1/jobs/website-analysis
   * @param {string} url - Website URL
   * @param {string} [sessionId] - Optional; can also be sent via x-session-id header
   * @returns {Promise<{ jobId: string }>}
   */
  /** Request timeout for job creation (avoids indefinite hang if backend is cold/slow). */
  static CREATE_JOB_TIMEOUT_MS = 45 * 1000;

  async createWebsiteAnalysisJob(url, sessionId = null) {
    const body = { url };
    if (sessionId) body.sessionId = sessionId;
    return this._request('POST', '/api/v1/jobs/website-analysis', body, {
      timeoutMs: JobsAPI.CREATE_JOB_TIMEOUT_MS,
    });
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
   * Build SSE URL for narrative stream (Issue #157). Separate endpoint from job stream.
   * GET /api/v1/jobs/:jobId/narrative-stream - conversational scraping/analysis narrative.
   * @param {string} jobId
   * @returns {string}
   */
  getNarrativeStreamUrl(jobId) {
    const path = `/api/v1/jobs/${encodeURIComponent(jobId)}/narrative-stream`;
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
   * Connect to narrative stream SSE (Issue #157, #261).
   * Events: analysis-status-update (preferred), scraping-thought (legacy), transition, analysis-chunk (short opening),
   * insight-card (one per card, 4–6 total), narrative-complete, complete.
   * @param {string} jobId
   * @param {Object} [handlers] - { onAnalysisStatusUpdate?, onScrapingThought?, onTransition?, onAnalysisChunk?, onInsightCard?, onNarrativeComplete?, onComplete?, onError?, onBusinessProfile? }
   * @param {{ signal?: AbortSignal }} [options] - AbortSignal to cancel and close stream
   * @returns {Promise<{ available: boolean }>} Resolves when stream ends. available: false if endpoint unavailable (404) or aborted.
   */
  connectToNarrativeStream(jobId, handlers = {}, options = {}) {
    return new Promise((resolve) => {
      const url = this.getNarrativeStreamUrl(jobId);
      const eventSource = new EventSource(url);
      let settled = false;

      const parseData = (event) => {
        try {
          return JSON.parse(event.data || '{}');
        } catch {
          return {};
        }
      };

      const resolveAvailable = (available) => {
        if (!settled) {
          settled = true;
          if (timeoutId) clearTimeout(timeoutId);
          eventSource.close();
          resolve({ available });
        }
      };

      const NARRATIVE_STREAM_MAX_MS = 120000;
      const timeoutId = setTimeout(() => {
        if (handlers.onError) handlers.onError(new Error('Narrative stream timed out'));
        resolveAvailable(false);
      }, NARRATIVE_STREAM_MAX_MS);

      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          resolveAvailable(false);
        });
      }

      const onStatusUpdate = (event) => {
        const data = parseData(event);
        if (handlers.onAnalysisStatusUpdate) handlers.onAnalysisStatusUpdate(data);
        if (handlers.onScrapingThought) handlers.onScrapingThought(data);
      };
      eventSource.addEventListener('analysis-status-update', onStatusUpdate);
      eventSource.addEventListener('scraping-thought', onStatusUpdate);

      eventSource.addEventListener('transition', (event) => {
        const data = parseData(event);
        if (handlers.onTransition) handlers.onTransition(data);
      });

      eventSource.addEventListener('analysis-chunk', (event) => {
        const data = parseData(event);
        if (handlers.onAnalysisChunk) handlers.onAnalysisChunk(data);
      });

      eventSource.addEventListener('insight-card', (event) => {
        const data = parseData(event);
        if (handlers.onInsightCard) handlers.onInsightCard(data);
      });

      eventSource.addEventListener('narrative-complete', (event) => {
        const data = parseData(event);
        if (handlers.onNarrativeComplete) handlers.onNarrativeComplete(data);
      });

      eventSource.addEventListener('business-profile', (event) => {
        const data = parseData(event);
        if (handlers.onBusinessProfile) handlers.onBusinessProfile(data);
      });

      eventSource.addEventListener('complete', (event) => {
        const data = parseData(event);
        if (handlers.onComplete) handlers.onComplete(data);
        resolveAvailable(true);
      });

      eventSource.onerror = () => {
        if (handlers.onError) handlers.onError(new Error('Narrative stream unavailable'));
        resolveAvailable(false);
      };
    });
  }

  /**
   * Connect to job progress stream (SSE).
   * Supports auto-reconnect on connection loss (Issue #89).
   * When REACT_APP_STREAMING_ENABLED=false, rejects immediately so caller can fall back to polling.
   *
   * @param {string} jobId
   * @param {Object} [handlers] - { onProgress?, onStepChange?, onComplete?, onFailed?, onConnected?, onReconnecting?,
   *   onScrapePhase?, onScrapeResult?, onAnalysisResult?, ... }
   *   - onReconnecting(attempt, maxAttempts) - called when reconnecting after connection loss
   *   - onFailed(data) - failed: { error, errorCode?, retryable? }; rate limit errors include retryable: true
   * @param {Object} [options] - { maxReconnectAttempts?: number, streamTimeoutMs?: number }
   * @returns {Promise<Object>} Resolves with { status: 'succeeded'|'failed', result?, error?, errorCode?, retryable? }
   */
  connectToJobStream(jobId, handlers = {}, options = {}) {
    if (!isStreamingEnabled()) {
      return Promise.reject(new Error('Streaming disabled by feature flag'));
    }

    const maxReconnectAttempts = options.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS;
    const streamTimeoutMs = options.streamTimeoutMs ?? DEFAULT_STREAM_TIMEOUT_MS;

    return new Promise((resolve, reject) => {
      const url = this.getJobStreamUrl(jobId);
      let eventSource = null;
      let settled = false;
      let reconnectAttempt = 0;
      let reconnectTimeoutId = null;
      /** If backend never sends complete/failed, reject after this so caller can fall back to polling. */
      let streamTimeoutId = null;
      /** After job complete we keep stream open briefly so narration events can still be received (Issue #261). */
      let narrationKeepOpenTimeoutId = null;
      const NARRATION_KEEP_OPEN_MS = 90 * 1000;

      const close = () => {
        if (streamTimeoutId) {
          clearTimeout(streamTimeoutId);
          streamTimeoutId = null;
        }
        if (narrationKeepOpenTimeoutId) {
          clearTimeout(narrationKeepOpenTimeoutId);
          narrationKeepOpenTimeoutId = null;
        }
        if (reconnectTimeoutId) {
          clearTimeout(reconnectTimeoutId);
          reconnectTimeoutId = null;
        }
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
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
        if (streamTimeoutId) {
          clearTimeout(streamTimeoutId);
          streamTimeoutId = null;
        }
        const payload = data || {};
        let error = payload.error ?? payload.message ?? 'Job failed';
        const errorCode = payload.errorCode;
        const retryable = isRateLimitError(payload);
        if (retryable) {
          error = payload.error ?? payload.message ?? RATE_LIMIT_MESSAGE;
        }
        if (handlers.onFailed) handlers.onFailed({ error, errorCode, retryable });
        close();
        resolve({ status: 'failed', error, errorCode, retryable });
      };

      const resolveSucceeded = (result) => {
        if (settled) return;
        settled = true;
        if (streamTimeoutId) {
          clearTimeout(streamTimeoutId);
          streamTimeoutId = null;
        }
        resolve({ status: 'succeeded', result });
        // Keep stream open so narration events (audience/topic/content) sent after complete are still received (Issue #261).
        narrationKeepOpenTimeoutId = setTimeout(() => {
          narrationKeepOpenTimeoutId = null;
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
        }, NARRATION_KEEP_OPEN_MS);
      };

      const tryReconnect = () => {
        if (settled || reconnectAttempt >= maxReconnectAttempts) {
          if (!settled) {
            settled = true;
            reject(new Error('Job stream connection failed after reconnection attempts'));
          }
          return;
        }
        reconnectAttempt += 1;
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (handlers.onReconnecting) {
          handlers.onReconnecting(reconnectAttempt, maxReconnectAttempts);
        }
        const delay = RECONNECT_BASE_DELAY_MS * Math.pow(2, reconnectAttempt - 1);
        reconnectTimeoutId = setTimeout(() => {
          reconnectTimeoutId = null;
          connect();
        }, delay);
      };

      const connect = () => {
        if (settled) return;
        eventSource = new EventSource(url);

        // Backend may send named SSE events — only named listeners receive them
        eventSource.addEventListener('connected', (event) => {
          const data = parseData(event);
          reconnectAttempt = 0; // Reset on successful connection
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
        eventSource.addEventListener('scrape-result', (event) => {
          const data = parseData(event);
          if (handlers.onScrapeResult) handlers.onScrapeResult(data);
        });
        eventSource.addEventListener('analysis-result', (event) => {
          const data = parseData(event);
          if (handlers.onAnalysisResult) handlers.onAnalysisResult(data);
        });
        eventSource.addEventListener('audience-complete', (event) => {
          const data = parseData(event);
          if (handlers.onAudienceComplete) handlers.onAudienceComplete(data);
        });
        eventSource.addEventListener('audiences-result', (event) => {
          const data = parseData(event);
          if (handlers.onAudiencesResult) handlers.onAudiencesResult(data);
        });
        eventSource.addEventListener('pitch-complete', (event) => {
          const data = parseData(event);
          if (handlers.onPitchComplete) handlers.onPitchComplete(data);
        });
        eventSource.addEventListener('pitches-result', (event) => {
          const data = parseData(event);
          if (handlers.onPitchesResult) handlers.onPitchesResult(data);
        });
        eventSource.addEventListener('scenario-image-complete', (event) => {
          const data = parseData(event);
          if (handlers.onScenarioImageComplete) handlers.onScenarioImageComplete(data);
        });
        eventSource.addEventListener('scenarios-result', (event) => {
          const data = parseData(event);
          if (handlers.onScenariosResult) handlers.onScenariosResult(data);
        });
        eventSource.addEventListener('stream-timeout', (event) => {
          const data = parseData(event);
          if (handlers.onStreamTimeout) handlers.onStreamTimeout(data);
        });
        eventSource.addEventListener('context-result', (event) => {
          const data = parseData(event);
          if (handlers.onContextResult) handlers.onContextResult(data);
        });
        eventSource.addEventListener('blog-result', (event) => {
          const data = parseData(event);
          if (handlers.onBlogResult) handlers.onBlogResult(data);
        });
        eventSource.addEventListener('visuals-result', (event) => {
          const data = parseData(event);
          if (handlers.onVisualsResult) handlers.onVisualsResult(data);
        });
        eventSource.addEventListener('seo-result', (event) => {
          const data = parseData(event);
          if (handlers.onSeoResult) handlers.onSeoResult(data);
        });
        // Issue #261: streaming narrations (audience, topic, content-gen)
        const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
        const logNarration = (label, data) => {
          if (isDev && (data?.text ?? data?.chunk)) {
            console.debug('[Job SSE] Narration:', label, (data?.text ?? data?.chunk).slice(0, 60) + (data?.text?.length > 60 || data?.chunk?.length > 60 ? '…' : ''));
          }
        };
        eventSource.addEventListener('audience-narration-chunk', (event) => {
          const data = parseData(event);
          logNarration('audience-chunk', data);
          if (handlers.onAudienceNarrationChunk) handlers.onAudienceNarrationChunk(data);
        });
        eventSource.addEventListener('audience-narration-complete', (event) => {
          const data = parseData(event);
          if (isDev) console.debug('[Job SSE] Narration: audience-complete');
          if (handlers.onAudienceNarrationComplete) handlers.onAudienceNarrationComplete(data);
        });
        eventSource.addEventListener('topic-narration-chunk', (event) => {
          const data = parseData(event);
          logNarration('topic-chunk', data);
          if (handlers.onTopicNarrationChunk) handlers.onTopicNarrationChunk(data);
        });
        eventSource.addEventListener('topic-narration-complete', (event) => {
          const data = parseData(event);
          if (isDev) console.debug('[Job SSE] Narration: topic-complete');
          if (handlers.onTopicNarrationComplete) handlers.onTopicNarrationComplete(data);
        });
        eventSource.addEventListener('content-narration-chunk', (event) => {
          const data = parseData(event);
          logNarration('content-chunk', data);
          if (handlers.onContentNarrationChunk) handlers.onContentNarrationChunk(data);
        });
        eventSource.addEventListener('content-narration-complete', (event) => {
          const data = parseData(event);
          if (isDev) console.debug('[Job SSE] Narration: content-complete');
          if (handlers.onContentNarrationComplete) handlers.onContentNarrationComplete(data);
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
        eventSource.addEventListener('rate_limit', (event) => {
          const data = parseData(event);
          resolveFailed({ ...data, errorCode: 'rate_limit', retryable: true });
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
                if (handlers.onProgress && (payloadData?.progress != null || payloadData?.currentStep != null || payloadData?.current_step != null || payloadData?.phase != null || payloadData?.detail != null || payloadData?.estimatedTimeRemaining != null || payloadData?.estimated_seconds_remaining != null)) handlers.onProgress(payloadData);
                break;
              case 'scrape-phase':
                if (handlers.onScrapePhase) handlers.onScrapePhase(payloadData);
                break;
              case 'scrape-result':
                if (handlers.onScrapeResult) handlers.onScrapeResult(payloadData);
                break;
              case 'analysis-result':
                if (handlers.onAnalysisResult) handlers.onAnalysisResult(payloadData);
                break;
              case 'audience-complete':
                if (handlers.onAudienceComplete) handlers.onAudienceComplete(payloadData);
                break;
              case 'audiences-result':
                if (handlers.onAudiencesResult) handlers.onAudiencesResult(payloadData);
                break;
              case 'pitch-complete':
                if (handlers.onPitchComplete) handlers.onPitchComplete(payloadData);
                break;
              case 'pitches-result':
                if (handlers.onPitchesResult) handlers.onPitchesResult(payloadData);
                break;
              case 'scenario-image-complete':
                if (handlers.onScenarioImageComplete) handlers.onScenarioImageComplete(payloadData);
                break;
              case 'scenarios-result':
                if (handlers.onScenariosResult) handlers.onScenariosResult(payloadData);
                break;
              case 'stream-timeout':
                if (handlers.onStreamTimeout) handlers.onStreamTimeout(payloadData);
                break;
              case 'context-result':
                if (handlers.onContextResult) handlers.onContextResult(payloadData);
                break;
              case 'blog-result':
                if (handlers.onBlogResult) handlers.onBlogResult(payloadData);
                break;
              case 'visuals-result':
                if (handlers.onVisualsResult) handlers.onVisualsResult(payloadData);
                break;
              case 'seo-result':
                if (handlers.onSeoResult) handlers.onSeoResult(payloadData);
                break;
              case 'complete':
                if (handlers.onComplete) handlers.onComplete(payloadData);
                resolveSucceeded(payloadData?.result ?? payloadData);
                break;
              case 'failed':
              case 'error':
                resolveFailed(payloadData);
                break;
              case 'rate_limit':
                resolveFailed({ ...payloadData, errorCode: 'rate_limit', retryable: true });
                break;
              case 'audience-narration-chunk':
                if (handlers.onAudienceNarrationChunk) handlers.onAudienceNarrationChunk(payloadData);
                break;
              case 'audience-narration-complete':
                if (handlers.onAudienceNarrationComplete) handlers.onAudienceNarrationComplete(payloadData);
                break;
              case 'topic-narration-chunk':
                if (handlers.onTopicNarrationChunk) handlers.onTopicNarrationChunk(payloadData);
                break;
              case 'topic-narration-complete':
                if (handlers.onTopicNarrationComplete) handlers.onTopicNarrationComplete(payloadData);
                break;
              case 'content-narration-chunk':
                if (handlers.onContentNarrationChunk) handlers.onContentNarrationChunk(payloadData);
                break;
              case 'content-narration-complete':
                if (handlers.onContentNarrationComplete) handlers.onContentNarrationComplete(payloadData);
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
          // EventSource onerror fires on connection loss; try reconnecting
          tryReconnect();
        };
      };

      if (streamTimeoutMs > 0) {
        streamTimeoutId = setTimeout(() => {
          if (settled) return;
          streamTimeoutId = null;
          settled = true;
          close();
          reject(new Error('Job stream timed out — switching to polling'));
        }, streamTimeoutMs);
      }
      connect();
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
