import React, { useState, useEffect, useRef } from 'react';
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
  Segmented,
  Select
} from 'antd';
import {
  CalendarOutlined,
  LoadingOutlined,
  PlusOutlined,
  ReloadOutlined,
  HomeOutlined,
  TeamOutlined
} from '@ant-design/icons';
import ContentCalendarSection from '../Dashboard/ContentCalendarSection';
import autoBlogAPI from '../../services/api';

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

/** Normalize strategy from content-calendar API (snake_case or camelCase). */
function getStrategyId(s) {
  return s?.strategyId ?? s?.strategy_id ?? s?.id ?? '';
}
function getStrategyContentIdeas(s) {
  const raw = s?.contentIdeas ?? s?.content_ideas;
  return Array.isArray(raw) ? raw : [];
}
function getStrategyLabel(s) {
  if (!s) return '';
  const seg = s.targetSegment ?? s.target_segment;
  const demographics = typeof seg === 'object' ? seg?.demographics ?? seg?.psychographics : seg;
  return s.customerProblem ?? s.customer_problem ?? (typeof demographics === 'string' ? demographics : '') ?? getStrategyId(s);
}

/**
 * Calendar testbed — dev/QA page for 30-day content calendar states.
 * Route: /calendar-testbed
 *
 * - Live: enter audience ID and render ContentCalendarSection (real API).
 *   On load, looks up existing generated 30-day content via getContentCalendar; if found, auto-loads first strategy with content.
 * - Mock modes: render the same UIs as ContentCalendarSection (generating, ready, error, empty, timeout).
 */
function getAudienceLabel(aud) {
  const seg = aud.target_segment;
  const demographics =
    (typeof seg === 'object' && seg?.demographics) ||
    (typeof seg === 'string' && seg) ||
    aud.customer_problem ||
    aud.id;
  return typeof demographics === 'string'
    ? demographics
    : (demographics?.demographics || aud.customer_problem || aud.id);
}

export default function CalendarTestbed() {
  const [mode, setMode] = useState('ready');
  const [liveId, setLiveId] = useState('');
  const [liveName, setLiveName] = useState('');
  const [loadLive, setLoadLive] = useState(false);
  const [audiences, setAudiences] = useState([]);
  const [audiencesLoading, setAudiencesLoading] = useState(false);
  const [audiencesError, setAudiencesError] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const autoLoadedFromCalendarRef = useRef(false);
  const liveIdRef = useRef('');
  liveIdRef.current = liveId;

  const fetchAudiences = () => {
    setAudiencesError(null);
    setAudiencesLoading(true);
    autoBlogAPI
      .getUserAudiences({ testbed: true })
      .then((res) => {
        setAudiences(res?.audiences || []);
      })
      .catch((err) => {
        setAudiencesError(err?.message || 'Failed to load audiences');
        setAudiences([]);
      })
      .finally(() => setAudiencesLoading(false));
  };

  // In Live mode: fetch audiences and look up existing 30-day content; auto-load first strategy with content if present
  useEffect(() => {
    if (mode !== 'live') {
      autoLoadedFromCalendarRef.current = false;
      return;
    }
    fetchAudiences();

    autoBlogAPI
      .getContentCalendar({ testbed: true })
      .then((res) => {
        const list = res?.strategies ?? [];
        const withContent = list.find((s) => getStrategyContentIdeas(s).length > 0);
        if (!withContent || autoLoadedFromCalendarRef.current || liveIdRef.current.trim()) return;
        const id = getStrategyId(withContent);
        const name = getStrategyLabel(withContent);
        if (!id) return;
        autoLoadedFromCalendarRef.current = true;
        setLiveId(id);
        setLiveName(name || '');
        setLoadLive(true);
      })
      .catch(() => {});
  }, [mode]);

  const handleLoadLive = () => {
    setLoadLive(!!liveId.trim());
  };

  const handleSelectAudience = (id) => {
    if (!id) {
      setLiveId('');
      setLiveName('');
      setLoadLive(false);
      return;
    }
    const aud = audiences.find((a) => a.id === id);
    setLiveId(id);
    setLiveName(aud ? getAudienceLabel(aud) : '');
    setLoadLive(true);
  };

  const handleCreateTestAudience = () => {
    setCreateError(null);
    setCreateLoading(true);
    const fixture = {
      target_segment: {
        demographics: 'Calendar testbed audience',
        psychographics: 'Users testing the 30-day content calendar feature',
        searchBehavior: 'Looking for content calendar and strategy tools'
      },
      customer_problem: 'Testing 30-day content calendar',
      pitch: '',
      image_url: null,
      customer_language: ['content calendar', '30-day plan', 'content strategy'],
      conversion_path: 'Testbed usage leading to calendar subscription',
      business_value: {
        searchVolume: 'Test',
        conversionPotential: 'Low',
        priority: 1,
        competition: 'Low'
      },
      priority: 1
    };
    autoBlogAPI
      .createAudience(fixture)
      .then((res) => {
        const id = res?.audience?.id;
        const name = res?.audience?.customer_problem ?? res?.audience?.customerProblem ?? 'Test audience';
        fetchAudiences();
        if (id) {
          setLiveId(id);
          setLiveName(name);
          setLoadLive(true);
        }
      })
      .catch((err) => {
        setCreateError(err?.message ?? 'Failed to create audience');
      })
      .finally(() => setCreateLoading(false));
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
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
              <TeamOutlined style={{ color: '#666' }} />
              <Select
                placeholder="Choose an audience (from your account)"
                value={liveId || undefined}
                onChange={handleSelectAudience}
                onDropdownVisibleChange={(open) => open && !audiences.length && !audiencesLoading && fetchAudiences()}
                loading={audiencesLoading}
                allowClear
                showSearch
                optionFilterProp="label"
                style={{ minWidth: 320 }}
                options={audiences.map((a) => ({
                  value: a.id,
                  label: getAudienceLabel(a) + (a.has_content_calendar ? ' · Calendar ready' : '')
                }))}
              />
              <Button type="primary" onClick={handleLoadLive} disabled={!liveId.trim()}>
                Load calendar
              </Button>
              {loadLive && (
                <Button
                  onClick={() => {
                    setLoadLive(false);
                    setLiveId('');
                    setLiveName('');
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
            {audiencesError && (
              <Alert
                message={audiencesError}
                type="warning"
                showIcon
                style={{ marginBottom: 8 }}
                action={
                  <Button size="small" onClick={fetchAudiences}>
                    Retry
                  </Button>
                }
              />
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Or paste ID:</Text>
              <Input
                placeholder="Audience UUID (manual)"
                value={liveId}
                onChange={(e) => setLiveId(e.target.value)}
                onPressEnter={() => liveId.trim() && setLoadLive(true)}
                style={{ width: 280 }}
              />
              <Input
                placeholder="Display name (optional)"
                value={liveName}
                onChange={(e) => setLiveName(e.target.value)}
                style={{ width: 180 }}
              />
            </div>
            {!audiencesLoading && audiences.length === 0 && !audiencesError && (
              <Alert
                message="Subscribe to a strategy to get your calendar."
                description="No audiences yet. Complete website analysis or subscribe to a strategy to see your 30-day content calendar here."
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
                Generate audiences
              </Text>
              <Button
                type="default"
                icon={createLoading ? <LoadingOutlined spin /> : <PlusOutlined />}
                onClick={handleCreateTestAudience}
                disabled={createLoading}
              >
                {createLoading ? 'Creating…' : 'Create test audience'}
              </Button>
              {createError && (
                <Alert
                  message={createError}
                  type="error"
                  showIcon
                  style={{ marginTop: 8 }}
                  closable
                  onClose={() => setCreateError(null)}
                />
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Live: real ContentCalendarSection */}
      {mode === 'live' && loadLive && liveId.trim() && (
        <ContentCalendarSection
          strategyId={liveId.trim()}
          strategyName={liveName.trim() || undefined}
          testbed
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
