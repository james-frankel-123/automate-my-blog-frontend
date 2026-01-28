import React from 'react';
import { Modal, Progress, Button, Typography, Space, Alert } from 'antd';
import { CloseOutlined, ReloadOutlined, StopOutlined } from '@ant-design/icons';
import { useJob } from '../../contexts/JobContext';

const { Text, Title } = Typography;

/**
 * JobProgressModal - Displays progress for a running job
 * 
 * Features:
 * - Progress bar (0-100%)
 * - Current step message
 * - Estimated time remaining
 * - Cancel button
 * - Error display with retry option
 */
const JobProgressModal = ({ jobId, visible, onClose }) => {
  const { getJob, cancelJob, retryJob, removeJob } = useJob();
  const job = getJob(jobId);

  if (!job) {
    return null;
  }

  const handleCancel = async () => {
    try {
      await cancelJob(jobId);
      onClose();
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  };

  const handleRetry = async () => {
    try {
      await retryJob(jobId);
      // Modal will stay open to show new job progress
    } catch (error) {
      console.error('Failed to retry job:', error);
    }
  };

  const handleClose = () => {
    if (job.status === 'succeeded' || job.status === 'failed') {
      removeJob(jobId);
    }
    onClose();
  };

  const getStatusColor = () => {
    switch (job.status) {
      case 'queued':
        return 'default';
      case 'running':
        return 'active';
      case 'succeeded':
        return 'success';
      case 'failed':
        return 'exception';
      default:
        return 'normal';
    }
  };

  const formatTimeRemaining = (seconds) => {
    if (!seconds) return 'Calculating...';
    if (seconds < 60) return `~${Math.round(seconds)} seconds`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
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

  return (
    <Modal
      title={
        <Space>
          <Title level={4} style={{ margin: 0 }}>
            {getJobTypeLabel(job.type)}
          </Title>
          {job.status === 'running' && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              In Progress
            </Text>
          )}
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      footer={[
        job.status === 'running' && (
          <Button
            key="cancel"
            danger
            icon={<StopOutlined />}
            onClick={handleCancel}
          >
            Cancel Job
          </Button>
        ),
        job.status === 'failed' && (
          <Button
            key="retry"
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleRetry}
          >
            Retry
          </Button>
        ),
        (job.status === 'succeeded' || job.status === 'failed') && (
          <Button key="close" onClick={handleClose}>
            Close
          </Button>
        )
      ].filter(Boolean)}
      closable={job.status !== 'running'}
      maskClosable={job.status !== 'running'}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Progress Bar */}
        {(job.status === 'queued' || job.status === 'running') && (
          <div>
            <Progress
              percent={job.progress || 0}
              status={getStatusColor()}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            {job.progress > 0 && (
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
                {job.progress}% complete
              </Text>
            )}
          </div>
        )}

        {/* Current Step */}
        {job.currentStep && (
          <div>
            <Text strong>Current Step:</Text>
            <br />
            <Text>{job.currentStep}</Text>
          </div>
        )}

        {/* Estimated Time Remaining */}
        {job.status === 'running' && job.estimatedTimeRemaining && (
          <div>
            <Text type="secondary">
              Estimated time remaining: {formatTimeRemaining(job.estimatedTimeRemaining)}
            </Text>
          </div>
        )}

        {/* Success State */}
        {job.status === 'succeeded' && (
          <Alert
            message="Job Completed Successfully"
            type="success"
            showIcon
            description={job.result?.message || 'Your job has been completed successfully.'}
          />
        )}

        {/* Error State */}
        {job.status === 'failed' && (
          <Alert
            message="Job Failed"
            type="error"
            showIcon
            description={
              <div>
                <Text>{job.error || 'An error occurred while processing your job.'}</Text>
                {job.result && (
                  <div style={{ marginTop: '8px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {JSON.stringify(job.result, null, 2)}
                    </Text>
                  </div>
                )}
              </div>
            }
          />
        )}

        {/* Job Metadata */}
        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '12px' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Job ID: {job.jobId}
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Started: {new Date(job.createdAt).toLocaleString()}
            </Text>
            {job.updatedAt && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Last updated: {new Date(job.updatedAt).toLocaleString()}
              </Text>
            )}
          </Space>
        </div>
      </Space>
    </Modal>
  );
};

export default JobProgressModal;
