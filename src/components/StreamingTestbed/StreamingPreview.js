/**
 * Canonical streaming preview component (testbed is source of truth).
 * Used by StreamingTestbed and by the main app (e.g. PostsTab) so both render
 * the exact same way: same placeholder pipeline and same HTMLPreview props.
 */
import React from 'react';
import { replaceArticlePlaceholders } from '../../utils/articlePlaceholders';
import { replaceTweetPlaceholders } from '../../utils/tweetPlaceholders';
import { replaceVideoPlaceholders } from '../../utils/videoPlaceholders';
import HTMLPreview from '../HTMLPreview/HTMLPreview';

/**
 * Inject [TWEET:n], [ARTICLE:n], [VIDEO:n] placeholders when backend omits them.
 * If we have related content but the body doesn't include placeholders, append them
 * so the preview can show tweet/article/video cards.
 */
function injectRelatedContentPlaceholders(content, relatedTweets = [], relatedArticles = [], relatedVideos = []) {
  if (!content || typeof content !== 'string') return content || '';
  const hasPlaceholders = /\[(?:TWEET|ARTICLE|VIDEO):\d+\]/.test(content);
  if (hasPlaceholders) return content;

  const parts = [];
  const tweets = Array.isArray(relatedTweets) ? relatedTweets : [];
  const articles = Array.isArray(relatedArticles) ? relatedArticles : [];
  const videos = Array.isArray(relatedVideos) ? relatedVideos : [];

  if (tweets.length > 0) {
    parts.push('\n\n## Related Tweets\n\n');
    parts.push(tweets.slice(0, 3).map((_, i) => `[TWEET:${i}]`).join('\n\n'));
  }
  if (articles.length > 0) {
    parts.push('\n\n## Related Articles\n\n');
    parts.push(articles.slice(0, 3).map((_, i) => `[ARTICLE:${i}]`).join('\n\n'));
  }
  if (videos.length > 0) {
    parts.push('\n\n## Related Videos\n\n');
    parts.push(videos.slice(0, 3).map((_, i) => `[VIDEO:${i}]`).join('\n\n'));
  }

  if (parts.length === 0) return content;
  return content.trimEnd() + parts.join('');
}

/**
 * Renders streamed blog content with article/tweet/video placeholders resolved.
 * Props match testbed usage; do not add app-only props here.
 *
 * @param {string} content - Raw or normalized content (may contain [ARTICLE:n], [VIDEO:n], [TWEET:n])
 * @param {Array} relatedArticles - For __ARTICLE_PLACEHOLDER_n__
 * @param {Array} relatedVideos - For __VIDEO_PLACEHOLDER_n__
 * @param {Array} relatedTweets - For __TWEET_PLACEHOLDER_n__
 * @param {string} [heroImageUrl] - Hero image URL when content has hero slot
 * @param {Object} [style] - Optional style for the preview container
 */
function StreamingPreview({
  content,
  relatedArticles = [],
  relatedVideos = [],
  relatedTweets = [],
  heroImageUrl,
  style = {},
}) {
  const contentWithPlaceholders = injectRelatedContentPlaceholders(
    content || '',
    relatedTweets,
    relatedArticles,
    relatedVideos
  );
  const resolvedContent = replaceTweetPlaceholders(
    replaceVideoPlaceholders(
      replaceArticlePlaceholders(contentWithPlaceholders, relatedArticles),
      relatedVideos
    ),
    relatedTweets
  );

  return (
    <HTMLPreview
      content={resolvedContent}
      relatedArticles={relatedArticles}
      relatedVideos={relatedVideos}
      relatedTweets={relatedTweets}
      forceMarkdown={true}
      heroImageUrl={heroImageUrl || undefined}
      style={style}
    />
  );
}

export default StreamingPreview;
