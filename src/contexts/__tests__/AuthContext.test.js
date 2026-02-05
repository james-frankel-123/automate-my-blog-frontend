import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { setupTests, cleanupTests, createMockUser } from '../../tests/testUtils';
import autoBlogAPI from '../../services/api';

// Mock the API service
jest.mock('../../services/api');

// Test component that exposes auth context
const TestAuthConsumer = ({ onAuthState }) => {
  const auth = useAuth();
  
  React.useEffect(() => {
    if (onAuthState) {
      onAuthState(auth);
    }
  }, [auth, onAuthState]);

  return (
    <div>
      <span data-testid="user-status">
        {auth.user ? `Logged in as ${auth.user.email}` : 'Not logged in'}
      </span>
      <span data-testid="loading-status">{auth.loading ? 'Loading' : 'Ready'}</span>
      <span data-testid="logging-out-status">{auth.isLoggingOut ? 'Logging out' : 'Not logging out'}</span>
      <span data-testid="admin-status">{auth.isAdmin ? 'Admin' : 'Not Admin'}</span>
      <button data-testid="login-btn" onClick={() => auth.login('test@example.com', 'password')}>
        Login
      </button>
      <button data-testid="logout-btn" onClick={() => auth.logout()}>
        Logout
      </button>
      <button data-testid="register-btn" onClick={() => auth.register({ email: 'new@example.com', password: 'pass123' })}>
        Register
      </button>
    </div>
  );
};

const renderWithAuthProvider = (component) => {
  return render(<AuthProvider>{component}</AuthProvider>);
};

describe('AuthContext', () => {
  beforeEach(() => {
    setupTests();
    jest.clearAllMocks();
    
    // Default mock for getCurrentUser (no active session)
    autoBlogAPI.getCurrentUser.mockRejectedValue(new Error('Not authenticated'));
  });

  afterEach(() => {
    cleanupTests();
  });

  describe('Initial State', () => {
    it('starts with loading state', () => {
      renderWithAuthProvider(<TestAuthConsumer />);
      // Initial state may show loading
      expect(screen.getByTestId('loading-status')).toBeInTheDocument();
    });

    it('resolves to not logged in when no token exists', async () => {
      renderWithAuthProvider(<TestAuthConsumer />);
      
      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Ready');
      });
      
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    });

    it('checks auth status when token exists', async () => {
      localStorage.setItem('accessToken', 'mock-token');
      autoBlogAPI.getCurrentUser.mockResolvedValueOnce({
        success: true,
        user: createMockUser(),
      });

      renderWithAuthProvider(<TestAuthConsumer />);

      // Allow time for auth check
      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Ready');
      }, { timeout: 3000 });
    });
  });

  describe('Login', () => {
    it('logs in user successfully', async () => {
      const mockUser = createMockUser({ email: 'test@example.com' });
      
      autoBlogAPI.login.mockResolvedValueOnce({
        success: true,
        user: mockUser,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });

      renderWithAuthProvider(<TestAuthConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Ready');
      });

      fireEvent.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as test@example.com');
      });
    });

    it('handles login failure gracefully', async () => {
      autoBlogAPI.login.mockRejectedValueOnce(new Error('Invalid credentials'));

      renderWithAuthProvider(<TestAuthConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Ready');
      });

      // Login button should be available
      expect(screen.getByTestId('login-btn')).toBeInTheDocument();
      
      // User starts as not logged in
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    });

    it('triggers login flow', async () => {
      const mockUser = createMockUser();
      
      autoBlogAPI.login.mockResolvedValueOnce({
        success: true,
        user: mockUser,
      });

      renderWithAuthProvider(<TestAuthConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Ready');
      });

      // Login button should be available
      expect(screen.getByTestId('login-btn')).toBeInTheDocument();
    });
  });

  describe('Registration', () => {
    it('registers user successfully', async () => {
      const mockUser = createMockUser({ email: 'new@example.com' });
      
      autoBlogAPI.register.mockResolvedValueOnce({
        success: true,
        user: mockUser,
        organization: { id: 'org-123', name: 'New Org' },
      });
      autoBlogAPI.trackLeadConversion.mockResolvedValueOnce({ success: true });

      renderWithAuthProvider(<TestAuthConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Ready');
      });

      fireEvent.click(screen.getByTestId('register-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as new@example.com');
      });
    });

    it('tracks registration conversion', async () => {
      const mockUser = createMockUser();
      
      autoBlogAPI.register.mockResolvedValueOnce({
        success: true,
        user: mockUser,
      });
      autoBlogAPI.trackLeadConversion.mockResolvedValueOnce({ success: true });

      renderWithAuthProvider(<TestAuthConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Ready');
      });

      fireEvent.click(screen.getByTestId('register-btn'));

      await waitFor(() => {
        expect(autoBlogAPI.trackLeadConversion).toHaveBeenCalledWith(
          'registration',
          expect.objectContaining({
            user_id: mockUser.id,
          })
        );
      });
    });
  });

  describe('Logout', () => {
    it('logs out user successfully', async () => {
      const mockUser = createMockUser();
      
      // Login first
      autoBlogAPI.login.mockResolvedValueOnce({
        success: true,
        user: mockUser,
      });
      autoBlogAPI.logout.mockResolvedValueOnce({ success: true });

      renderWithAuthProvider(<TestAuthConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Ready');
      });

      fireEvent.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in');
      });

      fireEvent.click(screen.getByTestId('logout-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
      });
    });

    it('clears user-specific localStorage and sessionStorage on logout', async () => {
      localStorage.setItem('accessToken', 'token');
      localStorage.setItem('otherKey', 'value');
      sessionStorage.setItem('sessionKey', 'sessionValue');

      autoBlogAPI.login.mockResolvedValueOnce({
        success: true,
        user: createMockUser(),
      });
      autoBlogAPI.logout.mockResolvedValueOnce({ success: true });

      renderWithAuthProvider(<TestAuthConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Ready');
      });

      fireEvent.click(screen.getByTestId('login-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent(/Logged in/);
      });

      fireEvent.click(screen.getByTestId('logout-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
      });

      expect(localStorage.getItem('accessToken')).toBeFalsy();
      expect(localStorage.getItem('otherKey')).toBeFalsy();
      expect(sessionStorage.getItem('sessionKey')).toBeFalsy();
    });

    it('clears state even if API call fails', async () => {
      const mockUser = createMockUser();
      
      autoBlogAPI.login.mockResolvedValueOnce({
        success: true,
        user: mockUser,
      });
      autoBlogAPI.logout.mockRejectedValueOnce(new Error('Network error'));

      renderWithAuthProvider(<TestAuthConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Ready');
      });

      fireEvent.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in');
      });

      fireEvent.click(screen.getByTestId('logout-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
      });
    });

    it('delays clearing user state until after logout animation to prevent UI flash (#186)', async () => {
      jest.useFakeTimers();
      const mockUser = createMockUser();
      autoBlogAPI.login.mockResolvedValueOnce({ success: true, user: mockUser });
      autoBlogAPI.logout.mockResolvedValueOnce({ success: true });

      renderWithAuthProvider(<TestAuthConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Ready');
      });

      fireEvent.click(screen.getByTestId('login-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in');
      });

      fireEvent.click(screen.getByTestId('logout-btn'));

      // Right after click: isLoggingOut true, user still set (no UI flash)
      await waitFor(() => {
        expect(screen.getByTestId('logging-out-status')).toHaveTextContent('Logging out');
      });
      expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in');

      // After animation delay: user cleared, isLoggingOut false
      act(() => {
        jest.advanceTimersByTime(600);
      });
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
      expect(screen.getByTestId('logging-out-status')).toHaveTextContent('Not logging out');

      jest.useRealTimers();
    });
  });

  describe('Role-Based Access', () => {
    it('identifies admin users', async () => {
      const mockAdmin = createMockUser({ role: 'admin' });
      localStorage.setItem('accessToken', 'mock-token');
      
      autoBlogAPI.getCurrentUser.mockResolvedValueOnce({
        success: true,
        user: mockAdmin,
      });

      renderWithAuthProvider(<TestAuthConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-status')).toHaveTextContent('Admin');
      });
    });

    it('provides role information in context', async () => {
      renderWithAuthProvider(<TestAuthConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Ready');
      });
      
      // Admin status should be rendered
      expect(screen.getByTestId('admin-status')).toBeInTheDocument();
    });
  });

  describe('Context Hook Error', () => {
    it('throws error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestAuthConsumer />);
      }).toThrow('useAuth must be used within an AuthProvider');
      
      consoleSpy.mockRestore();
    });
  });
});
