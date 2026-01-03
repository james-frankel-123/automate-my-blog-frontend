import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Typography, Tag, Statistic, Space, message } from 'antd';
import { UserOutlined, TeamOutlined, BulbOutlined, CheckOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTabMode } from '../../hooks/useTabMode';
import { useWorkflowMode } from '../../contexts/WorkflowModeContext';
import UnifiedWorkflowHeader from './UnifiedWorkflowHeader';
import { ComponentHelpers } from '../Workflow/interfaces/WorkflowComponentInterface';
import autoBlogAPI from '../../services/api';

const { Title, Text, Paragraph } = Typography;


const AudienceSegmentsTab = ({ forceWorkflowMode = false, onNextStep, onEnterProjectMode }) => {
  const { user } = useAuth();
  const tabMode = useTabMode('audience-segments');
  const { 
    setSelectedCustomerStrategy,
    updateCustomerStrategy,
    stepResults,
    addStickyWorkflowStep 
  } = useWorkflowMode();
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [strategies, setStrategies] = useState([]);
  const [generatingStrategies, setGeneratingStrategies] = useState(false);
  
  // UI helpers from workflow components
  const responsive = ComponentHelpers.getResponsiveStyles();
  const defaultColors = ComponentHelpers.getDefaultColors();
  
  // Load cached analysis when component mounts (for logged in users)
  useEffect(() => {
    const loadCachedAnalysis = async () => {
      if (user && tabMode.mode !== 'workflow' && !forceWorkflowMode) {
        try {
          console.log('🔄 Loading cached analysis for user:', user.id);
          const response = await autoBlogAPI.getRecentAnalysis();
          
          if (response.success && response.analysis && response.analysis.scenarios) {
            console.log('✅ Found cached analysis with scenarios:', response.analysis.scenarios.length);
            
            // Transform cached scenarios to component format
            const cachedStrategies = response.analysis.scenarios.map((scenario, index) => ({
              id: `cached-scenario-${index}`,
              targetSegment: scenario.targetSegment || {
                demographics: scenario.customerProblem || 'Target audience',
                psychographics: 'Customer seeking solutions',
                searchBehavior: 'Active research behavior'
              },
              customerProblem: scenario.customerProblem || 'Customer problem',
              customerLanguage: scenario.customerLanguage || scenario.seoKeywords || [],
              conversionPath: scenario.conversionPath || 'Content leads to conversions',
              businessValue: scenario.businessValue || {
                searchVolume: 'Unknown',
                conversionPotential: 'Medium',
                priority: index + 1,
                competition: 'Medium'
              },
              contentIdeas: scenario.contentIdeas || [],
              seoKeywords: scenario.seoKeywords || []
            }));
            
            // Sort by business value priority
            cachedStrategies.sort((a, b) => (a.businessValue.priority || 999) - (b.businessValue.priority || 999));
            
            setStrategies(cachedStrategies);
            message.success(`Loaded ${cachedStrategies.length} cached audience strategies from your previous analysis`);
          } else {
            console.log('📝 No cached analysis found, keeping strategies empty');
          }
        } catch (error) {
          console.error('Failed to load cached analysis:', error);
          // Silently fail - user will see default strategies
        }
      }
    };
    
    loadCachedAnalysis();
  }, [user, tabMode.mode, forceWorkflowMode]);

  // Load audience strategies based on OpenAI analysis when entering workflow mode
  useEffect(() => {
    if ((tabMode.mode === 'workflow' || forceWorkflowMode) && stepResults.home.analysisCompleted && stepResults.home.websiteAnalysis) {
      const analysis = stepResults.home.websiteAnalysis;
      
      console.log('🎯 Loading audience strategies from analysis:', analysis);
      console.log('Available scenarios:', analysis.scenarios?.length || 0);
      
      setGeneratingStrategies(true);
      
      // PRIMARY: Use OpenAI-generated scenarios if available
      if (analysis.scenarios && analysis.scenarios.length > 0) {
        console.log('✅ Using OpenAI-generated audience scenarios');
        
        // Transform OpenAI scenarios to component format
        const openAIStrategies = analysis.scenarios.map((scenario, index) => ({
          id: `openai-scenario-${index}`,
          targetSegment: scenario.targetSegment || {
            demographics: scenario.customerProblem || 'Target audience',
            psychographics: 'Customer seeking solutions',
            searchBehavior: 'Active research behavior'
          },
          customerProblem: scenario.customerProblem || 'Customer problem',
          customerLanguage: scenario.customerLanguage || scenario.seoKeywords || [],
          conversionPath: scenario.conversionPath || 'Content leads to conversions',
          businessValue: scenario.businessValue || {
            searchVolume: 'Unknown',
            conversionPotential: 'Medium',
            priority: index + 1,
            competition: 'Medium'
          },
          contentIdeas: scenario.contentIdeas || [],
          seoKeywords: scenario.seoKeywords || []
        }));
        
        // Sort by business value priority
        openAIStrategies.sort((a, b) => (a.businessValue.priority || 999) - (b.businessValue.priority || 999));
        
        setTimeout(() => {
          setStrategies(openAIStrategies);
          setGeneratingStrategies(false);
          message.success(`Loaded ${openAIStrategies.length} AI-generated audience strategies with real business intelligence`);
        }, 800); // Shorter delay since we're not generating
        
      } else {
        console.log('⚠️ No OpenAI scenarios found, falling back to template generation');
        
        // FALLBACK: Generate template strategies only if no OpenAI scenarios
        const fallbackStrategies = [
          {
            id: 'primary-target',
            targetSegment: {
              demographics: analysis.targetAudience || 'Primary target audience',
              psychographics: analysis.customerProblems?.length > 0 
                ? `Individuals seeking solutions for ${analysis.customerProblems[0]?.toLowerCase()}` 
                : 'Value-driven customers focused on quality solutions',
              searchBehavior: analysis.searchBehavior || 'Active researchers seeking expert guidance and practical solutions'
            },
            customerProblem: analysis.customerProblems?.[0] || 'Finding reliable solutions and expert guidance in their field of interest',
            customerLanguage: analysis.customerLanguage?.slice(0, 4) || analysis.keywords?.slice(0, 4) || [
              `${analysis.businessName?.toLowerCase() || 'professional'} services`,
              `${analysis.businessType?.toLowerCase() || 'expert'} consultation`,
              'trusted solutions',
              'reliable advice'
            ],
            conversionPath: `Educational ${analysis.contentFocus || 'industry-focused'} content leading to consultation and service inquiries`,
            businessValue: {
              searchVolume: '15K+ monthly searches (estimated)',
              conversionPotential: 'High',
              priority: 1,
              competition: 'Medium'
            }
          },
          {
            id: 'secondary-segment',
            targetSegment: {
              demographics: analysis.endUsers || 'Secondary audience segment',
              psychographics: 'Early-stage decision makers researching options and building understanding',
              searchBehavior: 'Consume educational content and compare different approaches before making decisions'
            },
            customerProblem: analysis.customerProblems?.[1] || 'Understanding available options and making informed decisions',
            customerLanguage: analysis.customerLanguage?.slice(2, 6) || analysis.keywords?.slice(2, 6) || [
              `how to choose ${analysis.businessType?.toLowerCase() || 'services'}`,
              `best ${analysis.contentFocus?.split(',')[0]?.toLowerCase() || 'solutions'}`,
              'comparison guide',
              'expert recommendations'
            ],
            conversionPath: 'Comparison guides and educational resources leading to consultation bookings',
            businessValue: {
              searchVolume: '8K+ monthly searches (estimated)',
              conversionPotential: 'Medium',
              priority: 2,
              competition: 'Low'
            }
          }
        ];

        setTimeout(() => {
          setStrategies(fallbackStrategies);
          setGeneratingStrategies(false);
          message.info(`Generated ${fallbackStrategies.length} template strategies (OpenAI scenarios not available)`);
        }, 1200);
      }
    }
  }, [tabMode.mode, stepResults.home.analysisCompleted, stepResults.home.websiteAnalysis]);

  // Handle strategy selection in workflow mode
  const handleSelectStrategy = (strategy, index) => {
    const enhancedStrategy = {
      ...strategy,
      index: index
    };
    
    setSelectedStrategy(enhancedStrategy);
    
    if (tabMode.mode === 'workflow' || forceWorkflowMode) {
      // Update unified workflow state
      setSelectedCustomerStrategy(enhancedStrategy);
      updateCustomerStrategy(enhancedStrategy);
      
      // Add to progressive sticky header
      addStickyWorkflowStep('audienceSelection', {
        audienceName: strategy.targetSegment?.demographics?.split(' ').slice(0, 4).join(' ') + '...' || 'Selected Audience',
        targetSegment: strategy.targetSegment,
        customerProblem: strategy.customerProblem,
        businessValue: strategy.businessValue,
        timestamp: new Date().toISOString()
      });
      
      message.success(`Selected audience strategy: ${strategy.targetSegment.demographics.split(' ')[0]}...`);
    }
  };

  // Prepare step data for workflow progression
  const prepareStepData = () => {
    if (!selectedStrategy) return null;
    return {
      selectedCustomerStrategy: selectedStrategy,
      audienceSegment: selectedStrategy.targetSegment,
      businessValue: selectedStrategy.businessValue,
      timestamp: new Date().toISOString()
    };
  };

  // Render enhanced strategy card with business intelligence
  const renderStrategyCard = (strategy, index) => {
    const isSelected = selectedStrategy?.index === index;
    const isOthersSelected = selectedStrategy && !isSelected;

    return (
      <Col key={strategy.id} xs={24} md={12}>
        <Card
          hoverable
          style={{
            border: isSelected ? `2px solid ${defaultColors.primary}` : '1px solid #f0f0f0',
            borderRadius: '12px',
            minHeight: '400px',
            cursor: 'pointer',
            opacity: isOthersSelected ? 0.5 : 1,
            transition: 'all 0.3s ease'
          }}
          onClick={() => handleSelectStrategy(strategy, index)}
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
              {strategy.businessValue?.priority === 1 && (
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
              {strategy.targetSegment?.demographics || 'Target Audience'}
            </div>
            
            {/* Business Value Indicators */}
            {strategy.businessValue ? (
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '6px',
                marginBottom: '8px'
              }}>
                {strategy.businessValue.searchVolume && (
                  <span style={{
                    backgroundColor: '#f6ffed',
                    color: '#389e0d',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    border: '1px solid #b7eb8f'
                  }}>
                    📊 {strategy.businessValue.searchVolume}
                  </span>
                )}
                {strategy.businessValue.conversionPotential && (
                  <span style={{
                    backgroundColor: strategy.businessValue.conversionPotential === 'High' ? '#f6ffed' : '#fff7e6',
                    color: strategy.businessValue.conversionPotential === 'High' ? '#389e0d' : '#d46b08',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    border: `1px solid ${strategy.businessValue.conversionPotential === 'High' ? '#b7eb8f' : '#ffd591'}`
                  }}>
                    💰 {strategy.businessValue.conversionPotential} Value
                  </span>
                )}
              </div>
            ) : (
              <div style={{ 
                fontSize: '11px', 
                color: '#999',
                marginBottom: '8px'
              }}>
                📊 Business metrics unavailable
              </div>
            )}
            
            {/* Psychographics */}
            {strategy.targetSegment?.psychographics && (
              <div style={{ 
                fontSize: '12px', 
                color: '#888',
                fontStyle: 'italic',
                lineHeight: '1.3'
              }}>
                {strategy.targetSegment.psychographics}
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
              {strategy.customerProblem}
            </Text>
          </div>
          
          {/* Customer Language/Search Terms */}
          {strategy.customerLanguage && strategy.customerLanguage.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <Text strong style={{ color: '#333', fontSize: responsive.fontSize.small }}>
                💬 How They Search:
              </Text>
              <div style={{ marginTop: '6px' }}>
                {strategy.customerLanguage.slice(0, 2).map((term, termIndex) => (
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
              {strategy.conversionPath || 'Educational blog post leading to consultation inquiries.'}
            </Text>
            
            {/* Additional Business Metrics */}
            {strategy.businessValue && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
                {strategy.businessValue.competition && (
                  <div>Competition: {strategy.businessValue.competition}</div>
                )}
                {strategy.targetSegment?.searchBehavior && (
                  <div>Search Pattern: {strategy.targetSegment.searchBehavior}</div>
                )}
              </div>
            )}
          </div>
        </Card>
      </Col>
    );
  };

  return (
    <div>
      
      <div style={{ padding: '24px' }}>
        {/* Unified Header - Consistent styling with other tabs */}
        <UnifiedWorkflowHeader
          user={user}
          onCreateNewPost={() => message.info('Continue through the project to create content')}
          forceWorkflowMode={forceWorkflowMode}
          currentStep={2}
          analysisCompleted={stepResults.home.analysisCompleted}
        />

        {/* WORKFLOW MODE: Customer Strategy Selection Step */}
        {(tabMode.mode === 'workflow' || forceWorkflowMode) && (
          <>

            {/* Strategy Selection Cards - Core workflow step */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col span={24}>
                <Card 
                  title={
                    <Space>
                      <TeamOutlined style={{ color: '#1890ff' }} />
                      Select Your Customer Strategy
                    </Space>
                  }
                  extra={<Tag color="blue">Required</Tag>}
                >
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <Title level={4}>Who is your ideal customer?</Title>
                    <Paragraph>
                      Choose the audience strategy that best describes your target market and business model.
                    </Paragraph>
                  </div>
                  
                  {/* Strategy Cards Grid */}
                  {!stepResults.home.analysisCompleted && forceWorkflowMode ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                      <Title level={4} style={{ color: '#fa8c16' }}>
                        Complete Website Analysis First
                      </Title>
                      <Text style={{ color: '#666', fontSize: '16px' }}>
                        Please complete the website analysis in Step 1 before selecting your target audience.
                        This helps us create personalized audience strategies based on your business.
                      </Text>
                    </div>
                  ) : generatingStrategies ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <div style={{ fontSize: '24px', marginBottom: '16px' }}>🎯</div>
                      <Title level={4} style={{ color: '#1890ff' }}>
                        Generating Audience Strategies...
                      </Title>
                      <Text style={{ color: '#666' }}>
                        Analyzing your website to create targeted customer strategies
                      </Text>
                    </div>
                  ) : (
                    <Row gutter={[16, 16]}>
                      {strategies.map((strategy, index) => renderStrategyCard(strategy, index))}
                    </Row>
                  )}
                  
                  {selectedStrategy && (
                    <div style={{ marginTop: '24px', textAlign: 'center', padding: '16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px' }}>
                      <Text strong style={{ color: '#52c41a' }}>
                        ✅ Selected: {selectedStrategy.targetSegment?.demographics.split(' ').slice(0, 4).join(' ')}...
                      </Text>
                      <div style={{ marginTop: '16px' }}>
                        {onNextStep ? (
                          <Button
                            type="primary"
                            size="large"
                            onClick={onNextStep}
                            style={{ 
                              minWidth: '200px',
                              backgroundColor: '#52c41a',
                              borderColor: '#52c41a'
                            }}
                            icon={<BulbOutlined />}
                          >
                            Next Step: Generate Content
                          </Button>
                        ) : user && (
                          <Button
                            type="primary"
                            size="large"
                            onClick={() => {
                              if (onEnterProjectMode) {
                                onEnterProjectMode();
                              } else {
                                tabMode.enterWorkflowMode();
                              }
                              message.success('Entering project mode to create content');
                            }}
                            style={{ 
                              minWidth: '200px',
                              backgroundColor: '#52c41a',
                              borderColor: '#52c41a'
                            }}
                            icon={<BulbOutlined />}
                          >
                            Start Project Mode
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </>
        )}

        {/* FOCUS MODE: Full Audience Management Features (Premium) */}
        {tabMode.mode === 'focus' && !forceWorkflowMode && (
          <>

      {/* Main Content */}
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
          Select the audience you want to target with your content. These strategies are ranked by business opportunity and include enhanced targeting data.
        </Paragraph>
        
        {/* Enhanced ranking data indicator */}
        <div style={{
          textAlign: 'center',
          marginBottom: '24px',
          padding: '12px',
          backgroundColor: '#f6ffed',
          borderRadius: '6px',
          border: '1px solid #b7eb8f'
        }}>
          <Text style={{ fontSize: responsive.fontSize.small, color: '#389e0d' }}>
            🎯 Strategies ranked using search data: volumes, competitive analysis, and conversion potential
          </Text>
        </div>
        
        {/* Strategy Selection Cards */}
        {strategies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <DatabaseOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <Title level={4} style={{ color: '#999' }}>No Customer Strategies Found</Title>
            <Text>Please run website analysis to generate customer strategies.</Text>
          </div>
        ) : (
          <div>
            <Row gutter={responsive.gutter}>
              {strategies.map((strategy, index) => renderStrategyCard(strategy, index))}
            </Row>
            
            {/* Continue Button */}
            {selectedStrategy && tabMode.mode === 'workflow' && (
              <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => {
                    message.success('Moving to content creation...');
                    tabMode.continueToNextStep();
                  }}
                  style={{
                    backgroundColor: defaultColors.primary,
                    borderColor: defaultColors.primary,
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

          </>
        )}
      </div>
    </div>
  );
};

export default AudienceSegmentsTab;