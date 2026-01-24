import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Empty, Table, Tag, Dropdown, Space, Switch, Divider, Input, Select, Row, Col, Typography, message, Modal } from 'antd';
import { 
  PlusOutlined, 
  ScheduleOutlined,
  EditOutlined,
  ExportOutlined,
  MoreOutlined,
  BulbOutlined,
  EyeOutlined,
  CheckOutlined,
  ReloadOutlined,
  LockOutlined,
  TeamOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTabMode } from '../../hooks/useTabMode';
import { useWorkflowMode } from '../../contexts/WorkflowModeContext';
import { format } from 'date-fns';
import { WorkflowGuidance } from '../Workflow/ModeToggle';
import api from '../../services/api';
import { topicAPI, contentAPI } from '../../services/workflowAPI';
import SchedulingModal from '../Modals/SchedulingModal';
import ManualCTAInputModal from '../Modals/ManualCTAInputModal';
import { ComponentHelpers } from '../Workflow/interfaces/WorkflowComponentInterface';
import MarkdownPreview from '../MarkdownPreview/MarkdownPreview';
import HTMLPreview from '../HTMLPreview/HTMLPreview';
import TypographySettings from '../TypographySettings/TypographySettings';
import FormattingToolbar from '../FormattingToolbar/FormattingToolbar';
import ExportModal from '../ExportModal/ExportModal';
import HighlightedContentSuggestions from '../HighlightedContent/HighlightedContentSuggestions';

// New Enhanced Components
import EditorLayout, { EditorPane, PreviewPane } from '../Editor/Layout/EditorLayout';
import EditorToolbar from '../Editor/Toolbar/EditorToolbar';
import RichTextEditor from '../Editor/RichTextEditor/RichTextEditor';
import SEOAnalysis from '../SEOAnalysis/SEOAnalysis';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// Save Status Indicator Component
const SaveStatusIndicator = ({ isAutosaving, lastSaved, autosaveError }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every 5 seconds to refresh "time ago" display
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 5000);
    
    return () => clearInterval(timer);
  }, []);

  const getStatusText = () => {
    if (isAutosaving) {
      return { text: 'Saving...', color: '#1890ff' };
    }
    if (autosaveError) {
      return { text: `Error: ${autosaveError}`, color: '#ff4d4f' };
    }
    if (lastSaved) {
      const timeAgo = Math.round((currentTime - lastSaved) / 1000);
      if (timeAgo < 60) {
        return { text: `Saved ${timeAgo}s ago`, color: '#52c41a' };
      } else {
        const minutesAgo = Math.round(timeAgo / 60);
        return { text: `Saved ${minutesAgo}m ago`, color: '#52c41a' };
      }
    }
    return { text: 'Autosave enabled', color: '#d9d9d9' };
  };

  const status = getStatusText();
  
  return (
    <div style={{ 
      fontSize: '12px', 
      color: status.color, 
      display: 'flex', 
      alignItems: 'center',
      marginLeft: '8px'
    }}>
      {isAutosaving && <span style={{ marginRight: '4px' }}>⏳</span>}
      {autosaveError && <span style={{ marginRight: '4px' }}>⚠️</span>}
      {lastSaved && !isAutosaving && !autosaveError && <span style={{ marginRight: '4px' }}>✓</span>}
      {status.text}
    </div>
  );
};

// Content Discovery has been moved to SandboxTab for super-admin access

const PostsTab = ({ forceWorkflowMode = false, onEnterProjectMode, onQuotaUpdate }) => {
  const { user } = useAuth();
  const tabMode = useTabMode('posts');
  const { 
    requireSignUp,
    stepResults,
    addStickyWorkflowStep,
    selectedCustomerStrategy
  } = useWorkflowMode();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Workflow content generation state
  const [contentGenerated, setContentGenerated] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  
  // Content editing state
  const [editingContent, setEditingContent] = useState('');
  const [previewMode, setPreviewMode] = useState(true);
  const [editorViewMode, setEditorViewMode] = useState('edit'); // 'edit', 'preview', 'split'
  const [typography, setTypography] = useState({
    preset: 'modern',
    headingFont: 'Inter, sans-serif',
    bodyFont: 'Inter, sans-serif',
    fontSize: 16,
    lineHeight: '1.6',
    paragraphSpacing: 16
  });
  const [contentStrategy, setContentStrategy] = useState({
    goal: 'awareness', // 'awareness', 'consideration', 'conversion', 'retention'
    voice: 'expert', // 'expert', 'friendly', 'insider', 'storyteller'
    template: 'problem-solution', // 'how-to', 'problem-solution', 'listicle', 'case-study', 'comprehensive'
    length: 'standard' // 'quick', 'standard', 'deep'
  });
  const [currentDraft, setCurrentDraft] = useState(null);
  const [postState, setPostState] = useState('draft'); // 'draft', 'exported', 'locked'
  
  // Editor state for TipTap integration
  const [richTextEditor, setRichTextEditor] = useState(null);

  // Fullscreen editor state
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);

  // Autosave state
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [lastSavedContent, setLastSavedContent] = useState('');
  const [autosaveError, setAutosaveError] = useState(null);
  
  // Enhanced content generation options
  const [useEnhancedGeneration, setUseEnhancedGeneration] = useState(true);
  
  // Enhanced metadata from content generation
  const [enhancedMetadata, setEnhancedMetadata] = useState(null);
  const [seoAnalysisVisible, setSeoAnalysisVisible] = useState(false);

  // Organization data for enhanced generation
  const organizationId = user?.organizationId || user?.id; // Use user ID as fallback
  const organizationName = user?.organizationName || '';

  // CTA state management
  const [organizationCTAs, setOrganizationCTAs] = useState([]);
  const [ctasLoading, setCtasLoading] = useState(false);
  const [hasSufficientCTAs, setHasSufficientCTAs] = useState(false);
  const [showManualCTAModal, setShowManualCTAModal] = useState(false);
  const [manualCTAPromptShown, setManualCTAPromptShown] = useState(false);
  
  // UI helpers
  const responsive = ComponentHelpers.getResponsiveStyles();
  const defaultColors = ComponentHelpers.getDefaultColors();

  // Check if user can schedule (Creator, Professional, Enterprise)
  const canSchedule = user && user.plan && !['payasyougo', 'free'].includes(user.plan);
  

  useEffect(() => {
    loadPosts();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Autosave timer - saves every 15 seconds when content is being edited
  useEffect(() => {
    let autosaveInterval;
    
    // Only set up autosave when we have content being edited
    if (contentGenerated && editingContent && currentDraft) {
      console.log('🕒 Starting autosave timer (15s intervals)');
      
      autosaveInterval = setInterval(() => {
        console.log('⏰ Autosave timer triggered');
        handleAutosave(false); // Silent autosave
      }, 15000); // 15 seconds
    }
    
    // Cleanup interval on unmount or when conditions change
    return () => {
      if (autosaveInterval) {
        console.log('🛑 Clearing autosave timer');
        clearInterval(autosaveInterval);
      }
    };
  }, [contentGenerated, currentDraft]); // Re-setup when editing state changes, but not on every content change

  // Keyboard shortcut for manual save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (contentGenerated && currentDraft && editingContent.trim()) {
          console.log('⌨️ Manual save triggered via keyboard shortcut');
          handleAutosave(true); // Manual save with user feedback
        }
      }
    };

    if (contentGenerated && currentDraft) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [contentGenerated, currentDraft, editingContent]);

  // Fetch CTAs when organization ID is available
  useEffect(() => {
    const fetchCTAs = async () => {
      if (!organizationId) return;

      setCtasLoading(true);
      try {
        const response = await api.getOrganizationCTAs(organizationId);
        setOrganizationCTAs(response.ctas || []);
        setHasSufficientCTAs(response.has_sufficient_ctas || false);
      } catch (error) {
        console.error('Failed to fetch CTAs:', error);
        // Silently fail - CTAs are optional
      } finally {
        setCtasLoading(false);
      }
    };

    fetchCTAs();
  }, [organizationId]);

  // Fullscreen toggle handler
  const handleToggleFullscreen = useCallback(() => {
    setIsEditorFullscreen(prev => !prev);
  }, []);

  // Prevent body scroll when in fullscreen mode
  useEffect(() => {
    if (isEditorFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isEditorFullscreen]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const result = await api.getPosts();
      
      if (result.success) {
        // Set real posts from API (empty array if no posts)
        setPosts(result.posts || []);
        console.log('✅ Posts loaded successfully:', {
          count: result.posts?.length || 0,
          isAuthenticated: !!user,
          hasSessionId: !!sessionStorage.getItem('audience_session_id')
        });
      } else {
        console.warn('Posts API returned unsuccessful response:', result);
        setPosts([]);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      // For anonymous users, start with empty array instead of dummy data
      setPosts([]);
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
      try {
        return `Scheduled for ${format(new Date(post.scheduledDate), 'MMM dd, yyyy HH:mm')}`;
      } catch (error) {
        console.warn('Invalid scheduledDate:', post.scheduledDate);
        return 'Scheduled';
      }
    }
    if (post.status === 'published' && post.publishedDate) {
      try {
        return `Published on ${format(new Date(post.publishedDate), 'MMM dd, yyyy')}`;
      } catch (error) {
        console.warn('Invalid publishedDate:', post.publishedDate);
        return 'Published';
      }
    }
    return post.status.charAt(0).toUpperCase() + post.status.slice(1);
  };


  const handleSchedulePost = (post) => {
    setSelectedPost(post);
    setShowSchedulingModal(true);
  };

  const handleScheduleSave = (scheduleData) => {
    // Save scheduling info to posts state
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
      // For logged-out users in workflow mode, check if analysis is completed
      if (forceWorkflowMode && !user) {
        if (!stepResults?.home?.analysisCompleted) {
          setGeneratingContent(false);
          message.warning('Please complete website analysis first before generating content topics.');
          return;
        }
      } else if (!user) {
        // For logged-out users not in workflow mode, trigger sign-up
        setGeneratingContent(false);
        return requireSignUp('Generate AI content topics', 'Start creating content');
      }

      // Debug the analysis data being passed
      const analysisData = stepResults?.home?.websiteAnalysis || {};
      const selectedStrategy = selectedCustomerStrategy || tabMode.tabWorkflowData?.selectedCustomerStrategy;
      
      console.log('🔍 Topic generation debug:', {
        hasAnalysisData: !!analysisData,
        analysisKeys: Object.keys(analysisData),
        businessType: analysisData.businessType,
        targetAudience: analysisData.targetAudience,
        contentFocus: analysisData.contentFocus,
        selectedStrategy: !!selectedStrategy,
        stepResults: !!stepResults?.home
      });

      // Check if we have the minimum required data for topic generation
      if (!analysisData.businessType && !analysisData.targetAudience) {
        console.warn('⚠️ Missing website analysis data for topic generation');
        message.warning('Website analysis data is required for topic generation. Please analyze your website first.');
        setGeneratingContent(false);
        return;
      }

      const result = await topicAPI.generateTrendingTopics(
        analysisData,
        selectedStrategy,
        stepResults?.home?.webSearchInsights || {}
      );

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
    // Check authentication first
    if (!user) {
      return requireSignUp('Create your blog post', 'Get your first post');
    }

    // Check user quota before generation
    try {
      const credits = await api.getUserCredits();
      const remainingPosts = credits.totalCredits - credits.usedCredits;

      if (remainingPosts <= 0) {
        Modal.warning({
          title: 'Content Generation Limit Reached',
          content: (
            <div>
              <p>You've used all {credits.totalCredits} of your available posts this period.</p>
              <p style={{ fontWeight: 600, marginTop: '16px' }}>Options to continue:</p>
              <ul style={{ marginTop: '8px' }}>
                <li>Upgrade to Creator plan (4 posts/month) for $20/month</li>
                <li>Upgrade to Professional plan (8 posts/month) for $50/month</li>
                <li>Refer friends to earn bonus posts (1 post per referral)</li>
              </ul>
              <Button
                type="primary"
                onClick={() => {
                  Modal.destroyAll();
                  // Navigate to Settings → Subscriptions
                  const settingsTab = document.querySelector('[data-node-key="settings"]');
                  if (settingsTab) settingsTab.click();
                }}
                style={{ marginTop: '12px' }}
              >
                View Plans
              </Button>
            </div>
          ),
          okText: 'Got it',
        });
        return; // Stop generation
      }

      // Show warning when low on posts
      if (remainingPosts <= 2) {
        message.warning(
          `You have ${remainingPosts} post${remainingPosts === 1 ? '' : 's'} remaining. Consider upgrading your plan.`,
          6
        );
      }
    } catch (error) {
      console.warn('Could not check quota, proceeding with generation:', error);
      // Allow generation to proceed if quota check fails (backend will enforce)
    }

    const topic = availableTopics.find(t => t.id === topicId);
    if (!topic) return;
    
    setSelectedTopic(topic);
    setGeneratingContent(true);
    
    // Add to progressive sticky header
    addStickyWorkflowStep('topicSelection', {
      title: topic.title,
      topicName: topic.title,
      description: topic.description,
      category: topic.category,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Determine if enhanced generation should be used based on available organization data
      const websiteAnalysisData = stepResults?.home?.websiteAnalysis || {};
      const hasWebsiteAnalysis = websiteAnalysisData && Object.keys(websiteAnalysisData).length > 0;
      
      // Enable enhanced generation if we have organization ID and analysis data
      const shouldUseEnhancement = !!(organizationId && hasWebsiteAnalysis);
      
      console.log('🔍 Enhancement decision:', {
        organizationId,
        organizationName,
        hasWebsiteAnalysis,
        shouldUseEnhancement,
        useEnhancedGeneration,
        finalDecision: shouldUseEnhancement,
        websiteAnalysisKeys: Object.keys(websiteAnalysisData)
      });

      const enhancementOptions = {
        useEnhancedGeneration: shouldUseEnhancement,
        goal: contentStrategy.goal,
        voice: contentStrategy.voice,
        template: contentStrategy.template,
        length: contentStrategy.length,
        includeCaseStudies: true,
        emphasizeROI: true,
        includeActionables: true,
        addStatistics: true,
        // Pass organization context for enhanced generation
        organizationId: organizationId,
        organizationName: organizationName,
        comprehensiveContext: shouldUseEnhancement ? {
          organizationId: organizationId,
          organizationName: organizationName,
          websiteAnalysis: websiteAnalysisData
        } : null,
        targetSEOScore: 95,
        includeVisuals: shouldUseEnhancement
      };

      const result = await contentAPI.generateContent(
        topic, // selectedTopic
        stepResults?.home?.websiteAnalysis || {}, // analysisData
        tabMode.tabWorkflowData?.selectedCustomerStrategy, // selectedStrategy
        stepResults?.home?.webSearchInsights || {}, // webSearchInsights
        enhancementOptions // Enhanced generation options
      );
      
      if (result.success) {
        setEditingContent(result.content);
        setContentGenerated(true);
        
        // Store enhanced metadata if available
        console.log('🔍 DEBUG: Generation result structure:', {
          hasResult: !!result,
          resultKeys: result ? Object.keys(result) : [],
          hasEnhancedMetadata: !!result.enhancedMetadata,
          hasSeoAnalysis: !!result.seoAnalysis,
          hasContentQuality: !!result.contentQuality,
          useEnhancedGeneration,
          enhancementOptions
        });
        
        if (result.enhancedMetadata || result.seoAnalysis || result.visualSuggestions) {
          const metadata = {
            seoAnalysis: result.seoAnalysis,
            contentQuality: result.contentQuality,
            strategicElements: result.strategicElements,
            improvementSuggestions: result.improvementSuggestions,
            keywordOptimization: result.keywordOptimization,
            generationContext: result.generationContext,
            visualSuggestions: result.visualSuggestions || []
          };
          setEnhancedMetadata(metadata);
          setSeoAnalysisVisible(true); // Show analysis by default for enhanced generation
          console.log('📊 Enhanced metadata captured:', metadata);
          
          // Log visual suggestions specifically
          if (result.visualSuggestions && result.visualSuggestions.length > 0) {
            console.log('🎨 Visual suggestions received:', result.visualSuggestions);
          }
        } else {
          console.log('⚠️ No enhanced metadata found in result');
        }
        
        // Create initial post in database immediately
        const initialPost = {
          title: topic.title,
          content: result.content,
          status: 'draft',
          topic_data: topic,
          generation_metadata: {
            strategy: contentStrategy,
            generatedAt: new Date().toISOString(),
            wordCount: result.content.length
          }
        };
        
        // Save to database and get real post ID
        const saveResult = await api.createPost(initialPost);
        if (saveResult.success) {
          setCurrentDraft({
            id: saveResult.post.id, // Use real database ID
            title: topic.title,
            content: result.content,
            status: 'draft',
            createdAt: saveResult.post.created_at,
            topic: topic,
            blogPost: result.blogPost
          });
          
          // Initialize autosave state for new content
          setLastSavedContent(result.content); // Mark as saved since we just saved
          setLastSaved(new Date());
          setIsAutosaving(false);
          setAutosaveError(null);
          
          // Update posts list
          setPosts(prevPosts => [saveResult.post, ...prevPosts]);

          message.success('Blog content generated and saved!');

          // Refresh quota counter after successful post creation
          if (onQuotaUpdate) {
            onQuotaUpdate();
          }
        } else {
          // Fallback to old behavior if save fails
          setCurrentDraft({
            id: null, // No ID means this needs to be created on first save
            title: topic.title,
            content: result.content,
            status: 'draft',
            createdAt: new Date().toISOString(),
            topic: topic,
            blogPost: result.blogPost
          });
          
          // Initialize autosave state for new content
          setLastSavedContent(''); // Mark as unsaved initially
          setLastSaved(null);
          setIsAutosaving(false);
          setAutosaveError(null);
          
          message.success('Blog content generated successfully!');
        }
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
  
  // Autosave function - saves silently without user notifications
  const handleAutosave = async (showUserFeedback = false) => {
    if (currentDraft) {
      try {
        const isUpdate = currentDraft.id && currentDraft.id !== null; // Check if this is an update
        
        // Check if content has actually changed since last save
        if (!showUserFeedback && editingContent === lastSavedContent) {
          console.log('⏭️ Skipping autosave - no changes detected');
          return { success: true, skipped: true };
        }
        
        console.log(isUpdate ? '🔄 Autosaving existing post...' : '💾 Autosaving new draft...');
        setIsAutosaving(true);
        setAutosaveError(null);
        
        if (showUserFeedback) {
          setLoading(true); // Show loading state for manual saves only
        }
        
        const postData = {
          title: currentDraft.title,
          content: currentDraft.content,
          status: 'draft',
          topic_data: currentDraft.topic,
          generation_metadata: {
            strategy: contentStrategy,
            generatedAt: new Date().toISOString(),
            wordCount: currentDraft.content.length
          }
        };
        
        const result = isUpdate 
          ? await api.updatePost(currentDraft.id, postData)
          : await api.createPost(postData);
        
        if (result.success) {
          if (isUpdate) {
            // Update existing post in the list
            setPosts(prevPosts => 
              prevPosts.map(p => p.id === currentDraft.id ? result.post : p)
            );
          } else {
            // Add new post to the list
            setPosts(prevPosts => [result.post, ...prevPosts]);

            // Refresh quota counter after creating a new post
            if (onQuotaUpdate) {
              onQuotaUpdate();
            }
          }

          // Update last saved content and timestamp
          setLastSavedContent(editingContent);
          setLastSaved(new Date());
          
          // Reload posts from server to ensure consistency (only if not autosave)
          if (showUserFeedback) {
            setTimeout(() => {
              loadPosts();
            }, 100);
          }
          
          // Show success message only for manual saves
          if (showUserFeedback) {
            message.success(
              <div>
                {isUpdate ? 'Post updated successfully!' : 'Draft saved successfully!'} 
                <div style={{ marginTop: '8px' }}>
                  <Button 
                    type="link" 
                    size="small"
                    onClick={() => {
                      // Reset workflow state to return to posts list
                      setContentGenerated(false);
                      setCurrentDraft(null);
                      setSelectedTopic(null);
                      setEditingContent('');
                      setAvailableTopics([]);
                      setLastSavedContent('');
                      setLastSaved(null);
                      message.destroy(); // Close the message
                    }}
                    style={{ padding: 0, height: 'auto' }}
                  >
                    Return to Posts List
                  </Button>
                </div>
              </div>,
              10 // Show for 10 seconds
            );
          }
          
          // Update the current draft with the saved post ID for future updates
          setCurrentDraft(prev => ({
            ...prev,
            id: result.post.id,
            createdAt: result.post.created_at
          }));
          
          console.log(isUpdate ? '✅ Post autosaved successfully' : '✅ Draft autosaved successfully');
          return { success: true, post: result.post };
        } else {
          throw new Error(result.error || 'Failed to save draft');
        }
      } catch (error) {
        console.error('❌ Autosave failed:', error);
        setAutosaveError(error.message);
        
        // Show error message only for manual saves or critical autosave failures
        if (showUserFeedback) {
          message.error(`Failed to save draft: ${error.message}`);
        }
        
        return { success: false, error: error.message };
      } finally {
        setIsAutosaving(false);
        if (showUserFeedback) {
          setLoading(false); // Clear loading state
        }
      }
    }
    return { success: false, error: 'No draft to save' };
  };

  // Content strategy helper functions
  const handleStrategyChange = (type, value) => {
    setContentStrategy(prev => ({
      ...prev,
      [type]: value
    }));
  };

  // Typography handler
  const handleTypographyChange = (newTypography) => {
    setTypography(newTypography);
  };

  // Calculate word count
  const getWordCount = (text) => {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  };

  // Format text insertion handler for toolbar
  const handleTextInsert = (before, after = '', placeholder = 'text') => {
    // For now, just append the formatting to the content
    // In a full implementation, this would handle cursor position
    const newText = before + placeholder + after;
    const updatedContent = editingContent + '\n' + newText;
    handleContentChange(updatedContent);
  };

  const getStrategyDisplayText = (type, value) => {
    const displays = {
      goal: {
        'awareness': 'Awareness - Build brand recognition',
        'consideration': 'Consideration - Build trust, compare solutions',
        'conversion': 'Conversion - Drive sales, generate leads',
        'retention': 'Retention - Engage existing customers'
      },
      voice: {
        'expert': 'Professional Expert - Authoritative, data-driven',
        'friendly': 'Friendly Guide - Conversational, supportive',
        'insider': 'Industry Insider - Technical, insider knowledge',
        'storyteller': 'Storyteller - Narrative-driven, emotional'
      },
      template: {
        'how-to': 'How-To Guide - Step-by-step, actionable',
        'problem-solution': 'Problem-Solution - Identify issue, provide solution',
        'listicle': 'Listicle - Top X tips/strategies/tools',
        'case-study': 'Case Study - Real example, results-focused',
        'comprehensive': 'Comprehensive Guide - In-depth, authoritative'
      },
      length: {
        'quick': 'Quick Read - 800-1000 words',
        'standard': 'Standard - 1200-1500 words',
        'deep': 'Deep Dive - 2000+ words'
      }
    };
    return displays[type]?.[value] || value;
  };


  // Load analysis data if missing for authenticated users
  useEffect(() => {
    const loadMissingAnalysisData = async () => {
      if (user && (!stepResults?.home?.websiteAnalysis || 
                   Object.keys(stepResults?.home?.websiteAnalysis || {}).length === 0)) {
        try {
          console.log('🔍 Loading recent analysis data for authenticated user...');
          const response = await api.getRecentAnalysis();
          if (response?.success && response?.analysis) {
            console.log('✅ Loaded recent analysis data');
            // This should trigger the workflow context to update
            // The data will be available in stepResults on next render
          }
        } catch (error) {
          console.log('🔍 No recent analysis data found:', error.message);
        }
      }
    };
    
    loadMissingAnalysisData();
  }, [user, stepResults?.home?.websiteAnalysis]);

  // Initialize topics if arriving from audience workflow
  useEffect(() => {
    const analysisData = stepResults?.home?.websiteAnalysis || {};
    const hasMinimumAnalysisData = analysisData.businessType || analysisData.targetAudience;
    
    if ((tabMode.mode === 'workflow' || forceWorkflowMode) && 
        !availableTopics.length && 
        !generatingContent &&
        hasMinimumAnalysisData) {
      // Add a small delay to ensure UI is ready
      setTimeout(() => {
        handleGenerateTopics();
      }, 500);
    }
  }, [tabMode.mode, tabMode.tabWorkflowData, availableTopics.length, generatingContent, selectedCustomerStrategy, stepResults?.home?.websiteAnalysis]);

  // Edit post functionality - restore post to editor
  const handleEditPost = (post) => {
    try {
      console.log('✏️ Loading post for editing:', post.title);

      // Parse topic data if it exists
      let topicData = null;
      if (post.topic_data) {
        try {
          topicData = typeof post.topic_data === 'string' 
            ? JSON.parse(post.topic_data) 
            : post.topic_data;
        } catch (error) {
          console.warn('Failed to parse topic_data:', error);
        }
      }

      // Parse generation metadata if it exists
      let metadata = null;
      if (post.generation_metadata) {
        try {
          metadata = typeof post.generation_metadata === 'string'
            ? JSON.parse(post.generation_metadata)
            : post.generation_metadata;
        } catch (error) {
          console.warn('Failed to parse generation_metadata:', error);
        }
      }

      // Restore editor state
      setCurrentDraft({
        id: post.id,
        title: post.title,
        content: post.content,
        topic: topicData
      });
      
      setEditingContent(post.content);
      setContentGenerated(true);
      console.log('🔧 DEBUG: contentGenerated set to true, editorViewMode should show');
      console.log('🔧 DEBUG: Current state after handleEditPost - contentGenerated:', true, 'editorViewMode:', editorViewMode);
      
      // Restore topic if available
      if (topicData) {
        setSelectedTopic(topicData);
        setAvailableTopics([topicData]); // Add current topic to available topics
      }

      // Restore content strategy if available
      if (metadata?.strategy) {
        setContentStrategy(metadata.strategy);
      }

      // Initialize autosave state
      setLastSavedContent(post.content);
      setLastSaved(new Date(post.updated_at || post.created_at));
      setIsAutosaving(false);
      setAutosaveError(null);

      message.success('Post loaded for editing!');
      console.log('✅ Post editing state restored');
      
    } catch (error) {
      console.error('❌ Failed to load post for editing:', error);
      message.error('Failed to load post for editing');
    }
  };

  // Export post directly from table
  const handleExportPost = (post) => {
    try {
      console.log('📤 Exporting post:', post.title);
      
      // Create a blob with the post content
      const blob = new Blob([post.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${post.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      message.success('Post exported successfully!');
      console.log('✅ Post exported:', post.title);
      
    } catch (error) {
      console.error('❌ Export error:', error);
      message.error('Failed to export post');
    }
  };

  // Close post function - saves final changes and returns to posts list
  const handleClosePost = async () => {
    try {
      // Perform final save if there are unsaved changes
      if (editingContent !== lastSavedContent && editingContent.trim()) {
        console.log('💾 Performing final save before closing...');
        const result = await handleAutosave(false);
        if (!result.success && !result.skipped) {
          // If final save fails, warn user
          const confirmed = window.confirm(
            'Failed to save your latest changes. Do you want to close anyway? Unsaved changes will be lost.'
          );
          if (!confirmed) {
            return; // Don't close if user cancels
          }
        }
      }
      
      // Reset all editor state and return to posts list
      setContentGenerated(false);
      setCurrentDraft(null);
      setSelectedTopic(null);
      setEditingContent('');
      setAvailableTopics([]);
      setLastSavedContent('');
      setLastSaved(null);
      setIsAutosaving(false);
      setAutosaveError(null);
      
      // Reload posts to show any final changes
      loadPosts();
      
      console.log('✅ Post closed successfully');
      
    } catch (error) {
      console.error('❌ Error closing post:', error);
      message.error('Error closing post. Please try again.');
    }
  };

  // Handle manual CTA submission
  const handleManualCTAsSubmit = async (ctas) => {
    try {
      if (!organizationId) {
        message.error('Organization ID not found');
        return;
      }

      const response = await api.addManualCTAs(organizationId, ctas);

      if (response.success) {
        message.success(`Successfully added ${response.ctas_added} CTAs`);

        // Refresh CTA list
        const updatedCTAs = await api.getOrganizationCTAs(organizationId);
        setOrganizationCTAs(updatedCTAs.ctas || []);
        setHasSufficientCTAs(updatedCTAs.has_sufficient_ctas || false);

        setShowManualCTAModal(false);
      }
    } catch (error) {
      console.error('Failed to add manual CTAs:', error);
      message.error('Failed to add CTAs. Please try again.');
    }
  };

  // Handle user choosing to skip manual CTA entry
  const handleSkipManualCTAs = () => {
    message.info('Continuing without additional CTAs');
    setShowManualCTAModal(false);
  };

  const getPostActions = (post) => {
    const actions = [
      {
        key: 'edit',
        label: 'Edit',
        icon: <EditOutlined />,
        onClick: () => handleEditPost(post)
      },
      {
        key: 'export',
        label: 'Export',
        icon: <ExportOutlined />,
        onClick: () => handleExportPost(post)
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
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => {
        if (!date) return 'N/A';
        try {
          return format(new Date(date), 'MMM dd, yyyy');
        } catch (error) {
          console.warn('Invalid date value:', date);
          return 'Invalid Date';
        }
      }
    },
    {
      title: 'Exports',
      dataIndex: 'export_count',
      key: 'export_count',
      render: (count) => count || 0
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

  // Component state tracking (debug logging removed to prevent infinite loops)

  // Show simplified interface when no posts exist AND not in workflow mode
  if (posts.length === 0 && !loading && tabMode.mode === 'focus' && !forceWorkflowMode) {
    return (
      <div>
        
        {/* Workflow Guidance */}
        {(tabMode.mode === 'workflow' || forceWorkflowMode) && (
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
          {(tabMode.mode === 'workflow' || forceWorkflowMode) ? (
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
                          disabled={!tabMode.tabWorkflowData?.selectedCustomerStrategy}
                        >
                          {!tabMode.tabWorkflowData?.selectedCustomerStrategy
                            ? 'Select an audience first'
                            : user
                              ? (user.postsRemaining > 0 ? 'Create blog post' : 'Buy more posts')
                              : 'Register to claim free post'
                          }
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
                                  <Tag color="purple">{contentStrategy.goal || 'awareness'}</Tag>
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
                                    {isGenerating ? 'Generating Content...' : 
                                     user ? 'Create Post' : 'Get One Free Post'}
                                  </Button>
                                  
                                  <Button
                                    size="large"
                                    icon={user ? <EditOutlined /> : <LockOutlined />}
                                    onClick={() => {
                                      if (!user) {
                                        requireSignUp('Edit content strategy', 'Customize your approach');
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                      <Text strong style={{ color: defaultColors.primary, fontSize: '13px' }}>
                                        🚀 Conversion Elements
                                      </Text>
                                      {!hasSufficientCTAs && (
                                        <Button
                                          size="small"
                                          type="link"
                                          icon={<PlusOutlined />}
                                          onClick={() => setShowManualCTAModal(true)}
                                          style={{ fontSize: '12px', padding: 0 }}
                                        >
                                          Add More
                                        </Button>
                                      )}
                                    </div>

                                    {ctasLoading ? (
                                      <Text style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                                        Loading CTAs...
                                      </Text>
                                    ) : organizationCTAs.length > 0 ? (
                                      <div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>
                                          {organizationCTAs.slice(0, 3).map((cta, index) => (
                                            <div key={cta.id || index} style={{ marginBottom: '2px' }}>
                                              • {cta.text}
                                            </div>
                                          ))}
                                        </div>
                                        {!hasSufficientCTAs && organizationCTAs.length < 3 && (
                                          <Text style={{ fontSize: '11px', color: '#ff4d4f', marginTop: '4px', display: 'block' }}>
                                            ⚠️ {3 - organizationCTAs.length} more CTA{3 - organizationCTAs.length !== 1 ? 's' : ''} recommended
                                          </Text>
                                        )}
                                      </div>
                                    ) : (
                                      <Text style={{ fontSize: '12px', color: '#666' }}>
                                        Strategic CTAs aligned with your primary business objectives and customer journey
                                      </Text>
                                    )}
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
                                requireSignUp('Unlock more content ideas', 'Access premium features');
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
                          type={editorViewMode === 'edit' ? "primary" : "default"}
                          icon={<EditOutlined />}
                          onClick={() => {
                            console.log('🔧 DEBUG: Edit button clicked, editorViewMode:', editorViewMode);
                            setEditorViewMode('edit');
                            setPreviewMode(false);
                          }}
                          size="small"
                        >
                          Edit
                        </Button>
                        <Button 
                          type={editorViewMode === 'preview' ? "primary" : "default"}
                          icon={<EyeOutlined />}
                          onClick={() => {
                            console.log('🔧 DEBUG: Preview button clicked, editorViewMode:', editorViewMode);
                            setEditorViewMode('preview');
                            setPreviewMode(true);
                          }}
                          size="small"
                        >
                          Preview
                        </Button>
                        <Button 
                          type={editorViewMode === 'split' ? "primary" : "default"}
                          onClick={() => {
                            console.log('🔧 DEBUG: Split View button clicked, editorViewMode:', editorViewMode);
                            setEditorViewMode('split');
                            setPreviewMode(false);
                          }}
                          size="small"
                          style={{ 
                            marginLeft: '4px',
                            backgroundColor: editorViewMode === 'split' ? '#1890ff' : '#52c41a',
                            borderColor: editorViewMode === 'split' ? '#1890ff' : '#52c41a',
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        >
                          🔀 Split View
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
                  
                  {/* Enhanced Generation Toggle - Standalone Panel */}
                  {console.log('🔧 DEBUG: Rendering Enhanced Generation Toggle', { useEnhancedGeneration, selectedTopic: !!selectedTopic }) && null}
                  <div style={{ 
                    marginBottom: '20px',
                    padding: '16px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '8px',
                    border: '1px solid #e0f2fe'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <div>
                        <Text strong style={{ fontSize: '14px', color: '#0369a1' }}>
                          Enhanced AI Generation
                        </Text>
                        <div style={{ fontSize: '12px', color: '#0369a1', marginTop: '2px' }}>
                          Comprehensive context, SEO optimization, strategic CTAs
                        </div>
                      </div>
                      <Switch
                        checked={useEnhancedGeneration}
                        onChange={setUseEnhancedGeneration}
                        checkedChildren="Enhanced"
                        unCheckedChildren="Standard"
                      />
                    </div>
                  </div>

                  {/* Content Strategy Panel */}
                  <div style={{ 
                    marginBottom: '20px',
                    border: `2px solid ${previewMode ? '#e8e8e8' : defaultColors.primary}`,
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      backgroundColor: previewMode ? '#fafafa' : defaultColors.primary + '10',
                      padding: '16px',
                      borderBottom: previewMode ? '1px solid #e8e8e8' : `1px solid ${defaultColors.primary}30`
                    }}>
                      <Text strong style={{ 
                        fontSize: '16px', 
                        color: previewMode ? '#666' : defaultColors.primary 
                      }}>
                        Content Strategy
                      </Text>
                    </div>
                    
                    <div style={{ padding: '20px' }}>
                      {previewMode ? (
                        // Strategy Preview
                        <Row gutter={[16, 16]}>
                          <Col span={12}>
                            <Text style={{ fontSize: '13px', color: '#999' }}>Goal:</Text>
                            <div style={{ fontSize: '15px', fontWeight: 500 }}>
                              {getStrategyDisplayText('goal', contentStrategy.goal)}
                            </div>
                          </Col>
                          <Col span={12}>
                            <Text style={{ fontSize: '13px', color: '#999' }}>Voice:</Text>
                            <div style={{ fontSize: '15px', fontWeight: 500 }}>
                              {getStrategyDisplayText('voice', contentStrategy.voice)}
                            </div>
                          </Col>
                          <Col span={12}>
                            <Text style={{ fontSize: '13px', color: '#999' }}>Template:</Text>
                            <div style={{ fontSize: '15px', fontWeight: 500 }}>
                              {getStrategyDisplayText('template', contentStrategy.template)}
                            </div>
                          </Col>
                          <Col span={12}>
                            <Text style={{ fontSize: '13px', color: '#999' }}>Length:</Text>
                            <div style={{ fontSize: '15px', fontWeight: 500 }}>
                              {getStrategyDisplayText('length', contentStrategy.length)}
                            </div>
                          </Col>
                        </Row>
                      ) : (
                        // Strategy Editor
                        <Row gutter={[16, 16]}>
                          <Col span={responsive.isMobile ? 24 : 12}>
                            <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                              Content Goal
                            </Text>
                            <Select
                              value={contentStrategy.goal}
                              style={{ width: '100%' }}
                              onChange={(value) => handleStrategyChange('goal', value)}
                            >
                              <Select.Option value="awareness">Awareness - Build brand recognition</Select.Option>
                              <Select.Option value="consideration">Consideration - Build trust, compare solutions</Select.Option>
                              <Select.Option value="conversion">Conversion - Drive sales, generate leads</Select.Option>
                              <Select.Option value="retention">Retention - Engage existing customers</Select.Option>
                            </Select>
                          </Col>
                          <Col span={responsive.isMobile ? 24 : 12}>
                            <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                              Voice & Tone
                            </Text>
                            <Select
                              value={contentStrategy.voice}
                              style={{ width: '100%' }}
                              onChange={(value) => handleStrategyChange('voice', value)}
                            >
                              <Select.Option value="expert">Professional Expert - Authoritative, data-driven</Select.Option>
                              <Select.Option value="friendly">Friendly Guide - Conversational, supportive</Select.Option>
                              <Select.Option value="insider">Industry Insider - Technical, insider knowledge</Select.Option>
                              <Select.Option value="storyteller">Storyteller - Narrative-driven, emotional</Select.Option>
                            </Select>
                          </Col>
                          <Col span={responsive.isMobile ? 24 : 12}>
                            <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                              Content Template
                            </Text>
                            <Select
                              value={contentStrategy.template}
                              style={{ width: '100%' }}
                              onChange={(value) => handleStrategyChange('template', value)}
                            >
                              <Select.Option value="how-to">How-To Guide - Step-by-step, actionable</Select.Option>
                              <Select.Option value="problem-solution">Problem-Solution - Identify issue, provide solution</Select.Option>
                              <Select.Option value="listicle">Listicle - Top X tips/strategies/tools</Select.Option>
                              <Select.Option value="case-study">Case Study - Real example, results-focused</Select.Option>
                              <Select.Option value="comprehensive">Comprehensive Guide - In-depth, authoritative</Select.Option>
                            </Select>
                          </Col>
                          <Col span={responsive.isMobile ? 24 : 12}>
                            <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                              Content Length
                            </Text>
                            <Select
                              value={contentStrategy.length}
                              style={{ width: '100%' }}
                              onChange={(value) => handleStrategyChange('length', value)}
                            >
                              <Select.Option value="quick">Quick Read - 800-1000 words</Select.Option>
                              <Select.Option value="standard">Standard - 1200-1500 words</Select.Option>
                              <Select.Option value="deep">Deep Dive - 2000+ words</Select.Option>
                            </Select>
                          </Col>
                        </Row>
                      )}
                    </div>
                  </div>
                  
                  {editorViewMode === 'preview' ? (
                    // Preview Only Mode
                    <div style={{ 
                      border: '1px solid #f0f0f0',
                      borderRadius: '6px',
                      padding: '20px',
                      backgroundColor: '#fafafa',
                      minHeight: '400px'
                    }}>
                      <MarkdownPreview 
                        content={editingContent || 'No content generated yet.'} 
                        typography={typography}
                        style={{ minHeight: '360px' }}
                      />
                    </div>
                  ) : editorViewMode === 'split' ? (
                    // Split Pane Mode with Typography Settings
                    <div>
                      {/* Typography Settings Panel */}
                      <div style={{ marginBottom: '16px' }}>
                        <TypographySettings 
                          typography={typography}
                          onTypographyChange={handleTypographyChange}
                        />
                      </div>
                      
                      {/* Split Editor */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '16px', 
                        minHeight: '500px',
                        border: '1px solid #f0f0f0',
                        borderRadius: '6px',
                        overflow: 'hidden'
                      }}>
                      {/* Edit Pane */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <FormattingToolbar 
                          onInsert={handleTextInsert}
                          wordCount={getWordCount(editingContent)}
                          showStats={false}
                          style={{ 
                            borderRadius: 0,
                            borderBottom: '1px solid #e0e0e0',
                            fontSize: '11px'
                          }}
                        />
                        <TextArea
                          value={editingContent}
                          onChange={(e) => handleContentChange(e.target.value)}
                          placeholder="Your generated content will appear here for editing..."
                          bordered={false}
                          style={{ 
                            fontFamily: 'Consolas, Monaco, "Courier New", monospace', 
                            fontSize: '13px', 
                            lineHeight: '1.5',
                            flex: 1,
                            resize: 'none',
                            minHeight: '430px'
                          }}
                        />
                      </div>
                      
                      {/* Divider */}
                      <div style={{ 
                        width: '1px', 
                        backgroundColor: '#f0f0f0',
                        cursor: 'col-resize'
                      }} />
                      
                      {/* Preview Pane */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ 
                          padding: '8px 12px', 
                          backgroundColor: '#fafafa', 
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#666'
                        }}>
                          Live Preview
                        </div>
                        <div style={{ 
                          padding: '16px',
                          backgroundColor: '#fafafa',
                          flex: 1,
                          overflow: 'auto'
                        }}>
                          <MarkdownPreview 
                            content={editingContent}
                            typography={typography}
                            style={{ minHeight: '420px' }}
                          />
                        </div>
                      </div>
                      </div>
                    </div>
                  ) : (
                    // Edit Only Mode
                    <div style={{ 
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      overflow: 'hidden'
                    }}>
                      <FormattingToolbar 
                        onInsert={handleTextInsert}
                        wordCount={getWordCount(editingContent)}
                        style={{ borderRadius: '6px 6px 0 0' }}
                      />
                      <TextArea
                        value={editingContent}
                        onChange={(e) => handleContentChange(e.target.value)}
                        placeholder="Your generated content will appear here for editing..."
                        rows={22}
                        bordered={false}
                        style={{ 
                          fontFamily: 'Consolas, Monaco, "Courier New", monospace', 
                          fontSize: '13px', 
                          lineHeight: '1.5',
                          borderRadius: '0 0 6px 6px'
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Action Buttons - Different for workflow vs focus mode */}
                  <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                    {(tabMode.mode === 'workflow' || forceWorkflowMode) ? (
                      // Workflow Mode: Only Export button
                      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                        <Space>
                          <SaveStatusIndicator 
                            isAutosaving={isAutosaving}
                            lastSaved={lastSaved}
                            autosaveError={autosaveError}
                          />
                          <Button 
                            type="primary"
                            icon={<ExportOutlined />}
                            onClick={() => setShowExportModal(true)}
                            disabled={!editingContent.trim() || postState === 'exported'}
                            style={{
                              backgroundColor: postState === 'exported' ? '#52c41a' : defaultColors.primary,
                              borderColor: postState === 'exported' ? '#52c41a' : defaultColors.primary,
                              fontWeight: '500',
                              minWidth: '180px'
                            }}
                          >
                            {postState === 'exported' ? 'Content Exported' : 'Export Content'}
                          </Button>
                        </Space>
                      </div>
                    ) : (
                      // Focus Mode: Original buttons (Close, Start Over, Export)
                      <>
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
                          <SaveStatusIndicator 
                            isAutosaving={isAutosaving}
                            lastSaved={lastSaved}
                            autosaveError={autosaveError}
                          />
                          <Button 
                            type="default"
                            onClick={handleClosePost}
                            style={{ marginRight: '8px' }}
                          >
                            Close Post
                          </Button>
                          <Button 
                            type="primary"
                            icon={<ExportOutlined />}
                            onClick={() => setShowExportModal(true)}
                            disabled={!editingContent.trim()}
                            style={{
                              backgroundColor: defaultColors.primary,
                              borderColor: defaultColors.primary,
                              fontWeight: '500'
                            }}
                          >
                            Export Content
                          </Button>
                        </Space>
                      </>
                    )}
                  </div>
                </Card>
              )}
            </div>
          ) : (
            // Focus Mode: Show Empty State for No Posts
            <Card 
              title="Blog Posts"
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
      
      {/* Workflow Guidance - Only show when in workflow mode AND audience is selected */}
      {(tabMode.mode === 'workflow' || forceWorkflowMode) && tabMode.tabWorkflowData?.selectedCustomerStrategy && (
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
      
      {/* WORKFLOW MODE CONTENT */}
      {(tabMode.mode === 'workflow' || forceWorkflowMode) && (
        <div style={{ padding: '24px' }}>
          {/* Preview topic cards when no audience selected */}
          {!selectedCustomerStrategy && (
            <Card title="Content Topics Preview" style={{ marginBottom: '24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <Paragraph style={{ fontSize: '16px', color: '#666', marginBottom: '16px' }}>
                  Select an audience strategy to generate personalized content topics like these:
                </Paragraph>
              </div>
              
              <Row gutter={[16, 16]}>
                {/* Preview Topic Card 1 */}
                <Col xs={24} md={12}>
                  <Card 
                    hoverable
                    cover={
                      <div style={{
                        height: '200px',
                        background: 'linear-gradient(135deg, #667eea30 0%, #764ba230 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#999',
                        fontSize: '16px',
                        fontWeight: 500,
                        padding: '20px',
                        textAlign: 'center',
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          background: 'rgba(255,255,255,0.9)',
                          padding: '12px 20px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: '#666'
                        }}>
                          🎯 Topic Preview
                        </div>
                      </div>
                    }
                    style={{
                      border: '2px dashed #d9d9d9',
                      opacity: 0.6
                    }}
                  >
                    {/* Preview Tags */}
                    <div style={{ marginBottom: '12px' }}>
                      <Tag color="blue">Content</Tag>
                      <Tag color="purple">Strategy</Tag>
                      <Tag color="orange">Expert</Tag>
                    </div>
                    
                    {/* Preview Title and Description */}
                    <Title level={4} style={{ marginBottom: '8px', color: '#ccc' }}>
                      Your Custom Topic Title
                    </Title>
                    <Paragraph style={{ color: '#999', fontSize: '14px', marginBottom: '12px' }}>
                      AI-generated content idea tailored specifically to your selected audience strategy and business goals.
                    </Paragraph>
                    
                    {/* Disabled Action Button */}
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                      <Button
                        type="primary"
                        size="large"
                        disabled
                        style={{
                          width: '100%',
                          marginBottom: '12px'
                        }}
                      >
                        Select Audience First
                      </Button>
                    </div>
                  </Card>
                </Col>

                {/* Preview Topic Card 2 */}
                <Col xs={24} md={12}>
                  <Card 
                    hoverable
                    cover={
                      <div style={{
                        height: '200px',
                        background: 'linear-gradient(135deg, #f093fb30 0%, #f5576c30 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#999',
                        fontSize: '16px',
                        fontWeight: 500,
                        padding: '20px',
                        textAlign: 'center',
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          background: 'rgba(255,255,255,0.9)',
                          padding: '12px 20px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: '#666'
                        }}>
                          📊 Topic Preview
                        </div>
                      </div>
                    }
                    style={{
                      border: '2px dashed #d9d9d9',
                      opacity: 0.6
                    }}
                  >
                    {/* Preview Tags */}
                    <div style={{ marginBottom: '12px' }}>
                      <Tag color="green">How-To</Tag>
                      <Tag color="purple">Conversion</Tag>
                      <Tag color="cyan">Standard</Tag>
                    </div>
                    
                    {/* Preview Title and Description */}
                    <Title level={4} style={{ marginBottom: '8px', color: '#ccc' }}>
                      Another Targeted Topic
                    </Title>
                    <Paragraph style={{ color: '#999', fontSize: '14px', marginBottom: '12px' }}>
                      Personalized content suggestions based on your audience's search behavior and pain points.
                    </Paragraph>
                    
                    {/* Disabled Action Button */}
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                      <Button
                        type="primary"
                        size="large"
                        disabled
                        style={{
                          width: '100%',
                          marginBottom: '12px'
                        }}
                      >
                        Select Audience First
                      </Button>
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* Call to Action */}
              <div style={{ textAlign: 'center', marginTop: '24px', padding: '20px', backgroundColor: '#f6ffed', borderRadius: '8px', border: '1px solid #b7eb8f' }}>
                <Title level={4} style={{ color: '#52c41a', marginBottom: '12px' }}>
                  Ready to Generate Your Topics?
                </Title>
                <Button 
                  type="primary" 
                  size="large"
                  icon={<TeamOutlined />}
                  onClick={() => {
                    const audienceSection = document.getElementById('audience-segments');
                    if (audienceSection) {
                      audienceSection.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                      });
                    }
                  }}
                  style={{
                    backgroundColor: '#52c41a',
                    borderColor: '#52c41a',
                    minWidth: '200px'
                  }}
                >
                  Select Audience Strategy
                </Button>
              </div>
            </Card>
          )}

          {/* ENHANCED TOPIC GENERATION SECTION - Available when audience is selected */}
          {selectedCustomerStrategy && (
          <div style={{ marginBottom: '24px' }}>
            {!contentGenerated ? (
              // Topic Generation Phase
              <Card title="Generate Content Topics" style={{ marginBottom: '24px' }}>
                <Paragraph style={{ color: '#666', marginBottom: '20px' }}>
                  {selectedCustomerStrategy ? 
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
                        disabled={!selectedCustomerStrategy}
                      >
                        {!selectedCustomerStrategy
                          ? 'Select an audience first'
                          : user
                            ? (user.postsRemaining > 0 ? 'Create blog post' : 'Buy more posts')
                            : 'Register to claim free post'
                        }
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
                                <Tag color="purple">{contentStrategy.goal || 'awareness'}</Tag>
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
                                  onClick={() => {
                                    if (user && user.postsRemaining === 0) {
                                      // Navigate to settings tab for subscriptions
                                      window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'settings' }));
                                    } else {
                                      handleTopicSelection(topic.id);
                                    }
                                  }}
                                  loading={isGenerating}
                                  style={{
                                    backgroundColor: defaultColors.primary,
                                    borderColor: defaultColors.primary,
                                    width: '100%',
                                    marginBottom: '12px'
                                  }}
                                >
                                  {isGenerating ? 'Generating Content...' :
                                   user ?
                                     (user.postsRemaining > 0 ? 'Create blog post' : 'Buy more posts') :
                                     'Register to claim free post'
                                  }
                                </Button>
                                
                                <Button
                                  size="large"
                                  icon={user ? <EditOutlined /> : <LockOutlined />}
                                  onClick={() => {
                                    if (!user) {
                                      requireSignUp('Edit content strategy', 'Customize your approach');
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
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <Text strong style={{ color: defaultColors.primary, fontSize: '13px' }}>
                                      🚀 Conversion Elements
                                    </Text>
                                    {!hasSufficientCTAs && (
                                      <Button
                                        size="small"
                                        type="link"
                                        icon={<PlusOutlined />}
                                        onClick={() => setShowManualCTAModal(true)}
                                        style={{ fontSize: '12px', padding: 0 }}
                                      >
                                        Add More
                                      </Button>
                                    )}
                                  </div>

                                  {ctasLoading ? (
                                    <Text style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                                      Loading CTAs...
                                    </Text>
                                  ) : organizationCTAs.length > 0 ? (
                                    <div>
                                      <div style={{ fontSize: '12px', color: '#666' }}>
                                        {organizationCTAs.slice(0, 3).map((cta, index) => (
                                          <div key={cta.id || index} style={{ marginBottom: '2px' }}>
                                            • {cta.text}
                                          </div>
                                        ))}
                                      </div>
                                      {!hasSufficientCTAs && organizationCTAs.length < 3 && (
                                        <Text style={{ fontSize: '11px', color: '#ff4d4f', marginTop: '4px', display: 'block' }}>
                                          ⚠️ {3 - organizationCTAs.length} more CTA{3 - organizationCTAs.length !== 1 ? 's' : ''} recommended
                                        </Text>
                                      )}
                                    </div>
                                  ) : (
                                    <Text style={{ fontSize: '12px', color: '#666' }}>
                                      Strategic CTAs aligned with your primary business objectives and customer journey
                                    </Text>
                                  )}
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
                              requireSignUp('Unlock more content ideas', 'Access premium features');
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

        {/* ENHANCED CONTENT EDITING SECTION - Available in both modes when content is generated */}
        {contentGenerated && (
          <div style={{ marginBottom: '24px' }}>
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

            {/* Enhanced Generation Toggle - Main Section */}
            <div style={{ 
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              border: '1px solid #e0f2fe'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div>
                  <Text strong style={{ fontSize: '14px', color: '#0369a1' }}>
                    Enhanced AI Generation
                  </Text>
                  <div style={{ fontSize: '12px', color: '#0369a1', marginTop: '2px' }}>
                    Comprehensive context, SEO optimization, strategic CTAs
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {editingContent && editingContent.length >= 200 && (
                    <Button
                      size="small"
                      type={seoAnalysisVisible ? "primary" : "default"}
                      icon={<TrophyOutlined />}
                      onClick={() => setSeoAnalysisVisible(!seoAnalysisVisible)}
                      style={{
                        fontSize: '12px',
                        height: '28px'
                      }}
                    >
                      {seoAnalysisVisible ? 'Hide Analysis' : 'Show SEO Analysis'}
                    </Button>
                  )}
                  <Switch
                    checked={useEnhancedGeneration}
                    onChange={setUseEnhancedGeneration}
                    checkedChildren="Enhanced"
                    unCheckedChildren="Standard"
                  />
                </div>
              </div>
            </div>

            {/* Content Strategy Panel */}
            <div style={{ 
              marginBottom: '20px',
              border: `2px solid ${previewMode ? '#e8e8e8' : defaultColors.primary}`,
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                backgroundColor: previewMode ? '#fafafa' : defaultColors.primary + '10',
                padding: '16px',
                borderBottom: previewMode ? '1px solid #e8e8e8' : `1px solid ${defaultColors.primary}30`
              }}>
                <Text strong style={{ 
                  fontSize: '16px', 
                  color: previewMode ? '#666' : defaultColors.primary 
                }}>
                  Content Strategy
                </Text>
              </div>
              
              <div style={{ padding: '20px' }}>
                {previewMode ? (
                  // Strategy Preview
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Text style={{ fontSize: '13px', color: '#999' }}>Goal:</Text>
                      <div style={{ fontSize: '15px', fontWeight: 500 }}>
                        {getStrategyDisplayText('goal', contentStrategy.goal)}
                      </div>
                    </Col>
                    <Col span={12}>
                      <Text style={{ fontSize: '13px', color: '#999' }}>Voice:</Text>
                      <div style={{ fontSize: '15px', fontWeight: 500 }}>
                        {getStrategyDisplayText('voice', contentStrategy.voice)}
                      </div>
                    </Col>
                    <Col span={12}>
                      <Text style={{ fontSize: '13px', color: '#999' }}>Template:</Text>
                      <div style={{ fontSize: '15px', fontWeight: 500 }}>
                        {getStrategyDisplayText('template', contentStrategy.template)}
                      </div>
                    </Col>
                    <Col span={12}>
                      <Text style={{ fontSize: '13px', color: '#999' }}>Length:</Text>
                      <div style={{ fontSize: '15px', fontWeight: 500 }}>
                        {getStrategyDisplayText('length', contentStrategy.length)}
                      </div>
                    </Col>
                  </Row>
                ) : (
                  // Strategy Editor
                  <Row gutter={[16, 16]}>
                    <Col span={responsive.isMobile ? 24 : 12}>
                      <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                        Content Goal
                      </Text>
                      <Select
                        value={contentStrategy.goal}
                        style={{ width: '100%' }}
                        onChange={(value) => handleStrategyChange('goal', value)}
                      >
                        <Select.Option value="awareness">Awareness - Build brand recognition</Select.Option>
                        <Select.Option value="consideration">Consideration - Build trust, compare solutions</Select.Option>
                        <Select.Option value="conversion">Conversion - Drive sales, generate leads</Select.Option>
                        <Select.Option value="retention">Retention - Engage existing customers</Select.Option>
                      </Select>
                    </Col>
                    <Col span={responsive.isMobile ? 24 : 12}>
                      <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                        Voice & Tone
                      </Text>
                      <Select
                        value={contentStrategy.voice}
                        style={{ width: '100%' }}
                        onChange={(value) => handleStrategyChange('voice', value)}
                      >
                        <Select.Option value="expert">Professional Expert - Authoritative, data-driven</Select.Option>
                        <Select.Option value="friendly">Friendly Guide - Conversational, supportive</Select.Option>
                        <Select.Option value="insider">Industry Insider - Technical, insider knowledge</Select.Option>
                        <Select.Option value="storyteller">Storyteller - Narrative-driven, emotional</Select.Option>
                      </Select>
                    </Col>
                    <Col span={responsive.isMobile ? 24 : 12}>
                      <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                        Content Template
                      </Text>
                      <Select
                        value={contentStrategy.template}
                        style={{ width: '100%' }}
                        onChange={(value) => handleStrategyChange('template', value)}
                      >
                        <Select.Option value="how-to">How-To Guide - Step-by-step, actionable</Select.Option>
                        <Select.Option value="problem-solution">Problem-Solution - Identify issue, provide solution</Select.Option>
                        <Select.Option value="listicle">Listicle - Top X tips/strategies/tools</Select.Option>
                        <Select.Option value="case-study">Case Study - Real example, results-focused</Select.Option>
                        <Select.Option value="comprehensive">Comprehensive Guide - In-depth, authoritative</Select.Option>
                      </Select>
                    </Col>
                    <Col span={responsive.isMobile ? 24 : 12}>
                      <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                        Content Length
                      </Text>
                      <Select
                        value={contentStrategy.length}
                        style={{ width: '100%' }}
                        onChange={(value) => handleStrategyChange('length', value)}
                      >
                        <Select.Option value="quick">Quick Read - 800-1000 words</Select.Option>
                        <Select.Option value="standard">Standard - 1200-1500 words</Select.Option>
                        <Select.Option value="deep">Deep Dive - 2000+ words</Select.Option>
                      </Select>
                    </Col>
                  </Row>
                )}
              </div>
            </div>
            
            {/* ENHANCED MODERN EDITOR SECTION */}
            <EditorLayout
              mode={editorViewMode}
              onModeChange={setEditorViewMode}
              isFullscreen={isEditorFullscreen}
              onToggleFullscreen={handleToggleFullscreen}
              toolbarContent={
                <EditorToolbar
                  editor={richTextEditor}
                  content={editingContent}
                  onInsert={handleTextInsert}
                />
              }
            >
              {editorViewMode === 'split' ? (
                <>
                  <EditorPane>
                    <RichTextEditor
                      content={editingContent}
                      onChange={handleContentChange}
                      onEditorReady={setRichTextEditor}
                      placeholder="Your generated content will appear here for editing..."
                    />
                  </EditorPane>
                  <PreviewPane>
                    <HTMLPreview 
                      content={editingContent || 'No content generated yet.'}
                      typographySettings={typography}
                    />
                  </PreviewPane>
                </>
              ) : editorViewMode === 'preview' ? (
                <PreviewPane>
                  <HTMLPreview 
                    content={editingContent || 'No content generated yet.'}
                    typographySettings={typography}
                  />
                </PreviewPane>
              ) : (
                <EditorPane>
                  <RichTextEditor
                    content={editingContent}
                    onChange={handleContentChange}
                    onEditorReady={setRichTextEditor}
                    placeholder="Your generated content will appear here for editing..."
                  />
                </EditorPane>
              )}
            </EditorLayout>
            
            {/* Typography Settings Panel - Temporarily disabled to fix infinite loop */}
            {/* <div style={{ marginTop: '20px', marginBottom: '20px' }}>
              <TypographySettings 
                typography={typography}
                onTypographyChange={handleTypographyChange}
              />
            </div> */}

            {/* SEO Analysis Panel - Available for all content */}
            {seoAnalysisVisible && editingContent && editingContent.length >= 200 && (
              <div style={{ marginBottom: '20px' }}>
                <SEOAnalysis
                  // Pass basic metadata if available (for newly generated content)
                  seoAnalysis={enhancedMetadata?.seoAnalysis}
                  contentQuality={enhancedMetadata?.contentQuality}
                  strategicElements={enhancedMetadata?.strategicElements}
                  improvementSuggestions={enhancedMetadata?.improvementSuggestions}
                  keywordOptimization={enhancedMetadata?.keywordOptimization}
                  // Enable comprehensive analysis for all content (new and existing)
                  content={editingContent}
                  context={{
                    businessType: selectedTopic?.businessType || currentDraft?.topic?.businessType || 'Business',
                    targetAudience: selectedTopic?.targetAudience || currentDraft?.topic?.targetAudience || 'General audience',
                    primaryKeywords: [],
                    businessGoals: 'Generate more customers through content'
                  }}
                  postId={currentDraft?.id || null}
                />
              </div>
            )}

            {/* Highlighted Content Suggestions - New user-facing feature */}
            {editingContent && editingContent.length >= 100 && (
              <div style={{ marginBottom: '20px' }}>
                <HighlightedContentSuggestions
                  editor={richTextEditor}
                  style={{ marginTop: 0 }}
                />
              </div>
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
                <SaveStatusIndicator 
                  isAutosaving={isAutosaving}
                  lastSaved={lastSaved}
                  autosaveError={autosaveError}
                />
                <Button 
                  icon={<ExportOutlined />}
                  onClick={() => setShowExportModal(true)}
                >
                  Export
                </Button>
                <Button 
                  type="default"
                  onClick={handleClosePost}
                >
                  Close Post
                </Button>
              </Space>
            </div>
          </div>
        )}
        </div>
      )}

      {/* POSTS MANAGEMENT SECTION - Only visible in focus mode */}
      {tabMode.mode === 'focus' && !forceWorkflowMode && (
        <div style={{ padding: '24px' }}>
          {/* Content Editing Interface - Show when editing an existing post */}
          {currentDraft && contentGenerated ? (
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
              
              {/* SEO Analysis Toggle */}
              {editingContent && editingContent.length >= 200 && (
                <div style={{ marginBottom: '16px' }}>
                  <Space size="middle">
                    <Button
                      icon={<TrophyOutlined />}
                      onClick={() => setSeoAnalysisVisible(!seoAnalysisVisible)}
                      type={seoAnalysisVisible ? 'primary' : 'default'}
                      size="small"
                    >
                      {seoAnalysisVisible ? 'Hide Analysis' : 'Show SEO Analysis'}
                    </Button>
                  </Space>
                </div>
              )}

              {/* SEO Analysis Panel */}
              {seoAnalysisVisible && editingContent && editingContent.length >= 200 && (
                <div style={{ marginBottom: '20px' }}>
                  <SEOAnalysis
                    content={editingContent}
                    context={{
                      businessType: selectedTopic?.businessType || currentDraft?.topic?.businessType || 'Business',
                      targetAudience: selectedTopic?.targetAudience || currentDraft?.topic?.targetAudience || 'General audience',
                      primaryKeywords: [],
                      businessGoals: 'Generate more customers through content'
                    }}
                    postId={currentDraft?.id || null}
                  />
                </div>
              )}

              {/* Highlighted Content Suggestions - Focus mode */}
              {editingContent && editingContent.length >= 100 && (
                <div style={{ marginBottom: '20px' }}>
                  <HighlightedContentSuggestions
                    editor={richTextEditor}
                    style={{ marginTop: 0 }}
                  />
                </div>
              )}

              {/* Modern Content Editor */}
              <EditorLayout
                mode={previewMode ? 'preview' : 'edit'}
                onModeChange={(mode) => setPreviewMode(mode === 'preview')}
                isFullscreen={isEditorFullscreen}
                onToggleFullscreen={handleToggleFullscreen}
                minHeight="400px"
              >
                {previewMode ? (
                  <PreviewPane>
                    <HTMLPreview
                      content={editingContent || 'Enter your blog content...'}
                      style={{
                        minHeight: '400px',
                        padding: '20px',
                        backgroundColor: '#fafafa'
                      }}
                    />
                  </PreviewPane>
                ) : (
                  <EditorPane>
                    <div style={{ position: 'relative', height: '100%' }}>
                      <EditorToolbar
                        editor={richTextEditor}
                        onBold={() => richTextEditor?.chain().focus().toggleBold().run()}
                        onItalic={() => richTextEditor?.chain().focus().toggleItalic().run()}
                        onUnderline={() => richTextEditor?.chain().focus().toggleUnderline().run()}
                        onHeading={(level) => richTextEditor?.chain().focus().toggleHeading({ level }).run()}
                      />
                      <RichTextEditor
                        content={editingContent}
                        onChange={handleContentChange}
                        onEditorReady={setRichTextEditor}
                        placeholder="Enter your blog content..."
                        minHeight="400px"
                        style={{ 
                          marginTop: '8px',
                          fontSize: '14px' 
                        }}
                      />
                    </div>
                  </EditorPane>
                )}
              </EditorLayout>
              
              {/* Content Actions */}
              <div style={{ 
                marginTop: '20px', 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Space>
                  <SaveStatusIndicator 
                    isAutosaving={isAutosaving}
                    lastSaved={lastSaved}
                    autosaveError={autosaveError}
                  />
                  <Button 
                    type="default"
                    onClick={handleClosePost}
                    style={{ marginRight: '8px' }}
                  >
                    Close Post
                  </Button>
                  <Button 
                    type="primary"
                    icon={postState !== 'exported' ? <LockOutlined /> : undefined}
                    onClick={() => handleAutosave(true)}
                    disabled={!editingContent.trim() || postState === 'exported'}
                    style={{
                      backgroundColor: postState === 'exported' ? '#52c41a' : defaultColors.primary,
                      borderColor: postState === 'exported' ? '#52c41a' : defaultColors.primary,
                      fontWeight: '500'
                    }}
                  >
                    {postState === 'exported' ? 'Content Exported' : 'Save Changes'}
                  </Button>
                </Space>
              </div>
            </Card>
          ) : (
            /* Posts List View */
            <Card title="Blog Posts">

              <Table
                columns={columns}
                dataSource={posts}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
              />
            </Card>
          )}
        </div>
      )}

      {/* Content Discovery has been moved to Sandbox tab for super-admin access */}

      {showSchedulingModal && (
        <SchedulingModal
          open={showSchedulingModal}
          post={selectedPost}
          onClose={() => setShowSchedulingModal(false)}
          onSave={handleScheduleSave}
        />
      )}

      {showExportModal && (
        <ExportModal
          open={showExportModal}
          onClose={() => setShowExportModal(false)}
          content={editingContent}
          title={selectedTopic?.title || 'Blog Post'}
          typography={typography}
        />
      )}

      {/* Manual CTA Input Modal */}
      <ManualCTAInputModal
        visible={showManualCTAModal}
        onCancel={() => setShowManualCTAModal(false)}
        onSubmit={handleManualCTAsSubmit}
        onSkip={handleSkipManualCTAs}
        existingCTAs={organizationCTAs}
        minCTAs={3}
        websiteName={organizationName || 'your website'}
      />
    </div>
  );
};

export default PostsTab;