import React, { useEffect, useCallback, useMemo } from 'react';
import { Steps, message, Typography, Button, Space } from 'antd';
import { LoginOutlined, UserAddOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkflowState } from '../../hooks/useWorkflowState-v2';
import { analysisAPI, topicAPI, contentAPI, workflowConfig } from '../../services/workflowAPI';
import { ExportService } from '../../services/exportService';
import workflowUtils from '../../utils/workflowUtils';
import AuthModal from '../Auth/AuthModal';
// Import step components
import WebsiteAnalysisStep from './steps/WebsiteAnalysisStep-v2';
import CustomerStrategyStep from './steps/CustomerStrategyStep-v2';
import TopicSelectionStep from './steps/TopicSelectionStep-v2';
import ContentGenerationStep from './steps/ContentGenerationStep-v2';
import ContentEditingStep from './steps/ContentEditingStep-v2';
import ExportStep from './steps/ExportStep-v2';

const { Title, Paragraph, Text } = Typography;

/**
 * WorkflowContainer v2
 * Complete workflow implementation using clean architecture
 * Replaces the monolithic App.js workflow with proper separation of concerns
 */
const WorkflowContainerV2 = ({ embedded = false }) => {
  // =============================================================================
  // HOOKS & STATE MANAGEMENT
  // =============================================================================
  
  const { user, loginContext, clearLoginContext, setNavContext } = useAuth();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  // Handle window resize for responsive behavior
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const workflowState = useWorkflowState(); // All 28 state variables + helpers

  // =============================================================================
  // BUSINESS LOGIC FUNCTIONS
  // =============================================================================

  /**
   * Authentication gate helper
   * EXTRACTED & ENHANCED FROM: App.js requireAuth() function
   */
  const requireAuth = useCallback((action = '', context = 'gate') => {
    if (!user) {
      if (embedded) {
        message.warning('Please log in to access premium features');
        return false;
      }
      workflowState.setAuthContext(context);
      workflowState.setShowAuthModal(true);
      return false;
    }
    return true;
  }, [user, embedded, workflowState]);

  /**
   * Website analysis orchestration
   * ENHANCED FROM: App.js completeWebsiteAnalysis() function
   */
  const performWebsiteAnalysis = useCallback(async () => {
    try {
      // Validate URL first
      const validation = workflowUtils.urlUtils.validateWebsiteUrl(workflowState.websiteUrl);
      if (!validation.isValid) {
        message.error(validation.error);
        return false;
      }

      // Set loading state and progress
      workflowState.setIsLoading(true);
      workflowState.advanceStep(1); // Move to analysis step

      // Phase-by-phase progress messages
      const progressMessages = [
        'Analyzing website content...',
        '🔍 Researching brand guidelines and social media...',
        '📊 Analyzing competitor keywords and search trends...',
        '👥 Gathering customer insights and reviews...',
        '🧠 Synthesizing insights with AI...'
      ];

      // Show progress messages with delays
      for (let i = 0; i < progressMessages.length; i++) {
        workflowState.setScanningMessage(progressMessages[i]);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Call API service
      const result = await analysisAPI.analyzeWebsite(validation.formattedUrl);

      if (result.success) {
        // Update state with analysis results
        workflowState.updateWebsiteAnalysis(result.analysis);
        workflowState.setWebSearchInsights(result.webSearchInsights);
        workflowState.setAnalysisCompleted(true);
        workflowState.setWebsiteUrl(validation.formattedUrl);
        
        message.success('Website analysis completed successfully!');
        return true;
      } else {
        // Handle error with fallback
        if (result.fallbackAnalysis) {
          workflowState.updateWebsiteAnalysis(result.fallbackAnalysis);
          workflowState.setAnalysisCompleted(true);
          message.warning('Website analysis completed with limited data. You can proceed or try a different URL.');
          return true;
        }
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Website analysis error:', error);
      message.error(`Analysis failed: ${error.message}`);
      workflowState.advanceStep(0); // Return to URL input
      return false;
    } finally {
      workflowState.setIsLoading(false);
    }
  }, [workflowState]);

  /**
   * Topic generation orchestration
   * ENHANCED FROM: App.js loadTrendingTopics() and proceedWithTopicGeneration()
   */
  const generateTopics = useCallback(async () => {
    try {
      // Check if analysis is ready
      if (!workflowState.analysisCompleted) {
        message.warning('Please complete website analysis first');
        return false;
      }

      workflowState.setIsLoading(true);
      workflowState.setScanningMessage('Generating trending topics with AI...');

      // Call API service
      const result = await topicAPI.generateTrendingTopics(
        workflowState.stepResults.websiteAnalysis,
        workflowState.selectedCustomerStrategy,
        workflowState.webSearchInsights
      );

      if (result.success) {
        workflowState.updateTrendingTopics(result.topics);
        workflowState.setStrategyCompleted(true);
        
        if (result.isFallback) {
          message.warning(result.message);
        } else {
          message.success(result.message);
        }
        
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Topic generation error:', error);
      message.error(`Failed to generate topics: ${error.message}`);
      return false;
    } finally {
      workflowState.setIsLoading(false);
    }
  }, [workflowState]);

  /**
   * Content generation orchestration
   * ENHANCED FROM: App.js generateContent() function
   */
  const generateContent = useCallback(async (topicId) => {
    if (!topicId) {
      message.warning('Please select a topic first');
      return false;
    }

    // Check authentication for premium features
    if (!workflowState.demoMode && !requireAuth('Generate content', 'gate')) {
      return false;
    }

    try {
      workflowState.setSelectedTopic(topicId);
      workflowState.setIsLoading(true);
      workflowState.setBlogGenerating(true);
      workflowState.setScanningMessage('Generating your blog post with AI...');
      workflowState.advanceStep(3); // Move to content generation step

      // Find selected topic
      const selectedTopicData = workflowState.stepResults.trendingTopics?.find(t => t.id === topicId);
      if (!selectedTopicData) {
        throw new Error('Selected topic not found');
      }

      // Call API service
      const result = await contentAPI.generateContent(
        selectedTopicData,
        workflowState.stepResults.websiteAnalysis,
        workflowState.selectedCustomerStrategy,
        workflowState.webSearchInsights
      );

      if (result.success) {
        // Update state with generated content
        workflowState.setStepResults(prev => ({
          ...prev,
          finalContent: result.content,
          selectedContent: selectedTopicData,
          generatedBlogPost: result.blogPost
        }));
        
        workflowState.setGeneratedContent(result.content);
        workflowState.setPreviewMode(true); // Default to preview mode
        workflowState.advanceStep(4); // Move to editing step
        
        message.success('Blog post generated successfully!');
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Content generation error:', error);
      message.error(`Failed to generate content: ${error.message}`);
      workflowState.advanceStep(2); // Return to topic selection
      return false;
    } finally {
      workflowState.setIsLoading(false);
      workflowState.setBlogGenerating(false);
    }
  }, [workflowState, requireAuth]);

  /**
   * Content editing handler
   * ENHANCED FROM: App.js handleContentChange() function
   */
  const handleContentChange = useCallback((e) => {
    workflowState.setGeneratedContent(e.target.value);
  }, [workflowState]);

  /**
   * Export functions using service layer
   */
  const exportAsMarkdown = useCallback(() => {
    return ExportService.exportAsMarkdown(
      workflowState.selectedTopic,
      workflowState.generatedContent,
      workflowState.stepResults,
      workflowState.websiteUrl,
      workflowState.setPostState,
      workflowState.setPreviewMode
    );
  }, [workflowState]);

  const exportAsHTML = useCallback(() => {
    return ExportService.exportAsHTML(
      workflowState.selectedTopic,
      workflowState.generatedContent,
      workflowState.stepResults,
      workflowState.websiteUrl,
      workflowState.setPostState,
      workflowState.setPreviewMode
    );
  }, [workflowState]);

  const exportAsJSON = useCallback(() => {
    return ExportService.exportAsJSON(
      workflowState.selectedTopic,
      workflowState.generatedContent,
      workflowState.stepResults,
      workflowState.websiteUrl,
      workflowState.setPostState,
      workflowState.setPreviewMode
    );
  }, [workflowState]);

  const exportCompletePackage = useCallback(() => {
    return ExportService.exportCompletePackage(
      workflowState.selectedTopic,
      workflowState.generatedContent,
      workflowState.stepResults,
      workflowState.websiteUrl,
      workflowState.setPostState,
      workflowState.setPreviewMode
    );
  }, [workflowState]);

  /**
   * Get current post data using utility
   */
  const getCurrentPost = useCallback(() => {
    return workflowUtils.postUtils.createPostObject(
      workflowState.selectedTopic,
      workflowState.generatedContent,
      workflowState.stepResults,
      workflowState.websiteUrl
    );
  }, [workflowState]);

  /**
   * Strategy display helper
   */
  const getStrategyDisplayText = useCallback((type, value) => {
    return workflowUtils.strategyUtils.getDisplayText(type, value);
  }, []);

  /**
   * Reset workflow to beginning
   */
  const resetWorkflow = useCallback(() => {
    workflowState.resetWorkflow();
    message.info('Workflow reset. You can start fresh.');
  }, [workflowState]);

  // =============================================================================
  // LIFECYCLE EFFECTS
  // =============================================================================

  // Auto-trigger topic generation when reaching step 2
  useEffect(() => {
    if (workflowState.currentStep === 2 && workflowState.analysisCompleted && !workflowState.strategyCompleted) {
      const timer = setTimeout(() => {
        generateTopics();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [workflowState.currentStep, workflowState.analysisCompleted, workflowState.strategyCompleted, generateTopics]);

  // Handle post-login success messaging
  useEffect(() => {
    if (user && loginContext === 'gate') {
      workflowState.setShowAuthModal(false);
      workflowState.setAuthContext(null);
      message.success('Welcome! Premium features are now unlocked. Continue your workflow or visit the dashboard anytime.');
      clearLoginContext();
    }
  }, [user, loginContext, clearLoginContext, workflowState]);

  // =============================================================================
  // UI HELPER FUNCTIONS FOR LANDING PAGE
  // =============================================================================

  /**
   * Render authentication header for logged-out users
   * EXTRACTED FROM: App.js authentication header
   */
  const renderAuthHeader = () => {
    if (user || embedded) return null;

    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        marginBottom: '20px',
        padding: '10px 0'
      }}>
        <Space size="middle">
          <Button 
            type="text"
            icon={<LoginOutlined />}
            onClick={() => {
              workflowState.setAuthContext('login');
              workflowState.setShowAuthModal(true);
            }}
            style={{ color: '#6B8CAE' }}
          >
            Log In
          </Button>
          <Button 
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => {
              workflowState.setAuthContext('register');
              workflowState.setShowAuthModal(true);
            }}
            style={{ 
              backgroundColor: '#6B8CAE',
              borderColor: '#6B8CAE'
            }}
          >
            Sign Up Free
          </Button>
        </Space>
      </div>
    );
  };

  /**
   * Render marketing header for logged-out users
   * EXTRACTED FROM: App.js main header content
   */
  const renderMarketingHeader = () => {
    if (user || embedded) return null;

    return (
      <div style={{ 
        textAlign: 'center', 
        marginBottom: window.innerWidth <= 767 ? '20px' : '40px' 
      }}>
        <Title level={1} style={{ color: '#6B8CAE', marginBottom: '16px' }}>
          Automate My Blog
        </Title>
        <Paragraph style={{ fontSize: '18px', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
          Generate trending, high-quality blog posts automatically using AI. From topic discovery to full content creation, 
          then export to any platform. <Text strong>Works with WordPress, Shopify, Ghost, and 15+ platforms.</Text>
        </Paragraph>
        
        {workflowState.currentStep === 0 && (
          <div style={{ marginTop: '30px', maxWidth: '500px', margin: '30px auto 0' }}>
            <Text style={{ display: 'block', marginBottom: '16px', fontSize: '16px', fontWeight: 500 }}>
              Enter your website URL so we can analyze your business and create relevant content recommendations.
            </Text>
          </div>
        )}
      </div>
    );
  };

  /**
   * Render dashboard navigation for logged-in users
   * Shows context-aware navigation without disrupting workflow
   * Hidden when user is already in dashboard (embedded mode)
   */
  const renderDashboardNav = () => {
    if (!user) return null;

    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        padding: '10px 0',
        transform: embedded ? 'translateY(-100px)' : 'translateY(0)',
        opacity: embedded ? 0 : 1,
        transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '60px', // Fixed height to prevent layout shift
        pointerEvents: embedded ? 'none' : 'auto' // Disable interaction when hidden
      }}>
        <div>
          <Text style={{ color: '#666', fontSize: '14px' }}>
            Welcome back, {user.email}!
          </Text>
        </div>
        <Space size="middle">
          <Button 
            type="default"
            onClick={() => setNavContext()}
            style={{ color: '#6B8CAE' }}
          >
            View Dashboard
          </Button>
        </Space>
      </div>
    );
  };

  // =============================================================================
  // STEP COMPONENT RENDERING
  // =============================================================================

  const renderCurrentStep = () => {
    // Create props object inline to ensure all functions are fully initialized
    const stepComponentProps = {
      // All state from workflow hook
      ...workflowState,
      
      // Additional context
      user,
      embedded,
      
      // Business logic functions
      requireAuth,
      performWebsiteAnalysis,
      generateTopics,
      generateContent,
      handleContentChange,
      getCurrentPost,
      getStrategyDisplayText,
      resetWorkflow,
      
      // Export functions (now individual function references)
      exportAsMarkdown,
      exportAsHTML,
      exportAsJSON,
      exportCompletePackage,
      
      // Navigation
      setNavContext,
      
      // Configuration
      steps: workflowConfig.steps,
      cmsOptions: workflowConfig.cmsOptions
    };
    switch (workflowState.currentStep) {
      case 0:
      case 1:
        // Both step 0 (URL input) and step 1 (analysis loading/results) use WebsiteAnalysisStep
        return <WebsiteAnalysisStep {...stepComponentProps} />;
      case 2:
        return <CustomerStrategyStep {...stepComponentProps} />;
      case 3:
        return <ContentGenerationStep {...stepComponentProps} />;
      case 4:
        return <ContentEditingStep {...stepComponentProps} />;
      case 5:
        return <ExportStep {...stepComponentProps} />;
      default:
        return <WebsiteAnalysisStep {...stepComponentProps} />;
    }
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div style={{ 
      width: '100%', 
      maxWidth: isMobile ? '100%' : '1200px', 
      margin: '0 auto', 
      padding: embedded ? '0' : (isMobile ? '10px' : '20px'),
      transition: 'padding 1s cubic-bezier(0.4, 0, 0.2, 1)' 
    }}>
      {/* Authentication Header for logged-out users */}
      {renderAuthHeader()}

      {/* Dashboard Navigation for logged-in users */}
      {renderDashboardNav()}

      {/* Marketing Header for logged-out users */}
      {renderMarketingHeader()}

      {/* Progress Steps */}
      <div style={{ marginBottom: '40px' }}>
        <Steps
          current={workflowState.currentStep}
          items={workflowConfig.steps.map((step, index) => ({
            title: step.title,
            description: step.description,
            status: workflowUtils.progressUtils.getStepStatus(index, workflowState.currentStep)
          }))}
        />
      </div>

      {/* Render Current Step */}
      {renderCurrentStep()}

      {/* Authentication Modal */}
      <AuthModal 
        open={workflowState.showAuthModal}
        onClose={() => {
          workflowState.setShowAuthModal(false);
          workflowState.setAuthContext(null);
        }}
        context={workflowState.authContext}
      />
    </div>
  );
};

export default WorkflowContainerV2;