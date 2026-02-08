/**
 * ChecklistProgress — checklist-style progress UI for website analysis (original PR: fix/preserve-animation-state-for-results).
 * Renders a list of steps with the current one highlighted and a progress bar.
 */

import React from 'react';
import { Progress } from 'antd';

const listStyles = {
  list: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 12px 0',
    textAlign: 'left',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 0',
    fontSize: '13px',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.4,
  },
  itemCurrent: {
    color: 'var(--color-primary-700)',
    fontWeight: 600,
  },
  itemDone: {
    color: 'var(--color-text-tertiary)',
  },
  check: {
    flexShrink: 0,
    width: '16px',
    textAlign: 'center',
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
 * @param {string[]} [props.steps] - Step labels (e.g. systemVoice.analysis.steps).
 * @param {string} [props.currentStep] - Current step label from stream.
 * @param {string} [props.phase] - Optional phase from stream.
 * @param {number} [props.progress] - 0–100 progress.
 * @param {number} [props.estimatedTimeRemaining] - Seconds remaining.
 * @param {string} [props.dataTestId] - For tests.
 */
function ChecklistProgress({
  steps = [],
  currentStep,
  phase,
  progress,
  estimatedTimeRemaining,
  dataTestId = 'checklist-progress',
}) {
  const hasNumericProgress = progress != null && typeof progress === 'number';
  const percent = hasNumericProgress ? progress : undefined;
  const showEta = estimatedTimeRemaining != null && estimatedTimeRemaining > 0;

  // Find current step index by matching currentStep (or phase) to steps
  let currentIndex = 0;
  if (currentStep && steps.length) {
    const match = steps.findIndex((s) =>
      (currentStep && currentStep.toLowerCase().includes(s.toLowerCase())) || (phase && phase.toLowerCase().includes(s.toLowerCase()))
    );
    if (match >= 0) currentIndex = match;
    else if (hasNumericProgress && steps.length > 0) {
      currentIndex = Math.min(Math.floor((progress / 100) * steps.length), steps.length - 1);
    }
  } else if (hasNumericProgress && steps.length > 0) {
    currentIndex = Math.min(Math.floor((progress / 100) * steps.length), steps.length - 1);
  }

  return (
    <div data-testid={dataTestId} role="status" aria-live="polite">
      {steps.length > 0 && (
        <ul style={listStyles.list}>
          {steps.map((label, i) => {
            const isDone = i < currentIndex;
            const isCurrent = i === currentIndex;
            return (
              <li
                key={i}
                style={{
                  ...listStyles.item,
                  ...(isCurrent ? listStyles.itemCurrent : isDone ? listStyles.itemDone : {}),
                }}
              >
                <span style={listStyles.check}>
                  {isDone ? '✓' : isCurrent ? '·' : '○'}
                </span>
                <span>{label}</span>
                {isCurrent && phase && (
                  <span style={{ marginLeft: '4px', fontWeight: 'normal', color: 'var(--color-text-tertiary)' }}>
                    — {phase}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <div style={listStyles.progressRow}>
        <div style={listStyles.progressBar}>
          <Progress
            percent={percent}
            status={!hasNumericProgress ? 'active' : undefined}
            showInfo={hasNumericProgress}
            size="small"
            strokeColor={hasNumericProgress ? { from: 'var(--color-primary)', to: 'var(--color-primary-400)' } : undefined}
            railColor="var(--color-primary-100)"
          />
        </div>
        {showEta && (
          <span style={listStyles.eta}>~{estimatedTimeRemaining}s left</span>
        )}
      </div>
    </div>
  );
}

export default ChecklistProgress;
