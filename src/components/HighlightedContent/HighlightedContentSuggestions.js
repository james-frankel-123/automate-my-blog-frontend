import React, { useState } from 'react';
import {
  Card,
  Button,
  Tag,
  Space,
  Modal,
  Alert,
  Badge,
  message,
  Row,
  Col
} from 'antd';
import {
  RiseOutlined,
  BarChartOutlined,
  BulbOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  BookOutlined,
  FileTextOutlined,
  SwapOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { highlightPresets } from './highlightPresets';

/**
 * HighlightedContentSuggestions Component
 * Displays preset highlight templates for quick insertion into blog content
 */
const HighlightedContentSuggestions = ({
  editor,
  style = {}
}) => {
  const [applying, setApplying] = useState(null);
  const [previewModal, setPreviewModal] = useState({ visible: false, preset: null });

  const handleApplyPreset = async (preset) => {
    setApplying(preset.id);

    try {
      if (editor && editor.commands) {
        // Use the HighlightBox TipTap extension command
        editor.commands.setHighlightBox({
          type: preset.config.type,
          content: preset.example,
          width: preset.config.width,
          fontSize: preset.config.fontSize,
          layout: preset.config.layout,
          align: preset.config.align,
          customBg: preset.config.customBg,
          customBorder: preset.config.customBorder,
          iconName: preset.config.iconName,
          citation: null
        });

        message.success(`${preset.name} added to your content!`);
      } else {
        message.warning('Editor not available. Please try again.');
      }
    } catch (error) {
      console.error('Error applying preset:', error);
      message.error('Failed to apply highlight. Please try again.');
    } finally {
      setApplying(null);
    }
  };

  const handlePreview = (preset) => {
    setPreviewModal({ visible: true, preset });
  };

  const getIconComponent = (iconType) => {
    const icons = {
      'statistic': <BarChartOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
      'pullquote': <RiseOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      'takeaway': <BulbOutlined style={{ fontSize: 24, color: '#faad14' }} />,
      'warning': <ExclamationCircleOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />,
      'tip': <InfoCircleOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
      'definition': <BookOutlined style={{ fontSize: 24, color: '#2f54eb' }} />,
      'process': <FileTextOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
      'comparison': <SwapOutlined style={{ fontSize: 24, color: '#13c2c2' }} />
    };
    return icons[iconType] || <CheckCircleOutlined style={{ fontSize: 24 }} />;
  };

  const getTypeColor = (type) => {
    const colors = {
      'statistic': 'blue',
      'pullquote': 'green',
      'takeaway': 'orange',
      'warning': 'red',
      'tip': 'cyan',
      'definition': 'geekblue',
      'process': 'purple',
      'comparison': 'cyan'
    };
    return colors[type] || 'default';
  };

  return (
    <>
      <Card
        title={
          <Space>
            <RiseOutlined style={{ color: '#722ed1' }} />
            <span>Content Highlight Templates</span>
            <Badge count={highlightPresets.length} style={{ backgroundColor: '#722ed1' }} />
          </Space>
        }
        size="small"
        style={style}
      >
        <Alert
          message="✨ Professional Highlight Templates"
          description="Choose from 8 professionally designed templates to make your content more engaging and scannable. Statistics, pull quotes, warnings, tips, and more!"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Row gutter={[12, 12]}>
          {highlightPresets.map((preset) => (
            <Col key={preset.id} xs={24} sm={12} md={12} lg={12} xl={12}>
              <Card
                size="small"
                hoverable
                style={{
                  borderLeft: `4px solid ${preset.config.customBorder}`,
                  height: '100%'
                }}
                bodyStyle={{ padding: '12px' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Header */}
                  <div style={{ marginBottom: 8 }}>
                    <Space>
                      {getIconComponent(preset.id)}
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{preset.name}</span>
                      <Tag color={getTypeColor(preset.id)} style={{ fontSize: 10 }}>
                        {preset.config.fontSize}
                      </Tag>
                    </Space>
                  </div>

                  {/* Description */}
                  <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>
                    {preset.description}
                  </div>

                  {/* Example Preview */}
                  <div
                    style={{
                      marginBottom: 8,
                      padding: 8,
                      background: preset.config.customBg,
                      borderLeft: `3px solid ${preset.config.customBorder}`,
                      borderRadius: 4,
                      fontSize: 11,
                      lineHeight: '1.4',
                      fontStyle: 'italic',
                      flex: 1
                    }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: preset.example }} />
                  </div>

                  {/* Layout Info */}
                  <div style={{ marginBottom: 8 }}>
                    <Tag size="small" color="default" style={{ fontSize: 10 }}>
                      {preset.config.width} width
                    </Tag>
                    <Tag size="small" color="default" style={{ fontSize: 10 }}>
                      {preset.config.layout === 'float-left' ? '← Float left' :
                       preset.config.layout === 'float-right' ? 'Float right →' :
                       'Full width'}
                    </Tag>
                  </div>

                  {/* Actions */}
                  <Space size="small" style={{ width: '100%' }}>
                    <Button
                      size="small"
                      onClick={() => handlePreview(preset)}
                      style={{ flex: 1 }}
                    >
                      Preview
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      loading={applying === preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      style={{
                        flex: 1,
                        backgroundColor: preset.config.customBorder,
                        borderColor: preset.config.customBorder
                      }}
                    >
                      Apply
                    </Button>
                  </Space>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Tips */}
        <div style={{ marginTop: 16, padding: 12, background: '#f0f8ff', border: '1px solid #d6e4ff', borderRadius: 6 }}>
          <span style={{ fontSize: 12 }}>
            <strong>💡 Tips:</strong> Float layouts work best with longer content. On mobile, all highlights stack to full width automatically.
          </span>
        </div>
      </Card>

      {/* Preview Modal */}
      <Modal
        title={
          <Space>
            {previewModal.preset && getIconComponent(previewModal.preset.id)}
            <span>{previewModal.preset?.name} Preview</span>
          </Space>
        }
        open={previewModal.visible}
        onCancel={() => setPreviewModal({ visible: false, preset: null })}
        footer={[
          <Button key="close" onClick={() => setPreviewModal({ visible: false, preset: null })}>
            Close
          </Button>,
          previewModal.preset && (
            <Button
              key="apply"
              type="primary"
              onClick={() => {
                handleApplyPreset(previewModal.preset);
                setPreviewModal({ visible: false, preset: null });
              }}
              style={{
                backgroundColor: previewModal.preset.config.customBorder,
                borderColor: previewModal.preset.config.customBorder
              }}
            >
              Apply This Template
            </Button>
          )
        ].filter(Boolean)}
        width={700}
      >
        {previewModal.preset && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontWeight: 600 }}>Description:</span>
              <div style={{ marginTop: 4, fontSize: 13 }}>
                {previewModal.preset.description}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <span style={{ fontWeight: 600 }}>Preview:</span>
              <div
                style={{
                  marginTop: 8,
                  padding: '16px 20px',
                  background: previewModal.preset.config.customBg,
                  borderLeft: `4px solid ${previewModal.preset.config.customBorder}`,
                  borderRadius: 8,
                  fontSize: previewModal.preset.config.fontSize === 'xxlarge' ? 72 :
                           previewModal.preset.config.fontSize === 'xlarge' ? 48 :
                           previewModal.preset.config.fontSize === 'large' ? 24 :
                           previewModal.preset.config.fontSize === 'small' ? 14 : 16,
                  lineHeight: '1.4'
                }}
              >
                <div dangerouslySetInnerHTML={{ __html: previewModal.preset.example }} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <span style={{ fontWeight: 600 }}>Configuration:</span>
              <div style={{ marginTop: 8 }}>
                <Tag>Width: {previewModal.preset.config.width}</Tag>
                <Tag>Font: {previewModal.preset.config.fontSize}</Tag>
                <Tag>Layout: {previewModal.preset.config.layout}</Tag>
                <Tag>Align: {previewModal.preset.config.align}</Tag>
              </div>
            </div>

            <div>
              <span style={{ fontWeight: 600 }}>Best for:</span>
              <div style={{ marginTop: 8 }}>
                {previewModal.preset.useCases?.map((useCase, idx) => (
                  <Tag key={idx} color="blue" style={{ marginBottom: 4 }}>
                    {useCase}
                  </Tag>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default HighlightedContentSuggestions;
