import React from 'react';
import { Button, Space } from 'antd';
import { 
  LoginOutlined,
  UserAddOutlined
} from '@ant-design/icons';

/**
 * LoggedOutProgressHeader Component
 * Fixed header showing 5-step workflow progress for logged-out users
 * Provides navigation and visual feedback of current step
 */
const LoggedOutProgressHeader = ({
  currentStep = 0,
  completedSteps = [],
  onStepClick,
  showAuthModal,
  setShowAuthModal,
  authContext,
  setAuthContext,
  // New props for registration state
  user = null,
  isNewRegistration = false,
  showSaveProjectButton = false,
  onSaveProject = null
}) => {
  
  // Steps moved to main content area as requested

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      backgroundColor: 'var(--color-background-body)',
      borderBottom: '1px solid var(--color-border-base)',
      boxShadow: 'var(--shadow-sm)',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: '80px'
    }}>
      {/* Left: Empty space for balance */}
      <div style={{ minWidth: '200px' }}>
        {/* Removed branding as requested */}
      </div>

      {/* Center: Empty space (steps moved to main content) */}
      <div style={{ 
        flex: 1,
        margin: '0 32px'
      }}>
        {/* Steps removed from header as requested */}
      </div>

      {/* Right: Conditional Buttons */}
      <div style={{ minWidth: '200px', textAlign: 'right' }}>
        {!user ? (
          // Logged-out users: Show auth buttons
          <Space size="middle">
            <Button
              type="text"
              icon={<LoginOutlined />}
              onClick={() => {
                setAuthContext('login');
                setShowAuthModal(true);
              }}
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
              style={{
                borderRadius: '6px'
              }}
            >
              Sign Up Free
            </Button>
          </Space>
        ) : isNewRegistration && showSaveProjectButton ? (
          // New registrations: Show Save Project button
          <Button
            type="primary"
            onClick={onSaveProject}
            style={{
              fontWeight: 600,
              borderRadius: '6px'
            }}
          >
            💾 Save Project
          </Button>
        ) : null}
      </div>

      {/* Mobile progress removed - steps now in main content */}
    </div>
  );
};

export default LoggedOutProgressHeader;