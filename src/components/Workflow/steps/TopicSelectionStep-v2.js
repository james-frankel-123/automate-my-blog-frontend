import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Typography, Tag, Divider, Space, message } from 'antd';
import {
  DatabaseOutlined,
  BulbOutlined,
  EditOutlined,
  LockOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { ComponentHelpers } from '../interfaces/WorkflowComponentInterface';
import ManualCTAInputModal from '../../Modals/ManualCTAInputModal';
import api from '../../../services/api';
import { systemVoice } from '../../../copy/systemVoice';

const { Title, Text, Paragraph } = Typography;

/**
 * TopicSelectionStep v2
 * Complete step component with rich topic cards and loading states
 * EXTRACTED AND ENHANCED FROM: App.js step 3 topic selection logic
 */
const TopicSelectionStepV2 = (props) => {
  // =============================================================================
  // PROPS DESTRUCTURING WITH VALIDATION
  // =============================================================================

  const {
    // Core workflow state
    currentStep,
    stepResults,
    setStepResults,
    
    // Topic-specific state
    selectedTopic,
    setSelectedTopic,
    strategyCompleted,
    strategySelectionCompleted,
    
    // Loading and progress state
    isLoading,
    
    // Strategy state
    selectedCustomerStrategy,
    contentStrategy,
    
    // Authentication context
    user,
    requireAuth,
    requireSignUp,
    
    // Business logic functions
    generateContent,
    resetWorkflow,
    onAnalysisComplete,
    
    // Web search insights
    webSearchInsights = { researchQuality: 'basic' },
    
    // Configuration
    embedded = false,
    
    // Brand colors helper
    getBrandColors = ComponentHelpers.getBrandColors
  } = props;

  // =============================================================================
  // LOCAL STATE AND HELPERS
  // =============================================================================

  const responsive = ComponentHelpers.getResponsiveStyles();
  const brandColors = getBrandColors(stepResults);
  const analysis = stepResults?.websiteAnalysis || {};
  const availableTopics = stepResults?.trendingTopics || [];

  // CTA state management
  const [organizationCTAs, setOrganizationCTAs] = useState([]);
  const [ctasLoading, setCtasLoading] = useState(false);
  const [hasSufficientCTAs, setHasSufficientCTAs] = useState(false);

  // Manual CTA modal state
  const [showManualCTAModal, setShowManualCTAModal] = useState(false);
  const [manualCTAPromptShown, setManualCTAPromptShown] = useState(false);

  // Fetch CTAs when organization ID is available
  useEffect(() => {
    const fetchCTAs = async () => {
      const orgId = analysis?.organizationId;
      console.log('🎨 [CTA DEBUG] Frontend: Starting CTA fetch:', {
        hasAnalysis: !!analysis,
        organizationId: orgId,
        analysisKeys: analysis ? Object.keys(analysis) : []
      });

      console.log('🚩 [CHECKPOINT 2] Topic Card CTA Fetch:', {
        hasAnalysis: !!analysis,
        hasOrganizationId: !!orgId,
        organizationId: orgId || 'MISSING',
        willFetchCTAs: !!orgId,
        nextStep: orgId ? 'Fetch CTAs from API' : 'ERROR: No org ID - CTAs will not load'
      });

      if (!orgId) {
        console.warn('⚠️ [CTA DEBUG] Frontend: No organizationId found in analysis - skipping CTA fetch:', {
          analysis
        });
        return;
      }

      setCtasLoading(true);
      try {
        console.log('📡 [CTA DEBUG] Frontend: Calling getOrganizationCTAs API:', { organizationId: orgId });

        const response = await api.getOrganizationCTAs(orgId);

        console.log('✅ [CTA DEBUG] Frontend: CTA API response received:', {
          organizationId: orgId,
          ctaCount: response.ctas?.length || 0,
          hasSufficientCTAs: response.has_sufficient_ctas,
          ctas: response.ctas?.map(c => ({ text: c.text, type: c.type }))
        });

        setOrganizationCTAs(response.ctas || []);
        setHasSufficientCTAs(response.has_sufficient_ctas || false);

        console.log('🎨 [CTA DEBUG] Frontend: CTA state updated:', {
          organizationCTAs: response.ctas || [],
          ctaCount: response.ctas?.length || 0,
          hasSufficientCTAs: response.has_sufficient_ctas || false
        });
      } catch (error) {
        console.error('Failed to fetch CTAs:', error);
        console.error('🚨 [CTA DEBUG] Frontend: Failed to fetch CTAs:', {
          organizationId: orgId,
          error: error.message,
          errorDetails: error
        });
        // Silently fail - CTAs are optional
      } finally {
        console.log('🎨 [CTA DEBUG] Frontend: CTA fetch complete:', {
          loading: false,
          organizationId: orgId
        });
        setCtasLoading(false);
      }
    };

    fetchCTAs();
  }, [analysis?.organizationId]);

  // Auto-trigger modal if insufficient CTAs after data loads
  useEffect(() => {
    if (analysis?.organizationId && !manualCTAPromptShown) {
      // Check CTA sufficiency after short delay to allow data to load
      const timer = setTimeout(() => {
        if (organizationCTAs.length < 3 && !ctasLoading) {
          console.log('⚠️ Insufficient CTAs detected after audience selection, prompting for manual entry:', {
            ctaCount: organizationCTAs.length,
            hasSufficientCTAs
          });
          setManualCTAPromptShown(true);
          setShowManualCTAModal(true);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [analysis?.organizationId, organizationCTAs.length, ctasLoading, manualCTAPromptShown, hasSufficientCTAs]);

  // Check if web search enhancement is still in progress
  const hasWebSearchData = analysis.scenarios && analysis.scenarios.length > 0 && 
    analysis.scenarios[0].businessValue && analysis.scenarios[0].targetSegment;
  
  const webSearchStillLoading = availableTopics.length > 0 && !hasWebSearchData;
  
  // Enhanced topics with scenario data
  const enhancedTopics = availableTopics.map((topic, index) => {
    const scenarioData = analysis.scenarios && analysis.scenarios[index] ? analysis.scenarios[index] : null;
    const isWaitingForWebSearch = webSearchStillLoading && !scenarioData;
    return {
      ...topic,
      scenario: scenarioData,
      webSearchLoading: isWaitingForWebSearch,
      isContentLoading: isWaitingForWebSearch || topic.isContentLoading,
      isImageLoading: isWaitingForWebSearch || topic.isImageLoading
    };
  });

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  /**
   * Handle topic selection and content generation
   * EXTRACTED FROM: App.js generateContent() call
   */
  const handleTopicSelection = async (topicId) => {
    await generateContent(topicId);
  };

  /**
   * Handle strategy editing (premium feature)
   * EXTRACTED FROM: App.js edit strategy button logic
   */
  const handleStrategyEdit = () => {
    if (!user) {
      requireSignUp('Edit content strategy', 'Customize your approach');
    } else {
      message.info('Strategy editing will be available after backend integration');
    }
  };

  /**
   * Handle "see more topics" premium gate
   * EXTRACTED FROM: App.js lead generation CTA logic
   */
  const handleSeeMoreTopics = () => {
    if (!user) {
      requireSignUp('Unlock more content ideas', 'Access premium features');
    } else {
      // Premium feature: show more topic ideas
      message.info('Additional topic ideas available with premium access');
    }
  };

  /**
   * Handle manual CTA submission from modal
   */
  const handleManualCTAsSubmit = async (ctas) => {
    try {
      const orgId = analysis?.organizationId;
      if (!orgId) {
        message.error('Organization ID not found');
        return;
      }

      // Submit CTAs to backend
      const response = await api.addManualCTAs(orgId, ctas);

      if (response.success) {
        message.success(`Successfully added ${response.ctas_added} CTAs`);

        // Refresh CTA list
        const updatedCTAs = await api.getOrganizationCTAs(orgId);
        setOrganizationCTAs(updatedCTAs.ctas || []);
        setHasSufficientCTAs(updatedCTAs.has_sufficient_ctas || false);

        // Update parent component if callback exists
        if (onAnalysisComplete) {
          onAnalysisComplete({
            analysis,
            ctas: updatedCTAs.ctas,
            ctaCount: updatedCTAs.count,
            hasSufficientCTAs: updatedCTAs.has_sufficient_ctas
          });
        }

        setShowManualCTAModal(false);
      }
    } catch (error) {
      console.error('Failed to add manual CTAs:', error);
      message.error('Failed to add CTAs. Please try again.');
    }
  };

  /**
   * Handle user choosing to skip manual CTA entry
   */
  const handleSkipManualCTAs = () => {
    message.info('Continuing without additional CTAs');
    setShowManualCTAModal(false);
  };

  // =============================================================================
  // UI HELPER FUNCTIONS
  // =============================================================================

  /**
   * Render loading skeleton for topic generation
   * EXTRACTED FROM: App.js skeleton loading UI
   */
  const renderLoadingSkeleton = () => (
    <div>
      <Paragraph style={{ 
        textAlign: 'center', 
        marginBottom: '30px', 
        color: '#666',
        fontSize: responsive.fontSize.text
      }}>
        {selectedCustomerStrategy ?
          `Topic ideas for people who care about: "${selectedCustomerStrategy.customerProblem}"` :
          systemVoice.topics.ideasHeadline(analysis?.businessType)
        }
      </Paragraph>
      
      {/* Loading skeleton cards */}
      <Row gutter={responsive.gutter}>
        {[1, 2].map((index) => (
          <Col key={index} xs={24} md={12} lg={12}>
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
                    fontSize: responsive.fontSize.small, 
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
                      backgroundColor: brandColors.primary,
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
                {/* Tags skeleton */}
                <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                  {[60, 80, 70, 90].map((width, i) => (
                    <div key={i} style={{ 
                      width: `${width}px`, 
                      height: '22px', 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: '4px', 
                      animation: 'pulse 1.5s ease-in-out infinite' 
                    }}></div>
                  ))}
                </div>
                {/* Title skeleton */}
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
                {/* Description skeleton */}
                {[100, 90].map((width, i) => (
                  <div key={i} style={{ 
                    height: '16px', 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: '4px', 
                    marginBottom: '6px',
                    width: `${width}%`,
                    animation: 'pulse 1.5s ease-in-out infinite' 
                  }}></div>
                ))}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <Button onClick={resetWorkflow} icon={<BulbOutlined />}>
          Start Over
        </Button>
      </div>
    </div>
  );

  /**
   * Render individual topic card with full functionality
   * EXTRACTED FROM: App.js topic card rendering
   */
  const renderTopicCard = (topic) => {
    const isSelected = selectedTopic === topic.id;
    const isGenerating = isLoading && selectedTopic === topic.id;

    // Log CTA rendering state
    console.log('🎨 [CTA DEBUG] Frontend: Rendering CTA section:', {
      ctasLoading,
      organizationCTAsCount: organizationCTAs.length,
      hasSufficientCTAs,
      organizationCTAs: organizationCTAs.map(c => ({ text: c.text, type: c.type }))
    });

    return (
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
                  fontSize: responsive.fontSize.small, 
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
                    backgroundColor: brandColors.primary,
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
            border: isSelected ? `2px solid ${analysis.brandColors.primary}` : '1px solid #f0f0f0',
            margin: '8px 0',
            opacity: topic.isContentLoading ? 0.8 : 1,
            minHeight: '300px'
          }}
        >
          {topic.isContentLoading ? renderTopicLoadingSkeleton() : renderTopicContent(topic, isGenerating)}
        </Card>
      </Col>
    );
  };

  /**
   * Render loading skeleton for topic content
   */
  const renderTopicLoadingSkeleton = () => (
    <div style={{ padding: '16px', minHeight: '120px' }}>
      {/* Tags skeleton */}
      <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
        {[60, 80, 70, 90].map((width, i) => (
          <div key={i} style={{ 
            width: `${width}px`, 
            height: '22px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '4px', 
            animation: 'pulse 1.5s ease-in-out infinite' 
          }}></div>
        ))}
      </div>
      {/* Title skeleton */}
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
      {/* Description skeleton */}
      {[100, 90].map((width, i) => (
        <div key={i} style={{ 
          height: '16px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '4px', 
          marginBottom: '6px',
          width: `${width}%`,
          animation: 'pulse 1.5s ease-in-out infinite' 
        }}></div>
      ))}
    </div>
  );

  /**
   * Render complete topic content with all features
   */
  const renderTopicContent = (topic, isGenerating) => (
    <>
      {/* Topic Tags */}
      <div style={{ marginBottom: '12px' }}>
        <Tag color="blue">{topic.category}</Tag>
        <Tag color="purple">{contentStrategy?.goal || 'awareness'}</Tag>
        <Tag color="orange">{contentStrategy?.voice || 'expert'}</Tag>
        <Tag color="cyan">{contentStrategy?.template || 'problem-solution'}</Tag>
        <Tag color="green">{contentStrategy?.length || 'standard'}</Tag>
      </div>
      
      {/* Topic Title and Description */}
      <Title level={4} style={{ marginBottom: '8px', fontSize: responsive.fontSize.text }}>
        {topic.title}
      </Title>
      <Paragraph style={{ color: '#666', fontSize: responsive.fontSize.small, marginBottom: '12px' }}>
        {topic.subheader}
      </Paragraph>
      
      {/* Why we suggested this (anticipatory UX) */}
      <div data-testid="topic-why-suggested" style={{ marginBottom: '12px' }}>
        <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
          Why we suggested this: {systemVoice.suggestions.getWhySuggestedForTopic(topic)}
        </Text>
      </div>
      
      {/* Traffic Prediction */}
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
      
      {/* Action Buttons */}
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <Button
          type="primary"
          size="large"
          onClick={() => handleTopicSelection(topic.id)}
          loading={isGenerating}
          style={{
            backgroundColor: analysis.brandColors.primary,
            borderColor: analysis.brandColors.primary,
            width: '100%',
            marginBottom: '12px'
          }}
        >
          Get One Free Post
        </Button>
        
        <Button
          size="large"
          icon={user ? <EditOutlined /> : <LockOutlined />}
          onClick={handleStrategyEdit}
          style={{
            width: '100%',
            marginTop: '8px',
            borderColor: analysis.brandColors.primary,
            color: user ? '#52c41a' : analysis.brandColors.primary,
            background: user ? `linear-gradient(135deg, #52c41a05, #52c41a10)` : `linear-gradient(135deg, ${analysis.brandColors.primary}05, ${analysis.brandColors.primary}10)`,
            fontWeight: '500'
          }}
        >
          {user ? '✓ Edit Strategy' : 'Edit Strategy'}
        </Button>
        
        {/* Blog Post Blueprint */}
        <Divider style={{ margin: '20px 0 16px 0' }} />
        
        {renderBlogPostBlueprint(topic)}
      </div>
    </>
  );

  /**
   * Render blog post blueprint section
   * EXTRACTED FROM: App.js blog post blueprint UI
   */
  const renderBlogPostBlueprint = (topic) => (
    <div style={{ 
      padding: '16px',
      backgroundColor: analysis.brandColors.secondary + '20',
      borderRadius: '8px',
      border: `1px solid ${analysis.brandColors.secondary}60`
    }}>
      <div style={{ marginBottom: '12px', textAlign: 'center' }}>
        <Text strong style={{ 
          color: analysis.brandColors.primary, 
          fontSize: responsive.fontSize.text,
          display: 'block',
          marginBottom: '4px'
        }}>
          📋 What You'll Get
        </Text>
        <Text style={{ fontSize: '12px', color: '#666' }}>
          Your blog post will include all these strategic elements
        </Text>
      </div>

      {/* Content Structure */}
      <div style={{ marginBottom: '12px' }}>
        <Text strong style={{ color: analysis.brandColors.primary, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
          📝 Content Structure
        </Text>
        <Text style={{ fontSize: '12px', color: '#666' }}>
          {getContentStructureDescription()}
        </Text>
      </div>

      {/* SEO Keywords */}
      {topic.scenario && topic.scenario.seoKeywords && topic.scenario.seoKeywords.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <Text strong style={{ color: analysis.brandColors.primary, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
            🔑 SEO Keywords Integrated
          </Text>
          <Space wrap size="small">
            {topic.scenario.seoKeywords.slice(0, 3).map((keyword, keywordIndex) => (
              <Tag 
                key={keywordIndex}
                color={analysis.brandColors.primary}
                style={{ fontSize: '11px', borderRadius: '4px' }}
              >
                {keyword}
              </Tag>
            ))}
            {topic.scenario.seoKeywords.length > 3 && (
              <Text style={{ fontSize: '11px', color: '#999' }}>
                +{topic.scenario.seoKeywords.length - 3} more
              </Text>
            )}
          </Space>
        </div>
      )}

      {/* Competitive Positioning */}
      <div style={{ marginBottom: '12px' }}>
        <Text strong style={{ color: analysis.brandColors.primary, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
          🎯 Competitive Edge
        </Text>
        <Text style={{ fontSize: '12px', color: '#666' }}>
          {getCompetitiveEdgeDescription()}
        </Text>
      </div>

      {/* Strategic CTAs */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <Text strong style={{ color: analysis.brandColors.primary, fontSize: '13px' }}>
            🚀 Conversion Elements
          </Text>
          {!hasSufficientCTAs && (
            <Button
              size="small"
              type="link"
              icon={<PlusOutlined />}
              onClick={() => setShowManualCTAModal(true)}
              style={{ fontSize: '12px', padding: 0 }}
            >
              Add More
            </Button>
          )}
        </div>

        {ctasLoading ? (
          <Text style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
            Loading CTAs...
          </Text>
        ) : organizationCTAs.length > 0 ? (
          <div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {organizationCTAs.map((cta, index) => (
                <div key={cta.id || index} style={{ marginBottom: '2px' }}>
                  • {cta.text}
                </div>
              ))}
            </div>
            {!hasSufficientCTAs && organizationCTAs.length < 3 && (
              <Text style={{ fontSize: '11px', color: '#ff4d4f', marginTop: '4px', display: 'block' }}>
                ⚠️ {3 - organizationCTAs.length} more CTA{3 - organizationCTAs.length !== 1 ? 's' : ''} recommended
              </Text>
            )}
          </div>
        ) : (
          <div>
            <Text style={{ fontSize: '12px', color: '#ff4d4f', display: 'block', marginBottom: '4px' }}>
              ⚠️ No CTAs configured yet
            </Text>
            <Text style={{ fontSize: '11px', color: '#999' }}>
              CTAs will be added automatically when modal appears
            </Text>
          </div>
        )}
      </div>

      {/* Content Quality */}
      <div style={{ marginBottom: '0' }}>
        <Text strong style={{ color: analysis.brandColors.primary, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
          ✨ Content Quality
        </Text>
        <Text style={{ fontSize: '12px', color: '#666' }}>
          {getContentQualityDescription()}
        </Text>
      </div>
    </div>
  );

  /**
   * Render empty state when no topics available (with anticipatory suggestion when audience is selected)
   */
  const renderEmptyState = () => {
    const segmentName = selectedCustomerStrategy?.customerProblem || selectedCustomerStrategy?.targetSegment?.demographics;
    const anticipatoryLine = segmentName
      ? systemVoice.suggestions.afterAudience(segmentName, 3)
      : null;
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '60px 20px',
        color: '#666'
      }}>
        <DatabaseOutlined style={{ 
          fontSize: '48px', 
          color: '#d9d9d9', 
          marginBottom: '16px',
          display: 'block'
        }} />
        {anticipatoryLine && (
          <Paragraph style={{ marginBottom: '12px', fontSize: '15px', color: '#333' }}>
            {anticipatoryLine}
          </Paragraph>
        )}
        <Title level={4} style={{ color: '#999', margin: '0 0 8px 0' }}>
          {anticipatoryLine ? systemVoice.topics.generateTopics : 'No Content Ideas Available'}
        </Title>
        <Text style={{ color: '#666' }}>
          {anticipatoryLine ? systemVoice.empty.noTopicsYet : 'No AI-generated topic suggestions found. Please try analyzing your website again.'}
        </Text>
      </div>
    );
  };

  /**
   * Render premium lead generation CTA
   */
  const renderLeadGenerationCTA = () => {
    if (enhancedTopics.length < 1) return null;
    
    return (
      <div style={{ 
        marginTop: '32px', 
        textAlign: 'center',
        padding: '24px',
        background: `linear-gradient(135deg, ${analysis.brandColors.accent}08, ${analysis.brandColors.primary}08)`,
        borderRadius: '12px',
        border: `2px dashed ${analysis.brandColors.accent}40`
      }}>
        <BulbOutlined style={{ 
          fontSize: '32px', 
          color: analysis.brandColors.accent, 
          marginBottom: '12px',
          display: 'block'
        }} />
        <Title level={4} style={{ 
          margin: '0 0 8px 0', 
          color: analysis.brandColors.primary,
          fontSize: responsive.fontSize.text
        }}>
          Want More Content Ideas?
        </Title>
        <Text style={{ 
          fontSize: responsive.fontSize.text, 
          color: '#666',
          display: 'block',
          marginBottom: '20px'
        }}>
          Get {enhancedTopics.length > 2 ? enhancedTopics.length - 2 : 5} more strategic topic ideas with detailed customer psychology insights
        </Text>
        <Button 
          size="large"
          type="primary"
          style={{
            backgroundColor: user ? '#52c41a' : analysis.brandColors.accent,
            borderColor: user ? '#52c41a' : analysis.brandColors.accent,
            color: 'white',
            borderRadius: '8px',
            fontWeight: '500',
            height: '48px',
            padding: '0 32px',
            fontSize: responsive.fontSize.text,
            boxShadow: user ? `0 2px 8px #52c41a30` : `0 2px 8px ${analysis.brandColors.accent}30`
          }}
          onClick={handleSeeMoreTopics}
        >
          {user ? 'See All Your Ideas' : 'Unlock More Ideas'}
        </Button>
      </div>
    );
  };

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  const getContentStructureDescription = () => {
    const template = contentStrategy?.template || 'problem-solution';
    switch (template) {
      case 'problem-solution': return 'Problem identification → Solution framework → Implementation guidance';
      case 'how-to': return 'Step-by-step guide with actionable instructions';
      case 'listicle': return 'Organized list format with detailed explanations';
      case 'case-study': return 'Real-world example with analysis and takeaways';
      default: return 'Comprehensive deep-dive with multiple perspectives';
    }
  };

  const getCompetitiveEdgeDescription = () => {
    const strategy = selectedCustomerStrategy;
    if (!strategy) return 'Establishes thought leadership with unique insights and fresh perspectives';
    if (strategy.conversionPath?.includes('acquisition')) return 'Positions you as the preferred choice for new customers seeking solutions';
    if (strategy.conversionPath?.includes('retention')) return 'Builds deeper relationships with existing customers';
    return 'Establishes thought leadership with unique insights and fresh perspectives';
  };

  const getContentQualityDescription = () => {
    const length = contentStrategy?.length || 'standard';
    const voice = contentStrategy?.voice || 'expert';
    
    let lengthDesc = '';
    switch (length) {
      case 'deep': lengthDesc = '1500+ words of comprehensive, in-depth analysis'; break;
      case 'standard': lengthDesc = '1000-1500 words with balanced depth and readability'; break;
      default: lengthDesc = '800-1000 words focused on quick, actionable insights'; break;
    }
    
    let voiceDesc = '';
    switch (voice) {
      case 'expert': voiceDesc = 'Expert authority tone'; break;
      case 'friendly': voiceDesc = 'Approachable, conversational tone'; break;
      case 'insider': voiceDesc = 'Industry insider perspective'; break;
      default: voiceDesc = 'Engaging storytelling approach'; break;
    }
    
    return `${lengthDesc} • ${voiceDesc}`;
  };

  // =============================================================================
  // VALIDATION AND ERROR HANDLING
  // =============================================================================

  // Only show this step if we're at step 3 or beyond
  if (currentStep < 3) {
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
      <Card style={{ marginBottom: '20px' }}>
        <Title level={3} style={{ 
          textAlign: 'center', 
          marginBottom: '20px',
          fontSize: responsive.fontSize.title
        }}>
          📊 Content Strategy
        </Title>
        
        {/* Loading State: Topic Generation in Progress */}
        {!strategyCompleted && currentStep === 3 ? (
          renderLoadingSkeleton()
        ) : (
          <div>
            <Paragraph style={{ 
              textAlign: 'center', 
              marginBottom: '20px', 
              color: '#666',
              fontSize: responsive.fontSize.text
            }}>
              {systemVoice.topics.ideasHeadline(analysis?.businessType)}
            </Paragraph>
            
            {/* Research Quality Indicators */}
            {webSearchInsights.researchQuality === 'enhanced' && (
              <div style={{
                textAlign: 'center',
                marginBottom: '20px',
                padding: '12px',
                backgroundColor: '#f6ffed',
                borderRadius: '6px',
                border: '1px solid #b7eb8f'
              }}>
                <Text style={{ fontSize: responsive.fontSize.small, color: '#389e0d' }}>
                  🎯 Topics enhanced with current market keyword research and competitive analysis
                </Text>
              </div>
            )}
            
            {webSearchInsights.researchQuality === 'basic' && (
              <div style={{
                textAlign: 'center',
                marginBottom: '20px',
                padding: '12px',
                backgroundColor: '#f5f5f5',
                borderRadius: '6px',
                border: '1px solid #d9d9d9'
              }}>
                <Text style={{ fontSize: responsive.fontSize.small, color: '#666' }}>
                  💡 Upgrade for keyword research and trending topic insights
                </Text>
              </div>
            )}
            
            {/* Web Search Enhancement Progress Indicator */}
            {webSearchStillLoading && (
              <div style={{
                textAlign: 'center',
                marginBottom: '20px',
                padding: '12px',
                backgroundColor: '#e6f7ff',
                borderRadius: '6px',
                border: '1px solid #91d5ff'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div style={{ 
                    fontSize: '16px',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}>
                    🔍
                  </div>
                  <Text style={{ fontSize: responsive.fontSize.small, color: '#1890ff', fontWeight: 500 }}>
                    Enhancing topics with web search data...
                  </Text>
                </div>
                <Text style={{ fontSize: '11px', color: '#666', marginTop: '4px', display: 'block' }}>
                  Analyzing search volumes, competitive intelligence, and customer insights
                </Text>
              </div>
            )}
            
            {/* Topic Cards or Empty State */}
            {enhancedTopics.length === 0 ? (
              renderEmptyState()
            ) : (
              <div>
                <Row gutter={responsive.gutter}>
                  {enhancedTopics.slice(0, 2).map(renderTopicCard)}
                </Row>
                
                {/* Lead Generation CTA */}
                {renderLeadGenerationCTA()}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Manual CTA Input Modal */}
      <ManualCTAInputModal
        visible={showManualCTAModal}
        onCancel={() => setShowManualCTAModal(false)}
        onSubmit={handleManualCTAsSubmit}
        onSkip={handleSkipManualCTAs}
        existingCTAs={organizationCTAs}
        minCTAs={3}
        websiteName={analysis?.businessName || 'your website'}
      />

      {/* CSS animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
};

TopicSelectionStepV2.displayName = 'TopicSelectionStepV2';

export default TopicSelectionStepV2;