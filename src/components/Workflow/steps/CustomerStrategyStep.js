import React from 'react';
import { Card, Button, Typography, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const CustomerStrategyStep = ({
  currentStep,
  setCurrentStep,
  strategyCompleted,
  user,
  requireAuth
}) => {

  // EXTRACTED FROM APP.JS: Continue to next step
  const continueToTopicSelection = () => {
    setCurrentStep(2);
  };

  // This step appears to be mostly handled by the website analysis
  // keeping it as a placeholder for now
  return (
    <>
      {/* EXTRACTED FROM APP.JS: Step 1 - Customer Strategy (Placeholder) */}
      {currentStep === 1 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <SearchOutlined 
              style={{ 
                fontSize: '64px', 
                color: '#1890ff', 
                marginBottom: '24px'
              }} 
            />
            
            <Title level={2} style={{ marginBottom: '16px' }}>
              Strategy Selection
            </Title>
            
            <Paragraph style={{ fontSize: '16px', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px auto' }}>
              Based on your website analysis, we're preparing targeted content strategies for your business.
            </Paragraph>

            <Row gutter={16} justify="center">
              <Col>
                <Button 
                  type="primary" 
                  size="large"
                  onClick={continueToTopicSelection}
                  style={{ minWidth: '200px' }}
                >
                  Continue to Topic Selection
                </Button>
              </Col>
            </Row>
          </div>
        </Card>
      )}
    </>
  );
};

export default CustomerStrategyStep;