import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Alert, Space } from 'antd';
import { LockOutlined, MailOutlined, BankOutlined, LinkOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const RegisterModal = ({ onClose, onSwitchToLogin, context = null, onSuccess = null }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [referralInfo, setReferralInfo] = useState(null);
  const [form] = Form.useForm();
  const [detectedData, setDetectedData] = useState(null);
  const { register } = useAuth();

  useEffect(() => {
    // Extract company data from workflow analysis stored in localStorage
    const extractWorkflowData = () => {
      try {
        // Check for workflow progress data
        const progressKey = 'workflow_progress_anonymous';
        const workflowProgress = localStorage.getItem(progressKey);
        
        if (workflowProgress) {
          const parsed = JSON.parse(workflowProgress);
          const stepResults = parsed.stepResults;
          
          // Look for website analysis data
          if (stepResults?.websiteAnalysis) {
            const analysis = stepResults.websiteAnalysis;
            const detectedInfo = {
              websiteUrl: analysis.websiteUrl || analysis.url || '',
              businessName: analysis.businessName || analysis.companyName || '',
              autoDetected: true
            };

            if (detectedInfo.websiteUrl) {
              setDetectedData(detectedInfo);

              // Prepopulate form fields
              form.setFieldsValue({
                websiteUrl: detectedInfo.websiteUrl
              });
            }
          }
        }
      } catch (error) {
        console.log('No workflow data to extract:', error.message);
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
        <p style={{ color: '#666', margin: '0 0 16px 0' }}>
          Unlock all premium features instantly
        </p>
        
        <div style={{ 
          backgroundColor: '#f6ffed', 
          padding: '12px', 
          borderRadius: '6px', 
          border: '1px solid #b7eb8f',
          textAlign: 'left'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#52c41a', fontSize: '14px' }}>
            ✨ What you get with your account:
          </p>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#666' }}>
            <li>Access to all customer targeting strategies</li>
            <li>Unlimited content generation and regeneration</li>
            <li>Advanced content editing and customization</li>
            <li>Multiple export formats (HTML, Markdown, etc.)</li>
            <li>Save and manage all your blog posts</li>
          </ul>
        </div>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          style={{ marginBottom: '20px' }}
        />
      )}

      {detectedData && (
        <Alert
          message="Website Detected"
          description={`We detected your website from the analysis. You can modify this information below.`}
          type="info"
          style={{ marginBottom: '20px' }}
          showIcon
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
            { type: 'url', message: 'Please enter a valid website URL' }
          ]}
        >
          <Input
            prefix={<LinkOutlined />}
            placeholder="Website URL"
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