import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Space, 
  Statistic, 
  Table, 
  Tag, 
  Progress, 
  Empty,
  Spin,
  Tabs,
  message
} from 'antd';
import { 
  BookOutlined, 
  AimOutlined, 
  LinkOutlined, 
  BarChartOutlined,
  PlusOutlined,
  ReloadOutlined,
  FileSearchOutlined,
  TrophyOutlined,
  BulbOutlined,
  BgColorsOutlined,
  NodeIndexOutlined,
  SearchOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import autoBlogAPI from '../../services/api';
import ContentUploadModal from '../ContentUpload/ContentUploadModal';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const ComprehensiveAnalysisTab = () => {
  const { user, currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  
  // Analysis data state
  const [blogContent, setBlogContent] = useState([]);
  const [ctaAnalysis, setCtaAnalysis] = useState([]);
  const [linkingAnalysis, setLinkingAnalysis] = useState([]);
  const [visualDesignData, setVisualDesignData] = useState(null);
  const [comprehensiveResults, setComprehensiveResults] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  
  // UI state
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedRows, setExpandedRows] = useState([]);

  useEffect(() => {
    if (currentOrganization?.id) {
      loadAnalysisData();
    }
  }, [currentOrganization]);

  const loadAnalysisData = async () => {
    if (!currentOrganization?.id) return;
    
    setLoading(true);
    try {
      const [blogData, ctaData, linkData, visualDesignResponse, comprehensiveData, uploadData] = await Promise.allSettled([
        autoBlogAPI.getBlogContent(currentOrganization.id),
        autoBlogAPI.getCTAAnalysis(currentOrganization.id),
        autoBlogAPI.getInternalLinkingAnalysis(currentOrganization.id),
        autoBlogAPI.getVisualDesignAnalysis(currentOrganization.id),
        autoBlogAPI.getComprehensiveAnalysis(currentOrganization.id),
        autoBlogAPI.getUploadStatus(currentOrganization.id)
      ]);

      if (blogData.status === 'fulfilled' && blogData.value.success) {
        setBlogContent(blogData.value.content || []);
      }
      if (ctaData.status === 'fulfilled' && ctaData.value.success) {
        setCtaAnalysis(ctaData.value.ctas || []);
      }
      if (linkData.status === 'fulfilled' && linkData.value.success) {
        setLinkingAnalysis(linkData.value.links || []);
      }
      if (visualDesignResponse.status === 'fulfilled' && visualDesignResponse.value.success) {
        setVisualDesignData(visualDesignResponse.value);
      }
      if (comprehensiveData.status === 'fulfilled' && comprehensiveData.value.success) {
        setComprehensiveResults(comprehensiveData.value);
      }
      if (uploadData.status === 'fulfilled' && uploadData.value.success) {
        setUploadStatus(uploadData.value);
      }
    } catch (error) {
      console.error('Failed to load analysis data:', error);
      message.error(`Failed to load analysis: ${error?.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAnalysisData();
    setRefreshing(false);
  };

  const forceReanalyze = async () => {
    // Try to get website URL from multiple sources
    let websiteUrl = currentOrganization?.websiteUrl || 
                     currentOrganization?.website_url ||
                     comprehensiveResults?.organization?.websiteUrl ||
                     comprehensiveResults?.organization?.website_url;
    
    if (!websiteUrl) {
      message.error('No website URL found. Run website analysis first.');
      return;
    }
    
    setReanalyzing(true);
    try {
      await autoBlogAPI.triggerComprehensiveAnalysis(websiteUrl);
      // Wait a moment then reload data
      setTimeout(() => {
        loadAnalysisData();
      }, 2000);
    } catch (error) {
      console.error('Force re-analysis failed:', error);
      message.error(`Re-analysis failed: ${error?.message || 'Please try again.'}`);
    } finally {
      setReanalyzing(false);
    }
  };

  const handleUploadSuccess = () => {
    loadAnalysisData(); // Refresh data after successful upload
  };

  // Helper function to get CTAs for a specific blog post
  const getPostCTAs = (postUrl) => {
    return ctaAnalysis.filter(cta => cta.page_url === postUrl);
  };

  // Helper function to get internal links for a specific blog post
  const getPostLinks = (postUrl) => {
    return linkingAnalysis.filter(link => link.source_url === postUrl || link.page_url === postUrl);
  };

  // Expandable row render function
  const renderExpandedRow = (record) => {
    const postCTAs = getPostCTAs(record.url);
    const postLinks = getPostLinks(record.url);
    
    return (
      <div style={{ padding: '16px', backgroundColor: 'var(--color-background-alt)' }}>
        <Row gutter={16}>
          {/* Blog Post Content Preview */}
          <Col span={8}>
            <Card size="small" title="Content Preview" style={{ marginBottom: '16px' }}>
              <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                <Text style={{ fontSize: '12px', lineHeight: '1.6' }}>
                  {record.content_preview || 'No content preview available'}
                </Text>
              </div>
              {record.word_count && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--color-border-base)' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Word Count: {record.word_count} | CTAs: {postCTAs.length} | Links: {postLinks.length}
                  </Text>
                </div>
              )}
            </Card>
          </Col>

          {/* CTAs Section */}
          <Col span={8}>
            <Card size="small" title={`CTAs Found (${postCTAs.length})`}>
              {postCTAs.length > 0 ? (
                <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {postCTAs.map((cta, index) => (
                    <div key={index} style={{ marginBottom: '8px', padding: '8px', backgroundColor: 'var(--color-background-elevated)', borderRadius: '4px', border: '1px solid var(--color-border-base)' }}>
                      <Tag color="blue" size="small" style={{ marginBottom: '4px' }}>
                        {cta.cta_text || 'Unknown CTA'}
                      </Tag>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        <div>Type: {cta.cta_type || 'button'}</div>
                        <div>Placement: {cta.placement || 'unknown'}</div>
                        {cta.conversion_potential && (
                          <div>Effectiveness: {cta.conversion_potential}%</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty 
                  image={<AimOutlined style={{ fontSize: '32px', color: 'var(--color-border-base)' }} />}
                  description={<Text type="secondary" style={{ fontSize: '12px' }}>No CTAs found</Text>}
                />
              )}
            </Card>
          </Col>

          {/* Internal Links Section */}
          <Col span={8}>
            <Card size="small" title={`Internal Links (${postLinks.length})`}>
              {postLinks.length > 0 ? (
                <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {postLinks.slice(0, 5).map((link, index) => (
                    <div key={index} style={{ marginBottom: '8px', padding: '8px', backgroundColor: 'var(--color-background-elevated)', borderRadius: '4px', border: '1px solid var(--color-border-base)' }}>
                      <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                        {link.anchor_text || 'Link'}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', wordBreak: 'break-all' }}>
                        {link.target_url || link.href}
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <Tag size="small" color={link.link_type === 'blog' ? 'green' : 'blue'}>
                          {link.link_type || 'internal'}
                        </Tag>
                      </div>
                    </div>
                  ))}
                  {postLinks.length > 5 && (
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      ... and {postLinks.length - 5} more links
                    </Text>
                  )}
                </div>
              ) : (
                <Empty 
                  image={<LinkOutlined style={{ fontSize: '32px', color: 'var(--color-border-base)' }} />}
                  description={<Text type="secondary" style={{ fontSize: '12px' }}>No internal links found</Text>}
                />
              )}
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // Table columns for enhanced blog content
  const blogContentColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <div>
          <Text strong>{title}</Text>
          {record.url && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.url}
              </Text>
            </div>
          )}
          <div style={{ marginTop: 4 }}>
            <Tag size="small" color={record.discovered_from === 'sitemap' ? 'blue' : 'green'}>
              {record.discovered_from || 'manual'}
            </Tag>
            {record.page_classification && (
              <Tag size="small" color="purple">
                {record.page_classification}
              </Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Content Analysis',
      key: 'content_analysis',
      width: 150,
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <Text style={{ fontSize: '12px' }}>Words: {record.word_count || 0}</Text>
          </div>
          <div style={{ marginBottom: 4 }}>
            <Text style={{ fontSize: '12px' }}>CTAs: {record.ctas_count || 0}</Text>
          </div>
          <div>
            <Tag size="small" color={record.visual_design ? 'green' : 'default'}>
              Design: {record.visual_design ? 'Yes' : 'No'}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Sitemap Data',
      key: 'sitemap_data',
      width: 140,
      render: (_, record) => (
        <div>
          {record.sitemap_priority && (
            <div style={{ marginBottom: 4 }}>
              <Text style={{ fontSize: '12px' }}>Priority: {record.sitemap_priority}</Text>
            </div>
          )}
          {record.last_modified_date && (
            <div style={{ marginBottom: 4 }}>
              <Text style={{ fontSize: '12px' }}>
                Modified: {new Date(record.last_modified_date).toLocaleDateString()}
              </Text>
            </div>
          )}
          {record.sitemap_changefreq && (
            <Tag size="small" color="orange">
              {record.sitemap_changefreq}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Quality Score',
      dataIndex: 'analysis_quality_score',
      key: 'analysis_quality_score',
      width: 120,
      render: (score) => (
        <Progress 
          percent={score || 75} 
          size="small"
          format={() => `${score || 75}%`}
          strokeColor={score >= 80 ? 'var(--color-success)' : score >= 60 ? 'var(--color-warning)' : 'var(--color-error)'}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => {
        const postCTAs = getPostCTAs(record.url);
        const postLinks = getPostLinks(record.url);
        const hasDetails = postCTAs.length > 0 || postLinks.length > 0 || record.content_preview;
        
        return (
          <Button
            size="small"
            type={expandedRows.includes(record.id) ? "primary" : "default"}
            onClick={() => {
              const newExpandedRows = expandedRows.includes(record.id)
                ? expandedRows.filter(id => id !== record.id)
                : [...expandedRows, record.id];
              setExpandedRows(newExpandedRows);
            }}
            disabled={!hasDetails}
          >
            {expandedRows.includes(record.id) ? 'Collapse' : 'View Details'}
          </Button>
        );
      },
    },
  ];


  const hasData = blogContent.length > 0 || ctaAnalysis.length > 0 || linkingAnalysis.length > 0;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>Loading comprehensive analysis...</Text>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Comprehensive Website Analysis
          </Title>
          <Text type="secondary">
            Complete analysis of your blog content, CTAs, and internal linking strategy
          </Text>
        </Col>
        <Col>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={refreshData}
              loading={refreshing}
            >
              Refresh
            </Button>
            <Button 
              icon={<ThunderboltOutlined />}
              onClick={forceReanalyze}
              loading={reanalyzing}
              type="default"
              danger
            >
              Force Re-analyze
            </Button>
            <Button 
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setUploadModalVisible(true)}
            >
              Upload Content
            </Button>
          </Space>
        </Col>
      </Row>

      {!hasData ? (
        <Card>
          <Empty
            image={<FileSearchOutlined style={{ fontSize: '64px', color: 'var(--color-border-base)' }} />}
            description={
              <div>
                <Title level={4}>No Analysis Data Found</Title>
                <Paragraph style={{ color: 'var(--color-text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
                  Start by uploading your existing blog content or running a website analysis 
                  to discover insights about your content strategy, CTAs, and linking patterns.
                </Paragraph>
              </div>
            }
          >
            <Space>
              <Button 
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setUploadModalVisible(true)}
              >
                Upload Blog Content
              </Button>
              <Button icon={<FileSearchOutlined />}>
                Run Website Analysis
              </Button>
            </Space>
          </Empty>
        </Card>
      ) : (
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* Overview Tab */}
          <TabPane
            tab={
              <span>
                <BarChartOutlined />
                Overview
              </span>
            }
            key="overview"
          >
            {/* Enhanced Statistics Cards */}
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title="Blog Posts Analyzed"
                    value={blogContent.length}
                    prefix={<BookOutlined style={{ color: 'var(--color-success)' }} />}
                  />
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {blogContent.filter(post => post.discovered_from === 'sitemap').length} from sitemap
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title="CTAs Discovered"
                    value={ctaAnalysis.length}
                    prefix={<AimOutlined style={{ color: 'var(--color-primary)' }} />}
                  />
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {ctaAnalysis.filter(cta => cta.page_type === 'blog_post').length} from blog posts (expand rows to view)
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title="Enhanced Analysis"
                    value={blogContent.filter(post => post.visual_design || post.ctas_count > 0).length}
                    suffix={`/ ${blogContent.length}`}
                    prefix={<BgColorsOutlined style={{ color: 'var(--color-primary)' }} />}
                  />
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    Posts with design data
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title="Overall Score"
                    value={comprehensiveResults?.analysisQuality || 85}
                    suffix="%"
                    prefix={<TrophyOutlined style={{ color: 'var(--color-warning)' }} />}
                  />
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {visualDesignData?.totalPages || 0} pages with visual data
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Enhanced Data Summary */}
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={8}>
                <Card title="Content Discovery" size="small">
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>Sitemap Discovery</Text>
                      <Text strong>{blogContent.filter(post => post.discovered_from === 'sitemap').length}</Text>
                    </div>
                    <Progress 
                      percent={Math.round((blogContent.filter(post => post.discovered_from === 'sitemap').length / Math.max(blogContent.length, 1)) * 100)}
                      size="small" 
                      strokeColor="var(--color-primary)"
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>Enhanced Analysis</Text>
                      <Text strong>{blogContent.filter(post => post.visual_design).length}</Text>
                    </div>
                    <Progress 
                      percent={Math.round((blogContent.filter(post => post.visual_design).length / Math.max(blogContent.length, 1)) * 100)}
                      size="small" 
                      strokeColor="var(--color-success)"
                    />
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="Content Quality" size="small">
                  {visualDesignData?.designPatterns && (
                    <div>
                      <div style={{ marginBottom: '8px' }}>
                        <Text style={{ fontSize: '12px' }}>Color Palette: </Text>
                        <Text strong>{visualDesignData.designPatterns.colorPalettes?.length || 0} colors</Text>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <Text style={{ fontSize: '12px' }}>Typography: </Text>
                        <Text strong>{visualDesignData.designPatterns.typography?.length || 0} fonts</Text>
                      </div>
                      <div>
                        <Text style={{ fontSize: '12px' }}>Avg Word Count: </Text>
                        <Text strong>
                          {blogContent.length > 0 
                            ? Math.round(blogContent.reduce((sum, post) => sum + (post.word_count || 0), 0) / blogContent.length)
                            : 0
                          }
                        </Text>
                      </div>
                    </div>
                  )}
                  {!visualDesignData?.designPatterns && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Run enhanced analysis to see quality metrics
                    </Text>
                  )}
                </Card>
              </Col>
              <Col span={8}>
                <Card title="Sitemap Metadata" size="small">
                  <div style={{ marginBottom: '8px' }}>
                    <Text style={{ fontSize: '12px' }}>Priority Range: </Text>
                    <Text strong>
                      {blogContent.filter(post => post.sitemap_priority).length > 0 
                        ? `${Math.min(...blogContent.filter(post => post.sitemap_priority).map(post => post.sitemap_priority))} - ${Math.max(...blogContent.filter(post => post.sitemap_priority).map(post => post.sitemap_priority))}`
                        : 'N/A'
                      }
                    </Text>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <Text style={{ fontSize: '12px' }}>Update Frequency: </Text>
                    <Text strong>
                      {blogContent.find(post => post.sitemap_changefreq)?.sitemap_changefreq || 'Unknown'}
                    </Text>
                  </div>
                  <div>
                    <Text style={{ fontSize: '12px' }}>Recent Updates: </Text>
                    <Text strong>
                      {blogContent.filter(post => post.last_modified_date).length}
                    </Text>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Key Insights */}
            {comprehensiveResults && (
              <Card title="Key Strategic Insights" style={{ marginBottom: '24px' }}>
                <Row gutter={16}>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <BulbOutlined style={{ fontSize: '24px', color: 'var(--color-success)', marginBottom: '8px' }} />
                      <div>
                        <Text strong>Content Patterns</Text>
                        <div style={{ marginTop: '8px' }}>
                          <Text style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            {comprehensiveResults.contentPatterns?.tone || 'Professional'} tone with focus on {comprehensiveResults.contentPatterns?.topics?.join(', ') || 'expertise'}
                          </Text>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <AimOutlined style={{ fontSize: '24px', color: 'var(--color-primary)', marginBottom: '8px' }} />
                      <div>
                        <Text strong>CTA Strategy</Text>
                        <div style={{ marginTop: '8px' }}>
                          <Text style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            {comprehensiveResults.ctaStrategy?.primaryGoal || 'Lead generation'} with {comprehensiveResults.ctaStrategy?.placement || 'strategic'} placement
                          </Text>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <LinkOutlined style={{ fontSize: '24px', color: 'var(--color-primary)', marginBottom: '8px' }} />
                      <div>
                        <Text strong>Linking Strategy</Text>
                        <div style={{ marginTop: '8px' }}>
                          <Text style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            {comprehensiveResults.linkingStrategy?.structure || 'Hub and spoke'} structure focusing on {comprehensiveResults.linkingStrategy?.focus || 'product pages'}
                          </Text>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>
            )}

            {/* Upload Status */}
            {uploadStatus && uploadStatus.summary?.total_uploads > 0 && (
              <Card title="Content Upload History" style={{ marginBottom: '24px' }}>
                <Row gutter={16}>
                  <Col span={6}>
                    <Statistic
                      title="Total Uploads"
                      value={uploadStatus.summary.total_uploads}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Posts Uploaded"
                      value={uploadStatus.summary.total_posts_uploaded}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Successful"
                      value={uploadStatus.summary.successful_uploads}
                      valueStyle={{ color: 'var(--color-success)' }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Failed"
                      value={uploadStatus.summary.failed_uploads}
                      valueStyle={{ color: 'var(--color-error)' }}
                    />
                  </Col>
                </Row>
              </Card>
            )}
          </TabPane>

          {/* Blog Content Tab - Now includes CTAs and Internal Links */}
          <TabPane
            tab={
              <span>
                <BookOutlined />
                Blog Content ({blogContent.length})
                {(ctaAnalysis.length > 0 || linkingAnalysis.length > 0) && (
                  <Text type="secondary" style={{ fontSize: '10px', marginLeft: '4px' }}>
                    + CTAs & Links
                  </Text>
                )}
              </span>
            }
            key="content"
          >
            <Card>
              <Table
                columns={blogContentColumns}
                dataSource={blogContent}
                pagination={{ pageSize: 10 }}
                size="small"
                rowKey="id"
                expandable={{
                  expandedRowKeys: expandedRows,
                  expandedRowRender: renderExpandedRow,
                  onExpand: (expanded, record) => {
                    const newExpandedRows = expanded
                      ? [...expandedRows, record.id]
                      : expandedRows.filter(id => id !== record.id);
                    setExpandedRows(newExpandedRows);
                  },
                  rowExpandable: (record) => {
                    const postCTAs = getPostCTAs(record.url);
                    const postLinks = getPostLinks(record.url);
                    return postCTAs.length > 0 || postLinks.length > 0 || record.content_preview;
                  },
                }}
              />
            </Card>
          </TabPane>


          {/* Visual Design Analysis Tab */}
          <TabPane
            tab={
              <span>
                <BgColorsOutlined />
                Visual Design
              </span>
            }
            key="visual"
          >
            <Row gutter={16}>
              {/* Color Palette */}
              <Col span={12}>
                <Card title="Color Palette" style={{ marginBottom: '16px' }}>
                  {visualDesignData?.designPatterns?.colorPalettes && visualDesignData.designPatterns.colorPalettes.length > 0 ? (
                    <div>
                      <div style={{ marginBottom: '16px' }}>
                        {visualDesignData.designPatterns.colorPalettes.slice(0, 8).map((color, index) => (
                          <div 
                            key={index}
                            style={{
                              display: 'inline-block',
                              width: '40px',
                              height: '40px',
                              backgroundColor: color,
                              marginRight: '8px',
                              marginBottom: '8px',
                              borderRadius: '4px',
                              border: '1px solid #d9d9d9'
                            }}
                            title={color}
                          />
                        ))}
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {visualDesignData.designPatterns.colorPalettes.length} unique colors identified
                        </Text>
                      </div>
                    </div>
                  ) : (
                    <Empty 
                      image={<BgColorsOutlined style={{ fontSize: '48px', color: 'var(--color-border-base)' }} />}
                      description="No color data available"
                    />
                  )}
                </Card>
              </Col>

              {/* Typography */}
              <Col span={12}>
                <Card title="Typography" style={{ marginBottom: '16px' }}>
                  {visualDesignData?.designPatterns?.typography && visualDesignData.designPatterns.typography.length > 0 ? (
                    <div>
                      {visualDesignData.designPatterns.typography.slice(0, 5).map((font, index) => (
                        <div key={index} style={{ marginBottom: '8px', padding: '8px', backgroundColor: 'var(--color-background-alt)', borderRadius: '4px' }}>
                          <Text style={{ fontFamily: font }} strong>{font}</Text>
                          <br />
                          <Text style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Sample text in {font}</Text>
                        </div>
                      ))}
                      <div style={{ marginTop: '12px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {visualDesignData.designPatterns.typography.length} fonts detected
                        </Text>
                      </div>
                    </div>
                  ) : (
                    <Empty 
                      image={<NodeIndexOutlined style={{ fontSize: '48px', color: 'var(--color-border-base)' }} />}
                      description="No typography data available"
                    />
                  )}
                </Card>
              </Col>
            </Row>

            {/* Enhanced Granular Design Patterns */}
            {blogContent.some(post => post.visual_design) && (
              <Card title="Granular Design Patterns" style={{ marginBottom: '16px' }}>
                {blogContent
                  .filter(post => post.visual_design)
                  .slice(0, 1)
                  .map(post => {
                    let elementPatterns = null;
                    try {
                      const visualDesign = typeof post.visual_design === 'string' 
                        ? JSON.parse(post.visual_design) 
                        : post.visual_design;
                      elementPatterns = visualDesign?.elementPatterns;
                    } catch (e) {
                      console.error('Failed to parse visual design data:', e);
                    }
                    
                    if (!elementPatterns) return null;

                    return (
                      <div key={post.id}>
                        <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '16px' }}>
                          Element-specific design patterns from: {post.title}
                        </Text>
                        
                        <Row gutter={[16, 16]}>
                          {/* Headings Patterns */}
                          {elementPatterns.headings && (
                            <Col span={12}>
                              <Card size="small" title="Heading Styles" style={{ height: '300px' }}>
                                <div style={{ maxHeight: '250px', overflow: 'auto' }}>
                                  {Object.entries(elementPatterns.headings).map(([headingLevel, data]) => (
                                    <div key={headingLevel} style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'var(--color-background-alt)', borderRadius: '4px' }}>
                                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                        {headingLevel.toUpperCase()} ({data.count} found)
                                      </div>
                                      {data.patterns.colors?.textColor && (
                                        <div style={{ fontSize: '11px', marginBottom: '2px' }}>
                                          <Text strong>Colors: </Text>
                                          {data.patterns.colors.textColor.map((color, i) => (
                                            <span key={i} style={{ marginRight: '8px' }}>
                                              <span 
                                                style={{ 
                                                  display: 'inline-block',
                                                  width: '12px',
                                                  height: '12px',
                                                  backgroundColor: color,
                                                  marginRight: '4px',
                                                  borderRadius: '2px',
                                                  border: '1px solid var(--color-border-base)',
                                                  verticalAlign: 'middle'
                                                }}
                                              />
                                              {color}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      {data.patterns.typography?.fontSize && (
                                        <div style={{ fontSize: '11px', marginBottom: '2px' }}>
                                          <Text strong>Size: </Text>{data.patterns.typography.fontSize.join(', ')}
                                        </div>
                                      )}
                                      {data.patterns.typography?.fontFamily && (
                                        <div style={{ fontSize: '11px' }}>
                                          <Text strong>Font: </Text>{data.patterns.typography.fontFamily.join(', ')}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </Card>
                            </Col>
                          )}

                          {/* Interactive Elements */}
                          {elementPatterns.interactive && (
                            <Col span={12}>
                              <Card size="small" title="Interactive Elements" style={{ height: '300px' }}>
                                <div style={{ maxHeight: '250px', overflow: 'auto' }}>
                                  {Object.entries(elementPatterns.interactive).map(([elementType, data]) => (
                                    <div key={elementType} style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'var(--color-info-bg)', borderRadius: '4px' }}>
                                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                        {elementType.replace('_', ' ').toUpperCase()} ({data.count} found)
                                      </div>
                                      {data.patterns.colors?.backgroundColor && (
                                        <div style={{ fontSize: '11px', marginBottom: '2px' }}>
                                          <Text strong>Background: </Text>
                                          {data.patterns.colors.backgroundColor.map((color, i) => (
                                            <span key={i} style={{ marginRight: '8px' }}>
                                              <span 
                                                style={{ 
                                                  display: 'inline-block',
                                                  width: '12px',
                                                  height: '12px',
                                                  backgroundColor: color,
                                                  marginRight: '4px',
                                                  borderRadius: '2px',
                                                  border: '1px solid var(--color-border-base)',
                                                  verticalAlign: 'middle'
                                                }}
                                              />
                                              {color}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      {data.patterns.colors?.textColor && (
                                        <div style={{ fontSize: '11px', marginBottom: '2px' }}>
                                          <Text strong>Text: </Text>
                                          {data.patterns.colors.textColor.map((color, i) => (
                                            <span key={i} style={{ marginRight: '8px' }}>
                                              <span 
                                                style={{ 
                                                  display: 'inline-block',
                                                  width: '12px',
                                                  height: '12px',
                                                  backgroundColor: color,
                                                  marginRight: '4px',
                                                  borderRadius: '2px',
                                                  border: '1px solid var(--color-border-base)',
                                                  verticalAlign: 'middle'
                                                }}
                                              />
                                              {color}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      {data.patterns.commonStyles?.borderRadius && (
                                        <div style={{ fontSize: '11px' }}>
                                          <Text strong>Border Radius: </Text>{data.patterns.commonStyles.borderRadius.join(', ')}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </Card>
                            </Col>
                          )}
                        </Row>

                        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                          {/* Text Elements */}
                          {elementPatterns.text && (
                            <Col span={12}>
                              <Card size="small" title="Text Elements" style={{ height: '250px' }}>
                                <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                                  {Object.entries(elementPatterns.text).map(([elementType, data]) => (
                                    <div key={elementType} style={{ marginBottom: '8px', padding: '6px', backgroundColor: 'var(--color-accent-50)', borderRadius: '4px' }}>
                                      <Text strong style={{ fontSize: '12px' }}>
                                        {elementType.toUpperCase()} ({data.count})
                                      </Text>
                                      <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                        {data.description || 'No specific patterns detected'}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </Card>
                            </Col>
                          )}

                          {/* Design Pattern Preview */}
                          <Col span={12}>
                            <Card size="small" title="Pattern Preview" style={{ height: '250px' }}>
                              <div style={{ padding: '12px', backgroundColor: 'var(--color-background-alt)', borderRadius: '4px', height: '200px', overflow: 'auto' }}>
                                <div style={{ marginBottom: '12px' }}>
                                  <Text strong style={{ fontSize: '14px' }}>Design Replication Guide</Text>
                                </div>
                                
                                {elementPatterns.headings?.h1 && (
                                  <div style={{ 
                                    marginBottom: '8px', 
                                    padding: '8px', 
                                    backgroundColor: 'var(--color-background-elevated)', 
                                    borderRadius: '4px',
                                    color: elementPatterns.headings.h1.patterns.colors?.textColor?.[0] || 'var(--color-text-primary)',
                                    fontSize: elementPatterns.headings.h1.patterns.typography?.fontSize?.[0] || '24px',
                                    fontFamily: elementPatterns.headings.h1.patterns.typography?.fontFamily?.[0] || 'inherit'
                                  }}>
                                    Sample H1 Heading
                                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                                      Use: {elementPatterns.headings.h1.patterns.colors?.textColor?.[0] || 'default'} | 
                                      {elementPatterns.headings.h1.patterns.typography?.fontSize?.[0] || 'default size'}
                                    </div>
                                  </div>
                                )}

                                {elementPatterns.interactive?.button && (
                                  <div style={{ marginBottom: '8px' }}>
                                    <div style={{ 
                                      display: 'inline-block',
                                      padding: '8px 16px', 
                                      backgroundColor: elementPatterns.interactive.button.patterns.colors?.backgroundColor?.[0] || 'var(--color-primary)',
                                      color: elementPatterns.interactive.button.patterns.colors?.textColor?.[0] || 'var(--color-text-on-primary)',
                                      borderRadius: elementPatterns.interactive.button.patterns.commonStyles?.borderRadius?.[0] || '4px',
                                      border: 'none',
                                      fontSize: '14px'
                                    }}>
                                      Sample Button
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                                      Use: {elementPatterns.interactive.button.patterns.colors?.backgroundColor?.[0] || 'default'} background
                                    </div>
                                  </div>
                                )}

                                <Text type="secondary" style={{ fontSize: '10px' }}>
                                  ↑ Live preview using extracted design patterns
                                </Text>
                              </div>
                            </Card>
                          </Col>
                        </Row>
                      </div>
                    );
                  })}
              </Card>
            )}

            {/* Content Structure Analysis */}
            <Card title="Content Structure Analysis" style={{ marginBottom: '16px' }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="Total Pages Analyzed"
                    value={visualDesignData?.totalPages || 0}
                    prefix={<FileSearchOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="With Visual Design"
                    value={blogContent.filter(post => post.visual_design).length}
                    suffix={`/ ${blogContent.length}`}
                    valueStyle={{ color: blogContent.filter(post => post.visual_design).length > 0 ? 'var(--color-success)' : 'var(--color-warning)' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Total CTAs Extracted"
                    value={blogContent.reduce((sum, post) => sum + (post.ctas_count || 0), 0)}
                    prefix={<AimOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Discovery Success"
                    value={blogContent.filter(post => post.discovered_from === 'sitemap').length}
                    suffix={`/ ${blogContent.length}`}
                    valueStyle={{ color: 'var(--color-primary)' }}
                  />
                </Col>
              </Row>
            </Card>

            {/* Enhanced Blog Content with Focus on Design */}
            <Card title="Posts with Enhanced Analysis">
              <Table
                columns={[
                  {
                    title: 'Post Title',
                    dataIndex: 'title',
                    key: 'title',
                    render: (title, record) => (
                      <div>
                        <Text strong>{title}</Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag size="small" color={record.visual_design ? 'green' : 'default'}>
                            {record.visual_design ? 'Enhanced' : 'Basic'}
                          </Tag>
                        </div>
                      </div>
                    )
                  },
                  {
                    title: 'Content Metrics',
                    key: 'metrics',
                    render: (_, record) => (
                      <div>
                        <div>Words: {record.word_count || 0}</div>
                        <div>CTAs: {record.ctas_count || 0}</div>
                        {record.content_structure && (
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                            Structure: Analyzed
                          </div>
                        )}
                      </div>
                    )
                  },
                  {
                    title: 'Discovery Info',
                    key: 'discovery',
                    render: (_, record) => (
                      <div>
                        <Tag color="blue" size="small">{record.discovered_from}</Tag>
                        {record.sitemap_priority && (
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            Priority: {record.sitemap_priority}
                          </div>
                        )}
                      </div>
                    )
                  },
                  {
                    title: 'Last Modified',
                    dataIndex: 'last_modified_date',
                    key: 'last_modified',
                    render: (date) => date ? (
                      <div style={{ fontSize: '12px' }}>
                        {new Date(date).toLocaleDateString()}
                      </div>
                    ) : '-'
                  }
                ]}
                dataSource={blogContent.filter(post => post.visual_design || post.ctas_count > 0)}
                pagination={{ pageSize: 8 }}
                size="small"
                rowKey="id"
              />
              
              {blogContent.filter(post => post.visual_design || post.ctas_count > 0).length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Empty 
                    image={<SearchOutlined style={{ fontSize: '48px', color: 'var(--color-border-base)' }} />}
                    description={
                      <div>
                        <Title level={5}>No Enhanced Analysis Available</Title>
                        <Text type="secondary">
                          Run a comprehensive website analysis to see visual design patterns and enhanced content data.
                        </Text>
                      </div>
                    }
                  />
                </div>
              )}
            </Card>
          </TabPane>
        </Tabs>
      )}

      {/* Content Upload Modal */}
      <ContentUploadModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default ComprehensiveAnalysisTab;