import React from 'react';
import { Card, Alert, Statistic, Row, Col, Progress } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';

const LeadFunnelPanel = ({ leadFunnelData, loading }) => {
  // Process lead funnel visualization data
  const funnelSteps = leadFunnelData?.steps || [];

  // If no funnel steps, don't render anything
  if (funnelSteps.length === 0) {
    return null;
  }

  const totalLeads = funnelSteps[0]?.count || 0;
  const converted = funnelSteps[funnelSteps.length - 1]?.count || 0;
  const overallConversion = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : 0;

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserAddOutlined style={{ fontSize: 24, color: '#722ed1' }} />
          <span>Lead Conversion Funnel</span>
        </div>
      }
      loading={loading}
      style={{ marginTop: 16 }}
    >
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Statistic
            title="Total Website Visitors"
            value={totalLeads}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Converted to Customers"
            value={converted}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Overall Conversion Rate"
            value={overallConversion}
            suffix="%"
          />
        </Col>
      </Row>

      {/* Visual Funnel */}
      {funnelSteps.length > 0 && (
        <Card
          title="Anonymous Visitor Journey"
          size="small"
          style={{ marginBottom: 16 }}
        >
          <div style={{ padding: '16px 0' }}>
            {funnelSteps.map((step, index) => {
              // Use 100% for first step (no previous step to convert from), otherwise use provided conversion_rate
              const conversionRate = step.conversion_rate !== undefined ? step.conversion_rate : 100;
              const isLowConversion = conversionRate <= 50 && index > 0;

              return (
                <div key={index} style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                      padding: '4px 0'
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>
                      {step.name || step.step}
                    </span>
                    <span>
                      <strong>{step.count}</strong> leads
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
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Insights */}
      {overallConversion < 5 && totalLeads > 10 && (
        <Alert
          message="Low Lead Conversion Rate"
          description={`Only ${overallConversion}% of visitors are converting to paying customers. Consider optimizing the onboarding flow and identifying drop-off points.`}
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      {overallConversion >= 10 && (
        <Alert
          message="Healthy Lead Conversion"
          description={`${overallConversion}% conversion rate indicates strong lead quality and effective onboarding.`}
          type="success"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </Card>
  );
};

export default LeadFunnelPanel;
