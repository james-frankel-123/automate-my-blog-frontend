import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { Tweet } from 'react-tweet';
import 'react-tweet/theme.css';
import { typography } from '../DesignSystem/tokens';

function escapeAttr(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const HERO_IMAGE_SENTINEL = '__HERO_IMAGE__';

/** Brief minimum time (ms) for placeholder so transition isn’t jarring; image still swaps in as soon as loaded after this. */
const HERO_PLACEHOLDER_MIN_MS = 400;

/**
 * Hero image with animated placeholder until loaded, then swaps in the image.
 * Handles cached images (checks img.complete) so the real image always replaces the placeholder once ready.
 * Uses inline styles + a scoped style tag so the placeholder is always visible (no dependency on parent styled-jsx).
 */
function HeroImage({ src, alt, paragraphSpacing = 16 }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setMinTimeElapsed(true), HERO_PLACEHOLDER_MIN_MS);
    return () => clearTimeout(t);
  }, []);

  // When src changes, reset loaded state and (after paint) check if image is already complete (e.g. cached)
  useEffect(() => {
    if (!src) return;
    setImageLoaded(false);
    const checkComplete = () => {
      if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
        setImageLoaded(true);
      }
    };
    // Check after React has committed the img so ref is set
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(checkComplete);
    });
    return () => cancelAnimationFrame(id);
  }, [src]);

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
        ref={imgRef}
        src={src}
        alt={alt || 'Hero image'}
        loading="eager"
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

/**
 * Visual-only hero placeholder (no image URL yet). Shown in free post claim preview etc.
 * So users see an image placeholder box instead of raw markdown like ![IMAGE:hero_image:...].
 */
function HeroImagePlaceholder({ paragraphSpacing = 16 }) {
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
    <div className="hero-image-wrapper hero-image-placeholder-only" style={wrapperStyle} data-testid="hero-image-placeholder">
      <style dangerouslySetInnerHTML={{
        __html: `@keyframes hero-placeholder-gentle { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }`
      }} />
      <div className="hero-image-placeholder" aria-hidden="true" role="presentation" style={placeholderStyle}>
        <span style={messageStyle}>Hero image will appear here</span>
      </div>
    </div>
  );
}

function isHeroImagePlaceholder(alt) {
  return typeof alt === 'string' && /^IMAGE:hero_image:/i.test(alt.trim());
}

/**
 * Normalize hero placeholder when backend sends [IMAGE:hero_image:...] without leading !
 * Uses (^|[^!]) instead of lookbehind for broad regex support (e.g. older Safari).
 */
function normalizeHeroPlaceholder(text) {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/(^|[^!])\[(IMAGE:hero_image:[^\]]*)\](?!\()/g, '$1![$2]');
}

/**
 * Convert markdown to HTML
 * @param {string} markdown
 * @param {{ heroImageUrl?: string }} [options] - When set, ![IMAGE:hero_image:...] is rendered as <img src={heroImageUrl} />
 */
const markdownToHTML = (markdown, _options = {}) => {
  if (!markdown || typeof markdown !== 'string') return '';
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
  html = normalizeHeroPlaceholder(html);

  // Images ![alt](url) — before links so ![...](...) is not treated as link; hero placeholder → sentinel so we show visual placeholder (never raw markdown)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, (_, alt, url) => {
    const u = url.trim();
    const isPlaceholder = /^[a-z]+:[^:]+:?/i.test(u) || !/^https?:\/\//i.test(u);
    const safeAlt = String(alt || 'Image').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&/g, '&amp;');
    if (isPlaceholder && isHeroImagePlaceholder(alt)) {
      return HERO_IMAGE_SENTINEL;
    }
    if (isPlaceholder) return `<span class="markdown-image-placeholder" title="${escapeAttr(alt || u)}">[${safeAlt}]</span>`;
    return `<img src="${escapeAttr(u)}" alt="${escapeAttr(alt)}" loading="lazy" />`;
  });

  // Standalone hero placeholder: ![IMAGE:hero_image:description] → sentinel so we show visual placeholder (fixes #337 free post claim preview)
  html = html.replace(/!\[([^\]]*)\](?!\()/gim, (_, alt) => {
    const safeAlt = String(alt || 'Image').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&/g, '&amp;');
    if (isHeroImagePlaceholder(alt)) {
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

/** Sentinel injected so we can split and render react-tweet or fallback card. */
const TWEET_EMBED_SENTINEL_REGEX = /__TWEET_EMBED_(\d+)__/g;

/**
 * Extract Twitter/X tweet ID from a status URL.
 * Supports twitter.com/.../status/ID, x.com/.../status/ID, twitter.com/i/status/ID.
 * @param {string} [url]
 * @returns {string|null}
 */
function getTweetIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const m = url.match(/(?:twitter\.com|x\.com)\/(?:i\/)?(?:\w+\/)?status\/(\d+)/i);
  return m ? m[1] : null;
}

/** Inline X logo SVG for embed header (safe, no user content). */
const X_LOGO_SVG = '<svg class="markdown-tweet-card-xlogo-svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';

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
 * Build HTML for a tweet placeholder: X/Twitter-style embed card or loading state (issue #338).
 * Tweet object may have: text|content, url, authorName?, authorHandle?|username?
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
    const authorName = typeof tweet === 'object' && tweet?.authorName ? escapeAttr(String(tweet.authorName).slice(0, 100)) : '';
    const handle = typeof tweet === 'object' && (tweet?.authorHandle ?? tweet?.username) ? escapeAttr(String(tweet.authorHandle ?? tweet.username).replace(/^@/, '').slice(0, 50)) : '';
    const byline = authorName || handle
      ? '<div class="markdown-tweet-card-byline">' +
        (authorName ? `<span class="markdown-tweet-card-name">${authorName}</span>` : '') +
        (authorName && handle ? '<span class="markdown-tweet-card-dot" aria-hidden="true"> · </span>' : '') +
        (handle ? `<span class="markdown-tweet-card-handle">@${handle}</span>` : '') +
        '</div>'
      : '<span class="markdown-tweet-card-badge">Post from X</span>';
    const xLogoLink = tweetUrl
      ? `<a href="${tweetUrl}" target="_blank" rel="noopener noreferrer" class="markdown-tweet-card-xlogo" aria-hidden="true">${X_LOGO_SVG}</a>`
      : `<span class="markdown-tweet-card-xlogo" aria-hidden="true">${X_LOGO_SVG}</span>`;
    const viewOnX = tweetUrl
      ? `<a href="${tweetUrl}" target="_blank" rel="noopener noreferrer" class="markdown-tweet-card-link">View on X</a>`
      : '';
    return (
      '<div class="markdown-tweet-card" role="article" aria-label="Embedded post from X">' +
      '<div class="markdown-tweet-card-header">' +
      '<span class="markdown-tweet-card-avatar" aria-hidden="true">𝕏</span>' +
      '<div class="markdown-tweet-card-meta">' + byline + '</div>' +
      xLogoLink +
      '</div>' +
      '<div class="markdown-tweet-card-body">' + escaped(text) + '</div>' +
      '<div class="markdown-tweet-card-actions">' +
      '<span class="markdown-tweet-card-action"><span class="markdown-tweet-card-action-icon" aria-hidden="true">💬</span><span>Reply</span></span>' +
      '<span class="markdown-tweet-card-action"><span class="markdown-tweet-card-action-icon" aria-hidden="true">🔁</span><span>Repost</span></span>' +
      '<span class="markdown-tweet-card-action"><span class="markdown-tweet-card-action-icon" aria-hidden="true">❤️</span><span>Like</span></span>' +
      (viewOnX ? '<span class="markdown-tweet-card-action markdown-tweet-card-action-view">' + viewOnX + '</span>' : '') +
      '</div>' +
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
 * Renders a single tweet slot: react-tweet when we have a tweet ID from URL, else fallback card HTML.
 */
function TweetEmbed({ index, relatedTweets }) {
  const tweets = Array.isArray(relatedTweets) ? relatedTweets : [];
  const tweet = tweets[index];
  const id = tweet?.url ? getTweetIdFromUrl(tweet.url) : null;
  const fallbackHtml = getTweetPlaceholderHtml(index, relatedTweets);

  if (id) {
    return (
      <div className="markdown-tweet-embed-wrapper" style={{ margin: '20px 0' }}>
        <Tweet
          id={id}
          fallback={
            <div
              className="markdown-tweet-card-fallback"
              dangerouslySetInnerHTML={{ __html: fallbackHtml }}
            />
          }
        />
      </div>
    );
  }
  return (
    <div
      className="markdown-tweet-card-fallback"
      dangerouslySetInnerHTML={{ __html: fallbackHtml }}
    />
  );
}

/**
 * Renders HTML content, splitting on __TWEET_EMBED_n__ and rendering react-tweet (or fallback) for each slot.
 */
function HtmlWithTweetSlots({ html, relatedTweets }) {
  if (!html) return null;
  if (!html.includes('__TWEET_EMBED_')) {
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }
  const parts = html.split(TWEET_EMBED_SENTINEL_REGEX);
  const result = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      if (parts[i]) result.push(<div key={`html-${i}`} dangerouslySetInnerHTML={{ __html: parts[i] }} />);
    } else {
      const index = parseInt(parts[i], 10);
      if (!Number.isNaN(index) && index >= 0) {
        result.push(<TweetEmbed key={`tweet-${i}-${index}`} index={index} relatedTweets={relatedTweets} />);
      }
    }
  }
  return <>{result}</>;
}

/**
 * Build HTML for an article placeholder slot: animated loading box or article card.
 * @param {number} index - Placeholder index
 * @param {Array<{ url?: string, title?: string, description?: string, sourceName?: string, publishedAt?: string }>} relatedArticles
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
    const descLen = 120;
    const desc = article.description ? escapeAttr(String(article.description).slice(0, descLen)) + (String(article.description).length > descLen ? '…' : '') : '';
    // No news image: link as reference only (title + meta + description)
    const thumbBlock = '<span class="markdown-article-card-thumb-wrap"><span class="markdown-article-card-thumb-placeholder" aria-hidden="true">📰</span></span>';
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
/** Normalize for CTA matching: trim and lower. */
function normalizeForCtaMatch(s) {
  if (typeof s !== 'string') return '';
  return s.trim().toLowerCase();
}

/** True if anchor matches CTA by href or link text. */
function anchorMatchesCta(anchor, cta) {
  const href = anchor.getAttribute('href');
  const text = anchor.textContent || '';
  const ctaHref = cta.href != null ? String(cta.href).trim() : '';
  const ctaText = cta.text != null ? String(cta.text).trim() : '';
  if (ctaHref && href && normalizeForCtaMatch(href) === normalizeForCtaMatch(ctaHref)) return true;
  if (ctaText && normalizeForCtaMatch(text) === normalizeForCtaMatch(ctaText)) return true;
  if (ctaText && text.trim() && normalizeForCtaMatch(text).includes(normalizeForCtaMatch(ctaText))) return true;
  return false;
}

const HTMLPreview = ({ content, typographySettings = {}, style = {}, forceMarkdown = false, heroImageUrl, relatedArticles, relatedVideos, relatedTweets, ctas = [] }) => {
  const containerRef = useRef(null);

  // Style CTA links in the preview when result.ctas / data.ctas are provided (match by href or text). Must run unconditionally (hooks rules).
  useEffect(() => {
    if (!containerRef.current || !Array.isArray(ctas) || ctas.length === 0) return;
    const links = containerRef.current.querySelectorAll('a');
    links.forEach((a) => {
      const isCta = ctas.some((cta) => anchorMatchesCta(a, cta));
      if (isCta) a.classList.add('cta-link');
    });
    return () => {
      links.forEach((a) => a.classList.remove('cta-link'));
    };
  }, [content, ctas]);

  if (!content || !content.trim()) {
    return (
      <div ref={containerRef} style={{
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

  // Normalize hero placeholder when backend sends [IMAGE:hero_image:...] without leading !
  const normalizedContent = normalizeHeroPlaceholder(content);

  // Streamed blog content: always treat as Markdown. Otherwise skip conversion only when content looks like HTML.
  const looksLikeHtml = !forceMarkdown && /<\s*[a-zA-Z][a-zA-Z0-9-]*[\s>/]/.test(normalizedContent);
  let rawHtml = looksLikeHtml ? normalizedContent : markdownToHTML(normalizedContent, { heroImageUrl });

  // When content was treated as HTML, hero placeholder stayed as literal text; inject sentinel so we show visual placeholder or hero image
  if (looksLikeHtml && /!?\[(IMAGE:hero_image:[^\]]*)\](?!\()/.test(rawHtml)) {
    rawHtml = rawHtml.replace(/!?\[(IMAGE:hero_image:[^\]]*)\](?!\()/, HERO_IMAGE_SENTINEL);
  }

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
  // Replace tweet placeholder tokens with sentinels so we can render react-tweet or fallback per slot
  if (rawHtml.includes('__TWEET_PLACEHOLDER_')) {
    rawHtml = rawHtml.replace(TWEET_PLACEHOLDER_TOKEN_REGEX, (_, indexStr) => {
      const index = parseInt(indexStr, 10);
      return Number.isNaN(index) || index < 0 ? '' : `__TWEET_EMBED_${index}__`;
    });
  }

  // Sanitize HTML to prevent XSS attacks (iframe allowed for inline YouTube embeds)
  const htmlContent = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'b', 'em', 'i', 'u',
                   'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'hr', 'div', 'span',
                   'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'iframe'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'style', 'id', 'title', 'aria-hidden', 'aria-label', 'role',
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

  // Hero image: extract alt from first ![IMAGE:hero_image:...] or [IMAGE:hero_image:...]; split and inject visual placeholder or real image
  const heroAltMatch = normalizedContent.match(/!?\[(IMAGE:hero_image:[^\]]*)\](?!\()/);
  const heroImageAlt = heroAltMatch ? heroAltMatch[1] : '';
  const useHeroSlot = htmlContent.includes(HERO_IMAGE_SENTINEL);
  const contentParts = useHeroSlot ? htmlContent.split(HERO_IMAGE_SENTINEL) : null;

  return (
    <div ref={containerRef} className="html-preview-container" style={previewStyles}>
      {contentParts && contentParts.length > 1 ? (
        <>
          {contentParts.map((part, i) => (
            <React.Fragment key={i}>
              <HtmlWithTweetSlots html={part} relatedTweets={relatedTweets} />
              {i < contentParts.length - 1 && (
                heroImageUrl ? (
                  <HeroImage
                    src={heroImageUrl}
                    alt={heroImageAlt}
                    paragraphSpacing={paragraphSpacing}
                  />
                ) : (
                  <HeroImagePlaceholder paragraphSpacing={paragraphSpacing} />
                )
              )}
            </React.Fragment>
          ))}
        </>
      ) : (
        <>
      <div
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
      >
        <HtmlWithTweetSlots html={htmlContent} relatedTweets={relatedTweets} />
      </div>
      
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

        /* Markdown tweet card – actual X/Twitter embed look: avatar, byline, body, actions row */
        div :global(.markdown-tweet-card) {
          position: relative;
          margin: 20px 0;
          padding: 16px 16px 12px;
          max-width: 550px;
          border: 1px solid #cfd9de;
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }

        div :global(.markdown-tweet-card:hover) {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-color: #8b98a5;
        }

        div :global(.markdown-tweet-card-header) {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }

        div :global(.markdown-tweet-card-avatar) {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #0f1419;
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 700;
          line-height: 1;
          flex-shrink: 0;
        }

        div :global(.markdown-tweet-card-meta) {
          flex: 1;
          min-width: 0;
        }

        div :global(.markdown-tweet-card-byline) {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 2px 6px;
          line-height: 1.2;
        }

        div :global(.markdown-tweet-card-name) {
          font-size: 15px;
          font-weight: 700;
          color: #0f1419;
        }

        div :global(.markdown-tweet-card-dot) {
          font-size: 15px;
          color: #536471;
          font-weight: 400;
        }

        div :global(.markdown-tweet-card-handle) {
          font-size: 15px;
          color: #536471;
        }

        div :global(.markdown-tweet-card-badge) {
          font-size: 15px;
          font-weight: 400;
          color: #536471;
        }

        div :global(.markdown-tweet-card-xlogo) {
          flex-shrink: 0;
          margin-left: auto;
          color: #0f1419;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }

        div :global(.markdown-tweet-card-xlogo:hover) {
          color: #1d9bf0;
        }

        div :global(.markdown-tweet-card-xlogo-svg) {
          display: block;
        }

        div :global(.markdown-tweet-card-body) {
          font-size: 15px;
          line-height: 1.3125;
          color: #0f1419;
          white-space: pre-wrap;
          word-break: break-word;
          margin: 0 0 12px 0;
          padding-left: 60px;
        }

        div :global(.markdown-tweet-card-actions) {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 4px 24px;
          padding-left: 60px;
          margin-top: 4px;
          padding-top: 12px;
          border-top: 1px solid #eff3f4;
          font-size: 13px;
          color: #536471;
        }

        div :global(.markdown-tweet-card-action) {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        div :global(.markdown-tweet-card-action-icon) {
          font-size: 14px;
          line-height: 1;
        }

        div :global(.markdown-tweet-card-action-view) {
          margin-left: auto;
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

        /* Tweet loading placeholder – matches embed card look */
        div :global(.markdown-tweet-placeholder) {
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 80px;
          margin: 20px 0;
          padding: 16px;
          border-radius: 16px;
          border: 1px dashed #cfd9de;
          background: #fff;
          color: #536471;
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