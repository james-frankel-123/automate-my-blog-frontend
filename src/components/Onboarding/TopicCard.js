/**
 * TopicCard — white card with image, title, description. Selectable.
 * Issue #261.
 */
import React, { useState } from 'react';
import { Card, Typography } from 'antd';
import { CheckCircleFilled, FileTextOutlined } from '@ant-design/icons';
import { getPlaceholderStyle } from '../../utils/placeholderStyles';

const { Text } = Typography;

function toDisplayString(val) {
  if (val == null) return '';
  if (typeof val === 'string') return val.trim() || '';
  if (typeof val === 'object') {
    const parts = [];
    Object.entries(val).forEach(([k, v]) => {
      if (v == null) return;
      const s = typeof v === 'string' ? v : (typeof v === 'object' ? JSON.stringify(v) : String(v));
      if (s.trim()) parts.push(s);
    });
    return parts.join(' · ');
  }
  return String(val);
}

const CARD_STYLE = {
  background: 'var(--color-background-elevated)',
  borderRadius: 'var(--radius-xl)',
  boxShadow: 'var(--shadow-card)',
  overflow: 'hidden',
};

export function TopicCard({
  imageUrl,
  title,
  description,
  selected,
  onClick,
  dataTestId,
  placeholderSeed = 0,
}) {
  const [imageError, setImageError] = useState(false);
  const showImage = imageUrl && !imageError;
  const placeholderStyle = getPlaceholderStyle(placeholderSeed);
  return (
    <Card
      data-testid={dataTestId}
      style={{
        ...CARD_STYLE,
        border: selected ? '2px solid var(--color-primary)' : '1px solid var(--color-border-base)',
        cursor: 'pointer',
      }}
      bodyStyle={{ padding: 0 }}
      onClick={onClick}
    >
      <div style={{ aspectRatio: '16/9', background: 'var(--color-background-container)', position: 'relative' }}>
        {showImage ? (
          <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImageError(true)} />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: 'var(--color-text-tertiary)',
              ...placeholderStyle,
            }}
          >
            <FileTextOutlined style={{ fontSize: 32, opacity: 0.6 }} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>Topic image</span>
          </div>
        )}
        {selected && (
          <CheckCircleFilled
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              fontSize: 24,
              color: 'var(--color-primary)',
            }}
          />
        )}
      </div>
      <div style={{ padding: 16 }}>
        {toDisplayString(title) && <Text strong style={{ display: 'block', marginBottom: 4, color: 'var(--color-text-primary)' }}>{toDisplayString(title)}</Text>}
        {toDisplayString(description) && <Text type="secondary" style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{toDisplayString(description)}</Text>}
      </div>
    </Card>
  );
}

export default TopicCard;
