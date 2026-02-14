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
        color: '#999',
        fontSize: '16px'
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
      padding: '16px 24px',
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
            border: '1px solid #d9d9d9',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
          }}
        >
          <LeftOutlined style={{ fontSize: '16px', color: '#333' }} />
        </button>
      )}

      {/* Carousel container */}
      <div
        ref={carouselRef}
        style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          padding: '8px 48px',
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

          // Debug first 3 strategies
          if (sortedStrategies.indexOf(strategy) < 3) {
            console.log(`📊 Card ${sortedStrategies.indexOf(strategy)}:`, {
              strategyId: strategy.id,
              isSubscribed,
              hasInMap: strategy.id in subscribedStrategies,
              subscribedKeys: Object.keys(subscribedStrategies)
            });
          }

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
            border: '1px solid #d9d9d9',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
          }}
        >
          <RightOutlined style={{ fontSize: '16px', color: '#333' }} />
        </button>
      )}
    </div>
  );
}
