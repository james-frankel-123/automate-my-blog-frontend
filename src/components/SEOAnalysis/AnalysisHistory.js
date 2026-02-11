import React, { useState, useEffect } from 'react';
import { List, Card, Tag, Button, Typography, Space, Progress, Empty, Spin, message } from 'antd';
import { 
  EyeOutlined, 
  CalendarOutlined, 
  FileTextOutlined,
  TrophyOutlined,
  LoadingOutlined 
} from '@ant-design/icons';
import autoBlogAPI from '../../services/api';

const { Title, Text, Paragraph } = Typography;

/**
 * Analysis History Component
 * Shows user's previous comprehensive SEO analyses
 */
const AnalysisHistory = ({ onSelectAnalysis, limit = 10 }) => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get score color based on value
  const getScoreColor = (score) => {
    if (score >= 90) return 'var(--color-success)';
    if (score >= 80) return 'var(--color-primary)';
    if (score >= 70) return 'var(--color-warning)';
    if (score >= 60) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  // Get score tag color
  const getScoreTagColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 80) return 'processing';
    if (score >= 70) return 'warning';
    return 'error';
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Load analysis history
  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await autoBlogAPI.getAnalysisHistory(limit);
      
      if (response.success) {
        setAnalyses(response.data);
      } else {
        setError('Failed to load analysis history');
      }
    } catch (error) {
      console.error('Failed to load analysis history:', error);
      setError(error.message);
      message.error('Failed to load analysis history');
    } finally {
      setLoading(false);
    }
  };

  // Load full analysis details
  const loadFullAnalysis = async (analysisId) => {
    try {
      const response = await autoBlogAPI.getComprehensiveAnalysis(analysisId);
      
      if (response.success) {
        onSelectAnalysis(response.analysis);
      } else {
        message.error('Failed to load analysis details');
      }
    } catch (error) {
      console.error('Failed to load analysis:', error);
      message.error('Failed to load analysis details');
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin 
          indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
          size="large"
        />
        <Paragraph style={{ marginTop: '16px' }}>
          Loading your analysis history...
        </Paragraph>
      </div>
    );
  }

  if (error || analyses.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          error ? (
            <div>
              <Text type="danger">Failed to load analysis history</Text>
              <br />
              <Button type="link" onClick={loadHistory}>
                Try Again
              </Button>
            </div>
          ) : (
            <div>
              <Text>No previous analyses found</Text>
              <br />
              <Text type="secondary">
                Your SEO analyses will appear here after you analyze your content
              </Text>
            </div>
          )
        }
      />
    );
  }

  return (
    <div className="analysis-history">
      <List
        itemLayout="vertical"
        dataSource={analyses}
        renderItem={(analysis) => (
          <List.Item
            key={analysis.id}
            style={{ padding: '16px 0' }}
          >
            <Card
              hoverable
              style={{ width: '100%' }}
              bodyStyle={{ padding: '16px' }}
              actions={[
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  onClick={() => loadFullAnalysis(analysis.id)}
                >
                  View Analysis
                </Button>
              ]}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, paddingRight: '16px' }}>
                  {/* Content Preview */}
                  <div style={{ marginBottom: '8px' }}>
                    <FileTextOutlined style={{ color: 'var(--color-primary)', marginRight: '8px' }} />
                    <Text strong>Content Preview</Text>
                  </div>
                  <Paragraph 
                    ellipsis={{ rows: 2, expandable: false }}
                    style={{ color: 'var(--color-text-secondary)', marginBottom: '12px' }}
                  >
                    {analysis.contentPreview}
                  </Paragraph>

                  {/* Metadata */}
                  <Space size={16} wrap>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CalendarOutlined style={{ color: 'var(--color-text-tertiary)' }} />
                      <Text type="secondary">{formatDate(analysis.createdAt)}</Text>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FileTextOutlined style={{ color: 'var(--color-text-tertiary)' }} />
                      <Text type="secondary">{analysis.wordCount} words</Text>
                    </div>
                  </Space>
                </div>

                {/* Score Display */}
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={analysis.overallScore}
                    size={60}
                    strokeColor={getScoreColor(analysis.overallScore)}
                    format={(percent) => (
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                        {percent}
                      </span>
                    )}
                  />
                  <div style={{ marginTop: '8px' }}>
                    <Tag color={getScoreTagColor(analysis.overallScore)}>
                      <TrophyOutlined /> Score: {analysis.overallScore}
                    </Tag>
                  </div>
                </div>
              </div>
            </Card>
          </List.Item>
        )}
      />

      {/* Load More Button */}
      {analyses.length >= limit && (
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Button type="dashed" onClick={() => loadHistory(limit + 10)}>
            Load More Analyses
          </Button>
        </div>
      )}
    </div>
  );
};

export default AnalysisHistory;