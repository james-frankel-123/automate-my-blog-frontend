import React from 'react';
import { Card, Badge, Tag } from 'antd';
import { CheckCircleFilled, LockFilled, FileTextOutlined, CheckOutlined, ClockCircleOutlined, RocketOutlined } from '@ant-design/icons';

/**
 * AudienceAvatar - Display audience image with fallback to rocket icon
 */
function AudienceAvatar({ imageUrl, size = 48 }) {
  const [imageError, setImageError] = React.useState(false);

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: '8px',
    objectFit: 'cover',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  };

  if (!imageUrl || imageError) {
    return (
      <div style={avatarStyle}>
        <RocketOutlined style={{ fontSize: size * 0.5, color: '#1890ff' }} />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt="Audience"
      style={avatarStyle}
      onError={() => setImageError(true)}
    />
  );
}

/**
 * ContentStrategyCard - Individual strategy card in the carousel
 *
 * Two variants:
 * 1. Subscribed: Shows performance metrics (drafts, published, scheduled)
 * 2. Unsubscribed: Shows lock icon and "View Details" CTA
 *
 * Visual states:
 * - Selected: Elevated shadow, full opacity
 * - Unselected: Subtle shadow, reduced opacity
 * - Hover: Increased shadow
 */
export default function ContentStrategyCard({
  strategy,
  isSubscribed = false,
  isSelected = false,
  performanceMetrics = null,
  onClick
}) {
  // Parse target segment
  let demographics = 'Unknown Audience';
  if (strategy.targetSegment?.demographics) {
    demographics = strategy.targetSegment.demographics;
  } else if (strategy.customerProblem) {
    demographics = strategy.customerProblem;
  }

  // Truncate long text
  const truncate = (text, maxLength = 60) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const cardStyle = {
    width: '300px',
    minWidth: '300px',
    height: '160px',
    scrollSnapAlign: 'start',
    cursor: 'pointer',
    border: isSubscribed ? '2px solid #52c41a' : '1px solid #d9d9d9',
    borderRadius: '8px',
    opacity: isSelected ? 1 : 0.7,
    boxShadow: isSelected
      ? '0 8px 24px rgba(0,0,0,0.25)'
      : '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    overflow: 'hidden',
    position: 'relative'
  };

  const hoverStyle = {
    boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
    transform: 'translateY(-2px)',
    opacity: 1
  };

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <Card
      style={isHovered ? { ...cardStyle, ...hoverStyle } : cardStyle}
      bodyStyle={{
        padding: '16px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with avatar and status badge */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        marginBottom: '8px'
      }}>
        {/* Audience Avatar */}
        <AudienceAvatar imageUrl={strategy.imageUrl} size={48} />

        {/* Text and status icon */}
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          minWidth: 0
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 'bold',
              fontSize: '15px',
              marginBottom: '4px',
              color: '#333',
              lineHeight: '1.3'
            }}>
              {truncate(demographics, 35)}
            </div>
          </div>

          {isSubscribed ? (
            <CheckCircleFilled style={{ fontSize: '20px', color: '#52c41a', marginLeft: '8px' }} />
          ) : (
            <LockFilled style={{ fontSize: '20px', color: '#999', marginLeft: '8px' }} />
          )}
        </div>
      </div>

      {/* Status badge */}
      {isSubscribed && (
        <div style={{ marginBottom: '12px' }}>
          <Badge status="success" text="Active Strategy" />
        </div>
      )}

      {/* Content: Performance metrics OR CTA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {isSubscribed && performanceMetrics ? (
          <div style={{
            fontSize: '13px',
            color: '#666',
            lineHeight: '1.8'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckOutlined style={{ color: '#52c41a' }} />
              <span>{performanceMetrics.published || 0} Posts Published</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileTextOutlined style={{ color: '#1890ff' }} />
              <span>{performanceMetrics.drafts || 0} Drafts In Progress</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ClockCircleOutlined style={{ color: '#faad14' }} />
              <span>{performanceMetrics.upcoming || 0} Scheduled</span>
            </div>
          </div>
        ) : isSubscribed ? (
          <div style={{
            fontSize: '13px',
            color: '#999',
            fontStyle: 'italic'
          }}>
            No posts yet. Click to start creating content.
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '8px 0'
          }}>
            <Tag
              color="blue"
              style={{
                cursor: 'pointer',
                padding: '4px 12px',
                fontSize: '13px',
                border: 'none'
              }}
            >
              View Strategy Details →
            </Tag>
          </div>
        )}
      </div>

      {/* Lock overlay for unsubscribed (subtle) */}
      {!isSubscribed && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none'
        }} />
      )}
    </Card>
  );
}
