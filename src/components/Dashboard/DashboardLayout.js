import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Menu, Button, Avatar, Dropdown, message, Spin } from 'antd';
import api from '../../services/api';
import {
  DashboardOutlined,
  FileTextOutlined,
  SettingOutlined,
  SoundOutlined,
  GoogleOutlined,
  UserOutlined,
  LogoutOutlined,
  EditOutlined,
  TeamOutlined,
  LineChartOutlined,
  SafetyOutlined,
  DatabaseOutlined,
  UserSwitchOutlined,
  CloseOutlined,
  PlusOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkflowMode } from '../../contexts/WorkflowModeContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import DashboardTab from './DashboardTab';
import SettingsTab from './SettingsTab';
import VoiceAdaptationTab from '../VoiceAdaptation/VoiceAdaptationTab';
import GoogleIntegrationsTab from '../Integrations/GoogleIntegrationsTab';
import SandboxTab from './SandboxTab';
import ReturningUserDashboard from './ReturningUserDashboard';
import AuthModal from '../Auth/AuthModal';
// ADMIN COMPONENTS - Super user only
import AdminUsersTab from './AdminUsersTab';
import AdminAnalyticsTab from './AdminAnalyticsTab';
import AdminContentTab from './AdminContentTab';
import AdminSystemTab from './AdminSystemTab';
import AdminLeadsTab from './AdminLeadsTab';
import ComprehensiveAnalysisTab from './ComprehensiveAnalysisTab';
import UserAnalyticsTab from './UserAnalyticsTab';
import PricingModal from '../Modals/PricingModal';
import SystemHint from './SystemHint';
import { useSystemHint } from '../../contexts/SystemHintContext';
import { systemVoice } from '../../copy/systemVoice';
import ThemeToggle from '../ThemeToggle/ThemeToggle';

// Layout components not used directly

const DashboardLayout = ({ 
  user: propUser, 
  loginContext: _loginContext, 
  workflowContent: _workflowContent, 
  showDashboard, 
  isMobile, 
  onActiveTabChange,
  // Progressive headers props
  completedWorkflowSteps: _completedWorkflowSteps = [],
  stepResults: _propStepResults = {},
  onEditWorkflowStep: _onEditWorkflowStep,
  // When handed off from funnel (topic selected): land on Posts so generation can start
  initialActiveTab = null
}) => {
  const [activeTab, setActiveTab] = useState(() => {
    if (initialActiveTab) return initialActiveTab;
    if (typeof window !== 'undefined' && window.location.pathname === '/settings/voice-adaptation') return 'voice-adaptation';
    return 'dashboard';
  });
  const {
    user: contextUser,
    logout,
    isSuperAdmin,
    hasPermission,
    isImpersonating,
    impersonationData,
    endImpersonation,
    isNewRegistration,
    loading
  } = useAuth();
  
  // Use prop user if provided, otherwise fall back to context user
  const user = propUser || contextUser;
  
  // Get modal state from WorkflowModeContext
  const { 
    showAuthModal, 
    setShowAuthModal, 
    authContext, 
    setAuthContext,
    stepResults 
  } = useWorkflowMode();
  
  // Analytics tracking
  const { trackPageView, trackEvent } = useAnalytics();
  const { setHint } = useSystemHint();
  
  // Restore collapsed state (needed for sidebar)
  const [collapsed, _setCollapsed] = useState(false);
  
  // ReturningUserDashboard state (hasStrategies/strategiesLoading used for future logic)
  const [_hasStrategies, setHasStrategies] = useState(false);
  const [_strategiesLoading, setStrategiesLoading] = useState(true);
  
  // Show sidebar when user has dashboard access or is new registration
  const effectiveShowDashboard = showDashboard || isNewRegistration;

  // Quota tracking state
  const [userCredits, setUserCredits] = useState(null);
  const [strategySubscriptions, setStrategySubscriptions] = useState([]);
  const [loadingQuota, setLoadingQuota] = useState(false);

  // Calculate total remaining posts from both credits and strategy subscriptions
  const remainingPosts = useMemo(() => {
    if (!userCredits) return null;

    // Check if user has unlimited credits
    if (userCredits.isUnlimited) return 'unlimited';

    // Calculate total posts from strategy subscriptions
    const strategyPosts = strategySubscriptions.reduce((total, sub) => {
      return total + (sub.postsRemaining || 0);
    }, 0);

    // Combine pay-per-post credits with strategy subscription posts
    const totalPosts = Math.max(0, userCredits.availableCredits) + strategyPosts;

    return totalPosts;
  }, [userCredits, strategySubscriptions]);

  // Pricing modal state
  const [showPricingModal, setShowPricingModal] = useState(false);

  // Check if user has strategies for ReturningUserDashboard
  useEffect(() => {
    async function checkStrategies() {
      if (!user) {
        setHasStrategies(false);
        setStrategiesLoading(false);
        return;
      }

      try {
        console.log('🔍 DashboardLayout: Checking strategies...', { user: !!user });
        const response = await api.getUserAudiences({ limit: 10 });
        const strategies = response?.audiences || [];
        console.log('✅ DashboardLayout: Strategies check result:', {
          strategiesCount: strategies.length,
          hasStrategies: strategies.length > 0
        });
        setHasStrategies(strategies.length > 0);
      } catch (error) {
        console.error('❌ DashboardLayout: Failed to check strategies:', error);
        setHasStrategies(false);
      } finally {
        setStrategiesLoading(false);
      }
    }

    checkStrategies();
  }, [user, isNewRegistration]);

  // Fetch user quota (memoized to prevent infinite loops)
  const refreshQuota = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingQuota(true);

      // Fetch both credits and strategy subscriptions in parallel
      const [credits, subscriptionsResponse] = await Promise.all([
        api.getUserCredits(),
        api.getSubscribedStrategies().catch(() => ({ subscriptions: [] }))
      ]);

      setUserCredits(credits);
      setStrategySubscriptions(subscriptionsResponse.subscriptions || []);
    } catch (error) {
      console.error('❌ Failed to fetch quota:', error);
      // Set default credits on error so badge still shows
      setUserCredits({
        totalCredits: 0,
        usedCredits: 0,
        availableCredits: 0,
        basePlan: 'Unknown'
      });
      setStrategySubscriptions([]);
    } finally {
      setLoadingQuota(false);
    }
  }, [user]);

  // Load quota when user changes
  useEffect(() => {
    if (user) {
      refreshQuota();
    } else {
      setUserCredits(null);
      setStrategySubscriptions([]);
    }
  }, [user, refreshQuota]);

  // Refresh credits when window regains focus (catches users returning from Stripe)
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        refreshQuota();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, refreshQuota]);

  // Track if payment redirect has been processed to prevent infinite loops
  const paymentProcessedRef = useRef(false);

  // Handle Stripe payment redirect feedback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');

    if (!paymentStatus) {
      return; // No payment redirect, nothing to do
    }

    // Only process once per page load
    if (paymentProcessedRef.current) {
      return;
    }

    // If auth is still loading, wait for it
    if (loading) {
      return; // Exit and wait for next render when user is loaded
    }

    // Mark as processed now that we're ready to process
    paymentProcessedRef.current = true;

    // Clean up URL immediately to prevent re-processing
    window.history.replaceState({}, '', window.location.pathname);

    if (paymentStatus === 'success') {
      // Track payment_completed event
      trackEvent('payment_completed', {
        userId: user?.id
      }).catch(err => console.error('Failed to track payment_completed:', err));
      
      if (user) {
        message.success('Payment successful! Your credits are being added...');

        // Immediate refresh
        refreshQuota();

        // Retry after 2s, 5s, 10s in case webhook hasn't processed yet
        const retryTimeout1 = setTimeout(() => refreshQuota(), 2000);
        const retryTimeout2 = setTimeout(() => refreshQuota(), 5000);
        const retryTimeout3 = setTimeout(() => refreshQuota(), 10000);

        // Cleanup timeouts
        return () => {
          clearTimeout(retryTimeout1);
          clearTimeout(retryTimeout2);
          clearTimeout(retryTimeout3);
        };
      } else {
        console.error('❌ Payment success but user is not logged in! Tokens:', {
          accessToken: !!localStorage.getItem('accessToken'),
          refreshToken: !!localStorage.getItem('refreshToken')
        });
        message.warning('Payment successful, but you were logged out. Please log in to see your credits.');
      }
    } else if (paymentStatus === 'cancelled') {
      // Track payment_failed/cancelled event
      trackEvent('payment_failed', {
        reason: 'cancelled',
        userId: user?.id
      }).catch(err => console.error('Failed to track payment_failed:', err));
      
      message.info('Payment was cancelled. You can try again anytime.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- trackEvent from analytics context
  }, [user, loading, refreshQuota]); // Re-run when user or loading changes

  
  // Add intersection observer for scroll-based menu highlighting
  useEffect(() => {
    // Only set up observer if we're in the scrollable sections view (not settings/admin tabs)
    if (!user || activeTab === 'settings' || activeTab === 'voice-adaptation' || activeTab === 'google-integrations' || activeTab.startsWith('admin-') || activeTab === 'sandbox') {
      return;
    }

    // Use timeout to ensure DOM elements are rendered before setting up observer
    const setupObserver = () => {
      // Define all possible sections and their corresponding tab keys
      const allSections = [
        { id: 'home', tabKey: 'dashboard' },
        { id: 'audience-segments', tabKey: 'audience-segments' },
        { id: 'posts', tabKey: 'posts' }
      ];

      // Only observe sections that actually exist in the DOM
      const existingSections = allSections.filter(({ id }) => {
        const element = document.getElementById(id);
        return !!element;
      });

      // Don't set up observer if no sections exist
      if (existingSections.length === 0) {
        return null;
      }

      const observerOptions = {
        root: null, // Use viewport as root
        rootMargin: '0px', // Temporarily removed to debug ratio calculation issues
        threshold: [0.1, 0.3, 0.5, 0.7] // Multiple thresholds for better detection
      };

      // Track visibility of all sections to get complete picture
      const sectionVisibility = new Map();

      const observer = new IntersectionObserver((entries) => {
        // Update visibility map for sections that changed
        entries.forEach((entry) => {
          sectionVisibility.set(entry.target.id, entry.intersectionRatio);
        });

        // Enhanced debugging: show what changed and current state

        // Find section with highest visibility from complete picture
        let mostVisible = null;
        let highestRatio = 0;

        sectionVisibility.forEach((ratio, sectionId) => {
          if (ratio > highestRatio) {
            highestRatio = ratio;
            mostVisible = sectionId;
          }
        });

        // Update activeTab only if we have a significantly visible section
        if (mostVisible && highestRatio > 0.3) { // Higher threshold to reduce sensitivity
          const sectionInfo = existingSections.find(s => s.id === mostVisible);
          if (sectionInfo) {
            setActiveTab(sectionInfo.tabKey);
            if (onActiveTabChange) {
              onActiveTabChange(sectionInfo.tabKey);
            }
          }
        }
      }, observerOptions);

      // Observe all existing sections
      const elementsToObserve = [];
      existingSections.forEach(({ id }) => {
        const element = document.getElementById(id);
        if (element) {
          observer.observe(element);
          elementsToObserve.push(element);
        }
      });

      // Return cleanup function
      return () => {
        elementsToObserve.forEach((element) => {
          observer.unobserve(element);
        });
        observer.disconnect();
      };
    };

    // Store cleanup function in a ref-like object
    let observerCleanup = null;

    // Set up observer with a delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      observerCleanup = setupObserver();
    }, 100);

    // Cleanup function for useEffect
    return () => {
      clearTimeout(timeoutId);
      if (observerCleanup) {
        observerCleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- activeTab excluded to prevent feedback loop
  }, [user, onActiveTabChange]); // Note: activeTab excluded to prevent feedback loop (observer sets activeTab → useEffect restarts → observer resets)

  // After registration from onboarding: stay in place, slight autoscroll to show blog generation area
  const hasScrolledForNewRegistrationRef = useRef(false);
  useEffect(() => {
    if (!user || !isNewRegistration || hasScrolledForNewRegistrationRef.current) return;
    hasScrolledForNewRegistrationRef.current = true;
    const scrollToContent = () => {
      const postsSection = document.getElementById('dashboard-posts');
      const audienceSection = document.getElementById('audience-segments');
      if (postsSection) {
        setActiveTab('posts');
        postsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (audienceSection) {
        setActiveTab('audience-segments');
        audienceSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    const timeoutId = setTimeout(scrollToContent, 300);
    return () => clearTimeout(timeoutId);
  }, [user, isNewRegistration]);

  // Handle tab changes with smooth scroll navigation (not wrapped in useCallback to avoid deps churn)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally not useCallback so useEffect listener gets latest handler
  const handleTabChange = (newTab) => {
    // Track tab_switched event
    trackEvent('tab_switched', {
      fromTab: activeTab,
      toTab: newTab
    }).catch(err => console.error('Failed to track tab_switched:', err));
    
    // Track page view for analytics
    trackPageView(newTab, { 
      previousTab: activeTab,
      user: user?.id 
    });
    
    // For settings, voice adaptation, google integrations, and admin tabs: switch tab (not part of scrollable sections)
    if (newTab === 'settings' || newTab === 'voice-adaptation' || newTab === 'google-integrations' || newTab.startsWith('admin-')) {
      setActiveTab(newTab);
      if (newTab === 'voice-adaptation' && typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/settings/voice-adaptation');
      }
      if (newTab === 'google-integrations' && typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/settings/google-integrations');
      }
      if (onActiveTabChange) {
        onActiveTabChange(newTab);
      }
      return;
    }

    // For main sections, scroll to section instead of switching tabs
    // Posts lives inside Audience (#dashboard-posts); no standalone section#posts
    let sectionId;
    switch (newTab) {
      case 'dashboard':
        sectionId = 'home';
        break;
      case 'posts':
        sectionId = 'dashboard-posts';
        break;
      default:
        sectionId = newTab;
    }
    const section = document.getElementById(sectionId);
    
    if (section) {
      section.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      
      // Update active tab state for UI highlighting
      setActiveTab(newTab);
      if (onActiveTabChange) {
        onActiveTabChange(newTab);
      }
    } else {
      // Fallback to traditional tab switching
      setActiveTab(newTab);
      if (onActiveTabChange) {
        onActiveTabChange(newTab);
      }
    }
  };

  // Listen for custom navigation events from child components
  useEffect(() => {
    const handleCustomNavigation = (event) => {
      const targetTab = event.detail;
      handleTabChange(targetTab);
    };
    
    window.addEventListener('navigateToTab', handleCustomNavigation);
    
    return () => {
      window.removeEventListener('navigateToTab', handleCustomNavigation);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleTabChange intentionally not in deps; listener uses latest handler
  }, [handleTabChange]);

  // Handle ending impersonation
  const handleEndImpersonation = async () => {
    try {
      const result = await endImpersonation();
      if (result.success) {
        message.success('Returned to your admin account');
      } else {
        message.error('Failed to end impersonation');
      }
    } catch (error) {
      message.error('Failed to end impersonation');
    }
  };
  
  // Scroll to section with retries so we don't scroll before React has mounted the section
  const scrollToSectionWhenReady = (sectionId, delaysMs = [50, 150, 300, 500]) => {
    let scrolled = false;
    const tryScroll = () => {
      if (scrolled) return;
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        scrolled = true;
      }
    };
    delaysMs.forEach((delay) => setTimeout(tryScroll, delay));
  };

  // When handed off from funnel with initialActiveTab, scroll to that section once mounted
  useEffect(() => {
    if (initialActiveTab && initialActiveTab !== 'dashboard') {
      const sectionId = initialActiveTab === 'posts' ? 'dashboard-posts' : initialActiveTab === 'audience-segments' ? 'audience-segments' : 'home';
      scrollToSectionWhenReady(sectionId);
    }
  }, [initialActiveTab]);

  // Base menu items: Home, Audience, Posts (always for logged-in users)
  const baseMenuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Home' },
    { key: 'audience-segments', icon: <TeamOutlined />, label: 'Audience' },
    { key: 'posts', icon: <FileTextOutlined />, label: 'Posts' },
  ];

  // Admin menu items - conditionally added based on permissions
  const adminMenuItems = [];
  
  // Admin Users tab - for organization admins and super admins
  if (isSuperAdmin || hasPermission('manage_team') || hasPermission('manage_users')) {
    adminMenuItems.push({
      key: 'admin-users',
      icon: <TeamOutlined style={{ color: 'var(--color-error)' }} />,
      label: 'Admin Users',
    });
  }
  
  // Platform-wide admin tabs - super admin gets all tabs regardless of specific permissions
  if (isSuperAdmin) {
    adminMenuItems.push({
      key: 'admin-leads',
      icon: <UserOutlined style={{ color: 'var(--color-error)' }} />,
      label: 'Website Leads',
    });
    
    adminMenuItems.push({
      key: 'admin-analytics',
      icon: <LineChartOutlined style={{ color: 'var(--color-error)' }} />,
      label: 'Admin Analytics',
    });

    adminMenuItems.push({
      key: 'user-analytics',
      icon: <BarChartOutlined style={{ color: 'var(--color-error)' }} />,
      label: 'User Analytics',
    });

    adminMenuItems.push({
      key: 'admin-content',
      icon: <SafetyOutlined style={{ color: 'var(--color-error)' }} />,
      label: 'Admin Content',
    });
    
    adminMenuItems.push({
      key: 'admin-system',
      icon: <DatabaseOutlined style={{ color: 'var(--color-error)' }} />,
      label: 'Admin System',
    });
    
    adminMenuItems.push({
      key: 'sandbox',
      icon: <EditOutlined style={{ color: 'var(--color-primary)' }} />,
      label: 'Sandbox',
    });

    // Content Analysis tab - super admin only
    adminMenuItems.push({
      key: 'comprehensive-analysis',
      icon: <BarChartOutlined style={{ color: 'var(--color-error)' }} />,
      label: 'Content Analysis',
    });
  }

  const menuItems = [...baseMenuItems, ...adminMenuItems];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => handleTabChange('settings'),
    },
    {
      key: 'voice-adaptation',
      icon: <SoundOutlined />,
      label: 'Voice adaptation',
      onClick: () => handleTabChange('voice-adaptation'),
    },
    {
      key: 'google-integrations',
      icon: <GoogleOutlined />,
      label: 'Google integrations',
      onClick: () => handleTabChange('google-integrations'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: logout,
    },
  ];

  const renderContent = () => {
    // Special tabs that don't use scrollable layout
    if (activeTab === 'settings' || activeTab === 'voice-adaptation' || activeTab === 'google-integrations' || activeTab.startsWith('admin-') || activeTab === 'sandbox' || activeTab === 'comprehensive-analysis' || activeTab === 'user-analytics') {
      switch (activeTab) {
        case 'settings':
          return <SettingsTab />;
        case 'voice-adaptation':
          return <VoiceAdaptationTab />;
        case 'google-integrations':
          return <GoogleIntegrationsTab />;
        case 'comprehensive-analysis':
          return <ComprehensiveAnalysisTab />;
        case 'admin-users':
          return <AdminUsersTab />;
        case 'admin-leads':
          return <AdminLeadsTab />;
        case 'admin-analytics':
          return <AdminAnalyticsTab />;
        case 'user-analytics':
          return <UserAnalyticsTab />;
        case 'admin-content':
          return <AdminContentTab />;
        case 'admin-system':
          return <AdminSystemTab />;
        case 'sandbox':
          return <SandboxTab />;
        default:
          return <DashboardTab onNavigateToTab={(tab) => setActiveTab(tab)} />;
      }
    }

    // Tab-based layout (logged-in only): Home, Audience (carousel + posts), optional standalone Posts when in workflow
    return (
      <div style={{ padding: 0 }}>
        {user && (
          <>
            <section id="home" style={{
              minHeight: '100vh',
              background: 'var(--color-background-body)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-6)',
              marginBottom: 'var(--space-6)'
            }}>
              <DashboardTab
                isNewRegistration={isNewRegistration}
                onNavigateToTab={(tab) => setActiveTab(tab)}
                onCreateNewPost={() => {
                  const isAnalysisCompleted = stepResults.home?.analysisCompleted;
                  setTimeout(() => {
                    if (!isAnalysisCompleted) {
                      document.getElementById('home')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      setHint('Complete website analysis first, then select your audience.', 'hint', 6000);
                      message.success('Complete website analysis first, then select your audience');
                    } else {
                      document.getElementById('audience-segments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      setHint(systemVoice.hint.chooseAudienceNext, 'success', 5000);
                      message.success('Starting guided creation project');
                    }
                  }, 100);
                }}
              />
            </section>

            <section id="audience-segments" className="workflow-section-enter" style={{
              minHeight: '100vh',
              background: 'var(--color-background-body)',
              marginBottom: 'var(--space-6)'
            }}>
              <ReturningUserDashboard
                onQuotaUpdate={refreshQuota}
                onOpenPricingModal={() => setShowPricingModal(true)}
              />
            </section>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      {/* CSS Keyframes for smooth slide-in animations */}
      <style>{`
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>

      {/* One consistent slot for hints */}
      <SystemHint />

      {/* Main Layout Container - adjusts for fixed sidebar */}
      <div style={{ 
        minHeight: '100vh',
        marginLeft: !isMobile && user && effectiveShowDashboard ? '240px' : '0',
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
      
      {/* Desktop Sidebar - fixed positioned with slide animation */}
      {user && !isMobile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '240px',
          background: 'var(--color-background-body)',
          borderRight: '1px solid var(--color-border-base)',
          boxShadow: 'var(--shadow-elevated)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          transform: effectiveShowDashboard ? 'translateX(0)' : 'translateX(-240px)',
          transition: 'transform var(--transition-normal)'
        }}>
          {/* Logo/Title */}
          <div style={{
            padding: 'var(--space-4)',
            borderBottom: '1px solid var(--color-border-base)',
            textAlign: 'center'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: collapsed ? 'var(--font-size-sm)' : 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)'
            }}>
              {collapsed ? 'AMB' : 'Automate My Blog'}
            </h3>
          </div>
          
          {/* Navigation Menu */}
          <div style={{ flex: 1 }}>
            <Menu
              mode="inline"
              selectedKeys={[activeTab]}
              items={menuItems}
              onClick={({ key }) => handleTabChange(key)}
              style={{ border: 'none', height: '100%' }}
            />
          </div>
          
          {/* User Profile Section at Bottom */}
          <div style={{
            borderTop: '1px solid var(--color-border-base)',
            padding: 'var(--space-4)'
          }}>
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={['click']}
              placement="topLeft"
            >
              <Button type="text" style={{ 
                width: '100%',
                height: 'auto', 
                padding: '8px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Avatar 
                  icon={<UserOutlined />} 
                  style={{ backgroundColor: 'var(--color-primary)' }}
                />
                {!collapsed && (
                  <div style={{ 
                    flex: 1,
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      fontSize: '14px',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div style={{ 
                      fontSize: '12px',
                      color: 'var(--color-text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {user?.email}
                    </div>
                  </div>
                )}
              </Button>
            </Dropdown>
          </div>
        </div>
      )}

      {/* Mobile Navigation - only shows on mobile; touch-friendly 44px targets */}
      {user && isMobile && (
        <div
          data-mobile-bottom-nav
          className="mobile-bottom-nav"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'var(--color-background-body)',
            borderTop: '1px solid var(--color-border-base)',
            padding: '12px 8px max(12px, env(safe-area-inset-bottom))',
            zIndex: 20,
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            boxShadow: 'var(--shadow-sm)',
            minHeight: '56px'
          }}
        >
          {menuItems.slice(0, 6).map((item) => (
            <Button
              key={item.key}
              type={activeTab === item.key ? 'primary' : 'text'}
              icon={item.icon}
              onClick={() => handleTabChange(item.key)}
              style={{
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 'auto',
                padding: '10px 6px',
                fontSize: '11px',
                minWidth: '56px',
                minHeight: '44px',
                gap: 4
              }}
            >
              {item.label}
            </Button>
          ))}
          
          {/* User Menu for Mobile */}
          <Dropdown
            menu={{ items: userMenuItems }}
            trigger={['click']}
            placement="topRight"
          >
            <Button
              type="text"
              style={{
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 'auto',
                padding: '10px 6px',
                fontSize: '11px',
                minWidth: '56px',
                minHeight: '44px'
              }}
            >
              <Avatar 
                icon={<UserOutlined />} 
                style={{ 
                  backgroundColor: 'var(--color-primary)',
                  width: '24px',
                  height: '24px',
                  fontSize: '12px',
                  marginBottom: '4px'
                }}
              />
              <span style={{ fontSize: '11px' }}>Profile</span>
            </Button>
          </Dropdown>
        </div>
      )}


      {/* Content area - always show. When LoggedOutProgressHeader is present, use CSS class so hero sits below it. */}
        {(() => {
          return (
        <div
          className={undefined}
          style={{
            padding: isMobile ? 'var(--space-4) var(--space-4) calc(80px + env(safe-area-inset-bottom, 0px)) var(--space-4)' : 'var(--space-6)',
            background: 'var(--color-gray-50)',
            overflow: 'auto',
            paddingTop: 'var(--space-6)',
            // So ThinkingPanel sticks above mobile bottom nav when present
            '--thinking-panel-sticky-bottom': isMobile ? '56px' : '0',
          }}
        >
          {/* Floating Action Buttons - below LoggedOutProgressHeader when it is visible (mobile + desktop) */}
          {user && (
          <div
            className={undefined}
            style={{
            position: 'fixed',
            top: isMobile ? '16px' : '29px',
            right: isMobile ? '12px' : '29px',
            left: isMobile ? '12px' : undefined,
            zIndex: 999,
            display: 'flex',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            alignItems: 'center',
            justifyContent: isMobile ? 'flex-end' : undefined,
            gap: isMobile ? 'var(--space-2)' : 'var(--space-3)'
          }}>
            {/* Theme Toggle */}
            <div style={{
              background: 'var(--color-background-body)',
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              alignItems: 'center',
              border: '2px solid var(--color-border-base)'
            }}>
              <ThemeToggle />
            </div>

            {/* Quota Counter */}
            (
              <>
                <div
                  onClick={() => {
                    if (remainingPosts === 0) {
                      setShowPricingModal(true);
                    }
                  }}
                  style={{
                    background: 'var(--color-background-body)',
                    padding: 'var(--space-2) var(--space-4)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: `2px solid ${remainingPosts === 0 ? 'var(--color-error)' : remainingPosts === 'unlimited' ? 'var(--color-success)' : 'var(--color-primary)'}`,
                    cursor: remainingPosts === 0 ? 'pointer' : 'default',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (remainingPosts === 0) {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {loadingQuota || remainingPosts === null ? (
                    <Spin size="small" />
                  ) : remainingPosts === 'unlimited' ? (
                    <>
                      <span style={{
                        fontSize: 'var(--font-size-xl)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'var(--color-success)'
                      }}>
                        ∞
                      </span>
                      <span style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-tertiary)',
                        fontWeight: 'var(--font-weight-medium)'
                      }}>
                        Unlimited posts
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={{
                        fontSize: 'var(--font-size-xl)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: remainingPosts <= 2 ? 'var(--color-error)' : 'var(--color-primary)'
                      }}>
                        {remainingPosts}
                      </span>
                      <span style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-tertiary)',
                        fontWeight: 'var(--font-weight-medium)'
                      }}>
                        {userCredits?.basePlan === 'Free' && remainingPosts === 1
                          ? 'free post remaining'
                          : `post${remainingPosts === 1 ? '' : 's'} left`}
                      </span>
                    </>
                  )}
                </div>

                {/* Upgrade Button - Show when credits are 0 */}
                {remainingPosts === 0 && (
                <Button
                  type="primary"
                  size="large"
                  onClick={() => setShowPricingModal(true)}
                  style={{
                    backgroundColor: 'var(--color-success)',
                    borderColor: 'var(--color-success)',
                    fontWeight: 'var(--font-weight-semibold)',
                    boxShadow: 'none'
                  }}
                >
                  ⚡ Upgrade Now
                </Button>
              )}

              {/* Create New Post Button */}
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined style={{ fontSize: '16px' }} />}
                onClick={() => {
                  const isAnalysisCompleted = stepResults.home?.analysisCompleted;
                  setTimeout(() => {
                    if (!isAnalysisCompleted) {
                      document.getElementById('home')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      setHint('Complete website analysis first, then select your audience.', 'hint', 6000);
                      message.success('Complete website analysis first, then select your audience');
                    } else {
                      document.getElementById('audience-segments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      setHint(systemVoice.hint.chooseAudienceNext, 'success', 5000);
                      message.success('Starting guided creation project');
                    }
                  }, 100);
                }}
                style={{
                  backgroundColor: 'var(--color-primary)',
                  borderColor: 'var(--color-primary)',
                  fontWeight: 'var(--font-weight-semibold)',
                  boxShadow: 'none',
                  border: '2px solid var(--color-primary)'
                }}
              >
                Create New Post
              </Button>
              </>
            )
          </div>
          )}

          <div style={{
            background: activeTab === 'settings' || activeTab === 'voice-adaptation' || activeTab === 'google-integrations' || activeTab.startsWith('admin-') || activeTab === 'sandbox' ? 'var(--color-background-body)' : 'transparent',
            borderRadius: activeTab === 'settings' || activeTab === 'voice-adaptation' || activeTab === 'google-integrations' || activeTab.startsWith('admin-') || activeTab === 'sandbox' ? 'var(--radius-lg)' : '0',
            minHeight: '100%',
            padding: activeTab === 'settings' || activeTab === 'voice-adaptation' || activeTab === 'google-integrations' || activeTab.startsWith('admin-') || activeTab === 'sandbox' ? 'var(--space-6)' : '0'
          }}>
            {renderContent()}
          </div>

          {/* Footer with deploy commit hash for deployment verification */}
          <footer
            className="dashboard-footer"
            style={{
              marginTop: 'var(--space-6)',
              padding: 'var(--space-3) var(--space-6)',
              borderTop: '1px solid var(--color-border-base)',
              background: 'var(--color-gray-50)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-tertiary)',
              textAlign: 'center'
            }}
            title="Git commit of this deployment (for verification)"
          >
            Build: <code style={{ fontFamily: 'monospace', fontSize: '11px' }} data-testid="build-commit-hash">{process.env.REACT_APP_GIT_COMMIT_SHA || 'dev'}</code>
          </footer>
        </div>
          );
        })()}

      {/* Impersonation Banner */}
      {isImpersonating && impersonationData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: 'var(--color-error)',
          color: 'var(--color-text-on-primary)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserSwitchOutlined style={{ fontSize: '16px' }} />
            <span style={{ fontWeight: 500 }}>
              Acting as {user?.firstName} {user?.lastName} ({user?.email})
            </span>
            {impersonationData.originalAdmin && (
              <span style={{ opacity: 0.9 }}>
                • Admin: {impersonationData.originalAdmin.firstName} {impersonationData.originalAdmin.lastName}
              </span>
            )}
          </div>
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={handleEndImpersonation}
            style={{
              color: 'var(--color-text-on-primary)',
              border: '1px solid var(--color-hero-input-border)',
              borderRadius: '4px'
            }}
          >
            Exit Impersonation
          </Button>
        </div>
      )}
      </div> {/* End of Main Layout Container */}

      {/* Push content down when impersonation banner is visible */}
      {isImpersonating && (
        <style>
          {`
            body {
              padding-top: 44px !important;
            }
          `}
        </style>
      )}
      
      {/* Authentication Modal for Logged-Out Users */}
      {!user && showAuthModal && authContext && (
        <AuthModal
          open={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            setAuthContext(null);
          }}
          context={authContext}
          defaultTab={authContext === 'register' ? 'register' : 'login'}
          onSuccess={() => {
            setShowAuthModal(false);
            setAuthContext(null);
            setActiveTab('posts');
            scrollToSectionWhenReady('dashboard-posts');
          }}
        />
      )}

      {/* Pricing Modal */}
      <PricingModal
        open={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        user={user}
        onCreateAccount={() => {
          setShowPricingModal(false);
          setShowAuthModal(true);
          setAuthContext('register');
        }}
        onSelectPlan={() => {}}
      />
    </>
  );
};

export default DashboardLayout;