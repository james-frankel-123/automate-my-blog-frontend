import React from 'react';
import { Card, Tabs, Typography, Tag, Button, Row, Col } from 'antd';
import { UserOutlined, BankOutlined, CreditCardOutlined, StarOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const ProfileSettings = () => (
  <div style={{ padding: '20px 0' }}>
    <h4>Profile Settings</h4>
    <p>Profile management coming soon...</p>
  </div>
);

const OrganizationSettings = () => (
  <div style={{ padding: '20px 0' }}>
    <h4>Organization Settings</h4>
    <p>Organization management coming soon...</p>
  </div>
);

const BillingSettings = () => (
  <div style={{ padding: '20px 0' }}>
    <h4>Billing Settings</h4>
    <p>Billing management coming soon...</p>
  </div>
);

const SubscriptionSettings = () => (
  <div style={{ padding: '20px 0' }}>
    <Card style={{ marginBottom: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>Current Plan</Title>
        </Col>
        <Col>
          <Tag color="green" icon={<StarOutlined />}>
            Pay-as-you-go
          </Tag>
        </Col>
      </Row>
      
      <Paragraph style={{ color: '#666', marginBottom: '16px' }}>
        You're currently on the Pay-as-you-go plan. You get 1 free blog post, then pay $15 per additional post.
      </Paragraph>
      
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Text style={{ fontSize: '24px', fontWeight: 600, color: '#52c41a' }}>1</Text>
            <br />
            <Text style={{ color: '#666', fontSize: '12px' }}>Free Post Used</Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Text style={{ fontSize: '24px', fontWeight: 600, color: '#1890ff' }}>0</Text>
            <br />
            <Text style={{ color: '#666', fontSize: '12px' }}>Paid Posts This Month</Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Text style={{ fontSize: '24px', fontWeight: 600, color: '#722ed1' }}>$0</Text>
            <br />
            <Text style={{ color: '#666', fontSize: '12px' }}>Current Month Total</Text>
          </Card>
        </Col>
      </Row>
      
      <Button type="primary" size="large">
        Upgrade Plan
      </Button>
    </Card>
    
    <Card>
      <Title level={4}>Available Plans</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card size="small" style={{ border: '2px solid #52c41a' }}>
            <Text strong style={{ color: '#52c41a' }}>Pay-as-you-go</Text>
            <br />
            <Text style={{ fontSize: '20px', fontWeight: 600 }}>$15</Text>
            <Text style={{ color: '#666' }}>/post</Text>
            <br />
            <Text style={{ fontSize: '12px', color: '#666' }}>Current Plan</Text>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card size="small">
            <Text strong style={{ color: '#1890ff' }}>Creator</Text>
            <br />
            <Text style={{ fontSize: '20px', fontWeight: 600 }}>$20</Text>
            <Text style={{ color: '#666' }}>/month</Text>
            <br />
            <Text style={{ fontSize: '12px', color: '#666' }}>4 posts/month</Text>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card size="small">
            <Text strong style={{ color: '#722ed1' }}>Professional</Text>
            <br />
            <Text style={{ fontSize: '20px', fontWeight: 600 }}>$50</Text>
            <Text style={{ color: '#666' }}>/month</Text>
            <br />
            <Text style={{ fontSize: '12px', color: '#666' }}>8 posts + unlimited strategies</Text>
          </Card>
        </Col>
      </Row>
    </Card>
  </div>
);

const SettingsTab = () => {
  const items = [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
      children: <ProfileSettings />,
    },
    {
      key: 'subscriptions',
      label: 'Subscriptions',
      icon: <StarOutlined />,
      children: <SubscriptionSettings />,
    },
    {
      key: 'organization',
      label: 'Organization',
      icon: <BankOutlined />,
      children: <OrganizationSettings />,
    },
    {
      key: 'billing',
      label: 'Billing',
      icon: <CreditCardOutlined />,
      children: <BillingSettings />,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Settings">
        <Tabs items={items} />
      </Card>
    </div>
  );
};

export default SettingsTab;