import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Typography, Input, Form, Space, Tag, Spin, message } from 'antd';
import { 
  GlobalOutlined, 
  ScanOutlined, 
  SearchOutlined, 
  DatabaseOutlined, 
  SettingOutlined,
  LoginOutlined,
  UserAddOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { ComponentHelpers } from '../interfaces/WorkflowComponentInterface';
import { analysisAPI } from '../../../services/workflowAPI';
import workflowUtils from '../../../utils/workflowUtils';

const { Title, Text, Paragraph } = Typography;

/**
 * Standalone Website Analysis Step Component
 * Reusable component for website URL input, analysis, and results display
 * Can be used in Home tab, New Post workflow, and other locations
 */
const WebsiteAnalysisStepStandalone = ({
  // Core state
  websiteUrl,
  setWebsiteUrl,
  analysisResults,
  setAnalysisResults,
  webSearchInsights,
  setWebSearchInsights,
  
  // Loading states
  isLoading,
  setIsLoading,
  scanningMessage,
  setScanningMessage,
  analysisCompleted,
  setAnalysisCompleted,
  
  // User context
  user,
  requireAuth,
  
  // Event handlers
  onAnalysisComplete,
  onStartOver,
  addStickyWorkflowStep,
  updateStickyWorkflowStep,
  
  // Configuration
  embedded = false,
  showTitle = true,
  autoAnalyze = false,
  
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
  
  // URL prepopulation logic for logged-in users
  const userOrganizationWebsite = user?.organizationWebsite;
  const [urlOverrideMode, setUrlOverrideMode] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [localScanningMessage, setLocalScanningMessage] = useState('');
  
  // Use local state if parent doesn't provide state management
  const loading = isLoading !== undefined ? isLoading : localLoading;
  const currentScanningMessage = scanningMessage !== undefined ? scanningMessage : localScanningMessage;
  
  // Auto-populate websiteUrl on component mount if user has organization website and no URL is set
  useEffect(() => {
    if (userOrganizationWebsite && !websiteUrl && !urlOverrideMode) {
      setWebsiteUrl && setWebsiteUrl(userOrganizationWebsite);
    }
  }, [userOrganizationWebsite, websiteUrl, urlOverrideMode, setWebsiteUrl]);
  
  // Auto-analyze on mount if requested
  useEffect(() => {
    if (autoAnalyze && websiteUrl && !analysisCompleted && !loading) {
      handleWebsiteSubmit();
    }
  }, [autoAnalyze, websiteUrl, analysisCompleted, loading]);
  
  // Extract domain for display
  const domain = websiteUrl ? 
    websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : 
    '';
  
  // Determine if input should be disabled
  const shouldDisableInput = !!(userOrganizationWebsite && !urlOverrideMode);
  
  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  
  /**
   * Handle website URL submission and analysis
   */
  const handleWebsiteSubmit = async () => {
    if (!websiteUrl?.trim()) {
      message.warning('Please enter a website URL');
      return;
    }
    
    try {
      // Validate URL first
      const validation = workflowUtils.urlUtils.validateWebsiteUrl(websiteUrl);
      if (!validation.isValid) {
        message.error(validation.error);
        return false;
      }

      // Set loading state
      const updateLoading = setIsLoading || setLocalLoading;
      const updateScanningMessage = setScanningMessage || setLocalScanningMessage;
      
      updateLoading(true);

      // Add to progressive sticky header immediately when analysis starts
      addStickyWorkflowStep && addStickyWorkflowStep('websiteAnalysis', {
        websiteUrl: validation.formattedUrl,
        businessName: '', // Will be updated after analysis completes
        businessType: '',
        timestamp: new Date().toISOString()
      });

      // Phase-by-phase progress messages
      const progressMessages = [
        'Analyzing website content...',
        '🔍 Researching brand guidelines and social media...',
        '📊 Analyzing competitor keywords and search trends...',
        '👥 Gathering customer insights and reviews...',
        '🧠 Synthesizing insights with AI...'
      ];

      // Show progress messages with delays
      for (let i = 0; i < progressMessages.length; i++) {
        updateScanningMessage(progressMessages[i]);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Call API service
      const result = await analysisAPI.analyzeWebsite(validation.formattedUrl);

      if (result.success) {
        // Update state with analysis results
        setAnalysisResults && setAnalysisResults(result.analysis);
        setWebSearchInsights && setWebSearchInsights(result.webSearchInsights);
        setAnalysisCompleted && setAnalysisCompleted(true);
        setWebsiteUrl && setWebsiteUrl(validation.formattedUrl);
        
        message.success('Website analysis completed successfully!');
        
        // Update sticky header with business name after analysis completes
        updateStickyWorkflowStep && updateStickyWorkflowStep('websiteAnalysis', {
          websiteUrl: validation.formattedUrl,
          businessName: result.analysis?.businessName || result.analysis?.companyName || '',
          businessType: result.analysis?.businessType || result.analysis?.industry || '',
          ...result.analysis
        });
        
        // Notify parent component
        onAnalysisComplete && onAnalysisComplete({
          analysis: result.analysis,
          webSearchInsights: result.webSearchInsights,
          websiteUrl: validation.formattedUrl
        });
        
        return true;
      } else {
        // Handle error with fallback
        if (result.fallbackAnalysis) {
          setAnalysisResults && setAnalysisResults(result.fallbackAnalysis);
          setAnalysisCompleted && setAnalysisCompleted(true);
          message.warning('Website analysis completed with limited data. You can proceed or try a different URL.');
          
          onAnalysisComplete && onAnalysisComplete({
            analysis: result.fallbackAnalysis,
            webSearchInsights: result.webSearchInsights || { researchQuality: 'basic' },
            websiteUrl: validation.formattedUrl
          });
          
          return true;
        }
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Website analysis error:', error);
      message.error(`Analysis failed: ${error.message}`);
      return false;
    } finally {
      const updateLoading = setIsLoading || setLocalLoading;
      updateLoading(false);
    }
  };
  
  /**
   * Handle starting over
   */
  const handleStartOver = () => {
    setWebsiteUrl && setWebsiteUrl('');
    setAnalysisResults && setAnalysisResults(null);
    setAnalysisCompleted && setAnalysisCompleted(false);
    setWebSearchInsights && setWebSearchInsights({ researchQuality: 'basic' });
    setUrlOverrideMode(false);
    
    onStartOver && onStartOver();
  };
  
  /**
   * Handle URL override for organization users
   */
  const handleOverrideUrl = () => {
    setUrlOverrideMode(true);
    setWebsiteUrl && setWebsiteUrl('');
  };
  
  // =============================================================================
  // RENDER HELPERS
  // =============================================================================
  
  /**
   * Render URL input form
   */
  const renderUrlInput = () => (
    <div style={{ marginBottom: '30px' }}>
      {showTitle && (
        <Title level={3} style={{ 
          textAlign: 'center', 
          marginBottom: '20px',
          fontSize: responsive.fontSize.title 
        }}>
          <GlobalOutlined style={{ marginRight: '8px', color: defaultColors.primary }} />
          Analyze Your Website
        </Title>
      )}
      
      <Form onFinish={handleWebsiteSubmit} style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Space.Compact style={{ width: '100%' }} size="large">
          <Input
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl && setWebsiteUrl(e.target.value)}
            placeholder="Enter your website URL (e.g., https://example.com)"
            size="large"
            prefix={<GlobalOutlined style={{ color: '#999' }} />}
            disabled={shouldDisableInput || loading}
            style={{
              borderRadius: '8px 0 0 8px',
              borderRight: 'none',
              fontSize: responsive.fontSize.text
            }}
            onPressEnter={handleWebsiteSubmit}
          />
          <Button 
            type="primary" 
            size="large"
            onClick={handleWebsiteSubmit}
            loading={loading}
            disabled={!websiteUrl?.trim()}
            style={{
              borderRadius: '0 8px 8px 0',
              backgroundColor: defaultColors.primary,
              borderColor: defaultColors.primary,
              minWidth: '120px',
              fontSize: responsive.fontSize.text
            }}
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </Button>
        </Space.Compact>
      </Form>
      
      {/* Override option for organization users */}
      {userOrganizationWebsite && !urlOverrideMode && (
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Text style={{ color: '#666', fontSize: responsive.fontSize.small }}>
            Using organization website: <Text strong>{userOrganizationWebsite}</Text>
          </Text>
          <Button 
            type="link" 
            size="small"
            onClick={handleOverrideUrl}
            style={{ marginLeft: '8px' }}
          >
            Use different URL
          </Button>
        </div>
      )}
    </div>
  );
  
  /**
   * Render analysis loading state
   */
  const renderAnalysisLoading = () => (
    <Card style={{ marginBottom: '20px' }}>
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '20px' }}>
          <Title level={4} style={{ color: defaultColors.primary, marginBottom: '8px' }}>
            <ScanOutlined style={{ marginRight: '8px' }} />
            Analyzing {domain}
          </Title>
          <Paragraph style={{ 
            color: '#666', 
            marginBottom: '0',
            fontSize: responsive.fontSize.text 
          }}>
            {currentScanningMessage || 'Analyzing website content...'}
          </Paragraph>
        </div>
      </div>
    </Card>
  );
  
  /**
   * Render analysis results - Enhanced version matching WebsiteAnalysisStep-v2
   */
  const renderAnalysisResults = () => {
    if (!analysisResults) return null;
    
    const analysis = analysisResults;
    
    // Extract domain for display
    const domain = websiteUrl ? 
      websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : 
      '';

    return (
      <Card 
        style={{ 
          border: `2px solid ${defaultColors.primary}`,
          borderRadius: '12px',
          background: `linear-gradient(135deg, ${defaultColors.secondary}15, #ffffff)`,
          marginBottom: '20px'
        }}
      >
        {/* Company Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <Title 
              level={3} 
              style={{ 
                margin: 0, 
                color: defaultColors.primary,
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
          <Button 
            icon={<SettingOutlined />} 
            onClick={handleStartOver}
            type="link"
            style={{ color: defaultColors.primary }}
          >
            Edit
          </Button>
        </div>

        {/* Web Search Research Quality Indicator */}
        {webSearchInsights?.researchQuality === 'basic' && (
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

        {webSearchInsights?.researchQuality === 'enhanced' && (
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
              backgroundColor: defaultColors.primary + '08', 
              borderRadius: '8px',
              border: `1px solid ${defaultColors.primary}20`,
              height: '100%'
            }}>
              <Text strong style={{ 
                color: defaultColors.primary, 
                fontSize: responsive.fontSize.text, 
                marginBottom: '8px', 
                display: 'block' 
              }}>
                What They Do
              </Text>
              <Text style={{ fontSize: responsive.fontSize.small, lineHeight: '1.5' }}>
                {analysis.description || `${analysis.businessName || 'This business'} operates in the ${analysis.businessType.toLowerCase()} space, focusing on ${analysis.contentFocus?.toLowerCase() || 'delivering specialized services'}.`}
              </Text>
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: defaultColors.accent + '08', 
              borderRadius: '8px',
              border: `1px solid ${defaultColors.accent}20`,
              height: '100%'
            }}>
              <Text strong style={{ 
                color: defaultColors.accent, 
                fontSize: responsive.fontSize.text, 
                marginBottom: '8px', 
                display: 'block' 
              }}>
                Target Audience
              </Text>
              <Text style={{ fontSize: responsive.fontSize.small, lineHeight: '1.5' }}>
                {analysis.decisionMakers || analysis.targetAudience || 'General audience'}
              </Text>
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: defaultColors.secondary + '30', 
              borderRadius: '8px',
              border: `1px solid ${defaultColors.secondary}60`,
              height: '100%'
            }}>
              <Text strong style={{ 
                color: defaultColors.primary, 
                fontSize: responsive.fontSize.text, 
                marginBottom: '8px', 
                display: 'block' 
              }}>
                Brand Voice
              </Text>
              <Text style={{ fontSize: responsive.fontSize.small, lineHeight: '1.5' }}>
                {analysis.brandVoice || 'Professional and engaging'}
              </Text>
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: defaultColors.primary + '06', 
              borderRadius: '8px',
              border: `1px solid ${defaultColors.primary}15`,
              height: '100%'
            }}>
              <Text strong style={{ 
                color: defaultColors.primary, 
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
              backgroundColor: defaultColors.secondary + '20', 
              borderRadius: '8px',
              border: `1px solid ${defaultColors.secondary}40`,
              height: '100%'
            }}>
              <Text strong style={{ 
                color: defaultColors.primary, 
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
                    backgroundColor: analysis.brandColors?.primary || defaultColors.primary,
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    flexShrink: 0
                  }} />
                  <Text style={{ fontSize: responsive.fontSize.small, color: '#666' }}>
                    <Text strong>Primary:</Text> {analysis.brandColors?.primary || defaultColors.primary}
                  </Text>
                </div>
                {analysis.brandColors?.secondary && (
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
                )}
                {analysis.brandColors?.accent && (
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
                )}
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
                  backgroundColor: defaultColors.accent + '08', 
                  borderRadius: '8px',
                  border: `1px solid ${defaultColors.accent}20`,
                  height: '100%'
                }}>
                  <Text strong style={{ 
                    color: defaultColors.accent, 
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
                  backgroundColor: defaultColors.primary + '08', 
                  borderRadius: '8px',
                  border: `1px solid ${defaultColors.primary}20`,
                  height: '100%'
                }}>
                  <Text strong style={{ 
                    color: defaultColors.primary, 
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
                  backgroundColor: defaultColors.secondary + '40', 
                  borderRadius: '8px',
                  border: `1px solid ${defaultColors.secondary}60`,
                  height: '100%'
                }}>
                  <Text strong style={{ 
                    color: defaultColors.primary, 
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
              color: defaultColors.primary, 
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
                  color={defaultColors.primary}
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
        
        {/* Action buttons */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Space>
            <Button 
              type="primary"
              size="large"
              onClick={() => onAnalysisComplete && onAnalysisComplete({
                analysis: analysisResults,
                webSearchInsights,
                websiteUrl
              })}
              style={{
                backgroundColor: defaultColors.primary,
                borderColor: defaultColors.primary
              }}
            >
              Continue to Next Step
            </Button>
            <Button 
              size="large"
              onClick={handleStartOver}
            >
              Analyze Different Website
            </Button>
          </Space>
        </div>
      </Card>
    );
  };
  
  // =============================================================================
  // MAIN RENDER
  // =============================================================================
  
  return (
    <div className={className} style={{ width: '100%' }}>
      <Card style={{ ...cardStyle }}>
        {!analysisCompleted ? (
          <div>
            {renderUrlInput()}
            {loading && renderAnalysisLoading()}
          </div>
        ) : (
          renderAnalysisResults()
        )}
      </Card>
    </div>
  );
};

export default WebsiteAnalysisStepStandalone;