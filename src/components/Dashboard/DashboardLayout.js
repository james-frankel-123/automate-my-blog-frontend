import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Alert, message } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  FolderOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  EditOutlined,
  SearchOutlined,
  TeamOutlined,
  LineChartOutlined,
  SafetyOutlined,
  DatabaseOutlined,
  UserSwitchOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import NewPostTab from './NewPostTab';
import OverviewTab from './OverviewTab';
import PostsTab from './PostsTab';
import DiscoveryTab from './DiscoveryTab';
import ProjectsTab from './ProjectsTab';
import AnalyticsTab from './AnalyticsTab';
import SettingsTab from './SettingsTab';
// ADMIN COMPONENTS - Super user only
import AdminUsersTab from './AdminUsersTab';
import AdminAnalyticsTab from './AdminAnalyticsTab';
import AdminContentTab from './AdminContentTab';
import AdminSystemTab from './AdminSystemTab';

const { Header, Sider, Content } = Layout;

const DashboardLayout = ({ user: propUser, loginContext, workflowContent, showDashboard, isMobile, onActiveTabChange }) => {
  const [activeTab, setActiveTab] = useState('newpost');
  const [collapsed, setCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { 
    user: contextUser, 
    logout, 
    isAdmin, 
    isSuperAdmin, 
    hasPermission,
    isImpersonating,
    impersonationData,
    endImpersonation
  } = useAuth();
  
  // Use prop user if provided, otherwise fall back to context user
  const user = propUser || contextUser;
  
  // Handle tab changes and notify parent
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (onActiveTabChange) {
      onActiveTabChange(newTab);
    }
  };

  // Handle ending impersonation
  const handleEndImpersonation = async () => {
    try {
      const result = await endImpersonation();
      if (result.success) {
        message.success('Returned to your admin account');
      } else {
        message.error('Failed to end impersonation');
      }
    } catch (error) {
      message.error('Failed to end impersonation');
    }
  };
  
  // Animation styles - elements slide in when dashboard is shown
  const animationDuration = '1s';
  const easing = 'cubic-bezier(0.4, 0, 0.2, 1)';

  // Base menu items available to all users
  const baseMenuItems = [
    {
      key: 'newpost',
      icon: <EditOutlined />,
      label: 'New Post',
    },
    {
      key: 'overview',
      icon: <DashboardOutlined />,
      label: 'Overview',
    },
    {
      key: 'posts',
      icon: <FileTextOutlined />,
      label: 'Posts',
    },
    {
      key: 'discovery',
      icon: <SearchOutlined />,
      label: 'Discovery',
    },
    {
      key: 'projects',
      icon: <FolderOutlined />,
      label: 'Projects',
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  // Admin menu items - conditionally added based on permissions
  const adminMenuItems = [];
  
  // Admin Users tab - for organization admins and super admins
  if (isSuperAdmin || hasPermission('manage_team') || hasPermission('manage_users')) {
    adminMenuItems.push({
      key: 'admin-users',
      icon: <TeamOutlined style={{ color: 'red' }} />,
      label: 'Admin Users',
    });
  }
  
  // Platform-wide admin tabs - super admin gets all tabs regardless of specific permissions
  if (isSuperAdmin) {
    adminMenuItems.push({
      key: 'admin-analytics',
      icon: <LineChartOutlined style={{ color: 'red' }} />,
      label: 'Admin Analytics',
    });
    
    adminMenuItems.push({
      key: 'admin-content',
      icon: <SafetyOutlined style={{ color: 'red' }} />,
      label: 'Admin Content',
    });
    
    adminMenuItems.push({
      key: 'admin-system',
      icon: <DatabaseOutlined style={{ color: 'red' }} />,
      label: 'Admin System',
    });
  }

  const menuItems = [...baseMenuItems, ...adminMenuItems];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: logout,
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'newpost':
        return <NewPostTab workflowContent={workflowContent} showWorkflow={!!workflowContent} />;
      case 'overview':
        return <OverviewTab />;
      case 'posts':
        return <PostsTab />;
      case 'discovery':
        return <DiscoveryTab />;
      case 'projects':
        return <ProjectsTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'settings':
        return <SettingsTab />;
      // ADMIN TABS - Super user components
      case 'admin-users':
        return <AdminUsersTab />;
      case 'admin-analytics':
        return <AdminAnalyticsTab />;
      case 'admin-content':
        return <AdminContentTab />;
      case 'admin-system':
        return <AdminSystemTab />;
      default:
        return <NewPostTab workflowContent={workflowContent} showWorkflow={!!workflowContent} />;
    }
  };

  return (
    <>
      {/* CSS Keyframes for smooth slide-in animations */}
      <style>{`
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
      
      {/* Desktop Sidebar - only shows on desktop */}
      {user && !isMobile && (
        <div style={{
          gridArea: 'sidebar',
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          transform: 'translateX(-100%)',
          animation: showDashboard ? 'slideInLeft 1s cubic-bezier(0.4, 0, 0.2, 1) 0.2s forwards' : 'none',
          boxShadow: showDashboard ? '2px 0 8px rgba(0,0,0,0.15)' : 'none',
          zIndex: 15,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh'
        }}>
          {/* Logo/Title */}
          <div style={{ 
            padding: '16px', 
            borderBottom: '1px solid #f0f0f0',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: collapsed ? '14px' : '18px' }}>
              {collapsed ? 'AMB' : 'Automate My Blog'}
            </h3>
          </div>
          
          {/* Navigation Menu */}
          <div style={{ flex: 1 }}>
            <Menu
              mode="inline"
              selectedKeys={[activeTab]}
              items={menuItems}
              onClick={({ key }) => handleTabChange(key)}
              style={{ border: 'none', height: '100%' }}
            />
          </div>
          
          {/* User Profile Section at Bottom */}
          <div style={{
            borderTop: '1px solid #f0f0f0',
            padding: '16px'
          }}>
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={['click']}
              placement="topLeft"
            >
              <Button type="text" style={{ 
                width: '100%',
                height: 'auto', 
                padding: '8px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Avatar 
                  icon={<UserOutlined />} 
                  style={{ backgroundColor: '#1890ff' }}
                />
                {!collapsed && (
                  <div style={{ 
                    flex: 1,
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      fontSize: '14px',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div style={{ 
                      fontSize: '12px',
                      color: '#666',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {user?.email}
                    </div>
                  </div>
                )}
              </Button>
            </Dropdown>
          </div>
        </div>
      )}

      {/* Mobile Navigation - only shows on mobile */}
      {user && isMobile && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          borderTop: '1px solid #f0f0f0',
          padding: '8px',
          zIndex: 20,
          display: 'flex',
          justifyContent: 'space-around',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.15)'
        }}>
          {menuItems.slice(0, 6).map((item) => (
            <Button
              key={item.key}
              type={activeTab === item.key ? 'primary' : 'text'}
              icon={item.icon}
              onClick={() => handleTabChange(item.key)}
              style={{
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: 'auto',
                padding: '8px 4px',
                fontSize: '10px',
                minWidth: '60px'
              }}
            >
              <div style={{ fontSize: '16px', marginBottom: '2px' }}>
                {item.icon}
              </div>
              <div style={{ fontSize: '10px', textAlign: 'center' }}>
                {item.label}
              </div>
            </Button>
          ))}
          
          {/* User Menu for Mobile */}
          <Dropdown
            menu={{ items: userMenuItems }}
            trigger={['click']}
            placement="topRight"
          >
            <Button
              type="text"
              style={{
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: 'auto',
                padding: '8px 4px',
                fontSize: '10px',
                minWidth: '60px'
              }}
            >
              <Avatar 
                icon={<UserOutlined />} 
                style={{ 
                  backgroundColor: '#1890ff',
                  width: '20px',
                  height: '20px',
                  fontSize: '12px',
                  marginBottom: '2px'
                }}
              />
              <div style={{ fontSize: '10px' }}>Profile</div>
            </Button>
          </Dropdown>
        </div>
      )}

      {/* Content area for non-newpost tabs */}
      {user && activeTab !== 'newpost' && (
        <div style={{ 
          gridArea: 'main',
          padding: isMobile ? '16px 16px 80px 16px' : '24px',
          background: '#f5f5f5',
          overflow: 'auto'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            minHeight: '100%',
            padding: '24px'
          }}>
            {renderContent()}
          </div>
        </div>
      )}

      {/* Impersonation Banner */}
      {isImpersonating && impersonationData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: '#ff4d4f',
          color: 'white',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserSwitchOutlined style={{ fontSize: '16px' }} />
            <span style={{ fontWeight: 500 }}>
              Acting as {user?.firstName} {user?.lastName} ({user?.email})
            </span>
            {impersonationData.originalAdmin && (
              <span style={{ opacity: 0.9 }}>
                • Admin: {impersonationData.originalAdmin.firstName} {impersonationData.originalAdmin.lastName}
              </span>
            )}
          </div>
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={handleEndImpersonation}
            style={{
              color: 'white',
              border: '1px solid rgba(255,255,255,0.5)',
              borderRadius: '4px'
            }}
          >
            Exit Impersonation
          </Button>
        </div>
      )}

      {/* Push content down when impersonation banner is visible */}
      {isImpersonating && (
        <style>
          {`
            body {
              padding-top: 44px !important;
            }
          `}
        </style>
      )}
    </>
  );
};

export default DashboardLayout;