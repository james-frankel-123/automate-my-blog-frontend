import React from 'react';
import { Card, Progress, Row, Col, Statistic, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const FunnelVisualization = ({ data }) => {
  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>Loading funnel data...</p>
      </div>
    );
  }

  const { steps, conversions } = data;

  if (!steps || steps.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>No funnel data available yet. Start tracking events to see conversion analytics.</p>
      </div>
    );
  }

  // Calculate conversion rates between steps
  const calculateRate = (current, previous) => {
    if (!previous || previous === 0) return 100;
    return ((current / previous) * 100).toFixed(1);
  };

  return (
    <div className="funnel-visualization">
      <Row gutter={[16, 16]}>
        {steps.map((step, index) => {
          const previousStep = index > 0 ? steps[index - 1] : null;
          const conversionRate = calculateRate(
            step.count,
            previousStep?.count
          );

          return (
            <Col xs={24} sm={12} md={8} lg={6} key={step.name}>
              <Card
                title={
                  <span>
                    {step.name}
                    {step.description && (
                      <Tooltip title={step.description}>
                        <InfoCircleOutlined style={{ marginLeft: 8 }} />
                      </Tooltip>
                    )}
                  </span>
                }
                bordered
                style={{ height: '100%' }}
              >
                <Statistic
                  title="Users"
                  value={step.count}
                  suffix={previousStep ? `(${conversionRate}%)` : ''}
                />
                <Progress
                  percent={parseFloat(conversionRate)}
                  strokeColor={parseFloat(conversionRate) > 50 ? '#52c41a' : '#ff4d4f'}
                  style={{ marginTop: 16 }}
                />

                {step.dropoffReasons && step.dropoffReasons.length > 0 && (
                  <div style={{ marginTop: 16, fontSize: 12, color: '#888' }}>
                    <strong>Top Dropoff Reasons:</strong>
                    <ul style={{ paddingLeft: 20, marginTop: 8 }}>
                      {step.dropoffReasons.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Overall Conversion Summary */}
      {conversions && (
        <Card title="Overall Conversion Metrics" style={{ marginTop: 24 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Statistic
                title="Lead to Signup"
                value={conversions.leadToSignup || 0}
                suffix="%"
                precision={1}
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Signup to Paying"
                value={conversions.signupToPaying || 0}
                suffix="%"
                precision={1}
                valueStyle={{ color: 'var(--color-primary)' }}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Paying to Upsell"
                value={conversions.payingToUpsell || 0}
                suffix="%"
                precision={1}
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

export default FunnelVisualization;
