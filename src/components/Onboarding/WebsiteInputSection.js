/**
 * WebsiteInputSection — URL form + analysis status updates with streaming narration.
 * Issue #261.
 */
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Spin, Typography } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import ChecklistProgress from '../shared/ChecklistProgress';
import { systemVoice } from '../../copy/systemVoice';

const { Text } = Typography;

const compactRowStyle = {
  width: '100%',
  boxShadow: 'var(--shadow-focus)',
  borderRadius: 8,
  display: 'flex',
  flexWrap: 'nowrap',
};

export function WebsiteInputSection({
  websiteUrl,
  setWebsiteUrl,
  onAnalyze,
  loading = false,
  scanningMessage = '',
  analysisProgress = null,
  analysisThoughts: _analysisThoughts = [],
  dataTestId = 'website-input-section',
}) {
  const [streamingText, setStreamingText] = useState('');
  const [showStreamingText, setShowStreamingText] = useState(false);

  const handleSubmit = () => {
    if (websiteUrl?.trim()) onAnalyze?.(websiteUrl.trim());
  };

  // Typing effect for streaming narration
  useEffect(() => {
    if (loading && !showStreamingText) {
      // Small delay before starting typing
      const startDelay = setTimeout(() => {
        setShowStreamingText(true);
        const fullMessage = "Let me take a look at your website, hold tight";
        let currentIndex = 0;

        const typingInterval = setInterval(() => {
          if (currentIndex <= fullMessage.length) {
            setStreamingText(fullMessage.slice(0, currentIndex));
            currentIndex++;
          } else {
            clearInterval(typingInterval);
          }
        }, 40); // 40ms per character

        return () => clearInterval(typingInterval);
      }, 500);

      return () => clearTimeout(startDelay);
    } else if (!loading) {
      setShowStreamingText(false);
      setStreamingText('');
    }
  }, [loading, showStreamingText]);

  return (
    <div data-testid={dataTestId} style={{ marginBottom: 32 }}>
      <Form onFinish={handleSubmit} style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={compactRowStyle}>
          <Input
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl?.(e.target.value)}
            placeholder={systemVoice.analysis.inputPlaceholder}
            size="large"
            prefix={<GlobalOutlined style={{ color: 'var(--color-text-tertiary)' }} />}
            disabled={loading}
            onPressEnter={handleSubmit}
            data-testid="website-url-input"
            style={{ flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
          />
          <Button
            type="primary"
            size="large"
            onClick={handleSubmit}
            loading={loading}
            disabled={!websiteUrl?.trim()}
            data-testid="analyze-button"
            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
          >
            {loading ? systemVoice.analysis.analyzing : systemVoice.analysis.analyze}
          </Button>
        </div>
      </Form>

      {/* Streaming narration text */}
      {loading && showStreamingText && streamingText && (
        <div
          style={{
            textAlign: 'center',
            marginTop: '16px',
            marginBottom: '16px',
            minHeight: '28px',
            opacity: 1,
            transition: 'opacity 0.3s ease-in'
          }}
        >
          <Text
            style={{
              fontSize: '16px',
              color: 'var(--color-text-secondary)',
              fontStyle: 'italic'
            }}
          >
            {streamingText}
            {streamingText.length > 0 && streamingText.length < 46 && (
              <span
                style={{
                  display: 'inline-block',
                  width: '2px',
                  height: '1em',
                  backgroundColor: 'var(--color-primary)',
                  marginLeft: '2px',
                  animation: 'blink 1s step-end infinite',
                  verticalAlign: 'text-bottom'
                }}
              />
            )}
          </Text>
        </div>
      )}

      {loading && (
        <div style={{ marginTop: 20, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
          {(analysisProgress || scanningMessage) ? (
            <ChecklistProgress
              steps={systemVoice.analysis.steps}
              currentStep={analysisProgress?.currentStep || scanningMessage}
              phase={analysisProgress?.phase}
              progress={analysisProgress?.progress}
              estimatedTimeRemaining={analysisProgress?.estimatedTimeRemaining}
              dataTestId="analysis-status-updates"
            />
          ) : (
            <div
              style={{
                padding: 24,
                textAlign: 'center',
                background: 'var(--color-background-alt)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border-base)',
                color: 'var(--color-text-secondary)',
              }}
              data-testid="analysis-starting"
            >
              <Spin size="small" style={{ marginRight: 8 }} />
              {systemVoice.analysis?.startingAnalysis ?? 'Starting analysis…'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WebsiteInputSection;
