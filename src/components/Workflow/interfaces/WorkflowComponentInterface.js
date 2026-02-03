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
   * Returns colors from design-system.css
   * @returns {Object} Static default colors
   */
  getDefaultColors() {
    return {
      primary: '#0D9488',   // --color-primary (teal)
      secondary: '#f1f5f9', // --color-secondary
      accent: '#F97316'     // --color-accent (orange)
    };
  },

  /**
   * Get theme object with design tokens
   * Matches design-system.css custom properties
   * @returns {Object} Theme object with colors, typography, spacing, etc.
   */
  getTheme() {
    return {
      colors: {
        // Core colors from design-system.css
        primary: '#0D9488',        // --color-primary (teal)
        primaryLight: '#14B8A6',   // --color-primary-light
        primaryDark: '#0F766E',    // --color-primary-dark
        secondary: '#f1f5f9',      // --color-secondary
        accent: '#F97316',         // --color-accent (orange)
        success: '#10b981',        // --color-success
        warning: '#f59e0b',        // --color-warning
        error: '#ef4444',          // --color-error

        // Neutral colors
        white: '#ffffff',
        gray50: '#f8fafc',
        gray100: '#f1f5f9',
        gray200: '#e2e8f0',
        gray300: '#cbd5e1',
        gray400: '#94a3b8',
        gray500: '#64748b',
        gray600: '#475569',
        gray700: '#334155',
        gray800: '#1e293b',
        gray900: '#0f172a',

        // Text colors (using design system neutrals)
        text: '#0f172a',           // gray900
        textSecondary: '#64748b',  // gray500
        textTertiary: '#94a3b8',   // gray400
        backgroundAlt: '#f8fafc'   // gray50
      },
      typography: {
        xs: '0.75rem',      // 12px
        sm: '0.875rem',     // 14px
        base: '1rem',       // 16px
        lg: '1.125rem',     // 18px
        xl: '1.25rem',      // 20px
        '2xl': '1.5rem',    // 24px
        '3xl': '1.875rem',  // 30px
        '4xl': '2.25rem',   // 36px
        '5xl': '3rem'       // 48px
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800
      },
      borderRadius: {
        sm: '0.25rem',      // 4px
        base: '0.375rem',   // 6px
        md: '0.5rem',       // 8px
        lg: '0.75rem',      // 12px
        xl: '1rem',         // 16px
        '2xl': '1.5rem',    // 24px
        full: '9999px'
      },
      spacing: {
        1: '0.25rem',   // 4px
        2: '0.5rem',    // 8px
        3: '0.75rem',   // 12px
        4: '1rem',      // 16px
        5: '1.25rem',   // 20px
        6: '1.5rem',    // 24px
        8: '2rem',      // 32px
        10: '2.5rem',   // 40px
        12: '3rem',     // 48px
        16: '4rem',     // 64px
        20: '5rem',     // 80px
        24: '6rem'      // 96px
      },
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
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
        color: 'var(--color-primary)', 
        marginBottom: '24px',
        animation: 'pulse 2s infinite'
      }}>
        ⚡
      </div>
      <div style={{ 
        fontSize: '16px', 
        color: 'var(--color-text-secondary)', 
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
        color: 'var(--color-text-secondary)', 
        marginBottom: '24px' 
      }}>
        {message}
      </div>
      {onRetry && (
        <button 
          onClick={onRetry}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--color-primary)',
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

const WorkflowComponentInterface = {
  StepComponentProps,
  StepComponentRequirements,
  ComponentHelpers,
  withStepValidation
};

export default WorkflowComponentInterface;