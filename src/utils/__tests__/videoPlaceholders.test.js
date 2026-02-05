/**
 * Unit tests for video placeholder replacement.
 */
import { replaceVideoPlaceholders, getVideoPlaceholderToken, VIDEO_PLACEHOLDER_REGEX } from '../videoPlaceholders';

describe('videoPlaceholders', () => {
  describe('getVideoPlaceholderToken', () => {
    it('returns token for index', () => {
      expect(getVideoPlaceholderToken(0)).toBe('__VIDEO_PLACEHOLDER_0__');
      expect(getVideoPlaceholderToken(1)).toBe('__VIDEO_PLACEHOLDER_1__');
    });
  });

  describe('replaceVideoPlaceholders', () => {
    it('returns empty string for empty content', () => {
      expect(replaceVideoPlaceholders('', [])).toBe('');
      expect(replaceVideoPlaceholders(null, [])).toBe('');
    });

    it('leaves content unchanged when no placeholders', () => {
      const content = 'Hello world. No videos here.';
      expect(replaceVideoPlaceholders(content, [])).toBe(content);
    });

    it('replaces [VIDEO:0] with token', () => {
      const content = 'Intro.\n[VIDEO:0]\nMore.';
      const out = replaceVideoPlaceholders(content, []);
      expect(out).toContain('__VIDEO_PLACEHOLDER_0__');
      expect(out).not.toContain('[VIDEO:0]');
    });

    it('replaces multiple placeholders by index', () => {
      const content = 'A [VIDEO:0] B [VIDEO:1] C [VIDEO:2]';
      const out = replaceVideoPlaceholders(content, []);
      expect(out).toContain('__VIDEO_PLACEHOLDER_0__');
      expect(out).toContain('__VIDEO_PLACEHOLDER_1__');
      expect(out).toContain('__VIDEO_PLACEHOLDER_2__');
      expect(out).not.toContain('[VIDEO:0]');
      expect(out).not.toContain('[VIDEO:1]');
      expect(out).not.toContain('[VIDEO:2]');
    });

    it('wraps token in newlines for block display', () => {
      const content = '[VIDEO:0]';
      const out = replaceVideoPlaceholders(content, []);
      expect(out).toBe('\n\n__VIDEO_PLACEHOLDER_0__\n\n');
    });

    it('handles undefined relatedVideos', () => {
      const content = '[VIDEO:0]';
      expect(replaceVideoPlaceholders(content)).toContain('__VIDEO_PLACEHOLDER_0__');
      expect(replaceVideoPlaceholders(content, undefined)).toContain('__VIDEO_PLACEHOLDER_0__');
    });

    it('does not match non-numeric placeholder (regex is \\d+)', () => {
      const content = 'Text [VIDEO:abc] more';
      const out = replaceVideoPlaceholders(content, []);
      expect(out).toBe(content);
    });
  });

  describe('VIDEO_PLACEHOLDER_REGEX', () => {
    it('matches [VIDEO:n] pattern', () => {
      const content = 'Before [VIDEO:0] after [VIDEO:1]';
      const matches = content.match(VIDEO_PLACEHOLDER_REGEX);
      expect(matches).toEqual(['[VIDEO:0]', '[VIDEO:1]']);
    });
  });
});
