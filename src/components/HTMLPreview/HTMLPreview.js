import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { typography } from '../DesignSystem/tokens';

function escapeAttr(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const HERO_IMAGE_SENTINEL = '__HERO_IMAGE__';

/** Minimum time (ms) to show the shimmer placeholder so users see the loading state. */
const HERO_PLACEHOLDER_MIN_MS = 2500;

/**
 * Hero image with animated placeholder until loaded, then swaps in the image.
 * Keeps the placeholder visible for at least HERO_PLACEHOLDER_MIN_MS so the shimmer is visible
 * even when the image loads quickly (e.g. from cache).
 * Uses inline styles + a scoped style tag so the placeholder is always visible (no dependency on parent styled-jsx).
 */
function HeroImage({ src, alt, paragraphSpacing = 16 }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinTimeElapsed(true), HERO_PLACEHOLDER_MIN_MS);
    return () => clearTimeout(t);
  }, []);

  const showImage = imageLoaded && minTimeElapsed;

  const wrapperStyle = {
    position: 'relative',
    minHeight: 240,
    margin: `${paragraphSpacing}px 0`,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'var(--color-background-container)'
  };

  const placeholderStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, var(--color-background-container) 0%, var(--color-background-alt) 50%, var(--color-background-container) 100%)',
    backgroundSize: '400% 400%',
    animation: 'hero-placeholder-gentle 6s ease-in-out infinite',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const messageStyle = {
    color: 'var(--color-text-tertiary)',
    fontSize: 15,
    fontWeight: 500,
    letterSpacing: '0.02em'
  };

  return (
    <div className="hero-image-wrapper" style={wrapperStyle}>
      <style dangerouslySetInnerHTML={{
        __html: `@keyframes hero-placeholder-gentle { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }`
      }} />
      {!showImage && (
        <div
          className="hero-image-placeholder"
          aria-hidden="true"
          role="presentation"
          style={placeholderStyle}
        >
          <span style={messageStyle}>Waiting for image…</span>
        </div>
      )}
      <img
        src={src}
        alt={alt || 'Hero image'}
        loading="lazy"
        className="hero-image"
        style={{
          width: '100%',
          maxWidth: '100%',
          height: 'auto',
          borderRadius: '8px',
          margin: 0,
          opacity: showImage ? 1 : 0,
          position: showImage ? 'relative' : 'absolute',
          top: showImage ? undefined : 0,
          left: showImage ? undefined : 0,
          transition: 'opacity 0.25s ease-in',
          pointerEvents: showImage ? undefined : 'none'
        }}
        onLoad={() => setImageLoaded(true)}
      />
    </div>
  );
}

function isHeroImagePlaceholder(alt) {
  return typeof alt === 'string' && /^IMAGE:hero_image:/i.test(alt.trim());
}

/**
 * Convert markdown to HTML
 * @param {string} markdown
 * @param {{ heroImageUrl?: string }} [options] - When set, ![IMAGE:hero_image:...] is rendered as <img src={heroImageUrl} />
 */
const markdownToHTML = (markdown, options = {}) => {
  if (!markdown || typeof markdown !== 'string') return '';
  const { heroImageUrl } = options;
  let html = markdown;

  // Headers: only match a single line of heading text (up to next newline). Use [^\n]{1,max}
  // so that when streamed content has no newlines, we don't turn the entire blob into one <h1>.
  const maxHeadingLen = 250;
  const headingCap = `[^\\n]{1,${maxHeadingLen}}`;
  html = html.replace(new RegExp(`^###### (${headingCap})$`, 'gim'), '<h6>$1</h6>');
  html = html.replace(new RegExp(`^##### (${headingCap})$`, 'gim'), '<h5>$1</h5>');
  html = html.replace(new RegExp(`^#### (${headingCap})$`, 'gim'), '<h4>$1</h4>');
  html = html.replace(new RegExp(`^### (${headingCap})$`, 'gim'), '<h3>$1</h3>');
  html = html.replace(new RegExp(`^## (${headingCap})$`, 'gim'), '<h2>$1</h2>');
  html = html.replace(new RegExp(`^# (${headingCap})$`, 'gim'), '<h1>$1</h1>');

  // Blockquote (single line only so streamed run-on doesn't swallow whole content)
  html = html.replace(/^>\s?([^\n]{0,500})$/gim, '<blockquote>$1</blockquote>');

  // Bold (non-greedy for streaming: incomplete ** stays as text)
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

  // Italic (non-greedy)
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Normalize hero placeholder when backend streams [IMAGE:hero_image:...] without leading !
  // (Frontend expects markdown image syntax ![IMAGE:hero_image:...]; without ! no placeholder/image is shown.)
  html = html.replace(/(?<!!)\[(IMAGE:hero_image:[^\]]*)\](?!\()/gim, '![$1]');

  // Images ![alt](url) — before links so ![...](...) is not treated as link; placeholders get span (or hero sentinel if URL provided)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, (_, alt, url) => {
    const u = url.trim();
    const isPlaceholder = /^[a-z]+:[^:]+:?/i.test(u) || !/^https?:\/\//i.test(u);
    const safeAlt = String(alt || 'Image').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&/g, '&amp;');
    if (isPlaceholder && isHeroImagePlaceholder(alt) && heroImageUrl) {
      return HERO_IMAGE_SENTINEL;
    }
    if (isPlaceholder) return `<span class="markdown-image-placeholder" title="${escapeAttr(alt || u)}">[${safeAlt}]</span>`;
    return `<img src="${escapeAttr(u)}" alt="${escapeAttr(alt)}" loading="lazy" />`;
  });

  // Standalone image placeholder with no URL: ![IMAGE:hero_image:description] → sentinel if heroImageUrl, else placeholder span
  html = html.replace(/!\[([^\]]*)\](?!\()/gim, (_, alt) => {
    const safeAlt = String(alt || 'Image').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&/g, '&amp;');
    if (isHeroImagePlaceholder(alt) && heroImageUrl) {
      return HERO_IMAGE_SENTINEL;
    }
    return `<span class="markdown-image-placeholder" title="${escapeAttr(alt)}">[${safeAlt}]</span>`;
  });

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Code blocks (non-greedy; partial ``` during stream stays as text)
  html = html.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');

  // Inline code
  html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

  // Lists (unordered; single line per item so streamed run-on doesn't merge)
  html = html.replace(/^\* ([^\n]*)$/gim, '<li>$1</li>');
  html = html.replace(/^- ([^\n]*)$/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Paragraphs (split by double newline)
  const lines = html.split('\n');
  let inList = false;
  let inCodeBlock = false;
  let result = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Handle code blocks
    if (line.includes('<pre><code>')) {
      inCodeBlock = true;
    }
    if (line.includes('</code></pre>')) {
      inCodeBlock = false;
    }

    // Handle lists
    if (line.includes('<li>') && !inList) {
      inList = true;
    }
    if (inList && !line.includes('<li>') && line.trim() !== '') {
      result.push('</ul>');
      inList = false;
    }

    // Wrap non-empty, non-special lines in paragraphs
    if (
      !inCodeBlock &&
      !inList &&
      line.trim() !== '' &&
      !line.startsWith('<h') &&
      !line.startsWith('<ul') &&
      !line.startsWith('<li') &&
      !line.startsWith('<pre') &&
      !line.startsWith('<blockquote') &&
      !line.includes('</ul>') &&
      !line.includes('</pre>')
    ) {
      line = '<p>' + line + '</p>';
    }

    result.push(line);
  }

  if (inList) {
    result.push('</ul>');
  }

  return result.join('\n');
};

const ARTICLE_PLACEHOLDER_TOKEN_REGEX = /__ARTICLE_PLACEHOLDER_(\d+)__/g;

const TWEET_PLACEHOLDER_TOKEN_REGEX = /__TWEET_PLACEHOLDER_(\d+)__/g;

/**
 * Get display text for a tweet (string or { text, content }).
 * @param {string|{ text?: string, content?: string }} t
 * @returns {string}
 */
function getTweetDisplayText(t) {
  if (typeof t === 'string') return t;
  return t?.text ?? t?.content ?? '';
}

/**
 * Build HTML for a tweet placeholder: tweet-style card or loading state.
 * @param {number} index - Placeholder index
 * @param {Array<string|{ text?: string, content?: string }>} [relatedTweets]
 * @returns {string} Safe HTML string
 */
function getTweetPlaceholderHtml(index, relatedTweets = []) {
  const tweets = Array.isArray(relatedTweets) ? relatedTweets : [];
  const tweet = tweets[index];
  const text = tweet ? getTweetDisplayText(tweet) : '';
  const escaped = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  if (text) {
    const tweetUrl = typeof tweet === 'object' && tweet?.url && /^https?:\/\//i.test(tweet.url)
      ? escapeAttr(tweet.url)
      : '';
    const linkWrap = tweetUrl
      ? `<a href="${tweetUrl}" target="_blank" rel="noopener noreferrer" class="markdown-tweet-card-link">View on X</a>`
      : '';
    return (
      '<div class="markdown-tweet-card" role="article" aria-label="Embedded post from X">' +
      '<div class="markdown-tweet-card-header">' +
      '<span class="markdown-tweet-card-avatar" aria-hidden="true">𝕏</span>' +
      '<span class="markdown-tweet-card-badge">Post from X</span>' +
      '</div>' +
      '<div class="markdown-tweet-card-body">' + escaped(text) + '</div>' +
      (linkWrap ? '<div class="markdown-tweet-card-footer">' + linkWrap + '</div>' : '') +
      '</div>'
    );
  }
  return (
    '<div class="markdown-tweet-placeholder" title="Loading tweet…">' +
    '<span class="markdown-tweet-placeholder-icon" aria-hidden="true">𝕏</span>' +
    '<span class="markdown-tweet-placeholder-text">Loading tweet…</span>' +
    '</div>'
  );
}

/**
 * Build HTML for an article placeholder slot: animated loading box or article card.
 * @param {number} index - Placeholder index
 * @param {Array<{ url?: string, title?: string, description?: string, sourceName?: string, publishedAt?: string, urlToImage?: string }>} relatedArticles
 * @returns {string} Safe HTML string
 */
function getArticlePlaceholderHtml(index, relatedArticles = []) {
  const articles = Array.isArray(relatedArticles) ? relatedArticles : [];
  const article = articles[index];
  const safeTitle = (s) => escapeAttr(String(s ?? '').slice(0, 200));
  const safeUrl = (u) => (/^https?:\/\//i.test(String(u ?? '')) ? escapeAttr(u) : '');
  if (article && (article.url || article.title)) {
    const url = article.url || '#';
    const title = safeTitle(article.title) || 'Article';
    const source = safeTitle(article.sourceName);
    const meta = [source, article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : ''].filter(Boolean).join(' · ');
    const img = article.urlToImage && /^https?:\/\//i.test(article.urlToImage) ? escapeAttr(article.urlToImage) : '';
    const descLen = 120;
    const desc = article.description ? escapeAttr(String(article.description).slice(0, descLen)) + (String(article.description).length > descLen ? '…' : '') : '';
    const thumbBlock = img
      ? `<a href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer" class="markdown-article-card-thumb-wrap"><img src="${img}" alt="" class="markdown-article-card-thumb" loading="lazy" /></a>`
      : '<span class="markdown-article-card-thumb-wrap"><span class="markdown-article-card-thumb-placeholder" aria-hidden="true">📰</span></span>';
    return (
      '<div class="markdown-article-card">' +
      thumbBlock +
      '<div class="markdown-article-card-body">' +
      `<a href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer" class="markdown-article-card-title">${title}</a>` +
      (meta ? `<span class="markdown-article-card-meta">${escapeAttr(meta)}</span>` : '') +
      (desc ? `<span class="markdown-article-card-desc">${desc}</span>` : '') +
      '</div></div>'
    );
  }
  return (
    '<div class="markdown-article-placeholder" title="Loading article…">' +
    '<span class="markdown-article-placeholder-icon" aria-hidden="true">📰</span>' +
    '<span class="markdown-article-placeholder-text">Loading article…</span>' +
    '</div>'
  );
}

const VIDEO_PLACEHOLDER_TOKEN_REGEX = /__VIDEO_PLACEHOLDER_(\d+)__/g;

/**
 * Build HTML for a video placeholder slot: animated loading box or inline YouTube embed.
 * Videos embed and play inline (iframe) rather than linking to a new tab.
 * @param {number} index - Placeholder index
 * @param {Array<{ url?: string, videoId?: string, title?: string, channelTitle?: string, thumbnailUrl?: string, viewCount?: number, duration?: string }>} relatedVideos
 * @returns {string} Safe HTML string
 */
function getVideoPlaceholderHtml(index, relatedVideos = []) {
  const videos = Array.isArray(relatedVideos) ? relatedVideos : [];
  const video = videos[index];
  const safeTitle = (s) => escapeAttr(String(s ?? '').slice(0, 200));
  if (video && (video.url || video.videoId)) {
    const videoUrl = video.url || (video.videoId ? `https://www.youtube.com/watch?v=${video.videoId}` : '');
    const safeUrl = videoUrl && /^https?:\/\//i.test(videoUrl) ? escapeAttr(videoUrl) : '';
    const title = safeTitle(video.title) || 'Video';
    const channel = safeTitle(video.channelTitle);
    const meta = [channel, video.viewCount != null ? `${Number(video.viewCount).toLocaleString()} views` : '', video.duration].filter(Boolean).join(' · ');
    const thumbImg = video.thumbnailUrl && /^https?:\/\//i.test(video.thumbnailUrl)
      ? `<img src="${escapeAttr(video.thumbnailUrl)}" alt="" class="markdown-video-card-thumb" loading="lazy" />`
      : '<span class="markdown-video-card-thumb-placeholder" aria-hidden="true">▶</span>';
    const playIcon = '<span class="markdown-video-card-play" aria-hidden="true">▶</span>';
    const thumbBlock = safeUrl
      ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="markdown-video-card-thumb-wrap">${thumbImg}${playIcon}</a>`
      : `<span class="markdown-video-card-thumb-wrap">${thumbImg}${playIcon}</span>`;
    return (
      '<div class="markdown-video-card">' +
      thumbBlock +
      '<div class="markdown-video-card-body">' +
      (safeUrl
        ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="markdown-video-card-title">${title}</a>`
        : `<span class="markdown-video-card-title">${title}</span>`) +
      (meta ? `<span class="markdown-video-card-meta">${escapeAttr(meta)}</span>` : '') +
      '</div></div>'
    );
  }
  return (
    '<div class="markdown-video-placeholder" title="Loading video…">' +
    '<span class="markdown-video-placeholder-icon" aria-hidden="true">▶</span>' +
    '<span class="markdown-video-placeholder-text">Loading video…</span>' +
    '</div>'
  );
}

/**
 * HTML Preview Component
 * Renders HTML content with proper styling and typography settings.
 * When forceMarkdown is true (e.g. streamed blog content), always parses as Markdown.
 * Otherwise converts markdown to HTML only when content does not look like pre-rendered HTML.
 * Optional relatedArticles: used to replace __ARTICLE_PLACEHOLDER_n__ tokens with article cards or loading UI.
 * Optional relatedVideos: used to replace __VIDEO_PLACEHOLDER_n__ tokens with video cards or loading UI.
 * Optional relatedTweets: used to replace __TWEET_PLACEHOLDER_n__ tokens with tweet-style cards or loading UI.
 */
const HTMLPreview = ({ content, typographySettings = {}, style = {}, forceMarkdown = false, heroImageUrl, relatedArticles, relatedVideos, relatedTweets }) => {
  if (!content || !content.trim()) {
    return (
      <div style={{
        color: 'var(--color-text-tertiary)',
        fontStyle: 'italic',
        padding: '20px',
        textAlign: 'center',
        ...style
      }}>
        No content to preview
      </div>
    );
  }

  // Streamed blog content: always treat as Markdown. Otherwise skip conversion only when content looks like HTML.
  const looksLikeHtml = !forceMarkdown && /<\s*[a-zA-Z][a-zA-Z0-9-]*[\s>/]/.test(content);
  let rawHtml = looksLikeHtml ? content : markdownToHTML(content, { heroImageUrl });

  // Replace article placeholder tokens with loading box or article card HTML
  if (rawHtml.includes('__ARTICLE_PLACEHOLDER_')) {
    rawHtml = rawHtml.replace(ARTICLE_PLACEHOLDER_TOKEN_REGEX, (_, indexStr) => {
      const index = parseInt(indexStr, 10);
      return Number.isNaN(index) || index < 0 ? '' : getArticlePlaceholderHtml(index, relatedArticles);
    });
  }
  // Replace video placeholder tokens with loading box or video card HTML
  if (rawHtml.includes('__VIDEO_PLACEHOLDER_')) {
    rawHtml = rawHtml.replace(VIDEO_PLACEHOLDER_TOKEN_REGEX, (_, indexStr) => {
      const index = parseInt(indexStr, 10);
      return Number.isNaN(index) || index < 0 ? '' : getVideoPlaceholderHtml(index, relatedVideos);
    });
  }
  // Replace tweet placeholder tokens with tweet-style card or loading UI
  if (rawHtml.includes('__TWEET_PLACEHOLDER_')) {
    rawHtml = rawHtml.replace(TWEET_PLACEHOLDER_TOKEN_REGEX, (_, indexStr) => {
      const index = parseInt(indexStr, 10);
      return Number.isNaN(index) || index < 0 ? '' : getTweetPlaceholderHtml(index, relatedTweets);
    });
  }

  // Sanitize HTML to prevent XSS attacks (iframe allowed for inline YouTube embeds)
  const htmlContent = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'b', 'em', 'i', 'u',
                   'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'hr', 'div', 'span',
                   'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'iframe'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'style', 'id', 'title', 'aria-hidden',
                   'allow', 'allowfullscreen', 'frameborder', 'width', 'height'],
    ALLOW_DATA_ATTR: false
  });

  // Extract typography settings with defaults
  const {
    headingFont = typography.fontFamily.primary,
    bodyFont = typography.fontFamily.primary, 
    fontSize = typography.fontSize.base,
    lineHeight = typography.lineHeight.normal,
    paragraphSpacing = 16
  } = typographySettings;

  const previewStyles = {
    fontFamily: bodyFont,
    fontSize: fontSize,
    lineHeight: lineHeight,
    color: 'var(--color-text-primary)',
    maxWidth: 'none',
    ...style
  };

  // Hero image: extract alt from first ![IMAGE:hero_image:...] or [IMAGE:hero_image:...] and split content to inject HeroImage with animated placeholder
  const heroAltMatch = content.match(/!?\[(IMAGE:hero_image:[^\]]*)\](?!\()/);
  const heroImageAlt = heroAltMatch ? heroAltMatch[1] : '';
  const useHeroComponent = Boolean(heroImageUrl && htmlContent.includes(HERO_IMAGE_SENTINEL));
  const contentParts = useHeroComponent ? htmlContent.split(HERO_IMAGE_SENTINEL) : null;

  return (
    <div style={previewStyles}>
      {contentParts && contentParts.length > 1 ? (
        <>
          {contentParts.map((part, i) => (
            <React.Fragment key={i}>
              <div dangerouslySetInnerHTML={{ __html: part }} />
              {i < contentParts.length - 1 && (
                <HeroImage
                  src={heroImageUrl}
                  alt={heroImageAlt}
                  paragraphSpacing={paragraphSpacing}
                />
              )}
            </React.Fragment>
          ))}
        </>
      ) : (
        <>
      <div
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        style={{
          // Override default styles for HTML elements
          '& h1': {
            fontFamily: headingFont,
            fontSize: `${fontSize * 2.25}px`,
            fontWeight: typography.fontWeight.bold,
            color: 'var(--color-text-primary)',
            margin: `${paragraphSpacing * 1.5}px 0 ${paragraphSpacing}px 0`,
            lineHeight: typography.lineHeight.tight
          },
          '& h2': {
            fontFamily: headingFont,
            fontSize: `${fontSize * 1.875}px`,
            fontWeight: typography.fontWeight.semibold,
            color: 'var(--color-text-primary)',
            margin: `${paragraphSpacing * 1.25}px 0 ${paragraphSpacing * 0.75}px 0`,
            lineHeight: typography.lineHeight.tight
          },
          '& h3': {
            fontFamily: headingFont,
            fontSize: `${fontSize * 1.5}px`,
            fontWeight: typography.fontWeight.semibold,
            color: 'var(--color-text-primary)',
            margin: `${paragraphSpacing}px 0 ${paragraphSpacing * 0.5}px 0`,
            lineHeight: typography.lineHeight.tight
          },
          '& p': {
            margin: `0 0 ${paragraphSpacing}px 0`,
            lineHeight: lineHeight,
            fontFamily: bodyFont,
            fontSize: `${fontSize}px`
          },
          '& strong': {
            fontWeight: typography.fontWeight.semibold,
            color: 'var(--color-text-primary)'
          },
          '& em': {
            fontStyle: 'italic',
            color: 'var(--color-text-primary)'
          },
          '& ul, & ol': {
            margin: `${paragraphSpacing}px 0`,
            paddingLeft: '20px',
            fontFamily: bodyFont,
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight
          },
          '& li': {
            margin: `${Math.round(paragraphSpacing / 2)}px 0`,
            lineHeight: lineHeight
          },
          '& blockquote': {
            borderLeft: '4px solid var(--color-primary)',
            paddingLeft: `${paragraphSpacing}px`,
            margin: `${paragraphSpacing}px 0`,
            fontStyle: 'italic',
            color: 'var(--color-text-secondary)',
            backgroundColor: 'var(--color-background-container)',
            padding: `${paragraphSpacing * 0.75}px ${paragraphSpacing}px`
          },
          '& code': {
            backgroundColor: 'var(--color-background-container)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: typography.fontFamily.mono,
            fontSize: `${fontSize * 0.9}px`,
            color: 'var(--color-text-primary)'
          },
          '& pre': {
            backgroundColor: 'var(--color-background-container)',
            padding: `${paragraphSpacing}px`,
            borderRadius: '8px',
            overflow: 'auto',
            margin: `${paragraphSpacing}px 0`
          },
          '& pre code': {
            background: 'none',
            padding: 0,
            fontFamily: typography.fontFamily.mono,
            fontSize: `${fontSize * 0.875}px`
          },
          '& hr': {
            border: 'none',
            borderTop: '1px solid var(--color-border-base)',
            margin: `${paragraphSpacing * 2}px 0`
          }
        }}
      />
      
      <style jsx>{`
        div h1 {
          font-family: ${headingFont};
          font-size: ${fontSize * 2.25}px;
          font-weight: ${typography.fontWeight.bold};
          color: var(--color-text-primary);
          margin: ${paragraphSpacing * 1.5}px 0 ${paragraphSpacing}px 0;
          line-height: ${typography.lineHeight.tight};
        }
        
        div h2 {
          font-family: ${headingFont};
          font-size: ${fontSize * 1.875}px;
          font-weight: ${typography.fontWeight.semibold};
          color: var(--color-text-primary);
          margin: ${paragraphSpacing * 1.25}px 0 ${paragraphSpacing * 0.75}px 0;
          line-height: ${typography.lineHeight.tight};
        }
        
        div h3 {
          font-family: ${headingFont};
          font-size: ${fontSize * 1.5}px;
          font-weight: ${typography.fontWeight.semibold};
          color: var(--color-text-primary);
          margin: ${paragraphSpacing}px 0 ${paragraphSpacing * 0.5}px 0;
          line-height: ${typography.lineHeight.tight};
        }

        div h4 {
          font-family: ${headingFont};
          font-size: ${fontSize * 1.25}px;
          font-weight: ${typography.fontWeight.semibold};
          color: var(--color-text-primary);
          margin: ${paragraphSpacing * 0.875}px 0 ${paragraphSpacing * 0.375}px 0;
          line-height: ${typography.lineHeight.tight};
        }

        div h5 {
          font-family: ${headingFont};
          font-size: ${fontSize * 1.125}px;
          font-weight: ${typography.fontWeight.semibold};
          color: var(--color-text-primary);
          margin: ${paragraphSpacing * 0.75}px 0 ${paragraphSpacing * 0.25}px 0;
          line-height: ${typography.lineHeight.tight};
        }

        div h6 {
          font-family: ${headingFont};
          font-size: ${fontSize}px;
          font-weight: ${typography.fontWeight.semibold};
          color: var(--color-text-secondary);
          margin: ${paragraphSpacing * 0.625}px 0 ${paragraphSpacing * 0.25}px 0;
          line-height: ${typography.lineHeight.tight};
        }

        div p {
          margin: 0 0 ${paragraphSpacing}px 0;
          line-height: ${lineHeight};
          font-family: ${bodyFont};
          font-size: ${fontSize}px;
        }
        
        div strong {
          font-weight: ${typography.fontWeight.semibold};
          color: var(--color-text-primary);
        }
        
        div em {
          font-style: italic;
          color: var(--color-text-primary);
        }
        
        div ul, div ol {
          margin: ${paragraphSpacing}px 0;
          padding-left: 20px;
          font-family: ${bodyFont};
          font-size: ${fontSize}px;
          line-height: ${lineHeight};
        }
        
        div li {
          margin: ${Math.round(paragraphSpacing / 2)}px 0;
          line-height: ${lineHeight};
        }
        
        div blockquote {
          border-left: 4px solid var(--color-primary);
          padding-left: ${paragraphSpacing}px;
          margin: ${paragraphSpacing}px 0;
          font-style: italic;
          color: var(--color-text-secondary);
          background-color: var(--color-background-container);
          padding: ${paragraphSpacing * 0.75}px ${paragraphSpacing}px;
          border-radius: 4px;
        }
        
        div code {
          background-color: var(--color-background-container);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: ${typography.fontFamily.mono};
          font-size: ${fontSize * 0.9}px;
          color: var(--color-text-primary);
        }
        
        div pre {
          background-color: var(--color-background-container);
          padding: ${paragraphSpacing}px;
          border-radius: 8px;
          overflow: auto;
          margin: ${paragraphSpacing}px 0;
        }
        
        div pre code {
          background: none;
          padding: 0;
          font-family: ${typography.fontFamily.mono};
          font-size: ${fontSize * 0.875}px;
        }
        
        div hr {
          border: none;
          border-top: 1px solid var(--color-border-base);
          margin: ${paragraphSpacing * 2}px 0;
        }

        div img {
          max-width: 100%;
          height: auto;
          display: block;
        }

        div img.hero-image {
          width: 100%;
          border-radius: 8px;
          margin: ${paragraphSpacing}px 0;
        }

        /* Tweet Card Styling (TipTap editor node) */
        div :global(.tweet-card) {
          transition: box-shadow 0.2s ease;
          cursor: default;
        }

        div :global(.tweet-card:hover) {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        div :global(.tweet-card) img {
          display: inline-block;
          object-fit: cover;
        }

        div :global(.tweet-card) a {
          color: var(--color-primary);
          text-decoration: none;
          transition: opacity 0.2s ease;
        }

        div :global(.tweet-card) a:hover {
          opacity: 0.8;
        }

        /* Tweet Fallback Styling */
        div :global(.tweet-fallback) {
          transition: background-color 0.2s ease;
        }

        div :global(.tweet-fallback:hover) {
          background-color: var(--color-primary-50) !important;
        }

        /* Related content badges – visually differentiate article / video / tweet */
        div :global(.markdown-related-badge) {
          position: absolute;
          top: 4px;
          right: 6px;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 2px 5px;
          border-radius: 4px;
          z-index: 1;
        }
        div :global(.markdown-related-badge-article) {
          background: rgba(59, 130, 246, 0.12);
          color: #2563eb;
          border: 1px solid rgba(59, 130, 246, 0.25);
        }
        div :global(.markdown-related-badge-video) {
          background: rgba(220, 38, 38, 0.1);
          color: #dc2626;
          border: 1px solid rgba(220, 38, 38, 0.2);
        }

        /* Markdown tweet card – embedded X/Twitter-style card, visually distinct from article body */
        div :global(.markdown-tweet-card) {
          position: relative;
          margin: 16px 0;
          padding: 16px 18px;
          max-width: 480px;
          border: 1px solid var(--color-tweet-embed-border, #cfd9de);
          border-radius: 16px;
          background: var(--color-tweet-embed-bg, #f7f9f9);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }

        div :global(.markdown-tweet-card:hover) {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border-color: var(--color-tweet-embed-border-hover, #8b98a5);
        }

        div :global(.markdown-tweet-card-header) {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        div :global(.markdown-tweet-card-avatar) {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #0f1419;
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          line-height: 1;
          flex-shrink: 0;
        }

        div :global(.markdown-tweet-card-badge) {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-secondary, #536471);
          letter-spacing: 0.01em;
        }

        div :global(.markdown-tweet-card-body) {
          font-size: 15px;
          line-height: 1.5;
          color: var(--color-text-primary, #0f1419);
          white-space: pre-wrap;
          word-break: break-word;
          margin: 0;
        }

        div :global(.markdown-tweet-card-footer) {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--color-tweet-embed-border, #cfd9de);
        }

        div :global(.markdown-tweet-card-link) {
          font-size: 13px;
          font-weight: 500;
          color: #1d9bf0;
          text-decoration: none;
        }

        div :global(.markdown-tweet-card-link:hover) {
          text-decoration: underline;
          color: #1a8cd8;
        }

        /* Tweet loading placeholder – same embedded-card look */
        div :global(.markdown-tweet-placeholder) {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 72px;
          margin: 16px 0;
          padding: 16px 18px;
          border-radius: 16px;
          border: 1px dashed var(--color-tweet-embed-border, #cfd9de);
          background: var(--color-tweet-embed-bg, #f7f9f9);
          color: var(--color-text-tertiary);
        }

        div :global(.markdown-tweet-placeholder-icon) {
          font-size: 16px;
          opacity: 0.7;
        }

        div :global(.markdown-tweet-placeholder-text) {
          font-size: 12px;
          font-style: italic;
        }

        /* Image placeholder: shimmer animation (animated loading) */
        div :global(.markdown-image-placeholder) {
          display: inline-block;
          min-width: 120px;
          min-height: 68px;
          border-radius: 6px;
          animation: imagePlaceholderShimmer 2s ease-in-out infinite;
          background: linear-gradient(90deg,
            var(--color-gray-200) 0%,
            var(--color-gray-300) 50%,
            var(--color-gray-200) 100%);
          background-size: 200px 100%;
          color: var(--color-text-tertiary);
          font-size: 12px;
          padding: 8px 12px;
          vertical-align: middle;
        }

        @keyframes imagePlaceholderShimmer {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }

        /* Video placeholder: compact, YouTube-style red accent */
        div :global(.markdown-video-placeholder) {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 64px;
          margin: 8px 0;
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px dashed var(--color-border-base);
          border-left: 3px solid #dc2626;
          background: linear-gradient(135deg, rgba(220, 38, 38, 0.04) 0%, rgba(200, 50, 50, 0.06) 100%);
          animation: videoPlaceholderPulse 1.8s ease-in-out infinite;
          color: var(--color-text-tertiary);
        }

        div :global(.markdown-video-placeholder-icon) {
          font-size: 18px;
          opacity: 0.7;
          animation: videoPlaceholderIconPulse 1.2s ease-in-out infinite;
        }

        div :global(.markdown-video-placeholder-text) {
          font-size: 12px;
          font-style: italic;
        }

        @keyframes videoPlaceholderPulse {
          0%, 100% { opacity: 1; background-size: 100% 100%; }
          50% { opacity: 0.92; background-size: 102% 102%; }
        }

        @keyframes videoPlaceholderIconPulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }

        /* Section heading + first video card spacing */
        div :global(h2 + .markdown-video-card) {
          margin-top: 6px;
        }

        /* Video card: clear separation, larger thumb, play overlay */
        div :global(.markdown-video-card) {
          position: relative;
          display: flex;
          align-items: stretch;
          gap: 14px;
          margin: 14px 0;
          padding: 0;
          border-radius: 10px;
          border: 1px solid var(--color-border-base);
          background: var(--color-background-container);
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
          overflow: hidden;
        }

        div :global(.markdown-video-card:hover) {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border-color: var(--color-primary-200);
        }

        div :global(.markdown-video-card-thumb-wrap) {
          flex-shrink: 0;
          position: relative;
          display: block;
          line-height: 0;
          text-decoration: none;
          width: 160px;
          min-height: 90px;
        }

        div :global(.markdown-video-card-thumb) {
          width: 160px;
          height: 90px;
          max-width: 160px;
          max-height: 90px;
          object-fit: cover;
          display: block;
          vertical-align: top;
        }

        div :global(.markdown-video-card-play) {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.7);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          padding-left: 3px;
          pointer-events: none;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        div :global(.markdown-video-card-thumb-wrap:hover) .markdown-video-card-play {
          background: rgba(99, 102, 241, 0.9);
          transform: translate(-50%, -50%) scale(1.08);
        }

        div :global(.markdown-video-card-thumb-placeholder) {
          width: 160px;
          height: 90px;
          background: var(--color-background-alt);
          color: var(--color-text-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        div :global(.markdown-video-card-body) {
          flex: 1;
          min-width: 0;
          padding: 12px 14px 12px 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
          justify-content: center;
        }

        div :global(.markdown-video-card-title) {
          font-weight: 600;
          font-size: 14px;
          line-height: 1.35;
          color: var(--color-text-primary);
          text-decoration: none;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.2s ease;
        }

        div :global(.markdown-video-card-title:hover) {
          color: var(--color-primary);
          text-decoration: underline;
        }

        div :global(.markdown-video-card-meta) {
          font-size: 12px;
          color: var(--color-text-secondary);
          line-height: 1.4;
          display: block;
        }
      `}</style>
        </>
      )}
      <style jsx>{`
        div :global(.hero-image-wrapper) {
          position: relative;
          min-height: 240px;
          margin: ${paragraphSpacing}px 0;
          border-radius: 8px;
          overflow: hidden;
        }
        div :global(.hero-image-placeholder) {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            var(--color-background-container) 0%,
            var(--color-background-alt) 40%,
            var(--color-background-container) 60%,
            var(--color-background-alt) 100%
          );
          background-size: 200% 100%;
          animation: hero-shimmer 1.5s ease-in-out infinite;
        }
        @keyframes hero-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Article placeholder: compact, blue accent */
        div :global(.markdown-article-placeholder) {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 64px;
          margin: 8px 0;
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px dashed var(--color-border-base);
          border-left: 3px solid #2563eb;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.08) 100%);
          animation: articlePlaceholderPulse 1.8s ease-in-out infinite;
          color: var(--color-text-tertiary);
        }
        div :global(.markdown-article-placeholder-icon) {
          font-size: 18px;
          opacity: 0.8;
          animation: articlePlaceholderIconPulse 1.2s ease-in-out infinite;
        }
        div :global(.markdown-article-placeholder-text) {
          font-size: 12px;
          font-style: italic;
        }
        @keyframes articlePlaceholderPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.92; }
        }
        @keyframes articlePlaceholderIconPulse {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.06); }
        }

        /* Section heading + first article card spacing */
        div :global(h2 + .markdown-article-card) {
          margin-top: 6px;
        }

        /* Article card: clear separation, larger thumb, aligned with video cards */
        div :global(.markdown-article-card) {
          position: relative;
          display: flex;
          align-items: stretch;
          gap: 14px;
          margin: 14px 0;
          padding: 0;
          border-radius: 10px;
          border: 1px solid var(--color-border-base);
          background: var(--color-background-container);
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
          overflow: hidden;
        }
        div :global(.markdown-article-card:hover) {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border-color: var(--color-primary-200);
        }
        div :global(.markdown-article-card-thumb-wrap) {
          flex-shrink: 0;
          display: block;
          line-height: 0;
          text-decoration: none;
          width: 160px;
          min-height: 90px;
        }
        div :global(.markdown-article-card-thumb) {
          width: 160px;
          height: 90px;
          max-width: 160px;
          max-height: 90px;
          object-fit: cover;
          display: block;
          vertical-align: top;
        }
        div :global(.markdown-article-card-thumb-placeholder) {
          width: 160px;
          height: 90px;
          background: var(--color-background-alt);
          color: var(--color-text-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }
        div :global(.markdown-article-card-body) {
          flex: 1;
          min-width: 0;
          padding: 12px 14px 12px 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
          justify-content: center;
        }
        div :global(.markdown-article-card-title) {
          font-weight: 600;
          font-size: 14px;
          line-height: 1.35;
          color: var(--color-text-primary);
          text-decoration: none;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.2s ease;
        }
        div :global(.markdown-article-card-title:hover) {
          color: var(--color-primary);
          text-decoration: underline;
        }
        div :global(.markdown-article-card-meta) {
          font-size: 12px;
          color: var(--color-text-secondary);
          line-height: 1.4;
          display: block;
        }
        div :global(.markdown-article-card-desc) {
          font-size: 12px;
          color: var(--color-text-secondary);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default HTMLPreview;