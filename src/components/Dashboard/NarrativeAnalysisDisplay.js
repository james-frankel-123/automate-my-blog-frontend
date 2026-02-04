/**
 * NarrativeAnalysisDisplay — 3-moment narrative-driven website analysis UX (Issue #157).
 * Renders: (1) Scraping narrative with typing cursor, (2) Analysis narrative,
 * (3) Audiences progressive reveal. Uses useNarrativeStream when jobId provided.
 */
import React from 'react';
import { Card, Typography, Divider } from 'antd';
import StreamingText from '../shared/StreamingText';
import { useNarrativeStream, MOMENTS } from '../../hooks/useNarrativeStream';
import { systemVoice } from '../../copy/systemVoice';

const { Title, Text } = Typography;

const cardStyles = {
  maxWidth: 800,
  margin: '0 auto',
};

const scrapingCard = {
  marginBottom: 24,
  transition: 'opacity 0.3s ease',
};

const scrapingText = {
  fontSize: 14,
  fontStyle: 'italic',
  color: 'var(--color-text-secondary)',
  lineHeight: 1.8,
};

const analysisCard = {
  marginBottom: 24,
  borderLeft: '4px solid var(--color-primary)',
};

const analysisText = {
  fontSize: 16,
  lineHeight: 1.8,
  color: 'var(--color-text-primary)',
};

/**
 * @param {Object} props
 * @param {string} [props.jobId] - Website analysis job ID for narrative stream
 * @param {Object} [props.analysisResults] - Full analysis result with scenarios (for Moment 3)
 */
export function NarrativeAnalysisDisplay({ jobId, analysisResults }) {
  const {
    scrapingNarrative,
    analysisNarrative,
    currentMoment,
    isStreaming,
    narrativeAvailable,
  } = useNarrativeStream(jobId);

  if (!jobId) return null;

  // Don't render if narrative stream not available and no content (caller should show fallback)
  if (!narrativeAvailable && !scrapingNarrative && !analysisNarrative) {
    return null;
  }

  const scenarios = analysisResults?.scenarios ?? analysisResults?.analysis?.scenarios ?? [];

  return (
    <div style={cardStyles}>
      {/* Moment 1: Scraping narrative */}
      {(scrapingNarrative || currentMoment === MOMENTS.SCRAPING) && (
        <Card
          style={{
            ...scrapingCard,
            opacity: currentMoment === MOMENTS.SCRAPING ? 1 : 0.7,
          }}
          data-testid="narrative-scraping-card"
        >
          <div style={scrapingText}>
            <StreamingText
              content={scrapingNarrative}
              isStreaming={currentMoment === MOMENTS.SCRAPING && isStreaming}
            />
          </div>
        </Card>
      )}

      {/* Transition */}
      {currentMoment === MOMENTS.TRANSITION && (
        <div
          style={{
            textAlign: 'center',
            margin: '32px 0',
            opacity: 0,
            animation: 'fadeIn 0.5s ease forwards',
          }}
        >
          <Divider>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {systemVoice.analysis.analysisComplete}
            </Text>
          </Divider>
        </div>
      )}

      {/* Moment 2: Analysis narrative */}
      {(currentMoment === MOMENTS.ANALYSIS || currentMoment === MOMENTS.AUDIENCES || analysisNarrative) && (
        <Card style={analysisCard} data-testid="narrative-analysis-card">
          <Title level={4} style={{ marginBottom: 16 }}>
            {systemVoice.analysis.whatIDiscovered}
          </Title>
          <div style={analysisText}>
            <StreamingText
              content={analysisNarrative}
              isStreaming={currentMoment === MOMENTS.ANALYSIS && isStreaming}
            />
          </div>
        </Card>
      )}

      {/* Moment 3: Audiences */}
      {currentMoment === MOMENTS.AUDIENCES && scenarios.length > 0 && (
        <div
          style={{
            opacity: 0,
            animation: 'slideInUp 0.6s ease 0.3s forwards',
          }}
          data-testid="narrative-audiences-section"
        >
          <Title level={4} style={{ marginTop: 32, marginBottom: 16 }}>
            {systemVoice.analysis.yourBestOpportunities}
          </Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
            {systemVoice.analysis.audiencesIntro}
          </Text>
          {scenarios.map((scenario, idx) => (
            <Card
              key={scenario.id ?? idx}
              style={{
                marginBottom: 16,
                opacity: 0,
                animation: 'slideInUp 0.5s ease forwards',
                animationDelay: `${idx * 0.2}s`,
              }}
            >
              {scenario.targetSegment && (
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  {scenario.targetSegment}
                </Text>
              )}
              {scenario.customerProblem && (
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {scenario.customerProblem}
                </Text>
              )}
              {scenario.pitch && (
                <Paragraph style={{ marginBottom: 0 }}>{scenario.pitch}</Paragraph>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default NarrativeAnalysisDisplay;
