import React from 'react';
import { Card, Button, Row, Col, Typography, Tag, Space, Select, Input, message } from 'antd';
import { 
  EyeOutlined,
  EditOutlined,
  DatabaseOutlined,
  ReloadOutlined,
  LockOutlined,
  CheckOutlined
} from '@ant-design/icons';
import { ComponentHelpers } from '../interfaces/WorkflowComponentInterface';

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * ContentEditingStep v2
 * Complete step component with preview/edit modes and content strategy controls
 * EXTRACTED AND ENHANCED FROM: App.js step 5 content editing logic
 */
const ContentEditingStepV2 = (props) => {
  // =============================================================================
  // PROPS DESTRUCTURING WITH VALIDATION
  // =============================================================================

  const {
    // Core workflow state
    currentStep,
    stepResults,
    
    // Content editing state
    generatedContent,
    setGeneratedContent,
    previewMode,
    setPreviewMode,
    postState,
    setPostState,
    
    // Content strategy state
    contentStrategy,
    setContentStrategy,
    customFeedback = '',
    setCustomFeedback,
    
    // Loading states
    isLoading,
    blogGenerating,
    
    // Changes tracking
    showChanges = false,
    previousContent = '',
    
    // Authentication context
    user,
    requireAuth,
    setNavContext,
    setShowAuthModal,
    setAuthContext,
    
    // Business logic functions
    handleContentChange,
    getStrategyDisplayText,
    
    // Export functionality
    setShowExportWarning,
    
    // Web search insights
    webSearchInsights = { researchQuality: 'basic' },
    
    // Demo mode
    demoMode = false,
    
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

  // Helper to determine if user can edit post
  const canEditPost = () => user || demoMode;

  // Helper to determine if post is exported/locked
  const isPostLocked = () => postState === 'exported';

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  /**
   * Handle content strategy changes
   * EXTRACTED FROM: App.js handleStrategyChange() function
   */
  const handleStrategyChange = (field, value) => {
    if (isPostLocked()) {
      message.warning('Cannot modify strategy for exported posts');
      return;
    }
    
    setContentStrategy(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Handle preview/edit mode toggle
   * EXTRACTED FROM: App.js setPreviewMode toggle logic
   */
  const togglePreviewMode = () => {
    setPreviewMode(!previewMode);
  };

  /**
   * Handle regeneration with feedback
   * EXTRACTED FROM: App.js regenerateWithFeedback() function
   */
  const regenerateWithFeedback = () => {
    if (!canEditPost()) {
      if (requireAuth('Regenerate content', 'premium-gate')) {
        return;
      }
    }
    
    if (isPostLocked()) {
      message.warning('Cannot regenerate exported posts');
      return;
    }

    // This would trigger regeneration with the current content strategy and custom feedback
    message.info('Content regeneration will be triggered with your current settings');
    
    // In the actual implementation, this would call the regeneration API
    // with contentStrategy and customFeedback parameters
  };

  /**
   * Handle export/download
   * EXTRACTED FROM: App.js export button logic
   */
  const handleExport = () => {
    if (isPostLocked()) {
      message.warning('This post has already been exported and is locked.');
      return;
    }
    
    if (!demoMode && !requireAuth('Export content', 'premium-gate')) {
      return;
    }
    
    setShowExportWarning(true);
  };

  /**
   * Handle account creation prompt
   * EXTRACTED FROM: App.js auth modal triggers
   */
  const promptAccountCreation = () => {
    setAuthContext('gate');
    setShowAuthModal(true);
  };

  /**
   * Navigate to dashboard
   */
  const goToDashboard = () => {
    if (user) {
      setNavContext();
    }
  };

  // =============================================================================
  // UI HELPER FUNCTIONS
  // =============================================================================

  /**
   * Render header section with controls
   * EXTRACTED FROM: App.js editing step header
   */
  const renderHeader = () => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: responsive.isMobile ? 'flex-start' : 'center', 
      marginBottom: '20px',
      flexDirection: responsive.isMobile ? 'column' : 'row',
      gap: responsive.isMobile ? '16px' : '0'
    }}>
      <div>
        <Title level={2} style={{ 
          margin: 0, 
          color: analysis.brandColors.primary,
          fontSize: responsive.fontSize.title
        }}>
          Edit Your Generated Content
        </Title>
        {webSearchInsights.researchQuality === 'enhanced' && (
          <div style={{ marginTop: '8px' }}>
            <span style={{
              backgroundColor: '#f6ffed',
              color: '#389e0d',
              border: '1px solid #b7eb8f',
              borderRadius: '12px',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 500
            }}>
              🔍 Enhanced with Web Research
            </span>
          </div>
        )}
      </div>
      <Space size={responsive.isMobile ? 'small' : 'middle'}>
        <Button 
          icon={<EyeOutlined />} 
          onClick={togglePreviewMode}
          type={previewMode ? 'primary' : 'default'}
          style={previewMode ? {
            backgroundColor: analysis.brandColors.primary,
            borderColor: analysis.brandColors.primary
          } : {}}
        >
          {previewMode ? 'Edit Mode' : 'Preview Mode'}
        </Button>
        
        {user && (
          <Button 
            type="text"
            icon={<DatabaseOutlined />}
            onClick={goToDashboard}
            style={{ 
              color: '#52c41a',
              fontSize: '13px'
            }}
          >
            Dashboard
          </Button>
        )}
      </Space>
    </div>
  );

  /**
   * Render account creation CTA for non-users
   * EXTRACTED FROM: App.js non-user editing gate
   */
  const renderAccountCTA = () => {
    if (user) return null;
    
    return (
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '20px', 
        padding: '20px', 
        backgroundColor: '#f6ffed', 
        border: '1px solid #b7eb8f',
        borderRadius: '8px'
      }}>
        <EditOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '12px' }} />
        <Title level={4} style={{ marginBottom: '8px' }}>
          Create Account to Edit & Publish
        </Title>
        <Text>
          Your content is ready! Create a free account to edit, customize, and publish directly to your website.
        </Text>
        <br />
        <div style={{ margin: '16px 0' }}>
          <Tag color="blue">Edit Content</Tag>
          <Tag color="green">Direct Publishing</Tag>
          <Tag color="purple">Save Templates</Tag>
          <Tag color="orange">Analytics</Tag>
        </div>
        <Button 
          type="primary" 
          size="large"
          style={{ marginTop: '8px' }}
          onClick={promptAccountCreation}
        >
          Create Free Account
        </Button>
      </div>
    );
  };

  /**
   * Render brand colors indicator
   * EXTRACTED FROM: App.js brand colors display
   */
  const renderBrandColorsIndicator = () => (
    <div style={{ 
      marginBottom: '16px', 
      padding: '12px', 
      backgroundColor: analysis.brandColors.secondary + '40', 
      borderRadius: '6px' 
    }}>
      <Text strong style={{ color: analysis.brandColors.primary }}>
        Content styled with your brand colors:
      </Text>
      <Space style={{ marginLeft: '12px' }}>
        <div style={{ 
          display: 'inline-block', 
          width: '16px', 
          height: '16px', 
          backgroundColor: analysis.brandColors.primary,
          borderRadius: '2px' 
        }} />
        <div style={{ 
          display: 'inline-block', 
          width: '16px', 
          height: '16px', 
          backgroundColor: analysis.brandColors.secondary,
          borderRadius: '2px' 
        }} />
        <div style={{ 
          display: 'inline-block', 
          width: '16px', 
          height: '16px', 
          backgroundColor: analysis.brandColors.accent,
          borderRadius: '2px' 
        }} />
      </Space>
    </div>
  );

  /**
   * Render content strategy panel
   * EXTRACTED FROM: App.js content strategy controls
   */
  const renderContentStrategyPanel = () => {
    if (!canEditPost()) return null;

    return (
      <div style={{ 
        marginBottom: '20px',
        border: `2px solid ${previewMode ? '#e8e8e8' : analysis.brandColors.primary}`,
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <div style={{ 
          backgroundColor: previewMode ? '#fafafa' : analysis.brandColors.primary + '10',
          padding: '16px',
          borderBottom: '1px solid #e8e8e8'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text strong style={{ 
              fontSize: responsive.fontSize.text,
              color: previewMode ? '#666' : analysis.brandColors.primary 
            }}>
              📋 Blog Post Guidelines
            </Text>
            {demoMode && (
              <div style={{ 
                backgroundColor: '#ff4500', 
                color: 'white', 
                padding: '4px 8px', 
                borderRadius: '4px', 
                fontSize: '12px', 
                fontWeight: 'bold' 
              }}>
                DEMO MODE
              </div>
            )}
          </div>
        </div>
        
        <div style={{ padding: '16px' }}>
          {previewMode ? renderStrategyPreview() : renderStrategyEditor()}
        </div>
      </div>
    );
  };

  /**
   * Render strategy preview (read-only)
   */
  const renderStrategyPreview = () => (
    <div>
      <Row gutter={[16, 8]}>
        <Col span={12}>
          <Text style={{ fontSize: '13px', color: '#999' }}>Goal:</Text>
          <div style={{ fontSize: '15px', fontWeight: 500 }}>
            {getStrategyDisplayText('goal', contentStrategy.goal)}
          </div>
        </Col>
        <Col span={12}>
          <Text style={{ fontSize: '13px', color: '#999' }}>Voice:</Text>
          <div style={{ fontSize: '15px', fontWeight: 500 }}>
            {getStrategyDisplayText('voice', contentStrategy.voice)}
          </div>
        </Col>
        <Col span={12}>
          <Text style={{ fontSize: '13px', color: '#999' }}>Template:</Text>
          <div style={{ fontSize: '15px', fontWeight: 500 }}>
            {getStrategyDisplayText('template', contentStrategy.template)}
          </div>
        </Col>
        <Col span={12}>
          <Text style={{ fontSize: '13px', color: '#999' }}>Length:</Text>
          <div style={{ fontSize: '15px', fontWeight: 500 }}>
            {getStrategyDisplayText('length', contentStrategy.length)}
          </div>
        </Col>
      </Row>
      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        backgroundColor: '#f0f8ff', 
        borderRadius: '6px',
        textAlign: 'center'
      }}>
        <Text style={{ fontSize: responsive.fontSize.small, color: '#1890ff' }}>
          💡 Want to optimize for conversion or try a different approach?
        </Text>
        <br />
        <Text style={{ fontSize: '12px', color: '#666' }}>
          Switch to Edit Mode to customize your content strategy ↗
        </Text>
      </div>
    </div>
  );

  /**
   * Render strategy editor (interactive controls)
   */
  const renderStrategyEditor = () => (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={responsive.isMobile ? 24 : 12}>
          <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
            Content Goal
          </Text>
          <Select
            value={contentStrategy.goal}
            style={{ width: '100%' }}
            onChange={(value) => handleStrategyChange('goal', value)}
            disabled={isPostLocked()}
          >
            <Select.Option value="awareness">Awareness - Build brand recognition</Select.Option>
            <Select.Option value="consideration">Consideration - Build trust, compare solutions</Select.Option>
            <Select.Option value="conversion">Conversion - Drive sales, generate leads</Select.Option>
            <Select.Option value="retention">Retention - Engage existing customers</Select.Option>
          </Select>
        </Col>
        <Col span={responsive.isMobile ? 24 : 12}>
          <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
            Voice & Tone
          </Text>
          <Select
            value={contentStrategy.voice}
            style={{ width: '100%' }}
            onChange={(value) => handleStrategyChange('voice', value)}
            disabled={isPostLocked()}
          >
            <Select.Option value="expert">Professional Expert - Authoritative, data-driven</Select.Option>
            <Select.Option value="friendly">Friendly Guide - Conversational, supportive</Select.Option>
            <Select.Option value="insider">Industry Insider - Technical, insider knowledge</Select.Option>
            <Select.Option value="storyteller">Storyteller - Narrative-driven, emotional</Select.Option>
          </Select>
        </Col>
        <Col span={responsive.isMobile ? 24 : 12}>
          <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
            Content Template
          </Text>
          <Select
            value={contentStrategy.template}
            style={{ width: '100%' }}
            onChange={(value) => handleStrategyChange('template', value)}
            disabled={isPostLocked()}
          >
            <Select.Option value="how-to">How-To Guide - Step-by-step, actionable</Select.Option>
            <Select.Option value="problem-solution">Problem-Solution - Identify issue, provide solution</Select.Option>
            <Select.Option value="listicle">Listicle - Top X tips/strategies/tools</Select.Option>
            <Select.Option value="case-study">Case Study - Real example, results-focused</Select.Option>
            <Select.Option value="comprehensive">Comprehensive Guide - In-depth, authoritative</Select.Option>
          </Select>
        </Col>
        <Col span={responsive.isMobile ? 24 : 12}>
          <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
            Content Length
          </Text>
          <Select
            value={contentStrategy.length}
            style={{ width: '100%' }}
            onChange={(value) => handleStrategyChange('length', value)}
            disabled={isPostLocked()}
          >
            <Select.Option value="quick">Quick Read - 800-1000 words</Select.Option>
            <Select.Option value="standard">Standard - 1200-1500 words</Select.Option>
            <Select.Option value="deep">Deep Dive - 2000+ words</Select.Option>
          </Select>
        </Col>
      </Row>
      
      {/* Custom Feedback Section */}
      <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e8e8e8' }}>
        <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
          Additional Instructions
        </Text>
        <TextArea
          value={customFeedback}
          onChange={(e) => setCustomFeedback(e.target.value)}
          placeholder="Provide specific feedback to improve the blog post (e.g., 'Add more statistics', 'Make it more conversational', 'Include specific examples about X')..."
          rows={4}
          style={{ marginBottom: '16px' }}
          disabled={isPostLocked()}
        />
        
        {/* Regenerate Button */}
        <div style={{ textAlign: 'center' }}>
          <Button
            type="primary"
            size="large"
            icon={!isLoading && !blogGenerating ? (user ? <ReloadOutlined /> : <LockOutlined />) : undefined}
            loading={isLoading || blogGenerating}
            onClick={regenerateWithFeedback}
            disabled={isPostLocked()}
            style={{
              backgroundColor: user ? '#52c41a' : analysis.brandColors.primary,
              borderColor: user ? '#52c41a' : analysis.brandColors.primary,
              minWidth: '150px',
              fontWeight: '500',
              boxShadow: user ? `0 2px 8px #52c41a30` : `0 2px 8px ${analysis.brandColors.primary}30`
            }}
          >
            {isLoading || blogGenerating ? 'Regenerating...' : (user ? '✓ Regenerate' : 'Regenerate')}
          </Button>
        </div>
      </div>
    </div>
  );

  /**
   * Render exported post status banner
   * EXTRACTED FROM: App.js exported post banner
   */
  const renderExportedBanner = () => {
    if (!isPostLocked()) return null;
    
    return (
      <div style={{ 
        marginBottom: '20px',
        padding: '16px',
        backgroundColor: '#f6ffed',
        border: '1px solid #b7eb8f',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <CheckOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
          <Text strong style={{ color: '#52c41a' }}>Content Successfully Exported</Text>
        </div>
        <Text style={{ fontSize: responsive.fontSize.small, color: '#666' }}>
          This post has been exported and is now locked. To make changes, please generate a new post.
        </Text>
        <div style={{ marginTop: '12px' }}>
          <Text strong style={{ fontSize: '13px', color: '#389e0d' }}>Final Strategy: </Text>
          <Text style={{ fontSize: '13px' }}>
            {getStrategyDisplayText('goal', contentStrategy.goal)} | {getStrategyDisplayText('voice', contentStrategy.voice)} | {getStrategyDisplayText('template', contentStrategy.template)}
          </Text>
        </div>
      </div>
    );
  };

  /**
   * Render content area (preview or edit)
   * EXTRACTED FROM: App.js content editing area
   */
  const renderContentArea = () => (
    <div>
      {previewMode ? (
        <div style={{ minHeight: '600px' }}>
          <Title level={4} style={{ marginBottom: '16px', color: analysis.brandColors.primary }}>
            Styled Preview
          </Title>
          {/* Note: renderStyledContent would be implemented separately */}
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#fafafa', 
            borderRadius: '8px',
            fontFamily: 'serif',
            lineHeight: '1.6'
          }}>
            <div style={{ 
              whiteSpace: 'pre-wrap',
              fontSize: responsive.fontSize.text
            }}>
              {generatedContent || 'Generated content will appear here...'}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <Title level={4} style={{ marginBottom: '16px' }}>Edit Content</Title>
          <TextArea
            value={generatedContent}
            onChange={handleContentChange}
            rows={25}
            style={{ fontFamily: 'monospace', fontSize: '14px' }}
            placeholder="Your generated content will appear here..."
            disabled={isPostLocked()}
          />
        </div>
      )}
    </div>
  );

  /**
   * Render export button
   * EXTRACTED FROM: App.js export button
   */
  const renderExportButton = () => (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <Button 
        type="primary" 
        size="large"
        icon={!isPostLocked() ? <LockOutlined /> : undefined}
        onClick={handleExport}
        disabled={isPostLocked()}
        style={{ 
          backgroundColor: analysis.brandColors.primary, 
          borderColor: analysis.brandColors.primary,
          fontWeight: '500',
          boxShadow: `0 2px 8px ${analysis.brandColors.primary}30`
        }}
      >
        {isPostLocked() ? 'Post Exported & Locked' : 'Download Your Content'}
      </Button>
    </div>
  );

  // =============================================================================
  // VALIDATION AND ERROR HANDLING
  // =============================================================================

  // Only show this step if we're at step 4 and not currently generating
  if (currentStep < 4 || blogGenerating) {
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
      {/* Header */}
      {renderHeader()}

      {/* Account Creation CTA */}
      {renderAccountCTA()}

      <Card style={{ marginBottom: '20px' }}>
        {/* Brand Colors Indicator */}
        {renderBrandColorsIndicator()}

        {/* Content Strategy Panel */}
        {renderContentStrategyPanel()}

        {/* Exported Post Banner */}
        {renderExportedBanner()}

        {/* Changes Summary would be rendered here if showChanges is true */}
        
        {/* Content Area */}
        {renderContentArea()}
        
        {/* Export Button */}
        {renderExportButton()}
      </Card>
    </div>
  );
};

ContentEditingStepV2.displayName = 'ContentEditingStepV2';

export default ContentEditingStepV2;