import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Spin, Alert, Typography, Divider, Space, Tag, List } from 'antd';
import { ArrowLeftOutlined, RocketOutlined, DollarOutlined, LoadingOutlined, CalendarOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

/**
 * ContentCalendarDisplay - Display 30-day content plan or sample teaser
 */
function ContentCalendarDisplay({ contentIdeas, sampleIdeas, loadingSampleIdeas, sampleIdeasError }) {
  // If no content ideas, show teaser with sample ideas
  if (!contentIdeas || contentIdeas.length === 0) {
    return (
      <div>
        {/* Teaser header with gradient */}
        <div style={{
          textAlign: 'center',
          padding: '16px 24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '8px 8px 0 0',
          marginBottom: '16px'
        }}>
          <Text strong style={{ color: 'white', fontSize: '15px' }}>
            Sample Content Ideas Preview
          </Text>
          <br />
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px' }}>
            Subscribe to unlock 30 days of AI-generated ideas that evolve with trending topics
          </Text>
        </div>

        {/* Loading state */}
        {loadingSampleIdeas && (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <Spin indicator={<LoadingOutlined spin />} />
            <div style={{ marginTop: '12px', color: '#999' }}>
              Generating sample ideas...
            </div>
          </div>
        )}

        {/* Error state (with fallback ideas if available) */}
        {sampleIdeasError && !sampleIdeas && (
          <Alert
            type="warning"
            message="Unable to generate sample ideas"
            description="Subscribe to see full 30-day content calendar"
            showIcon
            style={{ margin: '16px 0' }}
          />
        )}

        {/* Sample ideas list */}
        {sampleIdeas && !loadingSampleIdeas && (
          <List
            size="small"
            dataSource={sampleIdeas}
            renderItem={(idea, idx) => (
              <List.Item style={{ padding: '12px 16px', opacity: 0.8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                  <Text strong style={{ minWidth: '70px', color: '#999' }}>
                    Sample {idx + 1}:
                  </Text>
                  <Text style={{ flex: 1, lineHeight: '1.6', color: '#666' }}>
                    {idea}
                  </Text>
                  <Tag color="orange" style={{ marginLeft: '8px' }}>PREVIEW</Tag>
                </div>
              </List.Item>
            )}
            style={{
              backgroundColor: '#fafafa',
              padding: '12px',
              borderRadius: '4px',
              border: '1px dashed #d9d9d9'
            }}
          />
        )}

        {/* Subscribe CTA */}
        <div style={{
          textAlign: 'center',
          padding: '24px',
          background: '#f0f2f5',
          marginTop: '16px',
          borderRadius: '0 0 8px 8px'
        }}>
          <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
            Subscribe to unlock 30 days of AI-generated content ideas
          </Text>
          <Text type="secondary" style={{ fontSize: '13px', fontStyle: 'italic' }}>
            Content strategies evolve daily based on trending topics from X, Google, and news sources
          </Text>
        </div>
      </div>
    );
  }

  // Show full content calendar (existing 30-day view - to be implemented if needed)
  return (
    <div style={{ textAlign: 'center', padding: '24px' }}>
      <Text type="secondary" style={{ fontSize: '14px' }}>
        30-day content calendar will be displayed here after subscription.
      </Text>
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

  // Sample content ideas state
  const [sampleIdeas, setSampleIdeas] = useState(null);
  const [loadingSampleIdeas, setLoadingSampleIdeas] = useState(false);
  const [sampleIdeasError, setSampleIdeasError] = useState(null);

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

  // Fetch sample ideas when content ideas are empty
  useEffect(() => {
    if (visible && strategy &&
        (!strategy.contentIdeas || strategy.contentIdeas.length === 0) &&
        !sampleIdeas && !loadingSampleIdeas) {
      fetchSampleContentIdeas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, strategy?.id, strategy?.contentIdeas]);

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

  /**
   * Fetch sample content ideas for teaser display
   */
  async function fetchSampleContentIdeas() {
    setLoadingSampleIdeas(true);
    setSampleIdeasError(null);

    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setSampleIdeasError('Authentication required');
        setLoadingSampleIdeas(false);
        return;
      }

      console.log('💡 Fetching sample content ideas for strategy:', strategy.id);

      const response = await fetch(
        `/api/v1/strategies/${strategy.id}/sample-content-ideas`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to generate sample ideas: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.sampleIdeas) {
        console.log('✅ Sample ideas received:', data.sampleIdeas);
        setSampleIdeas(data.sampleIdeas);
      } else {
        throw new Error('Invalid response from server');
      }

    } catch (err) {
      console.error('Failed to fetch sample content ideas:', err);
      setSampleIdeasError(err.message);

      // Set fallback generic ideas
      setSampleIdeas([
        'Content idea tailored to your target audience',
        'Strategic blog post based on your keywords',
        'SEO-optimized article for your niche'
      ]);
    } finally {
      setLoadingSampleIdeas(false);
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
          <Paragraph style={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
            fontSize: '15px',
            minHeight: '80px'
          }}>
            {pitchText || 'Generating strategy overview...'}
            {loading && <LoadingOutlined spin style={{ marginLeft: '8px', color: '#1890ff' }} />}
          </Paragraph>
        )}
      </Card>

      {/* 30-Day Content Calendar (with sample teaser) */}
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <span>30-Day Content Calendar</span>
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <ContentCalendarDisplay
          contentIdeas={strategy.contentIdeas}
          sampleIdeas={sampleIdeas}
          loadingSampleIdeas={loadingSampleIdeas}
          sampleIdeasError={sampleIdeasError}
        />
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
