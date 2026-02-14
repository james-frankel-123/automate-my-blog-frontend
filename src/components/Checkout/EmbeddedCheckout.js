import React, { useState, useEffect } from 'react';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Spin, Alert } from 'antd';

// Initialize Stripe with publishable key from environment
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

/**
 * EmbeddedCheckoutComponent
 *
 * Renders Stripe's embedded checkout experience within the application.
 * Keeps users on the domain during payment, providing a seamless UX.
 *
 * @param {Object} props
 * @param {string} props.clientSecret - Stripe checkout session client secret
 * @param {Function} props.onComplete - Optional callback when checkout completes
 * @param {Function} props.onError - Optional callback when an error occurs
 */
export const EmbeddedCheckoutComponent = ({ clientSecret, onComplete, onError }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (clientSecret) {
      setLoading(false);
    }
  }, [clientSecret]);

  useEffect(() => {
    // Verify Stripe.js loaded successfully
    stripePromise
      .then((stripe) => {
        if (!stripe) {
          const errorMsg = 'Failed to load Stripe.js. Please check your internet connection.';
          setError(errorMsg);
          if (onError) {
            onError(new Error(errorMsg));
          }
        }
      })
      .catch((err) => {
        const errorMsg = 'Unable to initialize secure checkout. Please try again.';
        console.error('Stripe.js failed to load:', err);
        setError(errorMsg);
        if (onError) {
          onError(err);
        }
      });
  }, [onError]);

  // Show loading spinner while waiting for client secret
  if (!clientSecret) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Spin size="large" tip="Initializing secure checkout..." />
      </div>
    );
  }

  // Show error state if Stripe.js failed to load
  if (error) {
    return (
      <Alert
        type="error"
        message="Checkout Error"
        description={error}
        showIcon
        style={{ margin: '20px 0' }}
      />
    );
  }

  return (
    <div style={{ minHeight: '500px', padding: '20px 0' }}>
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" tip="Loading payment form..." />
        </div>
      )}
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ clientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
};

export default EmbeddedCheckoutComponent;
