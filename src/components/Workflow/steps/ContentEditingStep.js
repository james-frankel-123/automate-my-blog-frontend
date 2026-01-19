import React from 'react';
import { Card, Button, Typography, Row, Col, Input } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import HTMLPreview from '../../HTMLPreview/HTMLPreview';

const { Title, Text, Paragraph, TextArea } = Input;

const ContentEditingStep = ({
  currentStep,
  setCurrentStep,
  generatedContent,
  setGeneratedContent,
  previewMode,
  setPreviewMode,
  user,
  requireAuth
}) => {

  // EXTRACTED FROM APP.JS: Continue to export
  const continueToExport = () => {
    setCurrentStep(5);
  };

  // EXTRACTED FROM APP.JS: Handle content change
  const handleContentChange = (e) => {
    setGeneratedContent(e.target.value);
  };

  return (
    <>
      {/* EXTRACTED FROM APP.JS: Step 4 - Content Editing */}
      {currentStep === 4 && (
        <Card>
          <div style={{ padding: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <EyeOutlined 
                style={{ 
                  fontSize: '48px', 
                  color: '#722ed1', 
                  marginBottom: '16px'
                }} 
              />
              <Title level={2} style={{ marginBottom: '8px' }}>
                Edit Your Content
              </Title>
              <Text style={{ fontSize: '16px', color: '#666' }}>
                Review and customize your AI-generated blog post
              </Text>
            </div>

            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <Button.Group>
                <Button 
                  type={!previewMode ? "primary" : "default"}
                  onClick={() => setPreviewMode(false)}
                >
                  Edit Mode
                </Button>
                <Button 
                  type={previewMode ? "primary" : "default"}
                  onClick={() => setPreviewMode(true)}
                >
                  Preview Mode
                </Button>
              </Button.Group>
            </div>

            {previewMode ? (
              <div style={{ minHeight: '400px', border: '1px solid #d9d9d9', padding: '20px', borderRadius: '6px' }}>
                <Title level={4} style={{ marginBottom: '16px' }}>
                  Preview
                </Title>
                <HTMLPreview
                  content={generatedContent || 'No content generated yet...'}
                  style={{
                    minHeight: '300px',
                    fontFamily: 'serif',
                    lineHeight: '1.6'
                  }}
                />
              </div>
            ) : (
              <div>
                <Title level={4} style={{ marginBottom: '16px' }}>Edit Content</Title>
                <TextArea
                  value={generatedContent}
                  onChange={handleContentChange}
                  rows={20}
                  style={{ fontFamily: 'monospace', fontSize: '14px' }}
                  placeholder="Your generated content will appear here..."
                />
              </div>
            )}
            
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <Row gutter={16} justify="center">
                <Col>
                  <Button 
                    onClick={() => setCurrentStep(3)}
                    size="large"
                  >
                    Back to Generation
                  </Button>
                </Col>
                <Col>
                  <Button 
                    type="primary" 
                    size="large"
                    onClick={continueToExport}
                    style={{ minWidth: '200px' }}
                  >
                    Continue to Export
                  </Button>
                </Col>
              </Row>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};

export default ContentEditingStep;