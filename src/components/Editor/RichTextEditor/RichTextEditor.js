import React, { useState, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
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
import { TweetCard } from '../extensions/TweetCard';
import { markdownToHtml, htmlToMarkdown } from '../../../utils/markdownToHtml';

/**
 * Validate drop position and determine if float mode should be forced
 * Prevents text splitting and keeps headings with their first content block
 * @param {EditorState} state - ProseMirror editor state
 * @param {number} pos - Target position to validate
 * @returns {{ pos: number, forceFloat: boolean, reason: string }}
 */
const validateDropPosition = (state, pos) => {
  const $pos = state.doc.resolve(pos);

  // EXISTING: Check if inside text block with content
  if ($pos.parent.isTextblock && $pos.parent.textContent.length > 0) {
    // If in middle of text, move to end of current block and force float
    if ($pos.parentOffset > 0 && $pos.parentOffset < $pos.parent.textContent.length) {
      return {
        pos: $pos.end(),
        forceFloat: true,  // Force float when dropping in middle of text
        reason: 'mid-text-to-block-end'
      };
    }
  }

  // NEW: Check list BEFORE heading (lists are more restrictive)
  const listCheck = checkIfInsideOrNearList(state, pos);
  if (listCheck.isInsideOrNearList) {
    return {
      pos: pos,
      forceFloat: true,
      reason: `list-boundary-${listCheck.listType}`
    };
  }

  // NEW: Check if between heading and its first content block
  const headingContentCheck = checkHeadingContentBoundary(state, pos);
  if (headingContentCheck.isBetweenHeadingAndContent) {
    return {
      pos: pos,
      forceFloat: true,
      reason: 'heading-content-boundary'
    };
  }

  return {
    pos: pos,
    forceFloat: false,
    reason: 'valid-position'
  };
};

/**
 * Check if position is between a heading and its first following content block
 * @param {EditorState} state - ProseMirror editor state
 * @param {number} pos - Position to check
 * @returns {{ isBetweenHeadingAndContent: boolean, headingLevel: number | null }}
 */
const checkHeadingContentBoundary = (state, pos) => {
  const $pos = state.doc.resolve(pos);

  // Check if we're at the end of a heading (cursor right after heading text)
  const isAtEndOfHeading = $pos.parent.type.name === 'heading' &&
                           $pos.parentOffset === $pos.parent.textContent.length;

  // If inside a textblock but NOT at the end of a heading, not at boundary
  if ($pos.parent.isTextblock && !isAtEndOfHeading) {
    return { isBetweenHeadingAndContent: false, headingLevel: null };
  }

  // If we're at the end of a heading, check what comes next
  if (isAtEndOfHeading) {
    // Move to the position after the heading
    const afterHeadingPos = $pos.after();

    // Find next block node after the heading
    let nextBlock = null;
    state.doc.nodesBetween(afterHeadingPos, state.doc.content.size, (node, nodePos) => {
      if (!nextBlock && node.isBlock && nodePos >= afterHeadingPos) {
        nextBlock = node;
        return false; // Stop iteration
      }
    });

    // Check if next block exists and is NOT another heading
    if (nextBlock && nextBlock.type.name !== 'heading') {
      return {
        isBetweenHeadingAndContent: true,
        headingLevel: $pos.parent.attrs?.level || null
      };
    }

    return { isBetweenHeadingAndContent: false, headingLevel: null };
  }

  // Find previous block node
  let prevBlock = null;
  let prevBlockPos = null;
  state.doc.nodesBetween(0, $pos.pos, (node, nodePos) => {
    if (node.isBlock && nodePos < $pos.pos) {
      prevBlock = node;
      prevBlockPos = nodePos;
    }
  });

  // Check if previous block is a heading
  if (!prevBlock || prevBlock.type.name !== 'heading') {
    return { isBetweenHeadingAndContent: false, headingLevel: null };
  }

  // Find next block node
  let nextBlock = null;
  let foundNext = false;
  state.doc.nodesBetween($pos.pos, state.doc.content.size, (node, nodePos) => {
    if (!foundNext && node.isBlock && nodePos >= $pos.pos) {
      nextBlock = node;
      foundNext = true;
      return false; // Stop iteration
    }
  });

  // Check if next block exists and is NOT another heading
  if (!nextBlock || nextBlock.type.name === 'heading') {
    return { isBetweenHeadingAndContent: false, headingLevel: null };
  }

  // Position is between heading and content!
  return {
    isBetweenHeadingAndContent: true,
    headingLevel: prevBlock.attrs?.level || null
  };
};

/**
 * Check if position is inside or immediately adjacent to a list
 * @param {EditorState} state - ProseMirror editor state
 * @param {number} pos - Position to check
 * @returns {{ isInsideOrNearList: boolean, listType: string | null }}
 */
const checkIfInsideOrNearList = (state, pos) => {
  const $pos = state.doc.resolve(pos);

  // CASE 1: Inside listItem
  if ($pos.parent.type.name === 'listItem') {
    return { isInsideOrNearList: true, listType: 'listItem' };
  }

  // CASE 2: Check parent chain for bulletList or orderedList
  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth);
    if (node.type.name === 'bulletList' || node.type.name === 'orderedList') {
      return { isInsideOrNearList: true, listType: node.type.name };
    }
  }

  // CASE 3: Check if immediately AFTER a list
  let prevBlock = null;
  state.doc.nodesBetween(0, $pos.pos, (node, nodePos) => {
    if (node.isBlock && nodePos < $pos.pos) {
      prevBlock = node;
    }
  });

  if (prevBlock && (prevBlock.type.name === 'bulletList' ||
                    prevBlock.type.name === 'orderedList' ||
                    prevBlock.type.name === 'listItem')) {
    return { isInsideOrNearList: true, listType: prevBlock.type.name };
  }

  // CASE 4: Check if immediately BEFORE a list
  let nextBlock = null;
  let foundNext = false;
  state.doc.nodesBetween($pos.pos, state.doc.content.size, (node, nodePos) => {
    if (!foundNext && node.isBlock && nodePos >= $pos.pos) {
      nextBlock = node;
      foundNext = true;
      return false;
    }
  });

  if (nextBlock && (nextBlock.type.name === 'bulletList' ||
                    nextBlock.type.name === 'orderedList' ||
                    nextBlock.type.name === 'listItem')) {
    return { isInsideOrNearList: true, listType: nextBlock.type.name };
  }

  return { isInsideOrNearList: false, listType: null };
};

/**
 * Apply CSS rules to create text flow effect during drag
 */
const applyTextFlowCSS = (layout, width, estimatedHeight, textFlowStyleRef) => {
  if (!textFlowStyleRef.current) return;

  let floatRule = '';
  let widthValue = '';

  if (layout === 'float-left') {
    floatRule = 'float: left; margin-right: 16px; margin-left: 0;';
    widthValue = width || '90%';
  } else if (layout === 'float-right') {
    floatRule = 'float: right; margin-left: 16px; margin-right: 0;';
    widthValue = width || '90%';
  } else {
    floatRule = 'display: block;';
    widthValue = width || '100%';
  }

  const css = `
    .ProseMirror[data-text-flow-active="true"]::before {
      content: "";
      ${floatRule}
      width: ${widthValue};
      height: ${estimatedHeight}px;
      margin-top: 8px;
      margin-bottom: 8px;
      pointer-events: none;
      clear: both;
    }
  `;

  textFlowStyleRef.current.textContent = css;
};

/**
 * Remove text flow CSS rules
 */
const clearTextFlowCSS = (view, textFlowStyleRef) => {
  if (textFlowStyleRef.current) {
    textFlowStyleRef.current.textContent = '';
  }
  if (view && view.dom && view.dom.removeAttribute) {
    view.dom.removeAttribute('data-text-flow-active');
  }
};

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

  // Track last emitted content to prevent loops
  const lastEmittedContent = React.useRef(content || '');

  // Track update source to prevent cursor resets
  const isInternalUpdate = React.useRef(false);
  const lastExternalContent = React.useRef(content || '');

  // Drag preview state and refs
  const [dragPreview, setDragPreview] = React.useState(null);
  const dragPreviewRef = React.useRef(null);
  const draggingNodeData = React.useRef(null);
  const previewUpdateScheduled = React.useRef(false);
  const isMountedRef = React.useRef(true);

  // NEW: Ref for dynamic text flow CSS
  const textFlowStyleRef = React.useRef(null);

  // Create a portal container for the drag preview (outside React tree to avoid Fiber conflicts)
  const portalContainerRef = React.useRef(null);

  React.useEffect(() => {
    // Create portal container on mount
    const container = document.createElement('div');
    container.id = 'drag-preview-portal';
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '1000';
    document.body.appendChild(container);
    portalContainerRef.current = container;

    // NEW: Create style element for text flow CSS
    const styleEl = document.createElement('style');
    styleEl.id = 'drag-text-flow-rules';
    document.head.appendChild(styleEl);
    textFlowStyleRef.current = styleEl;

    return () => {
      // Clean up portal container on unmount
      if (portalContainerRef.current && document.body.contains(portalContainerRef.current)) {
        document.body.removeChild(portalContainerRef.current);
      }
      // NEW: Clean up style element
      if (textFlowStyleRef.current && textFlowStyleRef.current.parentNode) {
        textFlowStyleRef.current.parentNode.removeChild(textFlowStyleRef.current);
      }
    };
  }, []);

  // Track mount/unmount state
  React.useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      previewUpdateScheduled.current = false;
    };
  }, []);

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
      TweetCard,
    ],
    content: htmlContent,
    editable: editable,
    onUpdate: ({ editor }) => {
      // Mark this as an internal update (from user typing)
      isInternalUpdate.current = true;

      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);

      // Only call onChange if content actually changed
      if (onChange && markdown !== lastEmittedContent.current) {
        lastEmittedContent.current = markdown;
        onChange(markdown);
      }

      // Reset flag after update propagates
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 0);
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
      // Handle DOM events for drag zone feedback
      handleDOMEvents: {
        dragover: (view, event) => {
          try {
            if (document.body.hasAttribute('data-highlight-dragging') && draggingNodeData.current) {
              // Only schedule one update at a time to prevent React Fiber conflicts
              // Move ALL expensive operations inside the throttled section
              if (!previewUpdateScheduled.current) {
                previewUpdateScheduled.current = true;

                requestAnimationFrame(() => {
                  previewUpdateScheduled.current = false;

                  try {
                    const editorRect = view.dom.getBoundingClientRect();

                    // Get drop position for precise Y placement
                    const dropPos = view.posAtCoords({ left: event.clientX, top: event.clientY });

                    if (dropPos) {
                      // Validate position and check for forced float mode
                      const validation = validateDropPosition(view.state, dropPos.pos);
                      const validatedPos = validation.pos;

                      // Check if highlightBox node can actually be inserted at this position
                      const $pos = view.state.doc.resolve(validatedPos);
                      const highlightBoxType = view.state.schema.nodes.highlightBox;

                      if (!highlightBoxType || !$pos.parent.canReplaceWith($pos.index(), $pos.index(), highlightBoxType)) {
                        // Can't insert highlightBox here, don't show preview
                        return;
                      }

                      // Calculate horizontal position percentage
                      const relativeX = event.clientX - editorRect.left;
                      const horizontalPercent = (relativeX / editorRect.width) * 100;

                      // Determine zone and layout
                      let zone = 'center';
                      let layout = 'block';
                      let width = '100%';

                      // Check if float mode is forced (e.g., dropping between heading and content)
                      if (validation.forceFloat) {
                        // Force float layout - use cursor position to determine left vs right
                        if (horizontalPercent < 50) {
                          zone = 'left';
                          layout = 'float-left';
                          width = '90%';
                        } else {
                          zone = 'right';
                          layout = 'float-right';
                          width = '90%';
                        }
                      } else {
                        // Normal zone detection (existing logic)
                        if (horizontalPercent < 33) {
                          zone = 'left';
                          layout = 'float-left';
                          width = '90%';
                        } else if (horizontalPercent > 67) {
                          zone = 'right';
                          layout = 'float-right';
                          width = '90%';
                        }
                      }

                      // Calculate Y coordinate from validated position
                      const dropCoords = view.coordsAtPos(validatedPos);
                      const dropY = dropCoords.top - editorRect.top;

                      // Extract node data
                      const nodeData = draggingNodeData.current;
                      const attrs = nodeData.attrs;

                      // Font size mapping
                      const fontSizes = {
                        small: '14px',
                        medium: '16px',
                        large: '24px',
                        xlarge: '48px',
                        xxlarge: '72px'
                      };

                      // Default styles
                      const defaultStyles = {
                        statistic: { backgroundColor: 'var(--color-primary-50)', borderColor: 'var(--color-primary)', color: 'var(--color-primary-700)', defaultIcon: '📊' },
                        pullquote: { backgroundColor: 'var(--color-success-bg)', borderColor: 'var(--color-success)', color: 'var(--color-success-dark)', defaultIcon: '💬' },
                        takeaway: { backgroundColor: 'var(--color-accent-50)', borderColor: 'var(--color-accent)', color: 'var(--color-accent-700)', defaultIcon: '💡' },
                        process: { backgroundColor: 'var(--color-primary-50)', borderColor: 'var(--color-primary)', color: 'var(--color-primary-700)', defaultIcon: '🔄' },
                        warning: { backgroundColor: 'var(--color-error-bg)', borderColor: 'var(--color-error)', color: 'var(--color-error)', defaultIcon: '⚠️' },
                        tip: { backgroundColor: 'var(--color-primary-50)', borderColor: 'var(--color-primary)', color: 'var(--color-primary-700)', defaultIcon: '💡' },
                        definition: { backgroundColor: 'var(--color-primary-50)', borderColor: 'var(--color-primary)', color: 'var(--color-primary-700)', defaultIcon: '📖' },
                        comparison: { backgroundColor: 'var(--color-primary-50)', borderColor: 'var(--color-primary)', color: 'var(--color-primary-700)', defaultIcon: '⚖️' },
                      };

                      const typeStyle = defaultStyles[attrs.type] || defaultStyles.takeaway;

                      // Build preview data (with absolute positioning for portal)
                      const previewData = {
                        top: editorRect.top + Math.max(0, dropY - 20),  // Absolute position relative to viewport
                        left: editorRect.left,  // Editor's left position
                        layout: layout,
                        width: width,
                        editorWidth: editorRect.width,
                        backgroundColor: attrs.customBg || typeStyle.backgroundColor,
                        borderColor: attrs.customBorder || typeStyle.borderColor,
                        textColor: typeStyle.color,
                        fontSize: fontSizes[attrs.fontSize] || fontSizes.medium,
                        icon: attrs.icon || typeStyle.defaultIcon,
                        contentPreview: attrs.content ?
                          attrs.content.replace(/<[^>]*>/g, '').substring(0, 50) + '...' :
                          'Preview content...',
                      };

                      // Calculate approximate height of preview box for spacing
                      const baseHeight = 60; // Base height for small content
                      const fontSizeMultiplier = {
                        small: 1,
                        medium: 1.2,
                        large: 1.8,
                        xlarge: 2.5,
                        xxlarge: 3.5,
                      };
                      const estimatedHeight = baseHeight * (fontSizeMultiplier[attrs.fontSize] || 1);

                      if (view.dom && view.dom.setAttribute) {
                        view.dom.setAttribute('data-drag-zone', zone);
                      }

                      // Update preview state only if component is still mounted
                      if (isMountedRef.current) {
                        setDragPreview(previewData);

                        // NEW: Apply CSS to cause text reflow
                        applyTextFlowCSS(layout, width, estimatedHeight, textFlowStyleRef);

                        // Set data attribute to activate CSS rule
                        if (view.dom && view.dom.setAttribute) {
                          view.dom.setAttribute('data-text-flow-active', 'true');
                        }
                      }

                      // NOTE: Decorations disabled to prevent React Fiber conflicts
                      // The decoration system was creating/destroying DOM nodes that
                      // conflicted with React's event delegation system
                      // The preview component provides sufficient visual feedback
                    }
                  } catch (innerError) {
                    console.error('Error in dragover RAF callback:', innerError);
                  }
                });
              }
            }
          } catch (e) {
            console.error('Error in dragover handler:', e);
          }
          return false;
        },
        dragleave: (view, event) => {
          // Clear zone indicator when leaving editor
          try {
            const editorRect = view.dom.getBoundingClientRect();
            if (
              event.clientX < editorRect.left ||
              event.clientX > editorRect.right ||
              event.clientY < editorRect.top ||
              event.clientY > editorRect.bottom
            ) {
              // Clear preview and zone indicator when leaving editor
              previewUpdateScheduled.current = false;

              requestAnimationFrame(() => {
                if (view.dom && view.dom.removeAttribute) {
                  view.dom.removeAttribute('data-drag-zone');
                }
                if (isMountedRef.current) {
                  setDragPreview(null);
                }
                // NEW: Clear text flow CSS
                clearTextFlowCSS(view, textFlowStyleRef);
              });
            }
          } catch (e) {
            console.error('Error in dragleave handler:', e);
          }
          return false;
        },
        drop: (view, event) => {
          // Clear zone indicator and preview on drop
          try {
            previewUpdateScheduled.current = false;

            requestAnimationFrame(() => {
              if (view.dom && view.dom.removeAttribute) {
                view.dom.removeAttribute('data-drag-zone');
              }
              if (isMountedRef.current) {
                setDragPreview(null);
              }
              // NEW: Clear text flow CSS
              clearTextFlowCSS(view, textFlowStyleRef);
            });
          } catch (e) {
            console.error('Error in drop handler:', e);
          }
          return false; // Let handleDrop handle it
        },
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
              let targetPos = dropPos.pos;

              // Validate drop position and check for forced float mode
              const validation = validateDropPosition(state, targetPos);
              targetPos = validation.pos;
              // Note: Layout is recalculated independently based on drop position
              // Both dragover (preview) and drop (actual) use identical zone detection logic
              // to ensure "what you see is what you get"

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

              // Initialize to defaults (matching dragover behavior)
              let layout = 'block';
              let width = '100%';

              // ALWAYS check forced float FIRST, regardless of movement distance
              if (validation.forceFloat) {
                // Force float layout - use cursor position to determine left vs right
                if (horizontalPercent < 50) {
                  layout = 'float-left';
                  width = '50%';
                } else {
                  layout = 'float-right';
                  width = '50%';
                }
              } else {
                // Normal zone detection (same logic as dragover)
                if (horizontalPercent < 33) {
                  // Left third of editor → float-left
                  layout = 'float-left';
                  width = '50%';
                } else if (horizontalPercent > 67) {
                  // Right third of editor → float-right
                  layout = 'float-right';
                  width = '50%';
                }
                // else: stays as default 'block' / '100%'
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
      // Only update if:
      // 1. Content changed externally (not from user typing)
      // 2. Content is actually different
      if (!isInternalUpdate.current && content !== lastExternalContent.current) {
        lastExternalContent.current = content;
        editor.commands.setContent(htmlContent);
      }
    }
  }, [content, htmlContent, editor]);

  // Listen for custom drag start/end events to capture node data for preview
  React.useEffect(() => {
    const handleHighlightDragStart = (e) => {
      draggingNodeData.current = e.detail;  // Store node data
    };

    const handleHighlightDragEnd = () => {
      draggingNodeData.current = null;      // Clear on drag end
      if (isMountedRef.current) {
        setDragPreview(null);                 // Clear preview
      }
      // NEW: Clear text flow CSS
      if (textFlowStyleRef.current) {
        textFlowStyleRef.current.textContent = '';
      }
    };

    window.addEventListener('highlight-drag-start', handleHighlightDragStart);
    window.addEventListener('highlight-drag-end', handleHighlightDragEnd);

    return () => {
      window.removeEventListener('highlight-drag-start', handleHighlightDragStart);
      window.removeEventListener('highlight-drag-end', handleHighlightDragEnd);
    };
  }, []);

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

      {/* Drag preview indicator - rendered via Portal to avoid React Fiber conflicts */}
      {dragPreview && portalContainerRef.current && ReactDOM.createPortal(
        <div
          ref={dragPreviewRef}
          style={{
            position: 'fixed',  // Fixed positioning since portal is outside editor
            top: `${dragPreview.top}px`,
            left: dragPreview.layout === 'float-left' ? `${dragPreview.left}px` :
                  dragPreview.layout === 'float-right' ? `${dragPreview.left + (dragPreview.editorWidth * 0.05)}px` :
                  `${dragPreview.left}px`,
            width: dragPreview.width === '100%' ? `${dragPreview.editorWidth}px` : `${dragPreview.editorWidth * 0.9}px`,
            padding: '16px 20px',
            margin: '8px 0',
            borderRadius: '8px',
            backgroundColor: dragPreview.backgroundColor,
            borderLeft: `4px solid ${dragPreview.borderColor}`,
            opacity: 0.85,
            pointerEvents: 'none',
            zIndex: 1000,
            transition: 'top 0.05s ease-out, left 0.1s ease-out',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}>
            <span style={{ fontSize: '24px', lineHeight: 1 }}>{dragPreview.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: dragPreview.fontSize,
                lineHeight: '1.6',
                color: dragPreview.textColor,
                fontWeight: '500',
              }}>
                {dragPreview.contentPreview}
              </div>
            </div>
          </div>

          {/* Layout indicator label */}
          <div style={{
            position: 'absolute',
            top: '-24px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '4px 8px',
            background: 'var(--color-primary)',
            color: 'var(--color-text-on-primary)',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
          }}>
            {dragPreview.layout === 'float-left' ? 'Float Left (50%)' :
             dragPreview.layout === 'float-right' ? 'Float Right (50%)' :
             'Full Width (100%)'}
          </div>
        </div>,
        portalContainerRef.current
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

        .rich-text-editor h4 {
          font-size: ${typography.fontSize.md};
          font-weight: ${typography.fontWeight.semibold};
          color: ${colors.text.primary};
          margin: ${spacing.md} 0 ${spacing.sm} 0;
          line-height: ${typography.lineHeight.tight};
        }

        .rich-text-editor h5 {
          font-size: ${typography.fontSize.base};
          font-weight: ${typography.fontWeight.semibold};
          color: ${colors.text.primary};
          margin: ${spacing.sm} 0 ${spacing.xs} 0;
          line-height: ${typography.lineHeight.tight};
        }

        .rich-text-editor h6 {
          font-size: ${typography.fontSize.sm};
          font-weight: ${typography.fontWeight.semibold};
          color: ${colors.text.secondary};
          margin: ${spacing.sm} 0 ${spacing.xs} 0;
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