import React, { useState } from 'react';
import { Card, Button, Row, Col, Typography, Tag, Space, Radio, Divider, Tabs, message } from 'antd';
import { 
  FileMarkdownOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  FileZipOutlined,
  DownloadOutlined,
  CheckOutlined,
  CopyOutlined,
  ApiOutlined,
  CodeOutlined
} from '@ant-design/icons';
import { ComponentHelpers } from '../interfaces/WorkflowComponentInterface';
import { ExportService } from '../../../services/exportService';
import { workflowConfig } from '../../../services/workflowAPI';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

/**
 * ExportStep v2
 * Complete step component with format selection and CMS integration
 * EXTRACTED AND ENHANCED FROM: App.js export functionality and ExportService
 */
const ExportStepV2 = (props) => {
  // =============================================================================
  // PROPS DESTRUCTURING WITH VALIDATION
  // =============================================================================

  const {
    // Core workflow state
    currentStep,
    stepResults,
    selectedTopic,
    generatedContent,
    websiteUrl,
    
    // Export state
    postState,
    setPostState,
    setPreviewMode,
    selectedCMS,
    setSelectedCMS,
    
    // Authentication context
    user,
    requireAuth,
    
    // Export functions from WorkflowContainer
    exportAsMarkdown,
    exportAsHTML,
    exportAsJSON,
    exportCompletePackage,
    
    // Configuration
    embedded = false,
    
    // Brand colors helper
    getBrandColors = ComponentHelpers.getBrandColors
  } = props;

  // =============================================================================
  // LOCAL STATE AND HELPERS
  // =============================================================================

  const [selectedFormat, setSelectedFormat] = useState('markdown');
  const [showIntegrationCode, setShowIntegrationCode] = useState(false);
  const [activeTab, setActiveTab] = useState('formats');
  
  const responsive = ComponentHelpers.getResponsiveStyles();
  const brandColors = getBrandColors(stepResults);
  const analysis = stepResults?.websiteAnalysis || {};

  // Get export formats and CMS options
  const exportFormats = ExportService.getAvailableFormats();
  const cmsOptions = workflowConfig.cmsOptions;

  // Check if post can be exported
  const exportStatus = ExportService.canExport(selectedTopic, generatedContent, stepResults);
  const exportPreview = ExportService.getExportPreview(selectedTopic, generatedContent, stepResults, websiteUrl);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  /**
   * Handle format selection
   */
  const handleFormatSelection = (formatKey) => {
    setSelectedFormat(formatKey);
  };

  /**
   * Handle CMS selection
   */
  const handleCMSSelection = (cmsId) => {
    setSelectedCMS(cmsId);
    setShowIntegrationCode(true);
  };

  /**
   * Handle export download
   */
  const handleExport = async (formatKey = selectedFormat) => {
    if (!exportStatus.canExport) {
      message.error(exportStatus.reason);
      return;
    }

    if (!user && !requireAuth('Export content', 'export-gate')) {
      return;
    }

    try {
      let success = false;
      
      switch (formatKey) {
        case 'markdown':
          success = exportAsMarkdown();
          break;
        case 'html':
          success = exportAsHTML();
          break;
        case 'json':
          success = exportAsJSON();
          break;
        case 'package':
          success = exportCompletePackage();
          break;
        default:
          message.error('Invalid format selected');
          return;
      }

      if (success) {
        message.success(`Content exported as ${formatKey.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export content');
    }
  };

  /**
   * Copy integration code to clipboard
   */
  const copyIntegrationCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      message.success('Integration code copied to clipboard');
    } catch (error) {
      message.error('Failed to copy code');
    }
  };

  // =============================================================================
  // UI HELPER FUNCTIONS
  // =============================================================================

  /**
   * Render export format cards
   */
  const renderExportFormats = () => (
    <div>
      <Title level={4} style={{ marginBottom: '20px' }}>
        Choose Export Format
      </Title>
      
      <Row gutter={[16, 16]}>
        {exportFormats.map((format) => (
          <Col key={format.key} xs={24} sm={12} md={6}>
            <Card
              hoverable={!format.disabled}
              style={{
                border: selectedFormat === format.key ? `2px solid ${brandColors.primary}` : '1px solid #f0f0f0',
                opacity: format.disabled ? 0.5 : 1,
                cursor: format.disabled ? 'not-allowed' : 'pointer',
                textAlign: 'center',
                height: '100%'
              }}
              onClick={() => !format.disabled && handleFormatSelection(format.key)}
            >
              <div style={{ marginBottom: '12px' }}>
                {format.key === 'markdown' && <FileMarkdownOutlined style={{ fontSize: '32px', color: format.color }} />}
                {format.key === 'html' && <FileTextOutlined style={{ fontSize: '32px', color: format.color }} />}
                {format.key === 'json' && <DatabaseOutlined style={{ fontSize: '32px', color: format.color }} />}
                {format.key === 'package' && <FileZipOutlined style={{ fontSize: '32px', color: format.color }} />}
              </div>
              
              <Title level={5} style={{ margin: '0 0 8px 0' }}>
                {format.name}
                {format.disabled && <Tag color="orange" style={{ marginLeft: '8px', fontSize: '10px' }}>Coming Soon</Tag>}
              </Title>
              
              <Text style={{ fontSize: '12px', color: '#666' }}>
                {format.description}
              </Text>
              
              <div style={{ marginTop: '12px' }}>
                <Tag color={format.color} style={{ fontSize: '10px' }}>
                  {format.extension}
                </Tag>
                <Tag style={{ fontSize: '10px' }}>
                  {format.mimeType}
                </Tag>
              </div>
              
              {selectedFormat === format.key && (
                <div style={{ marginTop: '8px' }}>
                  <CheckOutlined style={{ color: brandColors.primary, fontSize: '16px' }} />
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {/* Quick Download Buttons */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Space size="middle">
          <Button
            type="primary"
            size="large"
            icon={<DownloadOutlined />}
            onClick={() => handleExport()}
            disabled={!exportStatus.canExport}
            style={{
              backgroundColor: brandColors.primary,
              borderColor: brandColors.primary
            }}
          >
            Download {exportFormats.find(f => f.key === selectedFormat)?.name}
          </Button>
          
          <Button
            size="large"
            onClick={() => handleExport('html')}
            disabled={!exportStatus.canExport}
          >
            Quick HTML
          </Button>
          
          <Button
            size="large"
            onClick={() => handleExport('markdown')}
            disabled={!exportStatus.canExport}
          >
            Quick Markdown
          </Button>
        </Space>
      </div>
    </div>
  );

  /**
   * Render CMS integration options
   */
  const renderCMSIntegration = () => (
    <div>
      <Title level={4} style={{ marginBottom: '20px' }}>
        CMS Platform Integration
      </Title>
      
      <Paragraph style={{ color: '#666', marginBottom: '20px' }}>
        Select your content management system for direct integration and publishing.
      </Paragraph>
      
      <Row gutter={[16, 16]}>
        {cmsOptions.map((cms) => (
          <Col key={cms.id} xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{
                border: selectedCMS === cms.id ? `2px solid ${brandColors.primary}` : '1px solid #f0f0f0',
                textAlign: 'center',
                height: '100%'
              }}
              onClick={() => handleCMSSelection(cms.id)}
            >
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '32px' }}>{cms.logo}</span>
              </div>
              
              <Title level={5} style={{ margin: '0 0 8px 0' }}>
                {cms.name}
              </Title>
              
              <Text style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '8px' }}>
                {cms.description}
              </Text>
              
              <div style={{ marginBottom: '8px' }}>
                <Tag color={cms.complexity === 'Simple' ? 'green' : cms.complexity === 'Medium' ? 'orange' : 'red'}>
                  {cms.complexity}
                </Tag>
              </div>
              
              <Text style={{ fontSize: '12px', color: '#999' }}>
                {cms.integration}
              </Text>
              
              {selectedCMS === cms.id && (
                <div style={{ marginTop: '8px' }}>
                  <CheckOutlined style={{ color: brandColors.primary, fontSize: '16px' }} />
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>
      
      {selectedCMS && showIntegrationCode && renderIntegrationCode()}
    </div>
  );

  /**
   * Render integration code for selected CMS
   */
  const renderIntegrationCode = () => {
    if (!selectedCMS) return null;
    
    const selectedCMSData = cmsOptions.find(cms => cms.id === selectedCMS);
    if (!selectedCMSData) return null;
    
    // This would use CMSIntegrationService from exportService.js
    const integrationCode = `// ${selectedCMSData.name} Integration\n// Integration code for ${selectedCMSData.name} would be generated here\n// This includes API endpoints, authentication, and content formatting`;
    
    return (
      <div style={{ marginTop: '24px' }}>
        <Divider />
        <Title level={5} style={{ marginBottom: '16px' }}>
          <ApiOutlined /> {selectedCMSData.name} Integration Code
        </Title>
        
        <Card style={{ backgroundColor: '#f6f8fa', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <Text strong>Integration Instructions</Text>
            <Button 
              size="small" 
              icon={<CopyOutlined />}
              onClick={() => copyIntegrationCode(integrationCode)}
            >
              Copy Code
            </Button>
          </div>
          
          <pre style={{ 
            backgroundColor: '#282c34', 
            color: '#abb2bf', 
            padding: '16px', 
            borderRadius: '6px',
            overflow: 'auto',
            fontSize: '12px',
            margin: 0
          }}>
            <code>{integrationCode}</code>
          </pre>
        </Card>
        
        <div style={{ padding: '12px', backgroundColor: '#e6f7ff', borderRadius: '6px', border: '1px solid #91d5ff' }}>
          <Text style={{ fontSize: '13px', color: '#1890ff' }}>
            <CodeOutlined /> Integration complexity: <strong>{selectedCMSData.complexity}</strong> • 
            Setup time: {selectedCMSData.complexity === 'Simple' ? '5-10 minutes' : selectedCMSData.complexity === 'Medium' ? '15-30 minutes' : '30+ minutes'}
          </Text>
        </div>
      </div>
    );
  };

  /**
   * Render export preview
   */
  const renderExportPreview = () => {
    if (!exportPreview) return null;
    
    return (
      <div>
        <Title level={4} style={{ marginBottom: '20px' }}>
          Export Preview
        </Title>
        
        <Card style={{ marginBottom: '20px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div style={{ marginBottom: '16px' }}>
                <Text strong style={{ color: brandColors.primary, display: 'block', marginBottom: '4px' }}>
                  Title
                </Text>
                <Text style={{ fontSize: responsive.fontSize.text }}>
                  {exportPreview.title}
                </Text>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <Text strong style={{ color: brandColors.primary, display: 'block', marginBottom: '4px' }}>
                  Business
                </Text>
                <Text style={{ fontSize: responsive.fontSize.small }}>
                  {exportPreview.businessName}
                </Text>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <Text strong style={{ color: brandColors.primary, display: 'block', marginBottom: '4px' }}>
                  File Name
                </Text>
                <Text code style={{ fontSize: responsive.fontSize.small }}>
                  {exportPreview.slug}
                </Text>
              </div>
            </Col>
            
            <Col xs={24} md={12}>
              <div style={{ marginBottom: '16px' }}>
                <Text strong style={{ color: brandColors.primary, display: 'block', marginBottom: '4px' }}>
                  Content Stats
                </Text>
                <Space>
                  <Tag>{exportPreview.wordCount} words</Tag>
                  <Tag>{exportPreview.readingTime} min read</Tag>
                </Space>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <Text strong style={{ color: brandColors.primary, display: 'block', marginBottom: '4px' }}>
                  Category & Tags
                </Text>
                <div>
                  <Tag color="blue">{exportPreview.category}</Tag>
                  {exportPreview.tags.slice(0, 3).map((tag, index) => (
                    <Tag key={index}>{tag}</Tag>
                  ))}
                </div>
              </div>
              
              <div>
                <Text strong style={{ color: brandColors.primary, display: 'block', marginBottom: '4px' }}>
                  Brand Colors
                </Text>
                <Space>
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    backgroundColor: exportPreview.brandColors.primary,
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }} />
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    backgroundColor: exportPreview.brandColors.secondary,
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }} />
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    backgroundColor: exportPreview.brandColors.accent,
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }} />
                </Space>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    );
  };

  /**
   * Render export status banner
   */
  const renderExportStatus = () => {
    if (!exportStatus.canExport) {
      return (
        <div style={{
          padding: '16px',
          backgroundColor: '#fff2e8',
          border: '1px solid #ffbb96',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <Text style={{ color: '#d4380d', fontSize: responsive.fontSize.small }}>
            ⚠️ {exportStatus.reason}
          </Text>
        </div>
      );
    }

    if (postState === 'exported') {
      return (
        <div style={{
          padding: '16px',
          backgroundColor: '#f6ffed',
          border: '1px solid #b7eb8f',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <CheckOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
            <Text strong style={{ color: '#52c41a' }}>Content Successfully Exported</Text>
          </div>
          <Text style={{ fontSize: responsive.fontSize.small, color: '#666' }}>
            Your content has been downloaded and is ready to publish!
          </Text>
        </div>
      );
    }

    return (
      <div style={{
        padding: '16px',
        backgroundColor: '#e6f7ff',
        border: '1px solid #91d5ff',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <Text style={{ color: '#1890ff', fontSize: responsive.fontSize.small }}>
          ✅ Content ready for export in multiple formats
        </Text>
      </div>
    );
  };

  // =============================================================================
  // VALIDATION AND ERROR HANDLING
  // =============================================================================

  // Only show this step if we're at step 6 or beyond, or when export is triggered
  if (currentStep < 5 && postState !== 'exported') {
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
      <Card>
        <Title level={3} style={{ 
          textAlign: 'center', 
          marginBottom: '30px',
          color: brandColors.primary,
          fontSize: responsive.fontSize.title
        }}>
          🚀 Export Your Content
        </Title>

        {/* Export Status Banner */}
        {renderExportStatus()}

        {/* Export Preview */}
        {renderExportPreview()}

        {/* Tabbed Interface */}
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          size="large"
          style={{ marginTop: '20px' }}
        >
          <TabPane tab="📄 Export Formats" key="formats">
            {renderExportFormats()}
          </TabPane>
          
          <TabPane tab="🔌 CMS Integration" key="cms">
            {renderCMSIntegration()}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

ExportStepV2.displayName = 'ExportStepV2';

export default ExportStepV2;