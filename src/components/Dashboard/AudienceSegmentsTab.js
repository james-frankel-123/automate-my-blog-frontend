import React, { useState, useEffect } from 'react';
import { Card, Button, Empty, Row, Col, Typography, Tag, Statistic, Space, message } from 'antd';
import { PlusOutlined, UserOutlined, TeamOutlined, BulbOutlined, CheckOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTabMode } from '../../hooks/useTabMode';
import { useWorkflowMode } from '../../contexts/WorkflowModeContext';
import ModeToggle, { WorkflowGuidance } from '../Workflow/ModeToggle';
import { ComponentHelpers } from '../Workflow/interfaces/WorkflowComponentInterface';

const { Title, Text, Paragraph } = Typography;

// Enhanced audience segments with business intelligence data
const enhancedAudienceStrategies = [
  {
    id: 'working-parents',
    targetSegment: {
      demographics: 'Career-focused parents aged 25-40 seeking work-life balance solutions',
      psychographics: 'Time-constrained professionals who value efficiency and work-life integration over traditional career advancement',
      searchBehavior: 'Search during early morning or evening hours for productivity and family management solutions'
    },
    customerProblem: 'Struggling to balance demanding careers with family responsibilities while maintaining personal well-being',
    customerLanguage: [
      'work life balance tips',
      'productivity for working parents',
      'time management with kids',
      'flexible work arrangements'
    ],
    conversionPath: 'Educational content about productivity tools leading to consultation for workplace flexibility solutions',
    businessValue: {
      searchVolume: '12K monthly searches',
      conversionPotential: 'High',
      priority: 1,
      competition: 'Medium'
    }
  },
  {
    id: 'remote-professionals',
    targetSegment: {
      demographics: 'Distributed team members aged 28-45 optimizing home productivity and career growth',
      psychographics: 'Self-motivated individuals who value autonomy and seek tools for professional development and collaboration',
      searchBehavior: 'Active researchers who consume content during work breaks and seek actionable advice'
    },
    customerProblem: 'Managing productivity, professional growth, and team collaboration while working from distributed locations',
    customerLanguage: [
      'remote work productivity tools',
      'virtual team collaboration',
      'home office setup',
      'remote career advancement'
    ],
    conversionPath: 'How-to guides and tool reviews leading to software recommendations and consultation services',
    businessValue: {
      searchVolume: '18K monthly searches',
      conversionPotential: 'High',
      priority: 2,
      competition: 'High'
    }
  },
  {
    id: 'startup-founders',
    targetSegment: {
      demographics: 'Early-stage entrepreneurs aged 25-35 building their first company with limited resources',
      psychographics: 'Risk-tolerant visionaries focused on rapid growth who value practical, actionable business advice',
      searchBehavior: 'Consume content intensively during problem-solving moments, often late evening research sessions'
    },
    customerProblem: 'Navigating the complexities of building a business while managing limited resources and uncertainty',
    customerLanguage: [
      'startup funding strategies',
      'team building for startups',
      'product market fit validation',
      'lean startup methodology'
    ],
    conversionPath: 'Strategic business content leading to consulting services for growth and operational optimization',
    businessValue: {
      searchVolume: '8.5K monthly searches',
      conversionPotential: 'Medium',
      priority: 3,
      competition: 'Low'
    }
  }
];

const AudienceSegmentsTab = () => {
  const { user } = useAuth();
  const tabMode = useTabMode('audience-segments');
  const { 
    selectedCustomerStrategy,
    setSelectedCustomerStrategy,
    updateCustomerStrategy,
    stepResults,
    requireAuth 
  } = useWorkflowMode();
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [strategies, setStrategies] = useState(enhancedAudienceStrategies);
  const [generatingStrategies, setGeneratingStrategies] = useState(false);
  
  // UI helpers from workflow components
  const responsive = ComponentHelpers.getResponsiveStyles();
  const defaultColors = ComponentHelpers.getDefaultColors();

  // Generate dynamic audience strategies based on website analysis when entering workflow mode
  useEffect(() => {
    if (tabMode.mode === 'workflow' && stepResults.home.analysisCompleted && stepResults.home.websiteAnalysis) {
      const analysis = stepResults.home.websiteAnalysis;
      
      // Generate strategies based on website analysis
      const generateDynamicStrategies = () => {
        setGeneratingStrategies(true);
        
        // Create strategies based on business analysis
        const dynamicStrategies = [
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
              searchVolume: '15K+ monthly searches',
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
              searchVolume: '8K+ monthly searches',
              conversionPotential: 'Medium',
              priority: 2,
              competition: 'Low'
            }
          }
        ];

        // Add third strategy if we have enough analysis data
        if (analysis.contentFocus && analysis.contentFocus.includes(',')) {
          const focusAreas = analysis.contentFocus.split(',');
          dynamicStrategies.push({
            id: 'niche-segment',
            targetSegment: {
              demographics: `Specialists focused on ${focusAreas[1]?.trim() || 'specialized solutions'}`,
              psychographics: 'Expert-level audience seeking advanced insights and specialized knowledge',
              searchBehavior: 'Search for specific, advanced topics and in-depth analysis'
            },
            customerProblem: `Advanced challenges in ${focusAreas[1]?.trim() || 'their specialized field'}`,
            customerLanguage: [
              `advanced ${focusAreas[1]?.trim()?.toLowerCase() || 'techniques'}`,
              `${analysis.businessType?.toLowerCase() || 'expert'} insights`,
              'specialized knowledge',
              'industry best practices'
            ],
            conversionPath: 'Advanced content and case studies leading to premium consultation services',
            businessValue: {
              searchVolume: '3K+ monthly searches',
              conversionPotential: 'High',
              priority: 3,
              competition: 'Low'
            }
          });
        }

        setTimeout(() => {
          setStrategies(dynamicStrategies);
          setGeneratingStrategies(false);
          message.success(`Generated ${dynamicStrategies.length} audience strategies based on your website analysis`);
        }, 1500); // Simulate generation time
      };

      generateDynamicStrategies();
    }
  }, [tabMode.mode, stepResults.home.analysisCompleted, stepResults.home.websiteAnalysis]);

  // Handle strategy selection in workflow mode
  const handleSelectStrategy = (strategy, index) => {
    const enhancedStrategy = {
      ...strategy,
      index: index
    };
    
    setSelectedStrategy(enhancedStrategy);
    
    if (tabMode.mode === 'workflow') {
      // Update unified workflow state
      setSelectedCustomerStrategy(enhancedStrategy);
      updateCustomerStrategy(enhancedStrategy);
      
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
      {/* Mode Toggle - Only show for authenticated users */}
      {user && (
        <ModeToggle
          mode={tabMode.mode}
          tabKey="audience-segments"
          workflowStep={tabMode.workflowStep}
          showModeToggle={tabMode.showModeToggle}
          showWorkflowNavigation={tabMode.showWorkflowNavigation}
          showNextButton={tabMode.showNextButton && selectedStrategy}
          showPreviousButton={tabMode.showPreviousButton}
          nextButtonText={tabMode.nextButtonText}
          previousButtonText={tabMode.previousButtonText}
          canEnterWorkflow={tabMode.canEnterWorkflow}
          onEnterWorkflowMode={tabMode.enterWorkflowMode}
          onExitToFocusMode={tabMode.exitToFocusMode}
          onContinueToNextStep={tabMode.continueToNextStep}
          onGoToPreviousStep={tabMode.goToPreviousStep}
          onSaveStepData={tabMode.saveStepData}
          stepData={prepareStepData()}
        />
      )}
      
      <div style={{ padding: '24px' }}>
        {/* WORKFLOW MODE: Customer Strategy Selection Step */}
        {tabMode.mode === 'workflow' && (
          <>
            {/* Workflow Step Header */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col span={24}>
                <Card style={{ background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', border: 'none' }}>
                  <div style={{ color: 'white', textAlign: 'center' }}>
                    <Title level={2} style={{ color: 'white', marginBottom: '8px' }}>
                      🎯 Step 2: Choose Your Target Audience
                    </Title>
                    <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px', marginBottom: '20px' }}>
                      Select the audience segment that best matches your business goals. 
                      This will help us create highly targeted content that converts.
                    </Paragraph>
                  </div>
                </Card>
              </Col>
            </Row>

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
                  {generatingStrategies ? (
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
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </>
        )}

        {/* FOCUS MODE: Full Audience Management Features (Premium) */}
        {tabMode.mode === 'focus' && (
          <>
      {/* Header */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Title level={2} style={{ marginBottom: '8px' }}>
                <TeamOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
                Audience Segments
              </Title>
              <Paragraph style={{ fontSize: '16px', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
                Define and manage your target audience segments based on customer strategies. 
                Create content that resonates with specific customer groups and their unique needs.
              </Paragraph>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Available Strategies"
              value={strategies.length}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Monthly Search Volume"
              value={strategies.reduce((sum, s) => {
                const volume = s.businessValue?.searchVolume || '0';
                return sum + parseFloat(volume.replace(/[^0-9.]/g, ''));
              }, 0).toFixed(1)}
              suffix="K searches"
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Selected Strategy"
              value={selectedStrategy ? 1 : 0}
              prefix={<BulbOutlined />}
              valueStyle={{ color: selectedStrategy ? '#1890ff' : '#666' }}
            />
          </Card>
        </Col>
      </Row>

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

      {tabMode.mode !== 'workflow' && (
        <Card title="Understanding Customer Strategies" style={{ marginTop: '24px' }}>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <BulbOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '12px' }} />
                <Title level={4}>🎯 Enhanced Targeting</Title>
                <Text style={{ color: '#666' }}>
                  Each strategy includes search volumes, conversion potential, and competitive analysis for better decision-making
                </Text>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <UserOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '12px' }} />
                <Title level={4}>👥 Detailed Personas</Title>
                <Text style={{ color: '#666' }}>
                  Demographics, psychographics, and search behavior patterns help create more targeted content
                </Text>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <TeamOutlined style={{ fontSize: '32px', color: '#722ed1', marginBottom: '12px' }} />
                <Title level={4}>📊 Business Intelligence</Title>
                <Text style={{ color: '#666' }}>
                  Priority rankings and conversion potential help you focus on the most valuable audience segments
                </Text>
              </div>
            </Col>
          </Row>
        </Card>
      )}
          </>
        )}
      </div>
    </div>
  );
};

export default AudienceSegmentsTab;