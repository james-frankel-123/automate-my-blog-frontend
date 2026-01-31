// ADMIN ONLY - Super User Component for Analytics Overview
// This component is only accessible to admin users and provides platform-wide analytics
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Statistic, 
  Row, 
  Col,
  Alert,
  Typography,
  Progress,
  Table,
  Tag,
  Space,
  Select,
  DatePicker,
  Button
} from 'antd';
import { 
  BarChartOutlined,
  UserOutlined,
  FileTextOutlined,
  DollarOutlined,
  RiseOutlined,
  DownloadOutlined,
  ClockCircleOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// ADMIN COMPONENT - Only for super users
const AdminAnalyticsTab = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      // Get real usage statistics from existing API
      const usageResult = await api.getUsageStatistics();
      const postsResult = await api.getBlogPosts();
      const activityResult = await api.getRecentActivities(100);

      if (usageResult.success && postsResult.success && activityResult.success) {
        const realAnalytics = {
          // Real data from localStorage
          totalPosts: postsResult.posts.length,
          totalExports: postsResult.posts.reduce((sum, p) => sum + (p.exportCount || 0), 0),
          totalUsers: new Set(postsResult.posts.map(p => p.userId)).size,
          recentActivity: activityResult.activities.length,

          // Mock data for features requiring new DB tables
          revenue: getMockRevenue(),
          performanceMetrics: getMockPerformance(),
          userGrowth: getMockUserGrowth(),
          contentTrends: getMockContentTrends()
        };
        setAnalytics(realAnalytics);
      } else {
        setAnalytics(getMockAnalytics());
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalytics(getMockAnalytics());
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // DUMMY DATA - Mock analytics for missing backend features
  const getMockAnalytics = () => ({
    totalPosts: 156,
    totalExports: 423,
    totalUsers: 23,
    recentActivity: 45,
    revenue: getMockRevenue(),
    performanceMetrics: getMockPerformance(), 
    userGrowth: getMockUserGrowth(),
    contentTrends: getMockContentTrends(),
    isDummy: true
  });

  const getMockRevenue = () => ({
    monthly: 1250,
    growth: 23.5,
    subscriptions: 18,
    churnRate: 5.2,
    isDummy: true
  });

  const getMockPerformance = () => ({
    avgResponseTime: 245,
    uptime: 99.8,
    errorRate: 0.12,
    apiCalls: 12450,
    isDummy: true
  });

  const getMockUserGrowth = () => [
    { date: '2024-01-20', users: 15, posts: 45 },
    { date: '2024-01-21', users: 16, posts: 52 },
    { date: '2024-01-22', users: 18, posts: 61 },
    { date: '2024-01-23', users: 19, posts: 67 },
    { date: '2024-01-24', users: 21, posts: 78 },
    { date: '2024-01-25', users: 22, posts: 89 },
    { date: '2024-01-26', users: 23, posts: 95 }
  ];

  const getMockContentTrends = () => [
    { topic: 'AI Productivity', posts: 23, engagement: 87 },
    { topic: 'Remote Work', posts: 19, engagement: 92 },
    { topic: 'Marketing Strategy', posts: 15, engagement: 78 },
    { topic: 'Business Growth', posts: 12, engagement: 85 },
    { topic: 'Team Management', posts: 8, engagement: 91 }
  ];

  const contentColumns = [
    {
      title: 'Topic',
      dataIndex: 'topic',
      key: 'topic'
    },
    {
      title: 'Posts Generated',
      dataIndex: 'posts',
      key: 'posts',
      sorter: (a, b) => a.posts - b.posts
    },
    {
      title: 'Avg Engagement',
      dataIndex: 'engagement', 
      key: 'engagement',
      render: (engagement) => (
        <div style={{ border: '2px solid red', padding: '4px', borderRadius: '4px', display: 'inline-block' }}>
          <Progress 
            percent={engagement} 
            size="small" 
            format={(percent) => `${percent}%`}
          />
          <Text style={{ fontSize: '9px', color: 'red', display: 'block' }}>
            Needs engagement_metrics table
          </Text>
        </div>
      )
    }
  ];

  if (loading || !analytics) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* ADMIN HEADER */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ color: 'red', margin: 0 }}>
          🔴 ADMIN: Platform Analytics
        </Title>
        <Text type="secondary">
          Super user only - Monitor platform-wide usage and performance
        </Text>
      </div>

      {/* DATABASE REQUIREMENTS ALERT */}
      <Alert
        message="Database Requirements for Full Analytics"
        description={
          <div>
            <strong>Missing Tables for Real-time Analytics:</strong>
            <br />• analytics_events table (user interactions, page views)
            <br />• revenue_metrics table (daily/monthly revenue tracking)
            <br />• api_usage_logs table (endpoint performance monitoring)
            <br />• user_engagement_metrics table (content engagement tracking)
            <br />• performance_monitoring table (system health metrics)
          </div>
        }
        type="warning"
        showIcon
        style={{ marginBottom: '20px' }}
      />

      {/* CONTROLS */}
      <Card style={{ marginBottom: '16px' }}>
        <Space>
          <Select value={dateRange} onChange={setDateRange} style={{ width: 120 }}>
            <Option value="1d">Last 24h</Option>
            <Option value="7d">Last 7 days</Option>
            <Option value="30d">Last 30 days</Option>
            <Option value="90d">Last 90 days</Option>
          </Select>
          <RangePicker 
            defaultValue={[dayjs().subtract(7, 'day'), dayjs()]}
          />
          <Button type="primary" icon={<DownloadOutlined />}>
            Export Report
          </Button>
        </Space>
      </Card>

      {/* KEY METRICS ROW */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={analytics.totalUsers}
              prefix={<UserOutlined style={{ color: 'var(--color-primary)' }} />}
              suffix={
                <Tag color="green" style={{ marginLeft: '8px' }}>
                  Real Data ✓
                </Tag>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Posts Generated"
              value={analytics.totalPosts}
              prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
              suffix={
                <Tag color="green" style={{ marginLeft: '8px' }}>
                  Real Data ✓
                </Tag>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Exports"
              value={analytics.totalExports}
              prefix={<DownloadOutlined style={{ color: '#faad14' }} />}
              suffix={
                <Tag color="green" style={{ marginLeft: '8px' }}>
                  Real Data ✓
                </Tag>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ border: '2px solid red', padding: '8px', borderRadius: '4px' }}>
              <Statistic
                title="Monthly Revenue"
                value={`$${analytics.revenue.monthly}`}
                prefix={<DollarOutlined style={{ color: '#f5222d' }} />}
                suffix={
                  <Tag color="red" style={{ marginLeft: '8px' }}>
                    Mock Data
                  </Tag>
                }
              />
              <Text style={{ fontSize: '10px', color: 'red' }}>
                Needs billing_events table
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* PERFORMANCE METRICS */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={12}>
          <Card 
            title="System Performance" 
            extra={<Tag color="red">Requires monitoring_metrics table</Tag>}
          >
            <div style={{ border: '2px solid red', padding: '16px', borderRadius: '4px' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Avg Response Time"
                    value={analytics.performanceMetrics.avgResponseTime}
                    suffix="ms"
                    prefix={<ClockCircleOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Uptime"
                    value={analytics.performanceMetrics.uptime}
                    suffix="%"
                    prefix={<RiseOutlined />}
                  />
                </Col>
              </Row>
              <div style={{ marginTop: '16px' }}>
                <Text strong>Error Rate: </Text>
                <Text>{analytics.performanceMetrics.errorRate}%</Text>
                <Progress 
                  percent={analytics.performanceMetrics.errorRate * 10} 
                  strokeColor="#f5222d"
                  size="small"
                  style={{ marginTop: '4px' }}
                />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card 
            title="Revenue Metrics" 
            extra={<Tag color="red">Requires revenue_tracking table</Tag>}
          >
            <div style={{ border: '2px solid red', padding: '16px', borderRadius: '4px' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Growth Rate"
                    value={analytics.revenue.growth}
                    suffix="%"
                    prefix={<RiseOutlined style={{ color: '#52c41a' }} />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Active Subs"
                    value={analytics.revenue.subscriptions}
                    prefix={<UserOutlined />}
                  />
                </Col>
              </Row>
              <div style={{ marginTop: '16px' }}>
                <Text strong>Churn Rate: </Text>
                <Text style={{ color: '#f5222d' }}>{analytics.revenue.churnRate}%</Text>
                <Progress 
                  percent={analytics.revenue.churnRate * 2} 
                  strokeColor="#f5222d"
                  size="small"
                  style={{ marginTop: '4px' }}
                />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* CONTENT TRENDS TABLE */}
      <Card 
        title="Content Trends" 
        extra={
          <Space>
            <Tag color="red">Requires content_analytics table</Tag>
            <GlobalOutlined style={{ color: 'red' }} />
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <div style={{ border: '2px solid red', padding: '12px', borderRadius: '4px' }}>
          <Table
            columns={contentColumns}
            dataSource={analytics.contentTrends}
            pagination={false}
            size="small"
          />
          <Alert
            message="Content engagement tracking requires new database schema"
            description="To track real engagement metrics, we need: content_views, user_interactions, engagement_events tables"
            type="error"
            style={{ marginTop: '12px' }}
          />
        </div>
      </Card>

      {/* USER ACTIVITY OVERVIEW */}
      <Card 
        title="Recent Activity Overview"
        extra={
          <Tag color="green">Using localStorage activity ✓</Tag>
        }
      >
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Statistic
              title="Activities (7 days)"
              value={analytics.recentActivity}
              prefix={<BarChartOutlined style={{ color: 'var(--color-primary)' }} />}
            />
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ border: '2px solid red', padding: '8px', borderRadius: '4px' }}>
              <Statistic
                title="API Calls"
                value={analytics.performanceMetrics.apiCalls}
                prefix={<GlobalOutlined style={{ color: '#faad14' }} />}
              />
              <Text style={{ fontSize: '10px', color: 'red' }}>
                Needs api_usage_logs table
              </Text>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ border: '2px solid red', padding: '8px', borderRadius: '4px' }}>
              <Statistic
                title="Avg Session Time"
                value="12m 34s"
                prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
              />
              <Text style={{ fontSize: '10px', color: 'red' }}>
                Needs user_sessions table
              </Text>
            </div>
          </Col>
        </Row>

        {analytics.isDummy && (
          <Alert
            message="Analytics Demo Mode"
            description="This dashboard shows a mix of real data from localStorage and mock data for features requiring database integration."
            type="info"
            style={{ marginTop: '16px' }}
          />
        )}
      </Card>
    </div>
  );
};

export default AdminAnalyticsTab;