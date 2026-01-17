import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Typography, Input, Switch, Space, message, 
  Spin, Row, Col, Tag, Divider 
} from 'antd';
import { 
  EditOutlined,
  EyeOutlined,
  SaveOutlined,
  DownloadOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { ComponentHelpers } from '../interfaces/WorkflowComponentInterface';
import { contentAPI } from '../../../services/workflowAPI';
import MarkdownPreview from '../../MarkdownPreview/MarkdownPreview';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

/**
 * Standalone Content Generation Step Component
 * Reusable component for content generation, editing, and preview
 * Can be used in Posts tab, New Post workflow, and other locations
 */
const ContentGenerationStepStandalone = ({
  // Core state
  selectedTopic,
  analysisResults,
  selectedCustomerStrategy,
  webSearchInsights,
  generatedContent,
  setGeneratedContent,
  contentStrategy,
  
  // Loading states
  isGenerating,
  setIsGenerating,
  contentGenerated,
  setContentGenerated,
  
  // Edit state
  editingContent,
  setEditingContent,
  previewMode,
  setPreviewMode,
  
  // User context
  user,
  requireAuth,
  
  // Event handlers
  onContentGenerated,
  onContentSaved,
  onContentExported,
  
  // Configuration
  embedded = false,
  showTitle = true,
  showPreviewToggle = true,
  showExportButton = true,
  autoGenerate = false,
  
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
  
  // Local state management if parent doesn't provide it
  const [localGeneratedContent, setLocalGeneratedContent] = useState('');
  const [localEditingContent, setLocalEditingContent] = useState('');
  const [localIsGenerating, setLocalIsGenerating] = useState(false);
  const [localContentGenerated, setLocalContentGenerated] = useState(false);
  const [localPreviewMode, setLocalPreviewMode] = useState(true);
  
  const currentGeneratedContent = generatedContent !== undefined ? generatedContent : localGeneratedContent;
  const currentEditingContent = editingContent !== undefined ? editingContent : localEditingContent;
  const generating = isGenerating !== undefined ? isGenerating : localIsGenerating;
  const generated = contentGenerated !== undefined ? contentGenerated : localContentGenerated;
  const preview = previewMode !== undefined ? previewMode : localPreviewMode;
  
  // Auto-generate content on mount if requested
  useEffect(() => {
    if (autoGenerate && selectedTopic && !generated && !generating) {
      handleGenerateContent();
    }
  }, [autoGenerate, selectedTopic, generated, generating]);
  
  // Sync editing content with generated content
  useEffect(() => {
    if (currentGeneratedContent && !currentEditingContent) {
      const updateEditingContent = setEditingContent || setLocalEditingContent;
      updateEditingContent(currentGeneratedContent);
    }
  }, [currentGeneratedContent, currentEditingContent]);
  
  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  
  /**
   * Generate content based on selected topic
   */
  const handleGenerateContent = async () => {
    if (!selectedTopic) {
      message.warning('Please select a topic first');
      return;
    }
    
    const updateGenerating = setIsGenerating || setLocalIsGenerating;
    const updateGeneratedContent = setGeneratedContent || setLocalGeneratedContent;
    const updateContentGenerated = setContentGenerated || setLocalContentGenerated;
    const updateEditingContent = setEditingContent || setLocalEditingContent;
    
    updateGenerating(true);
    
    try {
      const result = await contentAPI.generateContent({
        topic: selectedTopic,
        analysisResults,
        selectedCustomerStrategy,
        webSearchInsights: webSearchInsights || { researchQuality: 'basic' },
        contentStrategy: contentStrategy || 'informative'
      });
      
      if (result.success) {
        updateGeneratedContent(result.content);
        updateEditingContent(result.content);
        updateContentGenerated(true);
        
        message.success('Blog content generated successfully!');
        
        onContentGenerated && onContentGenerated({
          content: result.content,
          blogPost: result.blogPost,
          topic: selectedTopic
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Content generation error:', error);
      message.error(`Failed to generate content: ${error.message}`);
    } finally {
      updateGenerating(false);
    }
  };
  
  /**
   * Handle content editing
   */
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    const updateEditingContent = setEditingContent || setLocalEditingContent;
    updateEditingContent(newContent);
  };
  
  /**
   * Toggle between preview and edit mode
   */
  const togglePreviewMode = () => {
    const updatePreviewMode = setPreviewMode || setLocalPreviewMode;
    updatePreviewMode(!preview);
  };
  
  /**
   * Save content changes
   */
  const handleSaveContent = () => {
    const updateGeneratedContent = setGeneratedContent || setLocalGeneratedContent;
    updateGeneratedContent(currentEditingContent);
    
    message.success('Content saved successfully!');
    
    onContentSaved && onContentSaved({
      content: currentEditingContent,
      topic: selectedTopic
    });
  };
  
  /**
   * Export content
   */
  const handleExportContent = () => {
    // Create a simple text file download
    const element = document.createElement('a');
    const file = new Blob([currentEditingContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${selectedTopic?.title || 'blog-post'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    message.success('Content exported successfully!');
    
    onContentExported && onContentExported({
      content: currentEditingContent,
      topic: selectedTopic,
      format: 'txt'
    });
  };
  
  // =============================================================================
  // RENDER HELPERS
  // =============================================================================
  
  /**
   * Render generation loading state
   */
  const renderGeneratingState = () => (
    <div style={{ textAlign: 'center', padding: responsive.padding }}>
      <div style={{ 
        fontSize: responsive.isMobile ? '48px' : '64px', 
        marginBottom: '24px',
        animation: 'pulse 2s infinite'
      }}>
        ✍️
      </div>
      
      <Title level={2} style={{ 
        marginBottom: '20px',
        color: brandColors.primary || defaultColors.primary,
        fontSize: responsive.fontSize.title
      }}>
        Generating Your Blog Post
      </Title>
      
      <Spin size="large" style={{ marginBottom: '20px' }} />
      
      <Paragraph style={{ 
        fontSize: responsive.fontSize.text, 
        color: '#666', 
        marginBottom: '30px',
        maxWidth: '500px',
        margin: '0 auto 30px auto'
      }}>
        Creating your personalized blog post with AI...
      </Paragraph>
      
      {/* Web Search Enhancement Indicator */}
      {webSearchInsights?.researchQuality === 'enhanced' && (
        <div style={{
          marginBottom: '20px',
          padding: '12px',
          backgroundColor: '#f6ffed',
          borderRadius: '8px',
          border: '1px solid #b7eb8f',
          maxWidth: '500px',
          margin: '0 auto 20px auto'
        }}>
          <Text style={{ fontSize: responsive.fontSize.small, color: '#389e0d', fontWeight: 500 }}>
            🔍 Enhanced with web research insights and competitive analysis
          </Text>
        </div>
      )}
      
      {/* Generation Process Indicators */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '16px', 
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        marginBottom: '30px',
        maxWidth: '600px',
        margin: '0 auto 30px auto'
      }}>
        <Text style={{ 
          color: '#666', 
          fontSize: responsive.fontSize.small,
          display: 'block',
          marginBottom: '8px'
        }}>
          <strong>AI is working on:</strong>
        </Text>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center',
          gap: '8px',
          fontSize: responsive.fontSize.small,
          color: '#666'
        }}>
          <span>📝 Structure</span>
          <span>•</span>
          <span>🎯 SEO optimization</span>
          <span>•</span>
          <span>🧠 Personalization</span>
          <span>•</span>
          <span>✨ Brand voice</span>
        </div>
      </div>

      {/* Blog Post Generation Skeleton */}
      {renderGenerationSkeleton()}
    </div>
  );
  
  /**
   * Render blog post generation skeleton
   */
  const renderGenerationSkeleton = () => (
    <div style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto' }}>
      {/* Main title skeleton */}
      <div style={{ 
        height: '32px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '4px', 
        marginBottom: '16px', 
        animation: 'pulse 1.5s ease-in-out infinite' 
      }}></div>
      
      {/* Subtitle skeleton */}
      <div style={{ 
        height: '20px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '4px', 
        marginBottom: '20px', 
        width: '60%', 
        animation: 'pulse 1.5s ease-in-out infinite' 
      }}></div>
      
      {/* Paragraph lines */}
      {[100, 90, 95].map((width, index) => (
        <div key={index} style={{ 
          height: '16px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '4px', 
          marginBottom: '8px', 
          width: `${width}%`,
          animation: 'pulse 1.5s ease-in-out infinite' 
        }}></div>
      ))}
      
      <div style={{ 
        height: '24px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '4px', 
        marginBottom: '12px', 
        width: '40%', 
        animation: 'pulse 1.5s ease-in-out infinite' 
      }}></div>
      
      {/* More paragraph lines */}
      {[100, 85, 92, 78].map((width, index) => (
        <div key={index} style={{ 
          height: '16px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '4px', 
          marginBottom: '8px', 
          width: `${width}%`, 
          animation: 'pulse 1.5s ease-in-out infinite' 
        }}></div>
      ))}
    </div>
  );
  
  /**
   * Render completion state
   */
  const renderCompletionState = () => (
    <div style={{ textAlign: 'center', padding: responsive.padding, marginBottom: '20px' }}>
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
        <CheckCircleOutlined style={{ 
          fontSize: responsive.isMobile ? '24px' : '32px', 
          color: 'white' 
        }} />
      </div>
      
      <Title level={3} style={{ 
        color: brandColors.primary || defaultColors.primary, 
        marginBottom: '20px',
        fontSize: responsive.fontSize.title
      }}>
        Your Blog Post is Ready!
      </Title>
      
      <Paragraph style={{ 
        fontSize: responsive.fontSize.text, 
        marginBottom: '20px',
        color: '#666'
      }}>
        Your AI-generated blog post is complete and ready for review.
      </Paragraph>
      
      {/* Content Quality Summary */}
      {currentEditingContent && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: (brandColors.secondary || defaultColors.secondary) + '20',
          borderRadius: '8px',
          border: `1px solid ${(brandColors.secondary || defaultColors.secondary)}60`,
          maxWidth: '400px',
          margin: '20px auto 0 auto'
        }}>
          <Text style={{ 
            fontSize: responsive.fontSize.small, 
            color: brandColors.primary || defaultColors.primary, 
            fontWeight: 500,
            display: 'block',
            marginBottom: '8px'
          }}>
            📊 Content Summary
          </Text>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#666'
          }}>
            <span>
              <strong>Words:</strong> {Math.round(currentEditingContent.length / 5)}
            </span>
            <span>
              <strong>Reading Time:</strong> {Math.ceil(currentEditingContent.length / 1000)} min
            </span>
          </div>
        </div>
      )}
    </div>
  );
  
  /**
   * Render content editor/preview
   */
  const renderContentEditor = () => (
    <div style={{ marginTop: '20px' }}>
      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          {selectedTopic && (
            <div style={{ marginBottom: '8px' }}>
              <Tag color="blue" style={{ fontSize: '12px' }}>
                {selectedTopic.title}
              </Tag>
            </div>
          )}
          <Text strong style={{ color: brandColors.primary || defaultColors.primary }}>
            {preview ? '👁️ Preview Mode' : '✏️ Edit Mode'}
          </Text>
        </div>
        
        <Space>
          {showPreviewToggle && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text style={{ fontSize: '14px' }}>Preview</Text>
              <Switch
                checked={preview}
                onChange={togglePreviewMode}
                size="small"
              />
            </div>
          )}
          
          <Button 
            onClick={handleSaveContent}
            type="primary"
            icon={<SaveOutlined />}
            style={{
              backgroundColor: brandColors.primary || defaultColors.primary,
              borderColor: brandColors.primary || defaultColors.primary
            }}
          >
            Save
          </Button>
          
          {showExportButton && (
            <Button 
              onClick={handleExportContent}
              icon={<DownloadOutlined />}
            >
              Export
            </Button>
          )}
        </Space>
      </div>
      
      {/* Content Display/Editor */}
      {preview ? (
        <Card>
          <MarkdownPreview
            content={currentEditingContent}
            typography={{
              headingFont: 'Inter, sans-serif',
              bodyFont: 'Inter, sans-serif',
              fontSize: 16,
              lineHeight: '1.6',
              paragraphSpacing: 16
            }}
            style={{
              minHeight: '400px',
              color: '#333'
            }}
          />
        </Card>
      ) : (
        <TextArea
          value={currentEditingContent}
          onChange={handleContentChange}
          placeholder="Your blog post content will appear here..."
          autoSize={{ minRows: 15, maxRows: 25 }}
          style={{ fontSize: responsive.fontSize.text }}
        />
      )}
    </div>
  );
  
  /**
   * Render generate content prompt
   */
  const renderGeneratePrompt = () => (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <FileTextOutlined style={{ 
        fontSize: '48px', 
        color: '#d9d9d9', 
        marginBottom: '16px',
        display: 'block'
      }} />
      <Title level={4} style={{ color: '#999', margin: '0 0 8px 0' }}>
        Ready to Generate Content
      </Title>
      <Text style={{ color: '#666', display: 'block', marginBottom: '20px' }}>
        {selectedTopic ? 
          `Generate AI-powered content for: ${selectedTopic.title}` : 
          'Select a topic to generate AI-powered content'
        }
      </Text>
      {selectedTopic && (
        <Button 
          type="primary" 
          size="large"
          onClick={handleGenerateContent}
          icon={<BulbOutlined />}
          style={{
            backgroundColor: brandColors.primary || defaultColors.primary,
            borderColor: brandColors.primary || defaultColors.primary
          }}
        >
          Generate Content
        </Button>
      )}
    </div>
  );
  
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
            📝 Content Generation
          </Title>
        )}
        
        {/* Different states based on generation progress */}
        {generating ? (
          renderGeneratingState()
        ) : !generated ? (
          renderGeneratePrompt()
        ) : (
          <div>
            {renderCompletionState()}
            {renderContentEditor()}
          </div>
        )}
      </Card>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default ContentGenerationStepStandalone;