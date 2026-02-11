import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Alert, Spin } from 'antd';
import { ClockCircleOutlined, LineChartOutlined } from '@ant-design/icons';
import autoBlogAPI from '../../../services/api';

const SessionHeatmap = ({ dateRange }) => {
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessionData();
  }, [dateRange]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const response = await autoBlogAPI.getSessionMetrics(startDate, endDate);
      setSessionData(response);
    } catch (error) {
      console.error('Failed to load session data:', error);
      setSessionData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card title="Session Analytics">
        <Spin tip="Loading session data..." />
      </Card>
    );
  }

  if (!sessionData) {
    return (
      <Card title="Session Analytics">
        <Alert
          message="No session data available"
          description="Session metrics will appear here once users start interacting with your application."
          type="info"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card title="Session Analytics">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Statistic
            title="Total Sessions"
            value={sessionData.sessions?.length || 0}
            prefix={<LineChartOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Statistic
            title="Average Duration"
            value={sessionData.averageDuration || 0}
            suffix="sec"
            precision={0}
            prefix={<ClockCircleOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Statistic
            title="Bounce Rate"
            value={sessionData.bounceRate || 0}
            suffix="%"
            precision={1}
          />
        </Col>
      </Row>

      <Alert
        message="Session Heatmap Coming Soon"
        description="Visual heatmap showing user activity patterns will be added in a future update."
        type="info"
        showIcon
        style={{ marginTop: 16 }}
      />
    </Card>
  );
};

export default SessionHeatmap;
