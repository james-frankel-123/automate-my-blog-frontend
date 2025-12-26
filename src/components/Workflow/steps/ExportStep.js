import React from 'react';
import { Card, Button, Typography, Row, Col } from 'antd';
import { FileMarkdownOutlined, FileTextOutlined, DatabaseOutlined, FileZipOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const ExportStep = ({
  currentStep,
  setCurrentStep,
  generatedContent,
  stepResults,
  websiteUrl,
  selectedCMS,
  cmsOptions,
  postState
}) => {

  // EXTRACTED FROM APP.JS: Export functions (placeholders)
  const exportAsMarkdown = () => {
    console.log('Export as Markdown');
    // Implementation to be added
  };

  const exportAsHTML = () => {
    console.log('Export as HTML');
    // Implementation to be added
  };

  const exportAsJSON = () => {
    console.log('Export as JSON');
    // Implementation to be added
  };

  const exportCompletePackage = () => {
    console.log('Export complete package');
    // Implementation to be added
  };

  const resetDemo = () => {
    window.location.reload();
  };

  // EXTRACTED FROM APP.JS: Get current post info
  const getCurrentPost = () => ({
    title: generatedContent?.split('\n').find(line => line.startsWith('# '))?.substring(2) || 'Blog Post Title',
    wordCount: Math.round((generatedContent?.length || 0) / 5),
    readingTime: Math.ceil((generatedContent?.length || 0) / 1000),
    category: 'Business',
    tags: ['AI Generated', 'Blog Post'],
  });

  return (
    <>
      {/* EXTRACTED FROM APP.JS: Step 5 - Export */}
      {currentStep === 5 && (
        <div>
          <Title level={2} style={{ textAlign: 'center', marginBottom: '16px', color: stepResults.websiteAnalysis.brandColors.primary }}>
            Download Your Blog Post
          </Title>
          
          <Paragraph style={{ textAlign: 'center', marginBottom: '30px', color: '#666', fontSize: '16px' }}>
            Your AI-generated blog post is ready! Choose your preferred format to download and publish anywhere.
            <br />
            <Text strong>Ready to use content in multiple formats!</Text>
          </Paragraph>

          <Card style={{ marginBottom: '20px' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <FileMarkdownOutlined style={{ fontSize: '48px', color: stepResults.websiteAnalysis.brandColors.primary, marginBottom: '16px' }} />
                  <Title level={4}>Markdown</Title>
                  <Text style={{ color: '#666', display: 'block', marginBottom: '16px' }}>
                    Perfect for Jekyll, Hugo, or GitHub Pages
                  </Text>
                  <Button 
                    type="primary" 
                    size="large"
                    onClick={exportAsMarkdown}
                    style={{ backgroundColor: stepResults.websiteAnalysis.brandColors.primary }}
                  >
                    Download .md
                  </Button>
                </div>
              </Col>
              
              <Col xs={24} md={12}>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <FileTextOutlined style={{ fontSize: '48px', color: stepResults.websiteAnalysis.brandColors.accent, marginBottom: '16px' }} />
                  <Title level={4}>HTML</Title>
                  <Text style={{ color: '#666', display: 'block', marginBottom: '16px' }}>
                    Copy-paste ready for any CMS
                  </Text>
                  <Button 
                    size="large"
                    onClick={exportAsHTML}
                    style={{ borderColor: stepResults.websiteAnalysis.brandColors.accent, color: stepResults.websiteAnalysis.brandColors.accent }}
                  >
                    Download .html
                  </Button>
                </div>
              </Col>
              
              <Col xs={24} md={12}>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <DatabaseOutlined style={{ fontSize: '48px', color: '#8FBC8F', marginBottom: '16px' }} />
                  <Title level={4}>JSON</Title>
                  <Text style={{ color: '#666', display: 'block', marginBottom: '16px' }}>
                    For developers and API integrations
                  </Text>
                  <Button 
                    size="large"
                    onClick={exportAsJSON}
                    style={{ borderColor: '#8FBC8F', color: '#8FBC8F' }}
                  >
                    Download .json
                  </Button>
                </div>
              </Col>
              
              <Col xs={24} md={12}>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <FileZipOutlined style={{ fontSize: '48px', color: '#FA8C16', marginBottom: '16px' }} />
                  <Title level={4}>Complete Package</Title>
                  <Text style={{ color: '#666', display: 'block', marginBottom: '16px' }}>
                    All formats + metadata in one ZIP
                  </Text>
                  <Button 
                    size="large"
                    onClick={exportCompletePackage}
                    style={{ borderColor: '#FA8C16', color: '#FA8C16' }}
                    disabled
                  >
                    Download ZIP
                  </Button>
                </div>
              </Col>
            </Row>
          </Card>

          <Card style={{ marginBottom: '20px', backgroundColor: stepResults.websiteAnalysis.brandColors.secondary + '20' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Text strong style={{ color: stepResults.websiteAnalysis.brandColors.primary }}>📝 Content Summary</Text>
                <br />
                <Text>Title: {getCurrentPost().title}</Text>
                <br />
                <Text>Word Count: {getCurrentPost().wordCount} words</Text>
                <br />
                <Text>Reading Time: {getCurrentPost().readingTime} minutes</Text>
              </Col>
              <Col xs={24} md={8}>
                <Text strong style={{ color: stepResults.websiteAnalysis.brandColors.primary }}>🏷️ Metadata</Text>
                <br />
                <Text>Category: {getCurrentPost().category}</Text>
                <br />
                <Text>Tags: {getCurrentPost().tags.join(', ')}</Text>
                <br />
                <Text>Source: {websiteUrl}</Text>
              </Col>
              <Col xs={24} md={8}>
                <Text strong style={{ color: stepResults.websiteAnalysis.brandColors.primary }}>🎨 Brand Colors</Text>
                <br />
                <div style={{ marginBottom: '8px' }}>
                  {Object.entries(stepResults.websiteAnalysis.brandColors).map(([key, color]) => (
                    <div key={key} style={{
                      display: 'inline-block',
                      width: '20px',
                      height: '20px',
                      backgroundColor: color,
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      marginRight: '4px'
                    }} title={`${key}: ${color}`} />
                  ))}
                </div>
                <br />
                <Text style={{ fontSize: '12px' }}>
                  Styled with your brand
                </Text>
              </Col>
            </Row>
          </Card>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <Row gutter={16} justify="center">
              <Col>
                <Button 
                  onClick={resetDemo} 
                  icon={<ReloadOutlined />}
                  size="large"
                >
                  Generate Another Post
                </Button>
              </Col>
              <Col>
                <Button 
                  onClick={() => setCurrentStep(4)} 
                  icon={<EditOutlined />}
                  size="large"
                >
                  Back to Edit Content
                </Button>
              </Col>
            </Row>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportStep;