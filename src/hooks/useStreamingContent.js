import { useState, useCallback, useEffect, useRef } from 'react';
import autoBlogAPI from '../services/api';

/**
 * Hook for consuming SSE streaming content (blog, bundle overview, etc.).
 * Accumulates content from content-chunk events and exposes final result on complete.
 * Issue #65: LLM Streaming for Blog Posts, Audiences, and Bundle Overview.
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
          const chunk = data?.content ?? data?.text ?? '';
          if (chunk) {
            setContent((prev) => prev + chunk);
          }
        },
        onComplete: (data) => {
          if (data?.content !== undefined) setContent(String(data.content));
          if (data?.text !== undefined) setContent(String(data.text));
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
