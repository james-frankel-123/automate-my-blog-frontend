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
  const resolvedContent = replaceTweetPlaceholders(
    replaceVideoPlaceholders(
      replaceArticlePlaceholders(content || '', relatedArticles),
      relatedVideos
    ),
    relatedTweets
  );

  return (
    <HTMLPreview
      content={resolvedContent}
      relatedArticles={relatedArticles}
      relatedVideos={relatedVideos}
      forceMarkdown={true}
      heroImageUrl={heroImageUrl || undefined}
      style={style}
    />
  );
}

export default StreamingPreview;
