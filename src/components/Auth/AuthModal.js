import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Typography } from 'antd';
import { LockOutlined, StarOutlined, ThunderboltOutlined } from '@ant-design/icons';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import { useAnalytics } from '../../contexts/AnalyticsContext';

const { Title, Text } = Typography;

const AuthModal = ({ open, onClose, defaultTab = 'login', context = null, onSuccess = null, sessionExpiredMessage = null }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { trackPageView, trackClick } = useAnalytics();

  // Track when auth modal is opened
  useEffect(() => {
    if (open) {
      trackPageView('auth_modal', { initialTab: defaultTab, context });
    }
  }, [open, defaultTab, context, trackPageView]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    trackClick('auth_tab_switch', key, { from: activeTab, to: key });
  };

  const items = [
    {
      key: 'login',
      label: 'Sign In',
      children: <LoginModal onClose={onClose} context={context} onSuccess={onSuccess} sessionExpiredMessage={sessionExpiredMessage} />,
    },
    {
      key: 'register',
      label: 'Create Account',
      children: <RegisterModal onClose={onClose} onSwitchToLogin={() => setActiveTab('login')} context={context} onSuccess={onSuccess} />,
    },
  ];

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      centered
    >
      {/* Premium Features Header */}
      <div style={{ 
        textAlign: 'center',
        marginBottom: '24px',
        padding: '20px',
        background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-primary-100) 100%)',
        borderRadius: '8px',
        border: '1px solid var(--color-primary-200)'
      }}>
        <LockOutlined style={{ 
          fontSize: '32px', 
          color: 'var(--color-primary)', 
          marginBottom: '12px',
          display: 'block' 
        }} />
        <Title level={3} style={{ margin: '0 0 8px 0', color: 'var(--color-primary)' }}>
          Unlock Premium Features
        </Title>
        <Text style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Get access to advanced strategies, unlimited content generation, and premium tools
        </Text>
        
        <div style={{ 
          marginTop: '16px', 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          <div style={{ textAlign: 'center' }}>
            <StarOutlined style={{ fontSize: '20px', color: 'var(--color-success)', display: 'block', marginBottom: '4px' }} />
            <Text style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Additional Strategies</Text>
          </div>
          <div style={{ textAlign: 'center' }}>
            <ThunderboltOutlined style={{ fontSize: '20px', color: 'var(--color-warning)', display: 'block', marginBottom: '4px' }} />
            <Text style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Unlimited Content</Text>
          </div>
          <div style={{ textAlign: 'center' }}>
            <LockOutlined style={{ fontSize: '20px', color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }} />
            <Text style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Premium Tools</Text>
          </div>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        centered
        items={items}
      />
    </Modal>
  );
};

export default AuthModal;