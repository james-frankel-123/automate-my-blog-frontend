import React, { useState } from 'react';
import { Badge, Button, Popover, List, Typography, Space } from 'antd';
import { LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useJob } from '../../contexts/JobContext';
import JobProgressModal from './JobProgressModal';

const { Text } = Typography;

/**
 * JobStatusBadge - Shows active jobs count in header
 * 
 * Features:
 * - Badge showing count of active jobs
 * - Popover showing list of active jobs
 * - Click to open job progress modal
 */
const JobStatusBadge = () => {
  const { activeJobs, getActiveJobsCount, getJob } = useJob();
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const activeJobsCount = getActiveJobsCount();
  const activeJobsList = Object.values(activeJobs).filter(
    job => job.status === 'queued' || job.status === 'running'
  );

  if (activeJobsCount === 0) {
    return null;
  }

  const handleJobClick = (jobId) => {
    setSelectedJobId(jobId);
    setModalVisible(true);
  };

  const getJobStatusIcon = (status) => {
    switch (status) {
      case 'queued':
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      case 'running':
        return <LoadingOutlined style={{ color: '#52c41a' }} spin />;
      case 'succeeded':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return null;
    }
  };

  const getJobTypeLabel = (type) => {
    const labels = {
      'website-analysis': 'Website Analysis',
      'content-generation': 'Content Generation',
      'image-generation': 'Image Generation',
      'seo-analysis': 'SEO Analysis'
    };
    return labels[type] || type;
  };

  const content = (
    <div style={{ width: '300px' }}>
      <Text strong style={{ marginBottom: '8px', display: 'block' }}>
        Active Jobs ({activeJobsCount})
      </Text>
      <List
        size="small"
        dataSource={activeJobsList}
        renderItem={(job) => (
          <List.Item
            style={{ cursor: 'pointer', padding: '8px' }}
            onClick={() => handleJobClick(job.jobId)}
          >
            <Space>
              {getJobStatusIcon(job.status)}
              <div>
                <Text strong style={{ fontSize: '12px' }}>
                  {getJobTypeLabel(job.type)}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {job.currentStep || job.status}
                  {job.progress > 0 && ` - ${job.progress}%`}
                </Text>
              </div>
            </Space>
          </List.Item>
        )}
      />
      {activeJobsList.length === 0 && (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          No active jobs
        </Text>
      )}
    </div>
  );

  return (
    <>
      <Popover content={content} title="Job Status" trigger="click" placement="bottomRight">
        <Badge count={activeJobsCount} showZero={false}>
          <Button
            type="text"
            icon={<LoadingOutlined spin={activeJobsCount > 0} />}
            style={{ color: activeJobsCount > 0 ? '#1890ff' : undefined }}
          >
            Jobs
          </Button>
        </Badge>
      </Popover>
      
      {selectedJobId && (
        <JobProgressModal
          jobId={selectedJobId}
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setSelectedJobId(null);
          }}
        />
      )}
    </>
  );
};

export default JobStatusBadge;
