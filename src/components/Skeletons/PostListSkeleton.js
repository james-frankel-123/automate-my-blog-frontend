import React from 'react';
import { Skeleton, Card } from 'antd';

/**
 * PostListSkeleton - Skeleton loader for post list items
 * Matches the layout of actual post list items
 */
const PostListSkeleton = ({ count = 3 }) => {
  return (
    <div>
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          style={{
            marginBottom: '16px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Skeleton
            active
            avatar={{ shape: 'square', size: 80 }}
            title={{ width: '60%' }}
            paragraph={{
              rows: 3,
              width: ['100%', '80%', '60%']
            }}
          />
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <Skeleton.Button active size="small" style={{ width: '80px' }} />
            <Skeleton.Button active size="small" style={{ width: '80px' }} />
          </div>
        </Card>
      ))}
    </div>
  );
};

export default PostListSkeleton;
