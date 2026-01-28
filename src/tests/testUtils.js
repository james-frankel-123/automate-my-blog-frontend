import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import { WorkflowModeProvider } from '../contexts/WorkflowModeContext';
import { AnalyticsProvider } from '../contexts/AnalyticsContext';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value?.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index) => Object.keys(store)[index] || null),
  };
})();

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value?.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index) => Object.keys(store)[index] || null),
  };
})();

// Setup storage mocks
export const setupStorageMocks = () => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });
};

// Reset storage mocks
export const resetStorageMocks = () => {
  localStorageMock.clear();
  sessionStorageMock.clear();
  jest.clearAllMocks();
};

// Mock window.matchMedia for responsive tests
export const setupMatchMediaMock = (matches = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

// Mock IntersectionObserver
export const setupIntersectionObserverMock = () => {
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
};

// Mock ResizeObserver
export const setupResizeObserverMock = () => {
  class ResizeObserverMock {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
  }
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: ResizeObserverMock,
  });
};

// Mock window.scrollTo
export const setupScrollToMock = () => {
  window.scrollTo = jest.fn();
  Element.prototype.scrollIntoView = jest.fn();
};

// Create mock user
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  permissions: [],
  organizationId: 'org-123',
  organizationName: 'Test Org',
  organizationRole: 'owner',
  ...overrides,
});

// Create mock admin user
export const createMockAdminUser = (overrides = {}) => ({
  ...createMockUser(),
  role: 'admin',
  permissions: ['manage_users', 'manage_content', 'view_analytics'],
  ...overrides,
});

// Create mock super admin user
export const createMockSuperAdminUser = (overrides = {}) => ({
  ...createMockUser(),
  role: 'super_admin',
  permissions: ['manage_users', 'manage_content', 'view_analytics', 'manage_system'],
  ...overrides,
});

// All providers wrapper for rendering
const AllProvidersWrapper = ({ children }) => {
  return (
    <AuthProvider>
      <AnalyticsProvider>
        <WorkflowModeProvider>
          {children}
        </WorkflowModeProvider>
      </AnalyticsProvider>
    </AuthProvider>
  );
};

// Custom render with all providers
export const renderWithProviders = (ui, options = {}) => {
  return rtlRender(ui, { wrapper: AllProvidersWrapper, ...options });
};

// Auth context mock wrapper with custom user
export const createAuthContextWrapper = (user = null, additionalProps = {}) => {
  const MockAuthProvider = ({ children }) => {
    const value = {
      user,
      loading: false,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
      isSuperAdmin: user?.role === 'super_admin',
      hasPermission: (permission) => user?.permissions?.includes(permission) || false,
      userPermissions: user?.permissions || [],
      currentOrganization: user ? {
        id: user.organizationId,
        name: user.organizationName,
        role: user.organizationRole,
      } : null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      loginContext: null,
      clearLoginContext: jest.fn(),
      setNavContext: jest.fn(),
      isNewRegistration: false,
      clearNewRegistration: jest.fn(),
      isImpersonating: false,
      impersonationData: null,
      startImpersonation: jest.fn(),
      endImpersonation: jest.fn(),
      ...additionalProps,
    };
    
    return (
      <div data-testid="mock-auth-provider" data-user={user ? JSON.stringify(user) : null}>
        {React.Children.map(children, child => 
          React.cloneElement(child, { authContext: value })
        )}
      </div>
    );
  };
  
  return MockAuthProvider;
};

// Wait for async operations
export const waitForAsync = (ms = 0) => 
  new Promise((resolve) => setTimeout(resolve, ms));

// Mock API response helper
export const createMockApiResponse = (data, success = true) => ({
  success,
  ...data,
});

// Mock fetch helper
export const mockFetch = (responses = {}) => {
  global.fetch = jest.fn((url, options) => {
    const path = new URL(url, 'http://localhost').pathname;
    const method = options?.method || 'GET';
    const key = `${method} ${path}`;
    
    const response = responses[key] || responses[path] || { ok: true, json: () => Promise.resolve({}) };
    
    return Promise.resolve({
      ok: response.ok !== false,
      status: response.status || 200,
      json: () => Promise.resolve(response.data || response),
      text: () => Promise.resolve(JSON.stringify(response.data || response)),
    });
  });
};

// Common test setup
export const setupTests = () => {
  setupStorageMocks();
  setupMatchMediaMock();
  setupIntersectionObserverMock();
  setupResizeObserverMock();
  setupScrollToMock();
  
  // Mock console.error to avoid noise in tests
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
};

// Common test cleanup
export const cleanupTests = () => {
  resetStorageMocks();
  jest.clearAllMocks();
  jest.restoreAllMocks();
};

export { rtlRender as render };
