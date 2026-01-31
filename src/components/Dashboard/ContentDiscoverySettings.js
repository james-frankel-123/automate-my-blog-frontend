import React, { useState } from 'react';
import { Card, Switch, Select, Checkbox, Button, Row, Col, Statistic, Divider, Typography, Space, Alert, Timeline, message } from 'antd';
import {
  RobotOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  SettingOutlined,
  RiseOutlined,
  SearchOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';

const { Title, Text } = Typography;
const { Option } = Select;

// DUMMY DATA - Content Discovery automation settings
const dummyAutomationSettings = {
  enabled: true,
  frequency: 'weekly',
  focusAreas: ['keywords', 'customer-segments', 'industry-news'],
  lastRun: '2024-01-10T14:30:00Z',
  nextRun: '2024-01-17T14:30:00Z',
  successfulRuns: 12,
  failedRuns: 1,
  researchQuality: 'enhanced',
  isDummy: true
};

const ContentDiscoverySettings = () => {
  const [automationSettings, setAutomationSettings] = useState(dummyAutomationSettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const focusAreaOptions = [
    { value: 'keywords', label: 'Trending Keywords' },
    { value: 'customer-segments', label: 'Customer Segments' },
    { value: 'industry-news', label: 'Industry News' },
    { value: 'competitor', label: 'Competitor Analysis' }
  ];

  const handleToggleAutomation = async (enabled) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setAutomationSettings(prev => ({
      ...prev,
      enabled: enabled
    }));
    
    message.success(`Content discovery automation ${enabled ? 'enabled' : 'disabled'}`);
    setLoading(false);
  };

  const handleFrequencyChange = (frequency) => {
    setAutomationSettings(prev => ({
      ...prev,
      frequency
    }));
  };

  const handleFocusAreasChange = (focusAreas) => {
    setAutomationSettings(prev => ({
      ...prev,
      focusAreas
    }));
  };

  const handleRunDiscovery = async () => {
    setLoading(true);
    message.loading('Running content discovery analysis...', 0);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    message.destroy();
    message.success('Discovery completed! Found new content opportunities.');
    
    // Update last run timestamp
    setAutomationSettings(prev => ({
      ...prev,
      lastRun: new Date().toISOString(),
      successfulRuns: prev.successfulRuns + 1
    }));
    
    setLoading(false);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    message.success('Content discovery settings saved!');
    setSaving(false);
  };

  return (
    <div style={{ padding: '20px 0' }}>
      {/* Content Discovery Automation */}
      <Card style={{ marginBottom: '24px', border: '2px solid var(--color-primary)' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Title level={4} style={{ margin: 0, color: 'var(--color-primary)' }}>
              <RobotOutlined style={{ marginRight: '8px' }} />
              Content Discovery Automation
            </Title>
          </Col>
          <Col>
            <Switch
              checked={automationSettings.enabled}
              onChange={handleToggleAutomation}
              loading={loading}
              checkedChildren={<PlayCircleOutlined />}
              unCheckedChildren={<PauseCircleOutlined />}
            />
          </Col>
        </Row>

        <Alert
          message="AI-Powered Content Discovery"
          description="Automatically discover trending topics, keywords, and content opportunities based on your audience segments and industry trends."
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />

        <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
          <Col xs={24} md={8}>
            <Card size="small">
              <Statistic
                title="Successful Runs"
                value={automationSettings.successfulRuns}
                prefix={<RiseOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small">
              <Statistic
                title="Failed Runs"
                value={automationSettings.failedRuns}
                prefix={<ClockCircleOutlined style={{ color: '#ff4d4f' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small">
              <Statistic
                title="Next Run"
                value={format(new Date(automationSettings.nextRun), 'MMM dd')}
                prefix={<SearchOutlined style={{ color: 'var(--color-primary)' }} />}
              />
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* Automation Configuration */}
        <Row gutter={[24, 16]} style={{ marginBottom: '20px' }}>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Discovery Frequency</Text>
              <Select
                value={automationSettings.frequency}
                onChange={handleFrequencyChange}
                style={{ width: '100%' }}
                disabled={!automationSettings.enabled}
              >
                {frequencyOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Research Quality</Text>
              <Select
                value={automationSettings.researchQuality}
                onChange={(value) => setAutomationSettings(prev => ({ ...prev, researchQuality: value }))}
                style={{ width: '100%' }}
                disabled={!automationSettings.enabled}
              >
                <Option value="basic">Basic (Free)</Option>
                <Option value="enhanced">Enhanced (Premium)</Option>
              </Select>
            </Space>
          </Col>
        </Row>

        <Row gutter={[24, 16]} style={{ marginBottom: '20px' }}>
          <Col span={24}>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Focus Areas</Text>
            <Checkbox.Group
              options={focusAreaOptions}
              value={automationSettings.focusAreas}
              onChange={handleFocusAreasChange}
              disabled={!automationSettings.enabled}
            />
          </Col>
        </Row>

        <Divider />

        {/* Action Buttons */}
        <Row gutter={[16, 16]}>
          <Col>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleRunDiscovery}
              disabled={!automationSettings.enabled}
              loading={loading}
            >
              Run Discovery Now
            </Button>
          </Col>
          <Col>
            <Button
              type="default"
              icon={<SettingOutlined />}
              onClick={handleSaveSettings}
              loading={saving}
            >
              Save Settings
            </Button>
          </Col>
        </Row>

        {/* Last Run Info */}
        {automationSettings.lastRun && (
          <div style={{ marginTop: '16px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Last discovery run: {format(new Date(automationSettings.lastRun), 'MMM dd, yyyy HH:mm')}
            </Text>
          </div>
        )}
      </Card>

      {/* Discovery Activity Timeline */}
      <Card title="Recent Discovery Activity" style={{ marginBottom: '20px' }}>
        <Timeline
          size="small"
          items={[
            {
              dot: <PlayCircleOutlined style={{ color: '#52c41a' }} />,
              children: (
                <div>
                  <Text strong style={{ fontSize: '13px' }}>Discovery Run Completed</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Found 4 new content opportunities • 2 hours ago
                  </Text>
                </div>
              )
            },
            {
              dot: <SearchOutlined style={{ color: '#fa8c16' }} />,
              children: (
                <div>
                  <Text strong style={{ fontSize: '13px' }}>Keyword Trend Detected</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    AI productivity tools trending up 40% • 3 days ago
                  </Text>
                </div>
              )
            },
            {
              dot: <RiseOutlined style={{ color: 'var(--color-primary)' }} />,
              children: (
                <div>
                  <Text strong style={{ fontSize: '13px' }}>Industry Analysis Complete</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Competitive landscape updated • 1 week ago
                  </Text>
                </div>
              )
            }
          ]}
        />
      </Card>

      {/* Advanced Settings */}
      <Card title="Advanced Discovery Settings">
        <Alert
          message="Premium Features"
          description="Enhanced discovery features include competitive analysis, search volume data, and content performance predictions."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        
        <Space direction="vertical">
          <Checkbox disabled>
            Enable competitive content analysis
          </Checkbox>
          <Checkbox disabled>
            Include search volume data
          </Checkbox>
          <Checkbox disabled>
            Generate content performance predictions
          </Checkbox>
          <Checkbox disabled>
            Auto-prioritize by conversion potential
          </Checkbox>
        </Space>
      </Card>
    </div>
  );
};

export default ContentDiscoverySettings;