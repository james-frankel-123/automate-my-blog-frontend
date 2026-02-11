/**
 * Placeholder image/block styles: varied colors and animation stagger so each
 * placeholder on the page looks different. Uses deterministic math from a seed.
 */

/** Golden ratio–style spread for hue (degrees). */
const HUE_STEP = 137.5;

/**
 * @param {number} seed - Integer seed (e.g. card index)
 * @returns {{ hue: number, durationMs: number, delayMs: number }}
 */
export function getPlaceholderVariation(seed = 0) {
  const n = Math.max(0, Number(seed) || 0);
  const hue = Math.round((n * HUE_STEP) % 360);
  const durationMs = 1600 + (n % 7) * 280;
  const delayMs = (n % 5) * 180;
  return { hue, durationMs, delayMs };
}

/**
 * Gradient and animation for a placeholder div (cards, hero, etc.).
 * Uses hue for a soft gradient; duration and delay stagger the animation.
 *
 * @param {number} seed - Integer seed (e.g. card index)
 * @param {Object} [opts] - Optional: { saturation, lightnessStart, lightnessEnd }
 * @returns {{ background: string, backgroundSize: string, animation: string, animationDelay: string }}
 */
export function getPlaceholderStyle(seed = 0, opts = {}) {
  const { hue, durationMs, delayMs } = getPlaceholderVariation(seed);
  const sat = opts.saturation != null ? opts.saturation : 14;
  const lightStart = opts.lightnessStart != null ? opts.lightnessStart : 94;
  const lightEnd = opts.lightnessEnd != null ? opts.lightnessEnd : 88;
  const background = `linear-gradient(110deg, hsl(${hue}, ${sat}%, ${lightStart}%) 25%, hsl(${hue + 20}, ${sat}%, ${lightEnd}%) 37%, hsl(${hue}, ${sat}%, ${lightStart}%) 63%)`;
  const durationSec = (durationMs / 1000).toFixed(2);
  const delaySec = (delayMs / 1000).toFixed(2);
  return {
    background,
    backgroundSize: '200% 100%',
    animation: `placeholder-shimmer ${durationSec}s ease-in-out ${delaySec}s infinite`,
    animationDelay: `${delaySec}s`,
  };
}

/**
 * CSS custom properties and animation values for nth-of-type placeholders (e.g. markdown).
 * Index 0-based; use for :nth-of-type(1), :nth-of-type(2), ...
 *
 * @param {number} index - 0-based index (nth-of-type = index + 1)
 * @returns {{ hue: number, durationSec: string, delaySec: string }}
 */
export function getPlaceholderNthVariation(index = 0) {
  const { hue, durationMs, delayMs } = getPlaceholderVariation(index);
  return {
    hue,
    durationSec: `${(durationMs / 1000).toFixed(2)}s`,
    delaySec: `${(delayMs / 1000).toFixed(2)}s`,
  };
}
