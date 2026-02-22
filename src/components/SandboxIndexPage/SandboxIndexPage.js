/**
 * SandboxIndexPage — Staging-only index of testbed and sandbox links.
 * Route: /sandbox (only rendered when REACT_APP_STAGING === 'true').
 */
import React from 'react';
import { Card, Typography, List, Alert, Space } from 'antd';
import {
  ExperimentOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  DashboardOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import SEOHead from '../SEOHead';

const { Title, Text } = Typography;

const TESTBED_LINKS = [
  {
    path: '/streaming-testbed',
    title: 'Streaming parser testbed',
    description: 'Streaming blog generation, chunk parsing, and preview. Same flow as Posts tab.',
    icon: <ExperimentOutlined />,
  },
  {
    path: '/calendar-testbed',
    title: 'Content calendar testbed',
    description: '7-day content calendar states, live API + mock UIs.',
    icon: <CalendarOutlined />,
  },
  {
    path: '/component-library',
    title: 'Component library',
    description: 'Shared UI components for testing and iteration.',
    icon: <AppstoreOutlined />,
  },
  {
    path: '/dashboard',
    title: 'Dashboard → Sandbox tab',
    description: 'Blog Post Generation (Voice comparison), Visual Content, Content Discovery, Calendar preview. Super-admin only.',
    icon: <DashboardOutlined />,
  },
];

function SandboxIndexPage() {
  const isStaging = process.env.REACT_APP_STAGING === 'true';

  if (!isStaging) {
    return (
      <>
        <SEOHead title="Sandbox" />
        <div style={{ padding: '24px', maxWidth: 600, margin: '0 auto' }}>
          <Alert
            message="Not available"
            description="This page is only available on the staging environment."
            type="warning"
            showIcon
          />
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead title="Sandbox & Testbeds" />
      <div style={{ padding: '24px', maxWidth: 720, margin: '0 auto' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Title level={2} style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
              <ExperimentOutlined style={{ marginRight: 12, color: 'var(--color-primary)' }} />
              Sandbox & Testbeds
            </Title>
            <Text type="secondary">
              Staging-only index. Links to testbeds and sandbox components for QA and development.
            </Text>
          </div>

          <Card>
            <List
              itemLayout="vertical"
              dataSource={TESTBED_LINKS}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={item.icon}
                    title={
                      <a href={item.path} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <LinkOutlined />
                        {item.title}
                      </a>
                    }
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Space>
      </div>
    </>
  );
}

export default SandboxIndexPage;
