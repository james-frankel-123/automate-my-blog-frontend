import React, { useState } from 'react';
import { Form, Input, Button, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const LoginModal = ({ onClose, context = null, onSuccess = null }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    
    try {
      await login(values.email, values.password, context);
      onClose();
      
      // Call success callback after successful login
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2>Welcome Back</h2>
        <p style={{ color: '#666', margin: 0 }}>
          Sign in to your AutoBlog account
        </p>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          style={{ marginBottom: '20px' }}
        />
      )}

      <Form
        name="login"
        onFinish={onFinish}
        autoComplete="off"
        layout="vertical"
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Email address"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please enter your password' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Password"
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              style={{ width: '100%' }}
            >
              Sign In
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default LoginModal;