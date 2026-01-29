import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Empty, 
  List, 
  Tag, 
  Space, 
  Switch, 
  Statistic, 
  Row, 
  Col,
  Alert,
  Timeline,
  Typography,
  Divider,
  message
} from 'antd';
import { 
  SearchOutlined, 
  RobotOutlined, 
  PlayCircleOutlined,
  PauseCircleOutlined,
  SettingOutlined,
  RiseOutlined,
  UserOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  EditOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import DiscoverySettingsModal from '../Modals/DiscoverySettingsModal';
import { format } from 'date-fns';

const { Title, Text, Paragraph } = Typography;

// DUMMY DATA - Discovery automation settings
const dummyAutomationSettings = {
  enabled: true,
  frequency: 'weekly',
  focusAreas: ['keywords', 'customer-segments', 'industry-news'],
  lastRun: '2024-01-10T14:30:00Z',
  nextRun: '2024-01-17T14:30:00Z',
  successfulRuns: 12,
  failedRuns: 1,
  isDummy: true
};

// DUMMY DATA - Recent discovery results
const dummyDiscoveries = [
  {
    id: 'dummy_discovery_1',
    type: 'keyword',
    title: 'AI productivity tools',
    description: 'Trending keyword with 40% search volume increase over last 30 days',
    impact: 'High potential for traffic growth',
    date: '2024-01-10T00:00:00Z',
    confidence: 85,
    actionTaken: false,
    isDummy: true
  },
  {
    id: 'dummy_discovery_2',
    type: 'customer-segment',
    title: 'Remote team managers',
    description: 'New customer segment identified through social media analysis',
    impact: 'Untapped audience with high conversion potential',
    date: '2024-01-09T00:00:00Z',
    confidence: 92,
    actionTaken: true,
    isDummy: true
  },
  {
    id: 'dummy_discovery_3',
    type: 'industry-news',
    title: 'New privacy regulations impact',
    description: 'Recent GDPR updates affecting business compliance requirements',
    impact: 'Timely content opportunity for thought leadership',
    date: '2024-01-08T00:00:00Z',
    confidence: 78,
    actionTaken: false,
    isDummy: true
  },
  {
    id: 'dummy_discovery_4',
    type: 'competitor',
    title: 'Competitor content gap analysis',
    description: 'Identified topic gaps in competitor content strategy',
    impact: 'Opportunity to capture market share in underserved topics',
    date: '2024-01-07T00:00:00Z',
    confidence: 88,
    actionTaken: true,
    isDummy: true
  }
];

const DiscoveryTab = () => {
  const { user } = useAuth();
  const [automationSettings, setAutomationSettings] = useState(dummyAutomationSettings);
  const [discoveries, setDiscoveries] = useState(dummyDiscoveries);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check user access - ALL users can use discovery, but pay-as-you-go needs remaining allocation
  const hasAccess = user ? true : false;
  const isPaidUser = user && user.plan && !['payasyougo', 'free'].includes(user.plan);
  const hasRemainingPosts = user?.remainingPosts > 0; // DUMMY DATA - will be real from user object
  
  const canUseDiscovery = !user // Anonymous users can see demo
    ? true 
    : isPaidUser 
      ? true 
      : hasRemainingPosts;

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

  const handleToggleAutomation = async (enabled) => {
    if (!canUseDiscovery) {
      message.warning('Please upgrade your plan or purchase more posts to use automation');
      return;
    }

    setLoading(true);
    
    // DUMMY DATA - Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setAutomationSettings(prev => ({
      ...prev,
      enabled: enabled
    }));
    
    message.success(`Discovery automation ${enabled ? 'enabled' : 'disabled'}`);
    setLoading(false);
  };

  const handleRunDiscovery = async () => {
    if (!canUseDiscovery) {
      message.warning('Please upgrade your plan or purchase more posts to run discovery');
      return;
    }

    setLoading(true);
    message.loading('Running discovery analysis...', 0);
    
    // DUMMY DATA - Simulate discovery process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    message.destroy();
    message.success('Discovery completed! Found 2 new opportunities.');
    setLoading(false);
  };

  const handleGenerateContent = (discovery) => {
    if (!canUseDiscovery) {
      message.warning('Please upgrade your plan to generate content from discoveries');
      return;
    }
    
    // DUMMY DATA - Simulate content generation trigger
    message.success(`Content generation started for: ${discovery.title}`);
    
    // Mark discovery as action taken
    setDiscoveries(prev => 
      prev.map(d => 
        d.id === discovery.id 
          ? { ...d, actionTaken: true }
          : d
      )
    );
  };

  const renderAccessRestriction = () => {
    if (!user) {
      return (
        <Alert
          message="Demo Mode"
          description="Create an account to use automated discovery features."
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      );
    }

    if (!isPaidUser && !hasRemainingPosts) {
      return (
        <Alert
          message="Discovery Paused"
          description={`You have 0 remaining posts. Purchase more posts or upgrade to continue using automated discovery.`}
          type="warning"
          showIcon
          action={
            <Button size="small" type="primary">
              Purchase Posts
            </Button>
          }
          style={{ marginBottom: '20px' }}
        />
      );
    }

    return null;
  };

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        {/* Automation Status Card */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <RobotOutlined style={{ color: '#1890ff' }} />
                Automation Status
              </Space>
            }
            extra={
              <Button
                type="text"
                icon={<SettingOutlined />}
                onClick={() => setShowSettingsModal(true)}
              >
                Settings
              </Button>
            }
          >
            {renderAccessRestriction()}
            
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>Discovery Automation</Text>
                <Switch
                  checked={automationSettings.enabled && canUseDiscovery}
                  onChange={handleToggleAutomation}
                  loading={loading}
                  disabled={!canUseDiscovery}
                  checkedChildren={<PlayCircleOutlined />}
                  unCheckedChildren={<PauseCircleOutlined />}
                />
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Successful Runs"
                    value={automationSettings.successfulRuns}
                    prefix={<RiseOutlined style={{ color: '#52c41a' }} />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Opportunities Found"
                    value={discoveries.length}
                    prefix={<SearchOutlined style={{ color: '#1890ff' }} />}
                  />
                </Col>
              </Row>

              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Last run: {format(new Date(automationSettings.lastRun), 'MMM dd, yyyy HH:mm')}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Next run: {format(new Date(automationSettings.nextRun), 'MMM dd, yyyy HH:mm')}
                </Text>
              </div>

              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleRunDiscovery}
                disabled={!canUseDiscovery}
                loading={loading}
                block
              >
                Run Discovery Now
              </Button>
            </Space>
          </Card>
        </Col>

        {/* Recent Discoveries */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <SearchOutlined style={{ color: '#1890ff' }} />
                Recent Discoveries
              </Space>
            }
            extra={
              <Text type="secondary" style={{ fontSize: '12px' }}>
                💡 DUMMY DATA for demonstration
              </Text>
            }
          >
            {discoveries.length === 0 ? (
              <Empty
                description="No discoveries yet"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={handleRunDiscovery}
                  disabled={!canUseDiscovery}
                >
                  Run Your First Discovery
                </Button>
              </Empty>
            ) : (
              <List
                dataSource={discoveries}
                renderItem={(discovery) => (
                  <List.Item
                    key={discovery.id}
                    actions={[
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => message.info('Strategy creation feature coming soon')}
                      >
                        Create Strategy
                      </Button>,
                      <Button
                        type={discovery.actionTaken ? "default" : "primary"}
                        icon={<PlusOutlined />}
                        onClick={() => handleGenerateContent(discovery)}
                        disabled={!canUseDiscovery || discovery.actionTaken}
                      >
                        {discovery.actionTaken ? 'Content Generated' : 'Generate Content'}
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={getDiscoveryIcon(discovery.type)}
                      title={
                        <Space>
                          <span>{discovery.title}</span>
                          <Tag color={getConfidenceColor(discovery.confidence)}>
                            {discovery.confidence}% confidence
                          </Tag>
                          {discovery.actionTaken && <Tag color="green">Action Taken</Tag>}
                        </Space>
                      }
                      description={
                        <div>
                          <Paragraph style={{ margin: 0, marginBottom: '8px' }}>
                            {discovery.description}
                          </Paragraph>
                          <Text strong style={{ color: '#1890ff' }}>
                            Impact: {discovery.impact}
                          </Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            <ClockCircleOutlined style={{ marginRight: '4px' }} />
                            Discovered {format(new Date(discovery.date), 'MMM dd, yyyy')}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Discovery Activity Timeline */}
      <Card
        title="Discovery Timeline"
        style={{ marginTop: '16px' }}
        extra={
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Recent automation activity
          </Text>
        }
      >
        <Timeline
          items={[
            {
              dot: <PlayCircleOutlined style={{ color: '#52c41a' }} />,
              children: (
                <div>
                  <Text strong>Discovery Run Completed</Text>
                  <br />
                  <Text type="secondary">Found 4 new opportunities • 2 hours ago</Text>
                </div>
              )
            },
            {
              dot: <PlusOutlined style={{ color: '#1890ff' }} />,
              children: (
                <div>
                  <Text strong>Content Generated</Text>
                  <br />
                  <Text type="secondary">Created post for "Remote team managers" • 1 day ago</Text>
                </div>
              )
            },
            {
              dot: <SearchOutlined style={{ color: '#fa8c16' }} />,
              children: (
                <div>
                  <Text strong>Keyword Trend Detected</Text>
                  <br />
                  <Text type="secondary">AI productivity tools trending up 40% • 3 days ago</Text>
                </div>
              )
            }
          ]}
        />
      </Card>

      {showSettingsModal && (
        <DiscoverySettingsModal
          open={showSettingsModal}
          settings={automationSettings}
          onClose={() => setShowSettingsModal(false)}
          onSave={(newSettings) => {
            setAutomationSettings(newSettings);
            setShowSettingsModal(false);
            message.success('Discovery settings updated');
          }}
        />
      )}
    </div>
  );
};

export default DiscoveryTab;