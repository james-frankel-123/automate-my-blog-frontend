/**
 * Workflow Component Interface Standards
 * Defines consistent interfaces for all step components
 */

/**
 * Standard Props Interface for Step Components
 * All step components should accept these props for consistency
 */
export const StepComponentProps = {
  // =============================================================================
  // CORE WORKFLOW STATE (Required for most steps)
  // =============================================================================
  currentStep: 'number', // Current step index (0-6)
  websiteUrl: 'string', // User's website URL
  selectedTopic: 'number|null', // Selected topic ID
  generatedContent: 'string', // AI-generated content

  // =============================================================================
  // LOADING & PROGRESS STATE
  // =============================================================================
  isLoading: 'boolean', // General loading state
  scanningMessage: 'string', // Progress message
  blogGenerating: 'boolean', // Blog generation specific loading
  analysisCompleted: 'boolean', // Website analysis completion
  strategyCompleted: 'boolean', // Strategy selection completion

  // =============================================================================
  // UI CONTROL STATE
  // =============================================================================
  editingStep: 'number|null', // Which step is being edited
  previewMode: 'boolean', // Content preview vs edit mode
  expandedSteps: 'array', // Expanded step summary IDs
  showAuthModal: 'boolean', // Auth modal visibility
  authContext: 'string|null', // Auth context tracking

  // =============================================================================
  // BUSINESS LOGIC STATE
  // =============================================================================
  selectedCustomerStrategy: 'object|null', // Selected customer strategy
  strategySelectionCompleted: 'boolean', // Strategy selection completion
  contentStrategy: 'object', // Content configuration
  postState: 'string', // 'draft', 'exported', 'locked'
  selectedCMS: 'string|null', // Selected CMS platform

  // =============================================================================
  // RESEARCH & ENHANCEMENT STATE
  // =============================================================================
  webSearchInsights: 'object', // Web search research results
  demoMode: 'boolean', // Demo mode flag

  // =============================================================================
  // CENTRAL DATA STORE
  // =============================================================================
  stepResults: 'object', // Complete workflow data

  // =============================================================================
  // CONFIGURATION & CONSTANTS
  // =============================================================================
  steps: 'array', // Step configuration
  cmsOptions: 'array', // CMS platform options
  user: 'object|null', // Current user

  // =============================================================================
  // ACTION HANDLERS (Functions)
  // =============================================================================
  setCurrentStep: 'function', // Step progression
  setWebsiteUrl: 'function', // Website URL updates
  setSelectedTopic: 'function', // Topic selection
  setGeneratedContent: 'function', // Content updates
  setIsLoading: 'function', // Loading state
  setScanningMessage: 'function', // Progress messages
  setBlogGenerating: 'function', // Blog generation loading
  setAnalysisCompleted: 'function', // Analysis completion
  setStrategyCompleted: 'function', // Strategy completion
  setEditingStep: 'function', // Edit mode
  setPreviewMode: 'function', // Preview mode
  setExpandedSteps: 'function', // Step expansion
  setShowAuthModal: 'function', // Auth modal
  setAuthContext: 'function', // Auth context
  setSelectedCustomerStrategy: 'function', // Customer strategy
  setStrategySelectionCompleted: 'function', // Strategy completion
  setContentStrategy: 'function', // Content configuration
  setPostState: 'function', // Post state
  setSelectedCMS: 'function', // CMS selection
  setWebSearchInsights: 'function', // Research insights
  setStepResults: 'function', // Central data updates

  // =============================================================================
  // BUSINESS LOGIC FUNCTIONS
  // =============================================================================
  requireAuth: 'function', // Authentication gate
  generateContent: 'function', // Content generation
  handleContentChange: 'function', // Content editing
  getCurrentPost: 'function', // Post metadata
  getStrategyDisplayText: 'function', // Strategy formatting
  resetWorkflow: 'function', // Workflow reset
  completeWebsiteAnalysis: 'function', // Website analysis
  loadTrendingTopics: 'function', // Topic loading
  proceedWithTopicGeneration: 'function', // Topic generation

  // =============================================================================
  // NAVIGATION HELPERS
  // =============================================================================
  setNavContext: 'function', // Navigation context
  advanceStep: 'function' // Step progression helper
};

/**
 * Step Component Requirements
 * What each step component should implement
 */
export const StepComponentRequirements = {
  // Required exports
  exports: {
    default: 'React functional component', // Default export
    displayName: 'string' // Component display name
  },

  // Required props (subset of StepComponentProps based on step needs)
  requiredProps: {
    common: ['currentStep', 'stepResults', 'user', 'requireAuth'], // All steps need these
    step0: ['websiteUrl', 'setWebsiteUrl', 'setCurrentStep'], // Website URL input
    step1: ['isLoading', 'scanningMessage', 'analysisCompleted'], // Website analysis
    step2: ['selectedCustomerStrategy', 'setSelectedCustomerStrategy'], // Strategy selection
    step3: ['strategyCompleted', 'loadTrendingTopics'], // Topic generation
    step4: ['selectedTopic', 'generateContent', 'blogGenerating'], // Content generation
    step5: ['generatedContent', 'previewMode', 'handleContentChange'], // Content editing
    step6: ['postState', 'selectedCMS', 'getCurrentPost'] // Export
  },

  // Component structure standards
  structure: {
    // Each component should have clear sections
    sections: [
      'Props destructuring with defaults',
      'Local state (if needed)',
      'Event handlers',
      'Validation logic',
      'Main JSX return'
    ],

    // Consistent styling approach
    styling: {
      useInlineStyles: true, // Match existing App.js approach
      responsiveDesign: true, // Mobile-first approach
      brandColorIntegration: false // Brand colors functionality removed
    },

    // Error handling
    errorHandling: {
      propValidation: true, // Validate required props
      gracefulFallbacks: true, // Handle missing data
      userFeedback: true // Show meaningful error messages
    }
  }
};

/**
 * Component Helper Utilities
 * Shared utilities for step components
 */
export const ComponentHelpers = {
  /**
   * Extract required props for specific step
   * @param {Object} allProps - All props passed to component
   * @param {number} stepNumber - Step number (0-6)
   * @returns {Object} Filtered props for step
   */
  extractStepProps(allProps, stepNumber) {
    const common = StepComponentRequirements.requiredProps.common;
    const stepSpecific = StepComponentRequirements.requiredProps[`step${stepNumber}`] || [];
    const requiredKeys = [...common, ...stepSpecific];

    return Object.fromEntries(
      requiredKeys.map(key => [key, allProps[key]])
    );
  },

  /**
   * Validate component props
   * @param {Object} props - Component props
   * @param {number} stepNumber - Step number
   * @returns {Object} Validation result
   */
  validateProps(props, stepNumber) {
    const required = [
      ...StepComponentRequirements.requiredProps.common,
      ...(StepComponentRequirements.requiredProps[`step${stepNumber}`] || [])
    ];

    const missing = required.filter(key => !(key in props) || props[key] === undefined);

    return {
      isValid: missing.length === 0,
      missingProps: missing,
      warnings: missing.map(prop => `Missing required prop: ${prop}`)
    };
  },

  /**
   * Get default colors (brand colors functionality removed)
   * @returns {Object} Static default colors
   */
  getDefaultColors() {
    return {
      primary: '#1890ff',
      secondary: '#f0f2ff',
      accent: '#722ed1'
    };
  },

  /**
   * Get theme object with design tokens
   * @returns {Object} Theme object with colors, typography, spacing, etc.
   */
  getTheme() {
    return {
      colors: {
        primary: '#1890ff',
        secondary: '#f0f2ff',
        accent: '#722ed1',
        text: '#262626',
        textSecondary: '#666',
        textTertiary: '#999',
        gray800: '#333',
        backgroundAlt: '#f0f5ff'
      },
      typography: {
        base: '14px',
        sm: '13px',
        lg: '16px'
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px'
      },
      shadows: {
        sm: '0 2px 8px rgba(0,0,0,0.15)'
      }
    };
  },

  /**
   * Create responsive style helper
   * @param {boolean} isMobile - Is mobile viewport
   * @returns {Object} Style helpers
   */
  getResponsiveStyles(isMobile = window.innerWidth <= 767) {
    return {
      isMobile,
      padding: isMobile ? '10px' : '20px',
      maxWidth: isMobile ? '100%' : '1200px',
      gutter: isMobile ? [8, 8] : [16, 16],
      fontSize: {
        title: isMobile ? '20px' : '24px',
        text: isMobile ? '14px' : '16px',
        small: isMobile ? '12px' : '14px'
      }
    };
  },

  /**
   * Common loading state component
   * @param {string} message - Loading message
   * @returns {JSX.Element} Loading component
   */
  LoadingState: ({ message }) => (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ 
        fontSize: '48px', 
        color: '#1890ff', 
        marginBottom: '24px',
        animation: 'pulse 2s infinite'
      }}>
        ⚡
      </div>
      <div style={{ 
        fontSize: '16px', 
        color: '#666', 
        marginBottom: '16px' 
      }}>
        {message}
      </div>
    </div>
  ),

  /**
   * Common error state component
   * @param {string} message - Error message
   * @param {function} onRetry - Retry function
   * @returns {JSX.Element} Error component
   */
  ErrorState: ({ message, onRetry }) => (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ 
        fontSize: '48px', 
        color: '#ff4d4f', 
        marginBottom: '24px'
      }}>
        ⚠️
      </div>
      <div style={{ 
        fontSize: '16px', 
        color: '#666', 
        marginBottom: '24px' 
      }}>
        {message}
      </div>
      {onRetry && (
        <button 
          onClick={onRetry}
          style={{
            padding: '8px 16px',
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      )}
    </div>
  )
};

/**
 * HOC for consistent step component behavior
 * @param {React.Component} WrappedComponent - Component to wrap
 * @param {number} stepNumber - Step number for validation
 * @returns {React.Component} Enhanced component
 */
export const withStepValidation = (WrappedComponent, stepNumber) => {
  return function ValidatedStepComponent(props) {
    const validation = ComponentHelpers.validateProps(props, stepNumber);
    
    if (!validation.isValid) {
      console.warn(`Step ${stepNumber} validation errors:`, validation.warnings);
      return ComponentHelpers.ErrorState({
        message: `Component configuration error: ${validation.missingProps.join(', ')}`,
        onRetry: null
      });
    }

    return <WrappedComponent {...props} />;
  };
};

export default {
  StepComponentProps,
  StepComponentRequirements,
  ComponentHelpers,
  withStepValidation
};