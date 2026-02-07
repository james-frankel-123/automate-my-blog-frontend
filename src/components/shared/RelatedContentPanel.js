/**
 * RelatedContentPanel — compact UI to view and inject related content (tweets, articles, videos)
 * into the blog post. Small thumbnails, one-line titles, clear "Add to post" actions.
 */
import React, { useState } from 'react';
import { Collapse, Button, Typography } from 'antd';
import { MessageOutlined, FileTextOutlined, PlayCircleOutlined, PlusOutlined } from '@ant-design/icons';

const { Text } = Typography;

const TRUNCATE = { tweet: 72, title: 48 };

const panelHeaderStyle = {
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--color-primary-700)',
};

const itemRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '6px 0',
  borderBottom: '1px solid var(--color-gray-100)',
  minHeight: 44,
};
const itemRowLastStyle = { borderBottom: 'none' };

const thumbStyle = {
  width: 56,
  height: 32,
  objectFit: 'cover',
  borderRadius: 4,
  flexShrink: 0,
  backgroundColor: 'var(--color-gray-100)',
};

const titleStyle = {
  flex: 1,
  minWidth: 0,
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--color-text-primary)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const metaStyle = {
  fontSize: '11px',
  color: 'var(--color-text-tertiary)',
  marginTop: 1,
};

/**
 * @param {Object} props
 * @param {Array<string|{ text?: string, content?: string }>} [props.tweets]
 * @param {Array<{ url?: string, title?: string, sourceName?: string, publishedAt?: string, urlToImage?: string }>} [props.articles]
 * @param {Array<{ videoId?: string, url?: string, title?: string, channelTitle?: string, thumbnailUrl?: string, viewCount?: number, duration?: string }>} [props.videos]
 * @param {(type: 'TWEET'|'ARTICLE'|'VIDEO', index: number) => void} [props.onInject] - Called when user clicks "Add to post"
 */
function RelatedContentPanel({ tweets = [], articles = [], videos = [], onInject }) {
  const hasTweets = Array.isArray(tweets) && tweets.length > 0;
  const hasArticles = Array.isArray(articles) && articles.length > 0;
  const hasVideos = Array.isArray(videos) && videos.length > 0;
  const hasAny = hasTweets || hasArticles || hasVideos;

  const [activeKeys, setActiveKeys] = useState(() => {
    const keys = [];
    if (hasTweets) keys.push('tweets');
    if (hasArticles) keys.push('articles');
    if (hasVideos) keys.push('videos');
    return keys;
  });

  if (!hasAny) return null;

  const handleInject = (type, index) => {
    if (typeof onInject === 'function') onInject(type, index);
  };

  const tweetLabel = (t, i) => {
    const str = typeof t === 'string' ? t : (t?.text || t?.content || '');
    const truncated = String(str).slice(0, TRUNCATE.tweet);
    return (truncated + (String(str).length > TRUNCATE.tweet ? '…' : ''));
  };

  const injectAriaLabel = (type, index) => {
    const label = type.charAt(0) + type.slice(1).toLowerCase();
    return `Add ${label} ${index + 1} to post`;
  };

  return (
    <section
      style={{
        marginBottom: 16,
        borderRadius: 8,
        border: '1px solid var(--color-primary-100)',
        backgroundColor: 'var(--color-primary-50)',
        overflow: 'hidden',
      }}
      data-testid="related-content-panel"
      aria-labelledby="related-content-heading"
    >
      <div style={{ padding: '10px 14px 6px', borderBottom: '1px solid var(--color-primary-100)' }}>
        <h3
          id="related-content-heading"
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--color-primary-700)',
          }}
        >
          Related content
        </h3>
        {onInject && (
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Add to post inserts a placeholder; switch to Preview to see the card in your post.
          </p>
        )}
      </div>
      <Collapse
        activeKey={activeKeys}
        onChange={(keys) => setActiveKeys(Array.isArray(keys) ? keys : [keys])}
        ghost
        style={{ background: 'transparent' }}
        aria-label="Tweets, articles, and videos you can add to your post"
      >
        {hasTweets && (
          <Collapse.Panel
            header={
              <span style={panelHeaderStyle}>
                <MessageOutlined style={{ marginRight: 6 }} />
                Tweets
                <Text type="secondary" style={{ fontWeight: 400, marginLeft: 6 }}>
                  {tweets.length}
                </Text>
              </span>
            }
            key="tweets"
          >
            <div style={{ padding: '4px 0 8px 0' }}>
              {tweets.slice(0, 5).map((t, i) => (
                <div
                  key={i}
                  style={{
                    ...itemRowStyle,
                    ...(i === Math.min(4, tweets.length - 1) ? itemRowLastStyle : {}),
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={titleStyle} title={typeof t === 'string' ? t : (t?.text || t?.content || '')}>
                      {tweetLabel(t, i)}
                    </div>
                  </div>
                  {onInject && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => handleInject('TWEET', i)}
                      style={{ flexShrink: 0 }}
                      aria-label={injectAriaLabel('TWEET', i)}
                    >
                      Add to post
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Collapse.Panel>
        )}

        {hasArticles && (
          <Collapse.Panel
            header={
              <span style={panelHeaderStyle}>
                <FileTextOutlined style={{ marginRight: 6 }} />
                Articles
                <Text type="secondary" style={{ fontWeight: 400, marginLeft: 6 }}>
                  {articles.length}
                </Text>
              </span>
            }
            key="articles"
          >
            <div style={{ padding: '4px 0 8px 0' }}>
              {articles.slice(0, 5).map((a, i) => {
                const linkUrl = a?.url && /^https?:\/\//i.test(a.url) ? a.url : null;
                return (
                  <div
                    key={a?.url || i}
                    style={{
                      ...itemRowStyle,
                      ...(i === Math.min(4, articles.length - 1) ? itemRowLastStyle : {}),
                    }}
                  >
                    {a?.urlToImage && (
                      linkUrl ? (
                        <a href={linkUrl} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0 }} aria-label={`Open article: ${(a?.title || 'Article').slice(0, 50)}`}>
                          <img src={a.urlToImage} alt="" style={thumbStyle} role="presentation" />
                        </a>
                      ) : (
                        <img src={a.urlToImage} alt="" style={thumbStyle} role="presentation" />
                      )
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {linkUrl ? (
                        <a
                          href={linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ ...titleStyle, color: 'var(--color-primary)', textDecoration: 'none' }}
                          title={a?.title || 'Article'}
                        >
                          {(a?.title || 'Article').slice(0, TRUNCATE.title)}
                          {(a?.title || '').length > TRUNCATE.title ? '…' : ''}
                        </a>
                      ) : (
                        <div style={titleStyle} title={a?.title || 'Article'}>
                          {(a?.title || 'Article').slice(0, TRUNCATE.title)}
                          {(a?.title || '').length > TRUNCATE.title ? '…' : ''}
                        </div>
                      )}
                      <div style={metaStyle}>
                        {a?.sourceName}
                        {a?.publishedAt ? ` · ${new Date(a.publishedAt).toLocaleDateString()}` : ''}
                      </div>
                    </div>
                    {onInject && (
                      <Button
                        type="primary"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => handleInject('ARTICLE', i)}
                        style={{ flexShrink: 0 }}
                        aria-label={injectAriaLabel('ARTICLE', i)}
                      >
                        Add to post
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </Collapse.Panel>
        )}

        {hasVideos && (
          <Collapse.Panel
            header={
              <span style={panelHeaderStyle}>
                <PlayCircleOutlined style={{ marginRight: 6 }} />
                Videos
                <Text type="secondary" style={{ fontWeight: 400, marginLeft: 6 }}>
                  {videos.length}
                </Text>
              </span>
            }
            key="videos"
          >
            <div style={{ padding: '4px 0 8px 0' }}>
              {videos.slice(0, 5).map((v, i) => {
                const linkUrl = v?.url && /^https?:\/\//i.test(v.url) ? v.url : (v?.videoId ? `https://www.youtube.com/watch?v=${v.videoId}` : null);
                return (
                  <div
                    key={v?.videoId || i}
                    style={{
                      ...itemRowStyle,
                      ...(i === Math.min(4, videos.length - 1) ? itemRowLastStyle : {}),
                    }}
                  >
                    {v?.thumbnailUrl && (
                      linkUrl ? (
                        <a href={linkUrl} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0 }} aria-label={`Open video: ${(v?.title || 'Video').slice(0, 50)}`}>
                          <img src={v.thumbnailUrl} alt="" style={thumbStyle} role="presentation" />
                        </a>
                      ) : (
                        <img src={v.thumbnailUrl} alt="" style={thumbStyle} role="presentation" />
                      )
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {linkUrl ? (
                        <a
                          href={linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ ...titleStyle, color: 'var(--color-primary)', textDecoration: 'none' }}
                          title={v?.title || 'Video'}
                        >
                          {(v?.title || 'Video').slice(0, TRUNCATE.title)}
                          {(v?.title || '').length > TRUNCATE.title ? '…' : ''}
                        </a>
                      ) : (
                        <div style={titleStyle} title={v?.title || 'Video'}>
                          {(v?.title || 'Video').slice(0, TRUNCATE.title)}
                          {(v?.title || '').length > TRUNCATE.title ? '…' : ''}
                        </div>
                      )}
                      <div style={metaStyle}>
                        {v?.channelTitle}
                        {v?.viewCount != null ? ` · ${Number(v.viewCount).toLocaleString()} views` : ''}
                        {v?.duration ? ` · ${v.duration}` : ''}
                      </div>
                    </div>
                    {onInject && (
                      <Button
                        type="primary"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => handleInject('VIDEO', i)}
                        style={{ flexShrink: 0 }}
                        aria-label={injectAriaLabel('VIDEO', i)}
                      >
                        Add to post
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </Collapse.Panel>
        )}
      </Collapse>
    </section>
  );
}

export default RelatedContentPanel;
