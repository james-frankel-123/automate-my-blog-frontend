import React, { useState, useCallback } from 'react';
import { Button, Card, Typography, Space, Divider, Alert, Input, Collapse } from 'antd';
import { ArrowLeftOutlined, ClearOutlined, PlayCircleOutlined, SendOutlined } from '@ant-design/icons';
import { extractStreamChunk, extractStreamCompleteContent, normalizeContentString } from '../../utils/streamingUtils';
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
 * Example event stream: backend streams ``` then "json" then newline then {
 * then newline then keys (title, meta, …) then "content" and its value.
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
  { field: 'content', content: '# Example\n\nThis is the **body** to display in the Rendered preview.' },
  { field: 'content', content: '"' },
  { field: 'content', content: '\n' },
  { field: 'content', content: '}' },
  { field: 'content', content: '\n' },
  { field: 'content', content: '```' },
];

function StreamingTestbed() {
  const [content, setContent] = useState('');
  const [lastChunk, setLastChunk] = useState('');
  const [error, setError] = useState(null);
  const [streamChunks, setStreamChunks] = useState([]);

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

  const normalizedForPreview = normalizeContentString(content) || content;

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
          Verify that stream chunks are parsed correctly and only displayable content appears in the preview.
          Raw JSON or key-value text should never show.
        </Text>

        {error && (
          <Alert type="error" message={error} closable onClose={() => setError(null)} style={{ marginBottom: 16 }} />
        )}

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

        <Card size="small" title="Simulate stream" style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={runSimulatedStream}>
            Run simulated content-chunk stream
          </Button>
          <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
            Sends a sequence of {'{ field: "content", content: "…" }'} chunks so you see typing effect and rendered result.
          </Text>
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

        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ClearOutlined />} onClick={clearAll}>
            Clear
          </Button>
        </Space>

        <Collapse
          style={{ marginBottom: 16 }}
          items={[
            {
              key: 'chunks',
              label: `Content stream chunks (${streamChunks.length})`,
              children: (
                <Input.TextArea
                  readOnly
                  value={streamChunks.length ? streamChunks.join('\n') : '(no chunks yet — send a chunk or run simulated stream)'}
                  rows={12}
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
              ),
            },
          ]}
        />

        <Divider>Preview (same as Posts tab)</Divider>

        <Card size="small" title="Rendered preview" style={{ marginBottom: 16 }}>
          <div style={{ color: '#fff' }}>
            <HTMLPreview
              content={normalizedForPreview || 'Stream content above to see preview.'}
              forceMarkdown={true}
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
