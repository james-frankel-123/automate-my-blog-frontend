import React, { useState, useEffect } from 'react';
import { Card, Typography, Spin, Row, Col, Button, Tag } from 'antd';
import { LockOutlined, BulbOutlined } from '@ant-design/icons';
import { ComponentHelpers } from '../interfaces/WorkflowComponentInterface';
import PricingModal from '../../Modals/PricingModal';
import { systemVoice } from '../../../copy/systemVoice';

const { Title, Text, Paragraph } = Typography;

/**
 * ContentGenerationStep v2
 * Complete step component showing content generation progress and completion
 * EXTRACTED AND ENHANCED FROM: App.js content generation loading and completion logic
 */
const ContentGenerationStepV2 = (props) => {
  // =============================================================================
  // PROPS DESTRUCTURING WITH VALIDATION
  // =============================================================================

  const {
    // Core workflow state
    currentStep,
    stepResults,
    selectedTopic,
    
    // Content generation state
    blogGenerating,
    generatedContent,
    isLoading,
    
    // Content strategy
    contentStrategy,
    
    // Web search insights
    webSearchInsights = { researchQuality: 'basic' },
    
    // Configuration
    embedded = false,
    user,
    
    // Functions
    generateContent,
    requireAuth,
    
    // Default colors helper
    getDefaultColors = ComponentHelpers.getDefaultColors
  } = props;

  // =============================================================================
  // LOCAL STATE AND HELPERS
  // =============================================================================

  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pendingPricingAfterAuth, setPendingPricingAfterAuth] = useState(false);
  const responsive = ComponentHelpers.getResponsiveStyles();
  const defaultColors = getDefaultColors();
  const analysis = stepResults?.websiteAnalysis || {};

  // Handle post-authentication pricing modal reopening
  useEffect(() => {
    if (user && pendingPricingAfterAuth) {
      setShowPricingModal(true);
      setPendingPricingAfterAuth(false);
    }
  }, [user, pendingPricingAfterAuth]);

  // =============================================================================
  // UI HELPER FUNCTIONS
  // =============================================================================

  /**
   * Render blog post generation skeleton
   * EXTRACTED FROM: App.js blog post skeleton during generation
   */
  const renderGenerationSkeleton = () => (
    <div style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto' }}>
      {/* Main title skeleton */}
      <div style={{ 
        height: '32px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '4px', 
        marginBottom: '16px', 
        animation: 'pulse 1.5s ease-in-out infinite' 
      }}></div>
      
      {/* Subtitle skeleton */}
      <div style={{ 
        height: '20px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '4px', 
        marginBottom: '20px', 
        width: '60%', 
        animation: 'pulse 1.5s ease-in-out infinite' 
      }}></div>
      
      {/* First paragraph lines */}
      <div style={{ 
        height: '16px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '4px', 
        marginBottom: '8px', 
        animation: 'pulse 1.5s ease-in-out infinite' 
      }}></div>
      <div style={{ 
        height: '16px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '4px', 
        marginBottom: '8px', 
        width: '90%', 
        animation: 'pulse 1.5s ease-in-out infinite' 
      }}></div>
      <div style={{ 
        height: '16px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '4px', 
        marginBottom: '20px', 
        width: '95%', 
        animation: 'pulse 1.5s ease-in-out infinite' 
      }}></div>
      
      {/* Section heading skeleton */}
      <div style={{ 
        height: '24px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '4px', 
        marginBottom: '12px', 
        width: '40%', 
        animation: 'pulse 1.5s ease-in-out infinite' 
      }}></div>
      
      {/* Second paragraph lines */}
      <div style={{ 
        height: '16px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '4px', 
        marginBottom: '8px', 
        animation: 'pulse 1.5s ease-in-out infinite' 
      }}></div>
      <div style={{ 
        height: '16px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '4px', 
        marginBottom: '8px', 
        width: '85%', 
        animation: 'pulse 1.5s ease-in-out infinite' 
      }}></div>
      <div style={{ 
        height: '16px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '4px', 
        marginBottom: '20px', 
        width: '92%', 
        animation: 'pulse 1.5s ease-in-out infinite' 
      }}></div>
      
      {/* Additional content sections */}
      <div style={{ 
        height: '24px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '4px', 
        marginBottom: '12px', 
        width: '50%', 
        animation: 'pulse 1.5s ease-in-out infinite' 
      }}></div>
      
      {/* More paragraph lines */}
      {[100, 88, 95, 78].map((width, index) => (
        <div key={index} style={{ 
          height: '16px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '4px', 
          marginBottom: '8px', 
          width: `${width}%`, 
          animation: 'pulse 1.5s ease-in-out infinite' 
        }}></div>
      ))}
    </div>
  );

  /**
   * Render content generation loading state
   * EXTRACTED FROM: App.js blogGenerating UI
   */
  const renderGeneratingState = () => (
    <div style={{ textAlign: 'center', padding: responsive.padding }}>
      <div style={{ 
        fontSize: responsive.isMobile ? '48px' : '64px', 
        marginBottom: '24px',
        animation: 'pulse 2s infinite'
      }}>
        ✍️
      </div>
      
      <Title level={2} style={{ 
        marginBottom: '20px',
        color: defaultColors.primary,
        fontSize: responsive.fontSize.title
      }}>
        Generating Your Blog Post
      </Title>
      
      <Spin size="large" style={{ marginBottom: '20px' }} />
      
      <Paragraph style={{ 
        fontSize: responsive.fontSize.text, 
        color: '#666', 
        marginBottom: '30px',
        maxWidth: '500px',
        margin: '0 auto 30px auto'
      }}>
        Creating your personalized blog post with AI...
      </Paragraph>
      
      {/* Web Search Enhancement Indicator */}
      {webSearchInsights.researchQuality === 'enhanced' && (
        <div style={{
          marginBottom: '20px',
          padding: '12px',
          backgroundColor: '#f6ffed',
          borderRadius: '8px',
          border: '1px solid #b7eb8f',
          maxWidth: '500px',
          margin: '0 auto 20px auto'
        }}>
          <Text style={{ fontSize: responsive.fontSize.small, color: '#389e0d', fontWeight: 500 }}>
            🔍 Enhanced with web research insights and competitive analysis
          </Text>
        </div>
      )}
      
      {/* Generation Process Indicators */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '16px', 
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        marginBottom: '30px',
        maxWidth: '600px',
        margin: '0 auto 30px auto'
      }}>
        <Text style={{ 
          color: '#666', 
          fontSize: responsive.fontSize.small,
          display: 'block',
          marginBottom: '8px'
        }}>
          <strong>AI is working on:</strong>
        </Text>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center',
          gap: '8px',
          fontSize: responsive.fontSize.small,
          color: '#666'
        }}>
          <span>📝 Structure</span>
          <span>•</span>
          <span>🎯 SEO optimization</span>
          <span>•</span>
          <span>🧠 Personalization</span>
          <span>•</span>
          <span>✨ Brand voice</span>
        </div>
      </div>

      {/* Blog Post Generation Skeleton */}
      {renderGenerationSkeleton()}
    </div>
  );

  /**
   * Render content generation completion state
   * EXTRACTED FROM: App.js completion state after generation
   */
  const renderCompletionState = () => (
    <div style={{ textAlign: 'center', padding: responsive.padding }}>
      <div style={{ 
        width: responsive.isMobile ? '60px' : '80px', 
        height: responsive.isMobile ? '60px' : '80px', 
        backgroundColor: '#52c41a', 
        borderRadius: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        margin: '0 auto 24px auto'
      }}>
        <span style={{ 
          fontSize: responsive.isMobile ? '24px' : '32px', 
          color: 'white' 
        }}>🎉</span>
      </div>
      
      <Title level={2} style={{ 
        color: defaultColors.primary, 
        marginBottom: '20px',
        fontSize: responsive.fontSize.title
      }}>
        Your Blog Post is Ready!
      </Title>
      
      <Paragraph style={{ 
        fontSize: responsive.fontSize.text, 
        marginBottom: '30px',
        color: '#666',
        maxWidth: '500px',
        margin: '0 auto 30px auto'
      }}>
        Your AI-generated blog post is complete and ready for review in preview mode.
      </Paragraph>
      
      {/* Enhancement Notification */}
      {webSearchInsights.researchQuality === 'enhanced' && (
        <div style={{
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#f6ffed',
          borderRadius: '8px',
          border: '1px solid #b7eb8f',
          maxWidth: '500px',
          margin: '0 auto 20px auto'
        }}>
          <Text style={{ fontSize: responsive.fontSize.small, color: '#389e0d', fontWeight: 500 }}>
            🔍 Enhanced with Web Research
          </Text>
          <div style={{ marginTop: '8px' }}>
            <Text style={{ fontSize: '12px', color: '#389e0d' }}>
              Content includes current market insights, competitor analysis, and trending keywords
            </Text>
          </div>
        </div>
      )}
      
      {/* Preview Mode Default Notification */}
      <div style={{ 
        background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)', 
        padding: '20px', 
        borderRadius: '12px',
        border: '1px solid #d6e7ff',
        marginBottom: '20px',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        <Text style={{ 
          fontSize: responsive.fontSize.small, 
          color: '#1890ff', 
          fontWeight: 500,
          display: 'block'
        }}>
          📝 Defaulted to Preview Mode for easy reading
        </Text>
        <Text style={{ 
          fontSize: '12px', 
          color: '#666',
          marginTop: '8px',
          display: 'block'
        }}>
          Switch to Edit Mode when you're ready to make changes
        </Text>
      </div>
      
      {/* Content Quality Summary */}
      {generatedContent && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: defaultColors.secondary + '20',
          borderRadius: '8px',
          border: `1px solid ${defaultColors.secondary}60`,
          maxWidth: '500px',
          margin: '20px auto 0 auto'
        }}>
          <Text style={{ 
            fontSize: responsive.fontSize.small, 
            color: defaultColors.primary, 
            fontWeight: 500,
            display: 'block',
            marginBottom: '8px'
          }}>
            📊 Content Summary
          </Text>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#666'
          }}>
            <span>
              <strong>Words:</strong> {Math.round(generatedContent.length / 5)}
            </span>
            <span>
              <strong>Reading Time:</strong> {Math.ceil(generatedContent.length / 1000)} min
            </span>
          </div>
        </div>
      )}
    </div>
  );

  /**
   * Render topic selection cards for content generation
   * EXTRACTED FROM: App.js lines 2656-2946 (enhanced topic cards with skeleton loading)
   */
  const renderTopicSelection = () => {
    const availableTopics = stepResults.trendingTopics || [];
    
    if (availableTopics.length === 0) {
      // Show loading skeleton instead of "No Content Ideas"
      return (
        <div style={{ textAlign: 'center', padding: responsive.padding }}>
          <Title level={2} style={{ 
            marginBottom: '20px',
            color: defaultColors.primary,
            fontSize: responsive.fontSize.title
          }}>
            Generating Your Content Ideas
          </Title>
          
          <Paragraph style={{ 
            fontSize: responsive.fontSize.text, 
            color: '#666', 
            marginBottom: '30px',
            maxWidth: '600px',
            margin: '0 auto 30px auto'
          }}>
            AI is analyzing your business to create personalized blog post ideas...
          </Paragraph>

          <Row gutter={responsive.isMobile ? [8, 8] : [16, 16]}>
            {/* Show 2 loading skeleton cards */}
            {[1, 2].map((skeletonId) => (
              <Col key={skeletonId} xs={24} md={12} lg={12}>
                <Card 
                  cover={
                    <div style={{ 
                      height: '200px', 
                      backgroundColor: '#f5f5f5', 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center',
                      padding: '20px',
                      textAlign: 'center'
                    }}>
                      <div style={{ 
                        marginBottom: '12px',
                        fontSize: '14px', 
                        color: '#666',
                        fontWeight: 500
                      }}>
                        🎨 Generating image...
                      </div>
                      <div style={{
                        width: '40px',
                        height: '4px',
                        backgroundColor: '#e0e0e0',
                        borderRadius: '2px',
                        overflow: 'hidden',
                        marginTop: '12px'
                      }}>
                        <div style={{
                          width: '100%',
                          height: '100%',
                          backgroundColor: '#1890ff',
                          borderRadius: '2px',
                          animation: 'progress 2s ease-in-out infinite'
                        }}></div>
                      </div>
                    </div>
                  }
                  style={{ 
                    border: '1px solid #f0f0f0',
                    margin: '8px 0',
                    minHeight: '300px'
                  }}
                >
                  <div style={{ padding: '16px', minHeight: '120px' }}>
                    {/* Loading skeleton content */}
                    <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                      <div style={{ 
                        width: '60px', 
                        height: '22px', 
                        backgroundColor: '#f5f5f5', 
                        borderRadius: '4px', 
                        animation: 'pulse 1.5s ease-in-out infinite' 
                      }}></div>
                      <div style={{ 
                        width: '80px', 
                        height: '22px', 
                        backgroundColor: '#f5f5f5', 
                        borderRadius: '4px', 
                        animation: 'pulse 1.5s ease-in-out infinite' 
                      }}></div>
                    </div>
                    <div style={{ 
                      height: '24px', 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: '4px', 
                      marginBottom: '8px', 
                      animation: 'pulse 1.5s ease-in-out infinite' 
                    }}></div>
                    <div style={{ 
                      height: '24px', 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: '4px', 
                      marginBottom: '12px', 
                      width: '80%',
                      animation: 'pulse 1.5s ease-in-out infinite' 
                    }}></div>
                    <div style={{ 
                      height: '16px', 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: '4px', 
                      marginBottom: '6px',
                      animation: 'pulse 1.5s ease-in-out infinite' 
                    }}></div>
                    <div style={{ 
                      height: '16px', 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: '4px', 
                      width: '90%',
                      animation: 'pulse 1.5s ease-in-out infinite' 
                    }}></div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      );
    }

    return (
      <div style={{ textAlign: 'center', padding: responsive.padding }}>
        <Title level={2} style={{ 
          marginBottom: '20px',
          color: defaultColors.primary,
          fontSize: responsive.fontSize.title
        }}>
          {systemVoice.content.readyToGenerate}
        </Title>
        
        <Paragraph style={{ 
          fontSize: responsive.fontSize.text, 
          color: '#666', 
          marginBottom: '30px',
          maxWidth: '600px',
          margin: '0 auto 30px auto'
        }}>
          {systemVoice.topics.ideasHeadline(analysis?.businessType)}
        </Paragraph>

        {/* Keyword Research Insight */}
        {webSearchInsights.researchQuality === 'enhanced' && (
          <div style={{
            textAlign: 'center',
            marginBottom: '20px',
            padding: '12px',
            backgroundColor: '#f6ffed',
            borderRadius: '6px',
            border: '1px solid #b7eb8f',
            maxWidth: '500px',
            margin: '0 auto 20px auto'
          }}>
            <Text style={{ fontSize: '13px', color: '#389e0d' }}>
              🎯 Topics enhanced with current market keyword research and competitive analysis
            </Text>
          </div>
        )}
        

        <Row gutter={responsive.isMobile ? [8, 8] : [16, 16]}>
          {/* Show first 2 topics for lead generation */}
          {availableTopics.slice(0, 2).map((topic) => (
            <Col key={topic.id} xs={24} md={12} lg={12}>
              <Card 
                hoverable
                cover={
                  topic.isImageLoading ? (
                    <div style={{ 
                      height: '200px', 
                      backgroundColor: '#f5f5f5', 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center',
                      padding: '20px',
                      textAlign: 'center'
                    }}>
                      <div style={{ 
                        marginBottom: '12px',
                        fontSize: '14px', 
                        color: '#666',
                        fontWeight: 500
                      }}>
                        🎨 Generating image...
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#999'
                      }}>
                        (takes ~30 seconds)
                      </div>
                      <div style={{
                        width: '40px',
                        height: '4px',
                        backgroundColor: '#e0e0e0',
                        borderRadius: '2px',
                        overflow: 'hidden',
                        marginTop: '12px'
                      }}>
                        <div style={{
                          width: '100%',
                          height: '100%',
                          backgroundColor: '#1890ff',
                          borderRadius: '2px',
                          animation: 'progress 2s ease-in-out infinite'
                        }}></div>
                      </div>
                    </div>
                  ) : (
                    <img 
                      alt={topic.title} 
                      src={topic.image} 
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                  )
                }
                style={{ 
                  border: '1px solid #f0f0f0',
                  margin: '8px 0',
                  opacity: topic.isContentLoading ? 0.8 : 1,
                  minHeight: '300px'
                }}
              >
                {topic.isContentLoading ? (
                  <div style={{ padding: '16px', minHeight: '120px' }}>
                    {/* Loading skeleton content */}
                    <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                      <div style={{ 
                        width: '60px', 
                        height: '22px', 
                        backgroundColor: '#f5f5f5', 
                        borderRadius: '4px', 
                        animation: 'pulse 1.5s ease-in-out infinite' 
                      }}></div>
                      <div style={{ 
                        width: '80px', 
                        height: '22px', 
                        backgroundColor: '#f5f5f5', 
                        borderRadius: '4px', 
                        animation: 'pulse 1.5s ease-in-out infinite' 
                      }}></div>
                    </div>
                    <div style={{ 
                      height: '24px', 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: '4px', 
                      marginBottom: '8px', 
                      animation: 'pulse 1.5s ease-in-out infinite' 
                    }}></div>
                    <div style={{ 
                      height: '24px', 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: '4px', 
                      marginBottom: '12px', 
                      width: '80%',
                      animation: 'pulse 1.5s ease-in-out infinite' 
                    }}></div>
                    <div style={{ 
                      height: '16px', 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: '4px', 
                      marginBottom: '6px',
                      animation: 'pulse 1.5s ease-in-out infinite' 
                    }}></div>
                    <div style={{ 
                      height: '16px', 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: '4px', 
                      width: '90%',
                      animation: 'pulse 1.5s ease-in-out infinite' 
                    }}></div>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '12px' }}>
                      <Tag color="blue">{topic.category}</Tag>
                      {contentStrategy && (
                        <>
                          <Tag color="purple">{contentStrategy.goal}</Tag>
                          <Tag color="orange">{contentStrategy.voice}</Tag>
                          <Tag color="cyan">{contentStrategy.template}</Tag>
                          <Tag color="green">{contentStrategy.length}</Tag>
                        </>
                      )}
                    </div>
                    <Title level={4} style={{ marginBottom: '8px', fontSize: '16px' }}>
                      {topic.title}
                    </Title>
                    <Paragraph style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>
                      {topic.subheader}
                    </Paragraph>
                    
                    {topic.trafficPrediction && (
                      <div style={{ 
                        marginBottom: '16px', 
                        padding: '12px', 
                        backgroundColor: '#f0f8ff', 
                        borderRadius: '6px',
                        border: '1px solid #d6e7ff'
                      }}>
                        <Text style={{ fontSize: '12px', color: '#1890ff', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                          📊 Traffic Prediction:
                        </Text>
                        <Text style={{ fontSize: '11px', color: '#666', lineHeight: '1.4' }}>
                          {topic.trafficPrediction}
                        </Text>
                      </div>
                    )}
                    
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                      <Button
                        type="primary"
                        size="large"
                        onClick={() => generateContent(topic.id)}
                        loading={isLoading && selectedTopic === topic.id}
                        style={{
                          backgroundColor: defaultColors.primary,
                          borderColor: defaultColors.primary,
                          width: '100%',
                          marginBottom: '12px'
                        }}
                      >
                        Get One Free Post
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            </Col>
          ))}

          {/* Generate More Posts Call-to-Action Card */}
          <Col xs={24} md={12} lg={12}>
            <Card
              hoverable
              style={{
                border: '2px dashed #d9d9d9',
                borderRadius: '12px',
                minHeight: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              onClick={() => setShowPricingModal(true)}
            >
              <div style={{
                textAlign: 'center',
                padding: '40px 20px'
              }}>
                <BulbOutlined style={{
                  fontSize: '48px',
                  color: '#1890ff',
                  marginBottom: '16px'
                }} />
                <Title level={4} style={{
                  marginBottom: '12px',
                  color: '#333'
                }}>
                  Need More Ideas?
                </Title>
                <Paragraph style={{
                  color: '#666',
                  marginBottom: '20px',
                  fontSize: '14px'
                }}>
                  Get unlimited blog posts and premium features
                </Paragraph>
                <Button
                  type="primary"
                  size="large"
                  style={{
                    backgroundColor: '#1890ff',
                    borderColor: '#1890ff',
                    fontWeight: '500'
                  }}
                >
                  Generate More Posts
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // =============================================================================
  // VALIDATION AND ERROR HANDLING
  // =============================================================================

  // Only show this step if we're at step 3
  if (currentStep !== 3) {
    return null;
  }

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div style={{ 
      width: '100%', 
      maxWidth: embedded ? '100%' : '1200px', 
      margin: '0 auto',
      padding: responsive.padding
    }}>
      <Card style={{ marginBottom: '20px', minHeight: '400px' }}>
        {/* Show topic selection, generation loading state, or completion state */}
        {generatedContent ? 
          renderCompletionState() : 
          blogGenerating ? 
            renderGeneratingState() : 
            renderTopicSelection()
        }
      </Card>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>

      {/* Pricing Modal */}
      <PricingModal
        open={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        user={user}
        onCreateAccount={() => {
          setShowPricingModal(false);
          setPendingPricingAfterAuth(true);
          if (requireAuth) {
            requireAuth('Generate more posts', 'pricing-gate');
          }
        }}
        onSelectPlan={(planId) => {
          console.log('Selected plan:', planId);
          // TODO: Implement plan selection logic
        }}
      />
    </div>
  );
};

ContentGenerationStepV2.displayName = 'ContentGenerationStepV2';

export default ContentGenerationStepV2;