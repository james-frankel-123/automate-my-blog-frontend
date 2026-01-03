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
      console.log('🎨 UnifiedWorkflowHeader: User state changed', { previousUser: previousUser?.email, currentUser: user?.email });
      if (!previousUser && user) {
        // User just logged in - trigger gradient sweep
        console.log('🎨 Triggering gradient sweep');
        
        // Trigger gradient sweep 1 second after user state changes
        setTimeout(() => {
          console.log('🎨 Starting gradient sweep animation');
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
    
    // Step-specific content for workflow progression
    const stepMessages = {
      0: {
        icon: "🚀",
        title: "Let's Create Your Perfect Blog Post",
        description: "We'll analyze your website and create targeted content that speaks to your audience. This guided project will take you step-by-step to create high-converting blog content."
      },
      1: {
        icon: "🔍",
        title: "Analyzing Your Website",
        description: "We're gathering insights about your business and audience to create highly targeted content recommendations."
      },
      2: {
        icon: "🎯",
        title: "Choose Your Target Audience",
        description: "Select the audience segment that best matches your business goals. This will help us create content that converts."
      },
      3: {
        icon: "💡", 
        title: "Generate Content Ideas",
        description: "We'll create trending topic ideas specifically tailored to your audience and business objectives."
      },
      4: {
        icon: "✍️",
        title: "Create Your Blog Post",
        description: "Generate high-quality, SEO-optimized content that speaks directly to your target audience."
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
        buttonText: analysisCompleted ? "Continue Project" : "Create New Post",
        showButton: !isNewRegistration // Hide button for new registrations until they complete workflow
      };
    }

    // Special case: Project just saved
    if (projectJustSaved) {
      return {
        title: "Project saved! 🎉",
        description: (
          <span>
            Your content automation dashboard is ready. Go to{' '}
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
              Posts
            </Button>
            {' '}to reopen your content.
          </span>
        ),
        buttonText: null,
        showButton: false
      };
    }

    // Logged-in dashboard mode: Full dashboard features
    return {
      title: `Welcome back${user.firstName ? `, ${user.firstName}` : ''}! 👋`,
      description: "Your content automation dashboard is ready. Create, discover, and optimize your blog content strategy.",
      buttonText: "Create New Post",
      showButton: true
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

          {/* Show workflow steps for logged-out users and new registrations */}
          {(!user || isNewRegistration) && (
            <div style={{ 
              maxWidth: '800px', 
              margin: '0 auto 24px auto',
              padding: '0 20px' 
            }}>
              <Steps 
                current={currentStep}
                size="default"
                items={workflowSteps.map((step, index) => {
                  let status = 'wait';
                  if (completedSteps.includes(index)) {
                    status = 'finish';
                  } else if (index === currentStep) {
                    status = 'process';
                  }
                  return {
                    ...step,
                    status
                  };
                })}
                style={{ width: '100%' }}
              />
            </div>
          )}
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
                🎉 Welcome to Automate My Blog!
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Your account has been created successfully. Save your project to access the full dashboard.
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
              💾 Save Project
            </Button>
          </div>
        )}

      </div>

      {/* CSS animations for smooth transitions */}
      <style jsx>{`
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