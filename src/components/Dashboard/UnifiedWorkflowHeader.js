import React, { useState, useEffect } from 'react';
import { Button, Typography, Steps } from 'antd';
import { 
  PlusOutlined, 
  GlobalOutlined, 
  TeamOutlined, 
  BulbOutlined, 
  EditOutlined, 
  DownloadOutlined 
} from '@ant-design/icons';
import { systemVoice } from '../../copy/systemVoice';

const { Title, Paragraph } = Typography;

/**
 * UnifiedWorkflowHeader Component
 * Provides consistent header styling with adaptive content based on authentication state
 * Ensures smooth visual continuity when users log in during workflow
 */
const UnifiedWorkflowHeader = ({
  user,
  onCreateNewPost,
  forceWorkflowMode = false,
  currentStep = 0,
  analysisCompleted = false,
  showSaveProjectButton = false,
  onSaveProject,
  isNewRegistration = false,
  completedSteps = [],
  projectJustSaved = false
}) => {
  const [textKey, setTextKey] = useState(0);
  const [previousUser, setPreviousUser] = useState(user);
  const [showGradientSweep, setShowGradientSweep] = useState(false);

  // Trigger text transition animation when auth state changes
  useEffect(() => {
    if (previousUser !== user) {
      if (!previousUser && user) {
        // User just logged in - trigger gradient sweep
        setTimeout(() => {
          setShowGradientSweep(true);
          
          // End gradient sweep after animation completes (1.5s)
          setTimeout(() => {
            setShowGradientSweep(false);
          }, 1500);
        }, 1000);
      }
      setTextKey(prev => prev + 1);
      setPreviousUser(user);
    }
  }, [user, previousUser]);

  // Workflow steps data
  const workflowSteps = [
    {
      title: 'Analyze',
      description: 'Website Analysis',
      icon: <GlobalOutlined />
    },
    {
      title: 'Audience',
      description: 'Target Selection', 
      icon: <TeamOutlined />
    },
    {
      title: 'Topics',
      description: 'Content Ideas',
      icon: <BulbOutlined />
    },
    {
      title: 'Create',
      description: 'Generate Content',
      icon: <EditOutlined />
    },
    {
      title: 'Export',
      description: 'Download & Publish',
      icon: <DownloadOutlined />
    }
  ];

  // Determine header content based on state and current step
  const getHeaderContent = () => {
    
    // Step-specific content for workflow progression (one voice: systemVoice)
    const stepMessages = {
      0: {
        icon: "🚀",
        title: systemVoice.header.step0Title,
        description: systemVoice.header.step0Description
      },
      1: {
        icon: "🔍",
        title: systemVoice.header.step1Title,
        description: systemVoice.header.step1Description
      },
      2: {
        icon: "🎯",
        title: systemVoice.header.step2Title,
        description: systemVoice.header.step2Description
      },
      3: {
        icon: "💡",
        title: systemVoice.header.step3Title,
        description: systemVoice.header.step3Description
      },
      4: {
        icon: "✍️",
        title: systemVoice.header.step4Title,
        description: systemVoice.header.step4Description
      }
    };

    const stepInfo = stepMessages[currentStep] || stepMessages[0];

    if (!user) {
      // Logged-out state: Use step-specific messaging
      return {
        title: `${stepInfo.icon} ${stepInfo.title}`,
        description: stepInfo.description,
        buttonText: null,
        showButton: false
      };
    }

    if (forceWorkflowMode || currentStep > 0 || isNewRegistration) {
      // Logged-in workflow mode or new registration: Continue workflow with step context
      return {
        title: `${user.firstName ? `${user.firstName}, ` : ''}${stepInfo.title} ${stepInfo.icon}`,
        description: stepInfo.description,
        buttonText: analysisCompleted ? systemVoice.header.continueProject : systemVoice.header.createNewPost,
        showButton: false // Hide button in project mode (forceWorkflowMode)
      };
    }

    // Special case: Project just saved
    if (projectJustSaved) {
      return {
        title: `${systemVoice.header.projectSavedTitle} 🎉`,
        description: (
          <span>
            {systemVoice.header.projectSavedDescription}{' '}
            <Button 
              type="link" 
              style={{ 
                padding: 0, 
                fontSize: 'inherit',
                height: 'auto',
                color: '#1890ff',
                fontWeight: 500
              }}
              onClick={() => {
                document.getElementById('posts')?.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'start' 
                });
              }}
            >
              {systemVoice.header.goToPosts}
            </Button>
          </span>
        ),
        buttonText: null,
        showButton: false
      };
    }

    // Logged-in dashboard mode: Full dashboard features (button now floating)
    return {
      title: `${systemVoice.header.welcomeBack}${user.firstName ? `, ${user.firstName}` : ''}! 👋`,
      description: systemVoice.header.dashboardDescription,
      buttonText: null,
      showButton: false // Button is now floating in DashboardLayout
    };
  };

  const content = getHeaderContent();

  return (
    <>
      <div style={{ 
        marginBottom: '24px',
        textAlign: 'center',
        padding: '24px',
        position: 'relative'
      }}>
        <div
          key={`title-${textKey}`}
          style={{
            animation: 'fadeInSlide 0.6s ease-out',
            opacity: 1,
            transform: 'translateY(0)'
          }}
        >
          <Title level={2} style={{
            color: showGradientSweep ? 'transparent' : '#1890ff',
            marginBottom: '8px',
            background: showGradientSweep ? 'linear-gradient(90deg, transparent, black)' : 'none',
            backgroundSize: showGradientSweep ? '100% 100%' : 'auto',
            backgroundClip: showGradientSweep ? 'text' : 'border-box',
            WebkitBackgroundClip: showGradientSweep ? 'text' : 'border-box',
            animation: showGradientSweep ? 'gradientSweep 1.5s ease-in-out' : 'none'
          }}>
            {content.title}
          </Title>
          <Paragraph style={{ 
            color: '#666', 
            fontSize: '16px', 
            marginBottom: '24px',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            {content.description}
          </Paragraph>

        </div>
        
        {content.showButton && (
          <div
            key={`button-${textKey}`}
            style={{
              animation: 'fadeInUp 0.8s ease-out 0.2s both',
              opacity: 0
            }}
          >
            <Button 
              type="primary" 
              size="large" 
              icon={<PlusOutlined />} 
              onClick={onCreateNewPost}
              style={{ 
                backgroundColor: '#1890ff', 
                borderColor: '#1890ff',
                minWidth: '160px'
              }}
            >
              {content.buttonText}
            </Button>
          </div>
        )}

        {/* Save Project Button - Only shows after registration (hidden when isNewRegistration since button is now in header) */}
        {showSaveProjectButton && !isNewRegistration && (
          <div
            style={{
              textAlign: 'center',
              marginTop: '24px',
              padding: '20px',
              backgroundColor: '#f6ffed',
              borderRadius: '8px',
              border: '1px solid #b7eb8f'
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#52c41a', marginBottom: '4px' }}>
                🎉 {systemVoice.header.newUserWelcome}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                {systemVoice.header.newUserSavePrompt}
              </div>
            </div>
            <Button 
              type="primary" 
              size="large" 
              onClick={onSaveProject}
              style={{ 
                backgroundColor: '#52c41a', 
                borderColor: '#52c41a',
                minWidth: '180px',
                fontWeight: 600
              }}
            >
              💾 {systemVoice.header.saveProject}
            </Button>
          </div>
        )}

      </div>

      {/* CSS animations for smooth transitions */}
      <style jsx="true">{`
        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }


        @keyframes gradientSweep {
          0% {
            background-position: -100% 0;
          }
          100% {
            background-position: 0% 0;
          }
        }

      `}</style>
    </>
  );
};

export default UnifiedWorkflowHeader;