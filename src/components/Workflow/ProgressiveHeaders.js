import React from 'react';
import { Card, Typography, Tag, Button, Space } from 'antd';
import {
  GlobalOutlined,
  UserOutlined,
  BulbOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  EditOutlined
} from '@ant-design/icons';
import { systemVoice } from '../../copy/systemVoice';

const { Text } = Typography;

/**
 * Progressive Headers Component
 * Shows stacked headers for completed workflow steps
 */
const ProgressiveHeaders = ({ 
  completedWorkflowSteps = [], 
  stepResults = {}, 
  onEditStep,
  className = ''
}) => {
  
  // Step configuration for progressive headers (one voice: systemVoice)
  const stepConfig = {
    website: {
      icon: <GlobalOutlined style={{ color: 'var(--color-primary)' }} />,
      title: systemVoice.progressiveSteps.website,
      getDescription: () => {
        const analysis = stepResults?.websiteAnalysis;
        const domain = analysis?.websiteUrl ?
          analysis.websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] :
          '';
        return systemVoice.progressiveSteps.getWebsiteDescription(domain, analysis?.businessType);
      }
    },
    strategy: {
      icon: <UserOutlined style={{ color: 'var(--color-success)' }} />,
      title: systemVoice.progressiveSteps.strategy,
      getDescription: () => {
        const strategy = stepResults?.selectedStrategy;
        return systemVoice.progressiveSteps.getStrategyDescription(strategy?.targetSegment?.demographics);
      }
    },
    topic: {
      icon: <BulbOutlined style={{ color: 'var(--color-accent)' }} />,
      title: systemVoice.progressiveSteps.topic,
      getDescription: () => {
        const topic = stepResults?.selectedTopic;
        return systemVoice.progressiveSteps.getTopicDescription(topic?.title);
      }
    },
    content: {
      icon: <FileTextOutlined style={{ color: 'var(--color-primary)' }} />,
      title: systemVoice.progressiveSteps.content,
      getDescription: () => {
        const content = stepResults?.finalContent || stepResults?.generatedContent;
        const wordCount = content ? content.split(' ').length : 0;
        return systemVoice.progressiveSteps.getContentDescription(wordCount);
      }
    }
  };

  // Don't render anything if no completed steps
  if (!completedWorkflowSteps || completedWorkflowSteps.length === 0) {
    return null;
  }

  return (
    <div 
      className={className}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--color-background-alt)',
        borderBottom: '1px solid var(--color-border-base)',
        padding: '8px 0'
      }}
    >
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '4px',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px'
      }}>
        {completedWorkflowSteps.map((stepKey, index) => {
          const config = stepConfig[stepKey];
          if (!config) return null;

          const isLast = index === completedWorkflowSteps.length - 1;

          return (
            <Card
              key={stepKey}
              className="progressive-step-enter"
              size="small"
              style={{
                marginBottom: 0,
                backgroundColor: isLast ? 'var(--color-background-elevated)' : 'var(--color-background-alt)',
                border: isLast ? '1px solid var(--color-border-base)' : '1px solid var(--color-border-light)',
                borderRadius: '6px',
                cursor: onEditStep ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                animationDelay: `${index * 80}ms`,
                opacity: 0,
              }}
              bodyStyle={{ 
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onClick={() => onEditStep && onEditStep(stepKey)}
              hoverable={!!onEditStep}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {config.icon}
                <div>
                  <Text strong style={{ fontSize: '14px' }}>
                    {config.title}
                  </Text>
                  <Text 
                    type="secondary" 
                    style={{ 
                      fontSize: '12px',
                      marginLeft: '8px'
                    }}
                  >
                    {config.getDescription()}
                  </Text>
                </div>
              </div>
              
              <Space>
                <Tag 
                  icon={<CheckCircleOutlined />} 
                  color="success"
                  style={{ fontSize: '11px', margin: 0 }}
                >
                  {systemVoice.progressiveSteps.complete}
                </Tag>
                {onEditStep && (
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    style={{ padding: '4px 8px' }}
                  >
                    {systemVoice.progressiveSteps.edit}
                  </Button>
                )}
              </Space>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressiveHeaders;