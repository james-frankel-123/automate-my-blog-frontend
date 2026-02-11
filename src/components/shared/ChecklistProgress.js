/**
 * ChecklistProgress — A checklist-style progress indicator for analysis tasks.
 * Shows steps as checkboxes that get checked off as tasks complete.
 * Features cute animations and a clean white background.
 */

import React, { useRef, useEffect } from 'react';
import { CheckOutlined, LoadingOutlined } from '@ant-design/icons';

const styles = {
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px 24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: '1px solid var(--color-border-base)',
  },
  checklistItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 0',
    fontSize: '14px',
    color: 'var(--color-text-primary)',
    transition: 'all 0.3s ease',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    borderRadius: '6px',
    border: '2px solid var(--color-border-base)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.3s ease',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: 'var(--color-success)',
    borderColor: 'var(--color-success)',
    animation: 'checkboxPop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  checkboxActive: {
    backgroundColor: 'var(--color-primary-50)',
    borderColor: 'var(--color-primary)',
    borderWidth: '2px',
  },
  checkIcon: {
    fontSize: '12px',
    color: '#ffffff',
    animation: 'checkmarkSlide 0.3s ease-out',
  },
  spinnerIcon: {
    fontSize: '12px',
    color: 'var(--color-primary)',
  },
  itemText: {
    flex: 1,
    lineHeight: 1.5,
  },
  itemTextChecked: {
    color: 'var(--color-text-tertiary)',
    textDecoration: 'line-through',
  },
  itemTextActive: {
    color: 'var(--color-primary)',
    fontWeight: 600,
  },
  footer: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid var(--color-border-secondary)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    color: 'var(--color-text-secondary)',
  },
  progressText: {
    fontWeight: 500,
  },
  eta: {
    color: 'var(--color-text-tertiary)',
  },
};

/**
 * @param {Object} props
 * @param {Array<string>} props.steps - Array of step labels
 * @param {string} props.currentStep - Currently active high-level step
 * @param {string} [props.phase] - Current sub-phase within the step
 * @param {number} [props.progress] - Overall progress percentage (0-100)
 * @param {number} [props.estimatedTimeRemaining] - Seconds remaining
 * @param {string} [props.dataTestId] - Test ID for the component
 */
function ChecklistProgress({
  steps = [],
  currentStep,
  phase,
  progress,
  estimatedTimeRemaining,
  dataTestId = 'checklist-progress',
}) {
  // Track the maximum step index reached to prevent backwards movement
  const maxStepIndexRef = useRef(-1);

  // Reset max step when progress goes to 0-2% (new job starting)
  useEffect(() => {
    if (progress != null && progress <= 2) {
      maxStepIndexRef.current = -1;
    }
  }, [progress]);

  // Determine current step index based on progress percentage
  let currentStepIndex = -1;

  if (progress != null && steps.length > 0) {
    // Calculate step index from progress (0-100%)
    currentStepIndex = Math.min(
      Math.floor((progress / 100) * steps.length),
      steps.length - 1
    );
  }

  // Prevent backwards movement: don't allow currentStepIndex to go lower than max
  if (currentStepIndex !== -1 && currentStepIndex < maxStepIndexRef.current) {
    currentStepIndex = maxStepIndexRef.current;
  } else if (currentStepIndex > maxStepIndexRef.current) {
    maxStepIndexRef.current = currentStepIndex;
  }

  // Determine which steps are complete (before current), active (current), or pending (after current)
  const getStepState = (index) => {
    if (currentStepIndex === -1) {
      // If no current step determined, show first step as active
      return index === 0 ? 'active' : 'pending';
    } else if (index < currentStepIndex) {
      return 'complete';
    } else if (index === currentStepIndex) {
      return 'active';
    } else {
      return 'pending';
    }
  };

  return (
    <div
      data-testid={dataTestId}
      role="status"
      aria-live="polite"
      aria-label={`Analysis progress: ${currentStep || 'Starting'}`}
      style={styles.container}
      className="checklist-progress"
    >
      {steps.map((step, index) => {
        const state = getStepState(index);
        const isComplete = state === 'complete';
        const isActive = state === 'active';

        return (
          <div
            key={step}
            style={{
              ...styles.checklistItem,
              opacity: isComplete ? 0.7 : 1,
            }}
            data-testid={`checklist-item-${index}`}
            data-state={state}
          >
            <div
              style={{
                ...styles.checkbox,
                ...(isComplete ? styles.checkboxChecked : {}),
                ...(isActive ? styles.checkboxActive : {}),
              }}
              className={isComplete ? 'checkbox-checked' : ''}
            >
              {isComplete && (
                <CheckOutlined style={styles.checkIcon} />
              )}
              {isActive && !isComplete && (
                <LoadingOutlined style={styles.spinnerIcon} spin />
              )}
            </div>
            <span
              style={{
                ...styles.itemText,
                ...(isComplete ? styles.itemTextChecked : {}),
                ...(isActive ? styles.itemTextActive : {}),
              }}
            >
              {step}
            </span>
          </div>
        );
      })}

      {/* Footer with progress percentage and ETA */}
      {(progress != null || estimatedTimeRemaining != null) && (
        <div style={styles.footer}>
          {progress != null && (
            <span style={styles.progressText}>
              {Math.round(progress)}% complete
            </span>
          )}
          {estimatedTimeRemaining != null && estimatedTimeRemaining > 0 && (
            <span style={styles.eta}>
              ~{estimatedTimeRemaining}s remaining
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default ChecklistProgress;
