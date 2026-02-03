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
    padding: '8px 14px 10px',
    backgroundColor: 'var(--color-primary-50)',
    borderRadius: '8px',
    border: '1px solid var(--color-primary-100)',
    textAlign: 'left',
    width: '100%',
    maxWidth: '100%',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  statusLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-primary-700)',
    lineHeight: 1.35,
  },
  pulseDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-primary-500)',
    flexShrink: 0,
  },
  progressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  progressBar: {
    flex: 1,
    minWidth: 0,
  },
  eta: {
    fontSize: '11px',
    color: 'var(--color-text-secondary)',
    flexShrink: 0,
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
 * @param {string} props.workingForYouLabel - e.g. "Working for you" (shown as "Working for you · [step]").
 * @param {string} [props.progressPreamble] - Optional; kept for API compatibility, not shown in UI.
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

  const lastThought = thoughts?.length ? thoughts[thoughts.length - 1] : null;
  const stepDisplay = currentStep || (lastThought?.message ?? '') || fallbackStep || '';
  const stepSuffix = phase || detail ? ` — ${phase || detail}` : '';
  const statusText = stepDisplay ? `${workingForYouLabel} · ${stepDisplay}${stepSuffix}` : workingForYouLabel;
  const showEta = estimatedTimeRemaining != null && estimatedTimeRemaining > 0;

  return (
    <div
      data-testid={dataTestId}
      role="status"
      aria-live="polite"
      aria-label={statusText}
      style={panelStyles.panel}
      className="thinking-panel"
    >
      <div style={panelStyles.statusLine}>
        <span className="thinking-panel-pulse" style={panelStyles.pulseDot} aria-hidden />
        <span>{statusText}</span>
      </div>
      <div style={panelStyles.progressRow}>
        <div style={panelStyles.progressBar}>
          <Progress
            percent={progress ?? 0}
            showInfo
            size="small"
            strokeColor={{ from: 'var(--color-primary)', to: 'var(--color-primary-400)' }}
            trailColor="var(--color-primary-100)"
          />
        </div>
        {showEta && (
          <span style={panelStyles.eta}>~{estimatedTimeRemaining}s left</span>
        )}
      </div>
    </div>
  );
}

export default ThinkingPanel;
