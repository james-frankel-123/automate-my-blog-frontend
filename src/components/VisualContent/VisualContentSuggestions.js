import React, { useState } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  List, 
  Tag, 
  Space, 
  Image, 
  Tooltip,
  Modal,
  Alert,
  Badge,
  message
} from 'antd';
import { 
  PictureOutlined, 
  BarChartOutlined, 
  EyeOutlined,
  DownloadOutlined,
  StarOutlined,
  DollarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

/**
 * Visual Content Suggestions Component
 * Displays AI-generated visual content recommendations for blog posts
 */
const VisualContentSuggestions = ({ 
  visualSuggestions = [], 
  onGenerateVisual,
  onPreviewVisual,
  style = {} 
}) => {
  const [previewModal, setPreviewModal] = useState({ visible: false, content: null });
  const [generating, setGenerating] = useState(null);
  const [generatedImages, setGeneratedImages] = useState({});

  // Ensure we have valid data structure
  const validSuggestions = Array.isArray(visualSuggestions) 
    ? visualSuggestions.filter(s => s && typeof s === 'object' && s.contentType)
    : [];

  if (!validSuggestions || validSuggestions.length === 0) {
    return (
      <Card style={style} size="small">
        <div style={{ textAlign: 'center', padding: 16 }}>
          <PictureOutlined style={{ fontSize: 32, color: '#d9d9d9', marginBottom: 8 }} />
          <Text type="secondary">No visual suggestions available</Text>
        </div>
      </Card>
    );
  }

  const handleGenerateVisual = async (suggestion) => {
    if (!onGenerateVisual) return;
    
    setGenerating(suggestion.id);
    try {
      const result = await onGenerateVisual(suggestion);
      // Store the generated image if successful
      if (result && result.imageUrl) {
        setGeneratedImages(prev => ({
          ...prev,
          [suggestion.id]: result.imageUrl
        }));
      }
    } finally {
      setGenerating(null);
    }
  };

  const handlePreviewVisual = (suggestion) => {
    if (onPreviewVisual) {
      onPreviewVisual(suggestion);
    } else {
      setPreviewModal({ visible: true, content: suggestion });
    }
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'hero_image':
        return <PictureOutlined style={{ color: '#52c41a' }} />;
      case 'infographic':
        return <BarChartOutlined style={{ color: '#1890ff' }} />;
      case 'chart':
        return <BarChartOutlined style={{ color: '#722ed1' }} />;
      case 'diagram':
        return <PictureOutlined style={{ color: '#fa8c16' }} />;
      default:
        return <PictureOutlined style={{ color: '#595959' }} />;
    }
  };

  const getServiceBadge = (service, cost) => {
    const serviceColors = {
      'stable_diffusion': { color: 'green', name: 'Replicate' },
      'quickchart': { color: 'blue', name: 'QuickChart' },
      'dalle': { color: 'purple', name: 'DALL-E' },
      'canva': { color: 'orange', name: 'Canva' }
    };

    const config = serviceColors[service] || { color: 'default', name: service };
    
    return (
      <Space>
        <Badge color={config.color} text={config.name} />
        {cost === 0 ? (
          <Tag color="green" size="small">FREE</Tag>
        ) : (
          <Tag size="small">
            <DollarOutlined style={{ fontSize: 10 }} />
            {cost.toFixed(3)}
          </Tag>
        )}
      </Space>
    );
  };

  return (
    <>
      <Card 
        title={
          <Space>
            <PictureOutlined style={{ color: '#1890ff' }} />
            Visual Content Suggestions
            <Badge count={validSuggestions.length} style={{ backgroundColor: '#52c41a' }} />
          </Space>
        }
        size="small"
        style={style}
      >
        <Alert
          message="AI-Generated Visual Suggestions"
          description="These visual elements will enhance your blog post's engagement and SEO performance."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* Generate All Button */}
        {onGenerateVisual && validSuggestions.length > 0 && (
          <div style={{ marginBottom: 16, textAlign: 'center' }}>
            <Button 
              type="primary"
              size="large"
              icon={<PictureOutlined />}
              onClick={async () => {
                if (!onGenerateVisual) return;
                
                const services = ['quickchart', 'stable_diffusion', 'dalle'];
                const totalGenerations = validSuggestions.length * services.length;
                
                message.loading({ 
                  content: `Generating all ${totalGenerations} visuals (${validSuggestions.length} suggestions × ${services.length} services)...`, 
                  key: 'bulk-visual-gen', 
                  duration: 0 
                });
                
                let successCount = 0;
                let currentCount = 0;
                
                for (const suggestion of validSuggestions) {
                  for (const service of services) {
                    currentCount++;
                    try {
                      // Update progress message
                      message.loading({ 
                        content: `Generating ${currentCount}/${totalGenerations}: ${suggestion.title} with ${service}...`, 
                        key: 'bulk-visual-gen', 
                        duration: 0 
                      });
                      
                      const result = await onGenerateVisual({
                        ...suggestion,
                        testService: service,
                        id: `${suggestion.id}-${service}`
                      });
                      
                      if (result && result.imageUrl) {
                        setGeneratedImages(prev => ({
                          ...prev,
                          [`${suggestion.id}-${service}`]: result.imageUrl
                        }));
                        successCount++;
                      }
                    } catch (error) {
                      console.error(`Bulk generation error for ${suggestion.title} with ${service}:`, error);
                    }
                  }
                }
                
                message.success({
                  content: `Generated ${successCount}/${totalGenerations} visuals successfully!`,
                  key: 'bulk-visual-gen',
                  duration: 8
                });
              }}
              style={{
                background: 'linear-gradient(90deg, #1890ff 0%, #722ed1 100%)',
                borderColor: '#1890ff',
                fontSize: '16px',
                height: '48px',
                padding: '0 32px'
              }}
            >
              Generate All 9 Visuals ({validSuggestions.length} × 3 services)
            </Button>
          </div>
        )}

        <List
          dataSource={validSuggestions}
          renderItem={(suggestion) => (
            <List.Item
              key={suggestion.id || `visual-${suggestion.contentType}-${Math.random()}`}
              actions={[
                <Tooltip title="Preview suggestion details">
                  <Button 
                    size="small" 
                    icon={<EyeOutlined />}
                    onClick={() => handlePreviewVisual(suggestion)}
                  >
                    Preview
                  </Button>
                </Tooltip>,
                // Test buttons for different services
                onGenerateVisual && (
                  <Space size="small">
                    <Button 
                      size="small" 
                      style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
                      icon={<PictureOutlined />}
                      loading={generating === `${suggestion.id}-quickchart`}
                      onClick={() => handleGenerateVisual({...suggestion, testService: 'quickchart', id: `${suggestion.id}-quickchart`})}
                    >
                      QuickChart (Free)
                    </Button>
                    <Button 
                      size="small" 
                      style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', color: 'white' }}
                      icon={<PictureOutlined />}
                      loading={generating === `${suggestion.id}-stable_diffusion`}
                      onClick={() => handleGenerateVisual({...suggestion, testService: 'stable_diffusion', id: `${suggestion.id}-stable_diffusion`})}
                    >
                      Replicate ($)
                    </Button>
                    <Button 
                      size="small" 
                      style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16', color: 'white' }}
                      icon={<PictureOutlined />}
                      loading={generating === `${suggestion.id}-dalle`}
                      onClick={() => handleGenerateVisual({...suggestion, testService: 'dalle', id: `${suggestion.id}-dalle`})}
                    >
                      DALL-E ($)
                    </Button>
                  </Space>
                )
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={getContentTypeIcon(suggestion.contentType)}
                title={
                  <Space>
                    <Text strong>{suggestion.title || 'Visual Content'}</Text>
                    <Tag color="blue">{(suggestion.contentType || 'visual').replace('_', ' ')}</Tag>
                    {suggestion.priority === 'high' && (
                      <StarOutlined style={{ color: '#faad14' }} />
                    )}
                  </Space>
                }
                description={
                  <div>
                    <Text style={{ fontSize: 12 }}>{suggestion.description || 'Visual content suggestion'}</Text>
                    
                    {/* Show AI Prompt */}
                    {suggestion.prompt && (
                      <div style={{ marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 4, fontSize: 11 }}>
                        <Text strong>AI Prompt: </Text>
                        <Text style={{ fontFamily: 'monospace' }}>{suggestion.prompt}</Text>
                      </div>
                    )}
                    
                    <div style={{ marginTop: 4 }}>
                      {getServiceBadge(suggestion.recommendedService || 'unknown', suggestion.estimatedCost || 0)}
                      <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                        <ClockCircleOutlined style={{ marginRight: 2 }} />
                        {suggestion.estimatedTime || '1-2 min'}
                      </Text>
                    </div>
                    
                    {/* Show Generated Images */}
                    {(() => {
                      const services = ['quickchart', 'stable_diffusion', 'dalle'];
                      const availableImages = services
                        .map(service => ({
                          service,
                          url: generatedImages[`${suggestion.id}-${service}`] || generatedImages[suggestion.id] 
                        }))
                        .filter(img => img.url);
                      
                      if (availableImages.length === 0) return null;
                      
                      return (
                        <div style={{ marginTop: 12 }}>
                          <Text strong style={{ fontSize: 12 }}>Generated Images ({availableImages.length}):</Text>
                          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {availableImages.map(({ service, url }) => (
                              <div key={service} style={{ textAlign: 'center' }}>
                                <img 
                                  src={url} 
                                  alt={`${suggestion.title} - ${service}`}
                                  style={{ 
                                    width: '120px', 
                                    height: '90px', 
                                    objectFit: 'cover',
                                    borderRadius: 4,
                                    border: '1px solid #d9d9d9'
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                                <div style={{ fontSize: 10, marginTop: 2, color: '#666' }}>
                                  {service === 'quickchart' ? 'QuickChart' : 
                                   service === 'stable_diffusion' ? 'Replicate' : 'DALL-E'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                }
              />
            </List.Item>
          )}
        />

        {/* Cost Summary */}
        <div style={{ marginTop: 16, padding: 12, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
          <Text style={{ fontSize: 12 }}>
            <strong>Total estimated cost:</strong> ${' '}
            {validSuggestions.reduce((sum, s) => sum + (s.estimatedCost || 0), 0).toFixed(3)}
            {' '} | <strong>Free suggestions:</strong> {validSuggestions.filter(s => (s.estimatedCost || 0) === 0).length}
          </Text>
        </div>
      </Card>

      {/* Preview Modal */}
      <Modal
        title={
          <Space>
            {getContentTypeIcon(previewModal.content?.contentType)}
            {previewModal.content?.title}
          </Space>
        }
        visible={previewModal.visible}
        onCancel={() => setPreviewModal({ visible: false, content: null })}
        footer={[
          <Button key="close" onClick={() => setPreviewModal({ visible: false, content: null })}>
            Close
          </Button>,
          onGenerateVisual && previewModal.content && (
            <Button 
              key="generate"
              type="primary" 
              icon={<PictureOutlined />}
              onClick={() => {
                handleGenerateVisual(previewModal.content);
                setPreviewModal({ visible: false, content: null });
              }}
            >
              Generate This Visual
            </Button>
          )
        ].filter(Boolean)}
      >
        {previewModal.content && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Description:</Text>
              <div style={{ marginTop: 4 }}>
                {previewModal.content.description}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>AI Prompt:</Text>
              <div style={{ 
                marginTop: 4, 
                padding: 8, 
                background: '#f5f5f5', 
                borderRadius: 4,
                fontFamily: 'monospace',
                fontSize: 12
              }}>
                {previewModal.content.prompt}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>Service & Cost:</Text>
              <div style={{ marginTop: 4 }}>
                {getServiceBadge(previewModal.content.recommendedService, previewModal.content.estimatedCost)}
              </div>
            </div>

            {previewModal.content.placement && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Suggested Placement:</Text>
                <div style={{ marginTop: 4 }}>
                  <Tag>{previewModal.content.placement}</Tag>
                </div>
              </div>
            )}

            {previewModal.content.altText && (
              <div>
                <Text strong>Alt Text:</Text>
                <div style={{ marginTop: 4, fontSize: 12, fontStyle: 'italic' }}>
                  "{previewModal.content.altText}"
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default VisualContentSuggestions;