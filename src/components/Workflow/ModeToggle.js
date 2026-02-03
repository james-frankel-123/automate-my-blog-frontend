import React from 'react';
import { Button, Space, Typography, Divider } from 'antd';
import { 
  EyeOutlined, 
  PlayCircleOutlined, 
  ArrowLeftOutlined, 
  ArrowRightOutlined,
  SettingOutlined,
  EditOutlined
} from '@ant-design/icons';

const { Text } = Typography;

/**
 * ModeToggle Component
 * Provides UI controls for switching between Focus and Workflow modes
 * and navigation within workflow mode
 */
const ModeToggle = ({ 
  mode,
  tabKey,
  workflowStep,
  showModeToggle,
  showWorkflowNavigation,
  showNextButton,
  showPreviousButton,
  nextButtonText,
  previousButtonText,
  canEnterWorkflow,
  onEnterWorkflowMode,
  onExitToFocusMode,
  onContinueToNextStep,
  onGoToPreviousStep,
  onSaveStepData,
  stepData = null,
  className = '',
  style = {}
}) => {
  
  if (!showModeToggle && !showWorkflowNavigation) {
    return null;
  }
  
  return (
    <div 
      className={className}
      style={{
        padding: '12px 16px',
        backgroundColor: mode === 'workflow' ? '#f0f2ff' : '#fafafa',
        borderBottom: '1px solid #e8e8e8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...style
      }}
    >
      {/* Mode Information */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {mode === 'workflow' && (
          <>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              animation: 'pulse 2s infinite'
            }} />
            <Text style={{ fontWeight: 500, color: 'var(--color-primary)' }}>
              Workflow Mode: {workflowStep?.title || 'Guided Creation'}
            </Text>
          </>
        )}
        
        {mode === 'focus' && (
          <>
            <EyeOutlined style={{ color: 'var(--color-success)' }} />
            <Text style={{ fontWeight: 500, color: 'var(--color-success)' }}>
              Focus Mode: Complete Management
            </Text>
          </>
        )}
      </div>
      
      {/* Mode Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Workflow Navigation */}
        {showWorkflowNavigation && (
          <Space size="small">
            {showPreviousButton && (
              <Button
                size="small"
                icon={<ArrowLeftOutlined />}
                onClick={onGoToPreviousStep}
              >
                {previousButtonText}
              </Button>
            )}
            
            {showNextButton && stepData && (
              <Button
                type="primary"
                size="small"
                icon={<ArrowRightOutlined />}
                onClick={() => onContinueToNextStep(stepData)}
              >
                {nextButtonText}
              </Button>
            )}
          </Space>
        )}
        
        {/* Mode Toggle Buttons */}
        {showModeToggle && (
          <>
            {showWorkflowNavigation && <Divider type="vertical" />}
            
            <Space size="small">
              {mode === 'workflow' && (
                <Button
                  size="small"
                  icon={<SettingOutlined />}
                  onClick={onExitToFocusMode}
                  title="Exit to Focus Mode for complete management"
                >
                  Manage All
                </Button>
              )}
              
              {mode === 'focus' && canEnterWorkflow && (
                <Button
                  type="primary"
                  size="small"
                  icon={<PlayCircleOutlined />}
                  onClick={onEnterWorkflowMode}
                  title="Enter Workflow Mode for guided creation"
                >
                  Continue Creation
                </Button>
              )}
            </Space>
          </>
        )}
      </div>
      
      {/* Pulse animation CSS */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

/**
 * WorkflowGuidance Component
 * Provides contextual guidance text for workflow mode
 */
export const WorkflowGuidance = ({ 
  step, 
  totalSteps, 
  stepTitle, 
  stepDescription,
  className = '',
  style = {} 
}) => {
  return (
    <div 
      className={className}
      style={{
        padding: '16px',
        backgroundColor: 'var(--color-success-bg)',
        border: '1px solid var(--color-success-border)',
        borderRadius: '6px',
        marginBottom: '16px',
        ...style
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <div style={{
          backgroundColor: 'var(--color-success)',
          color: '#ffffff',
          borderRadius: '12px',
          padding: '2px 8px',
          fontSize: '12px',
          fontWeight: 500
        }}>
          Step {step} of {totalSteps}
        </div>
        <Text strong style={{ color: 'var(--color-success-dark)' }}>{stepTitle}</Text>
      </div>
      {stepDescription && (
        <Text style={{ color: 'var(--color-success)', fontSize: '14px' }}>
          {stepDescription}
        </Text>
      )}
    </div>
  );
};

export default ModeToggle;