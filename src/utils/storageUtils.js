/**
 * Storage utilities for workflow and test mode.
 * Use ?test=true in the URL to disable local browser storage for repeatable workflow testing.
 */

/**
 * Returns true when the app is in test mode (?test=true).
 * In test mode, workflow state is not read from or written to localStorage,
 * so each load starts with a clean workflow.
 */
export function isTestMode() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('test') === 'true';
}
