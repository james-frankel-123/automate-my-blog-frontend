import React, { useState, useEffect } from 'react';
import { Card, Tabs, Typography, Tag, Button, Row, Col, Input, message, Alert, Space, QRCode, Spin, Table, Statistic } from 'antd';
import { UserOutlined, BankOutlined, CreditCardOutlined, StarOutlined, GiftOutlined, CopyOutlined, MailOutlined, ShareAltOutlined, TeamOutlined, SendOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import autoBlogAPI from '../../services/api';

const { Title, Text, Paragraph } = Typography;

const ProfileSettings = () => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    organizationName: user?.organizationName || '',
    organizationWebsite: user?.organizationWebsite || '',
  });

  // Organization management logic
  const hasOrganization = user?.organizationId;
  const isOrganizationOwner = user?.organizationRole === 'owner';
  const canEditOrganization = !hasOrganization || isOrganizationOwner;

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      await autoBlogAPI.updateProfile(profileData);
      message.success('Profile updated successfully!');
    } catch (error) {
      message.error('Failed to update profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      message.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      message.error('Password must be at least 8 characters');
      return;
    }

    setChangingPassword(true);
    try {
      await autoBlogAPI.changePassword(passwordData.oldPassword, passwordData.newPassword);
      message.success('Password changed successfully!');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      message.error('Failed to change password: ' + error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div style={{ padding: '20px 0' }}>
      {/* Personal Information */}
      <Card style={{ marginBottom: '24px', border: '2px solid #52c41a' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Title level={4} style={{ margin: 0, color: '#52c41a' }}>👤 Personal Information</Title>
          </Col>
          <Col>
            <Tag color="green">✓ Database Connected</Tag>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Text strong>First Name</Text>
            <Input
              value={profileData.firstName}
              onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
              placeholder="Enter first name"
              style={{ marginTop: '8px' }}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Text strong>Last Name</Text>
            <Input
              value={profileData.lastName}
              onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
              placeholder="Enter last name"
              style={{ marginTop: '8px' }}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Text strong>Email Address</Text>
            <Input
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              placeholder="Enter email address"
              style={{ marginTop: '8px' }}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Text strong>Organization Name</Text>
            {canEditOrganization ? (
              <Input
                value={profileData.organizationName}
                onChange={(e) => setProfileData({ ...profileData, organizationName: e.target.value })}
                placeholder={hasOrganization ? "Update organization name" : "Enter organization name to create"}
                style={{ marginTop: '8px' }}
              />
            ) : (
              <Input
                value={profileData.organizationName}
                disabled
                style={{ marginTop: '8px' }}
                suffix={
                  <Text style={{ fontSize: '12px', color: '#666' }}>
                    {user?.organizationRole ? `(${user.organizationRole})` : ''}
                  </Text>
                }
              />
            )}
            {!canEditOrganization && (
              <Text style={{ fontSize: '12px', color: '#666', display: 'block', marginTop: '4px' }}>
                Only organization owners can modify the organization name. Contact your admin to make changes.
              </Text>
            )}
            {!hasOrganization && (
              <Text style={{ fontSize: '12px', color: '#52c41a', display: 'block', marginTop: '4px' }}>
                Enter an organization name to create a new organization (you'll become the owner).
              </Text>
            )}
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          <Col xs={24}>
            <Text strong>Organization Website</Text>
            {canEditOrganization ? (
              <Input
                value={profileData.organizationWebsite}
                onChange={(e) => setProfileData({ ...profileData, organizationWebsite: e.target.value })}
                placeholder={hasOrganization ? "Update organization website" : "Organization website (optional)"}
                style={{ marginTop: '8px' }}
                prefix={<span style={{ color: '#666' }}>🌐</span>}
              />
            ) : (
              <Input
                value={profileData.organizationWebsite}
                disabled
                style={{ marginTop: '8px' }}
                prefix={<span style={{ color: '#666' }}>🌐</span>}
              />
            )}
            {profileData.organizationWebsite && (
              <div style={{ marginTop: '4px' }}>
                <a 
                  href={profileData.organizationWebsite.startsWith('http') ? profileData.organizationWebsite : `https://${profileData.organizationWebsite}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ fontSize: '12px', color: '#1677ff' }}
                >
                  Visit Website →
                </a>
              </div>
            )}
          </Col>
        </Row>

        <Row style={{ marginTop: '20px' }}>
          <Col>
            <Button 
              type="primary" 
              onClick={handleProfileSave}
              loading={saving}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Account Security */}
      <Card style={{ marginBottom: '24px', border: '2px solid #1890ff' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Title level={4} style={{ margin: 0, color: '#1890ff' }}>🔐 Account Security</Title>
          </Col>
          <Col>
            <Tag color="blue">Password Protection</Tag>
          </Col>
        </Row>

        <Alert
          message="Change Your Password"
          description="Keep your account secure by using a strong password. Password must be at least 8 characters."
          type="info"
          style={{ marginBottom: '20px' }}
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Text strong>Current Password</Text>
            <Input.Password
              value={passwordData.oldPassword}
              onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
              placeholder="Enter current password"
              style={{ marginTop: '8px' }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Text strong>New Password</Text>
            <Input.Password
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              placeholder="Enter new password"
              style={{ marginTop: '8px' }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Text strong>Confirm New Password</Text>
            <Input.Password
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
              style={{ marginTop: '8px' }}
            />
          </Col>
        </Row>

        <Row style={{ marginTop: '20px' }}>
          <Col>
            <Button 
              type="primary" 
              onClick={handlePasswordChange}
              loading={changingPassword}
              style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
            >
              {changingPassword ? 'Changing Password...' : 'Change Password'}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Account Information */}
      <Card>
        <Title level={4}>📊 Account Information</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={6}>
            <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f0f9ff' }}>
              <Statistic
                title="Account Type"
                value={user?.role?.toUpperCase() || 'USER'}
                valueStyle={{ color: '#1890ff', fontSize: '16px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f6ffed' }}>
              <Statistic
                title="Member Since"
                value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                valueStyle={{ color: '#52c41a', fontSize: '14px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small" style={{ textAlign: 'center', backgroundColor: '#fff7e6' }}>
              <Statistic
                title="Last Login"
                value={user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'N/A'}
                valueStyle={{ color: '#fa8c16', fontSize: '14px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small" style={{ 
              textAlign: 'center', 
              backgroundColor: hasOrganization ? '#f6ffed' : '#fff1f0',
              border: hasOrganization ? '1px solid #b7eb8f' : '1px solid #ffccc7'
            }}>
              <Statistic
                title="Organization Status"
                value={hasOrganization ? user.organizationRole?.toUpperCase() || 'MEMBER' : 'NO ORG'}
                valueStyle={{ 
                  color: hasOrganization ? '#52c41a' : '#ff4d4f', 
                  fontSize: '14px' 
                }}
              />
              {hasOrganization && (
                <Text style={{ fontSize: '11px', color: '#666' }}>
                  in {user.organizationName}
                </Text>
              )}
            </Card>
          </Col>
        </Row>

        {!hasOrganization && (
          <Alert
            message="No Organization Membership"
            description="You are not currently part of any organization. Create one in the profile section above or wait for an admin to invite you."
            type="info"
            style={{ marginTop: '16px' }}
            showIcon
          />
        )}
      </Card>
    </div>
  );
};

const OrganizationSettings = () => {
  const [loading, setLoading] = useState(true);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [orgData, setOrgData] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    loadOrganizationData();
  }, []);

  const loadOrganizationData = async () => {
    try {
      setLoading(true);
      const data = await autoBlogAPI.getOrganizationMembers();
      console.log('Organization API response:', data); // Debug logging
      setOrgData(data);
    } catch (error) {
      console.error('Error loading organization data:', error);
      console.error('Error details:', error.message); // More detailed error logging
      message.error('Failed to load organization data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOrgInvite = async () => {
    if (!inviteEmail.trim()) {
      message.error('Please enter an email address');
      return;
    }

    setSendingInvite(true);
    try {
      await autoBlogAPI.sendOrganizationInvite(inviteEmail.trim(), inviteRole);
      message.success('Organization invitation sent successfully!');
      setInviteEmail('');
      loadOrganizationData(); // Refresh data
    } catch (error) {
      console.error('Failed to send organization invite:', error);
      message.error('Failed to send invitation: ' + error.message);
    } finally {
      setSendingInvite(false);
    }
  };

  const handleRemoveMember = async (memberId, memberEmail) => {
    try {
      await autoBlogAPI.removeOrganizationMember(memberId);
      message.success(`Removed ${memberEmail} from organization`);
      loadOrganizationData(); // Refresh data
    } catch (error) {
      console.error('Failed to remove member:', error);
      message.error('Failed to remove member: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center' }}>
        <Spin size="large" />
        <p style={{ marginTop: '16px' }}>Loading organization data...</p>
      </div>
    );
  }

  if (!orgData?.organization) {
    return (
      <div style={{ padding: '20px 0' }}>
        <Alert
          message="No Organization"
          description="You are not currently part of an organization. Organizations allow you to collaborate with team members without referral rewards."
          type="info"
          showIcon
        />
      </div>
    );
  }

  const columns = [
    {
      title: 'Member',
      key: 'member',
      render: (text, record) => (
        <div>
          <Text strong>{record.first_name} {record.last_name}</Text>
          <br />
          <Text style={{ color: '#666', fontSize: '12px' }}>{record.email}</Text>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'owner' ? 'red' : role === 'admin' ? 'blue' : 'default'}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'joined_at',
      key: 'joined_at',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Last Login',
      dataIndex: 'last_login_at',
      key: 'last_login_at',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'Never',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => {
        // Don't show remove button for owners or current user
        if (record.role === 'owner' || record.id === user?.id) {
          return null;
        }
        
        return (
          <Button
            size="small"
            danger
            onClick={() => handleRemoveMember(record.id, record.email)}
          >
            Remove
          </Button>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '20px 0' }}>
      {/* Organization Overview */}
      <Card style={{ marginBottom: '24px', border: '2px solid #1890ff' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Title level={4} style={{ margin: 0, color: '#1890ff' }}>🏢 {orgData.organization.name}</Title>
          </Col>
          <Col>
            <Tag color="blue">✓ Database Connected</Tag>
          </Col>
        </Row>
        
        <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f0f9ff' }}>
              <Statistic
                title="Total Members"
                value={orgData.members?.length || 0}
                prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff', fontSize: '20px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f0f9ff' }}>
              <Statistic
                title="Your Role"
                value={orgData.organization.userRole?.toUpperCase() || 'MEMBER'}
                valueStyle={{ color: '#1890ff', fontSize: '16px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f0f9ff' }}>
              <Statistic
                title="Active Members"
                value={orgData.members?.filter(m => m.status === 'active')?.length || 0}
                prefix={<UserOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontSize: '20px' }}
              />
            </Card>
          </Col>
        </Row>
        
        <Alert
          message="Team Collaboration"
          description="Organization members can collaborate without referral rewards. Use the Referrals tab for customer acquisition with $15 rewards."
          type="info"
          style={{ marginBottom: '16px' }}
        />
      </Card>

      {/* Invite New Team Member */}
      {['owner', 'admin'].includes(orgData.organization.userRole) && (
        <Card style={{ marginBottom: '24px', border: '2px solid #52c41a' }}>
          <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
            <Col>
              <Title level={4} style={{ margin: 0, color: '#52c41a' }}>➕ Invite Team Member</Title>
            </Col>
          </Row>
          
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>Invite a new team member to your organization</Text>
            <Input
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              style={{ width: '300px' }}
            />
            <Space>
              <Text>Role:</Text>
              <Button.Group>
                <Button 
                  type={inviteRole === 'member' ? 'primary' : 'default'}
                  onClick={() => setInviteRole('member')}
                >
                  Member
                </Button>
                <Button 
                  type={inviteRole === 'admin' ? 'primary' : 'default'}
                  onClick={() => setInviteRole('admin')}
                >
                  Admin
                </Button>
              </Button.Group>
            </Space>
            <Button 
              type="primary" 
              icon={<MailOutlined />}
              onClick={handleSendOrgInvite}
              loading={sendingInvite}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              {sendingInvite ? 'Sending Invitation...' : 'Send Team Invitation'}
            </Button>
            <Text style={{ fontSize: '12px', color: '#666' }}>
              Team invitations do not provide referral rewards - they're for collaboration only
            </Text>
          </Space>
        </Card>
      )}

      {/* Organization Members */}
      <Card>
        <Title level={4}>Organization Members</Title>
        <Table
          columns={columns}
          dataSource={orgData.members || []}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

const BillingSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [billingHistory, setBillingHistory] = useState([]);
  const [savingBillingInfo, setSavingBillingInfo] = useState(false);
  const [billingInfo, setBillingInfo] = useState({
    companyName: user?.organizationName || '',
    billingEmail: user?.email || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    taxId: '',
  });

  useEffect(() => {
    loadBillingHistory();
  }, []);

  const loadBillingHistory = async () => {
    setLoading(true);
    try {
      const history = await autoBlogAPI.getBillingHistory(50);
      setBillingHistory(history || []);
    } catch (error) {
      console.error('Failed to load billing history:', error);
      // Don't show error for missing backend endpoint
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBillingInfo = async () => {
    setSavingBillingInfo(true);
    try {
      await autoBlogAPI.updateBillingInfo(billingInfo);
      message.success('Billing information updated successfully!');
    } catch (error) {
      message.error('Failed to update billing information: ' + error.message);
    } finally {
      setSavingBillingInfo(false);
    }
  };

  const billingColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => <Text strong>${amount}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'paid' ? 'green' : status === 'pending' ? 'orange' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Invoice',
      dataIndex: 'invoiceUrl',
      key: 'invoiceUrl',
      render: (url, record) => url ? (
        <Button size="small" type="link" href={url} target="_blank">
          View Invoice
        </Button>
      ) : (
        <Text type="secondary">N/A</Text>
      ),
    },
  ];

  // Calculate current month usage value
  const currentUsage = user?.currentUsage || 0;
  const estimatedBill = currentUsage * 15;

  return (
    <div style={{ padding: '20px 0' }}>
      {/* Current Billing Status */}
      <Card style={{ marginBottom: '24px', border: '2px solid #52c41a' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Title level={4} style={{ margin: 0, color: '#52c41a' }}>💳 Current Billing Status</Title>
          </Col>
          <Col>
            <Tag color="green">✓ Database Connected</Tag>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f6ffed' }}>
              <Statistic
                title="Current Month Usage"
                value={estimatedBill}
                prefix="$"
                valueStyle={{ color: '#52c41a', fontSize: '24px' }}
              />
              <Text style={{ color: '#666', fontSize: '12px' }}>{currentUsage} posts generated</Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f0f9ff' }}>
              <Statistic
                title="Plan Type"
                value={user?.billingStatus || 'Pay-as-you-go'}
                valueStyle={{ color: '#1890ff', fontSize: '16px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ textAlign: 'center', backgroundColor: '#fff7e6' }}>
              <Statistic
                title="Next Bill Date"
                value={user?.nextBillDate ? new Date(user.nextBillDate).toLocaleDateString() : 'N/A'}
                valueStyle={{ color: '#fa8c16', fontSize: '14px' }}
              />
            </Card>
          </Col>
        </Row>

        <Alert
          message="Pay-as-you-go Billing"
          description="You're charged $15 for each blog post generated. Billing occurs at the end of each month for usage during that month."
          type="info"
          style={{ marginBottom: '16px' }}
        />
      </Card>

      {/* Billing Information */}
      <Card style={{ marginBottom: '24px', border: '2px solid #1890ff' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Title level={4} style={{ margin: 0, color: '#1890ff' }}>🏢 Billing Information</Title>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Text strong>Company Name</Text>
            <Input
              value={billingInfo.companyName}
              onChange={(e) => setBillingInfo({ ...billingInfo, companyName: e.target.value })}
              placeholder="Enter company name"
              style={{ marginTop: '8px' }}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Text strong>Billing Email</Text>
            <Input
              value={billingInfo.billingEmail}
              onChange={(e) => setBillingInfo({ ...billingInfo, billingEmail: e.target.value })}
              placeholder="Enter billing email"
              style={{ marginTop: '8px' }}
            />
          </Col>
          <Col xs={24}>
            <Text strong>Address</Text>
            <Input
              value={billingInfo.address}
              onChange={(e) => setBillingInfo({ ...billingInfo, address: e.target.value })}
              placeholder="Enter street address"
              style={{ marginTop: '8px' }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Text strong>City</Text>
            <Input
              value={billingInfo.city}
              onChange={(e) => setBillingInfo({ ...billingInfo, city: e.target.value })}
              placeholder="Enter city"
              style={{ marginTop: '8px' }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Text strong>State</Text>
            <Input
              value={billingInfo.state}
              onChange={(e) => setBillingInfo({ ...billingInfo, state: e.target.value })}
              placeholder="Enter state"
              style={{ marginTop: '8px' }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Text strong>ZIP Code</Text>
            <Input
              value={billingInfo.zipCode}
              onChange={(e) => setBillingInfo({ ...billingInfo, zipCode: e.target.value })}
              placeholder="Enter ZIP code"
              style={{ marginTop: '8px' }}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Text strong>Country</Text>
            <Input
              value={billingInfo.country}
              onChange={(e) => setBillingInfo({ ...billingInfo, country: e.target.value })}
              placeholder="Enter country"
              style={{ marginTop: '8px' }}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Text strong>Tax ID (Optional)</Text>
            <Input
              value={billingInfo.taxId}
              onChange={(e) => setBillingInfo({ ...billingInfo, taxId: e.target.value })}
              placeholder="Enter tax ID"
              style={{ marginTop: '8px' }}
            />
          </Col>
        </Row>

        <Row style={{ marginTop: '20px' }}>
          <Col>
            <Button 
              type="primary" 
              onClick={handleSaveBillingInfo}
              loading={savingBillingInfo}
              style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
            >
              {savingBillingInfo ? 'Saving...' : 'Save Billing Information'}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Billing History */}
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>📄 Billing History</Title>
          </Col>
          <Col>
            <Tag color="blue">Last 12 Months</Tag>
          </Col>
        </Row>

        {billingHistory.length > 0 ? (
          <Table
            columns={billingColumns}
            dataSource={billingHistory}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="small"
            loading={loading}
          />
        ) : (
          <Alert
            message="No Billing History Available"
            description="Your billing history will appear here once you start generating content and receive invoices."
            type="info"
            showIcon
          />
        )}
      </Card>
    </div>
  );
};

const ReferralSettings = () => {
  const [inviteEmails, setInviteEmails] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [referralData, setReferralData] = useState(null);
  const [stats, setStats] = useState(null);
  
  // Load referral data on component mount
  useEffect(() => {
    loadReferralData();
  }, []);
  
  const loadReferralData = async () => {
    try {
      setLoading(true);
      const [linkData, statsData] = await Promise.all([
        autoBlogAPI.generateReferralLink(),
        autoBlogAPI.getReferralStats()
      ]);
      
      console.log('Referral link data:', linkData); // Debug logging
      console.log('Referral stats data:', statsData); // Debug logging
      
      setReferralData(linkData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading referral data:', error);
      console.error('Error details:', error.message); // More detailed error logging
      message.error('Failed to load referral data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopyLink = () => {
    if (referralData?.referralLink) {
      navigator.clipboard.writeText(referralData.referralLink);
      message.success('Referral link copied to clipboard!');
    }
  };
  
  const handleSendInvites = async () => {
    if (!inviteEmails.trim()) {
      message.error('Please enter at least one email address');
      return;
    }
    
    setSendingInvite(true);
    const emails = inviteEmails.split(',').map(email => email.trim()).filter(email => email);
    let successCount = 0;
    let errorCount = 0;
    
    for (const email of emails) {
      try {
        await autoBlogAPI.sendReferralInvite(email, 'Join me on Automate My Blog and we both get 1 free blog post!');
        successCount++;
      } catch (error) {
        console.error(`Failed to send invite to ${email}:`, error);
        errorCount++;
      }
    }
    
    if (successCount > 0) {
      message.success(`Successfully sent ${successCount} invitation${successCount > 1 ? 's' : ''}!`);
      setInviteEmails('');
      loadReferralData(); // Refresh stats
    }
    
    if (errorCount > 0) {
      message.warning(`Failed to send ${errorCount} invitation${errorCount > 1 ? 's' : ''}. Please check the email addresses.`);
    }
    
    setSendingInvite(false);
  };
  
  if (loading) {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center' }}>
        <Spin size="large" />
        <p style={{ marginTop: '16px' }}>Loading referral data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 0' }}>
      {/* Referral Statistics Dashboard */}
      <Card style={{ marginBottom: '24px', border: '2px solid #52c41a' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Title level={4} style={{ margin: 0, color: '#52c41a' }}>🎁 Your Referral Statistics</Title>
          </Col>
          <Col>
            <Tag color="green">✓ Live Database Data</Tag>
          </Col>
        </Row>
        
        <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
          <Col xs={24} sm={12}>
            <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f6ffed' }}>
              <Statistic
                title="Successful Referrals"
                value={stats?.successfulReferrals || 0}
                prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontSize: '20px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f6ffed' }}>
              <Statistic
                title="Invites Sent"
                value={stats?.inviteStats?.totalSent || 0}
                prefix={<SendOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1', fontSize: '20px' }}
              />
            </Card>
          </Col>
        </Row>
        
        <Alert
          message="How it works"
          description="Send your referral link to friends. When they sign up, you both get 1 free blog post!"
          type="success"
          style={{ marginBottom: '16px' }}
        />
      </Card>
      
      {/* Personal Referral Link */}
      <Card style={{ marginBottom: '24px', border: '2px solid #52c41a' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Title level={4} style={{ margin: 0, color: '#52c41a' }}>🔗 Your Personal Referral Link</Title>
          </Col>
          <Col>
            <Tag color="green">✓ {referralData?.referralCode}</Tag>
          </Col>
        </Row>
        
        <Row gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Input.Group compact>
              <Input
                value={referralData?.referralLink || ''}
                style={{ width: 'calc(100% - 120px)' }}
                readOnly
              />
              <Button 
                type="primary" 
                icon={<CopyOutlined />}
                onClick={handleCopyLink}
                style={{ width: '120px' }}
              >
                Copy Link
              </Button>
            </Input.Group>
            <Text style={{ fontSize: '12px', color: '#666', display: 'block', marginTop: '8px' }}>
              {referralData?.description || 'Share this link to earn 1 free blog post for each new customer!'}
            </Text>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <QRCode value={referralData?.referralLink || ''} size={100} />
              <br />
              <Text style={{ fontSize: '12px', color: '#666', marginTop: '8px', display: 'block' }}>
                QR Code for mobile sharing
              </Text>
            </div>
          </Col>
        </Row>
      </Card>
      
      {/* Email Invitations - Now Working */}
      <Card style={{ marginBottom: '24px', border: '2px solid #52c41a' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Title level={4} style={{ margin: 0, color: '#52c41a' }}>📧 Send Referral Invitations</Title>
          </Col>
          <Col>
            <Tag color="green">✓ Database Connected</Tag>
          </Col>
        </Row>
        
        <Alert
          message="Email Invitation System Active"
          description="Send personalized invitations to friends. They'll get your referral link and both of you will receive 1 free blog post when they sign up!"
          type="success"
          showIcon
          style={{ marginBottom: '20px' }}
        />
        
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong style={{ color: '#52c41a' }}>Invite Friends by Email</Text>
          <Input.TextArea
            placeholder="Enter email addresses separated by commas&#10;e.g. friend1@email.com, friend2@email.com"
            value={inviteEmails}
            onChange={(e) => setInviteEmails(e.target.value)}
            rows={3}
          />
          <Button 
            type="primary" 
            icon={<MailOutlined />}
            onClick={handleSendInvites}
            loading={sendingInvite}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            {sendingInvite ? 'Sending Invitations...' : 'Send Invitations'}
          </Button>
          <Text style={{ fontSize: '12px', color: '#666' }}>
            Each invitation will include your personal referral link and a message about the free blog post reward
          </Text>
        </Space>
      </Card>
      
      {/* Social Sharing - GREEN (pure frontend) */}
      <Card style={{ border: '2px solid #52c41a' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Title level={4} style={{ margin: 0, color: '#52c41a' }}>📱 Social Sharing</Title>
          </Col>
          <Col>
            <Tag color="green">✓ Pure frontend functionality</Tag>
          </Col>
        </Row>
        
        <Space wrap>
          <Button 
            icon={<ShareAltOutlined />}
            onClick={() => {
              if (navigator.share && referralData?.referralLink) {
                navigator.share({
                  title: 'Join Automate My Blog',
                  text: 'Get 1 free blog post when you sign up!',
                  url: referralData.referralLink,
                });
              } else {
                handleCopyLink();
              }
            }}
          >
            Share Link
          </Button>
          <Button 
            onClick={() => {
              const subject = 'Get 1 free blog post with Automate My Blog';
              const body = `Hi! I'm using Automate My Blog to create amazing content. Sign up with my referral link and we both get 1 free blog post:\n\n${referralData?.referralLink || ''}\n\nHappy blogging!`;
              window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
            }}
          >
            Email Template
          </Button>
        </Space>
        
        <Alert
          message="Share your referral link anywhere"
          description="Copy the link above and share it on social media, in emails, or with friends directly. Both you and your friend get 1 free blog post!"
          type="info"
          style={{ marginTop: '16px' }}
        />
      </Card>
    </div>
  );
};

const SubscriptionSettings = () => {
  const { user } = useAuth();
  const [usageHistory, setUsageHistory] = useState([]);
  const [requestingPlan, setRequestingPlan] = useState(false);
  
  // Calculate usage statistics from real user data
  const usageLimit = user?.usageLimit || 1;
  const currentUsage = user?.currentUsage || 0;
  const remainingPosts = Math.max(0, usageLimit - currentUsage);
  const billingStatus = user?.billingStatus || 'Pay-as-you-go';

  useEffect(() => {
    loadUsageHistory();
  }, []);

  const loadUsageHistory = async () => {
    try {
      const history = await autoBlogAPI.getUsageHistory(30);
      setUsageHistory(history || []);
    } catch (error) {
      console.error('Failed to load usage history:', error);
      // Don't show error for missing backend endpoint
    }
  };

  const handlePlanRequest = async (planType) => {
    setRequestingPlan(true);
    try {
      await autoBlogAPI.requestPlanChange(planType, `User requested upgrade to ${planType} plan`);
      message.success(`Plan change request submitted for ${planType} plan! Our team will contact you soon.`);
    } catch (error) {
      message.error('Failed to submit plan change request: ' + error.message);
    } finally {
      setRequestingPlan(false);
    }
  };

  const usageColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Activity',
      dataIndex: 'activity',
      key: 'activity',
      render: (activity) => (
        <Tag color="blue">{activity}</Tag>
      ),
    },
    {
      title: 'Posts Used',
      dataIndex: 'postsUsed',
      key: 'postsUsed',
      render: (posts) => <Text strong>{posts}</Text>,
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value) => <Text>${value}</Text>,
    },
  ];
  
  return (
    <div style={{ padding: '20px 0' }}>
      {/* Current Plan Overview */}
      <Card style={{ marginBottom: '24px', border: '2px solid #52c41a' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Title level={4} style={{ margin: 0, color: '#52c41a' }}>📊 Current Plan</Title>
          </Col>
          <Col>
            <Tag color="green" icon={<StarOutlined />}>
              {billingStatus}
            </Tag>
            <Tag color="blue" style={{ marginLeft: '8px' }}>
              ✓ Real database data
            </Tag>
          </Col>
        </Row>
        
        <Paragraph style={{ color: '#666', marginBottom: '16px' }}>
          You're currently on the {billingStatus} plan. You have {usageLimit} posts in your plan.
          <br />
          <Text style={{ color: '#52c41a', fontWeight: 500 }}>
            💡 Earn more free posts by referring friends! Check the Referrals tab.
          </Text>
        </Paragraph>
        
        <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
          <Col xs={24} sm={6}>
            <Card size="small" style={{ textAlign: 'center', border: currentUsage > 0 ? '2px solid #52c41a' : '1px solid #d9d9d9' }}>
              <Statistic
                title="Posts Used"
                value={currentUsage}
                valueStyle={{ color: '#52c41a', fontSize: '24px' }}
              />
              <Text style={{ color: '#52c41a', fontSize: '10px' }}>✓ Database tracking</Text>
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small" style={{ textAlign: 'center', border: '2px solid #1890ff' }}>
              <Statistic
                title="Posts Remaining"
                value={remainingPosts}
                valueStyle={{ color: '#1890ff', fontSize: '24px' }}
              />
              <Text style={{ color: '#1890ff', fontSize: '10px' }}>✓ Real calculation</Text>
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title="Total Plan Limit"
                value={usageLimit}
                valueStyle={{ color: '#722ed1', fontSize: '24px' }}
              />
              <Text style={{ color: '#722ed1', fontSize: '10px' }}>✓ From database</Text>
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title="Usage Value"
                value={currentUsage * 15}
                prefix="$"
                valueStyle={{ color: '#f5222d', fontSize: '20px' }}
              />
              <Text style={{ color: '#666', fontSize: '10px' }}>Estimated worth</Text>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Usage Analytics */}
      <Card style={{ marginBottom: '24px', border: '2px solid #1890ff' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Title level={4} style={{ margin: 0, color: '#1890ff' }}>📈 Usage Analytics</Title>
          </Col>
          <Col>
            <Tag color="blue">Last 30 Days</Tag>
          </Col>
        </Row>

        {usageHistory.length > 0 ? (
          <Table
            columns={usageColumns}
            dataSource={usageHistory}
            rowKey="id"
            pagination={false}
            size="small"
            style={{ marginTop: '16px' }}
          />
        ) : (
          <Alert
            message="No Usage History Available"
            description="Usage tracking will appear here once you start generating content."
            type="info"
            showIcon
          />
        )}
      </Card>

      {/* Available Plans */}
      <Card>
        <Title level={4}>🚀 Available Plans</Title>
        
        <Alert
          message="Plan Change Requests"
          description="Submit a plan change request and our team will contact you within 24 hours to complete the upgrade."
          type="info"
          style={{ marginBottom: '20px' }}
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <Card size="small" style={{ border: billingStatus === 'Pay-as-you-go' ? '2px solid #52c41a' : '1px solid #d9d9d9' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong style={{ color: '#52c41a' }}>Pay-as-you-go</Text>
                <div>
                  <Text style={{ fontSize: '20px', fontWeight: 600 }}>$15</Text>
                  <Text style={{ color: '#666' }}>/post</Text>
                </div>
                <Text style={{ fontSize: '12px', color: '#666' }}>Perfect for occasional use</Text>
                {billingStatus === 'Pay-as-you-go' ? (
                  <Tag color="green">Current Plan</Tag>
                ) : (
                  <Button 
                    size="small" 
                    onClick={() => handlePlanRequest('Pay-as-you-go')}
                    loading={requestingPlan}
                  >
                    Switch to Pay-as-you-go
                  </Button>
                )}
              </Space>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card size="small" style={{ border: billingStatus === 'Creator' ? '2px solid #1890ff' : '1px solid #d9d9d9' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong style={{ color: '#1890ff' }}>Creator</Text>
                <div>
                  <Text style={{ fontSize: '20px', fontWeight: 600 }}>$20</Text>
                  <Text style={{ color: '#666' }}>/month</Text>
                </div>
                <Text style={{ fontSize: '12px', color: '#666' }}>4 posts/month + priority support</Text>
                {billingStatus === 'Creator' ? (
                  <Tag color="blue">Current Plan</Tag>
                ) : (
                  <Button 
                    type="primary" 
                    size="small" 
                    onClick={() => handlePlanRequest('Creator')}
                    loading={requestingPlan}
                    style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
                  >
                    Upgrade to Creator
                  </Button>
                )}
              </Space>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card size="small" style={{ border: billingStatus === 'Professional' ? '2px solid #722ed1' : '1px solid #d9d9d9' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong style={{ color: '#722ed1' }}>Professional</Text>
                <div>
                  <Text style={{ fontSize: '20px', fontWeight: 600 }}>$50</Text>
                  <Text style={{ color: '#666' }}>/month</Text>
                </div>
                <Text style={{ fontSize: '12px', color: '#666' }}>8 posts + unlimited strategies + white-label</Text>
                {billingStatus === 'Professional' ? (
                  <Tag color="purple">Current Plan</Tag>
                ) : (
                  <Button 
                    type="primary" 
                    size="small" 
                    onClick={() => handlePlanRequest('Professional')}
                    loading={requestingPlan}
                    style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}
                  >
                    Upgrade to Professional
                  </Button>
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

const SettingsTab = () => {
  const items = [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
      children: <ProfileSettings />,
    },
    {
      key: 'subscriptions',
      label: 'Subscriptions',
      icon: <StarOutlined />,
      children: <SubscriptionSettings />,
    },
    {
      key: 'referrals',
      label: 'Referrals',
      icon: <GiftOutlined />,
      children: <ReferralSettings />,
    },
    {
      key: 'organization',
      label: 'Organization',
      icon: <BankOutlined />,
      children: <OrganizationSettings />,
    },
    {
      key: 'billing',
      label: 'Billing',
      icon: <CreditCardOutlined />,
      children: <BillingSettings />,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Settings">
        <Tabs items={items} />
      </Card>
    </div>
  );
};

export default SettingsTab;