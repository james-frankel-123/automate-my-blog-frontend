import React, { useState } from 'react';
import {
  Card,
  Spin,
  Alert,
  List,
  Tag,
  Skeleton,
  Typography,
  Space,
  Button,
  Input,
  Segmented
} from 'antd';
import {
  CalendarOutlined,
  LoadingOutlined,
  ReloadOutlined,
  HomeOutlined
} from '@ant-design/icons';
import ContentCalendarSection from '../Dashboard/ContentCalendarSection';

const { Text } = Typography;

/** Mock content ideas for "Ready" state (same shape as API content_ideas) */
const MOCK_IDEAS = Array.from({ length: 30 }, (_, i) => ({
  dayNumber: i + 1,
  title: `SEO-optimized blog post title for day ${i + 1} (50–60 chars)`,
  searchIntent: 'Why the audience searches for this topic.',
  format: ['how-to', 'listicle', 'guide', 'case-study', 'comparison', 'checklist'][i % 6],
  keywords: ['keyword-a', 'keyword-b'].slice(0, (i % 3) + 1)
}));

const MODES = [
  { value: 'live', label: 'Live (audience ID)' },
  { value: 'generating', label: 'Mock: Generating' },
  { value: 'ready', label: 'Mock: Ready (30 ideas)' },
  { value: 'error', label: 'Mock: Error' },
  { value: 'empty', label: 'Mock: Empty' },
  { value: 'timeout', label: 'Mock: Timeout' }
];

/**
 * Calendar testbed — dev/QA page for 30-day content calendar states.
 * Route: /calendar-testbed
 *
 * - Live: enter audience ID and render ContentCalendarSection (real API).
 * - Mock modes: render the same UIs as ContentCalendarSection (generating, ready, error, empty, timeout).
 */
export default function CalendarTestbed() {
  const [mode, setMode] = useState('ready');
  const [liveId, setLiveId] = useState('');
  const [liveName, setLiveName] = useState('');
  const [loadLive, setLoadLive] = useState(false);

  const handleLoadLive = () => {
    setLoadLive(!!liveId.trim());
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Button
          type="link"
          href="/dashboard"
          icon={<HomeOutlined />}
          style={{ padding: 0 }}
        >
          Back to Dashboard
        </Button>
        <Text strong style={{ fontSize: 18 }}>Content Calendar Testbed</Text>
      </div>

      <Card size="small" style={{ marginBottom: 24 }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          Mode
        </Text>
        <Segmented
          options={MODES}
          value={mode}
          onChange={setMode}
          block
        />
        {mode === 'live' && (
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <Input
              placeholder="Audience / strategy ID (UUID)"
              value={liveId}
              onChange={(e) => setLiveId(e.target.value)}
              style={{ width: 280 }}
            />
            <Input
              placeholder="Strategy name (optional)"
              value={liveName}
              onChange={(e) => setLiveName(e.target.value)}
              style={{ width: 200 }}
            />
            <Button type="primary" onClick={handleLoadLive}>
              Load live
            </Button>
            {loadLive && (
              <Button
                onClick={() => {
                  setLoadLive(false);
                  setLiveId('');
                }}
              >
                Clear
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Live: real ContentCalendarSection */}
      {mode === 'live' && loadLive && liveId.trim() && (
        <ContentCalendarSection
          strategyId={liveId.trim()}
          strategyName={liveName.trim() || undefined}
        />
      )}

      {/* Mock: Generating */}
      {mode === 'generating' && (
        <Card
          title={
            <Space>
              <CalendarOutlined />
              <span>30-Day Content Calendar</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Spin size="large" indicator={<LoadingOutlined spin />} />
            <div style={{ marginTop: 16, color: '#666' }}>
              Your 30-day content calendar is being generated. This usually takes 15–30 seconds.
            </div>
            <Skeleton active paragraph={{ rows: 5 }} style={{ marginTop: 24, textAlign: 'left' }} />
          </div>
        </Card>
      )}

      {/* Mock: Timeout (generating + warning) */}
      {mode === 'timeout' && (
        <Card
          title={
            <Space>
              <CalendarOutlined />
              <span>30-Day Content Calendar</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Spin size="large" indicator={<LoadingOutlined spin />} />
            <div style={{ marginTop: 16, color: '#666' }}>
              Your 30-day content calendar is being generated. This usually takes 15–30 seconds.
            </div>
            <Skeleton active paragraph={{ rows: 5 }} style={{ marginTop: 24, textAlign: 'left' }} />
          </div>
          <Alert
            message="Calendar is taking longer than expected. Refresh the page or contact support."
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Card>
      )}

      {/* Mock: Error */}
      {mode === 'error' && (
        <Card
          title={
            <Space>
              <CalendarOutlined />
              <span>30-Day Content Calendar</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Alert
            message="Something went wrong. Please try again."
            type="error"
            showIcon
            action={
              <ReloadOutlined
                style={{ cursor: 'pointer' }}
                onClick={() => setMode('ready')}
              />
            }
          />
        </Card>
      )}

      {/* Mock: Empty (no calendar yet) */}
      {mode === 'empty' && (
        <Card
          title={
            <Space>
              <CalendarOutlined />
              <span>30-Day Content Calendar</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Alert
            message="No calendar yet"
            description="Your calendar may still be generating or something went wrong. Refresh the page or contact support."
            type="info"
            showIcon
          />
        </Card>
      )}

      {/* Mock: Ready (30 ideas list) */}
      {mode === 'ready' && (
        <Card
          title={
            <Space>
              <CalendarOutlined />
              <span>30-Day Content Calendar</span>
              <Text type="secondary" style={{ fontSize: 14, fontWeight: 'normal' }}>
                — Mock strategy name
              </Text>
            </Space>
          }
          extra={
            <Text type="secondary" style={{ fontSize: 12 }}>
              Generated {new Date().toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
          }
          style={{ marginBottom: 24 }}
        >
          <List
            itemLayout="vertical"
            size="small"
            dataSource={MOCK_IDEAS}
            renderItem={(item) => (
              <List.Item
                key={item.dayNumber}
                style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 8 }}>
                  <Tag color="blue" style={{ marginRight: 0 }}>
                    Day {item.dayNumber}
                  </Tag>
                  {item.format && (
                    <Tag color="default">{String(item.format).replace(/-/g, ' ')}</Tag>
                  )}
                </div>
                <div style={{ fontWeight: 500, marginTop: 4 }}>{item.title}</div>
                {item.searchIntent && (
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                    {item.searchIntent}
                  </Text>
                )}
                {item.keywords && item.keywords.length > 0 && (
                  <Space wrap size={4} style={{ marginTop: 6 }}>
                    {item.keywords.slice(0, 5).map((kw, i) => (
                      <Tag key={i} style={{ fontSize: 11 }}>
                        {kw}
                      </Tag>
                    ))}
                  </Space>
                )}
              </List.Item>
            )}
          />
        </Card>
      )}

      {mode === 'live' && !loadLive && (
        <Alert
          message="Enter an audience/strategy ID and click Load live to test the real calendar component."
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </div>
  );
}
