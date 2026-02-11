import React from 'react';
import { Card, Progress, Typography, List, Space } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

/**
 * Analysis Section Component
 * Displays detailed analysis for a specific SEO area (e.g., Title Analysis, Content Flow)
 */
const AnalysisSection = ({ 
  title: _title, 
  subtitle: _subtitle, 
  icon: _icon, 
  items = {}, 
  description,
  collapsed: _collapsed = false 
}) => {
  // Get score color based on value
  const getScoreColor = (score) => {
    if (score >= 90) return 'var(--color-success)'; // Green
    if (score >= 80) return 'var(--color-primary)'; // Blue
    if (score >= 70) return 'var(--color-warning)'; // Orange
    if (score >= 60) return 'var(--color-warning)'; // Dark orange
    return 'var(--color-error)'; // Red
  };

  // Get score icon based on value
  const getScoreIcon = (score) => {
    if (score >= 85) return <CheckCircleOutlined style={{ color: 'var(--color-success)' }} />;
    if (score >= 70) return <InfoCircleOutlined style={{ color: 'var(--color-primary)' }} />;
    return <ExclamationCircleOutlined style={{ color: 'var(--color-warning)' }} />;
  };

  // Format field label for display
  const formatLabel = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize each word
  };

  // Format field value for display (reserved for future use)
  const _formatValue = (value) => {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value;
  };

  // Convert items object to array for display
  const analysisItems = Object.entries(items).map(([key, data]) => {
    if (!data || typeof data !== 'object') return null;
    
    return {
      key,
      label: formatLabel(key),
      score: data.score,
      explanation: data.explanation,
      quote: data.hookQuote || data.quote,
      suggestions: data.suggestions,
      // Additional metadata fields
      characterCount: data.characterCount,
      percentage: data.percentage,
      averageWordsPerParagraph: data.averageWordsPerParagraph,
      h1Count: data.h1Count,
      h2Count: data.h2Count,
      h3Count: data.h3Count,
      grade: data.grade
    };
  }).filter(Boolean);

  return (
    <div className="analysis-section" style={{ padding: '0 16px' }}>
      {/* Section Description */}
      {description && (
        <Paragraph style={{ color: 'var(--color-text-secondary)', marginBottom: '16px', fontStyle: 'italic' }}>
          {description}
        </Paragraph>
      )}

      {/* Analysis Items */}
      <List
        dataSource={analysisItems}
        renderItem={(item) => (
          <List.Item style={{ padding: '16px 0', borderBottom: '1px solid var(--color-border-base)' }}>
            <div style={{ width: '100%' }}>
              {/* Item Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getScoreIcon(item.score)}
                    <Text strong style={{ fontSize: '16px' }}>{item.label}</Text>
                  </div>
                  
                  {/* Additional Metadata */}
                  <div style={{ marginTop: '4px' }}>
                    <Space size={16}>
                      {item.characterCount && (
                        <Text type="secondary" size="small">
                          {item.characterCount} characters
                        </Text>
                      )}
                      {item.percentage && (
                        <Text type="secondary" size="small">
                          {item.percentage}% active voice
                        </Text>
                      )}
                      {item.averageWordsPerParagraph && (
                        <Text type="secondary" size="small">
                          {item.averageWordsPerParagraph} words/paragraph
                        </Text>
                      )}
                      {item.grade && (
                        <Text type="secondary" size="small">
                          {item.grade} reading level
                        </Text>
                      )}
                      {(item.h1Count || item.h2Count || item.h3Count) && (
                        <Text type="secondary" size="small">
                          H1: {item.h1Count || 0}, H2: {item.h2Count || 0}, H3: {item.h3Count || 0}
                        </Text>
                      )}
                    </Space>
                  </div>
                </div>
                
                {/* Score Display */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Progress
                    percent={item.score}
                    size="small"
                    showInfo={false}
                    strokeColor={getScoreColor(item.score)}
                    style={{ width: '80px' }}
                  />
                  <Text 
                    strong 
                    style={{ 
                      color: getScoreColor(item.score), 
                      fontSize: '18px',
                      minWidth: '36px',
                      textAlign: 'center'
                    }}
                  >
                    {item.score}
                  </Text>
                </div>
              </div>

              {/* Content Quote */}
              {item.quote && (
                <Card 
                  size="small"
                  style={{
                    marginBottom: '12px',
                    backgroundColor: 'var(--color-success-bg)',
                    border: '1px solid var(--color-success-border)'
                  }}
                >
                  <blockquote style={{
                    margin: 0,
                    fontStyle: 'italic',
                    color: 'var(--color-success-dark)'
                  }}>
                    "{item.quote}"
                  </blockquote>
                </Card>
              )}

              {/* Explanation */}
              <Paragraph style={{ marginBottom: item.suggestions ? '12px' : 0 }}>
                {item.explanation}
              </Paragraph>

              {/* Suggestions */}
              {item.suggestions && item.suggestions.length > 0 && (
                <div>
                  <Text strong style={{ color: 'var(--color-primary)', marginBottom: '8px', display: 'block' }}>
                    💡 Specific Suggestions:
                  </Text>
                  <List
                    size="small"
                    dataSource={item.suggestions}
                    renderItem={(suggestion) => (
                      <List.Item style={{ padding: '4px 0' }}>
                        <Text style={{ color: 'var(--color-text-secondary)' }}>• {suggestion}</Text>
                      </List.Item>
                    )}
                    style={{ backgroundColor: 'var(--color-background-alt)', padding: '8px 12px', borderRadius: '4px' }}
                  />
                </div>
              )}
            </div>
          </List.Item>
        )}
      />
      
      {/* Empty State */}
      {analysisItems.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 0', 
          color: 'var(--color-text-tertiary)' 
        }}>
          <InfoCircleOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
          <Paragraph type="secondary">
            No analysis data available for this section
          </Paragraph>
        </div>
      )}
    </div>
  );
};

export default AnalysisSection;