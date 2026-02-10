/**
 * Tweet placeholders in streamed content.
 * Backend may emit [TWEET:0], [TWEET:1], ... in the post body; we replace them with
 * rendered tweet content when relatedTweets arrive (or show "Loading tweet…" until then).
 */

const TWEET_PLACEHOLDER_REGEX = /\[TWEET:(\d+)\]/g;

/**
 * Get display text for a single tweet (string or { text, content }).
 * @param {string|{ text?: string, content?: string }} t
 * @returns {string}
 */
function getTweetText(t) {
  if (typeof t === 'string') return t;
  return t?.text ?? t?.content ?? '';
}

/**
 * Replace [TWEET:0], [TWEET:1], ... in content with a token for HTMLPreview.
 * HTMLPreview replaces __TWEET_PLACEHOLDER_n__ with a tweet-style card or loading UI.
 * @param {string} content - Raw content that may contain [TWEET:n] placeholders
 * @param {Array<string|{ text?: string, content?: string }>} [relatedTweets] - Tweets by index
 * @returns {string} Content with placeholders replaced by __TWEET_PLACEHOLDER_n__ tokens
 */
function replaceTweetPlaceholders(content, _relatedTweets = []) {
  if (!content || typeof content !== 'string') return content || '';
  return content.replace(TWEET_PLACEHOLDER_REGEX, (_, indexStr) => {
    const index = parseInt(indexStr, 10);
    if (Number.isNaN(index) || index < 0) return '[TWEET:?]';
    return `\n\n__TWEET_PLACEHOLDER_${index}__\n\n`;
  });
}

export { replaceTweetPlaceholders, getTweetText, TWEET_PLACEHOLDER_REGEX };
