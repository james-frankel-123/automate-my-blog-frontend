import React from 'react';
import { Card, Button, Row, Col, Typography, Input, Form, Space, Tag, Spin } from 'antd';
import { 
  GlobalOutlined, 
  ScanOutlined, 
  SearchOutlined, 
  DatabaseOutlined, 
  SettingOutlined,
  LoginOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { ComponentHelpers } from '../interfaces/WorkflowComponentInterface';

const { Title, Text, Paragraph } = Typography;

/**
 * WebsiteAnalysisStep v2
 * Complete step component with business overview UI
 * EXTRACTED AND ENHANCED FROM: App.js step 0 and step 1 logic
 */
const WebsiteAnalysisStepV2 = (props) => {
  // =============================================================================
  // PROPS DESTRUCTURING WITH VALIDATION
  // =============================================================================

  const {
    // Core workflow state
    currentStep,
    setCurrentStep,
    websiteUrl,
    setWebsiteUrl,
    stepResults,
    setStepResults,
    
    // Loading and progress state
    isLoading,
    scanningMessage,
    analysisCompleted,
    
    // UI control state
    editingStep,
    setEditingStep,
    
    // Authentication context
    user,
    requireAuth,
    setNavContext,
    
    // Business logic functions
    performWebsiteAnalysis,
    
    // Configuration
    embedded = false,
    
    // Web search insights
    webSearchInsights = { researchQuality: 'basic' },
    
    // Brand colors helper
    getBrandColors = ComponentHelpers.getBrandColors
  } = props;

  // =============================================================================
  // LOCAL STATE AND HELPERS
  // =============================================================================

  const responsive = ComponentHelpers.getResponsiveStyles();
  const brandColors = getBrandColors(stepResults);
  
  // Extract domain for display
  const domain = websiteUrl ? 
    websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : 
    '';

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  /**
   * Handle website URL submission
   * EXTRACTED FROM: App.js analyzeWebsite() function
   */
  const handleWebsiteSubmit = async () => {
    if (!websiteUrl.trim()) {
      return;
    }
    
    // Call the business logic function from WorkflowContainer
    await performWebsiteAnalysis();
  };

  /**
   * Continue to strategy selection
   * EXTRACTED FROM: App.js step advancement logic
   * Updated: Allow anonymous users to proceed to strategy selection
   */
  const continueToStrategy = () => {
    setCurrentStep(2);
  };

  /**
   * Navigate to dashboard
   * EXTRACTED FROM: App.js navigation logic
   */
  const goToDashboard = () => {
    if (user) {
      setNavContext();
    }
  };

  /**
   * Edit analysis results
   * EXTRACTED FROM: App.js editStepResults() function
   */
  const editAnalysisResults = () => {
    setEditingStep(1);
    // This could trigger a modal or inline editing mode
  };

  // =============================================================================
  // UI HELPER FUNCTIONS
  // =============================================================================

  /**
   * Render business overview cards
   * EXTRACTED FROM: App.js renderBusinessOverview() function
   */
  const renderBusinessOverview = () => {
    const analysis = stepResults.websiteAnalysis;
    
    if (!analysis) {
      return null;
    }

    const isComplete = currentStep >= 2;
    
    // Detect if analysis seems generic/limited (likely JavaScript-heavy site)
    const seemsLimited = analysis.businessType === 'Technology' && 
                        analysis.description && 
                        analysis.description.toLowerCase().includes('javascript');

    return (
      <Card 
        style={{ 
          border: `2px solid ${analysis.brandColors.primary}`,
          borderRadius: '12px',
          background: `linear-gradient(135deg, ${analysis.brandColors.secondary}15, #ffffff)`,
          marginBottom: '30px'
        }}
      >
        {/* Company Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <Title 
              level={3} 
              style={{ 
                margin: 0, 
                color: analysis.brandColors.primary,
                fontSize: responsive.fontSize.title,
                fontWeight: 600,
                marginBottom: '4px'
              }}
            >
              {analysis.businessName || 'Business Profile'}
            </Title>
            <Text style={{ fontSize: responsive.fontSize.text, color: '#666' }}>
              {domain} • {analysis.businessType}
            </Text>
          </div>
          {isComplete && (
            <Button 
              icon={<SettingOutlined />} 
              onClick={editAnalysisResults}
              type="link"
              style={{ color: analysis.brandColors.primary }}
            >
              Edit
            </Button>
          )}
        </div>

        {/* Limited Content Warning */}
        {seemsLimited && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fff7e6',
            border: '1px solid #ffd591',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <Text style={{ fontSize: '14px' }}>
              ⚠️ <strong>Limited Website Content:</strong> This appears to be a JavaScript-heavy site. 
              Click "Edit" above to provide more details about your business for better content recommendations.
            </Text>
          </div>
        )}

        {/* Web Search Research Quality Indicator */}
        {webSearchInsights.researchQuality === 'basic' && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fafafa',
            border: '1px solid #d9d9d9',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <Text strong style={{ color: '#666', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
              📊 Standard Analysis
            </Text>
            <div style={{ fontSize: '13px', color: '#666' }}>
              Analysis based on website content. Upgrade for enhanced research with brand guidelines, competitor analysis, and real-time keyword data.
            </div>
          </div>
        )}

        {webSearchInsights.researchQuality === 'enhanced' && (
          <div style={{
            padding: '16px',
            backgroundColor: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <Text strong style={{ color: '#389e0d', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
              🎯 Enhanced Analysis with Web Research
            </Text>
            <div style={{ fontSize: '13px', color: '#389e0d' }}>
              Analysis enhanced with brand guidelines, competitive analysis, and current market keyword research.
            </div>
          </div>
        )}

        {/* Business Overview Cards */}
        <Row gutter={responsive.gutter}>
          <Col xs={24} md={12}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: analysis.brandColors.primary + '08', 
              borderRadius: '8px',
              border: `1px solid ${analysis.brandColors.primary}20`,
              height: '100%'
            }}>
              <Text strong style={{ 
                color: analysis.brandColors.primary, 
                fontSize: responsive.fontSize.text, 
                marginBottom: '8px', 
                display: 'block' 
              }}>
                What They Do
              </Text>
              <Text style={{ fontSize: responsive.fontSize.small, lineHeight: '1.5' }}>
                {analysis.description || `${analysis.businessName} operates in the ${analysis.businessType.toLowerCase()} space, focusing on ${analysis.contentFocus?.toLowerCase() || 'delivering specialized services'}.`}
              </Text>
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: analysis.brandColors.accent + '08', 
              borderRadius: '8px',
              border: `1px solid ${analysis.brandColors.accent}20`,
              height: '100%'
            }}>
              <Text strong style={{ 
                color: analysis.brandColors.accent, 
                fontSize: responsive.fontSize.text, 
                marginBottom: '8px', 
                display: 'block' 
              }}>
                Target Audience
              </Text>
              <Text style={{ fontSize: responsive.fontSize.small, lineHeight: '1.5' }}>
                {analysis.decisionMakers || analysis.targetAudience}
              </Text>
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: analysis.brandColors.secondary + '30', 
              borderRadius: '8px',
              border: `1px solid ${analysis.brandColors.secondary}60`,
              height: '100%'
            }}>
              <Text strong style={{ 
                color: analysis.brandColors.primary, 
                fontSize: responsive.fontSize.text, 
                marginBottom: '8px', 
                display: 'block' 
              }}>
                Brand Voice
              </Text>
              <Text style={{ fontSize: responsive.fontSize.small, lineHeight: '1.5' }}>
                {analysis.brandVoice}
              </Text>
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: analysis.brandColors.primary + '06', 
              borderRadius: '8px',
              border: `1px solid ${analysis.brandColors.primary}15`,
              height: '100%'
            }}>
              <Text strong style={{ 
                color: analysis.brandColors.primary, 
                fontSize: responsive.fontSize.text, 
                marginBottom: '8px', 
                display: 'block' 
              }}>
                Content Focus
              </Text>
              <Text style={{ fontSize: responsive.fontSize.small, lineHeight: '1.5' }}>
                {analysis.contentFocus || `Educational content about ${analysis.businessType.toLowerCase()}`}
              </Text>
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: analysis.brandColors.secondary + '20', 
              borderRadius: '8px',
              border: `1px solid ${analysis.brandColors.secondary}40`,
              height: '100%'
            }}>
              <Text strong style={{ 
                color: analysis.brandColors.primary, 
                fontSize: responsive.fontSize.text, 
                marginBottom: '12px', 
                display: 'block' 
              }}>
                Brand Colors
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: analysis.brandColors.primary,
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    flexShrink: 0
                  }} />
                  <Text style={{ fontSize: responsive.fontSize.small, color: '#666' }}>
                    <Text strong>Primary:</Text> {analysis.brandColors.primary}
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: analysis.brandColors.secondary,
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    flexShrink: 0
                  }} />
                  <Text style={{ fontSize: responsive.fontSize.small, color: '#666' }}>
                    <Text strong>Secondary:</Text> {analysis.brandColors.secondary}
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: analysis.brandColors.accent,
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    flexShrink: 0
                  }} />
                  <Text style={{ fontSize: responsive.fontSize.small, color: '#666' }}>
                    <Text strong>Accent:</Text> {analysis.brandColors.accent}
                  </Text>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Business Strategy - Only show if AI generated these fields */}
        {(analysis.businessModel || analysis.websiteGoals || analysis.blogStrategy) && (
          <Row gutter={responsive.gutter} style={{ marginTop: '16px' }}>
            {analysis.businessModel && (
              <Col xs={24} lg={8}>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: analysis.brandColors.accent + '08', 
                  borderRadius: '8px',
                  border: `1px solid ${analysis.brandColors.accent}20`,
                  height: '100%'
                }}>
                  <Text strong style={{ 
                    color: analysis.brandColors.accent, 
                    fontSize: responsive.fontSize.text, 
                    marginBottom: '8px', 
                    display: 'block' 
                  }}>
                    Business Model
                  </Text>
                  <Text style={{ fontSize: responsive.fontSize.small, lineHeight: '1.5' }}>
                    {analysis.businessModel}
                  </Text>
                </div>
              </Col>
            )}

            {analysis.websiteGoals && (
              <Col xs={24} lg={8}>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: analysis.brandColors.primary + '08', 
                  borderRadius: '8px',
                  border: `1px solid ${analysis.brandColors.primary}20`,
                  height: '100%'
                }}>
                  <Text strong style={{ 
                    color: analysis.brandColors.primary, 
                    fontSize: responsive.fontSize.text, 
                    marginBottom: '8px', 
                    display: 'block' 
                  }}>
                    Website Goals
                  </Text>
                  <Text style={{ fontSize: responsive.fontSize.small, lineHeight: '1.5' }}>
                    {analysis.websiteGoals}
                  </Text>
                </div>
              </Col>
            )}

            {analysis.blogStrategy && (
              <Col xs={24} lg={8}>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: analysis.brandColors.secondary + '40', 
                  borderRadius: '8px',
                  border: `1px solid ${analysis.brandColors.secondary}60`,
                  height: '100%'
                }}>
                  <Text strong style={{ 
                    color: analysis.brandColors.primary, 
                    fontSize: responsive.fontSize.text, 
                    marginBottom: '8px', 
                    display: 'block' 
                  }}>
                    Blog Strategy
                  </Text>
                  <Text style={{ fontSize: responsive.fontSize.small, lineHeight: '1.5' }}>
                    {analysis.blogStrategy}
                  </Text>
                </div>
              </Col>
            )}
          </Row>
        )}

        {/* Keywords if available */}
        {analysis.keywords && analysis.keywords.length > 0 && (
          <div style={{ 
            marginTop: '20px',
            padding: '16px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px'
          }}>
            <Text strong style={{ 
              color: analysis.brandColors.primary, 
              fontSize: responsive.fontSize.text, 
              marginBottom: '12px', 
              display: 'block' 
            }}>
              Key Topics & Keywords
            </Text>
            <Space wrap>
              {analysis.keywords.map((keyword, index) => (
                <Tag 
                  key={index} 
                  color={analysis.brandColors.primary}
                  style={{ 
                    borderRadius: '12px',
                    fontSize: responsive.fontSize.small,
                    padding: '4px 8px'
                  }}
                >
                  {keyword}
                </Tag>
              ))}
            </Space>
          </div>
        )}
      </Card>
    );
  };

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
      {/* STEP 0: Website URL Input */}
      {currentStep === 0 && (
        <Card style={{ marginBottom: '20px' }}>
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
              <ScanOutlined style={{ 
                fontSize: responsive.isMobile ? '32px' : '48px', 
                color: brandColors.primary, 
                marginBottom: '16px' 
              }} />
              <Title level={2} style={{ 
                margin: '0 0 8px 0',
                fontSize: responsive.fontSize.title
              }}>
                Let's analyze your website
              </Title>
              <Text style={{ 
                color: '#666', 
                fontSize: responsive.fontSize.text 
              }}>
                We'll scan your site to understand your business and create personalized blog content
              </Text>
            </div>
            
            <Form layout="vertical" onFinish={handleWebsiteSubmit}>
              <Form.Item
                help="Example: mystore.com, myblog.org, mycompany.net"
                style={{ marginBottom: '24px' }}
              >
                <Input
                  size="large"
                  placeholder="Enter your website URL"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  prefix={<GlobalOutlined />}
                  style={{ textAlign: 'center' }}
                  onPressEnter={handleWebsiteSubmit}
                />
              </Form.Item>
              
              <Button 
                type="primary" 
                size="large"
                htmlType="submit"
                disabled={!websiteUrl.trim() || isLoading}
                loading={isLoading}
                style={{ 
                  minWidth: '200px',
                  backgroundColor: brandColors.primary,
                  borderColor: brandColors.primary
                }}
                icon={<ScanOutlined />}
              >
                Analyze Website
              </Button>
            </Form>

            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <Text style={{ 
                color: '#666', 
                fontSize: responsive.fontSize.small 
              }}>
                ✓ AI-powered website analysis  ✓ Personalized content strategy  ✓ SEO optimization
              </Text>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 1: Website Analysis in Progress */}
      {currentStep === 1 && !analysisCompleted && (
        <Card style={{ marginBottom: '20px' }}>
          <div style={{ textAlign: 'center', padding: responsive.padding }}>
            <ScanOutlined 
              style={{ 
                fontSize: responsive.isMobile ? '48px' : '64px', 
                color: brandColors.primary, 
                marginBottom: '24px',
                animation: 'pulse 2s infinite'
              }} 
            />
            
            <Title level={2} style={{ 
              marginBottom: '16px',
              fontSize: responsive.fontSize.title
            }}>
              Analyzing Your Website
            </Title>
            
            <div style={{ marginBottom: '32px' }}>
              <Text style={{ 
                fontSize: responsive.fontSize.text, 
                color: '#666', 
                display: 'block', 
                marginBottom: '16px' 
              }}>
                {scanningMessage}
              </Text>
              
              <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <Text strong>Website: </Text>
                <Text code>{websiteUrl}</Text>
              </div>
            </div>

            <div style={{ 
              background: `linear-gradient(90deg, ${brandColors.primary} 0%, ${brandColors.accent} 50%, ${brandColors.secondary} 100%)`, 
              height: '4px', 
              borderRadius: '2px',
              overflow: 'hidden',
              marginBottom: '24px'
            }}>
              <div style={{
                width: '30%',
                height: '100%',
                background: 'rgba(255,255,255,0.8)',
                animation: 'loading 2s ease-in-out infinite'
              }} />
            </div>

            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '16px', 
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <Text style={{ 
                color: '#666', 
                fontSize: responsive.fontSize.small 
              }}>
                🔍 Reading content  •  🎨 Analyzing design  •  👥 Understanding audience  •  📊 Research insights
              </Text>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 1: Analysis Complete with Business Overview */}
      {currentStep === 1 && analysisCompleted && (
        <>
          <Card style={{ marginBottom: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
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
                }}>✓</span>
              </div>
              
              <Title level={2} style={{ 
                color: '#52c41a', 
                marginBottom: '16px',
                fontSize: responsive.fontSize.title
              }}>
                Website Analysis Complete!
              </Title>
              
              <Paragraph style={{ 
                fontSize: responsive.fontSize.text, 
                marginBottom: '32px', 
                maxWidth: '500px', 
                margin: '0 auto 32px auto' 
              }}>
                We've successfully analyzed your website and understand your business. 
                Ready to create targeted content for your audience?
              </Paragraph>

              {/* Action Buttons moved to bottom */}

              <div style={{ marginTop: '24px' }}>
                <Tag color="green">Business Analysis Complete</Tag>
                <Tag color="blue">Target Audience Identified</Tag>
                <Tag color="orange">Content Strategy Ready</Tag>
              </div>
            </div>
          </Card>
          
          {/* Business Overview Cards */}
          {stepResults.websiteAnalysis && renderBusinessOverview()}
          
          {/* Action Buttons at Bottom */}
          {analysisCompleted && (
            <div style={{ 
              textAlign: 'center', 
              marginTop: '32px',
              marginBottom: '20px'
            }}>
              <Space direction={responsive.isMobile ? "vertical" : "horizontal"} size="large">
                {user ? (
                  <>
                    <Button 
                      type="primary" 
                      size="large"
                      onClick={continueToStrategy}
                      style={{ 
                        minWidth: '200px',
                        backgroundColor: brandColors.primary,
                        borderColor: brandColors.primary
                      }}
                      icon={<SearchOutlined />}
                    >
                      Continue to Strategy
                    </Button>
                    <Button 
                      size="large"
                      onClick={goToDashboard}
                      icon={<DatabaseOutlined />}
                    >
                      Go to Dashboard
                    </Button>
                  </>
                ) : (
                  <Button 
                    type="primary" 
                    size="large"
                    onClick={continueToStrategy}
                    style={{ 
                      minWidth: '200px',
                      backgroundColor: brandColors.primary,
                      borderColor: brandColors.primary
                    }}
                    icon={<LoginOutlined />}
                  >
                    Continue to Strategy
                  </Button>
                )}
              </Space>
            </div>
          )}
        </>
      )}

      {/* Loading State Component for consistency */}
      {isLoading && (
        <ComponentHelpers.LoadingState 
          message={scanningMessage || "Processing..."}
          brandColors={brandColors}
        />
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
};

WebsiteAnalysisStepV2.displayName = 'WebsiteAnalysisStepV2';

export default WebsiteAnalysisStepV2;