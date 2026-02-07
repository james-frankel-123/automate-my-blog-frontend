/**
 * Unit tests for tweet placeholder replacement.
 */
import { replaceTweetPlaceholders, getTweetText } from '../tweetPlaceholders';

describe('tweetPlaceholders', () => {
  describe('getTweetText', () => {
    it('returns string as-is', () => {
      expect(getTweetText('Hello')).toBe('Hello');
    });
    it('returns text from object', () => {
      expect(getTweetText({ text: 'Tweet text' })).toBe('Tweet text');
    });
    it('returns content from object when no text', () => {
      expect(getTweetText({ content: 'Content' })).toBe('Content');
    });
    it('returns empty string for null/undefined', () => {
      expect(getTweetText(null)).toBe('');
      expect(getTweetText(undefined)).toBe('');
    });
  });

  describe('replaceTweetPlaceholders', () => {
    it('returns empty string for empty content', () => {
      expect(replaceTweetPlaceholders('', [])).toBe('');
      expect(replaceTweetPlaceholders(null, [])).toBe('');
    });

    it('leaves content unchanged when no placeholders', () => {
      const content = 'Hello world. No tweets here.';
      expect(replaceTweetPlaceholders(content, [])).toBe(content);
    });

    it('replaces [TWEET:0] with token for HTMLPreview to render as tweet card', () => {
      const content = 'Intro.\n[TWEET:0]\nMore.';
      const tweets = [{ text: 'First tweet' }];
      const out = replaceTweetPlaceholders(content, tweets);
      expect(out).toContain('__TWEET_PLACEHOLDER_0__');
      expect(out).not.toContain('[TWEET:0]');
    });

    it('replaces [TWEET:0] with token when no tweets (HTMLPreview shows loading)', () => {
      const content = 'Intro.\n[TWEET:0]\nMore.';
      const out = replaceTweetPlaceholders(content, []);
      expect(out).toContain('__TWEET_PLACEHOLDER_0__');
      expect(out).not.toContain('[TWEET:0]');
    });

    it('replaces multiple placeholders by index with tokens', () => {
      const content = 'A [TWEET:0] B [TWEET:1] C [TWEET:2]';
      const tweets = [{ text: 'One' }, { text: 'Two' }, { text: 'Three' }];
      const out = replaceTweetPlaceholders(content, tweets);
      expect(out).toContain('__TWEET_PLACEHOLDER_0__');
      expect(out).toContain('__TWEET_PLACEHOLDER_1__');
      expect(out).toContain('__TWEET_PLACEHOLDER_2__');
      expect(out).not.toContain('[TWEET:0]');
      expect(out).not.toContain('[TWEET:1]');
      expect(out).not.toContain('[TWEET:2]');
    });

    it('replaces [TWEET:1] with token when only one tweet provided', () => {
      const content = 'A [TWEET:0] B [TWEET:1]';
      const tweets = [{ text: 'Only' }];
      const out = replaceTweetPlaceholders(content, tweets);
      expect(out).toContain('__TWEET_PLACEHOLDER_0__');
      expect(out).toContain('__TWEET_PLACEHOLDER_1__');
    });

    it('outputs token for tweet object with content field', () => {
      const content = '[TWEET:0]';
      const tweets = [{ content: 'From content field' }];
      const out = replaceTweetPlaceholders(content, tweets);
      expect(out).toContain('__TWEET_PLACEHOLDER_0__');
    });

    it('outputs token for string tweet in array', () => {
      const content = '[TWEET:0]';
      const tweets = ['Plain string tweet'];
      const out = replaceTweetPlaceholders(content, tweets);
      expect(out).toContain('__TWEET_PLACEHOLDER_0__');
    });

    it('handles undefined relatedTweets (still outputs token)', () => {
      const content = '[TWEET:0]';
      expect(replaceTweetPlaceholders(content)).toContain('__TWEET_PLACEHOLDER_0__');
      expect(replaceTweetPlaceholders(content, undefined)).toContain('__TWEET_PLACEHOLDER_0__');
    });
  });
});
