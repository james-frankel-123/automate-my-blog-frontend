import React, { createContext, useContext, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import WorkflowModeContext from './WorkflowModeContext';
import autoBlogAPI from '../services/api';

const AnalyticsContext = createContext();

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

export const AnalyticsProvider = ({ children }) => {
  const { user } = useAuth();
  const workflowContext = useContext(WorkflowModeContext);
  const workflowWebsiteUrl = workflowContext?.websiteUrl ?? null;
  const sessionId = useRef(generateSessionId());
  const eventQueue = useRef([]);
  const flushTimeout = useRef(null);

  /**
   * Track individual event. Sends for all users (logged in or out); backend should accept
   * unauthenticated requests and key by workflowWebsiteUrl/sessionId. See issue #202.
   */
  const trackEvent = useCallback(async (eventType, eventData = {}, metadata = {}) => {
    try {
      const event = {
        eventType,
        eventData,
        pageUrl: window.location.href,
        userId: user?.id || null,
        workflowWebsiteUrl: workflowWebsiteUrl || metadata.workflowWebsiteUrl || null,
        metadata: {
          sessionId: sessionId.current,
          referrer: document.referrer,
          conversionFunnelStep: metadata.conversionFunnelStep || null,
          revenueAttributed: metadata.revenueAttributed || null,
          workflowWebsiteUrl: workflowWebsiteUrl || metadata.workflowWebsiteUrl || null,
          ...metadata
        }
      };

      // Add to queue
      eventQueue.current.push(event);

      // Batch flush after 5 seconds or 10 events
      if (eventQueue.current.length >= 10) {
        flushEvents();
      } else if (!flushTimeout.current) {
        flushTimeout.current = setTimeout(flushEvents, 5000);
      }

      // Send high-priority events immediately
      if (['purchase', 'signup', 'login', 'payment_success'].includes(eventType)) {
        await autoBlogAPI.trackEvent(event);
      }
    } catch (error) {
      console.error('Failed to track event:', error);
      // Don't throw - analytics failures shouldn't break the app
    }
  }, [user, workflowWebsiteUrl]);

  /**
   * Batch send events. Sends for all users; backend should accept unauthenticated
   * requests (issue #202).
   */
  const flushEvents = useCallback(async () => {
    if (eventQueue.current.length === 0) return;

    const eventsToSend = [...eventQueue.current];
    eventQueue.current = [];

    clearTimeout(flushTimeout.current);
    flushTimeout.current = null;

    try {
      await autoBlogAPI.trackEventBatch(eventsToSend);
      console.log(`✅ Analytics: Flushed ${eventsToSend.length} events`);
    } catch (error) {
      console.error('Failed to send analytics:', error);
      // Re-queue failed events (keep last 50 to avoid memory issues)
      eventQueue.current = [...eventsToSend.slice(-50), ...eventQueue.current];
    }
  }, []);

  /**
   * Track page view
   */
  const trackPageView = useCallback((pageName, metadata = {}) => {
    trackEvent('page_view', { pageName }, metadata);
  }, [trackEvent]);

  /**
   * Track click
   */
  const trackClick = useCallback((element, label, metadata = {}) => {
    trackEvent('click', { element, label }, metadata);
  }, [trackEvent]);

  /**
   * Track form submission
   */
  const trackFormSubmit = useCallback((formName, success, metadata = {}) => {
    trackEvent('form_submit', { formName, success }, metadata);
  }, [trackEvent]);

  /**
   * Track conversion funnel step
   */
  const trackFunnelStep = useCallback((step, metadata = {}) => {
    trackEvent('funnel_progress', { step }, {
      ...metadata,
      conversionFunnelStep: step
    });
  }, [trackEvent]);

  /**
   * Track revenue-attributed event
   */
  const trackRevenue = useCallback((amount, metadata = {}) => {
    trackEvent('revenue', { amount }, {
      ...metadata,
      revenueAttributed: amount
    });
  }, [trackEvent]);

  /**
   * Flush events on unmount
   */
  useEffect(() => {
    return () => {
      flushEvents();
    };
  }, [flushEvents]);

  /**
   * Flush events on page visibility change (user leaving/closing)
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushEvents();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flushEvents]);

  /**
   * Flush events before page unload
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushEvents();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [flushEvents]);

  const value = {
    trackEvent,
    trackPageView,
    trackClick,
    trackFormSubmit,
    trackFunnelStep,
    trackRevenue,
    sessionId: sessionId.current,
    flushEvents
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

/**
 * Generate unique session ID
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
