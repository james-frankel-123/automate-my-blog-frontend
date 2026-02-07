/**
 * ErrorBoundary — catches React render errors and shows a fallback UI.
 * Wraps the app so unhandled errors don't crash the whole app.
 */
import React from 'react';
import { Alert, Button } from 'antd';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      const isDev = process.env.NODE_ENV !== 'production';
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'var(--color-background-body)',
          }}
        >
          <Alert
            type="error"
            message="Something went wrong"
            description={
              <div>
                <p style={{ marginBottom: 12 }}>
                  An unexpected error occurred. Please try refreshing the page or try again.
                </p>
                {isDev && error?.message && (
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                    {error.message}
                  </p>
                )}
                <Button type="primary" onClick={this.handleReset}>
                  Try again
                </Button>
              </div>
            }
            showIcon
            style={{ maxWidth: 480 }}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
