import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Typography, Card, Tag, Space, Divider, message, Alert } from 'antd';
import { CheckOutlined, StarOutlined, CrownOutlined, UserAddOutlined, LoadingOutlined, GiftOutlined, CopyOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { useAnalytics } from '../../contexts/AnalyticsContext';

const { Title, Text, Paragraph } = Typography;

/**
 * PricingModal component
 * Shows pricing plans with conditional UI based on user authentication status
 */
const PricingModal = ({
  open,
  onClose,
  user,
  onCreateAccount,
  onSelectPlan
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const { trackPageView, trackClick, trackFunnelStep, trackEvent } = useAnalytics();

  // Track when pricing modal is opened
  useEffect(() => {
    if (open) {
      trackPageView('pricing_modal', { isAuthenticated: !!user });
      trackFunnelStep('view_pricing');
      
      // Track pricing_modal_opened event
      trackEvent('pricing_modal_opened', {
        isAuthenticated: !!user
      }).catch(err => console.error('Failed to track pricing_modal_opened:', err));
    }
  }, [open, user, trackPageView, trackFunnelStep]);

  // Stripe Price ID mapping
  const stripePriceMap = {
    'single_post': 'price_1Sss0a6S2Lijk9r3LM6pJne5', // $15 one-time
    'creator': 'price_1Sss3P6S2Lijk9r38JjgJN4u', // $19.99/month
    'professional': 'price_1Sss4P6S2Lijk9r3MULOqp1B' // $49.99/month
  };

  // Pricing plans data
  const plans = [
    {
      id: 'payasyougo',
      stripeKey: 'single_post',
      name: 'Single Post',
      price: '$15',
      priceDetails: 'one-time',
      description: 'Purchase a single blog post',
      icon: <StarOutlined />,
      color: '#52c41a',
      planType: 'one_time',
      features: [
        '1 high-quality blog post',
        'AI content generation with enhanced research',
        'SEO optimization',
        'Multiple topic ideas',
        'Export to all platforms'
      ],
      buttonText: 'Buy Single Post',
      buttonType: 'default',
      popular: false
    },
    {
      id: 'creator',
      stripeKey: 'creator',
      name: 'Creator',
      price: '$20',
      priceDetails: '/month',
      description: '4 blog posts per month',
      icon: <CheckOutlined />,
      color: '#1890ff',
      planType: 'subscription',
      features: [
        '4 blog posts per month included',
        'AI content generation with enhanced research',
        'Up to 4 strategy options',
        '4 topic ideas per post',
        'Export to all platforms'
      ],
      buttonText: 'Choose Creator',
      buttonType: 'primary',
      popular: true
    },
    {
      id: 'professional',
      stripeKey: 'professional',
      name: 'Professional',
      price: '$50',
      priceDetails: '/month',
      description: '8 blog posts + unlimited strategies',
      icon: <CrownOutlined />,
      color: '#722ed1',
      planType: 'subscription',
      features: [
        '8 blog posts per month included',
        'AI content generation with enhanced research',
        'Unlimited strategy options',
        'Unlimited topic ideas per post',
        'Export to all platforms'
      ],
      buttonText: 'Choose Professional',
      buttonType: 'primary',
      popular: false
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      priceDetails: 'Pricing',
      description: 'For teams and agencies',
      icon: <CrownOutlined />,
      color: '#8B5CF6',
      features: [
        'Unlimited blog posts',
        'Everything in Professional',
        'Custom integrations (coming soon)',
        'Multi-website support (coming soon)',
        'Priority support (coming soon)',
        'Dedicated account manager'
      ],
      buttonText: 'Contact Sales',
      buttonType: 'primary',
      popular: false
    }
  ];

  const handlePlanSelection = async (plan) => {
    // Track plan selection click
    trackClick('pricing_plan_select', plan.id, {
      planName: plan.name,
      price: plan.price,
      planType: plan.planType
    });

    // Handle enterprise/custom plan
    if (plan.id === 'enterprise') {
      message.info('Please contact sales@automatemyblog.com for Enterprise pricing');
      trackClick('contact_sales', 'enterprise');
      return;
    }

    // If user is not logged in, prompt to create account
    if (!user) {
      trackFunnelStep('signup_initiated', { source: 'pricing_modal', planId: plan.id });
      if (onCreateAccount) {
        onCreateAccount();
      }
      return;
    }

    try {
      setLoading(true);
      setSelectedPlanId(plan.id);

      // Track checkout initiation
      trackFunnelStep('initiate_checkout', {
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        planType: plan.planType
      });

      // Get Stripe Price ID
      const priceId = stripePriceMap[plan.stripeKey];
      if (!priceId) {
        throw new Error('Invalid plan selected');
      }

      console.log(`Creating checkout session for ${plan.name}, priceId: ${priceId}, planType: ${plan.planType}`);

      // Create checkout session
      const response = await api.createCheckoutSession(priceId, plan.planType);

      if (response.success && response.url) {
        console.log('✅ Checkout session created, redirecting to:', response.url);

        // Track successful checkout redirect
        trackFunnelStep('checkout_redirect', {
          planId: plan.id,
          planName: plan.name,
          sessionId: response.sessionId
        });

        // Redirect to Stripe checkout
        window.location.href = response.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      message.error('Failed to start checkout. Please try again.');

      // Track checkout failure
      trackClick('checkout_failed', plan.id, {
        error: error.message,
        planName: plan.name
      });

      setLoading(false);
      setSelectedPlanId(null);
    }
  };

  const handleCreateAccount = () => {
    if (onCreateAccount) {
      onCreateAccount();
    }
  };

  const renderPlanCard = (plan) => (
    <Col key={plan.id} xs={24} lg={8}>
      <Card
        style={{
          height: '100%',
          border: plan.popular ? `2px solid ${plan.color}` : '1px solid #f0f0f0',
          borderRadius: '12px',
          position: 'relative'
        }}
      >
        {plan.popular && (
          <div style={{
            position: 'absolute',
            top: '-10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1
          }}>
            <Tag color={plan.color} style={{
              fontSize: '12px',
              fontWeight: 600,
              padding: '4px 16px',
              borderRadius: '20px'
            }}>
              MOST POPULAR
            </Tag>
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '20px', marginTop: plan.popular ? '10px' : '0' }}>
          <div style={{ 
            fontSize: '32px', 
            color: plan.color,
            marginBottom: '8px'
          }}>
            {plan.icon}
          </div>
          
          <Title level={3} style={{ 
            margin: '0 0 8px 0',
            color: plan.color 
          }}>
            {plan.name}
          </Title>
          
          <div style={{ marginBottom: '8px' }}>
            <Text style={{ 
              fontSize: '32px', 
              fontWeight: 600,
              color: '#333'
            }}>
              {plan.price}
            </Text>
            <Text style={{ 
              fontSize: '16px',
              color: '#666',
              marginLeft: '4px'
            }}>
              {plan.priceDetails}
            </Text>
          </div>
          
          <Text style={{ 
            color: '#666',
            fontSize: '14px'
          }}>
            {plan.description}
          </Text>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {plan.features.map((feature, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckOutlined style={{ color: plan.color, fontSize: '14px' }} />
                <Text style={{ fontSize: '14px' }}>{feature}</Text>
              </div>
            ))}
          </Space>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <Button
            type={plan.buttonType}
            size="large"
            block
            onClick={() => handlePlanSelection(plan)}
            loading={loading && selectedPlanId === plan.id}
            disabled={loading && selectedPlanId !== plan.id}
            icon={!user && plan.id !== 'enterprise' ? <UserAddOutlined /> : undefined}
            style={{
              backgroundColor: plan.buttonType === 'primary' ? plan.color : undefined,
              borderColor: plan.color,
              height: '48px',
              fontWeight: '500'
            }}
          >
            {loading && selectedPlanId === plan.id ? 'Loading...' : (
              !user && plan.id !== 'enterprise' ? 'Create Account' : plan.buttonText
            )}
          </Button>
        </div>
      </Card>
    </Col>
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1000}
      centered
      title={null}
      style={{ top: 20 }}
    >
      <div style={{ padding: '20px 0' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>
            Generate More Posts
          </Title>
          <Paragraph style={{ 
            fontSize: '16px', 
            color: '#666',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {user 
              ? 'Choose a plan to unlock unlimited content creation and premium features.'
              : 'Create an account to access more blog posts and premium features.'
            }
          </Paragraph>
        </div>

        {/* Referral Option - Get Free Posts */}
        {user && (
          <Alert
            message={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GiftOutlined style={{ fontSize: '18px', color: '#52c41a' }} />
                <strong>Free Option: Refer Friends!</strong>
              </div>
            }
            description={
              <div>
                <p style={{ margin: '8px 0' }}>
                  Get <strong>1 free blog post</strong> for every friend who signs up using your referral link.
                  Your friend also gets 1 free post! It's a win-win.
                </p>
                <Button
                  type="link"
                  icon={<CopyOutlined />}
                  onClick={() => {
                    // Navigate to referrals tab
                    onClose();
                    // You may need to trigger navigation to Settings > Referrals tab
                    message.info('Go to Settings > Referrals to get your referral link');
                  }}
                  style={{ padding: 0, height: 'auto' }}
                >
                  View My Referral Link
                </Button>
              </div>
            }
            type="success"
            style={{ marginBottom: '32px' }}
            showIcon
          />
        )}

        {/* Pricing Plans */}
        <Row gutter={[24, 24]}>
          {plans.map(plan => renderPlanCard(plan))}
        </Row>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Divider />
          <Text style={{ color: '#666', fontSize: '14px' }}>
            All plans include AI content generation with enhanced research and export functionality
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default PricingModal;