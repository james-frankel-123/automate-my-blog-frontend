import React from 'react';
import { Card, Tag, Typography } from 'antd';
import { BulbOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

/**
 * Displays detailed recommendation explanation
 * Follows LLMInsightsPanel pattern: Description + Impact + Action + Result
 *
 * @param {string} description - Why this content is recommended
 * @param {string} impact - Impact level (high, medium, low)
 * @param {string} action - Recommended action to take
 * @param {string} result - Expected benefit/outcome
 */
export default function RecommendationCard({ description, impact, action, result }) {
  const impactColors = {
    high: 'var(--color-error)',
    medium: 'var(--color-warning)',
    low: 'var(--color-primary)'
  };
  const impactTagColors = {
    high: 'error',
    medium: 'warning',
    low: 'processing'
  };

  const impactLabels = {
    high: 'HIGH IMPACT',
    medium: 'MEDIUM IMPACT',
    low: 'LOW IMPACT'
  };

  const borderColor = impact ? impactColors[impact] : impactColors.low;
  const tagColor = impact ? impactTagColors[impact] : impactTagColors.low;

  return (
    <Card
      size="small"
      style={{
        marginBottom: '12px',
        borderLeft: `4px solid ${borderColor}`,
        backgroundColor: 'var(--color-background-alt)'
      }}
      bodyStyle={{ padding: '12px' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <BulbOutlined
          style={{
            fontSize: '20px',
            color: 'var(--color-primary)',
            marginTop: '2px',
            flexShrink: 0
          }}
        />
        <div style={{ flex: 1 }}>
          {/* Description + Impact Tag */}
          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text strong style={{ fontSize: '14px' }}>
              {description}
            </Text>
            {impact && (
              <Tag
                color={tagColor}
                style={{
                  fontWeight: 600,
                  fontSize: '11px',
                  margin: 0
                }}
              >
                {impactLabels[impact]}
              </Tag>
            )}
          </div>

          {/* Recommended Action */}
          {action && (
            <Paragraph
              style={{
                margin: '4px 0',
                fontSize: '13px',
                lineHeight: '1.5'
              }}
            >
              <Text strong>📌 Recommended Action:</Text> {action}
            </Paragraph>
          )}

          {/* Expected Result */}
          {result && (
            <Paragraph
              style={{
                margin: '4px 0',
                fontSize: '13px',
                lineHeight: '1.5'
              }}
            >
              <Text strong>📈 Expected Result:</Text> {result}
            </Paragraph>
          )}
        </div>
      </div>
    </Card>
  );
}
