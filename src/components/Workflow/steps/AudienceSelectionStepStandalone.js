import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Typography, Tag, message } from 'antd';
import { 
  CheckOutlined, 
  BulbOutlined, 
  DatabaseOutlined, 
  LockOutlined,
  UserOutlined
} from '@ant-design/icons';
import { ComponentHelpers } from '../interfaces/WorkflowComponentInterface';

const { Title, Text, Paragraph } = Typography;

/**
 * Standalone Audience Selection Step Component
 * Reusable component for customer strategy/audience selection
 * Can be used in Audience tab, New Post workflow, and other locations
 */
const AudienceSelectionStepStandalone = ({
  // Core state
  analysisResults,
  webSearchInsights,
  selectedCustomerStrategy,
  setSelectedCustomerStrategy,
  strategySelectionCompleted,
  setStrategySelectionCompleted,
  
  // User context
  user,
  requireAuth,
  
  // Event handlers
  onStrategySelected,
  onContinue,
  
  // Configuration
  embedded = false,
  showTitle = true,
  showContinueButton = true,
  autoAdvance = false,
  maxStrategies = 2,
  
  // Style overrides
  cardStyle = {},
  className = '',
  
  // Default helpers
  getDefaultColors = ComponentHelpers.getDefaultColors
}) => {
  
  // =============================================================================
  // LOCAL STATE AND HELPERS
  // =============================================================================
  
  const responsive = ComponentHelpers.getResponsiveStyles();
  const defaultColors = getDefaultColors();
  const analysis = analysisResults || {};
  const scenarios = analysis.scenarios || [];
  
  // Local state for selection if parent doesn't manage it
  const [localSelectedStrategy, setLocalSelectedStrategy] = useState(null);
  const currentSelectedStrategy = selectedCustomerStrategy !== undefined ? 
    selectedCustomerStrategy : localSelectedStrategy;
  
  // Auto-advance when strategy is selected
  useEffect(() => {
    if (autoAdvance && currentSelectedStrategy && !strategySelectionCompleted) {
      const timer = setTimeout(() => {
        handleContinue();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoAdvance, currentSelectedStrategy, strategySelectionCompleted]);
  
  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  
  /**
   * Handle strategy selection
   */
  const handleStrategySelection = (scenario, index) => {
    const strategy = {
      ...scenario,
      index: index
    };
    
    // Update state (local or parent)
    if (setSelectedCustomerStrategy) {
      setSelectedCustomerStrategy(strategy);
    } else {
      setLocalSelectedStrategy(strategy);
    }
    
    // Notify parent component
    onStrategySelected && onStrategySelected(strategy, scenario, index);
    
    message.success(`Selected strategy for: ${scenario.customerProblem}`);
  };
  
  /**
   * Continue to next step
   */
  const handleContinue = () => {
    if (!currentSelectedStrategy) {
      message.warning('Please select a strategy first');
      return;
    }
    
    setStrategySelectionCompleted && setStrategySelectionCompleted(true);
    onContinue && onContinue(currentSelectedStrategy);
  };
  
  /**
   * Show more strategies (premium feature)
   */
  const showMoreStrategies = () => {
    if (requireAuth) {
      requireAuth('View additional customer strategies', 'premium-gate');
    } else {
      message.info('Sign in to view additional customer strategies');
    }
  };
  
  // =============================================================================
  // RENDER HELPERS
  // =============================================================================
  
  /**
   * Render individual strategy card
   */
  const renderStrategyCard = (scenario, index) => {
    const isSelected = currentSelectedStrategy?.index === index;
    const isOthersSelected = currentSelectedStrategy && !isSelected;

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
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
      <UserOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px', display: 'block' }} />
      <Title level={4} style={{ color: '#999', margin: '0 0 8px 0' }}>
        No Customer Strategies Available
      </Title>
      <Text>Complete website analysis first to generate targeted customer strategies.</Text>
    </div>
  );

  /**
   * Render premium gate for additional strategies
   */
  const renderPremiumGate = () => {
    if (scenarios.length <= maxStrategies) return null;
    
    return (
      <div style={{ 
        textAlign: 'center', 
        marginTop: '32px',
        padding: '24px',
        backgroundColor: '#f9f9f9',
        borderRadius: '12px',
        border: '2px dashed #d9d9d9'
      }}>
        <BulbOutlined style={{ fontSize: '24px', color: '#d9d9d9', marginBottom: '12px' }} />
        <Text style={{ fontSize: '14px', color: '#666', marginBottom: '12px', display: 'block' }}>
          💡 Want to see {scenarios.length - maxStrategies} more targeted strategies?
        </Text>
        <Button
          type="primary"
          onClick={showMoreStrategies}
          style={{
            backgroundColor: analysis.brandColors?.accent || defaultColors.primary,
            borderColor: analysis.brandColors?.accent || defaultColors.primary
          }}
          icon={<LockOutlined />}
        >
          See More Strategies
        </Button>
      </div>
    );
  };

  /**
   * Render research quality indicator
   */
  const renderResearchQualityIndicator = () => {
    if (!webSearchInsights) return null;

    return webSearchInsights.researchQuality === 'enhanced' ? (
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
            🎯 Choose Your Target Strategy
          </Title>
        )}
        
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
        {renderResearchQualityIndicator()}
        
        {/* Strategy Cards or Empty State */}
        {scenarios.length === 0 ? (
          renderEmptyState()
        ) : (
          <div>
            {/* Strategy Selection Cards */}
            <Row gutter={responsive.gutter}>
              {scenarios.slice(0, maxStrategies).map((scenario, index) => renderStrategyCard(scenario, index))}
            </Row>
            
            {/* Premium Gate for Additional Strategies */}
            {renderPremiumGate()}
            
            {/* Continue Button */}
            {showContinueButton && currentSelectedStrategy && (
              <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleContinue}
                  style={{
                    backgroundColor: analysis.brandColors?.primary || defaultColors.primary,
                    borderColor: analysis.brandColors?.primary || defaultColors.primary,
                    minWidth: '200px'
                  }}
                  icon={<BulbOutlined />}
                >
                  Continue to Content Ideas
                </Button>
              </div>
            )}
            
            {/* Selected Strategy Summary */}
            {currentSelectedStrategy && (
              <div style={{ 
                marginTop: '20px',
                padding: '12px',
                backgroundColor: '#f0f8ff',
                borderRadius: '6px',
                border: '1px solid #d6e7ff'
              }}>
                <Text strong style={{ color: defaultColors.primary }}>
                  Selected Strategy:
                </Text>
                <Text style={{ marginLeft: '8px' }}>
                  {currentSelectedStrategy.customerProblem}
                </Text>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AudienceSelectionStepStandalone;