import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Spin, Alert, List, Tag, Skeleton, Typography, Space } from 'antd';
import { CalendarOutlined, LoadingOutlined, ReloadOutlined } from '@ant-design/icons';
import autoBlogAPI from '../../services/api';

const { Text } = Typography;

const POLL_INTERVAL_MS = 7000; // Handoff: poll every 5–10s
const GENERATING_TIMEOUT_MS = 120000; // Handoff: up to ~2 min

/** Normalize audience from API (supports snake_case or camelCase). */
function getContentIdeas(audience) {
  if (!audience) return [];
  const raw = audience.content_ideas ?? audience.contentIdeas;
  return Array.isArray(raw) ? raw : [];
}

function getContentCalendarGeneratedAt(audience) {
  if (!audience) return null;
  return audience.content_calendar_generated_at ?? audience.contentCalendarGeneratedAt ?? null;
}

/**
 * ContentCalendarSection - 30-day content calendar for strategies.
 *
 * - When strategyId provided: Fetches single audience by ID (original behavior).
 * - When strategyId is null/undefined: Fetches all subscribed strategies and displays grouped calendars.
 * - Shows "generating" state with skeleton and polls until ready or timeout.
 * - Renders full 30-day list (day, title, format badge, keywords) when ready.
 * - Handles 401, 404, 500 and empty state.
 * Conforms to docs/content-calendar-frontend-handoff-pasteable.md (UI states, poll 5–10s, ~2 min timeout).
 * @param {boolean} [testbed=false] - When true, append ?testbed=1 to requests (calendar testbed page).
 */
export default function ContentCalendarSection({ strategyId, strategyName, onRefresh, testbed = false }) {
  const [audience, setAudience] = useState(null);
  const [allStrategies, setAllStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timedOut, setTimedOut] = useState(false);
  const pollTimerRef = useRef(null);
  const timeoutRef = useRef(null);

  const fetchAudience = useCallback(async () => {
    if (!strategyId) return;
    try {
      setError(null);
      const response = await autoBlogAPI.getAudience(strategyId, { testbed });
      if (response?.audience) {
        setAudience(response.audience);
        return response.audience;
      }
      setAudience(null);
      return null;
    } catch (err) {
      const msg = err.message || 'Failed to load calendar';
      setError(msg);
      if (err.message?.includes('401') || msg.toLowerCase().includes('auth')) {
        setError('Sign in to view your content calendar.');
      } else if (err.message?.includes('404') || msg.toLowerCase().includes('not found')) {
        setError('Strategy not found.');
      } else {
        setError('Something went wrong. Please try again.');
      }
      setAudience(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [strategyId, testbed]);

  const fetchAllStrategies = useCallback(async () => {
    try {
      setError(null);
      const response = await autoBlogAPI.getContentCalendar({ testbed });
      if (response?.strategies) {
        setAllStrategies(response.strategies);
        return response.strategies;
      }
      setAllStrategies([]);
      return [];
    } catch (err) {
      const msg = err.message || 'Failed to load calendars';
      setError(msg);
      if (err.message?.includes('401') || msg.toLowerCase().includes('auth')) {
        setError('Sign in to view your content calendars.');
      } else {
        setError('Something went wrong. Please try again.');
      }
      setAllStrategies([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [testbed]);

  useEffect(() => {
    setLoading(true);
    setTimedOut(false);
    setError(null);

    // Fetch single strategy or all strategies based on strategyId
    const fetchData = strategyId ? fetchAudience : fetchAllStrategies;

    fetchData().then((data) => {
      if (!data) return;

      // For single strategy, check if content is ready
      if (strategyId) {
        const aud = data;
        const ideas = getContentIdeas(aud);
        const generatedAt = getContentCalendarGeneratedAt(aud);
        const isReady = ideas.length > 0 || !!generatedAt;

        if (isReady) return;

        // Start timeout: after 2 min show "taking longer than expected"
        timeoutRef.current = window.setTimeout(() => {
          setTimedOut(true);
        }, GENERATING_TIMEOUT_MS);

        // Poll until ready
        const poll = () => {
          pollTimerRef.current = window.setTimeout(async () => {
            const updated = await fetchAudience();
            if (!updated) return;
            const nextIdeas = getContentIdeas(updated);
            const nextGen = getContentCalendarGeneratedAt(updated);
            if (nextIdeas.length > 0 || nextGen) {
              if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
              if (onRefresh) onRefresh();
              return;
            }
            poll();
          }, POLL_INTERVAL_MS);
        };
        poll();
      }
      // For all strategies, no polling needed (they should already be generated)
    });

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [strategyId, fetchAudience, fetchAllStrategies, onRefresh]);

  // Determine what to display based on mode (single strategy vs all strategies)
  const isSingleStrategyMode = !!strategyId;
  const ideas = isSingleStrategyMode ? getContentIdeas(audience) : [];
  const generatedAt = isSingleStrategyMode ? getContentCalendarGeneratedAt(audience) : null;
  const isReady = isSingleStrategyMode
    ? ideas.length > 0
    : allStrategies.length > 0 && allStrategies.some(s => getContentIdeas(s).length > 0);
  const isGenerating = isSingleStrategyMode &&
    !error && ideas.length === 0 && !generatedAt && (loading || !!audience);

  /* Testbed debug: show what the API returned so we can see why results might not appear */
  const debugLine = testbed && (audience || error) && (
    <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>
      {error
        ? `API error: ${error}`
        : audience
          ? `API returned: content_ideas=${ideas.length}, content_calendar_generated_at=${generatedAt ? 'set' : 'null'}`
          : null}
    </div>
  );

  if (error) {
    return (
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <span>30-Day Content Calendar</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        {debugLine}
        <Alert
          message={error}
          type="error"
          showIcon
          action={
            <ReloadOutlined
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchAudience();
              }}
            />
          }
        />
      </Card>
    );
  }

  if (isGenerating || (loading && !isReady)) {
    return (
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <span>30-Day Content Calendar</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        {debugLine}
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Spin size="large" indicator={<LoadingOutlined spin />} />
          <div style={{ marginTop: 16, color: '#666' }}>
            Calendar generating… This usually takes 15–30 seconds.
          </div>
          <Skeleton active paragraph={{ rows: 5 }} style={{ marginTop: 24, textAlign: 'left' }} />
        </div>
        {timedOut && (
          <Alert
            message="Calendar is taking longer than expected. Refresh the page or contact support."
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Card>
    );
  }

  if (!isReady) {
    return (
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <span>30-Day Content Calendar</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        {debugLine}
        <Alert
          message={isSingleStrategyMode ? "No calendar yet" : "No calendars available"}
          description={
            isSingleStrategyMode
              ? "Your calendar may still be generating or something went wrong. Refresh the page or contact support."
              : "You haven't subscribed to any strategies yet. Select a strategy above to subscribe and generate your content calendar."
          }
          type="info"
          showIcon
        />
      </Card>
    );
  }

  // Render all strategies mode
  if (!isSingleStrategyMode) {
    const strategiesWithContent = allStrategies.filter(s => getContentIdeas(s).length > 0);

    return (
      <>
        {debugLine}
        <Card
          title={
            <Space>
              <CalendarOutlined />
              <span>30-Day Content Calendar — All Strategies</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          {strategiesWithContent.length === 0 ? (
            <Alert
              message="No content calendars found"
              description="Subscribe to audience strategies above to generate your content calendars."
              type="info"
              showIcon
            />
          ) : (
            strategiesWithContent.map((strategy, idx) => {
              const strategyIdeas = getContentIdeas(strategy);
              const strategyGenAt = getContentCalendarGeneratedAt(strategy);
              const sortedIdeas = [...strategyIdeas].sort(
                (a, b) => (a.dayNumber ?? a.day_number ?? 0) - (b.dayNumber ?? b.day_number ?? 0)
              );
              const strategyTitle = strategy.pitch || strategy.customer_problem || `Strategy ${idx + 1}`;

              return (
                <div key={strategy.id || idx} style={{ marginBottom: idx < strategiesWithContent.length - 1 ? 32 : 0 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                    paddingBottom: 8,
                    borderBottom: '2px solid #1890ff'
                  }}>
                    <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                      {strategyTitle}
                    </Text>
                    {strategyGenAt && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Generated {new Date(strategyGenAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Text>
                    )}
                  </div>
                  <List
                    itemLayout="vertical"
                    size="small"
                    dataSource={sortedIdeas}
                    renderItem={(item) => {
                      const dayNum = item.dayNumber ?? item.day_number;
                      const title = item.title;
                      const searchIntent = item.searchIntent ?? item.search_intent;
                      const format = item.format;
                      const keywords = item.keywords ?? [];
                      return (
                        <List.Item
                          key={dayNum ?? item.title}
                          style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
                        >
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 8 }}>
                            <Tag color="blue" style={{ marginRight: 0 }}>
                              Day {dayNum}
                            </Tag>
                            {format && (
                              <Tag color="default">{String(format).replace(/-/g, ' ')}</Tag>
                            )}
                          </div>
                          <div style={{ fontWeight: 500, marginTop: 4 }}>{title || 'Untitled'}</div>
                          {searchIntent && (
                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                              {searchIntent}
                            </Text>
                          )}
                          {keywords && keywords.length > 0 && (
                            <Space wrap size={4} style={{ marginTop: 6 }}>
                              {keywords.slice(0, 5).map((kw, i) => (
                                <Tag key={i} style={{ fontSize: 11 }}>
                                  {kw}
                                </Tag>
                              ))}
                            </Space>
                          )}
                        </List.Item>
                      );
                    }}
                  />
                </div>
              );
            })
          )}
        </Card>
      </>
    );
  }

  // Render single strategy mode (original behavior)
  const sortedIdeas = [...ideas].sort(
    (a, b) => (a.dayNumber ?? a.day_number ?? 0) - (b.dayNumber ?? b.day_number ?? 0)
  );

  return (
    <>
      {debugLine}
    <Card
      title={
        <Space>
          <CalendarOutlined />
          <span>30-Day Content Calendar</span>
          {strategyName && (
            <Text type="secondary" style={{ fontSize: 14, fontWeight: 'normal' }}>
              — {strategyName}
            </Text>
          )}
        </Space>
      }
      extra={
        generatedAt ? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Generated {new Date(generatedAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </Text>
        ) : null
      }
      style={{ marginBottom: 24 }}
    >
      <List
        itemLayout="vertical"
        size="small"
        dataSource={sortedIdeas}
        renderItem={(item) => {
          const dayNum = item.dayNumber ?? item.day_number;
          const title = item.title;
          const searchIntent = item.searchIntent ?? item.search_intent;
          const format = item.format;
          const keywords = item.keywords ?? [];
          return (
            <List.Item
              key={dayNum ?? item.title}
              style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 8 }}>
                <Tag color="blue" style={{ marginRight: 0 }}>
                  Day {dayNum}
                </Tag>
                {format && (
                  <Tag color="default">{String(format).replace(/-/g, ' ')}</Tag>
                )}
              </div>
              <div style={{ fontWeight: 500, marginTop: 4 }}>{title || 'Untitled'}</div>
              {searchIntent && (
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                  {searchIntent}
                </Text>
              )}
              {keywords && keywords.length > 0 && (
                <Space wrap size={4} style={{ marginTop: 6 }}>
                  {keywords.slice(0, 5).map((kw, i) => (
                    <Tag key={i} style={{ fontSize: 11 }}>
                      {kw}
                    </Tag>
                  ))}
                </Space>
              )}
            </List.Item>
          );
        }}
      />
    </Card>
    </>
  );
}
