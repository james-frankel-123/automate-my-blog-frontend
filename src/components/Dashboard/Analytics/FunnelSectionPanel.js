import React, { useState } from 'react';
import { Card, List, Tag, Alert, Statistic, Row, Col, Progress, Collapse, Spin, Table } from 'antd';
import { FunnelPlotOutlined, WarningOutlined, DownOutlined } from '@ant-design/icons';
import autoBlogAPI from '../../../services/api';

const { Panel } = Collapse;

const FunnelSectionPanel = ({ funnelData, loading, funnelVisualizationData, dateRange }) => {
  const [expandedStages, setExpandedStages] = useState({});
  const [stageUsers, setStageUsers] = useState({});
  const [loadingStage, setLoadingStage] = useState({});

  // Process funnel visualization data
  const funnelSteps = funnelVisualizationData?.steps || [];

  // If no funnel steps and no insights, don't render anything
  if (funnelSteps.length === 0 && !funnelData) {
    return null;
  }

  const { title = "Sales Funnel & Retention", insights = [], atRiskCount, potentialChurnCost, priority } = funnelData || {};

  const handleStageExpand = async (step) => {
    const stageKey = step.step;

    // Toggle expansion
    if (expandedStages[stageKey]) {
      setExpandedStages({ ...expandedStages, [stageKey]: false });
      return;
    }

    // If already loaded, just expand
    if (stageUsers[stageKey]) {
      setExpandedStages({ ...expandedStages, [stageKey]: true });
      return;
    }

    // Fetch users at this stage
    setLoadingStage({ ...loadingStage, [stageKey]: true });
    try {
      const startDate = dateRange?.[0] || new Date(Date.now() - 30*24*60*60*1000);
      const endDate = dateRange?.[1] || new Date();

      const response = await autoBlogAPI.getUsersAtFunnelStage(stageKey, startDate, endDate);
      setStageUsers({ ...stageUsers, [stageKey]: response.users || [] });
      setExpandedStages({ ...expandedStages, [stageKey]: true });
    } catch (error) {
      console.error(`Failed to load users for stage ${stageKey}:`, error);
    } finally {
      setLoadingStage({ ...loadingStage, [stageKey]: false });
    }
  };

  const userColumns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: '40%'
    },
    {
      title: 'Website',
      dataIndex: 'website_url',
      key: 'website_url',
      width: '40%',
      render: (url) => url || <span style={{ color: '#999' }}>No website</span>
    },
    {
      title: 'Joined',
      dataIndex: 'created_at',
      key: 'created_at',
      width: '20%',
      render: (date) => new Date(date).toLocaleDateString()
    }
  ];

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
              const stageKey = step.step;
              const isExpanded = expandedStages[stageKey];
              const users = stageUsers[stageKey] || [];
              const isLoading = loadingStage[stageKey];

              return (
                <div key={index} style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                      cursor: 'pointer',
                      padding: '4px 0'
                    }}
                    onClick={() => handleStageExpand(step)}
                  >
                    <span style={{ fontWeight: 500 }}>
                      <DownOutlined
                        style={{
                          fontSize: 10,
                          marginRight: 8,
                          transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                          transition: 'transform 0.3s'
                        }}
                      />
                      {step.name || step.step}
                    </span>
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

                  {/* Expandable user list */}
                  {isExpanded && (
                    <div style={{ marginTop: 12, padding: 12, background: '#fafafa', borderRadius: 4 }}>
                      {isLoading ? (
                        <div style={{ textAlign: 'center', padding: 20 }}>
                          <Spin />
                        </div>
                      ) : users.length > 0 ? (
                        <Table
                          dataSource={users}
                          columns={userColumns}
                          size="small"
                          pagination={{ pageSize: 10 }}
                          rowKey="id"
                        />
                      ) : (
                        <Alert message="No users found at this stage" type="info" showIcon />
                      )}
                    </div>
                  )}

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
