import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, Space, Switch, Alert, List, Tag, Timeline, Typography, Divider, Input, message } from 'antd';
import {
  FileTextOutlined,
  FolderOutlined,
  EyeOutlined,
  TrophyOutlined,
  PlusOutlined,
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
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTabMode } from '../../hooks/useTabMode';
import { useWorkflowMode } from '../../contexts/WorkflowModeContext';
import ModeToggle from '../Workflow/ModeToggle';
import WebsiteAnalysisStepStandalone from '../Workflow/steps/WebsiteAnalysisStepStandalone';
import { format } from 'date-fns';

const { Title, Text, Paragraph } = Typography;

// DUMMY DATA - Discovery automation settings (integrated from DiscoveryTab)
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

// DUMMY DATA - Recent discovery results (integrated from DiscoveryTab)
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
  }
];

const DashboardTab = () => {
  const { user } = useAuth();
  const tabMode = useTabMode('dashboard');
  const { 
    websiteUrl, 
    setWebsiteUrl, 
    isLoading, 
    setIsLoading,
    currentStep,
    stepResults,
    updateWebsiteAnalysis,
    updateWebSearchInsights,
    updateAnalysisCompleted,
    requireAuth 
  } = useWorkflowMode();
  const [automationSettings, setAutomationSettings] = useState(dummyAutomationSettings);
  const [discoveries, setDiscoveries] = useState(dummyDiscoveries.slice(0, 2)); // Show top 2 on dashboard
  const [loading, setLoading] = useState(false);
  
  // Keep only UI-specific local state
  const [scanningMessage, setScanningMessage] = useState('');

  // Check user access for discovery features
  const isPaidUser = user && user.plan && !['payasyougo', 'free'].includes(user.plan);
  const hasRemainingPosts = user?.remainingPosts > 0;
  const canUseDiscovery = !user ? true : isPaidUser ? true : hasRemainingPosts;

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

  const handleCreateNewPost = () => {
    // This starts the guided workflow from Dashboard → Audience → Posts
    tabMode.enterWorkflowMode();
    message.success('Starting guided creation workflow');
  };

  const handleGenerateContent = (discovery) => {
    if (!canUseDiscovery) {
      message.warning('Please upgrade your plan to generate content from discoveries');
      return;
    }
    
    message.success(`Content generation started for: ${discovery.title}`);
  };

  // Handle analysis completion from standalone component
  const handleAnalysisComplete = (data) => {
    console.log('Analysis completed:', data);
    
    // Update unified workflow state only (no local state)
    updateWebsiteAnalysis(data.analysis);
    updateWebSearchInsights(data.webSearchInsights || { researchQuality: 'basic' });
    updateAnalysisCompleted(true);
  };
  
  // Handle continue to next step - scroll to audience section in workflow mode
  const handleContinueToAudience = () => {
    // First, advance to the audience step in the workflow
    const stepData = {
      websiteAnalysis: stepResults.home.websiteAnalysis,
      webSearchInsights: stepResults.home.webSearchInsights,
      analysisCompleted: true,
      timestamp: new Date().toISOString()
    };
    
    // Use the workflow mode context to advance to the next step
    tabMode.continueToNextStep(stepData);
    
    // Then scroll to audience section  
    setTimeout(() => {
      const audienceSection = document.getElementById('audience-segments');
      if (audienceSection) {
        audienceSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
        console.log('🚀 Advanced to audience selection step and scrolled to section');
      }
    }, 100); // Small delay to ensure workflow state updates first
  };

  // Prepare step data for workflow mode
  const prepareStepData = () => ({
    selectedAction: 'create-post',
    timestamp: new Date().toISOString()
  });

  return (
    <div>
      {/* Mode Toggle - Only show for authenticated users */}
      {user && (
        <ModeToggle
          mode={tabMode.mode}
          tabKey="dashboard"
          workflowStep={tabMode.workflowStep}
          showModeToggle={tabMode.showModeToggle}
          showWorkflowNavigation={tabMode.showWorkflowNavigation}
          showNextButton={tabMode.showNextButton}
          showPreviousButton={tabMode.showPreviousButton}
          nextButtonText={tabMode.nextButtonText}
          previousButtonText={tabMode.previousButtonText}
          canEnterWorkflow={tabMode.canEnterWorkflow}
          onEnterWorkflowMode={tabMode.enterWorkflowMode}
          onExitToFocusMode={tabMode.exitToFocusMode}
          onContinueToNextStep={tabMode.continueToNextStep}
          onGoToPreviousStep={tabMode.goToPreviousStep}
          onSaveStepData={tabMode.saveStepData}
          stepData={prepareStepData()}
        />
      )}
      
      <div style={{ padding: '24px' }}>
        {/* WORKFLOW MODE: Guided Website Analysis Step */}
        {tabMode.mode === 'workflow' && (
          <>
            {/* Workflow Step Header */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col span={24}>
                <Card style={{ background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)', border: 'none' }}>
                  <div style={{ color: 'white', textAlign: 'center' }}>
                    <Title level={2} style={{ color: 'white', marginBottom: '8px' }}>
                      🚀 Let's Create Your Perfect Blog Post
                    </Title>
                    <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px', marginBottom: '20px' }}>
                      We'll analyze your website and create targeted content that speaks to your audience.
                      This guided workflow will take you step-by-step to create high-converting blog content.
                    </Paragraph>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Website Analysis - Use standalone component for full New Post experience */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col span={24}>
                <WebsiteAnalysisStepStandalone
                  // Core state (from unified context)
                  websiteUrl={websiteUrl}
                  setWebsiteUrl={setWebsiteUrl}
                  analysisResults={stepResults.home.websiteAnalysis}
                  setAnalysisResults={(data) => updateWebsiteAnalysis(data)}
                  webSearchInsights={stepResults.home.webSearchInsights}
                  setWebSearchInsights={(data) => updateWebSearchInsights(data)}
                  
                  // Loading states
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                  scanningMessage={scanningMessage}
                  setScanningMessage={setScanningMessage}
                  analysisCompleted={stepResults.home.analysisCompleted}
                  setAnalysisCompleted={(completed) => updateAnalysisCompleted(completed)}
                  
                  // User context
                  user={user}
                  requireAuth={requireAuth}
                  
                  // Event handlers
                  onAnalysisComplete={handleAnalysisComplete}
                  
                  // Configuration
                  embedded={true}
                  showTitle={false}
                  autoAnalyze={false}
                />
                
                {/* Continue Button - Show after analysis completes */}
                {stepResults.home.analysisCompleted && stepResults.home.websiteAnalysis && (
                  <Card style={{ marginTop: '16px' }}>
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                      <Button 
                        type="primary" 
                        size="large"
                        onClick={handleContinueToAudience}
                        style={{ minWidth: '200px' }}
                      >
                        Continue to Audience Selection
                      </Button>
                      <div style={{ marginTop: '8px' }}>
                        <Text type="secondary">
                          Next: Choose your target customer strategy
                        </Text>
                      </div>
                    </div>
                  </Card>
                )}
              </Col>
            </Row>
          </>
        )}

        {/* FOCUS MODE: Full Dashboard Features (Premium) */}
        {tabMode.mode === 'focus' && (
          <>
      {/* Welcome Header */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
            <div style={{ color: 'white', textAlign: 'center' }}>
              <Title level={2} style={{ color: 'white', marginBottom: '8px' }}>
                Welcome back{user?.firstName ? `, ${user.firstName}` : ''}! 👋
              </Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px', marginBottom: '20px' }}>
                Your content automation dashboard is ready. Create, discover, and optimize your blog content strategy.
              </Paragraph>
              <Button 
                type="primary" 
                size="large" 
                icon={<PlusOutlined />} 
                onClick={handleCreateNewPost}
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'white' }}
              >
                Create New Post
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Posts"
              value={23}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Audience Segments"
              value={4}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Views"
              value={1284}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Opportunities Found"
              value={discoveries.length}
              prefix={<SearchOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Website Analysis Results - Show in Focus Mode when completed */}
      {stepResults.home.analysisCompleted && stepResults.home.websiteAnalysis && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col span={24}>
            <WebsiteAnalysisStepStandalone
              // Core state (from unified context)
              websiteUrl={websiteUrl}
              setWebsiteUrl={setWebsiteUrl}
              analysisResults={stepResults.home.websiteAnalysis}
              setAnalysisResults={(data) => updateWebsiteAnalysis(data)}
              webSearchInsights={stepResults.home.webSearchInsights}
              setWebSearchInsights={(data) => updateWebSearchInsights(data)}
              
              // Loading states
              isLoading={false} // Not loading in focus mode display
              setIsLoading={setIsLoading}
              scanningMessage=""
              setScanningMessage={setScanningMessage}
              analysisCompleted={stepResults.home.analysisCompleted}
              setAnalysisCompleted={(completed) => updateAnalysisCompleted(completed)}
              
              // User context
              user={user}
              requireAuth={requireAuth}
              
              // Configuration for focus mode display
              embedded={true}
              showTitle={false}
              autoAnalyze={false}
              
              // Event handlers
              onAnalysisComplete={handleAnalysisComplete}
            />
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]}>
        {/* Content Discovery Section */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <SearchOutlined style={{ color: '#1890ff' }} />
                Content Discovery
              </Space>
            }
            extra={
              <Button 
                type="link" 
                size="small"
                onClick={() => message.info('Configure automation in Settings → Content Discovery')}
              >
                Settings
              </Button>
            }
            style={{ height: '400px' }}
          >
            {!canUseDiscovery && !user && (
              <Alert
                message="Demo Mode"
                description="Create an account to use automated discovery features."
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}

            <div style={{ marginBottom: '16px' }}>
              <Text strong>Discovery Status: </Text>
              <Tag color={automationSettings.enabled && canUseDiscovery ? 'green' : 'default'}>
                {automationSettings.enabled && canUseDiscovery ? 'Active' : 'Paused'}
              </Tag>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {discoveries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <SearchOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                <Text type="secondary">No recent discoveries</Text>
              </div>
            ) : (
              <List
                dataSource={discoveries}
                renderItem={(discovery) => (
                  <List.Item
                    key={discovery.id}
                    style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '12px', marginBottom: '12px' }}
                  >
                    <List.Item.Meta
                      avatar={getDiscoveryIcon(discovery.type)}
                      title={
                        <Space>
                          <span style={{ fontSize: '14px', fontWeight: 500 }}>{discovery.title}</span>
                          <Tag size="small" color={getConfidenceColor(discovery.confidence)}>
                            {discovery.confidence}%
                          </Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <Text style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                            {discovery.description}
                          </Text>
                          <Text strong style={{ fontSize: '12px', color: '#1890ff' }}>
                            {discovery.impact}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}

            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => message.info('Run discovery from Settings → Content Discovery')}
              disabled={!canUseDiscovery}
              block
              style={{ marginTop: '12px' }}
            >
              Configure Discovery
            </Button>
          </Card>
        </Col>

        {/* Quick Actions & Recent Activity */}
        <Col xs={24} lg={12}>
          <Card title="Quick Actions" style={{ marginBottom: '16px' }}>
            <Space wrap>
              <Button 
                type="primary" 
                icon={stepResults.home.analysisCompleted ? <PlayCircleOutlined /> : <PlusOutlined />}
                size="large"
                onClick={handleCreateNewPost}
              >
                {stepResults.home.analysisCompleted ? 'Continue Workflow' : 'Create New Post'}
              </Button>
              {stepResults.home.analysisCompleted && (
                <Button 
                  icon={<EditOutlined />} 
                  size="large"
                  onClick={() => {
                    // Reset analysis to restart workflow
                    updateAnalysisCompleted(false);
                    tabMode.enterWorkflowMode();
                    message.info('Edit your website analysis');
                  }}
                >
                  Edit Analysis
                </Button>
              )}
              <Button icon={<UserOutlined />} size="large">
                New Audience Segment
              </Button>
              <Button icon={<EyeOutlined />} size="large">
                View Analytics
              </Button>
            </Space>
          </Card>

          <Card title="Recent Activity" style={{ height: '280px', overflow: 'auto' }}>
            <Timeline
              size="small"
              items={[
                {
                  dot: <PlayCircleOutlined style={{ color: '#52c41a' }} />,
                  children: (
                    <div>
                      <Text strong style={{ fontSize: '13px' }}>Discovery Run Completed</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>Found 4 new opportunities • 2 hours ago</Text>
                    </div>
                  )
                },
                {
                  dot: <PlusOutlined style={{ color: '#1890ff' }} />,
                  children: (
                    <div>
                      <Text strong style={{ fontSize: '13px' }}>Content Generated</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>Created post for "Remote team managers" • 1 day ago</Text>
                    </div>
                  )
                },
                {
                  dot: <SearchOutlined style={{ color: '#fa8c16' }} />,
                  children: (
                    <div>
                      <Text strong style={{ fontSize: '13px' }}>Keyword Trend Detected</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>AI productivity tools trending up 40% • 3 days ago</Text>
                    </div>
                  )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardTab;