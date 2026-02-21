import React from 'react';
import { Card, Badge, Tag } from 'antd';
import { LockFilled, FileTextOutlined, CheckOutlined, ClockCircleOutlined, CalendarOutlined } from '@ant-design/icons';

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
  hasContentCalendar = false,
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
    border: isSubscribed ? '2px solid var(--color-success)' : '1px solid var(--color-border-base)',
    borderRadius: 'var(--radius-md)',
    opacity: isSelected ? 1 : 0.9,
    boxShadow: isSelected
      ? 'var(--shadow-elevated)'
      : 'var(--shadow-sm)',
    transition: 'all 0.3s ease',
    overflow: 'hidden',
    position: 'relative'
  };

  const hoverStyle = {
    boxShadow: 'var(--shadow-elevated)',
    transform: 'translateY(-2px)',
    opacity: 1
  };

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <Card
      style={isHovered ? { ...cardStyle, ...hoverStyle } : cardStyle}
      bodyStyle={{
        padding: 'var(--space-4)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with status badge */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '8px'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontWeight: 'var(--font-weight-semibold)',
            fontSize: 'var(--font-size-base)',
            marginBottom: 'var(--space-1)',
            color: 'var(--color-text-primary)',
            lineHeight: 1.3
          }}>
            {truncate(demographics, 45)}
          </div>
        </div>

        {isSubscribed ? (
          <Badge
            count="Active"
            style={{
              backgroundColor: 'var(--color-success)',
              color: 'var(--color-text-on-primary)',
              fontSize: '11px',
              fontWeight: '600',
              padding: '0 8px',
              height: '20px',
              lineHeight: '20px',
              borderRadius: '10px'
            }}
          />
        ) : (
          <LockFilled style={{ fontSize: '20px', color: 'var(--color-text-tertiary)' }} />
        )}
      </div>

      {/* Status badge + calendar indicator */}
      <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {isSubscribed && (
          <Badge status="success" text="Active Strategy" />
        )}
        {isSubscribed && hasContentCalendar && (
          <Tag color="green" style={{ margin: 0 }}>
            <CalendarOutlined /> Calendar ready
          </Tag>
        )}
      </div>

      {/* Content: Performance metrics OR CTA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {isSubscribed && performanceMetrics ? (
          <div style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            lineHeight: '1.8'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <CheckOutlined style={{ color: 'var(--color-success)' }} />
              <span>{performanceMetrics.published || 0} Posts Published</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <FileTextOutlined style={{ color: 'var(--color-primary)' }} />
              <span>{performanceMetrics.drafts || 0} Drafts In Progress</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <ClockCircleOutlined style={{ color: 'var(--color-warning)' }} />
              <span>{performanceMetrics.upcoming || 0} Scheduled</span>
            </div>
          </div>
        ) : isSubscribed ? (
          <div style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-tertiary)',
            fontStyle: 'italic'
          }}>
            No posts yet. Click to start creating content.
          </div>
        ) : (
          <div style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-tertiary)',
            fontStyle: 'italic'
          }}>
            Click to view strategy details
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
          background: 'linear-gradient(180deg, rgba(0,0,0,0.04) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />
      )}
    </Card>
  );
}
