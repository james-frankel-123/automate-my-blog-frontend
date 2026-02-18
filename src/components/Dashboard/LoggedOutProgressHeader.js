import React from 'react';
import { Button, Space } from 'antd';
import {
  LoginOutlined,
  UserAddOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import ThemeToggle from '../ThemeToggle/ThemeToggle';

/**
 * LoggedOutProgressHeader Component
 * Fixed header showing 5-step workflow progress for logged-out users
 * Provides navigation and visual feedback of current step
 */
const LoggedOutProgressHeader = ({
  currentStep: _currentStep = 0,
  completedSteps: _completedSteps = [],
  onStepClick: _onStepClick,
  showAuthModal: _showAuthModal,
  setShowAuthModal,
  authContext: _authContext,
  setAuthContext,
  // New props for registration state
  user = null,
  isNewRegistration = false,
  showSaveProjectButton = false,
  onSaveProject = null
}) => {
  
  // Steps moved to main content area as requested

  return (
    <header
      className="logged-out-progress-header"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: 'var(--color-background-body)',
        borderBottom: '1px solid var(--color-border-base)',
        boxShadow: 'var(--shadow-sm)',
        padding: '12px 16px',
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '64px',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      {/* Left: spacer for balance (shrinks on mobile via CSS) */}
      <div className="logged-out-header-left" style={{ minWidth: '80px', flex: '0 0 auto' }} aria-hidden />

      {/* Center: flexible space */}
      <div style={{ flex: '1 1 0', minWidth: 0 }} />

      {/* Right: theme toggle + auth / save buttons — touch-friendly on mobile */}
      <div className="logged-out-header-right" style={{ minWidth: 0, flex: '0 0 auto', display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '8px' }}>
        {!user ? (
          <Space size="small" wrap align="center">
            <ThemeToggle />
            <Button
              type="text"
              icon={<LoginOutlined />}
              onClick={() => {
                setAuthContext('login');
                setShowAuthModal(true);
              }}
              style={{ minHeight: 44, borderRadius: 6 }}
              data-testid="login-button"
            >
              Log In
            </Button>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => {
                setAuthContext('register');
                setShowAuthModal(true);
              }}
              style={{ borderRadius: 6, minHeight: 44 }}
              data-testid="signup-button"
            >
              Sign Up Free
            </Button>
          </Space>
        ) : isNewRegistration && showSaveProjectButton ? (
          <Button
            type="primary"
            onClick={onSaveProject}
            style={{ fontWeight: 600, borderRadius: 6, minHeight: 44 }}
          >
            💾 Save Project
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<DashboardOutlined />}
            onClick={() => { window.location.href = '/dashboard'; }}
            style={{ borderRadius: 6, minHeight: 44 }}
            data-testid="dashboard-button"
          >
            Go to Dashboard
          </Button>
        )}
      </div>
    </header>
  );
};

export default LoggedOutProgressHeader;