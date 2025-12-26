import React from 'react';
import { Modal, Button, Row, Col, Typography, Card, Tag, Space, Divider } from 'antd';
import { CheckOutlined, StarOutlined, CrownOutlined, UserAddOutlined } from '@ant-design/icons';

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
  // Pricing plans data
  const plans = [
    {
      id: 'payasyougo',
      name: 'Pay-as-you-go',
      price: 'Free',
      priceDetails: 'Then $15/post',
      description: '1 free blog post, then pay per post',
      icon: <StarOutlined />,
      color: '#52c41a',
      features: [
        '1 free high-quality blog post',
        'AI content generation with enhanced research',
        '2 strategy options',
        '2 topic ideas per post',
        'Export to all platforms'
      ],
      buttonText: user ? 'Current Plan' : 'Get Started Free',
      buttonType: 'default',
      popular: false
    },
    {
      id: 'creator',
      name: 'Creator',
      price: '$20',
      priceDetails: '/month',
      description: '4 blog posts per month',
      icon: <CheckOutlined />,
      color: '#1890ff',
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
      name: 'Professional',
      price: '$50',
      priceDetails: '/month',
      description: '8 blog posts + unlimited strategies',
      icon: <CrownOutlined />,
      color: '#722ed1',
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

  const handlePlanSelection = (planId) => {
    if (onSelectPlan) {
      onSelectPlan(planId);
    }
    onClose();
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
          {user ? (
            <Button
              type={plan.buttonType}
              size="large"
              block
              onClick={() => handlePlanSelection(plan.id)}
              style={{
                backgroundColor: plan.buttonType === 'primary' ? plan.color : undefined,
                borderColor: plan.color,
                height: '48px',
                fontWeight: '500'
              }}
            >
              {plan.buttonText}
            </Button>
          ) : plan.id === 'enterprise' ? (
            <Button
              type="primary"
              size="large"
              block
              onClick={() => handlePlanSelection(plan.id)}
              style={{
                backgroundColor: plan.color,
                borderColor: plan.color,
                height: '48px',
                fontWeight: '500'
              }}
            >
              {plan.buttonText}
            </Button>
          ) : (
            <Button
              type="primary"
              size="large"
              block
              onClick={handleCreateAccount}
              icon={<UserAddOutlined />}
              style={{
                backgroundColor: '#1890ff',
                borderColor: '#1890ff',
                height: '48px',
                fontWeight: '500'
              }}
            >
              Create Account
            </Button>
          )}
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