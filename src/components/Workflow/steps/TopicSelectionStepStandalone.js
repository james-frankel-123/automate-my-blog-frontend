import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Typography, Tag, Divider, Space, message, Spin } from 'antd';
import { 
  DatabaseOutlined,
  BulbOutlined,
  EditOutlined,
  LockOutlined,
  EyeOutlined,
  CheckOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { ComponentHelpers } from '../interfaces/WorkflowComponentInterface';
import { topicAPI } from '../../../services/workflowAPI';
import { useAnalytics } from '../../../contexts/AnalyticsContext';

const { Title, Text, Paragraph } = Typography;

/**
 * Standalone Topic Selection Step Component
 * Reusable component with enhanced topic cards, blog post blueprints, and full functionality
 * Can be used in Posts tab, New Post workflow, and other locations
 */
const TopicSelectionStepStandalone = ({
  // Core state
  analysisResults,
  selectedCustomerStrategy,
  availableTopics,
  setAvailableTopics,
  selectedTopic,
  setSelectedTopic,
  webSearchInsights,
  contentStrategy,
  
  // Loading states
  isLoading,
  setIsLoading,
  topicsGenerated,
  setTopicsGenerated,
  
  // User context
  user,
  requireAuth,
  
  // Event handlers
  onTopicSelected,
  onGenerateTopics,
  onStartOver,
  
  // Configuration
  embedded = false,
  showTitle = true,
  showGenerateButton = true,
  autoGenerate = false,
  maxTopics = 2,
  
  // Style overrides
  cardStyle = {},
  className = '',
  
  // Default helpers
  getBrandColors = ComponentHelpers.getBrandColors,
  getDefaultColors = ComponentHelpers.getDefaultColors
}) => {
  
  // =============================================================================
  // LOCAL STATE AND HELPERS
  // =============================================================================
  
  const responsive = ComponentHelpers.getResponsiveStyles();
  const brandColors = getBrandColors({ websiteAnalysis: analysisResults });
  const defaultColors = getDefaultColors();
  const analysis = analysisResults || {};
  const { trackEvent } = useAnalytics();
  
  // Local state management if parent doesn't provide it
  const [localAvailableTopics, setLocalAvailableTopics] = useState([]);
  const [localSelectedTopic, setLocalSelectedTopic] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [localTopicsGenerated, setLocalTopicsGenerated] = useState(false);
  
  const currentTopics = availableTopics !== undefined ? availableTopics : localAvailableTopics;
  const currentSelectedTopic = selectedTopic !== undefined ? selectedTopic : localSelectedTopic;
  const loading = isLoading !== undefined ? isLoading : localLoading;
  const generated = topicsGenerated !== undefined ? topicsGenerated : localTopicsGenerated;
  
  // Auto-generate topics on mount if requested
  useEffect(() => {
    if (autoGenerate && analysisResults && !generated && !loading && currentTopics.length === 0) {
      handleGenerateTopics();
    }
  }, [autoGenerate, analysisResults, generated, loading, currentTopics.length]);
  
  // Enhanced topics with scenario data
  const enhancedTopics = currentTopics.map((topic, index) => {
    const scenarioData = analysis.scenarios && analysis.scenarios[index] ? analysis.scenarios[index] : null;
    const isWaitingForWebSearch = loading && !scenarioData;
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
   * Generate trending topics
   */
  const handleGenerateTopics = async () => {
    if (!analysisResults) {
      message.warning('Please complete website analysis first');
      return;
    }
    
    const updateLoading = setIsLoading || setLocalLoading;
    const updateTopics = setAvailableTopics || setLocalAvailableTopics;
    const updateGenerated = setTopicsGenerated || setLocalTopicsGenerated;
    
    updateLoading(true);
    
    // Track topic_generation_started event
    trackEvent('topic_generated', {
      strategySelected: !!selectedCustomerStrategy,
      strategyIndex: selectedCustomerStrategy?.index
    }).catch(err => console.error('Failed to track topic_generated:', err));
    
    try {
      const result = await topicAPI.generateTrendingTopics(
        analysisResults,
        selectedCustomerStrategy,
        webSearchInsights || { researchQuality: 'basic' }
      );
      
      if (result.success) {
        updateTopics(result.topics);
        updateGenerated(true);
        
        if (result.isFallback) {
          message.warning(result.message);
        } else {
          message.success(result.message);
        }
        
        onGenerateTopics && onGenerateTopics(result.topics);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Topic generation error:', error);
      message.error(`Failed to generate topics: ${error.message}`);
    } finally {
      updateLoading(false);
    }
  };
  
  /**
   * Handle topic selection
   */
  const handleTopicSelection = async (topicId) => {
    const topic = currentTopics.find(t => t.id === topicId);
    if (!topic) return;
    
    const updateSelectedTopic = setSelectedTopic || setLocalSelectedTopic;
    updateSelectedTopic(topic);
    
    // Track topic_selected event
    trackEvent('topic_selected', {
      topicId: topicId,
      topicTitle: topic.title,
      topicType: topic.type
    }).catch(err => console.error('Failed to track topic_selected:', err));
    
    // Track workflow step completion
    trackEvent('workflow_step_completed', {
      step: 'topic_selection',
      topicId: topicId
    }).catch(err => console.error('Failed to track workflow_step_completed:', err));
    
    message.success(`Selected topic: ${topic.title}`);
    onTopicSelected && onTopicSelected(topic, topicId);
  };
  
  /**
   * Handle strategy editing (premium feature)
   */
  const handleStrategyEdit = () => {
    // Track strategy_edited event
    trackEvent('strategy_edited', {
      fromStep: 'topic_selection'
    }).catch(err => console.error('Failed to track strategy_edited:', err));
    
    if (requireAuth) {
      requireAuth('Edit content strategy', 'premium-gate');
    } else {
      message.info('Sign in to edit content strategy');
    }
  };
  
  /**
   * Handle "see more topics" premium gate
   */
  const handleSeeMoreTopics = () => {
    // Track topic_regenerated event
    trackEvent('topic_regenerated', {
      currentTopicCount: currentTopics.length
    }).catch(err => console.error('Failed to track topic_regenerated:', err));
    
    if (requireAuth) {
      requireAuth('View additional content ideas', 'premium-gate');
    } else {
      message.info('Sign in to view additional content ideas');
    }
  };
  
  /**
   * Handle start over
   */
  const handleStartOver = () => {
    const updateTopics = setAvailableTopics || setLocalAvailableTopics;
    const updateSelectedTopic = setSelectedTopic || setLocalSelectedTopic;
    const updateGenerated = setTopicsGenerated || setLocalTopicsGenerated;
    
    updateTopics([]);
    updateSelectedTopic(null);
    updateGenerated(false);
    
    onStartOver && onStartOver();
    message.info('Reset topic generation. You can start fresh.');
  };
  
  // =============================================================================
  // RENDER HELPERS
  // =============================================================================
  
  /**
   * Render loading skeleton for topic generation
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
          `Creating targeted blog post ideas for customers struggling with: "${selectedCustomerStrategy.customerProblem}"` :
          `Based on your ${analysis.businessType ? analysis.businessType.toLowerCase() : 'business'} analysis, here are high-impact blog post ideas:`
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
                      backgroundColor: brandColors.primary || defaultColors.primary,
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
        <Button onClick={handleStartOver} icon={<BulbOutlined />}>
          Start Over
        </Button>
      </div>
    </div>
  );
  
  /**
   * Render individual topic card with full functionality
   */
  const renderTopicCard = (topic) => {
    const isSelected = currentSelectedTopic?.id === topic.id;
    const isGenerating = loading && currentSelectedTopic?.id === topic.id;

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
                    backgroundColor: brandColors.primary || defaultColors.primary,
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
            border: isSelected ? `2px solid ${brandColors.primary || defaultColors.primary}` : '1px solid #f0f0f0',
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
        {topic.subheader || topic.description}
      </Paragraph>
      
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
            backgroundColor: brandColors.primary || defaultColors.primary,
            borderColor: brandColors.primary || defaultColors.primary,
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
            borderColor: brandColors.primary || defaultColors.primary,
            color: user ? '#52c41a' : brandColors.primary || defaultColors.primary,
            background: user ? 
              `linear-gradient(135deg, #52c41a05, #52c41a10)` : 
              `linear-gradient(135deg, ${brandColors.primary || defaultColors.primary}05, ${brandColors.primary || defaultColors.primary}10)`,
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
   */
  const renderBlogPostBlueprint = (topic) => (
    <div style={{ 
      padding: '16px',
      backgroundColor: (brandColors.secondary || defaultColors.secondary) + '20',
      borderRadius: '8px',
      border: `1px solid ${(brandColors.secondary || defaultColors.secondary)}60`
    }}>
      <div style={{ marginBottom: '12px', textAlign: 'center' }}>
        <Text strong style={{ 
          color: brandColors.primary || defaultColors.primary, 
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
        <Text strong style={{ color: brandColors.primary || defaultColors.primary, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
          📝 Content Structure
        </Text>
        <Text style={{ fontSize: '12px', color: '#666' }}>
          Problem identification → Solution framework → Implementation guidance
        </Text>
      </div>

      {/* SEO Keywords */}
      {topic.scenario && topic.scenario.seoKeywords && topic.scenario.seoKeywords.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <Text strong style={{ color: brandColors.primary || defaultColors.primary, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
            🔑 SEO Keywords Integrated
          </Text>
          <Space wrap size="small">
            {topic.scenario.seoKeywords.slice(0, 3).map((keyword, keywordIndex) => (
              <Tag 
                key={keywordIndex}
                color={brandColors.primary || defaultColors.primary}
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
        <Text strong style={{ color: brandColors.primary || defaultColors.primary, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
          🎯 Competitive Edge
        </Text>
        <Text style={{ fontSize: '12px', color: '#666' }}>
          Establishes thought leadership with unique insights and fresh perspectives
        </Text>
      </div>

      {/* Strategic CTAs */}
      <div style={{ marginBottom: '12px' }}>
        <Text strong style={{ color: brandColors.primary || defaultColors.primary, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
          🚀 Conversion Elements
        </Text>
        <Text style={{ fontSize: '12px', color: '#666' }}>
          {analysis.websiteGoals 
            ? `Strategic CTAs driving toward: ${analysis.websiteGoals.toLowerCase()}`
            : `CTAs aligned with your primary business objectives and customer journey`
          }
        </Text>
      </div>

      {/* Content Quality */}
      <div style={{ marginBottom: '0' }}>
        <Text strong style={{ color: brandColors.primary || defaultColors.primary, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
          ✨ Content Quality
        </Text>
        <Text style={{ fontSize: '12px', color: '#666' }}>
          1000-1500 words with balanced depth and readability • Expert authority tone
        </Text>
      </div>
    </div>
  );

  /**
   * Render empty state when no topics available
   */
  const renderEmptyState = () => (
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
      <Title level={4} style={{ color: '#999', margin: '0 0 8px 0' }}>
        No Content Ideas Available
      </Title>
      <Text style={{ color: '#666' }}>
        Generate AI-powered topic suggestions based on your website analysis.
      </Text>
      {showGenerateButton && (
        <div style={{ marginTop: '20px' }}>
          <Button 
            type="primary"
            size="large"
            onClick={handleGenerateTopics}
            icon={<BulbOutlined />}
            style={{
              backgroundColor: brandColors.primary || defaultColors.primary,
              borderColor: brandColors.primary || defaultColors.primary
            }}
          >
            Generate Content Topics
          </Button>
        </div>
      )}
    </div>
  );

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
        background: `linear-gradient(135deg, ${(brandColors.accent || defaultColors.primary)}08, ${(brandColors.primary || defaultColors.primary)}08)`,
        borderRadius: '12px',
        border: `2px dashed ${(brandColors.accent || defaultColors.primary)}40`
      }}>
        <BulbOutlined style={{ 
          fontSize: '32px', 
          color: brandColors.accent || defaultColors.primary, 
          marginBottom: '12px',
          display: 'block'
        }} />
        <Title level={4} style={{ 
          margin: '0 0 8px 0', 
          color: brandColors.primary || defaultColors.primary,
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
            backgroundColor: user ? '#52c41a' : brandColors.accent || defaultColors.primary,
            borderColor: user ? '#52c41a' : brandColors.accent || defaultColors.primary,
            color: 'white',
            borderRadius: '8px',
            fontWeight: '500',
            height: '48px',
            padding: '0 32px',
            fontSize: responsive.fontSize.text,
            boxShadow: user ? `0 2px 8px #52c41a30` : `0 2px 8px ${(brandColors.accent || defaultColors.primary)}30`
          }}
          onClick={handleSeeMoreTopics}
        >
          {user ? 'See All Your Ideas' : 'Unlock More Ideas'}
        </Button>
      </div>
    );
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className={className} style={{ width: '100%' }}>
      <Card style={{ ...cardStyle }}>
        {showTitle && (
          <Title level={3} style={{ 
            textAlign: 'center', 
            marginBottom: '20px',
            fontSize: responsive.fontSize.title
          }}>
            📊 Content Strategy
          </Title>
        )}
        
        {/* Loading State: Topic Generation in Progress */}
        {!generated && loading ? (
          renderLoadingSkeleton()
        ) : (
          <div>
            {/* Generate Topics Section */}
            {!generated && showGenerateButton && (
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <Button 
                  type="primary" 
                  size="large"
                  onClick={handleGenerateTopics}
                  loading={loading}
                  icon={<BulbOutlined />}
                  style={{
                    backgroundColor: brandColors.primary || defaultColors.primary,
                    borderColor: brandColors.primary || defaultColors.primary
                  }}
                >
                  {loading ? 'Generating Topics...' : 'Generate Content Topics'}
                </Button>
              </div>
            )}
            
            {/* Topics Display */}
            {generated && (
              <div>
                <Paragraph style={{ 
                  textAlign: 'center', 
                  marginBottom: '20px', 
                  color: '#666',
                  fontSize: responsive.fontSize.text
                }}>
                  Based on your {analysis.businessType ? analysis.businessType.toLowerCase() : 'business'} analysis, here are high-impact blog post ideas:
                </Paragraph>
                
                {/* Topic Cards or Empty State */}
                {enhancedTopics.length === 0 ? (
                  renderEmptyState()
                ) : (
                  <div>
                    <Row gutter={responsive.gutter}>
                      {enhancedTopics.slice(0, maxTopics).map(renderTopicCard)}
                    </Row>
                    
                    {/* Lead Generation CTA */}
                    {renderLeadGenerationCTA()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

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

export default TopicSelectionStepStandalone;