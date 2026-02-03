import autoBlogAPI from './api';
import enhancedContentAPI from './enhancedContentAPI';
import jobsAPI from './jobsAPI';

/**
 * Workflow API Service Layer
 * Centralizes all API calls from App.js with consistent interfaces and error handling
 */

/**
 * Map job result to analysisAPI response shape
 */
function mapWebsiteAnalysisResult(result) {
  const analysis = result.analysis || result;
  const hasEnhancedData = analysis.brandColors &&
    analysis.scenarios?.length > 0 &&
    analysis.scenarios[0]?.businessValue &&
    analysis.scenarios[0]?.targetSegment;
  return {
    success: true,
    analysis: {
      businessType: analysis.businessType || 'Business',
      businessName: analysis.businessName || 'Your Business',
      targetAudience: analysis.decisionMakers || analysis.targetAudience || 'General Audience',
      contentFocus: analysis.contentFocus || 'Content Focus',
      brandVoice: analysis.brandVoice || 'Professional',
      brandColors: analysis.brandColors || {
        primary: '#6B8CAE',
        secondary: '#F4E5D3',
        accent: '#8FBC8F'
      },
      description: analysis.description || 'Business description generated from website analysis.',
      decisionMakers: analysis.decisionMakers || analysis.targetAudience || 'General Audience',
      endUsers: analysis.endUsers || 'Product users',
      searchBehavior: analysis.searchBehavior || '',
      connectionMessage: analysis.connectionMessage || '',
      businessModel: analysis.businessModel || '',
      websiteGoals: analysis.websiteGoals || '',
      blogStrategy: analysis.blogStrategy || '',
      scenarios: analysis.scenarios || [],
      webSearchStatus: analysis.webSearchStatus || {
        businessResearchSuccess: false,
        keywordResearchSuccess: false,
        enhancementComplete: false
      },
      customerProblems: analysis.customerProblems || [],
      customerLanguage: analysis.customerLanguage || [],
      keywords: analysis.keywords || [],
      contentIdeas: analysis.contentIdeas || [],
      organizationId: analysis.organizationId
    },
    webSearchInsights: {
      brandResearch: analysis.brandColors ? 'Found actual brand guidelines' : null,
      keywordResearch: hasEnhancedData ? 'Current market keyword analysis completed' : null,
      researchQuality: hasEnhancedData ? 'enhanced' : 'basic'
    },
    ctas: result.ctas || [],
    ctaCount: result.ctaCount || 0,
    hasSufficientCTAs: result.hasSufficientCTAs || false
  };
}

/**
 * Website Analysis API
 * Handles the complex website analysis with multiple phases.
 * Uses worker queue (POST /api/v1/jobs/website-analysis) when available.
 */
export const analysisAPI = {
  /**
   * Analyze website with comprehensive business intelligence
   * @param {string} websiteUrl - The website URL to analyze
   * @param {{ onProgress?: (step: number | object) => void }} options - Optional; onProgress called for each step or with job status
   * @returns {Promise<Object>} Analysis results with business data
   */
  async analyzeWebsite(websiteUrl, options = {}) {
    try {
      // Ensure URL has protocol for backend API
      let formattedUrl = websiteUrl.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl;
      }

      const sessionId = autoBlogAPI.getOrCreateSessionId?.() || sessionStorage.getItem('audience_session_id');

      // Prefer job stream, then polling, then sync analyze
      try {
        const createResponse = await jobsAPI.createWebsiteAnalysisJob(formattedUrl, sessionId);
        const jobId = createResponse.jobId;

        // Prefer SSE job stream for real-time progress; fall back to polling if stream unavailable
        let finalStatus = null;
        try {
          finalStatus = await jobsAPI.connectToJobStream(jobId, {
            onProgress: (data) => {
              if (options.onProgress) options.onProgress(data);
            }
          });
        } catch (streamErr) {
          console.warn('Job stream not available, falling back to polling:', streamErr?.message);
          finalStatus = await jobsAPI.pollJobStatus(jobId, {
            onProgress: (status) => {
              if (options.onProgress) options.onProgress(status);
            },
            pollIntervalMs: 2500,
            maxAttempts: 120
          });
        }

        if (finalStatus?.status === 'succeeded' && finalStatus.result) {
          return mapWebsiteAnalysisResult(finalStatus.result);
        }
        if (finalStatus?.status === 'failed') {
          throw new Error(finalStatus.error || 'Website analysis failed');
        }
      } catch (jobsErr) {
        if (jobsErr.status === 404 || jobsErr.status === 503) {
          if (jobsErr.status === 503) {
            return {
              success: false,
              error: 'Service temporarily unavailable. The analysis queue is not available. Please try again later.',
              queueUnavailable: true
            };
          }
          // 404 = jobs API not implemented yet, fall through to sync flow
        } else {
          throw jobsErr;
        }
      }

      // Fallback: sync flow (when jobs API returns 404)
      const response = await autoBlogAPI.analyzeWebsite(formattedUrl, options);
      
      if (response.success && response.analysis) {
        // Determine research quality based on response completeness
        const hasEnhancedData = response.analysis.brandColors && 
                               response.analysis.scenarios && 
                               response.analysis.scenarios.length > 0 &&
                               response.analysis.scenarios[0].businessValue &&
                               response.analysis.scenarios[0].targetSegment;

        return {
          success: true,
          analysis: {
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
            contentIdeas: response.analysis.contentIdeas || [],
            organizationId: response.analysis.organizationId,
            // Narrative analysis fields
            narrative: response.analysis.narrative,
            narrativeConfidence: response.analysis.narrativeConfidence,
            keyInsights: response.analysis.keyInsights || [],
            narrativeGenerating: response.analysis.narrativeGenerating
          },
          webSearchInsights: {
            brandResearch: response.analysis.brandColors ? 'Found actual brand guidelines' : null,
            keywordResearch: hasEnhancedData ? 'Current market keyword analysis completed' : null,
            researchQuality: hasEnhancedData ? 'enhanced' : 'basic'
          },
          ctas: response.ctas || [],
          ctaCount: response.ctaCount || 0,
          hasSufficientCTAs: response.hasSufficientCTAs || false
        };
      } else {
        throw new Error('Analysis failed: Invalid response');
      }
    } catch (error) {
      console.error('Website analysis error:', error);
      
      // Return fallback analysis on error
      const businessName = websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0];
      return {
        success: false,
        error: error.message,
        fallbackAnalysis: {
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
          description: 'Unable to analyze website. Please proceed with manual configuration.',
          scenarios: [],
          customerProblems: [],
          customerLanguage: [],
          keywords: [],
          contentIdeas: []
        }
      };
    }
  },

  /**
   * Validate website URL format
   * @param {string} url - URL to validate
   * @returns {Object} Validation result
   */
  validateWebsiteUrl(url) {
    const normalizedUrl = url.trim().toLowerCase();
    
    // More flexible URL pattern that handles various cases
    const urlPattern = /^(https?:\/\/)?([a-z0-9-]+\.)*[a-z0-9-]+\.[a-z]{2,}(\/.*)?$/i;
    const hasValidDomain = /[a-z0-9-]+\.[a-z]{2,}/i.test(normalizedUrl);
    
    return {
      isValid: urlPattern.test(normalizedUrl) && hasValidDomain,
      normalizedUrl,
      formattedUrl: url.startsWith('http') ? url : 'https://' + url
    };
  }
};

/**
 * Topic Generation API
 * Handles AI-powered topic generation based on analysis
 */
export const topicAPI = {
  /**
   * Generate trending topics for business
   * @param {Object} analysisData - Website analysis results
   * @param {Object} selectedStrategy - Customer strategy (optional)
   * @param {Object} webSearchInsights - Research insights
   * @returns {Promise<Object>} Generated topics
   */
  async generateTrendingTopics(analysisData, selectedStrategy = null, webSearchInsights = {}) {
    try {
      // Use selected strategy context or fallback to general analysis (accept various API shapes)
      const audienceLabel = analysisData.decisionMakers || analysisData.targetAudience || 'General Audience';
      const targetAudience = selectedStrategy
        ? `${audienceLabel} struggling with: ${selectedStrategy.customerProblem}`
        : audienceLabel;

      const contentFocus = selectedStrategy
        ? `Content addressing: ${selectedStrategy.customerProblem}. Target keywords: ${selectedStrategy.seoKeywords?.join(', ') || 'relevant terms'}`
        : (analysisData.contentFocus || 'Content');

      console.log('Generating topics for:', targetAudience);
      console.log('Content focus:', contentFocus);

      // Call real backend API (accept various analysis shapes: businessType, businessName, etc.)
      const businessType = analysisData.businessType || analysisData.businessName || 'Business';
      const topics = await autoBlogAPI.getTrendingTopics(businessType, targetAudience, contentFocus || 'Content');
      
      if (topics && topics.length > 0) {
        // Ensure we only use first 2 topics and map them with strategy data
        const limitedTopics = topics.slice(0, 2);
        
        // Display final topics immediately without artificial delays
        const finalTopics = limitedTopics.map((topic, index) => ({
          ...topic,
          scenario: selectedStrategy || (analysisData.scenarios && analysisData.scenarios[index] ? analysisData.scenarios[index] : null),
          isLoading: false,
          isContentLoading: false,
          isImageLoading: false
        }));

        return {
          success: true,
          topics: finalTopics,
          message: `Generated ${finalTopics.length} targeted content ideas!`
        };
      } else {
        return {
          success: false,
          error: 'No trending topics generated by AI',
          topics: []
        };
      }
    } catch (error) {
      console.error('Topic generation error:', error);
      
      // Fallback: create topics from strategy content ideas if available
      if (analysisData.contentIdeas && analysisData.contentIdeas.length > 0) {
        const fallbackBizType = analysisData.businessType || analysisData.businessName || 'Business';
        const fallbackTopics = analysisData.contentIdeas.slice(0, 2).map((idea, index) => ({
          id: index + 1,
          title: idea,
          subheader: `Content idea based on ${fallbackBizType} analysis`,
          category: fallbackBizType,
          image: '',
          scenario: selectedStrategy || (analysisData.scenarios && analysisData.scenarios[index] ? analysisData.scenarios[index] : null),
          isLoading: false,
          isContentLoading: false,
          isImageLoading: false
        }));
        
        return {
          success: true,
          topics: fallbackTopics,
          isFallback: true,
          message: 'Using fallback content ideas from website analysis.'
        };
      }

      return {
        success: false,
        error: error.message,
        topics: []
      };
    }
  }
};

/**
 * Content Generation API  
 * Handles AI-powered content creation
 */
export const contentAPI = {
  /**
   * Generate blog content based on selected topic
   * @param {Object} selectedTopic - The chosen topic data
   * @param {Object} analysisData - Website analysis results
   * @param {Object} selectedStrategy - Customer strategy (optional)
   * @param {Object} webSearchInsights - Research insights
   * @param {Object} enhancementOptions - Enhancement options for content generation
   * @returns {Promise<Object>} Generated content
   */
  async generateContent(selectedTopic, analysisData, selectedStrategy = null, webSearchInsights = {}, enhancementOptions = {}) {
    try {
      // Step 1: Get tweets (use prefetched if provided for parallel UX with credits check)
      let tweets = [];
      if (enhancementOptions.prefetchedTweets !== undefined) {
        tweets = enhancementOptions.prefetchedTweets || [];
        console.log(`✅ Using ${tweets.length} prefetched tweets for topic`);
      } else {
        console.log('🐦 Searching for tweets for selected topic...');
        const tweetSearchResult = await autoBlogAPI.searchTweetsForTopic(
          selectedTopic,
          analysisData,
          3  // maxTweets
        );
        tweets = tweetSearchResult.tweets || [];
        console.log(`✅ Found ${tweets.length} tweets for topic`);
      }

      // Check if enhanced content generation is requested
      if (enhancementOptions.useEnhancedGeneration) {
        console.log('🚀 Using enhanced content generation with comprehensive context');
        console.log('🔍 Enhancement options:', enhancementOptions);
        console.log('🎯 Strategy provided:', !!selectedStrategy);

        const { prefetchedTweets: _, ...restOptions } = enhancementOptions;
        const enhancedResult = await enhancedContentAPI.generateEnhancedContent(
          selectedTopic,
          analysisData,
          selectedStrategy,
          { ...restOptions, tweets }  // Pass tweets to enhanced generation (exclude prefetchedTweets)
        );
        
        if (enhancedResult.success) {
          const blogPost = enhancedResult.blogPost?.id
            ? enhancedResult.blogPost
            : { content: enhancedResult.content, ...enhancedResult.enhancedMetadata };
          return {
            success: true,
            content: enhancedResult.content,
            blogPost,
            savedPost: enhancedResult.blogPost?.id ? enhancedResult.blogPost : undefined,
            imageGenerationPromise: enhancedResult.imageGenerationPromise,
            visualSuggestions: enhancedResult.visualSuggestions || [],
            enhancedMetadata: enhancedResult.enhancedMetadata,
            seoAnalysis: enhancedResult.seoAnalysis,
            contentQuality: enhancedResult.contentQuality,
            strategicElements: enhancedResult.strategicElements,
            improvementSuggestions: enhancedResult.improvementSuggestions,
            keywordOptimization: enhancedResult.keywordOptimization,
            generationContext: enhancedResult.generationContext,
            strategicCTAs: enhancedResult.strategicCTAs,
            selectedTopic: selectedTopic
          };
        }
        if (enhancedResult.queueUnavailable) {
          return {
            success: false,
            error: enhancedResult.error,
            queueUnavailable: true
          };
        }
        if (enhancedResult.retryable && enhancedResult.jobId) {
          return {
            success: false,
            error: enhancedResult.error,
            errorCode: enhancedResult.errorCode,
            jobId: enhancedResult.jobId,
            retryable: true
          };
        }
        if (enhancedResult.fallbackAvailable) {
          console.log('⚠️ Enhanced generation failed, falling back to standard generation');
          console.log('📝 Fallback reason:', enhancedResult.error);
        } else {
          return enhancedResult;
        }
      }

      // Standard content generation (fallback or default)
      const contextPrompt = selectedStrategy ?
        `Focus on ${selectedStrategy.customerProblem}. Target customers who search for: ${selectedStrategy.customerLanguage?.join(', ') || 'relevant terms'}. Make this content align with the business goal: ${selectedStrategy.conversionPath}. ${webSearchInsights.researchQuality === 'enhanced' ? 'Enhanced with web research insights including competitive analysis and current market keywords.' : ''}` :
        `Make this engaging and actionable for the target audience. ${webSearchInsights.researchQuality === 'enhanced' ? 'Enhanced with web research insights including brand guidelines and keyword analysis.' : ''}`;

      const response = await autoBlogAPI.generateContent(
        selectedTopic,
        analysisData,  // This maps to 'businessInfo' parameter in the API
        contextPrompt,
        tweets  // Pass tweets to standard generation
      );

      // Step 2: Generate images if needed (after blog is saved)
      let content = response.blogPost?.content || response.content;

      if (response.imageGeneration?.needsImageGeneration && response.imageGeneration.blogPostId) {

        try {
          const imageResult = await autoBlogAPI.generateImagesForBlog(
            response.imageGeneration.blogPostId,
            content,
            response.imageGeneration.topic,
            response.imageGeneration.organizationId
          );

          if (imageResult.success) {
            content = imageResult.content;
          }
        } catch (_imageError) {
          // Continue with placeholder content
        }
      }

      if (response.blogPost && content) {
        return {
          success: true,
          content: content,
          blogPost: { ...response.blogPost, content },
          selectedTopic: selectedTopic
        };
      } else {
        return {
          success: false,
          error: 'No content generated'
        };
      }
    } catch (error) {
      console.error('Content generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Start blog post generation stream. Use for standard (non-enhanced) path only.
   * Returns connectionId; caller connects via autoBlogAPI.connectToStream(connectionId, handlers).
   * @param {Object} selectedTopic - The chosen topic data
   * @param {Object} analysisData - Website analysis results
   * @param {Object} selectedStrategy - Customer strategy (optional)
   * @param {Object} webSearchInsights - Research insights
   * @param {Object} enhancementOptions - Must include prefetchedTweets or tweets will be fetched
   * @returns {Promise<{ connectionId: string }>} Stream connection ID
   */
  async startBlogStream(selectedTopic, analysisData, selectedStrategy = null, webSearchInsights = {}, enhancementOptions = {}) {
    let tweets = [];
    if (enhancementOptions.prefetchedTweets !== undefined) {
      tweets = enhancementOptions.prefetchedTweets || [];
    } else {
      const tweetSearchResult = await autoBlogAPI.searchTweetsForTopic(selectedTopic, analysisData, 3);
      tweets = tweetSearchResult.tweets || [];
    }
    const contextPrompt = selectedStrategy
      ? `Focus on ${selectedStrategy.customerProblem}. Target customers who search for: ${selectedStrategy.customerLanguage?.join(', ') || 'relevant terms'}. Make this content align with the business goal: ${selectedStrategy.conversionPath}. ${webSearchInsights.researchQuality === 'enhanced' ? 'Enhanced with web research insights including competitive analysis and current market keywords.' : ''}`
      : `Make this engaging and actionable for the target audience. ${webSearchInsights.researchQuality === 'enhanced' ? 'Enhanced with web research insights including brand guidelines and keyword analysis.' : ''}`;

    const { connectionId } = await autoBlogAPI.generateBlogStream({
      topic: selectedTopic,
      businessInfo: analysisData,
      additionalInstructions: contextPrompt,
      tweets: tweets.length ? tweets : undefined
    });
    return { connectionId };
  }
};

/**
 * Export utility functions
 */
export const exportUtils = {
  /**
   * Create post metadata for export
   * @param {Object} selectedTopic - Selected topic data
   * @param {string} generatedContent - Generated content
   * @param {Object} analysisData - Website analysis
   * @returns {Object} Complete post object
   */
  createPostMetadata(selectedTopic, generatedContent, analysisData) {
    if (!selectedTopic) {
      return null;
    }
    
    return {
      title: selectedTopic.title,
      slug: selectedTopic.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50),
      subheader: selectedTopic.subheader,
      excerpt: selectedTopic.subheader,
      content: generatedContent,
      tags: ['AI Generated', 'AutoBlog', selectedTopic.category],
      category: selectedTopic.category,
      wordCount: Math.round(generatedContent.length / 5),
      readingTime: Math.ceil(generatedContent.length / 1000),
      author: 'AutoBlog AI',
      businessName: analysisData.businessName,
      brandColors: analysisData.brandColors,
      brandVoice: analysisData.brandVoice,
      website: analysisData.websiteUrl || 'Unknown'
    };
  },

  /**
   * Download file utility
   * @param {string} content - File content
   * @param {string} filename - File name
   * @param {string} mimeType - MIME type
   */
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Configuration constants extracted from App.js
 */
export const workflowConfig = {
  steps: [
    { title: 'Analyzing Website', icon: 'ScanOutlined', description: 'Scanning your website to understand your business' },
    { title: 'Selecting Strategy', icon: 'SearchOutlined', description: 'Choose your target customer strategy' },
    { title: 'Generating Ideas', icon: 'BulbOutlined', description: 'Creating targeted blog post previews', requiresLogin: true },
    { title: 'Creating Content', icon: 'EditOutlined', description: 'AI is writing your personalized blog post', requiresLogin: true },
    { title: 'Editing Content', icon: 'EyeOutlined', description: 'Review and customize your blog post', requiresLogin: true }
  ],

  cmsOptions: [
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
  ],

  strategyOptions: {
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
  }
};

const workflowAPI = {
  analysisAPI,
  topicAPI,
  contentAPI,
  exportUtils,
  workflowConfig
};

export default workflowAPI;