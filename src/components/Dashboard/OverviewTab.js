import React from 'react';
import { Card, Row, Col, Statistic, Button, Space } from 'antd';
import {
  FileTextOutlined,
  FolderOutlined,
  EyeOutlined,
  TrophyOutlined,
  PlusOutlined,
} from '@ant-design/icons';

const OverviewTab = () => {
  return (
    <div style={{ padding: '24px' }}>
      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Posts"
              value={23}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: 'var(--color-success)' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Projects"
              value={4}
              prefix={<FolderOutlined />}
              valueStyle={{ color: 'var(--color-primary)' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Views"
              value={1284}
              prefix={<EyeOutlined />}
              valueStyle={{ color: 'var(--color-primary)' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Engagement"
              value={93}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: 'var(--color-error)' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card title="Quick Actions" style={{ marginBottom: '24px' }}>
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} size="large">
            New Blog Post
          </Button>
          <Button icon={<FolderOutlined />} size="large">
            New Project
          </Button>
          <Button icon={<EyeOutlined />} size="large">
            View Analytics
          </Button>
        </Space>
      </Card>

      {/* Recent Activity */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Recent Posts" extra={<a href="#posts">View All</a>}>
            <div style={{ color: 'var(--color-text-secondary)' }}>
              Your recent blog posts will appear here once you create them.
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Recent Projects" extra={<a href="#projects">View All</a>}>
            <div style={{ color: 'var(--color-text-secondary)' }}>
              Your recent projects will appear here once you create them.
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OverviewTab;