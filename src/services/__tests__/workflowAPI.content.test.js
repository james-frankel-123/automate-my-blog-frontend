/**
 * Tests for workflowAPI contentAPI - preloaded data passed to blog stream and generation
 */
import autoBlogAPI from '../api';
import { contentAPI } from '../workflowAPI';

jest.mock('../api');

describe('workflowAPI.contentAPI', () => {
  const topic = { id: 't1', title: 'Test Topic' };
  const analysisData = { businessName: 'Test Co' };
  const preloadedTweets = [{ text: 'Tweet 1' }];
  const preloadedArticles = [{ title: 'Article 1', url: 'https://example.com/1' }];
  const preloadedVideos = [{ videoId: 'vid1', title: 'Video 1' }];

  beforeEach(() => {
    jest.clearAllMocks();
    autoBlogAPI.generateBlogStream.mockResolvedValue({ connectionId: 'conn-1' });
  });

  describe('startBlogStream', () => {
    it('passes options with preloadedTweets, preloadedArticles, preloadedVideos to generateBlogStream', async () => {
      await contentAPI.startBlogStream(topic, analysisData, null, {}, {
        preloadedTweets,
        preloadedArticles,
        preloadedVideos,
      });

      expect(autoBlogAPI.generateBlogStream).toHaveBeenCalledWith(
        expect.objectContaining({
          topic,
          businessInfo: analysisData,
          options: expect.objectContaining({
            preloadedTweets,
            preloadedArticles,
            preloadedVideos,
          }),
        })
      );
    });

    it('passes empty arrays when preloaded data is omitted', async () => {
      await contentAPI.startBlogStream(topic, analysisData, null, {}, {});

      expect(autoBlogAPI.generateBlogStream).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            preloadedTweets: [],
            preloadedArticles: [],
            preloadedVideos: [],
          }),
        })
      );
    });

    it('supports legacy prefetchedTweets', async () => {
      await contentAPI.startBlogStream(topic, analysisData, null, {}, {
        prefetchedTweets: preloadedTweets,
      });

      expect(autoBlogAPI.generateBlogStream).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            preloadedTweets,
          }),
        })
      );
    });
  });
});
