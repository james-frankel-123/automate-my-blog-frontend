import React from 'react';
import { Typography } from 'antd';
import { 
  GlobalOutlined, 
  TeamOutlined, 
  BulbOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

/**
 * ProgressiveStickyHeader Component
 * Displays completed workflow steps as subtle sticky rows at the top
 * Shows user's selections persistently during workflow
 */
const ProgressiveStickyHeader = ({
  completedSteps = [],
  className = '',
  style = {}
}) => {
  
  // Don't render if no completed steps
  if (!completedSteps.length) {
    return null;
  }

  // Step configuration with app-consistent colors
  const stepConfig = {
    websiteAnalysis: {
      icon: <GlobalOutlined style={{ color: '#6B8CAE', fontSize: '14px' }} />,
      label: 'Website',
      getDisplayText: (data) => {
        if (data.businessName) {
          return `${data.businessName} • ${data.businessType || 'Business'}`;
        }
        return data.websiteUrl || 'Website analyzed';
      }
    },
    audienceSelection: {
      icon: <TeamOutlined style={{ color: '#6B8CAE', fontSize: '14px' }} />,
      label: 'Audience',
      getDisplayText: (data) => {
        if (data.targetSegment) {
          const demo = data.targetSegment.demographics || '';
          return demo.split(' ').slice(0, 4).join(' ') + '...';
        }
        return data.audienceName || 'Audience selected';
      }
    },
    topicSelection: {
      icon: <BulbOutlined style={{ color: '#6B8CAE', fontSize: '14px' }} />,
      label: 'Topic',
      getDisplayText: (data) => {
        const title = data.title || data.topicName || 'Topic selected';
        return title.length > 40 ? title.substring(0, 40) + '...' : title;
      }
    }
  };

  return (
    <div 
      className={className}
      style={{
        position: 'fixed',
        top: '80px', // Position below existing headers
        left: 0,
        right: 0,
        backgroundColor: 'var(--color-background-elevated)',
        borderBottom: '1px solid #f0f0f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        zIndex: 999,
        transition: 'all 0.3s ease',
        ...style
      }}
    >
      {completedSteps.map((step, index) => {
        const config = stepConfig[step.type];
        if (!config) return null;

        return (
          <div
            key={step.type}
            className="progressive-step-enter"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 24px',
              borderBottom: index < completedSteps.length - 1 ? '1px solid #f0f0f0' : 'none',
              backgroundColor: '#fafafa',
              transition: 'all 0.3s ease',
              minHeight: '40px',
              animationDelay: `${index * 80}ms`,
              opacity: 0
            }}
          >
            {/* Completion indicator */}
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#6B8CAE',
              marginRight: '12px',
              flexShrink: 0
            }} />

            {/* Step icon and label */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginRight: '16px',
              minWidth: '100px',
              flexShrink: 0
            }}>
              {config.icon}
              <Text style={{ 
                marginLeft: '6px', 
                fontSize: '13px',
                color: '#262626',
                fontWeight: 500
              }}>
                {config.label}:
              </Text>
            </div>

            {/* User's selection */}
            <div style={{ 
              flex: 1,
              overflow: 'hidden'
            }}>
              <Text style={{ 
                fontSize: '13px', 
                color: '#595959',
                fontWeight: 400
              }}>
                {config.getDisplayText(step.data)}
              </Text>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProgressiveStickyHeader;