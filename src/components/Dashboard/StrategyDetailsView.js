import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Spin, Alert, Typography, Divider, Space, Tag, List } from 'antd';
import { ArrowLeftOutlined, RocketOutlined, DollarOutlined, LoadingOutlined, CalendarOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

/**
 * StrategyPitchDisplay - Parse and display structured pitch text
 */
function StrategyPitchDisplay({ pitchText, loading }) {
  // Parse structured pitch text
  const parsePitchText = (text) => {
    if (!text) return { summary: '', insights: [] };

    // Try to extract SUMMARY and KEY INSIGHTS sections
    const summaryMatch = text.match(/\*\*SUMMARY:\*\*\s*(.+?)(?=\*\*KEY INSIGHTS:\*\*|$)/s);
    const insightsMatch = text.match(/\*\*KEY INSIGHTS:\*\*\s*([\s\S]+?)$/);

    let summary = '';
    let insights = [];

    if (summaryMatch) {
      summary = summaryMatch[1].trim();
    }

    if (insightsMatch) {
      // Extract bullet points (lines starting with • or -)
      const insightsText = insightsMatch[1];
      insights = insightsText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('•') || line.startsWith('-') || line.startsWith('*'))
        .map(line => line.replace(/^[•\-*]\s*/, '').trim())
        .filter(line => line.length > 0);
    }

    // Fallback: if no structured format detected, use the whole text as summary
    if (!summary && !insights.length && text) {
      summary = text;
    }

    return { summary, insights };
  };

  const { summary, insights } = parsePitchText(pitchText);

  return (
    <div>
      {/* Summary */}
      {summary && (
        <Paragraph style={{
          fontSize: '15px',
          lineHeight: 1.8,
          marginBottom: insights.length > 0 ? '16px' : '0',
          color: '#333'
        }}>
          {summary}
          {loading && !insights.length && <LoadingOutlined spin style={{ marginLeft: '8px', color: '#1890ff' }} />}
        </Paragraph>
      )}

      {/* Key Insights */}
      {insights.length > 0 && (
        <div>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0
          }}>
            {insights.map((insight, idx) => (
              <li key={idx} style={{
                fontSize: '14px',
                lineHeight: 1.8,
                marginBottom: '8px',
                paddingLeft: '20px',
                position: 'relative',
                color: '#555'
              }}>
                <span style={{
                  position: 'absolute',
                  left: '0',
                  color: '#1890ff',
                  fontWeight: 'bold'
                }}>•</span>
                {insight}
              </li>
            ))}
          </ul>
          {loading && <LoadingOutlined spin style={{ marginLeft: '8px', color: '#1890ff' }} />}
        </div>
      )}

      {/* Loading fallback */}
      {!summary && !insights.length && (
        <Paragraph style={{
          fontSize: '15px',
          lineHeight: 1.8,
          color: '#999',
          fontStyle: 'italic'
        }}>
          Generating strategy overview...
          <LoadingOutlined spin style={{ marginLeft: '8px', color: '#1890ff' }} />
        </Paragraph>
      )}
    </div>
  );
}

/**
 * ContentCalendarDisplay - Display 30-day content plan grouped by weeks
 */
function ContentCalendarDisplay({ contentIdeas }) {
  console.log('ContentCalendarDisplay received:', {
    contentIdeas,
    type: typeof contentIdeas,
    isArray: Array.isArray(contentIdeas),
    length: contentIdeas?.length
  });

  if (!contentIdeas || contentIdeas.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <Text type="secondary" style={{ fontSize: '14px' }}>
          Content calendar will be generated when you subscribe to this strategy.
        </Text>
      </div>
    );
  }

  // Group content ideas by weeks (7 days per week)
  const weeks = [];
  const ideasToShow = contentIdeas.slice(0, 30); // Show first 30 ideas (1 per day)

  for (let i = 0; i < ideasToShow.length; i += 7) {
    const weekNumber = Math.floor(i / 7) + 1;
    const weekIdeas = ideasToShow.slice(i, i + 7);
    weeks.push({
      weekNumber,
      startDay: i + 1,
      endDay: Math.min(i + 7, ideasToShow.length),
      ideas: weekIdeas
    });
  }

  return (
    <div>
      {weeks.map((week, weekIdx) => (
        <div key={weekIdx} style={{ marginBottom: weekIdx < weeks.length - 1 ? '24px' : '0' }}>
          <Title level={5} style={{ marginBottom: '12px', color: '#1890ff' }}>
            Week {week.weekNumber} (Days {week.startDay}-{week.endDay})
          </Title>
          <List
            size="small"
            dataSource={week.ideas}
            renderItem={(idea, idx) => {
              const dayNumber = week.startDay + idx;
              return (
                <List.Item style={{ padding: '8px 0', borderBottom: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                    <Text strong style={{ minWidth: '60px', color: '#666' }}>Day {dayNumber}:</Text>
                    <Text style={{ flex: 1, lineHeight: '1.6' }}>{idea}</Text>
                  </div>
                </List.Item>
              );
            }}
            style={{
              backgroundColor: '#fafafa',
              padding: '12px 16px',
              borderRadius: '4px',
              border: '1px solid #f0f0f0'
            }}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * StrategyDetailsView - Embedded view showing LLM-generated strategy pitch
 *
 * Features:
 * - SSE streaming of pitch and pricing rationale
 * - Real-time text streaming display
 * - "Subscribe Now" CTA to Stripe checkout
 * - "Back to Posts" navigation
 */
export default function StrategyDetailsView({ strategy, visible, onBack, onSubscribe }) {
  const [pitchText, setPitchText] = useState('');
  const [pricingText, setPricingText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (visible && strategy) {
      fetchPitch();
    }

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, strategy?.id]);

  /**
   * Fetch pitch and pricing via SSE
   */
  async function fetchPitch() {
    setLoading(true);
    setPitchText('');
    setPricingText('');
    setError(null);

    try {
      // Get auth token
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setError('Authentication required to view strategy details');
        setLoading(false);
        return;
      }

      // Build SSE URL with auth token as query param (EventSource can't send headers)
      // In development, explicitly use backend URL (EventSource doesn't use proxy)
      // In production, use configured API URL or relative path
      const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
      const baseURL = isDevelopment
        ? 'http://localhost:3001'  // Direct backend URL in dev
        : (process.env.REACT_APP_API_URL || '');  // Configured URL in prod

      const sseURL = `${baseURL}/api/v1/strategies/${strategy.id}/pitch?token=${encodeURIComponent(token)}`;

      console.log('🔗 Opening SSE connection for strategy pitch:', strategy.id);

      // Create EventSource connection
      const eventSource = new EventSource(sseURL);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('✅ SSE connection opened');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'pitch-chunk') {
            setPitchText(prev => prev + data.content);
          } else if (data.type === 'pricing-chunk') {
            setPricingText(prev => prev + data.content);
          } else if (data.type === 'complete') {
            console.log('✅ SSE stream complete');
            setLoading(false);
            eventSource.close();
            eventSourceRef.current = null;
          } else if (data.type === 'error') {
            console.error('❌ SSE error:', data.content);
            setError(data.content || 'Failed to generate strategy pitch');
            setLoading(false);
            eventSource.close();
            eventSourceRef.current = null;
          }
        } catch (err) {
          console.error('Failed to parse SSE event:', err, event.data);
        }
      };

      eventSource.onerror = (err) => {
        console.error('❌ SSE connection error:', err);
        setError('Connection error while generating strategy pitch');
        setLoading(false);
        eventSource.close();
        eventSourceRef.current = null;
      };

    } catch (err) {
      console.error('Failed to fetch pitch:', err);
      setError(err.message || 'Failed to generate strategy pitch');
      setLoading(false);
    }
  }

  if (!visible || !strategy) return null;

  // Parse target segment
  let demographics = 'Unknown Audience';
  if (strategy.targetSegment?.demographics) {
    demographics = strategy.targetSegment.demographics;
  } else if (strategy.customerProblem) {
    demographics = strategy.customerProblem;
  }

  const monthlyPrice = strategy.pricingMonthly || 39.99;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Back button */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={onBack}
        style={{ marginBottom: '24px' }}
        size="large"
      >
        Back to Posts
      </Button>

      {/* Strategy title */}
      <Title level={2} style={{ marginBottom: '8px' }}>
        {demographics}
      </Title>

      <Tag color="blue" style={{ marginBottom: '24px' }}>
        Content Strategy
      </Tag>

      {/* Error alert */}
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Strategy Overview (LLM-generated pitch) */}
      <Card
        title={
          <Space>
            <RocketOutlined />
            <span>Strategy Overview</span>
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        {loading && !pitchText ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" indicator={<LoadingOutlined spin />} />
            <div style={{ marginTop: '16px', color: '#999' }}>
              Generating personalized strategy pitch...
            </div>
          </div>
        ) : (
          <StrategyPitchDisplay pitchText={pitchText} loading={loading} />
        )}
      </Card>

      {/* 30-Day Content Calendar */}
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <span>30-Day Content Calendar</span>
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <ContentCalendarDisplay contentIdeas={strategy.contentIdeas} />
      </Card>

      {/* Strategy Details */}
      <Card
        title="Strategy Details"
        style={{ marginBottom: '24px' }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>Target Audience:</Text>
            <br />
            <Text>{demographics}</Text>
          </div>

          {strategy.customerLanguage && strategy.customerLanguage.length > 0 && (
            <div>
              <Text strong>Keywords:</Text>
              <br />
              <Space wrap style={{ marginTop: '8px' }}>
                {strategy.customerLanguage.slice(0, 8).map((keyword, idx) => (
                  <Tag key={idx} color="geekblue">{keyword}</Tag>
                ))}
              </Space>
            </div>
          )}

          <Divider style={{ margin: '12px 0' }} />

          <Space size="large">
            <div>
              <Text strong>Competition:</Text>
              <br />
              <Text>{strategy.competitionLevel || strategy.businessValue?.competition || 'Medium'}</Text>
            </div>

            <div>
              <Text strong>Search Volume:</Text>
              <br />
              <Text>{strategy.searchVolume || strategy.businessValue?.searchVolume || 'Moderate'}</Text>
            </div>
          </Space>
        </Space>
      </Card>

      {/* Pricing (LLM-generated rationale) */}
      <Card
        title={
          <Space>
            <DollarOutlined />
            <span>Pricing</span>
          </Space>
        }
        style={{ marginBottom: '32px' }}
      >
        <div style={{
          fontSize: '36px',
          fontWeight: 'bold',
          color: '#1890ff',
          marginBottom: '16px'
        }}>
          ${monthlyPrice.toFixed(2)}<span style={{ fontSize: '18px', color: '#999' }}>/month</span>
        </div>

        {loading && !pricingText ? (
          <div style={{ color: '#999', fontStyle: 'italic' }}>
            <LoadingOutlined spin /> Calculating pricing rationale...
          </div>
        ) : (
          <Paragraph style={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
            fontSize: '14px',
            color: '#666',
            minHeight: '60px'
          }}>
            {pricingText || 'Generating pricing rationale...'}
            {loading && <LoadingOutlined spin style={{ marginLeft: '8px', color: '#1890ff' }} />}
          </Paragraph>
        )}
      </Card>

      {/* Subscribe CTA */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Button
          type="primary"
          size="large"
          icon={<RocketOutlined />}
          onClick={() => onSubscribe(strategy.id)}
          style={{
            height: '48px',
            fontSize: '16px',
            padding: '0 48px'
          }}
        >
          Subscribe Now
        </Button>
      </div>
    </div>
  );
}
