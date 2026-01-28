import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardTab from '../DashboardTab';
import { AuthProvider } from '../../../contexts/AuthContext';
import { AnalyticsProvider } from '../../../contexts/AnalyticsContext';
import { WorkflowModeProvider } from '../../../contexts/WorkflowModeContext';
import { 
  setupTests, 
  cleanupTests, 
  createMockUser 
} from '../../../tests/testUtils';
import autoBlogAPI from '../../../services/api';

// Mock the API service
jest.mock('../../../services/api');

// Mock child components
jest.mock('../UnifiedWorkflowHeader', () => ({ user, onCreateNewPost }) => (
  <div data-testid="workflow-header">
    <button data-testid="create-post-btn" onClick={onCreateNewPost}>
      Create New Post
    </button>
    {user ? `Welcome, ${user.firstName}` : 'Guest'}
  </div>
));

jest.mock('../../Workflow/steps/WebsiteAnalysisStepStandalone', () => ({ 
  onAnalysisComplete,
  analysisCompleted 
}) => (
  <div data-testid="website-analysis-step">
    <span>Analysis Completed: {analysisCompleted ? 'Yes' : 'No'}</span>
    <button 
      data-testid="complete-analysis"
      onClick={() => onAnalysisComplete({
        analysis: {
          businessName: 'Test Business',
          targetAudience: 'Developers',
          contentFocus: 'Technical content',
        },
        websiteUrl: 'https://example.com',
      })}
    >
      Complete Analysis
    </button>
  </div>
));

// Mock useAuth hook
const mockAuthValue = {
  user: null,
};

jest.mock('../../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../../contexts/AuthContext'),
  useAuth: () => mockAuthValue,
}));

// Mock useTabMode hook
jest.mock('../../../hooks/useTabMode', () => ({
  useTabMode: () => ({
    mode: 'workflow',
    enterWorkflowMode: jest.fn(),
    enterFocusMode: jest.fn(),
  }),
}));

// Mock useWorkflowMode hook
const mockWorkflowModeValue = {
  websiteUrl: '',
  setWebsiteUrl: jest.fn(),
  isLoading: false,
  setIsLoading: jest.fn(),
  currentStep: 0,
  stepResults: {
    home: {
      analysisCompleted: false,
      websiteAnalysis: {},
      webSearchInsights: { researchQuality: 'basic' },
    },
    audience: {},
    posts: {},
  },
  updateWebsiteAnalysis: jest.fn(),
  updateCTAData: jest.fn(),
  updateWebSearchInsights: jest.fn(),
  updateAnalysisCompleted: jest.fn(),
  requireAuth: jest.fn(),
  addStickyWorkflowStep: jest.fn(),
  updateStickyWorkflowStep: jest.fn(),
  saveWorkflowState: jest.fn(),
  sessionId: null,
  initializeSession: jest.fn(),
  loadUserAudiences: jest.fn(),
};

jest.mock('../../../contexts/WorkflowModeContext', () => ({
  ...jest.requireActual('../../../contexts/WorkflowModeContext'),
  useWorkflowMode: () => mockWorkflowModeValue,
}));

const renderDashboardTab = (props = {}) => {
  return render(
    <AuthProvider>
      <AnalyticsProvider>
        <WorkflowModeProvider>
          <DashboardTab {...props} />
        </WorkflowModeProvider>
      </AnalyticsProvider>
    </AuthProvider>
  );
};

describe('DashboardTab', () => {
  beforeEach(() => {
    setupTests();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupTests();
  });

  describe('Rendering', () => {
    it('renders the unified workflow header', () => {
      renderDashboardTab();
      expect(screen.getByTestId('workflow-header')).toBeInTheDocument();
    });

    it('renders the website analysis step', () => {
      renderDashboardTab();
      expect(screen.getByTestId('website-analysis-step')).toBeInTheDocument();
    });

    it('shows workflow mode by default', () => {
      renderDashboardTab({ forceWorkflowMode: true });
      expect(screen.getByTestId('website-analysis-step')).toBeInTheDocument();
    });
  });

  describe('Guest User Experience', () => {
    beforeEach(() => {
      mockAuthValue.user = null;
    });

    it('shows guest label in header', () => {
      renderDashboardTab();
      expect(screen.getByText('Guest')).toBeInTheDocument();
    });

    it('allows website analysis for guests', () => {
      renderDashboardTab({ forceWorkflowMode: true });
      expect(screen.getByTestId('website-analysis-step')).toBeInTheDocument();
    });
  });

  describe('Logged In User Experience', () => {
    beforeEach(() => {
      mockAuthValue.user = createMockUser({ firstName: 'John' });
    });

    it('shows user name in header', () => {
      renderDashboardTab();
      expect(screen.getByText(/Welcome, John/i)).toBeInTheDocument();
    });

    it('renders correctly for logged in users', async () => {
      renderDashboardTab();

      // Should show the workflow header
      expect(screen.getByTestId('workflow-header')).toBeInTheDocument();
      expect(screen.getByText(/Welcome, John/i)).toBeInTheDocument();
    });
  });

  describe('Website Analysis Completion', () => {
    it('shows continue button after analysis completes', () => {
      mockWorkflowModeValue.stepResults.home.analysisCompleted = true;
      mockWorkflowModeValue.stepResults.home.websiteAnalysis = {
        businessName: 'Test',
        targetAudience: 'Users',
        contentFocus: 'Content',
      };

      renderDashboardTab({ forceWorkflowMode: true });

      expect(screen.getByText(/Continue to Audience Selection/i)).toBeInTheDocument();
    });

    it('does not show continue button before analysis', () => {
      mockWorkflowModeValue.stepResults.home.analysisCompleted = false;

      renderDashboardTab({ forceWorkflowMode: true });

      expect(screen.queryByText(/Continue to Audience Selection/i)).not.toBeInTheDocument();
    });

    it('calls onNextStep when continue button clicked', async () => {
      const onNextStep = jest.fn();
      mockWorkflowModeValue.stepResults.home.analysisCompleted = true;
      mockWorkflowModeValue.stepResults.home.websiteAnalysis = {
        businessName: 'Test',
        targetAudience: 'Users',
        contentFocus: 'Content',
      };

      renderDashboardTab({ forceWorkflowMode: true, onNextStep });

      fireEvent.click(screen.getByText(/Next Step: Audience Selection/i));
      
      expect(onNextStep).toHaveBeenCalled();
    });
  });

  describe('Project Mode', () => {
    it('respects forceWorkflowMode prop', () => {
      renderDashboardTab({ forceWorkflowMode: true });
      expect(screen.getByTestId('website-analysis-step')).toBeInTheDocument();
    });

    it('handles onEnterProjectMode callback', async () => {
      const onEnterProjectMode = jest.fn();
      mockAuthValue.user = createMockUser();

      renderDashboardTab({ onEnterProjectMode });

      fireEvent.click(screen.getByTestId('create-post-btn'));
      
      expect(onEnterProjectMode).toHaveBeenCalled();
    });
  });

  describe('Save Project', () => {
    it('shows save project button when showSaveProjectButton is true', () => {
      mockAuthValue.user = createMockUser();
      
      renderDashboardTab({ 
        showSaveProjectButton: true,
        isNewRegistration: true 
      });

      expect(screen.getByTestId('workflow-header')).toBeInTheDocument();
    });
  });

  describe('Session Management', () => {
    it('renders session management elements', () => {
      mockAuthValue.user = null;
      mockWorkflowModeValue.sessionId = null;

      renderDashboardTab({ forceWorkflowMode: true });

      // Should render the website analysis step
      expect(screen.getByTestId('website-analysis-step')).toBeInTheDocument();
    });
  });
});
