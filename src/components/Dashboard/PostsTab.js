import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Table, Tag, Dropdown, Space, Switch, Input, Select, Row, Col, Typography, message, Modal, Progress } from 'antd';
import { 
  PlusOutlined, 
  ScheduleOutlined,
  EditOutlined,
  ExportOutlined,
  MoreOutlined,
  BulbOutlined,
  EyeOutlined,
  ReloadOutlined,
  LockOutlined,
  TeamOutlined,
  TrophyOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTabMode } from '../../hooks/useTabMode';
import { useWorkflowMode } from '../../contexts/WorkflowModeContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { useSystemHint } from '../../contexts/SystemHintContext';
import { format } from 'date-fns';
import { WorkflowGuidance } from '../Workflow/ModeToggle';
import api from '../../services/api';
import { topicAPI, contentAPI } from '../../services/workflowAPI';
import enhancedContentAPI from '../../services/enhancedContentAPI';
import SchedulingModal from '../Modals/SchedulingModal';
import ManualCTAInputModal from '../Modals/ManualCTAInputModal';
import { ComponentHelpers } from '../Workflow/interfaces/WorkflowComponentInterface';
import StreamingPreview from '../StreamingTestbed/StreamingPreview';
import FormattingToolbar from '../FormattingToolbar/FormattingToolbar';
import ExportModal from '../ExportModal/ExportModal';
import { EmptyState } from '../EmptyStates';
import { systemVoice } from '../../copy/systemVoice';
import {
  getStreamChunkContentOnly,
  extractStreamCompleteContent,
  normalizeContentString
} from '../../utils/streamingUtils';
import ThinkingPanel from '../shared/ThinkingPanel';
import RelatedContentStepsPanel, { STATUS as RelatedContentStepStatus } from '../shared/RelatedContentStepsPanel';
import RelatedContentPanel from '../shared/RelatedContentPanel';
import { notifyTabReady } from '../../utils/tabReadyAlert';

// New Enhanced Components
import EditorLayout, { EditorPane } from '../Editor/Layout/EditorLayout';
import EditorToolbar from '../Editor/Toolbar/EditorToolbar';
import RichTextEditor from '../Editor/RichTextEditor/RichTextEditor';
import SEOAnalysis from '../SEOAnalysis/SEOAnalysis';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// SEO Analysis Display Component
const SEOAnalysisDisplay = ({ post }) => {
  const seoAnalysis = post.generation_metadata?.seoAnalysis;
  const qualityPrediction = post.generation_metadata?.qualityPrediction;
  const overallScore = qualityPrediction?.actualSEOScore || post.seo_score_prediction;

  if (!seoAnalysis && !overallScore) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Text type="secondary">No SEO analysis available for this post.</Text>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 95) return 'var(--color-success)';
    if (score >= 90) return 'var(--color-info)';
    if (score >= 80) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  const getScoreStatus = (score) => {
    if (score >= 95) return 'success';
    if (score >= 90) return 'active';
    if (score >= 80) return 'normal';
    return 'exception';
  };

  return (
    <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
      {/* Overall Score */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Title level={4} style={{ marginBottom: '16px' }}>Overall SEO Score</Title>
        <Progress
          type="circle"
          percent={overallScore}
          strokeColor={getScoreColor(overallScore)}
          status={getScoreStatus(overallScore)}
          width={120}
          format={percent => (
            <div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{percent}</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-tertiary)' }}>out of 100</div>
            </div>
          )}
        />
        {overallScore >= 95 && (
          <div style={{ marginTop: '16px', color: 'var(--color-success)', fontSize: '16px', fontWeight: '500' }}>
            ✅ Excellent! This post meets our quality standards.
          </div>
        )}
        {overallScore >= 90 && overallScore < 95 && (
          <div style={{ marginTop: '16px', color: 'var(--color-primary)', fontSize: '16px', fontWeight: '500' }}>
            ✓ Great! Just a few tweaks needed to reach 95+.
          </div>
        )}
        {overallScore < 90 && (
          <div style={{ marginTop: '16px', color: 'var(--color-accent)', fontSize: '16px', fontWeight: '500' }}>
            ⚠️ This post needs improvement to reach our 95+ target.
          </div>
        )}
      </div>

      {/* Top Strengths */}
      {qualityPrediction?.topStrengths?.length > 0 && (
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>💪</span>
              <span>Top Strengths</span>
            </div>
          }
          style={{ marginBottom: '16px' }}
          size="small"
        >
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {qualityPrediction.topStrengths.map((strength, index) => (
              <li key={index} style={{ marginBottom: '8px', color: 'var(--color-success)' }}>
                <Text>{strength}</Text>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Top Improvements */}
      {qualityPrediction?.topImprovements?.length > 0 && (
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🎯</span>
              <span>Suggested Improvements</span>
            </div>
          }
          style={{ marginBottom: '16px' }}
          size="small"
        >
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {qualityPrediction.topImprovements.map((improvement, index) => (
              <li key={index} style={{ marginBottom: '8px', color: 'var(--color-accent)' }}>
                <Text>{improvement}</Text>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Detailed Analysis Sections */}
      {seoAnalysis && (
        <>
          {seoAnalysis.titleAnalysis && (
            <Card title="📝 Title & Headlines" style={{ marginBottom: '16px' }} size="small">
              {Object.entries(seoAnalysis.titleAnalysis).map(([key, value]) => (
                value && value.score !== undefined && (
                  <div key={key} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <Text strong style={{ textTransform: 'capitalize' }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Text>
                      <Text style={{ color: getScoreColor(value.score) }}>{value.score}/100</Text>
                    </div>
                    <Progress percent={value.score} strokeColor={getScoreColor(value.score)} showInfo={false} size="small" />
                    {value.explanation && (
                      <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                        {value.explanation}
                      </Text>
                    )}
                  </div>
                )
              ))}
            </Card>
          )}

          {seoAnalysis.contentFlow && (
            <Card title="📖 Content Structure" style={{ marginBottom: '16px' }} size="small">
              {Object.entries(seoAnalysis.contentFlow).map(([key, value]) => (
                value && value.score !== undefined && (
                  <div key={key} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <Text strong style={{ textTransform: 'capitalize' }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Text>
                      <Text style={{ color: getScoreColor(value.score) }}>{value.score}/100</Text>
                    </div>
                    <Progress percent={value.score} strokeColor={getScoreColor(value.score)} showInfo={false} size="small" />
                  </div>
                )
              ))}
            </Card>
          )}

          {seoAnalysis.engagementUX && (
            <Card title="💡 Reader Engagement" style={{ marginBottom: '16px' }} size="small">
              {Object.entries(seoAnalysis.engagementUX).map(([key, value]) => (
                value && value.score !== undefined && (
                  <div key={key} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <Text strong style={{ textTransform: 'capitalize' }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Text>
                      <Text style={{ color: getScoreColor(value.score) }}>{value.score}/100</Text>
                    </div>
                    <Progress percent={value.score} strokeColor={getScoreColor(value.score)} showInfo={false} size="small" />
                  </div>
                )
              ))}
            </Card>
          )}

          {seoAnalysis.technicalSEO && (
            <Card title="🔍 Technical SEO" style={{ marginBottom: '16px' }} size="small">
              {Object.entries(seoAnalysis.technicalSEO).map(([key, value]) => (
                value && value.score !== undefined && (
                  <div key={key} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <Text strong style={{ textTransform: 'capitalize' }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Text>
                      <Text style={{ color: getScoreColor(value.score) }}>{value.score}/100</Text>
                    </div>
                    <Progress percent={value.score} strokeColor={getScoreColor(value.score)} showInfo={false} size="small" />
                  </div>
                )
              ))}
            </Card>
          )}
        </>
      )}

      {/* AI Summary */}
      {seoAnalysis?.aiSummary && (
        <Card title="📊 AI Summary" style={{ marginBottom: '16px' }} size="small">
          <Paragraph style={{ margin: 0 }}>{seoAnalysis.aiSummary}</Paragraph>
        </Card>
      )}
    </div>
  );
};

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
      return { text: 'Saving...', color: 'var(--color-primary)' };
    }
    if (autosaveError) {
      return { text: `Error: ${autosaveError}`, color: 'var(--color-error)' };
    }
    if (lastSaved) {
      const timeAgo = Math.round((currentTime - lastSaved) / 1000);
      if (timeAgo < 60) {
        return { text: `Saved ${timeAgo}s ago`, color: 'var(--color-success)' };
      } else {
        const minutesAgo = Math.round(timeAgo / 60);
        return { text: `Saved ${minutesAgo}m ago`, color: 'var(--color-success)' };
      }
    }
    return { text: 'Autosave enabled', color: 'var(--color-gray-300)' };
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

const PostsTab = ({
  forceWorkflowMode = false,
  onEnterProjectMode,
  onQuotaUpdate,
  onOpenPricingModal,
  // Strategy filtering props (for ReturningUserDashboard)
  filteredByStrategyId = null,
  onClearFilter = null,
  getStrategyName = null
}) => {
  const { user } = useAuth();
  const tabMode = useTabMode('posts');
  const { 
    requireSignUp,
    stepResults,
    addStickyWorkflowStep,
    selectedCustomerStrategy
  } = useWorkflowMode();
  const { trackEvent } = useAnalytics();
  const { setHint } = useSystemHint();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSEOAnalysisModal, setShowSEOAnalysisModal] = useState(false);
  const [selectedPostForSEO, setSelectedPostForSEO] = useState(null);
  
  // Workflow content generation state
  const [contentGenerated, setContentGenerated] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [, setGeneratingImages] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(null); // { progress, currentStep, status } from job polling
  const [relatedContentSteps, setRelatedContentSteps] = useState([]); // [{ id, label, status, count? }] for fetch steps UI
  const [availableTopics, setAvailableTopics] = useState([]);
  const [topicImageGeneratingIndex, setTopicImageGeneratingIndex] = useState(null); // index when DALL·E started for a topic (for "Generating image for topic N…")
  const [selectedTopic, setSelectedTopic] = useState(null);
  // True while topic stream is in progress; prevents clicking "Create Post" until topics (and images) are ready
  const [topicsGenerationInProgress, setTopicsGenerationInProgress] = useState(false);
  // Ref so topic gen's finally doesn't clear generatingContent when user already started content gen
  const contentGenerationInProgressRef = React.useRef(false);
  
  // Content editing state
  const [editingContent, setEditingContent] = useState('');
  const [previewMode, setPreviewMode] = useState(true);
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
  const [relatedTweets, setRelatedTweets] = useState([]); // Fetched in background after stream starts; shown alongside post
  const [relatedArticles, setRelatedArticles] = useState([]); // News articles from search-for-topic-stream; shown alongside post
  const [relatedVideos, setRelatedVideos] = useState([]); // YouTube videos from search-for-topic-stream; shown alongside post
  const [postState, _setPostState] = useState('draft'); // 'draft', 'exported', 'locked'
  // CTAs returned with generated content (result.ctas / data.ctas) for preview styling and "CTAs in this post" list
  const [postCTAs, setPostCTAs] = useState([]);

  // Editor state for TipTap integration
  const [richTextEditor, setRichTextEditor] = useState(null);

  // Stream preview vs WYSIWYG: show HTML/Markdown preview while streaming; when done, offer "Switch to WYSIWYG"
  const [contentViewMode, setContentViewMode] = useState('preview'); // 'preview' | 'editor'

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
  const [_ctasLoading, setCtasLoading] = useState(false);
  const [_hasSufficientCTAs, setHasSufficientCTAs] = useState(false);
  const [showManualCTAModal, setShowManualCTAModal] = useState(false);
  // When user clicks Create Post but has no CTAs, we show CTA modal first; this stores the topic to start after they submit/skip (issue #339)
  const [pendingTopicIdAfterCTA, setPendingTopicIdAfterCTA] = useState(null);
  const ctaPromptSkippedForSessionRef = React.useRef(false);

  // User credits state (live from API)
  const [userCredits, setUserCredits] = useState(null);
  const [_loadingCredits, setLoadingCredits] = useState(false);

  // UI helpers
  const responsive = ComponentHelpers.getResponsiveStyles();
  const defaultColors = ComponentHelpers.getDefaultColors();

  // Check if user can schedule (Creator, Professional, Enterprise)
  const canSchedule = user && user.plan && !['payasyougo', 'free'].includes(user.plan);

  // Calculate remaining posts from live credits (align with DashboardLayout: isUnlimited + fallback)
  const remainingPosts = userCredits
    ? (userCredits.isUnlimited
        ? 'unlimited'
        : (userCredits.availableCredits ?? (
            userCredits.totalCredits != null && userCredits.usedCredits != null
              ? userCredits.totalCredits - userCredits.usedCredits
              : 0
          )))
    : null;
  const hasAvailablePosts = userCredits && (userCredits.isUnlimited || (typeof remainingPosts === 'number' ? remainingPosts > 0 : remainingPosts === 'unlimited'));

  // Debug logging for credits
  React.useEffect(() => {
    if (userCredits) {
      console.log('💰 User Credits Debug:', {
        availableCredits: userCredits.availableCredits,
        totalCredits: userCredits.totalCredits,
        usedCredits: userCredits.usedCredits,
        remainingPosts,
        hasAvailablePosts,
        breakdown: userCredits.breakdown
      });
    }
  }, [userCredits, remainingPosts, hasAvailablePosts]);
  

  // Load posts and credits in parallel when user is present
  useEffect(() => {
    if (!user) {
      setPosts([]);
      setUserCredits(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadingCredits(true);
    Promise.all([
      api.getPosts(),
      api.getUserCredits().catch(() => null)
    ]).then(([postsResult, credits]) => {
      if (cancelled) return;
      if (postsResult?.success) {
        setPosts(postsResult.posts || []);
      } else {
        setPosts([]);
      }
      if (credits) setUserCredits(credits);
    }).catch((err) => {
      if (!cancelled) {
        console.error('Failed to load posts/credits:', err);
        setPosts([]);
        message.error(`Failed to load posts: ${err?.message || 'Please try again.'}`);
      }
    }).finally(() => {
      if (!cancelled) {
        setLoading(false);
        setLoadingCredits(false);
      }
    });
    return () => { cancelled = true; };
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- editingContent/handleAutosave intentionally excluded to avoid resets
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleAutosave stable
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

  // Scroll to content section when generation starts so user sees stream
  useEffect(() => {
    if (generatingContent && selectedTopic) {
      const t = setTimeout(() => {
        const el = document.getElementById('content-generation-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectedTopic?.id used for scroll trigger only
  }, [generatingContent, selectedTopic?.id]);

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
      setPosts([]);
      message.error(`Failed to load posts: ${error?.message || 'Please try again.'}`);
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
    
    // Track post scheduling started
    trackEvent('post_scheduled', {
      postId: post.id,
      action: 'schedule_modal_opened'
    }).catch(err => console.error('Failed to track post_scheduled:', err));
  };

  const handleScheduleSave = (scheduleData) => {
    // Track post_scheduled event (completion)
    trackEvent('post_scheduled', {
      postId: selectedPost?.id,
      scheduledDate: scheduleData.date,
      platform: scheduleData.platform,
      notifyOnPublish: scheduleData.notify
    }).catch(err => console.error('Failed to track post_scheduled:', err));
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
    setTopicsGenerationInProgress(true);
    try {
      // For logged-out users in workflow mode, check if analysis is completed
      if (forceWorkflowMode && !user) {
        if (!stepResults?.home?.analysisCompleted) {
          setGeneratingContent(false);
          message.warning('Please complete website analysis first before generating content topics.');
          setTopicsGenerationInProgress(false);
          return;
        }
      } else if (!user) {
        // For logged-out users not in workflow mode, trigger sign-up (Fixes #85: run after login)
        setGeneratingContent(false);
        setTopicsGenerationInProgress(false);
        return requireSignUp('Generate AI content topics', 'Start creating content', () => handleGenerateTopics());
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

      // Check if we have the minimum required data for topic generation (accept various API shapes)
      const hasMinimumAnalysis = analysisData.businessType || analysisData.targetAudience ||
        analysisData.decisionMakers || analysisData.businessName;
      if (!hasMinimumAnalysis) {
        console.warn('⚠️ Missing website analysis data for topic generation');
        message.warning('Website analysis data is required for topic generation. Please analyze your website first.');
        setGeneratingContent(false);
        setTopicsGenerationInProgress(false);
        return;
      }

      // Clear existing topics so streaming can show incremental results
      setAvailableTopics([]);
      setTopicImageGeneratingIndex(null);
      setHint(systemVoice.topics.generatingTopics, 'hint', 0);

      // Reset CTA prompt skip so "need to create CTAs" modal can show again for this topic generation flow
      ctaPromptSkippedForSessionRef.current = false;

      const creditsPromise = user ? api.getUserCredits().catch(() => null) : Promise.resolve(null);
      const ctasPromise = organizationId
        ? api.getOrganizationCTAs(organizationId).catch(() => null)
        : Promise.resolve(null);

      // Try topic stream first; onTopicComplete updates UI as each topic arrives; onTopicImageStart/Complete for image progress
      const result = await topicAPI.generateTrendingTopics(
        analysisData,
        selectedStrategy,
        stepResults?.home?.webSearchInsights || {},
        {
          onTopicComplete: (topic) => {
            setAvailableTopics((prev) => {
              const next = [...prev, topic];
              setHint(systemVoice.topics.topicsStreamingIn(next.length), 'hint', 0);
              return next;
            });
            // Allow topic selection as soon as text streams in; don't wait for images
            setTopicsGenerationInProgress(false);
          },
          onTopicImageStart: (data) => {
            setTopicImageGeneratingIndex(data?.index != null ? data.index : null);
          },
          onTopicImageComplete: (topic, index) => {
            if (typeof window !== 'undefined' && window.__HERO_IMAGE_DEBUG__ !== false) {
              console.log('[HeroImage] topic-image-complete', { index, topicId: topic?.id, image: topic?.image ? `${String(topic.image).slice(0, 60)}...` : topic?.image });
            }
            setTopicImageGeneratingIndex((prev) => (prev === index ? null : prev));
            setAvailableTopics((prev) => {
              const next = [...prev];
              if (next[index] != null && topic?.image) next[index] = { ...next[index], image: topic.image };
              return next;
            });
            // So preview gets heroImageUrl: keep selectedTopic in sync when its topic's image arrives
            setSelectedTopic((prev) => {
              if (prev?.id != null && topic?.id != null && prev.id === topic.id && topic?.image) {
                if (typeof window !== 'undefined' && window.__HERO_IMAGE_DEBUG__ !== false) {
                  console.log('[HeroImage] selectedTopic updated with image', { topicId: prev.id });
                }
                return { ...prev, image: topic.image };
              }
              return prev;
            });
          },
        }
      );

      const [credits, ctasResponse] = await Promise.all([creditsPromise, ctasPromise]);

      if (credits) setUserCredits(credits);
      if (ctasResponse) {
        setOrganizationCTAs(ctasResponse.ctas || []);
        setHasSufficientCTAs(ctasResponse.has_sufficient_ctas || false);
      }

      if (result.success) {
        setAvailableTopics(result.topics);
        setHint(systemVoice.topics.topicsReady, 'success', 5000);
        message.success(`Generated ${result.topics.length} content topics!`);
      } else {
        throw new Error(result.error || 'Topic generation failed');
      }
    } catch (error) {
      console.error('Topic generation error:', error);
      message.error(`Failed to generate topics: ${error.message}`);
    } finally {
      setTopicsGenerationInProgress(false);
      // Don't clear generatingContent if user already started content generation (clicked Create Post)
      if (!contentGenerationInProgressRef.current) {
        setGeneratingContent(false);
      }
    }
  };
  
  // Handle topic selection and content generation
  const handleTopicSelection = async (topicId) => {
    // Check authentication first (Fixes #85: run after login)
    if (!user) {
      return requireSignUp('Create your blog post', 'Get your first post', () => handleTopicSelection(topicId));
    }

    const topic = availableTopics.find(t => t.id === topicId);
    if (!topic) return;

    // Prevent starting content gen while topics are still streaming (avoids "waiting for stream" then refresh)
    if (topicsGenerationInProgress) return;

    const websiteAnalysisData = stepResults?.home?.websiteAnalysis || {};
    contentGenerationInProgressRef.current = true;
    setSelectedTopic(topic);
    setEditingContent('');
    setContentViewMode('preview');
    setGeneratingContent(true);
    setRelatedTweets([]);
    setRelatedArticles([]);
    setRelatedVideos([]);

    // Add to progressive sticky header
    addStickyWorkflowStep('topicSelection', {
      title: topic.title,
      topicName: topic.title,
      description: topic.description,
      category: topic.category,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Credits check first so we can fail fast and show limit modal
      const creditsResult = await api.getUserCredits().catch(() => ({ totalCredits: 1, usedCredits: 0 }));
      const remainingPosts = creditsResult.totalCredits - creditsResult.usedCredits;
      if (remainingPosts <= 0) {
        contentGenerationInProgressRef.current = false;
        setGeneratingContent(false);
        Modal.warning({
          title: 'Content Generation Limit Reached',
          content: (
            <div>
              <p>You've used all {creditsResult.totalCredits} of your available posts this period.</p>
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
        return;
      }

      if (remainingPosts <= 2) {
        message.warning(
          `You have ${remainingPosts} post${remainingPosts === 1 ? '' : 's'} remaining. Consider upgrading your plan.`,
          6
        );
      }

      // If no CTAs exist, prompt user to add CTAs before generating (issue #339)
      // Re-fetch CTAs when user clicks Create Post so we use live API result and avoid stale state
      let ctasForCheck = { ctas: organizationCTAs, hasSufficient: _hasSufficientCTAs };
      if (organizationId) {
        try {
          const ctasResponse = await api.getOrganizationCTAs(organizationId);
          ctasForCheck = {
            ctas: ctasResponse.ctas || [],
            hasSufficient: ctasResponse.has_sufficient_ctas || false
          };
          setOrganizationCTAs(ctasForCheck.ctas);
          setHasSufficientCTAs(ctasForCheck.hasSufficient);
        } catch (err) {
          console.error('Failed to fetch CTAs for Create Post check:', err);
        }
      }
      if (!ctasForCheck.hasSufficient && ctasForCheck.ctas.length === 0 && !ctaPromptSkippedForSessionRef.current) {
        setPendingTopicIdAfterCTA(topicId);
        setShowManualCTAModal(true);
        contentGenerationInProgressRef.current = false;
        setGeneratingContent(false);
        setSelectedTopic(null);
        return;
      }

      // Step 1: Fetch related content (tweets, articles, videos, CTAs) with visible steps before blog generation
      const ctasForGeneration = ctasForCheck.ctas || [];
      const fetchSteps = [
        { id: 'ctas', label: systemVoice.content.fetchCTAs, status: RelatedContentStepStatus.PENDING },
        { id: 'tweets', label: systemVoice.content.fetchTweets, status: RelatedContentStepStatus.PENDING },
        { id: 'articles', label: systemVoice.content.fetchArticles, status: RelatedContentStepStatus.PENDING },
        { id: 'videos', label: systemVoice.content.fetchVideos, status: RelatedContentStepStatus.PENDING },
      ];
      setRelatedContentSteps(fetchSteps);
      // CTAs are already loaded from the Create Post check; mark step done immediately
      setRelatedContentSteps((prev) =>
        prev.map((s) => (s.id === 'ctas' ? { ...s, status: RelatedContentStepStatus.DONE, count: ctasForGeneration.length } : s))
      );

      // Use combined tweets+videos endpoint (backend PR #178) for speed
      const runTweetsAndVideos = () =>
        api.fetchRelatedContent(topic, websiteAnalysisData, { maxTweets: 3, maxVideos: 5 })
          .then(({ tweets: tweetsData, videos: videosData }) => {
            const tweetsArr = Array.isArray(tweetsData) ? tweetsData : [];
            const videosArr = Array.isArray(videosData) ? videosData : [];
            setRelatedTweets(tweetsArr);
            setRelatedVideos(videosArr);
            setRelatedContentSteps((prev) =>
              prev.map((s) => {
                if (s.id === 'tweets') return { ...s, status: RelatedContentStepStatus.DONE, count: tweetsArr.length };
                if (s.id === 'videos') return { ...s, status: RelatedContentStepStatus.DONE, count: videosArr.length };
                return s;
              })
            );
            return [tweetsArr, videosArr];
          })
          .catch(() => {
            setRelatedContentSteps((prev) =>
              prev.map((s) =>
                s.id === 'tweets' || s.id === 'videos' ? { ...s, status: RelatedContentStepStatus.FAILED } : s
              )
            );
            return [[], []];
          });

      const runArticleStream = () =>
        api.searchNewsArticlesForTopicStream(topic, websiteAnalysisData, 5)
          .then(({ connectionId, streamUrl }) =>
            new Promise((resolve) => {
              setRelatedContentSteps((prev) =>
                prev.map((s) => (s.id === 'articles' ? { ...s, status: RelatedContentStepStatus.RUNNING } : s))
              );
              api.connectToStream(connectionId, {
                onQueriesExtracted: (data) => {
                  const term = data?.searchTermsUsed?.[0];
                  if (term) setHint(`Searching articles: ${term}…`, 'hint', 0);
                },
                onComplete: (data) => {
                  const articles = data?.articles ?? data?.data?.articles ?? [];
                  const arr = Array.isArray(articles) ? articles : [];
                  setRelatedArticles(arr);
                  setRelatedContentSteps((prev) =>
                    prev.map((s) => (s.id === 'articles' ? { ...s, status: RelatedContentStepStatus.DONE, count: arr.length } : s))
                  );
                  resolve(arr);
                },
                onError: () => {
                  setRelatedContentSteps((prev) =>
                    prev.map((s) => (s.id === 'articles' ? { ...s, status: RelatedContentStepStatus.FAILED } : s))
                  );
                  resolve([]);
                },
              }, { streamUrl });
            })
          )
          .catch(() => {
            setRelatedContentSteps((prev) =>
              prev.map((s) => (s.id === 'articles' ? { ...s, status: RelatedContentStepStatus.FAILED } : s))
            );
            return [];
          });

      // Mark tweets and videos as running when combined fetch starts
      setRelatedContentSteps((prev) =>
        prev.map((s) =>
          s.id === 'tweets' || s.id === 'videos' ? { ...s, status: RelatedContentStepStatus.RUNNING } : s
        )
      );

      // Fetch related content first; show progress UI; then pass into blog generation so content is embedded in the post
      const [tweetsVideosResult, articlesResult] = await Promise.all([
        runTweetsAndVideos(),
        runArticleStream()
      ]);
      const [tweetsArr = [], videosArr = []] = Array.isArray(tweetsVideosResult) ? tweetsVideosResult : [[], []];
      const articlesArr = Array.isArray(articlesResult) ? articlesResult : [];

      // Determine if enhanced generation should be used based on available organization data
      const hasWebsiteAnalysis = websiteAnalysisData && Object.keys(websiteAnalysisData).length > 0;
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
        preloadedTweets: tweetsArr,
        preloadedArticles: articlesArr,
        preloadedVideos: videosArr,
        ctas: ctasForGeneration,
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
        includeVisuals: shouldUseEnhancement,
        // Progress callback for worker queue polling / job stream
        onProgress: (status) => {
          setGenerationProgress({
            progress: status.progress,
            currentStep: status.currentStep,
            status: status.status,
            estimatedTimeRemaining: status.estimatedTimeRemaining
          });
          setHint(status.currentStep || systemVoice.content.generating, 'hint', 0);
        },
        // Content-generation job stream partial results: show post as soon as blog-result arrives
        onBlogResult: (data) => {
          const text = extractStreamCompleteContent(data);
          if (text) setEditingContent(text);
        }
      };

      setHint(systemVoice.content.generating, 'hint', 0);

      // Issue #65: Try blog stream first for everyone; fall back to job (polling) or sync generate if stream unavailable
      let result = null;
      try {
        const { connectionId } = await contentAPI.startBlogStream(
            topic,
            stepResults?.home?.websiteAnalysis || {},
            tabMode.tabWorkflowData?.selectedCustomerStrategy,
            stepResults?.home?.webSearchInsights || {},
            enhancementOptions
          );
          setRelatedContentSteps([]); // Clear fetch steps; blog generation starts with embedded related content
          setEditingContent('');
          setContentViewMode('preview');
          let accumulatedChunks = '';
          const streamDone = new Promise((resolve, reject) => {
            api.connectToStream(connectionId, {
              onChunk: (data) => {
                const chunk = getStreamChunkContentOnly(data);
                if (chunk) {
                  accumulatedChunks += chunk;
                  setEditingContent((prev) => prev + chunk);
                }
              },
              onComplete: (data) => {
                // extractStreamCompleteContent handles result.content, blogPost.content, etc. (backend doc)
                const fromComplete = extractStreamCompleteContent(data);
                const finalContent = fromComplete || accumulatedChunks;
                if (finalContent) setEditingContent(finalContent);
                setContentGenerated(true);
                const ctas = Array.isArray(data?.ctas) ? data.ctas : [];
                setPostCTAs(ctas);
                resolve({ success: true, content: finalContent, blogPost: data?.blogPost ?? data?.result, ctas });
              },
              onError: (errData) => {
                reject(new Error(errData?.message || 'Stream error'));
              }
            });
          });
          result = await streamDone;
          const streamContent = (result?.content ?? '').trim();
          const streamTitle = topic?.title?.trim();
          if (result?.success && streamContent && streamTitle) {
            // Save post after stream complete (same as non-streaming path below)
            const initialPost = {
              title: streamTitle,
              content: streamContent,
              status: 'draft',
              topic_data: topic,
              generation_metadata: {
                strategy: contentStrategy,
                generatedAt: new Date().toISOString(),
                wordCount: streamContent.length
              }
            };
            const saveResult = await api.createPost(initialPost);
            if (saveResult.success && saveResult.post) {
              setCurrentDraft({
                id: saveResult.post.id,
                title: streamTitle,
                content: streamContent,
                status: 'draft',
                createdAt: saveResult.post.created_at ?? new Date().toISOString(),
                topic: topic,
                blogPost: result.blogPost,
                relatedTweets: relatedTweets?.length ? relatedTweets : undefined,
                postCTAs: result.ctas || []
              });
              setLastSavedContent(streamContent);
              setLastSaved(new Date());
              setIsAutosaving(false);
              setAutosaveError(null);
              setPosts(prevPosts => [saveResult.post, ...prevPosts]);
              loadPosts();
              if (onQuotaUpdate) onQuotaUpdate();
              setHint(systemVoice.toasts.contentGenerated, 'success', 5000);
              notifyTabReady();
              message.success('Blog content generated and saved!');
            }
            contentGenerationInProgressRef.current = false;
            setGeneratingContent(false);
            return;
          }
      } catch (streamErr) {
        console.warn('Blog stream not available, falling back to job or sync generation:', streamErr?.message);
        result = null;
      }

      if (result === null) {
        result = await contentAPI.generateContent(
          topic, // selectedTopic
          stepResults?.home?.websiteAnalysis || {}, // analysisData
          tabMode.tabWorkflowData?.selectedCustomerStrategy, // selectedStrategy
          stepResults?.home?.webSearchInsights || {}, // webSearchInsights
          enhancementOptions // Enhanced generation options
        );
      }
      
      if (result.success) {
        setEditingContent(normalizeContentString(result.content) || result.content);
        setContentGenerated(true);
        setPostCTAs(Array.isArray(result.ctas) ? result.ctas : []);

        // If images are generating in background, show indicator and update when ready
        if (result.imageGenerationPromise) {
          setGeneratingImages(true);
          message.info(systemVoice.content.imagesGenerating, 2);
          result.imageGenerationPromise.then((updatedContent) => {
            setEditingContent(updatedContent);
            setLastSavedContent(updatedContent);
            setCurrentDraft((prev) => prev ? { ...prev, content: updatedContent } : prev);
            setGeneratingImages(false);
            message.success(systemVoice.content.imagesReady, 3);
          });
        }
        
        // Track content_generation_completed event
        trackEvent('content_generation_completed', {
          topicId: topic.id,
          contentLength: result.content.length,
          wordCount: result.content.split(/\s+/).length,
          useEnhancedGeneration: shouldUseEnhancement
        }).catch(err => console.error('Failed to track content_generation_completed:', err));
        
        // Track workflow step completion
        trackEvent('workflow_step_completed', {
          step: 'content_generation',
          topicId: topic.id
        }).catch(err => console.error('Failed to track workflow_step_completed:', err));

        // Track content generated
        api.trackLeadConversion('content_generated', {
          topic_title: topic.title,
          content_length: result.content?.length || 0,
          used_enhancement: shouldUseEnhancement,
          timestamp: new Date().toISOString()
        }).catch(err => console.error('Failed to track content_generated:', err));

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

        // Use saved post from worker queue when available (job already saved it)
        const savedPost = result.blogPost || result.savedPost;
        if (savedPost?.id) {
          setCurrentDraft({
            id: savedPost.id,
            title: topic.title,
            content: result.content,
            status: 'draft',
            createdAt: savedPost.created_at ?? savedPost.createdAt ?? new Date().toISOString(),
            topic: topic,
            blogPost: result.blogPost,
            postCTAs: Array.isArray(result.ctas) ? result.ctas : []
          });
          setLastSavedContent(result.content);
          setLastSaved(new Date());
          setIsAutosaving(false);
          setAutosaveError(null);
          loadPosts();
          if (onQuotaUpdate) onQuotaUpdate();
          setHint(systemVoice.toasts.contentGenerated, 'success', 5000);
          notifyTabReady();
          message.success('Blog content generated and saved!');
        } else {
          // Fallback: create post via API (sync flow or when worker didn't save)
          const title = topic?.title?.trim();
          const content = (result.content ?? '').trim();
          if (!title || !content) {
            message.error('Title and content are required to save. No content was received from the stream. Please try again.');
            return;
          }
          const initialPost = {
            title,
            content,
            status: 'draft',
            topic_data: topic,
            generation_metadata: {
              strategy: contentStrategy,
              generatedAt: new Date().toISOString(),
              wordCount: content.length
            }
          };
          const saveResult = await api.createPost(initialPost);
          if (saveResult.success && saveResult.post) {
            setCurrentDraft({
              id: saveResult.post.id,
              title: topic.title,
              content: result.content,
              status: 'draft',
              createdAt: saveResult.post.created_at ?? new Date().toISOString(),
              topic: topic,
              blogPost: result.blogPost,
              postCTAs: Array.isArray(result.ctas) ? result.ctas : []
            });
            setLastSavedContent(result.content);
            setLastSaved(new Date());
            setIsAutosaving(false);
            setAutosaveError(null);
            setPosts(prevPosts => [saveResult.post, ...prevPosts]);
            if (onQuotaUpdate) onQuotaUpdate();
            setHint(systemVoice.toasts.contentGenerated, 'success', 5000);
            notifyTabReady();
            message.success('Blog content generated and saved!');
          } else {
            setCurrentDraft({
              id: null,
              title: topic.title,
              content: result.content,
              status: 'draft',
              createdAt: new Date().toISOString(),
              topic: topic,
              blogPost: result.blogPost
            });
            setLastSavedContent('');
            setLastSaved(null);
            setIsAutosaving(false);
            setAutosaveError(null);
            setHint(systemVoice.toasts.contentGenerated, 'success', 5000);
            notifyTabReady();
            message.success('Blog content generated successfully!');
          }
        }
      } else {
        if (result.queueUnavailable) {
          message.error(result.error || 'Service temporarily unavailable. Please try again later.', 8);
          return;
        }
        if (result.retryable && result.jobId) {
          Modal.confirm({
            title: 'Content generation failed',
            content: result.error || 'Something went wrong. Would you like to retry?',
            okText: 'Retry',
            cancelText: 'Cancel',
            onOk: async () => {
              setGeneratingContent(true);
              setGenerationProgress(null);
              try {
                const retryResult = await enhancedContentAPI.retryContentGenerationJob(result.jobId, {
                  onProgress: (status) => setGenerationProgress({
                    progress: status.progress,
                    currentStep: status.currentStep,
                    status: status.status,
                    estimatedTimeRemaining: status.estimatedTimeRemaining
                  }),
                  onBlogResult: (data) => {
                    const text = extractStreamCompleteContent(data);
                    if (text) setEditingContent(text);
                  }
                });
                if (retryResult.success) {
                  setEditingContent(normalizeContentString(retryResult.content) || retryResult.content);
                  setContentGenerated(true);
                  const savedPost = retryResult.blogPost;
                  setCurrentDraft({
                    id: savedPost?.id ?? null,
                    title: topic.title,
                    content: retryResult.content,
                    status: 'draft',
                    createdAt: savedPost?.created_at ?? new Date().toISOString(),
                    topic,
                    blogPost: retryResult.blogPost
                  });
                  if (retryResult.imageGenerationPromise) {
                    setGeneratingImages(true);
                    message.info(systemVoice.content.imagesGenerating, 2);
                    retryResult.imageGenerationPromise.then((updatedContent) => {
                      setEditingContent(updatedContent);
                      setLastSavedContent(updatedContent);
                      setCurrentDraft((prev) => prev ? { ...prev, content: updatedContent } : prev);
                      setGeneratingImages(false);
                      message.success(systemVoice.content.imagesReady, 3);
                    });
                  }
                  if (savedPost?.id && onQuotaUpdate) onQuotaUpdate();
                  loadPosts(); // Refresh posts list
                  setHint(systemVoice.toasts.contentGenerated, 'success', 5000);
                  notifyTabReady();
                  message.success('Blog content generated and saved!');
                } else {
                  message.error(retryResult.error || 'Retry failed');
                }
              } catch (err) {
                message.error(`Retry failed: ${err.message}`);
              } finally {
                contentGenerationInProgressRef.current = false;
                setGeneratingContent(false);
                setGenerationProgress(null);
              }
            }
          });
          return;
        }
        throw new Error(result.error || 'Content generation failed');
      }
    } catch (error) {
      console.error('Content generation error:', error);
      message.error(`Failed to generate content: ${error.message}`);
    } finally {
      contentGenerationInProgressRef.current = false;
      setGeneratingContent(false);
      setGenerationProgress(null);
    }
  };
  
  // Handle content editing
  const handleContentChange = (value) => {
    // Track content_edit_started on first edit
    if (!editingContent && value) {
      trackEvent('content_edit_started', {
        postId: currentDraft?.id,
        topicId: selectedTopic?.id
      }).catch(err => console.error('Failed to track content_edit_started:', err));
    }
    
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
          
          // Track content_saved event
          trackEvent('content_saved', {
            postId: currentDraft.id,
            isAutosave: !showUserFeedback,
            isUpdate: isUpdate,
            contentLength: editingContent?.length || 0
          }).catch(err => console.error('Failed to track content_saved:', err));
          
          // Track post_created or post_edited events
          if (isUpdate) {
            trackEvent('post_edited', {
              postId: currentDraft.id
            }).catch(err => console.error('Failed to track post_edited:', err));
          } else {
            trackEvent('post_created', {
              postId: result.post?.id
            }).catch(err => console.error('Failed to track post_created:', err));
          }
          
          // Track project saved (only for manual saves, not autosaves)
          if (showUserFeedback) {
            api.trackLeadConversion('project_saved', {
              post_title: currentDraft.title,
              content_length: editingContent?.length || 0,
              is_update: isUpdate,
              timestamp: new Date().toISOString()
            }).catch(err => console.error('Failed to track project_saved:', err));
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
                      setPostCTAs([]);
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

  // Typography handler (reserved for future use)
  const _handleTypographyChange = (newTypography) => {
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

  // Initialize topics when user arrives at content step with analysis + selected strategy (only run when both are ready)
  const topicGenTriggerRef = React.useRef(handleGenerateTopics);
  topicGenTriggerRef.current = handleGenerateTopics;

  useEffect(() => {
    const analysisData = stepResults?.home?.websiteAnalysis || {};
    const hasMinimumAnalysisData = analysisData.businessType || analysisData.targetAudience ||
      analysisData.decisionMakers || analysisData.businessName;
    const hasStrategy = !!(selectedCustomerStrategy || tabMode.tabWorkflowData?.selectedCustomerStrategy);

    if ((tabMode.mode === 'workflow' || forceWorkflowMode) &&
        !availableTopics.length &&
        !generatingContent &&
        hasMinimumAnalysisData &&
        hasStrategy) {
      const t = setTimeout(() => {
        topicGenTriggerRef.current();
      }, 800);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- forceWorkflowMode intentionally excluded
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
      
      // Track post_opened event
      trackEvent('post_opened', {
        postId: post.id,
        postStatus: post.status
      }).catch(err => console.error('Failed to track post_opened:', err));
      console.log('🔧 DEBUG: contentGenerated set to true');
      console.log('🔧 DEBUG: Current state after handleEditPost - contentGenerated:', true);
      
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

      // Track content exported
      api.trackLeadConversion('content_exported', {
        post_title: post.title,
        content_length: post.content?.length || 0,
        format: 'markdown',
        timestamp: new Date().toISOString()
      }).catch(err => console.error('Failed to track content_exported:', err));

      message.success('Post exported successfully!');
      console.log('✅ Post exported:', post.title);
      
    } catch (error) {
      console.error('❌ Export error:', error);
      message.error('Failed to export post');
    }
  };

  // Re-analyze SEO for existing posts
  const handleReanalyzeSEO = async (post) => {
    try {
      message.loading({ content: 'Analyzing SEO...', key: 'seo-analysis', duration: 0 });

      const result = await api.reanalyzeSEO(post.id);

      if (result.success) {
        message.success({
          content: `SEO Analysis Complete! Score: ${result.analysis.overallScore}/100`,
          key: 'seo-analysis',
          duration: 3
        });

        // Refresh posts list to show new score
        await loadPosts();

        // Optionally open the SEO analysis modal
        setSelectedPostForSEO(result.post);
        setShowSEOAnalysisModal(true);
      }
    } catch (error) {
      message.error({
        content: `Failed to analyze SEO: ${error.message}`,
        key: 'seo-analysis'
      });
    }
  };

  // Close post function - saves final changes and returns to posts list
  const handleClosePost = async () => {
    // Track workflow_abandoned if user closes without exporting
    if (contentGenerated && !showExportModal) {
      trackEvent('workflow_abandoned', {
        step: 'content_editing',
        postId: currentDraft?.id
      }).catch(err => console.error('Failed to track workflow_abandoned:', err));
    }
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
      setPostCTAs([]);
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
        // If user was prompted from Create Post (issue #339), continue with content generation
        if (pendingTopicIdAfterCTA) {
          const topicId = pendingTopicIdAfterCTA;
          setPendingTopicIdAfterCTA(null);
          setTimeout(() => handleTopicSelection(topicId), 0);
        }
      }
    } catch (error) {
      console.error('Failed to add manual CTAs:', error);
      message.error('Failed to add CTAs. Please try again.');
    }
  };

  // Handle user choosing to skip manual CTA entry
  const handleSkipManualCTAs = () => {
    ctaPromptSkippedForSessionRef.current = true;
    message.info('Continuing without additional CTAs');
    setShowManualCTAModal(false);
    // If user was prompted from Create Post (issue #339), continue with content generation
    if (pendingTopicIdAfterCTA) {
      const topicId = pendingTopicIdAfterCTA;
      setPendingTopicIdAfterCTA(null);
      setTimeout(() => handleTopicSelection(topicId), 0);
    }
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

    // Add SEO-related actions
    const hasSEOAnalysis = post.generation_metadata?.seoAnalysis || post.seo_score_prediction;

    // Always show "Re-analyze SEO" or "Analyze SEO" option
    actions.push({
      key: 'reanalyze-seo',
      label: hasSEOAnalysis ? 'Re-analyze SEO' : 'Analyze SEO',
      icon: <TrophyOutlined />,
      onClick: () => handleReanalyzeSEO(post)
    });

    // Add "View SEO Analysis" if analysis exists
    if (hasSEOAnalysis) {
      actions.push({
        key: 'view-seo-analysis',
        label: 'View SEO Analysis',
        icon: <EyeOutlined />,
        onClick: () => {
          setSelectedPostForSEO(post);
          setShowSEOAnalysisModal(true);
        }
      });
    }

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
      render: (title, _record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: '4px' }}>{title}</div>
        </div>
      )
    },
    {
      title: 'SEO Score',
      dataIndex: 'seo_score_prediction',
      key: 'seo_score',
      width: 120,
      render: (score, record) => {
        const actualScore = record.generation_metadata?.qualityPrediction?.actualSEOScore || score;

        if (!actualScore) {
          return <Text type="secondary" style={{ fontSize: '12px' }}>Not analyzed</Text>;
        }

        const getScoreColor = (score) => {
          if (score >= 95) return 'var(--color-success)';
          if (score >= 90) return 'var(--color-info)';
          if (score >= 80) return 'var(--color-warning)';
          return 'var(--color-error)';
        };

        const getScoreIcon = (score) => {
          if (score >= 95) return '✅';
          if (score >= 90) return '✓';
          if (score >= 80) return '⚠️';
          return '❌';
        };

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>{getScoreIcon(actualScore)}</span>
            <Text strong style={{ color: getScoreColor(actualScore), fontSize: '14px' }}>
              {actualScore}/100
            </Text>
          </div>
        );
      }
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
                <Card title={<h3 className="heading-subsection" style={{ marginBottom: 0 }}>Generate Content Topics</h3>} style={{ marginBottom: 'var(--space-6)' }}>
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
                            {systemVoice.topics.generatingTopics}
                          </Button>
                          <div style={{ marginTop: 'var(--space-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                            {systemVoice.topics.generatingTopicsWithTime}
                          </div>
                        </div>
                      ) : (
                        <Button
                          type="primary"
                          size="large"
                          onClick={() => {
                            if (user && !hasAvailablePosts) {
                              // Open pricing modal to buy more posts
                              if (onOpenPricingModal) {
                                onOpenPricingModal();
                              }
                            } else {
                              handleGenerateTopics();
                            }
                          }}
                          icon={<BulbOutlined />}
                          disabled={!tabMode.tabWorkflowData?.selectedCustomerStrategy}
                        >
                          {!tabMode.tabWorkflowData?.selectedCustomerStrategy
                            ? 'Select an audience first'
                            : user
                              ? (hasAvailablePosts ? 'Generate post' : 'Buy more posts')
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
                        color: 'var(--color-text-secondary)',
                        fontSize: responsive.fontSize.text
                      }}>
                        {tabMode.tabWorkflowData?.selectedCustomerStrategy ? 
                          `Creating targeted blog post ideas based on your selected audience strategy.` :
                          `Based on your audience analysis, here are high-impact blog post ideas:`
                        }
                      </Paragraph>

                      {generatingContent && (
                        <>
                          <ThinkingPanel
                            isActive={generatingContent}
                            currentStep={generationProgress?.currentStep}
                            progress={generationProgress?.progress}
                            thoughts={[]}
                            estimatedTimeRemaining={generationProgress?.estimatedTimeRemaining}
                            workingForYouLabel={systemVoice.content.workingForYou}
                            progressPreamble={systemVoice.content.progressPreamble}
                            fallbackStep={systemVoice.content.generating}
                            dataTestId="content-generation-progress"
                          />
                          {relatedContentSteps.length > 0 && (
                            <RelatedContentStepsPanel
                              steps={relatedContentSteps}
                              title="Preparing related content"
                              ctas={organizationCTAs}
                            />
                          )}
                        </>
                      )}
                      
                      {/* ENHANCED TOPIC CARDS — stagger reveal */}
                      <Row gutter={responsive.gutter}>
                        {availableTopics.map((topic, index) => {
                          const isSelected = selectedTopic?.id === topic.id;
                          const isGenerating = generatingContent && selectedTopic?.id === topic.id;
                          
                          return (
                            <Col key={topic.id} xs={24} md={12} lg={12} className="reveal-stagger" style={{ animationDelay: `${index * 60}ms` }}>
                              <Card 
                                hoverable={!isGenerating}
                                cover={
                                  (topic.isImageLoading || (generatingContent && topicImageGeneratingIndex === index && !topic.image)) ? (
                                    // Image loading skeleton (streaming: "Generating image for topic N…")
                                    <div style={{ 
                                      height: '200px', 
                                      backgroundColor: 'var(--color-background-alt)', 
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
                                        color: 'var(--color-text-secondary)',
                                        fontWeight: 500
                                      }}>
                                        🎨 {topicImageGeneratingIndex === index ? `Generating image for topic ${index + 1}…` : 'Generating image...'}
                                      </div>
                                      <div style={{ 
                                        fontSize: '12px', 
                                        color: 'var(--color-text-tertiary)'
                                      }}>
                                        (takes ~30 seconds)
                                      </div>
                                    </div>
                                  ) : topic.image ? (
                                    // Generated image (fallback to placeholder on 403/load error)
                                    <img 
                                      alt={topic.title} 
                                      src={topic.image} 
                                      style={{ 
                                        width: '100%', 
                                        height: '200px', 
                                        objectFit: 'cover' 
                                      }}
                                      onError={() => {
                                        setAvailableTopics((prev) =>
                                          prev.map((t) => (t.id === topic.id ? { ...t, image: null } : t))
                                        );
                                      }}
                                    />
                                  ) : (
                                    // Default gradient placeholder
                                    <div style={{
                                      height: '200px',
                                      background: topic.gradientColors ? 
                                        `linear-gradient(135deg, ${topic.gradientColors[0]} 0%, ${topic.gradientColors[1]} 100%)` :
                                        'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-700) 100%)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: 'var(--color-text-on-primary)',
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
                                  border: isSelected ? `2px solid ${defaultColors.primary}` : '1px solid var(--color-border-base)',
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
                                <Paragraph style={{ color: 'var(--color-text-secondary)', fontSize: responsive.fontSize.small, marginBottom: '12px' }}>
                                  {topic.subheader || topic.description || 'AI-generated content tailored to your audience'}
                                </Paragraph>
                                
                                {/* Why we suggested this (anticipatory UX) */}
                                <div data-testid="topic-why-suggested" style={{ marginBottom: '12px' }}>
                                  <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                                    Why we suggested this: {systemVoice.suggestions.getWhySuggestedForTopic(topic)}
                                  </Text>
                                </div>
                                
                                {/* Traffic Prediction */}
                                {topic.trafficPrediction && (
                                  <div style={{ 
                                    marginBottom: '16px', 
                                    padding: '12px', 
                                    backgroundColor: 'var(--color-primary-50)', 
                                    borderRadius: '6px',
                                    border: '1px solid var(--color-primary-100)'
                                  }}>
                                    <Text style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                                      📊 Traffic Prediction:
                                    </Text>
                                    <Text style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                                      {topic.trafficPrediction}
                                    </Text>
                                  </div>
                                )}
                                
                                {/* Action Buttons */}
                                <div style={{ textAlign: 'center', marginTop: '16px' }} data-testid="create-post-from-topic">
                                  <span data-testid="create-post-from-topic-btn">
                                    <Button
                                      type="primary"
                                    size="large"
                                    onClick={() => {
                                      if (user && !hasAvailablePosts) {
                                        if (onOpenPricingModal) onOpenPricingModal();
                                      } else {
                                        handleTopicSelection(topic.id);
                                      }
                                    }}
                                    loading={isGenerating}
                                    disabled={topicsGenerationInProgress}
                                    style={{
                                      backgroundColor: defaultColors.primary,
                                      borderColor: defaultColors.primary,
                                      width: '100%',
                                      marginBottom: '12px'
                                    }}
                                  >
                                    {isGenerating ? (generationProgress?.currentStep || systemVoice.content.generating) :
                                     topicsGenerationInProgress ? 'Waiting for topics…' :
                                     user ? (hasAvailablePosts ? 'Create Post' : 'Buy More Posts') : 'Get One Free Post'}
                                  </Button>
                                  </span>
                                </div>
                              </Card>
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  )}
                </Card>
              ) : (
                // Content Editing Phase
                <Card 
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Edit Your Content</span>
                    </div>
                  }
                  style={{ marginBottom: '24px' }}
                >
                  {selectedTopic && (
                    <div style={{ 
                      backgroundColor: 'var(--color-success-bg)',
                      border: '1px solid var(--color-success-border)',
                      borderRadius: '6px',
                      padding: '12px',
                      marginBottom: '16px'
                    }}>
                      <Text strong style={{ color: 'var(--color-success)' }}>Selected Topic: </Text>
                      <Text style={{ color: 'var(--color-success)' }}>{selectedTopic.title}</Text>
                    </div>
                  )}

                  <RelatedContentPanel
                    tweets={relatedTweets?.length ? relatedTweets : currentDraft?.relatedTweets || []}
                    articles={relatedArticles || []}
                    videos={relatedVideos || []}
                  />

                  {/* Enhanced Generation Toggle - Standalone Panel */}
                  <div style={{ 
                    marginBottom: '20px',
                    padding: '16px',
                    backgroundColor: 'var(--color-primary-50)',
                    borderRadius: '8px',
                    border: '1px solid var(--color-primary-100)'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <div>
                        <Text strong style={{ fontSize: '14px', color: 'var(--color-primary-600)' }}>
                          Enhanced AI Generation
                        </Text>
                        <div style={{ fontSize: '12px', color: 'var(--color-primary-600)', marginTop: '2px' }}>
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
                    border: `2px solid ${previewMode ? 'var(--color-gray-200)' : defaultColors.primary}`,
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      backgroundColor: previewMode ? 'var(--color-background-alt)' : defaultColors.primary + '10',
                      padding: '16px',
                      borderBottom: previewMode ? '1px solid var(--color-gray-200)' : `1px solid ${defaultColors.primary}30`
                    }}>
                      <Text strong style={{ 
                        fontSize: '16px', 
                        color: previewMode ? 'var(--color-text-secondary)' : defaultColors.primary 
                      }}>
                        Content Strategy
                      </Text>
                    </div>
                    
                    <div style={{ padding: '20px' }}>
                      {previewMode ? (
                        // Strategy Preview
                        <Row gutter={[16, 16]}>
                          <Col span={12}>
                            <Text style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Goal:</Text>
                            <div style={{ fontSize: '15px', fontWeight: 500 }}>
                              {getStrategyDisplayText('goal', contentStrategy.goal)}
                            </div>
                          </Col>
                          <Col span={12}>
                            <Text style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Voice:</Text>
                            <div style={{ fontSize: '15px', fontWeight: 500 }}>
                              {getStrategyDisplayText('voice', contentStrategy.voice)}
                            </div>
                          </Col>
                          <Col span={12}>
                            <Text style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Template:</Text>
                            <div style={{ fontSize: '15px', fontWeight: 500 }}>
                              {getStrategyDisplayText('template', contentStrategy.template)}
                            </div>
                          </Col>
                          <Col span={12}>
                            <Text style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Length:</Text>
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

                  {/* Edit Mode */}
                  <div style={{
                    border: '1px solid var(--color-gray-300)',
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
                              backgroundColor: postState === 'exported' ? 'var(--color-success)' : defaultColors.primary,
                              borderColor: postState === 'exported' ? 'var(--color-success)' : defaultColors.primary,
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
                              setPostCTAs([]);
                              setRelatedTweets([]);
                              setRelatedArticles([]);
                              setRelatedVideos([]);
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
              title={<h2 className="heading-section" style={{ marginBottom: 0 }}>Blog Posts</h2>}
            >
              <EmptyState
                title="No blog posts yet"
                description="Get started by creating your first blog post. Our AI will help you generate content based on your website analysis and audience strategy."
                action="Create Your First Post"
                actionLabel="Create Your First Post"
                onAction={() => {
                  // Trigger content generation workflow
                  if (onEnterProjectMode) {
                    onEnterProjectMode();
                  } else {
                    // Fallback: scroll to content generation section
                    const postsSection = document.getElementById('posts');
                    if (postsSection) {
                      postsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }
                }}
                icon={<PlusOutlined style={{ fontSize: '64px', color: 'var(--color-gray-300)' }} />}
                tips="Start by analyzing your website, then select an audience strategy, and finally generate your first post."
              />
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
                <Paragraph style={{ fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
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
                        background: 'linear-gradient(135deg, var(--color-primary-100) 0%, var(--color-primary-200) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-text-tertiary)',
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
                          background: 'var(--color-hero-input-bg)',
                          padding: '12px 20px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: 'var(--color-text-secondary)'
                        }}>
                          🎯 Topic Preview
                        </div>
                      </div>
                    }
                    style={{
                      border: '2px dashed var(--color-gray-300)',
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
                    <Title level={4} style={{ marginBottom: '8px', color: 'var(--color-gray-300)' }}>
                      Your Custom Topic Title
                    </Title>
                    <Paragraph style={{ color: 'var(--color-text-tertiary)', fontSize: '14px', marginBottom: '12px' }}>
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
                        background: 'linear-gradient(135deg, var(--color-accent-100) 0%, var(--color-accent-200) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-text-tertiary)',
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
                          background: 'var(--color-hero-input-bg)',
                          padding: '12px 20px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: 'var(--color-text-secondary)'
                        }}>
                          📊 Topic Preview
                        </div>
                      </div>
                    }
                    style={{
                      border: '2px dashed var(--color-gray-300)',
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
                    <Title level={4} style={{ marginBottom: '8px', color: 'var(--color-gray-300)' }}>
                      Another Targeted Topic
                    </Title>
                    <Paragraph style={{ color: 'var(--color-text-tertiary)', fontSize: '14px', marginBottom: '12px' }}>
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
              <div style={{ textAlign: 'center', marginTop: '24px', padding: '20px', backgroundColor: 'var(--color-success-bg)', borderRadius: '8px', border: '1px solid var(--color-success-border)' }}>
                <Title level={4} style={{ color: 'var(--color-success)', marginBottom: '12px' }}>
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
                    backgroundColor: 'var(--color-success)',
                    borderColor: 'var(--color-success)',
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
                          {systemVoice.topics.generatingTopics}
                        </Button>
                        <div style={{ marginTop: '12px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                          {systemVoice.topics.generatingTopicsWithTime}
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="primary"
                        size="large"
                        onClick={() => {
                          if (user && !hasAvailablePosts) {
                            // Open pricing modal to buy more posts
                            if (onOpenPricingModal) {
                              onOpenPricingModal();
                            }
                          } else {
                            handleGenerateTopics();
                          }
                        }}
                        icon={<BulbOutlined />}
                        disabled={!selectedCustomerStrategy}
                      >
                        {!selectedCustomerStrategy
                          ? 'Select an audience first'
                          : user
                            ? (hasAvailablePosts ? 'Generate post' : 'Buy more posts')
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
                      marginBottom: 'var(--space-7)',
                      color: 'var(--color-text-secondary)',
                      fontSize: responsive.fontSize.text
                    }}>
                      {tabMode.tabWorkflowData?.selectedCustomerStrategy ? 
                        `Creating targeted blog post ideas based on your selected audience strategy.` :
                        `Based on your audience analysis, here are high-impact blog post ideas:`
                      }
                    </Paragraph>

                    {generatingContent && (
                      <>
                        <ThinkingPanel
                          isActive={generatingContent}
                          currentStep={generationProgress?.currentStep}
                          progress={generationProgress?.progress}
                          thoughts={[]}
                          estimatedTimeRemaining={generationProgress?.estimatedTimeRemaining}
                          workingForYouLabel={systemVoice.content.workingForYou}
                          progressPreamble={systemVoice.content.progressPreamble}
                          fallbackStep={systemVoice.content.generating}
                          dataTestId="content-generation-progress"
                        />
                        {relatedContentSteps.length > 0 && (
                          <RelatedContentStepsPanel
                            steps={relatedContentSteps}
                            title="Preparing related content"
                            ctas={organizationCTAs}
                          />
                        )}
                      </>
                    )}
                    
                    {/* ENHANCED TOPIC CARDS — stagger reveal */}
                    <Row gutter={responsive.gutter}>
                      {availableTopics.map((topic, index) => {
                        const isSelected = selectedTopic?.id === topic.id;
                        const isGenerating = generatingContent && selectedTopic?.id === topic.id;
                        
                        return (
                          <Col key={topic.id} xs={24} md={12} lg={12} className="reveal-stagger" style={{ animationDelay: `${index * 60}ms` }}>
                            <Card 
                              hoverable={!isGenerating}
                              cover={
                                (topic.isImageLoading || (generatingContent && topicImageGeneratingIndex === index && !topic.image)) ? (
                                  // Image loading skeleton (streaming: "Generating image for topic N…")
                                  <div style={{ 
                                    height: '200px', 
                                    backgroundColor: 'var(--color-background-alt)', 
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
                                      color: 'var(--color-text-secondary)',
                                      fontWeight: 500
                                    }}>
                                      🎨 {topicImageGeneratingIndex === index ? `Generating image for topic ${index + 1}…` : 'Generating image...'}
                                    </div>
                                    <div style={{ 
                                      fontSize: '12px', 
                                      color: 'var(--color-text-tertiary)'
                                    }}>
                                      (takes ~30 seconds)
                                    </div>
                                  </div>
                                ) : topic.image ? (
                                  // Generated image (fallback to placeholder on 403/load error)
                                  <img 
                                    alt={topic.title} 
                                    src={topic.image} 
                                    style={{ 
                                      width: '100%', 
                                      height: '200px', 
                                      objectFit: 'cover' 
                                    }}
                                    onError={() => {
                                      setAvailableTopics((prev) =>
                                        prev.map((t) => (t.id === topic.id ? { ...t, image: null } : t))
                                      );
                                    }}
                                  />
                                ) : (
                                  // Default gradient placeholder
                                  <div style={{
                                    height: '200px',
                                    background: topic.gradientColors ? 
                                      `linear-gradient(135deg, ${topic.gradientColors[0]} 0%, ${topic.gradientColors[1]} 100%)` :
                                      'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-700) 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--color-text-on-primary)',
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
                                border: isSelected ? `2px solid ${defaultColors.primary}` : '1px solid var(--color-border-base)',
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
                              <Paragraph style={{ color: 'var(--color-text-secondary)', fontSize: responsive.fontSize.small, marginBottom: '12px' }}>
                                {topic.subheader || topic.description || 'AI-generated content tailored to your audience'}
                              </Paragraph>
                              
                              {/* Why we suggested this (anticipatory UX) */}
                              <div data-testid="topic-why-suggested" style={{ marginBottom: '12px' }}>
                                <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                                  Why we suggested this: {systemVoice.suggestions.getWhySuggestedForTopic(topic)}
                                </Text>
                              </div>
                              
                              {/* Traffic Prediction */}
                              {topic.trafficPrediction && (
                                <div style={{ 
                                  marginBottom: '16px', 
                                  padding: '12px', 
                                  backgroundColor: 'var(--color-primary-50)', 
                                  borderRadius: '6px',
                                  border: '1px solid var(--color-primary-100)'
                                }}>
                                  <Text style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                                    📊 Traffic Prediction:
                                  </Text>
                                  <Text style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                                    {topic.trafficPrediction}
                                  </Text>
                                </div>
                              )}
                              
                              {/* Action Buttons */}
                              <div style={{ textAlign: 'center', marginTop: '16px' }} data-testid="create-post-from-topic">
                                <span data-testid="create-post-from-topic-btn">
                                  <Button
                                    type="primary"
                                  size="large"
                                  onClick={() => {
                                    if (user && !hasAvailablePosts) {
                                      // Open pricing modal to buy more posts
                                      if (onOpenPricingModal) {
                                        onOpenPricingModal();
                                      }
                                    } else {
                                      handleTopicSelection(topic.id);
                                    }
                                  }}
                                  loading={isGenerating}
                                  disabled={topicsGenerationInProgress}
                                  style={{
                                    backgroundColor: defaultColors.primary,
                                    borderColor: defaultColors.primary,
                                    width: '100%',
                                    marginBottom: '12px'
                                  }}
                                >
                                  {isGenerating ? (generationProgress?.currentStep || systemVoice.content.generating) :
                                   topicsGenerationInProgress ? 'Waiting for topics…' :
                                   user ?
                                     (hasAvailablePosts ? 'Generate post' : 'Buy more posts') :
                                     'Register to claim free post'
                                  }
                                </Button>
                                </span>
                              </div>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  </div>
                )}
              </Card>
            ) : null}
          </div>
        )}

        {/* ENHANCED CONTENT EDITING SECTION - When content is generated, or during stream so user sees typing effect */}
        {(contentGenerated || (generatingContent && selectedTopic)) && (
          <div id="content-generation-section" style={{ marginBottom: '24px' }}>
            {selectedTopic && (
              <div style={{
                backgroundColor: 'var(--color-background-container)',
                border: '1px solid var(--color-border-base)',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <Text strong style={{ color: 'var(--color-text-secondary)' }}>Selected Topic: </Text>
                <Text style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-semibold)' }}>{selectedTopic.title}</Text>
              </div>
            )}

            {/* Enhanced Generation Toggle - Main Section */}
            <div style={{ 
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: 'var(--color-primary-50)',
              borderRadius: '8px',
              border: '1px solid var(--color-primary-100)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div>
                  <Text strong style={{ fontSize: '14px', color: 'var(--color-primary-600)' }}>
                    Enhanced AI Generation
                  </Text>
                  <div style={{ fontSize: '12px', color: 'var(--color-primary-600)', marginTop: '2px' }}>
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
              border: `2px solid ${previewMode ? 'var(--color-gray-200)' : defaultColors.primary}`,
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                backgroundColor: previewMode ? 'var(--color-background-alt)' : defaultColors.primary + '10',
                padding: '16px',
                borderBottom: previewMode ? '1px solid var(--color-gray-200)' : `1px solid ${defaultColors.primary}30`
              }}>
                <Text strong style={{ 
                  fontSize: '16px', 
                  color: previewMode ? 'var(--color-text-secondary)' : defaultColors.primary 
                }}>
                  Content Strategy
                </Text>
              </div>
              
              <div style={{ padding: '20px' }}>
                {previewMode ? (
                  // Strategy Preview
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Text style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Goal:</Text>
                      <div style={{ fontSize: '15px', fontWeight: 500 }}>
                        {getStrategyDisplayText('goal', contentStrategy.goal)}
                      </div>
                    </Col>
                    <Col span={12}>
                      <Text style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Voice:</Text>
                      <div style={{ fontSize: '15px', fontWeight: 500 }}>
                        {getStrategyDisplayText('voice', contentStrategy.voice)}
                      </div>
                    </Col>
                    <Col span={12}>
                      <Text style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Template:</Text>
                      <div style={{ fontSize: '15px', fontWeight: 500 }}>
                        {getStrategyDisplayText('template', contentStrategy.template)}
                      </div>
                    </Col>
                    <Col span={12}>
                      <Text style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Length:</Text>
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
            
            {/* ENHANCED MODERN EDITOR SECTION - Preview (HTML/Markdown) while streaming; WYSIWYG when user switches */}
            <EditorLayout
              isFullscreen={isEditorFullscreen}
              onToggleFullscreen={handleToggleFullscreen}
              toolbarContent={
                contentViewMode === 'preview' && !generatingContent && editingContent?.trim() ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <Button
                      type="primary"
                      icon={<EditOutlined />}
                      onClick={() => setContentViewMode('editor')}
                    >
                      Switch to WYSIWYG
                    </Button>
                    <Button
                      icon={<CopyOutlined />}
                      onClick={async () => {
                        const toCopy = editingContent;
                        try {
                          await navigator.clipboard.writeText(toCopy);
                          message.success('Copied to clipboard');
                        } catch (err) {
                          message.error('Failed to copy to clipboard');
                        }
                      }}
                    >
                      Copy to clipboard
                    </Button>
                    <Text type="secondary" style={{ fontSize: '13px' }}>Edit formatting in the editor</Text>
                  </div>
                ) : contentViewMode === 'editor' ? (
                  <EditorToolbar
                    editor={richTextEditor}
                    content={editingContent}
                    onInsert={handleTextInsert}
                  />
                ) : (
                  <Text type="secondary" style={{ fontSize: '13px' }}>
                    {generatingContent ? 'Streaming content…' : 'Content preview'}
                  </Text>
                )
              }
              sidebarContent={
                seoAnalysisVisible && currentDraft?.generation_metadata?.seoAnalysis ? (
                  <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
                    <SEOAnalysisDisplay post={currentDraft} />
                  </div>
                ) : null
              }
            >
              {(generatingContent || contentViewMode === 'preview') ? (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'auto',
                  backgroundColor: 'var(--color-background-body)',
                  padding: 'var(--space-5)',
                  minHeight: '320px'
                }}>
                  {(postCTAs?.length ? postCTAs : currentDraft?.postCTAs || []).length > 0 && (
                    <div style={{ marginBottom: 12, padding: '10px 14px', backgroundColor: 'var(--color-background-container)', borderRadius: 6, border: '1px solid var(--color-border-base)' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>CTAs in this post</div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--color-text-primary)' }}>
                        {(postCTAs?.length ? postCTAs : currentDraft?.postCTAs || []).map((cta, i) => (
                          <li key={i}>
                            {cta.href ? (
                              <a href={cta.href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>{cta.text || cta.href}</a>
                            ) : (
                              <span>{cta.text || '—'}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <StreamingPreview
                    content={editingContent || (generatingContent ? 'Waiting for content…' : '')}
                    relatedArticles={relatedArticles || []}
                    relatedVideos={relatedVideos || []}
                    relatedTweets={relatedTweets?.length ? relatedTweets : currentDraft?.relatedTweets || []}
                    heroImageUrl={selectedTopic?.image ?? currentDraft?.topic?.image ?? undefined}
                    ctas={postCTAs?.length ? postCTAs : (currentDraft?.postCTAs || [])}
                    generationComplete={!generatingContent}
                    style={{
                      minHeight: '300px',
                      padding: '20px',
                      backgroundColor: 'var(--color-background-alt)',
                      borderRadius: '6px'
                    }}
                  />
                </div>
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
                    setPostCTAs([]);
                    setRelatedTweets([]);
                    setRelatedArticles([]);
                    setRelatedVideos([]);
                    setContentViewMode('preview');
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
                  backgroundColor: 'var(--color-success-bg)',
                  border: '1px solid var(--color-success-border)',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '16px'
                }}>
                  <Text strong style={{ color: 'var(--color-success)' }}>Selected Topic: </Text>
                  <Text style={{ color: 'var(--color-success)' }}>{selectedTopic.title}</Text>
                </div>
              )}

              <RelatedContentPanel
                tweets={relatedTweets?.length ? relatedTweets : currentDraft?.relatedTweets || []}
                articles={relatedArticles || []}
                videos={relatedVideos || []}
              />

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


              {/* Modern Content Editor */}
              <EditorLayout
                isFullscreen={isEditorFullscreen}
                onToggleFullscreen={handleToggleFullscreen}
                minHeight="400px"
                sidebarContent={
                  seoAnalysisVisible && currentDraft?.generation_metadata?.seoAnalysis ? (
                    <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
                      <SEOAnalysisDisplay post={currentDraft} />
                    </div>
                  ) : null
                }
              >
                {previewMode ? (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'auto',
                    backgroundColor: 'var(--color-background-body)',
                    padding: '24px'
                  }}>
                    <StreamingPreview
                      content={editingContent || 'Enter your blog content...'}
                      relatedArticles={relatedArticles || []}
                      relatedVideos={relatedVideos || []}
                      relatedTweets={relatedTweets?.length ? relatedTweets : currentDraft?.relatedTweets || []}
                      heroImageUrl={selectedTopic?.image ?? currentDraft?.topic?.image ?? undefined}
                      ctas={postCTAs?.length ? postCTAs : (currentDraft?.postCTAs || [])}
                      generationComplete={!generatingContent}
                      style={{
                        minHeight: '400px',
                        padding: '24px',
                        backgroundColor: 'var(--color-background-alt)',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border-light)'
                      }}
                    />
                  </div>
                ) : (
                  <EditorPane>
                    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                      <EditorToolbar
                        editor={richTextEditor}
                        content={editingContent}
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
                          marginTop: 0,
                          flex: 1,
                          minHeight: '360px'
                        }}
                      />
                    </div>
                  </EditorPane>
                )}
              </EditorLayout>
              
              {/* Content Actions */}
              <div style={{ 
                marginTop: '24px', 
                padding: '16px 20px',
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--color-background-alt)',
                borderRadius: '8px',
                border: '1px solid var(--color-border-light)'
              }}>
                <Space size="middle">
                  <SaveStatusIndicator 
                    isAutosaving={isAutosaving}
                    lastSaved={lastSaved}
                    autosaveError={autosaveError}
                  />
                  <Button 
                    type="default"
                    onClick={handleClosePost}
                  >
                    Close Post
                  </Button>
                  <Button 
                    type="primary"
                    icon={postState !== 'exported' ? <LockOutlined /> : undefined}
                    onClick={() => handleAutosave(true)}
                    disabled={!editingContent.trim() || postState === 'exported'}
                    style={{
                      backgroundColor: postState === 'exported' ? 'var(--color-success)' : defaultColors.primary,
                      borderColor: postState === 'exported' ? 'var(--color-success)' : defaultColors.primary,
                      fontWeight: 500
                    }}
                  >
                    {postState === 'exported' ? 'Content Exported' : 'Save Changes'}
                  </Button>
                </Space>
              </div>
            </Card>
          ) : (
            /* Posts List View */
            <Card title={<h2 className="heading-section" style={{ marginBottom: 0 }}>Blog Posts</h2>}>

              {/* Strategy Filter Indicator */}
              {filteredByStrategyId && getStrategyName && onClearFilter && (
                <div style={{
                  marginBottom: '16px',
                  padding: '12px 16px',
                  backgroundColor: '#e6f7ff',
                  border: '1px solid #91d5ff',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <Space>
                    <Text strong style={{ color: '#0050b3' }}>Filtered by strategy:</Text>
                    <Tag color="blue">{getStrategyName(filteredByStrategyId)}</Tag>
                  </Space>
                  <Button
                    size="small"
                    onClick={onClearFilter}
                    style={{ marginLeft: '8px' }}
                  >
                    ✕ Clear Filter
                  </Button>
                </div>
              )}

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

      {/* SEO Analysis Modal */}
      {showSEOAnalysisModal && selectedPostForSEO && (
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrophyOutlined style={{ color: 'var(--color-primary)' }} />
              <span>SEO Analysis</span>
            </div>
          }
          open={showSEOAnalysisModal}
          onCancel={() => {
            setShowSEOAnalysisModal(false);
            setSelectedPostForSEO(null);
          }}
          footer={null}
          width={800}
          style={{ top: 20 }}
        >
          <SEOAnalysisDisplay post={selectedPostForSEO} />
        </Modal>
      )}

      {/* Manual CTA Input Modal - prompt when no CTAs exist before generating (issue #339) */}
      <ManualCTAInputModal
        visible={showManualCTAModal}
        onCancel={() => {
          setShowManualCTAModal(false);
          if (pendingTopicIdAfterCTA) {
            setPendingTopicIdAfterCTA(null);
            contentGenerationInProgressRef.current = false;
            setGeneratingContent(false);
          }
        }}
        onSubmit={handleManualCTAsSubmit}
        onSkip={handleSkipManualCTAs}
        existingCTAs={organizationCTAs}
        minCTAs={pendingTopicIdAfterCTA ? 1 : 3}
        websiteName={organizationName || 'your website'}
      />
    </div>
  );
};

export default PostsTab;