import React from 'react';
import { Card, List, Tag, Alert, Statistic, Row, Col } from 'antd';
import { BulbOutlined, TeamOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const ProductSectionPanel = ({ productData, loading, platformMetrics }) => {
  if (!productData) return null;

  const { title, insights = [], impactedUserCount, priority } = productData;

  // Calculate feature adoption metrics from platform data
  const totalUsers = platformMetrics?.total_users || 1;
  const featureAdoptionData = [
    {
      feature: 'Subscriptions',
      adoption: ((platformMetrics?.total_paying_users || 0) / totalUsers * 100).toFixed(1),
      users: platformMetrics?.total_paying_users || 0
    },
    {
      feature: 'Referrals',
      adoption: ((platformMetrics?.total_referrals || 0) / totalUsers * 100).toFixed(1),
      users: platformMetrics?.total_referrals || 0
    },
    {
      feature: 'Referral Credits Used',
      adoption: platformMetrics?.referral_posts_granted > 0
        ? ((platformMetrics?.referral_posts_used || 0) / platformMetrics?.referral_posts_granted * 100).toFixed(1)
        : 0,
      users: platformMetrics?.referral_posts_used || 0
    },
    {
      feature: 'Active (30d)',
      adoption: ((platformMetrics?.active_users || 0) / totalUsers * 100).toFixed(1),
      users: platformMetrics?.active_users || 0
    }
  ];

  const getBarColor = (adoption) => {
    const rate = parseFloat(adoption);
    if (rate >= 50) return '#52c41a'; // Green
    if (rate >= 25) return '#faad14'; // Orange
    return '#ff4d4f'; // Red
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BulbOutlined style={{ fontSize: 24, color: '#faad14' }} />
          <span>{title}</span>
          {priority === 'backlog' && (
            <Tag color="blue">PRODUCT BACKLOG</Tag>
          )}
        </div>
      }
      loading={loading}
      style={{ marginTop: 16 }}
    >
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Statistic
            title="Product Improvement Ideas"
            value={insights.length}
            prefix={<BulbOutlined />}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Potentially Impacted Users"
            value={impactedUserCount || 0}
            prefix={<TeamOutlined />}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Feature Adoption Rate"
            value={featureAdoptionData.length > 0
              ? (featureAdoptionData.reduce((sum, f) => sum + parseFloat(f.adoption), 0) / featureAdoptionData.length).toFixed(1)
              : 0}
            suffix="%"
          />
        </Col>
      </Row>

      {/* Feature Adoption Chart */}
      <Card
        title="Feature Adoption Rates"
        size="small"
        style={{ marginBottom: 16 }}
      >
        {featureAdoptionData.length === 0 ? (
          <Alert
            message="No feature data available"
            description="Unable to calculate feature adoption metrics."
            type="info"
            showIcon
          />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={featureAdoptionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="feature" angle={-15} textAnchor="end" height={80} />
              <YAxis label={{ value: 'Adoption %', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'adoption') return [`${value}%`, 'Adoption Rate'];
                  return [value, name];
                }}
              />
              <Legend />
              <Bar dataKey="adoption" name="Adoption Rate (%)">
                {featureAdoptionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.adoption)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        <div style={{ marginTop: 16, padding: '8px 16px', background: '#f5f5f5', borderRadius: 4 }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 8 }}>
            <strong>Legend:</strong>
            <span style={{ marginLeft: 8 }}>
              <span style={{ color: '#52c41a' }}>■</span> Healthy (≥50%)
            </span>
            <span style={{ marginLeft: 12 }}>
              <span style={{ color: '#faad14' }}>■</span> Needs Attention (25-49%)
            </span>
            <span style={{ marginLeft: 12 }}>
              <span style={{ color: '#ff4d4f' }}>■</span> Critical (&lt;25%)
            </span>
          </div>
          {featureAdoptionData.map((feature, idx) => (
            <div key={idx} style={{ fontSize: 12, marginBottom: 4 }}>
              <strong>{feature.feature}:</strong> {feature.users} users ({feature.adoption}% adoption)
            </div>
          ))}
        </div>
      </Card>

      {/* Insights List */}
      {insights.length === 0 ? (
        <Alert
          message="No product improvements needed"
          description="Current product adoption and feature usage are healthy. Continue monitoring engagement metrics."
          type="success"
          showIcon
        />
      ) : (
        <List
          dataSource={insights}
          renderItem={(insight, index) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <div>
                    <Tag color={insight.priority === 'Medium' ? 'orange' : 'blue'}>
                      {insight.priority}
                    </Tag>
                    <strong>#{index + 1}: {insight.title}</strong>
                  </div>
                }
                description={
                  <div style={{ marginTop: 8 }}>
                    <p>
                      <strong style={{ color: '#722ed1' }}>👥 User/Segment:</strong><br />
                      {insight.userSegment}
                    </p>
                    <p>
                      <strong style={{ color: 'var(--color-primary)' }}>🛠️ Action:</strong><br />
                      {insight.action}
                    </p>
                    <p>
                      <strong style={{ color: '#52c41a' }}>📊 Expected Result:</strong><br />
                      {insight.expectedResult}
                    </p>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

export default ProductSectionPanel;
