import React, { useState } from 'react';
import { Modal, Tabs, Typography } from 'antd';
import { LockOutlined, StarOutlined, ThunderboltOutlined } from '@ant-design/icons';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';

const { Title, Text } = Typography;

const AuthModal = ({ open, onClose, defaultTab = 'login', context = null, onSuccess = null }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

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
      {/* Premium Features Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '24px',
        padding: '20px',
        background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%)',
        borderRadius: '8px',
        border: '1px solid #91d5ff'
      }}>
        <LockOutlined style={{ 
          fontSize: '32px', 
          color: '#1890ff', 
          marginBottom: '12px',
          display: 'block' 
        }} />
        <Title level={3} style={{ margin: '0 0 8px 0', color: '#1890ff' }}>
          Unlock Premium Features
        </Title>
        <Text style={{ color: '#666', fontSize: '14px' }}>
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
            <StarOutlined style={{ fontSize: '20px', color: '#52c41a', display: 'block', marginBottom: '4px' }} />
            <Text style={{ fontSize: '12px', color: '#666' }}>Additional Strategies</Text>
          </div>
          <div style={{ textAlign: 'center' }}>
            <ThunderboltOutlined style={{ fontSize: '20px', color: '#fa8c16', display: 'block', marginBottom: '4px' }} />
            <Text style={{ fontSize: '12px', color: '#666' }}>Unlimited Content</Text>
          </div>
          <div style={{ textAlign: 'center' }}>
            <LockOutlined style={{ fontSize: '20px', color: '#722ed1', display: 'block', marginBottom: '4px' }} />
            <Text style={{ fontSize: '12px', color: '#666' }}>Premium Tools</Text>
          </div>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        centered
        items={items}
      />
    </Modal>
  );
};

export default AuthModal;