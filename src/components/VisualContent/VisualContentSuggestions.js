import React, { useState } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Tag, 
  Space, 
  Modal,
  Alert,
  Badge,
  message
} from 'antd';
import { 
  PictureOutlined, 
  BarChartOutlined,
  DollarOutlined
} from '@ant-design/icons';

const { Text } = Typography;

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
  const [generating, setGenerating] = useState(null);
  const [generatedImages, setGeneratedImages] = useState({});
  const [zoomModal, setZoomModal] = useState({ visible: false, imageUrl: '', title: '', service: '' });

  // Ensure we have valid data structure
  const validSuggestions = Array.isArray(visualSuggestions) 
    ? visualSuggestions.filter(s => s && typeof s === 'object' && s.contentType)
    : [];

  if (!validSuggestions || validSuggestions.length === 0) {
    return (
      <Card style={style} size="small">
        <div style={{ textAlign: 'center', padding: 16 }}>
          <PictureOutlined style={{ fontSize: 32, color: 'var(--color-gray-300)', marginBottom: 8 }} />
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


  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'hero_image':
        return <PictureOutlined style={{ color: 'var(--color-success)' }} />;
      case 'infographic':
        return <BarChartOutlined style={{ color: 'var(--color-primary)' }} />;
      case 'chart':
        return <BarChartOutlined style={{ color: 'var(--color-primary)' }} />;
      case 'diagram':
        return <PictureOutlined style={{ color: 'var(--color-warning)' }} />;
      default:
        return <PictureOutlined style={{ color: 'var(--color-text-secondary)' }} />;
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
            <PictureOutlined style={{ color: 'var(--color-primary)' }} />
            Visual Content Suggestions
            <Badge count={validSuggestions.length} style={{ backgroundColor: 'var(--color-success)' }} />
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
                
                // For all highlight test cases, we want to test with 3 different styles
                const highlightStyles = ['pullout-style', 'box-style', 'inline-style'];
                
                // Calculate total generations - all test cases with all 3 styles
                const allGenerations = [];
                for (const suggestion of validSuggestions) {
                  for (const style of highlightStyles) {
                    allGenerations.push({ suggestion, style });
                  }
                }
                const totalGenerations = allGenerations.length;
                
                message.loading({ 
                  content: `Generating ${totalGenerations} highlight styles (${validSuggestions.length} test cases × 3 styles)...`, 
                  key: 'bulk-highlight-gen', 
                  duration: 0 
                });
                
                let successCount = 0;
                
                for (let i = 0; i < allGenerations.length; i++) {
                  const { suggestion, style } = allGenerations[i];
                  const currentCount = i + 1;
                  
                  try {
                    // Update progress message
                    const styleDisplayName = {
                      'pullout-style': 'Pullout Style',
                      'box-style': 'Box Style', 
                      'inline-style': 'Inline Style'
                    }[style] || style;
                    
                    message.loading({ 
                      content: `Rendering ${currentCount}/${totalGenerations}: ${suggestion.testType} with ${styleDisplayName}...`, 
                      key: 'bulk-highlight-gen', 
                      duration: 0 
                    });
                    
                    const result = await onGenerateVisual({
                      ...suggestion,
                      testService: style,
                      id: `${suggestion.id}-${style}`
                    });
                    
                    if (result && result.imageUrl) {
                      setGeneratedImages(prev => ({
                        ...prev,
                        [`${suggestion.id}-${style}`]: result.imageUrl
                      }));
                      successCount++;
                    }
                  } catch (error) {
                    console.error(`Bulk highlight rendering error for ${suggestion.testType} with ${style}:`, error);
                  }
                }
                
                message.success({
                  content: `Rendered ${successCount}/${totalGenerations} highlight styles successfully!`,
                  key: 'bulk-highlight-gen',
                  duration: 8
                });
              }}
              style={{
                background: 'var(--gradient-primary)',
                borderColor: 'var(--color-primary)',
                fontSize: '16px',
                height: '48px',
                padding: '0 32px'
              }}
            >
              Generate All {validSuggestions.length} Highlight Types (3 Styles Each)
            </Button>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 14 }}>Highlight Test Cases ({validSuggestions.length}):</Text>
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
            Each test case shows detailed highlighting content and rendered examples across 3 different styling approaches
          </Text>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {validSuggestions.map((suggestion, index) => (
            <Card 
              key={suggestion.id || `test-case-${index}`}
              size="small"
              style={{ 
                borderLeft: '4px solid var(--color-primary)',
                marginBottom: 8
              }}
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <Text strong style={{ fontSize: 16 }}>{index + 1}. {suggestion.title}</Text>
                    <Tag color="purple">{suggestion.testType}</Tag>
                  </Space>
                  <Space>
                    {onGenerateVisual && (
                      <>
                        <Button 
                          size="small" 
                          style={{ backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)', color: 'white' }}
                          icon={<PictureOutlined />}
                          loading={generating === `${suggestion.id}-pullout-style`}
                          onClick={() => handleGenerateVisual({...suggestion, testService: 'pullout-style', id: `${suggestion.id}-pullout-style`})}
                        >
                          Pullout Style
                        </Button>
                        <Button 
                          size="small" 
                          style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: 'white' }}
                          icon={<PictureOutlined />}
                          loading={generating === `${suggestion.id}-box-style`}
                          onClick={() => handleGenerateVisual({...suggestion, testService: 'box-style', id: `${suggestion.id}-box-style`})}
                        >
                          Box Style
                        </Button>
                        <Button 
                          size="small" 
                          style={{ backgroundColor: 'var(--color-warning)', borderColor: 'var(--color-warning)', color: 'white' }}
                          icon={<PictureOutlined />}
                          loading={generating === `${suggestion.id}-inline-style`}
                          onClick={() => handleGenerateVisual({...suggestion, testService: 'inline-style', id: `${suggestion.id}-inline-style`})}
                        >
                          Inline Style
                        </Button>
                      </>
                    )}
                  </Space>
                </div>
              }
            >
              {/* Test Prompt Section */}
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: 13, color: 'var(--color-primary)' }}>Test Prompt:</Text>
                <div style={{ 
                  marginTop: 4, 
                  padding: 12, 
                  background: 'var(--color-background-alt)', 
                  borderRadius: 6, 
                  fontSize: 12,
                  fontFamily: 'monospace',
                  lineHeight: '1.4',
                  border: '1px solid var(--color-border-base)'
                }}>
                  {suggestion.prompt}
                </div>
              </div>

              {/* Expected Features */}
              {suggestion.expectedFeatures && (
                <div style={{ marginBottom: 12 }}>
                  <Text strong style={{ fontSize: 12 }}>Expected Features: </Text>
                  {suggestion.expectedFeatures.map((feature, idx) => (
                    <Tag key={idx} size="small" style={{ marginBottom: 4 }}>
                      {feature}
                    </Tag>
                  ))}
                </div>
              )}

              {/* Generated Highlight Styles Section */}
              {(() => {
                const styles = ['pullout-style', 'box-style', 'inline-style'];
                const availableImages = styles
                  .map(style => ({
                    style,
                    url: generatedImages[`${suggestion.id}-${style}`]
                  }))
                  .filter(img => img.url);
                
                if (availableImages.length === 0) {
                  return (
                    <div style={{ 
                      padding: 16, 
                      textAlign: 'center', 
                      background: 'var(--color-background-alt)', 
                      borderRadius: 4,
                      border: '1px dashed var(--color-gray-300)' 
                    }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Click style buttons above to render highlight examples
                      </Text>
                    </div>
                  );
                }
                
                return (
                  <div>
                    <Text strong style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                      Generated Highlight Styles ({availableImages.length}/3 styles):
                    </Text>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      {styles.map(style => {
                        const imageData = availableImages.find(img => img.style === style);
                        const styleName = {
                          'pullout-style': 'Pullout Style',
                          'box-style': 'Box Style',
                          'inline-style': 'Inline Style'
                        }[style] || style;
                        
                        return (
                          <div key={style} style={{ 
                            border: '1px solid var(--color-border-base)', 
                            borderRadius: 8, 
                            padding: 8, 
                            textAlign: 'center',
                            background: imageData ? 'var(--color-white)' : 'var(--color-background-alt)'
                          }}>
                            <div style={{ 
                              fontSize: 11, 
                              fontWeight: 'bold', 
                              marginBottom: 8,
                              color: style === 'pullout-style' ? 'var(--color-success)' : style === 'box-style' ? 'var(--color-primary)' : 'var(--color-warning)'
                            }}>
                              {styleName}
                            </div>
                            
                            {imageData ? (
                              <img 
                                src={imageData.url} 
                                alt={`${suggestion.title} - ${styleName}`}
                                style={{ 
                                  width: '100%', 
                                  maxWidth: '200px',
                                  height: '150px', 
                                  objectFit: 'cover',
                                  borderRadius: 4,
                                  border: '1px solid var(--color-gray-300)',
                                  cursor: 'pointer'
                                }}
                                onClick={() => setZoomModal({
                                  visible: true,
                                  imageUrl: imageData.url,
                                  title: suggestion.title,
                                  service: styleName
                                })}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div style={{ 
                                width: '100%', 
                                maxWidth: '200px',
                                height: '150px', 
                                border: '1px dashed var(--color-gray-300)',
                                borderRadius: 4,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-text-tertiary)',
                                fontSize: 11
                              }}>
                                Click button above
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </Card>
          ))}
        </div>

        {/* Cost Summary */}
        <div style={{ marginTop: 16, padding: 12, background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', borderRadius: 6 }}>
          <Text style={{ fontSize: 12 }}>
            <strong>Total estimated cost:</strong> ${' '}
            {validSuggestions.reduce((sum, s) => sum + (s.estimatedCost || 0), 0).toFixed(3)}
            {' '} | <strong>Free suggestions:</strong> {validSuggestions.filter(s => (s.estimatedCost || 0) === 0).length}
          </Text>
        </div>
      </Card>


      {/* Zoom Modal */}
      <Modal
        title={`${zoomModal.title} - ${zoomModal.service}`}
        open={zoomModal.visible}
        onCancel={() => setZoomModal({ visible: false, imageUrl: '', title: '', service: '' })}
        footer={[
          <Button key="close" onClick={() => setZoomModal({ visible: false, imageUrl: '', title: '', service: '' })}>
            Close
          </Button>
        ]}
        width="80%"
        style={{ top: 20 }}
      >
        {zoomModal.imageUrl && (
          <div style={{ textAlign: 'center' }}>
            <img 
              src={zoomModal.imageUrl}
              alt={`${zoomModal.title} - ${zoomModal.service}`}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '70vh', 
                objectFit: 'contain',
                border: '1px solid var(--color-gray-300)',
                borderRadius: 4
              }}
            />
          </div>
        )}
      </Modal>
    </>
  );
};

export default VisualContentSuggestions;