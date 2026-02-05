/**
 * Article placeholders in streamed content.
 * Backend may emit [ARTICLE:0], [ARTICLE:1], ... in the post body; we replace them with
 * a token that HTMLPreview turns into an animated loading box or an article card when
 * relatedArticles arrive.
 */

const ARTICLE_PLACEHOLDER_REGEX = /\[ARTICLE:(\d+)\]/g;

/** Token injected for HTMLPreview to replace with article HTML (loading or card). */
function getArticlePlaceholderToken(index) {
  return `__ARTICLE_PLACEHOLDER_${index}__`;
}

/**
 * Replace [ARTICLE:0], [ARTICLE:1], ... in content with a token for HTMLPreview.
 * HTMLPreview (with relatedArticles prop) replaces the token with animated loading UI or article card.
 * @param {string} content - Raw content that may contain [ARTICLE:n] placeholders
 * @param {Array<{ url?: string, title?: string, description?: string, sourceName?: string, publishedAt?: string, urlToImage?: string }>} [relatedArticles] - Articles by index
 * @returns {string} Content with placeholders replaced by tokens
 */
function replaceArticlePlaceholders(content, relatedArticles = []) {
  if (!content || typeof content !== 'string') return content || '';
  const articles = Array.isArray(relatedArticles) ? relatedArticles : [];
  return content.replace(ARTICLE_PLACEHOLDER_REGEX, (_, indexStr) => {
    const index = parseInt(indexStr, 10);
    if (Number.isNaN(index) || index < 0) return '[ARTICLE:?]';
    return `\n\n${getArticlePlaceholderToken(index)}\n\n`;
  });
}

export { replaceArticlePlaceholders, getArticlePlaceholderToken, ARTICLE_PLACEHOLDER_REGEX };
