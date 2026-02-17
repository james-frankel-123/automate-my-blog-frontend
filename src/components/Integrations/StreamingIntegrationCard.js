import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Alert, Typography } from 'antd';
import { GoogleOutlined, RocketOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

/**
 * StreamingIntegrationCard - Displays streaming pitch for a Google integration
 * Shows personalized value proposition with real-time streaming text
 */
export default function StreamingIntegrationCard({
  service, // 'trends', 'search_console', 'analytics'
  title,
  icon,
  isConnected,
  onConnect,
  onDisconnect
}) {
  const [pitch, setPitch] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (!isConnected) {
      fetchPitch();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [isConnected, service]);

  const fetchPitch = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('Not authenticated');
      return;
    }

    // Get base URL from environment or default to localhost
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    const sseURL = `${baseURL}/api/v1/google/pitch/${service}?token=${token}`;

    setStreaming(true);
    setPitch('');
    setError(null);

    try {
      const eventSource = new EventSource(sseURL);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'pitch-chunk') {
          setPitch(prev => prev + data.content);
        } else if (data.type === 'complete') {
          setStreaming(false);
          eventSource.close();
        } else if (data.type === 'error') {
          setError(data.content);
          setStreaming(false);
          eventSource.close();
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE error:', err);
        setError('Failed to load integration details');
        setStreaming(false);
        eventSource.close();
      };
    } catch (err) {
      console.error('Failed to initialize SSE:', err);
      setError('Failed to connect to server');
      setStreaming(false);
    }
  };

  return (
    <Card style={{
      height: '100%',
      border: isConnected ? '2px solid #52c41a' : '1px solid #d9d9d9',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '32px', color: '#1890ff' }}>
          {icon || <GoogleOutlined />}
        </div>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {title}
          </Title>
          {isConnected && (
            <Text type="success" style={{ fontSize: '12px' }}>
              <CheckCircleOutlined /> Connected
            </Text>
          )}
        </div>
      </div>

      {/* Connection Status / Pitch */}
      {isConnected ? (
        <>
          <Alert
            message="Integration Active"
            description="This integration is connected and tracking data."
            type="success"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          <Button danger onClick={onDisconnect}>
            Disconnect
          </Button>
        </>
      ) : (
        <>
          {/* Streaming Pitch */}
          <div style={{
            minHeight: '200px',
            marginBottom: '20px',
            lineHeight: '1.6',
            fontSize: '14px',
            flex: 1,
            overflow: 'auto'
          }}>
            {error ? (
              <Alert message={error} type="error" showIcon />
            ) : (
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {pitch}
                {streaming && (
                  <span style={{
                    display: 'inline-block',
                    width: '2px',
                    height: '1em',
                    backgroundColor: '#1890ff',
                    marginLeft: '2px',
                    animation: 'blink 1s step-end infinite'
                  }} />
                )}
              </div>
            )}
          </div>

          {/* Connect Button */}
          <Button
            type="primary"
            size="large"
            icon={<RocketOutlined />}
            onClick={onConnect}
            block
            disabled={streaming}
            style={{
              height: '48px',
              fontSize: '16px',
              fontWeight: 600
            }}
          >
            {streaming ? 'Loading...' : 'Connect Now'}
          </Button>
        </>
      )}

      {/* CSS Animation for cursor blink */}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          50.1%, 100% { opacity: 0; }
        }
      `}</style>
    </Card>
  );
}
