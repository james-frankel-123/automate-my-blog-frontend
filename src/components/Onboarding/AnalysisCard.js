/**
 * AnalysisCard — white card with icon (AI or fallback), heading, content.
 * Issue #261.
 */
import React from 'react';
import { Card, Typography } from 'antd';
import {
  AimOutlined,
  BarChartOutlined,
  ShopOutlined,
  RiseOutlined,
  SearchOutlined,
} from '@ant-design/icons';

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
  padding: 24,
};

const FALLBACK_ICONS = {
  targetAudience: AimOutlined,
  businessType: BarChartOutlined,
  businessModel: ShopOutlined,
  contentFocus: RiseOutlined,
  keywords: SearchOutlined,
};

export function AnalysisCard({
  iconUrl,
  iconFallback = 'businessType',
  heading,
  content,
  dataTestId,
}) {
  const FallbackIcon = FALLBACK_ICONS[iconFallback] || BarChartOutlined;
  return (
    <Card
      data-testid={dataTestId}
      style={CARD_STYLE}
      bodyStyle={{ padding: 24 }}
    >
      <div style={{ marginBottom: 12 }}>
        {iconUrl ? (
          <img src={iconUrl} alt="" style={{ width: 48, height: 48 }} />
        ) : (
          <FallbackIcon style={{ fontSize: 48, color: 'var(--color-primary)' }} />
        )}
      </div>
      {toDisplayString(heading) && (
        <Text strong style={{ fontSize: 18, display: 'block', marginBottom: 8, color: 'var(--color-text-primary)' }}>
          {toDisplayString(heading)}
        </Text>
      )}
      {toDisplayString(content) && (
        <Text style={{ fontSize: 16, color: 'var(--color-text-secondary)' }}>
          {toDisplayString(content)}
        </Text>
      )}
    </Card>
  );
}

export default AnalysisCard;
