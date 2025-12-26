import React from 'react';
import { Card, Button, Typography, Row, Col } from 'antd';
import { BulbOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const TopicSelectionStep = ({
  currentStep,
  setCurrentStep,
  stepResults,
  selectedTopic,
  setSelectedTopic,
  isLoading,
  user,
  requireAuth
}) => {

  // EXTRACTED FROM APP.JS: Continue to content generation
  const continueToContentGeneration = () => {
    setCurrentStep(3);
  };

  return (
    <>
      {/* EXTRACTED FROM APP.JS: Step 2 - Topic Selection */}
      {currentStep === 2 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <BulbOutlined 
              style={{ 
                fontSize: '64px', 
                color: '#fa8c16', 
                marginBottom: '24px'
              }} 
            />
            
            <Title level={2} style={{ marginBottom: '16px' }}>
              Choose Your Topic
            </Title>
            
            <Paragraph style={{ fontSize: '16px', marginBottom: '32px' }}>
              AI-generated trending topics based on your business analysis will appear here.
            </Paragraph>

            {/* Placeholder for topic cards */}
            <div style={{ marginBottom: '32px' }}>
              <Text>Topic selection interface will be implemented here...</Text>
            </div>

            <Row gutter={16} justify="center">
              <Col>
                <Button 
                  type="primary" 
                  size="large"
                  onClick={continueToContentGeneration}
                  style={{ minWidth: '200px' }}
                >
                  Continue to Content Creation
                </Button>
              </Col>
            </Row>
          </div>
        </Card>
      )}
    </>
  );
};

export default TopicSelectionStep;