import React from 'react';
import { Skeleton, Table } from 'antd';

/**
 * TableSkeleton - Skeleton loader for table rows
 * Matches the layout of Ant Design tables
 */
const TableSkeleton = ({ columns = 4, rows = 5 }) => {
  const skeletonColumns = Array.from({ length: columns }).map((_, index) => ({
    title: <Skeleton.Input active size="small" style={{ width: '100px' }} />,
    dataIndex: `col${index}`,
    key: `col${index}`,
    render: () => <Skeleton.Input active size="small" style={{ width: '80%' }} />
  }));

  const skeletonData = Array.from({ length: rows }).map((_, rowIndex) => ({
    key: `row${rowIndex}`,
    ...Object.fromEntries(
      Array.from({ length: columns }).map((_, colIndex) => [
        `col${colIndex}`,
        null
      ])
    )
  }));

  return (
    <Table
      columns={skeletonColumns}
      dataSource={skeletonData}
      pagination={false}
      loading={false}
    />
  );
};

export default TableSkeleton;
