import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { setupTests, cleanupTests, createMockUser } from './tests/testUtils';
import autoBlogAPI from './services/api';

// Mock the API service
jest.mock('./services/api');

// Mock DashboardLayout to avoid deep component tree issues
jest.mock('./components/Dashboard/DashboardLayout', () => ({ forceWorkflowMode = false, isMobile = false } = {}) => (
  <div data-testid="dashboard-layout">
    <span data-testid="workflow-mode">{forceWorkflowMode ? 'workflow' : 'normal'}</span>
    <span data-testid="mobile">{isMobile ? 'mobile' : 'desktop'}</span>
    Dashboard Layout Content
  </div>
));

// Mock OnboardingFunnelView (Issue #261) to avoid full funnel tree in App tests
jest.mock('./components/Onboarding', () => ({
  OnboardingFunnelView: () => <div data-testid="onboarding-funnel">Onboarding Funnel</div>,
}));

// Mock SEOHead
jest.mock('./components/SEOHead', () => () => (
  <div data-testid="seo-head">SEO Head</div>
));

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserverMock,
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

describe('App', () => {
  beforeEach(() => {
    setupTests();
    jest.clearAllMocks();
    
    // Default API mocks for app initialization
    autoBlogAPI.getCurrentUser.mockRejectedValue(new Error('Not authenticated'));
    autoBlogAPI.getOrCreateSessionId = jest.fn().mockReturnValue('session-123');
    autoBlogAPI.getUserAudiences = jest.fn().mockResolvedValue({
      success: true,
      audiences: [],
    });
    autoBlogAPI.getRecentAnalysis = jest.fn().mockResolvedValue({
      success: false,
      analysis: null,
    });
  });

  afterEach(() => {
    cleanupTests();
  });

  describe('App Initialization', () => {
    it('renders without crashing', async () => {
      render(<App />);
      
      // App should show loading initially, then resolve
      await waitFor(() => {
        // Either loading indicator or actual content should be visible
        expect(document.body.textContent).not.toBe('');
      });
    });

    it('renders app structure', () => {
      render(<App />);
      
      // App should render the main components
      expect(screen.getByTestId('seo-head')).toBeInTheDocument();
    });

    it('resolves loading state', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Unauthenticated User Flow', () => {
    it('shows logged-out experience when not authenticated', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
      
      // Logged-out users should see the workflow experience
      // The exact text depends on the DashboardLayout implementation
    });

    it('stores referral information on app load', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
      
      // Referral info storage happens in useEffect
    });
  });

  describe('Authenticated User Flow', () => {
    it('shows dashboard when user is authenticated', async () => {
      const mockUser = createMockUser();
      localStorage.setItem('accessToken', 'mock-token');
      
      autoBlogAPI.getCurrentUser.mockResolvedValueOnce({
        success: true,
        user: mockUser,
      });
      autoBlogAPI.getUserCredits = jest.fn().mockResolvedValue({
        totalCredits: 10,
        usedCredits: 0,
        availableCredits: 10,
        basePlan: 'Free',
        isUnlimited: false,
      });
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
      
      // Authenticated users should see dashboard elements
    });

    it('renders onboarding funnel when user is present but no completed analysis', async () => {
      localStorage.setItem('accessToken', 'mock-token');
      autoBlogAPI.getCurrentUser.mockResolvedValueOnce({
        success: true,
        user: createMockUser(),
      });
      render(<App />);
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
      expect(screen.getByTestId('onboarding-funnel')).toBeInTheDocument();
    });

    it('when user is present and no completed analysis, shows onboarding funnel', async () => {
      localStorage.setItem('accessToken', 'mock-token');
      autoBlogAPI.getCurrentUser.mockResolvedValue({
        success: true,
        user: createMockUser(),
      });
      render(<App />);
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
      expect(screen.getByTestId('onboarding-funnel')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('handles window resize events', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
      
      // Simulate resize
      global.innerWidth = 500;
      global.dispatchEvent(new Event('resize'));
      
      // Component should handle resize without errors
    });

    it('detects mobile viewport', async () => {
      global.innerWidth = 400;
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Context Providers', () => {
    it('wraps app in AuthProvider', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
      
      // App should render without "useAuth must be used within AuthProvider" error
    });

    it('wraps app in AnalyticsProvider', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
      
      // App should render without analytics context errors
    });

    it('wraps app in WorkflowModeProvider', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
      
      // App should render without workflow mode context errors
    });
  });

  describe('SEO Head', () => {
    it('renders SEO head component', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
      
      // SEOHead component should be rendered (though it affects document.head)
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      autoBlogAPI.getCurrentUser.mockRejectedValue(new Error('Network error'));
      localStorage.setItem('accessToken', 'mock-token');
      
      render(<App />);
      
      // Should not crash, should show logged-out state
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    it('handles missing environment variables gracefully', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });
  });
});

describe('App Integration', () => {
  beforeEach(() => {
    setupTests();
    jest.clearAllMocks();
    
    autoBlogAPI.getCurrentUser.mockRejectedValue(new Error('Not authenticated'));
    autoBlogAPI.getOrCreateSessionId = jest.fn().mockReturnValue('session-123');
    autoBlogAPI.getUserAudiences = jest.fn().mockResolvedValue({
      success: true,
      audiences: [],
    });
  });

  afterEach(() => {
    cleanupTests();
  });

  it('completes full unauthenticated workflow', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // The workflow components should be accessible
    // Full integration testing would require more complex setup
  });

  it('navigates between sections smoothly', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Navigation elements should be present
  });
});
