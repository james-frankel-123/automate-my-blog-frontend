import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Typography, Radio, Spin, Progress, Input, message, Space, Tag, Form, Select, Slider, ColorPicker, Modal, Divider, Steps, Collapse } from 'antd';
import { SearchOutlined, BulbOutlined, EditOutlined, CheckOutlined, ReloadOutlined, GlobalOutlined, ScanOutlined, EyeOutlined, SettingOutlined, ApiOutlined, CloudUploadOutlined, CodeOutlined, DownOutlined, CloudDownloadOutlined, FileMarkdownOutlined, FileTextOutlined, DatabaseOutlined, FileZipOutlined, LockOutlined, LoginOutlined, UserAddOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import autoBlogAPI from '../../services/api';
import ChangesSummary from '../ChangesSummary';
import AuthModal from '../Auth/AuthModal';

// Import step components (will be created)
import WebsiteAnalysisStep from './steps/WebsiteAnalysisStep';
import CustomerStrategyStep from './steps/CustomerStrategyStep';
import TopicSelectionStep from './steps/TopicSelectionStep';
import ContentGenerationStep from './steps/ContentGenerationStep';
import ContentEditingStep from './steps/ContentEditingStep';
import ExportStep from './steps/ExportStep';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const WorkflowContainer = ({ embedded = false }) => {
  const { user, loading, loginContext, clearLoginContext, setNavContext } = useAuth();
  
  // EXTRACTED FROM APP.JS: All workflow state management
  const [currentStep, setCurrentStep] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authContext, setAuthContext] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [scanningMessage, setScanningMessage] = useState('');
  const [editingStep, setEditingStep] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedCMS, setSelectedCMS] = useState(null);
  const [expandedSteps, setExpandedSteps] = useState([]);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [strategyCompleted, setStrategyCompleted] = useState(false);
  const [blogGenerating, setBlogGenerating] = useState(false);
  
  // Post state and content strategy management
  const [postState, setPostState] = useState('draft');
  const [contentStrategy, setContentStrategy] = useState({
    goal: 'awareness',
    voice: 'expert',
    template: 'problem-solution',
    length: 'standard'
  });
  const [customFeedback, setCustomFeedback] = useState('');
  const [showStrategyGate, setShowStrategyGate] = useState(false);
  const [showExportWarning, setShowExportWarning] = useState(false);
  
  // Change tracking for regeneration
  const [previousContent, setPreviousContent] = useState('');
  const [showChanges, setShowChanges] = useState(false);
  
  // Customer strategy selection
  const [selectedCustomerStrategy, setSelectedCustomerStrategy] = useState(null);
  const [strategySelectionCompleted, setStrategySelectionCompleted] = useState(false);
  
  // Web search research insights
  const [webSearchInsights, setWebSearchInsights] = useState({
    brandResearch: null,
    keywordResearch: null,
    researchQuality: 'basic'
  });
  
  // Demo mode for testing
  const [demoMode, setDemoMode] = useState(
    process.env.REACT_APP_DEMO_MODE === 'true' || 
    window.location.search.includes('demo=true') ||
    localStorage.getItem('automyblog_demo_mode') === 'true'
  );
  
  // Step results storage
  const [stepResults, setStepResults] = useState({
    websiteAnalysis: {
      businessType: 'Child Wellness & Parenting',
      businessName: '',
      targetAudience: 'Parents of children aged 2-12',
      contentFocus: 'Emotional wellness, child development, mindful parenting',
      brandVoice: 'Warm, expert, supportive',
      description: '',
      keywords: [],
      decisionMakers: 'Parents of children aged 2-12',
      endUsers: 'Children experiencing anxiety or emotional challenges',
      customerProblems: [],
      searchBehavior: '',
      customerLanguage: [],
      contentIdeas: [],
      connectionMessage: '',
      businessModel: '',
      websiteGoals: '',
      blogStrategy: '',
      scenarios: [],
      brandColors: {
        primary: '#6B8CAE',
        secondary: '#F4E5D3',
        accent: '#8FBC8F'
      }
    },
    trendingTopics: [],
    selectedContent: null,
    finalContent: ''
  });

  // EXTRACTED FROM APP.JS: Steps configuration
  const steps = [
    { title: 'Analyzing Website', icon: <ScanOutlined />, description: 'Scanning your website to understand your business' },
    { title: 'Selecting Strategy', icon: <SearchOutlined />, description: 'Choose your target customer strategy' },
    { title: 'Generating Ideas', icon: <BulbOutlined />, description: 'Creating targeted blog post previews', requiresLogin: true },
    { title: 'Creating Content', icon: <EditOutlined />, description: 'AI is writing your personalized blog post', requiresLogin: true },
    { title: 'Editing Content', icon: <EyeOutlined />, description: 'Review and customize your blog post', requiresLogin: true }
  ];

  // EXTRACTED FROM APP.JS: Auth helper function
  const requireAuth = (action, context = 'gate') => {
    if (!user) {
      if (embedded) {
        message.warning('Please log in to access premium features');
        return false;
      }
      setAuthContext(context);
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  // EXTRACTED FROM APP.JS: CMS options
  const cmsOptions = [
    { 
      id: 'wordpress', 
      name: 'WordPress', 
      logo: '🔵',
      description: 'Most popular CMS platform',
      integration: 'Native plugin with automatic posting',
      complexity: 'Simple'
    },
    { 
      id: 'shopify', 
      name: 'Shopify', 
      logo: '🛍️',
      description: 'E-commerce platform with blog',
      integration: 'Direct API integration',
      complexity: 'Simple'
    },
    { 
      id: 'ghost', 
      name: 'Ghost', 
      logo: '👻',
      description: 'Modern publishing platform',
      integration: 'Admin API webhook',
      complexity: 'Simple'
    },
    { 
      id: 'webflow', 
      name: 'Webflow', 
      logo: '🌊',
      description: 'Design-focused CMS',
      integration: 'Custom field mapping',
      complexity: 'Medium'
    },
    { 
      id: 'squarespace', 
      name: 'Squarespace', 
      logo: '⬜',
      description: 'All-in-one website builder',
      integration: 'API integration',
      complexity: 'Medium'
    },
    { 
      id: 'custom', 
      name: 'Custom CMS', 
      logo: '⚙️',
      description: 'Your custom platform',
      integration: 'Flexible webhook system',
      complexity: 'Advanced'
    }
  ];

  // Shared state object for passing to step components
  const workflowState = {
    // State variables
    currentStep, setCurrentStep,
    selectedTopic, setSelectedTopic,
    generatedContent, setGeneratedContent,
    isLoading, setIsLoading,
    websiteUrl, setWebsiteUrl,
    scanningMessage, setScanningMessage,
    editingStep, setEditingStep,
    previewMode, setPreviewMode,
    selectedCMS, setSelectedCMS,
    expandedSteps, setExpandedSteps,
    analysisCompleted, setAnalysisCompleted,
    strategyCompleted, setStrategyCompleted,
    blogGenerating, setBlogGenerating,
    postState, setPostState,
    contentStrategy, setContentStrategy,
    customFeedback, setCustomFeedback,
    showStrategyGate, setShowStrategyGate,
    showExportWarning, setShowExportWarning,
    previousContent, setPreviousContent,
    showChanges, setShowChanges,
    selectedCustomerStrategy, setSelectedCustomerStrategy,
    strategySelectionCompleted, setStrategySelectionCompleted,
    webSearchInsights, setWebSearchInsights,
    demoMode, setDemoMode,
    stepResults, setStepResults,
    authContext, setAuthContext,
    showAuthModal, setShowAuthModal,
    
    // Helper functions
    requireAuth,
    steps,
    cmsOptions,
    user,
    
    // Business logic functions
    generateContent,
    handleContentChange,
    getCurrentPost,
    getStrategyDisplayText,
    resetDemo,
    completeWebsiteAnalysis,
    loadTrendingTopics,
    proceedWithTopicGeneration,
    
    // Navigation helper
    setNavContext
  };

  // EXTRACTED FROM APP.JS: Load trending topics effect
  useEffect(() => {
    if (currentStep === 2) {
      setTimeout(() => {
        loadTrendingTopics();
      }, 2000);
    }
  }, [currentStep]);

  // EXTRACTED FROM APP.JS: Website scanning effect
  useEffect(() => {
    if (currentStep === 1) {
      const messages = [
        'Reading website content...',
        'Identifying products and services...',
        'Analyzing brand colors and design...',
        'Understanding target audience...',
        'Preparing content recommendations...'
      ];
      
      let messageIndex = 0;
      setScanningMessage(messages[0]);
      
      const messageInterval = setInterval(() => {
        messageIndex++;
        if (messageIndex < messages.length) {
          setScanningMessage(messages[messageIndex]);
        } else {
          clearInterval(messageInterval);
          completeWebsiteAnalysis();
        }
      }, 800);
      
      return () => clearInterval(messageInterval);
    }
  }, [currentStep]);

  // EXTRACTED FROM APP.JS: Post-login success effect
  useEffect(() => {
    if (user && loginContext === 'gate') {
      setShowAuthModal(false);
      setAuthContext(null);
      message.success('Welcome! Premium features are now unlocked. Continue your workflow or visit the dashboard anytime.');
      clearLoginContext();
    }
  }, [user, loginContext, clearLoginContext]);

  // EXTRACTED FROM APP.JS: Website analysis function
  const completeWebsiteAnalysis = async () => {
    try {
      setIsLoading(true);
      
      setScanningMessage('Analyzing website content...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setScanningMessage('🔍 Researching brand guidelines and social media...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setScanningMessage('📊 Analyzing competitor keywords and search trends...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setScanningMessage('👥 Gathering customer insights and reviews...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setScanningMessage('🧠 Synthesizing insights with AI...');

      const response = await autoBlogAPI.analyzeWebsite(websiteUrl);
      
      if (response.success && response.analysis) {
        const hasEnhancedData = response.analysis.brandColors && 
                               response.analysis.scenarios && 
                               response.analysis.scenarios.length > 0 &&
                               response.analysis.scenarios[0].businessValue &&
                               response.analysis.scenarios[0].targetSegment;
        
        setWebSearchInsights({
          brandResearch: response.analysis.brandColors ? 'Found actual brand guidelines' : null,
          keywordResearch: hasEnhancedData ? 'Current market keyword analysis completed' : null,
          researchQuality: hasEnhancedData ? 'enhanced' : 'basic'
        });

        setStepResults(prev => ({
          ...prev,
          websiteAnalysis: {
            businessType: response.analysis.businessType || 'Business',
            businessName: response.analysis.businessName || 'Your Business',
            targetAudience: response.analysis.decisionMakers || response.analysis.targetAudience || 'General Audience',
            contentFocus: response.analysis.contentFocus || 'Content Focus',
            brandVoice: response.analysis.brandVoice || 'Professional',
            brandColors: response.analysis.brandColors || {
              primary: '#6B8CAE',
              secondary: '#F4E5D3',
              accent: '#8FBC8F'
            },
            description: response.analysis.description || 'Business description generated from website analysis.',
            decisionMakers: response.analysis.decisionMakers || response.analysis.targetAudience || 'General Audience',
            endUsers: response.analysis.endUsers || 'Product users',
            searchBehavior: response.analysis.searchBehavior || '',
            connectionMessage: response.analysis.connectionMessage || '',
            businessModel: response.analysis.businessModel || '',
            websiteGoals: response.analysis.websiteGoals || '',
            blogStrategy: response.analysis.blogStrategy || '',
            scenarios: response.analysis.scenarios || [],
            webSearchStatus: response.analysis.webSearchStatus || {
              businessResearchSuccess: false,
              keywordResearchSuccess: false,
              enhancementComplete: false
            },
            customerProblems: response.analysis.customerProblems || [],
            customerLanguage: response.analysis.customerLanguage || [],
            keywords: response.analysis.keywords || [],
            contentIdeas: response.analysis.contentIdeas || []
          }
        }));

        setTimeout(() => {
          setIsLoading(false);
          setAnalysisCompleted(true);
        }, 1000);

      } else {
        throw new Error('Analysis failed: Invalid response');
      }

    } catch (error) {
      console.error('Website analysis error:', error);
      setIsLoading(false);
      message.error(`Website analysis failed: ${error.message}`);
      
      const businessName = websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0];
      setStepResults(prev => ({
        ...prev,
        websiteAnalysis: {
          businessType: 'Business',
          businessName: businessName.charAt(0).toUpperCase() + businessName.slice(1),
          targetAudience: 'General Audience',
          contentFocus: 'Business Content',
          brandVoice: 'Professional',
          brandColors: {
            primary: '#6B8CAE',
            secondary: '#F4E5D3',
            accent: '#8FBC8F'
          },
          description: 'Unable to analyze website. Please proceed with manual configuration.'
        }
      }));
      
      setTimeout(() => setAnalysisCompleted(true), 1000);
    }
  };

  // EXTRACTED FROM APP.JS: Load trending topics function
  const loadTrendingTopics = async () => {
    try {
      const analysis = stepResults.websiteAnalysis;
      
      if (!analysis.webSearchStatus?.enhancementComplete) {
        setIsLoading(true);
        setScanningMessage('Enhancing analysis with web search data...');
        
        setTimeout(() => {
          if (stepResults.websiteAnalysis.webSearchStatus?.enhancementComplete) {
            loadTrendingTopics();
          } else {
            loadTrendingTopics();
          }
        }, 2000);
        return;
      }
      
      proceedWithTopicGeneration();
    } catch (error) {
      console.error('Topic generation error:', error);
      setIsLoading(false);
      message.error(`Failed to generate topics: ${error.message}`);
    }
  };
  
  // EXTRACTED FROM APP.JS: Topic generation function
  const proceedWithTopicGeneration = async () => {
    try {
      setIsLoading(true);
      setScanningMessage('Generating trending topics with AI...');
      
      // Reset previous topics to avoid lingering data
      setStepResults(prev => ({
        ...prev,
        trendingTopics: []
      }));

      // Step advancement is now handled by generateBlogPreviews function

      const analysis = stepResults.websiteAnalysis;
      
      // Use selected strategy context or fallback to general analysis
      const targetAudience = selectedCustomerStrategy 
        ? `${analysis.decisionMakers} struggling with: ${selectedCustomerStrategy.customerProblem}`
        : analysis.decisionMakers || analysis.targetAudience;
      
      const contentFocus = selectedCustomerStrategy
        ? `Content addressing: ${selectedCustomerStrategy.customerProblem}. Target keywords: ${selectedCustomerStrategy.seoKeywords?.join(', ') || 'relevant terms'}`
        : analysis.contentFocus;

      console.log('Generating topics for:', targetAudience);
      console.log('Content focus:', contentFocus);

      // Call real backend API
      const topics = await autoBlogAPI.getTrendingTopics(analysis.businessType, targetAudience, contentFocus);
      
      if (topics && topics.length > 0) {
        // Ensure we only use first 2 topics and map them with strategy data
        const limitedTopics = topics.slice(0, 2);
        
        // Display final topics immediately without artificial delays
        const finalTopics = limitedTopics.map((topic, index) => ({
          ...topic,
          scenario: selectedCustomerStrategy || (analysis.scenarios && analysis.scenarios[index] ? analysis.scenarios[index] : null),
          isLoading: false,
          isContentLoading: false,
          isImageLoading: false
        }));

        setStepResults(prev => ({
          ...prev,
          trendingTopics: finalTopics
        }));
        
        setStrategyCompleted(true);
        message.success(`Generated ${finalTopics.length} targeted content ideas!`);
      } else {
        // No fallback - show error if no real topics generated
        console.error('No trending topics generated by AI');
        message.error('Failed to generate topic ideas. Please try again.');
      }

      // Complete loading (step 3 already set above)
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Topic generation error:', error);
      setIsLoading(false);
      message.error(`Failed to generate topics: ${error.message}`);
      
      // Fallback: create topics from strategy content ideas if available
      const analysis = stepResults.websiteAnalysis;
      if (analysis.contentIdeas && analysis.contentIdeas.length > 0) {
        const fallbackTopics = analysis.contentIdeas.slice(0, 2).map((idea, index) => ({
          id: index + 1,
          title: idea,
          subheader: `Content idea based on ${analysis.businessType} analysis`,
          category: analysis.businessType,
          image: '',
          scenario: selectedCustomerStrategy || (analysis.scenarios && analysis.scenarios[index] ? analysis.scenarios[index] : null),
          isLoading: false,
          isContentLoading: false,
          isImageLoading: false
        }));
        
        setStepResults(prev => ({
          ...prev,
          trendingTopics: fallbackTopics
        }));
        
        setStrategyCompleted(true);
        message.warning('Using fallback content ideas from website analysis.');
      }
    }
  };

  // EXTRACTED FROM APP.JS: Content generation function
  const generateContent = async (topicId) => {
    if (!topicId) {
      message.warning('Please select a topic first');
      return;
    }
    
    // Check if user needs to sign up for step 7+
    if (!demoMode && !requireAuth()) {
      return;
    }
    
    try {
      setSelectedTopic(topicId); // Set the selected topic for loading state
      setIsLoading(true);
      setBlogGenerating(true);
      setScanningMessage('Generating your blog post with AI...');
      
      // Move to Step 3 and show skeleton loading
      setCurrentStep(3);
      
      // Find the selected topic from either real or mock topics
      const topics = stepResults.trendingTopics || [];
      const selectedTopicData = topics.find(t => t.id === topicId);
      
      if (!selectedTopicData) {
        throw new Error('Selected topic not found');
      }

      // Call real backend API to generate content with selected strategy context
      const blogPost = await autoBlogAPI.generateContent(
        selectedTopicData, 
        stepResults.websiteAnalysis,
        selectedCustomerStrategy ? 
          `Focus on ${selectedCustomerStrategy.customerProblem}. Target customers who search for: ${selectedCustomerStrategy.customerLanguage?.join(', ') || 'relevant terms'}. Make this content align with the business goal: ${selectedCustomerStrategy.conversionPath}. ${webSearchInsights.researchQuality === 'enhanced' ? 'Enhanced with web research insights including competitive analysis and current market keywords.' : ''}` :
          `Make this engaging and actionable for the target audience. ${webSearchInsights.researchQuality === 'enhanced' ? 'Enhanced with web research insights including brand guidelines and keyword analysis.' : ''}`
      );
      
      if (blogPost && blogPost.content) {
        // Store the complete blog post data for export later
        setStepResults(prev => ({
          ...prev,
          finalContent: blogPost.content,
          selectedContent: selectedTopicData,
          generatedBlogPost: blogPost // Store full blog post data
        }));
        
        setGeneratedContent(blogPost.content);
        
        // Complete blog generation and default to preview mode
        setTimeout(() => {
          setBlogGenerating(false);
          setIsLoading(false);
          setPreviewMode(true); // Default to preview mode
          setCurrentStep(4); // Move to editing step
        }, 1000);
      } else {
        throw new Error('No content generated');
      }

    } catch (error) {
      console.error('Content generation error:', error);
      message.error(`Failed to generate content: ${error.message}`);
      
      // No fallback content - return to previous step on error
      setCurrentStep(2);
      setBlogGenerating(false);
      setIsLoading(false);
    } finally {
      // Final cleanup
      setIsLoading(false);
      setBlogGenerating(false);
    }
  };

  // EXTRACTED FROM APP.JS: Content change handler
  const handleContentChange = (e) => {
    setGeneratedContent(e.target.value);
  };

  // EXTRACTED FROM APP.JS: Get current post data
  const getCurrentPost = () => {
    const selectedTopicData = stepResults.trendingTopics?.find(t => t.id === selectedTopic);
    
    if (!selectedTopicData) {
      return null; // No valid post data available
    }
    
    return {
      title: selectedTopicData.title,
      slug: selectedTopicData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50),
      subheader: selectedTopicData.subheader,
      excerpt: selectedTopicData.subheader,
      content: generatedContent,
      tags: ['AI Generated', 'AutoBlog', selectedTopicData.category],
      category: selectedTopicData.category,
      wordCount: Math.round(generatedContent.length / 5),
      readingTime: Math.ceil(generatedContent.length / 1000),
      author: 'AutoBlog AI',
      businessName: stepResults.websiteAnalysis.businessName,
      brandColors: stepResults.websiteAnalysis.brandColors,
      brandVoice: stepResults.websiteAnalysis.brandVoice
    };
  };

  // EXTRACTED FROM APP.JS: Strategy display helper
  const getStrategyDisplayText = (type, value) => {
    const displayTexts = {
      goal: {
        awareness: 'Brand Awareness',
        consideration: 'Lead Generation',
        conversion: 'Sales Conversion',
        retention: 'Customer Retention'
      },
      voice: {
        expert: 'Expert Authority',
        friendly: 'Friendly Guide',
        insider: 'Industry Insider',
        storyteller: 'Storyteller'
      },
      template: {
        'how-to': 'Step-by-Step Guide',
        'problem-solution': 'Problem & Solution',
        'listicle': 'List Article',
        'case-study': 'Case Study',
        'comprehensive': 'Deep-Dive Guide'
      },
      length: {
        quick: 'Quick Read (500 words)',
        standard: 'Standard (1000 words)',
        deep: 'Deep-Dive (2000+ words)'
      }
    };
    
    return displayTexts[type]?.[value] || value;
  };

  // EXTRACTED FROM APP.JS: Reset demo function
  const resetDemo = () => {
    window.location.reload();
  };

  // Render appropriate step component
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <WebsiteAnalysisStep {...workflowState} />;
      case 1:
        return <CustomerStrategyStep {...workflowState} />;
      case 2:
        return <TopicSelectionStep {...workflowState} />;
      case 3:
        return <ContentGenerationStep {...workflowState} />;
      case 4:
        return <ContentEditingStep {...workflowState} />;
      case 5:
        return <ExportStep {...workflowState} />;
      default:
        return <WebsiteAnalysisStep {...workflowState} />;
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: embedded ? '0' : '20px' }}>
      {/* Progress Steps */}
      <div style={{ marginBottom: '40px' }}>
        <Steps
          current={currentStep}
          items={steps.map((step, index) => ({
            ...step,
            status: index < currentStep ? 'finish' : index === currentStep ? 'process' : 'wait'
          }))}
        />
      </div>

      {/* Render Current Step */}
      {renderCurrentStep()}

      {/* Authentication Modal */}
      <AuthModal 
        open={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setAuthContext(null);
        }}
        context={authContext}
      />
    </div>
  );
};

export default WorkflowContainer;