/**
 * StreamingNarration — first-person AI narration with smooth reveal.
 * Optional typing effect with blinking cursor to match "hold tight" style.
 * Minimum display time before unlock. Fallback on error.
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

const TYPING_STYLE = {
  fontSize: '16px',
  color: 'var(--color-text-secondary)',
  fontStyle: 'italic',
  lineHeight: 1.5,
  marginBottom: 0,
};

export function StreamingNarration({
  content = '',
  isStreaming = false,
  onComplete,
  fallbackText = 'Something went wrong loading this section. Please continue.',
  minimumDisplayTime = MIN_DISPLAY_TIME_MS,
  dataTestId = 'streaming-narration',
  enableTypingEffect = false,
}) {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [hasCalledComplete, setHasCalledComplete] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => {
      console.log('🕐 [StreamingNarration] Minimum display time elapsed');
      setMinTimeElapsed(true);
    }, minimumDisplayTime);
    return () => clearTimeout(t);
  }, [minimumDisplayTime]);

  // Log when isStreaming changes
  useEffect(() => {
    if (!isStreaming) {
      console.log('🕐 [StreamingNarration] Content streaming finished');
    }
  }, [isStreaming]);

  useEffect(() => {
    if (!onComplete || hasCalledComplete) return;

    // If typing effect is enabled, wait for typing to complete as well
    const typingComplete = !enableTypingEffect || !isTyping;
    const done = !isStreaming && minTimeElapsed && typingComplete;

    if (done) {
      console.log('🕐 [StreamingNarration] ✅ ALL CONDITIONS MET - Narration complete (streaming done, min time elapsed, typing complete) - calling onComplete callback');
      setHasCalledComplete(true);
      onComplete();
    } else {
      // Log which conditions are not yet met
      if (!done) {
        const pending = [];
        if (isStreaming) pending.push('streaming');
        if (!minTimeElapsed) pending.push('min time');
        if (!typingComplete) pending.push('typing');
        if (pending.length > 0) {
          console.log(`🕐 [StreamingNarration] Waiting for: ${pending.join(', ')}`);
        }
      }
    }
  }, [isStreaming, minTimeElapsed, onComplete, hasCalledComplete, enableTypingEffect, isTyping]);

  // Typing effect logic
  useEffect(() => {
    if (enableTypingEffect && content && !isStreaming) {
      console.log('🕐 [StreamingNarration] Starting typing effect for narration');
      setIsTyping(true);
      setDisplayedText('');
      let currentIndex = 0;

      const typingInterval = setInterval(() => {
        if (currentIndex <= content.length) {
          setDisplayedText(content.slice(0, currentIndex));
          currentIndex++;
        } else {
          console.log('🕐 [StreamingNarration] Typing effect complete');
          clearInterval(typingInterval);
          setIsTyping(false);
        }
      }, 40); // 40ms per character

      return () => clearInterval(typingInterval);
    } else if (!enableTypingEffect) {
      setDisplayedText(content);
      setIsTyping(false);
    }
  }, [content, enableTypingEffect, isStreaming]);

  const showFallback = !content && !isStreaming;
  const displayContent = showFallback ? fallbackText : (enableTypingEffect ? displayedText : content);
  const showLoading = isStreaming && !content;
  const textStyle = enableTypingEffect ? TYPING_STYLE : NARRATION_STYLE;

  return (
    <div
      ref={containerRef}
      data-testid={dataTestId}
      style={{
        ...NARRATION_STYLE,
        padding: '24px 0',
        borderLeft: enableTypingEffect ? 'none' : '3px solid var(--color-primary)',
        paddingLeft: enableTypingEffect ? 0 : 20,
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
        <Paragraph style={textStyle}>
          {displayContent}
          {enableTypingEffect && isTyping && displayedText.length < content.length && (
            <span
              style={{
                display: 'inline-block',
                width: '2px',
                height: '1em',
                backgroundColor: 'var(--color-primary)',
                marginLeft: '2px',
                animation: 'blink 1s step-end infinite',
                verticalAlign: 'text-bottom'
              }}
            />
          )}
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
