import React, { useState, useEffect } from 'react';
import { Card, Button, Empty, Tag, Dropdown, Space, Switch, Divider, Input, Select, Row, Col, Typography, message, Alert, Table } from 'antd';
import { 
  SearchOutlined,
  RobotOutlined,
  PlayCircleOutlined,
  RiseOutlined,
  UserOutlined,
  GlobalOutlined,
  SettingOutlined,
  CalendarOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const { Title, Text } = Typography;

// Calendar localizer setup
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {
    'en-US': enUS,
  },
});

// Empty default states for automation settings
const defaultAutomationSettings = {
  enabled: false,
  frequency: 'weekly',
  focusAreas: [],
  lastRun: null,
  nextRun: null,
  successfulRuns: 0,
  failedRuns: 0
};

const SandboxTab = () => {
  const { user, isSuperAdmin } = useAuth();
  const [automationSettings, setAutomationSettings] = useState(defaultAutomationSettings);
  const [discoveries, setDiscoveries] = useState([]);
  const [selectedDiscoveryType, setSelectedDiscoveryType] = useState('all');
  
  // Calendar state
  const [calendarViewMode, setCalendarViewMode] = useState('list'); // 'list' or 'calendar'
  const [calendarEvents, setCalendarEvents] = useState([]);
  
  // Check if user has access to sandbox features
  const hasAccess = isSuperAdmin;
  
  // Content Discovery helper functions
  const getDiscoveryIcon = (type) => {
    switch (type) {
      case 'keyword': return <RiseOutlined style={{ color: '#1890ff' }} />;
      case 'customer-segment': return <UserOutlined style={{ color: '#52c41a' }} />;
      case 'industry-news': return <GlobalOutlined style={{ color: '#fa8c16' }} />;
      case 'competitor': return <SearchOutlined style={{ color: '#722ed1' }} />;
      default: return <RobotOutlined style={{ color: '#666' }} />;
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'green';
    if (confidence >= 60) return 'orange';
    return 'red';
  };

  const handleGenerateContent = (discovery) => {
    message.info(`Content generation for "${discovery.title}" would be integrated with OpenAI API here`);
  };

  const handleMarkActionTaken = (discoveryId) => {
    setDiscoveries(discoveries.map(d => 
      d.id === discoveryId ? { ...d, actionTaken: !d.actionTaken } : d
    ));
    message.success('Discovery status updated');
  };

  const handleToggleAutomation = () => {
    setAutomationSettings({
      ...automationSettings,
      enabled: !automationSettings.enabled
    });
    message.success(`Content discovery ${automationSettings.enabled ? 'disabled' : 'enabled'}`);
  };

  const handleRunDiscovery = () => {
    message.success('Discovery process started! This would integrate with multiple AI services.');
  };

  // Filter discoveries based on selected type
  const filteredDiscoveries = selectedDiscoveryType === 'all' 
    ? discoveries 
    : discoveries.filter(d => d.type === selectedDiscoveryType);

  // Access control
  if (!hasAccess) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Empty
            description={
              <div>
                <Title level={4}>Sandbox Access Required</Title>
                <Text type="secondary">
                  This tab contains experimental features and is only available to super administrators.
                </Text>
              </div>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
          <RobotOutlined style={{ marginRight: '12px', color: '#722ed1' }} />
          Sandbox
        </Title>
        <Text type="secondary">
          Experimental features for super administrators. These features are in development and may use placeholder data.
        </Text>
      </div>

      {/* Sandbox Warning */}
      <Alert
        message="🧪 Experimental Environment"
        description="These features are in active development. Data shown may be simulated and APIs may not be fully integrated."
        type="warning"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      {/* Content Discovery Section */}
      <Card 
        title={
          <Space>
            <SearchOutlined style={{ color: '#1890ff' }} />
            Content Discovery Automation
            <Tag color="purple">EXPERIMENTAL</Tag>
          </Space>
        }
        extra={
          <Button 
            type="link" 
            size="small"
            icon={<SettingOutlined />}
            onClick={() => message.info('Advanced discovery settings would open here')}
          >
            Configure
          </Button>
        }
      >
        {/* Automation Status */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col span={12}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f6ffed', 
              border: '1px solid #b7eb8f',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong>Automation Status</Text>
                  <div style={{ marginTop: '4px' }}>
                    <Tag color={automationSettings.enabled ? 'green' : 'default'}>
                      {automationSettings.enabled ? 'Active' : 'Paused'}
                    </Tag>
                  </div>
                </div>
                <Switch 
                  checked={automationSettings.enabled}
                  onChange={handleToggleAutomation}
                />
              </div>
            </div>
          </Col>
          
          <Col span={12}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f0f8ff', 
              border: '1px solid #d6e7ff',
              borderRadius: '8px'
            }}>
              <Text strong>Discovery Stats</Text>
              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                <div>Successful runs: {automationSettings.successfulRuns}</div>
                <div>Failed runs: {automationSettings.failedRuns}</div>
                <div>Next run: {automationSettings.nextRun ? new Date(automationSettings.nextRun).toLocaleDateString() : 'Not scheduled'}</div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Discovery Controls */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col span={12}>
            <Select
              value={selectedDiscoveryType}
              onChange={setSelectedDiscoveryType}
              style={{ width: '100%' }}
              placeholder="Filter by discovery type"
            >
              <Select.Option value="all">All Types</Select.Option>
              <Select.Option value="keyword">Keywords</Select.Option>
              <Select.Option value="customer-segment">Customer Segments</Select.Option>
              <Select.Option value="industry-news">Industry News</Select.Option>
              <Select.Option value="competitor">Competitors</Select.Option>
            </Select>
          </Col>
          <Col span={12}>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleRunDiscovery}
              style={{ width: '100%' }}
            >
              Run Manual Discovery
            </Button>
          </Col>
        </Row>

        <Divider />

        {/* Recent Discoveries */}
        <div style={{ marginBottom: '16px' }}>
          <Text strong style={{ fontSize: '16px' }}>Recent Discoveries</Text>
          <Text style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
            ({filteredDiscoveries.length} results)
          </Text>
        </div>

        {filteredDiscoveries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <SearchOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <div>
              <Text type="secondary">No discoveries found</Text>
              <div style={{ marginTop: '8px' }}>
                <Button type="link" onClick={handleRunDiscovery}>
                  Run discovery to find new opportunities
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {filteredDiscoveries.map((discovery) => (
              <div
                key={discovery.id}
                style={{ 
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px',
                  backgroundColor: discovery.actionTaken ? '#f6ffed' : '#fafafa'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                    <div style={{ marginRight: '16px', marginTop: '4px' }}>
                      {getDiscoveryIcon(discovery.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: '8px' }}>
                        <Space>
                          <span style={{ fontSize: '16px', fontWeight: 500 }}>
                            {discovery.title}
                          </span>
                          <Tag size="small" color={getConfidenceColor(discovery.confidence)}>
                            {discovery.confidence}% confidence
                          </Tag>
                          <Tag size="small" color="blue">
                            {discovery.type.replace('-', ' ')}
                          </Tag>
                          {discovery.actionTaken && (
                            <Tag size="small" color="green">
                              Action Taken
                            </Tag>
                          )}
                        </Space>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <Text style={{ fontSize: '14px', color: '#666' }}>
                          {discovery.description}
                        </Text>
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <Text strong style={{ fontSize: '14px', color: '#1890ff' }}>
                          💡 {discovery.impact}
                        </Text>
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        Discovered: {new Date(discovery.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => handleGenerateContent(discovery)}
                    >
                      Generate Content
                    </Button>
                    <Button
                      size="small"
                      onClick={() => handleMarkActionTaken(discovery.id)}
                    >
                      {discovery.actionTaken ? 'Mark Pending' : 'Mark Done'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Calendar Scheduling (Moved from Posts Tab) */}
        <Divider />
        
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarOutlined />
              <span>Content Scheduling Calendar (Preview)</span>
            </div>
          }
          extra={
            <Switch
              checkedChildren={<CalendarOutlined />}
              unCheckedChildren={<UnorderedListOutlined />}
              checked={calendarViewMode === 'calendar'}
              onChange={(checked) => setCalendarViewMode(checked ? 'calendar' : 'list')}
            />
          }
          style={{ marginBottom: '24px' }}
        >
          <Alert
            message="Preview Feature"
            description="This calendar view is for demonstration purposes. Full scheduling functionality requires additional development."
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          
          {calendarViewMode === 'list' ? (
            <div>
              <Text>Scheduled Posts List View</Text>
              <div style={{ marginTop: '16px' }}>
                {calendarEvents.length === 0 ? (
                  <Empty 
                    description="No scheduled posts"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  calendarEvents.map(event => (
                    <div key={event.id} style={{ 
                      padding: '8px', 
                      border: '1px solid #d9d9d9', 
                      borderRadius: '4px', 
                      marginBottom: '8px' 
                    }}>
                      <Text strong>{event.title}</Text>
                      <br />
                      <Text type="secondary">
                        Scheduled: {event.start.toLocaleString()}
                      </Text>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div style={{ height: '400px' }}>
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                onSelectEvent={(event) => {
                  message.info(`Selected: ${event.title}`);
                }}
                views={['month', 'week', 'day']}
                defaultView="month"
                popup
                style={{ height: '100%' }}
              />
            </div>
          )}
        </Card>

        {/* Future Features Preview */}
        <Divider />
        
        <div style={{ 
          padding: '16px',
          backgroundColor: '#f0f2ff',
          border: '1px solid #d6e3ff',
          borderRadius: '8px'
        }}>
          <Text strong style={{ color: '#1d39c4' }}>🚀 Coming Soon</Text>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#4f4f4f' }}>
            <ul style={{ marginBottom: 0, paddingLeft: '16px' }}>
              <li>Integration with OpenAI API for content generation</li>
              <li>Real-time web scraping for trend discovery</li>
              <li>Social media sentiment analysis</li>
              <li>Competitor content gap analysis</li>
              <li>Automated content calendar suggestions</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SandboxTab;