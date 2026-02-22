import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Spin, Alert, List, Tag, Skeleton, Typography, Space, Progress, Button } from 'antd';
import {
    CalendarOutlined,
    LoadingOutlined,
    ReloadOutlined,
    UserOutlined,
    BankOutlined,
    SearchOutlined,
    ThunderboltOutlined,
    SaveOutlined,
    CheckOutlined
  } from '@ant-design/icons';
import autoBlogAPI from '../../services/api';
import jobsAPI from '../../services/jobsAPI';

const { Text } = Typography;

const POLL_INTERVAL_MS = 7000; // Handoff: poll every 5–10s
const GENERATING_TIMEOUT_MS = 120000; // Handoff: up to ~2 min
/** Default number of calendar days to show (backend may return more; we show first N). */
const DEFAULT_CALENDAR_DAYS = 7;

/** Phase order and labels for content_calendar job stream (CONTENT_CALENDAR_GENERATION_PROGRESS_STREAMING.md). */
const CALENDAR_PHASES = [
  { key: 'audience', label: 'Audience', icon: UserOutlined },
  { key: 'organization', label: 'Organization', icon: BankOutlined },
  { key: 'keywords', label: 'Keywords', icon: SearchOutlined },
  { key: 'generating', label: 'Generating', icon: ThunderboltOutlined },
  { key: 'saving', label: 'Saving', icon: SaveOutlined }
];

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

/** Job ID for content_calendar when backend returns it on audience (queued/running). */
function getContentCalendarJobId(audience) {
  if (!audience) return null;
  const id = audience.content_calendar_job_id ?? audience.contentCalendarJobId;
  return id && String(id).trim() ? String(id).trim() : null;
}

/**
 * ContentCalendarSection - 7-day content calendar for strategies (by default).
 *
 * - When strategyId provided: Fetches single audience by ID (original behavior).
 * - When strategyId is null/undefined: Fetches all subscribed strategies and displays grouped calendars.
 * - Shows "generating" state with skeleton and polls until ready or timeout.
 * - Renders calendar list (default first 7 days; backend may return more).
 * - Handles 401, 404, 500 and empty state.
 * Conforms to docs/content-calendar-frontend-handoff-pasteable.md and CONTENT_CALENDAR_GENERATION_PROGRESS_STREAMING.md.
 * @param {string} [jobId] - Optional content_calendar job ID; when set, opens job stream for granular progress (progress bar + step label).
 * @param {boolean} [testbed=false] - When true, append ?testbed=1 to requests (calendar testbed page).
 */
export default function ContentCalendarSection({ strategyId, strategyName, onRefresh, jobId, testbed = false }) {
  const [audience, setAudience] = useState(null);
  const [allStrategies, setAllStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timedOut, setTimedOut] = useState(false);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobStepLabel, setJobStepLabel] = useState('');
  const [jobEta, setJobEta] = useState(null);
  const [jobPhase, setJobPhase] = useState(null);
  const [jobStrategyIndex, setJobStrategyIndex] = useState(null);
  const [jobStrategyTotal, setJobStrategyTotal] = useState(null);
  const [jobStreamFailed, setJobStreamFailed] = useState(null);
  const [jobRetryable, setJobRetryable] = useState(false);
  const [jobStreamRetryCount, setJobStreamRetryCount] = useState(0);
  const [requestedJobId, setRequestedJobId] = useState(null);
  const [regeneratingJobId, setRegeneratingJobId] = useState(null);
  const requestTriggeredRef = useRef(false);
  const pollTimerRef = useRef(null);
  const timeoutRef = useRef(null);

  const effectiveJobId = jobId || getContentCalendarJobId(audience) || requestedJobId;
  const streamJobId = effectiveJobId || regeneratingJobId;

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

  // Reset request-trigger ref when strategy changes so we can request again for a new audience
  useEffect(() => {
    requestTriggeredRef.current = false;
  }, [strategyId]);

  useEffect(() => {
    setLoading(true);
    setTimedOut(false);
    setError(null);

    const fetchData = strategyId ? fetchAudience : fetchAllStrategies;

    fetchData().then((data) => {
      if (!data) return;

      if (strategyId) {
        const aud = data;
        const ideas = getContentIdeas(aud);
        const generatedAt = getContentCalendarGeneratedAt(aud);
        const isReady = ideas.length > 0 || !!generatedAt;

        if (isReady) return;

        const hasJobId = jobId || getContentCalendarJobId(aud) || requestedJobId;
        if (hasJobId) return;

        timeoutRef.current = window.setTimeout(() => setTimedOut(true), GENERATING_TIMEOUT_MS);

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
    });

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [strategyId, jobId, requestedJobId, fetchAudience, fetchAllStrategies, onRefresh]);

  // When audience is generating and we have no jobId from props or audience, request one (backend return handoff)
  useEffect(() => {
    if (!strategyId || !audience) return;
    const ideas = getContentIdeas(audience);
    const generatedAt = getContentCalendarGeneratedAt(audience);
    if (ideas.length > 0 || generatedAt) return;
    if (jobId || getContentCalendarJobId(audience) || requestedJobId || requestTriggeredRef.current) return;

    requestTriggeredRef.current = true;
    autoBlogAPI
      .requestContentCalendar(strategyId)
      .then((res) => res?.jobId && setRequestedJobId(res.jobId))
      .catch((err) => {
        requestTriggeredRef.current = false;
        const msg = err?.message || 'Failed to start calendar generation';
        if (msg.includes('503') || msg.toLowerCase().includes('unavailable')) {
          setError('Calendar service is temporarily unavailable. Please try again in a moment.');
        } else if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
          setError('Audience not found.');
        } else {
          setError(msg);
        }
      });
  }, [strategyId, jobId, audience, requestedJobId]);

  // When we have a content_calendar jobId (prop, audience.content_calendar_job_id, requested, or regenerating), open stream
  useEffect(() => {
    if (!strategyId || !streamJobId) {
      setJobProgress(0);
      setJobStepLabel('');
      setJobEta(null);
      setJobPhase(null);
      setJobStrategyIndex(null);
      setJobStrategyTotal(null);
      setJobStreamFailed(null);
      setJobRetryable(false);
      return;
    }

    setJobStreamFailed(null);
    setJobRetryable(false);
    setJobProgress(0);
    setJobStepLabel('Connecting…');

    const promise = jobsAPI.connectToJobStream(
      streamJobId,
      {
        onProgress: (data) => {
          if (data?.progress != null) setJobProgress(Number(data.progress));
          if (data?.currentStep != null) setJobStepLabel(String(data.currentStep));
          setJobEta(data?.estimatedTimeRemaining != null ? Number(data.estimatedTimeRemaining) : null);
          if (data?.phase != null) setJobPhase(String(data.phase));
          if (data?.strategyIndex != null) setJobStrategyIndex(Number(data.strategyIndex));
          if (data?.strategyTotal != null) setJobStrategyTotal(Number(data.strategyTotal));
        },
        onComplete: () => {
          setJobProgress(100);
          setJobStepLabel('Complete');
          setRegeneratingJobId(null);
          fetchAudience().then(() => onRefresh?.());
        },
        onFailed: (data) => {
          setJobStreamFailed(data?.error ?? 'Job failed');
          setJobRetryable(!!data?.retryable);
          setError(data?.error ?? 'Calendar generation failed.');
        }
      },
      { streamTimeoutMs: GENERATING_TIMEOUT_MS }
    );

    promise
      .then((result) => {
        if (result?.status === 'succeeded') {
          setRegeneratingJobId(null);
          fetchAudience().then(() => onRefresh?.());
        }
      })
      .catch(() => {
        setJobStepLabel('Checking status…');
        jobsAPI.pollJobStatus(streamJobId, {
          onProgress: (status) => {
            if (status?.progress != null) setJobProgress(Number(status.progress));
            if (status?.currentStep != null) setJobStepLabel(String(status.currentStep));
            setJobEta(status?.estimatedTimeRemaining != null ? Number(status.estimatedTimeRemaining) : null);
            if (status?.phase != null) setJobPhase(String(status.phase));
            if (status?.strategyIndex != null) setJobStrategyIndex(Number(status.strategyIndex));
            if (status?.strategyTotal != null) setJobStrategyTotal(Number(status.strategyTotal));
          },
          pollIntervalMs: 2500,
          maxAttempts: Math.ceil(GENERATING_TIMEOUT_MS / 2500)
        }).then((status) => {
          if (status?.status === 'succeeded') {
            setRegeneratingJobId(null);
            fetchAudience().then(() => onRefresh?.());
          } else if (status?.status === 'failed') {
            setJobStreamFailed(status?.error ?? 'Job failed');
            setJobRetryable(true);
            setError(status?.error ?? 'Calendar generation failed.');
          }
        }).catch(() => {
          setJobStepLabel('');
          setError('Calendar is taking longer than expected. Refresh the page or try again.');
        });
      });

    return () => {};
  }, [strategyId, streamJobId, jobStreamRetryCount, fetchAudience, onRefresh]);

  // Determine what to display based on mode (single strategy vs all strategies)
  const isSingleStrategyMode = !!strategyId;
  const ideas = isSingleStrategyMode ? getContentIdeas(audience) : [];
  const generatedAt = isSingleStrategyMode ? getContentCalendarGeneratedAt(audience) : null;
  const isReady = isSingleStrategyMode
    ? ideas.length > 0
    : allStrategies.length > 0 && allStrategies.some(s => getContentIdeas(s).length > 0);
  const isGenerating = isSingleStrategyMode &&
    !error && ideas.length === 0 && !generatedAt && (loading || !!audience);

  /* Testbed debug: show what the API returned and why calendar may be empty */
  const debugLine = testbed && (audience || error) && (
    <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 8 }}>
      {error
        ? `API error: ${error}`
        : audience
          ? (
              <>
                API returned: content_ideas={ideas.length}, content_calendar_generated_at={generatedAt ? 'set' : 'null'}.
                {ideas.length === 0 && !generatedAt && (
                  <> If no progress appears, the frontend will request a calendar job automatically (POST …/request-content-calendar).
                  </>
                )}
              </>
            )
          : null}
    </div>
  );

  if (error || jobStreamFailed) {
    const displayError = jobStreamFailed ?? error;
    return (
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <span>7-Day Content Calendar</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        {debugLine}
        <Alert
          message={displayError}
          type="error"
          showIcon
          action={
            jobRetryable && streamJobId ? (
              <Button
                size="small"
                onClick={() => {
                  setError(null);
                  setJobStreamFailed(null);
                  setJobRetryable(false);
                  setLoading(true);
                  jobsAPI.retryJob(streamJobId).then(() => {
                    setJobStreamRetryCount((c) => c + 1);
                  }).catch(() => {
                    setError('Retry failed. Please try again.');
                  });
                }}
              >
                Retry
              </Button>
            ) : (
              <ReloadOutlined
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setError(null);
                  setJobStreamFailed(null);
                  setLoading(true);
                  fetchAudience();
                }}
              />
            )
          }
        />
      </Card>
    );
  }

  if (isGenerating || regeneratingJobId || (loading && !isReady)) {
    const showJobProgress = (jobStepLabel && isSingleStrategyMode) || !!regeneratingJobId;
    return (
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <span>7-Day Content Calendar</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        {debugLine}
        <div style={{ textAlign: showJobProgress ? 'left' : 'center', padding: '24px 0' }}>
          {showJobProgress ? (
            <>
              {jobStrategyTotal != null && jobStrategyTotal > 1 && (
                <div style={{ marginBottom: 12 }}>
                  <Tag color="blue">
                    Strategy {(jobStrategyIndex != null ? jobStrategyIndex + 1 : 1)} of {jobStrategyTotal}
                  </Tag>
                </div>
              )}
              {jobPhase && CALENDAR_PHASES.some(p => p.key === jobPhase) && (
                <Space size="middle" wrap style={{ marginBottom: 12 }}>
                  {CALENDAR_PHASES.map((p, i) => {
                    const phaseIndex = CALENDAR_PHASES.findIndex(ph => ph.key === jobPhase);
                    const isActive = p.key === jobPhase;
                    const isDone = phaseIndex > i;
                    const Icon = p.icon;
                    return (
                      <Space key={p.key} size={4}>
                        <span
                          style={{
                            opacity: isDone ? 0.7 : isActive ? 1 : 0.45,
                            color: isActive ? 'var(--color-primary)' : undefined,
                            fontWeight: isActive ? 600 : 400
                          }}
                        >
                          {isDone ? <CheckOutlined style={{ marginRight: 4 }} /> : <Icon style={{ marginRight: 4 }} />}
                          {p.label}
                        </span>
                        {i < CALENDAR_PHASES.length - 1 && (
                          <Text type="secondary" style={{ marginRight: 0 }}>→</Text>
                        )}
                      </Space>
                    );
                  })}
                </Space>
              )}
              <Progress percent={jobProgress} status="active" strokeColor="var(--color-primary)" />
              <div style={{ marginTop: 12, color: 'var(--color-text-primary)' }}>{jobStepLabel}</div>
              {jobEta != null && jobEta > 0 && (
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 6 }}>
                  About {jobEta}s remaining
                </Text>
              )}
              <Skeleton active paragraph={{ rows: 3 }} style={{ marginTop: 24 }} />
            </>
          ) : (
            <>
              <Spin size="large" indicator={<LoadingOutlined spin />} />
              <div style={{ marginTop: 16, color: 'var(--color-text-secondary)' }}>
                Calendar generating… This usually takes 15–30 seconds.
              </div>
              <Skeleton active paragraph={{ rows: 5 }} style={{ marginTop: 24, textAlign: 'left' }} />
            </>
          )}
        </div>
        {timedOut && !showJobProgress && (
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
            <span>7-Day Content Calendar</span>
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
              <span>7-Day Content Calendar — All Strategies</span>
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
              const sortedIdeas = [...strategyIdeas]
                .sort((a, b) => (a.dayNumber ?? a.day_number ?? 0) - (b.dayNumber ?? b.day_number ?? 0))
                .slice(0, DEFAULT_CALENDAR_DAYS);
              const strategyTitle = strategy.pitch || strategy.customer_problem || `Strategy ${idx + 1}`;

              return (
                <div key={strategy.id || idx} style={{ marginBottom: idx < strategiesWithContent.length - 1 ? 32 : 0 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                    paddingBottom: 8,
                    borderBottom: '2px solid var(--color-primary)'
                  }}>
                    <Text strong style={{ fontSize: 16, color: 'var(--color-primary)' }}>
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
                          style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border-base)' }}
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

  // Render single strategy mode (original behavior); show first N days by default
  const sortedIdeas = [...ideas]
    .sort((a, b) => (a.dayNumber ?? a.day_number ?? 0) - (b.dayNumber ?? b.day_number ?? 0))
    .slice(0, DEFAULT_CALENDAR_DAYS);

  return (
    <>
      {debugLine}
    <Card
      title={
        <Space>
          <CalendarOutlined />
          <span>7-Day Content Calendar</span>
          {strategyName && (
            <Text type="secondary" style={{ fontSize: 14, fontWeight: 'normal' }}>
              — {strategyName}
            </Text>
          )}
        </Space>
      }
      extra={
        <Space>
          {generatedAt && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Generated {new Date(generatedAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
          )}
          {strategyId && (
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => {
                setRegeneratingJobId(null);
                setError(null);
                setJobStreamFailed(null);
                autoBlogAPI.requestContentCalendar(strategyId)
                  .then((res) => res?.jobId && setRegeneratingJobId(res.jobId))
                  .catch((err) => setError(err?.message || 'Failed to start regeneration.'));
              }}
            >
              Regenerate calendar
            </Button>
          )}
        </Space>
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
              style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border-base)' }}
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
