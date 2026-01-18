import React from 'react';
import { colors, spacing, borderRadius, shadows } from '../../DesignSystem/tokens';
import { Button } from '../../DesignSystem';

/**
 * Modern Editor Layout with flexible view modes
 */
const EditorLayout = ({
  mode = 'edit', // 'edit', 'preview', 'split'
  onModeChange,
  children,
  sidebarContent = null,
  toolbarContent = null,
  className = '',
  style = {},
  // Fullscreen props
  isFullscreen = false,
  onToggleFullscreen = null
}) => {
  const layoutStyles = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: colors.background.body,
    borderRadius: isFullscreen ? 0 : borderRadius.md,
    overflow: 'hidden',
    boxShadow: isFullscreen ? 'none' : shadows.base,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    ...(isFullscreen && {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      borderRadius: 0
    }),
    ...style
  };

  const toolbarStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.md} ${spacing.lg}`,
    backgroundColor: colors.background.elevated,
    borderBottom: `1px solid ${colors.border.light}`,
    flexShrink: 0
  };

  const contentAreaStyles = {
    display: 'flex',
    flex: 1,
    overflow: 'hidden'
  };

  const mainContentStyles = {
    flex: 1,
    display: 'flex',
    flexDirection: mode === 'split' ? 'row' : 'column',
    overflow: 'hidden'
  };

  const sidebarStyles = {
    width: '300px',
    backgroundColor: colors.background.container,
    borderLeft: `1px solid ${colors.border.light}`,
    flexShrink: 0,
    overflow: 'auto'
  };

  // View mode buttons
  const ViewModeButtons = () => (
    <div style={{ display: 'flex', gap: spacing.xs, alignItems: 'center' }}>
      <Button
        variant={mode === 'edit' ? 'primary' : 'ghost'}
        size="small"
        onClick={() => onModeChange?.('edit')}
      >
        Edit
      </Button>
      <Button
        variant={mode === 'preview' ? 'primary' : 'ghost'}
        size="small"
        onClick={() => onModeChange?.('preview')}
      >
        Preview
      </Button>
      <Button
        variant={mode === 'split' ? 'primary' : 'ghost'}
        size="small"
        onClick={() => onModeChange?.('split')}
      >
        🔀 Split View
      </Button>

      {/* Fullscreen button */}
      {onToggleFullscreen && (
        <>
          <div style={{
            width: '1px',
            height: '20px',
            backgroundColor: colors.border.base,
            margin: `0 ${spacing.xs}`
          }} />
          <Button
            variant="ghost"
            size="small"
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen (ESC)' : 'Enter fullscreen'}
          >
            {isFullscreen ? '⤓' : '⤢'}
          </Button>
        </>
      )}
    </div>
  );

  // Keyboard shortcuts for fullscreen
  React.useEffect(() => {
    if (!onToggleFullscreen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        onToggleFullscreen();
      }
      if (e.key === 'F11') {
        e.preventDefault();
        onToggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onToggleFullscreen]);

  return (
    <div style={layoutStyles} className={className}>
      {/* Toolbar */}
      <div style={{ ...toolbarStyles, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
          <span style={{
            fontSize: '16px',
            fontWeight: '600',
            color: colors.text.primary
          }}>
            Content Editor
          </span>
          {toolbarContent}
        </div>
        <ViewModeButtons />

        {/* Fullscreen indicator */}
        {isFullscreen && (
          <div style={{
            position: 'absolute',
            top: '50%',
            right: spacing.lg,
            transform: 'translateY(-50%)',
            fontSize: '12px',
            color: colors.text.secondary,
            opacity: 0.7,
            pointerEvents: 'none'
          }}>
            Press ESC to exit fullscreen
          </div>
        )}
      </div>

      {/* Content Area */}
      <div style={contentAreaStyles}>
        <div style={mainContentStyles}>
          {children}
        </div>
        
        {/* Sidebar for style controls */}
        {sidebarContent && (
          <div style={sidebarStyles}>
            {sidebarContent}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Editor Pane - Wrapper for editor content
 */
export const EditorPane = ({ children, style = {} }) => {
  const paneStyles = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: colors.background.elevated,
    ...style
  };

  return (
    <div style={paneStyles}>
      {children}
    </div>
  );
};

/**
 * Preview Pane - Wrapper for preview content
 */
export const PreviewPane = ({ children, style = {} }) => {
  const paneStyles = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    backgroundColor: colors.background.body,
    borderLeft: `1px solid ${colors.border.light}`,
    ...style
  };

  return (
    <div style={paneStyles}>
      <div style={{ padding: spacing.lg }}>
        {children}
      </div>
    </div>
  );
};

export default EditorLayout;