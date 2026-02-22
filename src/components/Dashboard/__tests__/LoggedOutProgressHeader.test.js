import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LoggedOutProgressHeader from '../LoggedOutProgressHeader';

jest.mock('../../ThemeToggle/ThemeToggle', () => () => <div data-testid="theme-toggle">Theme</div>);

describe('LoggedOutProgressHeader', () => {
  const defaultProps = {
    setShowAuthModal: jest.fn(),
    setAuthContext: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login and signup when user is null', () => {
    render(<LoggedOutProgressHeader {...defaultProps} />);
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
    expect(screen.getByText('Log In')).toBeInTheDocument();
    expect(screen.getByText('Sign Up Free')).toBeInTheDocument();
  });

  it('calls setAuthContext and setShowAuthModal when login clicked', () => {
    render(<LoggedOutProgressHeader {...defaultProps} />);
    fireEvent.click(screen.getByTestId('login-button'));
    expect(defaultProps.setAuthContext).toHaveBeenCalledWith('login');
    expect(defaultProps.setShowAuthModal).toHaveBeenCalledWith(true);
  });

  it('shows Go to Dashboard button when user is set and not new registration', () => {
    render(
      <LoggedOutProgressHeader
        {...defaultProps}
        user={{ id: '1', email: 'u@example.com' }}
      />
    );
    expect(screen.getByTestId('dashboard-button')).toBeInTheDocument();
    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
  });

  it('shows Go to Dashboard when user is new registration', () => {
    render(
      <LoggedOutProgressHeader
        {...defaultProps}
        user={{ id: '1' }}
        isNewRegistration
      />
    );
    expect(screen.getByTestId('dashboard-button')).toBeInTheDocument();
    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
  });
});
