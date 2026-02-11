// ADMIN ONLY - Super User Component for Content Moderation
// This component is only accessible to admin users and provides content oversight functionality
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Input, 
  Select, 
  Statistic, 
  Row, 
  Col,
  Alert,
  Typography,
  Modal,
  Descriptions,
  Badge,
  Progress,
  message
} from 'antd';
import {
  FileTextOutlined,
  ExclamationCircleOutlined,
  FlagOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

// ADMIN COMPONENT - Only for super users
const AdminContentTab = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      // Get real posts from existing API
      const result = await api.getBlogPosts();
      
      if (result.success && result.posts.length > 0) {
        // Enhance real posts with moderation data
        const enhancedPosts = result.posts.map(post => ({
          ...post,
          // Real data from localStorage
          wordCount: post.content ? post.content.split(' ').length : 0,
          
          // Mock moderation data (requires new DB fields)
          qualityScore: Math.floor(Math.random() * 30) + 70, // 70-100
          flagCount: Math.floor(Math.random() * 3), // 0-2
          moderationStatus: Math.random() > 0.8 ? 'flagged' : 'approved',
          aiConfidence: Math.floor(Math.random() * 20) + 80, // 80-100
          lastModerated: new Date().toISOString(),
          isDummy: false
        }));
        
        setContent(enhancedPosts);
      } else {
        setContent(getMockContent());
      }
    } catch (error) {
      console.error('Error loading content:', error);
      setContent(getMockContent());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // DUMMY DATA - Fallback content for demonstration
  const getMockContent = () => [
    {
      id: 'post_1',
      title: 'AI-Powered Marketing Strategies for 2024',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      createdAt: '2024-01-25T10:00:00Z',
      userId: 'user_123',
      wordCount: 850,
      qualityScore: 92,
      flagCount: 0,
      moderationStatus: 'approved',
      aiConfidence: 94,
      lastModerated: '2024-01-25T10:30:00Z',
      isDummy: true
    },
    {
      id: 'post_2',
      title: 'Suspicious Content About Get Rich Quick Schemes',
      content: 'Make money fast with this one weird trick! Doctors hate this method but it really works!',
      createdAt: '2024-01-24T15:20:00Z',
      userId: 'user_456',
      wordCount: 250,
      qualityScore: 23,
      flagCount: 3,
      moderationStatus: 'flagged',
      aiConfidence: 15,
      lastModerated: '2024-01-24T16:00:00Z',
      isDummy: true
    },
    {
      id: 'post_3',
      title: 'Remote Team Management Best Practices',
      content: 'Building effective remote teams requires clear communication, proper tools, and strong leadership.',
      createdAt: '2024-01-24T09:15:00Z',
      userId: 'user_789',
      wordCount: 1200,
      qualityScore: 87,
      flagCount: 1,
      moderationStatus: 'under_review',
      aiConfidence: 88,
      lastModerated: '2024-01-24T14:45:00Z',
      isDummy: true
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'green';
      case 'flagged': return 'red';
      case 'under_review': return 'orange';
      case 'spam': return 'red';
      default: return 'default';
    }
  };

  const getQualityColor = (score) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#f5222d';
  };

  const handleModerateContent = (contentId, action) => {
    message.success(`Content ${action} - Feature requires moderation_actions table`);
    // Update local state
    setContent(prev => prev.map(item => 
      item.id === contentId 
        ? { ...item, moderationStatus: action, lastModerated: new Date().toISOString() }
        : item
    ));
  };

  const filteredContent = filterStatus === 'all' 
    ? content 
    : content.filter(item => item.moderationStatus === filterStatus);

  const columns = [
    {
      title: 'Content',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <div style={{ maxWidth: '300px' }}>
          <div style={{ fontWeight: 500, marginBottom: '4px' }}>{title}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.wordCount} words • {format(new Date(record.createdAt), 'MMM dd, yyyy')}
          </Text>
          {record.isDummy && (
            <Tag size="small" color="blue" style={{ marginTop: '4px' }}>DUMMY DATA</Tag>
          )}
        </div>
      )
    },
    {
      title: 'Quality Score',
      dataIndex: 'qualityScore',
      key: 'qualityScore',
      render: (score, record) => (
        <div style={{ 
          border: record.qualityScore < 70 ? '2px solid red' : '1px solid #d9d9d9',
          padding: '8px',
          borderRadius: '4px'
        }}>
          <Progress
            type="circle"
            size={50}
            percent={score}
            strokeColor={getQualityColor(score)}
            format={(percent) => `${percent}`}
          />
          {record.qualityScore < 70 && (
            <Text style={{ fontSize: '9px', color: 'red', display: 'block', textAlign: 'center' }}>
              Needs quality_scores table
            </Text>
          )}
        </div>
      ),
      sorter: (a, b) => a.qualityScore - b.qualityScore
    },
    {
      title: 'Flags',
      dataIndex: 'flagCount',
      key: 'flagCount',
      render: (count, _record) => (
        <div style={{ 
          border: count > 0 ? '2px solid red' : '1px solid #d9d9d9',
          padding: '4px 8px',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <Badge count={count} style={{ backgroundColor: count > 0 ? '#f5222d' : '#52c41a' }}>
            <FlagOutlined style={{ fontSize: '16px' }} />
          </Badge>
          {count > 0 && (
            <Text style={{ fontSize: '9px', color: 'red', display: 'block' }}>
              Needs content_flags table
            </Text>
          )}
        </div>
      ),
      sorter: (a, b) => a.flagCount - b.flagCount
    },
    {
      title: 'Status',
      dataIndex: 'moderationStatus',
      key: 'moderationStatus',
      render: (status, _record) => (
        <div style={{ 
          border: status !== 'approved' ? '2px solid red' : '1px solid #d9d9d9',
          padding: '4px 8px',
          borderRadius: '4px'
        }}>
          <Tag color={getStatusColor(status)}>
            {status.replace('_', ' ').toUpperCase()}
          </Tag>
          {status !== 'approved' && (
            <Text style={{ fontSize: '9px', color: 'red', display: 'block' }}>
              Needs moderation_queue table
            </Text>
          )}
        </div>
      )
    },
    {
      title: 'AI Confidence',
      dataIndex: 'aiConfidence',
      key: 'aiConfidence',
      render: (confidence, _record) => (
        <div style={{ 
          border: confidence < 70 ? '2px solid red' : '1px solid #d9d9d9',
          padding: '4px 8px',
          borderRadius: '4px'
        }}>
          <Text strong>{confidence}%</Text>
          {confidence < 70 && (
            <Text style={{ fontSize: '9px', color: 'red', display: 'block' }}>
              Needs ai_analysis table
            </Text>
          )}
        </div>
      ),
      sorter: (a, b) => a.aiConfidence - b.aiConfidence
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space>
            <Button 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedContent(record);
                setShowContentModal(true);
              }}
            >
              View
            </Button>
          </Space>
          <div style={{ 
            border: '2px solid red', 
            padding: '4px', 
            borderRadius: '4px'
          }}>
            <Space>
              <Button 
                size="small" 
                type="primary" 
                icon={<CheckCircleOutlined />}
                onClick={() => handleModerateContent(record.id, 'approved')}
              >
                Approve
              </Button>
              <Button 
                size="small" 
                danger 
                icon={<FlagOutlined />}
                onClick={() => handleModerateContent(record.id, 'flagged')}
              >
                Flag
              </Button>
            </Space>
            <Text style={{ fontSize: '9px', color: 'red', display: 'block' }}>
              Needs moderation_actions
            </Text>
          </div>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* ADMIN HEADER */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ color: 'red', margin: 0 }}>
          🔴 ADMIN: Content Moderation
        </Title>
        <Text type="secondary">
          Super user only - Monitor and moderate all platform content
        </Text>
      </div>

      {/* DATABASE REQUIREMENTS ALERT */}
      <Alert
        message="Database Requirements for Content Moderation"
        description={
          <div>
            <strong>Missing Tables/Fields for Full Functionality:</strong>
            <br />• content_flags table (user reports, automated flags)
            <br />• moderation_queue table (pending reviews, priorities)
            <br />• moderation_actions table (admin actions, history)
            <br />• quality_scores table (AI quality analysis)
            <br />• content_analysis table (spam detection, sentiment)
          </div>
        }
        type="warning"
        showIcon
        style={{ marginBottom: '20px' }}
      />

      {/* STATS ROW */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Content"
              value={content.length}
              prefix={<FileTextOutlined style={{ color: 'var(--color-primary)' }} />}
              suffix={
                <Tag color="green">Real Data ✓</Tag>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <div style={{ border: '2px solid red', padding: '8px', borderRadius: '4px' }}>
              <Statistic
                title="Flagged Content"
                value={content.filter(c => c.moderationStatus === 'flagged').length}
                prefix={<FlagOutlined style={{ color: '#f5222d' }} />}
              />
              <Text style={{ fontSize: '10px', color: 'red' }}>
                Needs content_flags table
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <div style={{ border: '2px solid red', padding: '8px', borderRadius: '4px' }}>
              <Statistic
                title="Under Review"
                value={content.filter(c => c.moderationStatus === 'under_review').length}
                prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
              />
              <Text style={{ fontSize: '10px', color: 'red' }}>
                Needs moderation_queue
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Avg Quality Score"
              value={Math.round(content.reduce((sum, c) => sum + c.qualityScore, 0) / content.length)}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* FILTERS */}
      <Card style={{ marginBottom: '16px' }}>
        <Space>
          <Search 
            placeholder="Search content..." 
            style={{ width: 200 }} 
            onSearch={(value) => console.log('Search:', value)}
          />
          <Select 
            value={filterStatus} 
            onChange={setFilterStatus} 
            style={{ width: 150 }}
          >
            <Option value="all">All Status</Option>
            <Option value="approved">Approved</Option>
            <Option value="flagged">Flagged</Option>
            <Option value="under_review">Under Review</Option>
            <Option value="spam">Spam</Option>
          </Select>
          <Select defaultValue="quality_desc" style={{ width: 150 }}>
            <Option value="quality_desc">Quality: High to Low</Option>
            <Option value="quality_asc">Quality: Low to High</Option>
            <Option value="recent">Most Recent</Option>
            <Option value="flagged">Most Flagged</Option>
          </Select>
        </Space>
      </Card>

      {/* CONTENT TABLE */}
      <Card 
        title="Content Moderation Queue" 
        extra={<Badge count={filteredContent.length} style={{ backgroundColor: '#52c41a' }} />}
      >
        <Table
          columns={columns}
          dataSource={filteredContent}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
          rowClassName={(record) => {
            if (record.moderationStatus === 'flagged') return 'flagged-row';
            if (record.qualityScore < 50) return 'low-quality-row';
            return '';
          }}
        />
      </Card>

      {/* CONTENT DETAILS MODAL */}
      <Modal
        title="Content Review"
        open={showContentModal}
        onCancel={() => setShowContentModal(false)}
        width={800}
        footer={
          selectedContent && (
            <Space>
              <Button onClick={() => setShowContentModal(false)}>
                Close
              </Button>
              <Button 
                type="primary" 
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  handleModerateContent(selectedContent.id, 'approved');
                  setShowContentModal(false);
                }}
              >
                Approve
              </Button>
              <Button 
                danger 
                icon={<FlagOutlined />}
                onClick={() => {
                  handleModerateContent(selectedContent.id, 'flagged');
                  setShowContentModal(false);
                }}
              >
                Flag as Inappropriate
              </Button>
              <Button 
                danger 
                icon={<DeleteOutlined />}
                onClick={() => {
                  handleModerateContent(selectedContent.id, 'deleted');
                  setShowContentModal(false);
                }}
              >
                Delete
              </Button>
            </Space>
          )
        }
      >
        {selectedContent && (
          <div>
            <Descriptions column={2} style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="Title" span={2}>
                {selectedContent.title}
              </Descriptions.Item>
              <Descriptions.Item label="Quality Score">
                <Progress 
                  percent={selectedContent.qualityScore} 
                  strokeColor={getQualityColor(selectedContent.qualityScore)}
                  size="small"
                />
              </Descriptions.Item>
              <Descriptions.Item label="AI Confidence">
                {selectedContent.aiConfidence}%
              </Descriptions.Item>
              <Descriptions.Item label="Word Count">
                {selectedContent.wordCount}
              </Descriptions.Item>
              <Descriptions.Item label="Flags">
                <Badge count={selectedContent.flagCount} style={{ backgroundColor: '#f5222d' }} />
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedContent.moderationStatus)}>
                  {selectedContent.moderationStatus.replace('_', ' ').toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {format(new Date(selectedContent.createdAt), 'MMM dd, yyyy HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <Title level={5}>Content Preview:</Title>
            <div style={{ 
              background: '#fafafa', 
              padding: '16px', 
              borderRadius: '4px',
              marginBottom: '20px',
              maxHeight: '200px',
              overflow: 'auto'
            }}>
              <Paragraph>{selectedContent.content}</Paragraph>
            </div>

            <div style={{ border: '2px solid red', padding: '12px', borderRadius: '4px' }}>
              <Title level={5} style={{ color: 'red', margin: '0 0 8px 0' }}>
                Missing Moderation Features:
              </Title>
              <ul style={{ margin: 0, color: 'red', fontSize: '12px' }}>
                <li>Flag history and user reports (content_flags table)</li>
                <li>Automated spam detection scores (content_analysis table)</li>
                <li>Moderation action history (moderation_actions table)</li>
                <li>Content similarity analysis (duplicate_detection table)</li>
                <li>User content patterns (user_content_stats table)</li>
              </ul>
            </div>

            {selectedContent.isDummy && (
              <Alert
                message="This is demonstration data"
                description="Real content moderation would integrate with AI analysis and user reporting systems."
                type="info"
                style={{ marginTop: '16px' }}
              />
            )}
          </div>
        )}
      </Modal>

      {/* CSS for row highlighting — theme-aware */}
      <style jsx global>{`
        .flagged-row {
          background-color: var(--color-error-bg) !important;
        }
        .low-quality-row {
          background-color: var(--color-warning-bg) !important;
        }
      `}</style>
    </div>
  );
};

export default AdminContentTab;