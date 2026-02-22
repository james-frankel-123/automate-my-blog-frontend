import React from 'react';
import { Typography } from 'antd';
import { 
  GlobalOutlined, 
  TeamOutlined, 
  BulbOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

/** Get a single display string from targetSegment (string or { demographics, psychographics, searchBehavior }). */
function targetSegmentToDisplayString(targetSegment) {
  if (targetSegment == null) return '';
  if (typeof targetSegment === 'string') return targetSegment.trim();
  if (typeof targetSegment === 'object')
    return (targetSegment.demographics ?? targetSegment.description ?? targetSegment.psychographics ?? targetSegment.searchBehavior ?? targetSegment.title ?? '').trim() || '';
  return '';
}

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
      icon: <GlobalOutlined style={{ color: 'var(--color-primary)', fontSize: '14px' }} />,
      label: 'Website',
      getDisplayText: (data) => {
        if (data.businessName) {
          return `${data.businessName} • ${data.businessType || 'Business'}`;
        }
        return data.websiteUrl || 'Website analyzed';
      }
    },
    audienceSelection: {
      icon: <TeamOutlined style={{ color: 'var(--color-primary)', fontSize: '14px' }} />,
      label: 'Audience',
      getDisplayText: (data) => {
        const segmentStr = targetSegmentToDisplayString(data.targetSegment);
        if (segmentStr) {
          return segmentStr.split(' ').slice(0, 4).join(' ') + (segmentStr.split(' ').length > 4 ? '...' : '');
        }
        return data.audienceName || 'Audience selected';
      }
    },
    topicSelection: {
      icon: <BulbOutlined style={{ color: 'var(--color-primary)', fontSize: '14px' }} />,
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
        borderBottom: '1px solid var(--color-border-base)',
        boxShadow: 'var(--shadow-sm)',
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
              borderBottom: index < completedSteps.length - 1 ? '1px solid var(--color-border-base)' : 'none',
              backgroundColor: 'var(--color-background-alt)',
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
              backgroundColor: 'var(--color-primary)',
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
                color: 'var(--color-text-primary)',
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
                color: 'var(--color-text-secondary)',
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