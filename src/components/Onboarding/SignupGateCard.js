/**
 * SignupGateCard — embedded Register | Sign In (not modal). White card. Issue #261.
 */
import React, { useState } from 'react';
import { Card, Tabs, Form, Input, Button, Typography, message } from 'antd';
import { useAuth } from '../../contexts/AuthContext';

const { Text } = Typography;

export function SignupGateCard({ onSuccess, dataTestId = 'signup-gate-card' }) {
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const [form] = Form.useForm();
  const [signInForm] = Form.useForm();

  const handleRegister = async (values) => {
    setLoading(true);
    try {
      await register({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        websiteUrl: values.websiteUrl,
        organizationName: values.websiteUrl,
      });
      message.success('Account created. Continuing…');
      onSuccess?.();
    } catch (e) {
      message.error(e?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (values) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      message.success('Signed in. Continuing…');
      onSuccess?.();
    } catch (e) {
      message.error(e?.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      data-testid={dataTestId}
      style={{
        background: 'var(--color-background-elevated)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-card)',
        maxWidth: 480,
        margin: '0 auto',
      }}
      title={<Text strong style={{ color: 'var(--color-text-primary)' }}>Claim your free article</Text>}
    >
      <Tabs
        items={[
          {
            key: 'register',
            label: 'Register',
            children: (
              <Form form={form} onFinish={handleRegister} layout="vertical">
                <Form.Item name="firstName" rules={[{ required: true, message: 'First name is required' }]} label="First name">
                  <Input placeholder="First name" />
                </Form.Item>
                <Form.Item name="lastName" rules={[{ required: true, message: 'Last name is required' }]} label="Last name">
                  <Input placeholder="Last name" />
                </Form.Item>
                <Form.Item name="websiteUrl" rules={[{ required: true, message: 'Website is required' }]} label="Website">
                  <Input placeholder="https://yoursite.com" />
                </Form.Item>
                <Form.Item name="email" rules={[{ required: true, type: 'email' }]} label="Email">
                  <Input placeholder="you@example.com" />
                </Form.Item>
                <Form.Item name="password" rules={[{ required: true, min: 8 }]} label="Password">
                  <Input.Password placeholder="Min 8 characters" />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                  Create account
                </Button>
              </Form>
            ),
          },
          {
            key: 'signin',
            label: 'Sign In',
            children: (
              <Form form={signInForm} onFinish={handleSignIn} layout="vertical">
                <Form.Item name="email" rules={[{ required: true, type: 'email' }]} label="Email">
                  <Input placeholder="you@example.com" />
                </Form.Item>
                <Form.Item name="password" rules={[{ required: true }]} label="Password">
                  <Input.Password placeholder="Password" />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                  Sign in
                </Button>
              </Form>
            ),
          },
        ]}
      />
    </Card>
  );
}

export default SignupGateCard;
