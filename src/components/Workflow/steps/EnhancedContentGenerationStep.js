import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Row, Col, Space, Spin, message } from 'antd';
import { 
  EditOutlined, 
  RocketOutlined, 
  SettingOutlined,
  PictureOutlined
} from '@ant-design/icons';

// Import our new components
import EnhancementStatusIndicator from '../../EnhancementStatus/EnhancementStatusIndicator';
import ManualInputModal from '../../ManualInputs/ManualInputModal';
import VisualContentSuggestions from '../../VisualContent/VisualContentSuggestions';

const { Title, Text, Paragraph } = Typography;

/**
 * Enhanced Content Generation Step
 * Includes smart enhancement detection, manual input fallbacks, and visual content
 */
const EnhancedContentGenerationStep = ({
  currentStep,
  setCurrentStep,
  generatedContent,
  isLoading,
  blogGenerating,
  user,
  requireAuth,
  // New props for enhanced functionality
  organizationData = null,
  websiteAnalysis = null,
  manualInputs = {},
  onGenerateContent,
  onSaveManualInputs,
  onGenerateVisual,
  enhancementResult = null
}) => {
  const [manualInputModal, setManualInputModal] = useState(false);
  const [enhancementStatus, setEnhancementStatus] = useState(null);

  // Calculate enhancement status when component mounts or data changes
  useEffect(() => {
    const calculateEnhancementStatus = () => {
      const organizationId = organizationData?.id;
      const hasWebsiteAnalysis = !!(websiteAnalysis && Object.keys(websiteAnalysis).length > 0);
      const hasManualInputs = !!(manualInputs && Object.keys(manualInputs).length > 0);
      
      const canEnhance = !!(organizationId && (hasWebsiteAnalysis || hasManualInputs));
      
      let status = 'basic';
      let message = '';
      let reasons = [];
      let capabilities = [];
      
      if (!organizationId) {
        status = 'basic';
        message = 'Using basic generation - no organization data available';
        reasons.push('No organization ID available');
      } else if (!hasWebsiteAnalysis && !hasManualInputs) {
        status = 'limited';
        message = 'Limited enhancement - organization found but no analysis data';
        reasons.push('Complete website analysis or add manual inputs');
      } else {
        status = 'enhanced';
        message = 'Full enhancement enabled - targeting 95+ SEO scores';
        
        if (hasWebsiteAnalysis) {
          capabilities.push('Website analysis integration', 'Brand voice matching', 'CTA optimization');
        }
        
        if (hasManualInputs) {
          capabilities.push('Manual input integration', 'Custom brand guidelines');
        }
        
        capabilities.push('95+ SEO score targeting', 'Visual content suggestions', 'Enhanced prompts');
      }
      
      return {
        canEnhance,
        organizationId,
        status,
        message,
        reasons,
        capabilities,
        hasWebsiteAnalysis,
        hasManualInputs,
        canGenerateVisuals: canEnhance,
        dataCompleteness: hasWebsiteAnalysis && hasManualInputs ? 'high' :
                         hasWebsiteAnalysis || hasManualInputs ? 'medium' : 'low'
      };
    };

    setEnhancementStatus(calculateEnhancementStatus());
  }, [organizationData, websiteAnalysis, manualInputs]);

  const handleGenerateContent = async () => {
    if (!onGenerateContent) return;
    
    const enhancedPayload = {
      organizationId: organizationData?.id,
      comprehensiveContext: {
        organizationId: organizationData?.id,
        websiteAnalysis: websiteAnalysis
      },
      manualInputs: manualInputs,
      targetSEOScore: 95,
      includeVisuals: enhancementStatus?.canGenerateVisuals || false
    };

    try {
      await onGenerateContent(enhancedPayload);
    } catch (error) {
      message.error('Failed to generate content: ' + error.message);
    }
  };

  const handleSaveManualInputs = async (inputData) => {
    if (!onSaveManualInputs) return;
    
    try {
      await onSaveManualInputs(organizationData?.id, inputData);
      message.success('Manual inputs saved successfully!');
      // The enhancement status will be recalculated via useEffect
    } catch (error) {
      message.error('Failed to save manual inputs: ' + error.message);
      throw error;
    }
  };

  const continueToContentEditing = () => {
    setCurrentStep(4);
  };

  const showDataSources = () => {
    const sources = [];
    if (enhancementStatus?.hasWebsiteAnalysis) sources.push('Website Analysis');
    if (enhancementStatus?.hasManualInputs) sources.push('Manual Inputs');
    if (sources.length === 0) sources.push('Basic Generation Only');
    
    message.info(`Data Sources: ${sources.join(', ')}`);
  };

  if (currentStep !== 3) return null;

  return (
    <>
      <Card>
        <div style={{ padding: '20px' }}>
          {/* Enhancement Status Indicator */}
          {enhancementStatus && (
            <EnhancementStatusIndicator
              enhancementStatus={enhancementStatus}
              onShowManualInputs={() => setManualInputModal(true)}
              onViewDataSources={showDataSources}
              style={{ marginBottom: 24 }}
            />
          )}

          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            {enhancementStatus?.status === 'enhanced' ? (
              <RocketOutlined 
                style={{ 
                  fontSize: '64px', 
                  color: '#52c41a', 
                  marginBottom: '24px'
                }} 
              />
            ) : (
              <EditOutlined 
                style={{ 
                  fontSize: '64px', 
                  color: enhancementStatus?.status === 'limited' ? '#faad14' : '#1890ff', 
                  marginBottom: '24px'
                }} 
              />
            )}
            
            <Title level={2} style={{ marginBottom: '16px' }}>
              {blogGenerating ? 'Creating Your Content' : 'Ready to Generate Content'}
            </Title>
            
            {blogGenerating ? (
              <div>
                <Paragraph style={{ fontSize: '16px', marginBottom: '32px' }}>
                  {enhancementStatus?.status === 'enhanced' 
                    ? 'AI is writing your personalized blog post using your organization data...'
                    : 'AI is creating your blog post...'
                  }
                </Paragraph>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>Content generation in progress...</div>
              </div>
            ) : (
              <div>
                <Paragraph style={{ fontSize: '16px', marginBottom: '32px' }}>
                  {enhancementStatus?.status === 'enhanced' 
                    ? 'Your content will be optimized using your organization\'s website analysis and targeting 95+ SEO scores.'
                    : enhancementStatus?.status === 'limited'
                    ? 'Content will be generated with basic enhancement. Add manual inputs for better quality.'
                    : 'Basic content generation is ready. Connect organization data for enhanced features.'
                  }
                </Paragraph>
                
                <Row gutter={16} justify="center">
                  <Col>
                    <Button 
                      type="primary" 
                      size="large"
                      icon={enhancementStatus?.status === 'enhanced' ? <RocketOutlined /> : <EditOutlined />}
                      onClick={handleGenerateContent}
                      style={{ minWidth: '200px' }}
                      disabled={!onGenerateContent}
                    >
                      {enhancementStatus?.status === 'enhanced' 
                        ? 'Generate Enhanced Content'
                        : 'Generate Content'
                      }
                    </Button>
                  </Col>
                  
                  {enhancementStatus?.status !== 'enhanced' && (
                    <Col>
                      <Button 
                        size="large"
                        icon={<SettingOutlined />}
                        onClick={() => setManualInputModal(true)}
                        style={{ minWidth: '180px' }}
                      >
                        Add Manual Inputs
                      </Button>
                    </Col>
                  )}
                </Row>

                {generatedContent && (
                  <div style={{ marginTop: 32 }}>
                    <Button 
                      type="default"
                      size="large"
                      onClick={continueToContentEditing}
                      style={{ minWidth: '200px' }}
                    >
                      Continue to Editing
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Visual Content Suggestions */}
          {enhancementResult?.visualSuggestions && enhancementResult.visualSuggestions.length > 0 && (
            <VisualContentSuggestions
              visualSuggestions={enhancementResult.visualSuggestions}
              onGenerateVisual={onGenerateVisual}
              style={{ marginTop: 24 }}
            />
          )}

          {/* Generation Results Summary */}
          {enhancementResult && (
            <Card 
              size="small" 
              title="Generation Results" 
              style={{ marginTop: 24 }}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={4} style={{ color: '#52c41a', margin: 0 }}>
                      {enhancementResult.qualityPrediction?.expectedSEOScore || 'N/A'}
                    </Title>
                    <Text type="secondary">Predicted SEO Score</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={4} style={{ color: '#1890ff', margin: 0 }}>
                      {enhancementResult.enhancementStatus?.dataCompleteness.toUpperCase()}
                    </Title>
                    <Text type="secondary">Data Quality</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={4} style={{ color: '#722ed1', margin: 0 }}>
                      {enhancementResult.visualSuggestions?.length || 0}
                    </Title>
                    <Text type="secondary">Visual Suggestions</Text>
                  </div>
                </Col>
              </Row>
              
              {enhancementResult.generationTimeMs && (
                <div style={{ marginTop: 12, textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Generated in {(enhancementResult.generationTimeMs / 1000).toFixed(1)}s
                  </Text>
                </div>
              )}
            </Card>
          )}
        </div>
      </Card>

      {/* Manual Input Modal */}
      <ManualInputModal
        visible={manualInputModal}
        onClose={() => setManualInputModal(false)}
        onSave={handleSaveManualInputs}
        organizationId={organizationData?.id}
        initialData={manualInputs}
      />
    </>
  );
};

export default EnhancedContentGenerationStep;