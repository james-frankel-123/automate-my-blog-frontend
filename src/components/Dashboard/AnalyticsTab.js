import React from 'react';
import { Card, Empty } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';

const AnalyticsTab = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Card title="Analytics">
        <Empty
          description="No analytics data yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          imageStyle={{ height: 60 }}
        >
          <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>
            <BarChartOutlined style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }} />
            Create some blog posts to see analytics data here
          </div>
        </Empty>
      </Card>
    </div>
  );
};

export default AnalyticsTab;