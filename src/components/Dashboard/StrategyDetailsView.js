import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Spin, Alert, Typography, Space, Tag, message } from 'antd';
import { ArrowLeftOutlined, RocketOutlined, DollarOutlined, LoadingOutlined, CalendarOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

/**
 * Parse and render markdown-formatted pitch text
 */
function renderPitchText(text) {
  if (!text) return null;

  // Split into lines
  const lines = text.split('\n');
  const elements = [];
  let currentList = [];

  lines.forEach((line, idx) => {
    const trimmedLine = line.trim();

    // Bold headers (e.g., **SUMMARY:**)
    if (trimmedLine.match(/^\*\*[^*]+\*\*:?$/)) {
      // Flush current list if exists
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} style={{
            margin: '8px 0',
            padding: '0 0 0 20px',
            listStyle: 'none'
          }}>
            {currentList.map((item, i) => (
              <li key={i} style={{
                marginBottom: '6px',
                position: 'relative',
                paddingLeft: '8px'
              }}>
                <span style={{ position: 'absolute', left: '-12px', color: '#1890ff' }}>•</span>
                {item}
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }

      const headerText = trimmedLine.replace(/\*\*/g, '').replace(/:$/, '');
      elements.push(
        <Text key={`header-${idx}`} strong style={{
          display: 'block',
          fontSize: '15px',
          color: '#262626',
          marginTop: elements.length > 0 ? '16px' : '0',
          marginBottom: '8px'
        }}>
          {headerText}
        </Text>
      );
    }
    // Bullet points (e.g., • Item text)
    else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
      const bulletText = trimmedLine.substring(1).trim();
      currentList.push(bulletText);
    }
    // Regular paragraph text
    else if (trimmedLine.length > 0) {
      // Flush current list if exists
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} style={{
            margin: '8px 0',
            padding: '0 0 0 20px',
            listStyle: 'none'
          }}>
            {currentList.map((item, i) => (
              <li key={i} style={{
                marginBottom: '6px',
                position: 'relative',
                paddingLeft: '8px'
              }}>
                <span style={{ position: 'absolute', left: '-12px', color: '#1890ff' }}>•</span>
                {item}
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }

      elements.push(
        <Text key={`p-${idx}`} style={{
          display: 'block',
          fontSize: '15px',
          lineHeight: '1.8',
          color: '#434343',
          marginBottom: '8px'
        }}>
          {trimmedLine}
        </Text>
      );
    }
  });

  // Flush remaining list items
  if (currentList.length > 0) {
    elements.push(
      <ul key={`list-${elements.length}`} style={{
        margin: '8px 0',
        padding: '0 0 0 20px',
        listStyle: 'none'
      }}>
        {currentList.map((item, i) => (
          <li key={i} style={{
            marginBottom: '6px',
            position: 'relative',
            paddingLeft: '8px'
          }}>
            <span style={{ position: 'absolute', left: '-12px', color: '#1890ff' }}>•</span>
            {item}
          </li>
        ))}
      </ul>
    );
  }

  return <div>{elements}</div>;
}

/**
 * ContentCalendarTimeline - Timeline visual for 30-day content plan
 */
function ContentCalendarTimeline({ contentIdeas, sampleIdeas, loadingSampleIdeas, sampleIdeasError }) {
  // If no content ideas, show timeline teaser with sample ideas
  if (!contentIdeas || contentIdeas.length === 0) {
    return (
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e8e8e8',
        overflow: 'hidden'
      }}>
        {/* Timeline header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <CalendarOutlined style={{ fontSize: '22px', marginRight: '12px' }} />
          <div style={{ flex: 1 }}>
            <Text strong style={{ color: 'white', fontSize: '16px', display: 'block', lineHeight: '1.3' }}>
              30-Day Content Calendar
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px' }}>
              Preview • Subscribe to unlock full calendar
            </Text>
          </div>
        </div>

        {/* Loading state */}
        {loadingSampleIdeas && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Spin indicator={<LoadingOutlined spin />} />
            <div style={{ marginTop: '12px', color: '#999', fontSize: '14px' }}>
              Generating preview...
            </div>
          </div>
        )}

        {/* Error state */}
        {sampleIdeasError && !sampleIdeas && (
          <Alert
            type="warning"
            message="Unable to generate preview"
            description="Subscribe to see full content calendar"
            showIcon
            style={{ margin: '20px' }}
          />
        )}

        {/* Timeline visualization */}
        {sampleIdeas && !loadingSampleIdeas && (
          <div style={{ padding: '24px 20px' }}>
            {sampleIdeas.map((idea, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: idx < sampleIdeas.length - 1 ? '24px' : '0'
              }}>
                {/* Timeline marker */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginRight: '16px',
                  minWidth: '50px'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                  }}>
                    D{idx + 1}
                  </div>
                  {idx < sampleIdeas.length - 1 && (
                    <div style={{
                      width: '2px',
                      height: '100%',
                      minHeight: '50px',
                      background: 'linear-gradient(180deg, #667eea 0%, rgba(102, 126, 234, 0.2) 100%)',
                      marginTop: '6px'
                    }} />
                  )}
                </div>

                {/* Content card */}
                <div style={{
                  flex: 1,
                  background: '#fafbfc',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: '1px solid #e8e8e8',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  cursor: 'default'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <ClockCircleOutlined style={{ color: '#8c8c8c', marginTop: '4px', fontSize: '15px' }} />
                    <div style={{ flex: 1 }}>
                      <Text style={{ fontSize: '14px', lineHeight: '1.7', color: '#434343', display: 'block' }}>
                        {idea}
                      </Text>
                    </div>
                    <Tag color="orange" style={{ fontSize: '11px', margin: 0 }}>PREVIEW</Tag>
                  </div>
                </div>
              </div>
            ))}

            {/* Dots indicator for more items */}
            <div style={{
              textAlign: 'center',
              marginTop: '28px',
              padding: '20px',
              background: 'linear-gradient(135deg, #f0f2f5 0%, #fafbfc 100%)',
              borderRadius: '10px',
              border: '1px dashed #d9d9d9'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '20px', color: '#667eea', letterSpacing: '4px' }}>
                  • • •
                </span>
              </div>
              <Text strong style={{ fontSize: '14px', color: '#434343', display: 'block', marginBottom: '4px' }}>
                + 27 more content ideas
              </Text>
              <Text type="secondary" style={{ fontSize: '13px' }}>
                Unlock with subscription
              </Text>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show full content calendar
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
      <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
        Full 30-Day Calendar Active
      </Text>
      <Text type="secondary" style={{ fontSize: '14px' }}>
        Your complete content calendar is now available
      </Text>
    </div>
  );
}

/**
 * Parse pricing text into bullet points
 */
function parsePricingBullets(pricingText) {
  if (!pricingText) return [];

  // Try to extract key metrics from pricing text
  const bullets = [];

  // Extract cost per lead
  const costPerLeadMatch = pricingText.match(/cost per lead[:\s]+\$?([^\s,]+)/i);
  if (costPerLeadMatch) {
    bullets.push(`Cost per lead: $${costPerLeadMatch[1]}`);
  }

  // Extract ROI
  const roiMatch = pricingText.match(/(\d+)x[- ]?(\d+)?x?\s+ROI/i);
  if (roiMatch) {
    bullets.push(`ROI: ${roiMatch[1]}x-${roiMatch[2] || roiMatch[1]}x return`);
  }

  // Extract payback time
  const paybackMatch = pricingText.match(/pays for itself in[:\s~]+(\d+)\s+weeks?/i);
  if (paybackMatch) {
    bullets.push(`Payback time: ~${paybackMatch[1]} weeks`);
  }

  // Extract profit range
  const profitMatch = pricingText.match(/\$([0-9,]+)[-–]\$([0-9,]+)\s+(?:per\s+)?month(?:ly)?(?:\s+profit)?/i);
  if (profitMatch) {
    bullets.push(`Projected profit: $${profitMatch[1]}-$${profitMatch[2]}/month`);
  }

  // If no bullets extracted, create generic summary
  if (bullets.length === 0) {
    bullets.push('Cost-effective content strategy');
    bullets.push('High ROI potential');
    bullets.push('Competitive market positioning');
  }

  return bullets;
}

/**
 * StrategyDetailsView - Embedded view showing LLM-generated strategy pitch
 */
export default function StrategyDetailsView({ strategy, visible, onBack, onSubscribe }) {
  const [pitchText, setPitchText] = useState('');
  const [pricingText, setPricingText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscribing, setSubscribing] = useState(false);
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
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setError('Authentication required to view strategy details');
        setLoading(false);
        return;
      }

      const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
      const baseURL = isDevelopment ? 'http://localhost:3001' : (process.env.REACT_APP_API_URL || '');
      const sseURL = `${baseURL}/api/v1/strategies/${strategy.id}/pitch?token=${encodeURIComponent(token)}`;

      console.log('🔗 Opening SSE connection for strategy pitch:', strategy.id);

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

  /**
   * Handle subscription - redirect to Stripe checkout
   */
  async function handleSubscribe() {
    setSubscribing(true);

    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        message.error('Please log in to subscribe');
        setSubscribing(false);
        return;
      }

      console.log('🔐 Creating Stripe checkout session for strategy:', strategy.id);

      // Call backend to create Stripe checkout session
      const response = await fetch(`/api/v1/strategies/${strategy.id}/subscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          billingInterval: 'monthly' // Default to monthly
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();

      if (data.url) {
        console.log('✅ Redirecting to Stripe checkout:', data.url);
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned from server');
      }

    } catch (err) {
      console.error('❌ Subscription error:', err);
      message.error(err.message || 'Failed to initiate subscription');
      setSubscribing(false);
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
  const pricingBullets = parsePricingBullets(pricingText);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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

      {/* Flex layout: Strategy Overview + Content Calendar */}
      <div style={{
        display: 'flex',
        gap: '24px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        {/* Strategy Overview - Left side (60%) */}
        <Card
          title={
            <Space>
              <RocketOutlined />
              <span>Strategy Overview</span>
            </Space>
          }
          style={{ flex: '1 1 500px', minWidth: 0 }}
        >
          {loading && !pitchText ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" indicator={<LoadingOutlined spin />} />
              <div style={{ marginTop: '16px', color: '#999' }}>
                Generating personalized strategy pitch...
              </div>
            </div>
          ) : (
            <div style={{ minHeight: '120px' }}>
              {renderPitchText(pitchText)}
              {loading && (
                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                  <LoadingOutlined spin style={{ color: '#1890ff' }} />
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Content Calendar - Right side (40%) */}
        <div style={{ flex: '0 1 380px', minWidth: '320px' }}>
          <ContentCalendarTimeline
            contentIdeas={strategy.contentIdeas}
            sampleIdeas={sampleIdeas}
            loadingSampleIdeas={loadingSampleIdeas}
            sampleIdeasError={sampleIdeasError}
          />
        </div>
      </div>

      {/* Pricing (compact bullets) */}
      <Card
        title={
          <Space>
            <DollarOutlined />
            <span>Pricing & ROI</span>
          </Space>
        }
        style={{ marginBottom: '32px' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '32px', flexWrap: 'wrap' }}>
          {/* Price */}
          <div>
            <div style={{
              fontSize: '42px',
              fontWeight: 'bold',
              color: '#1890ff',
              lineHeight: 1
            }}>
              ${monthlyPrice.toFixed(2)}
            </div>
            <Text type="secondary" style={{ fontSize: '14px' }}>/month</Text>
          </div>

          {/* Bullets */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            {loading && !pricingText ? (
              <div style={{ color: '#999', fontStyle: 'italic' }}>
                <LoadingOutlined spin /> Calculating ROI...
              </div>
            ) : (
              <ul style={{
                margin: 0,
                padding: '0 0 0 20px',
                listStyle: 'none'
              }}>
                {pricingBullets.map((bullet, idx) => (
                  <li key={idx} style={{
                    marginBottom: '10px',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#434343',
                    position: 'relative'
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: '-20px',
                      color: '#52c41a',
                      fontWeight: 'bold'
                    }}>✓</span>
                    {bullet}
                  </li>
                ))}
                <li style={{
                  marginTop: '12px',
                  fontSize: '12px',
                  color: '#8c8c8c',
                  fontStyle: 'italic'
                }}>
                  * AI-estimated projections based on market research
                </li>
              </ul>
            )}
          </div>
        </div>
      </Card>

      {/* Subscribe CTA */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Button
          type="primary"
          size="large"
          icon={<RocketOutlined />}
          onClick={handleSubscribe}
          loading={subscribing}
          style={{
            height: '52px',
            fontSize: '17px',
            padding: '0 56px',
            fontWeight: 600
          }}
        >
          {subscribing ? 'Creating Checkout...' : 'Subscribe Now'}
        </Button>
        <div style={{ marginTop: '12px' }}>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            Secure checkout powered by Stripe
          </Text>
        </div>
      </div>
    </div>
  );
}
