import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tabs, Card, Button, Alert, Typography, Divider, message, Spin, Steps } from 'antd';
import {
  GoogleOutlined,
  LineChartOutlined,
  SearchOutlined,
  BarChartOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  BulbOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  CheckOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Paragraph, Text } = Typography;

/**
 * Parse inline markdown (bold text)
 */
function parseInlineMarkdown(text) {
  const parts = [];
  let lastIndex = 0;
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    // Add bold text
    parts.push(<strong key={match.index}>{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Parse and render markdown-formatted text
 * Handles bold headers, bullet points, and inline bold text
 */
function renderMarkdownText(text) {
  if (!text) return null;

  // Split into lines
  const lines = text.split('\n');
  const elements = [];
  let currentList = [];

  lines.forEach((line, idx) => {
    const trimmedLine = line.trim();

    // Bold headers (e.g., **📈 TRENDING TOPICS FOUND:**)
    if (trimmedLine.match(/^\*\*[^*]+\*\*:?\s*$/)) {
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
                {parseInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }

      const headerText = trimmedLine.replace(/\*\*/g, '').replace(/:$/, '').trim();
      elements.push(
        <Text key={`header-${idx}`} strong style={{
          display: 'block',
          fontSize: '16px',
          color: '#262626',
          marginTop: elements.length > 0 ? '20px' : '0',
          marginBottom: '12px'
        }}>
          {headerText}
        </Text>
      );
    }
    // Bullet points (e.g., • Item text or - Item text)
    else if (trimmedLine.match(/^[•\-]\s/)) {
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
                {parseInlineMarkdown(item)}
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
          {parseInlineMarkdown(trimmedLine)}
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
            {parseInlineMarkdown(item)}
          </li>
        ))}
      </ul>
    );
  }

  return <div>{elements}</div>;
}

/**
 * Setup Instructions Component
 * Shows step-by-step OAuth setup guide
 */
function SetupInstructions({ service }) {
  const getServiceName = () => {
    switch (service) {
      case 'search_console':
        return 'Google Search Console';
      case 'analytics':
        return 'Google Analytics';
      case 'trends':
        return 'Google Trends';
      default:
        return 'Google';
    }
  };

  const getRequiredAPI = () => {
    switch (service) {
      case 'search_console':
        return 'Google Search Console API';
      case 'analytics':
        return 'Google Analytics Data API';
      case 'trends':
        return null; // Trends doesn't need OAuth
      default:
        return null;
    }
  };

  const getRequiredScope = () => {
    switch (service) {
      case 'search_console':
        return 'https://www.googleapis.com/auth/webmasters.readonly';
      case 'analytics':
        return 'https://www.googleapis.com/auth/analytics.readonly';
      default:
        return null;
    }
  };

  // Special handling for Trends (no OAuth needed)
  if (service === 'trends') {
    return (
      <Card
        style={{
          marginTop: '24px',
          backgroundColor: '#f0f7ff',
          border: '1px solid #d6e4ff'
        }}
      >
        <Title level={4} style={{ marginTop: 0 }}>
          <SettingOutlined /> No Setup Required!
        </Title>
        <Paragraph>
          Google Trends doesn't require OAuth authentication. We use Google's public Trends API to fetch trending topics and search data.
        </Paragraph>
        <Paragraph>
          Simply click the <strong>"Connect {getServiceName()}"</strong> button above to start using trending data in your content strategy.
        </Paragraph>
        <Alert
          message="Public Data Access"
          description="Google Trends data is publicly available and doesn't require account authentication. We'll automatically track trending topics relevant to your content."
          type="info"
          showIcon
          style={{ marginTop: '16px' }}
        />
      </Card>
    );
  }

  // OAuth setup instructions for Search Console and Analytics
  return (
    <Card
      style={{
        marginTop: '24px',
        backgroundColor: '#f0f7ff',
        border: '1px solid #d6e4ff'
      }}
    >
      <Title level={4} style={{ marginTop: 0 }}>
        <SettingOutlined /> Setup Guide: {getServiceName()}
      </Title>

      <Paragraph>
        To connect {getServiceName()}, you'll need to set up OAuth credentials in Google Cloud Console. This takes about 5 minutes.
      </Paragraph>

      <Steps
        direction="vertical"
        size="small"
        current={-1}
        items={[
          {
            title: 'Go to Google Cloud Console',
            description: (
              <div>
                <Paragraph>
                  Visit{' '}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    console.cloud.google.com/apis/credentials
                  </a>
                </Paragraph>
              </div>
            ),
            icon: <CheckOutlined />
          },
          {
            title: 'Create or Select a Project',
            description: (
              <div>
                <Paragraph>
                  • Click the project dropdown at the top<br />
                  • Create a new project or select an existing one<br />
                  • Name it something like "Automate My Blog"
                </Paragraph>
              </div>
            ),
            icon: <CheckOutlined />
          },
          {
            title: 'Enable Required API',
            description: (
              <div>
                <Paragraph>
                  • Go to "APIs & Services" → "Library"<br />
                  • Search for: <Text code>{getRequiredAPI()}</Text><br />
                  • Click the API and press "Enable"
                </Paragraph>
              </div>
            ),
            icon: <CheckOutlined />
          },
          {
            title: 'Configure OAuth Consent Screen',
            description: (
              <div>
                <Paragraph>
                  • Go to "APIs & Services" → "OAuth consent screen"<br />
                  • Select "External" user type (for testing)<br />
                  • Fill in app name: "Automate My Blog"<br />
                  • Add your email address<br />
                  • Add required scope: <Text code>{getRequiredScope()}</Text><br />
                  • Add yourself as a test user
                </Paragraph>
              </div>
            ),
            icon: <CheckOutlined />
          },
          {
            title: 'Create OAuth Client ID',
            description: (
              <div>
                <Paragraph>
                  • Go to "Credentials" → "Create Credentials" → "OAuth client ID"<br />
                  • Application type: <strong>Web application</strong><br />
                  • Name: "Automate My Blog - {getServiceName()}"<br />
                  • <strong>Authorized redirect URIs</strong> - Add this exact URL:<br />
                  <Text code style={{ display: 'block', marginTop: '8px', padding: '8px', background: 'white' }}>
                    {window.location.origin}/api/v1/google/oauth/callback
                  </Text>
                </Paragraph>
              </div>
            ),
            icon: <CheckOutlined />
          },
          {
            title: 'Copy Credentials',
            description: (
              <div>
                <Paragraph>
                  • Click "Create"<br />
                  • Copy the <strong>Client ID</strong> and <strong>Client Secret</strong><br />
                  • You'll need to provide these to your site administrator
                </Paragraph>
                <Alert
                  message="Contact Your Administrator"
                  description="Share the Client ID and Client Secret with your site administrator to complete the setup. They'll add these credentials to the backend configuration."
                  type="warning"
                  showIcon
                  style={{ marginTop: '12px' }}
                />
              </div>
            ),
            icon: <CheckOutlined />
          },
          {
            title: 'Connect Your Account',
            description: (
              <div>
                <Paragraph>
                  Once your administrator has configured the credentials, click the{' '}
                  <strong>"Connect {getServiceName()}"</strong> button above to authorize access to your {getServiceName()} data.
                </Paragraph>
              </div>
            ),
            icon: <CheckOutlined />
          }
        ]}
      />

      <Divider />

      <Alert
        message="Developer Note"
        description={
          <>
            If you're running this locally, the credentials need to be added to your{' '}
            <Text code>.env</Text> file:
            <pre style={{ marginTop: '8px', padding: '8px', background: 'white', borderRadius: '4px' }}>
              GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"{'\n'}
              GOOGLE_CLIENT_SECRET="your-client-secret"{'\n'}
              GOOGLE_REDIRECT_URI="{window.location.origin}/api/v1/google/oauth/callback"
            </pre>
            Then restart your backend server.
          </>
        }
        type="info"
        showIcon
      />
    </Card>
  );
}

/**
 * Single Integration Tab Content
 * Shows connection button first, then "Why connect?" triggers LLM streaming
 */
function IntegrationTabContent({ service, title, icon, shortDescription }) {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pitch, setPitch] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [showPitch, setShowPitch] = useState(false);
  const [pitchLoading, setPitchLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [preview, setPreview] = useState('');
  const [previewStreaming, setPreviewStreaming] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const eventSourceRef = useRef(null);
  const previewEventSourceRef = useRef(null);

  const checkConnection = useCallback(async () => {
    try {
      const response = await api.get(`/api/v1/google/oauth/status/${service}`);
      setIsConnected(response.connected || false);
    } catch (err) {
      console.error('Failed to check connection:', err);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    checkConnection();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (previewEventSourceRef.current) {
        previewEventSourceRef.current.close();
      }
    };
  }, [service, checkConnection]);

  const streamPitchFromLLM = async () => {
    if (showPitch) {
      // If already showing, hide it
      setShowPitch(false);
      setPitch('');
      return;
    }

    setShowPitch(true);
    setPitchLoading(true);
    setStreaming(true);
    setPitch('');

    try {
      // For EventSource/SSE, we need to use the backend URL directly
      // because the proxy doesn't always work with EventSource
      const isDevelopment = window.location.hostname === 'localhost';
      const baseURL = isDevelopment
        ? 'http://localhost:3001'
        : (process.env.REACT_APP_API_URL || '');

      const eventSource = new EventSource(
        `${baseURL}/api/v1/google/integration-pitch/stream?service=${service}`,
        { withCredentials: true }
      );

      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'chunk') {
            setPitch((prev) => prev + data.content);
          } else if (data.type === 'complete') {
            setStreaming(false);
            setPitchLoading(false);
            eventSource.close();
          } else if (data.type === 'error') {
            setStreaming(false);
            setPitchLoading(false);
            message.error('Failed to generate pitch');
            eventSource.close();
          }
        } catch (err) {
          console.error('Error parsing SSE data:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE error:', err);
        setStreaming(false);
        setPitchLoading(false);
        message.error('Connection error while generating pitch');
        eventSource.close();
      };
    } catch (err) {
      console.error('Failed to stream pitch:', err);
      setStreaming(false);
      setPitchLoading(false);
      message.error('Failed to generate pitch');
    }
  };

  const toggleSetupInstructions = () => {
    setShowSetup(!showSetup);
  };

  const fetchTrendsPreview = async () => {
    console.log('📈 fetchTrendsPreview() called');
    setShowPreview(true);
    setPreviewStreaming(true);
    setPreview('');

    try {
      // For EventSource/SSE, we need to use the backend URL directly
      // because the proxy doesn't always work with EventSource
      const isDevelopment = window.location.hostname === 'localhost';
      const baseURL = isDevelopment
        ? 'http://localhost:3001'
        : (process.env.REACT_APP_API_URL || '');

      console.log('📈 Base URL:', baseURL);

      // Get token from localStorage (EventSource can't send custom headers)
      const token = localStorage.getItem('accessToken');
      console.log('📈 Token found:', !!token);

      if (!token) {
        console.error('❌ No accessToken in localStorage');
        message.error('Please log in to view trending topics');
        setShowPreview(false);
        setPreviewStreaming(false);
        return;
      }

      const url = `${baseURL}/api/v1/google/trends/preview?token=${encodeURIComponent(token)}`;
      console.log('📈 Connecting to:', url);

      const eventSource = new EventSource(url, { withCredentials: true });

      previewEventSourceRef.current = eventSource;

      console.log('📈 EventSource created');

      eventSource.onmessage = (event) => {
        console.log('📈 SSE message received:', event.data);

        try {
          const data = JSON.parse(event.data);

          if (data.type === 'chunk') {
            setPreview((prev) => prev + data.content);
          } else if (data.type === 'complete') {
            setPreviewStreaming(false);
            eventSource.close();
          } else if (data.type === 'error') {
            setPreviewStreaming(false);
            message.error('Failed to fetch trending preview');
            eventSource.close();
          }
        } catch (err) {
          console.error('Error parsing SSE data:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE error:', err);
        setPreviewStreaming(false);
        message.error('Connection error while fetching trends');
        eventSource.close();
      };
    } catch (err) {
      console.error('Failed to fetch trends preview:', err);
      setPreviewStreaming(false);
      message.error('Failed to fetch trending topics');
    }
  };

  const handleConnect = async () => {
    try {
      const response = await api.get(`/api/v1/google/oauth/authorize/${service}`);

      // Special case: Service doesn't require OAuth (e.g., Google Trends)
      if (response.success && response.noOAuthRequired) {
        message.success(`${title} connected successfully!`);
        setIsConnected(true);

        // For Google Trends, automatically fetch preview
        if (service === 'trends') {
          console.log('🔍 Google Trends connected, fetching preview...');
          setTimeout(() => {
            console.log('🔍 Calling fetchTrendsPreview()');
            fetchTrendsPreview();
          }, 500);
        }

        return;
      }

      // Standard OAuth flow
      if (response.success && response.authUrl) {
        window.location.href = response.authUrl;
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (err) {
      console.error('Failed to connect:', err);
      message.error(`Failed to connect ${title}`);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await api.delete(`/api/v1/google/oauth/disconnect/${service}`);
      if (response.success) {
        message.success(`${title} disconnected`);
        setIsConnected(false);
        setShowPitch(false);
        setPitch('');
      }
    } catch (err) {
      message.error(`Failed to disconnect ${title}`);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header with Icon */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', color: '#1890ff', marginBottom: '16px' }}>
          {icon}
        </div>
        <Title level={2} style={{ margin: 0 }}>
          {title}
        </Title>
      </div>

      {/* Connection Status */}
      {isConnected ? (
        <>
          <Alert
            message="✓ Connected & Active"
            description="Integration is live and working."
            type="success"
            showIcon
            style={{ marginBottom: '24px' }}
            action={
              <Button size="small" danger onClick={handleDisconnect}>
                Disconnect
              </Button>
            }
          />

          {/* What Happens Next */}
          <Card style={{ marginBottom: '32px' }}>
            <Title level={4} style={{ marginTop: 0 }}>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
              What happens now?
            </Title>

            {service === 'trends' && !showPreview && (
              <>
                <Paragraph>
                  <strong>📈 Tracking trending topics:</strong> We check Google Trends daily at 6:00 AM to find rising search queries in your niche.
                </Paragraph>
                <Paragraph>
                  <strong>📍 Where you'll see this:</strong>
                </Paragraph>
                <ul style={{ marginBottom: '16px' }}>
                  <li><strong>Content Calendar:</strong> Topics marked with "Trending Now" badges</li>
                  <li><strong>Topic Suggestions:</strong> Rising search terms automatically added</li>
                  <li><strong>Blog Posts:</strong> Titles and keywords optimized for trending topics</li>
                </ul>
                <Paragraph>
                  <strong>⏰ Timeline:</strong> First trending data will appear in your next content calendar generation (typically within 24 hours).
                </Paragraph>
              </>
            )}

            {service === 'trends' && showPreview && (
              <div style={{
                padding: '20px',
                backgroundColor: '#f0f7ff',
                borderRadius: '8px',
                border: '1px solid #d6e4ff',
                marginBottom: '16px'
              }}>
                <Title level={5} style={{ marginTop: 0, color: '#1890ff' }}>
                  <BulbOutlined /> Trending Topics Found for Your Business
                </Title>
                <div style={{
                  fontSize: '15px',
                  lineHeight: '1.8',
                  color: '#262626',
                  minHeight: previewStreaming ? '80px' : 'auto'
                }}>
                  {renderMarkdownText(preview)}
                  {previewStreaming && (
                    <span style={{
                      display: 'inline-block',
                      width: '2px',
                      height: '1em',
                      backgroundColor: '#1890ff',
                      marginLeft: '4px',
                      animation: 'blink 1s step-end infinite'
                    }} />
                  )}
                </div>
              </div>
            )}

            {service === 'search_console' && (
              <>
                <Paragraph>
                  <strong>🔍 Tracking search rankings:</strong> We pull your Google Search Console data daily to find high-opportunity keywords.
                </Paragraph>
                <Paragraph>
                  <strong>📍 Where you'll see this:</strong>
                </Paragraph>
                <ul style={{ marginBottom: '16px' }}>
                  <li><strong>Content Calendar:</strong> Topics tagged "Search Opportunity" (high impressions, low CTR)</li>
                  <li><strong>Performance Dashboard:</strong> See which posts are ranking and where</li>
                  <li><strong>Keyword Suggestions:</strong> Queries where you're close to page 1</li>
                </ul>
                <Paragraph>
                  <strong>⏰ Timeline:</strong> First search data will sync tonight at 6:00 AM and appear in your dashboard by morning.
                </Paragraph>
              </>
            )}

            {service === 'analytics' && (
              <>
                <Paragraph>
                  <strong>📊 Tracking conversions:</strong> We analyze your Google Analytics data to see which content drives leads and sales.
                </Paragraph>
                <Paragraph>
                  <strong>📍 Where you'll see this:</strong>
                </Paragraph>
                <ul style={{ marginBottom: '16px' }}>
                  <li><strong>Content Calendar:</strong> More content following patterns that convert</li>
                  <li><strong>Performance Scores:</strong> See conversion rates for each post</li>
                  <li><strong>Smart Recommendations:</strong> Topics based on what's already working</li>
                </ul>
                <Paragraph>
                  <strong>⏰ Timeline:</strong> First analytics data will sync tonight at 6:00 AM. Performance insights appear after 7 days of data.
                </Paragraph>
              </>
            )}

            <Alert
              message="💡 Pro Tip"
              description={`Generate a new content calendar after 24 hours to see ${title} data in action. The AI will automatically prioritize topics based on real ${service === 'trends' ? 'trending searches' : service === 'search_console' ? 'ranking opportunities' : 'conversion data'}.`}
              type="info"
              showIcon
              style={{ marginTop: '16px' }}
            />
          </Card>
        </>
      ) : (
        <>
          {/* Short Description */}
          <div style={{
            marginBottom: '32px',
            fontSize: '16px',
            lineHeight: '1.8',
            color: '#595959',
            textAlign: 'center',
            maxWidth: '700px',
            margin: '0 auto 32px'
          }}>
            {shortDescription}
          </div>

          {/* Connect Button */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: '24px'
            }}
          >
            <Button
              type="primary"
              size="large"
              icon={<RocketOutlined />}
              onClick={handleConnect}
              style={{
                height: '56px',
                fontSize: '18px',
                fontWeight: 600,
                paddingLeft: '48px',
                paddingRight: '48px',
                marginBottom: '16px'
              }}
            >
              Connect {title}
            </Button>
            <div style={{ marginBottom: '16px' }}>
              <Text type="secondary" style={{ fontSize: '13px' }}>
                Free • Takes 2 minutes • Secure OAuth
              </Text>
            </div>

            {/* "Why connect this?" Button */}
            <Button
              type="link"
              icon={<QuestionCircleOutlined />}
              onClick={streamPitchFromLLM}
              loading={pitchLoading && !streaming}
              style={{
                fontSize: '14px',
                color: '#1890ff',
                marginRight: '12px'
              }}
            >
              {showPitch ? 'Hide details' : 'Why connect this?'}
            </Button>

            {/* "Help me get set up" Button */}
            <Button
              type="link"
              icon={<SettingOutlined />}
              onClick={toggleSetupInstructions}
              style={{
                fontSize: '14px',
                color: '#52c41a'
              }}
            >
              {showSetup ? 'Hide setup guide' : 'Help me get set up'}
            </Button>
          </div>

          {/* Streaming LLM-Generated Pitch */}
          {showPitch && (
            <div
              style={{
                marginTop: '32px',
                padding: '24px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                fontSize: '15px',
                lineHeight: '1.8',
                color: '#262626',
                minHeight: '100px',
                opacity: 1,
                animation: 'fadeIn 0.3s ease-in'
              }}
            >
              {pitch}
              {streaming && (
                <span style={{
                  display: 'inline-block',
                  width: '2px',
                  height: '1em',
                  backgroundColor: '#1890ff',
                  marginLeft: '4px',
                  animation: 'blink 1s step-end infinite'
                }} />
              )}
              {!streaming && pitch && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #d9d9d9' }}>
                  <Text type="secondary" style={{ fontSize: '13px', fontStyle: 'italic' }}>
                    ✨ AI-generated explanation
                  </Text>
                </div>
              )}
            </div>
          )}

          {/* Setup Instructions (shown after pitch or when toggled) */}
          {(showSetup || (!streaming && pitch)) && (
            <SetupInstructions service={service} />
          )}
        </>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          50.1%, 100% { opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/**
 * Main Google Integrations Tab with Tabs for each service
 */
export default function GoogleIntegrationsTab() {
  const [activeTab, setActiveTab] = useState('trends');

  // Check for OAuth callback parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectedService = params.get('connected');
    const error = params.get('error');

    if (connectedService) {
      message.success(`${connectedService.replace(/_/g, ' ')} connected successfully!`);
      window.history.replaceState({}, document.title, window.location.pathname);
      // Switch to the connected tab
      setActiveTab(connectedService);
    }

    if (error) {
      message.error(`Connection failed: ${error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const tabs = [
    {
      key: 'trends',
      label: (
        <span>
          <LineChartOutlined /> Find Emerging Topics
        </span>
      ),
      children: (
        <IntegrationTabContent
          service="trends"
          title="Find Emerging Topics"
          icon={<LineChartOutlined />}
          shortDescription="See what people are searching for right now. Create content on rising topics before your competitors."
        />
      )
    },
    {
      key: 'search_console',
      label: (
        <span>
          <SearchOutlined /> Improve Search Rankings
        </span>
      ),
      children: (
        <IntegrationTabContent
          service="search_console"
          title="Improve Search Rankings"
          icon={<SearchOutlined />}
          shortDescription="Track your Google rankings and discover keywords where you're close to page 1. Automatically create content to boost visibility."
        />
      )
    },
    {
      key: 'analytics',
      label: (
        <span>
          <BarChartOutlined /> Track What Converts
        </span>
      ),
      children: (
        <IntegrationTabContent
          service="analytics"
          title="Track What Converts"
          icon={<BarChartOutlined />}
          shortDescription="See which content drives leads and customers. Automatically create more content following your best-performing patterns."
        />
      )
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <Title level={1}>
          <GoogleOutlined /> Google Integrations
        </Title>
        <Paragraph style={{ fontSize: '16px', maxWidth: '700px', margin: '0 auto' }}>
          Connect Google services to unlock automatic optimization. We'll track performance
          data and continuously improve your content strategy—no manual work required.
        </Paragraph>
      </div>

      {/* Tabs for Each Integration */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="large"
        centered
        items={tabs}
      />
    </div>
  );
}
