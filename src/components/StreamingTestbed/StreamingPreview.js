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
 * Do not append related content to the bottom. The backend should synthesize
 * preloaded articles/tweets/videos into the content at contextually relevant
 * points, emitting [TWEET:n], [ARTICLE:n], [VIDEO:n] placeholders. We only
 * resolve placeholders that exist in the content; we never append blocks.
 */
function applyRelatedContentPlaceholders(content) {
  return content || '';
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
 * @param {Array<{ text: string, href?: string, type?: string, placement?: string }>} [ctas] - CTAs returned with content; used to style matching links in preview
 * @param {Object} [style] - Optional style for the preview container
 * @param {boolean} [generationComplete] - When true, post generation is done (stops hero placeholder animation)
 */
function StreamingPreview({
  content,
  relatedArticles = [],
  relatedVideos = [],
  relatedTweets = [],
  heroImageUrl,
  ctas = [],
  style = {},
  generationComplete = false,
}) {
  const contentWithPlaceholders = applyRelatedContentPlaceholders(content || '');
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
      ctas={ctas}
      forceMarkdown={true}
      heroImageUrl={heroImageUrl || undefined}
      style={style}
      generationComplete={generationComplete}
    />
  );
}

export default StreamingPreview;
