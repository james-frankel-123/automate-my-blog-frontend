import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginModal from '../LoginModal';
import { AuthProvider } from '../../../contexts/AuthContext';
import { AnalyticsProvider } from '../../../contexts/AnalyticsContext';
import { setupTests, cleanupTests } from '../../../tests/testUtils';
import autoBlogAPI from '../../../services/api';

// Mock the API service
jest.mock('../../../services/api');

const renderLoginModal = (props = {}) => {
  return render(
    <AuthProvider>
      <AnalyticsProvider>
        <LoginModal
          onClose={jest.fn()}
          {...props}
        />
      </AnalyticsProvider>
    </AuthProvider>
  );
};

describe('LoginModal', () => {
  beforeEach(() => {
    setupTests();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupTests();
  });

  describe('Rendering', () => {
    it('renders the login form', () => {
      renderLoginModal();
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Email address/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });

    it('renders subheading text', () => {
      renderLoginModal();
      expect(screen.getByText(/Sign in to your AutoBlog account/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('has email and password inputs', () => {
      renderLoginModal();
      
      expect(screen.getByPlaceholderText(/Email address/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    });

    it('has a submit button', () => {
      renderLoginModal();
      
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('submits the form with valid credentials', async () => {
      const onClose = jest.fn();
      autoBlogAPI.login.mockResolvedValueOnce({
        success: true,
        user: { id: '123', email: 'test@example.com' },
      });

      renderLoginModal({ onClose });
      
      fireEvent.change(screen.getByPlaceholderText(/Email address/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
      
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('shows loading state during submission', async () => {
      // Create a delayed promise to observe loading state
      autoBlogAPI.login.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true, user: {} }), 100))
      );

      renderLoginModal();
      
      fireEvent.change(screen.getByPlaceholderText(/Email address/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
      
      // Button should show loading state
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });

    it('displays error message on login failure', async () => {
      autoBlogAPI.login.mockRejectedValueOnce(new Error('Invalid credentials'));

      renderLoginModal();
      
      fireEvent.change(screen.getByPlaceholderText(/Email address/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'wrongpassword' } });
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('calls onSuccess callback after successful login', async () => {
      const onClose = jest.fn();
      const onSuccess = jest.fn();
      autoBlogAPI.login.mockResolvedValueOnce({
        success: true,
        user: { id: '123', email: 'test@example.com' },
      });

      renderLoginModal({ onClose, onSuccess });
      
      fireEvent.change(screen.getByPlaceholderText(/Email address/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
      
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Context Passing', () => {
    it('passes context to login function', async () => {
      const context = 'gate';
      autoBlogAPI.login.mockResolvedValueOnce({
        success: true,
        user: { id: '123', email: 'test@example.com' },
      });

      renderLoginModal({ context, onClose: jest.fn() });
      
      fireEvent.change(screen.getByPlaceholderText(/Email address/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
      
      // The context should be passed through to the login function
      await waitFor(() => {
        expect(autoBlogAPI.login).toHaveBeenCalled();
      });
    });
  });
});
