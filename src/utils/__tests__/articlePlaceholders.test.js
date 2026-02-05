/**
 * Unit tests for article placeholder replacement.
 */
import { replaceArticlePlaceholders, getArticlePlaceholderToken, ARTICLE_PLACEHOLDER_REGEX } from '../articlePlaceholders';

describe('articlePlaceholders', () => {
  describe('getArticlePlaceholderToken', () => {
    it('returns token for index', () => {
      expect(getArticlePlaceholderToken(0)).toBe('__ARTICLE_PLACEHOLDER_0__');
      expect(getArticlePlaceholderToken(1)).toBe('__ARTICLE_PLACEHOLDER_1__');
    });
  });

  describe('replaceArticlePlaceholders', () => {
    it('returns empty string for empty content', () => {
      expect(replaceArticlePlaceholders('', [])).toBe('');
      expect(replaceArticlePlaceholders(null, [])).toBe('');
    });

    it('leaves content unchanged when no placeholders', () => {
      const content = 'Hello world. No articles here.';
      expect(replaceArticlePlaceholders(content, [])).toBe(content);
    });

    it('replaces [ARTICLE:0] with token', () => {
      const content = 'Intro.\n[ARTICLE:0]\nMore.';
      const out = replaceArticlePlaceholders(content, []);
      expect(out).toContain('__ARTICLE_PLACEHOLDER_0__');
      expect(out).not.toContain('[ARTICLE:0]');
    });

    it('replaces multiple placeholders by index', () => {
      const content = 'A [ARTICLE:0] B [ARTICLE:1] C [ARTICLE:2]';
      const out = replaceArticlePlaceholders(content, []);
      expect(out).toContain('__ARTICLE_PLACEHOLDER_0__');
      expect(out).toContain('__ARTICLE_PLACEHOLDER_1__');
      expect(out).toContain('__ARTICLE_PLACEHOLDER_2__');
      expect(out).not.toContain('[ARTICLE:0]');
      expect(out).not.toContain('[ARTICLE:1]');
      expect(out).not.toContain('[ARTICLE:2]');
    });

    it('wraps token in newlines for block display', () => {
      const content = '[ARTICLE:0]';
      const out = replaceArticlePlaceholders(content, []);
      expect(out).toBe('\n\n__ARTICLE_PLACEHOLDER_0__\n\n');
    });

    it('handles undefined relatedArticles', () => {
      const content = '[ARTICLE:0]';
      expect(replaceArticlePlaceholders(content)).toContain('__ARTICLE_PLACEHOLDER_0__');
      expect(replaceArticlePlaceholders(content, undefined)).toContain('__ARTICLE_PLACEHOLDER_0__');
    });
  });

  describe('ARTICLE_PLACEHOLDER_REGEX', () => {
    it('matches [ARTICLE:n] pattern', () => {
      const content = 'Before [ARTICLE:0] after [ARTICLE:1]';
      const matches = content.match(ARTICLE_PLACEHOLDER_REGEX);
      expect(matches).toEqual(['[ARTICLE:0]', '[ARTICLE:1]']);
    });
  });
});
