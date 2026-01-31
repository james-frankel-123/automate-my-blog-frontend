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
  projectJustSaved = false,
  enableSequentialAnimation = false,
  onSequenceComplete = null,
  inputIsEditing = true
}) => {
  const [textKey, setTextKey] = useState(0);
  const [previousUser, setPreviousUser] = useState(user);
  const [showGradientSweep, setShowGradientSweep] = useState(false);

  // Typewriter animation state
  const [displayedTitle, setDisplayedTitle] = useState('');
  const [displayedSubtitlePart1, setDisplayedSubtitlePart1] = useState(''); // Before "clicks"
  const [displayedClicks, setDisplayedClicks] = useState(''); // The word "clicks"
  const [displayedSubtitlePart2, setDisplayedSubtitlePart2] = useState(''); // After "clicks"
  const [showTitleCursor, setShowTitleCursor] = useState(true);
  const [showSubtitleCursor, setShowSubtitleCursor] = useState(false);
  const [titleComplete, setTitleComplete] = useState(false);
  const [subtitleComplete, setSubtitleComplete] = useState(false);
  const [showFlash, setShowFlash] = useState(null); // Only 'ding' now (no 'title' or 'subtitle')
  const [showClicksHighlight, setShowClicksHighlight] = useState(false); // For "clicks" animation
  const [cursorRemoved, setCursorRemoved] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [skipAnimation, setSkipAnimation] = useState(false);
  const [dimText, setDimText] = useState(false);
  const [dingPosition, setDingPosition] = useState(null);

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

  // Typewriter animation effect
  useEffect(() => {
    if (!enableSequentialAnimation) return;

    // Check if animation has already played this session
    const animationKey = 'autoblog-step0-typewriter-played';
    const hasPlayed = sessionStorage.getItem(animationKey);

    // Split subtitle into 3 parts for "clicks" animation
    const subtitlePart1 = "Automate website content to get ";
    const clicksWord = "clicks";
    const subtitlePart2 = " without complication";

    if (hasPlayed) {
      // Show full text immediately
      setDisplayedTitle(systemVoice.header.step0Title);
      setDisplayedSubtitlePart1(subtitlePart1);
      setDisplayedClicks(clicksWord);
      setDisplayedSubtitlePart2(subtitlePart2);
      setShowTitleCursor(false);
      setShowSubtitleCursor(false);
      setTitleComplete(true);
      setSubtitleComplete(true);
      setCursorRemoved(true);
      setSkipAnimation(true);
      setAnimationComplete(true);
      onSequenceComplete?.();
      return;
    }

    const fullTitle = systemVoice.header.step0Title;
    const charDelay = 50; // 50ms per character
    const clicksPauseDelay = 300; // 300ms pause after "clicks"
    const timeouts = [];

    // 1. Type title character by character (NO FLASH when complete)
    for (let i = 0; i <= fullTitle.length; i++) {
      const timeout = setTimeout(() => {
        setDisplayedTitle(fullTitle.slice(0, i));

        if (i === fullTitle.length) {
          // Title complete - NO FLASH, just move cursor immediately
          setTitleComplete(true);
          setShowTitleCursor(false);
          setShowSubtitleCursor(true);
        }
      }, i * charDelay);
      timeouts.push(timeout);
    }

    // 2. Type subtitle part 1 ("Automate website content to get ")
    const subtitleStartDelay = fullTitle.length * charDelay;
    for (let i = 0; i <= subtitlePart1.length; i++) {
      const timeout = setTimeout(() => {
        setDisplayedSubtitlePart1(subtitlePart1.slice(0, i));
      }, subtitleStartDelay + (i * charDelay));
      timeouts.push(timeout);
    }

    // 3. Type "clicks" word
    const clicksStartDelay = subtitleStartDelay + (subtitlePart1.length * charDelay);
    for (let i = 0; i <= clicksWord.length; i++) {
      const timeout = setTimeout(() => {
        setDisplayedClicks(clicksWord.slice(0, i));

        if (i === clicksWord.length) {
          // "clicks" complete - PAUSE and ANIMATE
          const highlightTimeout = setTimeout(() => {
            setShowClicksHighlight(true); // Trigger highlight animation
            const highlightEndTimeout = setTimeout(() => setShowClicksHighlight(false), 200);
            timeouts.push(highlightEndTimeout);
          }, clicksPauseDelay);
          timeouts.push(highlightTimeout);
        }
      }, clicksStartDelay + (i * charDelay));
      timeouts.push(timeout);
    }

    // 4. Type subtitle part 2 (" without complication") - after pause + 0.5s additional delay
    const part2StartDelay = clicksStartDelay + (clicksWord.length * charDelay) + clicksPauseDelay + 200 + 500;
    for (let i = 0; i <= subtitlePart2.length; i++) {
      const timeout = setTimeout(() => {
        setDisplayedSubtitlePart2(subtitlePart2.slice(0, i));

        if (i === subtitlePart2.length) {
          // Subtitle complete - NO FLASH, just ding effect
          setSubtitleComplete(true);

          const dingTimeout = setTimeout(() => {
            setShowSubtitleCursor(false);
            setShowFlash('ding');
            setCursorRemoved(true);

            const dingEndTimeout = setTimeout(() => setShowFlash(null), 200);
            timeouts.push(dingEndTimeout);

            // Mark animation complete
            const completeTimeout = setTimeout(() => {
              setAnimationComplete(true);
              sessionStorage.setItem(animationKey, 'true');
              onSequenceComplete?.();

              // Dim text after input appears (300ms delay for input fade-in)
              const dimTimeout = setTimeout(() => {
                setDimText(true);

                // Auto un-dim after 5 seconds
                const undimTimeout = setTimeout(() => {
                  setDimText(false);
                }, 5000);
                timeouts.push(undimTimeout);
              }, 300);
              timeouts.push(dimTimeout);
            }, 200);
            timeouts.push(completeTimeout);
          }, 0);
          timeouts.push(dingTimeout);
        }
      }, part2StartDelay + (i * charDelay));
      timeouts.push(timeout);
    }

    // Cleanup timeouts on unmount
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [enableSequentialAnimation, onSequenceComplete]);

  // Skip animation handler
  const handleSkipAnimation = () => {
    if (animationComplete || !enableSequentialAnimation) return;

    // Show full text immediately
    setDisplayedTitle(systemVoice.header.step0Title);
    setDisplayedSubtitlePart1("Automate website content to get ");
    setDisplayedClicks("clicks");
    setDisplayedSubtitlePart2(" without complication");
    setShowTitleCursor(false);
    setShowSubtitleCursor(false);
    setTitleComplete(true);
    setSubtitleComplete(true);
    setCursorRemoved(true);
    setSkipAnimation(true);
    setAnimationComplete(true);

    const animationKey = 'autoblog-step0-typewriter-played';
    sessionStorage.setItem(animationKey, 'true');
    onSequenceComplete?.();

    // Dim text shortly after skip
    setTimeout(() => {
      setDimText(true);
      // Auto un-dim after 5 seconds
      setTimeout(() => {
        setDimText(false);
      }, 5000);
    }, 300);
  };

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
                color: 'var(--color-primary)',
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
        marginBottom: !inputIsEditing ? '0' : '24px',
        textAlign: 'center',
        padding: !inputIsEditing ? '0' : '24px',
        position: 'relative',
        cursor: enableSequentialAnimation && !animationComplete ? 'pointer' : 'default',
        transform: !inputIsEditing ? 'translateY(-100%)' : 'translateY(0)',
        opacity: !inputIsEditing ? 0 : 1,
        height: !inputIsEditing ? '0' : 'auto',
        overflow: !inputIsEditing ? 'hidden' : 'visible',
        transition: 'all 0.3s ease',
        pointerEvents: !inputIsEditing ? 'none' : 'auto'
      }}
      onClick={enableSequentialAnimation && !animationComplete ? handleSkipAnimation : undefined}
      >
        {enableSequentialAnimation ? (
          // Typewriter animation mode
          <div
            style={{
              opacity: dimText ? 0.4 : 1,
              transition: 'all 0.3s ease',
              pointerEvents: 'none',
              position: 'relative'
            }}
            onClick={(e) => {
              if (dimText) {
                e.stopPropagation();
                setDimText(false);
              }
            }}
          >
            {/* Title with typewriter effect - Highlights with subtitle during "clicks" animation */}
            <div
              className={showClicksHighlight ? 'flash-highlight' : ''}
              style={{
                marginBottom: 'var(--space-4)',
                display: 'block',
                textAlign: 'center'
              }}
            >
              <Title level={2} style={{
                color: 'var(--color-primary)',
                marginBottom: 0,
                fontFamily: 'var(--font-family-display)',
                fontSize: 'var(--font-size-3xl)',
                fontWeight: 'var(--font-weight-semibold)',
                letterSpacing: 'var(--letter-spacing-tight)',
                display: 'inline'
              }}>
                {displayedTitle}
              </Title>
              {showTitleCursor && (
                <span className="typewriter-cursor" style={{ verticalAlign: 'middle' }} />
              )}
            </div>

            {/* Subtitle with typewriter effect - Highlights with title during "clicks" animation */}
            <div
              className={showClicksHighlight ? 'flash-highlight' : ''}
              style={{
                display: 'block',
                maxWidth: '800px',
                margin: '0 auto',
                textAlign: 'center'
              }}
            >
              <Paragraph style={{
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-lg)',
                marginBottom: 0,
                lineHeight: 'var(--line-height-relaxed)',
                display: 'inline'
              }}>
                {/* Part 1: "Automate website content to get " */}
                {displayedSubtitlePart1}

                {/* Part 2: "clicks" */}
                {displayedClicks}

                {/* Part 3: " without complication" */}
                {displayedSubtitlePart2}
              </Paragraph>
              {showSubtitleCursor && (
                <span className="typewriter-cursor" style={{ verticalAlign: 'middle' }} />
              )}
            </div>

            {/* Ding ripple effect */}
            {showFlash === 'ding' && (
              <div className="ding-effect" style={{
                left: '50%',
                top: '50%',
                marginLeft: '-10px',
                marginTop: '-10px'
              }} />
            )}
          </div>
        ) : (
          // Standard animation mode (existing behavior)
          <div
            key={`title-${textKey}`}
            style={{
              animation: 'fadeInSlide 0.6s ease-out',
              opacity: 1,
              transform: 'translateY(0)'
            }}
          >
            <Title level={2} style={{
              color: showGradientSweep ? 'transparent' : 'var(--color-primary)',
              marginBottom: 'var(--space-2)',
              fontFamily: 'var(--font-family-display)',
              fontSize: 'var(--font-size-3xl)',
              fontWeight: 'var(--font-weight-semibold)',
              letterSpacing: 'var(--letter-spacing-tight)',
              background: showGradientSweep ? 'linear-gradient(90deg, transparent, var(--color-primary))' : 'none',
              backgroundSize: showGradientSweep ? '100% 100%' : 'auto',
              backgroundClip: showGradientSweep ? 'text' : 'border-box',
              WebkitBackgroundClip: showGradientSweep ? 'text' : 'border-box',
              animation: showGradientSweep ? 'gradientSweep 1.5s ease-in-out' : 'none'
            }}>
              {content.title}
            </Title>
            <Paragraph style={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-lg)',
              marginBottom: 'var(--space-6)',
              maxWidth: '800px',
              margin: '0 auto',
              lineHeight: 'var(--line-height-relaxed)'
            }}>
              {content.description}
            </Paragraph>

          </div>
        )}
        
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
                backgroundColor: 'var(--color-primary)', 
                borderColor: 'var(--color-primary)',
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
              <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-success)', marginBottom: 'var(--space-1)' }}>
                🎉 {systemVoice.header.newUserWelcome}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                {systemVoice.header.newUserSavePrompt}
              </div>
            </div>
            <Button 
              type="primary" 
              size="large" 
              onClick={onSaveProject}
              style={{ 
                backgroundColor: 'var(--color-success)', 
                borderColor: 'var(--color-success)',
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

        @keyframes phraseReveal {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

      `}</style>
    </>
  );
};

export default UnifiedWorkflowHeader;