import React, { useState } from 'react';
import { 
  Modal, 
  Card, 
  Form, 
  Input, 
  Button, 
  Upload, 
  Tabs, 
  Typography, 
  Row, 
  Col, 
  Space, 
  message, 
  Progress,
  Tag,
  Divider
} from 'antd';
import { 
  UploadOutlined, 
  PlusOutlined, 
  FileTextOutlined, 
  DeleteOutlined,
  CloudUploadOutlined 
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import autoBlogAPI from '../../services/api';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

const ContentUploadModal = ({ visible, onClose, onSuccess }) => {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  
  // Manual posts state
  const [manualPosts, setManualPosts] = useState([
    { title: '', content: '', author: '', url: '', metaDescription: '' }
  ]);
  
  // File upload state
  const [fileList, setFileList] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const addManualPost = () => {
    setManualPosts([
      ...manualPosts,
      { title: '', content: '', author: '', url: '', metaDescription: '' }
    ]);
  };

  const removeManualPost = (index) => {
    if (manualPosts.length > 1) {
      setManualPosts(manualPosts.filter((_, i) => i !== index));
    }
  };

  const updateManualPost = (index, field, value) => {
    const updated = [...manualPosts];
    updated[index][field] = value;
    setManualPosts(updated);
  };

  const handleManualUpload = async () => {
    if (!currentOrganization?.id) {
      message.error('No organization found. Please make sure you are logged in.');
      return;
    }

    // Validate posts
    const validPosts = manualPosts.filter(post => post.title.trim() && post.content.trim());
    if (validPosts.length === 0) {
      message.error('Please add at least one post with title and content.');
      return;
    }

    setLoading(true);
    try {
      const response = await autoBlogAPI.uploadManualPosts(currentOrganization.id, validPosts);
      
      if (response.success) {
        message.success(`Successfully uploaded ${response.processedPosts.length} blog posts!`);
        
        // Reset form
        setManualPosts([
          { title: '', content: '', author: '', url: '', metaDescription: '' }
        ]);
        
        if (onSuccess) onSuccess(response);
        onClose();
      }
    } catch (error) {
      message.error(`Upload failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!currentOrganization?.id) {
      message.error('No organization found. Please make sure you are logged in.');
      return;
    }

    if (fileList.length === 0) {
      message.error('Please select files to upload.');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    
    try {
      const files = fileList.map(file => file.originFileObj);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await autoBlogAPI.uploadBlogExports(currentOrganization.id, files);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (response.success) {
        message.success(`Successfully processed ${response.extractedPosts.length} blog posts from ${response.processedFiles.length} files!`);
        
        // Reset form
        setFileList([]);
        setUploadProgress(0);
        
        if (onSuccess) onSuccess(response);
        onClose();
      }
    } catch (error) {
      message.error(`File upload failed: ${error.message}`);
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    fileList,
    beforeUpload: () => false, // Prevent automatic upload
    onChange: ({ fileList }) => setFileList(fileList),
    multiple: true,
    accept: '.txt,.md,.csv,.json,.html,.xml,.wordpress,.wpress',
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
  };

  return (
    <Modal
      title="Upload Blog Content"
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* Manual Entry Tab */}
        <TabPane
          tab={
            <span>
              <PlusOutlined />
              Manual Entry
            </span>
          }
          key="manual"
        >
          <Card>
            <div style={{ marginBottom: '24px' }}>
              <Title level={4}>Enter Blog Posts Manually</Title>
              <Paragraph style={{ color: 'var(--color-text-secondary)' }}>
                Add your existing blog posts manually. This is useful for small numbers of posts 
                or when you want precise control over the content.
              </Paragraph>
            </div>

            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {manualPosts.map((post, index) => (
                <Card 
                  key={index}
                  size="small"
                  title={`Post ${index + 1}`}
                  extra={
                    manualPosts.length > 1 && (
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={() => removeManualPost(index)}
                        danger
                      />
                    )
                  }
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Title" required>
                        <Input
                          placeholder="Enter blog post title"
                          value={post.title}
                          onChange={(e) => updateManualPost(index, 'title', e.target.value)}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Author">
                        <Input
                          placeholder="Enter author name"
                          value={post.author}
                          onChange={(e) => updateManualPost(index, 'author', e.target.value)}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Form.Item label="Content" required>
                    <TextArea
                      rows={6}
                      placeholder="Enter the full blog post content..."
                      value={post.content}
                      onChange={(e) => updateManualPost(index, 'content', e.target.value)}
                    />
                  </Form.Item>
                  
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="URL Slug">
                        <Input
                          placeholder="post-url-slug"
                          value={post.url}
                          onChange={(e) => updateManualPost(index, 'url', e.target.value)}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Meta Description">
                        <Input
                          placeholder="Brief description for SEO"
                          value={post.metaDescription}
                          onChange={(e) => updateManualPost(index, 'metaDescription', e.target.value)}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              ))}
            </Space>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Space>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={addManualPost}
                >
                  Add Another Post
                </Button>
                <Button
                  type="primary"
                  icon={<CloudUploadOutlined />}
                  onClick={handleManualUpload}
                  loading={loading}
                  disabled={!manualPosts.some(post => post.title.trim() && post.content.trim())}
                >
                  Upload Posts
                </Button>
              </Space>
            </div>
          </Card>
        </TabPane>

        {/* File Upload Tab */}
        <TabPane
          tab={
            <span>
              <UploadOutlined />
              File Upload
            </span>
          }
          key="file"
        >
          <Card>
            <div style={{ marginBottom: '24px' }}>
              <Title level={4}>Upload Blog Export Files</Title>
              <Paragraph style={{ color: 'var(--color-text-secondary)' }}>
                Upload blog content from WordPress exports, CSV files, or other formats. 
                We support multiple file types and will automatically extract blog posts.
              </Paragraph>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <Upload.Dragger {...uploadProps} style={{ padding: '40px' }}>
                <p className="ant-upload-drag-icon">
                  <FileTextOutlined style={{ fontSize: '48px', color: 'var(--color-primary)' }} />
                </p>
                <p className="ant-upload-text" style={{ fontSize: '16px', fontWeight: 500 }}>
                  Click or drag files to this area to upload
                </p>
                <p className="ant-upload-hint" style={{ color: 'var(--color-text-secondary)' }}>
                  Supports: .txt, .md, .csv, .json, .html, .xml, .wordpress, .wpress
                  <br />
                  Maximum file size: 50MB per file
                </p>
              </Upload.Dragger>
            </div>

            {fileList.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={5}>Selected Files:</Title>
                <Space wrap>
                  {fileList.map((file, index) => (
                    <Tag key={index} closable onClose={() => uploadProps.onRemove(file)}>
                      {file.name}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}

            {uploadProgress > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <Progress 
                  percent={uploadProgress} 
                  status={uploadProgress === 100 ? 'success' : 'active'}
                />
              </div>
            )}

            <div style={{ textAlign: 'center' }}>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={handleFileUpload}
                loading={loading}
                disabled={fileList.length === 0}
                size="large"
              >
                Process Files
              </Button>
            </div>

            <Divider />
            
            <div style={{ textAlign: 'center' }}>
              <Title level={5} style={{ color: 'var(--color-text-secondary)' }}>Supported Export Formats</Title>
              <Space wrap>
                <Tag color="blue">WordPress XML</Tag>
                <Tag color="green">CSV Export</Tag>
                <Tag color="orange">JSON Export</Tag>
                <Tag color="purple">Markdown Files</Tag>
                <Tag color="cyan">HTML Files</Tag>
              </Space>
            </div>
          </Card>
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default ContentUploadModal;