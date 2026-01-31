import React from 'react';
import { Select, Row, Col, Typography, Card, InputNumber, Slider } from 'antd';

const { Text } = Typography;
const { Option } = Select;

/**
 * Typography Settings Component
 * Allows users to customize font settings for blog posts
 */
const TypographySettings = ({ 
  typography, 
  onTypographyChange, 
  style = {} 
}) => {
  // Professional font combinations for different blog types
  const fontOptions = [
    {
      label: 'Modern Professional',
      value: 'modern',
      headingFont: 'Inter, sans-serif',
      bodyFont: 'Inter, sans-serif',
      description: 'Clean, modern look for tech and business blogs'
    },
    {
      label: 'Editorial Classic',
      value: 'editorial',
      headingFont: 'Playfair Display, serif',
      bodyFont: 'Lato, sans-serif',
      description: 'Traditional newspaper/magazine style'
    },
    {
      label: 'Readable Content',
      value: 'readable',
      headingFont: 'Roboto Slab, serif',
      bodyFont: 'Lato, sans-serif',
      description: 'Optimized for long-form reading'
    },
    {
      label: 'Creative Writing',
      value: 'creative',
      headingFont: 'Playfair Display, serif',
      bodyFont: 'Merriweather, serif',
      description: 'Elegant style for creative and lifestyle blogs'
    },
    {
      label: 'Technical Documentation',
      value: 'technical',
      headingFont: 'Inter, sans-serif',
      bodyFont: 'Source Code Pro, monospace',
      description: 'Perfect for developer blogs and documentation'
    },
    {
      label: 'Custom',
      value: 'custom',
      headingFont: typography?.headingFont || 'Inter, sans-serif',
      bodyFont: typography?.bodyFont || 'Inter, sans-serif',
      description: 'Define your own font combination'
    }
  ];

  const handlePresetChange = (value) => {
    const selectedFont = fontOptions.find(font => font.value === value);
    if (selectedFont) {
      onTypographyChange({
        ...typography,
        preset: value,
        headingFont: selectedFont.headingFont,
        bodyFont: selectedFont.bodyFont
      });
    }
  };

  const handleSettingChange = (key, value) => {
    onTypographyChange({
      ...typography,
      [key]: value
    });
  };

  return (
    <Card
      title="Typography Settings"
      size="small"
      style={{ ...style }}
    >
      <Row gutter={[16, 12]}>
        {/* Font Preset */}
        <Col span={24}>
          <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>
            Font Style
          </Text>
          <Select
            value={typography?.preset || 'modern'}
            onChange={handlePresetChange}
            style={{ width: '100%' }}
            size="small"
          >
            {fontOptions.map(font => (
              <Option key={font.value} value={font.value}>
                <div>
                  <div style={{ fontWeight: 500 }}>{font.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {font.description}
                  </div>
                </div>
              </Option>
            ))}
          </Select>
        </Col>

        {/* Custom Font Settings - only show if Custom is selected */}
        {typography?.preset === 'custom' && (
          <>
            <Col span={12}>
              <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                Heading Font
              </Text>
              <Select
                value={typography?.headingFont || 'Inter, sans-serif'}
                onChange={(value) => handleSettingChange('headingFont', value)}
                style={{ width: '100%' }}
                size="small"
              >
                <Option value="Inter, sans-serif">Inter (Sans-serif)</Option>
                <Option value="Playfair Display, serif">Playfair Display (Serif)</Option>
                <Option value="Roboto Slab, serif">Roboto Slab (Serif)</Option>
                <Option value="Lato, sans-serif">Lato (Sans-serif)</Option>
                <Option value="Merriweather, serif">Merriweather (Serif)</Option>
              </Select>
            </Col>

            <Col span={12}>
              <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                Body Font
              </Text>
              <Select
                value={typography?.bodyFont || 'Inter, sans-serif'}
                onChange={(value) => handleSettingChange('bodyFont', value)}
                style={{ width: '100%' }}
                size="small"
              >
                <Option value="Inter, sans-serif">Inter (Sans-serif)</Option>
                <Option value="Lato, sans-serif">Lato (Sans-serif)</Option>
                <Option value="Merriweather, serif">Merriweather (Serif)</Option>
                <Option value="Source Code Pro, monospace">Source Code Pro (Mono)</Option>
                <Option value="Roboto Slab, serif">Roboto Slab (Serif)</Option>
              </Select>
            </Col>
          </>
        )}

        {/* Font Size */}
        <Col span={12}>
          <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>
            Base Font Size
          </Text>
          <InputNumber
            value={typography?.fontSize || 16}
            onChange={(value) => handleSettingChange('fontSize', value)}
            min={12}
            max={20}
            size="small"
            style={{ width: '100%' }}
            addonAfter="px"
          />
        </Col>

        {/* Line Height */}
        <Col span={12}>
          <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>
            Line Height
          </Text>
          <Select
            value={typography?.lineHeight || '1.6'}
            onChange={(value) => handleSettingChange('lineHeight', value)}
            size="small"
            style={{ width: '100%' }}
          >
            <Option value="1.4">Tight (1.4)</Option>
            <Option value="1.5">Normal (1.5)</Option>
            <Option value="1.6">Comfortable (1.6)</Option>
            <Option value="1.7">Relaxed (1.7)</Option>
            <Option value="1.8">Loose (1.8)</Option>
          </Select>
        </Col>

        {/* Paragraph Spacing */}
        <Col span={24}>
          <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>
            Paragraph Spacing
          </Text>
          <Slider
            value={typography?.paragraphSpacing || 16}
            onChange={(value) => handleSettingChange('paragraphSpacing', value)}
            min={8}
            max={32}
            marks={{
              8: '8px',
              16: '16px',
              24: '24px',
              32: '32px'
            }}
            style={{ margin: '0 8px' }}
          />
        </Col>
      </Row>

      {/* Font Preview */}
      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        border: '1px solid var(--color-border-base)', 
        borderRadius: '4px',
        backgroundColor: 'var(--color-background-alt)'
      }}>
        <Text style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '8px' }}>
          Preview:
        </Text>
        
        <div style={{ 
          fontFamily: typography?.headingFont || 'Inter, sans-serif',
          fontSize: `${Math.round((typography?.fontSize || 16) * 1.5)}px`,
          fontWeight: 600,
          marginBottom: `${(typography?.paragraphSpacing || 16) / 2}px`,
          lineHeight: typography?.lineHeight || '1.6'
        }}>
          Your Blog Post Title
        </div>
        
        <div style={{ 
          fontFamily: typography?.bodyFont || 'Inter, sans-serif',
          fontSize: `${typography?.fontSize || 16}px`,
          lineHeight: typography?.lineHeight || '1.6',
          color: 'var(--color-text-primary)',
          marginBottom: `${typography?.paragraphSpacing || 16}px`
        }}>
          This is how your blog post content will appear with the selected typography settings. 
          The font combination creates a professional and readable experience.
        </div>
      </div>
    </Card>
  );
};

export default TypographySettings;