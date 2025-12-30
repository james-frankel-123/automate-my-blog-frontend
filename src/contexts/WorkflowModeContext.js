import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

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
  // Core workflow state
  const [mode, setMode] = useState('focus'); // 'workflow' | 'focus'
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState(0);
  const [completedWorkflowSteps, setCompletedWorkflowSteps] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Progressive headers data
  const [progressiveHeaders, setProgressiveHeaders] = useState([]);
  
  // Workflow data storage
  const [workflowData, setWorkflowData] = useState({
    company: null,
    audience: null,
    content: null,
    analytics: null
  });
  
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
  
  // Auto-scroll functionality with actual DOM scrolling
  const autoScrollToTab = useCallback((tabKey, options = {}) => {
    const {
      smooth = true,
      duration = 800,
      offset = -80
    } = options;
    
    // Navigate to the tab first
    setActiveTab(tabKey);
    
    // Find the tab content element to scroll to
    setTimeout(() => {
      const tabElement = document.querySelector(`[data-tab="${tabKey}"]`) || 
                        document.querySelector(`[data-testid="${tabKey}-tab"]`) ||
                        document.querySelector('.ant-tabs-tabpane-active');
      
      if (tabElement) {
        const elementTop = tabElement.getBoundingClientRect().top + window.pageYOffset;
        const scrollToPosition = elementTop + offset;
        
        if (smooth) {
          window.scrollTo({
            top: scrollToPosition,
            behavior: 'smooth'
          });
        } else {
          window.scrollTo(0, scrollToPosition);
        }
      }
    }, 100); // Small delay to allow tab change to render
  }, []);
  
  // Navigation functions
  const navigateToNextStep = useCallback(() => {
    if (!isWorkflowMode) return;
    
    const nextStepIndex = currentWorkflowStep + 1;
    if (nextStepIndex < WORKFLOW_STEPS.length) {
      setCurrentWorkflowStep(nextStepIndex);
      const nextStep = WORKFLOW_STEPS[nextStepIndex];
      
      // Auto-scroll to the next tab with smooth animation
      autoScrollToTab(nextStep.tab, {
        smooth: true,
        duration: 800,
        offset: -100 // Account for progressive headers
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
      
      // Auto-scroll to the previous tab with smooth animation
      autoScrollToTab(prevStep.tab, {
        smooth: true,
        duration: 800,
        offset: -100 // Account for progressive headers
      });
      
      return prevStep;
    }
    return null;
  }, [isWorkflowMode, currentWorkflowStep, autoScrollToTab]);
  
  const navigateToTab = useCallback((tabKey, options = {}) => {
    setActiveTab(tabKey);
    
    // If navigating directly to a tab, switch to focus mode unless explicitly in workflow
    if (!options.preserveWorkflowMode && mode !== 'workflow') {
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
  
  // Context value
  const contextValue = {
    // Mode state
    mode,
    isWorkflowMode,
    isFocusMode,
    
    // Workflow progression
    currentWorkflowStep,
    completedWorkflowSteps,
    workflowData,
    
    // Progressive headers
    progressiveHeaders,
    
    // Navigation state
    activeTab,
    
    // Mode transitions
    enterWorkflowMode,
    exitWorkflowMode,
    
    // Progressive header management
    addProgressiveHeader,
    removeProgressiveHeader,
    editProgressiveHeader,
    
    // Navigation functions
    navigateToNextStep,
    navigateToPreviousStep,
    navigateToTab,
    autoScrollToTab,
    
    // Workflow management
    completeWorkflow,
    resetWorkflow,
    
    // Step information
    getCurrentStep,
    getNextStep,
    getPreviousStep,
    isTabInWorkflowMode,
    
    // Constants
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