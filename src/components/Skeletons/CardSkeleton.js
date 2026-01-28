import React from 'react';
import { Skeleton, Card } from 'antd';

/**
 * CardSkeleton - Skeleton loader for dashboard cards
 * Matches the layout of dashboard stat cards
 */
const CardSkeleton = ({ count = 4, columns = 4 }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '16px',
        marginBottom: '24px'
      }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} style={{ borderRadius: '8px' }}>
          <Skeleton
            active
            title={{ width: '40%' }}
            paragraph={{
              rows: 2,
              width: ['100%', '60%']
            }}
          />
        </Card>
      ))}
    </div>
  );
};

export default CardSkeleton;
