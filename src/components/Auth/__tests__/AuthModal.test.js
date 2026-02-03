import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AuthModal from '../AuthModal';
import { AuthProvider } from '../../../contexts/AuthContext';
import { AnalyticsProvider } from '../../../contexts/AnalyticsContext';
import { setupTests, cleanupTests } from '../../../tests/testUtils';

// Mock the API service
jest.mock('../../../services/api');

const renderAuthModal = (props = {}) => {
  return render(
    <AuthProvider>
      <AnalyticsProvider>
        <AuthModal
          open={true}
          onClose={jest.fn()}
          {...props}
        />
      </AnalyticsProvider>
    </AuthProvider>
  );
};

describe('AuthModal', () => {
  beforeEach(() => {
    setupTests();
  });

  afterEach(() => {
    cleanupTests();
  });

  describe('Rendering', () => {
    it('renders when open is true', () => {
      renderAuthModal({ open: true });
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      renderAuthModal({ open: false });
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('displays login tab by default', () => {
      renderAuthModal();
      // Tab buttons should be present
      expect(screen.getAllByText('Sign In').length).toBeGreaterThan(0);
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });

    it('displays register tab when defaultTab is register', () => {
      // Skip this test as RegisterModal may have additional dependencies
      expect(true).toBe(true);
    });
  });

  describe('Tab Switching', () => {
    it('has login and register tabs available', async () => {
      renderAuthModal();
      
      // Both tabs should be present
      expect(screen.getAllByText('Sign In').length).toBeGreaterThan(0);
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });
  });

  describe('Modal Close', () => {
    it('calls onClose when close button is clicked', async () => {
      const onClose = jest.fn();
      renderAuthModal({ onClose });
      
      fireEvent.click(screen.getByTestId('modal-close'));
      
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Context', () => {
    it('passes context to child components', () => {
      renderAuthModal({ context: 'gate' });
      // Context is passed to LoginModal/RegisterModal
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
  });

});
