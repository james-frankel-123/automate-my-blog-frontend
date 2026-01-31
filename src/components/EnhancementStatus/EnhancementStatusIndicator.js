import React from 'react';
import { Card, Badge, Tooltip, Typography, List, Alert, Button } from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  InfoCircleOutlined,
  RocketOutlined,
  EyeOutlined,
  SettingOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

/**
 * Enhancement Status Indicator Component
 * Shows real-time feedback about enhanced blog generation capabilities
 */
const EnhancementStatusIndicator = ({ 
  enhancementStatus, 
  onShowManualInputs,
  onViewDataSources,
  style = {} 
}) => {
  if (!enhancementStatus) return null;

  const getStatusConfig = () => {
    switch (enhancementStatus.status) {
      case 'enhanced':
        return {
          color: 'success',
          icon: <CheckCircleOutlined />,
          title: 'Enhanced Generation Active',
          type: 'success'
        };
      case 'limited':
        return {
          color: 'warning',
          icon: <ExclamationCircleOutlined />,
          title: 'Partial Enhancement Available',
          type: 'warning'
        };
      default:
        return {
          color: 'default',
          icon: <InfoCircleOutlined />,
          title: 'Basic Generation',
          type: 'info'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Card 
      size="small" 
      style={{
        marginBottom: 16,
        border: enhancementStatus.status === 'enhanced' ? '2px solid #52c41a' : undefined,
        ...style
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <Badge 
          status={statusConfig.color} 
          style={{ marginRight: 8 }}
        />
        {statusConfig.icon}
        <Title level={5} style={{ margin: 0, marginLeft: 8 }}>
          {statusConfig.title}
        </Title>
        {enhancementStatus.status === 'enhanced' && (
          <Tooltip title="Using advanced AI with your organization data">
            <RocketOutlined style={{ marginLeft: 8, color: '#52c41a' }} />
          </Tooltip>
        )}
      </div>

      <Alert
        message={enhancementStatus.message}
        type={statusConfig.type}
        showIcon
        style={{ marginBottom: 12 }}
      />

      {/* Data Completeness Indicator */}
      <div style={{ marginBottom: 12 }}>
        <Text strong>Data Completeness: </Text>
        <Badge 
          color={
            enhancementStatus.dataCompleteness === 'high' ? '#52c41a' :
            enhancementStatus.dataCompleteness === 'medium' ? '#faad14' : '#ff4d4f'
          }
          text={enhancementStatus.dataCompleteness.toUpperCase()}
        />
        {enhancementStatus.dataCompleteness === 'low' && (
          <Tooltip title="Add manual inputs or complete website analysis to improve quality">
            <InfoCircleOutlined style={{ marginLeft: 4, color: 'var(--color-primary)' }} />
          </Tooltip>
        )}
      </div>

      {/* Available Capabilities */}
      {enhancementStatus.capabilities.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Text strong>Active Features:</Text>
          <List
            size="small"
            dataSource={enhancementStatus.capabilities}
            renderItem={(capability) => (
              <List.Item style={{ padding: '2px 0', border: 'none' }}>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                <Text style={{ fontSize: '12px' }}>{capability}</Text>
              </List.Item>
            )}
          />
        </div>
      )}

      {/* Missing Data Reasons */}
      {enhancementStatus.reasons.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Text strong>To Improve Quality:</Text>
          <List
            size="small"
            dataSource={enhancementStatus.reasons}
            renderItem={(reason) => (
              <List.Item style={{ padding: '2px 0', border: 'none' }}>
                <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 4 }} />
                <Text style={{ fontSize: '12px' }}>{reason}</Text>
              </List.Item>
            )}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {enhancementStatus.status !== 'enhanced' && onShowManualInputs && (
          <Button 
            size="small" 
            icon={<SettingOutlined />}
            onClick={onShowManualInputs}
          >
            Add Manual Inputs
          </Button>
        )}
        
        {onViewDataSources && (
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={onViewDataSources}
          >
            View Data Sources
          </Button>
        )}
      </div>

      {/* Organization Info */}
      {enhancementStatus.organizationId && (
        <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Organization: {enhancementStatus.organizationId.slice(0, 8)}...
          </Text>
        </div>
      )}
    </Card>
  );
};

export default EnhancementStatusIndicator;