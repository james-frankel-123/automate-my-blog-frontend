import { useState, useCallback, useEffect, useRef } from 'react';
import autoBlogAPI from '../services/api';
import { extractStreamChunk, extractStreamCompleteContent } from '../utils/streamingUtils';

/**
 * Hook for consuming SSE streaming content (blog, bundle overview, etc.).
 * Accumulates content from content-chunk events and exposes final result on complete.
 * Issue #65: LLM Streaming for Blog Posts, Audiences, and Bundle Overview.
 * Uses streamingUtils to prevent raw JSON from being appended to the editor.
 *
 * @param {Object} options - { onComplete?, onError? }
 * @returns {Object} { content, setContent, isStreaming, error, connect, disconnect }
 */
export function useStreamingContent(options = {}) {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const closeRef = useRef(null);

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

      closeRef.current = autoBlogAPI.connectToStream(connectionId, {
        onChunk: (data) => {
          const chunk = extractStreamChunk(data);
          if (chunk) {
            setContent((prev) => prev + chunk);
          }
        },
        onComplete: (data) => {
          const finalContent = extractStreamCompleteContent(data);
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
    [options.onComplete, options.onError]
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
