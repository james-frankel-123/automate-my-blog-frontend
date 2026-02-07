/**
 * Component Library — test, examine, and iterate on shared components.
 * Uses the exact same component imports as the real app so changes here update the app everywhere.
 * Route: /component-library
 */
import React, { useState } from 'react';
import { Card, Collapse, Typography, Space, Button, Input, Tag, Alert, Divider } from 'antd';

// Same imports as real pages — do not duplicate; import from source
import { EmptyState, AnalysisEmptyState } from '../EmptyStates';
import ThinkingPanel from '../shared/ThinkingPanel';
import StreamingText from '../shared/StreamingText';
import SystemHint from '../Dashboard/SystemHint';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import MarkdownPreview from '../MarkdownPreview/MarkdownPreview';
import { useSystemHint } from '../../contexts/SystemHintContext';
import { systemVoice } from '../../copy/systemVoice';

const { Title, Text, Paragraph } = Typography;

const sectionStyle = { marginBottom: 24 };

function ComponentLibrary() {
  const { setHint } = useSystemHint();
  const [activeKeys, setActiveKeys] = useState(['buttons', 'empty-states', 'thinking-panel']);

  return (
    <div style={{ padding: '24px 16px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={2} style={{ marginBottom: 8 }}>
            Component Library
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Same components as the app. Edit a component in the codebase and see it update here and in the app.
          </Paragraph>
        </div>
        <Button type="link" href="/" style={{ padding: 0 }}>
          ← Back to app
        </Button>
      </div>

      <SystemHint />

      <Collapse
        activeKey={activeKeys}
        onChange={setActiveKeys}
        items={[
          {
            key: 'buttons',
            label: 'Buttons (Ant Design)',
            children: (
              <div style={sectionStyle}>
                <Space wrap size="middle">
                  <Button type="primary">Primary</Button>
                  <Button>Default</Button>
                  <Button type="dashed">Dashed</Button>
                  <Button type="link">Link</Button>
                  <Button type="primary" loading>Loading</Button>
                  <Button danger>Danger</Button>
                </Space>
              </div>
            ),
          },
          {
            key: 'inputs',
            label: 'Inputs (Ant Design)',
            children: (
              <div style={sectionStyle}>
                <Space direction="vertical" style={{ width: '100%', maxWidth: 360 }}>
                  <Input placeholder="Placeholder" />
                  <Input.TextArea placeholder="TextArea" rows={2} />
                  <Input.Password placeholder="Password" />
                </Space>
              </div>
            ),
          },
          {
            key: 'typography',
            label: 'Typography',
            children: (
              <div style={sectionStyle}>
                <Title level={1}>Heading 1</Title>
                <Title level={2}>Heading 2</Title>
                <Title level={3}>Heading 3</Title>
                <Paragraph>Body paragraph with <Text strong>strong</Text> and <Text type="secondary">secondary</Text>.</Paragraph>
              </div>
            ),
          },
          {
            key: 'cards-alerts-tags',
            label: 'Cards, Alerts, Tags',
            children: (
              <div style={sectionStyle}>
                <Card size="small" title="Small card" style={{ marginBottom: 12 }}>
                  Card content
                </Card>
                <Alert message="Info" type="info" showIcon style={{ marginBottom: 12 }} />
                <Space wrap>
                  <Tag color="blue">Blue</Tag>
                  <Tag color="green">Green</Tag>
                  <Tag color="red">Red</Tag>
                  <Tag color="warning">Warning</Tag>
                </Space>
              </div>
            ),
          },
          {
            key: 'empty-states',
            label: 'Empty States (app components)',
            children: (
              <div style={sectionStyle}>
                <Title level={5}>EmptyState</Title>
                <EmptyState
                  title="No items yet"
                  description="Add your first item to get started."
                  actionLabel="Add item"
                  onAction={() => {}}
                />
                <Divider />
                <Title level={5}>AnalysisEmptyState (scraping_failed)</Title>
                <AnalysisEmptyState
                  type="scraping_failed"
                  dataTestId="library-analysis-empty"
                  actions={[
                    { label: 'Try again', onClick: () => {}, primary: true },
                    { label: 'Use a different URL', onClick: () => {}, primary: false },
                  ]}
                />
              </div>
            ),
          },
          {
            key: 'thinking-panel',
            label: 'ThinkingPanel (app component)',
            children: (
              <div style={sectionStyle}>
                <ThinkingPanel
                  isActive
                  currentStep="Reading your pages…"
                  progress={45}
                  workingForYouLabel={systemVoice.analysis.workingForYou}
                  progressPreamble={systemVoice.analysis.progressPreamble}
                  progressLabel={systemVoice.analysis.progressLabel}
                  fallbackStep={systemVoice.analysis.defaultProgress}
                  dataTestId="library-thinking-panel"
                />
                <Divider />
                <Title level={5}>With thoughts</Title>
                <ThinkingPanel
                  isActive
                  thoughts={[
                    { message: 'Fetching homepage…', phase: 'scraping' },
                    { message: 'Checking meta tags.', phase: 'scraping' },
                  ]}
                  workingForYouLabel={systemVoice.analysis.workingForYou}
                  fallbackStep="Generating…"
                  dataTestId="library-thinking-panel-thoughts"
                />
              </div>
            ),
          },
          {
            key: 'system-hint',
            label: 'SystemHint (trigger below header)',
            children: (
              <div style={sectionStyle}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                  Use these to show the hint strip above; it renders the same component as the app header.
                </Text>
                <Space wrap>
                  <Button onClick={() => setHint('Sample hint message', 'hint')}>Hint</Button>
                  <Button onClick={() => setHint('Success message', 'success')}>Success</Button>
                  <Button onClick={() => setHint('Error message', 'error')}>Error</Button>
                </Space>
              </div>
            ),
          },
          {
            key: 'streaming-text',
            label: 'StreamingText (app component)',
            children: (
              <div style={sectionStyle}>
                <Paragraph>
                  Static: <StreamingText content="Done." isStreaming={false} />
                </Paragraph>
                <Paragraph>
                  Streaming: <StreamingText content="Loading…" isStreaming />
                </Paragraph>
              </div>
            ),
          },
          {
            key: 'markdown-preview',
            label: 'MarkdownPreview (app component)',
            children: (
              <div style={sectionStyle}>
                <MarkdownPreview
                  content="**Bold** and *italic*. List:\n- One\n- Two\n\n> Blockquote"
                  style={{ maxWidth: 400 }}
                />
              </div>
            ),
          },
          {
            key: 'theme-toggle',
            label: 'ThemeToggle',
            children: (
              <div style={sectionStyle}>
                <ThemeToggle />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

export default ComponentLibrary;
