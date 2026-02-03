import React from 'react';

/**
 * Renders text that may be streaming (ChatGPT-style) with optional pulsing cursor.
 * Issue #65: LLM Streaming for Blog Posts, Audiences, and Bundle Overview.
 *
 * @param {string} content - Current text (accumulated from stream or static)
 * @param {boolean} isStreaming - Whether more content is expected
 * @param {Object} [props] - Additional div props (className, style, etc.)
 */
function StreamingText({ content, isStreaming, ...props }) {
  return (
    <span {...props}>
      {content}
      {isStreaming && (
        <span
          className="streaming-cursor"
          aria-hidden
          style={{
            display: 'inline-block',
            width: '2px',
            height: '1em',
            marginLeft: '2px',
            backgroundColor: 'currentColor',
            animation: 'cursor-blink 1s step-end infinite',
            verticalAlign: 'text-bottom'
          }}
        />
      )}
    </span>
  );
}

export default StreamingText;
