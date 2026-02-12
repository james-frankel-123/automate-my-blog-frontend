import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';

/**
 * Tweet Card Component - Renders a styled tweet card
 */
const TweetCardComponent = ({ node }) => {
  const {
    authorName,
    authorHandle,
    authorAvatar,
    tweetText,
    tweetUrl,
    createdAt,
    likes,
    retweets,
    verified
  } = node.attrs;

  return (
    <NodeViewWrapper>
      <div
        className="tweet-card"
        data-tweet-url={tweetUrl}
        style={{
          border: '1px solid var(--color-border-base)',
          borderRadius: '12px',
          padding: '16px',
          margin: '24px auto',
          background: 'var(--color-background-alt)',
          width: '90%',
          maxWidth: '90%',
          boxSizing: 'border-box',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }}
      >
        {/* Header with avatar, name, handle */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <img
            src={authorAvatar}
            alt={authorName}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              marginRight: '12px',
              flexShrink: 0,
              display: 'block'
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '15px' }}>
                {authorName}
              </span>
              {verified && (
                <svg style={{ width: '18px', height: '18px', fill: 'var(--color-primary)', marginLeft: '4px' }} viewBox="0 0 24 24">
                  <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
                </svg>
              )}
            </div>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
              @{authorHandle}
            </span>
          </div>
          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-primary)', textDecoration: 'none', flexShrink: 0 }}
          >
            <svg style={{ width: '20px', height: '20px', fill: 'var(--color-primary)' }} viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
        </div>

        {/* Tweet text */}
        <p style={{
          color: 'var(--color-text-primary)',
          fontSize: '15px',
          lineHeight: 1.5,
          margin: '0 0 12px 0',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word'
        }}>
          {tweetText}
        </p>

        {/* Footer with date, likes, retweets */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          color: 'var(--color-text-secondary)',
          fontSize: '13px',
          paddingTop: '12px',
          borderTop: '1px solid var(--color-border-base)'
        }}>
          <span>{createdAt}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>❤️</span>
            <span>{likes}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🔁</span>
            <span>{retweets}</span>
          </span>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

/**
 * TweetCard TipTap Extension
 */
export const TweetCard = Node.create({
  name: 'tweetCard',

  group: 'block',

  atom: true,

  draggable: false,

  addAttributes() {
    return {
      authorName: {
        default: '',
      },
      authorHandle: {
        default: '',
      },
      authorAvatar: {
        default: '',
      },
      tweetText: {
        default: '',
      },
      tweetUrl: {
        default: '',
      },
      createdAt: {
        default: '',
      },
      likes: {
        default: '0',
      },
      retweets: {
        default: '0',
      },
      verified: {
        default: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.tweet-card',
        getAttrs: (dom) => ({
          authorName: dom.getAttribute('data-author-name') || '',
          authorHandle: dom.getAttribute('data-author-handle') || '',
          authorAvatar: dom.getAttribute('data-author-avatar') || '',
          tweetText: dom.getAttribute('data-tweet-text') || '',
          tweetUrl: dom.getAttribute('data-tweet-url') || '',
          createdAt: dom.getAttribute('data-created-at') || '',
          likes: dom.getAttribute('data-likes') || '0',
          retweets: dom.getAttribute('data-retweets') || '0',
          verified: dom.getAttribute('data-verified') === 'true',
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ class: 'tweet-card' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TweetCardComponent);
  },
});
