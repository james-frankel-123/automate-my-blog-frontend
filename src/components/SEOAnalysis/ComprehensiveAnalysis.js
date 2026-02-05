import React, { useState, useEffect, useCallback } from 'react';
import { Card, Alert, Spin, Button, Progress, Collapse, Tag, Typography, Space } from 'antd';
import { 
  TrophyOutlined, 
  BulbOutlined, 
  RocketOutlined, 
  CheckCircleOutlined,
  LoadingOutlined,
  ReloadOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import AnalysisSection from './AnalysisSection';
import AnalysisHistory from './AnalysisHistory';
import autoBlogAPI from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

/**
 * Comprehensive SEO Analysis Display Component
 * Shows AI-powered educational SEO insights for solopreneurs
 */
const ComprehensiveAnalysis = ({ 
  content, 
  context = {}, 
  postId = null, 
  onAnalysisComplete,
  className = '',
  style = {} 
}) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  // Analysis sections configuration with icons and descriptions
  const analysisSections = [
    {
      key: 'titleAnalysis',
      title: 'Title & Headlines',
      subtitle: 'Does your title make people want to click?',
      icon: '🎯',
      description: 'Analysis of title effectiveness, length, click-through potential, and heading structure'
    },
    {
      key: 'contentFlow',
      title: 'Content Structure',
      subtitle: 'How well does your content guide readers?',
      icon: '📝',
      description: 'Analysis of introduction hook, logical progression, paragraph length, and conclusions'
    },
    {
      key: 'engagementUX',
      title: 'Reader Engagement',
      subtitle: 'Is your content easy and enjoyable to read?',
      icon: '💡',
      description: 'Analysis of reading level, sentence variety, active voice, and storytelling elements'
    },
    {
      key: 'authorityEAT',
      title: 'Authority & Trust',
      subtitle: 'Do readers see you as credible and trustworthy?',
      icon: '🏆',
      description: 'Analysis of expertise demonstration, authority signals, and personal experience'
    },
    {
      key: 'technicalSEO',
      title: 'Search Optimization',
      subtitle: 'How well will search engines understand your content?',
      icon: '🔍',
      description: 'Analysis of linking opportunities, featured snippets, and schema markup potential'
    },
    {
      key: 'conversionOptimization',
      title: 'Customer Conversion',
      subtitle: 'How effectively does your content turn readers into customers?',
      icon: '🚀',
      description: 'Analysis of value proposition, trust building, urgency, and lead generation potential'
    },
    {
      key: 'contentDepth',
      title: 'Content Completeness',
      subtitle: 'Have you covered everything your audience needs?',
      icon: '📚',
      description: 'Analysis of topic coverage, competitive differentiation, and information gaps'
    },
    {
      key: 'mobileAccessibility',
      title: 'Mobile Experience',
      subtitle: 'How well does your content work on phones and tablets?',
      icon: '📱',
      description: 'Analysis of mobile readability, voice search optimization, and accessibility'
    },
    {
      key: 'socialSharing',
      title: 'Social Appeal',
      subtitle: 'Will people want to share your content?',
      icon: '🔗',
      description: 'Analysis of shareability factors, viral potential, and visual content needs'
    },
    {
      key: 'contentFreshness',
      title: 'Long-term Value',
      subtitle: 'Will your content stay relevant and valuable?',
      icon: '⏰',
      description: 'Analysis of evergreen potential, update requirements, and content series opportunities'
    },
    {
      key: 'competitiveDifferentiation',
      title: 'Market Positioning',
      subtitle: 'What makes your content unique in the market?',
      icon: '🎖️',
      description: 'Analysis of unique value propositions and competitive advantages'
    }
  ];

  // Get score color based on value
  const getScoreColor = (score) => {
    if (score >= 90) return 'var(--color-success)'; // Green
    if (score >= 80) return 'var(--color-primary)'; // Blue
    if (score >= 70) return 'var(--color-warning)'; // Orange
    if (score >= 60) return 'var(--color-warning)'; // Dark orange
    return 'var(--color-error)'; // Red
  };

  // Get score status based on value
  const getScoreStatus = (score) => {
    if (score >= 85) return 'success';
    if (score >= 70) return 'active';
    if (score >= 60) return 'normal';
    return 'exception';
  };

  // Run comprehensive analysis
  const runAnalysis = useCallback(async () => {
    if (!content || content.trim().length < 200) {
      setError('Content must be at least 200 characters long for meaningful analysis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await autoBlogAPI.generateComprehensiveAnalysis(
        content, 
        context, 
        postId
      );

      if (result.success) {
        setAnalysis(result.analysis);
        setFromCache(result.fromCache);
        
        if (onAnalysisComplete) {
          onAnalysisComplete(result.analysis);
        }
      } else {
        setError(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [content, context, postId, onAnalysisComplete]);

  // Auto-run analysis when content changes (debounced)
  useEffect(() => {
    if (content && content.trim().length >= 200) {
      const timer = setTimeout(() => {
        runAnalysis();
      }, 1000); // 1 second debounce

      return () => clearTimeout(timer);
    }
  }, [content, context, runAnalysis]);

  // Calculate average score for sections
  const calculateSectionScore = (sectionData) => {
    if (!sectionData) return 0;
    
    const scores = Object.values(sectionData)
      .filter(item => typeof item === 'object' && item.score)
      .map(item => item.score);
    
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  };

  if (showHistory) {
    return (
      <div className={className} style={style}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Title level={3}>
              <HistoryOutlined /> Analysis History
            </Title>
            <Button onClick={() => setShowHistory(false)}>
              Back to Current Analysis
            </Button>
          </div>
          <AnalysisHistory onSelectAnalysis={(selectedAnalysis) => {
            setAnalysis(selectedAnalysis);
            setShowHistory(false);
          }} />
        </Card>
      </div>
    );
  }

  return (
    <div className={`comprehensive-analysis ${className}`} style={style}>
      {/* Header Section */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <Title level={3} style={{ margin: 0, color: 'var(--color-primary)' }}>
              🧠 Comprehensive SEO Analysis
            </Title>
            <Paragraph style={{ marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
              Educational insights to help your content attract and convert customers
            </Paragraph>
            
            {fromCache && (
              <Tag color="blue" style={{ marginBottom: '8px' }}>
                <CheckCircleOutlined /> Cached Result
              </Tag>
            )}
          </div>

          <Space>
            <Button 
              icon={<HistoryOutlined />}
              onClick={() => setShowHistory(true)}
              disabled={loading}
            >
              History
            </Button>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={runAnalysis}
              loading={loading}
              disabled={!content || content.trim().length < 200}
            >
              {analysis ? 'Re-analyze' : 'Analyze'}
            </Button>
          </Space>
        </div>

        {/* Content Length Indicator */}
        {content && (
          <div style={{ marginTop: '12px' }}>
            <Text type="secondary">
              Content Length: {content.length} characters ({Math.round(content.split(/\s+/).length)} words)
            </Text>
            {content.length < 200 && (
              <Alert
                message="Content too short"
                description="Add at least 200 characters for meaningful SEO analysis"
                type="warning"
                showIcon
                style={{ marginTop: '8px' }}
              />
            )}
          </div>
        )}
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin 
              indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
              size="large"
            />
            <Title level={4} style={{ marginTop: '16px', color: 'var(--color-primary)' }}>
              Analyzing Your Content...
            </Title>
            <Paragraph>
              Our AI is examining your content for SEO opportunities and providing educational insights.
              This usually takes 10-15 seconds.
            </Paragraph>
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert
          message="Analysis Failed"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          action={
            <Button size="small" onClick={runAnalysis}>
              Try Again
            </Button>
          }
        />
      )}

      {/* Analysis Results */}
      {analysis && !loading && (
        <>
          {/* Overall Score Summary */}
          <Card style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <Progress
                  type="circle"
                  percent={analysis.overallScore}
                  size={80}
                  strokeColor={getScoreColor(analysis.overallScore)}
                  format={(percent) => (
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      {percent}
                    </span>
                  )}
                />
                <div style={{ marginTop: '8px' }}>
                  <Text strong>Overall Score</Text>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <Title level={4} style={{ margin: 0 }}>
                  Analysis Summary
                </Title>
                <Paragraph style={{ marginBottom: '16px' }}>
                  {analysis.aiSummary}
                </Paragraph>

                {/* Top Strengths & Improvements */}
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TrophyOutlined /> Top Strengths
                    </Text>
                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                      {(analysis.topStrengths || []).map((strength, index) => (
                        <li key={index} style={{ color: 'var(--color-success)', marginBottom: '4px' }}>
                          <Text>{strength}</Text>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ flex: 1 }}>
                    <Text strong style={{ color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <BulbOutlined /> Top Improvements
                    </Text>
                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                      {(analysis.topImprovements || []).map((improvement, index) => (
                        <li key={index} style={{ color: 'var(--color-warning)', marginBottom: '4px' }}>
                          <Text>{improvement}</Text>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Detailed Analysis Sections */}
          <Collapse 
            defaultActiveKey={['titleAnalysis', 'contentFlow']} 
            ghost
            size="large"
          >
            {analysisSections.map((section) => {
              const sectionData = analysis[section.key];
              const sectionScore = calculateSectionScore(sectionData);
              
              return (
                <Panel 
                  key={section.key}
                  header={
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '20px' }}>{section.icon}</span>
                        <div>
                          <Text strong style={{ fontSize: '16px' }}>{section.title}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '14px' }}>{section.subtitle}</Text>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Progress
                          percent={sectionScore}
                          size="small"
                          status={getScoreStatus(sectionScore)}
                          showInfo={false}
                          style={{ width: '60px' }}
                        />
                        <Text strong style={{ color: getScoreColor(sectionScore), minWidth: '32px' }}>
                          {sectionScore}
                        </Text>
                      </div>
                    </div>
                  }
                  style={{ marginBottom: '8px' }}
                >
                  <AnalysisSection
                    title={section.title}
                    subtitle={section.subtitle}
                    icon={section.icon}
                    items={sectionData}
                    description={section.description}
                  />
                </Panel>
              );
            })}
          </Collapse>

          {/* Metadata */}
          <Card size="small" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary">
                Analysis completed on {new Date(analysis.analysisDate).toLocaleString()}
              </Text>
              <Space>
                <Text type="secondary">
                  Content: {analysis.contentWordCount} words
                </Text>
                <Text type="secondary">
                  Version: {analysis.analysisVersion}
                </Text>
              </Space>
            </div>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!analysis && !loading && !error && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <RocketOutlined style={{ fontSize: '48px', color: 'var(--color-primary)', marginBottom: '16px' }} />
            <Title level={4}>Ready to Analyze Your Content</Title>
            <Paragraph>
              Add at least 200 characters of content to get comprehensive SEO insights that will help you 
              understand why your content will rank well and attract customers.
            </Paragraph>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ComprehensiveAnalysis;