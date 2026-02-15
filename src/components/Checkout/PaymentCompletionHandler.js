import React, { useEffect, useState } from 'react';
import { message, Spin } from 'antd';
import api from '../../services/api';

/**
 * PaymentCompletionHandler
 *
 * Handles the return_url redirect after embedded checkout completion.
 * Verifies payment status with backend and shows appropriate messages.
 *
 * This component should be rendered in the app to detect when a user
 * returns from Stripe checkout with a session_id parameter.
 */
export const PaymentCompletionHandler = () => {
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'

  useEffect(() => {
    // Get session_id from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    // Only process if we have a session_id from Stripe
    if (!sessionId) {
      return;
    }

    // Avoid processing the same session multiple times
    if (status !== 'idle') {
      return;
    }

    setStatus('loading');

    // Verify payment status with backend
    api
      .getSessionStatus(sessionId)
      .then((response) => {
        if (response.success && response.payment_status === 'paid') {
          message.success({
            content: 'Payment successful! Your subscription is now active.',
            duration: 5,
            style: { marginTop: '20vh' }
          });
          setStatus('success');

          // Clean up URL parameters after 2 seconds
          setTimeout(() => {
            // Remove session_id from URL to prevent re-processing
            const newParams = new URLSearchParams(window.location.search);
            newParams.delete('session_id');

            // Keep other query params if they exist
            const paramsString = newParams.toString();
            const newUrl = paramsString
              ? `${window.location.pathname}?${paramsString}`
              : window.location.pathname;

            window.history.replaceState({}, '', newUrl);
          }, 2000);
        } else {
          console.warn('Payment not completed:', response);
          message.warning({
            content: 'Payment was not completed. Please try again if needed.',
            duration: 5,
            style: { marginTop: '20vh' }
          });
          setStatus('error');

          // Clean up URL
          setTimeout(() => {
            const newParams = new URLSearchParams(window.location.search);
            newParams.delete('session_id');
            const paramsString = newParams.toString();
            const newUrl = paramsString
              ? `${window.location.pathname}?${paramsString}`
              : window.location.pathname;
            window.history.replaceState({}, '', newUrl);
          }, 1000);
        }
      })
      .catch((error) => {
        console.error('Error verifying payment status:', error);
        message.error({
          content: 'Unable to verify payment status. Please refresh the page.',
          duration: 5,
          style: { marginTop: '20vh' }
        });
        setStatus('error');

        // Clean up URL even on error
        setTimeout(() => {
          const newParams = new URLSearchParams(window.location.search);
          newParams.delete('session_id');
          const paramsString = newParams.toString();
          const newUrl = paramsString
            ? `${window.location.pathname}?${paramsString}`
            : window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }, 1000);
      });
  }, [status]);

  // Only show loading spinner while verifying payment
  if (status === 'loading') {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          zIndex: 9999
        }}
      >
        <Spin size="large" tip="Verifying payment..." />
      </div>
    );
  }

  // Don't render anything once verification is complete
  return null;
};

export default PaymentCompletionHandler;
