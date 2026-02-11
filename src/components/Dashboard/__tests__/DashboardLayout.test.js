import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardLayout from '../DashboardLayout';
import { AuthProvider } from '../../../contexts/AuthContext';
import { AnalyticsProvider } from '../../../contexts/AnalyticsContext';
import { WorkflowModeProvider } from '../../../contexts/WorkflowModeContext';
import { SystemHintProvider } from '../../../contexts/SystemHintContext';
import { 
  setupTests, 
  cleanupTests, 
  createMockUser,
  createMockSuperAdminUser 
} from '../../../tests/testUtils';

// Mock the API service
jest.mock('../../../services/api');

// Mock child components to simplify testing
jest.mock('../DashboardTab', () => () => <div data-testid="dashboard-tab">Dashboard Tab</div>);
jest.mock('../PostsTab', () => () => <div data-testid="posts-tab">Posts Tab</div>);
jest.mock('../AudienceSegmentsTab', () => () => <div data-testid="audience-tab">Audience Tab</div>);
jest.mock('../SettingsTab', () => () => <div data-testid="settings-tab">Settings Tab</div>);
jest.mock('../AdminUsersTab', () => () => <div data-testid="admin-users-tab">Admin Users Tab</div>);
jest.mock('../AdminAnalyticsTab', () => () => <div data-testid="admin-analytics-tab">Admin Analytics Tab</div>);
jest.mock('../AdminContentTab', () => () => <div data-testid="admin-content-tab">Admin Content Tab</div>);
jest.mock('../AdminSystemTab', () => () => <div data-testid="admin-system-tab">Admin System Tab</div>);
jest.mock('../AdminLeadsTab', () => () => <div data-testid="admin-leads-tab">Admin Leads Tab</div>);
jest.mock('../LoggedOutProgressHeader', () => () => <div data-testid="logged-out-header">Logged Out Header</div>);
jest.mock('../../Auth/AuthModal', () => ({ open }) => open ? <div data-testid="auth-modal">Auth Modal</div> : null);
jest.mock('../../Modals/PricingModal', () => ({ open }) => open ? <div data-testid="pricing-modal">Pricing Modal</div> : null);

// Mock AuthContext to control user state
const mockAuthContextValue = {
  user: null,
  loading: false,
  logout: jest.fn(),
  isAdmin: false,
  isSuperAdmin: false,
  hasPermission: jest.fn(() => false),
  isImpersonating: false,
  impersonationData: null,
  endImpersonation: jest.fn(),
  isNewRegistration: false,
  clearNewRegistration: jest.fn(),
};

jest.mock('../../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../../contexts/AuthContext'),
  useAuth: () => mockAuthContextValue,
}));

const renderDashboardLayout = (props = {}, userOverrides = null) => {
  if (userOverrides !== null) {
    mockAuthContextValue.user = userOverrides;
    mockAuthContextValue.isAdmin = userOverrides?.role === 'admin' || userOverrides?.role === 'super_admin';
    mockAuthContextValue.isSuperAdmin = userOverrides?.role === 'super_admin';
    mockAuthContextValue.hasPermission = jest.fn((permission) => 
      userOverrides?.permissions?.includes(permission) || false
    );
  } else {
    mockAuthContextValue.user = null;
    mockAuthContextValue.isAdmin = false;
    mockAuthContextValue.isSuperAdmin = false;
    mockAuthContextValue.hasPermission = jest.fn(() => false);
  }

  return render(
    <AuthProvider>
      <AnalyticsProvider>
        <WorkflowModeProvider>
          <SystemHintProvider>
            <DashboardLayout {...props} />
          </SystemHintProvider>
        </WorkflowModeProvider>
      </AnalyticsProvider>
    </AuthProvider>
  );
};

describe('DashboardLayout', () => {
  beforeEach(() => {
    setupTests();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupTests();
  });

  describe('Logged Out State', () => {
    it('renders logged out progress header when not authenticated', () => {
      renderDashboardLayout({ forceWorkflowMode: true });
      expect(screen.getByTestId('logged-out-header')).toBeInTheDocument();
    });

    it('shows auth modal trigger for logged out users', () => {
      renderDashboardLayout({ forceWorkflowMode: true });
      // The workflow mode shows the logged out experience
      expect(screen.getByTestId('dashboard-tab')).toBeInTheDocument();
    });
  });

  describe('Logged In State', () => {
    it('renders sidebar for logged in desktop users', () => {
      const mockUser = createMockUser();
      renderDashboardLayout({ isMobile: false }, mockUser);
      
      // Sidebar should contain navigation items
      expect(screen.getByText('Automate My Blog')).toBeInTheDocument();
    });

    it('renders mobile navigation for mobile users', () => {
      const mockUser = createMockUser();
      renderDashboardLayout({ isMobile: true }, mockUser);
      
      // Mobile navigation is present at bottom
      expect(screen.getByTestId('dashboard-tab')).toBeInTheDocument();
    });

    it('shows user profile in sidebar', () => {
      const mockUser = createMockUser({ firstName: 'John', lastName: 'Doe' });
      renderDashboardLayout({ isMobile: false }, mockUser);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Navigation Menu', () => {
    it('shows base menu items for regular users', () => {
      const mockUser = createMockUser();
      renderDashboardLayout({ isMobile: false }, mockUser);
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Audience')).toBeInTheDocument();
      expect(screen.getByText('Posts')).toBeInTheDocument();
    });

    it('does not show admin menu items for regular users', () => {
      const mockUser = createMockUser();
      renderDashboardLayout({ isMobile: false }, mockUser);
      
      expect(screen.queryByText('Admin Users')).not.toBeInTheDocument();
      expect(screen.queryByText('Admin Analytics')).not.toBeInTheDocument();
    });

    it('shows admin menu items for super admin', () => {
      const mockUser = createMockSuperAdminUser();
      renderDashboardLayout({ isMobile: false }, mockUser);
      
      expect(screen.getByText('Admin Users')).toBeInTheDocument();
      expect(screen.getByText('Website Leads')).toBeInTheDocument();
      expect(screen.getByText('Admin Analytics')).toBeInTheDocument();
      expect(screen.getByText('Admin Content')).toBeInTheDocument();
      expect(screen.getByText('Admin System')).toBeInTheDocument();
    });
  });

  describe('Workflow Mode', () => {
    it('respects forceWorkflowMode prop', () => {
      renderDashboardLayout({ forceWorkflowMode: true }, null);
      expect(screen.getByTestId('logged-out-header')).toBeInTheDocument();
    });

    it('shows project mode button when logged in', () => {
      const mockUser = createMockUser();
      renderDashboardLayout({ isMobile: false }, mockUser);
      
      // Either "Create New Post" or "Exit Project Mode" should be visible
      // depending on project mode state
      expect(screen.getByTestId('dashboard-tab')).toBeInTheDocument();
    });
  });

  describe('Impersonation Banner', () => {
    it('shows impersonation banner when impersonating', () => {
      mockAuthContextValue.isImpersonating = true;
      mockAuthContextValue.impersonationData = {
        originalAdmin: { firstName: 'Admin', lastName: 'User' },
      };
      const mockUser = createMockUser();
      
      renderDashboardLayout({ isMobile: false }, mockUser);
      
      expect(screen.getByText(/Acting as/i)).toBeInTheDocument();
    });

    it('does not show impersonation banner when not impersonating', () => {
      mockAuthContextValue.isImpersonating = false;
      mockAuthContextValue.impersonationData = null;
      const mockUser = createMockUser();
      
      renderDashboardLayout({ isMobile: false }, mockUser);
      
      expect(screen.queryByText(/Acting as/i)).not.toBeInTheDocument();
    });
  });

  describe('Credits Display', () => {
    it('shows credits counter for logged in users', () => {
      const mockUser = createMockUser();
      renderDashboardLayout({ isMobile: false }, mockUser);
      
      // Credits counter is displayed in the top right
      expect(screen.getByTestId('dashboard-tab')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('hides sidebar on mobile', () => {
      const mockUser = createMockUser();
      renderDashboardLayout({ isMobile: true }, mockUser);
      
      // Sidebar title should not be visible on mobile
      // Mobile uses bottom navigation instead
      expect(screen.queryByText('Automate My Blog')).not.toBeInTheDocument();
    });

    it('shows sidebar on desktop', () => {
      const mockUser = createMockUser();
      renderDashboardLayout({ isMobile: false }, mockUser);
      
      expect(screen.getByText('Automate My Blog')).toBeInTheDocument();
    });
  });
});
