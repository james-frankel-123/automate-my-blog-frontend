import React from 'react';
import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

/**
 * Simple Markdown Preview Component
 * Renders markdown text as HTML with basic formatting and typography settings
 */
const MarkdownPreview = ({ content, typography = {}, style = {} }) => {
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

  // Extract typography settings with defaults
  const {
    headingFont = 'Inter, sans-serif',
    bodyFont = 'Inter, sans-serif', 
    fontSize = 16,
    lineHeight = '1.6',
    paragraphSpacing = 16
  } = typography;

  // Simple markdown parser for basic formatting
  const parseMarkdown = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let currentParagraph = [];
    let listItems = [];
    let inCodeBlock = false;
    let codeBlockContent = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const paragraphText = currentParagraph.join(' ').trim();
        if (paragraphText) {
          elements.push(
            <Paragraph key={`para-${elements.length}`} style={{ 
              marginBottom: `${paragraphSpacing}px`, 
              lineHeight: lineHeight,
              fontFamily: bodyFont,
              fontSize: `${fontSize}px`
            }}>
              {parseInlineFormatting(paragraphText)}
            </Paragraph>
          );
        }
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} style={{ 
            marginBottom: `${paragraphSpacing}px`, 
            paddingLeft: '20px',
            fontFamily: bodyFont,
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight
          }}>
            {listItems.map((item, index) => (
              <li key={index} style={{ marginBottom: `${Math.round(paragraphSpacing / 2)}px` }}>
                {parseInlineFormatting(item)}
              </li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    const flushCodeBlock = () => {
      if (codeBlockContent.length > 0) {
        elements.push(
          <pre key={`code-${elements.length}`} style={{
            backgroundColor: 'var(--color-background-alt)',
            padding: '12px',
            borderRadius: '4px',
            border: '1px solid var(--color-border-base)',
            overflow: 'auto',
            marginBottom: '16px',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: '13px'
          }}>
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        );
        codeBlockContent = [];
      }
    };

    lines.forEach((line, index) => {
      // Handle code blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock();
          inCodeBlock = false;
        } else {
          flushParagraph();
          flushList();
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Handle headers
      if (line.startsWith('# ')) {
        flushParagraph();
        flushList();
        elements.push(
          <Title key={`h1-${elements.length}`} level={1} style={{ 
            marginTop: elements.length > 0 ? '32px' : '0',
            marginBottom: `${paragraphSpacing}px`,
            fontFamily: headingFont,
            fontSize: `${Math.round(fontSize * 2.2)}px`,
            lineHeight: '1.2'
          }}>
            {line.substring(2).trim()}
          </Title>
        );
        return;
      }

      if (line.startsWith('## ')) {
        flushParagraph();
        flushList();
        elements.push(
          <Title key={`h2-${elements.length}`} level={2} style={{ 
            marginTop: elements.length > 0 ? '28px' : '0',
            marginBottom: `${Math.round(paragraphSpacing * 0.875)}px`,
            fontFamily: headingFont,
            fontSize: `${Math.round(fontSize * 1.8)}px`,
            lineHeight: '1.3'
          }}>
            {line.substring(3).trim()}
          </Title>
        );
        return;
      }

      if (line.startsWith('### ')) {
        flushParagraph();
        flushList();
        elements.push(
          <Title key={`h3-${elements.length}`} level={3} style={{ 
            marginTop: elements.length > 0 ? '24px' : '0',
            marginBottom: `${Math.round(paragraphSpacing * 0.75)}px`,
            fontFamily: headingFont,
            fontSize: `${Math.round(fontSize * 1.5)}px`,
            lineHeight: '1.3'
          }}>
            {line.substring(4).trim()}
          </Title>
        );
        return;
      }

      if (line.startsWith('#### ')) {
        flushParagraph();
        flushList();
        elements.push(
          <Title key={`h4-${elements.length}`} level={4} style={{ 
            marginTop: elements.length > 0 ? '20px' : '0',
            marginBottom: `${Math.round(paragraphSpacing * 0.625)}px`,
            fontFamily: headingFont,
            fontSize: `${Math.round(fontSize * 1.25)}px`,
            lineHeight: '1.4'
          }}>
            {line.substring(5).trim()}
          </Title>
        );
        return;
      }

      // Handle lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ') || /^\d+\.\s/.test(line.trim())) {
        flushParagraph();
        const listItem = line.trim().replace(/^[-*]\s|^\d+\.\s/, '');
        listItems.push(listItem);
        return;
      }

      // Handle empty lines
      if (line.trim() === '') {
        flushParagraph();
        flushList();
        return;
      }

      // Regular paragraph content
      flushList();
      currentParagraph.push(line.trim());
    });

    // Flush remaining content
    flushParagraph();
    flushList();
    flushCodeBlock();

    return elements;
  };

  // Parse inline formatting (bold, italic, code, links)
  const parseInlineFormatting = (text) => {
    const parts = [];
    let current = '';
    let i = 0;

    while (i < text.length) {
      // Bold text **text**
      if (text.substring(i, i + 2) === '**') {
        if (current) {
          parts.push(current);
          current = '';
        }
        const endIndex = text.indexOf('**', i + 2);
        if (endIndex !== -1) {
          const boldText = text.substring(i + 2, endIndex);
          parts.push(<strong key={`bold-${parts.length}`}>{boldText}</strong>);
          i = endIndex + 2;
          continue;
        }
      }

      // Italic text *text*
      if (text.charAt(i) === '*' && text.substring(i, i + 2) !== '**') {
        if (current) {
          parts.push(current);
          current = '';
        }
        const endIndex = text.indexOf('*', i + 1);
        if (endIndex !== -1) {
          const italicText = text.substring(i + 1, endIndex);
          parts.push(<em key={`italic-${parts.length}`}>{italicText}</em>);
          i = endIndex + 1;
          continue;
        }
      }

      // Inline code `code`
      if (text.charAt(i) === '`') {
        if (current) {
          parts.push(current);
          current = '';
        }
        const endIndex = text.indexOf('`', i + 1);
        if (endIndex !== -1) {
          const codeText = text.substring(i + 1, endIndex);
          parts.push(
            <code key={`code-${parts.length}`} style={{
              backgroundColor: 'var(--color-background-alt)',
              padding: '2px 4px',
              borderRadius: '3px',
              fontSize: '0.9em',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace'
            }}>
              {codeText}
            </code>
          );
          i = endIndex + 1;
          continue;
        }
      }

      // Links [text](url)
      if (text.charAt(i) === '[') {
        const closingBracket = text.indexOf(']', i + 1);
        if (closingBracket !== -1 && text.charAt(closingBracket + 1) === '(') {
          const closingParen = text.indexOf(')', closingBracket + 2);
          if (closingParen !== -1) {
            if (current) {
              parts.push(current);
              current = '';
            }
            const linkText = text.substring(i + 1, closingBracket);
            const linkUrl = text.substring(closingBracket + 2, closingParen);
            parts.push(
              <a key={`link-${parts.length}`} href={linkUrl} target="_blank" rel="noopener noreferrer" style={{
                color: 'var(--color-primary)',
                textDecoration: 'none'
              }}>
                {linkText}
              </a>
            );
            i = closingParen + 1;
            continue;
          }
        }
      }

      current += text.charAt(i);
      i++;
    }

    if (current) {
      parts.push(current);
    }

    return parts.length > 0 ? parts : text;
  };

  const elements = parseMarkdown(content);

  return (
    <div style={{ 
      lineHeight: lineHeight,
      fontSize: `${fontSize}px`,
      fontFamily: bodyFont,
      color: 'var(--color-text-primary)',
      ...style 
    }}>
      {elements}
    </div>
  );
};

export default MarkdownPreview;