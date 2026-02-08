import React, { useState } from 'react';
import { Card, List, Tag, Button, Spin, Alert } from 'antd';
import { BulbOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';

const LLMInsightsPanel = ({ insights, onRefresh }) => {
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  if (!insights) {
    return (
      <Card
        title={
          <span>
            <BulbOutlined style={{ marginRight: 8 }} />
            AI-Powered Insights & Recommendations
          </span>
        }
      >
        <Spin tip="Loading insights..." />
      </Card>
    );
  }

  if (insights.error) {
    return (
      <Card
        title={
          <span>
            <BulbOutlined style={{ marginRight: 8 }} />
            AI-Powered Insights & Recommendations
          </span>
        }
      >
        <Alert
          message="Unable to generate insights"
          description={insights.error || 'LLM service unavailable'}
          type="warning"
          showIcon
        />
      </Card>
    );
  }

  const getImpactColor = (impact) => {
    const impactLower = (impact || '').toLowerCase();
    if (impactLower.includes('high')) return 'red';
    if (impactLower.includes('medium')) return 'orange';
    if (impactLower.includes('low')) return 'blue';
    return 'default';
  };

  const insightsList = insights.insights || [];

  return (
    <Card
      title={
        <span>
          <BulbOutlined style={{ marginRight: 8 }} />
          AI-Powered Insights & Recommendations
        </span>
      }
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={loading}
        >
          Regenerate
        </Button>
      }
    >
      {loading ? (
        <Spin tip="Generating new insights..." />
      ) : insightsList.length > 0 ? (
        <>
          <List
            dataSource={insightsList}
            renderItem={(insight, index) => (
              <List.Item
                key={index}
                extra={
                  insight.impact && (
                    <Tag color={getImpactColor(insight.impact)} icon={<ThunderboltOutlined />}>
                      {insight.impact} Impact
                    </Tag>
                  )
                }
              >
                <List.Item.Meta
                  title={<strong>{index + 1}. {insight.description}</strong>}
                  description={
                    <div style={{ marginTop: 8 }}>
                      {insight.action && (
                        <p>
                          <strong style={{ color: 'var(--color-primary)' }}>📌 Recommended Action:</strong><br />
                          {insight.action}
                        </p>
                      )}
                      {insight.expectedResult && (
                        <p>
                          <strong style={{ color: '#52c41a' }}>📈 Expected Result:</strong><br />
                          {insight.expectedResult}
                        </p>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />

          {insights.timestamp && (
            <div style={{ textAlign: 'right', marginTop: 16, fontSize: 12, color: 'var(--color-text-tertiary)' }}>
              Last updated: {new Date(insights.timestamp).toLocaleString()}
            </div>
          )}
        </>
      ) : (
        <Alert
          message="No insights available"
          description="Not enough data to generate insights yet. Keep tracking events and check back later."
          type="info"
          showIcon
        />
      )}
    </Card>
  );
};

export default LLMInsightsPanel;
