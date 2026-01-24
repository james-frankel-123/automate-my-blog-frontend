import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, message, Typography, Badge, Spin } from 'antd';
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
import DashboardTab from './DashboardTab';
import PostsTab from './PostsTab';
import AudienceSegmentsTab from './AudienceSegmentsTab';
import SettingsTab from './SettingsTab';
import SandboxTab from './SandboxTab';
import ProgressiveHeaders from '../Workflow/ProgressiveHeaders';
import LoggedOutProgressHeader from './LoggedOutProgressHeader';
import ProgressiveStickyHeader from './ProgressiveStickyHeader';
import AuthModal from '../Auth/AuthModal';
// ADMIN COMPONENTS - Super user only
import AdminUsersTab from './AdminUsersTab';
import AdminAnalyticsTab from './AdminAnalyticsTab';
import AdminContentTab from './AdminContentTab';
import AdminSystemTab from './AdminSystemTab';
import AdminLeadsTab from './AdminLeadsTab';
import ComprehensiveAnalysisTab from './ComprehensiveAnalysisTab';
import PricingModal from '../Modals/PricingModal';

const { Header, Sider, Content } = Layout;

const DashboardLayout = ({ 
  user: propUser, 
  loginContext, 
  workflowContent, 
  showDashboard, 
  isMobile, 
  onActiveTabChange,
  // Progressive headers props
  completedWorkflowSteps = [],
  stepResults: propStepResults = {},
  onEditWorkflowStep,
  // Force workflow mode for logged-out users
  forceWorkflowMode = false
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { 
    user: contextUser, 
    logout, 
    isAdmin, 
    isSuperAdmin, 
    hasPermission,
    isImpersonating,
    impersonationData,
    endImpersonation,
    isNewRegistration,
    clearNewRegistration
  } = useAuth();
  
  // Use prop user if provided, otherwise fall back to context user
  const user = propUser || contextUser;
  
  // Get modal state from WorkflowModeContext
  const { 
    showAuthModal, 
    setShowAuthModal, 
    authContext, 
    setAuthContext,
    stickyWorkflowSteps,
    stepResults 
  } = useWorkflowMode();
  
  // Step management for logged-out users
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [visibleSections, setVisibleSections] = useState(['home']); // Start with only home visible
  
  // Dashboard visibility for workflow mode - start hidden in workflow mode  
  const [showDashboardLocal, setShowDashboardLocal] = useState(false);
  const [projectMode, setProjectMode] = useState(!user || forceWorkflowMode); // Start in project mode for logged-out users or when forced
  const [showSaveProjectButton, setShowSaveProjectButton] = useState(false);
  const [hasSeenSaveProject, setHasSeenSaveProject] = useState(null); // null = loading, true/false = loaded
  const [projectJustSaved, setProjectJustSaved] = useState(false);
  const effectiveShowDashboard = (showDashboard || showDashboardLocal) && !(isNewRegistration && projectMode);

  // Quota tracking state
  const [userCredits, setUserCredits] = useState(null);
  const [loadingQuota, setLoadingQuota] = useState(false);
  const remainingPosts = userCredits
    ? (userCredits.isUnlimited ? 'unlimited' : Math.max(0, userCredits.availableCredits))
    : null;

  // Pricing modal state
  const [showPricingModal, setShowPricingModal] = useState(false);

  // Fetch user quota
  const refreshQuota = async () => {
    if (!user) return;
    try {
      setLoadingQuota(true);
      const credits = await api.getUserCredits();
      console.log('✅ Credits loaded:', credits);
      setUserCredits(credits);
    } catch (error) {
      console.error('❌ Failed to fetch quota:', error);
      // Set default credits on error so badge still shows
      setUserCredits({
        totalCredits: 0,
        usedCredits: 0,
        availableCredits: 0,
        basePlan: 'Unknown'
      });
    } finally {
      setLoadingQuota(false);
    }
  };

  // Load quota when user changes
  useEffect(() => {
    if (user) {
      refreshQuota();
    } else {
      setUserCredits(null);
    }
  }, [user]);

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
  }, [user, onActiveTabChange, projectMode, showDashboardLocal]); // Note: activeTab excluded to prevent feedback loop (observer sets activeTab → useEffect restarts → observer resets)
  
  // Handle tab changes with smooth scroll navigation
  const handleTabChange = (newTab) => {
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
      
      // Scroll to next section
      setTimeout(() => {
        const section = document.getElementById(nextSection);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

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


  // Animation styles - elements slide in when dashboard is shown
  const animationDuration = '1s';
  const easing = 'cubic-bezier(0.4, 0, 0.2, 1)';

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
      icon: <TeamOutlined style={{ color: 'red' }} />,
      label: 'Admin Users',
    });
  }
  
  // Platform-wide admin tabs - super admin gets all tabs regardless of specific permissions
  if (isSuperAdmin) {
    adminMenuItems.push({
      key: 'admin-leads',
      icon: <UserOutlined style={{ color: 'red' }} />,
      label: 'Website Leads',
    });
    
    adminMenuItems.push({
      key: 'admin-analytics',
      icon: <LineChartOutlined style={{ color: 'red' }} />,
      label: 'Admin Analytics',
    });
    
    adminMenuItems.push({
      key: 'admin-content',
      icon: <SafetyOutlined style={{ color: 'red' }} />,
      label: 'Admin Content',
    });
    
    adminMenuItems.push({
      key: 'admin-system',
      icon: <DatabaseOutlined style={{ color: 'red' }} />,
      label: 'Admin System',
    });
    
    adminMenuItems.push({
      key: 'sandbox',
      icon: <EditOutlined style={{ color: '#722ed1' }} />,
      label: 'Sandbox',
    });

    // Content Analysis tab - super admin only
    adminMenuItems.push({
      key: 'comprehensive-analysis',
      icon: <BarChartOutlined style={{ color: 'red' }} />,
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
    console.log('🔍 DashboardLayout renderContent - activeTab:', activeTab);
    // Special tabs that don't use scrollable layout
    if (activeTab === 'settings' || activeTab.startsWith('admin-') || activeTab === 'sandbox' || activeTab === 'comprehensive-analysis') {
      switch (activeTab) {
        case 'settings':
          return <SettingsTab />;
        case 'comprehensive-analysis':
          console.log('🎯 Rendering ComprehensiveAnalysisTab component');
          return <ComprehensiveAnalysisTab />;
        case 'admin-users':
          return <AdminUsersTab />;
        case 'admin-leads':
          return <AdminLeadsTab />;
        case 'admin-analytics':
          return <AdminAnalyticsTab />;
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
            background: '#fff',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px'
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
                    message.success('Starting guided creation project');
                  }
                }, 100);
              }}
            />
          </section>
        )}

        {/* Audience Section - Unlocked after step 1 */}
        {((!user && visibleSections.includes('audience-segments')) || (user && (!projectMode || stepResults.home.analysisCompleted))) && (
          <section id="audience-segments" style={{ 
            minHeight: '100vh', 
            background: '#fff',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <AudienceSegmentsTab 
              forceWorkflowMode={forceWorkflowMode || (user && projectMode)}
              onNextStep={!user && forceWorkflowMode ? advanceToNextStep : undefined}
              onEnterProjectMode={user && !projectMode ? () => setProjectMode(true) : undefined}
            />
          </section>
        )}

        {/* Posts Section - Unlocked after step 2 */}
        {((!user && visibleSections.includes('posts')) || (user && (!projectMode || stepResults.audience.customerStrategy))) && (
          <section id="posts" style={{ 
            minHeight: '100vh', 
            background: '#fff',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px'
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
      {(!user && forceWorkflowMode) || (user && isNewRegistration && projectMode) ? (
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
            
            message.success('Project saved! Dashboard is now available via sidebar.');
          }}
        />
      ) : null}
      
      
      
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
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          transform: effectiveShowDashboard ? 'translateX(0)' : 'translateX(-240px)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* Logo/Title */}
          <div style={{ 
            padding: '16px', 
            borderBottom: '1px solid #f0f0f0',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: collapsed ? '14px' : '18px' }}>
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
            borderTop: '1px solid #f0f0f0',
            padding: '16px'
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
                  style={{ backgroundColor: '#1890ff' }}
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
                      color: '#666',
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

      {/* Mobile Navigation - only shows on mobile */}
      {user && isMobile && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          borderTop: '1px solid #f0f0f0',
          padding: '8px',
          zIndex: 20,
          display: 'flex',
          justifyContent: 'space-around',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.15)'
        }}>
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
                height: 'auto',
                padding: '8px 4px',
                fontSize: '10px',
                minWidth: '60px'
              }}
            >
              <div style={{ fontSize: '16px', marginBottom: '2px' }}>
                {item.icon}
              </div>
              <div style={{ fontSize: '10px', textAlign: 'center' }}>
                {item.label}
              </div>
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
                height: 'auto',
                padding: '8px 4px',
                fontSize: '10px',
                minWidth: '60px'
              }}
            >
              <Avatar 
                icon={<UserOutlined />} 
                style={{ 
                  backgroundColor: '#1890ff',
                  width: '20px',
                  height: '20px',
                  fontSize: '12px',
                  marginBottom: '2px'
                }}
              />
              <div style={{ fontSize: '10px' }}>Profile</div>
            </Button>
          </Dropdown>
        </div>
      )}


      {/* Content area - always show */}
        <div style={{ 
          padding: isMobile ? '16px 16px 80px 16px' : '24px',
          background: '#f5f5f5',
          overflow: 'auto',
          paddingTop: (() => {
            const baseHeaderHeight = (!user && forceWorkflowMode) || (user && isNewRegistration && projectMode) ? 100 : 24;
            return `${baseHeaderHeight}px`;
          })()
        }}>
          {/* Floating Action Buttons - Fixed within content area */}
          {user && (
            <div style={{
              position: 'fixed',
              top: '29px',
              right: '29px',
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {/* Quota Counter - Always visible for logged-in users */}
              <div
                onClick={() => {
                  if (remainingPosts === 0) {
                    setShowPricingModal(true);
                  }
                }}
                style={{
                  background: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: `2px solid ${remainingPosts === 0 ? '#ff4d4f' : remainingPosts === 'unlimited' ? '#52c41a' : '#1890ff'}`,
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
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#52c41a'
                    }}>
                      ∞
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: '#8c8c8c',
                      fontWeight: 500
                    }}>
                      Unlimited posts
                    </span>
                  </>
                ) : (
                  <>
                    <span style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: remainingPosts <= 2 ? '#ff4d4f' : '#1890ff'
                    }}>
                      {remainingPosts}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: '#8c8c8c',
                      fontWeight: 500
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
                    backgroundColor: '#52c41a',
                    borderColor: '#52c41a',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(82, 196, 26, 0.3)'
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
                        message.success('Starting guided creation project');
                      }
                    }, 100);
                  }}
                  style={{ 
                    backgroundColor: '#1890ff', 
                    borderColor: '#1890ff',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
                    border: '2px solid #1890ff',
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
                      backgroundColor: '#52c41a', 
                      borderColor: '#52c41a',
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
                      backgroundColor: '#ff4d4f',
                      borderColor: '#ff4d4f',
                      color: 'white',
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(255, 77, 79, 0.3)',
                      border: '2px solid #ff4d4f'
                    }}
                  >
                    🚪 Exit Project Mode
                  </Button>
                )
              )}
            </div>
          )}

          <div style={{
            background: activeTab === 'settings' || activeTab.startsWith('admin-') || activeTab === 'sandbox' ? '#fff' : 'transparent',
            borderRadius: activeTab === 'settings' || activeTab.startsWith('admin-') || activeTab === 'sandbox' ? '8px' : '0',
            minHeight: '100%',
            padding: activeTab === 'settings' || activeTab.startsWith('admin-') || activeTab === 'sandbox' ? '24px' : '0'
          }}>
            {renderContent()}
          </div>
        </div>

      {/* Impersonation Banner */}
      {isImpersonating && impersonationData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: '#ff4d4f',
          color: 'white',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
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
              color: 'white',
              border: '1px solid rgba(255,255,255,0.5)',
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
      {!user && (
        <AuthModal
          open={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            setAuthContext(null);
          }}
          context={authContext}
          defaultTab={authContext === 'register' ? 'register' : 'login'}
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
        onSelectPlan={(planId) => {
          console.log('Plan selected:', planId);
        }}
      />
    </>
  );
};

export default DashboardLayout;