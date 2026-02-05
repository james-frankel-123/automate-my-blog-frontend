import React, { useState, useCallback } from 'react';
import { Button, Card, Typography, Space, Divider, Alert, Input, Collapse } from 'antd';
import { ArrowLeftOutlined, ClearOutlined, PlayCircleOutlined, SendOutlined } from '@ant-design/icons';
import { extractStreamChunk, extractStreamCompleteContent, normalizeContentString } from '../../utils/streamingUtils';
import { replaceArticlePlaceholders } from '../../utils/articlePlaceholders';
import HTMLPreview from '../HTMLPreview/HTMLPreview';

const { Text } = Typography;

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
  '[ARTICLE:0]\n\n',
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
  '[ARTICLE:1]\n\n',
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

function StreamingTestbed() {
  const [content, setContent] = useState('');
  const [lastChunk, setLastChunk] = useState('');
  const [error, setError] = useState(null);
  const [streamChunks, setStreamChunks] = useState([]);
  const [heroImageUrl, setHeroImageUrl] = useState(SAMPLE_HERO_IMAGE_URL);

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
  }, []);

  // Always show only extracted .content (never raw accumulated string) so markdown renders during stream
  const normalizedForPreview = normalizeContentString(content);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background-body)', padding: 24 }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <Space style={{ marginBottom: 16 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            type="text"
            onClick={() => { window.location.href = '/'; }}
          >
            Back to app
          </Button>
        </Space>

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
            <HTMLPreview
              content={replaceArticlePlaceholders(
                normalizedForPreview || (content ? 'Streaming…' : 'Stream content above to see preview.'),
                SAMPLE_RELATED_ARTICLES
              )}
              relatedArticles={SAMPLE_RELATED_ARTICLES}
              forceMarkdown={true}
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
