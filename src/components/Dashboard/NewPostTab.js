import React from 'react';
import { Typography } from 'antd';
import WorkflowContainerV2 from '../Workflow/WorkflowContainer-v2';

const { Title, Text } = Typography;

const NewPostTab = ({ workflowContent, showWorkflow = true }) => {
  // If workflow content is provided (user transitioning from simple workflow), show that
  if (workflowContent && showWorkflow) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {workflowContent}
      </div>
    );
  }

  // UPDATED: Now shows the refactored workflow with proper component structure
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>Create New Blog Post</Title>
        <Text style={{ color: '#666', fontSize: '16px' }}>
          Generate AI-powered blog posts tailored to your audience and brand
        </Text>
      </div>

      {/* UPDATED: Use refactored WorkflowContainer-v2 with all temporal dead zone fixes */}
      <WorkflowContainerV2 embedded={true} />
    </div>
  );
};

export default NewPostTab;