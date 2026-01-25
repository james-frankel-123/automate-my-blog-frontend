import React from 'react';
import { Card, List, Tag, Alert, Statistic, Row, Col, Progress } from 'antd';
import { FunnelPlotOutlined, WarningOutlined } from '@ant-design/icons';

const FunnelSectionPanel = ({ funnelData, loading, funnelVisualizationData }) => {
  if (!funnelData) return null;

  const { title, insights = [], atRiskCount, potentialChurnCost, priority } = funnelData;

  // Process funnel visualization data
  const funnelSteps = funnelVisualizationData?.steps || [];

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FunnelPlotOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <span>{title}</span>
          {priority === 'monitor' && (
            <Tag color="orange">REQUIRES MONITORING</Tag>
          )}
        </div>
      }
      loading={loading}
      style={{ marginTop: 16 }}
    >
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Statistic
            title="At-Risk Users"
            value={atRiskCount || 0}
            prefix={atRiskCount > 5 ? <WarningOutlined style={{ color: '#faad14' }} /> : null}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Potential Monthly Churn Cost"
            value={potentialChurnCost || 0}
            prefix="$"
            suffix="/mo"
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Funnel Conversion Steps"
            value={funnelSteps.length}
            suffix="stages"
          />
        </Col>
      </Row>

      {/* Visual Funnel */}
      {funnelSteps.length > 0 && (
        <Card
          title="Conversion Funnel Visualization"
          size="small"
          style={{ marginBottom: 16 }}
        >
          <div style={{ padding: '16px 0' }}>
            {funnelSteps.map((step, index) => {
              // Use 100% for first step (no previous step to convert from), otherwise use provided conversion_rate
              const conversionRate = step.conversion_rate !== undefined ? step.conversion_rate : 100;
              const isLowConversion = conversionRate <= 50;
              return (
                <div key={index} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{step.step}</span>
                    <span>
                      <strong>{step.count}</strong> users
                      {index > 0 && step.conversion_rate !== undefined && (
                        <span style={{ marginLeft: 8, color: isLowConversion ? '#ff4d4f' : '#52c41a' }}>
                          ({conversionRate.toFixed(1)}% conversion)
                        </span>
                      )}
                    </span>
                  </div>
                  <Progress
                    percent={conversionRate}
                    strokeColor={isLowConversion ? '#ff4d4f' : '#52c41a'}
                    showInfo={false}
                    strokeWidth={20}
                  />
                  {step.dropoff_reasons && step.dropoff_reasons.length > 0 && (
                    <div style={{ marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>
                      Dropoff reasons: {step.dropoff_reasons.join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Insights List */}
      {insights.length === 0 ? (
        <Alert
          message="Funnel is healthy"
          description="No immediate funnel or retention issues detected. Continue monitoring user activation rates."
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
                    <Tag color={insight.priority === 'High' ? 'red' : 'orange'}>
                      {insight.priority}
                    </Tag>
                    <strong>#{index + 1}: {insight.title}</strong>
                  </div>
                }
                description={
                  <div style={{ marginTop: 8 }}>
                    <p>
                      <strong style={{ color: '#722ed1' }}>👤 User/Segment:</strong><br />
                      {insight.userSegment}
                    </p>
                    <p>
                      <strong style={{ color: '#1890ff' }}>📌 Action:</strong><br />
                      {insight.action}
                    </p>
                    <p>
                      <strong style={{ color: '#52c41a' }}>📈 Expected Result:</strong><br />
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

export default FunnelSectionPanel;
