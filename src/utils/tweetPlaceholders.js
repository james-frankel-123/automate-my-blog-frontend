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
 * Replace [TWEET:0], [TWEET:1], ... in content with blockquote markdown.
 * If relatedTweets[n] exists, use that tweet's text; otherwise use "Loading tweet…".
 * @param {string} content - Raw content that may contain [TWEET:n] placeholders
 * @param {Array<string|{ text?: string, content?: string }>} [relatedTweets] - Tweets by index
 * @returns {string} Content with placeholders replaced
 */
function replaceTweetPlaceholders(content, relatedTweets = []) {
  if (!content || typeof content !== 'string') return content || '';
  const tweets = Array.isArray(relatedTweets) ? relatedTweets : [];
  return content.replace(TWEET_PLACEHOLDER_REGEX, (_, indexStr) => {
    const index = parseInt(indexStr, 10);
    if (Number.isNaN(index) || index < 0) return '[TWEET:?]';
    const tweet = tweets[index];
    const text = tweet ? getTweetText(tweet) : '';
    if (text) {
      return `\n> **Related:** ${text.replace(/\n/g, ' ')}\n\n`;
    }
    return '\n> Loading tweet…\n\n';
  });
}

export { replaceTweetPlaceholders, getTweetText, TWEET_PLACEHOLDER_REGEX };
