import React from 'react';
import { Empty, Button, Typography, Space } from 'antd';

const { Title, Paragraph, Text } = Typography;

/**
 * Enhanced EmptyState Component
 * Provides helpful empty states with guidance and actionable CTAs
 */
const EmptyState = ({
  title,
  description,
  action,
  actionLabel,
  onAction,
  icon,
  image,
  tips,
  style = {}
}) => {
  const emptyDescription = (
    <div style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
      {title && (
        <Title level={4} style={{ marginBottom: '8px', color: '#262626' }}>
          {title}
        </Title>
      )}
      {description && (
        <Paragraph style={{ color: '#8c8c8c', marginBottom: '16px' }}>
          {description}
        </Paragraph>
      )}
      {tips && (
        <div style={{ marginTop: '16px', textAlign: 'left' }}>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
            <strong>Tip:</strong> {tips}
          </Text>
        </div>
      )}
    </div>
  );

  const emptyImage = image || (icon ? icon : Empty.PRESENTED_IMAGE_SIMPLE);

  return (
    <div style={{ padding: '40px 20px', ...style }}>
      <Empty
        image={emptyImage}
        description={emptyDescription}
        imageStyle={{ height: 80 }}
      >
        {action && onAction && (
          <Space direction="vertical" size="middle" style={{ marginTop: '16px' }}>
            <Button type="primary" size="large" onClick={onAction}>
              {actionLabel || action}
            </Button>
          </Space>
        )}
      </Empty>
    </div>
  );
};

export default EmptyState;
