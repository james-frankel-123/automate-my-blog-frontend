import React, { useState } from 'react';
import {
  Modal,
  Button,
  Form,
  Input,
  Select,
  Space,
  Typography,
  Divider,
  Alert,
  message
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

/**
 * ManualCTAInputModal component
 * Allows users to manually input CTAs when website scraping didn't find enough
 */
const ManualCTAInputModal = ({
  open,
  visible, // Support both prop names
  organizationId,
  onClose,
  onCancel, // Support both prop names
  onSuccess,
  onSubmit, // Support both prop names
  onSkip,
  existingCTAs = [],
  minCTAs = 3
}) => {
  const minRequired = minCTAs;
  // Normalize prop names
  const isOpen = open || visible;
  const handleClose = onClose || onCancel || (() => {});
  const handleSuccess = onSuccess || onSubmit || (() => {});
  const [_form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Initialize with existing CTAs if available, otherwise use empty defaults
  const getInitialCTAs = () => {
    if (existingCTAs && existingCTAs.length > 0) {
      return existingCTAs.map(cta => ({
        text: cta.text || '',
        href: cta.href || '',
        type: cta.type || 'contact',
        placement: cta.placement || 'end-of-post'
      }));
    }
    return Array.from({ length: minRequired }, (_, i) => ({
      text: '',
      href: '',
      type: ['contact', 'demo', 'signup'][i] || 'contact',
      placement: 'end-of-post'
    }));
  };

  const [ctas, setCtas] = useState(getInitialCTAs());

  // Reset CTAs when modal opens or existingCTAs change
  React.useEffect(() => {
    if (isOpen) {
      setCtas(getInitialCTAs());
    }
  }, [isOpen, existingCTAs]); // eslint-disable-line react-hooks/exhaustive-deps

  // CTA Type options
  const ctaTypeOptions = [
    { value: 'contact', label: 'Contact Form', description: 'Contact us, get in touch' },
    { value: 'demo', label: 'Schedule Demo', description: 'Book a call, schedule consultation' },
    { value: 'signup', label: 'Sign Up', description: 'Create account, join waitlist' },
    { value: 'download', label: 'Download Resource', description: 'Guide, ebook, whitepaper' },
    { value: 'trial', label: 'Free Trial', description: 'Start free trial, try for free' },
    { value: 'product', label: 'View Product', description: 'Learn more, see features' }
  ];

  // CTA Placement options
  const placementOptions = [
    { value: 'header', label: 'Header / Navigation' },
    { value: 'sidebar', label: 'Sidebar' },
    { value: 'end-of-post', label: 'End of Blog Post' },
    { value: 'footer', label: 'Footer' }
  ];

  // Add new CTA
  const handleAddCTA = () => {
    setCtas([...ctas, { text: '', href: '', type: 'contact', placement: 'end-of-post' }]);
  };

  // Remove CTA
  const handleRemoveCTA = (index) => {
    if (ctas.length <= minRequired) {
      message.warning(`You must have at least ${minRequired} CTA${minRequired !== 1 ? 's' : ''}`);
      return;
    }
    const newCtas = ctas.filter((_, i) => i !== index);
    setCtas(newCtas);
  };

  // Update CTA field
  const handleCTAChange = (index, field, value) => {
    const newCtas = [...ctas];
    newCtas[index][field] = value;
    setCtas(newCtas);
  };

  // Validate URL format
  const isValidURL = (url) => {
    // Allow relative URLs starting with /
    if (url.startsWith('/')) return true;

    // Validate absolute URLs
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Validate all CTAs
  const validateCTAs = () => {
    const errors = [];

    // Check minimum count
    if (ctas.length < minRequired) {
      errors.push(`Please provide at least ${minRequired} CTA${minRequired !== 1 ? 's' : ''} for best content generation results`);
    }

    // Check each CTA has required fields
    ctas.forEach((cta, index) => {
      if (!cta.text || !cta.text.trim()) {
        errors.push(`CTA ${index + 1}: Text is required`);
      }
      if (!cta.href || !cta.href.trim()) {
        errors.push(`CTA ${index + 1}: URL is required`);
      } else if (!isValidURL(cta.href)) {
        errors.push(`CTA ${index + 1}: Invalid URL format. Use absolute URL (https://...) or relative path (/contact)`);
      }
    });

    // Check for duplicate URLs
    const hrefs = ctas.map(c => c.href.trim()).filter(h => h);
    const uniqueHrefs = new Set(hrefs);
    if (hrefs.length !== uniqueHrefs.size) {
      errors.push('Each CTA must have a unique URL');
    }

    return errors;
  };

  // Submit CTAs
  const handleSubmit = async () => {
    const errors = validateCTAs();

    if (errors.length > 0) {
      errors.forEach(error => message.error(error));
      return;
    }

    // Prepare CTA data
    const ctaData = ctas.map(cta => ({
      text: cta.text.trim(),
      href: cta.href.trim(),
      type: cta.type,
      placement: cta.placement,
      context: `Manually entered ${cta.type} CTA`
    }));

    // If there's a custom submit handler (from parent), use that
    // Otherwise, handle the API call here
    if (onSubmit && onSubmit !== onSuccess) {
      // Parent will handle the API call
      handleSuccess(ctaData);
      handleClose();
    } else {
      // Handle API call here
      setLoading(true);
      try {
        const response = await api.addManualCTAs(organizationId, ctaData);
        message.success(`Successfully added ${response.ctas_added} CTAs!`);
        handleSuccess(response);
        handleClose();
      } catch (error) {
        console.error('Failed to add CTAs:', error);
        message.error(error.message || 'Failed to add CTAs. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Skip adding CTAs
  const handleSkipCTAs = () => {
    if (onSkip) {
      onSkip();
    } else {
      Modal.confirm({
        title: 'Generate without CTAs?',
        content: 'Content will be created without calls-to-action. You can add them later when editing.',
        okText: 'Continue Without CTAs',
        cancelText: 'Go Back',
        onOk: () => {
          handleSuccess({ skipped: true });
          handleClose();
        }
      });
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={handleClose}
      width={700}
      footer={null}
      centered
      maskClosable={false}
    >
      <div style={{ padding: '12px 0' }}>
        <Space direction="vertical" size={4} style={{ width: '100%', marginBottom: 24 }}>
          <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <LinkOutlined style={{ color: 'var(--color-primary)' }} />
            {existingCTAs && existingCTAs.length > 0 ? 'Edit Calls-to-Action' : 'Add Calls-to-Action'}
          </Title>
          <Paragraph style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            {existingCTAs && existingCTAs.length > 0
              ? `Edit your CTAs below. At least ${minRequired} CTA${minRequired !== 1 ? 's are' : ' is'} recommended for effective content generation.`
              : `We couldn't find enough CTAs on your website. Please add at least ${minRequired} CTA${minRequired !== 1 ? 's' : ''} to generate effective content with working links.`
            }
          </Paragraph>
        </Space>

        <Alert
          message="What are CTAs?"
          description="Calls-to-action are links that encourage readers to take action (contact you, schedule a demo, download a resource, etc.). We'll incorporate these naturally into your blog content."
          type="info"
          showIcon
          icon={<CheckCircleOutlined />}
          style={{ marginBottom: 24 }}
        />

        <Divider style={{ margin: '16px 0' }} />

        <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: 8 }}>
          {ctas.map((cta, index) => (
            <div
              key={index}
              style={{
                padding: 16,
                marginBottom: 12,
                border: '1px solid var(--color-border-base)',
                borderRadius: 8,
                backgroundColor: 'var(--color-background-alt)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text strong>CTA {index + 1}</Text>
                {ctas.length > minRequired && (
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveCTA(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>

              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <div>
                  <Text style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>CTA Text *</Text>
                  <Input
                    placeholder="e.g., Schedule Your Free Consultation"
                    value={cta.text}
                    onChange={(e) => handleCTAChange(index, 'text', e.target.value)}
                    style={{ marginTop: 4 }}
                  />
                </div>

                <div>
                  <Text style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>CTA URL *</Text>
                  <Input
                    placeholder="e.g., /contact or https://calendly.com/..."
                    value={cta.href}
                    onChange={(e) => handleCTAChange(index, 'href', e.target.value)}
                    style={{ marginTop: 4 }}
                    prefix={<LinkOutlined />}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>CTA Type *</Text>
                    <Select
                      value={cta.type}
                      onChange={(value) => handleCTAChange(index, 'type', value)}
                      style={{ width: '100%', marginTop: 4 }}
                    >
                      {ctaTypeOptions.map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  <div style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Placement *</Text>
                    <Select
                      value={cta.placement}
                      onChange={(value) => handleCTAChange(index, 'placement', value)}
                      style={{ width: '100%', marginTop: 4 }}
                    >
                      {placementOptions.map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </div>
              </Space>
            </div>
          ))}
        </div>

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={handleAddCTA}
          style={{ width: '100%', marginTop: 12 }}
        >
          Add Another CTA
        </Button>

        {ctas.length < minRequired && (
          <Alert
            message={`Add ${minRequired - ctas.length} more CTA${minRequired - ctas.length > 1 ? 's' : ''}`}
            description={`At least ${minRequired} CTA${minRequired !== 1 ? 's are' : ' is'} recommended for effective content generation`}
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            style={{ marginTop: 16 }}
          />
        )}

        <Divider style={{ margin: '24px 0 16px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <Button onClick={handleSkipCTAs} disabled={loading}>
            Generate Without CTAs
          </Button>
          <Space>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={loading}
              disabled={ctas.length < minRequired}
            >
              Save {ctas.length} CTA{ctas.length !== 1 ? 's' : ''}
            </Button>
          </Space>
        </div>
      </div>
    </Modal>
  );
};

export default ManualCTAInputModal;
