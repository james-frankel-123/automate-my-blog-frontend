/**
 * RelatedContentStepsPanel — step-by-step progress for fetching related content
 * (tweets, news articles, YouTube videos) before blog generation. Fetched items are
 * passed into the blog post generation call so they are embedded in the post.
 * Each step shows: running → done (Found N) | skipped | failed. Theme-aligned.
 */
import React from 'react';

const STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  DONE: 'done',
  SKIPPED: 'skipped',
  FAILED: 'failed',
};

const panelStyles = {
  panel: {
    padding: '12px 16px',
    marginBottom: '12px',
    backgroundColor: 'var(--color-primary-50)',
    borderRadius: 'var(--radius-md, 8px)',
    border: '1px solid var(--color-primary-100)',
    boxShadow: 'var(--shadow-card)',
  },
  title: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-primary-700)',
    marginBottom: '10px',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    marginBottom: '6px',
    color: 'var(--color-text-primary)',
  },
  stepLast: {
    marginBottom: 0,
  },
  icon: {
    flexShrink: 0,
    width: '18px',
    textAlign: 'center',
  },
  iconRunning: {
    display: 'inline-block',
    animation: 'related-step-spin 1s linear infinite',
  },
};

/**
 * @param {Object} props
 * @param {Array<{ id: string, label: string, status: 'pending'|'running'|'done'|'skipped'|'failed', count?: number }>} props.steps
 * @param {string} [props.title] - Panel title
 */
function RelatedContentStepsPanel({ steps = [], title = 'Preparing related content' }) {
  if (!steps?.length) return null;

  const getIcon = (status) => {
    switch (status) {
      case STATUS.PENDING:
        return '○';
      case STATUS.RUNNING:
        return '◐';
      case STATUS.DONE:
        return '✓';
      case STATUS.SKIPPED:
        return '−';
      case STATUS.FAILED:
        return '✗';
      default:
        return '○';
    }
  };

  const getStepLabel = (step) => {
    if (step.status === STATUS.DONE && step.count != null) {
      return `${step.label.replace(/…$/, '')} — Found ${step.count}`;
    }
    if (step.status === STATUS.SKIPPED) {
      return `${step.label} — Skipped`;
    }
    if (step.status === STATUS.FAILED) {
      return `${step.label} — Failed`;
    }
    return step.label;
  };

  return (
    <div
      style={panelStyles.panel}
      data-testid="related-content-steps-panel"
      role="status"
      aria-label={title}
      aria-live="polite"
    >
      <div style={panelStyles.title}>{title}</div>
      {steps.map((step, i) => (
        <div
          key={step.id}
          style={{
            ...panelStyles.step,
            ...(i === steps.length - 1 ? panelStyles.stepLast : {}),
          }}
          aria-busy={step.status === STATUS.RUNNING}
        >
          <span
            style={{
              ...panelStyles.icon,
              ...(step.status === STATUS.RUNNING ? panelStyles.iconRunning : {}),
            }}
            aria-hidden
          >
            {getIcon(step.status)}
          </span>
          <span>{getStepLabel(step)}</span>
        </div>
      ))}
    </div>
  );
}

export default RelatedContentStepsPanel;
export { STATUS };
