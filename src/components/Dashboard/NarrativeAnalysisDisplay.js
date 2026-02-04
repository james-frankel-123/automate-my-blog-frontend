/**
 * NarrativeAnalysisDisplay — 3-moment narrative-driven website analysis UX (Issue #157).
 * Renders: (1) Scraping narrative with typing cursor, (2) Analysis narrative as markdown
 * in paragraph cards, (3) Audiences progressive reveal. Uses useNarrativeStream when jobId provided.
 */
import React, { useEffect, useRef } from 'react';
import { Card, Typography, Divider } from 'antd';
import StreamingText from '../shared/StreamingText';
import MarkdownPreview from '../MarkdownPreview/MarkdownPreview';
import { useNarrativeStream, MOMENTS } from '../../hooks/useNarrativeStream';
import { systemVoice } from '../../copy/systemVoice';

const { Title, Text } = Typography;

const cardStyles = {
  maxWidth: 800,
  margin: '0 auto',
};

/** Split text into paragraphs (double newline). Empty leading/trailing segments filtered. */
function splitParagraphs(text) {
  if (!text || !text.trim()) return [];
  return text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
}

const paragraphCardBase = {
  marginBottom: 16,
  border: '1px solid var(--color-border-base)',
  borderRadius: 8,
  boxShadow: 'var(--shadow-sm)',
  transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
};

const scrapingCardStyle = {
  ...paragraphCardBase,
  borderLeft: '4px solid var(--color-text-tertiary)',
  background: 'var(--color-background-container)',
};

const analysisCardStyle = {
  ...paragraphCardBase,
  borderLeft: '4px solid var(--color-primary)',
  background: 'var(--color-background-elevated)',
};

const scrapingTextStyle = {
  fontSize: 14,
  fontStyle: 'italic',
  color: 'var(--color-text-secondary)',
  lineHeight: 1.8,
};

const analysisTextStyle = {
  fontSize: 16,
  lineHeight: 1.8,
  color: 'var(--color-text-primary)',
};

/**
 * @param {Object} props
 * @param {string} [props.jobId] - Website analysis job ID for narrative stream
 * @param {Object} [props.analysisResults] - Full analysis result with scenarios (for Moment 3)
 * @param {Function} [props.renderFallback] - Rendered when narrative stream unavailable (e.g. 404). Enables graceful fallback to ThinkingPanel.
 * @param {Function} [props.onNarrativeComplete] - Called when stream ends with final narrative text so parent can persist it (e.g. into analysisResults).
 */
export function NarrativeAnalysisDisplay({ jobId, analysisResults, renderFallback, onNarrativeComplete }) {
  const {
    scrapingNarrative,
    analysisNarrative,
    currentMoment,
    isStreaming,
    narrativeAvailable,
  } = useNarrativeStream(jobId);

  const wasStreamingRef = useRef(false);

  // When stream ends, persist narrative so it doesn’t disappear when this component unmounts
  useEffect(() => {
    if (isStreaming) {
      wasStreamingRef.current = true;
    } else if (wasStreamingRef.current && (analysisNarrative?.trim() || scrapingNarrative?.trim())) {
      wasStreamingRef.current = false;
      onNarrativeComplete?.(analysisNarrative?.trim() || '', scrapingNarrative?.trim() || '');
    }
  }, [isStreaming, analysisNarrative, scrapingNarrative, onNarrativeComplete]);

  // When narrative stream not available and no content, clear jobId in effect so parent can show results
  useEffect(() => {
    if (!jobId || narrativeAvailable || scrapingNarrative || analysisNarrative) return;
    onNarrativeComplete?.('', '');
  }, [jobId, narrativeAvailable, scrapingNarrative, analysisNarrative, onNarrativeComplete]);

  if (!jobId) return null;

  if (!narrativeAvailable && !scrapingNarrative && !analysisNarrative) {
    return renderFallback ? renderFallback() : null;
  }

  const scenarios = analysisResults?.scenarios ?? analysisResults?.analysis?.scenarios ?? [];

  const scrapingParagraphs = splitParagraphs(scrapingNarrative);
  const analysisParagraphs = splitParagraphs(analysisNarrative);
  const showAnalysisSection =
    currentMoment === MOMENTS.ANALYSIS || currentMoment === MOMENTS.AUDIENCES || analysisNarrative;

  // Scraping: complete paragraphs + streaming card for last incomplete
  const scrapingComplete = currentMoment === MOMENTS.SCRAPING && isStreaming && scrapingParagraphs.length > 0
    ? scrapingParagraphs.slice(0, -1)
    : scrapingParagraphs;
  const scrapingStreamingContent = currentMoment === MOMENTS.SCRAPING && isStreaming && scrapingParagraphs.length > 0
    ? scrapingParagraphs[scrapingParagraphs.length - 1]
    : (currentMoment === MOMENTS.SCRAPING && isStreaming ? scrapingNarrative.trim() : '');

  // Analysis: complete paragraphs + streaming card for last incomplete
  const analysisComplete = currentMoment === MOMENTS.ANALYSIS && isStreaming && analysisParagraphs.length > 0
    ? analysisParagraphs.slice(0, -1)
    : analysisParagraphs;
  const analysisStreamingContent = currentMoment === MOMENTS.ANALYSIS && isStreaming && analysisParagraphs.length > 0
    ? analysisParagraphs[analysisParagraphs.length - 1]
    : (currentMoment === MOMENTS.ANALYSIS && isStreaming ? analysisNarrative.trim() : '');

  return (
    <div style={cardStyles}>
      {/* Moment 1: Scraping progress / thought process — one card per paragraph, markdown rendered */}
      {(scrapingNarrative || currentMoment === MOMENTS.SCRAPING) && (
        <div data-testid="narrative-scraping-card">
          {scrapingComplete.map((para, idx) => (
            <Card
              key={`scraping-${idx}`}
              style={{
                ...scrapingCardStyle,
                opacity: currentMoment === MOMENTS.SCRAPING ? 1 : 0.7,
                animation: 'slideInUp 0.4s ease forwards',
                animationDelay: `${idx * 0.08}s`,
              }}
              data-testid={`narrative-scraping-card-${idx}`}
            >
              <div style={scrapingTextStyle}>
                <MarkdownPreview content={para} style={{ margin: 0 }} />
              </div>
            </Card>
          ))}
          {currentMoment === MOMENTS.SCRAPING && isStreaming && (
            <Card
              style={{
                ...scrapingCardStyle,
                opacity: 1,
                animation: 'slideInUp 0.4s ease forwards',
              }}
              data-testid="narrative-scraping-card-streaming"
            >
              <div style={scrapingTextStyle}>
                {scrapingStreamingContent ? (
                  <MarkdownPreview content={scrapingStreamingContent} style={{ margin: 0 }} />
                ) : null}
                <StreamingText content="" isStreaming />
              </div>
            </Card>
          )}
        </div>
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

      {/* Moment 2: Analysis narrative — one card per paragraph, markdown rendered */}
      {showAnalysisSection && (
        <div data-testid="narrative-analysis-card">
          <Title level={4} style={{ marginBottom: 16, marginTop: 8 }}>
            {systemVoice.analysis.whatIDiscovered}
          </Title>
          {analysisComplete.map((para, idx) => (
            <Card
              key={`analysis-${idx}`}
              style={{
                ...analysisCardStyle,
                animation: 'slideInUp 0.4s ease forwards',
                animationDelay: `${idx * 0.08}s`,
              }}
              data-testid={`narrative-analysis-card-${idx}`}
            >
              <div style={analysisTextStyle}>
                <MarkdownPreview content={para} style={{ margin: 0 }} />
              </div>
            </Card>
          ))}
          {currentMoment === MOMENTS.ANALYSIS && isStreaming && (
            <Card
              style={{
                ...analysisCardStyle,
                animation: 'slideInUp 0.4s ease forwards',
              }}
              data-testid="narrative-analysis-card-streaming"
            >
              <div style={analysisTextStyle}>
                {analysisStreamingContent ? (
                  <MarkdownPreview content={analysisStreamingContent} style={{ margin: 0 }} />
                ) : null}
                <StreamingText content="" isStreaming />
              </div>
            </Card>
          )}
        </div>
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
                <div style={{ marginTop: 8 }}>
                  <MarkdownPreview content={scenario.pitch} style={{ marginBottom: 0 }} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default NarrativeAnalysisDisplay;
