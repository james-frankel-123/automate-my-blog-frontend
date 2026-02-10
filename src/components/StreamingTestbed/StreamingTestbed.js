import React, { useState, useCallback, useRef } from 'react';
import { getStreamChunkContentOnly } from '../../utils/streamingUtils';
import { Button, Card, Typography, Space, Divider, Alert, Input, Collapse } from 'antd';
import { ArrowLeftOutlined, ClearOutlined, PlayCircleOutlined, SendOutlined, ApiOutlined, StopOutlined, LoginOutlined, LogoutOutlined } from '@ant-design/icons';
import { extractStreamChunk, extractStreamCompleteContent, normalizeContentString } from '../../utils/streamingUtils';
import api from '../../services/api';
import { contentAPI } from '../../services/workflowAPI';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from '../Auth/AuthModal';
import StreamingPreview from './StreamingPreview';
import RelatedContentStepsPanel, { STATUS as RelatedContentStepStatus } from '../shared/RelatedContentStepsPanel';
import { systemVoice } from '../../copy/systemVoice';

const { Text } = Typography;

/** Minimal website analysis so production startBlogStream and search streams accept the request (same shape as Posts tab). */
const MINIMAL_WEBSITE_ANALYSIS = {
  businessType: 'Business',
  businessName: 'Test',
  targetAudience: 'General Audience',
  contentFocus: 'Content',
  brandVoice: 'Professional',
  decisionMakers: 'General Audience',
};

/** Preset chunk payloads to simulate backend formats */
const PRESETS = {
  chunkContent: { content: 'Hello ' },
  chunkText: { text: 'world. ' },
  chunkDelta: { delta: 'Streaming ' },
  chunkFieldContent: { field: 'content', content: 'content ' },
  chunkOpenAI: { choices: [{ delta: { content: 'OpenAI ' }, index: 0 }] },
  // These should NOT appear as raw text (parsing should extract or drop)
  keyValueFragment: '"title": "My Post", "content": "# Top10 Interactive AI Learning"',
  keyValueNoContent: '"title": "Only Title", "subtitle": "Only Sub"',
  bareLabel: 'content',
  jsonStringWithContent: { content: '{"content":"Extracted from JSON"}' },
  jsonStringNoContent: { content: '{"type":"doc","content":[{"type":"paragraph"}]}' },
};

/**
 * Long markdown body for full streaming test (headings, paragraphs, lists, bold, links).
 * Includes hero image placeholder so the testbed demonstrates hero slot → image swap.
 * Split into chunks so the stream builds up over time.
 */
const LONG_CONTENT_CHUNKS = [
  '# Streaming test article\n\n',
  'This is a **longer** body so you can fully test the streaming preview. ',
  'The content should render as markdown *while* it streams, not as raw text.\n\n',
  '![IMAGE:hero_image:Professional photograph of a team collaborating.]\n\n',
  '## Section one\n\n',
  'First paragraph: Lorem ipsum dolor sit amet, consectetur adipiscing elit. ',
  'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.\n\n',
  'Second paragraph: Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore. ',
  'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim.\n\n',
  '## Section two\n\n',
  'Here is a list:\n\n',
  '- **Item one**: streaming should show markdown as it arrives.\n',
  '- **Item two**: no raw `#` or `**` in the preview.\n',
  '- **Item three**: headings, bold, and links render correctly.\n\n',
  '[TWEET:0]\n\n',
  '[VIDEO:0]\n\n',
  '## Section three\n\n',
  'Paragraph. You can scroll the Rendered preview while the stream is running to verify ',
  'that earlier content is already rendered. [Example link](https://example.com) and more text.\n\n',
  '## Section four\n\n',
  'More filler: Pellentesque habitant morbi tristique senectus et netus et malesuada fames. ',
  'Turpis egestas maecenas pharetra convallis posuere. Nisl purus in mollis nunc sed id semper.\n\n',
  'Another paragraph: Arcu dictum varius duis at consectetur lorem donec massa. ',
  'Risus pretium quam vulputate dignissim suspendisse in est ante in.\n\n',
  '## Section five\n\n',
  '> Blockquote: The frontend should never show raw JSON or key-value text in the preview.\n\n',
  'After the blockquote, more prose. Nulla facilisi nullam vehicula ipsum a arcu cursus. ',
  'Commodo sed egestas egestas fringilla phasellus faucibus scelerisque eleifend.\n\n',
  '[VIDEO:1]\n\n',
  '## Section six\n\n',
  'Second list:\n\n',
  '- Alpha: first item in the list.\n',
  '- Beta: second item with **emphasis**.\n',
  '- Gamma: third item.\n',
  '- Delta: fourth item for extra length.\n\n',
  '## Section seven\n\n',
  'Long paragraph: At volutpat diam ut venenatis tellus in metus vulputate. ',
  'Eu scelerisque felis imperdiet proin fermentum leo vel. ',
  'Magna fringilla urna porttitor rhoncus dolor purus non enim. ',
  'Risus at ultrices mi tempus imperdiet nulla malesuada pellentesque elit.\n\n',
  '## Section eight\n\n',
  'Final section. You can scroll the Rendered preview while the stream is running to verify ',
  'that earlier content is already rendered and that markdown (headings, lists, bold, links) ',
  'appears correctly throughout. [Another link](https://example.com) and more text. ',
  'End of test content.',
];

/**
 * Example event stream: backend streams ``` then "json" then newline then {
 * then newline then keys (title, meta, …) then "content" and its value (many chunks).
 * We append all chunks; display = normalizeContentString(accumulated) → only .content.
 */
const SIMULATED_STREAM = [
  { field: 'content', content: '```' },
  { field: 'content', content: 'json' },
  { field: 'content', content: '\n' },
  { field: 'content', content: '{' },
  { field: 'content', content: '\n' },
  { field: 'content', content: '  ' },
  { field: 'content', content: '"' },
  { field: 'content', content: 'title' },
  { field: 'content', content: '"' },
  { field: 'content', content: ': ' },
  { field: 'content', content: '"' },
  { field: 'content', content: 'Example Title' },
  { field: 'content', content: '"' },
  { field: 'content', content: ',\n  ' },
  { field: 'content', content: '"' },
  { field: 'content', content: 'content' },
  { field: 'content', content: '"' },
  { field: 'content', content: ': ' },
  { field: 'content', content: '"' },
  ...LONG_CONTENT_CHUNKS.map((chunk) => ({ field: 'content', content: chunk })),
  { field: 'content', content: '"' },
  { field: 'content', content: '\n' },
  { field: 'content', content: '}' },
  { field: 'content', content: '\n' },
  { field: 'content', content: '```' },
];

/** Sample image URL for testing hero image placeholder → image swap in the testbed */
const SAMPLE_HERO_IMAGE_URL = 'https://picsum.photos/800/400';

/** Sample related articles for testbed (same shape as news search stream: url, title, sourceName, publishedAt, urlToImage, description) */
const SAMPLE_RELATED_ARTICLES = [
  { url: 'https://example.com/article-1', title: 'Streaming APIs and Real-Time Content', sourceName: 'Tech News', publishedAt: '2024-01-15T12:00:00Z', urlToImage: 'https://picsum.photos/400/225?random=1', description: 'How streaming changes how we build products.' },
  { url: 'https://example.com/article-2', title: 'Frontend Hand-offs for SSE Streams', sourceName: 'Dev Blog', publishedAt: '2024-01-14T09:00:00Z', description: 'Same pattern as tweets, YouTube, and topics.' },
];
/** Sample related tweets for testbed (same shape as Posts tab: text or { text, url? }) */
const SAMPLE_RELATED_TWEETS = [
  { text: 'Streaming content in real time changes how we build products. Great to see this in action.', url: 'https://twitter.com/i/status/1' },
  { text: 'The future of content is real-time. Markdown rendering while streaming is exactly right.', url: 'https://twitter.com/i/status/2' },
  { text: 'Hero images + tweet context in blog generation = better posts. Keep it up.', url: 'https://twitter.com/i/status/3' },
];

/** Sample related videos for testbed (same shape as YouTube search stream: url, videoId, title, channelTitle, thumbnailUrl, viewCount, duration) */
const SAMPLE_RELATED_VIDEOS = [
  { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', videoId: 'dQw4w9WgXcQ', title: 'Streaming APIs in Practice', channelTitle: 'Dev Channel', thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', viewCount: 12000, duration: '5m 30s' },
  { url: 'https://www.youtube.com/watch?v=abc123', videoId: 'abc123', title: 'Real-time Content Generation', channelTitle: 'Tech Talks', thumbnailUrl: 'https://i.ytimg.com/vi/abc123/mqdefault.jpg', viewCount: 5400, duration: '8m' },
];

const DEFAULT_LIVE_TOPIC_TITLE = 'How to test the streaming API';

function StreamingTestbed() {
  const { user, logout } = useAuth();
  const organizationId = user?.organizationId || user?.id;

  const [content, setContent] = useState('');
  const [lastChunk, setLastChunk] = useState('');
  const [error, setError] = useState(null);
  const [streamChunks, setStreamChunks] = useState([]);
  const [heroImageUrl, setHeroImageUrl] = useState(SAMPLE_HERO_IMAGE_URL);
  const [liveStreaming, setLiveStreaming] = useState(false);
  const [liveStreamError, setLiveStreamError] = useState(null);
  const [liveTopicTitle, setLiveTopicTitle] = useState(DEFAULT_LIVE_TOPIC_TITLE);
  const [contentSource, setContentSource] = useState(null); // 'simulated' | 'live' | null
  const [liveRelatedTweets, setLiveRelatedTweets] = useState([]);
  const [liveRelatedArticles, setLiveRelatedArticles] = useState([]);
  const [liveRelatedVideos, setLiveRelatedVideos] = useState([]);
  const [liveOrganizationCTAs, setLiveOrganizationCTAs] = useState([]);
  const [relatedContentSteps, setRelatedContentSteps] = useState([]);
  const streamClosesRef = useRef([]);
  const articlesTimedOutRef = useRef(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const appendChunk = useCallback((data) => {
    setError(null);
    try {
      const payload = typeof data === 'string' && data.trim().startsWith('{') ? JSON.parse(data) : data;
      setStreamChunks((prev) => [...prev, `content-chunk\t${JSON.stringify(payload)}`]);
      const chunk = extractStreamChunk(payload);
      setLastChunk(chunk === '' ? '(empty – not appended)' : chunk);
      if (chunk) setContent((prev) => prev + chunk);
    } catch (e) {
      setError(e.message || 'Invalid JSON');
      setLastChunk('(parse error)');
    }
  }, []);

  const setComplete = useCallback((data) => {
    setError(null);
    try {
      const payload = typeof data === 'string' && data.trim().startsWith('{') ? JSON.parse(data) : data;
      setStreamChunks((prev) => [...prev, `complete\t${JSON.stringify(payload)}`]);
      const full = extractStreamCompleteContent(payload);
      setLastChunk(full === '' ? '(empty)' : full.slice(0, 80) + (full.length > 80 ? '…' : ''));
      if (full) setContent(full);
    } catch (e) {
      setError(e.message || 'Invalid JSON');
      setLastChunk('(parse error)');
    }
  }, []);

  const runSimulatedStream = useCallback(async () => {
    setError(null);
    setContent('');
    setLastChunk('(simulating…)');
    setStreamChunks(SIMULATED_STREAM.map((payload) => `content-chunk\t${JSON.stringify(payload)}`));
    setContentSource('simulated');
    let accumulated = '';
    for (let i = 0; i < SIMULATED_STREAM.length; i++) {
      const chunk = extractStreamChunk(SIMULATED_STREAM[i]);
      if (chunk) accumulated += chunk;
      setContent(accumulated);
      await new Promise((r) => setTimeout(r, 80));
    }
    setLastChunk('(done)');
  }, []);

  const clearAll = useCallback(() => {
    setContent('');
    setLastChunk('');
    setError(null);
    setStreamChunks([]);
    setLiveStreamError(null);
    setContentSource(null);
    setLiveRelatedTweets([]);
    setLiveRelatedArticles([]);
    setLiveRelatedVideos([]);
    setRelatedContentSteps([]);
  }, []);

  const startLiveStream = useCallback(async () => {
    setLiveStreamError(null);
    setError(null);
    setContent('');
    setLastChunk('(connecting…)');
    setStreamChunks([]);
    setLiveStreaming(true);
    setContentSource('live');
    setLiveRelatedTweets([]);
    setLiveRelatedArticles([]);
    setLiveRelatedVideos([]);
    setLiveOrganizationCTAs([]);
    setRelatedContentSteps([]);
    streamClosesRef.current = [];

    if (!organizationId) {
      setLiveStreamError('Sign in required. The API requires topic, businessInfo, and organizationId.');
      setLiveStreaming(false);
      return;
    }

    const topic = { id: 'testbed-live', title: liveTopicTitle || DEFAULT_LIVE_TOPIC_TITLE };
    const websiteAnalysisData = MINIMAL_WEBSITE_ANALYSIS;

    // Same flow as Posts tab: fetch tweets, articles, videos, CTAs first with visible steps, then start blog stream with preloaded data.
    const fetchSteps = [
      { id: 'ctas', label: systemVoice.content.fetchCTAs, status: RelatedContentStepStatus.PENDING },
      { id: 'tweets', label: systemVoice.content.fetchTweets, status: RelatedContentStepStatus.PENDING },
      { id: 'articles', label: systemVoice.content.fetchArticles, status: RelatedContentStepStatus.PENDING },
      { id: 'videos', label: systemVoice.content.fetchVideos, status: RelatedContentStepStatus.PENDING },
    ];
    setRelatedContentSteps(fetchSteps);

    const runFetchCTAs = () =>
      api
        .getOrganizationCTAs(organizationId)
        .then((r) => {
          const ctas = r?.ctas || [];
          setLiveOrganizationCTAs(ctas);
          setRelatedContentSteps((prev) =>
            prev.map((s) => (s.id === 'ctas' ? { ...s, status: RelatedContentStepStatus.DONE, count: ctas.length } : s))
          );
          return ctas;
        })
        .catch(() => {
          setRelatedContentSteps((prev) =>
            prev.map((s) => (s.id === 'ctas' ? { ...s, status: RelatedContentStepStatus.FAILED } : s))
          );
          return [];
        });

    // Use combined tweets+videos endpoint (backend PR #178) for speed
    const runTweetsAndVideos = () =>
      api.fetchRelatedContent(topic, websiteAnalysisData, { maxTweets: 3, maxVideos: 5 })
        .then(({ tweets: tweetsData, videos: videosData }) => {
          const tweetsArr = Array.isArray(tweetsData) ? tweetsData : [];
          const videosArr = Array.isArray(videosData) ? videosData : [];
          setLiveRelatedTweets(tweetsArr);
          setLiveRelatedVideos(videosArr);
          setRelatedContentSteps((prev) =>
            prev.map((s) => {
              if (s.id === 'tweets') return { ...s, status: RelatedContentStepStatus.DONE, count: tweetsArr.length };
              if (s.id === 'videos') return { ...s, status: RelatedContentStepStatus.DONE, count: videosArr.length };
              return s;
            })
          );
          return [tweetsArr, videosArr];
        })
        .catch(() => {
          setRelatedContentSteps((prev) =>
            prev.map((s) =>
              s.id === 'tweets' || s.id === 'videos' ? { ...s, status: RelatedContentStepStatus.FAILED } : s
            )
          );
          return [[], []];
        });

    const ONBOARDING_ARTICLES_TIMEOUT_MS = 10000;

    const runArticleStream = () =>
      api.searchNewsArticlesForTopicStream(topic, websiteAnalysisData, 5)
        .then(({ connectionId, streamUrl }) =>
          new Promise((resolve) => {
            setRelatedContentSteps((prev) =>
              prev.map((s) => (s.id === 'articles' ? { ...s, status: RelatedContentStepStatus.RUNNING } : s))
            );
            const { close } = api.connectToStream(connectionId, {
              onComplete: (data) => {
                if (articlesTimedOutRef.current) return;
                const articles = data?.articles ?? data?.data?.articles ?? [];
                const arr = Array.isArray(articles) ? articles : [];
                setLiveRelatedArticles(arr);
                setRelatedContentSteps((prev) =>
                  prev.map((s) => (s.id === 'articles' ? { ...s, status: RelatedContentStepStatus.DONE, count: arr.length } : s))
                );
                resolve(arr);
              },
              onError: () => {
                if (articlesTimedOutRef.current) return;
                setRelatedContentSteps((prev) =>
                  prev.map((s) => (s.id === 'articles' ? { ...s, status: RelatedContentStepStatus.FAILED } : s))
                );
                resolve([]);
              },
            }, { streamUrl });
            streamClosesRef.current.push(close);
          })
        )
        .catch(() => {
          if (articlesTimedOutRef.current) return [];
          setRelatedContentSteps((prev) =>
            prev.map((s) => (s.id === 'articles' ? { ...s, status: RelatedContentStepStatus.FAILED } : s))
          );
          return [];
        });

    const runArticleStreamWithTimeout = () => {
      articlesTimedOutRef.current = false;
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          articlesTimedOutRef.current = true;
          setRelatedContentSteps((prev) =>
            prev.map((s) => (s.id === 'articles' ? { ...s, status: RelatedContentStepStatus.SKIPPED } : s))
          );
          resolve([]);
        }, ONBOARDING_ARTICLES_TIMEOUT_MS);
      });
      return Promise.race([runArticleStream(), timeoutPromise]);
    };

    setRelatedContentSteps((prev) =>
      prev.map((s) =>
        s.id === 'tweets' || s.id === 'videos' ? { ...s, status: RelatedContentStepStatus.RUNNING } : s
      )
    );

    // Same workflow as onboarding: await related content in parallel (tweets+videos, articles with 10s cap), then start blog stream with preloaded data so backend can embed [TWEET:n], [ARTICLE:n], [VIDEO:n].
    let tweetsArr = [];
    let videosArr = [];
    let articlesArr = [];
    let ctasArr = [];

    try {
      const [ctas, tweetsVideosResult, articlesResult] = await Promise.all([
        runFetchCTAs(),
        runTweetsAndVideos(),
        runArticleStreamWithTimeout(),
      ]);
      ctasArr = Array.isArray(ctas) ? ctas : [];
      tweetsArr = Array.isArray(tweetsVideosResult?.[0]) ? tweetsVideosResult[0] : [];
      videosArr = Array.isArray(tweetsVideosResult?.[1]) ? tweetsVideosResult[1] : [];
      articlesArr = Array.isArray(articlesResult) ? articlesResult : [];
    } catch (_) {
      articlesArr = [];
    }

    try {
      setLastChunk('(streaming…)');

      const enhancementOptions = {
        organizationId,
        preloadedTweets: Array.isArray(tweetsArr) ? tweetsArr : [],
        preloadedArticles: Array.isArray(articlesArr) ? articlesArr : [],
        preloadedVideos: Array.isArray(videosArr) ? videosArr : [],
        ctas: Array.isArray(ctasArr) ? ctasArr : [],
      };

      const { connectionId } = await contentAPI.startBlogStream(
        topic,
        websiteAnalysisData,
        null,
        {},
        enhancementOptions
      );
      setRelatedContentSteps([]);
      const { close } = api.connectToStream(connectionId, {
        onChunk: (data) => {
          const chunk = getStreamChunkContentOnly(data);
          if (chunk) {
            setStreamChunks((prev) => [...prev, `content-chunk\t${JSON.stringify(data)}`]);
            setContent((prev) => prev + chunk);
          }
        },
        onComplete: (data) => {
          const full = extractStreamCompleteContent(data);
          if (full) setContent(full);
          setLastChunk('(done)');
          setLiveStreaming(false);
        },
        onError: (errData) => {
          setLiveStreamError(errData?.message || 'Stream error');
          setLastChunk('(error)');
          setLiveStreaming(false);
        },
      });
      streamClosesRef.current.push(close);
    } catch (err) {
      setLiveStreamError(err?.message || 'Failed to start stream');
      setLastChunk('(error)');
      setLiveStreaming(false);
      setRelatedContentSteps([]);
    }
  }, [liveTopicTitle, organizationId]);

  const stopLiveStream = useCallback(() => {
    streamClosesRef.current.forEach((close) => { if (typeof close === 'function') close(); });
    streamClosesRef.current = [];
    setLiveStreaming(false);
  }, []);

  // Always show only extracted .content (never raw accumulated string) so markdown renders during stream
  const normalizedForPreview = normalizeContentString(content);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background-body)', padding: 24 }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Button
            icon={<ArrowLeftOutlined />}
            type="text"
            onClick={() => { window.location.href = '/'; }}
          >
            Back to app
          </Button>
          {user ? (
            <>
              <Text type="secondary" style={{ fontSize: 13 }}>{user.email}</Text>
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={() => logout()}
              >
                Sign out
              </Button>
            </>
          ) : (
            <Button
              type="primary"
              ghost
              icon={<LoginOutlined />}
              onClick={() => setShowAuthModal(true)}
            >
              Sign in
            </Button>
          )}
        </Space>
        {showAuthModal && (
          <AuthModal
            open={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            defaultTab="login"
            context="testbed"
            onSuccess={() => setShowAuthModal(false)}
          />
        )}

        <Typography.Title level={3} style={{ marginBottom: 8 }}>
          Streaming parser testbed
        </Typography.Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          Run the simulated stream to see parsed content and hero image placeholder → image swap in the preview.
        </Text>

        {error && (
          <Alert type="error" message={error} closable onClose={() => setError(null)} style={{ marginBottom: 16 }} />
        )}

        <Card size="small" style={{ marginBottom: 24 }}>
          <Space wrap>
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={runSimulatedStream}>
              Run simulated content-chunk stream
            </Button>
            <Button icon={<ClearOutlined />} onClick={clearAll}>
              Clear
            </Button>
          </Space>
        </Card>

        <Card size="small" title="Stream from API (onboarding workflow)" style={{ marginBottom: 24 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            Same workflow as onboarding: fetch tweets, articles (10s cap), and videos first with visible steps, then start blog stream with that preloaded data. Tweets are passed to the backend and rendered with react-tweet in the preview when content includes [TWEET:n]. Backend: {process.env.REACT_APP_API_URL || 'default'}. Sign in required.
          </Text>
          {!organizationId && (
            <Alert type="info" message="Sign in to use Stream from API" description="The blog generate-stream API requires topic, businessInfo, and organizationId. Use the Sign in button above to open the login modal." style={{ marginBottom: 12 }} />
          )}
          <Space wrap align="center" style={{ marginBottom: 8 }}>
            <Input
              placeholder="Topic title"
              value={liveTopicTitle}
              onChange={(e) => setLiveTopicTitle(e.target.value)}
              style={{ width: 280 }}
              disabled={liveStreaming}
            />
            <Button
              type="primary"
              icon={liveStreaming ? <StopOutlined /> : <ApiOutlined />}
              onClick={liveStreaming ? stopLiveStream : startLiveStream}
              danger={liveStreaming}
              disabled={!organizationId}
            >
              {liveStreaming ? 'Stop stream' : 'Start live stream'}
            </Button>
          </Space>
          {liveStreaming && relatedContentSteps.length > 0 && (
            <RelatedContentStepsPanel
              steps={relatedContentSteps}
              title="Preparing related content"
              ctas={liveOrganizationCTAs}
            />
          )}
          {liveStreaming && (
            <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
              Streaming… Chunks appear in Rendered preview below. Last chunk: {lastChunk || '—'}
            </Text>
          )}
          {liveStreamError && (
            <Alert
              type="error"
              message={liveStreamError}
              closable
              onClose={() => setLiveStreamError(null)}
              style={{ marginTop: 12 }}
            />
          )}
        </Card>

        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ClearOutlined />} onClick={clearAll}>
            Clear
          </Button>
        </Space>

        <Card size="small" title="Related tweets (sample)" style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            In the Posts tab these are searched in parallel; placeholders [TWEET:0], [TWEET:1] in content are replaced when tweets arrive.
          </Text>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {SAMPLE_RELATED_TWEETS.map((t, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                {typeof t === 'string' ? t : (t?.text || t?.content || '').slice(0, 120)}
                {(t?.text?.length > 120 || t?.content?.length > 120) ? '…' : ''}
              </li>
            ))}
          </ul>
        </Card>

        <Card size="small" title="Related videos (sample)" style={{ marginBottom: 24 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            [VIDEO:0], [VIDEO:1] in content show animated loading placeholders until videos arrive; then video cards. Different look from tweet placeholders.
          </Text>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {SAMPLE_RELATED_VIDEOS.map((v, i) => (
              <li key={v?.videoId || i} style={{ marginBottom: 6 }}>
                {v?.title} — {v?.channelTitle}
                {v?.viewCount != null ? ` · ${Number(v.viewCount).toLocaleString()} views` : ''}
              </li>
            ))}
          </ul>
        </Card>

        <Collapse
          style={{ marginBottom: 24 }}
          items={[
            {
              key: 'advanced',
              label: 'Advanced: send chunks, hero image URL, custom payload',
              children: (
                <>
                  <Card size="small" title="Send chunk (append)" style={{ marginBottom: 16 }}>
                    <Space wrap>
                      <Button onClick={() => appendChunk(PRESETS.chunkContent)}>{"{ content }"}</Button>
                      <Button onClick={() => appendChunk(PRESETS.chunkText)}>{"{ text }"}</Button>
                      <Button onClick={() => appendChunk(PRESETS.chunkDelta)}>{"{ delta }"}</Button>
                      <Button onClick={() => appendChunk(PRESETS.chunkFieldContent)}>{"{ field, content }"}</Button>
                      <Button onClick={() => appendChunk(PRESETS.chunkOpenAI)}>OpenAI choices</Button>
                      <Button onClick={() => appendChunk(PRESETS.keyValueFragment)}>Key-value (with content)</Button>
                      <Button onClick={() => appendChunk(PRESETS.keyValueNoContent)}>Key-value (no content)</Button>
                      <Button onClick={() => appendChunk(PRESETS.bareLabel)}>Bare "content"</Button>
                      <Button onClick={() => appendChunk(PRESETS.jsonStringWithContent)}>JSON string (content)</Button>
                      <Button onClick={() => appendChunk(PRESETS.jsonStringNoContent)}>JSON string (doc)</Button>
                    </Space>
                    <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                      Last extracted chunk: {lastChunk || '—'}
                    </div>
                  </Card>
                  <Card size="small" title="Hero image URL" style={{ marginBottom: 16 }}>
                    <Space wrap align="center" style={{ width: '100%' }}>
                      <Input
                        placeholder="Hero image URL"
                        value={heroImageUrl}
                        onChange={(e) => setHeroImageUrl(e.target.value)}
                        style={{ width: 320 }}
                      />
                      <Button onClick={() => setHeroImageUrl(SAMPLE_HERO_IMAGE_URL)}>Use sample image</Button>
                      <Button onClick={() => setHeroImageUrl('')}>Clear</Button>
                    </Space>
                  </Card>
                  <Card size="small" title="Custom payload (JSON or object)" style={{ marginBottom: 16 }}>
                    <Input.TextArea
                      id="streaming-testbed-custom"
                      placeholder={'e.g. {"content": "Hello"} or "content"'}
                      rows={3}
                      style={{ marginBottom: 8, fontFamily: 'monospace' }}
                    />
                    <Space>
                      <Button
                        icon={<SendOutlined />}
                        onClick={() => {
                          const el = document.getElementById('streaming-testbed-custom');
                          const raw = el?.value?.trim();
                          if (!raw) return;
                          appendChunk(raw.startsWith('{') ? raw : JSON.stringify({ content: raw }));
                        }}
                      >
                        Send as chunk
                      </Button>
                      <Button
                        onClick={() => {
                          const el = document.getElementById('streaming-testbed-custom');
                          const raw = el?.value?.trim();
                          if (!raw) return;
                          setComplete(raw.startsWith('{') ? raw : JSON.stringify({ content: raw }));
                        }}
                      >
                        Send as complete
                      </Button>
                    </Space>
                  </Card>
                  <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    Content stream chunks ({streamChunks.length})
                  </div>
                  <Input.TextArea
                    readOnly
                    value={streamChunks.length ? streamChunks.join('\n') : '(no chunks yet — send a chunk or run simulated stream)'}
                    rows={8}
                    style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 0 }}
                  />
                </>
              ),
            },
          ]}
        />

        <Divider>Results</Divider>

        <Card size="small" title="Related articles (sample)" style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            [ARTICLE:0], [ARTICLE:1] in content show animated loading placeholders until articles arrive; then article cards.
          </Text>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {SAMPLE_RELATED_ARTICLES.map((a, i) => (
              <li key={a?.url || i} style={{ marginBottom: 6 }}>
                {a?.title} — {a?.sourceName}
                {a?.publishedAt ? ` · ${new Date(a.publishedAt).toLocaleDateString()}` : ''}
              </li>
            ))}
          </ul>
        </Card>

        <Card size="small" title="Rendered preview" style={{ marginBottom: 16 }}>
          <div style={{ color: '#fff' }}>
            <StreamingPreview
              content={normalizedForPreview || (content ? 'Streaming…' : 'Stream content above to see preview.')}
              relatedArticles={contentSource === 'live' ? liveRelatedArticles : SAMPLE_RELATED_ARTICLES}
              relatedVideos={contentSource === 'live' ? liveRelatedVideos : SAMPLE_RELATED_VIDEOS}
              relatedTweets={contentSource === 'live' ? liveRelatedTweets : SAMPLE_RELATED_TWEETS}
              heroImageUrl={heroImageUrl || undefined}
              style={{ minHeight: 120, color: '#fff' }}
            />
          </div>
        </Card>

        <Card size="small" title="Accumulated raw string">
          <pre
            style={{
              margin: 0,
              padding: 12,
              background: 'var(--color-bg-container)',
              borderRadius: 6,
              fontSize: 12,
              maxHeight: 200,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {content || '(empty)'}
          </pre>
        </Card>
      </div>
    </div>
  );
}

export default StreamingTestbed;
