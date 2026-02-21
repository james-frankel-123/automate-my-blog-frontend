import React, { useRef } from 'react';
import { Spin } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import ContentStrategyCard from './ContentStrategyCard';

/**
 * StrategyCarousel - Horizontal scrolling carousel of strategy cards
 *
 * Features:
 * - Horizontal scroll with left/right buttons
 * - Smooth scrolling behavior
 * - Responsive: 2-3 cards visible on desktop, 1 on mobile
 * - Shows subscribed vs unsubscribed strategies
 */
export default function StrategyCarousel({
  strategies = [],
  subscribedStrategies = {},
  selectedStrategyId = null,
  onStrategyClick,
  loading = false
}) {
  const carouselRef = useRef(null);

  /**
   * Scroll carousel left
   */
  function scrollLeft() {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: -320, // Card width + gap
        behavior: 'smooth'
      });
    }
  }

  /**
   * Scroll carousel right
   */
  function scrollRight() {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: 320, // Card width + gap
        behavior: 'smooth'
      });
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }}>
        <Spin size="large" tip="Loading strategies..." />
      </div>
    );
  }

  if (strategies.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--color-text-tertiary)',
        fontSize: 'var(--font-size-base)'
      }}>
        No strategies found. Complete website analysis to generate strategies.
      </div>
    );
  }

  // Sort strategies: subscribed first, then unsubscribed
  const sortedStrategies = [...strategies].sort((a, b) => {
    const aIsSubscribed = !!subscribedStrategies[a.id];
    const bIsSubscribed = !!subscribedStrategies[b.id];

    if (aIsSubscribed && !bIsSubscribed) return -1;
    if (!aIsSubscribed && bIsSubscribed) return 1;
    return 0;
  });

  return (
    <div style={{
      position: 'relative',
      height: '100%',
      padding: 'var(--space-4) var(--space-6)',
      display: 'flex',
      alignItems: 'center'
    }}>
      {/* Left scroll button */}
      {strategies.length > 2 && (
        <button
          onClick={scrollLeft}
          style={{
            position: 'absolute',
            left: '0',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '1px solid var(--color-border-base)',
            backgroundColor: 'var(--color-background-body)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md)',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-gray-100)';
            e.currentTarget.style.boxShadow = 'var(--shadow-elevated)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-background-body)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
        >
          <LeftOutlined style={{ fontSize: '16px', color: 'var(--color-text-primary)' }} />
        </button>
      )}

      {/* Carousel container */}
      <div
        ref={carouselRef}
        style={{
          display: 'flex',
          gap: 'var(--space-4)',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          padding: 'var(--space-2) var(--space-12)',
          margin: '0 auto',
          maxWidth: '100%',
          // Hide scrollbar
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE/Edge
          WebkitOverflowScrolling: 'touch' // iOS smooth scrolling
        }}
        // Hide scrollbar for Chrome/Safari/Opera
        onLoad={() => {
          const style = document.createElement('style');
          style.innerHTML = `
            [ref] { -ms-overflow-style: none; scrollbar-width: none; }
            [ref]::-webkit-scrollbar { display: none; }
          `;
          document.head.appendChild(style);
        }}
      >
        {sortedStrategies.map((strategy) => {
          const isSubscribed = !!subscribedStrategies[strategy.id];

          return (
            <ContentStrategyCard
              key={strategy.id}
              strategy={strategy}
              isSubscribed={isSubscribed}
              isSelected={selectedStrategyId === strategy.id}
              performanceMetrics={subscribedStrategies[strategy.id]?.performanceMetrics}
              hasContentCalendar={strategy.hasContentCalendar}
              onClick={() => onStrategyClick(strategy)}
            />
          );
        })}
      </div>

      {/* Right scroll button */}
      {strategies.length > 2 && (
        <button
          onClick={scrollRight}
          style={{
            position: 'absolute',
            right: '0',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '1px solid var(--color-border-base)',
            backgroundColor: 'var(--color-background-body)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md)',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-gray-100)';
            e.currentTarget.style.boxShadow = 'var(--shadow-elevated)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-background-body)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
        >
          <RightOutlined style={{ fontSize: '16px', color: 'var(--color-text-primary)' }} />
        </button>
      )}
    </div>
  );
}
