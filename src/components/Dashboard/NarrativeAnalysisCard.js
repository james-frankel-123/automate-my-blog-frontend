import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col } from 'antd';
import MarkdownPreview from '../MarkdownPreview/MarkdownPreview';

const { Text, Title } = Typography;

/** Split text into paragraphs (double newline). */
function splitParagraphs(text) {
  if (!text || !text.trim()) return [];
  return text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
}

const paragraphCardStyle = {
  background: 'var(--color-background-elevated)',
  border: '1px solid var(--color-border-base)',
  borderLeft: '4px solid var(--color-primary)',
  borderRadius: 8,
  boxShadow: 'var(--shadow-sm)',
  marginBottom: 16,
  transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
};

/**
 * Converts insight to displayable string
 * Handles both string insights and object insights (with body, heading, etc.)
 */
function insightToString(insight) {
  if (typeof insight === 'string') return insight;
  if (typeof insight === 'object' && insight !== null) {
    // Try common string fields in order of preference
    return insight.body || insight.heading || insight.takeaway || insight.category || JSON.stringify(insight);
  }
  return String(insight);
}

/**
 * NarrativeAnalysisCard - Displays website analysis as a multi-step journey.
 * Renders markdown and breaks content into paragraph cards (streaming-style UX).
 */
export const NarrativeAnalysisCard = ({ narrative, confidence, keyInsights }) => {
  const [visibleSections, setVisibleSections] = useState([]);

  // Parse narrative into sections (bold header style) or use paragraph-based fallback
  const sections = React.useMemo(() => {
    if (!narrative) return [];

    const parsedSections = [];
    const sectionPattern = /\*\*([^*]+):\*\*\n([\s\S]*?)(?=\n\*\*|$)/g;
    let match;

    while ((match = sectionPattern.exec(narrative)) !== null) {
      const title = match[1].trim();
      const content = match[2].trim();

      const bulletPattern = /^[•\-\*]\s+(.+)$/gm;
      const bullets = [];
      let bulletMatch;
      while ((bulletMatch = bulletPattern.exec(content)) !== null) {
        bullets.push(bulletMatch[1].replace(/^["']|["']$/g, ''));
      }

      const textContent = content.replace(bulletPattern, '').trim();

      parsedSections.push({
        title,
        content: textContent,
        bullets
      });
    }

    if (parsedSections.length === 0) {
      const bulletPattern = /^[•\-\*]\s+(.+)$/gm;
      const bullets = [];
      let bulletMatch;
      while ((bulletMatch = bulletPattern.exec(narrative)) !== null) {
        bullets.push(bulletMatch[1].replace(/^["']|["']$/g, ''));
      }
      const textContent = narrative.replace(bulletPattern, '').trim();
      parsedSections.push({
        title: 'Website Analysis',
        content: textContent,
        bullets
      });
    }

    return parsedSections;
  }, [narrative]);

  // Paragraph-based display when we have a single section (fallback): one card per paragraph
  const paragraphCount = React.useMemo(() => {
    if (sections.length !== 1 || !sections[0].content) return 0;
    return splitParagraphs(sections[0].content).length;
  }, [sections]);
  const useParagraphCards = paragraphCount > 1;

  // Sequential reveal effect: sections or paragraph indices, then 'insights'
  useEffect(() => {
    if (sections.length === 0) return;

    setVisibleSections([]);
    const totalItems = useParagraphCards ? paragraphCount : sections.length;

    const revealNext = (index) => {
      if (index < totalItems) {
        setTimeout(() => {
          setVisibleSections(prev => [...prev, index]);
          revealNext(index + 1);
        }, useParagraphCards ? 400 : 800);
      } else {
        setTimeout(() => {
          setVisibleSections(prev => [...prev, 'insights']);
        }, useParagraphCards ? 400 : 800);
      }
    };

    revealNext(0);
  }, [sections.length, useParagraphCards, paragraphCount]);

  if (!narrative) return null;

  // Single section with multiple paragraphs: render one card per paragraph (match streaming UX)
  if (useParagraphCards && sections.length === 1) {
    const section = sections[0];
    const paras = splitParagraphs(section.content);
    return (
      <div style={{ marginBottom: '24px' }}>
        <Title level={4} style={{ marginBottom: 16, color: 'var(--color-text-primary)' }}>
          {section.title}
        </Title>
        {paras.map((para, idx) => (
          <div
            key={idx}
            style={{
              opacity: visibleSections.includes(idx) ? 1 : 0,
              transform: visibleSections.includes(idx) ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.5s ease-out',
              marginBottom: '16px',
              animation: visibleSections.includes(idx) ? 'slideInUp 0.4s ease forwards' : undefined,
            }}
          >
            <Card style={paragraphCardStyle}>
              <MarkdownPreview content={para} style={{ margin: 0, fontSize: 15, lineHeight: 1.7 }} />
            </Card>
          </div>
        ))}
        {section.bullets.length > 0 && (
          <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
            {section.bullets.map((bullet, bulletIdx) => (
              <Col xs={24} sm={12} md={8} key={bulletIdx}>
                <Card
                  size="small"
                  style={{
                    background: 'var(--color-background-alt)',
                    border: '1px solid var(--color-border-base)',
                    borderRadius: 6,
                    borderLeft: '3px solid var(--color-primary)',
                  }}
                  bodyStyle={{ padding: '10px 14px' }}
                >
                  <MarkdownPreview content={bullet} style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }} />
                </Card>
              </Col>
            ))}
          </Row>
        )}
        {keyInsights && keyInsights.length > 0 && (
          <div
            style={{
              opacity: visibleSections.includes('insights') ? 1 : 0,
              transform: visibleSections.includes('insights') ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.5s ease-out',
              marginTop: 24,
            }}
          >
            <Title level={5} style={{ marginBottom: 12, color: 'var(--color-text-primary)' }}>
              Key Insights
            </Title>
            <Row gutter={[12, 12]}>
              {keyInsights.map((insight, idx) => (
                <Col xs={24} sm={12} md={8} key={idx}>
                  <Card
                    size="small"
                    style={{
                      background: 'var(--color-primary-50)',
                      border: '1px solid var(--color-primary-200)',
                      borderRadius: 6,
                      height: '100%',
                    }}
                    bodyStyle={{ padding: '12px 16px' }}
                  >
                    <Text style={{ color: 'var(--color-primary-700)', fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>
                      {insightToString(insight)}
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </div>
    );
  }

  // Multiple sections or single block: section cards with markdown content
  return (
    <div style={{ marginBottom: '24px' }}>
      {sections.map((section, idx) => (
        <div
          key={idx}
          style={{
            opacity: visibleSections.includes(idx) ? 1 : 0,
            transform: visibleSections.includes(idx) ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.5s ease-out',
            marginBottom: '16px',
          }}
        >
          <Card style={paragraphCardStyle}>
            <Title level={5} style={{ marginTop: 0, marginBottom: 12, color: 'var(--color-text-primary)' }}>
              {section.title}
            </Title>

            {section.content && (
              <div style={{ marginBottom: section.bullets.length > 0 ? 12 : 0 }}>
                <MarkdownPreview
                  content={section.content}
                  style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--color-text-secondary)' }}
                />
              </div>
            )}

            {section.bullets.length > 0 && (
              <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
                {section.bullets.map((bullet, bulletIdx) => (
                  <Col xs={24} sm={12} md={8} key={bulletIdx}>
                    <Card
                      size="small"
                      style={{
                        background: 'var(--color-background-alt)',
                        border: '1px solid var(--color-border-base)',
                        borderRadius: 6,
                        borderLeft: '3px solid var(--color-primary)',
                      }}
                      bodyStyle={{ padding: '10px 14px' }}
                    >
                      <MarkdownPreview content={bullet} style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }} />
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </div>
      ))}

      {keyInsights && keyInsights.length > 0 && (
        <div
          style={{
            opacity: visibleSections.includes('insights') ? 1 : 0,
            transform: visibleSections.includes('insights') ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.5s ease-out',
          }}
        >
          <Title level={5} style={{ marginBottom: 12, color: 'var(--color-text-primary)' }}>
            Key Insights
          </Title>
          <Row gutter={[12, 12]}>
            {keyInsights.map((insight, idx) => (
              <Col xs={24} sm={12} md={8} key={idx}>
                <Card
                  size="small"
                  style={{
                    background: 'var(--color-primary-50)',
                    border: '1px solid var(--color-primary-200)',
                    borderRadius: 6,
                    height: '100%',
                  }}
                  bodyStyle={{ padding: '12px 16px' }}
                >
                  <Text style={{ color: 'var(--color-primary-700)', fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>
                    {insight}
                  </Text>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}
    </div>
  );
};

export default NarrativeAnalysisCard;
