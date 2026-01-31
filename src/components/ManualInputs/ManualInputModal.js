import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Select, 
  Button, 
  Tabs, 
  Typography, 
  Space,
  Alert,
  Tag,
  Tooltip,
  Spin
} from 'antd';
import { 
  InfoCircleOutlined, 
  PlusOutlined, 
  DeleteOutlined,
  SaveOutlined,
  BulbOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;
const { Text, Title } = Typography;
const { TabPane } = Tabs;

/**
 * Manual Input Modal Component
 * Allows users to provide manual data when website analysis is unavailable
 */
const ManualInputModal = ({ 
  visible, 
  onClose, 
  onSave, 
  organizationId,
  initialData = {},
  loading = false 
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('brand_voice');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && initialData) {
      // Pre-populate form with existing data
      form.setFieldsValue(initialData);
    }
  }, [visible, initialData, form]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      
      // Structure data by input type
      const structuredData = {
        brand_voice: {
          tone: values.tone,
          style: values.style,
          keywords: values.brandKeywords || [],
          personality: values.personality,
          doNot: values.doNot
        },
        target_audience: {
          primary: values.primaryAudience,
          demographics: values.demographics,
          painPoints: values.painPoints || [],
          goals: values.audienceGoals || []
        },
        cta_preferences: {
          primaryCTA: values.primaryCTA,
          ctaStyle: values.ctaStyle,
          placement: values.ctaPlacement,
          examples: values.ctaExamples || []
        },
        internal_linking: {
          strategy: values.linkingStrategy,
          keyPages: values.keyPages || [],
          anchorStyle: values.anchorStyle
        },
        brand_colors: {
          primary: values.primaryColor,
          secondary: values.secondaryColor,
          accent: values.accentColor,
          guidelines: values.colorGuidelines
        },
        business_objectives: {
          primary: values.primaryObjective,
          secondary: values.secondaryObjectives || [],
          metrics: values.keyMetrics || []
        }
      };

      await onSave(structuredData);
      onClose();
    } catch (error) {
      console.error('Failed to save manual inputs:', error);
    } finally {
      setSaving(false);
    }
  };

  const inputTemplates = {
    brand_voice: {
      title: 'Brand Voice & Tone',
      description: 'Define how your brand communicates',
      icon: '💬',
      fields: [
        { 
          name: 'tone', 
          label: 'Brand Tone', 
          type: 'select',
          options: ['Professional', 'Friendly', 'Casual', 'Authoritative', 'Playful', 'Technical'],
          required: true,
          tooltip: 'The emotional feeling your content should convey'
        },
        { 
          name: 'style', 
          label: 'Writing Style', 
          type: 'select',
          options: ['Conversational', 'Formal', 'Educational', 'Persuasive', 'Storytelling'],
          required: true 
        },
        { 
          name: 'personality', 
          label: 'Brand Personality', 
          type: 'textarea',
          placeholder: 'Describe your brand\'s personality in 2-3 sentences...',
          required: true 
        },
        { 
          name: 'brandKeywords', 
          label: 'Brand Keywords', 
          type: 'tags',
          placeholder: 'Enter keywords that represent your brand...' 
        },
        { 
          name: 'doNot', 
          label: 'Avoid These', 
          type: 'textarea',
          placeholder: 'Words, phrases, or topics to avoid in your content...' 
        }
      ]
    },
    target_audience: {
      title: 'Target Audience',
      description: 'Define who you\'re creating content for',
      icon: '👥',
      fields: [
        { 
          name: 'primaryAudience', 
          label: 'Primary Audience', 
          type: 'input',
          placeholder: 'e.g., Small business owners in healthcare',
          required: true 
        },
        { 
          name: 'demographics', 
          label: 'Demographics', 
          type: 'textarea',
          placeholder: 'Age range, location, industry, company size, etc.' 
        },
        { 
          name: 'painPoints', 
          label: 'Pain Points', 
          type: 'tags',
          placeholder: 'What challenges does your audience face?' 
        },
        { 
          name: 'audienceGoals', 
          label: 'Audience Goals', 
          type: 'tags',
          placeholder: 'What does your audience want to achieve?' 
        }
      ]
    },
    cta_preferences: {
      title: 'Call-to-Action Preferences',
      description: 'How you want to guide readers to take action',
      icon: '🎯',
      fields: [
        { 
          name: 'primaryCTA', 
          label: 'Primary CTA', 
          type: 'input',
          placeholder: 'e.g., Schedule a free consultation',
          required: true 
        },
        { 
          name: 'ctaStyle', 
          label: 'CTA Style', 
          type: 'select',
          options: ['Direct', 'Soft sell', 'Question-based', 'Urgency-driven', 'Value-focused'],
          required: true 
        },
        { 
          name: 'ctaPlacement', 
          label: 'Preferred Placement', 
          type: 'select',
          options: ['End of post', 'Middle of post', 'Multiple throughout', 'Sidebar mention'],
          required: true 
        },
        { 
          name: 'ctaExamples', 
          label: 'CTA Examples', 
          type: 'tags',
          placeholder: 'Examples of CTAs you like to use...' 
        }
      ]
    }
  };

  const renderField = (field) => {
    const commonProps = {
      key: field.name,
      name: field.name,
      label: (
        <Space>
          {field.label}
          {field.required && <Text type="danger">*</Text>}
          {field.tooltip && (
            <Tooltip title={field.tooltip}>
              <InfoCircleOutlined style={{ color: 'var(--color-primary)' }} />
            </Tooltip>
          )}
        </Space>
      ),
      rules: field.required ? [{ required: true, message: `Please enter ${field.label}` }] : []
    };

    switch (field.type) {
      case 'select':
        return (
          <Form.Item {...commonProps}>
            <Select placeholder={field.placeholder || `Select ${field.label}`}>
              {field.options.map(option => (
                <Option key={option} value={option}>{option}</Option>
              ))}
            </Select>
          </Form.Item>
        );
      case 'textarea':
        return (
          <Form.Item {...commonProps}>
            <TextArea 
              rows={3} 
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
            />
          </Form.Item>
        );
      case 'tags':
        return (
          <Form.Item {...commonProps}>
            <Select
              mode="tags"
              placeholder={field.placeholder || `Add ${field.label.toLowerCase()}...`}
              tokenSeparators={[',']}
            />
          </Form.Item>
        );
      default:
        return (
          <Form.Item {...commonProps}>
            <Input placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`} />
          </Form.Item>
        );
    }
  };

  return (
    <Modal
      title={
        <Space>
          <BulbOutlined style={{ color: 'var(--color-primary)' }} />
          Manual Data Input
        </Space>
      }
      visible={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button 
          key="save" 
          type="primary" 
          icon={<SaveOutlined />}
          loading={saving}
          onClick={handleSave}
        >
          Save Manual Inputs
        </Button>
      ]}
    >
      <Alert
        message="Improve Content Quality"
        description="Provide manual inputs to enhance your blog generation when website analysis isn't available. This will help target 95+ SEO scores."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          size="small"
        >
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            type="card"
          >
            {Object.entries(inputTemplates).map(([key, template]) => (
              <TabPane
                key={key}
                tab={
                  <Space>
                    <span>{template.icon}</span>
                    {template.title}
                  </Space>
                }
              >
                <div style={{ padding: '16px 0' }}>
                  <div style={{ marginBottom: 16 }}>
                    <Title level={5}>{template.title}</Title>
                    <Text type="secondary">{template.description}</Text>
                  </div>
                  
                  {template.fields.map(renderField)}
                </div>
              </TabPane>
            ))}
          </Tabs>
        </Form>
      </Spin>

      <div style={{ marginTop: 16, padding: 12, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
        <Text style={{ fontSize: 12, color: '#52c41a' }}>
          💡 <strong>Tip:</strong> The more information you provide, the better your content quality will be. 
          You can always add more data later to improve future generations.
        </Text>
      </div>
    </Modal>
  );
};

export default ManualInputModal;