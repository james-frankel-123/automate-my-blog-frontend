import React from 'react';
import { Empty, Button, Typography, Space } from 'antd';
import {
  WarningOutlined,
  TeamOutlined,
  BulbOutlined,
  LinkOutlined,
  SoundOutlined,
  BankOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { systemVoice } from '../../copy/systemVoice';

const { Text } = Typography;

const iconStyle = { fontSize: 48, color: 'var(--color-text-tertiary)' };
const ICON_MAP = {
  scraping_failed: <WarningOutlined style={{ fontSize: 48, color: 'var(--color-warning)' }} />,
  business_model_failed: <BankOutlined style={iconStyle} />,
  target_audience_failed: <TeamOutlined style={iconStyle} />,
  keywords_failed: <BulbOutlined style={iconStyle} />,
  ctas_not_found: <LinkOutlined style={iconStyle} />,
  brand_analysis_failed: <SoundOutlined style={iconStyle} />,
  website_content_failed: <FileTextOutlined style={iconStyle} />,
  content_focus_failed: <FileTextOutlined style={iconStyle} />,
  website_goals_failed: <BankOutlined style={iconStyle} />,
  blog_strategy_failed: <FileTextOutlined style={iconStyle} />,
};

/**
 * Empty state for failed or missing website analysis data (Issue #185).
 * Supports full-width (analysis failed) and compact inline (single category failed).
 */
const AnalysisEmptyState = ({
  type,
  heading: headingOverride,
  reasons: reasonsOverride,
  actions = [],
  compact = false,
  style = {},
  dataTestId = 'analysis-empty-state',
}) => {
  const copy = systemVoice.analysis?.emptyStates?.[type];
  const heading = headingOverride ?? copy?.heading ?? 'Could not load this data';
  const reasons = reasonsOverride ?? copy?.reasons ?? [];
  const defaultPrimary = copy?.primaryAction;
  const defaultSecondary = copy?.secondaryAction;

  const effectiveActions = actions.length > 0
    ? actions
    : [
        ...(defaultPrimary ? [{ label: defaultPrimary, onClick: null, primary: true }] : []),
        ...(defaultSecondary ? [{ label: defaultSecondary, onClick: null, primary: false }] : []),
      ];

  const icon = ICON_MAP[type] ?? <WarningOutlined style={{ fontSize: compact ? 32 : 48, color: 'var(--color-text-tertiary)' }} />;

  const content = (
    <>
      <div style={{ marginBottom: compact ? 8 : 12 }}>
        <Text strong style={{ fontSize: compact ? 14 : 16, color: 'var(--color-text-primary)' }}>
          {heading}
        </Text>
      </div>
      {reasons.length > 0 && (
        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            color: 'var(--color-text-secondary)',
            fontSize: compact ? 12 : 13,
            lineHeight: 1.5,
            marginBottom: compact ? 8 : 12,
          }}
        >
          {reasons.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>
      )}
      {effectiveActions.length > 0 && (
        <Space size="small" wrap>
          {effectiveActions.map((action, i) => (
            <Button
              key={i}
              type={action.primary !== false ? 'primary' : 'default'}
              size={compact ? 'small' : 'middle'}
              onClick={action.onClick}
              data-testid={action.onClick ? `${dataTestId}-action-${i}` : undefined}
            >
              {action.label}
            </Button>
          ))}
        </Space>
      )}
    </>
  );

  if (compact) {
    return (
      <div
        data-testid={dataTestId}
        style={{
          padding: 12,
          backgroundColor: 'var(--color-background-container)',
          border: '1px dashed var(--color-border-base)',
          borderRadius: 'var(--radius-lg)',
          ...style,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ flexShrink: 0, marginTop: 2 }}>{icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>{content}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid={dataTestId}
      style={{
        padding: '24px 20px',
        textAlign: 'center',
        maxWidth: 480,
        margin: '0 auto',
        ...style,
      }}
    >
      <Empty
        image={icon}
        description={null}
        imageStyle={{ height: 48 }}
      >
        <div style={{ textAlign: 'left' }}>{content}</div>
      </Empty>
    </div>
  );
};

export default AnalysisEmptyState;
