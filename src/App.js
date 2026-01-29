import React, { useState, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WorkflowModeProvider } from './contexts/WorkflowModeContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { SystemHintProvider } from './contexts/SystemHintContext';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import SEOHead from './components/SEOHead';
import { storeReferralInfo } from './utils/referralUtils';
import './styles/design-system.css';
import './styles/mobile.css';

const AppContent = () => {
  const { user, loading, loginContext } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [, setActiveTab] = useState('newpost');

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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  // Use DashboardLayout for both logged-in and logged-out users
  // This creates seamless transitions where login only affects layout/spacing

  return (
    <SystemHintProvider>
      <SEOHead />
      <DashboardLayout 
        workflowContent={true}
        showDashboard={user && loginContext === 'nav'} // Show dashboard UI when logged in with nav context
        isMobile={isMobile}
        onActiveTabChange={setActiveTab}
        forceWorkflowMode={!user} // Force workflow mode for logged-out users
      />
    </SystemHintProvider>
  );
};

// Main App wrapper with HelmetProvider, AuthProvider, AnalyticsProvider, and WorkflowModeProvider
const App = () => {
  return (
    <HelmetProvider>
      <AuthProvider>
        <AnalyticsProvider>
          <WorkflowModeProvider>
            <AppContent />
          </WorkflowModeProvider>
        </AnalyticsProvider>
      </AuthProvider>
    </HelmetProvider>
  );
};

export default App;