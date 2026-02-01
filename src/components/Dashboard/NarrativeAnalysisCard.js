import React from 'react';
import { Card, Typography, Divider } from 'antd';

const { Title, Text } = Typography;

/**
 * NarrativeAnalysisCard - Displays website analysis as a consultative narrative
 * Matches the bundle overview card style with gradient background and bold headers
 */
export const NarrativeAnalysisCard = ({ narrative, confidence, keyInsights }) => {
  if (!narrative) return null;

  return (
    <Card
      style={{
        background: 'var(--gradient-primary)',
        border: 'none',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '24px',
        overflow: 'hidden'
      }}
    >
      <div style={{ padding: '24px' }}>
        <Title level={3} style={{ color: 'white', marginBottom: '24px', marginTop: 0 }}>
          📊 Website Analysis
        </Title>

        {/* Narrative text with formatting */}
        <div style={{
          color: 'rgba(255,255,255,0.95)',
          fontSize: '15px',
          lineHeight: '1.7',
          whiteSpace: 'pre-line',
          marginBottom: '24px'
        }}>
          {/* Parse markdown-style bold formatting */}
          {narrative.split(/\*\*(.*?)\*\*/g).map((part, idx) =>
            idx % 2 === 1 ? <strong key={idx}>{part}</strong> : part
          )}
        </div>

        {/* Key insights as pills */}
        {keyInsights && keyInsights.length > 0 && (
          <>
            <Divider style={{ borderColor: 'rgba(255,255,255,0.2)', margin: '24px 0 16px 0' }} />
            <div>
              <Text style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '12px',
                display: 'block',
                marginBottom: '12px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>
                KEY INSIGHTS
              </Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {keyInsights.map((insight, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(10px)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      color: 'white',
                      lineHeight: '1.5'
                    }}
                  >
                    {insight}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Confidence indicator */}
        {confidence && (
          <div style={{ marginTop: '16px', opacity: 0.7 }}>
            <Text style={{ color: 'white', fontSize: '11px' }}>
              Analysis confidence: {Math.round(confidence * 100)}%
            </Text>
          </div>
        )}
      </div>
    </Card>
  );
};

export default NarrativeAnalysisCard;
