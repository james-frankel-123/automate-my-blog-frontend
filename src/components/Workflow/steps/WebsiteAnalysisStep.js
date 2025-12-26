import React from 'react';
import { Card, Button, Row, Col, Typography, Input, Form, Space, Tag } from 'antd';
import { GlobalOutlined, ScanOutlined, LoginOutlined, UserAddOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const WebsiteAnalysisStep = ({
  currentStep,
  setCurrentStep,
  websiteUrl,
  setWebsiteUrl,
  isLoading,
  scanningMessage,
  analysisCompleted,
  user,
  requireAuth,
  setNavContext
}) => {

  // EXTRACTED FROM APP.JS: Website URL handler
  const handleWebsiteSubmit = () => {
    if (websiteUrl.trim()) {
      setCurrentStep(1);
    }
  };

  // EXTRACTED FROM APP.JS: Continue to strategy handler
  const continueToStrategy = () => {
    if (!requireAuth('Continue to strategy selection', 'gate')) {
      return;
    }
    setCurrentStep(2);
  };

  // EXTRACTED FROM APP.JS: Go to dashboard handler
  const goToDashboard = () => {
    if (user) {
      setNavContext('workflow-transition');
    }
  };

  return (
    <>
      {/* EXTRACTED FROM APP.JS: Step 0 - Website URL Input */}
      {currentStep === 0 && (
        <Card>
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
              <ScanOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
              <Title level={2} style={{ margin: '0 0 8px 0' }}>
                Let's analyze your website
              </Title>
              <Text style={{ color: '#666', fontSize: '16px' }}>
                We'll scan your site to understand your business and create personalized blog content
              </Text>
            </div>
            
            <Form layout="vertical" onFinish={handleWebsiteSubmit}>
              <Form.Item
                help="Example: mystore.com, myblog.org, mycompany.net"
                style={{ marginBottom: '24px' }}
              >
                <Input
                  size="large"
                  placeholder="Enter your website URL"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  prefix={<GlobalOutlined />}
                  style={{ textAlign: 'center' }}
                  onPressEnter={handleWebsiteSubmit}
                />
              </Form.Item>
              
              <Button 
                type="primary" 
                size="large"
                htmlType="submit"
                disabled={!websiteUrl.trim()}
                style={{ minWidth: '200px' }}
              >
                Analyze Website
              </Button>
            </Form>

            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <Text style={{ color: '#666', fontSize: '14px' }}>
                ✓ AI-powered website analysis  ✓ Personalized content strategy  ✓ SEO optimization
              </Text>
            </div>
          </div>
        </Card>
      )}

      {/* EXTRACTED FROM APP.JS: Step 1 - Website Analysis in Progress */}
      {currentStep === 1 && !analysisCompleted && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <ScanOutlined 
              style={{ 
                fontSize: '64px', 
                color: '#1890ff', 
                marginBottom: '24px',
                animation: 'pulse 2s infinite'
              }} 
            />
            
            <Title level={2} style={{ marginBottom: '16px' }}>
              Analyzing Your Website
            </Title>
            
            <div style={{ marginBottom: '32px' }}>
              <Text style={{ fontSize: '16px', color: '#666', display: 'block', marginBottom: '16px' }}>
                {scanningMessage}
              </Text>
            </div>

            <div style={{ 
              background: 'linear-gradient(90deg, #1890ff 0%, #40a9ff 50%, #69c0ff 100%)', 
              height: '4px', 
              borderRadius: '2px',
              overflow: 'hidden',
              marginBottom: '24px'
            }}>
              <div style={{
                width: '30%',
                height: '100%',
                background: 'rgba(255,255,255,0.8)',
                animation: 'loading 2s ease-in-out infinite'
              }} />
            </div>

            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '16px', 
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <Text style={{ color: '#666', fontSize: '14px' }}>
                🔍 Reading content  •  🎨 Analyzing design  •  👥 Understanding audience  •  📊 Research insights
              </Text>
            </div>
          </div>
        </Card>
      )}

      {/* EXTRACTED FROM APP.JS: Step 1 - Analysis Complete */}
      {currentStep === 1 && analysisCompleted && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              backgroundColor: '#52c41a', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 24px auto'
            }}>
              <span style={{ fontSize: '32px', color: 'white' }}>✓</span>
            </div>
            
            <Title level={2} style={{ color: '#52c41a', marginBottom: '16px' }}>
              Website Analysis Complete!
            </Title>
            
            <Paragraph style={{ fontSize: '16px', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px auto' }}>
              We've successfully analyzed your website and understand your business. 
              Ready to create targeted content for your audience?
            </Paragraph>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {user ? (
                <Row gutter={16} justify="center">
                  <Col>
                    <Button 
                      type="primary" 
                      size="large"
                      onClick={continueToStrategy}
                      style={{ minWidth: '200px' }}
                    >
                      Continue to Strategy
                    </Button>
                  </Col>
                  <Col>
                    <Button 
                      size="large"
                      onClick={goToDashboard}
                    >
                      Go to Dashboard
                    </Button>
                  </Col>
                </Row>
              ) : (
                <Row gutter={16} justify="center">
                  <Col>
                    <Button 
                      type="primary" 
                      size="large"
                      onClick={continueToStrategy}
                      style={{ minWidth: '200px' }}
                      icon={<LoginOutlined />}
                    >
                      Continue with Account
                    </Button>
                  </Col>
                </Row>
              )}

              <div style={{ marginTop: '24px' }}>
                <Tag color="green">Business Analysis Complete</Tag>
                <Tag color="blue">Target Audience Identified</Tag>
                <Tag color="orange">Content Strategy Ready</Tag>
              </div>
            </Space>
          </div>
        </Card>
      )}
    </>
  );
};

export default WebsiteAnalysisStep;