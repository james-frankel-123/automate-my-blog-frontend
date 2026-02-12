/**
 * Tab-ready alert: when the user is waiting for something and may have switched tabs,
 * we detect tab visibility and show a small alert in the tab (favicon badge + title prefix)
 * when the thing is ready, so they know to look back.
 *
 * Usage: call notifyTabReady() when any async "wait" completes (auth loaded, analysis done,
 * content generated, etc.). If the tab is currently hidden, we show the alert; when the user
 * returns to the tab, we clear it.
 */

const ALERT_TITLE_PREFIX = '\u2022 '; // bullet "•"
const BADGE_COLOR = '#6366F1'; // theme primary
const BADGE_DOT_COLOR = '#ffffff';

let baseTitle = '';
let baseFaviconHref = '';
let faviconLink = null;
let alertActive = false;

function captureDefaults() {
  if (baseTitle) return;
  baseTitle = typeof document !== 'undefined' ? document.title : 'Automate My Blog';
  if (typeof document === 'undefined') return;
  faviconLink = document.querySelector('link[rel="icon"]');
  if (faviconLink) {
    baseFaviconHref = faviconLink.getAttribute('href') || faviconLink.href || '';
  }
}

/**
 * Draw a simple favicon with a small "alert" dot in the corner (no need to load original favicon).
 */
function createAlertFaviconDataUrl() {
  const size = 32;
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (!canvas) return '';
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background: primary color (brand)
  ctx.fillStyle = BADGE_COLOR;
  ctx.fillRect(0, 0, size, size);

  // Small white dot (top-right) as "ready" indicator
  ctx.fillStyle = BADGE_DOT_COLOR;
  ctx.beginPath();
  ctx.arc(size - 8, 8, 5, 0, Math.PI * 2);
  ctx.fill();

  try {
    return canvas.toDataURL('image/png');
  } catch {
    return '';
  }
}

function showAlert() {
  captureDefaults();
  if (typeof document === 'undefined') return;
  alertActive = true;
  document.title = ALERT_TITLE_PREFIX + baseTitle;
  const dataUrl = createAlertFaviconDataUrl();
  if (dataUrl && faviconLink) {
    faviconLink.setAttribute('href', dataUrl);
  }
}

function clearAlert() {
  if (!alertActive) return;
  alertActive = false;
  if (typeof document === 'undefined') return;
  document.title = baseTitle;
  if (faviconLink && baseFaviconHref) {
    faviconLink.setAttribute('href', baseFaviconHref);
  }
}

function handleVisibilityChange() {
  if (typeof document === 'undefined') return;
  if (document.visibilityState === 'visible') {
    clearAlert();
  }
}

function ensureVisibilityListener() {
  if (typeof document === 'undefined') return;
  if (document.__tabReadyAlertListener) return;
  document.__tabReadyAlertListener = true;
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

/**
 * Call when something the user was waiting for is ready (e.g. auth loaded, analysis done,
 * content generated). If the tab is in the background, we show a small alert in the icon
 * and title so they know to look.
 */
export function notifyTabReady() {
  captureDefaults();
  ensureVisibilityListener();
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    showAlert();
  }
}
