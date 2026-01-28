import React from 'react';
import { Skeleton, Card } from 'antd';

/**
 * ChartSkeleton - Skeleton loader for chart placeholders
 * Matches the layout of chart components
 */
const ChartSkeleton = ({ height = 300, showTitle = true }) => {
  return (
    <Card style={{ borderRadius: '8px' }}>
      {showTitle && (
        <Skeleton
          active
          title={{ width: '30%' }}
          paragraph={false}
          style={{ marginBottom: '16px' }}
        />
      )}
      <Skeleton
        active
        paragraph={{
          rows: Math.floor(height / 30),
          width: ['100%', '95%', '90%', '85%', '80%']
        }}
        style={{ height: `${height}px` }}
      />
    </Card>
  );
};

export default ChartSkeleton;
