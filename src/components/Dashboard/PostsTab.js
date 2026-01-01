import React, { useState, useEffect } from 'react';
import { Card, Button, Empty, Table, Tag, Dropdown, Space, Switch, Divider, Input, Select, Row, Col, Typography, message } from 'antd';
import { 
  PlusOutlined, 
  CalendarOutlined, 
  UnorderedListOutlined, 
  ScheduleOutlined,
  EditOutlined,
  ExportOutlined,
  MoreOutlined,
  BulbOutlined,
  EyeOutlined,
  DatabaseOutlined,
  CheckOutlined,
  ReloadOutlined,
  LockOutlined
} from '@ant-design/icons';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import { useTabMode } from '../../hooks/useTabMode';
import { useWorkflowMode } from '../../contexts/WorkflowModeContext';
import ModeToggle, { WorkflowGuidance } from '../Workflow/ModeToggle';
import api from '../../services/api';
import { topicAPI, contentAPI } from '../../services/workflowAPI';
import SchedulingModal from '../Modals/SchedulingModal';
import { ComponentHelpers } from '../Workflow/interfaces/WorkflowComponentInterface';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// DUMMY DATA - Remove when backend integration complete
const dummyPosts = [
  {
    id: 'dummy_1',
    title: 'How to Improve Team Productivity with AI Tools',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    status: 'draft',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
    exportCount: 0,
    isDummy: true
  },
  {
    id: 'dummy_2', 
    title: 'Complete Guide to Remote Team Management',
    content: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...',
    status: 'scheduled', // DUMMY DATA
    scheduledDate: '2024-01-15T14:00:00Z', // DUMMY DATA
    scheduledPlatform: 'wordpress', // DUMMY DATA
    notifyOnPublish: true, // DUMMY DATA
    createdAt: '2023-12-28T10:00:00Z',
    updatedAt: '2023-12-28T10:00:00Z',
    exportCount: 1,
    isDummy: true
  },
  {
    id: 'dummy_3',
    title: 'Marketing Automation Best Practices for 2024',
    content: 'Ut enim ad minim veniam, quis nostrud exercitation...',
    status: 'published', // DUMMY DATA
    publishedDate: '2023-12-20T09:00:00Z', // DUMMY DATA
    publishedPlatform: 'medium', // DUMMY DATA
    createdAt: '2023-12-19T15:30:00Z',
    updatedAt: '2023-12-20T09:00:00Z',
    exportCount: 3,
    isDummy: true
  }
];

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {
    'en-US': enUS,
  },
});

const PostsTab = () => {
  const { user } = useAuth();
  const tabMode = useTabMode('posts');
  const { 
    selectedTopic: workflowSelectedTopic,
    setSelectedTopic: setWorkflowSelectedTopic,
    generatedContent,
    setGeneratedContent,
    blogGenerating,
    setBlogGenerating,
    requireAuth,
    stepResults
  } = useWorkflowMode();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  
  // Workflow content generation state
  const [contentGenerated, setContentGenerated] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  
  // Content editing state
  const [editingContent, setEditingContent] = useState('');
  const [previewMode, setPreviewMode] = useState(true);
  const [contentStrategy, setContentStrategy] = useState('informative');
  const [currentDraft, setCurrentDraft] = useState(null);
  
  // UI helpers
  const responsive = ComponentHelpers.getResponsiveStyles();
  const defaultColors = ComponentHelpers.getDefaultColors();

  // Check if user can schedule (Creator, Professional, Enterprise)
  const canSchedule = user && user.plan && !['payasyougo', 'free'].includes(user.plan);

  useEffect(() => {
    loadPosts();
  }, [user]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const result = await api.getBlogPosts(user?.id);
      
      if (result.success && result.posts.length > 0) {
        setPosts(result.posts);
      } else {
        // Show dummy data if no real posts exist
        setPosts(dummyPosts);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts(dummyPosts); // Fallback to dummy data
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'green';
      case 'scheduled': return 'orange';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (post) => {
    if (post.status === 'scheduled' && post.scheduledDate) {
      return `Scheduled for ${format(new Date(post.scheduledDate), 'MMM dd, yyyy HH:mm')}`;
    }
    if (post.status === 'published' && post.publishedDate) {
      return `Published on ${format(new Date(post.publishedDate), 'MMM dd, yyyy')}`;
    }
    return post.status.charAt(0).toUpperCase() + post.status.slice(1);
  };

  const handleSchedulePost = (post) => {
    setSelectedPost(post);
    setShowSchedulingModal(true);
  };

  const handleScheduleSave = (scheduleData) => {
    // DUMMY DATA - Save scheduling info to localStorage temporarily
    const updatedPosts = posts.map(post => 
      post.id === selectedPost.id 
        ? { 
            ...post, 
            status: 'scheduled',
            scheduledDate: scheduleData.date,
            scheduledPlatform: scheduleData.platform,
            notifyOnPublish: scheduleData.notify
          }
        : post
    );
    setPosts(updatedPosts);
    setShowSchedulingModal(false);
    setSelectedPost(null);
  };

  // Generate trending topics based on audience strategy
  const handleGenerateTopics = async () => {
    setGeneratingContent(true);
    try {
      // Check for authenticated features
      if (!user && Math.random() > 0.7) {
        setGeneratingContent(false);
        return requireAuth('Generate topics with AI', 'premium-gate');
      }

      const result = await topicAPI.generateTopics({
        selectedCustomerStrategy: tabMode.tabWorkflowData?.selectedCustomerStrategy,
        websiteAnalysis: stepResults?.home?.websiteAnalysis,
        businessType: stepResults?.home?.websiteAnalysis?.businessType || 'Business'
      });

      if (result.success) {
        setAvailableTopics(result.topics);
        message.success(`Generated ${result.topics.length} content topics!`);
      } else {
        throw new Error(result.error || 'Topic generation failed');
      }
    } catch (error) {
      console.error('Topic generation error:', error);
      message.error(`Failed to generate topics: ${error.message}`);
    } finally {
      setGeneratingContent(false);
    }
  };
  
  // Handle topic selection and content generation
  const handleTopicSelection = async (topicId) => {
    const topic = availableTopics.find(t => t.id === topicId);
    if (!topic) return;
    
    setSelectedTopic(topic);
    setGeneratingContent(true);
    
    try {
      const result = await contentAPI.generateContent({
        topicId,
        topic,
        contentStrategy,
        customerStrategy: tabMode.tabWorkflowData?.selectedCustomerStrategy,
        websiteAnalysis: stepResults?.home?.websiteAnalysis
      });
      
      if (result.success) {
        setEditingContent(result.content);
        setContentGenerated(true);
        setCurrentDraft({
          id: Date.now().toString(),
          title: topic.title,
          content: result.content,
          status: 'draft',
          createdAt: new Date().toISOString(),
          topic: topic,
          blogPost: result.blogPost
        });
        
        message.success('Blog content generated successfully!');
      } else {
        throw new Error(result.error || 'Content generation failed');
      }
    } catch (error) {
      console.error('Content generation error:', error);
      message.error(`Failed to generate content: ${error.message}`);
    } finally {
      setGeneratingContent(false);
    }
  };
  
  // Handle content editing
  const handleContentChange = (value) => {
    setEditingContent(value);
    if (currentDraft) {
      setCurrentDraft({
        ...currentDraft,
        content: value,
        updatedAt: new Date().toISOString()
      });
    }
  };
  
  // Save draft to posts list
  const handleSaveDraft = () => {
    if (currentDraft) {
      const newPost = {
        ...currentDraft,
        exportCount: 0,
        isDummy: false
      };
      setPosts([newPost, ...posts]);
      message.success('Draft saved to your posts!');
      
      // Reset workflow state
      setContentGenerated(false);
      setCurrentDraft(null);
      setSelectedTopic(null);
      setEditingContent('');
      setAvailableTopics([]);
    }
  };

  // Initialize topics if arriving from audience workflow
  useEffect(() => {
    console.log('PostsTab useEffect - tabMode:', tabMode.mode);
    console.log('PostsTab useEffect - tabWorkflowData:', tabMode.tabWorkflowData);
    console.log('PostsTab useEffect - availableTopics.length:', availableTopics.length);
    
    if (tabMode.mode === 'workflow' && !availableTopics.length && !generatingContent) {
      console.log('PostsTab: Auto-generating topics...');
      // Add a small delay to ensure UI is ready
      setTimeout(() => {
        handleGenerateTopics();
      }, 500);
    }
  }, [tabMode.mode, tabMode.tabWorkflowData, availableTopics.length, generatingContent]);

  // Prepare step data for workflow progression
  const prepareStepData = () => {
    if (!contentGenerated || !currentDraft) return null;
    return {
      contentCreated: true,
      postTitle: currentDraft.title,
      selectedTopic: selectedTopic,
      generatedContent: editingContent,
      contentStrategy: contentStrategy,
      timestamp: new Date().toISOString()
    };
  };

  const getPostActions = (post) => {
    const actions = [
      {
        key: 'edit',
        label: 'Edit',
        icon: <EditOutlined />,
        onClick: () => console.log('Edit post:', post.id)
      },
      {
        key: 'export',
        label: 'Export',
        icon: <ExportOutlined />,
        onClick: () => console.log('Export post:', post.id)
      }
    ];

    if (canSchedule && post.status !== 'published') {
      actions.unshift({
        key: 'schedule',
        label: post.status === 'scheduled' ? 'Reschedule' : 'Schedule',
        icon: <ScheduleOutlined />,
        onClick: () => handleSchedulePost(post)
      });
    }

    return actions;
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: '4px' }}>{title}</div>
          {record.isDummy && (
            <Tag size="small" color="blue">DUMMY DATA</Tag>
          )}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(record)}
        </Tag>
      )
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => format(new Date(date), 'MMM dd, yyyy')
    },
    {
      title: 'Exports',
      dataIndex: 'exportCount',
      key: 'exportCount'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Dropdown
          menu={{ 
            items: getPostActions(record).map(action => ({
              ...action,
              onClick: () => action.onClick(record)
            }))
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      )
    }
  ];

  // Calendar events from scheduled posts
  const calendarEvents = posts
    .filter(post => post.status === 'scheduled' && post.scheduledDate)
    .map(post => ({
      id: post.id,
      title: post.title,
      start: new Date(post.scheduledDate),
      end: new Date(post.scheduledDate),
      resource: post
    }));

  // Show simplified interface when no posts exist AND not in workflow mode
  if (posts.length === 0 && !loading && tabMode.mode === 'focus') {
    return (
      <div>
        {/* Mode Toggle */}
        <ModeToggle
          mode={tabMode.mode}
          tabKey="posts"
          workflowStep={tabMode.workflowStep}
          showModeToggle={tabMode.showModeToggle}
          showWorkflowNavigation={tabMode.showWorkflowNavigation}
          showNextButton={tabMode.showNextButton && contentGenerated}
          showPreviousButton={tabMode.showPreviousButton}
          nextButtonText={tabMode.nextButtonText}
          previousButtonText={tabMode.previousButtonText}
          canEnterWorkflow={tabMode.canEnterWorkflow}
          onEnterWorkflowMode={tabMode.enterWorkflowMode}
          onExitToFocusMode={tabMode.exitToFocusMode}
          onContinueToNextStep={tabMode.continueToNextStep}
          onGoToPreviousStep={tabMode.goToPreviousStep}
          onSaveStepData={tabMode.saveStepData}
          stepData={prepareStepData()}
        />
        
        {/* Workflow Guidance */}
        {tabMode.mode === 'workflow' && (
          <div style={{ padding: '16px 24px 0' }}>
            <WorkflowGuidance
              step={3}
              totalSteps={4}
              stepTitle="Create Your Content"
              stepDescription={tabMode.tabWorkflowData?.selectedAudience ? 
                `Generate content for your selected audience: ${tabMode.tabWorkflowData.selectedAudience}` : 
                'Generate content based on your strategy and audience selection.'
              }
            />
          </div>
        )}
        
        <div style={{ padding: '24px' }}>
          {tabMode.mode === 'workflow' ? (
            // Workflow Mode: Content Generation & Editing Interface
            <div>
              {!contentGenerated ? (
                // Topic Generation Phase
                <Card title="Generate Content Topics" style={{ marginBottom: '24px' }}>
                  <Paragraph style={{ color: '#666', marginBottom: '20px' }}>
                    {tabMode.tabWorkflowData?.selectedCustomerStrategy ? 
                      'AI will generate trending topics based on your selected audience strategy.' :
                      'Generate content topics that resonate with your target audience.'
                    }
                  </Paragraph>
                  
                  {availableTopics.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      {generatingContent ? (
                        <div>
                          <Button 
                            type="primary" 
                            size="large"
                            loading={true}
                            icon={<BulbOutlined />}
                          >
                            Generating Topics...
                          </Button>
                          <div style={{ marginTop: '12px', color: '#666', fontSize: '14px' }}>
                            Creating personalized content ideas based on your audience strategy
                          </div>
                        </div>
                      ) : (
                        <Button 
                          type="primary" 
                          size="large"
                          onClick={handleGenerateTopics}
                          icon={<BulbOutlined />}
                        >
                          Generate Content Topics
                        </Button>
                      )}
                    </div>
                  ) : (
                    // Enhanced Topic Cards Section
                    <div>
                      <Paragraph style={{ 
                        textAlign: 'center', 
                        marginBottom: '30px', 
                        color: '#666',
                        fontSize: responsive.fontSize.text
                      }}>
                        {tabMode.tabWorkflowData?.selectedCustomerStrategy ? 
                          `Creating targeted blog post ideas based on your selected audience strategy.` :
                          `Based on your audience analysis, here are high-impact blog post ideas:`
                        }
                      </Paragraph>
                      
                      {/* ENHANCED TOPIC CARDS - Full functionality from TopicSelectionStep-v2 */}
                      <Row gutter={responsive.gutter}>
                        {availableTopics.map((topic) => {
                          const isSelected = selectedTopic?.id === topic.id;
                          const isGenerating = generatingContent && selectedTopic?.id === topic.id;
                          
                          return (
                            <Col key={topic.id} xs={24} md={12} lg={12}>
                              <Card 
                                hoverable={!isGenerating}
                                cover={
                                  topic.isImageLoading ? (
                                    // Image loading skeleton
                                    <div style={{ 
                                      height: '200px', 
                                      backgroundColor: '#f5f5f5', 
                                      display: 'flex', 
                                      flexDirection: 'column',
                                      alignItems: 'center', 
                                      justifyContent: 'center',
                                      padding: '20px',
                                      textAlign: 'center'
                                    }}>
                                      <div style={{ 
                                        marginBottom: '12px',
                                        fontSize: responsive.fontSize.small, 
                                        color: '#666',
                                        fontWeight: 500
                                      }}>
                                        🎨 Generating image...
                                      </div>
                                      <div style={{ 
                                        fontSize: '12px', 
                                        color: '#999'
                                      }}>
                                        (takes ~30 seconds)
                                      </div>
                                    </div>
                                  ) : topic.image ? (
                                    // Generated image
                                    <img 
                                      alt={topic.title} 
                                      src={topic.image} 
                                      style={{ 
                                        width: '100%', 
                                        height: '200px', 
                                        objectFit: 'cover' 
                                      }} 
                                    />
                                  ) : (
                                    // Default gradient placeholder
                                    <div style={{
                                      height: '200px',
                                      background: topic.gradientColors ? 
                                        `linear-gradient(135deg, ${topic.gradientColors[0]} 0%, ${topic.gradientColors[1]} 100%)` :
                                        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: 'white',
                                      fontSize: '16px',
                                      fontWeight: 500,
                                      padding: '20px',
                                      textAlign: 'center'
                                    }}>
                                      📝 Content Preview
                                    </div>
                                  )
                                }
                                style={{
                                  border: isSelected ? `2px solid ${defaultColors.primary}` : '1px solid #f0f0f0',
                                  marginBottom: '20px',
                                  opacity: isGenerating ? 0.8 : 1
                                }}
                              >
                                {/* Enhanced Topic Content */}
                                {/* Topic Tags */}
                                <div style={{ marginBottom: '12px' }}>
                                  <Tag color="blue">{topic.category || 'Content'}</Tag>
                                  <Tag color="purple">{contentStrategy || 'awareness'}</Tag>
                                  <Tag color="orange">expert</Tag>
                                  <Tag color="cyan">problem-solution</Tag>
                                  <Tag color="green">standard</Tag>
                                </div>
                                
                                {/* Topic Title and Description */}
                                <Title level={4} style={{ marginBottom: '8px', fontSize: responsive.fontSize.text }}>
                                  {topic.title}
                                </Title>
                                <Paragraph style={{ color: '#666', fontSize: responsive.fontSize.small, marginBottom: '12px' }}>
                                  {topic.subheader || topic.description || 'AI-generated content tailored to your audience'}
                                </Paragraph>
                                
                                {/* Traffic Prediction */}
                                {topic.trafficPrediction && (
                                  <div style={{ 
                                    marginBottom: '16px', 
                                    padding: '12px', 
                                    backgroundColor: '#f0f8ff', 
                                    borderRadius: '6px',
                                    border: '1px solid #d6e7ff'
                                  }}>
                                    <Text style={{ fontSize: '12px', color: '#1890ff', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                                      📊 Traffic Prediction:
                                    </Text>
                                    <Text style={{ fontSize: '11px', color: '#666', lineHeight: '1.4' }}>
                                      {topic.trafficPrediction}
                                    </Text>
                                  </div>
                                )}
                                
                                {/* Action Buttons */}
                                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                  <Button
                                    type="primary"
                                    size="large"
                                    onClick={() => handleTopicSelection(topic.id)}
                                    loading={isGenerating}
                                    style={{
                                      backgroundColor: defaultColors.primary,
                                      borderColor: defaultColors.primary,
                                      width: '100%',
                                      marginBottom: '12px'
                                    }}
                                  >
                                    {isGenerating ? 'Generating Content...' : 'Get One Free Post'}
                                  </Button>
                                  
                                  <Button
                                    size="large"
                                    icon={user ? <EditOutlined /> : <LockOutlined />}
                                    onClick={() => {
                                      if (!user) {
                                        message.info('Sign in to edit content strategy');
                                      } else {
                                        message.info('Strategy editing will be available after backend integration');
                                      }
                                    }}
                                    style={{
                                      width: '100%',
                                      marginTop: '8px',
                                      borderColor: defaultColors.primary,
                                      color: user ? '#52c41a' : defaultColors.primary,
                                      background: user ? `linear-gradient(135deg, #52c41a05, #52c41a10)` : `linear-gradient(135deg, ${defaultColors.primary}05, ${defaultColors.primary}10)`,
                                      fontWeight: '500'
                                    }}
                                  >
                                    {user ? '✓ Edit Strategy' : 'Edit Strategy'}
                                  </Button>
                                </div>
                                
                                {/* Blog Post Blueprint */}
                                <Divider style={{ margin: '20px 0 16px 0' }} />
                                
                                <div style={{ 
                                  padding: '16px',
                                  backgroundColor: defaultColors.secondary + '20',
                                  borderRadius: '8px',
                                  border: `1px solid ${defaultColors.secondary}60`
                                }}>
                                  <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                                    <Text strong style={{ 
                                      color: defaultColors.primary, 
                                      fontSize: responsive.fontSize.text,
                                      display: 'block',
                                      marginBottom: '4px'
                                    }}>
                                      📋 What You'll Get
                                    </Text>
                                    <Text style={{ fontSize: '12px', color: '#666' }}>
                                      Your blog post will include all these strategic elements
                                    </Text>
                                  </div>

                                  {/* Content Structure */}
                                  <div style={{ marginBottom: '12px' }}>
                                    <Text strong style={{ color: defaultColors.primary, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                                      📝 Content Structure
                                    </Text>
                                    <Text style={{ fontSize: '12px', color: '#666' }}>
                                      Problem identification → Solution framework → Implementation guidance
                                    </Text>
                                  </div>

                                  {/* SEO Keywords */}
                                  {topic.scenario?.seoKeywords && topic.scenario.seoKeywords.length > 0 && (
                                    <div style={{ marginBottom: '12px' }}>
                                      <Text strong style={{ color: defaultColors.primary, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                                        🔑 SEO Keywords Integrated
                                      </Text>
                                      <Space wrap size="small">
                                        {topic.scenario.seoKeywords.slice(0, 3).map((keyword, keywordIndex) => (
                                          <Tag 
                                            key={keywordIndex}
                                            color={defaultColors.primary}
                                            style={{ fontSize: '11px', borderRadius: '4px' }}
                                          >
                                            {keyword}
                                          </Tag>
                                        ))}
                                        {topic.scenario.seoKeywords.length > 3 && (
                                          <Text style={{ fontSize: '11px', color: '#999' }}>
                                            +{topic.scenario.seoKeywords.length - 3} more
                                          </Text>
                                        )}
                                      </Space>
                                    </div>
                                  )}

                                  {/* Competitive Positioning */}
                                  <div style={{ marginBottom: '12px' }}>
                                    <Text strong style={{ color: defaultColors.primary, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                                      🎯 Competitive Edge
                                    </Text>
                                    <Text style={{ fontSize: '12px', color: '#666' }}>
                                      Establishes thought leadership with unique insights and fresh perspectives
                                    </Text>
                                  </div>

                                  {/* Strategic CTAs */}
                                  <div style={{ marginBottom: '12px' }}>
                                    <Text strong style={{ color: defaultColors.primary, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                                      🚀 Conversion Elements
                                    </Text>
                                    <Text style={{ fontSize: '12px', color: '#666' }}>
                                      Strategic CTAs aligned with your primary business objectives and customer journey
                                    </Text>
                                  </div>

                                  {/* Content Quality */}
                                  <div style={{ marginBottom: '0' }}>
                                    <Text strong style={{ color: defaultColors.primary, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                                      ✨ Content Quality
                                    </Text>
                                    <Text style={{ fontSize: '12px', color: '#666' }}>
                                      1000-1500 words with balanced depth and readability • Expert authority tone
                                    </Text>
                                  </div>
                                </div>
                              </Card>
                            </Col>
                          );
                        })}
                      </Row>
                      
                      {/* Lead Generation CTA - Want More Content Ideas? */}
                      {availableTopics.length >= 1 && (
                        <div style={{ 
                          marginTop: '32px', 
                          textAlign: 'center',
                          padding: '24px',
                          background: `linear-gradient(135deg, ${defaultColors.accent}08, ${defaultColors.primary}08)`,
                          borderRadius: '12px',
                          border: `2px dashed ${defaultColors.accent}40`
                        }}>
                          <BulbOutlined style={{ 
                            fontSize: '32px', 
                            color: defaultColors.accent, 
                            marginBottom: '12px',
                            display: 'block'
                          }} />
                          <Title level={4} style={{ 
                            margin: '0 0 8px 0', 
                            color: defaultColors.primary,
                            fontSize: responsive.fontSize.text
                          }}>
                            Want More Content Ideas?
                          </Title>
                          <Text style={{ 
                            fontSize: responsive.fontSize.text, 
                            color: '#666',
                            display: 'block',
                            marginBottom: '20px'
                          }}>
                            Get {availableTopics.length > 2 ? availableTopics.length - 2 : 5} more strategic topic ideas with detailed customer psychology insights
                          </Text>
                          <Button 
                            size="large"
                            type="primary"
                            style={{
                              backgroundColor: user ? '#52c41a' : defaultColors.accent,
                              borderColor: user ? '#52c41a' : defaultColors.accent,
                              color: 'white',
                              borderRadius: '8px',
                              fontWeight: '500',
                              height: '48px',
                              padding: '0 32px',
                              fontSize: responsive.fontSize.text,
                              boxShadow: user ? `0 2px 8px #52c41a30` : `0 2px 8px ${defaultColors.accent}30`
                            }}
                            onClick={() => {
                              if (!user) {
                                message.info('Sign in to unlock additional content ideas');
                              } else {
                                message.info('Additional topic ideas available with premium access');
                              }
                            }}
                          >
                            {user ? 'See All Your Ideas' : 'Unlock More Ideas'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ) : (
                // Content Editing Phase
                <Card 
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Edit Your Content</span>
                      <Space>
                        <Button 
                          type={previewMode ? "default" : "primary"}
                          icon={<EditOutlined />}
                          onClick={() => setPreviewMode(false)}
                          size="small"
                        >
                          Edit
                        </Button>
                        <Button 
                          type={previewMode ? "primary" : "default"}
                          icon={<EyeOutlined />}
                          onClick={() => setPreviewMode(true)}
                          size="small"
                        >
                          Preview
                        </Button>
                      </Space>
                    </div>
                  }
                  style={{ marginBottom: '24px' }}
                >
                  {selectedTopic && (
                    <div style={{ 
                      backgroundColor: '#f6ffed',
                      border: '1px solid #b7eb8f',
                      borderRadius: '6px',
                      padding: '12px',
                      marginBottom: '16px'
                    }}>
                      <Text strong style={{ color: '#389e0d' }}>Selected Topic: </Text>
                      <Text style={{ color: '#389e0d' }}>{selectedTopic.title}</Text>
                    </div>
                  )}
                  
                  {/* Content Strategy Selector */}
                  <div style={{ marginBottom: '16px' }}>
                    <Text strong style={{ marginRight: '8px' }}>Content Style:</Text>
                    <Select
                      value={contentStrategy}
                      onChange={setContentStrategy}
                      style={{ width: 200 }}
                      size="small"
                    >
                      <Select.Option value="informative">Educational & Informative</Select.Option>
                      <Select.Option value="how-to">Step-by-Step How-To</Select.Option>
                      <Select.Option value="opinion">Opinion & Analysis</Select.Option>
                      <Select.Option value="case-study">Case Study & Examples</Select.Option>
                      <Select.Option value="list">List & Compilation</Select.Option>
                    </Select>
                  </div>
                  
                  {previewMode ? (
                    // Preview Mode
                    <div style={{ 
                      border: '1px solid #f0f0f0',
                      borderRadius: '6px',
                      padding: '20px',
                      backgroundColor: '#fafafa',
                      minHeight: '400px'
                    }}>
                      <div 
                        style={{ 
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.6',
                          fontSize: '14px'
                        }}
                      >
                        {editingContent || 'No content generated yet.'}
                      </div>
                    </div>
                  ) : (
                    // Edit Mode
                    <TextArea
                      value={editingContent}
                      onChange={(e) => handleContentChange(e.target.value)}
                      placeholder="Your generated content will appear here for editing..."
                      rows={20}
                      style={{ fontSize: '14px', lineHeight: '1.6' }}
                    />
                  )}
                  
                  {/* Action Buttons */}
                  <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                    <Space>
                      <Button 
                        icon={<ReloadOutlined />}
                        onClick={() => {
                          setContentGenerated(false);
                          setEditingContent('');
                          setSelectedTopic(null);
                          setCurrentDraft(null);
                        }}
                      >
                        Start Over
                      </Button>
                    </Space>
                    
                    <Space>
                      <Button 
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={handleSaveDraft}
                        disabled={!editingContent.trim()}
                      >
                        Save as Draft
                      </Button>
                    </Space>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            // Focus Mode: Show Empty State for No Posts
            <Card 
              title="Blog Posts" 
              extra={
                <Button type="primary" icon={<PlusOutlined />}>
                  Create New Post
                </Button>
              }
            >
              <Empty
                description="No blog posts yet"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" icon={<PlusOutlined />}>
                  Create Your First Post
                </Button>
              </Empty>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Mode Toggle */}
      <ModeToggle
        mode={tabMode.mode}
        tabKey="posts"
        workflowStep={tabMode.workflowStep}
        showModeToggle={tabMode.showModeToggle}
        showWorkflowNavigation={tabMode.showWorkflowNavigation}
        showNextButton={tabMode.showNextButton && contentGenerated}
        showPreviousButton={tabMode.showPreviousButton}
        nextButtonText={tabMode.nextButtonText}
        previousButtonText={tabMode.previousButtonText}
        canEnterWorkflow={tabMode.canEnterWorkflow}
        onEnterWorkflowMode={tabMode.enterWorkflowMode}
        onExitToFocusMode={tabMode.exitToFocusMode}
        onContinueToNextStep={tabMode.continueToNextStep}
        onGoToPreviousStep={tabMode.goToPreviousStep}
        onSaveStepData={tabMode.saveStepData}
        stepData={prepareStepData()}
      />
      
      {/* Workflow Guidance */}
      {tabMode.mode === 'workflow' && (
        <div style={{ padding: '16px 24px 0' }}>
          <WorkflowGuidance
            step={3}
            totalSteps={4}
            stepTitle="Create Your Content"
            stepDescription={tabMode.tabWorkflowData?.selectedAudience ? 
              `Generate content for your selected audience: ${tabMode.tabWorkflowData.selectedAudience}` : 
              'Generate content based on your strategy and audience selection.'
            }
          />
        </div>
      )}
      
      <div style={{ padding: '24px' }}>
        {/* ENHANCED TOPIC GENERATION SECTION - Available in both workflow and focus modes */}
        {(tabMode.mode === 'workflow' || (tabMode.mode === 'focus' && !contentGenerated)) && (
          <div style={{ marginBottom: '24px' }}>
            {!contentGenerated ? (
              // Topic Generation Phase
              <Card title="Generate Content Topics" style={{ marginBottom: '24px' }}>
                <Paragraph style={{ color: '#666', marginBottom: '20px' }}>
                  {tabMode.tabWorkflowData?.selectedCustomerStrategy ? 
                    'AI will generate trending topics based on your selected audience strategy.' :
                    'Generate content topics that resonate with your target audience.'
                  }
                </Paragraph>
                
                {availableTopics.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    {generatingContent ? (
                      <div>
                        <Button 
                          type="primary" 
                          size="large"
                          loading={true}
                          icon={<BulbOutlined />}
                        >
                          Generating Topics...
                        </Button>
                        <div style={{ marginTop: '12px', color: '#666', fontSize: '14px' }}>
                          Creating personalized content ideas based on your audience strategy
                        </div>
                      </div>
                    ) : (
                      <Button 
                        type="primary" 
                        size="large"
                        onClick={handleGenerateTopics}
                        icon={<BulbOutlined />}
                      >
                        Generate Content Topics
                      </Button>
                    )}
                  </div>
                ) : (
                  // Enhanced Topic Cards Section - Same for both modes
                  <div>
                    <Paragraph style={{ 
                      textAlign: 'center', 
                      marginBottom: '30px', 
                      color: '#666',
                      fontSize: responsive.fontSize.text
                    }}>
                      {tabMode.tabWorkflowData?.selectedCustomerStrategy ? 
                        `Creating targeted blog post ideas based on your selected audience strategy.` :
                        `Based on your audience analysis, here are high-impact blog post ideas:`
                      }
                    </Paragraph>
                    
                    {/* ENHANCED TOPIC CARDS - Full functionality from TopicSelectionStep-v2 */}
                    <Row gutter={responsive.gutter}>
                      {availableTopics.map((topic) => {
                        const isSelected = selectedTopic?.id === topic.id;
                        const isGenerating = generatingContent && selectedTopic?.id === topic.id;
                        
                        return (
                          <Col key={topic.id} xs={24} md={12} lg={12}>
                            <Card 
                              hoverable={!isGenerating}
                              cover={
                                topic.isImageLoading ? (
                                  // Image loading skeleton
                                  <div style={{ 
                                    height: '200px', 
                                    backgroundColor: '#f5f5f5', 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    padding: '20px',
                                    textAlign: 'center'
                                  }}>
                                    <div style={{ 
                                      marginBottom: '12px',
                                      fontSize: responsive.fontSize.small, 
                                      color: '#666',
                                      fontWeight: 500
                                    }}>
                                      🎨 Generating image...
                                    </div>
                                    <div style={{ 
                                      fontSize: '12px', 
                                      color: '#999'
                                    }}>
                                      (takes ~30 seconds)
                                    </div>
                                  </div>
                                ) : topic.image ? (
                                  // Generated image
                                  <img 
                                    alt={topic.title} 
                                    src={topic.image} 
                                    style={{ 
                                      width: '100%', 
                                      height: '200px', 
                                      objectFit: 'cover' 
                                    }} 
                                  />
                                ) : (
                                  // Default gradient placeholder
                                  <div style={{
                                    height: '200px',
                                    background: topic.gradientColors ? 
                                      `linear-gradient(135deg, ${topic.gradientColors[0]} 0%, ${topic.gradientColors[1]} 100%)` :
                                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '16px',
                                    fontWeight: 500,
                                    padding: '20px',
                                    textAlign: 'center'
                                  }}>
                                    📝 Content Preview
                                  </div>
                                )
                              }
                              style={{
                                border: isSelected ? `2px solid ${defaultColors.primary}` : '1px solid #f0f0f0',
                                marginBottom: '20px',
                                opacity: isGenerating ? 0.8 : 1
                              }}
                            >
                              {/* Enhanced Topic Content - Same rich preview for both modes */}
                              {/* Topic Tags */}
                              <div style={{ marginBottom: '12px' }}>
                                <Tag color="blue">{topic.category || 'Content'}</Tag>
                                <Tag color="purple">{contentStrategy || 'awareness'}</Tag>
                                <Tag color="orange">expert</Tag>
                                <Tag color="cyan">problem-solution</Tag>
                                <Tag color="green">standard</Tag>
                              </div>
                              
                              {/* Topic Title and Description */}
                              <Title level={4} style={{ marginBottom: '8px', fontSize: responsive.fontSize.text }}>
                                {topic.title}
                              </Title>
                              <Paragraph style={{ color: '#666', fontSize: responsive.fontSize.small, marginBottom: '12px' }}>
                                {topic.subheader || topic.description || 'AI-generated content tailored to your audience'}
                              </Paragraph>
                              
                              {/* Traffic Prediction */}
                              {topic.trafficPrediction && (
                                <div style={{ 
                                  marginBottom: '16px', 
                                  padding: '12px', 
                                  backgroundColor: '#f0f8ff', 
                                  borderRadius: '6px',
                                  border: '1px solid #d6e7ff'
                                }}>
                                  <Text style={{ fontSize: '12px', color: '#1890ff', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                                    📊 Traffic Prediction:
                                  </Text>
                                  <Text style={{ fontSize: '11px', color: '#666', lineHeight: '1.4' }}>
                                    {topic.trafficPrediction}
                                  </Text>
                                </div>
                              )}
                              
                              {/* Action Buttons */}
                              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                <Button
                                  type="primary"
                                  size="large"
                                  onClick={() => handleTopicSelection(topic.id)}
                                  loading={isGenerating}
                                  style={{
                                    backgroundColor: defaultColors.primary,
                                    borderColor: defaultColors.primary,
                                    width: '100%',
                                    marginBottom: '12px'
                                  }}
                                >
                                  {isGenerating ? 'Generating Content...' : 'Get One Free Post'}
                                </Button>
                                
                                <Button
                                  size="large"
                                  icon={user ? <EditOutlined /> : <LockOutlined />}
                                  onClick={() => {
                                    if (!user) {
                                      message.info('Sign in to edit content strategy');
                                    } else {
                                      message.info('Strategy editing will be available after backend integration');
                                    }
                                  }}
                                  style={{
                                    width: '100%',
                                    marginTop: '8px',
                                    borderColor: defaultColors.primary,
                                    color: user ? '#52c41a' : defaultColors.primary,
                                    background: user ? `linear-gradient(135deg, #52c41a05, #52c41a10)` : `linear-gradient(135deg, ${defaultColors.primary}05, ${defaultColors.primary}10)`,
                                    fontWeight: '500'
                                  }}
                                >
                                  {user ? '✓ Edit Strategy' : 'Edit Strategy'}
                                </Button>
                              </div>
                              
                              {/* Blog Post Blueprint */}
                              <Divider style={{ margin: '20px 0 16px 0' }} />
                              
                              <div style={{ 
                                padding: '16px',
                                backgroundColor: defaultColors.secondary + '20',
                                borderRadius: '8px',
                                border: `1px solid ${defaultColors.secondary}60`
                              }}>
                                <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                                  <Text strong style={{ 
                                    color: defaultColors.primary, 
                                    fontSize: responsive.fontSize.text,
                                    display: 'block',
                                    marginBottom: '4px'
                                  }}>
                                    📋 What You'll Get
                                  </Text>
                                  <Text style={{ fontSize: '12px', color: '#666' }}>
                                    Your blog post will include all these strategic elements
                                  </Text>
                                </div>

                                {/* Content Structure */}
                                <div style={{ marginBottom: '12px' }}>
                                  <Text strong style={{ color: defaultColors.primary, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                                    📝 Content Structure
                                  </Text>
                                  <Text style={{ fontSize: '12px', color: '#666' }}>
                                    Problem identification → Solution framework → Implementation guidance
                                  </Text>
                                </div>

                                {/* SEO Keywords */}
                                {topic.scenario?.seoKeywords && topic.scenario.seoKeywords.length > 0 && (
                                  <div style={{ marginBottom: '12px' }}>
                                    <Text strong style={{ color: defaultColors.primary, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                                      🔑 SEO Keywords Integrated
                                    </Text>
                                    <Space wrap size="small">
                                      {topic.scenario.seoKeywords.slice(0, 3).map((keyword, keywordIndex) => (
                                        <Tag 
                                          key={keywordIndex}
                                          color={defaultColors.primary}
                                          style={{ fontSize: '11px', borderRadius: '4px' }}
                                        >
                                          {keyword}
                                        </Tag>
                                      ))}
                                      {topic.scenario.seoKeywords.length > 3 && (
                                        <Text style={{ fontSize: '11px', color: '#999' }}>
                                          +{topic.scenario.seoKeywords.length - 3} more
                                        </Text>
                                      )}
                                    </Space>
                                  </div>
                                )}

                                {/* Competitive Positioning */}
                                <div style={{ marginBottom: '12px' }}>
                                  <Text strong style={{ color: defaultColors.primary, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                                    🎯 Competitive Edge
                                  </Text>
                                  <Text style={{ fontSize: '12px', color: '#666' }}>
                                    Establishes thought leadership with unique insights and fresh perspectives
                                  </Text>
                                </div>

                                {/* Strategic CTAs */}
                                <div style={{ marginBottom: '12px' }}>
                                  <Text strong style={{ color: defaultColors.primary, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                                    🚀 Conversion Elements
                                  </Text>
                                  <Text style={{ fontSize: '12px', color: '#666' }}>
                                    Strategic CTAs aligned with your primary business objectives and customer journey
                                  </Text>
                                </div>

                                {/* Content Quality */}
                                <div style={{ marginBottom: '0' }}>
                                  <Text strong style={{ color: defaultColors.primary, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                                    ✨ Content Quality
                                  </Text>
                                  <Text style={{ fontSize: '12px', color: '#666' }}>
                                    1000-1500 words with balanced depth and readability • Expert authority tone
                                  </Text>
                                </div>
                              </div>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                    
                    {/* Lead Generation CTA - Want More Content Ideas? */}
                    {availableTopics.length >= 1 && (
                      <div style={{ 
                        marginTop: '32px', 
                        textAlign: 'center',
                        padding: '24px',
                        background: `linear-gradient(135deg, ${defaultColors.accent}08, ${defaultColors.primary}08)`,
                        borderRadius: '12px',
                        border: `2px dashed ${defaultColors.accent}40`
                      }}>
                        <BulbOutlined style={{ 
                          fontSize: '32px', 
                          color: defaultColors.accent, 
                          marginBottom: '12px',
                          display: 'block'
                        }} />
                        <Title level={4} style={{ 
                          margin: '0 0 8px 0', 
                          color: defaultColors.primary,
                          fontSize: responsive.fontSize.text
                        }}>
                          Want More Content Ideas?
                        </Title>
                        <Text style={{ 
                          fontSize: responsive.fontSize.text, 
                          color: '#666',
                          display: 'block',
                          marginBottom: '20px'
                        }}>
                          Get {availableTopics.length > 2 ? availableTopics.length - 2 : 5} more strategic topic ideas with detailed customer psychology insights
                        </Text>
                        <Button 
                          size="large"
                          type="primary"
                          style={{
                            backgroundColor: user ? '#52c41a' : defaultColors.accent,
                            borderColor: user ? '#52c41a' : defaultColors.accent,
                            color: 'white',
                            borderRadius: '8px',
                            fontWeight: '500',
                            height: '48px',
                            padding: '0 32px',
                            fontSize: responsive.fontSize.text,
                            boxShadow: user ? `0 2px 8px #52c41a30` : `0 2px 8px ${defaultColors.accent}30`
                          }}
                          onClick={() => {
                            if (!user) {
                              message.info('Sign in to unlock additional content ideas');
                            } else {
                              message.info('Additional topic ideas available with premium access');
                            }
                          }}
                        >
                          {user ? 'See All Your Ideas' : 'Unlock More Ideas'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ) : null}
          </div>
        )}

        {/* CONTENT EDITING SECTION - Available in both modes when content is generated */}
        {contentGenerated && (
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Edit Your Content</span>
                <Space>
                  <Button 
                    type={previewMode ? "default" : "primary"}
                    icon={<EditOutlined />}
                    onClick={() => setPreviewMode(false)}
                    size="small"
                  >
                    Edit
                  </Button>
                  <Button 
                    type={previewMode ? "primary" : "default"}
                    icon={<EyeOutlined />}
                    onClick={() => setPreviewMode(true)}
                    size="small"
                  >
                    Preview
                  </Button>
                </Space>
              </div>
            }
            style={{ marginBottom: '24px' }}
          >
            {selectedTopic && (
              <div style={{ 
                backgroundColor: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <Text strong style={{ color: '#389e0d' }}>Selected Topic: </Text>
                <Text style={{ color: '#389e0d' }}>{selectedTopic.title}</Text>
              </div>
            )}
            
            {/* Content Strategy Selector */}
            <div style={{ marginBottom: '16px' }}>
              <Text strong style={{ marginRight: '8px' }}>Content Style:</Text>
              <Select
                value={contentStrategy}
                onChange={setContentStrategy}
                style={{ width: 200 }}
                size="small"
              >
                <Select.Option value="informative">Educational & Informative</Select.Option>
                <Select.Option value="how-to">Step-by-Step How-To</Select.Option>
                <Select.Option value="opinion">Opinion & Analysis</Select.Option>
                <Select.Option value="case-study">Case Study & Examples</Select.Option>
                <Select.Option value="list">List & Compilation</Select.Option>
              </Select>
            </div>
            
            {previewMode ? (
              // Preview Mode
              <div style={{ 
                border: '1px solid #f0f0f0',
                borderRadius: '6px',
                padding: '20px',
                backgroundColor: '#fafafa',
                minHeight: '400px'
              }}>
                <div 
                  style={{ 
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6',
                    fontSize: '14px'
                  }}
                >
                  {editingContent || 'No content generated yet.'}
                </div>
              </div>
            ) : (
              // Edit Mode
              <TextArea
                value={editingContent}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Your generated content will appear here for editing..."
                rows={20}
                style={{ fontSize: '14px', lineHeight: '1.6' }}
              />
            )}
            
            {/* Action Buttons */}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
              <Space>
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setContentGenerated(false);
                    setEditingContent('');
                    setSelectedTopic(null);
                    setCurrentDraft(null);
                  }}
                >
                  Start Over
                </Button>
              </Space>
              
              <Space>
                <Button 
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleSaveDraft}
                  disabled={!editingContent.trim()}
                >
                  Save as Draft
                </Button>
              </Space>
            </div>
          </Card>
        )}

        {/* POSTS MANAGEMENT SECTION - Only visible in focus mode */}
        {tabMode.mode === 'focus' && (
          <Card 
            title="Blog Posts" 
            extra={
              <Space>
                <Switch
                  checkedChildren={<CalendarOutlined />}
                  unCheckedChildren={<UnorderedListOutlined />}
                  checked={viewMode === 'calendar'}
                  onChange={(checked) => setViewMode(checked ? 'calendar' : 'list')}
                />
                <Button type="primary" icon={<PlusOutlined />}>
                  Create New Post
                </Button>
              </Space>
            }
          >
            {!canSchedule && (
              <>
                <div style={{
                  background: '#f0f2ff',
                  border: '1px solid #d6e3ff',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontWeight: 500, color: '#1d39c4', marginBottom: '4px' }}>
                    Scheduling Available for Subscribers
                  </div>
                  <div style={{ fontSize: '14px', color: '#4f4f4f' }}>
                    Upgrade to Creator, Professional, or Enterprise plan to schedule your blog posts.
                  </div>
                </div>
              </>
            )}

            {viewMode === 'list' ? (
              <Table
                columns={columns}
                dataSource={posts}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
              />
            ) : (
              <div style={{ height: '500px' }}>
                <Calendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  onSelectEvent={(event) => {
                    if (canSchedule) {
                      handleSchedulePost(event.resource);
                    }
                  }}
                  views={['month', 'week', 'day']}
                  defaultView="month"
                  popup
                  style={{ height: '100%' }}
                />
              </div>
            )}
          </Card>
        )}
      </div>

      {showSchedulingModal && (
        <SchedulingModal
          open={showSchedulingModal}
          post={selectedPost}
          onClose={() => setShowSchedulingModal(false)}
          onSave={handleScheduleSave}
        />
      )}
    </div>
  );
};

export default PostsTab;