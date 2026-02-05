import React from 'react';
import DOMPurify from 'dompurify';
import { colors, typography } from '../DesignSystem/tokens';

/**
 * Convert markdown to HTML
 */
const markdownToHTML = (markdown) => {
  if (!markdown || typeof markdown !== 'string') return '';
  let html = markdown;

  // Headers (multiline: ^ matches start of line)
  html = html.replace(/^###### (.*)$/gim, '<h6>$1</h6>');
  html = html.replace(/^##### (.*)$/gim, '<h5>$1</h5>');
  html = html.replace(/^#### (.*)$/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*)$/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*)$/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*)$/gim, '<h1>$1</h1>');

  // Blockquote
  html = html.replace(/^>\s?(.*)$/gim, '<blockquote>$1</blockquote>');

  // Bold (non-greedy for streaming: incomplete ** stays as text)
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

  // Italic (non-greedy)
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Code blocks (non-greedy; partial ``` during stream stays as text)
  html = html.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');

  // Inline code
  html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

  // Lists (unordered; multiline)
  html = html.replace(/^\* (.*)$/gim, '<li>$1</li>');
  html = html.replace(/^- (.*)$/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Paragraphs (split by double newline)
  const lines = html.split('\n');
  let inList = false;
  let inCodeBlock = false;
  let result = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Handle code blocks
    if (line.includes('<pre><code>')) {
      inCodeBlock = true;
    }
    if (line.includes('</code></pre>')) {
      inCodeBlock = false;
    }

    // Handle lists
    if (line.includes('<li>') && !inList) {
      inList = true;
    }
    if (inList && !line.includes('<li>') && line.trim() !== '') {
      result.push('</ul>');
      inList = false;
    }

    // Wrap non-empty, non-special lines in paragraphs
    if (
      !inCodeBlock &&
      !inList &&
      line.trim() !== '' &&
      !line.startsWith('<h') &&
      !line.startsWith('<ul') &&
      !line.startsWith('<li') &&
      !line.startsWith('<pre') &&
      !line.startsWith('<blockquote') &&
      !line.includes('</ul>') &&
      !line.includes('</pre>')
    ) {
      line = '<p>' + line + '</p>';
    }

    result.push(line);
  }

  if (inList) {
    result.push('</ul>');
  }

  return result.join('\n');
};

/**
 * HTML Preview Component
 * Renders HTML content with proper styling and typography settings
 * Automatically converts markdown to HTML if markdown syntax is detected
 */
const HTMLPreview = ({ content, typographySettings = {}, style = {} }) => {
  if (!content || !content.trim()) {
    return (
      <div style={{
        color: 'var(--color-text-tertiary)',
        fontStyle: 'italic',
        padding: '20px',
        textAlign: 'center',
        ...style
      }}>
        No content to preview
      </div>
    );
  }

  // Treat as Markdown unless content already looks like HTML (e.g. pre-rendered).
  // Streamed blog content is markdown source; only skip conversion when we have HTML tags.
  const looksLikeHtml = /<\s*[a-zA-Z][a-zA-Z0-9-]*[\s>/]/.test(content);
  const rawHtml = looksLikeHtml ? content : markdownToHTML(content);
  
  // Sanitize HTML to prevent XSS attacks
  const htmlContent = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'b', 'em', 'i', 'u', 
                   'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'hr', 'div', 'span', 
                   'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'style', 'id'],
    ALLOW_DATA_ATTR: false
  });

  // Extract typography settings with defaults
  const {
    headingFont = typography.fontFamily.primary,
    bodyFont = typography.fontFamily.primary, 
    fontSize = typography.fontSize.base,
    lineHeight = typography.lineHeight.normal,
    paragraphSpacing = 16
  } = typographySettings;

  const previewStyles = {
    fontFamily: bodyFont,
    fontSize: fontSize,
    lineHeight: lineHeight,
    color: colors.text.primary,
    maxWidth: 'none',
    ...style
  };

  return (
    <div style={previewStyles}>
      <div
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        style={{
          // Override default styles for HTML elements
          '& h1': {
            fontFamily: headingFont,
            fontSize: `${fontSize * 2.25}px`,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            margin: `${paragraphSpacing * 1.5}px 0 ${paragraphSpacing}px 0`,
            lineHeight: typography.lineHeight.tight
          },
          '& h2': {
            fontFamily: headingFont,
            fontSize: `${fontSize * 1.875}px`,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
            margin: `${paragraphSpacing * 1.25}px 0 ${paragraphSpacing * 0.75}px 0`,
            lineHeight: typography.lineHeight.tight
          },
          '& h3': {
            fontFamily: headingFont,
            fontSize: `${fontSize * 1.5}px`,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
            margin: `${paragraphSpacing}px 0 ${paragraphSpacing * 0.5}px 0`,
            lineHeight: typography.lineHeight.tight
          },
          '& p': {
            margin: `0 0 ${paragraphSpacing}px 0`,
            lineHeight: lineHeight,
            fontFamily: bodyFont,
            fontSize: `${fontSize}px`
          },
          '& strong': {
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary
          },
          '& em': {
            fontStyle: 'italic',
            color: colors.text.primary
          },
          '& ul, & ol': {
            margin: `${paragraphSpacing}px 0`,
            paddingLeft: '20px',
            fontFamily: bodyFont,
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight
          },
          '& li': {
            margin: `${Math.round(paragraphSpacing / 2)}px 0`,
            lineHeight: lineHeight
          },
          '& blockquote': {
            borderLeft: `4px solid ${colors.primary}`,
            paddingLeft: `${paragraphSpacing}px`,
            margin: `${paragraphSpacing}px 0`,
            fontStyle: 'italic',
            color: colors.text.secondary,
            backgroundColor: colors.background.container,
            padding: `${paragraphSpacing * 0.75}px ${paragraphSpacing}px`
          },
          '& code': {
            backgroundColor: colors.background.container,
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: typography.fontFamily.mono,
            fontSize: `${fontSize * 0.9}px`,
            color: colors.text.primary
          },
          '& pre': {
            backgroundColor: colors.background.container,
            padding: `${paragraphSpacing}px`,
            borderRadius: '8px',
            overflow: 'auto',
            margin: `${paragraphSpacing}px 0`
          },
          '& pre code': {
            background: 'none',
            padding: 0,
            fontFamily: typography.fontFamily.mono,
            fontSize: `${fontSize * 0.875}px`
          },
          '& hr': {
            border: 'none',
            borderTop: `1px solid ${colors.border.base}`,
            margin: `${paragraphSpacing * 2}px 0`
          }
        }}
      />
      
      <style jsx>{`
        div h1 {
          font-family: ${headingFont};
          font-size: ${fontSize * 2.25}px;
          font-weight: ${typography.fontWeight.bold};
          color: ${colors.text.primary};
          margin: ${paragraphSpacing * 1.5}px 0 ${paragraphSpacing}px 0;
          line-height: ${typography.lineHeight.tight};
        }
        
        div h2 {
          font-family: ${headingFont};
          font-size: ${fontSize * 1.875}px;
          font-weight: ${typography.fontWeight.semibold};
          color: ${colors.text.primary};
          margin: ${paragraphSpacing * 1.25}px 0 ${paragraphSpacing * 0.75}px 0;
          line-height: ${typography.lineHeight.tight};
        }
        
        div h3 {
          font-family: ${headingFont};
          font-size: ${fontSize * 1.5}px;
          font-weight: ${typography.fontWeight.semibold};
          color: ${colors.text.primary};
          margin: ${paragraphSpacing}px 0 ${paragraphSpacing * 0.5}px 0;
          line-height: ${typography.lineHeight.tight};
        }

        div h4 {
          font-family: ${headingFont};
          font-size: ${fontSize * 1.25}px;
          font-weight: ${typography.fontWeight.semibold};
          color: ${colors.text.primary};
          margin: ${paragraphSpacing * 0.875}px 0 ${paragraphSpacing * 0.375}px 0;
          line-height: ${typography.lineHeight.tight};
        }

        div h5 {
          font-family: ${headingFont};
          font-size: ${fontSize * 1.125}px;
          font-weight: ${typography.fontWeight.semibold};
          color: ${colors.text.primary};
          margin: ${paragraphSpacing * 0.75}px 0 ${paragraphSpacing * 0.25}px 0;
          line-height: ${typography.lineHeight.tight};
        }

        div h6 {
          font-family: ${headingFont};
          font-size: ${fontSize}px;
          font-weight: ${typography.fontWeight.semibold};
          color: ${colors.text.secondary};
          margin: ${paragraphSpacing * 0.625}px 0 ${paragraphSpacing * 0.25}px 0;
          line-height: ${typography.lineHeight.tight};
        }

        div p {
          margin: 0 0 ${paragraphSpacing}px 0;
          line-height: ${lineHeight};
          font-family: ${bodyFont};
          font-size: ${fontSize}px;
        }
        
        div strong {
          font-weight: ${typography.fontWeight.semibold};
          color: ${colors.text.primary};
        }
        
        div em {
          font-style: italic;
          color: ${colors.text.primary};
        }
        
        div ul, div ol {
          margin: ${paragraphSpacing}px 0;
          padding-left: 20px;
          font-family: ${bodyFont};
          font-size: ${fontSize}px;
          line-height: ${lineHeight};
        }
        
        div li {
          margin: ${Math.round(paragraphSpacing / 2)}px 0;
          line-height: ${lineHeight};
        }
        
        div blockquote {
          border-left: 4px solid ${colors.primary};
          padding-left: ${paragraphSpacing}px;
          margin: ${paragraphSpacing}px 0;
          font-style: italic;
          color: ${colors.text.secondary};
          background-color: ${colors.background.container};
          padding: ${paragraphSpacing * 0.75}px ${paragraphSpacing}px;
          border-radius: 4px;
        }
        
        div code {
          background-color: ${colors.background.container};
          padding: 2px 6px;
          border-radius: 4px;
          font-family: ${typography.fontFamily.mono};
          font-size: ${fontSize * 0.9}px;
          color: ${colors.text.primary};
        }
        
        div pre {
          background-color: ${colors.background.container};
          padding: ${paragraphSpacing}px;
          border-radius: 8px;
          overflow: auto;
          margin: ${paragraphSpacing}px 0;
        }
        
        div pre code {
          background: none;
          padding: 0;
          font-family: ${typography.fontFamily.mono};
          font-size: ${fontSize * 0.875}px;
        }
        
        div hr {
          border: none;
          border-top: 1px solid ${colors.border.base};
          margin: ${paragraphSpacing * 2}px 0;
        }

        /* Tweet Card Styling */
        div :global(.tweet-card) {
          transition: box-shadow 0.2s ease;
          cursor: default;
        }

        div :global(.tweet-card:hover) {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        div :global(.tweet-card) img {
          display: inline-block;
          object-fit: cover;
        }

        div :global(.tweet-card) a {
          color: var(--color-primary);
          text-decoration: none;
          transition: opacity 0.2s ease;
        }

        div :global(.tweet-card) a:hover {
          opacity: 0.8;
        }

        /* Tweet Fallback Styling */
        div :global(.tweet-fallback) {
          transition: background-color 0.2s ease;
        }

        div :global(.tweet-fallback:hover) {
          background-color: var(--color-primary-50) !important;
        }
      `}</style>
    </div>
  );
};

export default HTMLPreview;