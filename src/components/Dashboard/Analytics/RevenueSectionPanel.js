import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Alert, Statistic, Row, Col, Spin } from 'antd';
import { DollarOutlined, LineChartOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import autoBlogAPI from '../../../services/api';

const RevenueSectionPanel = ({ revenueData, loading }) => {
  const [revenueChartData, setRevenueChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    loadRevenueChart();
  }, []);

  const loadRevenueChart = async () => {
    setChartLoading(true);
    try {
      const startDate = new Date(Date.now() - 30*24*60*60*1000);
      const endDate = new Date();
      const response = await autoBlogAPI.getRevenueOverTime(startDate, endDate, 'day');
      setRevenueChartData(response.data || []);
    } catch (error) {
      console.error('Failed to load revenue chart:', error);
    } finally {
      setChartLoading(false);
    }
  };

  if (!revenueData) return null;

  const { title, insights = [], potentialMRRIncrease, userCount, priority } = revenueData;

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarOutlined style={{ fontSize: 24, color: '#52c41a' }} />
          <span>{title}</span>
          {priority === 'immediate_action_required' && (
            <Tag color="red">ACTION REQUIRED</Tag>
          )}
        </div>
      }
      loading={loading}
      style={{ marginTop: 16 }}
    >
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Statistic
            title="Potential MRR Increase"
            value={potentialMRRIncrease || 0}
            prefix="$"
            suffix="/mo"
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Revenue Opportunity Users"
            value={userCount || 0}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="30-Day Revenue Trend"
            prefix={<LineChartOutlined />}
            valueStyle={{ color: '#52c41a' }}
            value={revenueChartData.length > 0 ? `${revenueChartData.length} days tracked` : 'Loading...'}
          />
        </Col>
      </Row>

      {/* Revenue Over Time Chart */}
      <Card
        title="Revenue Over Time (Last 30 Days)"
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Spin spinning={chartLoading}>
          {revenueChartData.length === 0 && !chartLoading ? (
            <Alert
              message="No revenue data available"
              description="No revenue transactions found in the selected time range."
              type="info"
              showIcon
            />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="period"
                  tickFormatter={(value) => {
                    try {
                      return format(new Date(value), 'MMM d');
                    } catch {
                      return value;
                    }
                  }}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => {
                    try {
                      return format(new Date(value), 'MMM d, yyyy');
                    } catch {
                      return value;
                    }
                  }}
                  formatter={(value) => {
                    const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
                    return `$${numValue.toFixed(2)}`;
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="total_revenue" stroke="#52c41a" strokeWidth={2} name="Total Revenue" />
                <Line type="monotone" dataKey="pay_per_use_revenue" stroke="var(--color-primary)" name="Pay-Per-Use" />
                <Line type="monotone" dataKey="starter_mrr" stroke="#faad14" name="Starter MRR" />
                <Line type="monotone" dataKey="professional_mrr" stroke="#722ed1" name="Pro MRR" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Spin>
      </Card>

      {/* Insights List */}
      {insights.length === 0 ? (
        <Alert
          message="No immediate revenue opportunities"
          description="All revenue opportunities have been addressed or there are no users in the pipeline."
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
                      <strong style={{ color: 'var(--color-primary)' }}>📌 Action:</strong><br />
                      {insight.action}
                    </p>
                    <p>
                      <strong style={{ color: '#52c41a' }}>💰 Expected Result:</strong><br />
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

export default RevenueSectionPanel;
