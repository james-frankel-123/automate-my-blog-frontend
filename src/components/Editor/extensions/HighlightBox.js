import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
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
const HighlightBoxComponent = ({ node, deleteNode, updateAttributes, getPos }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const deleteScheduledRef = React.useRef(false);
  const boxRef = React.useRef(null);                    // Ref for DOM measurement
  const [minHeight, setMinHeight] = React.useState(null); // Dynamic min-height
  const transparentCanvasRef = React.useRef(null);      // Pre-created transparent canvas for drag ghost

  const {
    type,
    content,
    citation,
    icon,
    width,
    fontSize,
    layout,
    customBg,
    customBorder,
    iconName,
    align
  } = node.attrs;

  // Create transparent canvas for drag ghost ONCE on mount
  React.useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 1, 1);  // Fully transparent

    transparentCanvasRef.current = canvas;  // Store in ref (NOT in DOM)

    return () => {
      transparentCanvasRef.current = null;
    };
  }, []);

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
      // If block, default to float-right
      updateAttributes({ layout: 'float-right', width: '50%' });
    }
  };

  // Handler to toggle full width
  const handleToggleWidth = () => {
    if (width === '100%') {
      updateAttributes({ width: '50%', layout: 'float-right' });
    } else {
      updateAttributes({ width: '100%', layout: 'block' });
    }
  };

  // Drag start handler - serialize node data
  const handleDragStart = (e) => {
    setIsDragging(true);
    deleteScheduledRef.current = false;

    // Add global flag for drag detection
    document.body.setAttribute('data-highlight-dragging', 'true');

    // Allow move operation
    e.dataTransfer.effectAllowed = "move";

    // Serialize complete node data including position for deletion
    const nodeData = {
      type: 'highlightBox',
      attrs: node.attrs,
      sourcePos: typeof getPos === 'function' ? getPos() : null,
    };

    e.dataTransfer.setData('application/x-tiptap-highlight', JSON.stringify(nodeData));
    e.dataTransfer.setData('text/plain', content); // Fallback for text

    // Dispatch custom event with node data for preview
    window.dispatchEvent(new CustomEvent('highlight-drag-start', {
      detail: nodeData
    }));

    // Hide the browser's default drag ghost
    if (transparentCanvasRef.current) {
      try {
        e.dataTransfer.setDragImage(transparentCanvasRef.current, 0, 0);
      } catch (error) {
        console.warn('setDragImage failed:', error);
      }
    }
  };

  // Drag end handler
  const handleDragEnd = (e) => {
    // Remove global drag flag
    document.body.removeAttribute('data-highlight-dragging');

    // Dispatch drag end event
    window.dispatchEvent(new CustomEvent('highlight-drag-end'));

    // Reset dragging state after a delay to allow drop to complete first
    setTimeout(() => {
      setIsDragging(false);
    }, 100);
  };

  // Default styles for each type
  const defaultStyles = {
    statistic: {
      backgroundColor: '#e6f7ff',
      borderColor: '#1890ff',
      color: '#0050b3',
      defaultIcon: '📊',
    },
    pullquote: {
      backgroundColor: '#f6ffed',
      borderColor: '#52c41a',
      color: '#389e0d',
      defaultIcon: '💬',
    },
    takeaway: {
      backgroundColor: '#fff7e6',
      borderColor: '#fa8c16',
      color: '#d46b08',
      defaultIcon: '💡',
    },
    process: {
      backgroundColor: '#f9f0ff',
      borderColor: '#722ed1',
      color: '#531dab',
      defaultIcon: '🔄',
    },
    warning: {
      backgroundColor: '#fff1f0',
      borderColor: '#ff4d4f',
      color: '#cf1322',
      defaultIcon: '⚠️',
    },
    tip: {
      backgroundColor: '#e6f7ff',
      borderColor: '#1890ff',
      color: '#0050b3',
      defaultIcon: '💡',
    },
    definition: {
      backgroundColor: '#f0f5ff',
      borderColor: '#2f54eb',
      color: '#1d39c4',
      defaultIcon: '📖',
    },
    comparison: {
      backgroundColor: '#e6fffb',
      borderColor: '#13c2c2',
      color: '#006d75',
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
          width: width || '90%',
          float: 'left',
          marginRight: '16px',
          marginLeft: 0,
        };
      case 'float-right':
        return {
          ...base,
          width: width || '90%',
          float: 'right',
          marginLeft: '16px',
          marginRight: 0,
        };
      default:
        return {
          ...base,
          width: width || '100%',
        };
    }
  };

  return (
    <NodeViewWrapper>
      <div
        ref={boxRef}
        style={{
          ...getLayoutStyles(),
          opacity: isDragging ? 0 : 1,  // Completely hide during drag - user only sees preview
          transition: 'opacity 0.2s',
        }}
        contentEditable={false}
        className={`highlight-box highlight-${layout}`}
        draggable="true"
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        data-drag-handle
      >
        {/* Visual drag indicator */}
        {!isDragging && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              cursor: 'grab',
              padding: '4px',
              background: 'rgba(114, 46, 209, 0.1)',
              borderRadius: '4px',
              fontSize: '12px',
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
            className="drag-indicator"
          >
            ⋮⋮
          </div>
        )}

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
                background: '#fff',
                border: '1px solid #ddd',
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

          {/* Toggle Width */}
          <button
            onClick={handleToggleWidth}
            style={{
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            title={width === '100%' ? 'Make 50% width' : 'Make full width'}
          >
            {width === '100%' ? '⇅' : '↔'}
          </button>

          {/* Delete Button */}
          <button
            onClick={deleteNode}
            style={{
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#ff4d4f',
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
              dangerouslySetInnerHTML={{ __html: content }}
            />
            {citation && (
              <div
                style={{
                  fontSize: '12px',
                  marginTop: '8px',
                  color: '#8c8c8c',
                  fontStyle: 'italic',
                }}
                dangerouslySetInnerHTML={{ __html: citation }}
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
        .highlight-box:hover .drag-indicator {
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
