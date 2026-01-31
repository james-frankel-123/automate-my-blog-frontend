import React, { useState } from 'react';
import { Modal, Button, DatePicker, Select, Checkbox, Form, Space, Typography, Divider } from 'antd';
import { ScheduleOutlined, GlobalOutlined, MailOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * SchedulingModal component
 * Allows users to schedule blog posts for publication
 */
const SchedulingModal = ({ 
  open, 
  post,
  onClose, 
  onSave
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // DUMMY DATA - Platform options for scheduling
  const platforms = [
    { value: 'wordpress', label: 'WordPress', icon: '📝' },
    { value: 'medium', label: 'Medium', icon: '📰' },
    { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { value: 'substack', label: 'Substack', icon: '✍️' },
    { value: 'ghost', label: 'Ghost', icon: '👻' },
    { value: 'custom', label: 'Custom Platform', icon: '🔗' }
  ];

  const handleSubmit = async (values) => {
    setLoading(true);
    
    // DUMMY DATA - Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const scheduleData = {
      date: values.scheduledDate.toISOString(),
      platform: values.platform,
      notify: values.notifyOnPublish || false
    };
    
    onSave(scheduleData);
    setLoading(false);
    form.resetFields();
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  // Default to current time + 1 hour
  const defaultDate = dayjs().add(1, 'hour');

  return (
    <Modal
      open={open}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ScheduleOutlined style={{ color: 'var(--color-primary)' }} />
          <span>Schedule Post</span>
        </div>
      }
      width={600}
      onCancel={handleCancel}
      footer={null}
      centered
    >
      <div style={{ padding: '20px 0' }}>
        {/* Post Preview */}
        <div style={{
          background: 'var(--color-background-alt)',
          border: '1px solid var(--color-border-base)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <Title level={5} style={{ margin: '0 0 8px 0', color: 'var(--color-text-primary)' }}>
            {post?.title}
          </Title>
          {post?.isDummy && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              📝 DUMMY DATA - This is sample content for demonstration
            </Text>
          )}
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            scheduledDate: defaultDate,
            platform: 'wordpress',
            notifyOnPublish: true
          }}
        >
          {/* Schedule Date & Time */}
          <Form.Item
            label={
              <span>
                <ScheduleOutlined style={{ marginRight: '8px', color: 'var(--color-primary)' }} />
                Publication Date & Time
              </span>
            }
            name="scheduledDate"
            rules={[
              { required: true, message: 'Please select a publication date' },
              {
                validator: (_, value) => {
                  if (value && dayjs(value).isBefore(dayjs())) {
                    return Promise.reject(new Error('Publication date must be in the future'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
              placeholder="Select publication date and time"
              disabledDate={(current) => current && dayjs(current).isBefore(dayjs(), 'day')}
            />
          </Form.Item>

          {/* Platform Selection */}
          <Form.Item
            label={
              <span>
                <GlobalOutlined style={{ marginRight: '8px', color: 'var(--color-primary)' }} />
                Publication Platform
              </span>
            }
            name="platform"
            rules={[{ required: true, message: 'Please select a platform' }]}
          >
            <Select placeholder="Select where to publish">
              {platforms.map(platform => (
                <Option key={platform.value} value={platform.value}>
                  <span style={{ marginRight: '8px' }}>{platform.icon}</span>
                  {platform.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Email Notification */}
          <Form.Item name="notifyOnPublish" valuePropName="checked">
            <Checkbox>
              <span>
                <MailOutlined style={{ marginRight: '8px', color: 'var(--color-primary)' }} />
                Send email notification when published
              </span>
            </Checkbox>
          </Form.Item>

          <Divider />

          {/* Information Note */}
          <div style={{
            background: 'var(--color-success-bg)',
            border: '1px solid var(--color-success-border)',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '20px'
          }}>
            <Text style={{ fontSize: '14px', color: 'var(--color-success-dark)' }}>
              💡 <strong>Note:</strong> This scheduling feature stores data locally for demonstration. 
              In the full version, posts will be automatically published to your selected platform.
            </Text>
          </div>

          {/* Action Buttons */}
          <Form.Item style={{ margin: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<ScheduleOutlined />}
              >
                Schedule Post
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default SchedulingModal;