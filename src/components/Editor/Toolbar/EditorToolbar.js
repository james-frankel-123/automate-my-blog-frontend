import React from 'react';
import { Button } from '../../DesignSystem';
import { colors, spacing } from '../../DesignSystem/tokens';

/**
 * Enhanced Editor Toolbar with modern formatting controls
 */
const EditorToolbar = ({
  editor, // TipTap editor instance
  onInsert, // Fallback for legacy markdown insertion
  content = '',
  showWordCount = true,
  className = '',
  style = {}
}) => {
  // Calculate word count and reading time
  const getWordCount = (text) => {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  };

  const getReadingTime = (text) => {
    const wordCount = getWordCount(text);
    const wordsPerMinute = 200;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return minutes;
  };

  const toolbarStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.background.elevated,
    borderBottom: `1px solid ${colors.border.light}`,
    gap: spacing.md,
    flexWrap: 'wrap',
    ...style
  };

  const buttonGroupStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap'
  };

  const separatorStyles = {
    width: '1px',
    height: '20px',
    backgroundColor: colors.border.base,
    margin: `0 ${spacing.xs}`
  };

  const statsStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.lg,
    color: colors.text.secondary,
    fontSize: '12px',
    fontWeight: '500'
  };

  const handleInsert = (before, after = '', placeholder = '') => {
    if (onInsert) {
      onInsert(before, after, placeholder);
    }
  };

  const formatButtons = [
    {
      label: 'Bold',
      shortcut: '⌘B',
      onClick: () => {
        if (editor) {
          editor.chain().focus().toggleBold().run();
        } else {
          handleInsert('**', '**', 'bold text');
        }
      },
      icon: '𝐁',
      isActive: editor?.isActive('bold')
    },
    {
      label: 'Italic',
      shortcut: '⌘I',
      onClick: () => {
        if (editor) {
          editor.chain().focus().toggleItalic().run();
        } else {
          handleInsert('*', '*', 'italic text');
        }
      },
      icon: '𝐼',
      isActive: editor?.isActive('italic')
    },
    {
      label: 'Underline',
      shortcut: '⌘U',
      onClick: () => {
        if (editor) {
          editor.chain().focus().toggleUnderline().run();
        } else {
          handleInsert('<u>', '</u>', 'underlined text');
        }
      },
      icon: 'U̲',
      isActive: editor?.isActive('underline')
    },
    {
      label: 'Code',
      shortcut: '⌘`',
      onClick: () => {
        if (editor) {
          editor.chain().focus().toggleCode().run();
        } else {
          handleInsert('`', '`', 'code');
        }
      },
      icon: '</>',
      isActive: editor?.isActive('code')
    }
  ];

  const headingButtons = [
    {
      label: 'H1',
      onClick: () => {
        if (editor) {
          editor.chain().focus().toggleHeading({ level: 1 }).run();
        } else {
          handleInsert('# ', '', 'Heading 1');
        }
      },
      isActive: editor?.isActive('heading', { level: 1 })
    },
    {
      label: 'H2',
      onClick: () => {
        if (editor) {
          editor.chain().focus().toggleHeading({ level: 2 }).run();
        } else {
          handleInsert('## ', '', 'Heading 2');
        }
      },
      isActive: editor?.isActive('heading', { level: 2 })
    },
    {
      label: 'H3',
      onClick: () => {
        if (editor) {
          editor.chain().focus().toggleHeading({ level: 3 }).run();
        } else {
          handleInsert('### ', '', 'Heading 3');
        }
      },
      isActive: editor?.isActive('heading', { level: 3 })
    }
  ];

  const listButtons = [
    {
      label: 'Bullet List',
      onClick: () => {
        if (editor) {
          editor.chain().focus().toggleBulletList().run();
        } else {
          handleInsert('- ', '', 'List item');
        }
      },
      icon: '•',
      isActive: editor?.isActive('bulletList')
    },
    {
      label: 'Numbered List',
      onClick: () => {
        if (editor) {
          editor.chain().focus().toggleOrderedList().run();
        } else {
          handleInsert('1. ', '', 'List item');
        }
      },
      icon: '1.',
      isActive: editor?.isActive('orderedList')
    }
  ];

  const insertButtons = [
    {
      label: 'Quote',
      onClick: () => {
        if (editor) {
          editor.chain().focus().toggleBlockquote().run();
        } else {
          handleInsert('> ', '', 'Quote text');
        }
      },
      icon: '❝',
      isActive: editor?.isActive('blockquote')
    },
    {
      label: 'Table',
      onClick: () => {
        if (editor) {
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        }
      },
      icon: '⚏',
      isActive: editor?.isActive('table')
    },
    {
      label: 'Divider',
      onClick: () => {
        if (editor) {
          editor.chain().focus().setHorizontalRule().run();
        } else {
          handleInsert('\n---\n', '', '');
        }
      },
      icon: '—'
    }
  ];

  return (
    <div style={toolbarStyles} className={className}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' }}>
        {/* Text Formatting */}
        <div style={buttonGroupStyles}>
          {formatButtons.map((button) => (
            <Button
              key={button.label}
              size="small"
              variant={button.isActive ? "primary" : "ghost"}
              onClick={button.onClick}
              title={`${button.label} (${button.shortcut || ''})`}
              style={{ 
                minWidth: '32px',
                padding: `${spacing.xs} ${spacing.sm}`,
                fontWeight: '700',
                ...(button.isActive && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                  color: 'var(--color-text-on-primary)'
                })
              }}
            >
              {button.icon}
            </Button>
          ))}
        </div>

        <div style={separatorStyles} />

        {/* Headings */}
        <div style={buttonGroupStyles}>
          {headingButtons.map((button) => (
            <Button
              key={button.label}
              size="small"
              variant={button.isActive ? "primary" : "ghost"}
              onClick={button.onClick}
              style={{ 
                minWidth: '32px',
                padding: `${spacing.xs} ${spacing.sm}`,
                fontSize: '12px',
                fontWeight: '700',
                ...(button.isActive && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                  color: 'var(--color-text-on-primary)'
                })
              }}
            >
              {button.label}
            </Button>
          ))}
        </div>

        <div style={separatorStyles} />

        {/* Lists */}
        <div style={buttonGroupStyles}>
          {listButtons.map((button) => (
            <Button
              key={button.label}
              size="small"
              variant={button.isActive ? "primary" : "ghost"}
              onClick={button.onClick}
              title={button.label}
              style={{ 
                minWidth: '32px',
                padding: `${spacing.xs} ${spacing.sm}`,
                ...(button.isActive && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                  color: 'var(--color-text-on-primary)'
                })
              }}
            >
              {button.icon}
            </Button>
          ))}
        </div>

        <div style={separatorStyles} />

        {/* Insert Elements */}
        <div style={buttonGroupStyles}>
          {insertButtons.map((button) => (
            <Button
              key={button.label}
              size="small"
              variant={button.isActive ? "primary" : "ghost"}
              onClick={button.onClick}
              title={button.label}
              style={{ 
                minWidth: '32px',
                padding: `${spacing.xs} ${spacing.sm}`,
                ...(button.isActive && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                  color: 'var(--color-text-on-primary)'
                })
              }}
            >
              {button.icon}
            </Button>
          ))}
        </div>
      </div>

      {/* Word Count & Stats */}
      {showWordCount && (
        <div style={statsStyles}>
          <span>{getWordCount(content)} words</span>
          <span>{getReadingTime(content)} min read</span>
        </div>
      )}
    </div>
  );
};

export default EditorToolbar;