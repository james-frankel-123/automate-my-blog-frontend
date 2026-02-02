import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col } from 'antd';

const { Text, Title } = Typography;

/**
 * NarrativeAnalysisCard - Displays website analysis as a multi-step journey
 * Reveals sections sequentially with smooth animations
 */
export const NarrativeAnalysisCard = ({ narrative, confidence, keyInsights }) => {
  const [visibleSections, setVisibleSections] = useState([]);

  // Parse narrative into sections
  const sections = React.useMemo(() => {
    if (!narrative) return [];

    const parsedSections = [];
    const sectionPattern = /\*\*([^*]+):\*\*\n([\s\S]*?)(?=\n\*\*|$)/g;
    let match;

    while ((match = sectionPattern.exec(narrative)) !== null) {
      const title = match[1].trim();
      const content = match[2].trim();

      // Extract bullet points if present
      const bulletPattern = /^[•\-\*]\s+(.+)$/gm;
      const bullets = [];
      let bulletMatch;
      while ((bulletMatch = bulletPattern.exec(content)) !== null) {
        bullets.push(bulletMatch[1].replace(/^["']|["']$/g, ''));
      }

      // Remove bullets from content
      const textContent = content.replace(bulletPattern, '').trim();

      parsedSections.push({
        title,
        content: textContent,
        bullets
      });
    }

    // Fallback: If no sections found, treat as single conversational narrative
    if (parsedSections.length === 0) {
      // Extract bullets from the entire narrative
      const bulletPattern = /^[•\-\*]\s+(.+)$/gm;
      const bullets = [];
      let bulletMatch;
      while ((bulletMatch = bulletPattern.exec(narrative)) !== null) {
        bullets.push(bulletMatch[1].replace(/^["']|["']$/g, ''));
      }

      // Remove bullets from narrative
      const textContent = narrative.replace(bulletPattern, '').trim();

      parsedSections.push({
        title: 'Website Analysis',
        content: textContent,
        bullets
      });
    }

    return parsedSections;
  }, [narrative]);

  // Sequential reveal effect
  useEffect(() => {
    if (sections.length === 0) return;

    // Reset visible sections when narrative changes
    setVisibleSections([]);

    const revealSection = (index) => {
      if (index < sections.length) {
        setTimeout(() => {
          setVisibleSections(prev => [...prev, index]);
          revealSection(index + 1);
        }, 800); // Delay between sections
      } else {
        // Reveal key insights after all sections
        setTimeout(() => {
          setVisibleSections(prev => [...prev, 'insights']);
        }, 800);
      }
    };

    revealSection(0);
  }, [sections]);

  if (!narrative) return null;

  return (
    <div style={{ marginBottom: '24px' }}>
      {sections.map((section, idx) => (
        <div
          key={idx}
          style={{
            opacity: visibleSections.includes(idx) ? 1 : 0,
            transform: visibleSections.includes(idx) ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.5s ease-out',
            marginBottom: '16px'
          }}
        >
          <Card
            style={{
              background: 'white',
              border: '1px solid #e8e8e8',
              borderRadius: '8px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Title level={5} style={{ marginTop: 0, marginBottom: '12px', color: '#262626' }}>
              {section.title}
            </Title>

            {section.content && (
              <Text style={{
                color: '#595959',
                fontSize: '15px',
                lineHeight: '1.7',
                display: 'block',
                marginBottom: section.bullets.length > 0 ? '12px' : '0'
              }}>
                {section.content}
              </Text>
            )}

            {/* Bullet points as individual cards within this section */}
            {section.bullets.length > 0 && (
              <Row gutter={[12, 12]} style={{ marginTop: '12px' }}>
                {section.bullets.map((bullet, bulletIdx) => (
                  <Col xs={24} sm={12} md={8} key={bulletIdx}>
                    <Card
                      size="small"
                      style={{
                        background: '#fafafa',
                        border: '1px solid #e8e8e8',
                        borderRadius: '6px'
                      }}
                      bodyStyle={{ padding: '10px 14px' }}
                    >
                      <Text style={{
                        color: '#595959',
                        fontSize: '14px',
                        lineHeight: '1.5'
                      }}>
                        {bullet}
                      </Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </div>
      ))}

      {/* Key insights revealed last */}
      {keyInsights && keyInsights.length > 0 && (
        <div
          style={{
            opacity: visibleSections.includes('insights') ? 1 : 0,
            transform: visibleSections.includes('insights') ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.5s ease-out'
          }}
        >
          <Title level={5} style={{ marginBottom: '12px', color: '#262626' }}>
            Key Insights
          </Title>
          <Row gutter={[12, 12]}>
            {keyInsights.map((insight, idx) => (
              <Col xs={24} sm={12} md={8} key={idx}>
                <Card
                  size="small"
                  style={{
                    background: '#f0f5ff',
                    border: '1px solid #d6e4ff',
                    borderRadius: '6px',
                    height: '100%'
                  }}
                  bodyStyle={{ padding: '12px 16px' }}
                >
                  <Text style={{
                    color: '#1d39c4',
                    fontSize: '14px',
                    fontWeight: 500,
                    lineHeight: '1.5'
                  }}>
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
