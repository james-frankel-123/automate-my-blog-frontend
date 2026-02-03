/**
 * ThinkingPanel — shared "thinking" UX for analysis and content generation.
 * Shows current step, progress bar, optional ETA, and optional thought log.
 * Use where the action is (analysis step, create-post section) so the user sees
 * "what we're doing" right next to the task.
 *
 * Issue #65 / Option B: one design, one component; contextual placement.
 */

import React from 'react';
import { Progress } from 'antd';

const panelStyles = {
  panel: {
    marginBottom: '24px',
    padding: '20px',
    backgroundColor: 'var(--color-primary-50)',
    borderRadius: '12px',
    border: '1px solid var(--color-primary-100)',
    textAlign: 'left',
    maxWidth: '420px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  workingLabel: {
    marginBottom: '6px',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--color-text-secondary)',
    fontWeight: 600,
  },
  stepLine: {
    marginBottom: '12px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--color-primary-700)',
    lineHeight: 1.4,
  },
  eta: {
    marginTop: '10px',
    fontSize: '12px',
    color: 'var(--color-text-secondary)',
  },
  thoughtsSection: {
    marginTop: '16px',
    paddingTop: '14px',
    borderTop: '1px solid var(--color-primary-100)',
    fontSize: '13px',
    color: 'var(--color-text-secondary)',
  },
  thoughtsTitle: {
    marginBottom: '8px',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
  },
  thoughtList: {
    margin: 0,
    paddingLeft: '20px',
    lineHeight: 1.6,
  },
  thoughtItem: {
    marginBottom: '4px',
  },
};

/**
 * @param {Object} props
 * @param {boolean} [props.isActive] - When true, show panel even if progress is null (shows indeterminate state).
 * @param {string} [props.currentStep] - Current step label (e.g. "Reading your pages…").
 * @param {number} [props.progress] - 0–100 progress.
 * @param {Array<{ message: string, phase?: string, url?: string }>} [props.thoughts] - Thought log from scrape-phase or similar.
 * @param {number} [props.estimatedTimeRemaining] - Seconds remaining (optional).
 * @param {string} [props.phase] - Optional sub-phase (appended to currentStep).
 * @param {string} [props.detail] - Optional detail (appended to currentStep).
 * @param {string} props.workingForYouLabel - e.g. "Working for you".
 * @param {string} props.progressPreamble - e.g. "Right now:".
 * @param {string} [props.progressLabel] - e.g. "What we're doing:" (for thought list heading).
 * @param {string} [props.fallbackStep] - Shown when currentStep is missing (e.g. "Drafting your post…").
 * @param {string} [props.dataTestId] - For tests (e.g. "website-analysis-progress", "content-generation-progress").
 */
function ThinkingPanel({
  isActive = false,
  currentStep,
  progress,
  thoughts = [],
  estimatedTimeRemaining,
  phase,
  detail,
  workingForYouLabel,
  progressPreamble,
  progressLabel,
  fallbackStep,
  dataTestId = 'thinking-panel',
}) {
  const hasProgress = progress != null || currentStep || (thoughts && thoughts.length > 0);
  if (!isActive && !hasProgress) return null;

  const stepDisplay = currentStep || fallbackStep || '';
  const stepSuffix = phase || detail ? ` — ${phase || detail}` : '';

  return (
    <div
      data-testid={dataTestId}
      role="status"
      aria-live="polite"
      aria-label={`${workingForYouLabel}. ${progressPreamble} ${stepDisplay}`}
      style={panelStyles.panel}
    >
      <div style={panelStyles.workingLabel}>{workingForYouLabel}</div>
      <div style={panelStyles.stepLine}>
        {progressPreamble} {stepDisplay}{stepSuffix}
      </div>
      <Progress
        percent={progress ?? 0}
        showInfo
        strokeColor={{ from: 'var(--color-primary)', to: 'var(--color-primary-400)' }}
        trailColor="var(--color-primary-100)"
      />
      {estimatedTimeRemaining != null && estimatedTimeRemaining > 0 && (
        <div style={panelStyles.eta}>~{estimatedTimeRemaining} seconds remaining</div>
      )}
      {thoughts && thoughts.length > 0 && progressLabel && (
        <div style={panelStyles.thoughtsSection}>
          <div style={panelStyles.thoughtsTitle}>{progressLabel}</div>
          <ul style={panelStyles.thoughtList}>
            {thoughts.map((t, i) => (
              <li key={i} style={panelStyles.thoughtItem}>
                {t.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ThinkingPanel;
