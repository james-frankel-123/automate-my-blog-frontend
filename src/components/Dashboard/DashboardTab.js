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
import WebsiteAnalysisStepStandalone from '../Workflow/steps/WebsiteAnalysisStepStandalone';
import UnifiedWorkflowHeader from './UnifiedWorkflowHeader';
import { format } from 'date-fns';
import autoBlogAPI from '../../services/api';

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

const DashboardTab = ({ forceWorkflowMode = false, onNextStep, onEnterProjectMode, showSaveProjectButton = false, onSaveProject, isNewRegistration = false, projectJustSaved = false }) => {
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
    requireAuth,
    addStickyWorkflowStep,
    updateStickyWorkflowStep,
    saveWorkflowState
  } = useWorkflowMode();
  const [automationSettings, setAutomationSettings] = useState(dummyAutomationSettings);
  const [discoveries, setDiscoveries] = useState(dummyDiscoveries.slice(0, 2)); // Show top 2 on dashboard
  const [loading, setLoading] = useState(false);
  
  // Keep only UI-specific local state
  const [scanningMessage, setScanningMessage] = useState('');

  // Load cached analysis for logged-in users
  useEffect(() => {
    console.log('🚀 DashboardTab: Analysis loading useEffect triggered');
    console.log('📊 Current stepResults.home:', stepResults.home);
    
    const loadCachedAnalysis = async () => {
      // Check if we need to load analysis data
      const hasValidAnalysisData = stepResults.home.websiteAnalysis?.businessName && 
                                  stepResults.home.websiteAnalysis?.targetAudience &&
                                  stepResults.home.websiteAnalysis?.contentFocus;
      
      console.log('🔍 Analysis state check:', {
        user: !!user,
        userId: user?.id,
        forceWorkflowMode,
        tabMode: tabMode.mode,
        analysisCompleted: stepResults.home.analysisCompleted,
        hasValidData: hasValidAnalysisData,
        businessName: stepResults.home.websiteAnalysis?.businessName || 'None',
        targetAudience: stepResults.home.websiteAnalysis?.targetAudience || 'None',
        contentFocus: stepResults.home.websiteAnalysis?.contentFocus || 'None',
        fullWebsiteAnalysis: stepResults.home.websiteAnalysis
      });
      
      // Load for authenticated users who don't have complete analysis data
      if (user && !forceWorkflowMode && tabMode.mode === 'focus' && !hasValidAnalysisData) {
        try {
          console.log('🔍 Loading cached analysis for dashboard...');
          const response = await autoBlogAPI.getRecentAnalysis();
          
          if (response.success && response.analysis) {
            console.log('📊 Found cached analysis:', response.analysis.businessName || 'Unknown business');
            
            // Update the unified workflow state with cached data
            updateWebsiteAnalysis(response.analysis);
            updateAnalysisCompleted(true);
            setWebsiteUrl(response.analysis.websiteUrl || '');
            
            // Update sticky workflow step
            updateStickyWorkflowStep('websiteAnalysis', {
              websiteUrl: response.analysis.websiteUrl || '',
              businessName: response.analysis.businessName || '',
              businessType: response.analysis.businessType || '',
              ...response.analysis
            });
            
            console.log('✅ Cached analysis loaded successfully');
          } else {
            console.log('ℹ️ No cached analysis found in database');
          }
        } catch (error) {
          console.error('❌ Failed to load cached analysis:', error.message);
          // Don't show error to user - this is just a nice-to-have feature
        }
      } else if (hasValidAnalysisData) {
        console.log('✅ Analysis data already present, skipping database load');
      } else {
        console.log('ℹ️ Skipping cached analysis load:', {
          reason: !user ? 'Not authenticated' : 
                  forceWorkflowMode ? 'In forced workflow mode' :
                  tabMode.mode !== 'focus' ? 'Not in focus mode' : 'Other'
        });
      }
    };

    loadCachedAnalysis();
  }, [user, tabMode.mode, forceWorkflowMode, stepResults.home.websiteAnalysis?.businessName]); // Re-run when user, mode, or analysis data changes

  // Auto-save workflow state when analysis completes (proper state-based timing)
  useEffect(() => {
    const hasValidAnalysisData = stepResults.home.websiteAnalysis?.businessName && 
                                stepResults.home.websiteAnalysis?.targetAudience &&
                                stepResults.home.websiteAnalysis?.contentFocus;
    
    // Only auto-save if analysis is completed AND we have valid data AND user is logged in
    if (stepResults.home.analysisCompleted && hasValidAnalysisData && user) {
      console.log('💾 Auto-saving workflow state due to analysis completion...');
      console.log('💾 Analysis data present:', {
        businessName: stepResults.home.websiteAnalysis.businessName,
        targetAudience: stepResults.home.websiteAnalysis.targetAudience,
        contentFocus: stepResults.home.websiteAnalysis.contentFocus,
        analysisCompleted: stepResults.home.analysisCompleted
      });
      
      // Save with a small delay to ensure all React updates are complete
      setTimeout(() => {
        const saved = saveWorkflowState();
        console.log('💾 Auto-save result after analysis completion:', saved);
        
        // Verify what was actually saved
        const verification = localStorage.getItem('automate-my-blog-workflow-state');
        if (verification) {
          const parsedVerification = JSON.parse(verification);
          console.log('🔍 Verification - what was actually saved:', {
            analysisCompleted: parsedVerification.analysisCompleted,
            businessName: parsedVerification.stepResults?.home?.websiteAnalysis?.businessName,
            hasStepResults: !!parsedVerification.stepResults,
            savedAt: parsedVerification.savedAt
          });
        }
      }, 200); // Slightly longer delay for state propagation
    }
  }, [stepResults.home.analysisCompleted, stepResults.home.websiteAnalysis?.businessName, user, saveWorkflowState]);

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
    // This starts the guided project from Dashboard → Audience → Posts
    if (onEnterProjectMode) {
      onEnterProjectMode();
    } else {
      tabMode.enterWorkflowMode();
    }
    message.success('Starting guided creation project');
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
    console.log('🎉 Analysis completed in DashboardTab:', {
      hasData: !!data,
      hasAnalysis: !!data?.analysis,
      businessName: data?.analysis?.businessName,
      fullData: data
    });
    
    // Update unified workflow state only (no local state)
    console.log('📊 Updating workflow state with analysis data...');
    updateWebsiteAnalysis(data.analysis);
    updateWebSearchInsights(data.webSearchInsights || { researchQuality: 'basic' });
    updateAnalysisCompleted(true);
    console.log('✅ Workflow state updated');
    
    // Update progressive sticky header with analysis results
    updateStickyWorkflowStep('websiteAnalysis', {
      websiteUrl: websiteUrl,
      businessName: data.analysis?.businessName || data.analysis?.companyName || '',
      businessType: data.analysis?.businessType || data.analysis?.industry || '',
      ...data.analysis
    });
    
    // Note: Auto-save is now handled by useEffect below to ensure proper state propagation
  };
  
  // Handle continue to next step - scroll to audience section in workflow mode
  const handleContinueToAudience = () => {
    console.log('🚀 Continue to Audience clicked');
    
    // Scroll to audience section immediately
    const audienceSection = document.getElementById('audience-segments');
    if (audienceSection) {
      audienceSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      console.log('✅ Scrolled to audience section');
    } else {
      console.error('❌ Could not find audience-segments section');
    }
  };

  // Prepare step data for workflow mode
  const prepareStepData = () => ({
    selectedAction: 'create-post',
    timestamp: new Date().toISOString()
  });

  return (
    <div>
      
      <div style={{ padding: '24px' }}>
        {/* Unified Header - Shows for both logged-out workflow and logged-in users */}
        <UnifiedWorkflowHeader
          user={user}
          onCreateNewPost={handleCreateNewPost}
          forceWorkflowMode={forceWorkflowMode}
          currentStep={currentStep}
          analysisCompleted={stepResults.home.analysisCompleted}
          showSaveProjectButton={showSaveProjectButton}
          onSaveProject={onSaveProject}
          isNewRegistration={isNewRegistration}
          completedSteps={[]} // Will be populated based on workflow progress
          projectJustSaved={projectJustSaved}
        />

        {/* Main Content Area - Consistent layout for both states */}
        <div style={{
          minHeight: '400px',
          transition: 'all 0.3s ease',
          position: 'relative'
        }}>
          {/* Website Analysis Section - Always show if analysis is not completed or in workflow mode */}
          {((tabMode.mode === 'workflow' || forceWorkflowMode) || (!stepResults.home.analysisCompleted && user)) && (
            <div
              key="website-analysis"
              style={{
                opacity: 1,
                transform: 'translateY(0)',
                transition: 'opacity 0.6s ease, transform 0.6s ease'
              }}
            >
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
                  addStickyWorkflowStep={addStickyWorkflowStep}
                  updateStickyWorkflowStep={updateStickyWorkflowStep}
                  
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
                        onClick={onNextStep || handleContinueToAudience}
                        style={{ minWidth: '200px' }}
                      >
                        {onNextStep ? 'Next Step: Audience Selection' : 'Continue to Audience Selection'}
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
            </div>
          )}

        {/* FOCUS MODE: Full Dashboard Features (Premium) - Only show when explicitly in dashboard mode */}
        {tabMode.mode === 'focus' && !forceWorkflowMode && (
          <>
            {/* Dashboard Features - Enhanced layout */}
            <div
              key="dashboard-features"
              style={{
                animation: user ? 'fadeInUp 0.6s ease-out' : 'none',
                animationFillMode: 'both'
              }}
            >

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
                {stepResults.home.analysisCompleted ? 'Continue Project' : 'Create New Post'}
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
            </div>
            
            {/* CSS animations for dashboard features */}
            <style jsx>{`
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(30px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
          </>
        )}
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;