/**
 * SystemHint — one-line hint strip below the header.
 * Shows contextual hints, confirmations, and non-critical errors from systemVoice.
 */

import React from 'react';
import { useSystemHint } from '../../contexts/SystemHintContext';
import { InfoCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const variantStyles = {
  hint: {
    background: 'var(--system-hint-hint-bg)',
    borderColor: 'var(--system-hint-hint-border)',
    color: 'var(--system-hint-hint-color)',
    icon: <InfoCircleOutlined />,
  },
  success: {
    background: 'var(--system-hint-success-bg)',
    borderColor: 'var(--system-hint-success-border)',
    color: 'var(--system-hint-success-color)',
    icon: <CheckCircleOutlined />,
  },
  error: {
    background: 'var(--system-hint-error-bg)',
    borderColor: 'var(--system-hint-error-border)',
    color: 'var(--system-hint-error-color)',
    icon: <CloseCircleOutlined />,
  },
};

export default function SystemHint() {
  const { hint, clearHint } = useSystemHint();
  if (!hint?.message) return null;

  const style = variantStyles[hint.variant] || variantStyles.hint;
  return (
    <div
      data-testid="system-hint"
      role="status"
      aria-live="polite"
      style={{
        padding: '8px 16px',
        fontSize: '14px',
        lineHeight: '1.5',
        borderBottom: `1px solid ${style.borderColor}`,
        backgroundColor: style.background,
        color: style.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        minHeight: '40px',
      }}
    >
      <span style={{ flexShrink: 0 }}>{style.icon}</span>
      <span style={{ flex: 1, textAlign: 'center' }}>{hint.message}</span>
      <button
        type="button"
        onClick={clearHint}
        aria-label="Dismiss hint"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          color: 'inherit',
          opacity: 0.7,
        }}
      >
        ×
      </button>
    </div>
  );
}
