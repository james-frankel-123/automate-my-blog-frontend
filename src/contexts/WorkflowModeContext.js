import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import autoBlogAPI from '../services/api';
/**
 * Workflow Mode Context
 * Manages global workflow state including Focus vs Workflow modes,
 * progressive headers, and cross-tab navigation
 */

const WorkflowModeContext = createContext();

// Workflow step configuration
const WORKFLOW_STEPS = [
  { key: 'home', tab: 'dashboard', title: 'Create New Post' },
  { key: 'audience', tab: 'audience-segments', title: 'Audience Selection' },
  { key: 'content', tab: 'posts', title: 'Content Creation' },
  { key: 'analytics', tab: 'analytics', title: 'Performance Tracking' }
];

const TAB_ORDER = ['dashboard', 'audience-segments', 'posts', 'analytics', 'settings'];

export const WorkflowModeProvider = ({ children }) => {
  // =============================================================================
  // AUTHENTICATION INTEGRATION
  // =============================================================================
  
  const { user, isAuthenticated, loading: authLoading, logout: _logout } = useAuth();
  
  // Track previous authentication state for logout detection
  const prevAuthStateRef = useRef(null);
  
  // =============================================================================
  // CORE WORKFLOW STATE
  // =============================================================================
  
  // Mode and navigation state
  const [mode, setMode] = useState('focus'); // 'workflow' | 'focus'
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState(0);
  const [completedWorkflowSteps, setCompletedWorkflowSteps] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Progressive headers data
  const [progressiveHeaders, setProgressiveHeaders] = useState([]);
  
  // Progressive sticky header for workflow steps
  const [stickyWorkflowSteps, setStickyWorkflowSteps] = useState([]);
  
  // Core workflow progression
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
  // Store post-login callback in ref to avoid re-renders/context churn (React #301 when login required before blog generation)
  const pendingActionRef = useRef(null);
  
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
  // SESSION & PERSISTENCE STATE
  // =============================================================================
  
  // Session management for audience persistence
  const [sessionId, setSessionId] = useState(null);
  const [audiences, setAudiences] = useState([]);
  const [loadingAudiences, setLoadingAudiences] = useState(false);
  const [sessionDataLoaded, setSessionDataLoaded] = useState(false);
  
  // =============================================================================
  // UNIFIED DATA STORE WITH NORMALIZED NAMING
  // =============================================================================
  
  // Main data repository with normalized step-oriented structure
  const [stepResults, setStepResults] = useState({
    home: {
      websiteAnalysis: {
        businessType: '',
        businessName: '',
        targetAudience: '',
        contentFocus: '',
        brandVoice: '',
        description: '',
        keywords: [],
        decisionMakers: '',
        endUsers: '',
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
          primary: '',
          secondary: '',
          accent: ''
        }
      },
      webSearchInsights: {
        brandResearch: null,
        keywordResearch: null,
        researchQuality: 'basic' // 'basic', 'enhanced', 'premium'
      },
      analysisCompleted: false,
      ctas: [],
      ctaCount: 0,
      hasSufficientCTAs: false
    },
    audience: {
      customerStrategy: null,
      targetSegments: []
    },
    content: {
      trendingTopics: [],
      selectedContent: null,
      finalContent: ''
    },
    analytics: {
      performance: null
    }
  });
  
  // Legacy workflowData for backward compatibility
  const [workflowData, setWorkflowData] = useState({
    company: null,
    audience: null,
    content: null,
    analytics: null
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
  const resetUnifiedWorkflow = useCallback(() => {
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
      audience: {
        ...prev.audience,
        customerStrategy: null,
        targetSegments: []
      },
      content: {
        ...prev.content,
        trendingTopics: [],
        selectedContent: null,
        finalContent: ''
      }
    }));
  }, []);
  
  // Update website analysis results
  const updateWebsiteAnalysis = useCallback((analysisData) => {
    setStepResults(prev => ({
      ...prev,
      home: {
        ...prev.home,
        websiteAnalysis: {
          ...prev.home.websiteAnalysis,
          ...analysisData
        }
      }
    }));
  }, []);

  // Update CTA data
  const updateCTAData = useCallback((ctaData) => {
    setStepResults(prev => ({
      ...prev,
      home: {
        ...prev.home,
        ctas: ctaData.ctas || [],
        ctaCount: ctaData.ctaCount || 0,
        hasSufficientCTAs: ctaData.hasSufficientCTAs || false
      }
    }));
  }, []);

  // Update web search insights
  const updateWebSearchInsights = useCallback((insightsData) => {
    setStepResults(prev => ({
      ...prev,
      home: {
        ...prev.home,
        webSearchInsights: {
          ...prev.home.webSearchInsights,
          ...insightsData
        }
      }
    }));
  }, []);
  
  // Update analysis completion status
  const updateAnalysisCompleted = useCallback((completed) => {
    setStepResults(prev => ({
      ...prev,
      home: {
        ...prev.home,
        analysisCompleted: completed
      }
    }));
  }, []);
  
  // Update trending topics
  const updateTrendingTopics = useCallback((topics) => {
    setStepResults(prev => ({
      ...prev,
      content: {
        ...prev.content,
        trendingTopics: topics
      }
    }));
  }, []);
  
  // Update customer strategy
  const updateCustomerStrategy = useCallback((strategy) => {
    setStepResults(prev => ({
      ...prev,
      audience: {
        ...prev.audience,
        customerStrategy: strategy
      }
    }));
  }, []);

  // =============================================================================
  // SESSION MANAGEMENT HELPERS (For Audience Persistence)
  // =============================================================================
  
  // Initialize or get session ID for anonymous users
  const initializeSession = useCallback(async () => {
    try {
      const currentSessionId = autoBlogAPI.getOrCreateSessionId();
      setSessionId(currentSessionId);
      console.log('🆔 Session initialized:', currentSessionId);
      return currentSessionId;
    } catch (error) {
      console.error('Failed to initialize session:', error);
      return null;
    }
  }, []);

  // Load user's audience strategies (authenticated or anonymous)
  const loadUserAudiences = useCallback(async () => {
    if (loadingAudiences) return;
    
    setLoadingAudiences(true);
    try {
      const response = await autoBlogAPI.getUserAudiences({ limit: 20 });
      if (response.success && response.audiences) {
        setAudiences(response.audiences);
        console.log('✅ Loaded audiences:', response.audiences.length);
      }
    } catch (error) {
      console.error('Failed to load audiences:', error);
    } finally {
      setLoadingAudiences(false);
    }
  }, [loadingAudiences]);

  // Save audience strategy
  const saveAudience = useCallback(async (audienceData) => {
    try {
      const response = await autoBlogAPI.createAudience(audienceData);
      if (response.success) {
        // Add to local audiences list
        setAudiences(prev => [response.audience, ...prev]);
        console.log('✅ Audience saved:', response.audience.id);
        return response.audience;
      }
    } catch (error) {
      console.error('Failed to save audience:', error);
      throw error;
    }
  }, []);

  // Adopt anonymous session when user logs in/registers
  const adoptAnonymousSession = useCallback(async (targetSessionId = null) => {
    const adoptSessionId = targetSessionId || sessionId;
    if (!adoptSessionId || !user) return;

    try {
      console.log('🔍 DEBUG: WorkflowModeContext starting adoption for sessionId:', adoptSessionId);
      
      const response = await autoBlogAPI.adoptSession(adoptSessionId);
      
      console.log('🔍 DEBUG: WorkflowModeContext received adoption response:', response);
      console.log('🔍 DEBUG: Response success:', response?.success);
      console.log('🔍 DEBUG: Response adopted (new):', response?.adopted);
      console.log('🔍 DEBUG: Response transferred (old):', response?.transferred);
      console.log('🔍 DEBUG: Response data:', response?.data);
      
      if (response?.success) {
        // Fix: backend returns 'adopted' not 'transferred'
        const adoptedData = response?.adopted || response?.transferred;
        console.log('🔄 Session adoption API call successful:', adoptedData);
        
        // VERIFY adoption worked by loading user data first
        console.log('🔍 DEBUG: Loading user audiences to verify adoption...');
        await loadUserAudiences();
        
        console.log('🔍 DEBUG: Current audiences count after loadUserAudiences:', audiences.length);
        
        // Adopt website analysis session data separately
        try {
          const analysisResponse = await autoBlogAPI.adoptAnalysisSession(adoptSessionId);
          console.log('🔍 DEBUG: Analysis adoption response:', analysisResponse);
          
          // Check if adoption returned meaningful data (not just empty object)
          const hasAnalysisData = analysisResponse?.success && 
            analysisResponse?.analysis && 
            Object.keys(analysisResponse.analysis).length > 0 &&
            (analysisResponse.analysis.businessType || analysisResponse.analysis.websiteUrl);
          
          if (hasAnalysisData) {
            console.log('🔄 Restoring website analysis from session adoption');
            updateWebsiteAnalysis(analysisResponse.analysis);
            updateAnalysisCompleted(true);
            
            // Update sticky workflow step if needed
            updateStickyWorkflowStep('websiteAnalysis', {
              websiteUrl: analysisResponse.analysis.websiteUrl || '',
              businessName: analysisResponse.analysis.businessName || '',
              businessType: analysisResponse.analysis.businessType || '',
              ...analysisResponse.analysis
            });
            
            console.log('✅ Website analysis restored from session adoption');
          } else {
            console.log('🔍 No analysis data from session adoption, trying to load recent analysis...');
            // Try to load recent analysis data if session adoption didn't return data
            try {
              const recentResponse = await autoBlogAPI.getRecentAnalysis();
              if (recentResponse?.success && recentResponse?.analysis && 
                  Object.keys(recentResponse.analysis).length > 0) {
                console.log('🔄 Restoring website analysis from recent data');
                updateWebsiteAnalysis(recentResponse.analysis);
                updateAnalysisCompleted(true);
                
                updateStickyWorkflowStep('websiteAnalysis', {
                  websiteUrl: recentResponse.analysis.websiteUrl || '',
                  businessName: recentResponse.analysis.businessName || '',
                  businessType: recentResponse.analysis.businessType || '',
                  ...recentResponse.analysis
                });
                
                console.log('✅ Website analysis restored from recent data');
              } else {
                console.log('🔍 No recent analysis data found');
              }
            } catch (recentError) {
              console.error('⚠️ Failed to load recent analysis:', recentError.message);
            }
          }
        } catch (analysisError) {
          console.error('⚠️ Website analysis adoption failed (non-critical):', analysisError.message);
          // Don't fail main adoption if analysis adoption fails
        }
        
        // Only clear session ID if we successfully have data in our context
        if (audiences.length > 0) {
          console.log('✅ Session data verified, clearing session ID');
          sessionStorage.removeItem('audience_session_id');
          setSessionId(null);
        } else {
          console.warn('⚠️ Session adopted but no audiences found, keeping session ID for retry');
          console.log('🔍 DEBUG: Adoption response had data:', response?.data?.audiences?.length || 0, 'audiences');
          // Keep session ID for potential retry - don't clear it yet
        }
        
        return adoptedData;
      } else {
        console.error('🔍 DEBUG: Adoption response was not successful:', response);
      }
    } catch (error) {
      console.error('🔍 DEBUG: Failed to adopt session - error details:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- updateAnalysisCompleted/updateStickyWorkflowStep/updateWebsiteAnalysis from context
  }, [sessionId, user, loadUserAudiences, audiences]);

  // =============================================================================
  // AUTHENTICATION GATES & PERMISSION CHECKS
  // =============================================================================
  
  // Authentication gate helper (preserved from WorkflowContainer-v2.js)
  const requireAuth = useCallback((_action = '', context = 'gate') => {
    if (!user) {
      setAuthContext(context);
      setShowAuthModal(true);
      return false;
    }
    return true;
  }, [user]);
  
  // Sign-up focused gate helper - defaults to register tab for conversion
  // Optional onSuccessCallback: run after successful login (Fixes #85 - save/post flow)
  // Callback stored in ref to avoid state-driven re-renders that trigger React #301.
  const requireSignUp = useCallback((_action = '', _context = 'Create your account', onSuccessCallback = null) => {
    if (!user) {
      setAuthContext('register');
      setShowAuthModal(true);
      if (onSuccessCallback && typeof onSuccessCallback === 'function') {
        pendingActionRef.current = onSuccessCallback;
      }
      return false;
    }
    return true;
  }, [user]);
  
  // Permission checker helper
  const hasPermission = useCallback((permission) => {
    return user?.permissions?.includes(permission) || false;
  }, [user]);
  
  // Role-based checks (preserved from AuthContext pattern)
  const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');
  const isSuperAdmin = user && user.role === 'super_admin';

  // Clear user-specific workflow data on logout (SECURITY)
  const clearUserSpecificData = useCallback(() => {
    
    // Reset user-specific workflow state but preserve public UI state
    setWebsiteUrl('');
    setSelectedTopic(null);
    setGeneratedContent('');
    setAnalysisCompleted(false);
    setStrategyCompleted(false);
    setSelectedCustomerStrategy(null);
    setStrategySelectionCompleted(false);
    setPreviousContent('');
    setCustomFeedback('');
    setPostState('draft');
    setSelectedCMS(null);
    
    // Reset step results to defaults but preserve structure
    setStepResults({
      home: {
        websiteAnalysis: {
          businessType: '',
          businessName: '',
          targetAudience: '',
          contentFocus: '',
          brandVoice: '',
          description: '',
          keywords: [],
          decisionMakers: '',
          endUsers: '',
          customerProblems: [],
          searchBehavior: '',
          customerLanguage: [],
          contentIdeas: [],
          connectionMessage: '',
          businessModel: '',
          websiteGoals: '',
          blogStrategy: '',
          scenarios: [],
          brandColors: { primary: '#6B8CAE', secondary: '#F4E5D3', accent: '#8FBC8F' }
        },
        webSearchInsights: {
          brandResearch: null,
          keywordResearch: null,
          researchQuality: 'basic'
        },
        analysisCompleted: false
      },
      audience: { customerStrategy: null, targetSegments: [] },
      content: { trendingTopics: [], selectedContent: null, finalContent: '' },
      analytics: { performance: null }
    });
    
    // Clear progressive headers
    setProgressiveHeaders([]);
  }, []);

  // =============================================================================
  // MODE TRANSITION FUNCTIONS (Enhanced)
  // =============================================================================
  
  // Mode transition functions
  const enterWorkflowMode = useCallback((startingStep = 0, initialData = {}) => {
    setMode('workflow');
    setCurrentWorkflowStep(startingStep);
    setWorkflowData(prev => ({ ...prev, ...initialData }));
    
    // Navigate to appropriate tab for this step
    const stepConfig = WORKFLOW_STEPS[startingStep];
    if (stepConfig) {
      setActiveTab(stepConfig.tab);
    }
  }, []);
  
  const exitWorkflowMode = useCallback(() => {
    setMode('focus');
    // Keep completed steps and data, just switch to focus mode
  }, []);
  
  const isWorkflowMode = mode === 'workflow';
  const isFocusMode = mode === 'focus';
  
  // Progressive header management
  const addProgressiveHeader = useCallback((stepKey, data) => {
    const stepConfig = WORKFLOW_STEPS.find(s => s.key === stepKey);
    if (!stepConfig) return;
    
    const headerData = {
      key: stepKey,
      title: stepConfig.title,
      tab: stepConfig.tab,
      data: data,
      timestamp: new Date().toISOString()
    };
    
    setProgressiveHeaders(prev => {
      const existing = prev.findIndex(h => h.key === stepKey);
      if (existing >= 0) {
        // Update existing header
        const updated = [...prev];
        updated[existing] = headerData;
        return updated;
      } else {
        // Add new header in correct order
        const newHeaders = [...prev, headerData];
        return newHeaders.sort((a, b) => {
          const aIndex = WORKFLOW_STEPS.findIndex(s => s.key === a.key);
          const bIndex = WORKFLOW_STEPS.findIndex(s => s.key === b.key);
          return aIndex - bIndex;
        });
      }
    });
    
    // Mark step as completed
    if (!completedWorkflowSteps.includes(stepKey)) {
      setCompletedWorkflowSteps(prev => [...prev, stepKey]);
    }
    
    // Update workflow data
    setWorkflowData(prev => ({
      ...prev,
      [stepKey]: data
    }));
  }, [completedWorkflowSteps]);
  
  const removeProgressiveHeader = useCallback((stepKey) => {
    setProgressiveHeaders(prev => prev.filter(h => h.key !== stepKey));
    setCompletedWorkflowSteps(prev => prev.filter(s => s !== stepKey));
    setWorkflowData(prev => ({
      ...prev,
      [stepKey]: null
    }));
  }, []);
  
  const editProgressiveHeader = useCallback((stepKey) => {
    const stepConfig = WORKFLOW_STEPS.find(s => s.key === stepKey);
    if (!stepConfig) return;
    
    // Enter workflow mode at this step
    const stepIndex = WORKFLOW_STEPS.findIndex(s => s.key === stepKey);
    enterWorkflowMode(stepIndex, workflowData);
  }, [enterWorkflowMode, workflowData]);
  
  // Auto-scroll functionality with vertical section scrolling
  const autoScrollToTab = useCallback((tabKey, options = {}) => {
    const {
      smooth = true,
      offset: _offset = -100,
      preserveWorkflowMode = false
    } = options;
    
    // Don't change active tab if we're preserving workflow mode
    if (!preserveWorkflowMode) {
      setActiveTab(tabKey);
    }
    
    // Map tab keys to section IDs used in DashboardLayout
    const sectionIdMap = {
      'dashboard': 'home',
      'audience-segments': 'audience-segments',
      'posts': 'posts'
    };
    
    // Find the section element to scroll to
    const sectionId = sectionIdMap[tabKey] || tabKey;
    const sectionElement = document.getElementById(sectionId);
    
    if (sectionElement) {
      sectionElement.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'start'
      });
    }
  }, []);
  
  // Navigation functions
  const navigateToNextStep = useCallback(() => {
    // Allow advancing from audience step (e.g. "Choose your SEO strategy")
    const stepIndex = isWorkflowMode
      ? currentWorkflowStep
      : WORKFLOW_STEPS.findIndex((s) => s.tab === activeTab);
    if (stepIndex < 0) return;

    const nextStepIndex = stepIndex + 1;
    if (nextStepIndex >= WORKFLOW_STEPS.length) return;

    const nextStep = WORKFLOW_STEPS[nextStepIndex];
    setCurrentWorkflowStep(nextStepIndex);
    setActiveTab(nextStep.tab);

    autoScrollToTab(nextStep.tab, {
      smooth: true,
      preserveWorkflowMode: true
    });

    return nextStep;
  }, [isWorkflowMode, currentWorkflowStep, activeTab, autoScrollToTab]);
  
  const navigateToPreviousStep = useCallback(() => {
    if (!isWorkflowMode) return;
    
    const prevStepIndex = currentWorkflowStep - 1;
    if (prevStepIndex >= 0) {
      setCurrentWorkflowStep(prevStepIndex);
      const prevStep = WORKFLOW_STEPS[prevStepIndex];
      
      // Auto-scroll to the previous tab while preserving workflow mode
      autoScrollToTab(prevStep.tab, {
        smooth: true,
        preserveWorkflowMode: true // Keep workflow mode active
      });
      
      return prevStep;
    }
    return null;
  }, [isWorkflowMode, currentWorkflowStep, autoScrollToTab]);
  
  const navigateToTab = useCallback((tabKey, options = {}) => {
    setActiveTab(tabKey);
    
    // If navigating directly to a tab, switch to focus mode unless explicitly preserving workflow
    if (!options.preserveWorkflowMode && mode === 'workflow') {
      // Don't exit workflow mode unless explicitly requested
    } else if (!options.preserveWorkflowMode && mode !== 'workflow') {
      setMode('focus');
    }
  }, [mode]);
  
  // Workflow completion
  const completeWorkflow = useCallback(() => {
    setMode('focus');
    // Keep all data and headers for reference
  }, []);
  
  const resetWorkflow = useCallback(() => {
    setMode('focus');
    setCurrentWorkflowStep(0);
    setCompletedWorkflowSteps([]);
    setProgressiveHeaders([]);
    setWorkflowData({
      company: null,
      audience: null,
      content: null,
      analytics: null
    });
  }, []);
  
  // Get current step information
  const getCurrentStep = () => {
    if (!isWorkflowMode) return null;
    return WORKFLOW_STEPS[currentWorkflowStep] || null;
  };
  
  const getNextStep = () => {
    if (!isWorkflowMode) return null;
    const nextIndex = currentWorkflowStep + 1;
    return WORKFLOW_STEPS[nextIndex] || null;
  };
  
  const getPreviousStep = () => {
    if (!isWorkflowMode) return null;
    const prevIndex = currentWorkflowStep - 1;
    return WORKFLOW_STEPS[prevIndex] || null;
  };
  
  // Check if user is in workflow mode for a specific tab
  const isTabInWorkflowMode = useCallback((tabKey) => {
    if (!isWorkflowMode) return false;
    const currentStep = getCurrentStep();
    return currentStep && currentStep.tab === tabKey;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getCurrentStep from same context
  }, [isWorkflowMode, currentWorkflowStep]);
  
  // =============================================================================
  // PROGRESSIVE STICKY HEADER MANAGEMENT
  // =============================================================================
  
  // Add a completed step to the sticky header
  const addStickyWorkflowStep = useCallback((stepType, data) => {
    setStickyWorkflowSteps(prev => {
      // Remove existing step of same type and add new one
      const filtered = prev.filter(step => step.type !== stepType);
      return [...filtered, { type: stepType, data, timestamp: Date.now() }];
    });
  }, []);
  
  // Update existing sticky step data
  const updateStickyWorkflowStep = useCallback((stepType, data) => {
    setStickyWorkflowSteps(prev => 
      prev.map(step => 
        step.type === stepType 
          ? { ...step, data: { ...step.data, ...data }, timestamp: Date.now() }
          : step
      )
    );
  }, []);
  
  // Clear all sticky workflow steps (on reset/start over)
  const clearStickyWorkflowSteps = useCallback(() => {
    setStickyWorkflowSteps([]);
  }, []);
  
  // Get step data by type
  const getStickyWorkflowStep = useCallback((stepType) => {
    return stickyWorkflowSteps.find(step => step.type === stepType);
  }, [stickyWorkflowSteps]);
  
  // SECURITY: Clear user data when user logs out (FIXED - track previous auth state)
  useEffect(() => {
    // Get previous authentication state
    const prevAuthState = prevAuthStateRef.current;
    const currentAuthState = { user: user, isAuthenticated: isAuthenticated };
    
    // Only clear data on actual logout (was authenticated, now not)
    if (prevAuthState && prevAuthState.user && prevAuthState.isAuthenticated && 
        (!user || !isAuthenticated)) {
      clearUserSpecificData();
    }
    
    // Store current state for next render
    prevAuthStateRef.current = currentAuthState;
  }, [user, isAuthenticated, clearUserSpecificData]);

  // SESSION MANAGEMENT: Initialize session and handle authentication changes
  useEffect(() => {
    const handleAuthenticationChange = async () => {
      if (authLoading) return; // Wait for auth to complete
      
      if (user && isAuthenticated) {
        // Execute pending action after successful login (Fixes #85)
        const pendingFn = pendingActionRef.current;
        if (pendingFn) {
          pendingActionRef.current = null;
          try {
            await pendingFn();
          } catch (error) {
            console.error('Failed to execute pending action:', error);
          }
        }

        // User is authenticated - try to adopt any anonymous session
        if (sessionId && !sessionDataLoaded) {
          console.log('🔄 User authenticated, attempting to adopt session:', sessionId);
          try {
            await adoptAnonymousSession();
            setSessionDataLoaded(true);
          } catch (error) {
            console.error('Failed to adopt session:', error);
          }
        }
        
        // Load user's audiences
        await loadUserAudiences();
        
      } else {
        // User is not authenticated - initialize anonymous session
        if (!sessionId) {
          console.log('👤 Anonymous user, initializing session');
          await initializeSession();
        }
        setSessionDataLoaded(false);
      }
    };
    
    handleAuthenticationChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stepResults used inside; adoptAnonymousSession/initializeSession/loadUserAudiences stable
  }, [user, isAuthenticated, authLoading, sessionId, sessionDataLoaded]);
  
  // Memoize context value so consumers only re-render when actual state changes.
  // Prevents infinite re-render loop when opening auth modal (React error #301).
  const contextValue = useMemo(() => ({
    // =============================================================================
    // MODE STATE
    // =============================================================================
    mode,
    isWorkflowMode,
    isFocusMode,
    
    // =============================================================================
    // AUTHENTICATION STATE
    // =============================================================================
    user,
    isAuthenticated,
    
    // =============================================================================
    // AUTHENTICATION GATES & PERMISSIONS
    // =============================================================================
    requireAuth,
    requireSignUp,
    hasPermission,
    isAdmin,
    isSuperAdmin,
    
    // =============================================================================
    // WORKFLOW PROGRESSION
    // =============================================================================
    currentWorkflowStep,
    completedWorkflowSteps,
    workflowData, // Legacy compatibility
    
    // Core workflow state
    currentStep,
    setCurrentStep,
    websiteUrl,
    setWebsiteUrl,
    selectedTopic,
    setSelectedTopic,
    generatedContent,
    setGeneratedContent,
    
    // =============================================================================
    // LOADING & PROGRESS STATE
    // =============================================================================
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
    
    // =============================================================================
    // UI CONTROL STATE
    // =============================================================================
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
    
    // =============================================================================
    // BUSINESS LOGIC STATE
    // =============================================================================
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
    
    // =============================================================================
    // CONTENT REVISION STATE
    // =============================================================================
    previousContent,
    setPreviousContent,
    showChanges,
    setShowChanges,
    customFeedback,
    setCustomFeedback,
    
    // =============================================================================
    // RESEARCH & ENHANCEMENT STATE
    // =============================================================================
    webSearchInsights,
    setWebSearchInsights,
    demoMode,
    setDemoMode,
    
    // =============================================================================
    // UNIFIED DATA STORE
    // =============================================================================
    stepResults,
    setStepResults,
    
    // =============================================================================
    // PROGRESSIVE HEADERS
    // =============================================================================
    progressiveHeaders,
    
    // =============================================================================
    // NAVIGATION STATE
    // =============================================================================
    activeTab,
    
    // =============================================================================
    // MODE TRANSITIONS
    // =============================================================================
    enterWorkflowMode,
    exitWorkflowMode,
    
    // =============================================================================
    // PROGRESSIVE HEADER MANAGEMENT
    // =============================================================================
    addProgressiveHeader,
    removeProgressiveHeader,
    editProgressiveHeader,
    
    // Progressive sticky header for workflow steps
    stickyWorkflowSteps,
    setStickyWorkflowSteps,
    addStickyWorkflowStep,
    updateStickyWorkflowStep,
    clearStickyWorkflowSteps,
    getStickyWorkflowStep,
    
    // =============================================================================
    // NAVIGATION FUNCTIONS
    // =============================================================================
    navigateToNextStep,
    navigateToPreviousStep,
    navigateToTab,
    autoScrollToTab,
    
    // =============================================================================
    // WORKFLOW MANAGEMENT
    // =============================================================================
    completeWorkflow,
    resetWorkflow, // Legacy
    resetUnifiedWorkflow, // New unified reset
    
    // =============================================================================
    // WORKFLOW STATE HELPERS
    // =============================================================================
    advanceStep,
    updateWebsiteAnalysis,
    updateCTAData,
    updateWebSearchInsights,
    updateAnalysisCompleted,
    updateTrendingTopics,
    updateCustomerStrategy,
    
    clearUserSpecificData,
    
    // =============================================================================
    // SESSION MANAGEMENT
    // =============================================================================
    sessionId,
    audiences,
    loadingAudiences,
    sessionDataLoaded,
    initializeSession,
    loadUserAudiences,
    saveAudience,
    adoptAnonymousSession,
    
    // =============================================================================
    // STEP INFORMATION
    // =============================================================================
    getCurrentStep,
    getNextStep,
    getPreviousStep,
    isTabInWorkflowMode,
    
    // =============================================================================
    // CONSTANTS
    // =============================================================================
    WORKFLOW_STEPS,
    TAB_ORDER
  // eslint-disable-next-line react-hooks/exhaustive-deps -- many context helpers intentionally excluded to avoid re-create on every render
  }), [
    mode,
    user,
    isAuthenticated,
    requireAuth,
    requireSignUp,
    currentWorkflowStep,
    completedWorkflowSteps,
    workflowData,
    currentStep,
    websiteUrl,
    selectedTopic,
    generatedContent,
    isLoading,
    scanningMessage,
    blogGenerating,
    analysisCompleted,
    strategyCompleted,
    editingStep,
    previewMode,
    expandedSteps,
    showAuthModal,
    showStrategyGate,
    showExportWarning,
    authContext,
    selectedCustomerStrategy,
    strategySelectionCompleted,
    contentStrategy,
    postState,
    selectedCMS,
    previousContent,
    showChanges,
    customFeedback,
    webSearchInsights,
    demoMode,
    stepResults,
    progressiveHeaders,
    activeTab,
    stickyWorkflowSteps,
    sessionId,
    audiences,
    loadingAudiences,
    sessionDataLoaded,
    enterWorkflowMode,
    exitWorkflowMode,
    addStickyWorkflowStep,
    updateStickyWorkflowStep,
    navigateToNextStep,
    navigateToPreviousStep,
    navigateToTab,
    autoScrollToTab,
    completeWorkflow,
    resetWorkflow,
    resetUnifiedWorkflow,
    advanceStep,
    updateWebsiteAnalysis,
    updateCTAData,
    updateWebSearchInsights,
    updateAnalysisCompleted,
    updateTrendingTopics,
    updateCustomerStrategy,
    clearUserSpecificData,
    initializeSession,
    loadUserAudiences,
    saveAudience,
    adoptAnonymousSession,
    getCurrentStep,
    getNextStep,
    getPreviousStep,
    isTabInWorkflowMode
  ]);
  
  return (
    <WorkflowModeContext.Provider value={contextValue}>
      {children}
    </WorkflowModeContext.Provider>
  );
};

// Custom hook to use workflow context
export const useWorkflowMode = () => {
  const context = useContext(WorkflowModeContext);
  if (!context) {
    throw new Error('useWorkflowMode must be used within a WorkflowModeProvider');
  }
  return context;
};

export default WorkflowModeContext;