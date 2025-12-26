import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import WorkflowContainerV2 from './components/Workflow/WorkflowContainer-v2';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import SEOHead from './components/SEOHead';
import './styles/design-system.css';
import './styles/mobile.css';

const AppContent = () => {
  const { user, loading, loginContext, clearLoginContext, setNavContext } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Check if user wants dashboard view (logged in and requested navigation)
  const showDashboard = user && loginContext === 'nav';

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

  return (
    <>
      <SEOHead />
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: !isMobile ? '240px 1fr' : '1fr',
        gridTemplateRows: '1fr',
        gridTemplateAreas: !isMobile ? `"sidebar main"` : `"main"`,
        minHeight: '100vh',
        marginLeft: !isMobile ? (showDashboard ? '0' : '-240px') : '0',
        transition: 'margin-left 1s cubic-bezier(0.4, 0, 0.2, 1), grid-template-columns 0.3s ease'
      }}>
        {/* Dashboard Layout - renders sidebar and header */}
        {showDashboard && (
          <DashboardLayout 
            workflowContent={true}
            showDashboard={showDashboard}
            isMobile={isMobile}
          />
        )}
        
        {/* Main content area */}
        <div style={{
          gridArea: 'main',
          overflow: 'hidden',
          padding: showDashboard ? (isMobile ? '10px' : '20px') : '0',
          transition: 'padding 1s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <WorkflowContainerV2 embedded={showDashboard} />
        </div>
      </div>
    </>
  );
};

// Main App wrapper with AuthProvider
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;