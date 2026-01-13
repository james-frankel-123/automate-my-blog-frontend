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
  Badge
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

  if (!visualSuggestions || visualSuggestions.length === 0) {
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
      await onGenerateVisual(suggestion);
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
            <Badge count={visualSuggestions.length} style={{ backgroundColor: '#52c41a' }} />
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

        <List
          dataSource={visualSuggestions}
          renderItem={(suggestion) => (
            <List.Item
              key={suggestion.id}
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
                onGenerateVisual && (
                  <Button 
                    size="small" 
                    type="primary"
                    icon={<PictureOutlined />}
                    loading={generating === suggestion.id}
                    onClick={() => handleGenerateVisual(suggestion)}
                  >
                    Generate
                  </Button>
                )
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={getContentTypeIcon(suggestion.contentType)}
                title={
                  <Space>
                    <Text strong>{suggestion.title}</Text>
                    <Tag color="blue">{suggestion.contentType.replace('_', ' ')}</Tag>
                    {suggestion.priority === 'high' && (
                      <StarOutlined style={{ color: '#faad14' }} />
                    )}
                  </Space>
                }
                description={
                  <div>
                    <Text style={{ fontSize: 12 }}>{suggestion.description}</Text>
                    <div style={{ marginTop: 4 }}>
                      {getServiceBadge(suggestion.recommendedService, suggestion.estimatedCost)}
                      <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                        <ClockCircleOutlined style={{ marginRight: 2 }} />
                        {suggestion.estimatedTime || '1-2 min'}
                      </Text>
                    </div>
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
            {visualSuggestions.reduce((sum, s) => sum + (s.estimatedCost || 0), 0).toFixed(3)}
            {' '} | <strong>Free suggestions:</strong> {visualSuggestions.filter(s => s.estimatedCost === 0).length}
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