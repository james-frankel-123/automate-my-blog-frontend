import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Alert, Spin } from 'antd';
import { BulbOutlined, CheckCircleOutlined } from '@ant-design/icons';
import autoBlogAPI from '../services/api';

const { Title, Text } = Typography;

const ChangesSummary = ({ previousContent, newContent, customFeedback }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const analyzeChanges = async () => {
      if (!previousContent || !newContent || previousContent === newContent) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('Analyzing content changes with AI...');
        const result = await autoBlogAPI.analyzeChanges(
          previousContent, 
          newContent, 
          customFeedback
        );
        
        setAnalysis(result);
      } catch (error) {
        console.error('Failed to analyze changes:', error);
        setError('Failed to analyze changes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    analyzeChanges();
  }, [previousContent, newContent, customFeedback]);

  // Don't render if no content to compare
  if (!previousContent || !newContent || previousContent === newContent) {
    return null;
  }

  // Don't render if there was an error
  if (error) {
    return (
      <Alert
        message="Unable to analyze changes"
        description={error}
        type="warning"
        showIcon
        style={{ marginBottom: '16px' }}
      />
    );
  }

  return (
    <Card 
      style={{ 
        marginBottom: '16px', 
        border: '1px solid #52c41a',
        borderRadius: '8px',
        backgroundColor: '#f6ffed'
      }}
      size="small"
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CheckCircleOutlined style={{ marginRight: '8px', color: '#52c41a', fontSize: '16px' }} />
          <Title level={5} style={{ margin: 0, color: '#52c41a' }}>
            What Changed
          </Title>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Spin />
            <div style={{ marginTop: '8px' }}>
              <Text style={{ color: '#666' }}>Analyzing changes with AI...</Text>
            </div>
          </div>
        ) : analysis ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            {/* Overall Summary */}
            <div>
              <Text strong style={{ fontSize: '14px', color: '#389e0d' }}>
                Summary:
              </Text>
              <div style={{ marginTop: '4px' }}>
                <Text style={{ fontSize: '14px' }}>{analysis.summary}</Text>
              </div>
            </div>

            {/* Key Changes */}
            {analysis.keyChanges && analysis.keyChanges.length > 0 && (
              <div>
                <Text strong style={{ fontSize: '14px', color: '#389e0d' }}>
                  Key Changes:
                </Text>
                <div>
                  {analysis.keyChanges.map((item, index) => (
                    <div key={index} style={{ padding: '8px 0' }}>
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                          <BulbOutlined style={{ 
                            marginRight: '8px', 
                            marginTop: '2px',
                            color: '#1890ff',
                            fontSize: '14px'
                          }} />
                          <div style={{ flex: 1 }}>
                            <Text strong style={{ fontSize: '14px' }}>
                              {item.change}
                            </Text>
                            {item.impact && (
                              <div style={{ marginTop: '2px' }}>
                                <Text style={{ fontSize: '13px', color: '#666' }}>
                                  {item.impact}
                                </Text>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback Applied */}
            {customFeedback && analysis.feedbackApplied && (
              <Alert
                message="Your Feedback Applied"
                description={analysis.feedbackApplied}
                type="info"
                showIcon
                style={{ fontSize: '12px' }}
              />
            )}
          </Space>
        ) : (
          <Text style={{ fontSize: '14px', color: '#666' }}>
            No significant changes detected.
          </Text>
        )}
      </Space>
    </Card>
  );
};

export default ChangesSummary;