import React, { useState, useEffect } from 'react';
import { Modal, Tabs } from 'antd';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import { useAnalytics } from '../../contexts/AnalyticsContext';

const AuthModal = ({ open, onClose, defaultTab = 'login', context = null, onSuccess = null }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { trackPageView, trackClick } = useAnalytics();

  // Update activeTab when defaultTab changes or modal opens (Fixes #95)
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

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
      children: <LoginModal onClose={onClose} context={context} onSuccess={onSuccess} />,
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