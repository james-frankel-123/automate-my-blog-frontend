import React from 'react';
import { Card, Button, Typography, Row, Col } from 'antd';
import { EditOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const ContentGenerationStep = ({
  currentStep,
  setCurrentStep,
  generatedContent,
  isLoading,
  blogGenerating,
  user,
  requireAuth
}) => {

  // EXTRACTED FROM APP.JS: Continue to content editing
  const continueToContentEditing = () => {
    setCurrentStep(4);
  };

  return (
    <>
      {/* EXTRACTED FROM APP.JS: Step 3 - Content Generation */}
      {currentStep === 3 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <EditOutlined 
              style={{ 
                fontSize: '64px', 
                color: '#52c41a', 
                marginBottom: '24px'
              }} 
            />
            
            <Title level={2} style={{ marginBottom: '16px' }}>
              Creating Your Content
            </Title>
            
            {blogGenerating ? (
              <div>
                <Paragraph style={{ fontSize: '16px', marginBottom: '32px' }}>
                  AI is writing your personalized blog post...
                </Paragraph>
                <div>Content generation in progress...</div>
              </div>
            ) : (
              <div>
                <Paragraph style={{ fontSize: '16px', marginBottom: '32px' }}>
                  Content generation interface will be implemented here.
                </Paragraph>
                
                <Row gutter={16} justify="center">
                  <Col>
                    <Button 
                      type="primary" 
                      size="large"
                      onClick={continueToContentEditing}
                      style={{ minWidth: '200px' }}
                    >
                      Continue to Editing
                    </Button>
                  </Col>
                </Row>
              </div>
            )}
          </div>
        </Card>
      )}
    </>
  );
};

export default ContentGenerationStep;