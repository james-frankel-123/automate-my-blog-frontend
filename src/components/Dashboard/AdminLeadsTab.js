import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Statistic,
  Row,
  Col,
  Select,
  Input,
  Button,
  Tag,
  Modal,
  Descriptions,
  Timeline,
  Space,
  Progress,
  Typography,
  message,
  Form,
  Radio,
  Tooltip
} from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  FilterOutlined,
  DownloadOutlined,
  TrophyOutlined,
  UserOutlined,
  GlobalOutlined,
  LineChartOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import autoBlogAPI from '../../services/api';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const AdminLeadsTab = () => {
  const { isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 25,
    total: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    source: 'all',
    dateRange: 'month',
    search: '',
    minScore: 0,
    maxScore: 100,
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });

  // UI State
  const [selectedLead, setSelectedLead] = useState(null);
  const [showLeadDetails, setShowLeadDetails] = useState(false);
  const [, setShowFilters] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Lead status update
  const [editingStatus, setEditingStatus] = useState(null);
  const [statusForm] = Form.useForm();

  useEffect(() => {
    if (isSuperAdmin) {
      loadLeads();
      loadAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.current, pagination.pageSize, isSuperAdmin]);

  // Only render if user is super admin
  if (!isSuperAdmin) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Title level={4}>Access Denied</Title>
          <Text>This feature is only available to super administrators.</Text>
        </div>
      </Card>
    );
  }

  const loadLeads = async () => {
    try {
      setLoading(true);
      const options = {
        ...filters,
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize
      };
      const result = await autoBlogAPI.getLeads(options);
      const leadsData = result.data?.leads || [];
      setLeads(leadsData);
      setPagination(prev => ({
        ...prev,
        total: result.data?.pagination?.total || 0
      }));
    } catch (error) {
      console.error('❌ loadLeads error:', {
        error: error,
        errorMessage: error.message,
        errorStack: error.stack
      });
      message.error('Failed to load leads: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const analyticsData = await autoBlogAPI.getLeadAnalytics(filters.dateRange);
      setAnalytics(analyticsData.data || analyticsData);
    } catch (error) {
      message.error('Failed to load analytics: ' + error.message);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page
  };

  const handleTableChange = (paginationData, tableFilters, sorter) => {
    setPagination(paginationData);
    
    if (sorter.field) {
      setFilters(prev => ({
        ...prev,
        sortBy: sorter.field,
        sortOrder: sorter.order === 'ascend' ? 'ASC' : 'DESC'
      }));
    }
  };

  const showLeadDetailsModal = async (lead) => {
    try {
      const leadDetails = await autoBlogAPI.getLeadDetails(lead.id);
      setSelectedLead(leadDetails.data || leadDetails);
      setShowLeadDetails(true);
    } catch (error) {
      message.error('Failed to load lead details: ' + error.message);
    }
  };

  const handleStatusUpdate = async (values) => {
    try {
      await autoBlogAPI.updateLeadStatus(editingStatus.id, values.status, values.notes);
      message.success('Lead status updated successfully');
      setEditingStatus(null);
      statusForm.resetFields();
      loadLeads(); // Refresh the table
    } catch (error) {
      message.error('Failed to update lead status: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'new': 'blue',
      'qualified': 'green',
      'nurturing': 'orange',
      'converted': 'purple',
      'lost': 'red'
    };
    return colors[status] || 'default';
  };

  const getSourceColor = (source) => {
    const colors = {
      'website_analysis': 'cyan',
      'organic_search': 'green',
      'referral': 'purple',
      'direct': 'blue',
      'social': 'magenta'
    };
    return colors[source] || 'default';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#52c41a'; // Green
    if (score >= 60) return '#faad14'; // Orange  
    if (score >= 40) return '#fa8c16'; // Light red
    return '#ff4d4f'; // Red
  };

  const columns = [
    {
      title: 'Website URL',
      dataIndex: 'websiteUrl',
      key: 'websiteUrl',
      render: (url) => (
        <div style={{ maxWidth: '200px' }}>
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px' }}>
            {url}
          </a>
        </div>
      ),
      width: 220,
      ellipsis: true,
    },
    {
      title: 'Business',
      dataIndex: 'businessName',
      key: 'businessName',
      render: (name, record) => (
        <div>
          <Text strong style={{ display: 'block' }}>{name || 'Analyzing...'}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.businessType || 'Pending Analysis'}
          </Text>
        </div>
      ),
      sorter: true,
      width: 180,
    },
    {
      title: 'Industry',
      dataIndex: 'industry',
      key: 'industry',
      render: (industry) => (
        <Tag style={{ margin: 0 }}>{industry || 'Unknown'}</Tag>
      ),
      width: 120
    },
    {
      title: 'Business Intelligence',
      key: 'businessIntelligence',
      render: (_, record) => {
        // Display organization intelligence data instead of just lead score
        const confidence = record.analysisConfidenceScore || 0;
        const scenariosCount = record.customerScenarios?.length || 0;
        const decisionMakers = record.decisionMakers?.length || 0;
        
        return (
          <div style={{ textAlign: 'left', fontSize: '12px' }}>
            <div style={{ marginBottom: '4px' }}>
              <Text strong style={{ color: confidence > 0.7 ? '#52c41a' : confidence > 0.5 ? '#faad14' : '#ff4d4f' }}>
                {(confidence * 100).toFixed(0)}% Confidence
              </Text>
            </div>
            {scenariosCount > 0 && (
              <div style={{ color: 'var(--color-text-secondary)' }}>
                {scenariosCount} Scenario{scenariosCount > 1 ? 's' : ''}
              </div>
            )}
            {decisionMakers > 0 && (
              <div style={{ color: 'var(--color-text-secondary)' }}>
                {decisionMakers} Contact{decisionMakers > 1 ? 's' : ''}
              </div>
            )}
            {record.primaryCustomerProblem && (
              <div style={{ color: 'var(--color-text-tertiary)', fontSize: '11px', marginTop: '2px' }}>
                {record.primaryCustomerProblem.substring(0, 40)}...
              </div>
            )}
          </div>
        );
      },
      width: 150
    },
    {
      title: 'Source',
      dataIndex: 'leadSource',
      key: 'leadSource',
      render: (source) => (
        <Tag color={getSourceColor(source)} style={{ margin: 0 }}>
          {source.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
      width: 130
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <div>
          <Tag color={getStatusColor(status)} style={{ margin: 0 }}>
            {status.replace('_', ' ').toUpperCase()}
          </Tag>
          {record.isConverted && (
            <div style={{ marginTop: '4px' }}>
              <Tag color="success" size="small">
                <TrophyOutlined /> CONVERTED
              </Tag>
            </div>
          )}
        </div>
      ),
      width: 120
    },
    {
      title: 'Funnel Progress',
      key: 'funnelProgress',
      render: (_, record) => (
        <div style={{ textAlign: 'center' }}>
          <Text style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {record.daysInFunnel} days
          </Text>
          <div style={{ marginTop: '4px' }}>
            <Text style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
              {record.conversionStepsCount} steps
            </Text>
          </div>
        </div>
      ),
      width: 100
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => {
        const dateObj = new Date(date);
        const now = new Date();
        const diffDays = Math.floor((now - dateObj) / (1000 * 60 * 60 * 24));
        const timeAgo = diffDays === 0 ? 'Today' : diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
        
        return (
          <Text style={{ fontSize: '12px' }}>
            {dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
            <br />
            <Text type="secondary" style={{ fontSize: '10px' }}>
              {timeAgo}
            </Text>
          </Text>
        );
      },
      sorter: true,
      width: 80
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              icon={<EyeOutlined />} 
              size="small" 
              onClick={() => showLeadDetailsModal(record)}
            />
          </Tooltip>
          <Tooltip title="Update Status">
            <Button 
              icon={<EditOutlined />} 
              size="small" 
              onClick={() => {
                setEditingStatus(record);
                statusForm.setFieldsValue({ 
                  status: record.status,
                  notes: ''
                });
              }}
            />
          </Tooltip>
        </Space>
      ),
      width: 100
    }
  ];

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Analytics Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card loading={loadingAnalytics}>
            <Statistic
              title="Total Leads"
              value={analytics?.overview?.totalLeads || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card loading={loadingAnalytics}>
            <Statistic
              title="Conversion Rate"
              value={analytics?.overview?.conversionRate || 0}
              precision={1}
              suffix="%"
              valueStyle={{ color: analytics?.overview?.conversionRate > 5 ? '#52c41a' : '#fa8c16' }}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card loading={loadingAnalytics}>
            <Statistic
              title="Avg Intelligence Score"
              value={(analytics?.overview?.averageConfidenceScore || 0) * 100}
              precision={0}
              suffix="%"
              prefix={<StarOutlined />}
              valueStyle={{ 
                color: (analytics?.overview?.averageConfidenceScore || 0) > 0.7 ? '#52c41a' : 
                       (analytics?.overview?.averageConfidenceScore || 0) > 0.5 ? '#faad14' : '#ff4d4f' 
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card loading={loadingAnalytics}>
            <Statistic
              title="Organizations Analyzed"
              value={analytics?.overview?.uniqueOrganizations || 0}
              prefix={<LineChartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Controls */}
      <Card size="small" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={6}>
            <Search
              placeholder="Search leads..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              onSearch={() => loadLeads()}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} sm={4}>
            <Select
              placeholder="Status"
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              style={{ width: '100%' }}
            >
              <Option value="all">All Status</Option>
              <Option value="new">New</Option>
              <Option value="qualified">Qualified</Option>
              <Option value="nurturing">Nurturing</Option>
              <Option value="converted">Converted</Option>
              <Option value="lost">Lost</Option>
            </Select>
          </Col>
          <Col xs={12} sm={4}>
            <Select
              placeholder="Source"
              value={filters.source}
              onChange={(value) => handleFilterChange('source', value)}
              style={{ width: '100%' }}
            >
              <Option value="all">All Sources</Option>
              <Option value="website_analysis">Website Analysis</Option>
              <Option value="organic_search">Organic Search</Option>
              <Option value="referral">Referral</Option>
              <Option value="direct">Direct</Option>
              <Option value="social">Social Media</Option>
            </Select>
          </Col>
          <Col xs={12} sm={4}>
            <Select
              placeholder="Date Range"
              value={filters.dateRange}
              onChange={(value) => handleFilterChange('dateRange', value)}
              style={{ width: '100%' }}
            >
              <Option value="today">Today</Option>
              <Option value="week">This Week</Option>
              <Option value="month">This Month</Option>
              <Option value="quarter">This Quarter</Option>
              <Option value="all">All Time</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6}>
            <Space>
              <Button 
                icon={<FilterOutlined />}
                onClick={() => setShowFilters(true)}
              >
                Advanced
              </Button>
              <Button 
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => message.info('Export functionality coming soon')}
              >
                Export
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Leads Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={leads}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} leads`,
            pageSizeOptions: ['10', '25', '50', '100']
          }}
          onChange={handleTableChange}
          rowKey="id"
          size="small"
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Lead Details Modal */}
      <Modal
        title={
          <div>
            <GlobalOutlined style={{ marginRight: '8px', color: 'var(--color-primary)' }} />
            Lead Details
          </div>
        }
        open={showLeadDetails}
        onCancel={() => setShowLeadDetails(false)}
        footer={null}
        width={1000}
        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
      >
        {selectedLead && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={16}>
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="Business Name">
                    {selectedLead.businessName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Website">
                    <a href={selectedLead.websiteUrl} target="_blank" rel="noopener noreferrer">
                      {selectedLead.websiteUrl}
                    </a>
                  </Descriptions.Item>
                  <Descriptions.Item label="Industry">
                    {selectedLead.industry || 'Unknown'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Company Size">
                    {selectedLead.estimatedCompanySize || 'Unknown'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Lead Source">
                    <Tag color={getSourceColor(selectedLead.leadSource)}>
                      {selectedLead.leadSourceDisplay}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Created">
                    {new Date(selectedLead.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: '2-digit' 
                    })} at {new Date(selectedLead.createdAt).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Statistic
                    title="Lead Score"
                    value={selectedLead.leadScore}
                    valueStyle={{ color: getScoreColor(selectedLead.leadScore) }}
                  />
                  <Progress 
                    percent={selectedLead.leadScore} 
                    strokeColor={getScoreColor(selectedLead.leadScore)}
                    style={{ marginTop: '8px' }}
                  />
                  <div style={{ marginTop: '16px' }}>
                    <Tag color={getStatusColor(selectedLead.status)}>
                      {selectedLead.statusDisplay}
                    </Tag>
                    {selectedLead.isConverted && (
                      <div style={{ marginTop: '8px' }}>
                        <Tag color="success">
                          <TrophyOutlined /> Converted
                        </Tag>
                        <div style={{ marginTop: '8px', fontSize: '12px' }}>
                          <Text type="secondary">
                            {new Date(selectedLead.convertedAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: '2-digit' 
                            })}
                          </Text>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Organization Business Intelligence Section */}
            <div style={{ marginTop: '24px' }}>
              <Title level={5}>
                <StarOutlined style={{ marginRight: '8px', color: 'var(--color-primary)' }} />
                Business Intelligence
              </Title>
              
              {/* Intelligence Overview */}
              <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
                <Col span={8}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <Statistic
                      title="Analysis Confidence"
                      value={(selectedLead.analysisConfidenceScore || 0) * 100}
                      precision={0}
                      suffix="%"
                      valueStyle={{ 
                        color: selectedLead.analysisConfidenceScore > 0.7 ? '#52c41a' : 
                               selectedLead.analysisConfidenceScore > 0.5 ? '#faad14' : '#ff4d4f' 
                      }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <Statistic
                      title="Customer Scenarios"
                      value={selectedLead.customerScenarios?.length || 0}
                      prefix={<UserOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <Statistic
                      title="Decision Makers"
                      value={selectedLead.decisionMakers?.length || 0}
                      prefix={<TrophyOutlined />}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Organization Data */}
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card size="small" title="Organization Profile">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Organization">
                        {selectedLead.organizationName || selectedLead.businessName}
                      </Descriptions.Item>
                      <Descriptions.Item label="Business Model">
                        {selectedLead.businessModel || 'Not defined'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Company Size">
                        {selectedLead.companySize || selectedLead.estimatedCompanySize || 'Unknown'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Target Audience">
                        {selectedLead.targetAudience || selectedLead.analysisData?.targetAudience || 'Not identified'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Brand Voice">
                        {selectedLead.brandVoice || selectedLead.analysisData?.brandVoice || 'Not defined'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Content Focus">
                        {selectedLead.contentFocus || selectedLead.analysisData?.contentFocus || 'Not defined'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Website Goals">
                        {selectedLead.websiteGoals || selectedLead.analysisData?.websiteGoals || 'Not defined'}
                      </Descriptions.Item>
                      <Descriptions.Item label="End Users">
                        {selectedLead.endUsers || selectedLead.analysisData?.endUsers || 'Not identified'}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="Business Intelligence & Scoring">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Overall Lead Score">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Text strong style={{ color: getScoreColor(selectedLead.leadScore) }}>
                            {selectedLead.leadScore || 0}/100
                          </Text>
                          <Progress 
                            percent={selectedLead.leadScore || 0} 
                            size="small" 
                            strokeColor={getScoreColor(selectedLead.leadScore)}
                            showInfo={false}
                            style={{ width: '80px' }}
                          />
                        </div>
                      </Descriptions.Item>
                      <Descriptions.Item label="Business Size Score">
                        <div>
                          <Text strong>{selectedLead.scoringBreakdown?.businessSize || 0}/20</Text>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                            Enterprise (20) • Medium (16) • Small (12) • Startup (8) • Unknown (4)
                          </div>
                        </div>
                      </Descriptions.Item>
                      <Descriptions.Item label="Industry Fit Score">
                        <div>
                          <Text strong>{selectedLead.scoringBreakdown?.industryFit || 0}/20</Text>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                            Tech/E-commerce (20) • Healthcare/Professional/Financial (16) • Education (12) • Other (8)
                          </div>
                        </div>
                      </Descriptions.Item>
                      <Descriptions.Item label="Engagement Score">
                        <div>
                          <Text strong>{selectedLead.scoringBreakdown?.engagement || 0}/20</Text>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                            Base (12) + time analyzing + conversion steps completed
                          </div>
                        </div>
                      </Descriptions.Item>
                      <Descriptions.Item label="Content Quality Score">
                        <div>
                          <Text strong>{selectedLead.scoringBreakdown?.contentQuality || 0}/20</Text>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                            Rich keywords (8) + target audience (6) + content focus (6)
                          </div>
                        </div>
                      </Descriptions.Item>
                      <Descriptions.Item label="Organization ID">
                        <Text code style={{ fontSize: '11px' }}>
                          {selectedLead.organizationId || 'Not linked'}
                        </Text>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
              </Row>

              {/* Customer Scenarios */}
              {selectedLead.customerScenarios && selectedLead.customerScenarios.length > 0 && (
                <Card size="small" title="Customer Scenarios & Problems" style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedLead.customerScenarios.map((scenario, index) => (
                      <div key={index} style={{ 
                        padding: '12px', 
                        border: '1px solid #f0f0f0', 
                        borderRadius: '6px',
                        backgroundColor: '#fafafa'
                      }}>
                        <Text strong style={{ color: 'var(--color-primary)' }}>
                          Scenario {index + 1}
                        </Text>
                        <div style={{ marginTop: '4px' }}>
                          <Text>{scenario.customerProblem || scenario.problem || scenario}</Text>
                        </div>
                        {scenario.businessValue && (
                          <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            Priority: {scenario.businessValue.priority} | 
                            Search Volume: {scenario.businessValue.searchVolume} |
                            Conversion Potential: {scenario.businessValue.conversionPotential}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Decision Makers */}
              {selectedLead.decisionMakers && selectedLead.decisionMakers.length > 0 && (() => {
                // Filter out invalid decision makers (single words or obvious non-person entries)
                const validDecisionMakers = selectedLead.decisionMakers.filter(contact => {
                  const title = contact.title || contact.name || '';
                  const titleLower = title.toLowerCase();
                  
                  // Filter out obvious invalid entries
                  const invalidTerms = ['energy', 'ai sectors', 'technology', 'sector', 'industry', 'market'];
                  const isInvalid = invalidTerms.some(term => titleLower === term || titleLower.includes(` ${term}`) || titleLower.includes(`${term} `));
                  
                  // Must be more than just 1-2 words and look like a job title
                  const wordCount = title.split(' ').length;
                  const looksLikeJobTitle = title.includes('founder') || title.includes('ceo') || title.includes('entrepreneur') || wordCount >= 3;
                  
                  return !isInvalid && looksLikeJobTitle;
                });
                
                return validDecisionMakers.length > 0 ? (
                  <Card size="small" title="Decision Makers & Contacts" style={{ marginTop: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                      {validDecisionMakers.map((contact, index) => (
                      <div key={index} style={{ 
                        padding: '12px', 
                        border: '1px solid #e8e8e8', 
                        borderRadius: '6px',
                        backgroundColor: '#f9f9f9'
                      }}>
                        <div style={{ marginBottom: '4px' }}>
                          <Tag color="blue">{contact.role_type || 'Contact'}</Tag>
                        </div>
                        <Text strong>{contact.name || contact.title}</Text>
                        {contact.title && contact.name && (
                          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            {contact.title}
                          </div>
                        )}
                        </div>
                      ))}
                    </div>
                  </Card>
                ) : null;
              })()}

              {/* Business Strategy Insights */}
              <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                {selectedLead.blogStrategy && (
                  <Col span={12}>
                    <Card size="small" title="Blog Strategy">
                      <Text style={{ fontSize: '13px' }}>
                        {selectedLead.blogStrategy}
                      </Text>
                    </Card>
                  </Col>
                )}
                
                {selectedLead.searchBehavior && (
                  <Col span={12}>
                    <Card size="small" title="Search Behavior Insights">
                      <Text style={{ fontSize: '13px' }}>
                        {selectedLead.searchBehavior}
                      </Text>
                    </Card>
                  </Col>
                )}
              </Row>
              
              {selectedLead.connectionMessage && (
                <Card size="small" title="Connection Strategy" style={{ marginTop: '16px' }}>
                  <Text style={{ fontSize: '13px' }}>
                    {selectedLead.connectionMessage}
                  </Text>
                </Card>
              )}
            </div>

            {/* User Context Information */}
            <div style={{ marginTop: '24px' }}>
              <Title level={5}>Lead Context</Title>
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="IP Address">
                  {selectedLead.ipAddress || 'Unknown'}
                </Descriptions.Item>
                <Descriptions.Item label="Referrer">
                  {selectedLead.referrerUrl ? (
                    selectedLead.referrerUrl.includes('automatemyblog.com') ? (
                      selectedLead.referrerUrl.includes('?ref=') || selectedLead.referrerUrl.includes('&ref=') ? (
                        <Tooltip title={selectedLead.referrerUrl}>
                          <Text style={{ fontSize: '12px' }}>
                            Referral: {selectedLead.referrerUrl.length > 25 ? 
                              selectedLead.referrerUrl.substring(0, 25) + '...' : 
                              selectedLead.referrerUrl
                            }
                          </Text>
                        </Tooltip>
                      ) : 'Direct (from own site)'
                    ) : (
                      <Tooltip title={selectedLead.referrerUrl}>
                        <Text style={{ fontSize: '12px' }}>
                          {selectedLead.referrerUrl.length > 30 ? 
                            selectedLead.referrerUrl.substring(0, 30) + '...' : 
                            selectedLead.referrerUrl
                          }
                        </Text>
                      </Tooltip>
                    )
                  ) : 'Direct visit'}
                </Descriptions.Item>
                <Descriptions.Item label="User Agent" span={2}>
                  <Tooltip title={selectedLead.userAgent}>
                    <Text style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                      {selectedLead.userAgent && selectedLead.userAgent.length > 60 ? 
                        selectedLead.userAgent.substring(0, 60) + '...' : 
                        selectedLead.userAgent || 'Unknown'
                      }
                    </Text>
                  </Tooltip>
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Conversion Timeline */}
            {selectedLead.conversionSteps && selectedLead.conversionSteps.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <Title level={5}>Activity Timeline</Title>
                <Timeline>
                  {selectedLead.conversionSteps.map((step, index) => (
                    <Timeline.Item 
                      key={index}
                      color={step.step === 'website_analysis' ? 'blue' : step.step === 'registration' ? 'green' : 'gray'}
                    >
                      <div>
                        <Text strong>{step.step.replace('_', ' ').toUpperCase()}</Text>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                          {new Date(step.completedAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: '2-digit' 
                          })} at {new Date(step.completedAt).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        {step.data && (
                          <div style={{ marginTop: '4px' }}>
                            {step.step === 'website_analysis' && typeof step.data === 'object' && step.data.lead_score ? (
                              <div style={{ fontSize: '12px' }}>
                                <Text>Lead Score: {step.data.lead_score} | </Text>
                                <Text>Website: {step.data.website_url || selectedLead.websiteUrl}</Text>
                                {step.data.session_info?.referrer && (
                                  <div>Source: {step.data.session_info.referrer.includes('automatemyblog.com') ? 'Direct' : 'External'}</div>
                                )}
                              </div>
                            ) : (
                              <Text style={{ fontSize: '12px' }}>
                                {typeof step.data === 'string' ? step.data : 'Activity completed'}
                              </Text>
                            )}
                          </div>
                        )}
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Status Update Modal */}
      <Modal
        title="Update Lead Status"
        open={!!editingStatus}
        onCancel={() => {
          setEditingStatus(null);
          statusForm.resetFields();
        }}
        onOk={() => statusForm.submit()}
        confirmLoading={loading}
      >
        <Form
          form={statusForm}
          layout="vertical"
          onFinish={handleStatusUpdate}
        >
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select a status' }]}
          >
            <Radio.Group>
              <Radio value="new">New</Radio>
              <Radio value="qualified">Qualified</Radio>
              <Radio value="nurturing">Nurturing</Radio>
              <Radio value="lost">Lost</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea 
              placeholder="Add notes about this status change..."
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminLeadsTab;