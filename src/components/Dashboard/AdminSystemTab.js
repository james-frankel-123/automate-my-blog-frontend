// ADMIN ONLY - Super User Component for System Health Monitoring
// This component is only accessible to admin users and provides system oversight functionality
import React, { useState, useEffect } from 'react';
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
  Button,
  Badge,
  List,
  Switch
} from 'antd';
import { 
  DatabaseOutlined,
  BugOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  ApiOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { format, subHours } from 'date-fns';

const { Title, Text } = Typography;

// ADMIN COMPONENT - Only for super users
const AdminSystemTab = () => {
  const [systemHealth, setSystemHealth] = useState(null);
  const [, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSystemHealth();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSystemHealth, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run on mount, loadSystemHealth is stable
  }, []);

  const loadSystemHealth = async () => {
    setLoading(true);
    try {
      // Simulate checking actual system health
      // In real implementation, this would call backend monitoring APIs
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSystemHealth(getMockSystemHealth());
    } catch (error) {
      console.error('Error loading system health:', error);
      setSystemHealth(getMockSystemHealth());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSystemHealth();
  };

  // DUMMY DATA - Mock system health data
  const getMockSystemHealth = () => ({
    status: 'healthy',
    uptime: 99.8,
    lastUpdated: new Date().toISOString(),
    
    // Server metrics
    server: {
      cpu: 23.5,
      memory: 67.2,
      disk: 34.8,
      responseTime: 245,
      requestCount: 12450
    },
    
    // Database metrics
    database: {
      connectionPool: 85,
      queryTime: 125,
      activeConnections: 12,
      slowQueries: 3
    },
    
    // API metrics
    api: {
      totalRequests: 25680,
      successRate: 99.2,
      errorRate: 0.8,
      avgResponseTime: 180
    },
    
    // Recent errors
    errors: [
      {
        id: 'err_1',
        message: 'Rate limit exceeded for user_123',
        level: 'warning',
        timestamp: subHours(new Date(), 2).toISOString(),
        count: 5
      },
      {
        id: 'err_2',
        message: 'Database connection timeout',
        level: 'error',
        timestamp: subHours(new Date(), 6).toISOString(),
        count: 1
      }
    ],
    
    // Background jobs
    jobs: [
      {
        name: 'Content Discovery',
        status: 'running',
        lastRun: subHours(new Date(), 1).toISOString(),
        successRate: 96.5
      },
      {
        name: 'User Analytics',
        status: 'completed',
        lastRun: subHours(new Date(), 3).toISOString(),
        successRate: 100
      },
      {
        name: 'Backup Process',
        status: 'scheduled',
        lastRun: subHours(new Date(), 24).toISOString(),
        successRate: 98.2
      }
    ],
    
    isDummy: true
  });

  const getHealthColor = (value, threshold = 80) => {
    if (value >= threshold) return '#52c41a';
    if (value >= threshold * 0.7) return '#faad14';
    return '#f5222d';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': case 'running': case 'completed': return 'green';
      case 'warning': case 'scheduled': return 'orange';
      case 'error': case 'failed': return 'red';
      default: return 'default';
    }
  };

  const errorColumns = [
    {
      title: 'Error Message',
      dataIndex: 'message',
      key: 'message',
      render: (message, record) => (
        <div>
          <Text strong>{message}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {format(new Date(record.timestamp), 'MMM dd, HH:mm')}
          </Text>
        </div>
      )
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      render: (level) => (
        <Tag color={level === 'error' ? 'red' : 'orange'}>
          {level.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
      render: (count) => <Badge count={count} style={{ backgroundColor: '#f5222d' }} />
    }
  ];

  if (!systemHealth) {
    return <div>Loading system health...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* ADMIN HEADER */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ color: 'red', margin: 0 }}>
              🔴 ADMIN: System Health
            </Title>
            <Text type="secondary">
              Super user only - Monitor platform infrastructure and performance
            </Text>
          </div>
          <Space>
            <Text type="secondary">
              Last updated: {format(new Date(systemHealth.lastUpdated), 'HH:mm:ss')}
            </Text>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              loading={refreshing}
            >
              Refresh
            </Button>
          </Space>
        </div>
      </div>

      {/* DATABASE REQUIREMENTS ALERT */}
      <Alert
        message="Database Requirements for System Monitoring"
        description={
          <div>
            <strong>Missing Tables for Real-time Monitoring:</strong>
            <br />• system_metrics table (server performance, resource usage)
            <br />• error_logs table (application errors, stack traces)
            <br />• api_monitoring table (endpoint performance, response times)
            <br />• background_jobs table (scheduled tasks, job status)
            <br />• health_checks table (service availability monitoring)
          </div>
        }
        type="warning"
        showIcon
        style={{ marginBottom: '20px' }}
      />

      {/* SYSTEM STATUS OVERVIEW */}
      <Card 
        title={
          <Space>
            <DatabaseOutlined style={{ color: systemHealth.status === 'healthy' ? '#52c41a' : '#f5222d' }} />
            Overall System Status
            <Tag color={getStatusColor(systemHealth.status)}>
              {systemHealth.status.toUpperCase()}
            </Tag>
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Uptime"
              value={systemHealth.uptime}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ border: '2px solid red', padding: '8px', borderRadius: '4px' }}>
              <Statistic
                title="Response Time"
                value={systemHealth.server.responseTime}
                suffix="ms"
                prefix={<ClockCircleOutlined />}
              />
              <Text style={{ fontSize: '10px', color: 'red' }}>
                Needs api_monitoring table
              </Text>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ border: '2px solid red', padding: '8px', borderRadius: '4px' }}>
              <Statistic
                title="Active Users"
                value="47"
                prefix={<ApiOutlined />}
              />
              <Text style={{ fontSize: '10px', color: 'red' }}>
                Needs user_sessions table
              </Text>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ border: '2px solid red', padding: '8px', borderRadius: '4px' }}>
              <Statistic
                title="API Requests/hr"
                value="1,240"
                prefix={<ThunderboltOutlined />}
              />
              <Text style={{ fontSize: '10px', color: 'red' }}>
                Needs request_logs table
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* SERVER METRICS */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={12}>
          <Card 
            title={
              <Space>
                <DatabaseOutlined style={{ color: 'var(--color-primary)' }} />
                Server Performance
              </Space>
            }
            extra={<Tag color="red">Requires system_metrics table</Tag>}
          >
            <div style={{ border: '2px solid red', padding: '16px', borderRadius: '4px' }}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>CPU Usage</Text>
                    <Text strong>{systemHealth.server.cpu}%</Text>
                  </div>
                  <Progress 
                    percent={systemHealth.server.cpu} 
                    strokeColor={getHealthColor(100 - systemHealth.server.cpu, 70)}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Memory Usage</Text>
                    <Text strong>{systemHealth.server.memory}%</Text>
                  </div>
                  <Progress 
                    percent={systemHealth.server.memory} 
                    strokeColor={getHealthColor(100 - systemHealth.server.memory, 70)}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Disk Usage</Text>
                    <Text strong>{systemHealth.server.disk}%</Text>
                  </div>
                  <Progress 
                    percent={systemHealth.server.disk} 
                    strokeColor={getHealthColor(100 - systemHealth.server.disk, 80)}
                  />
                </div>
              </Space>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card 
            title={
              <Space>
                <DatabaseOutlined style={{ color: '#52c41a' }} />
                Database Health
              </Space>
            }
            extra={<Tag color="red">Requires db_monitoring table</Tag>}
          >
            <div style={{ border: '2px solid red', padding: '16px', borderRadius: '4px' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Connection Pool"
                    value={systemHealth.database.connectionPool}
                    suffix="%"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Query Time"
                    value={systemHealth.database.queryTime}
                    suffix="ms"
                  />
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: '16px' }}>
                <Col span={12}>
                  <Statistic
                    title="Active Connections"
                    value={systemHealth.database.activeConnections}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Slow Queries"
                    value={systemHealth.database.slowQueries}
                    valueStyle={{ color: systemHealth.database.slowQueries > 5 ? '#f5222d' : '#52c41a' }}
                  />
                </Col>
              </Row>
            </div>
          </Card>
        </Col>
      </Row>

      {/* BACKGROUND JOBS */}
      <Card 
        title={
          <Space>
            <SettingOutlined style={{ color: '#722ed1' }} />
            Background Jobs
          </Space>
        }
        extra={<Tag color="red">Requires job_queue table</Tag>}
        style={{ marginBottom: '24px' }}
      >
        <div style={{ border: '2px solid red', padding: '16px', borderRadius: '4px' }}>
          <List
            dataSource={systemHealth.jobs}
            renderItem={(job) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{job.name}</Text>
                      <Tag color={getStatusColor(job.status)}>
                        {job.status.toUpperCase()}
                      </Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <Text>Last run: {format(new Date(job.lastRun), 'MMM dd, HH:mm')}</Text>
                      <br />
                      <Text>Success rate: </Text>
                      <Progress 
                        percent={job.successRate} 
                        size="small" 
                        style={{ width: '100px', display: 'inline-block', marginLeft: '8px' }}
                      />
                    </div>
                  }
                />
                <Switch 
                  checked={job.status !== 'failed'} 
                  checkedChildren="Enabled"
                  unCheckedChildren="Disabled"
                />
              </List.Item>
            )}
          />
          <Alert
            message="Background job monitoring requires job queue infrastructure"
            type="error"
            style={{ marginTop: '12px' }}
          />
        </div>
      </Card>

      {/* ERROR LOGS */}
      <Card 
        title={
          <Space>
            <BugOutlined style={{ color: '#f5222d' }} />
            Recent Errors
            <Badge count={systemHealth.errors.length} style={{ backgroundColor: '#f5222d' }} />
          </Space>
        }
        extra={<Tag color="red">Requires error_logs table</Tag>}
      >
        <div style={{ border: '2px solid red', padding: '16px', borderRadius: '4px' }}>
          <Table
            columns={errorColumns}
            dataSource={systemHealth.errors}
            pagination={false}
            size="small"
          />
          <Alert
            message="Error tracking requires centralized logging system"
            description="To track real application errors, we need: error_logs table, log aggregation, stack trace storage"
            type="error"
            style={{ marginTop: '12px' }}
          />
        </div>
      </Card>

      {/* API HEALTH SUMMARY */}
      <Card 
        title={
          <Space>
            <ApiOutlined style={{ color: 'var(--color-primary)' }} />
            API Health Summary
          </Space>
        }
        style={{ marginTop: '24px' }}
      >
        <div style={{ border: '2px solid red', padding: '16px', borderRadius: '4px' }}>
          <Row gutter={16}>
            <Col xs={24} sm={6}>
              <Statistic
                title="Success Rate"
                value={systemHealth.api.successRate}
                suffix="%"
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="Error Rate"
                value={systemHealth.api.errorRate}
                suffix="%"
                prefix={<ExclamationCircleOutlined style={{ color: '#f5222d' }} />}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="Avg Response"
                value={systemHealth.api.avgResponseTime}
                suffix="ms"
                prefix={<ClockCircleOutlined />}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="Total Requests"
                value={systemHealth.api.totalRequests.toLocaleString()}
                prefix={<ThunderboltOutlined />}
              />
            </Col>
          </Row>
          <Alert
            message="API monitoring requires request tracking infrastructure"
            type="error"
            style={{ marginTop: '16px' }}
          />
        </div>
      </Card>

      {systemHealth.isDummy && (
        <Alert
          message="System Health Demo Mode"
          description="This dashboard shows mock system data. Real monitoring requires integration with application performance monitoring tools and database logging."
          type="info"
          style={{ marginTop: '24px' }}
        />
      )}
    </div>
  );
};

export default AdminSystemTab;