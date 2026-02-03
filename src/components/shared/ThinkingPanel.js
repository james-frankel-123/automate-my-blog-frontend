/**
 * ThinkingPanel — shared "thinking" UX for analysis and content generation.
 * Shows a single latest step line, progress bar, optional ETA, and a pulse indicator.
 * Use where the action is (analysis step, create-post section) so the user sees
 * "what we're doing" without a tall list of steps.
 *
 * Issue #65 / Option B: one design, one component; contextual placement.
 */

import React from 'react';
import { Progress } from 'antd';

const panelStyles = {
  panel: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    marginBottom: '12px',
    padding: '10px 16px 12px',
    backgroundColor: 'var(--color-primary-50)',
    borderRadius: '8px',
    border: '1px solid var(--color-primary-100)',
    textAlign: 'left',
    width: '100%',
    maxWidth: '100%',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  workingLabel: {
    marginBottom: '2px',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--color-text-secondary)',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  pulseDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-primary-500)',
    flexShrink: 0,
  },
  stepLine: {
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-primary-700)',
    lineHeight: 1.35,
  },
  eta: {
    marginTop: '4px',
    fontSize: '11px',
    color: 'var(--color-text-secondary)',
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
  fallbackStep,
  dataTestId = 'thinking-panel',
}) {
  const hasProgress = progress != null || currentStep || (thoughts && thoughts.length > 0);
  if (!isActive && !hasProgress) return null;

  // Single line: show only the latest step (currentStep, or last thought, or fallback)
  const lastThought = thoughts?.length ? thoughts[thoughts.length - 1] : null;
  const stepDisplay = currentStep || (lastThought?.message ?? '') || fallbackStep || '';
  const stepSuffix = phase || detail ? ` — ${phase || detail}` : '';

  return (
    <div
      data-testid={dataTestId}
      role="status"
      aria-live="polite"
      aria-label={`${workingForYouLabel}. ${progressPreamble} ${stepDisplay}`}
      style={panelStyles.panel}
      className="thinking-panel"
    >
      <div style={panelStyles.workingLabel}>
        <span className="thinking-panel-pulse" style={panelStyles.pulseDot} aria-hidden />
        {workingForYouLabel}
      </div>
      <div style={panelStyles.stepLine}>
        {progressPreamble} {stepDisplay}{stepSuffix}
      </div>
      <Progress
        percent={progress ?? 0}
        showInfo
        size="small"
        strokeColor={{ from: 'var(--color-primary)', to: 'var(--color-primary-400)' }}
        trailColor="var(--color-primary-100)"
      />
      {estimatedTimeRemaining != null && estimatedTimeRemaining > 0 && (
        <div style={panelStyles.eta}>~{estimatedTimeRemaining} seconds remaining</div>
      )}
    </div>
  );
}

export default ThinkingPanel;
