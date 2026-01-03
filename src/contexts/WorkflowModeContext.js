import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

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
  
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  
  // Track previous authentication state for logout detection
  const prevAuthStateRef = useRef(null);
  
  // =============================================================================
  // CORE WORKFLOW STATE (Enhanced from useWorkflowState-v2.js)
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
  
  // Core workflow progression (mapped from useWorkflowState-v2.js)
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
  // UNIFIED DATA STORE WITH NORMALIZED NAMING
  // =============================================================================
  
  // Main data repository with normalized step-oriented structure
  const [stepResults, setStepResults] = useState({
    home: {
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
      webSearchInsights: {
        brandResearch: null,
        keywordResearch: null,
        researchQuality: 'basic' // 'basic', 'enhanced', 'premium'
      },
      analysisCompleted: false
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
  // STATE UPDATE HELPERS (From useWorkflowState-v2.js)
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
  // AUTHENTICATION GATES & PERMISSION CHECKS
  // =============================================================================
  
  // Authentication gate helper (preserved from WorkflowContainer-v2.js)
  const requireAuth = useCallback((action = '', context = 'gate') => {
    if (!user) {
      console.log(`🚫 Auth required for action: ${action}`);
      setAuthContext(context);
      setShowAuthModal(true);
      return false;
    }
    return true;
  }, [user]);
  
  // Sign-up focused gate helper - defaults to register tab for conversion
  const requireSignUp = useCallback((action = '', context = 'Create your account') => {
    if (!user) {
      console.log(`🎯 Sign-up required for action: ${action}`);
      setAuthContext('register');  // Always set to register for sign-up flow
      setShowAuthModal(true);
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

  // =============================================================================
  // WORKFLOW STATE PERSISTENCE (for seamless authentication transitions)
  // =============================================================================
  
  // Save current workflow state to localStorage (auth-aware)
  const saveWorkflowState = useCallback(() => {
    console.log('💾 saveWorkflowState() called');
    console.log('💾 Current state being saved:', {
      analysisCompleted,
      businessName: stepResults?.home?.websiteAnalysis?.businessName || 'None',
      mode,
      currentStep
    });
    console.log('💾 Auth context during save:', {
      userId: user?.id,
      userEmail: user?.email,
      isAuthenticated,
      userIdType: typeof user?.id
    });
    
    // Validate that we have meaningful data to save
    const hasValidAnalysisData = stepResults?.home?.websiteAnalysis?.businessName && 
                                 stepResults?.home?.websiteAnalysis?.targetAudience &&
                                 stepResults?.home?.websiteAnalysis?.contentFocus;
    
    // Only save if we have valid analysis data when analysis is marked complete
    if (analysisCompleted && !hasValidAnalysisData) {
      console.log('⚠️ Analysis marked complete but data incomplete, skipping save');
      console.log('🔍 Analysis data check:', {
        businessName: stepResults?.home?.websiteAnalysis?.businessName || 'Missing',
        targetAudience: stepResults?.home?.websiteAnalysis?.targetAudience || 'Missing',
        contentFocus: stepResults?.home?.websiteAnalysis?.contentFocus || 'Missing'
      });
      return false;
    }
    
    try {
      const workflowStateSnapshot = {
        // Authentication context
        userId: user?.id || null,
        isAuthenticated,
        
        // Core workflow progression
        mode,
        currentWorkflowStep,
        currentStep,
        completedWorkflowSteps,
        
        // Step data and results
        stepResults,
        progressiveHeaders,
        
        // User inputs (may contain sensitive data)
        websiteUrl,
        selectedTopic,
        generatedContent,
        
        // Workflow status
        analysisCompleted,
        strategyCompleted,
        strategySelectionCompleted,
        
        // Business logic state
        selectedCustomerStrategy,
        contentStrategy,
        postState,
        selectedCMS,
        
        // Research data
        webSearchInsights,
        
        // UI state that should persist
        expandedSteps,
        
        // Timestamp for validation
        savedAt: new Date().toISOString(),
        version: '1.1' // Updated version for auth-aware state
      };
      
      localStorage.setItem('automate-my-blog-workflow-state', JSON.stringify(workflowStateSnapshot));
      console.log('💾 Workflow state saved to localStorage:', {
        analysisCompleted: workflowStateSnapshot.analysisCompleted,
        businessName: workflowStateSnapshot.stepResults?.home?.websiteAnalysis?.businessName || 'None',
        hasStepResults: !!workflowStateSnapshot.stepResults,
        mode: workflowStateSnapshot.mode,
        savedAt: workflowStateSnapshot.savedAt,
        fullSnapshot: workflowStateSnapshot
      });
      
      return true;
    } catch (error) {
      console.error('Failed to save workflow state:', error);
      return false;
    }
  }, [
    user, isAuthenticated, mode, currentWorkflowStep, currentStep, completedWorkflowSteps, stepResults, progressiveHeaders,
    websiteUrl, selectedTopic, generatedContent, analysisCompleted, strategyCompleted,
    strategySelectionCompleted, selectedCustomerStrategy, contentStrategy, postState,
    selectedCMS, webSearchInsights, expandedSteps
  ]);
  
  // Restore workflow state from localStorage (auth-aware)
  const restoreWorkflowState = useCallback(() => {
    console.log('🔄 restoreWorkflowState() called');
    
    try {
      const savedState = localStorage.getItem('automate-my-blog-workflow-state');
      if (!savedState) {
        console.log('🔍 No saved workflow state found');
        return false;
      }
      
      const workflowStateSnapshot = JSON.parse(savedState);
      console.log('🔄 Restoring workflow state from localStorage:', {
        hasStepResults: !!workflowStateSnapshot.stepResults,
        analysisCompleted: workflowStateSnapshot.analysisCompleted,
        mode: workflowStateSnapshot.mode,
        userId: workflowStateSnapshot.userId,
        isAuthenticated: workflowStateSnapshot.isAuthenticated,
        businessName: workflowStateSnapshot.stepResults?.home?.websiteAnalysis?.businessName || 'None',
        fullSnapshot: workflowStateSnapshot
      });
      
      // AUTH SECURITY CHECK: Prevent data leakage across user sessions
      if (workflowStateSnapshot.userId && workflowStateSnapshot.userId !== user?.id) {
        console.log('🚨 Auth validation failed: Saved state belongs to different user, clearing');
        console.log('🔍 Auth mismatch details:', {
          savedUserId: workflowStateSnapshot.userId,
          currentUserId: user?.id,
          currentUser: user?.email,
          isUserAuthenticated: !!user,
          savedUserIdType: typeof workflowStateSnapshot.userId,
          currentUserIdType: typeof user?.id
        });
        localStorage.removeItem('automate-my-blog-workflow-state');
        console.log('🗑️ Saved workflow state cleared');
        return false;
      }
      
      // If saved state was authenticated but current user is not, only restore public data
      if (workflowStateSnapshot.isAuthenticated && !isAuthenticated) {
        console.log('⚠️  Auth state mismatch: Restoring public data only');
        // Restore only non-sensitive workflow state
        if (workflowStateSnapshot.mode) setMode(workflowStateSnapshot.mode);
        if (typeof workflowStateSnapshot.currentWorkflowStep === 'number') {
          setCurrentWorkflowStep(workflowStateSnapshot.currentWorkflowStep);
        }
        // Skip user-specific data restoration
        return true;
      }
      
      // Validate saved state (check version and age)
      const savedAt = new Date(workflowStateSnapshot.savedAt);
      const ageHours = (new Date() - savedAt) / (1000 * 60 * 60);
      
      if (ageHours > 24) {
        console.log('⏰ Saved workflow state is too old (>24h), discarding');
        clearSavedWorkflowState();
        return false;
      }
      
      // Restore core workflow state
      if (workflowStateSnapshot.mode) setMode(workflowStateSnapshot.mode);
      if (typeof workflowStateSnapshot.currentWorkflowStep === 'number') {
        setCurrentWorkflowStep(workflowStateSnapshot.currentWorkflowStep);
      }
      if (typeof workflowStateSnapshot.currentStep === 'number') {
        setCurrentStep(workflowStateSnapshot.currentStep);
      }
      if (workflowStateSnapshot.completedWorkflowSteps) {
        setCompletedWorkflowSteps(workflowStateSnapshot.completedWorkflowSteps);
      }
      
      // Restore step data
      if (workflowStateSnapshot.stepResults) {
        setStepResults(workflowStateSnapshot.stepResults);
        
        // Validate that analysis data is complete if marked as completed
        const restoredAnalysis = workflowStateSnapshot.stepResults.home?.websiteAnalysis;
        const hasCompleteAnalysisData = restoredAnalysis?.businessName && 
                                       restoredAnalysis?.targetAudience && 
                                       restoredAnalysis?.contentFocus;
        
        console.log('📊 Restored analysis data validation:', {
          hasAnalysisData: !!restoredAnalysis,
          businessName: restoredAnalysis?.businessName || 'Missing',
          targetAudience: restoredAnalysis?.targetAudience || 'Missing',
          contentFocus: restoredAnalysis?.contentFocus || 'Missing',
          isComplete: hasCompleteAnalysisData
        });
        
        // If analysis is marked complete but data is incomplete, reset completion flag
        if (workflowStateSnapshot.analysisCompleted && !hasCompleteAnalysisData) {
          console.log('⚠️ Analysis marked complete but data incomplete, resetting completion flag');
          setAnalysisCompleted(false);
        }
      }
      if (workflowStateSnapshot.progressiveHeaders) {
        setProgressiveHeaders(workflowStateSnapshot.progressiveHeaders);
      }
      
      // Restore user inputs
      if (workflowStateSnapshot.websiteUrl) setWebsiteUrl(workflowStateSnapshot.websiteUrl);
      if (workflowStateSnapshot.selectedTopic) setSelectedTopic(workflowStateSnapshot.selectedTopic);
      if (workflowStateSnapshot.generatedContent) setGeneratedContent(workflowStateSnapshot.generatedContent);
      
      // Restore completion status (only if not already handled above)
      if (typeof workflowStateSnapshot.analysisCompleted === 'boolean' && !workflowStateSnapshot.stepResults) {
        setAnalysisCompleted(workflowStateSnapshot.analysisCompleted);
      }
      if (typeof workflowStateSnapshot.strategyCompleted === 'boolean') {
        setStrategyCompleted(workflowStateSnapshot.strategyCompleted);
      }
      if (typeof workflowStateSnapshot.strategySelectionCompleted === 'boolean') {
        setStrategySelectionCompleted(workflowStateSnapshot.strategySelectionCompleted);
      }
      
      // Restore business logic state
      if (workflowStateSnapshot.selectedCustomerStrategy) {
        setSelectedCustomerStrategy(workflowStateSnapshot.selectedCustomerStrategy);
      }
      if (workflowStateSnapshot.contentStrategy) {
        setContentStrategy(workflowStateSnapshot.contentStrategy);
      }
      if (workflowStateSnapshot.postState) setPostState(workflowStateSnapshot.postState);
      if (workflowStateSnapshot.selectedCMS) setSelectedCMS(workflowStateSnapshot.selectedCMS);
      
      // Restore research data
      if (workflowStateSnapshot.webSearchInsights) {
        setWebSearchInsights(workflowStateSnapshot.webSearchInsights);
      }
      
      // Restore UI state
      if (workflowStateSnapshot.expandedSteps) {
        setExpandedSteps(workflowStateSnapshot.expandedSteps);
      }
      
      console.log('✅ Workflow state successfully restored');
      console.log('📊 Final restored state:', {
        mode,
        analysisCompleted,
        businessName: stepResults?.home?.websiteAnalysis?.businessName || 'None',
        hasAnalysisData: !!(stepResults?.home?.websiteAnalysis?.businessName && 
                          stepResults?.home?.websiteAnalysis?.targetAudience && 
                          stepResults?.home?.websiteAnalysis?.contentFocus)
      });
      return true;
      
    } catch (error) {
      console.error('Failed to restore workflow state:', error);
      localStorage.removeItem('automate-my-blog-workflow-state');
      return false;
    }
  }, [user, isAuthenticated]);
  
  // Clear saved workflow state
  const clearSavedWorkflowState = useCallback(() => {
    try {
      localStorage.removeItem('automate-my-blog-workflow-state');
      console.log('🗑️ Saved workflow state cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear saved workflow state:', error);
      return false;
    }
  }, []);
  
  // Clear user-specific workflow data on logout (SECURITY)
  const clearUserSpecificData = useCallback(() => {
    console.log('🧹 Clearing user-specific workflow data for logout');
    
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
    
    // Clear saved state from localStorage
    clearSavedWorkflowState();
  }, [clearSavedWorkflowState]);
  
  // Check if there's saved workflow state available
  const hasSavedWorkflowState = useCallback(() => {
    try {
      const savedState = localStorage.getItem('automate-my-blog-workflow-state');
      if (!savedState) return false;
      
      const workflowStateSnapshot = JSON.parse(savedState);
      const savedAt = new Date(workflowStateSnapshot.savedAt);
      const ageHours = (new Date() - savedAt) / (1000 * 60 * 60);
      
      return ageHours <= 24; // Valid if less than 24 hours old
    } catch (error) {
      return false;
    }
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
      offset = -100,
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
    if (!isWorkflowMode) return;
    
    const nextStepIndex = currentWorkflowStep + 1;
    if (nextStepIndex < WORKFLOW_STEPS.length) {
      setCurrentWorkflowStep(nextStepIndex);
      const nextStep = WORKFLOW_STEPS[nextStepIndex];
      
      // Auto-scroll to the next tab while preserving workflow mode
      autoScrollToTab(nextStep.tab, {
        smooth: true,
        preserveWorkflowMode: true // Keep workflow mode active
      });
      
      return nextStep;
    }
    return null;
  }, [isWorkflowMode, currentWorkflowStep, autoScrollToTab]);
  
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
      console.log('🔒 Preserving workflow mode during navigation to:', tabKey);
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
  
  // Auto-restore workflow state AFTER authentication completes (RACE CONDITION FIX)
  useEffect(() => {
    // Wait for authentication to complete before attempting restoration
    if (authLoading) {
      console.log('⏳ WorkflowModeContext: Authentication still loading, waiting...');
      return;
    }
    
    console.log('🚀 WorkflowModeContext: Auth loading complete, checking for saved state...');
    console.log('🔍 Auth state:', {
      authLoading,
      hasUser: !!user,
      userId: user?.id || 'None',
      isAuthenticated,
      userEmail: user?.email || 'None'
    });
    
    try {
      const savedState = localStorage.getItem('automate-my-blog-workflow-state');
      console.log('📱 localStorage check:', {
        hasSavedState: !!savedState,
        savedStateLength: savedState?.length || 0
      });
      
      if (savedState) {
        const workflowStateSnapshot = JSON.parse(savedState);
        const savedAt = new Date(workflowStateSnapshot.savedAt);
        const ageHours = (new Date() - savedAt) / (1000 * 60 * 60);
        
        console.log('📊 Saved state analysis:', {
          savedAt: savedAt.toISOString(),
          ageHours: ageHours.toFixed(2),
          isValid: ageHours <= 24,
          savedUserId: workflowStateSnapshot.userId,
          currentUserId: user?.id || 'None',
          hasStepResults: !!workflowStateSnapshot.stepResults,
          analysisCompleted: workflowStateSnapshot.analysisCompleted,
          businessName: workflowStateSnapshot.stepResults?.home?.websiteAnalysis?.businessName || 'None'
        });
        
        if (ageHours <= 24) {
          console.log('🔄 Auto-restoring workflow state after auth completion...');
          const restored = restoreWorkflowState();
          console.log('📊 Auto-restore result:', restored);
        } else {
          console.log('⏰ Saved state too old, skipping restoration');
        }
      } else {
        console.log('📝 No saved state found in localStorage');
      }
    } catch (error) {
      console.error('❌ Failed to check for saved workflow state after auth loading:', error);
    }
  }, [authLoading, user, isAuthenticated, restoreWorkflowState]); // Wait for auth completion
  
  // Fallback restore mechanism - Retry restoration after a delay if race condition still occurs
  useEffect(() => {
    let timeoutId;
    
    // Only set up fallback when auth is loaded and we have saved state but current analysis is empty
    if (authLoading) return; // Don't run fallback during auth loading
    
    const hasValidAnalysisData = stepResults.home.websiteAnalysis?.businessName && 
                                stepResults.home.websiteAnalysis?.targetAudience &&
                                stepResults.home.websiteAnalysis?.contentFocus;
    
    if (user && isAuthenticated && !hasValidAnalysisData) {
      const savedState = localStorage.getItem('automate-my-blog-workflow-state');
      
      if (savedState) {
        try {
          const workflowStateSnapshot = JSON.parse(savedState);
          const savedUserId = workflowStateSnapshot.userId;
          const savedBusinessName = workflowStateSnapshot.stepResults?.home?.websiteAnalysis?.businessName;
          
          // If localStorage has valid data for current user but state is empty, retry restore
          if (savedUserId === user.id && savedBusinessName && !hasValidAnalysisData) {
            console.log('🔄 Setting up fallback restore mechanism...');
            console.log('📊 Fallback conditions met:', {
              userMatches: savedUserId === user.id,
              hasSavedBusinessName: !!savedBusinessName,
              currentAnalysisEmpty: !hasValidAnalysisData
            });
            
            timeoutId = setTimeout(() => {
              console.log('⚡ Executing fallback restoration attempt...');
              const restored = restoreWorkflowState();
              console.log('📊 Fallback restore result:', restored);
            }, 500); // Small delay to allow auth context to fully settle
          }
        } catch (error) {
          console.error('❌ Fallback restore setup failed:', error);
        }
      }
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [authLoading, user, isAuthenticated, stepResults.home.websiteAnalysis?.businessName, restoreWorkflowState]);
  
  // SECURITY: Clear user data when user logs out (FIXED - track previous auth state)
  useEffect(() => {
    // Get previous authentication state
    const prevAuthState = prevAuthStateRef.current;
    const currentAuthState = { user: user, isAuthenticated: isAuthenticated };
    
    // Only clear data on actual logout (was authenticated, now not)
    if (prevAuthState && prevAuthState.user && prevAuthState.isAuthenticated && 
        (!user || !isAuthenticated)) {
      console.log('🔒 Actual user logout detected, clearing user-specific workflow data');
      console.log('🔍 Logout transition:', {
        previousUser: prevAuthState.user?.email || 'Unknown',
        previousAuth: prevAuthState.isAuthenticated,
        currentUser: user?.email || 'None',
        currentAuth: isAuthenticated
      });
      clearUserSpecificData();
    } else if (prevAuthState) {
      console.log('🔍 Auth state change (not logout):', {
        previousUser: prevAuthState.user?.email || (prevAuthState.user === null ? 'null' : 'undefined'),
        previousAuth: prevAuthState.isAuthenticated,
        currentUser: user?.email || (user === null ? 'null' : 'undefined'),
        currentAuth: isAuthenticated,
        isRealLogout: false
      });
    }
    
    // Store current state for next render
    prevAuthStateRef.current = currentAuthState;
  }, [user, isAuthenticated, clearUserSpecificData]);
  
  // Context value with all unified state
  const contextValue = {
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
    
    // Core workflow state (from useWorkflowState-v2.js)
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
    updateWebSearchInsights,
    updateAnalysisCompleted,
    updateTrendingTopics,
    updateCustomerStrategy,
    
    // =============================================================================
    // WORKFLOW STATE PERSISTENCE
    // =============================================================================
    saveWorkflowState,
    restoreWorkflowState,
    clearSavedWorkflowState,
    clearUserSpecificData,
    hasSavedWorkflowState,
    
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
  };
  
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