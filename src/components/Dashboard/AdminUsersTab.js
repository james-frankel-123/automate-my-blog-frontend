import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Card,
  Tag,
  Modal,
  message,
  Tooltip,
  Avatar,
  Typography,
  Row,
  Col,
  Pagination,
  Spin,
  Alert
} from 'antd';
import {
  UserOutlined,
  SearchOutlined,
  EyeOutlined,
  UserSwitchOutlined,
  CrownOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import autoBlogAPI from '../../services/api';

const { Text, Title } = Typography;
const { Option } = Select;

const AdminUsersTab = () => {
  const { user, hasPermission, startImpersonation } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'active',
    sortBy: 'created_at',
    order: 'DESC'
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [impersonating, setImpersonating] = useState(false);

  // Load users on component mount and when filters/pagination change
  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadUsers uses pagination/filters from closure
  }, [pagination.current, pagination.pageSize, filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await autoBlogAPI.getAdminUsers({
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
        search: filters.search,
        role: filters.role,
        status: filters.status,
        sortBy: filters.sortBy,
        order: filters.order
      });

      if (response.success) {
        setUsers(response.data.users);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total
        }));
      } else {
        message.error('Failed to load users');
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      message.error(`Failed to load users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handlePaginationChange = (page, pageSize) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize: pageSize
    }));
  };

  const handleViewUser = async (userId) => {
    setLoading(true);
    try {
      const response = await autoBlogAPI.getAdminUserDetails(userId);
      if (response.success) {
        setSelectedUser(response.user);
        setUserModalVisible(true);
      } else {
        message.error('Failed to load user details');
      }
    } catch (error) {
      console.error('Failed to load user details:', error);
      message.error(`Failed to load user details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (targetUser) => {
    setImpersonating(true);
    try {
      const response = await autoBlogAPI.startImpersonation(targetUser.id);
      if (response.success) {
        // Use the auth context impersonation function
        await startImpersonation(response.impersonationToken, response.targetUser);
        message.success(`Now impersonating ${targetUser.firstName} ${targetUser.lastName}`);
      } else {
        message.error('Failed to start impersonation');
      }
    } catch (error) {
      console.error('Impersonation failed:', error);
      message.error(`Impersonation failed: ${error.message}`);
    } finally {
      setImpersonating(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin':
        return 'red';
      case 'admin':
        return 'orange';
      case 'user':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin':
        return <CrownOutlined />;
      case 'admin':
        return <TeamOutlined />;
      case 'user':
        return <UserOutlined />;
      default:
        return <UserOutlined />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar 
            size="small" 
            icon={<UserOutlined />}
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {record.firstName?.[0]}{record.lastName?.[0]}
          </Avatar>
          <div>
            <Text strong>{record.firstName} {record.lastName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={getRoleColor(role)} icon={getRoleIcon(role)}>
          {role?.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Super Admin', value: 'super_admin' },
        { text: 'Admin', value: 'admin' },
        { text: 'User', value: 'user' },
      ],
    },
    {
      title: 'Organization',
      dataIndex: 'organizationName',
      key: 'organizationName',
      render: (orgName) => (
        <Text>{orgName || <Text type="secondary">No Organization</Text>}</Text>
      ),
    },
    {
      title: 'Plan',
      dataIndex: 'planTier',
      key: 'planTier',
      render: (plan) => (
        <Tag color={plan === 'free' ? 'default' : 'green'}>
          {plan?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (date) => (
        <Text style={{ fontSize: '12px' }}>
          {formatDate(date)}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewUser(record.id)}
            />
          </Tooltip>
          {hasPermission('impersonate_users') && record.id !== user?.id && (
            <Tooltip title="Impersonate User">
              <Button 
                type="text" 
                icon={<UserSwitchOutlined />} 
                onClick={() => handleImpersonate(record)}
                loading={impersonating}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  if (!hasPermission('view_all_users') && !hasPermission('manage_users')) {
    return (
      <Alert
        message="Access Denied"
        description="You don't have permission to view user management."
        type="error"
        showIcon
      />
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Title level={2}>User Management</Title>
        </Col>
      </Row>

      {/* Filters and Search */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search by name or email..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder="Role"
              value={filters.role}
              onChange={(value) => handleFilterChange('role', value)}
              style={{ width: '100%' }}
            >
              <Option value="all">All Roles</Option>
              <Option value="super_admin">Super Admin</Option>
              <Option value="admin">Admin</Option>
              <Option value="user">User</Option>
            </Select>
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder="Status"
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              style={{ width: '100%' }}
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="suspended">Suspended</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Sort By"
              value={filters.sortBy}
              onChange={(value) => handleFilterChange('sortBy', value)}
              style={{ width: '100%' }}
            >
              <Option value="created_at">Created Date</Option>
              <Option value="last_login_at">Last Login</Option>
              <Option value="email">Email</Option>
              <Option value="first_name">First Name</Option>
              <Option value="role">Role</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Order"
              value={filters.order}
              onChange={(value) => handleFilterChange('order', value)}
              style={{ width: '100%' }}
            >
              <Option value="DESC">Newest First</Option>
              <Option value="ASC">Oldest First</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Users Table */}
      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            pagination={false}
            scroll={{ x: 800 }}
          />
          
          <div style={{ marginTop: '16px', textAlign: 'right' }}>
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              showSizeChanger
              showQuickJumper
              showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} users`}
              onChange={handlePaginationChange}
              onShowSizeChange={handlePaginationChange}
            />
          </div>
        </Spin>
      </Card>

      {/* User Details Modal */}
      <Modal
        title="User Details"
        visible={userModalVisible}
        onCancel={() => setUserModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setUserModalVisible(false)}>
            Close
          </Button>,
          selectedUser && hasPermission('impersonate_users') && selectedUser.canImpersonate && (
            <Button 
              key="impersonate" 
              type="primary" 
              icon={<UserSwitchOutlined />}
              onClick={() => handleImpersonate(selectedUser)}
              loading={impersonating}
            >
              Impersonate
            </Button>
          )
        ]}
        width={600}
      >
        {selectedUser && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card size="small">
                  <Row gutter={[16, 16]}>
                    <Col span={4}>
                      <Avatar 
                        size={64} 
                        icon={<UserOutlined />}
                        style={{ backgroundColor: 'var(--color-primary)' }}
                      >
                        {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                      </Avatar>
                    </Col>
                    <Col span={20}>
                      <Title level={4} style={{ margin: 0 }}>
                        {selectedUser.firstName} {selectedUser.lastName}
                      </Title>
                      <Text type="secondary">{selectedUser.email}</Text>
                      <br />
                      <Tag color={getRoleColor(selectedUser.role)} icon={getRoleIcon(selectedUser.role)}>
                        {selectedUser.role?.replace('_', ' ').toUpperCase()}
                      </Tag>
                      <Tag color={selectedUser.status === 'active' ? 'green' : 'red'}>
                        {selectedUser.status?.toUpperCase()}
                      </Tag>
                    </Col>
                  </Row>
                </Card>
              </Col>
              
              <Col span={12}>
                <Card title="Account Info" size="small">
                  <div style={{ lineHeight: '24px' }}>
                    <div><strong>Plan:</strong> {selectedUser.planTier}</div>
                    <div><strong>Usage:</strong> {selectedUser.currentUsage}/{selectedUser.usageLimit}</div>
                    <div><strong>Billing:</strong> {selectedUser.billingStatus}</div>
                    <div><strong>Referral:</strong> {selectedUser.referralCode}</div>
                  </div>
                </Card>
              </Col>
              
              <Col span={12}>
                <Card title="Organization" size="small">
                  <div style={{ lineHeight: '24px' }}>
                    <div><strong>Name:</strong> {selectedUser.organizationName || 'None'}</div>
                    <div><strong>Role:</strong> {selectedUser.organizationRole || 'None'}</div>
                  </div>
                </Card>
              </Col>
              
              <Col span={24}>
                <Card title="Activity" size="small">
                  <div style={{ lineHeight: '24px' }}>
                    <div><strong>Created:</strong> {formatDate(selectedUser.createdAt)}</div>
                    <div><strong>Last Login:</strong> {formatDate(selectedUser.lastLoginAt)}</div>
                    <div><strong>Hierarchy Level:</strong> {selectedUser.hierarchyLevel}</div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsersTab;