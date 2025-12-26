import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Space } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  FolderOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import NewPostTab from './NewPostTab';
import OverviewTab from './OverviewTab';
import PostsTab from './PostsTab';
import ProjectsTab from './ProjectsTab';
import AnalyticsTab from './AnalyticsTab';
import SettingsTab from './SettingsTab';

const { Header, Sider, Content } = Layout;

const DashboardLayout = ({ user: propUser, loginContext, workflowContent, showDashboard, isMobile }) => {
  const [activeTab, setActiveTab] = useState('newpost');
  const [collapsed, setCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { user: contextUser, logout } = useAuth();
  
  // Use prop user if provided, otherwise fall back to context user
  const user = propUser || contextUser;
  
  // Animation styles - elements slide in when dashboard is shown
  const animationDuration = '1s';
  const easing = 'cubic-bezier(0.4, 0, 0.2, 1)';

  const menuItems = [
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
      case 'projects':
        return <ProjectsTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'settings':
        return <SettingsTab />;
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
              {collapsed ? 'AB' : 'AutoBlog'}
            </h3>
          </div>
          
          {/* Navigation Menu */}
          <div style={{ flex: 1 }}>
            <Menu
              mode="inline"
              selectedKeys={[activeTab]}
              items={menuItems}
              onClick={({ key }) => setActiveTab(key)}
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
                      {user?.profile?.firstName} {user?.profile?.lastName}
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
          {menuItems.slice(0, 5).map((item) => (
            <Button
              key={item.key}
              type={activeTab === item.key ? 'primary' : 'text'}
              icon={item.icon}
              onClick={() => setActiveTab(item.key)}
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
    </>
  );
};

export default DashboardLayout;