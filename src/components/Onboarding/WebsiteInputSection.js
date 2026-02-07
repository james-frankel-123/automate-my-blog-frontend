/**
 * WebsiteInputSection — URL form + analysis status updates (no narration here).
 * Issue #261.
 */
import React from 'react';
import { Form, Input, Button, Spin } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import ThinkingPanel from '../shared/ThinkingPanel';
import { systemVoice } from '../../copy/systemVoice';

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
  analysisThoughts = [],
  dataTestId = 'website-input-section',
}) {
  const handleSubmit = () => {
    if (websiteUrl?.trim()) onAnalyze?.(websiteUrl.trim());
  };

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
      {loading && (
        <div style={{ marginTop: 20, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
          {(analysisProgress || scanningMessage) ? (
            <ThinkingPanel
              isActive
              currentStep={analysisProgress?.currentStep || scanningMessage}
              progress={analysisProgress?.progress}
              thoughts={analysisThoughts}
              estimatedTimeRemaining={analysisProgress?.estimatedTimeRemaining}
              phase={analysisProgress?.phase}
              detail={analysisProgress?.detail}
              workingForYouLabel={systemVoice.analysis.workingForYou}
              progressPreamble={systemVoice.analysis.progressPreamble}
              progressLabel={systemVoice.analysis.progressLabel}
              fallbackStep={systemVoice.analysis.defaultProgress}
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
