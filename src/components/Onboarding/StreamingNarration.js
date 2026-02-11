/**
 * StreamingNarration — first-person AI narration with smooth reveal.
 * Optional typing effect with blinking cursor to match "hold tight" style.
 * Fallback on error. Issue #261.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Typography } from 'antd';

const { Paragraph } = Typography;

const NARRATION_STYLE = {
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
  dataTestId = 'streaming-narration',
  enableTypingEffect = false,
}) {
  const [hasCalledComplete, setHasCalledComplete] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isStreaming) {
      console.log('🕐 [StreamingNarration] Content streaming finished');
    }
  }, [isStreaming]);

  useEffect(() => {
    if (!onComplete || hasCalledComplete) return;

    const typingComplete = !enableTypingEffect || !isTyping;
    const done = !isStreaming && typingComplete;

    if (done) {
      console.log('🕐 [StreamingNarration] Narration complete — calling onComplete');
      setHasCalledComplete(true);
      onComplete();
    }
  }, [isStreaming, onComplete, hasCalledComplete, enableTypingEffect, isTyping]);

  // When streaming finished: show full content (no re-typing, since we showed it live during stream)
  useEffect(() => {
    if (enableTypingEffect && content && !isStreaming) {
      setDisplayedText(content);
      setIsTyping(false);
    } else if (!enableTypingEffect) {
      setDisplayedText(content);
      setIsTyping(false);
    }
  }, [content, enableTypingEffect, isStreaming]);

  const showFallback = !content && !isStreaming;
  // Show streamed content as it arrives; only use typing-effect displayedText when not streaming
  const displayContent = showFallback
    ? fallbackText
    : (enableTypingEffect && !isStreaming ? displayedText : content);
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
          <Paragraph style={{ ...NARRATION_STYLE, color: 'var(--color-text-tertiary)', marginBottom: 0 }}>
            Preparing your personalized message…
          </Paragraph>
        </div>
      ) : (
        <Paragraph style={textStyle}>
          {displayContent}
          {enableTypingEffect && isStreaming && content && (
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
