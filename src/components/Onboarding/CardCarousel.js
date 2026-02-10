/**
 * CardCarousel — horizontal carousel with Next/Continue and left arrow.
 * Next scrolls right; left arrow appears after scroll; after all cards viewed, Next → Continue.
 * Issue #261.
 */
import React, { useRef, useState, useEffect } from 'react';
import { Button, Empty } from 'antd';
import { LeftOutlined } from '@ant-design/icons';

const CARD_GAP = 16;

export function CardCarousel({
  children,
  onAllCardsViewed,
  dataTestId = 'card-carousel',
  emptyMessage = 'No items to show.',
  emptyDescription,
}) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [allViewed, setAllViewed] = useState(false);
  const [_currentIndex, setCurrentIndex] = useState(0);

  const cards = Array.isArray(children) ? children : children != null ? [children] : [];
  const count = cards.length;
  const isEmpty = count === 0;

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    const nearEnd = el.scrollWidth - el.scrollLeft <= el.clientWidth + 20;
    setAllViewed(nearEnd);
    const index = Math.round(el.scrollLeft / (el.clientWidth + CARD_GAP)) || 0;
    setCurrentIndex(Math.min(index, count - 1));
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState);
    updateScrollState();
    return () => el.removeEventListener('scroll', updateScrollState);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- updateScrollState stable
  }, [count]);

  const scrollBy = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const step = el.clientWidth + CARD_GAP;
    const next = direction === 'right'
      ? Math.min(el.scrollLeft + step, el.scrollWidth - el.clientWidth)
      : Math.max(0, el.scrollLeft - step);
    el.scrollTo({ left: next, behavior: 'smooth' });
  };

  const handleNextOrContinue = () => {
    if (allViewed && onAllCardsViewed) {
      onAllCardsViewed();
    } else {
      scrollBy('right');
    }
  };

  if (isEmpty) {
    return (
      <div data-testid={dataTestId} style={{ marginTop: 16 }}>
        <div
          style={{
            padding: '32px 16px',
            background: 'var(--color-background-alt)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--color-border-base)',
            marginBottom: 16,
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {emptyDescription ?? emptyMessage}
              </span>
            }
            imageStyle={{ height: 48 }}
          />
        </div>
        {onAllCardsViewed && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button type="primary" onClick={onAllCardsViewed} data-testid="carousel-continue">
              Continue
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div data-testid={dataTestId} style={{ marginTop: 16 }}>
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: CARD_GAP,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          paddingBottom: 8,
          marginBottom: 16,
        }}
      >
        {cards.map((child, i) => (
          <div
            key={i}
            style={{
              flex: '0 0 auto',
              width: 'min(400px, 85vw)',
              scrollSnapAlign: 'start',
            }}
          >
            {child}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
        {canScrollLeft && (
          <Button
            icon={<LeftOutlined />}
            onClick={() => scrollBy('left')}
            data-testid="carousel-prev"
          />
        )}
        <Button
          type="primary"
          onClick={handleNextOrContinue}
          data-testid={allViewed ? 'carousel-continue' : 'carousel-next'}
        >
          {allViewed ? 'Continue' : 'Next'}
        </Button>
      </div>
    </div>
  );
}

export default CardCarousel;
