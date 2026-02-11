import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorkflowModeProvider, useWorkflowMode } from '../WorkflowModeContext';
import { AuthProvider } from '../AuthContext';
import { setupTests, cleanupTests, createMockUser } from '../../tests/testUtils';
import autoBlogAPI from '../../services/api';

// Mock the API service
jest.mock('../../services/api');

// Mock AuthContext to control user state
const mockAuthValue = {
  user: null,
  isAuthenticated: false,
  loading: false,
  logout: jest.fn(),
};

jest.mock('../AuthContext', () => ({
  ...jest.requireActual('../AuthContext'),
  useAuth: () => mockAuthValue,
}));

// Test component that exposes workflow mode context
const TestWorkflowConsumer = ({ onContextState }) => {
  const workflowMode = useWorkflowMode();
  
  React.useEffect(() => {
    if (onContextState) {
      onContextState(workflowMode);
    }
  }, [workflowMode, onContextState]);

  return (
    <div>
      <span data-testid="mode">{workflowMode.mode}</span>
      <span data-testid="is-workflow">{workflowMode.isWorkflowMode ? 'yes' : 'no'}</span>
      <span data-testid="current-step">{workflowMode.currentStep}</span>
      <span data-testid="analysis-completed">{workflowMode.stepResults.home.analysisCompleted ? 'yes' : 'no'}</span>
      <button data-testid="enter-workflow" onClick={() => workflowMode.enterWorkflowMode()}>
        Enter Workflow
      </button>
      <button data-testid="exit-workflow" onClick={() => workflowMode.exitWorkflowMode()}>
        Exit Workflow
      </button>
      <button data-testid="advance-step" onClick={() => workflowMode.advanceStep(workflowMode.currentStep + 1)}>
        Advance Step
      </button>
      <button data-testid="update-analysis" onClick={() => workflowMode.updateWebsiteAnalysis({
        businessName: 'Test Business',
        targetAudience: 'Test Audience',
        contentFocus: 'Test Focus',
      })}>
        Update Analysis
      </button>
      <button data-testid="update-analysis-completed" onClick={() => workflowMode.updateAnalysisCompleted(true)}>
        Complete Analysis
      </button>
      <button data-testid="require-auth" onClick={() => workflowMode.requireAuth('test-action')}>
        Require Auth
      </button>
      <button data-testid="reset-workflow" onClick={() => workflowMode.resetUnifiedWorkflow()}>
        Reset Workflow
      </button>
    </div>
  );
};

const renderWithProviders = (component) => {
  return render(
    <AuthProvider>
      <WorkflowModeProvider>
        {component}
      </WorkflowModeProvider>
    </AuthProvider>
  );
};

describe('WorkflowModeContext', () => {
  beforeEach(() => {
    setupTests();
    jest.clearAllMocks();
    
    // Reset auth mock to default state
    mockAuthValue.user = null;
    mockAuthValue.isAuthenticated = false;
    mockAuthValue.loading = false;
  });

  afterEach(() => {
    cleanupTests();
  });

  describe('Initial State', () => {
    it('starts in focus mode', () => {
      renderWithProviders(<TestWorkflowConsumer />);
      expect(screen.getByTestId('mode')).toHaveTextContent('focus');
      expect(screen.getByTestId('is-workflow')).toHaveTextContent('no');
    });

    it('starts at step 0', () => {
      renderWithProviders(<TestWorkflowConsumer />);
      expect(screen.getByTestId('current-step')).toHaveTextContent('0');
    });

    it('starts with analysis not completed', () => {
      renderWithProviders(<TestWorkflowConsumer />);
      expect(screen.getByTestId('analysis-completed')).toHaveTextContent('no');
    });
  });

  describe('Mode Transitions', () => {
    it('enters workflow mode', async () => {
      renderWithProviders(<TestWorkflowConsumer />);
      
      fireEvent.click(screen.getByTestId('enter-workflow'));
      
      expect(screen.getByTestId('mode')).toHaveTextContent('workflow');
      expect(screen.getByTestId('is-workflow')).toHaveTextContent('yes');
    });

    it('exits workflow mode', async () => {
      renderWithProviders(<TestWorkflowConsumer />);
      
      fireEvent.click(screen.getByTestId('enter-workflow'));
      expect(screen.getByTestId('mode')).toHaveTextContent('workflow');
      
      fireEvent.click(screen.getByTestId('exit-workflow'));
      expect(screen.getByTestId('mode')).toHaveTextContent('focus');
    });
  });

  describe('Step Progression', () => {
    it('advances to next step', async () => {
      renderWithProviders(<TestWorkflowConsumer />);
      
      expect(screen.getByTestId('current-step')).toHaveTextContent('0');
      
      fireEvent.click(screen.getByTestId('advance-step'));
      
      expect(screen.getByTestId('current-step')).toHaveTextContent('1');
    });

    it('does not advance beyond step 6', async () => {
      let _contextState;
      renderWithProviders(<TestWorkflowConsumer onContextState={(state) => { _contextState = state; }} />);
      
      // Advance to step 6
      for (let i = 0; i < 7; i++) {
        fireEvent.click(screen.getByTestId('advance-step'));
      }
      
      expect(screen.getByTestId('current-step')).toHaveTextContent('6');
      
      // Try to advance further - should stay at 6
      fireEvent.click(screen.getByTestId('advance-step'));
      
      expect(screen.getByTestId('current-step')).toHaveTextContent('6');
    });
  });

  describe('Website Analysis State', () => {
    it('updates website analysis data', async () => {
      let contextState;
      renderWithProviders(<TestWorkflowConsumer onContextState={(state) => { contextState = state; }} />);
      
      fireEvent.click(screen.getByTestId('update-analysis'));
      
      await waitFor(() => {
        expect(contextState.stepResults.home.websiteAnalysis.businessName).toBe('Test Business');
      });
      expect(contextState.stepResults.home.websiteAnalysis.targetAudience).toBe('Test Audience');
      expect(contextState.stepResults.home.websiteAnalysis.contentFocus).toBe('Test Focus');
    });

    it('marks analysis as completed', async () => {
      renderWithProviders(<TestWorkflowConsumer />);
      
      expect(screen.getByTestId('analysis-completed')).toHaveTextContent('no');
      
      fireEvent.click(screen.getByTestId('update-analysis-completed'));
      
      expect(screen.getByTestId('analysis-completed')).toHaveTextContent('yes');
    });
  });

  describe('Authentication Gates', () => {
    it('shows auth modal when user is not authenticated', async () => {
      let contextState;
      mockAuthValue.user = null;
      mockAuthValue.isAuthenticated = false;
      
      renderWithProviders(<TestWorkflowConsumer onContextState={(state) => { contextState = state; }} />);
      
      fireEvent.click(screen.getByTestId('require-auth'));
      
      await waitFor(() => {
        expect(contextState.showAuthModal).toBe(true);
      });
    });

    it('returns true when user is authenticated', async () => {
      let contextState;
      mockAuthValue.user = createMockUser();
      mockAuthValue.isAuthenticated = true;
      
      renderWithProviders(<TestWorkflowConsumer onContextState={(state) => { contextState = state; }} />);
      
      const result = contextState.requireAuth('test');
      
      expect(result).toBe(true);
      expect(contextState.showAuthModal).toBe(false);
    });
  });

  describe('Workflow Reset', () => {
    it('resets workflow state to defaults', async () => {
      let _contextState;
      renderWithProviders(<TestWorkflowConsumer onContextState={(state) => { _contextState = state; }} />);
      
      // Set up some state
      fireEvent.click(screen.getByTestId('update-analysis'));
      fireEvent.click(screen.getByTestId('advance-step'));
      fireEvent.click(screen.getByTestId('advance-step'));
      
      expect(screen.getByTestId('current-step')).toHaveTextContent('2');
      
      // Reset
      fireEvent.click(screen.getByTestId('reset-workflow'));
      
      expect(screen.getByTestId('current-step')).toHaveTextContent('0');
    });
  });

  describe('Context Hook Error', () => {
    it('throws error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestWorkflowConsumer />);
      }).toThrow('useWorkflowMode must be used within a WorkflowModeProvider');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Session Management', () => {
    it('initializes session for anonymous users', async () => {
      mockAuthValue.user = null;
      mockAuthValue.isAuthenticated = false;
      
      autoBlogAPI.getOrCreateSessionId = jest.fn().mockReturnValue('session-123');
      
      let _contextState;
      renderWithProviders(<TestWorkflowConsumer onContextState={(state) => { _contextState = state; }} />);
      
      await waitFor(() => {
        // Session initialization happens automatically
        expect(autoBlogAPI.getOrCreateSessionId).toHaveBeenCalled();
      });
    });
  });
});
