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

  // Mock trending topics data
  const mockTopics = [
    {
      id: 1,
      trend: "AI Safety for Children",
      title: "How to Teach Your Child About AI Safety: A Parent's Guide to the Digital Future",
      subheader: "As artificial intelligence becomes part of daily life, here's how to prepare your children for safe AI interactions",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop",
      seoBenefit: "Optimized for: ai safety kids, digital parenting, child technology education",
      category: "Digital Parenting",
      trafficPrediction: "Likely to increase visits from tech-aware parents aged 28-42 who are concerned about AI's impact on children and actively search for 'AI safety for kids' and 'teaching children about technology'"
    },
    {
      id: 2,
      trend: "Emotional Regulation Techniques",
      title: "5 Science-Backed Emotional Regulation Techniques That Actually Work for Sensitive Children",
      subheader: "Research-proven methods to help highly sensitive children manage overwhelming emotions and build resilience",
      image: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400&h=250&fit=crop",
      seoBenefit: "Will help rank for: emotional regulation kids, sensitive child parenting, child emotional health",
      category: "Child Development",
      trafficPrediction: "Likely to increase visits from parents of highly sensitive children aged 3-10, particularly mothers aged 25-35 searching for 'emotional regulation techniques' and 'helping sensitive child cope'"
    }
  ].slice(0, 2); // Only show 2 topics

  const steps = [
    { title: 'Analyzing Website', icon: <ScanOutlined />, description: 'Scanning your website to understand your business' },
    { title: 'Building Strategy', icon: <SearchOutlined />, description: 'Creating content strategy based on your audience' },
    { title: 'Generating Ideas', icon: <BulbOutlined />, description: 'Creating compelling blog post previews with AI', requiresLogin: true },
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
      // Show loading state
      setIsLoading(true);
      setScanningMessage('Analyzing website with AI...');

      // Call real backend API
      const response = await autoBlogAPI.analyzeWebsite(websiteUrl);
      
      if (response.success && response.analysis) {
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
            customerProblems: response.analysis.customerProblems || [],
            searchBehavior: response.analysis.searchBehavior || '',
            customerLanguage: response.analysis.customerLanguage || [],
            keywords: response.analysis.keywords || [],
            contentIdeas: response.analysis.contentIdeas || [],
            connectionMessage: response.analysis.connectionMessage || ''
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
      setIsLoading(true);
      setScanningMessage('Generating trending topics with AI...');
      
      // Reset previous topics to avoid lingering data
      setStepResults(prev => ({
        ...prev,
        trendingTopics: []
      }));

      // Show skeleton topics immediately for better UX
      const skeletonTopics = Array.from({ length: 2 }, (_, i) => ({
        id: i + 1,
        trend: "Loading...",
        title: "Generating trending topic...",
        subheader: "AI is creating a compelling topic description...",
        image: "loading",
        seoBenefit: "Analyzing SEO potential...",
        category: "Loading...",
        isLoading: true,
        isContentLoading: true,
        isImageLoading: true
      }));

      setStepResults(prev => ({
        ...prev,
        trendingTopics: skeletonTopics
      }));

      // Step advancement is now handled by generateBlogPreviews function

      const { businessType, targetAudience, contentFocus } = stepResults.websiteAnalysis;

      // Call real backend API
      const topics = await autoBlogAPI.getTrendingTopics(businessType, targetAudience, contentFocus);
      
      if (topics && topics.length > 0) {
        // Ensure we only use first 2 topics
        const limitedTopics = topics.slice(0, 2);
        
        // First, show topics content but keep images loading
        const topicsWithContentLoaded = limitedTopics.map(topic => ({
          ...topic,
          isLoading: false,
          isContentLoading: false,
          isImageLoading: true // Images still loading
        }));

        setStepResults(prev => ({
          ...prev,
          trendingTopics: topicsWithContentLoaded
        }));

        // Then progressively load images (simulate the backend processing)
        setTimeout(() => {
          const finalTopics = limitedTopics.map(topic => ({
            ...topic,
            isLoading: false,
            isContentLoading: false,
            isImageLoading: false
          }));

          setStepResults(prev => ({
            ...prev,
            trendingTopics: finalTopics
          }));
        }, 3000); // Images appear 3 seconds after content for clearer separation
      } else {
        // Fallback to mock topics with same progressive loading
        const mockWithContentLoaded = mockTopics.map(topic => ({
          ...topic,
          isLoading: false,
          isContentLoading: false,
          isImageLoading: true
        }));

        setStepResults(prev => ({
          ...prev,
          trendingTopics: mockWithContentLoaded
        }));

        setTimeout(() => {
          setStepResults(prev => ({
            ...prev,
            trendingTopics: mockTopics.map(topic => ({
              ...topic,
              isLoading: false,
              isContentLoading: false,
              isImageLoading: false
            }))
          }));
        }, 3000);
      }

      // Complete loading (step 3 already set above)
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Trending topics error:', error);
      setIsLoading(false);
      message.error(`Failed to generate topics: ${error.message}`);
      
      // Fall back to mock topics with progressive loading on error
      const mockWithContentLoaded = mockTopics.map(topic => ({
        ...topic,
        isLoading: false,
        isContentLoading: false,
        isImageLoading: true
      }));

      setStepResults(prev => ({
        ...prev,
        trendingTopics: mockWithContentLoaded
      }));

      setTimeout(() => {
        setStepResults(prev => ({
          ...prev,
          trendingTopics: mockTopics.map(topic => ({
            ...topic,
            isLoading: false,
            isContentLoading: false,
            isImageLoading: false
          }))
        }));
        setCurrentStep(3);
      }, 3000);
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
      
      // Move to Step 4 and show skeleton loading
      setCurrentStep(4);
      scrollToNextSection(4);
      
      // Find the selected topic from either real or mock topics
      const topics = stepResults.trendingTopics || mockTopics;
      const selectedTopicData = topics.find(t => t.id === topicId);
      
      if (!selectedTopicData) {
        throw new Error('Selected topic not found');
      }

      // Call real backend API to generate content
      const blogPost = await autoBlogAPI.generateContent(
        selectedTopicData, 
        stepResults.websiteAnalysis,
        'Make this engaging and actionable for the target audience.'
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
      
      // Fall back to mock content on error
      const topics = stepResults.trendingTopics || mockTopics;
      const topic = topics.find(t => t.id === topicId);
      const businessName = stepResults.websiteAnalysis.businessName || 'your business';
      const fallbackContent = `# ${topic.title}

${topic.subheader}

## Introduction

This is a fallback blog post generated when the AI service is unavailable. In a production environment, this would be replaced with fully AI-generated content tailored to your business and audience.

## Key Points

- **Evidence-Based Approach**: Content based on current best practices
- **Audience-Focused**: Written specifically for your target demographic
- **Actionable Insights**: Practical advice readers can implement

## Conclusion

*${businessName} is committed to providing valuable content that helps your audience achieve their goals.*`;

      setGeneratedContent(fallbackContent);
      setStepResults(prev => ({
        ...prev,
        finalContent: fallbackContent,
        selectedContent: topic
      }));
      setGeneratedContent(fallbackContent);
      
      // Complete blog generation with fallback content and default to preview mode
      setTimeout(() => {
        setBlogGenerating(false);
        setIsLoading(false);
        setPreviewMode(true); // Default to preview mode
      }, 1000);
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
    const selectedTopicData = mockTopics.find(t => t.id === selectedTopic);
    
    return {
      title: selectedTopicData?.title || "Demo Blog Post Title",
      slug: selectedTopicData?.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50) || 'demo-blog-post',
      subheader: selectedTopicData?.subheader || "AI-generated subheader for this demo post",
      excerpt: selectedTopicData?.subheader || "Demo excerpt",
      content: generatedContent || "Demo content would go here...",
      tags: ['AI Generated', 'AutoBlog', selectedTopicData?.category || 'Demo'],
      category: selectedTopicData?.category || 'Business',
      website: websiteUrl,
      brandColors: stepResults.websiteAnalysis.brandColors,
      readingTime: Math.ceil((generatedContent || '').length / 1000) || 5,
      wordCount: (generatedContent || '').split(' ').length || 100
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
  };

  const exportAsHTML = () => {
    const post = getCurrentPost();
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

  const progressPercent = ((currentStep + 1) / 5) * 100;

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
              <Text>{mockTopics.find(t => t.id === selectedTopic)?.title}</Text>
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>Content Angle:</Text> {mockTopics.find(t => t.id === selectedTopic)?.category} approach
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>Target Keywords:</Text> {mockTopics.find(t => t.id === selectedTopic)?.popularity}
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
          ? `Selected Topic: ${mockTopics.find(t => t.id === selectedTopic)?.title?.substring(0, 60)}...`
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
        </Row>

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

  const renderContentStrategy = () => {
    const analysis = stepResults.websiteAnalysis;

    // Generate specific content ideas based on customer problems and language
    const generateContentIdeas = () => {
      // Use new customer language if available, otherwise create realistic fallbacks
      let searchTerms = [];
      
      if (analysis.customerLanguage && analysis.customerLanguage.length > 0) {
        searchTerms = analysis.customerLanguage;
      } else if (analysis.keywords && analysis.keywords.length > 0) {
        searchTerms = analysis.keywords;
      } else {
        // Create realistic fallbacks based on business type
        const businessType = analysis.businessType.toLowerCase();
        if (businessType.includes('comfort') || businessType.includes('children')) {
          searchTerms = [
            'bedtime anxiety',
            'calming toys for kids',
            'comfort items for children',
            'helping anxious children sleep',
            'emotional support for kids',
            'soothing toys'
          ];
        } else {
          // Generic fallback for other business types
          const audience = analysis.decisionMakers || analysis.targetAudience || 'customers';
          searchTerms = [
            `best ${businessType} solutions`,
            `${businessType} for ${audience}`,
            `how to choose ${businessType}`,
            `${businessType} guide`
          ];
        }
      }

      return searchTerms.slice(0, 6).map((searchTerm, index) => {
        const templates = [
          { title: `How to Help with ${searchTerm}`, searchIntent: 'Parents seeking immediate solutions' },
          { title: `${searchTerm}: A Complete Parent's Guide`, searchIntent: 'Parents looking for comprehensive help' },
          { title: `Best Solutions for ${searchTerm}`, searchIntent: 'Parents comparing options' },
          { title: `Understanding ${searchTerm}: What Every Parent Should Know`, searchIntent: 'Parents seeking understanding' },
          { title: `${searchTerm} - Proven Strategies That Work`, searchIntent: 'Parents wanting effective solutions' },
          { title: `When Your Child Has ${searchTerm}: A Support Guide`, searchIntent: 'Parents in crisis seeking help' }
        ];
        
        const template = templates[index % templates.length];
        return {
          searchTerm,
          title: template.title,
          searchIntent: template.searchIntent
        };
      });
    };

    // Use AI-generated content ideas if available, otherwise use fallback function
    const contentIdeas = analysis.contentIdeas && analysis.contentIdeas.length > 0 
      ? analysis.contentIdeas 
      : generateContentIdeas();
    
    return (
      <Card 
        style={{ 
          border: `2px solid ${analysis.brandColors.accent}`,
          borderRadius: '12px',
          background: `linear-gradient(135deg, ${analysis.brandColors.accent}06, #ffffff)`,
          marginBottom: '30px'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title 
            level={3} 
            style={{ 
              margin: 0, 
              color: analysis.brandColors.accent,
              fontSize: '24px',
              fontWeight: 600,
              marginBottom: '8px'
            }}
          >
            📊 Content Strategy
          </Title>
          <Text style={{ fontSize: '16px', color: '#666' }}>
            Connect with {analysis.decisionMakers || analysis.targetAudience} when they're searching for help
          </Text>
        </div>

        {/* Content Strategy Scenarios - One card per customer problem */}
        {(() => {
          // Generate customer problems for scenarios
          let customerProblems = [];
          
          if (analysis.customerProblems && analysis.customerProblems.length > 0) {
            customerProblems = analysis.customerProblems;
          } else {
            // Create realistic fallbacks based on business type
            const businessType = analysis.businessType.toLowerCase();
            if (businessType.includes('comfort') || businessType.includes('children')) {
              customerProblems = [
                'Child having trouble sleeping through the night',
                'Dealing with bedtime anxiety and fears',
                'Need for emotional comfort during difficult times',
                'Finding ways to help sensitive children cope with stress'
              ];
            } else {
              const audience = analysis.decisionMakers || analysis.targetAudience || 'customers';
              customerProblems = [
                `Finding reliable ${businessType} solutions`,
                `Understanding which ${businessType} options work best`,
                `Getting expert guidance for ${businessType} decisions`,
                `Solving problems related to ${businessType}`
              ];
            }
          }

          // Get search terms
          let searchTerms = [];
          if (analysis.customerLanguage && analysis.customerLanguage.length > 0) {
            searchTerms = analysis.customerLanguage;
          } else if (analysis.keywords && analysis.keywords.length > 0) {
            searchTerms = analysis.keywords;
          } else {
            const businessType = analysis.businessType.toLowerCase();
            if (businessType.includes('comfort') || businessType.includes('children')) {
              searchTerms = [
                'bedtime anxiety',
                'calming toys for kids', 
                'comfort items for children',
                'helping anxious children sleep',
                'emotional support for kids',
                'soothing toys'
              ];
            } else {
              const audience = analysis.decisionMakers || analysis.targetAudience || 'customers';
              searchTerms = [
                `best ${businessType} solutions`,
                `${businessType} help`,
                `how to choose ${businessType}`,
                `${businessType} guide`
              ];
            }
          }

          // Get content ideas
          const contentIdeas = analysis.contentIdeas && analysis.contentIdeas.length > 0 
            ? analysis.contentIdeas 
            : generateContentIdeas();

          // Create scenario cards by pairing problems with search terms and content ideas
          const scenarios = customerProblems.map((problem, index) => {
            // Get related search terms (distribute them across problems)
            const relatedSearchTerms = searchTerms.slice(
              Math.floor(index * searchTerms.length / customerProblems.length),
              Math.floor((index + 1) * searchTerms.length / customerProblems.length)
            );
            
            // Get related content ideas (distribute them across problems)
            const relatedContentIdeas = contentIdeas.slice(
              Math.floor(index * contentIdeas.length / customerProblems.length),
              Math.floor((index + 1) * contentIdeas.length / customerProblems.length)
            );

            return {
              problem,
              searchTerms: relatedSearchTerms.length > 0 ? relatedSearchTerms : [searchTerms[index % searchTerms.length]],
              contentIdeas: relatedContentIdeas.length > 0 ? relatedContentIdeas : [contentIdeas[index % contentIdeas.length]].filter(Boolean)
            };
          });

          return (
            <Row gutter={[24, 24]}>
              {scenarios.map((scenario, index) => (
                <Col key={index} xs={24} lg={12}>
                  <Card 
                    style={{ 
                      height: '100%',
                      border: `2px solid ${analysis.brandColors.primary}20`,
                      borderRadius: '12px'
                    }}
                    bodyStyle={{ padding: '20px' }}
                  >
                    {/* Customer Problem */}
                    <div style={{ marginBottom: '20px' }}>
                      <Title level={5} style={{ color: analysis.brandColors.primary, marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '8px' }}>🔍</span>
                        Customer Problem
                      </Title>
                      <Text style={{ fontSize: '15px', fontWeight: 500 }}>
                        {scenario.problem}
                      </Text>
                    </div>

                    {/* How They Search */}
                    <div style={{ marginBottom: '20px' }}>
                      <Title level={5} style={{ color: analysis.brandColors.accent, marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '8px' }}>💬</span>
                        How They Search
                      </Title>
                      <Space wrap>
                        {scenario.searchTerms.map((term, termIndex) => (
                          <Tag 
                            key={termIndex}
                            color={analysis.brandColors.accent}
                            style={{ 
                              borderRadius: '8px',
                              fontSize: '12px',
                              padding: '4px 8px'
                            }}
                          >
                            "{term}"
                          </Tag>
                        ))}
                      </Space>
                    </div>

                    {/* Content Ideas */}
                    <div style={{ marginBottom: '20px' }}>
                      <Title level={5} style={{ color: analysis.brandColors.primary, marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '8px' }}>💡</span>
                        Content Ideas
                      </Title>
                      {scenario.contentIdeas.map((idea, ideaIndex) => (
                        <div 
                          key={ideaIndex}
                          style={{ 
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '6px',
                            marginBottom: ideaIndex < scenario.contentIdeas.length - 1 ? '8px' : 0
                          }}
                        >
                          <Text style={{ fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                            {idea.title}
                          </Text>
                          <Text style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                            {idea.searchIntent}
                          </Text>
                        </div>
                      ))}
                    </div>

                    {/* How This Connects */}
                    <div style={{ 
                      padding: '16px',
                      backgroundColor: analysis.brandColors.accent + '08', 
                      borderRadius: '8px',
                      border: `1px solid ${analysis.brandColors.accent}20`
                    }}>
                      <Title level={5} style={{ color: analysis.brandColors.accent, marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '8px' }}>🚀</span>
                        How This Connects
                      </Title>
                      <Text style={{ fontSize: '13px', lineHeight: '1.5' }}>
                        {analysis.connectionMessage ? (
                          analysis.connectionMessage
                        ) : (
                          <>
                            When ${analysis.decisionMakers || analysis.targetAudience} search for{' '}
                            {scenario.searchTerms.map((term, idx) => (
                              <Text key={idx} strong style={{ color: analysis.brandColors.accent }}>
                                "{term}"{idx < scenario.searchTerms.length - 1 ? ', ' : ''}
                              </Text>
                            ))}, your {analysis.brandVoice.toLowerCase()} content addressing{' '}
                            <Text strong>{scenario.problem.toLowerCase()}</Text> positions you as the trusted expert they need.
                            Your content becomes their solution.
                          </>
                        )}
                      </Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          );
        })()}

      </Card>
    );
  };

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
                      onClick={discoverTrends}
                      style={{ backgroundColor: stepResults.websiteAnalysis.brandColors.primary, borderColor: stepResults.websiteAnalysis.brandColors.primary }}
                      icon={<SearchOutlined />}
                    >
                      Discover Trends
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {currentStep >= 2 && (
        <div data-step="2">
          <Card style={{ marginBottom: '20px' }}>
            <Title level={3} style={{ textAlign: 'center', marginBottom: '20px' }}>
              🎯 Building Strategy
            </Title>
            
            {!strategyCompleted && currentStep === 2 ? (
              <div style={{ textAlign: 'center' }}>
                {/* Loading skeleton for strategy */}
                <div style={{ padding: '20px' }}>
                  <div style={{ height: '20px', backgroundColor: '#f5f5f5', borderRadius: '4px', marginBottom: '12px', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
                  <div style={{ height: '20px', backgroundColor: '#f5f5f5', borderRadius: '4px', marginBottom: '12px', width: '80%', margin: '0 auto 12px', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
                  <div style={{ height: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px', marginBottom: '8px', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
                  <div style={{ height: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px', width: '90%', margin: '0 auto', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
                </div>
              </div>
            ) : (
              <div>
                {/* Content Strategy - using existing renderContentStrategy component */}
                {renderContentStrategy()}
                
                {currentStep === 2 && (
                  <div style={{ textAlign: 'center', marginTop: '30px' }}>
                    <Button 
                      type="primary" 
                      size="large"
                      onClick={generateBlogPreviews}
                      style={{ backgroundColor: stepResults.websiteAnalysis.brandColors.accent, borderColor: stepResults.websiteAnalysis.brandColors.accent }}
                      icon={<BulbOutlined />}
                    >
                      Generate Blog Previews
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Removed old loading screens for steps 3-5 since we simplified the flow */}

      {currentStep >= 3 && (
        <div data-step="3">
          <Card style={{ marginBottom: '20px' }}>
            <Title level={3} style={{ textAlign: 'center', marginBottom: '20px' }}>
              💡 Generating Ideas
            </Title>
            
            <Paragraph style={{ textAlign: 'center', marginBottom: '30px', color: '#666' }}>
              Based on your {stepResults.websiteAnalysis.businessType.toLowerCase()} business analysis, here are high-impact blog post ideas:
            </Paragraph>
          
          <Row gutter={window.innerWidth <= 767 ? [8, 8] : [16, 16]}>
            {(stepResults.trendingTopics || mockTopics).map((topic) => (
              <Col key={topic.id} xs={24} md={12} lg={12}>
                <Card 
                  hoverable={!topic.isLoading}
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
                        border: selectedTopic === topic.id ? `2px solid ${stepResults.websiteAnalysis.brandColors.primary}` : '1px solid #f0f0f0',
                        margin: '8px 0',
                        opacity: topic.isContentLoading ? 0.8 : 1,
                        minHeight: '300px'
                      }}
                    >
                      {topic.isContentLoading ? (
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
                      ) : (
                        <>
                          <div style={{ marginBottom: '12px' }}>
                            <Tag color="blue">{topic.category}</Tag>
                            <Tag color="green" style={{ fontSize: '11px' }}>{topic.seoBenefit}</Tag>
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
                                backgroundColor: stepResults.websiteAnalysis.brandColors.primary,
                                borderColor: stepResults.websiteAnalysis.brandColors.primary,
                                width: '100%'
                              }}
                            >
                              Generate Post
                            </Button>
                          </div>
                        </>
                      )}
                    </Card>
                </Col>
              ))}
            </Row>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <Button onClick={resetDemo} icon={<ReloadOutlined />}>
              Start Over
            </Button>
          </div>
          </Card>
        </div>
      )}

      {currentStep === 4 && (
        <div data-step="4">
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

      {(currentStep === 4 && !blogGenerating) && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <Title level={2} style={{ margin: 0, color: stepResults.websiteAnalysis.brandColors.primary }}>
              Edit Your Generated Content
            </Title>
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
              <Space>
                <Button onClick={resetDemo} icon={<ReloadOutlined />}>
                  Start Over
                </Button>
                <Button onClick={() => editStepResults(1)} icon={<SettingOutlined />}>
                  Edit Website Analysis
                </Button>
                <Button 
                  type="primary" 
                  size="large" 
                  onClick={() => setCurrentStep(8)}
                  style={{ 
                    backgroundColor: stepResults.websiteAnalysis.brandColors.primary, 
                    borderColor: stepResults.websiteAnalysis.brandColors.primary 
                  }}
                >
                  Download Your Content
                </Button>
              </Space>
            </div>
          </Card>
        </div>
      )}

      {currentStep === 8 && (
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
              <Button onClick={() => setCurrentStep(7)} icon={<EditOutlined />}>
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
        title="Create Your Free Account"
        open={showSignupGate}
        onCancel={() => setShowSignupGate(false)}
        footer={null}
        width={500}
        centered
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <EditOutlined style={{ fontSize: '48px', color: '#6B8CAE', marginBottom: '16px' }} />
          <Title level={3}>Generate Your First Blog Post</Title>
          <Paragraph>
            Get your <Text strong>one free blog post</Text> by creating an account! You'll be able to edit, customize, and download your AI-generated content.
          </Paragraph>
          <div style={{ backgroundColor: '#f0f8ff', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #d6e7ff' }}>
            <Text strong style={{ color: '#1890ff' }}>🎉 What you'll get with your free account:</Text>
            <ul style={{ textAlign: 'left', marginTop: '8px', marginBottom: '0' }}>
              <li>One complete AI-generated blog post</li>
              <li>Full editing and customization tools</li>
              <li>Multiple download formats (HTML, Markdown, etc.)</li>
              <li>Brand-styled content with your colors</li>
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
              Create Account & Continue
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
    </div>
  );
};

export default App;