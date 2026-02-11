/**
 * Video placeholders in streamed content.
 * Backend may emit [VIDEO:0], [VIDEO:1], ... in the post body; we replace them with
 * a token that HTMLPreview turns into an animated loading box or a video card when
 * relatedVideos arrive.
 */

const VIDEO_PLACEHOLDER_REGEX = /\[VIDEO:(\d+)\]/g;

/** Token injected for HTMLPreview to replace with video HTML (loading or card). */
function getVideoPlaceholderToken(index) {
  return `__VIDEO_PLACEHOLDER_${index}__`;
}

/**
 * Replace [VIDEO:0], [VIDEO:1], ... in content with a token for HTMLPreview.
 * HTMLPreview (with relatedVideos prop) replaces the token with animated loading UI or video card.
 * @param {string} content - Raw content that may contain [VIDEO:n] placeholders
 * @param {Array<{ url?: string, videoId?: string, title?: string, channelTitle?: string, thumbnailUrl?: string, viewCount?: number, duration?: string }>} [relatedVideos] - Videos by index
 * @returns {string} Content with placeholders replaced by tokens
 */
function replaceVideoPlaceholders(content, relatedVideos = []) {
  if (!content || typeof content !== 'string') return content || '';
  return content.replace(VIDEO_PLACEHOLDER_REGEX, (_, indexStr) => {
    const index = parseInt(indexStr, 10);
    if (Number.isNaN(index) || index < 0) return '[VIDEO:?]';
    return `\n\n${getVideoPlaceholderToken(index)}\n\n`;
  });
}

export { replaceVideoPlaceholders, getVideoPlaceholderToken, VIDEO_PLACEHOLDER_REGEX };
