import React from 'react';
import { Card, Button, Typography, Space, Spin } from 'antd';
import { CheckCircleOutlined, LinkOutlined } from '@ant-design/icons';
import './FeatureTile.css';

const { Title, Paragraph } = Typography;

const FeatureTile = ({
  title,
  icon, // Ant Design icon component
  connected, // boolean - is service connected?
  summary, // LLM-generated summary text (if connected)
  loading = false,
  onConnect, // Handler for "Connect" button
  onViewDetails // Handler for "View Details" link
}) => {
  return (
    <Card
      hoverable
      className={`feature-tile ${connected ? 'connected' : 'disconnected'}`}
      style={{
        height: '100%',
        minHeight: 220,
        border: connected ? '2px solid var(--color-success)' : '2px solid var(--color-border-base)'
      }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontSize: 32, color: 'var(--color-primary)' }}>
            {icon}
          </div>
          {connected && (
            <CheckCircleOutlined style={{ fontSize: 20, color: 'var(--color-success)' }} />
          )}
        </div>

        {/* Title */}
        <Title level={4} style={{ marginBottom: 0 }}>
          {title}
        </Title>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Spin />
          </div>
        ) : connected ? (
          // Connected: Show LLM summary
          <>
            <Paragraph
              type="secondary"
              ellipsis={{ rows: 3 }}
              style={{ marginBottom: 0, fontSize: 13, lineHeight: 1.6 }}
            >
              {summary || 'No recent activity'}
            </Paragraph>
            <Button type="link" onClick={onViewDetails} style={{ padding: 0 }}>
              View Details →
            </Button>
          </>
        ) : (
          // Not connected: Show description and connect CTA
          <>
            <Paragraph
              type="secondary"
              style={{ marginBottom: 12, fontSize: 13, lineHeight: 1.6 }}
            >
              {summary || 'Connect to view insights and analytics'}
            </Paragraph>
            <Button
              type="primary"
              icon={<LinkOutlined />}
              onClick={onConnect}
              style={{ marginTop: 8 }}
            >
              Connect
            </Button>
          </>
        )}
      </Space>
    </Card>
  );
};

export default FeatureTile;
