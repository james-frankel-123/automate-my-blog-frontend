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
const HighlightBoxComponent = ({ node, deleteNode }) => {
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
      padding: '16px 20px',
      margin: '16px 0',
      borderRadius: '8px',
      backgroundColor,
      borderLeft: `4px solid ${borderColor}`,
      position: 'relative',
      fontFamily: 'inherit',
    };

    switch (layout) {
      case 'float-left':
        return {
          ...base,
          width: width || '50%',
          float: 'left',
          marginRight: '16px',
          marginLeft: 0,
        };
      case 'float-right':
        return {
          ...base,
          width: width || '50%',
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
        style={getLayoutStyles()}
        contentEditable={false}
        className={`highlight-box highlight-${layout}`}
      >
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
          <button
            onClick={deleteNode}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#999',
              padding: '4px 8px',
              lineHeight: 1,
              flexShrink: 0,
            }}
            title="Remove highlight"
          >
            ×
          </button>
        </div>
      </div>
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
        parseHTML: (element) => element.getAttribute('data-content'),
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
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
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
