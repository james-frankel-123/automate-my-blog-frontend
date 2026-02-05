import React, { useEffect, useState, useRef } from 'react';
import { colors, spacing, borderRadius, shadows } from '../../DesignSystem/tokens';

/**
 * Inline Formatting Toolbar - appears on text selection
 * Modern floating toolbar like Medium/Notion
 */
const InlineToolbar = ({ editor, visible = false, position = { top: 0, left: 0 } }) => {
  const toolbarRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  // Show/hide with animation delay
  useEffect(() => {
    if (visible) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!editor || !isVisible) return null;

  const toolbarStyles = {
    position: 'absolute',
    top: `${position.top}px`,
    left: `${position.left}px`,
    transform: 'translate(-50%, -100%)',
    marginTop: '-8px',
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding: `${spacing.xs} ${spacing.sm}`,
    backgroundColor: colors.text.primary,
    borderRadius: borderRadius.md,
    boxShadow: shadows.lg,
    zIndex: 1000,
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.2s ease-in-out',
    // Arrow pointing down
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 0,
      height: 0,
      borderLeft: '6px solid transparent',
      borderRight: '6px solid transparent',
      borderTop: `6px solid ${colors.text.primary}`
    }
  };

  const buttonStyles = {
    minWidth: '32px',
    height: '32px',
    padding: `${spacing.xs}`,
    border: 'none',
    borderRadius: borderRadius.sm,
    backgroundColor: 'transparent',
    color: 'var(--color-text-on-primary)',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const activeButtonStyles = {
    ...buttonStyles,
    backgroundColor: colors.primary,
    color: 'var(--color-text-on-primary)',
  };

  const getButtonStyle = (isActive) => isActive ? activeButtonStyles : buttonStyles;

  const formatButtons = [
    {
      label: 'Bold',
      icon: '𝐁',
      command: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
      shortcut: '⌘B'
    },
    {
      label: 'Italic', 
      icon: '𝐼',
      command: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
      shortcut: '⌘I'
    },
    {
      label: 'Underline', 
      icon: 'U̲',
      command: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive('underline'),
      shortcut: '⌘U'
    },
    {
      label: 'Code',
      icon: '</>',
      command: () => editor.chain().focus().toggleCode().run(),
      isActive: editor.isActive('code'),
      shortcut: '⌘`'
    },
    {
      label: 'Link',
      icon: '🔗',
      command: () => {
        const url = window.prompt('Enter URL:');
        if (url) {
          editor.chain().focus().setLink({ href: url }).run();
        }
      },
      isActive: editor.isActive('link'),
      shortcut: '⌘K'
    }
  ];

  return (
    <div
      ref={toolbarRef}
      style={toolbarStyles}
      onMouseDown={(e) => e.preventDefault()} // Prevent losing selection
    >
      {formatButtons.map((button) => (
        <button
          key={button.label}
          style={getButtonStyle(button.isActive)}
          onClick={button.command}
          title={`${button.label} (${button.shortcut})`}
          onMouseOver={(e) => {
            if (!button.isActive) {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }
          }}
          onMouseOut={(e) => {
            if (!button.isActive) {
              e.target.style.backgroundColor = 'transparent';
            }
          }}
        >
          {button.icon}
        </button>
      ))}
      
      {/* Separator */}
      <div style={{
        width: '1px',
        height: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        margin: `0 ${spacing.xs}`
      }} />
      
      {/* Heading buttons */}
      {[1, 2, 3].map((level) => (
        <button
          key={`h${level}`}
          style={getButtonStyle(editor.isActive('heading', { level }))}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
          title={`Heading ${level}`}
          onMouseOver={(e) => {
            if (!editor.isActive('heading', { level })) {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }
          }}
          onMouseOut={(e) => {
            if (!editor.isActive('heading', { level })) {
              e.target.style.backgroundColor = 'transparent';
            }
          }}
        >
          H{level}
        </button>
      ))}
      
      {/* Arrow pointing down */}
      <div style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: `6px solid ${colors.text.primary}`
      }} />
    </div>
  );
};

export default InlineToolbar;