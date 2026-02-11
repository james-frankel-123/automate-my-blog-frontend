import React from 'react';
import { colors, spacing, borderRadius, shadows, typography } from '../../DesignSystem/tokens';
import { Button } from '../../DesignSystem';

/**
 * Modern Editor Layout with flexible view modes
 */
const EditorLayout = ({
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
    borderRadius: isFullscreen ? borderRadius.lg : borderRadius.md,
    overflow: 'hidden',
    boxShadow: isFullscreen ? shadows.elevated : shadows.md,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: `1px solid ${colors.border.light}`,
    ...(isFullscreen && {
      position: 'fixed',
      top: '5vh',
      left: '5vw',
      right: '5vw',
      bottom: '5vh',
      width: '90vw',
      height: '90vh',
      zIndex: 9999
    }),
    ...style
  };

  const toolbarStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.lg} ${spacing.xl}`,
    backgroundColor: colors.background.elevated,
    borderBottom: `1px solid ${colors.border.base}`,
    flexShrink: 0,
    minHeight: '56px'
  };

  const contentAreaStyles = {
    display: 'flex',
    flex: 1,
    overflow: 'hidden'
  };

  const mainContentStyles = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: colors.background.elevated
  };

  const sidebarStyles = {
    width: '400px',
    maxWidth: '40%',
    backgroundColor: colors.background.container,
    borderLeft: `1px solid ${colors.border.light}`,
    flexShrink: 0,
    overflow: 'auto',
    boxShadow: `inset 8px 0 12px -8px ${colors.border.base}`
  };

  // Fullscreen button
  const FullscreenButton = () => (
    onToggleFullscreen && (
      <Button
        variant="ghost"
        size="small"
        onClick={onToggleFullscreen}
        title={isFullscreen ? 'Exit fullscreen (ESC)' : 'Enter fullscreen'}
        style={{
          color: colors.text.secondary,
          fontWeight: typography.fontWeight.medium
        }}
      >
        {isFullscreen ? '⤓ Exit fullscreen' : '⤢ Fullscreen'}
      </Button>
    )
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
    <>
      {/* Backdrop for fullscreen mode */}
      {isFullscreen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--color-background-overlay)',
            zIndex: 9998,
            backdropFilter: 'blur(4px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onClick={onToggleFullscreen}
        />
      )}

      <div style={layoutStyles} className={className}>
      {/* Toolbar */}
      <div style={{ ...toolbarStyles, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg, flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            paddingLeft: spacing.sm,
            borderLeft: `3px solid ${colors.primary}`,
            borderRadius: borderRadius.sm
          }}>
            <span style={{
              fontFamily: typography.fontFamily.display,
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              letterSpacing: typography.letterSpacing.tight
            }}>
              Content Editor
            </span>
          </div>
          {toolbarContent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginLeft: spacing.md }}>
              {toolbarContent}
            </div>
          )}
        </div>
        <FullscreenButton />

        {/* Fullscreen indicator */}
        {isFullscreen && (
          <div style={{
            position: 'absolute',
            top: '50%',
            right: spacing.xl,
            transform: 'translateY(-50%)',
            fontSize: typography.fontSize.xs,
            color: colors.text.tertiary,
            opacity: 0.9,
            pointerEvents: 'none',
            fontFamily: typography.fontFamily.primary
          }}>
            Press ESC or click outside to close
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
    </>
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
    padding: spacing.lg,
    minHeight: 0,
    ...style
  };

  return (
    <div style={paneStyles}>
      {children}
    </div>
  );
};


export default EditorLayout;