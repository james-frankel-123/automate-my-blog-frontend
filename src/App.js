import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Typography, Radio, Spin, Progress, Input, message, Space, Tag, Form, Select, Slider, ColorPicker, Modal, Divider, Steps, Collapse } from 'antd';
import { SearchOutlined, BulbOutlined, EditOutlined, CheckOutlined, ReloadOutlined, GlobalOutlined, ScanOutlined, EyeOutlined, SettingOutlined, ApiOutlined, CloudUploadOutlined, CodeOutlined, DownOutlined, CloudDownloadOutlined, FileMarkdownOutlined, FileTextOutlined, DatabaseOutlined, FileZipOutlined, LockOutlined } from '@ant-design/icons';
import './styles/design-system.css';
import './styles/mobile.css';
import SEOHead from './components/SEOHead';
import autoBlogAPI from './services/api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const App = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [scanningMessage, setScanningMessage] = useState('');
  const [editingStep, setEditingStep] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedCMS, setSelectedCMS] = useState(null);
  const [expandedSteps, setExpandedSteps] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [userAccount, setUserAccount] = useState(null);
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [showSignupGate, setShowSignupGate] = useState(false);
  const [emailForm] = Form.useForm();
  const [signupForm] = Form.useForm();
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [strategyCompleted, setStrategyCompleted] = useState(false);
  const [blogGenerating, setBlogGenerating] = useState(false);
  
  // Post state and content strategy management
  const [postState, setPostState] = useState('draft'); // 'draft', 'exported', 'locked'
  const [contentStrategy, setContentStrategy] = useState({
    goal: 'awareness', // 'awareness', 'consideration', 'conversion', 'retention'
    voice: 'expert', // 'expert', 'friendly', 'insider', 'storyteller'
    template: 'problem-solution', // 'how-to', 'problem-solution', 'listicle', 'case-study', 'comprehensive'
    length: 'standard' // 'quick', 'standard', 'deep'
  });
  const [customFeedback, setCustomFeedback] = useState('');
  const [showStrategyGate, setShowStrategyGate] = useState(false);
  const [showExportWarning, setShowExportWarning] = useState(false);
  
  // Customer strategy selection
  const [selectedCustomerStrategy, setSelectedCustomerStrategy] = useState(null);
  const [showMoreStrategiesGate, setShowMoreStrategiesGate] = useState(false);
  const [strategySelectionCompleted, setStrategySelectionCompleted] = useState(false);
  
  // Web search research insights
  const [webSearchInsights, setWebSearchInsights] = useState({
    brandResearch: null,
    keywordResearch: null,
    researchQuality: 'basic' // 'basic', 'enhanced', 'premium'
  });
  
  // Demo mode for testing (bypass payment gates)
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
      // Backward compatibility fields
      targetAudience: 'Parents of children aged 2-12',
      contentFocus: 'Emotional wellness, child development, mindful parenting',
      brandVoice: 'Warm, expert, supportive',
      description: '',
      keywords: [],
      // New customer psychology fields
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

  // No mock topics - only use real AI-generated content

  const steps = [
    { title: 'Analyzing Website', icon: <ScanOutlined />, description: 'Scanning your website to understand your business' },
    { title: 'Selecting Strategy', icon: <SearchOutlined />, description: 'Choose your target customer strategy' },
    { title: 'Generating Ideas', icon: <BulbOutlined />, description: 'Creating targeted blog post previews', requiresLogin: true },
    { title: 'Creating Content', icon: <EditOutlined />, description: 'AI is writing your personalized blog post', requiresLogin: true },
    { title: 'Editing Content', icon: <EyeOutlined />, description: 'Review and customize your blog post', requiresLogin: true }
  ];

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

  // Load trending topics when reaching step 2
  useEffect(() => {
    if (currentStep === 2) {
      // Small delay to let the user see the completion message, then auto-trigger
      setTimeout(() => {
        loadTrendingTopics();
      }, 2000);
    }
  }, [currentStep]);

  // Removed automatic step progression - user should manually select topics and proceed

  // Check for gating at key points
  useEffect(() => {
    // Signup gate at step 4+ (Edit Content) - now requires account instead of just email
    if (currentStep >= 4 && !userAccount && !showSignupGate) {
      setShowSignupGate(true);
    }
  }, [currentStep, userAccount]);

  // Simulate website scanning with progressive messages
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
          // Complete website analysis
          completeWebsiteAnalysis();
        }
      }, 800);
      
      return () => clearInterval(messageInterval);
    }
  }, [currentStep]);

  const completeWebsiteAnalysis = async () => {
    try {
      // Show enhanced loading states for web search research
      setIsLoading(true);
      
      // Phase 1: Initial Analysis
      setScanningMessage('Analyzing website content...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Phase 2: Web Search Research
      setScanningMessage('🔍 Researching brand guidelines and social media...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Phase 3: Keyword Research
      setScanningMessage('📊 Analyzing competitor keywords and search trends...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Phase 4: Customer Intelligence
      setScanningMessage('👥 Gathering customer insights and reviews...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Phase 5: Final Analysis
      setScanningMessage('🧠 Synthesizing insights with AI...');

      // Call enhanced backend API
      const response = await autoBlogAPI.analyzeWebsite(websiteUrl);
      
      if (response.success && response.analysis) {
        // Debug: Log the analysis structure to see what we're getting
        console.log('Website analysis response:', JSON.stringify(response.analysis, null, 2));
        console.log('Scenarios structure:', response.analysis.scenarios);
        if (response.analysis.scenarios && response.analysis.scenarios[0]) {
          console.log('First scenario:', response.analysis.scenarios[0]);
          console.log('Has businessValue?', !!response.analysis.scenarios[0].businessValue);
          console.log('Has targetSegment?', !!response.analysis.scenarios[0].targetSegment);
        }

        // Determine research quality based on response completeness
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

        // Use real AI analysis results
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
            // Map new customer psychology fields
            decisionMakers: response.analysis.decisionMakers || response.analysis.targetAudience || 'General Audience',
            endUsers: response.analysis.endUsers || 'Product users',
            searchBehavior: response.analysis.searchBehavior || '',
            connectionMessage: response.analysis.connectionMessage || '',
            // Business goals analysis
            businessModel: response.analysis.businessModel || '',
            websiteGoals: response.analysis.websiteGoals || '',
            blogStrategy: response.analysis.blogStrategy || '',
            // New scenario-based structure
            scenarios: response.analysis.scenarios || [],
            // Web search enhancement status
            webSearchStatus: response.analysis.webSearchStatus || {
              businessResearchSuccess: false,
              keywordResearchSuccess: false,
              enhancementComplete: false
            },
            // Backward compatibility fields
            customerProblems: response.analysis.customerProblems || [],
            customerLanguage: response.analysis.customerLanguage || [],
            keywords: response.analysis.keywords || [],
            contentIdeas: response.analysis.contentIdeas || []
          }
        }));

        // Complete analysis but don't move to next step automatically
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
      
      // Fall back to basic analysis on error
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

  const loadTrendingTopics = async () => {
    try {
      const analysis = stepResults.websiteAnalysis;
      
      // Check if web search enhancement completed successfully
      if (!analysis.webSearchStatus?.enhancementComplete) {
        console.log('Web search enhancement incomplete, waiting for completion...');
        setIsLoading(true);
        setScanningMessage('Enhancing analysis with web search data...');
        
        // Wait and retry - do NOT proceed with basic analysis
        setTimeout(() => {
          if (stepResults.websiteAnalysis.webSearchStatus?.enhancementComplete) {
            loadTrendingTopics(); // Retry now that enhancement is complete
          } else {
            console.log('Web search still incomplete, continuing to wait...');
            loadTrendingTopics(); // Keep retrying until enhancement completes
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
      if (selectedCustomerStrategy && selectedCustomerStrategy.contentIdeas) {
        console.log('Using fallback content ideas from strategy');
        const fallbackTopics = selectedCustomerStrategy.contentIdeas.map((idea, index) => ({
          id: `strategy-${index}`,
          title: idea.title,
          subheader: idea.searchIntent,
          category: 'Strategy Content',
          seoBenefit: idea.businessAlignment,
          scenario: selectedCustomerStrategy,
          image: `https://via.placeholder.com/400x250/6B8CAE/FFFFFF?text=${encodeURIComponent(idea.title.substring(0, 20))}`,
          isLoading: false,
          isContentLoading: false,
          isImageLoading: false
        }));
        
        setStepResults(prev => ({
          ...prev,
          trendingTopics: fallbackTopics
        }));
        
        setStrategyCompleted(true);
        message.success(`Generated ${fallbackTopics.length} content ideas from your strategy!`);
      }
    }
  };

  // Removed handleTopicSelect - now using direct generateContent calls

  const editStepResults = (stepNumber) => {
    setEditingStep(stepNumber);
  };

  const saveStepResults = (stepNumber, newResults) => {
    setStepResults(prev => ({
      ...prev,
      ...newResults
    }));
    setEditingStep(null);
    
    // Regenerate downstream steps if needed
    if (stepNumber <= 1) {
      message.info('Regenerating content based on updated analysis...');
      // Reset selection and content
      setSelectedTopic(null);
      setGeneratedContent('');
      if (currentStep > 6) {
        setCurrentStep(6); // Go back to topic selection
      }
    }
  };

  const cancelEdit = () => {
    setEditingStep(null);
  };

  const analyzeWebsite = () => {
    if (!websiteUrl.trim()) {
      message.warning('Please enter a website URL');
      return;
    }
    
    // Improved URL validation that works better on mobile
    const normalizedUrl = websiteUrl.trim().toLowerCase();
    
    // Debug logging for mobile troubleshooting
    console.log('URL Validation Debug:', {
      originalUrl: websiteUrl,
      normalizedUrl: normalizedUrl,
      userAgent: navigator.userAgent,
      isMobile: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)
    });
    
    // More flexible URL pattern that handles various cases
    const urlPattern = /^(https?:\/\/)?([a-z0-9\-]+\.)*[a-z0-9\-]+\.[a-z]{2,}(\/.*)?$/i;
    
    // Additional check for basic domain structure
    const hasValidDomain = /[a-z0-9\-]+\.[a-z]{2,}/i.test(normalizedUrl);
    
    console.log('URL Pattern Tests:', {
      urlPatternTest: urlPattern.test(normalizedUrl),
      hasValidDomain: hasValidDomain
    });
    
    if (!urlPattern.test(normalizedUrl) || !hasValidDomain) {
      message.error('Please enter a valid website URL (e.g., example.com)');
      return;
    }
    
    // Ensure URL has protocol for backend API
    let formattedUrl = websiteUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    setWebsiteUrl(formattedUrl);
    
    setCurrentStep(1);
  };

  const generateContent = async (topicId) => {
    if (!topicId) {
      message.warning('Please select a topic first');
      return;
    }
    
    // Check if user needs to sign up for step 7+
    if (!userAccount) {
      setShowSignupGate(true);
      return;
    }
    
    try {
      setSelectedTopic(topicId); // Set the selected topic for loading state
      setIsLoading(true);
      setBlogGenerating(true);
      setScanningMessage('Generating your blog post with AI...');
      
      // Move to Step 5 and show skeleton loading
      setCurrentStep(5);
      scrollToNextSection(5);
      
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
        }, 1000);
      } else {
        throw new Error('No content generated');
      }

    } catch (error) {
      console.error('Content generation error:', error);
      message.error(`Failed to generate content: ${error.message}`);
      
      // No fallback content - return to previous step on error
      setCurrentStep(3);
      setBlogGenerating(false);
      setIsLoading(false);
    } finally {
      // Final cleanup
      setIsLoading(false);
      setBlogGenerating(false);
    }
  };

  const handleContentChange = (e) => {
    setGeneratedContent(e.target.value);
  };

  const publishContent = () => {
    message.success('Content published successfully! (Demo mode)');
  };

  // Export functions for blog post download
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
      website: websiteUrl,
      brandColors: stepResults.websiteAnalysis.brandColors,
      readingTime: Math.ceil((generatedContent || '').length / 1000),
      wordCount: (generatedContent || '').split(' ').length
    };
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success(`Downloaded ${filename} successfully!`);
  };

  const exportAsMarkdown = async () => {
    const post = getCurrentPost();
    
    if (!post) {
      message.error('No blog post data available for export');
      return;
    }
    
    try {
      // Try backend API export first
      if (stepResults.generatedBlogPost) {
        const blob = await autoBlogAPI.exportContent(stepResults.generatedBlogPost, 'markdown');
        if (blob instanceof Blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${post.slug}.md`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          message.success('Downloaded markdown file successfully!');
          return;
        }
      }
    } catch (error) {
      console.warn('Backend export failed, using local generation:', error.message);
    }
    
    // Fallback to local generation
    const markdown = `# ${post.title}

${post.subheader}

${post.content}

---
*Generated by AutoBlog - AI-Powered Content Creation*

**Tags**: ${post.tags.join(', ')}
**Category**: ${post.category}
**Reading Time**: ${post.readingTime} minutes
**Word Count**: ${post.wordCount} words
**Source Website**: ${post.website}
`;

    downloadFile(markdown, `${post.slug}.md`, 'text/markdown');
    
    // Lock the post after export
    setPostState('exported');
    setPreviewMode(true); // Force to preview mode
    message.success('Post exported and locked. Generate a new post to make further changes.');
  };

  const exportAsHTML = () => {
    const post = getCurrentPost();
    
    if (!post) {
      message.error('No blog post data available for export');
      return;
    }
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title}</title>
  <meta name="description" content="${post.excerpt}">
  <meta name="keywords" content="${post.tags.join(', ')}">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header { text-align: center; margin-bottom: 40px; }
    .subheader { font-size: 1.2em; color: ${post.brandColors.primary}; margin-bottom: 30px; }
    .content { margin-bottom: 40px; }
    .footer { border-top: 1px solid #eee; padding-top: 20px; font-size: 0.9em; color: #666; }
    .tags { margin-top: 10px; }
    .tag { background: ${post.brandColors.secondary}; color: ${post.brandColors.primary}; padding: 4px 8px; border-radius: 4px; margin-right: 8px; font-size: 0.8em; }
    h1 { color: ${post.brandColors.primary}; }
    h2 { color: ${post.brandColors.primary}; margin-top: 30px; }
    h3 { color: ${post.brandColors.accent || post.brandColors.primary}; }
  </style>
</head>
<body>
  <article>
    <header class="header">
      <h1>${post.title}</h1>
      <p class="subheader">${post.subheader}</p>
    </header>
    
    <div class="content">
      ${post.content.replace(/\n/g, '<br>\n')}
    </div>
    
    <footer class="footer">
      <p><em>Generated by AutoBlog - AI-Powered Content Creation</em></p>
      <p><strong>Source Website:</strong> ${post.website}</p>
      <p><strong>Reading Time:</strong> ${post.readingTime} minutes | <strong>Word Count:</strong> ${post.wordCount} words</p>
      <div class="tags">
        ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
      </div>
    </footer>
  </article>
</body>
</html>`;

    downloadFile(html, `${post.slug}.html`, 'text/html');
    
    // Lock the post after export
    setPostState('exported');
    setPreviewMode(true); // Force to preview mode
    message.success('Post exported and locked. Generate a new post to make further changes.');
  };

  const exportAsJSON = () => {
    const post = getCurrentPost();
    const jsonData = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      subheader: post.subheader,
      tags: post.tags,
      category: post.category,
      publishedAt: new Date().toISOString(),
      source: 'AutoBlog AI',
      sourceWebsite: post.website,
      brandColors: post.brandColors,
      metadata: {
        readingTime: post.readingTime,
        wordCount: post.wordCount,
        generatedAt: new Date().toISOString(),
        autoGenerated: true
      }
    };

    downloadFile(
      JSON.stringify(jsonData, null, 2), 
      `${post.slug}.json`, 
      'application/json'
    );
    
    // Lock the post after export
    setPostState('exported');
    setPreviewMode(true); // Force to preview mode
    message.success('Post exported and locked. Generate a new post to make further changes.');
  };

  const exportCompletePackage = () => {
    message.info('Complete package export coming soon! For now, download individual formats.');
    // TODO: Implement ZIP package export with JSZip library
  };

  const resetDemo = () => {
    setCurrentStep(0);
    setSelectedTopic(null);
    setGeneratedContent('');
    setIsLoading(false);
    setWebsiteUrl('');
    setScanningMessage('');
    setEditingStep(null);
    setPreviewMode(false);
    setSelectedCMS(null);
    setExpandedSteps([]);
    setUserEmail('');
    setUserAccount(null);
    setShowEmailGate(false);
    setShowSignupGate(false);
    
    // Reset new state variables
    setPostState('draft');
    setContentStrategy({
      goal: 'awareness',
      voice: 'expert',
      template: 'problem-solution',
      length: 'standard'
    });
    setShowStrategyGate(false);
    setShowExportWarning(false);
    
    // Reset customer strategy selection
    setSelectedCustomerStrategy(null);
    setShowMoreStrategiesGate(false);
    setStrategySelectionCompleted(false);
    setStepResults({
      websiteAnalysis: {
        businessType: 'Child Wellness & Parenting',
        businessName: '',
        targetAudience: 'Parents of children aged 2-12',
        contentFocus: 'Emotional wellness, child development, mindful parenting',
        brandVoice: 'Warm, expert, supportive',
        brandColors: {
          primary: '#6B8CAE',
          secondary: '#F4E5D3',
          accent: '#8FBC8F'
        },
        description: ''
      },
      trendingTopics: [],
      selectedContent: null,
      finalContent: ''
    });
  };

  const handleEmailSubmit = (values) => {
    setUserEmail(values.email);
    setShowEmailGate(false);
    message.success('Email captured! Unlocking your content strategy...');
    
    // Continue to the gated step
    if (currentStep < 4) setCurrentStep(4);
  };

  const handleSignupSubmit = (values) => {
    setUserAccount({
      email: values.email,
      name: values.name,
      company: values.company
    });
    setShowSignupGate(false);
    message.success('Account created! You can now edit and publish your content.');
    
    // Continue to the gated step  
    if (currentStep < 7) setCurrentStep(7);
  };

  const skipForDemo = () => {
    if (showEmailGate) {
      setUserEmail('demo@example.com');
      setShowEmailGate(false);
      message.info('Demo mode: Email requirement skipped');
    }
    
    if (showSignupGate) {
      setUserAccount({ email: 'demo@example.com', name: 'Demo User' });
      setShowSignupGate(false);
      message.info('Demo mode: Signup requirement skipped');
    }
  };

  const progressPercent = Math.round(((currentStep + 1) / 6) * 100);

  // Content Strategy Helper Functions
  const getStrategyDisplayText = (type, value) => {
    const options = {
      goal: {
        awareness: 'Awareness',
        consideration: 'Consideration',
        conversion: 'Conversion',
        retention: 'Retention'
      },
      voice: {
        expert: 'Professional Expert',
        friendly: 'Friendly Guide',
        insider: 'Industry Insider',
        storyteller: 'Storyteller'
      },
      template: {
        'how-to': 'How-To Guide',
        'problem-solution': 'Problem-Solution',
        'listicle': 'Listicle',
        'case-study': 'Case Study',
        'comprehensive': 'Comprehensive Guide'
      },
      length: {
        quick: 'Quick Read (800-1000 words)',
        standard: 'Standard (1200-1500 words)',
        deep: 'Deep Dive (2000+ words)'
      }
    };
    return options[type]?.[value] || value;
  };

  const handleStrategyChange = (type, value) => {
    if (postState === 'exported') {
      message.warning('This post has been exported and is locked. Generate a new post to make changes.');
      return;
    }

    if (!demoMode && !userAccount) {
      setShowStrategyGate(true);
      return;
    }

    setContentStrategy(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const regenerateWithFeedback = async () => {
    if (postState === 'exported') {
      message.warning('This post has been exported and is locked. Generate a new post to make changes.');
      return;
    }

    if (!demoMode && !userAccount) {
      setShowStrategyGate(true);
      return;
    }

    try {
      setIsLoading(true);
      setBlogGenerating(true);
      
      const selectedTopicData = stepResults.trendingTopics?.find(t => t.id === selectedTopic);
      if (!selectedTopicData) {
        message.error('No topic selected for regeneration');
        return;
      }

      // Combine custom feedback with strategy changes
      const additionalInstructions = customFeedback ? 
        `User feedback: ${customFeedback}\n\nContent Strategy: Goal: ${contentStrategy.goal}, Voice: ${contentStrategy.voice}, Template: ${contentStrategy.template}, Length: ${contentStrategy.length}` :
        `Content Strategy: Goal: ${contentStrategy.goal}, Voice: ${contentStrategy.voice}, Template: ${contentStrategy.template}, Length: ${contentStrategy.length}`;

      const response = await autoBlogAPI.generateContent(
        selectedTopicData,
        stepResults.websiteAnalysis,
        additionalInstructions
      );

      if (response.success) {
        setGeneratedContent(response.blogPost.content);
        setStepResults(prev => ({
          ...prev,
          generatedBlogPost: response.blogPost,
          finalContent: response.blogPost.content
        }));
        message.success('Blog post regenerated successfully!');
      } else {
        throw new Error(response.message || 'Failed to regenerate content');
      }
    } catch (error) {
      console.error('Regeneration error:', error);
      message.error(`Failed to regenerate content: ${error.message}`);
    } finally {
      setIsLoading(false);
      setBlogGenerating(false);
    }
  };

  const canEditPost = () => {
    return postState === 'draft';
  };

  const toggleDemoMode = () => {
    const newDemoMode = !demoMode;
    setDemoMode(newDemoMode);
    localStorage.setItem('automyblog_demo_mode', newDemoMode.toString());
    message.info(newDemoMode ? 'Demo mode activated' : 'Demo mode deactivated');
  };

  // Add keyboard shortcut for demo mode
  React.useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        toggleDemoMode();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [demoMode]);


  // Helper function for auto-scrolling to next section
  const scrollToNextSection = (stepNumber) => {
    setTimeout(() => {
      const nextSection = document.querySelector(`[data-step="${stepNumber}"]`);
      if (nextSection) {
        nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Function to handle "Discover Trends" button click
  const discoverTrends = () => {
    setCurrentStep(2);
    scrollToNextSection(2);
    // Auto-load strategy after a short delay
    setTimeout(() => {
      setStrategyCompleted(true);
    }, 2000);
  };

  // Function to handle "Generate Blog Previews" button click  
  const generateBlogPreviews = () => {
    setCurrentStep(3);
    scrollToNextSection(3);
    // Start loading trending topics
    loadTrendingTopics();
  };

  const renderStyledContent = (content) => {
    const brandColors = stepResults.websiteAnalysis.brandColors;
    
    const styledContent = content.split('\n').map((line, index) => {
      if (line.startsWith('# ')) {
        return (
          <Title 
            key={index} 
            level={1} 
            style={{ color: brandColors.primary, marginTop: '20px' }}
          >
            {line.substring(2)}
          </Title>
        );
      } else if (line.startsWith('## ')) {
        return (
          <Title 
            key={index} 
            level={2} 
            style={{ color: brandColors.primary, marginTop: '16px' }}
          >
            {line.substring(3)}
          </Title>
        );
      } else if (line.startsWith('### ')) {
        return (
          <Title 
            key={index} 
            level={3} 
            style={{ color: brandColors.accent, marginTop: '12px' }}
          >
            {line.substring(4)}
          </Title>
        );
      } else if (line.includes('*') && line.startsWith('*') && line.endsWith('*')) {
        return (
          <Paragraph 
            key={index} 
            style={{ 
              fontStyle: 'italic', 
              color: brandColors.accent,
              backgroundColor: brandColors.secondary + '40',
              padding: '12px',
              borderRadius: '8px',
              margin: '16px 0'
            }}
          >
            {line.substring(1, line.length - 1)}
          </Paragraph>
        );
      } else if (line.trim()) {
        return <Paragraph key={index} style={{ margin: '8px 0' }}>{line}</Paragraph>;
      } else {
        return <br key={index} />;
      }
    });

    return (
      <div 
        style={{ 
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: `2px solid ${brandColors.secondary}`,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}
      >
        <style>
          {`
            .styled-preview a {
              color: ${brandColors.primary};
            }
            .styled-preview a:hover {
              color: ${brandColors.accent};
            }
          `}
        </style>
        <div className="styled-preview">
          {styledContent}
        </div>
      </div>
    );
  };

  const toggleStepExpansion = (stepIndex) => {
    setExpandedSteps(prev => 
      prev.includes(stepIndex) 
        ? prev.filter(i => i !== stepIndex)
        : [...prev, stepIndex]
    );
  };

  const renderStepSummary = (stepIndex) => {
    if (stepIndex >= currentStep) return null; // Only show summaries for completed steps

    const stepSummaries = {
      0: (
        <div>
          <Row gutter={[12, 8]}>
            <Col xs={24}>
              <Text strong>Website:</Text> {websiteUrl || 'Not provided'}
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>Domain Type:</Text> {websiteUrl?.includes('.com') ? 'Business Website' : websiteUrl?.includes('.org') ? 'Organization' : 'Website'}
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>Ready for:</Text> AI business analysis
            </Col>
          </Row>
        </div>
      ),
      
      1: (
        <div>
          <Row gutter={[12, 8]}>
            <Col xs={24}>
              <Text strong>Website:</Text> {websiteUrl}
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>Business Detected:</Text> {stepResults.websiteAnalysis.businessName || 'Analyzing...'}
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>Industry Identified:</Text> {stepResults.websiteAnalysis.businessType}
            </Col>
          </Row>
        </div>
      ),

      2: stepResults.websiteAnalysis.businessName ? (
        <div>
          <Row gutter={[12, 8]}>
            <Col xs={24}>
              <Text strong>Website:</Text> {websiteUrl}
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>Company Details:</Text> {stepResults.websiteAnalysis.businessName} ({stepResults.websiteAnalysis.businessType})
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>Target Audience:</Text> {stepResults.websiteAnalysis.targetAudience}
            </Col>
            <Col xs={24}>
              <Text strong>Brand Colors:</Text>{' '}
              <Space size="small">
                {Object.entries(stepResults.websiteAnalysis.brandColors).map(([key, color]) => (
                  <div key={key} style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    backgroundColor: color,
                    borderRadius: '2px',
                    border: '1px solid #ddd'
                  }} title={`${key}: ${color}`} />
                ))}
                <Text style={{ marginLeft: '8px', fontSize: '12px' }}>
                  Primary {stepResults.websiteAnalysis.brandColors.primary}, Secondary {stepResults.websiteAnalysis.brandColors.secondary}
                </Text>
              </Space>
            </Col>
            <Col xs={24}>
              <Text strong>Brand Voice:</Text> {stepResults.websiteAnalysis.brandVoice}
            </Col>
          </Row>
        </div>
      ) : (
        <div>
          <Text strong>Website:</Text> {websiteUrl} - Analysis complete
        </div>
      ),
      
      3: (
        <div>
          <Row gutter={[12, 8]}>
            <Col xs={24}>
              <Text strong>Trending Keywords:</Text> AI Safety for Children, Emotional Regulation, Screen-Free Learning, Holiday Stress Management, Mindful Bedtime Routines
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>Industry Focus:</Text> {stepResults.websiteAnalysis.businessType}
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>Content Opportunities:</Text> 5 trending topics identified
            </Col>
            <Col xs={24}>
              <Text strong>Target Audience Match:</Text> Perfect fit for {stepResults.websiteAnalysis.targetAudience.toLowerCase()}
            </Col>
          </Row>
        </div>
      ),

      4: (
        <div>
          <Row gutter={[12, 8]}>
            <Col xs={24}>
              <Text strong>Content Ideas:</Text> "How to Teach AI Safety", "5 Science-Backed Emotional Techniques", "50 Screen-Free Brain Activities", "Managing Holiday Stress", "10-Minute Mindful Bedtime Routine"
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>Topics Identified:</Text> 5 compelling article concepts
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>Brand-Matched Concepts:</Text> Tailored to {stepResults.websiteAnalysis.brandVoice.toLowerCase()} voice
            </Col>
            <Col xs={24}>
              <Text strong>Content Angle:</Text> Expert guidance with practical, actionable advice for parents
            </Col>
          </Row>
        </div>
      ),

      5: (
        <div>
          <Row gutter={[12, 8]}>
            <Col xs={24}>
              <Text strong>Visual Themes:</Text> Warm family moments, calming environments, child development, emotional support scenarios, cozy home settings
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>Brand-Styled Images:</Text> Using {stepResults.websiteAnalysis.brandColors.primary} and {stepResults.websiteAnalysis.brandColors.secondary} color palette
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>Hero Image Options:</Text> 5 professional concepts ready
            </Col>
            <Col xs={24}>
              <Text strong>Visual Mood:</Text> Supportive, nurturing, and authentic family-focused imagery
            </Col>
          </Row>
        </div>
      ),
      
      6: selectedTopic ? (
        <div>
          <Row gutter={[12, 8]}>
            <Col xs={24}>
              <Text strong>Selected Topic:</Text><br />
              <Text>{stepResults.trendingTopics?.find(t => t.id === selectedTopic)?.title || 'No topic selected'}</Text>
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>Content Angle:</Text> {stepResults.trendingTopics?.find(t => t.id === selectedTopic)?.category || 'Not specified'} approach
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>Target Keywords:</Text> {stepResults.trendingTopics?.find(t => t.id === selectedTopic)?.seoBenefit || 'Not specified'}
            </Col>
            <Col xs={24}>
              <Text strong>Content Strategy:</Text> Expert guidance tailored to {stepResults.websiteAnalysis.targetAudience.toLowerCase()}
            </Col>
          </Row>
        </div>
      ) : (
        <div>
          <Text strong>Topic Selection:</Text> Ready to choose from 5 trending options
        </div>
      ),
      
      7: generatedContent ? (
        <div>
          <Row gutter={[12, 8]}>
            <Col xs={24}>
              <Text strong>Content Generated:</Text> {generatedContent.split('\n').find(line => line.startsWith('# '))?.substring(2) || 'Full article complete'}
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>Article Length:</Text> {Math.round(generatedContent.length / 5)} words
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>Brand Integration:</Text> {stepResults.websiteAnalysis.businessName} featured throughout
            </Col>
            <Col xs={24}>
              <Text strong>Content Preview:</Text><br />
              <Text style={{ fontStyle: 'italic' }}>"{generatedContent.split('\n').find(line => line && !line.startsWith('#') && line.length > 50)?.substring(0, 100) || 'Expert content ready for publication'}..."</Text>
            </Col>
          </Row>
        </div>
      ) : (
        <div>
          <Text strong>Content Creation:</Text> Full article generated and ready for editing
        </div>
      ),

      8: selectedCMS ? (
        <div>
          <Row gutter={[12, 8]}>
            <Col xs={24}>
              <Text strong>Publishing Platform:</Text> {cmsOptions.find(c => c.id === selectedCMS)?.name}
            </Col>
            <Col xs={24}>
              <Text strong>Target Website:</Text> <Text code>{websiteUrl}</Text>
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>Integration Status:</Text> {cmsOptions.find(c => c.id === selectedCMS)?.complexity} setup ready
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>Content Delivery:</Text> {cmsOptions.find(c => c.id === selectedCMS)?.integration}
            </Col>
          </Row>
        </div>
      ) : (
        <div>
          <Text strong>Publishing Setup:</Text> Ready to connect your website platform
        </div>
      )
    };

    const summary = stepSummaries[stepIndex];
    if (!summary) return null;

    // Create collapsed summary text for each step
    const getCollapsedText = () => {
      switch(stepIndex) {
        case 0: return `Website: ${websiteUrl}`;
        case 1: return `Website: ${websiteUrl} - Business detected: ${stepResults.websiteAnalysis.businessName || 'Analyzing...'}`;
        case 2: return stepResults.websiteAnalysis.businessName 
          ? `Company Details: ${stepResults.websiteAnalysis.businessName} - ${stepResults.websiteAnalysis.businessType}, Brand Colors: ${stepResults.websiteAnalysis.brandColors.primary}, ${stepResults.websiteAnalysis.brandColors.secondary}`
          : `Website: ${websiteUrl} - Analysis complete`;
        case 3: return 'Trending Keywords: AI Safety for Children, Emotional Regulation, Screen-Free Learning, Holiday Stress, Mindful Bedtime';
        case 4: return 'Content Ideas: AI Safety Guide, Emotional Techniques, Screen-Free Activities, Holiday Stress Management, Bedtime Routines';
        case 5: return `Visual Themes: Family moments, calming environments, child development - styled with ${stepResults.websiteAnalysis.brandColors.primary} brand colors`;
        case 6: return selectedTopic 
          ? `Selected Topic: ${stepResults.trendingTopics?.find(t => t.id === selectedTopic)?.title?.substring(0, 60) || 'No topic selected'}...`
          : 'Topic Selection: 5 trending options ready';
        case 7: return generatedContent 
          ? `Content Generated: "${generatedContent.split('\n').find(line => line.startsWith('# '))?.substring(2, 60) || 'Full article'}..." - ${Math.round(generatedContent.length / 5)} words`
          : 'Content Creation: Full article generated and ready';
        case 8: return selectedCMS 
          ? `Publishing Platform: ${cmsOptions.find(c => c.id === selectedCMS)?.name} → ${websiteUrl}`
          : 'Publishing Setup: Ready to connect website platform';
        default: return 'Step completed';
      }
    };

    return (
      <Card 
        size="small" 
        style={{ 
          marginTop: '12px',
          border: `1px solid ${stepResults.websiteAnalysis.brandColors.secondary}`,
          backgroundColor: stepResults.websiteAnalysis.brandColors.secondary + '20'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            {expandedSteps.includes(stepIndex) ? summary : (
              <Text>{getCollapsedText()}</Text>
            )}
          </div>
          <Space>
            <Button 
              type="link" 
              size="small"
              icon={expandedSteps.includes(stepIndex) ? <DownOutlined style={{ transform: 'rotate(180deg)' }} /> : <DownOutlined />}
              onClick={() => toggleStepExpansion(stepIndex)}
            >
              {expandedSteps.includes(stepIndex) ? 'Less' : 'More'}
            </Button>
            {stepIndex === 2 && (
              <Button 
                type="link" 
                size="small"
                icon={<SettingOutlined />}
                onClick={() => editStepResults(1)}
              >
                Edit
              </Button>
            )}
          </Space>
        </div>
      </Card>
    );
  };

  const handleCMSSelection = (cmsId) => {
    setSelectedCMS(cmsId);
  };

  const renderBusinessOverview = () => {
    const analysis = stepResults.websiteAnalysis;
    const isComplete = currentStep >= 2;
    
    // Detect if analysis seems generic/limited (likely JavaScript-heavy site)
    const seemsLimited = analysis.businessType === 'Technology' && 
                        analysis.description && 
                        analysis.description.toLowerCase().includes('javascript');

    // Extract domain for business context
    const domain = websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    
    return (
      <Card 
        style={{ 
          border: `2px solid ${analysis.brandColors.primary}`,
          borderRadius: '12px',
          background: `linear-gradient(135deg, ${analysis.brandColors.secondary}15, #ffffff)`,
          marginBottom: '30px'
        }}
      >
        {/* Company Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <Title 
              level={3} 
              style={{ 
                margin: 0, 
                color: analysis.brandColors.primary,
                fontSize: '24px',
                fontWeight: 600,
                marginBottom: '4px'
              }}
            >
              {analysis.businessName || 'Business Profile'}
            </Title>
            <Text style={{ fontSize: '16px', color: '#666' }}>
              {domain} • {analysis.businessType}
            </Text>
          </div>
          {isComplete && (
            <Button 
              icon={<SettingOutlined />} 
              onClick={() => editStepResults(1)}
              type="link"
              style={{ color: analysis.brandColors.primary }}
            >
              Edit
            </Button>
          )}
        </div>

        {seemsLimited && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fff7e6',
            border: '1px solid #ffd591',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <Text style={{ fontSize: '14px' }}>
              ⚠️ <strong>Limited Website Content:</strong> This appears to be a JavaScript-heavy site. 
              Click "Edit" above to provide more details about your business for better content recommendations.
            </Text>
          </div>
        )}

        {/* Web Search Research Insights section removed */}

        {webSearchInsights.researchQuality === 'basic' && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fafafa',
            border: '1px solid #d9d9d9',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <Text strong style={{ color: '#666', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
              📊 Standard Analysis
            </Text>
            <div style={{ fontSize: '13px', color: '#666' }}>
              Analysis based on website content. Upgrade for enhanced research with brand guidelines, competitor analysis, and real-time keyword data.
            </div>
          </div>
        )}

        {/* Business Overview */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: analysis.brandColors.primary + '08', 
              borderRadius: '8px',
              border: `1px solid ${analysis.brandColors.primary}20`,
              height: '100%'
            }}>
              <Text strong style={{ color: analysis.brandColors.primary, fontSize: '16px', marginBottom: '8px', display: 'block' }}>
                What They Do
              </Text>
              <Text style={{ fontSize: '14px', lineHeight: '1.5' }}>
                {analysis.description || `${analysis.businessName} operates in the ${analysis.businessType.toLowerCase()} space, focusing on ${analysis.contentFocus?.toLowerCase() || 'delivering specialized services'}.`}
              </Text>
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: analysis.brandColors.accent + '08', 
              borderRadius: '8px',
              border: `1px solid ${analysis.brandColors.accent}20`,
              height: '100%'
            }}>
              <Text strong style={{ color: analysis.brandColors.accent, fontSize: '16px', marginBottom: '8px', display: 'block' }}>
                Target Audience
              </Text>
              <Text style={{ fontSize: '14px', lineHeight: '1.5' }}>
                {analysis.decisionMakers || analysis.targetAudience}
              </Text>
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: analysis.brandColors.secondary + '30', 
              borderRadius: '8px',
              border: `1px solid ${analysis.brandColors.secondary}60`,
              height: '100%'
            }}>
              <Text strong style={{ color: analysis.brandColors.primary, fontSize: '16px', marginBottom: '8px', display: 'block' }}>
                Brand Voice
              </Text>
              <Text style={{ fontSize: '14px', lineHeight: '1.5' }}>
                {analysis.brandVoice}
              </Text>
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: analysis.brandColors.primary + '06', 
              borderRadius: '8px',
              border: `1px solid ${analysis.brandColors.primary}15`,
              height: '100%'
            }}>
              <Text strong style={{ color: analysis.brandColors.primary, fontSize: '16px', marginBottom: '8px', display: 'block' }}>
                Content Focus
              </Text>
              <Text style={{ fontSize: '14px', lineHeight: '1.5' }}>
                {analysis.contentFocus || `Educational content about ${analysis.businessType.toLowerCase()}`}
              </Text>
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: analysis.brandColors.secondary + '20', 
              borderRadius: '8px',
              border: `1px solid ${analysis.brandColors.secondary}40`,
              height: '100%'
            }}>
              <Text strong style={{ color: analysis.brandColors.primary, fontSize: '16px', marginBottom: '12px', display: 'block' }}>
                Brand Colors
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: analysis.brandColors.primary,
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    flexShrink: 0
                  }} />
                  <Text style={{ fontSize: '13px', color: '#666' }}>
                    <Text strong>Primary:</Text> {analysis.brandColors.primary}
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: analysis.brandColors.secondary,
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    flexShrink: 0
                  }} />
                  <Text style={{ fontSize: '13px', color: '#666' }}>
                    <Text strong>Secondary:</Text> {analysis.brandColors.secondary}
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: analysis.brandColors.accent,
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    flexShrink: 0
                  }} />
                  <Text style={{ fontSize: '13px', color: '#666' }}>
                    <Text strong>Accent:</Text> {analysis.brandColors.accent}
                  </Text>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Business Strategy - Only show if AI generated these fields */}
        {(analysis.businessModel || analysis.websiteGoals || analysis.blogStrategy) && (
          <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            {analysis.businessModel && (
              <Col xs={24} lg={8}>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: analysis.brandColors.accent + '08', 
                  borderRadius: '8px',
                  border: `1px solid ${analysis.brandColors.accent}20`,
                  height: '100%'
                }}>
                  <Text strong style={{ color: analysis.brandColors.accent, fontSize: '16px', marginBottom: '8px', display: 'block' }}>
                    Business Model
                  </Text>
                  <Text style={{ fontSize: '14px', lineHeight: '1.5' }}>
                    {analysis.businessModel}
                  </Text>
                </div>
              </Col>
            )}

            {analysis.websiteGoals && (
              <Col xs={24} lg={8}>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: analysis.brandColors.primary + '08', 
                  borderRadius: '8px',
                  border: `1px solid ${analysis.brandColors.primary}20`,
                  height: '100%'
                }}>
                  <Text strong style={{ color: analysis.brandColors.primary, fontSize: '16px', marginBottom: '8px', display: 'block' }}>
                    Website Goals
                  </Text>
                  <Text style={{ fontSize: '14px', lineHeight: '1.5' }}>
                    {analysis.websiteGoals}
                  </Text>
                </div>
              </Col>
            )}

            {analysis.blogStrategy && (
              <Col xs={24} lg={8}>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: analysis.brandColors.secondary + '40', 
                  borderRadius: '8px',
                  border: `1px solid ${analysis.brandColors.secondary}60`,
                  height: '100%'
                }}>
                  <Text strong style={{ color: analysis.brandColors.primary, fontSize: '16px', marginBottom: '8px', display: 'block' }}>
                    Blog Strategy
                  </Text>
                  <Text style={{ fontSize: '14px', lineHeight: '1.5' }}>
                    {analysis.blogStrategy}
                  </Text>
                </div>
              </Col>
            )}
          </Row>
        )}

        {/* Keywords if available */}
        {analysis.keywords && analysis.keywords.length > 0 && (
          <div style={{ 
            marginTop: '20px',
            padding: '16px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px'
          }}>
            <Text strong style={{ color: analysis.brandColors.primary, fontSize: '16px', marginBottom: '12px', display: 'block' }}>
              Key Topics & Keywords
            </Text>
            <Space wrap>
              {analysis.keywords.map((keyword, index) => (
                <Tag 
                  key={index} 
                  color={analysis.brandColors.primary}
                  style={{ 
                    borderRadius: '12px',
                    fontSize: '12px',
                    padding: '4px 8px'
                  }}
                >
                  {keyword}
                </Tag>
              ))}
            </Space>
          </div>
        )}
      </Card>
    );
  };

  // renderContentStrategy function removed - now integrated into Building Strategy section

  const generateCMSCode = (cmsId) => {
    const codeExamples = {
      wordpress: `// WordPress Plugin Integration
// Install: Download AutoBlog WordPress plugin
// Configure: Add API key in Settings > AutoBlog

// Webhook endpoint automatically created at:
// ${websiteUrl}/wp-json/autoblog/v1/webhook

// Content will be automatically posted to:
// ${websiteUrl}/wp-admin/edit.php`,

      shopify: `// Shopify Integration
const shopify = new Shopify({
  shopName: '${stepResults.websiteAnalysis.businessName?.toLowerCase()}',
  apiKey: process.env.SHOPIFY_API_KEY,
  password: process.env.SHOPIFY_PASSWORD
});

// AutoBlog webhook will POST to:
// ${websiteUrl}/apps/autoblog/webhook

// Blog posts created at:
// ${websiteUrl}/blogs/news`,

      ghost: `// Ghost CMS Integration
const GhostAdminAPI = require('@tryghost/admin-api');

const api = new GhostAdminAPI({
  url: '${websiteUrl}',
  key: process.env.GHOST_ADMIN_API_KEY,
  version: 'v4'
});

// Webhook endpoint: ${websiteUrl}/ghost/api/v4/webhooks/autoblog/`,

      webflow: `// Webflow CMS Integration
const webflow = new WebflowAPI({
  token: process.env.WEBFLOW_API_TOKEN
});

// Collection ID: your-blog-collection-id
// Webhook: ${websiteUrl}/api/autoblog-webhook
// Content published to: ${websiteUrl}/blog`,

      custom: `// Custom CMS Integration
app.post('/api/autoblog-webhook', async (req, res) => {
  const { title, content, meta_description, tags } = req.body.data;
  
  // Your custom CMS logic here
  await yourCMS.createPost({
    title,
    content,
    description: meta_description,
    tags,
    status: 'published'
  });
  
  res.status(200).send('OK');
});`
    };

    return codeExamples[cmsId] || '// Integration code will be generated based on your selection';
  };

  return (
    <div style={{ 
      padding: window.innerWidth <= 767 ? '10px' : '20px', 
      maxWidth: '1200px', 
      margin: '0 auto' 
    }}>
      <SEOHead 
        title="Automate My Blog - AI Content Generation Platform"
        description="Generate high-quality, trending blog posts automatically using AI. From topic discovery to full content creation in minutes. Export to any CMS or platform."
        keywords="AI blog generation, automated content creation, AI writing, content marketing, blog automation, trending topics, content strategy"
        canonicalUrl="/"
      />

      {/* Demo Mode Banner */}
      {demoMode && (
        <div style={{ 
          backgroundColor: '#ff4500', 
          color: 'white', 
          padding: '12px 20px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          textAlign: 'center',
          border: '2px solid #ff6500'
        }}>
          <Text strong style={{ color: 'white', fontSize: '16px' }}>
            🚧 DEMO MODE ACTIVE
          </Text>
          <div style={{ marginTop: '4px' }}>
            <Text style={{ color: 'white', fontSize: '14px' }}>
              All premium features unlocked for testing • Payment gates bypassed • Press Ctrl+Shift+D to toggle
            </Text>
            <Button 
              size="small" 
              type="text" 
              onClick={toggleDemoMode}
              style={{ 
                color: 'white', 
                marginLeft: '12px', 
                border: '1px solid white',
                fontSize: '12px'
              }}
            >
              Exit Demo Mode
            </Button>
          </div>
        </div>
      )}

      {/* Header with Integrated Website Input */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: window.innerWidth <= 767 ? '20px' : '40px' 
      }}>
        <Title level={1} style={{ color: '#6B8CAE', marginBottom: '16px' }}>
          Automate My Blog
        </Title>
        <Paragraph style={{ fontSize: '18px', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
          Generate trending, high-quality blog posts automatically using AI. From topic discovery to full content creation, 
          then export to any platform. <Text strong>Works with WordPress, Shopify, Ghost, and 15+ platforms.</Text>
        </Paragraph>
        
        {currentStep === 0 && (
          <div style={{ marginTop: '30px', maxWidth: '500px', margin: '30px auto 0' }}>
            <Text style={{ display: 'block', marginBottom: '16px', fontSize: '16px', fontWeight: 500 }}>
              Enter your website URL so we can analyze your business and create relevant content recommendations.
            </Text>
            <Form layout="vertical">
              <Form.Item
                help="Example: mystore.com, myblog.org, mycompany.net"
                style={{ marginBottom: '16px' }}
              >
                <Input
                  size="large"
                  placeholder="Enter your website URL"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  prefix={<GlobalOutlined />}
                  onPressEnter={analyzeWebsite}
                />
              </Form.Item>
              <Form.Item>
                <Button 
                  type="primary" 
                  size="large" 
                  onClick={analyzeWebsite}
                  style={{ backgroundColor: '#6B8CAE', borderColor: '#6B8CAE' }}
                  icon={<ScanOutlined />}
                >
                  Analyze Website
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
        
        {currentStep >= 1 && (
          <>
            <Progress 
              percent={progressPercent} 
              status="active" 
              strokeColor="#6B8CAE"
              style={{ margin: '20px 0' }}
            />
          </>
        )}
      </div>

      {/* Current Step Indicator - Only show after analysis starts */}
      {currentStep >= 1 && (
        <div style={{ marginBottom: window.innerWidth <= 767 ? '15px' : '30px' }}>
          {window.innerWidth <= 767 ? (
            // Mobile: Show only current step
            <div style={{ 
              textAlign: 'center',
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                {currentStep < steps.length ? steps[currentStep].icon : <CheckOutlined />}
                <Text strong style={{ marginLeft: '8px', fontSize: '14px' }}>
                  Step {currentStep + 1} of {steps.length}
                </Text>
              </div>
              <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {steps[currentStep]?.title}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {steps[currentStep]?.description}
              </Text>
            </div>
          ) : (
            // Desktop: Show full horizontal steps
            <Steps
              current={currentStep}
              size="small"
              items={steps.map((step, index) => {
                const isLocked = step.requiresLogin && !userAccount;
                
                return {
                  title: (
                    <span>
                      {step.title}
                      {isLocked && <Text style={{ color: '#ff4d4f', fontSize: '11px', display: 'block' }}>
                        Account Required
                      </Text>}
                    </span>
                  ),
                  icon: index < currentStep ? <CheckOutlined /> : (isLocked ? <LockOutlined style={{ opacity: 0.6 }} /> : step.icon),
                  status: index < currentStep ? 'finish' : index === currentStep ? 'process' : (isLocked ? 'error' : 'wait')
                };
              })}
              style={{ marginBottom: '20px' }}
            />
          )}
        </div>
      )}

      {/* Step Content */}
      {currentStep >= 1 && (
        <div data-step="1">
          <Card style={{ marginBottom: '20px' }}>
            {!analysisCompleted && (
              <Title level={3} style={{ textAlign: 'center', marginBottom: '20px' }}>
                🔍 Analyzing {websiteUrl}
              </Title>
            )}
            
            {analysisCompleted && (
              <Title level={3} style={{ textAlign: 'center', marginBottom: '20px' }}>
                About {stepResults.websiteAnalysis.businessName}
              </Title>
            )}
            
            {!analysisCompleted && currentStep === 1 && (
              <div style={{ textAlign: 'center' }}>
                <Spin size="large" />
                <div style={{ marginTop: '20px' }}>
                  <Paragraph style={{ fontSize: '16px', color: '#666' }}>
                    {scanningMessage}
                  </Paragraph>
                  <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <Text strong>Website: </Text>
                    <Text code>{websiteUrl}</Text>
                  </div>
                </div>
              </div>
            )}

            {analysisCompleted && (
              <div>
                {/* Business Overview - using existing renderBusinessOverview component */}
                {renderBusinessOverview()}
                
                {currentStep === 1 && (
                  <div style={{ textAlign: 'center', marginTop: '30px' }}>
                    <Button 
                      type="primary" 
                      size="large"
                      onClick={() => setCurrentStep(2)}
                      style={{ backgroundColor: stepResults.websiteAnalysis.brandColors.primary, borderColor: stepResults.websiteAnalysis.brandColors.primary }}
                      icon={<SearchOutlined />}
                    >
                      Choose Strategy
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* NEW STEP 2: Customer Strategy Selection */}
      {currentStep >= 2 && (
        <div data-step="2">
          <Card style={{ marginBottom: '20px' }}>
            <Title level={3} style={{ textAlign: 'center', marginBottom: '20px' }}>
              🎯 Choose Your Target Strategy
            </Title>
            
            {currentStep >= 2 && (
              <div>
                <Paragraph style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
                  Based on your website analysis, here are the top customer strategies ranked by business opportunity. 
                  Select the audience you want to target with your content.
                </Paragraph>
                
                {webSearchInsights.researchQuality === 'enhanced' ? (
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '24px',
                    padding: '12px',
                    backgroundColor: '#f6ffed',
                    borderRadius: '6px',
                    border: '1px solid #b7eb8f'
                  }}>
                    <Text style={{ fontSize: '13px', color: '#389e0d' }}>
                      🎯 Strategies ranked using web search data: search volumes, competitive analysis, and conversion potential
                    </Text>
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '24px',
                    padding: '12px',
                    backgroundColor: '#fff7e6',
                    borderRadius: '6px',
                    border: '1px solid #ffd591'
                  }}>
                    <Text style={{ fontSize: '13px', color: '#d46b08' }}>
                      ⚠️ Enhanced ranking data not available - strategies shown in default order. Upgrade for search volume analysis and competitive intelligence.
                    </Text>
                  </div>
                )}
                
                {(() => {
                  const analysis = stepResults.websiteAnalysis;
                  const scenarios = analysis.scenarios || [];
                  
                  if (scenarios.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                        <DatabaseOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                        <Title level={4} style={{ color: '#999' }}>No Customer Strategies Found</Title>
                        <Text>Please re-run website analysis to generate customer strategies.</Text>
                      </div>
                    );
                  }
                  
                  // Sort scenarios by priority (1 = highest value) and show first 2 for free users
                  const sortedScenarios = scenarios.sort((a, b) => {
                    const aPriority = a.businessValue?.priority || 999;
                    const bPriority = b.businessValue?.priority || 999;
                    return aPriority - bPriority;
                  });
                  const displayScenarios = sortedScenarios.slice(0, 2);
                  
                  return (
                    <div>
                      <Row gutter={[16, 16]}>
                        {displayScenarios.map((scenario, index) => (
                          <Col key={index} xs={24} md={12}>
                            <Card
                              hoverable
                              style={{
                                border: selectedCustomerStrategy?.index === index ? `2px solid ${analysis.brandColors.primary}` : '1px solid #f0f0f0',
                                borderRadius: '12px',
                                minHeight: '300px',
                                cursor: 'pointer',
                                opacity: selectedCustomerStrategy && selectedCustomerStrategy.index !== index ? 0.5 : 1,
                                transition: 'all 0.3s ease'
                              }}
                              onClick={() => {
                                setSelectedCustomerStrategy({
                                  ...scenario,
                                  index: index
                                });
                              }}
                            >
                              <div style={{ marginBottom: '16px' }}>
                                <Tag color={analysis.brandColors.primary} style={{ marginBottom: '8px' }}>
                                  Strategy {index + 1}
                                </Tag>
                                {selectedCustomerStrategy?.index === index && (
                                  <CheckOutlined style={{ 
                                    float: 'right', 
                                    color: analysis.brandColors.primary, 
                                    fontSize: '16px' 
                                  }} />
                                )}
                              </div>
                              
                              <div style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <Title level={4} style={{ 
                                    margin: 0, 
                                    color: analysis.brandColors.primary,
                                    fontSize: '16px'
                                  }}>
                                    👥 Target Segment
                                  </Title>
                                  {scenario.businessValue?.priority === 1 && (
                                    <span style={{
                                      backgroundColor: '#ff4d4f',
                                      color: 'white',
                                      padding: '2px 8px',
                                      borderRadius: '10px',
                                      fontSize: '11px',
                                      fontWeight: 600
                                    }}>
                                      RECOMMENDED
                                    </span>
                                  )}
                                </div>
                                
                                {/* Enhanced target demographics */}
                                <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                                  {scenario.targetSegment?.demographics || analysis.decisionMakers || 'Target Audience'}
                                </div>
                                
                                {/* Show message when enhanced data is not available */}
                                {!scenario.targetSegment && !scenario.businessValue && (
                                  <div style={{ 
                                    fontSize: '11px', 
                                    color: '#d46b08',
                                    backgroundColor: '#fff7e6',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    marginBottom: '8px',
                                    border: '1px solid #ffd591'
                                  }}>
                                    ⚠️ Enhanced targeting data unavailable
                                  </div>
                                )}
                                
                                {/* Business value indicators */}
                                {scenario.businessValue ? (
                                  <div style={{ 
                                    display: 'flex', 
                                    flexWrap: 'wrap', 
                                    gap: '6px',
                                    marginBottom: '8px'
                                  }}>
                                    {scenario.businessValue.searchVolume && (
                                      <span style={{
                                        backgroundColor: '#f6ffed',
                                        color: '#389e0d',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        border: '1px solid #b7eb8f'
                                      }}>
                                        📊 {scenario.businessValue.searchVolume}
                                      </span>
                                    )}
                                    {scenario.businessValue.conversionPotential && (
                                      <span style={{
                                        backgroundColor: scenario.businessValue.conversionPotential === 'High' ? '#f6ffed' : '#fff7e6',
                                        color: scenario.businessValue.conversionPotential === 'High' ? '#389e0d' : '#d46b08',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        border: `1px solid ${scenario.businessValue.conversionPotential === 'High' ? '#b7eb8f' : '#ffd591'}`
                                      }}>
                                        💰 {scenario.businessValue.conversionPotential} Value
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{ 
                                    fontSize: '11px', 
                                    color: '#999',
                                    marginBottom: '8px'
                                  }}>
                                    📊 Business metrics unavailable - web search data not loaded
                                  </div>
                                )}
                                
                                {/* Psychographic details */}
                                {scenario.targetSegment?.psychographics && (
                                  <div style={{ 
                                    fontSize: '12px', 
                                    color: '#888',
                                    fontStyle: 'italic',
                                    lineHeight: '1.3'
                                  }}>
                                    {scenario.targetSegment.psychographics}
                                  </div>
                                )}
                              </div>
                              
                              <div style={{ marginBottom: '12px' }}>
                                <Text strong style={{ color: '#333', fontSize: '14px' }}>
                                  🔍 Customer Problem:
                                </Text>
                                <br />
                                <Text style={{ fontSize: '13px', lineHeight: '1.4' }}>
                                  {scenario.customerProblem}
                                </Text>
                              </div>
                              
                              {scenario.customerLanguage && scenario.customerLanguage.length > 0 && (
                                <div style={{ marginBottom: '12px' }}>
                                  <Text strong style={{ color: '#333', fontSize: '14px' }}>
                                    💬 How They Search:
                                  </Text>
                                  <div style={{ marginTop: '6px' }}>
                                    {scenario.customerLanguage.slice(0, 2).map((term, termIndex) => (
                                      <Tag 
                                        key={termIndex} 
                                        style={{ 
                                          fontSize: '11px', 
                                          borderRadius: '4px',
                                          marginBottom: '4px'
                                        }}
                                        color="blue"
                                      >
                                        "{term}"
                                      </Tag>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div>
                                <Text strong style={{ color: '#333', fontSize: '14px' }}>
                                  📈 Business Opportunity:
                                </Text>
                                <br />
                                <Text style={{ fontSize: '13px', lineHeight: '1.4', color: '#666' }}>
                                  {scenario.conversionPath || 'Educational blog post leading to consultation inquiries.'}
                                </Text>
                                
                                {/* Additional business metrics */}
                                {scenario.businessValue && (
                                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
                                    {scenario.businessValue.competition && (
                                      <div>Competition: {scenario.businessValue.competition}</div>
                                    )}
                                    {scenario.targetSegment?.searchBehavior && (
                                      <div>Search Pattern: {scenario.targetSegment.searchBehavior}</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                      
                      {/* See More Strategies Gate */}
                      {scenarios.length > 2 && (
                        <div style={{ 
                          textAlign: 'center', 
                          marginTop: '24px',
                          padding: '20px',
                          backgroundColor: '#f9f9f9',
                          borderRadius: '8px',
                          border: '2px dashed #d9d9d9'
                        }}>
                          <Text style={{ fontSize: '14px', color: '#666', marginBottom: '12px', display: 'block' }}>
                            💡 Want to see {scenarios.length - 2} more targeted strategies?
                          </Text>
                          <Button
                            type="primary"
                            onClick={() => {
                              if (demoMode) {
                                message.info('Demo mode: Showing all strategies');
                                // In demo mode, show all strategies
                              } else {
                                setShowMoreStrategiesGate(true);
                              }
                            }}
                            style={{
                              backgroundColor: analysis.brandColors.accent,
                              borderColor: analysis.brandColors.accent
                            }}
                            icon={<LockOutlined />}
                          >
                            See More Strategies
                          </Button>
                        </div>
                      )}
                      
                      {/* Continue Button */}
                      {selectedCustomerStrategy && (
                        <div style={{ textAlign: 'center', marginTop: '30px' }}>
                          <Button
                            type="primary"
                            size="large"
                            onClick={() => {
                              setStrategySelectionCompleted(true);
                              setCurrentStep(3);
                              scrollToNextSection(3);
                              // Auto-start topic generation based on selected strategy
                              setTimeout(() => {
                                loadTrendingTopics();
                              }, 500);
                            }}
                            style={{
                              backgroundColor: analysis.brandColors.primary,
                              borderColor: analysis.brandColors.primary
                            }}
                            icon={<BulbOutlined />}
                          >
                            Generate Content Ideas
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
            
          </Card>
        </div>
      )}

      {currentStep >= 3 && (
        <div data-step="3">
          <Card style={{ marginBottom: '20px' }}>
            <Title level={3} style={{ textAlign: 'center', marginBottom: '20px' }}>
              📊 Content Strategy
            </Title>
            
            {!strategyCompleted && currentStep === 3 ? (
              <div>
                <Paragraph style={{ textAlign: 'center', marginBottom: '30px', color: '#666' }}>
                  {selectedCustomerStrategy ? 
                    `Creating targeted blog post ideas for customers struggling with: "${selectedCustomerStrategy.customerProblem}"` :
                    `Based on your ${stepResults.websiteAnalysis.businessType ? stepResults.websiteAnalysis.businessType.toLowerCase() : 'business'} analysis, here are high-impact blog post ideas:`
                  }
                </Paragraph>
                
                {/* Rich topic card skeleton loading */}
                <Row gutter={window.innerWidth <= 767 ? [8, 8] : [16, 16]}>
                  {[1, 2].map((index) => (
                    <Col key={index} xs={24} md={12} lg={12}>
                      <Card 
                        cover={
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
                              fontSize: '14px', 
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
                            <div style={{
                              width: '40px',
                              height: '4px',
                              backgroundColor: '#e0e0e0',
                              borderRadius: '2px',
                              overflow: 'hidden',
                              marginTop: '12px'
                            }}>
                              <div style={{
                                width: '100%',
                                height: '100%',
                                backgroundColor: '#1890ff',
                                borderRadius: '2px',
                                animation: 'progress 2s ease-in-out infinite'
                              }}></div>
                            </div>
                          </div>
                        }
                        style={{ 
                          border: '1px solid #f0f0f0',
                          margin: '8px 0',
                          minHeight: '300px'
                        }}
                      >
                        <div style={{ padding: '16px', minHeight: '120px' }}>
                          {/* Tags skeleton */}
                          <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                            <div style={{ 
                              width: '60px', 
                              height: '22px', 
                              backgroundColor: '#f5f5f5', 
                              borderRadius: '4px', 
                              animation: 'pulse 1.5s ease-in-out infinite' 
                            }}></div>
                            <div style={{ 
                              width: '80px', 
                              height: '22px', 
                              backgroundColor: '#f5f5f5', 
                              borderRadius: '4px', 
                              animation: 'pulse 1.5s ease-in-out infinite' 
                            }}></div>
                          </div>
                          {/* Title skeleton */}
                          <div style={{ 
                            height: '24px', 
                            backgroundColor: '#f5f5f5', 
                            borderRadius: '4px', 
                            marginBottom: '8px', 
                            animation: 'pulse 1.5s ease-in-out infinite' 
                          }}></div>
                          <div style={{ 
                            height: '24px', 
                            backgroundColor: '#f5f5f5', 
                            borderRadius: '4px', 
                            marginBottom: '12px', 
                            width: '80%',
                            animation: 'pulse 1.5s ease-in-out infinite' 
                          }}></div>
                          {/* Description skeleton */}
                          <div style={{ 
                            height: '16px', 
                            backgroundColor: '#f5f5f5', 
                            borderRadius: '4px', 
                            marginBottom: '6px',
                            animation: 'pulse 1.5s ease-in-out infinite' 
                          }}></div>
                          <div style={{ 
                            height: '16px', 
                            backgroundColor: '#f5f5f5', 
                            borderRadius: '4px', 
                            width: '90%',
                            animation: 'pulse 1.5s ease-in-out infinite' 
                          }}></div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>

                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                  <Button onClick={resetDemo} icon={<ReloadOutlined />}>
                    Start Over
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <Paragraph style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
                  Based on your {stepResults.websiteAnalysis.businessType ? stepResults.websiteAnalysis.businessType.toLowerCase() : 'business'} analysis, here are high-impact blog post ideas:
                </Paragraph>
                
                {/* Keyword Research Insight */}
                {webSearchInsights.researchQuality === 'enhanced' && (
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '20px',
                    padding: '12px',
                    backgroundColor: '#f6ffed',
                    borderRadius: '6px',
                    border: '1px solid #b7eb8f'
                  }}>
                    <Text style={{ fontSize: '13px', color: '#389e0d' }}>
                      🎯 Topics enhanced with current market keyword research and competitive analysis
                    </Text>
                  </div>
                )}
                
                {webSearchInsights.researchQuality === 'basic' && (
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '20px',
                    padding: '12px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '6px',
                    border: '1px solid #d9d9d9'
                  }}>
                    <Text style={{ fontSize: '13px', color: '#666' }}>
                      💡 Upgrade for keyword research and trending topic insights
                    </Text>
                  </div>
                )}
                
                {/* Show topic cards with lead generation */}
                {(() => {
                  const analysis = stepResults.websiteAnalysis;
                  const availableTopics = stepResults.trendingTopics || [];
                  
                  // Check if web search enhancement is still in progress
                  const hasWebSearchData = analysis.scenarios && analysis.scenarios.length > 0 && 
                    analysis.scenarios[0].businessValue && analysis.scenarios[0].targetSegment;
                  
                  const webSearchStillLoading = availableTopics.length > 0 && !hasWebSearchData;
                  
                  // Show topics with appropriate loading states - enhanced topics if available, or basic topics with loading indicators
                  const enhancedTopics = availableTopics.map((topic, index) => {
                    const scenarioData = analysis.scenarios && analysis.scenarios[index] ? analysis.scenarios[index] : null;
                    const isWaitingForWebSearch = webSearchStillLoading && !scenarioData;
                    return {
                      ...topic,
                      scenario: scenarioData,
                      webSearchLoading: isWaitingForWebSearch,
                      isContentLoading: isWaitingForWebSearch || topic.isContentLoading, // Keep content loading until web search completes
                      isImageLoading: isWaitingForWebSearch || topic.isImageLoading // Keep image loading until web search completes
                    };
                  });

                  if (enhancedTopics.length === 0) {
                    return (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '60px 20px',
                        color: '#666'
                      }}>
                        <DatabaseOutlined style={{ 
                          fontSize: '48px', 
                          color: '#d9d9d9', 
                          marginBottom: '16px',
                          display: 'block'
                        }} />
                        <Title level={4} style={{ color: '#999', margin: '0 0 8px 0' }}>
                          No Content Ideas Available
                        </Title>
                        <Text style={{ color: '#666' }}>
                          No AI-generated topic suggestions found. Please try analyzing your website again.
                        </Text>
                      </div>
                    );
                  }

                  return (
                    <div>
                      {/* Web Search Enhancement Indicator */}
                      {webSearchStillLoading && (
                        <div style={{
                          textAlign: 'center',
                          marginBottom: '20px',
                          padding: '12px',
                          backgroundColor: '#e6f7ff',
                          borderRadius: '6px',
                          border: '1px solid #91d5ff'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <div style={{ 
                              fontSize: '16px',
                              animation: 'pulse 1.5s ease-in-out infinite'
                            }}>
                              🔍
                            </div>
                            <Text style={{ fontSize: '13px', color: '#1890ff', fontWeight: 500 }}>
                              Enhancing topics with web search data...
                            </Text>
                          </div>
                          <Text style={{ fontSize: '11px', color: '#666', marginTop: '4px', display: 'block' }}>
                            Analyzing search volumes, competitive intelligence, and customer insights
                          </Text>
                        </div>
                      )}
                      
                      <Row gutter={window.innerWidth <= 767 ? [8, 8] : [16, 16]}>
                        {/* Only show first 2 topics for lead generation */}
                        {enhancedTopics.slice(0, 2).map((topic) => (
                          <Col key={topic.id} xs={24} md={12} lg={12}>
                            <Card 
                              hoverable
                              cover={
                                topic.isImageLoading ? (
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
                                      fontSize: '14px', 
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
                                    <div style={{
                                      width: '40px',
                                      height: '4px',
                                      backgroundColor: '#e0e0e0',
                                      borderRadius: '2px',
                                      overflow: 'hidden',
                                      marginTop: '12px'
                                    }}>
                                      <div style={{
                                        width: '100%',
                                        height: '100%',
                                        backgroundColor: '#1890ff',
                                        borderRadius: '2px',
                                        animation: 'progress 2s ease-in-out infinite'
                                      }}></div>
                                    </div>
                                  </div>
                                ) : (
                                  <img 
                                    alt={topic.title} 
                                    src={topic.image} 
                                    style={{ height: '200px', objectFit: 'cover' }}
                                  />
                                )
                              }
                              style={{ 
                                border: selectedTopic === topic.id ? `2px solid ${analysis.brandColors.primary}` : '1px solid #f0f0f0',
                                margin: '8px 0',
                                opacity: topic.isContentLoading ? 0.8 : 1,
                                minHeight: '300px'
                              }}
                            >
                              {topic.isContentLoading ? (
                                <div style={{ padding: '16px', minHeight: '120px' }}>
                                  {/* Loading skeleton content */}
                                  <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                                    <div style={{ 
                                      width: '60px', 
                                      height: '22px', 
                                      backgroundColor: '#f5f5f5', 
                                      borderRadius: '4px', 
                                      animation: 'pulse 1.5s ease-in-out infinite' 
                                    }}></div>
                                    <div style={{ 
                                      width: '80px', 
                                      height: '22px', 
                                      backgroundColor: '#f5f5f5', 
                                      borderRadius: '4px', 
                                      animation: 'pulse 1.5s ease-in-out infinite' 
                                    }}></div>
                                  </div>
                                  <div style={{ 
                                    height: '24px', 
                                    backgroundColor: '#f5f5f5', 
                                    borderRadius: '4px', 
                                    marginBottom: '8px', 
                                    animation: 'pulse 1.5s ease-in-out infinite' 
                                  }}></div>
                                  <div style={{ 
                                    height: '24px', 
                                    backgroundColor: '#f5f5f5', 
                                    borderRadius: '4px', 
                                    marginBottom: '12px', 
                                    width: '80%',
                                    animation: 'pulse 1.5s ease-in-out infinite' 
                                  }}></div>
                                  <div style={{ 
                                    height: '16px', 
                                    backgroundColor: '#f5f5f5', 
                                    borderRadius: '4px', 
                                    marginBottom: '6px',
                                    animation: 'pulse 1.5s ease-in-out infinite' 
                                  }}></div>
                                  <div style={{ 
                                    height: '16px', 
                                    backgroundColor: '#f5f5f5', 
                                    borderRadius: '4px', 
                                    width: '90%',
                                    animation: 'pulse 1.5s ease-in-out infinite' 
                                  }}></div>
                                </div>
                              ) : (
                                <>
                                  <div style={{ marginBottom: '12px' }}>
                                    <Tag color="blue">{topic.category}</Tag>
                                    <Tag color="purple">{contentStrategy.goal}</Tag>
                                    <Tag color="orange">{contentStrategy.voice}</Tag>
                                    <Tag color="cyan">{contentStrategy.template}</Tag>
                                    <Tag color="green">{contentStrategy.length}</Tag>
                                  </div>
                                  <Title level={4} style={{ marginBottom: '8px', fontSize: '16px' }}>
                                    {topic.title}
                                  </Title>
                                  <Paragraph style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>
                                    {topic.subheader}
                                  </Paragraph>
                                  
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
                                  
                                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                    <Button
                                      type="primary"
                                      size="large"
                                      onClick={() => generateContent(topic.id)}
                                      loading={isLoading && selectedTopic === topic.id}
                                      style={{
                                        backgroundColor: analysis.brandColors.primary,
                                        borderColor: analysis.brandColors.primary,
                                        width: '100%',
                                        marginBottom: '12px'
                                      }}
                                    >
                                      Get One Free Post
                                    </Button>
                                    
                                    <Button
                                      size="large"
                                      onClick={() => setShowMoreStrategiesGate(true)}
                                      style={{
                                        width: '100%',
                                        marginTop: '8px',
                                        borderColor: analysis.brandColors.primary,
                                        color: analysis.brandColors.primary
                                      }}
                                    >
                                      Edit Strategy
                                    </Button>
                                    
                                    {/* Horizontal Divider */}
                                    <Divider style={{ margin: '20px 0 16px 0' }} />
                                    
                                    {/* Blog Post Blueprint */}
                                    <div style={{ 
                                      padding: '16px',
                                      backgroundColor: analysis.brandColors.secondary + '20',
                                      borderRadius: '8px',
                                      border: `1px solid ${analysis.brandColors.secondary}60`
                                    }}>
                                      <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                                        <Text strong style={{ 
                                          color: analysis.brandColors.primary, 
                                          fontSize: '16px',
                                          display: 'block',
                                          marginBottom: '4px'
                                        }}>
                                          📋 What You'll Get
                                        </Text>
                                        <Text style={{ fontSize: '12px', color: '#666' }}>
                                          Your blog post will include all these strategic elements
                                        </Text>
                                      </div>

                                      {/* Content Framework */}
                                      <div style={{ marginBottom: '12px' }}>
                                        <Text strong style={{ color: analysis.brandColors.primary, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                                          📝 Content Structure
                                        </Text>
                                        <Text style={{ fontSize: '12px', color: '#666' }}>
                                          {contentStrategy.template === 'problem-solution' ? 'Problem identification → Solution framework → Implementation guidance' : 
                                           contentStrategy.template === 'how-to' ? 'Step-by-step guide with actionable instructions' :
                                           contentStrategy.template === 'listicle' ? 'Organized list format with detailed explanations' :
                                           contentStrategy.template === 'case-study' ? 'Real-world example with analysis and takeaways' :
                                           'Comprehensive deep-dive with multiple perspectives'}
                                        </Text>
                                      </div>

                                      {/* Target Keywords */}
                                      {topic.scenario && topic.scenario.seoKeywords && topic.scenario.seoKeywords.length > 0 && (
                                        <div style={{ marginBottom: '12px' }}>
                                          <Text strong style={{ color: analysis.brandColors.primary, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                                            🔑 SEO Keywords Integrated
                                          </Text>
                                          <Space wrap size="small">
                                            {topic.scenario.seoKeywords.slice(0, 3).map((keyword, keywordIndex) => (
                                              <Tag 
                                                key={keywordIndex}
                                                color={analysis.brandColors.primary}
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
                                        <Text strong style={{ color: analysis.brandColors.primary, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                                          🎯 Competitive Edge
                                        </Text>
                                        <Text style={{ fontSize: '12px', color: '#666' }}>
                                          {selectedCustomerStrategy === 'acquisition' ? 'Positions you as the preferred choice for new customers seeking solutions' :
                                           selectedCustomerStrategy === 'retention' ? 'Builds deeper relationships with existing customers' :
                                           'Establishes thought leadership with unique insights and fresh perspectives'}
                                        </Text>
                                      </div>

                                      {/* Strategic CTAs */}
                                      <div style={{ marginBottom: '12px' }}>
                                        <Text strong style={{ color: analysis.brandColors.primary, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                                          🚀 Conversion Elements
                                        </Text>
                                        <Text style={{ fontSize: '12px', color: '#666' }}>
                                          {analysis.websiteGoals 
                                            ? `Strategic CTAs driving toward: ${analysis.websiteGoals.toLowerCase()}`
                                            : `CTAs aligned with your primary business objectives and customer journey`
                                          }
                                        </Text>
                                      </div>

                                      {/* Content Quality */}
                                      <div style={{ marginBottom: '0' }}>
                                        <Text strong style={{ color: analysis.brandColors.primary, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                                          ✨ Content Quality
                                        </Text>
                                        <Text style={{ fontSize: '12px', color: '#666' }}>
                                          {contentStrategy.length === 'deep' ? '1500+ words of comprehensive, in-depth analysis' :
                                           contentStrategy.length === 'standard' ? '1000-1500 words with balanced depth and readability' :
                                           '800-1000 words focused on quick, actionable insights'} • 
                                          {contentStrategy.voice === 'expert' ? ' Expert authority tone' :
                                           contentStrategy.voice === 'friendly' ? ' Approachable, conversational tone' :
                                           contentStrategy.voice === 'insider' ? ' Industry insider perspective' :
                                           ' Engaging storytelling approach'}
                                        </Text>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                            </Card>
                          </Col>
                        ))}
                      </Row>

                      {/* Lead Generation: See More Ideas CTA - Show if we have any topics (for demo) */}
                      {enhancedTopics.length >= 1 && (
                        <div style={{ 
                          marginTop: '32px', 
                          textAlign: 'center',
                          padding: '24px',
                          background: `linear-gradient(135deg, ${analysis.brandColors.accent}08, ${analysis.brandColors.primary}08)`,
                          borderRadius: '12px',
                          border: `2px dashed ${analysis.brandColors.accent}40`
                        }}>
                          <BulbOutlined style={{ 
                            fontSize: '32px', 
                            color: analysis.brandColors.accent, 
                            marginBottom: '12px',
                            display: 'block'
                          }} />
                          <Title level={4} style={{ 
                            margin: '0 0 8px 0', 
                            color: analysis.brandColors.primary 
                          }}>
                            Want More Content Ideas?
                          </Title>
                          <Text style={{ 
                            fontSize: '16px', 
                            color: '#666',
                            display: 'block',
                            marginBottom: '20px'
                          }}>
                            Get {enhancedTopics.length - 2} more strategic topic ideas with detailed customer psychology insights
                          </Text>
                          <Button 
                            size="large"
                            style={{
                              backgroundColor: analysis.brandColors.accent,
                              borderColor: analysis.brandColors.accent,
                              color: 'white',
                              borderRadius: '8px',
                              fontWeight: 600,
                              height: '48px',
                              padding: '0 32px',
                              fontSize: '16px'
                            }}
                            onClick={() => setShowSignupGate(true)}
                            icon={<LockOutlined />}
                          >
                            See More Ideas
                          </Button>
                        </div>
                      )}

                      <div style={{ textAlign: 'center', marginTop: '30px' }}>
                        <Button onClick={resetDemo} icon={<ReloadOutlined />}>
                          Start Over
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Removed duplicate "💡 Generating Ideas" section - content is now in "📊 Content Strategy" */}

      {currentStep === 5 && (
        <div data-step="5">
          <Card style={{ marginBottom: '20px' }}>
            <Title level={3} style={{ textAlign: 'center', marginBottom: '20px' }}>
              ✍️ Generating Your Blog Post
            </Title>
            
            {blogGenerating ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '20px' }}>
                  <Paragraph style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
                    Creating your personalized blog post with AI...
                  </Paragraph>
                  
                  {/* Blog post skeleton */}
                  <div style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ height: '32px', backgroundColor: '#f5f5f5', borderRadius: '4px', marginBottom: '16px', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
                    <div style={{ height: '20px', backgroundColor: '#f5f5f5', borderRadius: '4px', marginBottom: '20px', width: '60%', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
                    <div style={{ height: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px', marginBottom: '8px', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
                    <div style={{ height: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px', marginBottom: '8px', width: '90%', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
                    <div style={{ height: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px', marginBottom: '20px', width: '95%', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
                    <div style={{ height: '24px', backgroundColor: '#f5f5f5', borderRadius: '4px', marginBottom: '12px', width: '40%', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
                    <div style={{ height: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px', marginBottom: '8px', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
                    <div style={{ height: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px', marginBottom: '8px', width: '85%', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Title level={4} style={{ color: stepResults.websiteAnalysis.brandColors.primary, marginBottom: '20px' }}>
                  🎉 Your Blog Post is Ready!
                </Title>
                <Paragraph style={{ fontSize: '16px', marginBottom: '30px' }}>
                  Your AI-generated blog post is complete and ready for review in preview mode.
                </Paragraph>
                <div style={{ 
                  background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)', 
                  padding: '20px', 
                  borderRadius: '12px',
                  border: '1px solid #d6e7ff',
                  marginBottom: '20px'
                }}>
                  <Text style={{ fontSize: '14px', color: '#1890ff', fontWeight: 500 }}>
                    📝 Defaulted to Preview Mode for easy reading
                  </Text>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {(currentStep === 5 && !blogGenerating) && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <Title level={2} style={{ margin: 0, color: stepResults.websiteAnalysis.brandColors.primary }}>
                Edit Your Generated Content
              </Title>
              {webSearchInsights.researchQuality === 'enhanced' && (
                <div style={{ marginTop: '8px' }}>
                  <span style={{
                    backgroundColor: '#f6ffed',
                    color: '#389e0d',
                    border: '1px solid #b7eb8f',
                    borderRadius: '12px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    fontWeight: 500
                  }}>
                    🔍 Enhanced with Web Research
                  </span>
                </div>
              )}
            </div>
            <Space>
              <Button 
                icon={<EyeOutlined />} 
                onClick={() => setPreviewMode(!previewMode)}
                type={previewMode ? 'primary' : 'default'}
                style={previewMode ? {
                  backgroundColor: stepResults.websiteAnalysis.brandColors.primary,
                  borderColor: stepResults.websiteAnalysis.brandColors.primary
                } : {}}
              >
                {previewMode ? 'Edit Mode' : 'Preview Mode'}
              </Button>
            </Space>
          </div>

          {!userAccount && (
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '20px', 
              padding: '20px', 
              backgroundColor: '#f6ffed', 
              border: '1px solid #b7eb8f',
              borderRadius: '8px'
            }}>
              <EditOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '12px' }} />
              <Title level={4} style={{ marginBottom: '8px' }}>
                Create Account to Edit & Publish
              </Title>
              <Text>
                Your content is ready! Create a free account to edit, customize, and publish directly to your website.
              </Text>
              <br />
              <div style={{ margin: '16px 0' }}>
                <Tag color="blue">Edit Content</Tag>
                <Tag color="green">Direct Publishing</Tag>
                <Tag color="purple">Save Templates</Tag>
                <Tag color="orange">Analytics</Tag>
              </div>
              <Button 
                type="primary" 
                size="large"
                style={{ marginTop: '8px' }}
                onClick={() => setShowSignupGate(true)}
              >
                Create Free Account
              </Button>
            </div>
          )}

          <Card style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: stepResults.websiteAnalysis.brandColors.secondary + '40', borderRadius: '6px' }}>
              <Text strong style={{ color: stepResults.websiteAnalysis.brandColors.primary }}>
                Content styled with your brand colors:
              </Text>
              <Space style={{ marginLeft: '12px' }}>
                <div style={{ 
                  display: 'inline-block', 
                  width: '16px', 
                  height: '16px', 
                  backgroundColor: stepResults.websiteAnalysis.brandColors.primary,
                  borderRadius: '2px' 
                }} />
                <div style={{ 
                  display: 'inline-block', 
                  width: '16px', 
                  height: '16px', 
                  backgroundColor: stepResults.websiteAnalysis.brandColors.secondary,
                  borderRadius: '2px' 
                }} />
                <div style={{ 
                  display: 'inline-block', 
                  width: '16px', 
                  height: '16px', 
                  backgroundColor: stepResults.websiteAnalysis.brandColors.accent,
                  borderRadius: '2px' 
                }} />
              </Space>
            </div>

            {/* Content Strategy Panel */}
            {canEditPost() && (
              <div style={{ 
                marginBottom: '20px',
                border: `2px solid ${previewMode ? '#e8e8e8' : stepResults.websiteAnalysis.brandColors.primary}`,
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  backgroundColor: previewMode ? '#fafafa' : stepResults.websiteAnalysis.brandColors.primary + '10',
                  padding: '16px',
                  borderBottom: '1px solid #e8e8e8'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text strong style={{ 
                      fontSize: '16px',
                      color: previewMode ? '#666' : stepResults.websiteAnalysis.brandColors.primary 
                    }}>
                      📋 Blog Post Guidelines
                    </Text>
                    {demoMode && (
                      <div style={{ 
                        backgroundColor: '#ff4500', 
                        color: 'white', 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px', 
                        fontWeight: 'bold' 
                      }}>
                        DEMO MODE
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ padding: '16px' }}>
                  {previewMode ? (
                    // Preview Mode: Show strategy but not editable (teaser)
                    <div>
                      <Row gutter={[16, 8]}>
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
                      <div style={{ 
                        marginTop: '16px', 
                        padding: '12px', 
                        backgroundColor: '#f0f8ff', 
                        borderRadius: '6px',
                        textAlign: 'center'
                      }}>
                        <Text style={{ fontSize: '14px', color: '#1890ff' }}>
                          💡 Want to optimize for conversion or try a different approach?
                        </Text>
                        <br />
                        <Text style={{ fontSize: '13px', color: '#666' }}>
                          Switch to Edit Mode to customize your content strategy ↗
                        </Text>
                      </div>
                    </div>
                  ) : (
                    // Edit Mode: Interactive controls
                    <div>
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
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
                        <Col span={12}>
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
                        <Col span={12}>
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
                        <Col span={12}>
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
                      
                      {/* Custom Feedback Section */}
                      <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e8e8e8' }}>
                        <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                          Additional Instructions
                        </Text>
                        <TextArea
                          value={customFeedback}
                          onChange={(e) => setCustomFeedback(e.target.value)}
                          placeholder="Provide specific feedback to improve the blog post (e.g., 'Add more statistics', 'Make it more conversational', 'Include specific examples about X')..."
                          rows={4}
                          style={{ marginBottom: '16px' }}
                          disabled={postState === 'exported'}
                        />
                        
                        {/* Regenerate Button */}
                        <div style={{ textAlign: 'center' }}>
                          <Button
                            type="primary"
                            size="large"
                            loading={isLoading || blogGenerating}
                            onClick={regenerateWithFeedback}
                            disabled={postState === 'exported'}
                            style={{
                              backgroundColor: stepResults.websiteAnalysis.brandColors.primary,
                              borderColor: stepResults.websiteAnalysis.brandColors.primary,
                              minWidth: '150px'
                            }}
                          >
                            {isLoading || blogGenerating ? 'Regenerating...' : 'Regenerate'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Post Status Banner for Exported Posts */}
            {postState === 'exported' && (
              <div style={{ 
                marginBottom: '20px',
                padding: '16px',
                backgroundColor: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <CheckOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                  <Text strong style={{ color: '#52c41a' }}>Content Successfully Exported</Text>
                </div>
                <Text style={{ fontSize: '14px', color: '#666' }}>
                  This post has been exported and is now locked. To make changes, please generate a new post.
                </Text>
                <div style={{ marginTop: '12px' }}>
                  <Text strong style={{ fontSize: '13px', color: '#389e0d' }}>Final Strategy: </Text>
                  <Text style={{ fontSize: '13px' }}>
                    {getStrategyDisplayText('goal', contentStrategy.goal)} | {getStrategyDisplayText('voice', contentStrategy.voice)} | {getStrategyDisplayText('template', contentStrategy.template)}
                  </Text>
                </div>
              </div>
            )}

            {previewMode ? (
              <div style={{ minHeight: '600px' }}>
                <Title level={4} style={{ marginBottom: '16px', color: stepResults.websiteAnalysis.brandColors.primary }}>
                  Styled Preview
                </Title>
                {renderStyledContent(generatedContent)}
              </div>
            ) : (
              <div>
                <Title level={4} style={{ marginBottom: '16px' }}>Edit Content</Title>
                <TextArea
                  value={generatedContent}
                  onChange={handleContentChange}
                  rows={25}
                  style={{ fontFamily: 'monospace', fontSize: '14px' }}
                  placeholder="Your generated content will appear here..."
                />
              </div>
            )}
            
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Button 
                type="primary" 
                size="large" 
                onClick={() => {
                  if (postState === 'exported') {
                    message.warning('This post has already been exported and is locked.');
                    return;
                  }
                  setShowExportWarning(true);
                }}
                disabled={postState === 'exported'}
                style={{ 
                  backgroundColor: stepResults.websiteAnalysis.brandColors.primary, 
                  borderColor: stepResults.websiteAnalysis.brandColors.primary 
                }}
              >
                {postState === 'exported' ? 'Post Exported & Locked' : 'Download Your Content'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {currentStep === 6 && (
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
                <Space size="small">
                  {Object.entries(stepResults.websiteAnalysis.brandColors).map(([key, color]) => (
                    <div key={key} style={{
                      display: 'inline-block',
                      width: '20px',
                      height: '20px',
                      backgroundColor: color,
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }} title={`${key}: ${color}`} />
                  ))}
                </Space>
                <br />
                <Text style={{ fontSize: '12px', marginTop: '4px' }}>
                  Styled with your brand
                </Text>
              </Col>
            </Row>
          </Card>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <Space size="large">
              <Button onClick={resetDemo} icon={<ReloadOutlined />}>
                Generate Another Post
              </Button>
              <Button onClick={() => setCurrentStep(5)} icon={<EditOutlined />}>
                Back to Edit Content
              </Button>
            </Space>
          </div>
        </div>
      )}

      {/* Website Analysis Edit Modal */}
      <Modal
        title="Edit Website Analysis Results"
        open={editingStep === 1}
        onOk={() => {
          // Save changes logic will be handled by form
        }}
        onCancel={cancelEdit}
        width={800}
        footer={null}
      >
        {editingStep === 1 && (
          <Form
            layout="vertical"
            initialValues={stepResults.websiteAnalysis}
            onFinish={(values) => saveStepResults(1, { websiteAnalysis: { ...values } })}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Business Name"
                  name="businessName"
                  rules={[{ required: true, message: 'Business name is required' }]}
                >
                  <Input placeholder="Enter business name" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Business Type"
                  name="businessType"
                  rules={[{ required: true, message: 'Business type is required' }]}
                >
                  <Select>
                    <Select.Option value="Child Wellness & Parenting">Child Wellness & Parenting</Select.Option>
                    <Select.Option value="E-commerce">E-commerce</Select.Option>
                    <Select.Option value="SaaS Technology">SaaS Technology</Select.Option>
                    <Select.Option value="Healthcare">Healthcare</Select.Option>
                    <Select.Option value="Education">Education</Select.Option>
                    <Select.Option value="Professional Services">Professional Services</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  label="Target Audience"
                  name="targetAudience"
                  rules={[{ required: true, message: 'Target audience is required' }]}
                >
                  <TextArea rows={2} placeholder="Describe your target audience" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  label="Content Focus"
                  name="contentFocus"
                  rules={[{ required: true, message: 'Content focus is required' }]}
                >
                  <TextArea rows={2} placeholder="Main topics and themes for content" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  label="Brand Voice"
                  name="brandVoice"
                  rules={[{ required: true, message: 'Brand voice is required' }]}
                >
                  <Input placeholder="Describe your brand voice and tone" />
                </Form.Item>
              </Col>
              
              <Divider>Brand Colors</Divider>
              
              <Col xs={24} md={8}>
                <Form.Item
                  label="Primary Color"
                  name={['brandColors', 'primary']}
                  rules={[{ required: true, message: 'Primary color is required' }]}
                >
                  <Input placeholder="#6B8CAE" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="Secondary Color"
                  name={['brandColors', 'secondary']}
                  rules={[{ required: true, message: 'Secondary color is required' }]}
                >
                  <Input placeholder="#F4E5D3" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="Accent Color"
                  name={['brandColors', 'accent']}
                  rules={[{ required: true, message: 'Accent color is required' }]}
                >
                  <Input placeholder="#8FBC8F" />
                </Form.Item>
              </Col>
              
              <Col xs={24}>
                <Form.Item
                  label="Analysis Summary"
                  name="description"
                >
                  <TextArea rows={4} placeholder="Brief description of the website analysis..." />
                </Form.Item>
              </Col>
            </Row>
            
            <div style={{ textAlign: 'right', marginTop: '20px' }}>
              <Space>
                <Button onClick={cancelEdit}>Cancel</Button>
                <Button type="primary" htmlType="submit">
                  Save Changes
                </Button>
              </Space>
            </div>
          </Form>
        )}
      </Modal>


      {/* Email Gate Modal */}
      <Modal
        title="Unlock Your Content Strategy"
        open={showEmailGate}
        onCancel={() => setShowEmailGate(false)}
        footer={null}
        width={500}
        centered
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <BulbOutlined style={{ fontSize: '48px', color: '#6B8CAE', marginBottom: '16px' }} />
          <Title level={3}>See Your Custom Content Ideas</Title>
          <Paragraph>
            Get personalized content strategies and your first AI-generated blog post free.
          </Paragraph>
          <div style={{ backgroundColor: '#f6f8fa', padding: '16px', borderRadius: '8px', margin: '16px 0' }}>
            <Text strong>What you'll unlock:</Text>
            <ul style={{ textAlign: 'left', marginTop: '8px', marginBottom: '0' }}>
              <li>Custom content ideas for your business</li>
              <li>AI-generated blog post with your brand voice</li>
              <li>Visual themes and image suggestions</li>
              <li>CMS integration setup guide</li>
            </ul>
          </div>
        </div>
        
        <Form form={emailForm} onFinish={handleEmailSubmit} layout="vertical">
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input 
              placeholder="Enter your email address" 
              size="large"
              prefix={<GlobalOutlined />}
            />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              block
              style={{ marginBottom: '12px' }}
            >
              Get My Content Strategy Free
            </Button>
            <Button 
              type="text" 
              onClick={skipForDemo}
              block
              style={{ color: '#8c8c8c' }}
            >
              Skip for Demo (Development Only)
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Signup Gate Modal */}
      <Modal
        title="Unlock All Content Ideas"
        open={showSignupGate}
        onCancel={() => setShowSignupGate(false)}
        footer={null}
        width={500}
        centered
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <BulbOutlined style={{ fontSize: '48px', color: '#6B8CAE', marginBottom: '16px' }} />
          <Title level={3}>Get Your Complete Content Strategy</Title>
          <Paragraph>
            Create a free account to unlock <Text strong>all content ideas</Text> with detailed customer psychology insights and strategic guidance.
          </Paragraph>
          <div style={{ backgroundColor: '#f0f8ff', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #d6e7ff' }}>
            <Text strong style={{ color: '#1890ff' }}>🎉 What you'll get with your free account:</Text>
            <ul style={{ textAlign: 'left', marginTop: '8px', marginBottom: '0' }}>
              <li>All content topics with customer psychology analysis</li>
              <li>Complete strategic breakdown for each topic</li>
              <li>Generate unlimited blog posts</li>
              <li>Full editing and customization tools</li>
              <li>Multiple download formats (HTML, Markdown, etc.)</li>
            </ul>
          </div>
        </div>
        
        <Form form={signupForm} onFinish={handleSignupSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter your name' }]}
          >
            <Input placeholder="Enter your full name" size="large" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input 
              placeholder="Enter your email address" 
              size="large"
              prefix={<GlobalOutlined />}
            />
          </Form.Item>
          
          <Form.Item
            name="company"
            label="Company (Optional)"
          >
            <Input placeholder="Enter your company name" size="large" />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              block
              style={{ marginBottom: '12px' }}
            >
              Unlock All Content Ideas
            </Button>
            <Button 
              type="text" 
              onClick={skipForDemo}
              block
              style={{ color: '#8c8c8c' }}
            >
              Skip for Demo (Development Only)
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Export Warning Modal */}
      <Modal
        title="⚠️ Export & Lock Content"
        open={showExportWarning}
        onCancel={() => setShowExportWarning(false)}
        footer={null}
        width={500}
        centered
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ 
            backgroundColor: '#fff2e8', 
            padding: '20px', 
            borderRadius: '12px', 
            margin: '16px 0', 
            border: '1px solid #ffccc7' 
          }}>
            <Text strong style={{ color: '#fa541c', fontSize: '16px' }}>
              ⚠️ Important: Once exported, this post will be permanently locked
            </Text>
            <div style={{ marginTop: '12px', textAlign: 'left' }}>
              <Text style={{ fontSize: '14px' }}>
                <strong>Current Strategy:</strong><br/>
                Goal: {getStrategyDisplayText('goal', contentStrategy.goal)} <br/>
                Voice: {getStrategyDisplayText('voice', contentStrategy.voice)} <br/>
                Template: {getStrategyDisplayText('template', contentStrategy.template)}
              </Text>
            </div>
          </div>
          
          <Paragraph>
            After export, you <Text strong>cannot make any further edits</Text> to this blog post. 
            To create variations or make changes, you'll need to generate a new post.
          </Paragraph>
          
          <div style={{ backgroundColor: '#f6ffed', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #b7eb8f' }}>
            <Text strong style={{ color: '#52c41a' }}>✅ You'll be able to download in these formats:</Text>
            <ul style={{ textAlign: 'left', marginTop: '8px', marginBottom: '0' }}>
              <li>Markdown (.md) - Perfect for Jekyll, Hugo, GitHub Pages</li>
              <li>HTML (.html) - Copy-paste ready for any CMS</li>
              <li>JSON (.json) - For developers and API integrations</li>
            </ul>
          </div>
        </div>
        
        <Row gutter={16}>
          <Col span={12}>
            <Button 
              size="large" 
              block
              onClick={() => setShowExportWarning(false)}
              style={{ marginBottom: '12px' }}
            >
              ← Back to Editing
            </Button>
          </Col>
          <Col span={12}>
            <Button 
              type="primary" 
              size="large" 
              block
              style={{ 
                backgroundColor: '#fa541c',
                borderColor: '#fa541c',
                marginBottom: '12px'
              }}
              onClick={() => {
                setShowExportWarning(false);
                setCurrentStep(6);
              }}
            >
              Continue to Export
            </Button>
          </Col>
        </Row>
      </Modal>

      {/* See More Strategies Gate Modal */}
      <Modal
        title="🎯 Unlock All Customer Strategies"
        open={showMoreStrategiesGate}
        onCancel={() => setShowMoreStrategiesGate(false)}
        footer={null}
        width={600}
        centered
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ 
            backgroundColor: '#fff7e6', 
            padding: '20px', 
            borderRadius: '12px', 
            margin: '16px 0', 
            border: '1px solid #ffd591' 
          }}>
            <Text strong style={{ color: '#fa8c16', fontSize: '16px' }}>
              💡 Unlock {(stepResults.websiteAnalysis.scenarios?.length || 5) - 2} More Targeted Strategies
            </Text>
            <div style={{ marginTop: '12px', textAlign: 'left' }}>
              <Text style={{ fontSize: '14px' }}>
                Access all customer psychology insights and target multiple audience segments
                with strategic content that converts.
              </Text>
            </div>
          </div>
          
          <Title level={3} style={{ marginBottom: '8px' }}>
            Strategic Customer Targeting
          </Title>
          <Paragraph>
            Get access to all customer strategies, each with detailed psychology insights,
            search behavior analysis, and conversion optimization.
          </Paragraph>
          
          <div style={{ backgroundColor: '#f0f8ff', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #d6e7ff' }}>
            <Text strong style={{ color: '#1890ff' }}>✨ With All Customer Strategies:</Text>
            <ul style={{ textAlign: 'left', marginTop: '8px', marginBottom: '0' }}>
              <li><strong>Multiple Target Audiences:</strong> Access all customer segments from your analysis</li>
              <li><strong>Detailed Psychology Insights:</strong> Problems, search patterns, emotional triggers</li>
              <li><strong>A/B Testing Opportunities:</strong> Compare different audience strategies</li>
              <li><strong>Conversion Optimization:</strong> Strategic content aligned with business goals</li>
              <li><strong>Competitive Advantage:</strong> Target untapped customer segments</li>
            </ul>
          </div>
        </div>
        
        <Row gutter={16}>
          <Col span={12}>
            <Button 
              type="primary" 
              size="large" 
              block
              style={{ 
                backgroundColor: '#52c41a',
                borderColor: '#52c41a',
                marginBottom: '12px'
              }}
              onClick={() => {
                setShowMoreStrategiesGate(false);
                message.success('All strategies unlocked! (Demo simulation)');
                // In real implementation, this would trigger payment flow
              }}
            >
              Start 7-Day Free Trial
            </Button>
            <Text style={{ fontSize: '12px', color: '#666', display: 'block', textAlign: 'center' }}>
              Then $15/month • Cancel anytime
            </Text>
          </Col>
          <Col span={12}>
            <Button 
              size="large" 
              block
              style={{ marginBottom: '12px' }}
              onClick={() => {
                setShowMoreStrategiesGate(false);
                message.success('All strategies unlocked! (Demo simulation)');
                // In real implementation, this would trigger payment flow
              }}
            >
              Subscribe Now - $15/month
            </Button>
            <Text style={{ fontSize: '12px', color: '#666', display: 'block', textAlign: 'center' }}>
              Full access immediately
            </Text>
          </Col>
        </Row>
        
        {demoMode && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Button 
              type="text" 
              onClick={() => {
                setShowMoreStrategiesGate(false);
                message.info('Demo mode: All strategies unlocked');
              }}
              style={{ color: '#ff4500', fontWeight: 'bold' }}
            >
              🔧 Demo Mode - Skip Payment
            </Button>
          </div>
        )}
      </Modal>

      {/* Content Strategy Customization Gate Modal */}
      <Modal
        title="🎯 Advanced Content Customization"
        open={showStrategyGate}
        onCancel={() => setShowStrategyGate(false)}
        footer={null}
        width={600}
        centered
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ 
            backgroundColor: '#f0f8ff', 
            padding: '20px', 
            borderRadius: '12px', 
            margin: '16px 0', 
            border: '1px solid #d6e7ff' 
          }}>
            <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
              Your current blog post strategy:
            </Text>
            <div style={{ marginTop: '12px', textAlign: 'left' }}>
              <Text style={{ fontSize: '14px' }}>
                <strong>Goal:</strong> {getStrategyDisplayText('goal', contentStrategy.goal)} <br/>
                <strong>Voice:</strong> {getStrategyDisplayText('voice', contentStrategy.voice)} <br/>
                <strong>Template:</strong> {getStrategyDisplayText('template', contentStrategy.template)} <br/>
                <strong>Length:</strong> {getStrategyDisplayText('length', contentStrategy.length)}
              </Text>
            </div>
          </div>
          
          <Title level={3} style={{ marginBottom: '8px' }}>
            Unlock Content Strategy Customization
          </Title>
          <Paragraph>
            Customize your content to <Text strong>optimize for conversion</Text>, try different voices, 
            or experiment with various content frameworks.
          </Paragraph>
          
          <div style={{ backgroundColor: '#fff7e6', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #ffd591' }}>
            <Text strong style={{ color: '#fa8c16' }}>✨ With Pro Content Customization:</Text>
            <ul style={{ textAlign: 'left', marginTop: '8px', marginBottom: '0' }}>
              <li><strong>Goal Optimization:</strong> Switch between awareness, consideration, conversion, and retention focuses</li>
              <li><strong>Voice Variations:</strong> Try professional expert, friendly guide, insider, or storyteller tones</li>
              <li><strong>Content Templates:</strong> How-to guides, problem-solution, listicles, case studies, comprehensive guides</li>
              <li><strong>Length Control:</strong> Quick reads, standard posts, or deep-dive content</li>
              <li><strong>Unlimited Regenerations:</strong> Perfect your content with multiple attempts</li>
              <li><strong>A/B Testing:</strong> Generate multiple variations to test</li>
            </ul>
          </div>
        </div>
        
        <Row gutter={16}>
          <Col span={12}>
            <Button 
              type="primary" 
              size="large" 
              block
              style={{ 
                backgroundColor: '#52c41a',
                borderColor: '#52c41a',
                marginBottom: '12px'
              }}
              onClick={() => {
                setShowStrategyGate(false);
                message.success('Pro features unlocked! (Demo simulation)');
                // In real implementation, this would trigger payment flow
              }}
            >
              Start 7-Day Free Trial
            </Button>
            <Text style={{ fontSize: '12px', color: '#666', display: 'block', textAlign: 'center' }}>
              Then $9/month • Cancel anytime
            </Text>
          </Col>
          <Col span={12}>
            <Button 
              size="large" 
              block
              style={{ marginBottom: '12px' }}
              onClick={() => {
                setShowStrategyGate(false);
                message.success('Pro features unlocked! (Demo simulation)');
                // In real implementation, this would trigger payment flow
              }}
            >
              Subscribe Now - $9/month
            </Button>
            <Text style={{ fontSize: '12px', color: '#666', display: 'block', textAlign: 'center' }}>
              Full access immediately
            </Text>
          </Col>
        </Row>
        
        {demoMode && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Button 
              type="text" 
              onClick={() => {
                setShowStrategyGate(false);
                setContentStrategy(prev => ({
                  ...prev,
                  goal: contentStrategy.goal // Keep the attempted change
                }));
                message.info('Demo mode: Payment gate bypassed');
              }}
              style={{ color: '#ff4500', fontWeight: 'bold' }}
            >
              🔧 Demo Mode - Skip Payment
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default App;