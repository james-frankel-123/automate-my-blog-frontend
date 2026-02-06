/**
 * Tests for EnhancedContentAPI - preloaded content (tweets, articles, videos) in job payload
 */
import { EnhancedContentAPI } from '../enhancedContentAPI';

describe('EnhancedContentAPI', () => {
  let api;

  beforeEach(() => {
    api = new EnhancedContentAPI();
  });

  describe('_buildContentGenerationPayload', () => {
    const baseTopic = { id: 't1', title: 'Test Topic' };
    const baseAnalysis = { businessName: 'Test Co' };
    const baseOptions = {
      organizationId: 'org-1',
      includeVisuals: true,
    };

    it('includes preloadedTweets, preloadedArticles, preloadedVideos in options', () => {
      const tweets = [{ text: 'Tweet 1' }];
      const articles = [{ title: 'Article 1', url: 'https://example.com/1' }];
      const videos = [{ videoId: 'abc', title: 'Video 1' }];

      const payload = api._buildContentGenerationPayload(baseTopic, baseAnalysis, null, {
        ...baseOptions,
        preloadedTweets: tweets,
        preloadedArticles: articles,
        preloadedVideos: videos,
      });

      expect(payload.options.preloadedTweets).toEqual(tweets);
      expect(payload.options.preloadedArticles).toEqual(articles);
      expect(payload.options.preloadedVideos).toEqual(videos);
    });

    it('uses empty arrays when preloaded data is omitted', () => {
      const payload = api._buildContentGenerationPayload(baseTopic, baseAnalysis, null, baseOptions);

      expect(payload.options.preloadedTweets).toEqual([]);
      expect(payload.options.preloadedArticles).toEqual([]);
      expect(payload.options.preloadedVideos).toEqual([]);
    });

    it('falls back to tweets when preloadedTweets is not provided', () => {
      const tweets = [{ text: 'Legacy tweet' }];
      const payload = api._buildContentGenerationPayload(baseTopic, baseAnalysis, null, {
        ...baseOptions,
        tweets,
      });

      expect(payload.options.preloadedTweets).toEqual(tweets);
      expect(payload.tweets).toEqual(tweets);
    });

    it('prefers preloadedTweets over tweets', () => {
      const preloaded = [{ text: 'Preloaded' }];
      const tweets = [{ text: 'Legacy' }];
      const payload = api._buildContentGenerationPayload(baseTopic, baseAnalysis, null, {
        ...baseOptions,
        preloadedTweets: preloaded,
        tweets,
      });

      expect(payload.options.preloadedTweets).toEqual(preloaded);
      expect(payload.tweets).toEqual(preloaded);
    });

    it('handles non-array preloaded data as empty arrays', () => {
      const payload = api._buildContentGenerationPayload(baseTopic, baseAnalysis, null, {
        ...baseOptions,
        preloadedTweets: null,
        preloadedArticles: undefined,
        preloadedVideos: 'invalid',
      });

      expect(payload.options.preloadedTweets).toEqual([]);
      expect(payload.options.preloadedArticles).toEqual([]);
      expect(payload.options.preloadedVideos).toEqual([]);
    });
  });
});
