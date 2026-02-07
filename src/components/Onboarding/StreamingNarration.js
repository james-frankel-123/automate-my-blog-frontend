/**
 * StreamingNarration — first-person AI narration with smooth reveal.
 * No typing cursor. Minimum display time before unlock. Fallback on error.
 * Issue #261.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Typography, Skeleton } from 'antd';

const { Paragraph } = Typography;

const MIN_DISPLAY_TIME_MS = 5000;
const NARRATION_STYLE = {
  maxWidth: 700,
  fontSize: 18,
  lineHeight: 1.8,
  color: 'var(--color-text-primary)',
  marginBottom: 0,
};

export function StreamingNarration({
  content = '',
  isStreaming = false,
  onComplete,
  fallbackText = 'Something went wrong loading this section. Please continue.',
  minimumDisplayTime = MIN_DISPLAY_TIME_MS,
  dataTestId = 'streaming-narration',
}) {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [hasCalledComplete, setHasCalledComplete] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setMinTimeElapsed(true), minimumDisplayTime);
    return () => clearTimeout(t);
  }, [minimumDisplayTime]);

  useEffect(() => {
    if (!onComplete || hasCalledComplete) return;
    const done = !isStreaming && minTimeElapsed;
    if (done) {
      setHasCalledComplete(true);
      onComplete();
    }
  }, [isStreaming, minTimeElapsed, onComplete, hasCalledComplete]);

  const showFallback = !content && !isStreaming;
  const displayContent = showFallback ? fallbackText : content;
  const showLoading = isStreaming && !content;

  return (
    <div
      ref={containerRef}
      data-testid={dataTestId}
      style={{
        ...NARRATION_STYLE,
        padding: '24px 0',
        borderLeft: '3px solid var(--color-primary)',
        paddingLeft: 20,
      }}
    >
      {showLoading ? (
        <div data-testid="narration-loading">
          <Skeleton
            active
            paragraph={{ rows: 2, width: ['100%', '85%'] }}
            title={false}
            style={{ marginBottom: 0 }}
          />
          <Paragraph style={{ ...NARRATION_STYLE, color: 'var(--color-text-tertiary)', marginTop: 8, marginBottom: 0 }}>
            Preparing your personalized message…
          </Paragraph>
        </div>
      ) : (
        <Paragraph style={NARRATION_STYLE}>
          {displayContent}
          {showFallback && (
            <span data-testid="narration-fallback" style={{ color: 'var(--color-text-secondary)' }}>
              {' '}(fallback)
            </span>
          )}
        </Paragraph>
      )}
    </div>
  );
}

export default StreamingNarration;
