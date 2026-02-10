import { useState, useCallback, useEffect, useRef } from 'react';
import autoBlogAPI from '../services/api';
import {
  getStreamChunkContentOnly,
  getStreamCompleteContentOnly,
  extractStreamChunk,
  extractStreamCompleteContent
} from '../utils/streamingUtils';

/**
 * Hook for consuming SSE streaming content (blog, bundle overview, etc.).
 * Accumulates content from content-chunk events and exposes final result on complete.
 * Issue #65: LLM Streaming for Blog Posts, Audiences, and Bundle Overview.
 *
 * @param {Object} options - { onComplete?, onError?, useRawContent?: boolean }
 *   useRawContent: true for blog-generation stream (backend streams only markdown; no strip-formatting).
 * @returns {Object} { content, setContent, isStreaming, error, connect, disconnect }
 */
export function useStreamingContent(options = {}) {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const closeRef = useRef(null);
  const useRawContent = Boolean(options.useRawContent);

  const disconnect = useCallback(() => {
    if (closeRef.current) {
      closeRef.current();
      closeRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const connect = useCallback(
    (connectionId) => {
      if (!connectionId) return;
      setError(null);
      setIsStreaming(true);
      setContent('');

      const getChunk = useRawContent ? getStreamChunkContentOnly : extractStreamChunk;
      const getComplete = useRawContent ? getStreamCompleteContentOnly : extractStreamCompleteContent;

      closeRef.current = autoBlogAPI.connectToStream(connectionId, {
        onChunk: (data) => {
          const chunk = getChunk(data);
          if (chunk) {
            setContent((prev) => prev + chunk);
          }
        },
        onComplete: (data) => {
          const finalContent = getComplete(data);
          if (finalContent) setContent(finalContent);
          setIsStreaming(false);
          closeRef.current = null;
          if (options.onComplete) options.onComplete(data);
        },
        onError: (data) => {
          setError(data?.message || 'Stream error');
          setIsStreaming(false);
          closeRef.current = null;
          if (options.onError) options.onError(data);
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- options/useRawContent intentionally not in deps to avoid reconnect churn
    [options.onComplete, options.onError, options.useRawContent]
  );

  useEffect(() => {
    return () => {
      if (closeRef.current) closeRef.current();
    };
  }, []);

  return {
    content,
    setContent,
    isStreaming,
    error,
    connect,
    disconnect
  };
}
