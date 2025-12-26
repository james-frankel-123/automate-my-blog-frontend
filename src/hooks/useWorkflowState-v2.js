import { useState, useCallback } from 'react';

/**
 * Comprehensive Workflow State Management Hook
 * Manages all 28 state variables from App.js in organized sections
 */
export const useWorkflowState = () => {
  // =============================================================================
  // CORE WORKFLOW STATE
  // =============================================================================
  
  // Workflow progression and current state
  const [currentStep, setCurrentStep] = useState(0); // 0-6 workflow steps
  const [websiteUrl, setWebsiteUrl] = useState(''); // User's website URL
  const [selectedTopic, setSelectedTopic] = useState(null); // Selected topic ID
  const [generatedContent, setGeneratedContent] = useState(''); // AI-generated content
  
  // =============================================================================
  // LOADING & PROGRESS STATE  
  // =============================================================================
  
  // Loading states for different operations
  const [isLoading, setIsLoading] = useState(false); // General loading state
  const [scanningMessage, setScanningMessage] = useState(''); // Progress messages
  const [blogGenerating, setBlogGenerating] = useState(false); // Blog generation specific
  
  // Step completion flags
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [strategyCompleted, setStrategyCompleted] = useState(false);
  
  // =============================================================================
  // UI CONTROL STATE
  // =============================================================================
  
  // Edit and preview modes
  const [editingStep, setEditingStep] = useState(null); // Which step is being edited
  const [previewMode, setPreviewMode] = useState(false); // Content preview vs edit
  const [expandedSteps, setExpandedSteps] = useState([]); // Expanded step summaries
  
  // Modal visibility controls
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showStrategyGate, setShowStrategyGate] = useState(false);
  const [showExportWarning, setShowExportWarning] = useState(false);
  const [authContext, setAuthContext] = useState(null); // Auth context tracking
  
  // =============================================================================
  // BUSINESS LOGIC STATE
  // =============================================================================
  
  // Customer strategy and targeting
  const [selectedCustomerStrategy, setSelectedCustomerStrategy] = useState(null);
  const [strategySelectionCompleted, setStrategySelectionCompleted] = useState(false);
  
  // Content strategy configuration  
  const [contentStrategy, setContentStrategy] = useState({
    goal: 'awareness', // 'awareness', 'consideration', 'conversion', 'retention'
    voice: 'expert', // 'expert', 'friendly', 'insider', 'storyteller'
    template: 'problem-solution', // 'how-to', 'problem-solution', 'listicle', 'case-study', 'comprehensive'
    length: 'standard' // 'quick', 'standard', 'deep'
  });
  
  // Content management
  const [postState, setPostState] = useState('draft'); // 'draft', 'exported', 'locked'
  const [selectedCMS, setSelectedCMS] = useState(null); // Selected CMS platform
  
  // =============================================================================
  // CONTENT REVISION STATE
  // =============================================================================
  
  // Change tracking for regeneration
  const [previousContent, setPreviousContent] = useState('');
  const [showChanges, setShowChanges] = useState(false);
  const [customFeedback, setCustomFeedback] = useState('');
  
  // =============================================================================
  // RESEARCH & ENHANCEMENT STATE  
  // =============================================================================
  
  // Web search research insights
  const [webSearchInsights, setWebSearchInsights] = useState({
    brandResearch: null,
    keywordResearch: null,
    researchQuality: 'basic' // 'basic', 'enhanced', 'premium'
  });
  
  // Demo mode for testing
  const [demoMode, setDemoMode] = useState(
    process.env.REACT_APP_DEMO_MODE === 'true' || 
    window.location.search.includes('demo=true') ||
    localStorage.getItem('automyblog_demo_mode') === 'true'
  );
  
  // =============================================================================
  // CENTRAL DATA STORE
  // =============================================================================
  
  // Main data repository - used by 90% of functions
  const [stepResults, setStepResults] = useState({
    websiteAnalysis: {
      businessType: 'Child Wellness & Parenting',
      businessName: '',
      targetAudience: 'Parents of children aged 2-12',
      contentFocus: 'Emotional wellness, child development, mindful parenting',
      brandVoice: 'Warm, expert, supportive',
      description: '',
      keywords: [],
      decisionMakers: 'Parents of children aged 2-12',
      endUsers: 'Children experiencing anxiety or emotional challenges',
      customerProblems: [],
      searchBehavior: '',
      customerLanguage: [],
      contentIdeas: [],
      connectionMessage: '',
      businessModel: '',
      websiteGoals: '',
      blogStrategy: '',
      scenarios: [],
      brandColors: {
        primary: '#6B8CAE',
        secondary: '#F4E5D3',
        accent: '#8FBC8F'
      }
    },
    trendingTopics: [],
    selectedContent: null,
    finalContent: ''
  });
  
  // =============================================================================
  // STATE UPDATE HELPERS  
  // =============================================================================
  
  // Centralized step progression with validation
  const advanceStep = useCallback((targetStep) => {
    if (targetStep >= 0 && targetStep <= 6) {
      setCurrentStep(targetStep);
    }
  }, []);
  
  // Reset workflow to beginning
  const resetWorkflow = useCallback(() => {
    setCurrentStep(0);
    setWebsiteUrl('');
    setSelectedTopic(null);
    setGeneratedContent('');
    setIsLoading(false);
    setScanningMessage('');
    setBlogGenerating(false);
    setAnalysisCompleted(false);
    setStrategyCompleted(false);
    setEditingStep(null);
    setPreviewMode(false);
    setSelectedCustomerStrategy(null);
    setStrategySelectionCompleted(false);
    setPreviousContent('');
    setShowChanges(false);
    setCustomFeedback('');
    setPostState('draft');
    setSelectedCMS(null);
    // Keep stepResults structure but reset content
    setStepResults(prev => ({
      ...prev,
      trendingTopics: [],
      selectedContent: null,
      finalContent: ''
    }));
  }, []);
  
  // Update website analysis results
  const updateWebsiteAnalysis = useCallback((analysisData) => {
    setStepResults(prev => ({
      ...prev,
      websiteAnalysis: {
        ...prev.websiteAnalysis,
        ...analysisData
      }
    }));
  }, []);
  
  // Update trending topics
  const updateTrendingTopics = useCallback((topics) => {
    setStepResults(prev => ({
      ...prev,
      trendingTopics: topics
    }));
  }, []);
  
  // =============================================================================
  // RETURN ALL STATE AND HELPERS
  // =============================================================================
  
  return {
    // Core workflow state
    currentStep,
    setCurrentStep,
    websiteUrl,
    setWebsiteUrl,
    selectedTopic,
    setSelectedTopic,
    generatedContent,
    setGeneratedContent,
    
    // Loading & progress state
    isLoading,
    setIsLoading,
    scanningMessage,
    setScanningMessage,
    blogGenerating,
    setBlogGenerating,
    analysisCompleted,
    setAnalysisCompleted,
    strategyCompleted,
    setStrategyCompleted,
    
    // UI control state
    editingStep,
    setEditingStep,
    previewMode,
    setPreviewMode,
    expandedSteps,
    setExpandedSteps,
    showAuthModal,
    setShowAuthModal,
    showStrategyGate,
    setShowStrategyGate,
    showExportWarning,
    setShowExportWarning,
    authContext,
    setAuthContext,
    
    // Business logic state
    selectedCustomerStrategy,
    setSelectedCustomerStrategy,
    strategySelectionCompleted,
    setStrategySelectionCompleted,
    contentStrategy,
    setContentStrategy,
    postState,
    setPostState,
    selectedCMS,
    setSelectedCMS,
    
    // Content revision state
    previousContent,
    setPreviousContent,
    showChanges,
    setShowChanges,
    customFeedback,
    setCustomFeedback,
    
    // Research & enhancement state
    webSearchInsights,
    setWebSearchInsights,
    demoMode,
    setDemoMode,
    
    // Central data store
    stepResults,
    setStepResults,
    
    // Helper functions
    advanceStep,
    resetWorkflow,
    updateWebsiteAnalysis,
    updateTrendingTopics
  };
};

export default useWorkflowState;