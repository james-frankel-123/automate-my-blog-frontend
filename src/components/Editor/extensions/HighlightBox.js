import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import DOMPurify from 'dompurify';
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';

/**
 * Custom TipTap extension for highlight boxes
 * Supports different highlight types with customizable width, font size, layout, and colors
 */

// Font size mapping
const fontSizes = {
  small: '14px',
  medium: '16px',
  large: '24px',
  xlarge: '48px',
  xxlarge: '72px'
};

// React component to render the highlight box
const HighlightBoxComponent = ({ node, deleteNode, updateAttributes, getPos: _getPos }) => {
  const boxRef = React.useRef(null);                    // Ref for DOM measurement
  const [minHeight, setMinHeight] = React.useState(null); // Dynamic min-height

  const {
    type,
    content,
    citation,
    icon,
    width: _width,
    fontSize,
    layout,
    customBg,
    customBorder,
    iconName,
    align
  } = node.attrs;

  // Dynamically match height of adjacent wrapped content for float layouts
  React.useEffect(() => {
    if ((layout === 'float-left' || layout === 'float-right') && boxRef.current) {
      const measureAdjacentContent = () => {
        const boxElement = boxRef.current;
        if (!boxElement) return;

        const boxRect = boxElement.getBoundingClientRect();

        // Find next sibling elements that wrap with this float
        let nextSibling = boxElement.nextElementSibling;
        let wrappedElements = [];

        // Collect elements until we pass the box bottom
        while (nextSibling) {
          const siblingRect = nextSibling.getBoundingClientRect();
          if (siblingRect.top >= boxRect.bottom) break;
          wrappedElements.push(nextSibling);
          nextSibling = nextSibling.nextElementSibling;
        }

        // Calculate total height of wrapped content
        if (wrappedElements.length > 0) {
          const firstRect = wrappedElements[0].getBoundingClientRect();
          const lastRect = wrappedElements[wrappedElements.length - 1].getBoundingClientRect();
          const wrappedHeight = lastRect.bottom - firstRect.top;

          // Set min-height to match (accounting for padding/margin)
          const paddingMargin = 20;
          setMinHeight(Math.max(wrappedHeight - paddingMargin, 0));
        } else {
          setMinHeight(null);
        }
      };

      // Measure on mount and layout changes
      const timer = setTimeout(measureAdjacentContent, 100); // Delay for DOM settling

      // Re-measure on window resize
      window.addEventListener('resize', measureAdjacentContent);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', measureAdjacentContent);
      };
    } else {
      setMinHeight(null);
    }
  }, [layout, content]);

  // Handler to toggle float direction
  const handleToggleFloat = () => {
    if (layout === 'float-left') {
      updateAttributes({ layout: 'float-right' });
    } else if (layout === 'float-right') {
      updateAttributes({ layout: 'float-left' });
    } else {
      // If block, default to float-right with 90% width
      updateAttributes({ layout: 'float-right', width: '90%' });
    }
  };

  // Default styles for each type
  const defaultStyles = {
    statistic: {
      backgroundColor: 'var(--color-primary-50)',
      borderColor: 'var(--color-primary)',
      color: 'var(--color-primary-700)',
      defaultIcon: '📊',
    },
    pullquote: {
      backgroundColor: 'var(--color-success-bg)',
      borderColor: 'var(--color-success)',
      color: 'var(--color-success-dark)',
      defaultIcon: '💬',
    },
    takeaway: {
      backgroundColor: 'var(--color-accent-50)',
      borderColor: 'var(--color-accent)',
      color: 'var(--color-accent-700)',
      defaultIcon: '💡',
    },
    process: {
      backgroundColor: 'var(--color-primary-50)',
      borderColor: 'var(--color-primary)',
      color: 'var(--color-primary-700)',
      defaultIcon: '🔄',
    },
    warning: {
      backgroundColor: 'var(--color-error-bg)',
      borderColor: 'var(--color-error)',
      color: 'var(--color-error)',
      defaultIcon: '⚠️',
    },
    tip: {
      backgroundColor: 'var(--color-primary-50)',
      borderColor: 'var(--color-primary)',
      color: 'var(--color-primary-700)',
      defaultIcon: '💡',
    },
    definition: {
      backgroundColor: 'var(--color-primary-50)',
      borderColor: 'var(--color-primary)',
      color: 'var(--color-primary-700)',
      defaultIcon: '📖',
    },
    comparison: {
      backgroundColor: 'var(--color-primary-50)',
      borderColor: 'var(--color-primary)',
      color: 'var(--color-primary-700)',
      defaultIcon: '⚖️',
    },
  };

  const typeStyle = defaultStyles[type] || defaultStyles.takeaway;

  // Use custom colors if provided, otherwise use type defaults
  const backgroundColor = customBg || typeStyle.backgroundColor;
  const borderColor = customBorder || typeStyle.borderColor;
  const textColor = typeStyle.color;

  // Render icon (FontAwesome/Material or emoji fallback)
  const renderIcon = () => {
    if (iconName) {
      const IconComponent = FaIcons[iconName] || MdIcons[iconName];
      if (IconComponent) {
        return <IconComponent size={24} style={{ flexShrink: 0 }} />;
      }
    }
    return <span style={{ fontSize: '24px', lineHeight: 1, flexShrink: 0 }}>{icon || typeStyle.defaultIcon}</span>;
  };

  // Calculate font size
  const calculatedFontSize = fontSizes[fontSize] || fontSizes.medium;

  // Layout styles
  const getLayoutStyles = () => {
    const base = {
      padding: '8px 16px',     // Reduce for tighter fit
      margin: '4px 0',         // Reduce for tighter fit
      borderRadius: '4px',     // Sharper corners
      backgroundColor,
      borderLeft: `4px solid ${borderColor}`,
      position: 'relative',
      fontFamily: 'inherit',
      // Apply dynamic min-height for float layouts
      ...(minHeight && (layout === 'float-left' || layout === 'float-right') && {
        minHeight: `${minHeight}px`
      }),
    };

    switch (layout) {
      case 'float-left':
        return {
          ...base,
          width: '90%',  // Hardcoded to ensure consistent design
          float: 'left',
          marginRight: '16px',
          marginLeft: 0,
        };
      case 'float-right':
        return {
          ...base,
          width: '90%',  // Hardcoded to ensure consistent design
          float: 'right',
          marginLeft: '16px',
          marginRight: 0,
        };
      default:
        return {
          ...base,
          width: '100%',
        };
    }
  };

  return (
    <NodeViewWrapper>
      <div
        ref={boxRef}
        style={{
          ...getLayoutStyles(),
        }}
        contentEditable={false}
        className={`highlight-box highlight-${layout}`}
      >
        {/* Control Buttons Bar */}
        <div
          style={{
            position: 'absolute',
            top: '-30px',
            right: '0',
            display: 'flex',
            gap: '4px',
            opacity: 0,
            transition: 'opacity 0.2s',
          }}
          className="highlight-controls"
        >
          {/* Toggle Float Direction */}
          {(layout === 'float-left' || layout === 'float-right') && (
            <button
              onClick={handleToggleFloat}
              style={{
                background: 'var(--color-background-elevated)',
                border: '1px solid var(--color-border-base)',
                borderRadius: '4px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
              title="Flip left/right"
            >
              {layout === 'float-left' ? '→' : '←'}
            </button>
          )}

          {/* Delete Button */}
          <button
            onClick={deleteNode}
            style={{
              background: 'var(--color-background-elevated)',
              border: '1px solid var(--color-border-base)',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'var(--color-error)',
            }}
            title="Remove highlight"
          >
            ×
          </button>
        </div>

        {/* Existing highlight content */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          {renderIcon()}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: calculatedFontSize,
                lineHeight: fontSize === 'xxlarge' || fontSize === 'xlarge' ? '1.2' : '1.6',
                color: textColor,
                fontWeight: type === 'statistic' || fontSize === 'xxlarge' || fontSize === 'xlarge' ? '600' : '500',
                textAlign: align || 'left',
              }}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
            />
            {citation && (
              <div
              style={{
                fontSize: '12px',
                marginTop: '8px',
                color: 'var(--color-text-tertiary)',
                  fontStyle: 'italic',
                }}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(citation) }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Add CSS for hover effect */}
      <style jsx>{`
        .highlight-box:hover .highlight-controls {
          opacity: 1 !important;
        }
      `}</style>
    </NodeViewWrapper>
  );
};

export const HighlightBox = Node.create({
  name: 'highlightBox',

  group: 'block',

  content: '',

  atom: true,

  addAttributes() {
    return {
      type: {
        default: 'takeaway',
        parseHTML: (element) => element.getAttribute('data-highlight-type') || element.getAttribute('data-type'),
        renderHTML: (attributes) => ({
          'data-highlight-type': attributes.type,
        }),
      },
      content: {
        default: '',
        parseHTML: (element) => {
          // Try data-content attribute first (for backward compatibility)
          const dataContent = element.getAttribute('data-content');
          if (dataContent) return dataContent;

          // Fall back to innerHTML (for GPT-4o generated boxes)
          return element.innerHTML || '';
        },
        renderHTML: (attributes) => ({
          'data-content': attributes.content,
        }),
      },
      citation: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-citation'),
        renderHTML: (attributes) => ({
          'data-citation': attributes.citation,
        }),
      },
      icon: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-icon'),
        renderHTML: (attributes) => ({
          'data-icon': attributes.icon,
        }),
      },
      // NEW ATTRIBUTES for customization
      width: {
        default: '100%',
        parseHTML: (element) => element.getAttribute('data-width'),
        renderHTML: (attributes) => ({
          'data-width': attributes.width,
        }),
      },
      fontSize: {
        default: 'medium',
        parseHTML: (element) => element.getAttribute('data-font-size'),
        renderHTML: (attributes) => ({
          'data-font-size': attributes.fontSize,
        }),
      },
      layout: {
        default: 'block',
        parseHTML: (element) => element.getAttribute('data-layout'),
        renderHTML: (attributes) => ({
          'data-layout': attributes.layout,
        }),
      },
      align: {
        default: 'left',
        parseHTML: (element) => element.getAttribute('data-align'),
        renderHTML: (attributes) => ({
          'data-align': attributes.align,
        }),
      },
      customBg: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-custom-bg'),
        renderHTML: (attributes) => ({
          'data-custom-bg': attributes.customBg,
        }),
      },
      customBorder: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-custom-border'),
        renderHTML: (attributes) => ({
          'data-custom-border': attributes.customBorder,
        }),
      },
      iconName: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-icon-name'),
        renderHTML: (attributes) => ({
          'data-icon-name': attributes.iconName,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'blockquote[data-highlight-type]',
      },
      {
        tag: 'div[data-highlight-box]',  // Legacy support
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['blockquote', mergeAttributes(HTMLAttributes, {
      'data-highlight-box': '',
      class: 'highlight-box'
    })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(HighlightBoxComponent);
  },

  addCommands() {
    return {
      setHighlightBox:
        (attributes) =>
        ({ commands, state }) => {
          // Check if we're inside a text node
          const $from = state.selection.$from;
          const isInsideText = $from.parent.isTextblock && $from.parent.textContent.length > 0;

          if (isInsideText) {
            // Move to end of current paragraph/block
            const endOfBlock = $from.end();

            // Set cursor to end of block
            commands.setTextSelection(endOfBlock);

            // Insert a new line to push highlight to next line
            commands.insertContentAt(endOfBlock, '<p></p>');

            // Now insert the highlight box after the paragraph
            return commands.insertContent({
              type: this.name,
              attrs: attributes,
            });
          } else {
            // Already at block boundary, insert directly
            return commands.insertContent({
              type: this.name,
              attrs: attributes,
            });
          }
        },
      removeHighlightBox:
        () =>
        ({ commands }) => {
          return commands.deleteNode(this.name);
        },
    };
  },
});

export default HighlightBox;
