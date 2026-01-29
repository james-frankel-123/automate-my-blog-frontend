import React from 'react';
import { Card, Button, Row, Col, Typography, Tag, message } from 'antd';
import { 
  CheckOutlined, 
  BulbOutlined, 
  DatabaseOutlined, 
  LockOutlined 
} from '@ant-design/icons';
import { ComponentHelpers } from '../interfaces/WorkflowComponentInterface';
import { useAnalytics } from '../../../contexts/AnalyticsContext';

const { Title, Text, Paragraph } = Typography;

/**
 * CustomerStrategyStep v2
 * Complete step component with strategy selection UI and business metrics
 * EXTRACTED AND ENHANCED FROM: App.js step 2 customer strategy selection logic
 */
const CustomerStrategyStepV2 = (props) => {
  // =============================================================================
  // PROPS DESTRUCTURING WITH VALIDATION
  // =============================================================================

  const {
    // Core workflow state
    currentStep,
    setCurrentStep,
    stepResults,
    setStepResults,
    
    // Strategy-specific state
    selectedCustomerStrategy,
    setSelectedCustomerStrategy,
    strategySelectionCompleted,
    setStrategySelectionCompleted,
    
    // UI control state
    demoMode = false,
    
    // Authentication context
    user,
    requireAuth,
    requireSignUp,
    
    // Business logic functions
    generateTopics,
    
    // Web search insights
    webSearchInsights = { researchQuality: 'basic' },
    
    // Configuration
    embedded = false,
    
    // Default colors helper
    getDefaultColors = ComponentHelpers.getDefaultColors
  } = props;

  // =============================================================================
  // LOCAL STATE AND HELPERS
  // =============================================================================

  const responsive = ComponentHelpers.getResponsiveStyles();
  const defaultColors = getDefaultColors();
  const analysis = stepResults?.websiteAnalysis || {};
  const scenarios = analysis.scenarios || [];
  const { trackEvent } = useAnalytics();

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  /**
   * Handle strategy selection
   * EXTRACTED FROM: App.js strategy card onClick logic
   */
  const handleStrategySelection = (scenario, index) => {
    setSelectedCustomerStrategy({
      ...scenario,
      index: index
    });
    
    // Track strategy_selected event
    trackEvent('strategy_selected', {
      strategyIndex: index,
      strategyName: scenario.name || `Strategy ${index + 1}`,
      targetAudience: scenario.targetAudience
    }).catch(err => console.error('Failed to track strategy_selected:', err));
  };

  /**
   * Continue to topic generation
   * EXTRACTED FROM: App.js continue button logic
   */
  const continueToTopicGeneration = async () => {
    setStrategySelectionCompleted(true);
    setCurrentStep(3);
    
    // Track workflow step completion
    trackEvent('workflow_step_completed', {
      step: 'strategy_selection',
      strategyIndex: selectedCustomerStrategy?.index
    }).catch(err => console.error('Failed to track workflow_step_completed:', err));
    
    // Auto-start topic generation based on selected strategy
    setTimeout(async () => {
      await generateTopics();
    }, 500);
  };

  /**
   * Show more strategies (premium feature)
   * EXTRACTED FROM: App.js "See More Strategies" gate logic
   */
  const showMoreStrategies = () => {
    if (demoMode) {
      message.info('Demo mode: Showing all strategies');
      // In demo mode, show all strategies
      // This would expand the view to show all available scenarios
    } else {
      if (!user) {
        requireSignUp('View more customer strategies', 'Access premium features');
      } else {
        message.info('More strategies will be available after backend integration');
      }
    }
  };

  // =============================================================================
  // UI HELPER FUNCTIONS
  // =============================================================================

  /**
   * Render individual strategy card
   * EXTRACTED FROM: App.js strategy card rendering logic
   */
  const renderStrategyCard = (scenario, index) => {
    const isSelected = selectedCustomerStrategy?.index === index;
    const isOthersSelected = selectedCustomerStrategy && !isSelected;

    return (
      <Col key={index} xs={24} md={12}>
        <Card
          hoverable
          style={{
            border: isSelected ? `2px solid ${defaultColors.primary}` : '1px solid #f0f0f0',
            borderRadius: '12px',
            minHeight: '300px',
            cursor: 'pointer',
            opacity: isOthersSelected ? 0.5 : 1,
            transition: 'all 0.3s ease'
          }}
          onClick={() => handleStrategySelection(scenario, index)}
        >
          {/* Card Header */}
          <div style={{ marginBottom: '16px' }}>
            <Tag color={defaultColors.primary} style={{ marginBottom: '8px' }}>
              Strategy {index + 1}
            </Tag>
            {isSelected && (
              <CheckOutlined style={{ 
                float: 'right', 
                color: defaultColors.primary, 
                fontSize: '16px' 
              }} />
            )}
          </div>
          
          {/* Target Segment Section */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <Title level={4} style={{ 
                margin: 0, 
                color: defaultColors.primary,
                fontSize: responsive.fontSize.text
              }}>
                👥 Target Segment
              </Title>
              {scenario.businessValue?.priority === 1 && (
                <span style={{
                  backgroundColor: '#ff4d4f',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  RECOMMENDED
                </span>
              )}
            </div>
            
            {/* Demographics */}
            <div style={{ fontSize: responsive.fontSize.small, color: '#666', marginBottom: '8px' }}>
              {scenario.targetSegment?.demographics || analysis.decisionMakers || 'Target Audience'}
            </div>
            
            {/* Enhanced Data Availability Warning */}
            {!scenario.targetSegment && !scenario.businessValue && (
              <div style={{ 
                fontSize: '11px', 
                color: '#d46b08',
                backgroundColor: '#fff7e6',
                padding: '4px 8px',
                borderRadius: '4px',
                marginBottom: '8px',
                border: '1px solid #ffd591'
              }}>
                ⚠️ Enhanced targeting data unavailable
              </div>
            )}
            
            {/* Business Value Indicators */}
            {scenario.businessValue ? (
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '6px',
                marginBottom: '8px'
              }}>
                {scenario.businessValue.searchVolume && (
                  <span style={{
                    backgroundColor: '#f6ffed',
                    color: '#389e0d',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    border: '1px solid #b7eb8f'
                  }}>
                    📊 {scenario.businessValue.searchVolume}
                  </span>
                )}
                {scenario.businessValue.conversionPotential && (
                  <span style={{
                    backgroundColor: scenario.businessValue.conversionPotential === 'High' ? '#f6ffed' : '#fff7e6',
                    color: scenario.businessValue.conversionPotential === 'High' ? '#389e0d' : '#d46b08',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    border: `1px solid ${scenario.businessValue.conversionPotential === 'High' ? '#b7eb8f' : '#ffd591'}`
                  }}>
                    💰 {scenario.businessValue.conversionPotential} Value
                  </span>
                )}
              </div>
            ) : (
              <div style={{ 
                fontSize: '11px', 
                color: '#999',
                marginBottom: '8px'
              }}>
                📊 Business metrics unavailable - web search data not loaded
              </div>
            )}
            
            {/* Psychographics */}
            {scenario.targetSegment?.psychographics && (
              <div style={{ 
                fontSize: '12px', 
                color: '#888',
                fontStyle: 'italic',
                lineHeight: '1.3'
              }}>
                {scenario.targetSegment.psychographics}
              </div>
            )}
          </div>
          
          {/* Customer Problem Section */}
          <div style={{ marginBottom: '12px' }}>
            <Text strong style={{ color: '#333', fontSize: responsive.fontSize.small }}>
              🔍 Customer Problem:
            </Text>
            <br />
            <Text style={{ fontSize: responsive.fontSize.small, lineHeight: '1.4' }}>
              {scenario.customerProblem}
            </Text>
          </div>
          
          {/* Customer Language/Search Terms */}
          {scenario.customerLanguage && scenario.customerLanguage.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <Text strong style={{ color: '#333', fontSize: responsive.fontSize.small }}>
                💬 How They Search:
              </Text>
              <div style={{ marginTop: '6px' }}>
                {scenario.customerLanguage.slice(0, 2).map((term, termIndex) => (
                  <Tag 
                    key={termIndex} 
                    style={{ 
                      fontSize: '11px', 
                      borderRadius: '4px',
                      marginBottom: '4px'
                    }}
                    color="blue"
                  >
                    "{term}"
                  </Tag>
                ))}
              </div>
            </div>
          )}
          
          {/* Business Opportunity Section */}
          <div>
            <Text strong style={{ color: '#333', fontSize: responsive.fontSize.small }}>
              📈 Business Opportunity:
            </Text>
            <br />
            <Text style={{ fontSize: responsive.fontSize.small, lineHeight: '1.4', color: '#666' }}>
              {scenario.conversionPath || 'Educational blog post leading to consultation inquiries.'}
            </Text>
            
            {/* Additional Business Metrics */}
            {scenario.businessValue && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
                {scenario.businessValue.competition && (
                  <div>Competition: {scenario.businessValue.competition}</div>
                )}
                {scenario.targetSegment?.searchBehavior && (
                  <div>Search Pattern: {scenario.targetSegment.searchBehavior}</div>
                )}
              </div>
            )}
          </div>
        </Card>
      </Col>
    );
  };

  /**
   * Render empty state when no strategies available
   */
  const renderEmptyState = () => (
    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
      <DatabaseOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
      <Title level={4} style={{ color: '#999' }}>No Customer Strategies Found</Title>
      <Text>Please re-run website analysis to generate customer strategies.</Text>
    </div>
  );

  /**
   * Render premium gate for additional strategies
   */
  const renderPremiumGate = () => {
    if (scenarios.length <= 2) return null;
    
    return (
      <div style={{ 
        textAlign: 'center', 
        marginTop: '24px',
        padding: '20px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        border: '2px dashed #d9d9d9'
      }}>
        <Text style={{ fontSize: '14px', color: '#666', marginBottom: '12px', display: 'block' }}>
          💡 Want to see {scenarios.length - 2} more targeted strategies?
        </Text>
        <Button
          type="primary"
          onClick={showMoreStrategies}
          style={{
            backgroundColor: analysis.brandColors.accent,
            borderColor: analysis.brandColors.accent
          }}
          icon={<LockOutlined />}
        >
          See More Strategies
        </Button>
      </div>
    );
  };

  // =============================================================================
  // VALIDATION AND ERROR HANDLING
  // =============================================================================

  // Only show this step if we're at step 2 or beyond
  if (currentStep < 2) {
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
          🎯 Choose Your Target Strategy
        </Title>
        
        <Paragraph style={{ 
          textAlign: 'center', 
          marginBottom: '20px', 
          color: '#666',
          fontSize: responsive.fontSize.text
        }}>
          Based on your website analysis, here are the top customer strategies ranked by business opportunity. 
          Select the audience you want to target with your content.
        </Paragraph>
        
        {/* Research Quality Indicators */}
        {webSearchInsights.researchQuality === 'enhanced' ? (
          <div style={{
            textAlign: 'center',
            marginBottom: '24px',
            padding: '12px',
            backgroundColor: '#f6ffed',
            borderRadius: '6px',
            border: '1px solid #b7eb8f'
          }}>
            <Text style={{ fontSize: responsive.fontSize.small, color: '#389e0d' }}>
              🎯 Strategies ranked using web search data: search volumes, competitive analysis, and conversion potential
            </Text>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            marginBottom: '24px',
            padding: '12px',
            backgroundColor: '#fff7e6',
            borderRadius: '6px',
            border: '1px solid #ffd591'
          }}>
            <Text style={{ fontSize: responsive.fontSize.small, color: '#d46b08' }}>
              ⚠️ Enhanced ranking data not available - strategies shown in default order. Upgrade for search volume analysis and competitive intelligence.
            </Text>
          </div>
        )}
        
        {/* Strategy Cards or Empty State */}
        {scenarios.length === 0 ? (
          renderEmptyState()
        ) : (
          <div>
            {/* Strategy Selection Cards */}
            <Row gutter={responsive.gutter}>
              {scenarios.slice(0, 2).map((scenario, index) => renderStrategyCard(scenario, index))}
            </Row>
            
            {/* Premium Gate for Additional Strategies */}
            {renderPremiumGate()}
            
            {/* Continue Button */}
            {selectedCustomerStrategy && (
              <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={continueToTopicGeneration}
                  style={{
                    backgroundColor: analysis.brandColors.primary,
                    borderColor: analysis.brandColors.primary,
                    minWidth: '200px'
                  }}
                  icon={<BulbOutlined />}
                >
                  Generate Content Ideas
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

CustomerStrategyStepV2.displayName = 'CustomerStrategyStepV2';

export default CustomerStrategyStepV2;