import React, { useState, useCallback, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Placeholder } from '@tiptap/extension-placeholder';

import { colors, spacing, borderRadius, typography } from '../../DesignSystem/tokens';
import InlineToolbar from '../InlineToolbar/InlineToolbar';
import { KeyboardShortcuts } from '../extensions/KeyboardShortcuts';
import { HighlightBox } from '../extensions/HighlightBox';
import { markdownToHtml, htmlToMarkdown } from '../../../utils/markdownToHtml';

/**
 * Modern WYSIWYG Rich Text Editor using TipTap
 */
const RichTextEditor = ({
  content = '',
  onChange,
  onEditorReady,
  placeholder = 'Start typing...',
  editable = true,
  className = '',
  style = {},
  showInlineToolbar = true,
  ...props
}) => {
  // Inline toolbar state
  const [inlineToolbarVisible, setInlineToolbarVisible] = useState(false);
  const [inlineToolbarPosition, setInlineToolbarPosition] = useState({ top: 0, left: 0 });

  // Memoize markdown to HTML conversion to prevent infinite loops
  const htmlContent = useMemo(() => {
    if (!content) return '';
    return markdownToHtml(content);
  }, [content]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,  // Disable default blockquote to allow custom HighlightBox extension
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      TextStyle,
      Color,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder,
      }),
      KeyboardShortcuts,
      HighlightBox,
    ],
    content: htmlContent,
    editable: editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);
      if (onChange) {
        onChange(markdown);
      }
    },
    onSelectionUpdate: ({ editor }) => {
      // Update inline toolbar position when selection changes
      if (showInlineToolbar) {
        setTimeout(() => updateInlineToolbarPosition(editor), 10);
      }
    },
    editorProps: {
      attributes: {
        class: 'rich-text-editor',
        'data-placeholder': placeholder,
      },
      // Handle drop events for highlight boxes
      handleDrop: (view, event, slice, moved) => {
        // Check if it's a highlight box being moved
        const highlightData = event.dataTransfer?.getData('application/x-tiptap-highlight');

        if (highlightData) {
          event.preventDefault();

          try {
            const nodeData = JSON.parse(highlightData);
            const dropPos = view.posAtCoords({ left: event.clientX, top: event.clientY });

            if (dropPos && nodeData.sourcePos !== null && nodeData.sourcePos !== undefined) {
              const { state } = view;
              const sourcePos = nodeData.sourcePos;
              const targetPos = dropPos.pos;

              // Get the original node from document
              const sourceNode = state.doc.nodeAt(sourcePos);
              if (!sourceNode) return false;

              const nodeSize = sourceNode.nodeSize;

              // Calculate horizontal position and determine layout
              const editorElement = view.dom;
              const editorRect = editorElement.getBoundingClientRect();
              const editorWidth = editorRect.width;
              const relativeX = event.clientX - editorRect.left;
              const horizontalPercent = (relativeX / editorWidth) * 100;

              // Determine layout based on horizontal position
              let layout = nodeData.attrs.layout;
              let width = nodeData.attrs.width;

              // Only auto-adjust if dropping at edges (not when near current position)
              const distanceFromSource = Math.abs(targetPos - sourcePos);
              if (distanceFromSource > 50) {  // Only adjust if moving significantly
                if (horizontalPercent < 33) {
                  // Left third of editor → float-left
                  layout = 'float-left';
                  width = '50%';
                } else if (horizontalPercent > 67) {
                  // Right third of editor → float-right
                  layout = 'float-right';
                  width = '50%';
                } else {
                  // Center third → block (full width)
                  layout = 'block';
                  width = '100%';
                }
              }

              // Update node attributes with new layout
              const updatedAttrs = {
                ...nodeData.attrs,
                layout,
                width,
              };

              // Use ProseMirror's mapping to handle atomic move
              let tr = state.tr;

              if (targetPos > sourcePos) {
                // Dropping after source: delete first, then map target position
                tr = tr.delete(sourcePos, sourcePos + nodeSize);
                const mappedPos = tr.mapping.map(targetPos);

                // Create new node with updated attributes
                const newNode = state.schema.nodes.highlightBox.create(updatedAttrs);
                tr = tr.insert(mappedPos, newNode);
              } else {
                // Dropping before source: insert first, then map source position
                const newNode = state.schema.nodes.highlightBox.create(updatedAttrs);
                tr = tr.insert(targetPos, newNode);

                // Map the source position after insertion
                const mappedSourcePos = tr.mapping.map(sourcePos);
                tr = tr.delete(mappedSourcePos, mappedSourcePos + nodeSize);
              }

              view.dispatch(tr);
              return true; // Indicate we handled the drop
            }
          } catch (e) {
            console.error('Error handling highlight box drop:', e);
          }
        }

        // Let TipTap handle other drops
        return false;
      },
    },
  });


  // Call onEditorReady when editor is ready
  React.useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Update editor content when content prop changes
  React.useEffect(() => {
    if (editor && content !== undefined && htmlContent) {
      const currentHtml = editor.getHTML();
      
      // Only update if content has actually changed to avoid cursor issues
      if (htmlContent !== currentHtml) {
        editor.commands.setContent(htmlContent);
      }
    }
  }, [htmlContent, editor]);

  // Calculate inline toolbar position based on text selection
  const updateInlineToolbarPosition = useCallback((editorInstance) => {
    const currentEditor = editorInstance || editor;
    if (!currentEditor || !showInlineToolbar) return;
    
    const { selection } = currentEditor.state;
    const { from, to } = selection;
    
    // Hide if no selection or cursor only
    if (from === to) {
      setInlineToolbarVisible(false);
      return;
    }
    
    // Get the DOM element for the editor
    const editorElement = currentEditor.view.dom;
    const editorRect = editorElement.getBoundingClientRect();
    
    // Get selection coordinates
    const { view } = currentEditor;
    const start = view.coordsAtPos(from);
    const end = view.coordsAtPos(to);
    
    // Calculate position relative to editor
    const selectionWidth = end.left - start.left;
    const centerX = start.left + (selectionWidth / 2);
    
    setInlineToolbarPosition({
      top: start.top - editorRect.top - 10, // 10px above selection
      left: centerX - editorRect.left
    });
    
    setInlineToolbarVisible(true);
  }, [editor, showInlineToolbar]);

  const editorStyles = {
    border: `1px solid ${colors.border.light}`,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.elevated,
    minHeight: '300px',
    maxHeight: '600px',
    overflow: 'auto',
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.normal,
    ...style
  };

  const editorContentStyles = {
    padding: spacing.lg,
    outline: 'none',
  };

  return (
    <div style={{ ...editorStyles, position: 'relative' }} className={className} {...props}>
      <EditorContent 
        editor={editor} 
        style={editorContentStyles}
      />
      
      {/* Inline formatting toolbar */}
      {showInlineToolbar && (
        <InlineToolbar
          editor={editor}
          visible={inlineToolbarVisible}
          position={inlineToolbarPosition}
        />
      )}
      
      <style jsx>{`
        .rich-text-editor {
          position: relative;
        }
        
        .rich-text-editor .ProseMirror {
          outline: none;
          color: ${colors.text.primary};
        }
        
        .rich-text-editor .ProseMirror:focus {
          outline: none;
        }
        
        .rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: ${colors.text.secondary};
          pointer-events: none;
          height: 0;
        }
        
        /* Typography styles */
        .rich-text-editor h1 {
          font-size: ${typography.fontSize.xxl};
          font-weight: ${typography.fontWeight.bold};
          color: ${colors.text.primary};
          margin: ${spacing.lg} 0 ${spacing.md} 0;
          line-height: ${typography.lineHeight.tight};
        }
        
        .rich-text-editor h2 {
          font-size: ${typography.fontSize.xl};
          font-weight: ${typography.fontWeight.semibold};
          color: ${colors.text.primary};
          margin: ${spacing.lg} 0 ${spacing.md} 0;
          line-height: ${typography.lineHeight.tight};
        }
        
        .rich-text-editor h3 {
          font-size: ${typography.fontSize.lg};
          font-weight: ${typography.fontWeight.semibold};
          color: ${colors.text.primary};
          margin: ${spacing.md} 0 ${spacing.sm} 0;
          line-height: ${typography.lineHeight.tight};
        }
        
        .rich-text-editor p {
          margin: 0 0 ${spacing.md} 0;
          line-height: ${typography.lineHeight.normal};
        }
        
        .rich-text-editor strong {
          font-weight: ${typography.fontWeight.semibold};
          color: ${colors.text.primary};
        }
        
        .rich-text-editor em {
          font-style: italic;
          color: ${colors.text.primary};
        }
        
        .rich-text-editor u {
          text-decoration: underline;
          color: ${colors.text.primary};
        }
        
        .rich-text-editor code {
          background-color: ${colors.background.container};
          padding: 2px 6px;
          border-radius: ${borderRadius.sm};
          font-family: ${typography.fontFamily.mono};
          font-size: 0.9em;
          color: ${colors.text.primary};
        }
        
        .rich-text-editor pre {
          background-color: ${colors.background.container};
          padding: ${spacing.md};
          border-radius: ${borderRadius.base};
          overflow: auto;
          margin: ${spacing.md} 0;
        }
        
        .rich-text-editor pre code {
          background: none;
          padding: 0;
          font-family: ${typography.fontFamily.mono};
          font-size: ${typography.fontSize.sm};
        }
        
        .rich-text-editor ul,
        .rich-text-editor ol {
          margin: ${spacing.md} 0;
          padding-left: ${spacing.xl};
        }
        
        .rich-text-editor li {
          margin: ${spacing.xs} 0;
          line-height: ${typography.lineHeight.normal};
        }
        
        .rich-text-editor blockquote {
          border-left: 4px solid ${colors.primary};
          padding-left: ${spacing.lg};
          margin: ${spacing.lg} 0;
          font-style: italic;
          color: ${colors.text.secondary};
        }
        
        .rich-text-editor .editor-link {
          color: ${colors.primary};
          text-decoration: underline;
        }
        
        .rich-text-editor .editor-link:hover {
          color: ${colors.primaryHover};
        }
        
        .rich-text-editor .editor-image {
          max-width: 100%;
          height: auto;
          border-radius: ${borderRadius.base};
          margin: ${spacing.md} 0;
        }
        
        .rich-text-editor hr {
          border: none;
          border-top: 1px solid ${colors.border.base};
          margin: ${spacing.xl} 0;
        }
        
        /* Table styles */
        .rich-text-editor table {
          border-collapse: collapse;
          margin: ${spacing.lg} 0;
          width: 100%;
        }
        
        .rich-text-editor td,
        .rich-text-editor th {
          border: 1px solid ${colors.border.base};
          padding: ${spacing.sm} ${spacing.md};
          text-align: left;
          vertical-align: top;
          min-width: 100px;
        }
        
        .rich-text-editor th {
          background-color: ${colors.background.container};
          font-weight: ${typography.fontWeight.semibold};
          color: ${colors.text.primary};
        }
        
        .rich-text-editor .selectedCell {
          background-color: ${colors.primary}20;
        }

        /* Highlight box responsive float layouts */
        .rich-text-editor .highlight-float-left {
          clear: both;
        }

        .rich-text-editor .highlight-float-right {
          clear: both;
        }

        /* Clear floats after highlighted content */
        .rich-text-editor .highlight-box::after {
          content: "";
          display: table;
          clear: both;
        }

        /* Block elements should clear floats to prevent awkward wrapping */
        .rich-text-editor h1,
        .rich-text-editor h2,
        .rich-text-editor h3,
        .rich-text-editor h4,
        .rich-text-editor h5,
        .rich-text-editor h6 {
          clear: both;
        }

        .rich-text-editor ul,
        .rich-text-editor ol {
          clear: both;
        }

        /* Ensure consistent list markers even during float reflow */
        .rich-text-editor ul {
          list-style-type: disc;
        }

        .rich-text-editor ul ul {
          list-style-type: circle;
        }

        .rich-text-editor ul ul ul {
          list-style-type: square;
        }

        .rich-text-editor ol {
          list-style-type: decimal;
        }

        .rich-text-editor pre {
          clear: both;
        }

        .rich-text-editor table {
          clear: both;
        }

        .rich-text-editor hr {
          clear: both;
        }

        /* Ensure multiple highlight boxes stack vertically */
        .rich-text-editor .highlight-box {
          clear: both;
          position: relative;
        }

        /* Drag handle styling for highlight boxes */
        .rich-text-editor .highlight-box[data-drag-handle] {
          cursor: grab;
        }

        .rich-text-editor .highlight-box[data-drag-handle]:active {
          cursor: grabbing;
        }

        .rich-text-editor .highlight-box:hover {
          box-shadow: 0 0 0 2px rgba(114, 46, 209, 0.2);
        }

        /* Dragging state feedback */
        .rich-text-editor .highlight-box[dragging="true"] {
          opacity: 0.5;
          box-shadow: 0 0 10px rgba(114, 46, 209, 0.4);
        }

        /* Drop zone indicator */
        .rich-text-editor .ProseMirror.drop-target {
          background: rgba(114, 46, 209, 0.05);
        }

        /* Mobile: Stack all floats */
        @media (max-width: 768px) {
          .rich-text-editor .highlight-float-left,
          .rich-text-editor .highlight-float-right {
            width: 100% !important;
            float: none !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;