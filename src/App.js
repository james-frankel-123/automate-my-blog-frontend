import React, { useState, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WorkflowModeProvider } from './contexts/WorkflowModeContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { SystemHintProvider } from './contexts/SystemHintContext';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import RebaseReminder from './components/RebaseReminder';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import StreamingTestbed from './components/StreamingTestbed/StreamingTestbed';
import ComponentLibrary from './components/ComponentLibrary/ComponentLibrary';
import { OnboardingFunnelView } from './components/Onboarding';
import SEOHead from './components/SEOHead';
import { useWorkflowMode } from './contexts/WorkflowModeContext';
import { storeReferralInfo } from './utils/referralUtils';
import './styles/design-system.css';
import './styles/mobile.css';

// Detect dark mode
const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      }
    };

    // Listen for changes to localStorage (from ThemeToggle component)
    window.addEventListener('storage', handleStorageChange);

    // Also check for dark-mode class changes on documentElement
    const observer = new MutationObserver(() => {
      const hasDarkClass = document.documentElement.classList.contains('dark-mode');
      setIsDarkMode(hasDarkClass);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      observer.disconnect();
    };
  }, []);

  return isDarkMode;
};

// Ant Design theme configuration function - Royal Luxury (Deep Purple + Gold)
const getAntdTheme = (isDark) => ({
  algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
  token: {
    // Color tokens - Royal Luxury palette (Deep Purple + Gold)
    colorPrimary: '#6366F1',        // Rich indigo-purple - main brand color
    colorSuccess: '#059669',        // Deep emerald green
    colorWarning: '#F59E0B',        // Refined gold
    colorError: '#EF4444',          // Warm red
    colorInfo: '#6366F1',           // Match primary (purple)
    // Light mode: dark text; Dark mode: light text for readability
    colorTextBase: isDark ? '#F5F5F7' : '#0A2540',
    colorTextSecondary: isDark ? '#A0A0AB' : '#425466',
    colorTextTertiary: isDark ? '#6E6E78' : '#6B7C8E',
    colorBgBase: isDark ? '#0F1419' : '#ffffff',
    colorBgContainer: isDark ? '#1A1F29' : '#FAFBFC',
    colorBorder: isDark ? '#2D3139' : '#E3E8EF',
    colorBorderSecondary: isDark ? '#242933' : '#F6F9FC',

    // Hover colors - Important for dark mode compatibility
    colorPrimaryHover: '#4F46E5',   // Deeper purple on hover
    colorBgTextHover: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)', // Text button hover
    controlItemBgHover: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F6F9FC', // Default button hover

    // Typography - Sora + Inter
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
    fontSize: 16,                   // --font-size-base (16px body)
    fontSizeHeading1: 32,           // --font-size-3xl (page titles)
    fontSizeHeading2: 24,           // --font-size-2xl (section headers)
    fontSizeHeading3: 20,           // --font-size-xl (subsection headers)
    fontSizeHeading4: 18,           // --font-size-lg (subheadings)
    fontSizeHeading5: 16,           // --font-size-base (emphasized body)
    fontWeightStrong: 600,          // --font-weight-semibold

    // Border radius - Reduced for professional look
    borderRadius: 4,                // --radius-base (default)
    borderRadiusLG: 6,              // --radius-md (larger components)
    borderRadiusSM: 3,              // --radius-sm (tight corners)
    borderRadiusXS: 3,              // --radius-sm

    // Spacing - 8px grid system
    padding: 16,                    // --space-4
    paddingLG: 24,                  // --space-6
    paddingXL: 32,                  // --space-8
    paddingSM: 12,                  // --space-3
    paddingXS: 8,                   // --space-2
    margin: 16,                     // --space-4
    marginLG: 24,                   // --space-6
    marginXL: 32,                   // --space-8
    marginSM: 12,                   // --space-3
    marginXS: 8,                    // --space-2

    // Shadows - Minimal, Stripe-inspired (very subtle)
    boxShadow: '0 1px 2px rgba(10, 37, 64, 0.05)',           // --shadow-sm (default)
    boxShadowSecondary: '0 2px 4px rgba(10, 37, 64, 0.08)', // --shadow-md (elevated)
    boxShadowTertiary: '0 4px 8px rgba(10, 37, 64, 0.08)',  // --shadow-lg (modals)

    // Line height - Generous for readability
    lineHeight: 1.5,                // --line-height-normal
    lineHeightHeading: 1.25,        // --line-height-tight

    // Motion - Subtle, professional (faster)
    motionDurationFast: '0.1s',     // --transition-fast (100ms)
    motionDurationMid: '0.15s',     // --transition-base (150ms)
    motionDurationSlow: '0.2s',     // --transition-normal (200ms)
    motionEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    motionEaseOut: 'cubic-bezier(0, 0, 0.2, 1)',
    motionEaseIn: 'cubic-bezier(0.4, 0, 1, 1)',

    // Control heights
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,
  },
  components: {
    Button: {
      primaryShadow: 'none',        // No shadow on buttons (Stripe style)
      fontWeight: 500,              // Medium weight for buttons
      borderRadius: 4,              // Consistent with token
      controlHeight: 40,
      paddingContentHorizontal: 16,
      // Hover colors for dark mode compatibility
      defaultHoverBg: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F6F9FC',
      defaultHoverBorderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#6366F1',
      defaultHoverColor: isDark ? '#F5F5F7' : '#6366F1',
      textHoverBg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(99, 102, 241, 0.06)',
    },
    Card: {
      boxShadow: '0 1px 2px rgba(10, 37, 64, 0.05)', // Minimal shadow
      borderRadius: 6,              // --radius-md
      paddingLG: 24,
      headerBg: 'transparent',
    },
    Table: {
      headerBg: isDark ? '#1A1F29' : '#FAFBFC',
      headerColor: isDark ? '#A0A0AB' : '#425466',
      borderColor: isDark ? '#2D3139' : '#E3E8EF',
      cellPaddingBlock: 16,
      cellPaddingInline: 16,
      rowHoverBg: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F6F9FC',
    },
    Input: {
      controlHeight: 40,
      borderRadius: 4,
      paddingBlock: 8,
      paddingInline: 12,
    },
    Select: {
      controlHeight: 40,
      borderRadius: 4,
    },
    Modal: {
      borderRadius: 8,              // --radius-lg (larger for modals)
      boxShadow: isDark ? '0 4px 8px rgba(0, 0, 0, 0.4)' : '0 4px 8px rgba(10, 37, 64, 0.08)',
      headerBg: 'transparent',
      contentBg: isDark ? '#1A1F29' : '#ffffff',
    },
    Drawer: {
      borderRadius: 0,              // No radius for drawers
      boxShadow: '0 4px 8px rgba(10, 37, 64, 0.08)',
    },
    Menu: {
      itemBg: 'transparent',
      itemHoverBg: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F6F9FC',
      itemActiveBg: isDark ? 'rgba(255, 255, 255, 0.12)' : '#F6F9FC',
      itemSelectedBg: isDark ? 'rgba(99, 102, 241, 0.15)' : '#F6F9FC',
      itemBorderRadius: 4,
    },
    Typography: {
      fontWeightStrong: 600,        // --font-weight-semibold
      titleMarginBottom: 0,
      titleMarginTop: 0,
    },
    Tabs: {
      itemActiveColor: isDark ? '#F5F5F7' : '#0A2540',
      itemHoverColor: isDark ? '#A0A0AB' : '#425466',
      itemSelectedColor: isDark ? '#F5F5F7' : '#0A2540',
      inkBarColor: '#6366F1',       // Purple brand color for indicator
    },
    Tag: {
      borderRadiusSM: 3,
      defaultBg: isDark ? '#242933' : '#F6F9FC',
      defaultColor: isDark ? '#A0A0AB' : '#425466',
    },
    Alert: {
      borderRadiusLG: 6,
      paddingContentVerticalLG: 12,
    },
    Badge: {
      dotSize: 6,
    },
    Tooltip: {
      borderRadius: 4,
      boxShadow: '0 2px 4px rgba(10, 37, 64, 0.08)',
    },
  },
});

const AppContent = () => {
  const { user, loading, loginContext } = useAuth();
  const { stepResults } = useWorkflowMode();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [, setActiveTab] = useState('newpost');

  const hasCompletedAnalysis =
    stepResults?.home?.analysisCompleted &&
    stepResults?.home?.websiteAnalysis?.businessName &&
    stepResults?.home?.websiteAnalysis?.targetAudience &&
    stepResults?.home?.websiteAnalysis?.contentFocus;
  const isReturningUser = user && hasCompletedAnalysis;

  // Store referral information on app load
  useEffect(() => {
    storeReferralInfo();
  }, []);

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show loading state while auth is being determined
  if (loading) {
    return (
      <div
        role="status"
        aria-label="Loading"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          gap: 'var(--space-4)',
          background: 'var(--color-background-body)',
        }}
      >
        <div
          className="app-loading-spinner"
          style={{
            width: 40,
            height: 40,
            border: '3px solid var(--color-border-base)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'app-loading-spin 0.8s linear infinite',
          }}
        />
        <span
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            fontWeight: 500,
          }}
        >
          Loading…
        </span>
      </div>
    );
  }

  // Visual testbed for streaming parser (dev/verification)
  if (typeof window !== 'undefined' && window.location.pathname === '/streaming-testbed') {
    return (
      <SystemHintProvider>
        <SEOHead />
        <StreamingTestbed />
      </SystemHintProvider>
    );
  }

  // Component library — test and iterate on shared components (same imports as app)
  if (typeof window !== 'undefined' && window.location.pathname === '/component-library') {
    return (
      <SystemHintProvider>
        <SEOHead />
        <ComponentLibrary />
      </SystemHintProvider>
    );
  }

  // Guided onboarding funnel (Issue #261): show for first-time or logged-out users.
  // Path /dashboard + logged in forces dashboard (for E2E and direct links).
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const forceDashboard = pathname === '/dashboard' && user;
  const showFunnel =
    pathname === '/onboarding' || (!forceDashboard && !isReturningUser);
  if (showFunnel) {
    return (
      <SystemHintProvider>
        <SEOHead />
        <OnboardingFunnelView />
      </SystemHintProvider>
    );
  }

  // Returning user with completed analysis: show 3-tab dashboard
  return (
    <SystemHintProvider>
      <SEOHead />
      <DashboardLayout
        workflowContent={true}
        showDashboard={user && loginContext === 'nav'}
        isMobile={isMobile}
        onActiveTabChange={setActiveTab}
        forceWorkflowMode={!user}
      />
    </SystemHintProvider>
  );
};

// Main App wrapper: WorkflowModeProvider wraps AnalyticsProvider so analytics can read workflowWebsiteUrl (issue #202)
const App = () => {
  const isDarkMode = useDarkMode();

  return (
    <ConfigProvider theme={getAntdTheme(isDarkMode)}>
      <HelmetProvider>
        <RebaseReminder />
        <ErrorBoundary>
          <AuthProvider>
            <WorkflowModeProvider>
              <AnalyticsProvider>
                <AppContent />
              </AnalyticsProvider>
            </WorkflowModeProvider>
          </AuthProvider>
        </ErrorBoundary>
      </HelmetProvider>
    </ConfigProvider>
  );
};

export default App;