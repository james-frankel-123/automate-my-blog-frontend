import React from 'react';
import { Card, Table, Alert } from 'antd';

const CohortRetentionChart = ({ data }) => {
  if (!data || !data.cohorts || data.cohorts.length === 0) {
    return (
      <Card title="Cohort Retention Analysis">
        <Alert
          message="No cohort data available"
          description="Not enough user activity data to analyze cohort retention yet."
          type="info"
          showIcon
        />
      </Card>
    );
  }

  const columns = [
    {
      title: 'Cohort Date',
      dataIndex: 'date',
      key: 'date',
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: 'Initial Users',
      dataIndex: 'users',
      key: 'users',
    },
    {
      title: 'Retention Data',
      dataIndex: 'retention',
      key: 'retention',
      render: (retention) => {
        if (!retention || retention.length === 0) return 'N/A';
        return `${retention.length} periods tracked`;
      },
    },
  ];

  return (
    <Card title="Cohort Retention Analysis">
      <Table
        dataSource={data.cohorts}
        columns={columns}
        rowKey="date"
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};

export default CohortRetentionChart;
