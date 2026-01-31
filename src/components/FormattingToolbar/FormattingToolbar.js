import React from 'react';
import { Button, Space, Tooltip, Divider } from 'antd';
import { 
  BoldOutlined, 
  ItalicOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  LinkOutlined,
  CodeOutlined,
  FileImageOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';

/**
 * Formatting Toolbar Component
 * Provides markdown formatting shortcuts and helpers
 */
const FormattingToolbar = ({ 
  onInsert, 
  showStats = true,
  wordCount = 0,
  readingTime = 0,
  style = {} 
}) => {
  
  // Calculate reading time (average 200 words per minute)
  const calculateReadingTime = (words) => {
    return Math.max(1, Math.round(words / 200));
  };

  // Formatting functions
  const insertFormat = (before, after = '', placeholder = 'text') => {
    onInsert(before, after, placeholder);
  };

  const formatOptions = [
    {
      key: 'bold',
      icon: <BoldOutlined />,
      tooltip: 'Bold (Ctrl+B)',
      shortcut: 'Ctrl+B',
      before: '**',
      after: '**',
      placeholder: 'bold text'
    },
    {
      key: 'italic',
      icon: <ItalicOutlined />,
      tooltip: 'Italic (Ctrl+I)',
      shortcut: 'Ctrl+I',
      before: '*',
      after: '*',
      placeholder: 'italic text'
    },
    {
      key: 'code',
      icon: <CodeOutlined />,
      tooltip: 'Inline Code (`)',
      before: '`',
      after: '`',
      placeholder: 'code'
    },
    {
      key: 'divider1',
      type: 'divider'
    },
    {
      key: 'h1',
      text: 'H1',
      tooltip: 'Heading 1',
      before: '# ',
      after: '',
      placeholder: 'Heading 1'
    },
    {
      key: 'h2',
      text: 'H2',
      tooltip: 'Heading 2',
      before: '## ',
      after: '',
      placeholder: 'Heading 2'
    },
    {
      key: 'h3',
      text: 'H3',
      tooltip: 'Heading 3',
      before: '### ',
      after: '',
      placeholder: 'Heading 3'
    },
    {
      key: 'divider2',
      type: 'divider'
    },
    {
      key: 'ul',
      icon: <UnorderedListOutlined />,
      tooltip: 'Bullet List',
      before: '- ',
      after: '',
      placeholder: 'List item'
    },
    {
      key: 'ol',
      icon: <OrderedListOutlined />,
      tooltip: 'Numbered List',
      before: '1. ',
      after: '',
      placeholder: 'List item'
    },
    {
      key: 'divider3',
      type: 'divider'
    },
    {
      key: 'link',
      icon: <LinkOutlined />,
      tooltip: 'Link (Ctrl+K)',
      shortcut: 'Ctrl+K',
      before: '[',
      after: '](https://)',
      placeholder: 'link text'
    },
    {
      key: 'image',
      icon: <FileImageOutlined />,
      tooltip: 'Image',
      before: '![',
      after: '](image-url)',
      placeholder: 'alt text'
    },
    {
      key: 'divider4',
      type: 'divider'
    },
    {
      key: 'codeblock',
      text: '</>', 
      tooltip: 'Code Block',
      before: '```\n',
      after: '\n```',
      placeholder: 'code here'
    },
    {
      key: 'quote',
      text: '❝',
      tooltip: 'Quote',
      before: '> ',
      after: '',
      placeholder: 'Quote text'
    }
  ];

  return (
    <div style={{ 
      padding: '8px 12px',
      backgroundColor: '#fafafa',
      border: '1px solid #e8e8e8',
      borderRadius: '6px 6px 0 0',
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '13px',
      ...style 
    }}>
      {/* Formatting Controls */}
      <Space size={4}>
        {formatOptions.map((option) => {
          if (option.type === 'divider') {
            return <Divider key={option.key} type="vertical" style={{ margin: '0 4px' }} />;
          }

          return (
            <Tooltip 
              key={option.key} 
              title={
                <div>
                  <div>{option.tooltip}</div>
                  {option.shortcut && (
                    <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
                      {option.shortcut}
                    </div>
                  )}
                </div>
              }
              mouseEnterDelay={0.5}
            >
              <Button
                type="text"
                size="small"
                icon={option.icon}
                onClick={() => insertFormat(option.before, option.after, option.placeholder)}
                style={{
                  minWidth: option.text ? '28px' : '24px',
                  height: '24px',
                  padding: option.text ? '0 4px' : '0',
                  fontSize: option.text ? '11px' : '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {option.text}
              </Button>
            </Tooltip>
          );
        })}

        <Divider type="vertical" style={{ margin: '0 8px' }} />

        {/* Help Button */}
        <Tooltip title="Markdown help and shortcuts">
          <Button
            type="text"
            size="small"
            icon={<QuestionCircleOutlined />}
            style={{
              minWidth: '24px',
              height: '24px',
              fontSize: '12px'
            }}
            onClick={() => {
              // Show markdown help modal or tooltip
              const helpText = `
Markdown Shortcuts:

Headers: # H1, ## H2, ### H3
Bold: **text** or Ctrl+B
Italic: *text* or Ctrl+I
Code: \`code\`
Links: [text](url) or Ctrl+K
Lists: - item or 1. item
Images: ![alt](url)
Quotes: > text
Code blocks: \`\`\`code\`\`\`

Type and format as you go!
              `;
              alert(helpText);
            }}
          />
        </Tooltip>
      </Space>

      {/* Stats Display */}
      {showStats && (
        <Space size={16} style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>
          <span>{wordCount} words</span>
          <span>{calculateReadingTime(wordCount)} min read</span>
        </Space>
      )}
    </div>
  );
};

export default FormattingToolbar;