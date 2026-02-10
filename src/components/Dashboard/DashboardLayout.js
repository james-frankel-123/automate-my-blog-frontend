import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Menu, Button, Avatar, Dropdown, message, Spin } from 'antd';
import api from '../../services/api';
import {
  DashboardOutlined,
  FileTextOutlined,
  SettingOutlined,
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
import PostsTab from './PostsTab';
import AudienceSegmentsTab from './AudienceSegmentsTab';
import SettingsTab from './SettingsTab';
import SandboxTab from './SandboxTab';
import LoggedOutProgressHeader from './LoggedOutProgressHeader';
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
  // Force workflow mode for logged-out users
  forceWorkflowMode = false,
  // When handed off from funnel (topic selected): land on Posts so generation can start
  initialActiveTab = null
}) => {
  const [activeTab, setActiveTab] = useState(initialActiveTab || 'dashboard');
  const {
    user: contextUser,
    logout,
    isSuperAdmin,
    hasPermission,
    isImpersonating,
    impersonationData,
    endImpersonation,
    isNewRegistration,
    clearNewRegistration,
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
  const [_hasSeenSaveProject, setHasSeenSaveProject] = useState(null);
  
  // Step management for logged-out users
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [visibleSections, setVisibleSections] = useState(['home']); // Start with only home visible
  
  // Dashboard visibility for workflow mode - start hidden in workflow mode  
  const [showDashboardLocal, setShowDashboardLocal] = useState(false);
  const [projectMode, setProjectMode] = useState(!user || forceWorkflowMode); // Start in project mode for logged-out users or when forced
  const [showSaveProjectButton, setShowSaveProjectButton] = useState(false);
  const [projectJustSaved, setProjectJustSaved] = useState(false);
  const effectiveShowDashboard = (showDashboard || showDashboardLocal) && !(isNewRegistration && projectMode);

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

  // Check if user has seen Save Project button before and handle login/registration
  useEffect(() => {
    if (user) {
      const savedState = localStorage.getItem(`hasSeenSaveProject_${user.id}`);
      const hasSeenBefore = savedState === 'true';
      setHasSeenSaveProject(hasSeenBefore);
      
      if (isNewRegistration && !hasSeenBefore) {
        // New user just completed registration - keep in workflow mode
        setProjectMode(true);
        setShowSaveProjectButton(true);
        // Don't show sidebar until "Save Project" is clicked
        setShowDashboardLocal(false);
      } else {
        // Returning user logging in - go directly to focus mode
        setProjectMode(false);
        setShowDashboardLocal(true); // Show sidebar immediately for returning users
      }
    }
  }, [user, isNewRegistration]);
  
  // Add intersection observer for scroll-based menu highlighting
  useEffect(() => {
    // Only set up observer if we're in the scrollable sections view (not settings/admin tabs)
    if (!user || activeTab === 'settings' || activeTab.startsWith('admin-') || activeTab === 'sandbox') {
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
  }, [user, onActiveTabChange, projectMode, showDashboardLocal]); // Note: activeTab excluded to prevent feedback loop (observer sets activeTab → useEffect restarts → observer resets)
  
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
    
    // For settings, switch to settings tab (not part of scrollable sections)
    if (newTab === 'settings' || newTab.startsWith('admin-')) {
      setActiveTab(newTab);
      if (onActiveTabChange) {
        onActiveTabChange(newTab);
      }
      return;
    }

    // For main sections, scroll to section instead of switching tabs
    let sectionId;
    switch (newTab) {
      case 'dashboard':
        sectionId = 'home';
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
  
  // Step management functions for logged-out workflow progression
  const completeStep = (stepIndex) => {
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps(prev => [...prev, stepIndex]);
    }
  };

  // Scroll to section with retries so we don't scroll before React has mounted the section (e.g. after adding to visibleSections)
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

  const advanceToNextStep = () => {
    const nextStep = currentStep + 1;
    if (nextStep <= 4) { // Max 5 steps (0-4)
      setCurrentStep(nextStep);
      
      // Make next section visible
      const sectionMap = ['home', 'audience-segments', 'posts', 'posts', 'posts']; // Step 2-4 all use posts section for different phases
      const nextSection = sectionMap[nextStep];
      
      if (!visibleSections.includes(nextSection)) {
        setVisibleSections(prev => [...prev, nextSection]);
      }
      
      // Complete current step
      completeStep(currentStep);
      
      // Scroll to next section when it's in the DOM (retry so we don't run before React has mounted it)
      scrollToSectionWhenReady(nextSection);
    }
  };

  // When handed off from funnel with initialActiveTab, scroll to that section once mounted
  useEffect(() => {
    if (initialActiveTab && initialActiveTab !== 'dashboard') {
      const sectionId = initialActiveTab === 'posts' ? 'posts' : initialActiveTab === 'audience-segments' ? 'audience-segments' : 'home';
      scrollToSectionWhenReady(sectionId);
    }
  }, [initialActiveTab]);

  const handleStepClick = (stepIndex) => {
    // Only allow navigation to completed steps or current step
    if (completedSteps.includes(stepIndex) || stepIndex === currentStep) {
      setCurrentStep(stepIndex);
      
      const sectionMap = ['home', 'audience-segments', 'posts', 'posts', 'posts'];
      const targetSection = sectionMap[stepIndex];
      
      const section = document.getElementById(targetSection);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };


  // Base menu items available to all users
  const baseMenuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Home',
    },
    {
      key: 'audience-segments',
      icon: <TeamOutlined />,
      label: 'Audience',
    },
    {
      key: 'posts',
      icon: <FileTextOutlined />,
      label: 'Posts',
    },
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
    if (activeTab === 'settings' || activeTab.startsWith('admin-') || activeTab === 'sandbox' || activeTab === 'comprehensive-analysis' || activeTab === 'user-analytics') {
      switch (activeTab) {
        case 'settings':
          return <SettingsTab />;
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
          return <DashboardTab />;
      }
    }

    // Main scrollable layout with all sections
    return (
      <div style={{ padding: 0 }}>

        {/* Home Section (formerly Dashboard) - Always visible */}
        {(user || visibleSections.includes('home')) && (
          <section id="home" style={{ 
            minHeight: '100vh',
            background: 'var(--color-background-body)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            marginBottom: 'var(--space-6)'
          }}>
            <DashboardTab 
              forceWorkflowMode={forceWorkflowMode || (user && projectMode)} 
              onNextStep={!user && forceWorkflowMode ? advanceToNextStep : undefined}
              onEnterProjectMode={user && !projectMode ? () => setProjectMode(true) : undefined}
              showSaveProjectButton={showSaveProjectButton}
              isNewRegistration={isNewRegistration}
              onSaveProject={null} // Save Project button is now in the header
              projectJustSaved={projectJustSaved}
              onCreateNewPost={() => {
                // Enter project mode and start workflow
                if (user && !projectMode) {
                  setProjectMode(true);
                }
                
                // Check if website analysis is completed
                const isAnalysisCompleted = stepResults.home?.analysisCompleted;
                
                setTimeout(() => {
                  if (!isAnalysisCompleted) {
                    // Navigate to Home section for analysis first
                    const homeSection = document.getElementById('home');
                    if (homeSection) {
                      homeSection.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                      });
                    }
                    setHint('Complete website analysis first, then select your audience.', 'hint', 6000);
                    message.success('Complete website analysis first, then select your audience');
                  } else {
                    // Navigate to audience section (normal flow)
                    const audienceSection = document.getElementById('audience-segments');
                    if (audienceSection) {
                      audienceSection.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                      });
                    }
                    setHint(systemVoice.hint.chooseAudienceNext, 'success', 5000);
                    message.success('Starting guided creation project');
                  }
                }, 100);
              }}
            />
          </section>
        )}

        {/* Audience Section - Unlocked after step 1 (light motion) */}
        {((!user && visibleSections.includes('audience-segments')) || (user && (!projectMode || stepResults.home.analysisCompleted))) && (
          <section id="audience-segments" className="workflow-section-enter" style={{ 
            minHeight: '100vh',
            background: 'var(--color-background-body)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            marginBottom: 'var(--space-6)'
          }}>
            <AudienceSegmentsTab 
              forceWorkflowMode={forceWorkflowMode || (user && projectMode)}
              onNextStep={!user && forceWorkflowMode ? advanceToNextStep : undefined}
              onEnterProjectMode={user && !projectMode ? () => setProjectMode(true) : undefined}
            />
          </section>
        )}

        {/* Posts Section - Unlocked after step 2 (light motion) */}
        {((!user && visibleSections.includes('posts')) || (user && (!projectMode || stepResults.audience.customerStrategy))) && (
          <section id="posts" className="workflow-section-enter" style={{ 
            minHeight: '100vh',
            background: 'var(--color-background-body)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            marginBottom: 'var(--space-6)'
          }}>
            <PostsTab
              forceWorkflowMode={forceWorkflowMode || (user && projectMode)}
              currentStep={!user && forceWorkflowMode ? currentStep : undefined}
              onNextStep={!user && forceWorkflowMode ? advanceToNextStep : undefined}
              onEnterProjectMode={user && !projectMode ? () => setProjectMode(true) : undefined}
              onQuotaUpdate={refreshQuota}
              onOpenPricingModal={() => setShowPricingModal(true)}
            />
          </section>
        )}
      </div>
    );
  };

  /** When true, LoggedOutProgressHeader is rendered; content area and FABs must use padding/position to sit below it. */
  const showLoggedOutProgressHeader = (!user && forceWorkflowMode) || (user && isNewRegistration && projectMode);

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
      
      {/* Progress Header for Logged-Out Users and New Registrations */}
      {showLoggedOutProgressHeader ? (
        <LoggedOutProgressHeader
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
          showAuthModal={showAuthModal}
          setShowAuthModal={setShowAuthModal}
          authContext={authContext}
          setAuthContext={setAuthContext}
          user={user}
          isNewRegistration={isNewRegistration}
          showSaveProjectButton={showSaveProjectButton}
          onSaveProject={() => {
            // Scroll to top with smooth animation
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Set project just saved state
            setProjectJustSaved(true);
            
            // Apply state changes
            setShowDashboardLocal(true);
            setShowSaveProjectButton(false);
            setHasSeenSaveProject(true);
            setProjectMode(false); // Exit project mode when saving
            
            // Clear registration flag since user has now saved their project
            clearNewRegistration();
            
            // Save to localStorage so user never sees this button again
            if (user) {
              localStorage.setItem(`hasSeenSaveProject_${user.id}`, 'true');
            }
            
            // Clear "just saved" state after 10 seconds
            setTimeout(() => setProjectJustSaved(false), 10000);
            
            setHint(systemVoice.hint.savedProgress, 'success', 5000);
            message.success('Project saved! Dashboard is now available via sidebar.');
          }}
        />
      ) : null}

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
          className={showLoggedOutProgressHeader ? 'dashboard-content-below-fixed-header' : undefined}
          style={{
            padding: isMobile ? 'var(--space-4) var(--space-4) calc(80px + env(safe-area-inset-bottom, 0px)) var(--space-4)' : 'var(--space-6)',
            background: 'var(--color-gray-50)',
            overflow: 'auto',
            ...(showLoggedOutProgressHeader ? {} : { paddingTop: '24px' }),
            // So ThinkingPanel sticks above mobile bottom nav when present
            '--thinking-panel-sticky-bottom': isMobile ? '56px' : '0',
          }}
        >
          {/* Floating Action Buttons - below LoggedOutProgressHeader when it is visible (mobile + desktop) */}
          {user && (
          <div
            className={showLoggedOutProgressHeader ? 'dashboard-fabs-below-fixed-header' : undefined}
            style={{
            position: 'fixed',
            top: showLoggedOutProgressHeader
              ? (isMobile ? 'calc(56px + env(safe-area-inset-top, 0px) + 12px)' : 'calc(88px + env(safe-area-inset-top, 0px) + 12px)')
              : (isMobile ? '16px' : '29px'),
            right: isMobile ? '12px' : '29px',
            left: isMobile ? '12px' : undefined,
            zIndex: 999,
            display: 'flex',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            alignItems: 'center',
            justifyContent: isMobile ? 'flex-end' : undefined,
            gap: isMobile ? 8 : 12
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

              {/* Create New Post Button - Show when NOT in project mode */}
              {!projectMode && (
                <Button 
                  type="primary"
                  size="large"
                  icon={<PlusOutlined style={{ fontSize: '16px' }} />}
                  onClick={() => {
                    // Enter project mode and start workflow
                    setProjectMode(true);
                    
                    // Check if website analysis is completed
                    const isAnalysisCompleted = stepResults.home?.analysisCompleted;
                    
                    setTimeout(() => {
                      if (!isAnalysisCompleted) {
                        // Navigate to Home section for analysis first
                        const homeSection = document.getElementById('home');
                        if (homeSection) {
                          homeSection.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                          });
                        }
                        setHint('Complete website analysis first, then select your audience.', 'hint', 6000);
                        message.success('Complete website analysis first, then select your audience');
                      } else {
                        // Navigate to audience section (normal flow)
                        const audienceSection = document.getElementById('audience-segments');
                        if (audienceSection) {
                          audienceSection.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                          });
                        }
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
                    border: '2px solid var(--color-primary)',
                    marginRight: projectMode ? '0' : '0' // No margin when alone
                  }}
                >
                  Create New Post
                </Button>
              )}
              
              {/* Exit Project Button - Show when in project mode */}
              {projectMode && (
                showSaveProjectButton ? (
                  <Button
                    type="primary"
                    onClick={() => {
                      setShowDashboardLocal(true);
                      setShowSaveProjectButton(false);
                      setHasSeenSaveProject(true);
                      setProjectMode(false); // Exit project mode when saving

                      // Clear registration flag since user has now saved their project
                      clearNewRegistration();

                      // Save to localStorage so user never sees this button again
                      if (user) {
                        localStorage.setItem(`hasSeenSaveProject_${user.id}`, 'true');
                      }
                      message.success('Project saved! Dashboard is now available via sidebar.');
                    }}
                    style={{
                      backgroundColor: 'var(--color-success)',
                      borderColor: 'var(--color-success)',
                      fontWeight: 600
                    }}
                  >
                    💾 Save Project
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    danger
                    size="large"
                    onClick={() => {
                      setProjectMode(false);
                      message.success('Exited project mode. Full dashboard now available.');
                    }}
                    style={{
                      backgroundColor: 'var(--color-error)',
                      borderColor: 'var(--color-error)',
                      color: 'var(--color-text-on-primary)',
                      fontWeight: 600,
                      boxShadow: 'none',
                      border: '2px solid var(--color-error)'
                    }}
                  >
                    🚪 Exit Project Mode
                  </Button>
                )
              )}
              </>
            )
          </div>
          )}

          <div style={{
            background: activeTab === 'settings' || activeTab.startsWith('admin-') || activeTab === 'sandbox' ? 'var(--color-background-body)' : 'transparent',
            borderRadius: activeTab === 'settings' || activeTab.startsWith('admin-') || activeTab === 'sandbox' ? 'var(--radius-lg)' : '0',
            minHeight: '100%',
            padding: activeTab === 'settings' || activeTab.startsWith('admin-') || activeTab === 'sandbox' ? 'var(--space-6)' : '0'
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
            scrollToSectionWhenReady('posts');
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