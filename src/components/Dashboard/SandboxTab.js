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
  UnorderedListOutlined,
  PictureOutlined
} from '@ant-design/icons';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { useAuth } from '../../contexts/AuthContext';
import { VisualContentSuggestions } from '../VisualContent';
import ContentDiscoverySettings from './ContentDiscoverySettings';
import api from '../../services/api';
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

// Highlight test cases data
const highlightTestCases = [
  {
    id: 'stat-highlight',
    title: 'Statistic Highlight',
    type: 'statistic',
    content: '73% of marketers report increased ROI with automation',
    citation: {
      source: 'HubSpot Marketing Report 2024',
      url: 'https://blog.hubspot.com/marketing/marketing-statistics',
      verified: true
    },
    prompt: 'Create a large, visually prominent statistic display showing "73%" as the main number with "of marketers report increased ROI with automation" as supporting text. Include citation footer.',
    expectedFeatures: ['Large percentage number', 'Supporting text', 'Citation link', 'Visual prominence'],
    testType: 'Statistics - ROI Impact'
  },
  {
    id: 'pullquote-highlight',
    title: 'Pull Quote Highlight', 
    type: 'pullquote',
    content: 'Content marketing generates 3x more leads than traditional advertising while costing 62% less.',
    citation: {
      source: 'Content Marketing Institute Study',
      url: 'https://contentmarketinginstitute.com/research/',
      verified: true
    },
    prompt: 'Design a pull quote with right-alignment that allows text to wrap around it. Quote: "Content marketing generates 3x more leads than traditional advertising while costing 62% less." Include attribution and proper typography.',
    expectedFeatures: ['Right-aligned layout', 'Text wrap capability', 'Quote styling', 'Attribution'],
    testType: 'Pull Quotes - Expert Insight'
  },
  {
    id: 'takeaway-highlight',
    title: 'Key Takeaway Box',
    type: 'takeaway', 
    content: 'The bottom line: Email marketing remains the highest ROI digital channel, delivering $42 for every $1 spent.',
    citation: {
      source: 'Litmus Email Marketing ROI Report',
      url: 'https://www.litmus.com/resources/state-of-email/',
      verified: true
    },
    prompt: 'Create a highlighted takeaway box with "The bottom line:" prefix in bold, followed by the key insight about email marketing ROI. Use distinct background color and proper spacing.',
    expectedFeatures: ['Highlighted background', 'Bold prefix', 'Key insight emphasis', 'Professional spacing'],
    testType: 'Takeaways - Bottom Line'
  },
  {
    id: 'process-highlight',
    title: 'Process Step Highlight',
    type: 'process',
    content: 'Step 3: Set up automated email sequences with 48-hour response triggers to capture leads while they\'re hot.',
    citation: {
      source: 'Marketing Automation Best Practices Guide',
      url: 'https://www.marketo.com/best-practices/',
      verified: true
    },
    prompt: 'Design a process step callout with numbered icon, step description, and actionable details. Include timing specifics and business rationale.',
    expectedFeatures: ['Numbered step icon', 'Action-oriented text', 'Timing details', 'Business context'],
    testType: 'Process Steps - Implementation'
  },
  {
    id: 'definition-highlight',
    title: 'Definition Callout',
    type: 'definition',
    content: 'Marketing Qualified Lead (MQL): A prospect who has engaged with your brand and meets specific criteria indicating sales readiness.',
    citation: {
      source: 'SalesForce Marketing Glossary',
      url: 'https://www.salesforce.com/resources/articles/marketing-qualified-leads/',
      verified: true
    },
    prompt: 'Create a definition box for "Marketing Qualified Lead" with term in bold, clear explanation, and professional styling that distinguishes it from body text.',
    expectedFeatures: ['Bold term title', 'Clear definition', 'Distinguished styling', 'Professional appearance'],
    testType: 'Definitions - Industry Terms'
  },
  {
    id: 'casestudy-highlight',
    title: 'Case Study Result',
    type: 'casestudy',
    content: 'Before: 2.3% email open rate, 0.8% click-through rate. After: 18.7% open rate (+713%), 4.2% click-through (+425%)',
    citation: {
      source: 'Campaign Monitor Case Study',
      url: 'https://www.campaignmonitor.com/case-studies/',
      verified: true
    },
    prompt: 'Design a before/after comparison showing email performance metrics with percentage improvements highlighted. Use color coding for positive changes.',
    expectedFeatures: ['Before/after layout', 'Metric comparison', 'Percentage improvements', 'Color-coded results'],
    testType: 'Case Studies - Performance Results'
  },
  {
    id: 'research-highlight',
    title: 'Research Finding',
    type: 'research',
    content: 'Study reveals: Companies using advanced analytics are 5x more likely to make faster decisions than their competitors.',
    citation: {
      source: 'McKinsey Analytics Research',
      url: 'https://www.mckinsey.com/capabilities/quantumblack/our-insights',
      verified: true
    },
    prompt: 'Create a research finding callout with "Study reveals:" prefix and compelling statistic. Include credible source attribution and professional academic styling.',
    expectedFeatures: ['Research prefix', 'Statistical finding', 'Source credibility', 'Academic styling'],
    testType: 'Research Findings - Industry Studies'
  },
  {
    id: 'warning-highlight',
    title: 'Warning/Tip Box',
    type: 'warning',
    content: 'Critical: Never buy email lists! This practice can result in spam penalties, damaged sender reputation, and legal compliance issues.',
    citation: {
      source: 'CAN-SPAM Act Guidelines',
      url: 'https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business',
      verified: true
    },
    prompt: 'Design a warning callout with "Critical:" prefix, important advice about email list practices, and attention-grabbing styling without being alarming.',
    expectedFeatures: ['Warning indicator', 'Critical prefix', 'Important advice', 'Attention-grabbing design'],
    testType: 'Warnings - Critical Advice'
  },
  {
    id: 'comparison-highlight',
    title: 'Comparison Table',
    type: 'comparison',
    content: 'Email vs Social: Email delivers 4,200% ROI while social media averages 95% ROI for customer acquisition.',
    citation: {
      source: 'Digital Marketing ROI Comparison Study',
      url: 'https://www.optinmonster.com/email-marketing-statistics/',
      verified: true
    },
    prompt: 'Create a comparison highlight showing email marketing vs social media ROI with clear numerical contrast and channel-specific insights.',
    expectedFeatures: ['Channel comparison', 'ROI numbers', 'Clear contrast', 'Performance insights'],
    testType: 'Comparisons - Channel Performance'
  },
  {
    id: 'cta-highlight',
    title: 'Call-to-Action Block',
    type: 'cta',
    content: 'Ready to boost your email ROI? Download our free Email Marketing Optimization Checklist and start seeing results in 30 days.',
    citation: {
      source: 'Internal Resource',
      url: 'https://example.com/email-checklist',
      verified: true
    },
    prompt: 'Design a call-to-action block with compelling question, clear value proposition, and downloadable resource offer with timeline expectation.',
    expectedFeatures: ['Compelling question', 'Value proposition', 'Resource offer', 'Timeline expectation'],
    testType: 'CTAs - Resource Download'
  }
];

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

      {/* Visual Content Generation Testing Section */}
      <Card
        title={
          <Space>
            <PictureOutlined style={{ color: '#722ed1' }} />
            Visual Content Generation Testing
            <Tag color="orange">ADMIN ONLY</Tag>
          </Space>
        }
        extra={
          <Button 
            type="link" 
            size="small"
            icon={<SettingOutlined />}
            onClick={() => message.info('Visual generation settings would open here')}
          >
            API Settings
          </Button>
        }
        style={{ marginBottom: '24px' }}
      >
        <Alert
          message="🎨 Original Image Generation Testing"
          description="This interface provides access to the original visual content generation system - QuickChart, Replicate, and DALL-E API testing for super admin evaluation and debugging."
          type="warning"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        {/* Original VisualContentSuggestions Component for Image Generation Testing */}
        <VisualContentSuggestions
          visualSuggestions={[
            // Restore the original test cases for image generation
            {
              id: 'test-hero-image',
              title: 'Hero Image Test',
              contentType: 'hero_image',
              prompt: 'Professional marketing team collaborating on digital strategy in modern office environment with laptops and charts',
              recommendedService: 'stable_diffusion',
              estimatedCost: 0.01,
              estimatedTime: '30-60s',
              priority: 'high',
              placement: 'Top of blog post',
              altText: 'Marketing team collaboration',
              description: 'Test case: Hero Image Generation',
              reasoning: 'Testing photorealistic image generation for blog headers'
            },
            {
              id: 'test-social-media',
              title: 'Social Media Card Test', 
              contentType: 'social_media',
              prompt: 'Eye-catching social media graphic about email marketing ROI with bold typography and engaging visual elements',
              recommendedService: 'stable_diffusion',
              estimatedCost: 0.01,
              estimatedTime: '30-60s',
              priority: 'high',
              placement: 'Social sharing',
              altText: 'Email marketing ROI graphic',
              description: 'Test case: Social Media Graphics',
              reasoning: 'Testing social media optimized graphics generation'
            },
            {
              id: 'test-infographic',
              title: 'Process Infographic Test',
              contentType: 'infographic', 
              prompt: 'Step-by-step infographic showing customer onboarding process with icons, arrows, and conversion metrics',
              recommendedService: 'quickchart',
              estimatedCost: 0.00,
              estimatedTime: '5-10s',
              priority: 'high',
              placement: 'Middle of blog post',
              altText: 'Customer onboarding process',
              description: 'Test case: Process Infographics',
              reasoning: 'Testing chart and infographic generation capabilities'
            }
          ]}
          onGenerateVisual={async (suggestion) => {
            const serviceName = suggestion.testService || suggestion.recommendedService || suggestion.selectedService;
            const serviceDisplayName = {
              'quickchart': 'QuickChart (Free)',
              'stable_diffusion': 'Replicate',
              'dalle': 'DALL-E'
            }[serviceName] || serviceName;
            
            console.log('🎨 Generate visual requested:', {
              contentType: suggestion.contentType,
              service: serviceName,
              testService: !!suggestion.testService
            });
            
            try {
              message.loading({ content: `Generating ${suggestion.title} with ${serviceDisplayName}...`, key: 'visual-gen', duration: 0 });
              
              // Call real visual generation API
              const response = await api.makeRequest('/api/v1/visual-content/generate', {
                method: 'POST',
                body: JSON.stringify({
                  contentType: suggestion.contentType,
                  prompt: suggestion.prompt,
                  organizationId: user?.organizationId || 'sandbox-test',
                  postId: 'sandbox-test-post',
                  servicePreference: serviceName,
                  options: {
                    width: 1024,
                    height: 1024,
                    quality: 'standard'
                  }
                }),
                headers: {
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.success && response.data) {
                console.log('✅ Visual generation successful:', response.data);
                
                message.success({
                  content: `${suggestion.title} generated with ${serviceDisplayName}!`,
                  key: 'visual-gen',
                  duration: 4
                });
                
                return response.data;
              } else {
                throw new Error(response.error || 'Visual generation failed');
              }
            } catch (error) {
              console.error('Visual generation error:', error);
              message.error({ 
                content: `Failed to generate ${suggestion.title} with ${serviceDisplayName}: ${error.message}`, 
                key: 'visual-gen' 
              });
              return null;
            }
          }}
          style={{ marginTop: '16px' }}
        />
      </Card>

      {/* Content Discovery Settings Section */}
      <Card
        title={
          <Space>
            <RobotOutlined style={{ color: '#722ed1' }} />
            Content Discovery Settings
            <Tag color="purple">ADMIN ONLY</Tag>
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <Alert
          message="Experimental Feature"
          description="Configure content discovery automation settings. This feature is currently in testing."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <ContentDiscoverySettings />
      </Card>
    </div>
  );
};

export default SandboxTab;