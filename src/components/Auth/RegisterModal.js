import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Alert, Space } from 'antd';
import { LockOutlined, MailOutlined, LinkOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';

const RegisterModal = ({ onClose, onSwitchToLogin, context = null, onSuccess = null }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [referralInfo, setReferralInfo] = useState(null);
  const [form] = Form.useForm();
  const { register } = useAuth();
  const { trackFormSubmit, trackFunnelStep, trackEvent } = useAnalytics();

  // Track when registration modal is opened
  useEffect(() => {
    trackEvent('signup_started', { context });
  }, [trackEvent, context]);

  useEffect(() => {
    // Extract company data from workflow analysis stored in localStorage
    const extractWorkflowData = () => {
      try {
        // Check for workflow state data
        const workflowState = localStorage.getItem('automate-my-blog-workflow-state');
        if (!workflowState) return;

        const parsed = JSON.parse(workflowState);
        const analysis = parsed.stepResults?.home?.websiteAnalysis;

        if (analysis) {
          const detectedInfo = {
            websiteUrl: analysis.websiteUrl || analysis.url || '',
            businessName: analysis.businessName || analysis.companyName || '',
            autoDetected: true
          };
          if (detectedInfo.websiteUrl) {
            form.setFieldsValue({
              websiteUrl: detectedInfo.websiteUrl
            });
          }
        }
      } catch (error) {
        console.error('❌ Error extracting workflow data:', error);
      }
    };

    extractWorkflowData();
  }, [form]);

  const onFinish = async (values) => {
    setLoading(true);
    setError('');

    try {
      const result = await register({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        organizationName: values.firstName + "'s Blog", // Auto-generate from first name
        websiteUrl: values.websiteUrl,
      }, context);

      // Track successful registration
      trackFormSubmit('register', true, {
        context,
        referralProcessed: result.referralProcessed,
        referralType: result.referralType
      });
      trackFunnelStep('signed_up');

      // Check if referral was processed
      if (result.referralProcessed) {
        setReferralInfo({
          type: result.referralType,
          rewardValue: result.rewardValue
        });
      }

      setSuccess(true);

      // Call success callback after successful registration
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.');

      // Track failed registration attempt
      trackFormSubmit('register', false, { error: error.message, context });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <Alert
          message="Account Created Successfully!"
          description="Your account has been created and you are now signed in."
          type="success"
          style={{ marginBottom: '20px' }}
        />
        
        {/* Show referral success message */}
        {referralInfo?.type === 'customer' && (
          <Alert
            message="🎉 Referral Bonus Activated!"
            description="You've received 1 free blog post! Your friend who referred you also got 1 free blog post. Check the Settings > Referrals tab to see your rewards."
            type="success"
            style={{ marginBottom: '20px' }}
          />
        )}
        
        {referralInfo?.type === 'organization' && (
          <Alert
            message="Welcome to the Team!"
            description="You've been added to the organization and can now collaborate with your team members."
            type="info"
            style={{ marginBottom: '20px' }}
          />
        )}
        
        <Button type="primary" onClick={onClose}>
          Get Started
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2>Create Your Free Account</h2>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          style={{ marginBottom: '20px' }}
        />
      )}

      <Form
        form={form}
        name="register"
        onFinish={onFinish}
        autoComplete="off"
        layout="vertical"
      >
        <Space.Compact style={{ width: '100%' }}>
          <Form.Item
            name="firstName"
            style={{ width: '50%', marginBottom: '16px' }}
            rules={[{ required: true, message: 'First name required' }]}
          >
            <Input
              placeholder="First name"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="lastName"
            style={{ width: '50%', marginBottom: '16px' }}
            rules={[{ required: true, message: 'Last name required' }]}
          >
            <Input
              placeholder="Last name"
              size="large"
            />
          </Form.Item>
        </Space.Compact>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="Email address"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="websiteUrl"
          rules={[
            { required: true, message: 'Please enter your website URL' },
            {
              validator(_, value) {
                if (!value) {
                  return Promise.resolve();
                }
                // Accept URLs with or without protocol, with or without www
                // Examples: example.com, www.example.com, https://example.com, http://www.example.com
                const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/;
                if (urlPattern.test(value)) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Please enter a valid website URL (e.g., example.com)'));
              }
            }
          ]}
        >
          <Input
            prefix={<LinkOutlined />}
            placeholder="Website URL (e.g., example.com)"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: 'Please enter your password' },
            { min: 8, message: 'Password must be at least 8 characters' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Password"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Passwords do not match'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Confirm password"
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            style={{ width: '100%' }}
          >
            Create Account
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default RegisterModal;