import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Typography, message } from 'antd';
import {
  RiseOutlined,
  SearchOutlined,
  BarChartOutlined,
  CalendarOutlined,
  SoundOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTabMode } from '../../hooks/useTabMode';
import { useWorkflowMode } from '../../contexts/WorkflowModeContext';
import WebsiteAnalysisStepStandalone from '../Workflow/steps/WebsiteAnalysisStepStandalone';
import UnifiedWorkflowHeader from './UnifiedWorkflowHeader';
import FeatureTile from './FeatureTile';
import MiniCalendarWidget from './MiniCalendarWidget';
import autoBlogAPI from '../../services/api';
import { systemVoice } from '../../copy/systemVoice';

const { Text, Paragraph } = Typography;


const DashboardTab = ({ forceWorkflowMode = false, onNextStep, onEnterProjectMode, showSaveProjectButton = false, onSaveProject, isNewRegistration = false, projectJustSaved = false, onCreateNewPost, onNavigateToTab }) => {
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
    updateCTAData,
    updateWebSearchInsights,
    updateAnalysisCompleted,
    requireAuth,
    addStickyWorkflowStep,
    updateStickyWorkflowStep,
    // Session management
    sessionId,
    initializeSession
  } = useWorkflowMode();
  
  // Keep only UI-specific local state
  const [scanningMessage, setScanningMessage] = useState('');
  const [textAnimationComplete, setTextAnimationComplete] = useState(false);
  const [inputIsEditing, setInputIsEditing] = useState(true); // Track input editing state for header fade

  // Feature dashboard state (for focus mode)
  const [integrations, setIntegrations] = useState({
    trends: { connected: false, summary: '', loading: true },
    searchConsole: { connected: false, summary: '', loading: true },
    analytics: { connected: false, summary: '', loading: true },
    voice: { connected: false, summary: '', loading: true, samplesCount: 0 }
  });

  // Load cached analysis for logged-in users
  useEffect(() => {
    
    const loadCachedAnalysis = async () => {
      // Check if we need to load analysis data
      const hasValidAnalysisData = stepResults.home.websiteAnalysis?.businessName && 
                                  stepResults.home.websiteAnalysis?.targetAudience &&
                                  stepResults.home.websiteAnalysis?.contentFocus;
      
      // Analysis state check
      
      // Load for authenticated users who don't have complete analysis data
      if (user && !forceWorkflowMode && tabMode.mode === 'focus' && !hasValidAnalysisData) {
        try {
          const response = await autoBlogAPI.getRecentAnalysis();
          
          if (response.success && response.analysis) {
            
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
            
          } else {
          }
        } catch (error) {
          console.error('Failed to load cached analysis:', error.message);
          // Don't show error to user - this is just a nice-to-have feature
        }
      } else if (hasValidAnalysisData) {
        // Analysis data already present, skipping database load
      } else {
        // Skipping cached analysis load
      }
    };

    loadCachedAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional; many workflow setters used inside
  }, [user, tabMode.mode, forceWorkflowMode, stepResults.home.websiteAnalysis?.businessName]); // Re-run when user, mode, or analysis data changes

  // Initialize session for anonymous users
  useEffect(() => {
    const handleSessionInitialization = async () => {
      // Only initialize session for anonymous users if session doesn't exist
      if (!user && !sessionId && tabMode.mode === 'focus') {
        try {
          await initializeSession();
        } catch (error) {
          console.error('Failed to initialize session in DashboardTab:', error);
        }
      }
    };

    handleSessionInitialization();
  }, [user, sessionId, tabMode.mode, initializeSession]);

  // Fetch integration statuses for feature dashboard (focus mode only)
  useEffect(() => {
    const fetchIntegrations = async () => {
      if (!user || tabMode.mode !== 'focus' || forceWorkflowMode) {
        return; // Only fetch in focus mode for logged-in users
      }

      try {
        // TODO: Implement actual API endpoints for checking Google integration status
        // For now, using placeholder logic

        // Check Voice Adaptation (voice samples)
        try {
          const voiceSamples = await autoBlogAPI.listVoiceSamples(user.organizationId);
          const samplesCount = voiceSamples?.samples?.length || 0;

          let summary = '';
          if (samplesCount > 0) {
            const profile = voiceSamples.samples[0]; // Get first sample's profile
            summary = `${samplesCount} writing sample${samplesCount > 1 ? 's' : ''} uploaded. `;

            // Add tone/style info if available
            if (profile?.tone) {
              summary += `Tone: ${profile.tone}. `;
            }
            summary += 'Voice profile ready for content generation.';
          }

          setIntegrations(prev => ({
            ...prev,
            voice: {
              connected: samplesCount > 0,
              samplesCount,
              summary,
              loading: false
            }
          }));
        } catch (error) {
          console.error('Failed to fetch voice samples:', error);
          setIntegrations(prev => ({
            ...prev,
            voice: {
              connected: false,
              samplesCount: 0,
              summary: '',
              loading: false
            }
          }));
        }

        // Google Trends - placeholder (always show as not connected for now)
        setIntegrations(prev => ({
          ...prev,
          trends: {
            connected: false,
            summary: '',
            loading: false
          }
        }));

        // Google Search Console - placeholder
        setIntegrations(prev => ({
          ...prev,
          searchConsole: {
            connected: false,
            summary: '',
            loading: false
          }
        }));

        // Google Analytics - placeholder
        setIntegrations(prev => ({
          ...prev,
          analytics: {
            connected: false,
            summary: '',
            loading: false
          }
        }));

      } catch (error) {
        console.error('Failed to fetch integrations:', error);
      }
    };

    fetchIntegrations();
  }, [user, tabMode.mode, forceWorkflowMode]);

  // Handle create new post action
  const handleCreateNewPost = () => {
    // Navigate to posts tab or trigger post creation
    if (onEnterProjectMode) {
      onEnterProjectMode();
    } else {
      tabMode.enterWorkflowMode();
    }
  };

  // Handle analysis completion from standalone component
  const handleAnalysisComplete = (data) => {
    // Update unified workflow state only (no local state)
    // CRITICAL: Include websiteUrl in the analysis data for registration prepopulation
    updateWebsiteAnalysis({
      ...data.analysis,
      websiteUrl: data.websiteUrl || websiteUrl
    });
    updateWebSearchInsights(data.webSearchInsights || { researchQuality: 'basic' });
    updateAnalysisCompleted(true);

    // Update CTA data if present
    if (data.ctas || data.ctaCount !== undefined) {
      updateCTAData({
        ctas: data.ctas || [],
        ctaCount: data.ctaCount || 0,
        hasSufficientCTAs: data.hasSufficientCTAs || false
      });
    }

    // Update progressive sticky header with analysis results
    updateStickyWorkflowStep('websiteAnalysis', {
      websiteUrl: data.websiteUrl || websiteUrl,
      businessName: data.analysis?.businessName || data.analysis?.companyName || '',
      businessType: data.analysis?.businessType || data.analysis?.industry || '',
      ...data.analysis
    });

    // Note: Auto-save is now handled by useEffect below to ensure proper state propagation
  };
  
  // Handle continue to next step - scroll to audience section in workflow mode
  const handleContinueToAudience = () => {

    // Scroll to audience section immediately
    const audienceSection = document.getElementById('audience-segments');
    if (audienceSection) {
      audienceSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    } else {
      console.error('Could not find audience-segments section');
    }
  };

  // Handle feature tile navigation (for dashboard tiles)
  const handleFeatureTileConnect = (service) => {
    if (!onNavigateToTab) {
      console.warn('onNavigateToTab not provided to DashboardTab');
      return;
    }

    // Navigate to appropriate settings based on service
    switch (service) {
      case 'trends':
      case 'search-console':
      case 'analytics':
        onNavigateToTab('google-integrations');
        message.info(`Navigate to Google Integrations to connect ${service}`);
        break;
      case 'voice-adaptation':
        onNavigateToTab('voice-adaptation');
        break;
      default:
        console.log(`Unknown service: ${service}`);
    }
  };

  const handleFeatureTileViewDetails = (service) => {
    if (!onNavigateToTab) {
      console.warn('onNavigateToTab not provided to DashboardTab');
      return;
    }

    // Navigate to appropriate settings view
    switch (service) {
      case 'trends':
      case 'search-console':
      case 'analytics':
        onNavigateToTab('google-integrations');
        break;
      case 'voice-adaptation':
        onNavigateToTab('voice-adaptation');
        break;
      case 'calendar':
        onNavigateToTab('posts');
        break;
      default:
        console.log(`Unknown service: ${service}`);
    }
  };

  const handleCalendarDateClick = (date) => {
    if (!onNavigateToTab) {
      console.warn('onNavigateToTab not provided to DashboardTab');
      return;
    }
    // Navigate to Posts tab
    onNavigateToTab('posts');
    message.info('Opening posts calendar...');
  };

  const hasCachedAnalysis = user && tabMode.mode === 'focus' &&
    stepResults.home.websiteAnalysis?.businessName &&
    stepResults.home.websiteAnalysis?.targetAudience;
  const welcomeBackContext = hasCachedAnalysis
    ? (stepResults.home.websiteAnalysis?.targetAudience
        || stepResults.home.websiteAnalysis?.businessType
        || null)
    : null;

  // Debug logging to help troubleshoot visibility issues
  console.log('🎯 DashboardTab render:', {
    user: !!user,
    'tabMode.mode': tabMode.mode,
    forceWorkflowMode,
    'Will show feature tiles': tabMode.mode === 'focus' && !forceWorkflowMode && user,
    'Will show workflow': tabMode.mode === 'workflow' || forceWorkflowMode
  });

  return (
    <div>
      <div className="dashboard-tab-content" style={{ padding: 'var(--space-6)' }}>
        {/* DEBUG: Mode indicator - Remove after testing */}
        <div style={{
          position: 'fixed',
          top: 10,
          right: 10,
          padding: '8px 12px',
          background: tabMode.mode === 'focus' ? '#52c41a' : '#1890ff',
          color: 'white',
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 'bold',
          zIndex: 9999
        }}>
          Mode: {tabMode.mode.toUpperCase()} {forceWorkflowMode ? '(FORCED)' : ''} {user ? '(LOGGED IN)' : '(NOT LOGGED IN)'}
        </div>

        {/* Unified Header - Shows for both logged-out workflow and logged-in users */}
        <UnifiedWorkflowHeader
          user={user}
          onCreateNewPost={onCreateNewPost || handleCreateNewPost}
          forceWorkflowMode={forceWorkflowMode}
          currentStep={currentStep}
          analysisCompleted={stepResults.home.analysisCompleted}
          showSaveProjectButton={showSaveProjectButton}
          onSaveProject={onSaveProject}
          isNewRegistration={isNewRegistration}
          completedSteps={[]} // Will be populated based on workflow progress
          projectJustSaved={projectJustSaved}
          enableSequentialAnimation={currentStep === 0}
          onSequenceComplete={() => setTextAnimationComplete(true)}
          inputIsEditing={inputIsEditing}
        />

        {/* Welcome-back hint when user has cached analysis (anticipatory UX) */}
        {hasCachedAnalysis && welcomeBackContext && (
          <div style={{
            padding: '10px var(--space-4)',
            marginBottom: 'var(--space-4)',
            backgroundColor: 'var(--color-gray-50)',
            border: '1px solid var(--color-border-base)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}>
            {systemVoice.suggestions.welcomeBackCached(`"${welcomeBackContext}"`)}
          </div>
        )}

        {/* Main Content Area - Consistent layout for both states */}
        <div style={{
          minHeight: '400px',
          transition: 'all var(--transition-normal)',
          position: 'relative'
        }}>
          {/* Website Analysis Section - Show in workflow mode only */}
          {(tabMode.mode === 'workflow' || forceWorkflowMode) && (
            <div
              key="website-analysis"
              style={{
                opacity: 1,
                transform: 'translateY(0)',
                transition: 'opacity 0.6s ease, transform 0.6s ease'
              }}
            >
            <Row gutter={[16, 16]} style={{ marginBottom: 'var(--space-6)' }}>
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
                  onEditingStateChange={setInputIsEditing}

                  // Configuration
                  embedded={true}
                  showTitle={false}
                  autoAnalyze={false}

                  // Animation props
                  delayedReveal={!user && currentStep === 0}
                  showInput={textAnimationComplete}
                />
                
                {/* Continue Button + anticipatory suggestion - Show after analysis completes and only in workflow mode */}
                {stepResults.home.analysisCompleted && stepResults.home.websiteAnalysis && (tabMode.mode === 'workflow' || forceWorkflowMode) && (
                  <Card style={{ marginTop: 'var(--space-4)' }}>
                    <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                      <Paragraph style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-base)', color: 'var(--color-text-primary)' }}>
                        {systemVoice.suggestions.afterAnalysis(
                          stepResults.home.websiteAnalysis.targetAudience || stepResults.home.websiteAnalysis.businessType
                        )}
                      </Paragraph>
                      <Button 
                        type="primary" 
                        size="large"
                        onClick={onNextStep || handleContinueToAudience}
                        style={{ minWidth: '200px' }}
                      >
                        {onNextStep ? 'Next Step: Audience Selection' : 'Continue to Audience'}
                      </Button>
                      <div style={{ marginTop: '8px' }}>
                        <Text type="secondary">
                          {systemVoice.suggestions.nextStepAudience}
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
        {tabMode.mode === 'focus' && !forceWorkflowMode && user && (
          <>
            {/* Dashboard Features - Enhanced layout */}
            <div
              key="dashboard-features"
              style={{
                animation: user ? 'fadeInUp 0.6s ease-out' : 'none',
                animationFillMode: 'both',
                padding: '24px 0'
              }}
            >
              <Row gutter={[24, 24]}>
                {/* Row 1: Google integrations */}
                <Col xs={24} sm={24} md={8}>
                  <FeatureTile
                    title="Find Emerging Topics"
                    icon={<RiseOutlined />}
                    connected={integrations.trends.connected}
                    summary={integrations.trends.summary || 'See what people are searching for right now. Create content on rising topics before your competitors.'}
                    loading={integrations.trends.loading}
                    onConnect={() => handleFeatureTileConnect('trends')}
                    onViewDetails={() => handleFeatureTileViewDetails('trends')}
                  />
                </Col>

                <Col xs={24} sm={24} md={8}>
                  <FeatureTile
                    title="Improve Search Rankings"
                    icon={<SearchOutlined />}
                    connected={integrations.searchConsole.connected}
                    summary={integrations.searchConsole.summary || "Track your Google rankings and discover keywords where you're close to page 1. Automatically create content to boost visibility."}
                    loading={integrations.searchConsole.loading}
                    onConnect={() => handleFeatureTileConnect('search-console')}
                    onViewDetails={() => handleFeatureTileViewDetails('search-console')}
                  />
                </Col>

                <Col xs={24} sm={24} md={8}>
                  <FeatureTile
                    title="Track What Converts"
                    icon={<BarChartOutlined />}
                    connected={integrations.analytics.connected}
                    summary={integrations.analytics.summary || 'See which content drives leads and customers. Automatically create more content following your best-performing patterns.'}
                    loading={integrations.analytics.loading}
                    onConnect={() => handleFeatureTileConnect('analytics')}
                    onViewDetails={() => handleFeatureTileViewDetails('analytics')}
                  />
                </Col>

                {/* Row 2: Calendar + Voice */}
                <Col xs={24} sm={24} md={12}>
                  {/* Calendar widget card */}
                  <Card
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CalendarOutlined />
                        <span>Upcoming Posts</span>
                      </div>
                    }
                    extra={
                      <Button
                        type="link"
                        onClick={() => {
                          console.log('View Calendar clicked');
                          handleFeatureTileViewDetails('calendar');
                        }}
                      >
                        View Calendar →
                      </Button>
                    }
                    style={{ height: '100%', minHeight: 220 }}
                  >
                    <MiniCalendarWidget
                      onDateClick={handleCalendarDateClick}
                      api={autoBlogAPI}
                    />
                  </Card>
                </Col>

                <Col xs={24} sm={24} md={12}>
                  <FeatureTile
                    title="Voice Adaptation"
                    icon={<SoundOutlined />}
                    connected={integrations.voice.connected}
                    summary={integrations.voice.summary || 'Upload writing samples so we can learn your voice and generate blog content that sounds like you.'}
                    loading={integrations.voice.loading}
                    onConnect={() => handleFeatureTileConnect('voice-adaptation')}
                    onViewDetails={() => handleFeatureTileViewDetails('voice-adaptation')}
                  />
                </Col>
              </Row>
            </div>

            {/* CSS animations for dashboard features */}
            <style jsx="true">{`
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