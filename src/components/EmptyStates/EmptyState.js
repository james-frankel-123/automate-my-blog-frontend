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
        <Title level={4} style={{ marginBottom: 'var(--space-2)', color: 'var(--color-text-primary)' }}>
          {title}
        </Title>
      )}
      {description && (
        <Paragraph style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          {description}
        </Paragraph>
      )}
      {tips && (
        <div style={{ marginTop: 'var(--space-4)', textAlign: 'left' }}>
          <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)', display: 'block', marginBottom: 'var(--space-2)' }}>
            <strong>Tip:</strong> {tips}
          </Text>
        </div>
      )}
    </div>
  );

  const emptyImage = image || (icon ? icon : Empty.PRESENTED_IMAGE_SIMPLE);

  return (
    <div style={{ padding: 'var(--space-10) var(--space-5)', ...style }}>
      <Empty
        image={emptyImage}
        description={emptyDescription}
        imageStyle={{ height: 80 }}
      >
        {action && onAction && (
          <Space direction="vertical" size="middle" style={{ marginTop: 'var(--space-4)' }}>
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
