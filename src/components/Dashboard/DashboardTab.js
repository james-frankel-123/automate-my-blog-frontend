import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Typography } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import { useTabMode } from '../../hooks/useTabMode';
import { useWorkflowMode } from '../../contexts/WorkflowModeContext';
import WebsiteAnalysisStepStandalone from '../Workflow/steps/WebsiteAnalysisStepStandalone';
import UnifiedWorkflowHeader from './UnifiedWorkflowHeader';
import autoBlogAPI from '../../services/api';
import { systemVoice } from '../../copy/systemVoice';

const { Text, Paragraph } = Typography;


const DashboardTab = ({ forceWorkflowMode = false, onNextStep, onEnterProjectMode, showSaveProjectButton = false, onSaveProject, isNewRegistration = false, projectJustSaved = false, onCreateNewPost }) => {
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
    saveWorkflowState,
    // Session management
    sessionId,
    initializeSession
  } = useWorkflowMode();
  
  // Keep only UI-specific local state
  const [scanningMessage, setScanningMessage] = useState('');
  const [textAnimationComplete, setTextAnimationComplete] = useState(false);
  const [inputIsEditing, setInputIsEditing] = useState(true); // Track input editing state for header fade

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

  // Auto-save workflow state when analysis completes (proper state-based timing)
  useEffect(() => {
    const hasValidAnalysisData = stepResults.home.websiteAnalysis?.businessName &&
                                stepResults.home.websiteAnalysis?.targetAudience &&
                                stepResults.home.websiteAnalysis?.contentFocus;

    // CRITICAL: Save for both logged-in AND logged-out users
    // Logged-out users need their analysis saved so it can be restored after registration
    if (stepResults.home.analysisCompleted && hasValidAnalysisData) {
      // Save with a small delay to ensure all React updates are complete
      setTimeout(() => {
        saveWorkflowState();
      }, 200); // Slightly longer delay for state propagation
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional; contentFocus/targetAudience from stepResults
  }, [stepResults.home.analysisCompleted, stepResults.home.websiteAnalysis?.businessName, saveWorkflowState]);

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

  const hasCachedAnalysis = user && tabMode.mode === 'focus' &&
    stepResults.home.websiteAnalysis?.businessName &&
    stepResults.home.websiteAnalysis?.targetAudience;
  const welcomeBackContext = hasCachedAnalysis
    ? (stepResults.home.websiteAnalysis?.targetAudience
        || stepResults.home.websiteAnalysis?.businessType
        || null)
    : null;

  return (
    <div>
      <div className="dashboard-tab-content" style={{ padding: 'var(--space-6)' }}>
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
          {/* Website Analysis Section - Always show for authenticated users */}
          {((tabMode.mode === 'workflow' || forceWorkflowMode) || user) && (
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