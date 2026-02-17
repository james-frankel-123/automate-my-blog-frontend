import { message } from 'antd';

// Module-level cache for request deduplication (shared across all instances)
const activeRequests = new Map();

// Automate My Blog API Service
class AutoBlogAPI {
  constructor() {
    // Use environment variable for backend URL and ensure no trailing slash
    this.baseURL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
  }

  /**
   * Get current user ID from stored auth token
   * Returns null if no user is logged in
   */
  getCurrentUserId() {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    
    try {
      // JWT tokens have user info in the payload (second part)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.id || payload.sub || null;
    } catch (error) {
      console.warn('Failed to extract user ID from token:', error);
      return null;
    }
  }

  /**
   * Clear cached analysis data (call when user performs new website analysis)
   */
  clearCachedAnalysis(userId = null) {
    const targetUserId = userId || this.getCurrentUserId();
    if (!targetUserId) return;
    
    const cacheKey = `recentAnalysis_${targetUserId}`;
    sessionStorage.removeItem(cacheKey);
  }

  /**
   * Make HTTP request to backend API
   */
  async makeRequest(endpoint, options = {}) {
    // Normalize URL construction to prevent double slashes
    const normalizedEndpoint = endpoint.replace(/^\/+/, '');
    const url = `${this.baseURL}/${normalizedEndpoint}`;
    
    // Add auth token FIRST, then merge with options.headers
    const token = localStorage.getItem('accessToken');
    const authHeaders = {};
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    // Omit Content-Type for FormData so browser sets multipart boundary
    const isFormData = options.body instanceof FormData;
    const defaultOptions = {
      headers: {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...options.headers,      // Add custom headers first
        ...authHeaders,          // Then auth headers (Authorization takes priority)
      },
    };

    // Add timeout with fallback for older browsers (60s for DALL-E generation)
    const timeoutSignal = typeof AbortSignal.timeout === 'function' 
      ? AbortSignal.timeout(60000) 
      : undefined;
    
    // Use caller's signal if provided (e.g. custom timeout), otherwise default timeout
    const signal = options.signal ?? timeoutSignal;

    const requestOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,  // Start with default headers (including auth)
        ...options.headers,         // Merge in custom headers (preserving auth)
      },
      ...(signal && { signal }),
    };
    
    try {
      const response = await fetch(url, requestOptions);
      
      if (response.status === 304) {
        const err = new Error(`HTTP 304: ${response.statusText || 'Not Modified'}`);
        err.status = 304;
        throw err;
      }
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (jsonError) {
          // If JSON parsing fails, try to get text content
          try {
            const textContent = await response.text();
            errorMessage = textContent || errorMessage;
          } catch (textError) {
            // Use the original HTTP error message if both JSON and text fail
            console.error('Failed to parse error response:', jsonError);
          }
        }
        throw new Error(errorMessage);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        let jsonResponse;
        try {
          jsonResponse = await response.json();
        } catch (jsonError) {
          console.error('Failed to parse JSON response:', jsonError);
          console.error('Response status:', response.status);
          console.error('Response content-type:', contentType);
          throw new Error('Invalid JSON response from server');
        }
        
        return jsonResponse;
      } else {
        // For file downloads, return the response directly
        return response;
      }
    } catch (error) {
      // Track error events (but skip if this IS a tracking request to prevent infinite loops)
      const isTrackingRequest = normalizedEndpoint.includes('/analytics/track');

      if (!isTrackingRequest) {
        if (error.name === 'AbortError') {
          // Track timeout_occurred event
          this.trackEvent({
            eventType: 'timeout_occurred',
            eventData: { endpoint: normalizedEndpoint },
            userId: this.getCurrentUserId(),
            pageUrl: window.location.href
          }).catch(err => console.error('Failed to track timeout:', err));

          throw new Error('Request timed out. Please try again.');
        }

        // Track api_error event
        this.trackEvent({
          eventType: 'api_error',
          eventData: {
            endpoint: normalizedEndpoint,
            error: error.message,
            status: error.status || 'unknown'
          },
          userId: this.getCurrentUserId(),
          pageUrl: window.location.href
        }).catch(err => console.error('Failed to track api_error:', err));
      }

      throw new Error(`API Error: ${error.message}`);
    }
  }

  /**
   * Analyze website content and extract business information
   * Now uses 4-step process to avoid timeouts:
   * 1. Basic analysis (scrape + web search)
   * 2. Generate audience scenarios
   * 3. Generate conversion funnel pitches
   * 4. Generate DALL-E images for audiences
   * @param {string} url - Website URL to analyze
   * @param {{ onProgress?: (step: number) => void }} options - Optional; onProgress(step) called with 1-4 before each step
   */
  async analyzeWebsite(url, options = {}) {
    const { onProgress } = options;
    try {
      const sessionId = this.getOrCreateSessionId();
      const headers = { 'Content-Type': 'application/json' };

      // Only send session ID if NOT authenticated (following audience pattern)
      const token = localStorage.getItem('accessToken');
      if (!token) {
        headers['x-session-id'] = sessionId;
      }

      // Track scrape_started event
      this.trackEvent({
        eventType: 'scrape_started',
        eventData: { url },
        userId: this.getCurrentUserId(),
        pageUrl: window.location.href
      }).catch(err => console.error('Failed to track scrape_started:', err));

      if (onProgress) onProgress(1);
      console.log('Step 1/4: Analyzing website...');

      // Step 1: Basic website analysis (scrape + web search, NO scenarios)
      // Use extended timeout (90s) since narrative generation happens async in background
      const extendedTimeoutSignal = typeof AbortSignal.timeout === 'function'
        ? AbortSignal.timeout(90000)  // 90 seconds
        : undefined;

      const analysisResponse = await this.makeRequest('/api/analyze-website', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url }),
        ...(extendedTimeoutSignal && { signal: extendedTimeoutSignal })
      });

      if (onProgress) onProgress(2);
      console.log('Step 2/4: Generating audience scenarios...');

      // Step 2: Generate audience scenarios (WITHOUT pitches)
      const audiencesResponse = await this.makeRequest('/api/generate-audiences', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          analysisData: {
            businessType: analysisResponse.analysis.businessType,
            businessName: analysisResponse.analysis.businessName,
            targetAudience: analysisResponse.analysis.decisionMakers || analysisResponse.analysis.endUsers,
            businessModel: analysisResponse.analysis.businessModel,
            contentFocus: analysisResponse.analysis.contentFocus
          },
          webSearchData: analysisResponse.webSearchData || '',
          keywordData: analysisResponse.keywordData || ''
        }),
      });

      if (onProgress) onProgress(3);
      console.log('Step 3/4: Generating conversion funnel pitches...');

      // Step 3: Generate pitches for scenarios
      const pitchesResponse = await this.makeRequest('/api/generate-pitches', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          scenarios: audiencesResponse.scenarios,
          businessContext: {
            businessType: analysisResponse.analysis.businessType,
            businessName: analysisResponse.analysis.businessName
          }
        }),
      });

      if (onProgress) onProgress(4);
      console.log('Step 4/4: Generating DALL-E images for audiences...');

      // Step 4: Generate DALL-E images for each audience with brand voice context
      const imagesResponse = await this.makeRequest('/api/generate-audience-images', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          scenarios: pitchesResponse.scenarios,
          brandContext: {
            brandVoice: analysisResponse.analysis.brandVoice,
            businessType: analysisResponse.analysis.businessType,
            businessName: analysisResponse.analysis.businessName
          }
        }),
      });

      console.log('✅ All 4 steps completed successfully');
      console.log('📊 Image generation response:', imagesResponse);
      console.log('🖼️ Scenarios with images:', imagesResponse.scenarios?.map(s => ({
        demographics: s.targetSegment?.demographics,
        hasImage: !!s.imageUrl,
        imageUrl: s.imageUrl?.substring(0, 100) + '...'
      })));

      // Verify all scenarios have imageUrl
      const scenariosWithoutImages = imagesResponse.scenarios?.filter(s => !s.imageUrl) || [];
      if (scenariosWithoutImages.length > 0) {
        console.error('⚠️ Some scenarios missing imageUrl:', scenariosWithoutImages.length);
      } else {
        console.log('✅ All scenarios have imageUrl');
      }

      // Determine research quality based on webSearchStatus
      const hasEnhancedResearch = analysisResponse.analysis.webSearchStatus?.enhancementComplete ||
                                  (analysisResponse.analysis.webSearchStatus?.businessResearchSuccess &&
                                   analysisResponse.analysis.webSearchStatus?.keywordResearchSuccess);

      // Combine results into final response with proper structure
      return {
        success: true,
        url: analysisResponse.url,
        scrapedAt: analysisResponse.scrapedAt,
        analysis: {
          ...analysisResponse.analysis,
          scenarios: imagesResponse.scenarios  // Add scenarios with pitches and images to analysis
        },
        metadata: analysisResponse.metadata,
        ctas: analysisResponse.ctas,
        ctaCount: analysisResponse.ctaCount,
        hasSufficientCTAs: analysisResponse.hasSufficientCTAs,
        webSearchInsights: {
          brandResearch: hasEnhancedResearch ? 'Found actual brand guidelines' : null,
          keywordResearch: hasEnhancedResearch ? 'Current market keyword analysis completed' : null,
          researchQuality: hasEnhancedResearch ? 'enhanced' : 'basic'
        }
      };

    } catch (error) {
      throw new Error(`Failed to analyze website: ${error.message}`);
    }
  }

  /**
   * Generate trending topics for a business
   */
  async getTrendingTopics(businessType, targetAudience, contentFocus) {
    try {
      const response = await this.makeRequest('/api/trending-topics', {
        method: 'POST',
        body: JSON.stringify({
          businessType,
          targetAudience,
          contentFocus,
        }),
      });

      return response.topics || [];
    } catch (error) {
      throw new Error(`Failed to generate trending topics: ${error.message}`);
    }
  }

  /**
   * Search for tweets related to a selected topic (non-streaming).
   */
  async searchTweetsForTopic(topic, businessInfo, maxTweets = 3) {
    try {
      console.log('🐦 [FRONTEND] Searching tweets for topic:', topic.title);

      const response = await this.makeRequest('/api/tweets/search-for-topic', {
        method: 'POST',
        body: JSON.stringify({
          topic,
          businessInfo,
          maxTweets,
        }),
      });

      console.log(`✅ [FRONTEND] Found ${response.tweets?.length || 0} tweets for topic`);

      return {
        tweets: response.tweets || [],
        searchTermsUsed: response.searchTermsUsed || [],
        success: response.success || false
      };
    } catch (error) {
      console.error('❌ [FRONTEND] Tweet search failed:', error.message);
      // Return empty tweets on error - don't fail the entire flow
      return {
        tweets: [],
        searchTermsUsed: [],
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Start tweet search stream. Connect with connectToStream(connectionId, handlers, { streamUrl }).
   * Events: connected, queries-extracted ({ searchTermsUsed }), complete ({ tweets, searchTermsUsed }), error.
   * @param {Object} topic - { title, subheader, trend, seoBenefit, category }
   * @param {Object} businessInfo - { businessType, targetAudience }
   * @param {number} [maxTweets=3]
   * @returns {Promise<{ connectionId: string, streamUrl: string }>}
   */
  async searchTweetsForTopicStream(topic, businessInfo, maxTweets = 3) {
    const response = await this.makeRequest('/api/v1/tweets/search-for-topic-stream', {
      method: 'POST',
      headers: this._getStreamAuthHeaders(),
      body: JSON.stringify({
        topic,
        businessInfo: businessInfo ?? {},
        maxTweets,
      }),
    });
    return {
      connectionId: response.connectionId,
      streamUrl: response.streamUrl || this.getStreamUrl(response.connectionId),
    };
  }

  /**
   * Fetch related tweets and videos in one request (backend PR #178).
   * Use when both tweets and videos are needed; faster than two separate streams.
   * @param {Object} topic - { title, subheader?, trend?, seoBenefit?, category? }
   * @param {Object} businessInfo - { businessType, targetAudience } (from website analysis)
   * @param {{ maxTweets?: number, maxVideos?: number }} [options]
   * @returns {Promise<{ tweets: Array, videos: Array, searchTermsUsed?: { tweets?: string[], videos?: string[] } }>}
   */
  async fetchRelatedContent(topic, businessInfo, options = {}) {
    const { maxTweets = 3, maxVideos = 5 } = options;
    const payload = {
      topic: topic ?? {},
      businessInfo: {
        businessType: businessInfo?.businessType ?? 'Business',
        targetAudience: businessInfo?.targetAudience ?? 'General Audience',
      },
      maxTweets,
      maxVideos,
    };
    const relatedContentTimeoutMs = 90000; // 90s for tweets + videos
    const timeoutSignal = typeof AbortSignal.timeout === 'function'
      ? AbortSignal.timeout(relatedContentTimeoutMs)
      : undefined;
    const response = await this.makeRequest('/api/v1/enhanced-blog-generation/related-content', {
      method: 'POST',
      body: JSON.stringify(payload),
      ...(timeoutSignal && { signal: timeoutSignal }),
    });
    return {
      tweets: response.tweets ?? [],
      videos: response.videos ?? [],
      searchTermsUsed: response.searchTermsUsed ?? {},
    };
  }

  /**
   * Start news article search stream. Connect with connectToStream(connectionId, handlers, { streamUrl }).
   * Events: connected, queries-extracted ({ searchTermsUsed }), complete ({ articles, searchTermsUsed }), error.
   * @param {Object} topic - { title, subheader, trend, seoBenefit, category }
   * @param {Object} businessInfo - { businessType, targetAudience }
   * @param {number} [maxArticles=5]
   * @returns {Promise<{ connectionId: string, streamUrl: string }>}
   */
  async searchNewsArticlesForTopicStream(topic, businessInfo, maxArticles = 5) {
    const response = await this.makeRequest('/api/v1/news-articles/search-for-topic-stream', {
      method: 'POST',
      headers: this._getStreamAuthHeaders(),
      body: JSON.stringify({
        topic,
        businessInfo: businessInfo ?? {},
        maxArticles,
      }),
    });
    return {
      connectionId: response.connectionId,
      streamUrl: response.streamUrl || this.getStreamUrl(response.connectionId),
    };
  }

  /**
   * Start YouTube video search stream. Connect with connectToStream(connectionId, handlers, { streamUrl }).
   * Events: connected, queries-extracted ({ searchTermsUsed }), complete ({ videos, searchTermsUsed }), error.
   * @param {Object} topic - { title, subheader, trend, seoBenefit, category }
   * @param {Object} businessInfo - { businessType, targetAudience }
   * @param {number} [maxVideos=5]
   * @returns {Promise<{ connectionId: string, streamUrl: string }>}
   */
  async searchYouTubeVideosForTopicStream(topic, businessInfo, maxVideos = 5) {
    const response = await this.makeRequest('/api/v1/youtube-videos/search-for-topic-stream', {
      method: 'POST',
      headers: this._getStreamAuthHeaders(),
      body: JSON.stringify({
        topic,
        businessInfo: businessInfo ?? {},
        maxVideos,
      }),
    });
    return {
      connectionId: response.connectionId,
      streamUrl: response.streamUrl || this.getStreamUrl(response.connectionId),
    };
  }

  /**
   * Generate images for a saved blog post
   * Called AFTER blog generation to avoid timeout issues
   * @param {string} blogPostId - The saved blog post ID
   * @param {string} content - Content with image placeholders
   * @param {Object} topic - Blog topic information
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} Updated content with generated images
   */
  async generateImagesForBlog(blogPostId, content, topic, organizationId) {
    try {
      console.log(`🎨 [FRONTEND] Generating images for blog: ${blogPostId}`);

      const response = await this.makeRequest('/api/images/generate-for-blog', {
        method: 'POST',
        body: JSON.stringify({
          blogPostId,
          content,
          topic,
          organizationId
        }),
      });

      console.log(`✅ [FRONTEND] Image generation ${response.success ? 'completed' : 'failed'} for blog: ${blogPostId}`);

      return {
        success: response.success || false,
        content: response.content || content, // Return original if failed
        blogPostId: response.blogPostId,
        error: response.error
      };
    } catch (error) {
      console.error('❌ [FRONTEND] Image generation failed:', error.message);
      // Return original content on error - don't fail the entire flow
      return {
        success: false,
        content: content, // Return original content with placeholders
        blogPostId,
        error: error.message
      };
    }
  }

  /**
   * Generate blog post content
   */
  async generateContent(topic, businessInfo, additionalInstructions = '', tweets = null) {
    try {
      const payload = {
        topic,
        businessInfo,
        additionalInstructions,
      };

      // Include tweets if provided
      if (tweets && tweets.length > 0) {
        payload.tweets = tweets;
        console.log(`🐦 [FRONTEND] Passing ${tweets.length} tweets to blog generation`);
      }

      const response = await this.makeRequest('/api/generate-content', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return response.blogPost;
    } catch (error) {
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  /**
   * Smart Enhanced Content Generation with Automatic Enhancement Detection
   * Determines enhancement level based on available data and provides detailed feedback
   */
  async generateEnhancedContent(enhancedPayload) {
    try {
      // Smart enhancement detection
      const enhancementStatus = this.determineEnhancementCapability(enhancedPayload);
      
      console.log('🎯 Enhancement Status:', enhancementStatus);

      // Build smart payload based on available data
      const smartPayload = {
        topic: enhancedPayload.topic,
        businessInfo: enhancedPayload.businessInfo,
        additionalInstructions: enhancedPayload.additionalInstructions || '',
        // Auto-enable enhanced generation if we have organization data
        useEnhancedGeneration: enhancementStatus.canEnhance,
        ...(enhancementStatus.organizationId && {
          organizationId: enhancementStatus.organizationId,
          targetSEOScore: enhancedPayload.targetSEOScore || 95,
          includeVisuals: enhancementStatus.canGenerateVisuals,
          iterativeOptimization: enhancedPayload.iterativeOptimization || false
        })
      };

      // Include tweets if provided
      if (enhancedPayload.tweets && enhancedPayload.tweets.length > 0) {
        smartPayload.tweets = enhancedPayload.tweets;
        console.log(`🐦 [FRONTEND] Passing ${enhancedPayload.tweets.length} tweets to enhanced blog generation`);
      }

      const response = await this.makeRequest('/api/generate-content', {
        method: 'POST',
        body: JSON.stringify(smartPayload),
      });

      // Return enhanced response with status feedback
      return {
        blogPost: response.blogPost,
        enhancementStatus: enhancementStatus,
        enhanced: response.enhanced || false,
        qualityPrediction: response.qualityPrediction,
        visualSuggestions: response.visualSuggestions || [],
        optimization: response.optimization,
        metadata: response.metadata || {},
        generationTimeMs: response.generationTimeMs,
        // CRITICAL: Include image generation metadata
        imageGeneration: response.imageGeneration
      };
    } catch (error) {
      console.log('Enhanced endpoint not available, falling back to client-side enhancement');
      return this.generateContentWithClientEnhancement(enhancedPayload);
    }
  }

  /**
   * Determine enhancement capability based on available organization data
   * Returns detailed status and feedback for UI display
   */
  determineEnhancementCapability(enhancedPayload) {
    const organizationId = enhancedPayload.organizationId || 
                          enhancedPayload.currentOrganization?.id ||
                          enhancedPayload.comprehensiveContext?.organizationId;
    
    const hasWebsiteAnalysis = !!(enhancedPayload.comprehensiveContext?.websiteAnalysis ||
                                enhancedPayload.websiteAnalysis);
    
    const hasManualInputs = !!(enhancedPayload.manualInputs && 
                             Object.keys(enhancedPayload.manualInputs).length > 0);
    
    const canEnhance = !!(organizationId && (hasWebsiteAnalysis || hasManualInputs));
    
    // Determine specific capabilities
    let status = 'basic';
    let message = '';
    let reasons = [];
    let capabilities = [];
    
    if (!organizationId) {
      status = 'basic';
      message = 'Using basic generation - no organization data available';
      reasons.push('No organization ID provided');
    } else if (!hasWebsiteAnalysis && !hasManualInputs) {
      status = 'limited';
      message = 'Limited enhancement - organization found but no content analysis data';
      reasons.push('No website analysis completed', 'No manual inputs provided');
      capabilities.push('Basic SEO targeting', 'Standard content structure');
    } else {
      status = 'enhanced';
      message = 'Full enhancement enabled - using organization data for 95+ SEO targeting';
      
      if (hasWebsiteAnalysis) {
        capabilities.push('Website analysis integration', 'Brand voice matching', 'CTA optimization');
      }
      
      if (hasManualInputs) {
        capabilities.push('Manual input integration', 'Custom brand guidelines');
      }
      
      capabilities.push('95+ SEO score targeting', 'Visual content suggestions', 'Enhanced prompts');
    }
    
    return {
      canEnhance,
      organizationId,
      status, // 'basic', 'limited', 'enhanced'
      message,
      reasons,
      capabilities,
      hasWebsiteAnalysis,
      hasManualInputs,
      canGenerateVisuals: canEnhance, // Visual generation available with enhanced mode
      dataCompleteness: hasWebsiteAnalysis && hasManualInputs ? 'high' :
                       hasWebsiteAnalysis || hasManualInputs ? 'medium' : 'low'
    };
  }

  /**
   * Generate content with client-side enhancement when backend enhanced endpoint is not available
   */
  async generateContentWithClientEnhancement(enhancedPayload) {
    try {
      // Use existing generateContent with enhanced instructions
      const fallbackInstructions = this.buildEnhancedInstructions(
        enhancedPayload.comprehensiveContext, 
        enhancedPayload.strategicCTAs
      );

      const standardResponse = await this.generateContent(
        enhancedPayload.topic,
        enhancedPayload.businessInfo,
        fallbackInstructions
      );

      // Generate client-side metadata analysis with AI enhancement
      const enhancedMetadata = await this.generateClientSideMetadata(
        standardResponse, 
        enhancedPayload.comprehensiveContext
      );

      return {
        blogPost: standardResponse,
        enhancedMetadata: enhancedMetadata,
        seoAnalysis: enhancedMetadata.seoAnalysis,
        contentQuality: enhancedMetadata.contentQuality,
        strategicElements: enhancedMetadata.strategicElements,
        improvementSuggestions: enhancedMetadata.improvementSuggestions,
        keywordOptimization: enhancedMetadata.keywordOptimization
      };
    } catch (error) {
      throw new Error(`Enhanced content generation failed: ${error.message}`);
    }
  }

  /**
   * Build enhanced instructions for fallback generation
   */
  buildEnhancedInstructions(comprehensiveContext, strategicCTAs) {
    const instructions = [];

    // Business context
    if (comprehensiveContext.businessContext) {
      instructions.push(`Business Context: ${comprehensiveContext.businessContext.industryType} company focused on ${comprehensiveContext.businessContext.businessObjectives}. Brand voice: ${comprehensiveContext.businessContext.brandTone}.`);
    }

    // SEO requirements
    if (comprehensiveContext.seoInstructions?.primaryKeywords?.length > 0) {
      instructions.push(`SEO Focus: Target keywords: ${comprehensiveContext.seoInstructions.primaryKeywords.join(', ')}. Include these naturally throughout the content.`);
    }

    // Formatting requirements
    instructions.push(`Format: IMPORTANT - Use clean markdown formatting with proper headings (## for main sections, ### for subsections), bullet points (-), numbered lists (1., 2., 3.), and paragraph breaks. Add blank lines between sections.`);

    // Strategic CTAs
    if (strategicCTAs) {
      instructions.push(`Strategic CTAs: Include "${strategicCTAs.primary}" as primary CTA. Place CTAs ${strategicCTAs.placement?.join(' and ') || 'at end of content'}.`);
    }

    return instructions.join(' ');
  }

  /**
   * Generate client-side metadata analysis for enhanced response
   * Hybrid approach: Fast metrics + OpenAI educational explanations
   */
  async generateClientSideMetadata(content, comprehensiveContext) {
    const contentText = content?.content || content || '';
    const wordCount = contentText.split(/\s+/).length;
    const sentences = contentText.split(/[.!?]+/).length;
    const paragraphs = contentText.split(/\n\s*\n/).length;

    // Fast client-side metrics (instant)
    const fastMetrics = {
      generationTimestamp: new Date().toISOString(),
      contentStrategy: comprehensiveContext.contentStrategy,
      
      seoAnalysis: {
        wordCount: wordCount,
        headingStructure: this.analyzeHeadings(contentText),
        keywordDensity: this.analyzeKeywordDensity(contentText, comprehensiveContext.seoInstructions?.primaryKeywords || []),
        readabilityScore: this.calculateReadabilityScore(contentText, sentences, wordCount),
        metaDescription: this.extractMetaDescription(contentText),
        internalLinkOpportunities: this.identifyLinkOpportunities(contentText)
      },

      contentQuality: {
        overallScore: this.calculateQualityScore(wordCount, sentences, paragraphs),
        structureScore: this.analyzeStructure(contentText),
        engagementScore: this.analyzeEngagement(contentText),
        clarityScore: this.analyzeClarity(contentText, sentences, wordCount),
        actionabilityScore: this.analyzeActionability(contentText)
      },

      strategicElements: {
        ctaPresence: this.detectCTAs(contentText),
        valuePropositions: this.extractValueProps(contentText),
        credibilitySignals: this.detectCredibilitySignals(contentText),
        emotionalHooks: this.detectEmotionalHooks(contentText)
      },

      improvementSuggestions: this.generateImprovementSuggestions(contentText, wordCount, comprehensiveContext),

      keywordOptimization: this.analyzeKeywordOptimization(contentText, comprehensiveContext.seoInstructions?.primaryKeywords || [])
    };

    // Try to enhance with OpenAI explanations
    try {
      console.log('📊 Enhancing SEO analysis with AI educational explanations...');
      const enhancedMetadata = await this.enhanceMetadataWithOpenAI(contentText, fastMetrics, comprehensiveContext);
      
      // Merge enhanced explanations with fast metrics
      return {
        ...fastMetrics,
        ...enhancedMetadata,
        aiAnalysisComplete: true
      };
    } catch (error) {
      console.log('📊 OpenAI enhancement failed, using client-side analysis only:', error.message);
      return fastMetrics;
    }
  }

  /**
   * Enhance metadata with OpenAI educational explanations
   */
  async enhanceMetadataWithOpenAI(contentText, fastMetrics, comprehensiveContext) {
    try {
      const analysisPrompt = this.buildSEOAnalysisPrompt(contentText, fastMetrics, comprehensiveContext);
      
      const response = await this.makeRequest('/api/generate-content', {
        method: 'POST',
        body: JSON.stringify({
          topic: { title: 'SEO Analysis', subheader: 'Educational SEO analysis and content insights' },
          businessInfo: {},
          prompt: analysisPrompt
        }),
      });

      if (response && response.blogPost && response.blogPost.content) {
        return this.parseSEOAnalysisResponse(response.blogPost.content, fastMetrics);
      }
      
      return {};
    } catch (error) {
      throw new Error(`OpenAI SEO analysis failed: ${error.message}`);
    }
  }

  /**
   * Build specialized prompt for SEO analysis
   */
  buildSEOAnalysisPrompt(contentText, metrics, comprehensiveContext) {
    const primaryKeywords = comprehensiveContext.seoInstructions?.primaryKeywords || [];
    
    return `You are an expert SEO educator helping someone understand why their blog post will rank well on Google. Analyze this blog post content and provide educational, specific explanations.

BLOG POST CONTENT:
"""
${contentText.substring(0, 2000)}${contentText.length > 2000 ? '...' : ''}
"""

CURRENT METRICS:
- Word Count: ${metrics.seoAnalysis.wordCount}
- Readability Score: ${metrics.seoAnalysis.readabilityScore}
- Headings: ${metrics.seoAnalysis.headingStructure.h2} H2s, ${metrics.seoAnalysis.headingStructure.h3} H3s
- Primary Keywords: ${primaryKeywords.join(', ') || 'None specified'}

INSTRUCTIONS:
1. Find specific examples from the actual blog post content
2. Explain WHY each element helps with Google ranking
3. Use an encouraging, educational tone that makes them excited about their content quality
4. Be specific - quote actual phrases from their content
5. Assume they know nothing about SEO

Please provide analysis in this JSON format:
{
  "seoStrengths": "Explain what's working well with specific examples from their content and why Google likes it",
  "contentQualityHighlights": "Point out specific phrases or sections that increase engagement with explanations",
  "strategicElementsFound": "Identify emotional language, credibility signals, or CTAs with actual quotes",
  "specificImprovements": ["List of 3-4 specific, actionable improvements with examples"],
  "whyThisRanksWell": "Compelling explanation of why this content will perform well in search results"
}`;
  }

  /**
   * Parse OpenAI SEO analysis response and merge with fast metrics
   */
  parseSEOAnalysisResponse(aiResponse, fastMetrics) {
    console.log('🔍 Raw OpenAI response:', aiResponse);
    console.log('🔍 Response length:', aiResponse?.length || 0);
    console.log('🔍 Response type:', typeof aiResponse);
    
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      console.log('🔍 JSON regex match found:', !!jsonMatch);
      
      if (!jsonMatch) {
        console.log('🔍 No JSON pattern found in response');
        throw new Error('No valid JSON found in response');
      }
      
      console.log('🔍 Extracted JSON string:', jsonMatch[0]);
      const analysis = JSON.parse(jsonMatch[0]);
      console.log('🔍 Parsed analysis object:', analysis);
      
      return {
        seoAnalysis: {
          ...fastMetrics.seoAnalysis,
          aiExplanation: analysis.seoStrengths,
          whyItRanks: analysis.whyThisRanksWell
        },
        contentQuality: {
          ...fastMetrics.contentQuality,
          aiExplanation: analysis.contentQualityHighlights
        },
        strategicElements: {
          ...fastMetrics.strategicElements,
          aiExplanation: analysis.strategicElementsFound
        },
        improvementSuggestions: [
          ...fastMetrics.improvementSuggestions,
          ...(analysis.specificImprovements || [])
        ],
        aiAnalysisComplete: true
      };
    } catch (error) {
      console.log('🔍 Parsing failed:', error.message);
      return {};
    }
  }

  // Helper methods for metadata analysis
  analyzeHeadings(content) {
    const headings = {
      h1: (content.match(/^# /gm) || []).length,
      h2: (content.match(/^## /gm) || []).length,
      h3: (content.match(/^### /gm) || []).length
    };
    return {
      ...headings,
      total: headings.h1 + headings.h2 + headings.h3,
      hierarchy: headings.h2 > 0 ? 'Good' : 'Needs Improvement'
    };
  }

  analyzeKeywordDensity(content, keywords) {
    const wordCount = content.split(/\s+/).length;
    const keywordAnalysis = {};
    
    keywords.forEach(keyword => {
      const count = (content.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
      const density = (count / wordCount * 100).toFixed(2);
      keywordAnalysis[keyword] = {
        count,
        density: parseFloat(density),
        status: density > 0.5 && density < 3 ? 'Optimal' : density === 0 ? 'Missing' : 'Overused'
      };
    });

    return keywordAnalysis;
  }

  calculateReadabilityScore(content, sentences, wordCount) {
    if (sentences === 0 || wordCount === 0) return 0;
    
    const avgSentenceLength = wordCount / sentences;
    const complexWords = (content.match(/\b\w{7,}\b/g) || []).length;
    
    // Simplified readability formula
    const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * (complexWords / wordCount));
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  calculateQualityScore(wordCount, sentences, paragraphs) {
    let score = 0;
    
    // Word count scoring (25 points)
    if (wordCount >= 1000) score += 25;
    else if (wordCount >= 500) score += 15;
    else score += 5;
    
    // Structure scoring (25 points)
    if (paragraphs >= 5) score += 25;
    else if (paragraphs >= 3) score += 15;
    else score += 5;
    
    // Sentence variety (25 points)
    const avgSentenceLength = wordCount / sentences;
    if (avgSentenceLength >= 15 && avgSentenceLength <= 25) score += 25;
    else if (avgSentenceLength >= 10 && avgSentenceLength <= 30) score += 15;
    else score += 5;
    
    // Base content quality (25 points)
    score += 25;
    
    return Math.min(100, score);
  }

  analyzeStructure(content) {
    let score = 0;
    if (content.includes('##')) score += 25; // Has headings
    if (content.includes('-') || content.includes('1.')) score += 25; // Has lists
    if (content.split('\n\n').length >= 3) score += 25; // Has paragraphs
    if (content.includes('**') || content.includes('*')) score += 25; // Has emphasis
    return score;
  }

  analyzeEngagement(content) {
    let score = 0;
    if (content.includes('?')) score += 20; // Has questions
    if (content.match(/\b(you|your)\b/gi)) score += 20; // Direct address
    if (content.match(/\b(example|case|story)\b/gi)) score += 20; // Examples
    if (content.includes('!')) score += 20; // Enthusiasm
    if (content.match(/\b(action|step|implement|try)\b/gi)) score += 20; // Action words
    return Math.min(100, score);
  }

  analyzeClarity(content, sentences, wordCount) {
    const avgSentenceLength = wordCount / sentences;
    let score = 100;
    
    if (avgSentenceLength > 30) score -= 20; // Long sentences
    if (content.match(/\b(however|nevertheless|consequently)\b/gi)?.length > 5) score -= 10; // Too much complexity
    if (content.match(/\b(the|a|an|and|or|but)\b/gi)?.length / wordCount > 0.3) score -= 10; // Filler words
    
    return Math.max(0, score);
  }

  analyzeActionability(content) {
    const actionWords = (content.match(/\b(start|begin|create|build|implement|try|use|apply|practice|learn|discover)\b/gi) || []).length;
    const steps = (content.match(/\b(step|phase|stage|first|next|then|finally)\b/gi) || []).length;
    const instructions = (content.match(/\b(should|must|need to|have to|can|will)\b/gi) || []).length;
    
    return Math.min(100, (actionWords * 10) + (steps * 15) + (instructions * 5));
  }

  extractMetaDescription(content) {
    // Extract first meaningful paragraph for meta description
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim() && !p.startsWith('#'));
    const firstParagraph = paragraphs[0]?.replace(/[#*]/g, '').trim() || '';
    return firstParagraph.substring(0, 155) + (firstParagraph.length > 155 ? '...' : '');
  }

  identifyLinkOpportunities(content) {
    const opportunities = [];
    
    // Look for terms that could be internally linked
    const linkableTerms = ['strategy', 'guide', 'tips', 'best practices', 'solutions', 'tools', 'resources'];
    linkableTerms.forEach(term => {
      if (content.toLowerCase().includes(term)) {
        opportunities.push(`Consider linking "${term}" to relevant internal pages`);
      }
    });
    
    return opportunities.slice(0, 3); // Limit to top 3
  }

  detectCTAs(content) {
    const ctaPatterns = ['contact', 'learn more', 'get started', 'sign up', 'download', 'subscribe', 'try', 'discover'];
    return ctaPatterns.some(pattern => content.toLowerCase().includes(pattern));
  }

  extractValueProps(content) {
    // Extract sentences that contain value proposition keywords
    const sentences = content.split(/[.!?]+/);
    return sentences.filter(s => 
      s.match(/\b(benefit|advantage|value|save|improve|increase|reduce|help)\b/i)
    ).slice(0, 3).map(s => s.trim());
  }

  detectCredibilitySignals(content) {
    const signals = [];
    if (content.match(/\b(\d+%|statistics?|research|study|survey|data)\b/i)) signals.push('Contains data/statistics');
    if (content.match(/\b(expert|professional|certified|experienced)\b/i)) signals.push('Appeals to authority');
    if (content.match(/\b(proven|tested|verified|validated)\b/i)) signals.push('Uses proof words');
    return signals;
  }

  detectEmotionalHooks(content) {
    const hooks = [];
    if (content.match(/\b(imagine|picture|feel|experience|discover)\b/i)) hooks.push('Sensory language');
    if (content.match(/\b(secret|hidden|exclusive|insider)\b/i)) hooks.push('Exclusivity appeal');
    if (content.match(/\b(struggle|challenge|problem|frustrated)\b/i)) hooks.push('Problem awareness');
    return hooks;
  }

  generateImprovementSuggestions(content, wordCount, context) {
    const suggestions = [];
    
    if (wordCount < 800) suggestions.push('Consider expanding content to 800+ words for better SEO performance');
    if (!content.includes('##')) suggestions.push('Add section headings to improve readability and SEO');
    if (!content.includes('-') && !content.includes('1.')) suggestions.push('Add bullet points or numbered lists for better scanability');
    if (!(content.includes('**') || content.includes('*'))) suggestions.push('Use bold or italic text to emphasize key points');
    
    // SEO-specific suggestions
    const primaryKeywords = context.seoInstructions?.primaryKeywords || [];
    primaryKeywords.forEach(keyword => {
      if (!content.toLowerCase().includes(keyword.toLowerCase())) {
        suggestions.push(`Consider including the keyword "${keyword}" in your content`);
      }
    });
    
    return suggestions.slice(0, 5); // Limit to top 5 suggestions
  }

  analyzeKeywordOptimization(content, keywords) {
    const optimization = {
      overall: 'Good',
      keywordPlacement: {},
      suggestions: []
    };

    keywords.forEach(keyword => {
      const lowerContent = content.toLowerCase();
      const lowerKeyword = keyword.toLowerCase();
      
      // Check keyword placement in different sections
      const inTitle = lowerContent.substring(0, 100).includes(lowerKeyword);
      const inFirstParagraph = lowerContent.substring(0, 300).includes(lowerKeyword);
      const inHeadings = content.match(/^##.*$/gm)?.some(h => h.toLowerCase().includes(lowerKeyword));
      
      optimization.keywordPlacement[keyword] = {
        inTitle,
        inFirstParagraph,
        inHeadings,
        optimization: (inTitle && inFirstParagraph && inHeadings) ? 'Excellent' : 
                     (inTitle || inFirstParagraph) ? 'Good' : 'Needs Improvement'
      };

      if (!inTitle) optimization.suggestions.push(`Include "${keyword}" in the title or first heading`);
      if (!inFirstParagraph) optimization.suggestions.push(`Include "${keyword}" in the first paragraph`);
    });

    return optimization;
  }

  /**
   * Export blog post in different formats
   */
  async exportContent(blogPost, format) {
    try {
      const response = await this.makeRequest('/api/export', {
        method: 'POST',
        body: JSON.stringify({
          blogPost,
          format,
        }),
      });

      // For exports, we get the raw content back
      if (response instanceof Response) {
        const blob = await response.blob();
        return blob;
      }

      return response;
    } catch (error) {
      throw new Error(`Failed to export content: ${error.message}`);
    }
  }

  /**
   * Analyze changes between two versions of content
   */
  async analyzeChanges(previousContent, newContent, customFeedback = '') {
    try {
      const response = await this.makeRequest('/api/analyze-changes', {
        method: 'POST',
        body: JSON.stringify({
          previousContent,
          newContent,
          customFeedback,
        }),
      });

      return response.analysis;
    } catch (error) {
      throw new Error(`Failed to analyze changes: ${error.message}`);
    }
  }

  // ===== PHASE 1A: COMPREHENSIVE WEBSITE ANALYSIS =====

  /**
   * Trigger comprehensive website content discovery
   */
  async discoverWebsiteContent(websiteUrl) {
    console.log(`🔍 Starting comprehensive content discovery for: ${websiteUrl}`);
    
    try {
      const response = await this.makeRequest('api/v1/analysis/discover-content', {
        method: 'POST',
        body: JSON.stringify({ websiteUrl }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.success) {
        console.log('✅ Content discovery successful:', response);
        this.clearCachedAnalysis();
        return response;
      } else {
        console.error('❌ Content discovery failed:', response);
        throw new Error(response.error || 'Content discovery failed');
      }
    } catch (error) {
      console.error('❌ Content discovery request failed:', error);
      throw error;
    }
  }

  /**
   * Analysis narration fallback: backend has no GET /api/v1/analysis/narration/analysis.
   * Poll GET /api/narrative/:organizationId until ready, then deliver narrative word-by-word to match other streams.
   */
  async _connectAnalysisNarrationFallback(organizationId, handlers = {}) {
    const onChunk = handlers.onChunk || (() => {});
    const onComplete = handlers.onComplete || (() => {});
    const onError = handlers.onError || (() => {});

    const maxPolls = 60;
    const pollIntervalMs = 2000;
    let data;

    for (let i = 0; i < maxPolls; i++) {
      try {
        data = await this.makeRequest(`api/narrative/${organizationId}`, { method: 'GET' });
      } catch (err) {
        if (handlers.onError) handlers.onError(err);
        throw err;
      }
      if (data?.ready && data?.narrative) break;
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }

    const text = data?.narrative || '';
    if (!text) {
      const err = new Error('Narrative not available');
      onError(err);
      return;
    }

    // Simulate word-by-word delivery to match audience/topic/content narration UX
    const words = text.split(/(\s+)/);
    for (const word of words) {
      onChunk({ text: word });
      if (word.trim()) await new Promise((r) => setTimeout(r, 14)); // ~30% faster than 20ms
    }
    onComplete({ text });
  }

  /**
   * Connect to narration: SSE streams for audience/topic/content (GET /api/v1/analysis/narration/...),
   * or legacy polling for analysis (GET /api/narrative/:organizationId) with simulated word-by-word delivery.
   * See: docs/narration-stream-api-frontend-handoff.md
   * @param {'audience'|'topic'|'content'|'analysis'} type - Which narration; only audience/topic/content have SSE; analysis uses legacy narrative endpoint
   * @param {{ organizationId: string, selectedAudience?: string, selectedTopic?: string }} params - organizationId required; selectedAudience for topic, selectedTopic for content
   * @param {{ onChunk: (data: { text?: string }) => void, onComplete?: (data: { text?: string }) => void, onError?: (err: Error) => void, onBusinessProfile?: (data: object) => void }} handlers
   * @returns {Promise<void>} Resolves when stream ends; rejects on HTTP error, timeout, or handler throws
   */
  async connectNarrationStream(type, params, handlers = {}) {
    const { organizationId, selectedAudience, selectedTopic, previousNarration } = params;
    if (!organizationId) {
      const err = new Error('organizationId is required for narration stream');
      if (handlers.onError) handlers.onError(err);
      throw err;
    }

    // Analysis has no SSE endpoint; use legacy GET /api/narrative/:organizationId and simulate streaming
    if (type === 'analysis') {
      return this._connectAnalysisNarrationFallback(organizationId, handlers);
    }

    const base = `${this.baseURL}/api/v1/analysis/narration/${type}`;
    const search = new URLSearchParams({ organizationId });
    if (type === 'topic' && selectedAudience != null) search.set('selectedAudience', typeof selectedAudience === 'string' ? selectedAudience : (selectedAudience?.title ?? selectedAudience?.targetSegment ?? selectedAudience?.name ?? ''));
    if (type === 'content' && selectedTopic != null) search.set('selectedTopic', typeof selectedTopic === 'string' ? selectedTopic : (selectedTopic?.title ?? selectedTopic?.topic ?? selectedTopic?.name ?? ''));
    if (previousNarration) search.set('previousNarration', previousNarration);
    const url = `${base}?${search.toString()}`;

    const headers = { Accept: 'text/event-stream' };
    const token = localStorage.getItem('accessToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    else {
      const sessionId = sessionStorage.getItem('audience_session_id');
      if (sessionId) headers['x-session-id'] = sessionId;
    }

    const NARRATION_STREAM_TIMEOUT_MS = 90000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), NARRATION_STREAM_TIMEOUT_MS);

    let response;
    try {
      response = await fetch(url, { method: 'GET', headers, signal: controller.signal });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr.name === 'AbortError') {
        const err = new Error('Narration stream timed out');
        if (handlers.onError) handlers.onError(err);
        throw err;
      }
      if (handlers.onError) handlers.onError(fetchErr);
      throw fetchErr;
    }
    if (!response.ok) {
      clearTimeout(timeoutId);
      // 404 = backend has not implemented this narration endpoint yet; still call onComplete so funnel can proceed
      if (response.status === 404) {
        const onComplete = handlers.onComplete || (() => {});
        onComplete({ text: '' });
        return;
      }
      let errMsg = `Narration stream ${response.status}`;
      try {
        const data = await response.json();
        errMsg = data.error || data.message || errMsg;
      } catch {
        try { errMsg = await response.text() || errMsg; } catch { /* ignore */ }
      }
      const err = new Error(errMsg);
      if (handlers.onError) handlers.onError(err);
      throw err;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      clearTimeout(timeoutId);
      const err = new Error('Narration stream: no body');
      if (handlers.onError) handlers.onError(err);
      throw err;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    const onChunk = handlers.onChunk || (() => {});
    const onComplete = handlers.onComplete || (() => {});

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split(/\n\n+/);
        buffer = blocks.pop() ?? '';
        for (const block of blocks) {
          let eventType = '';
          const dataParts = [];
          for (const line of block.split('\n')) {
            if (line.startsWith('event:')) eventType = line.slice(6).trim();
            else if (line.startsWith('data:')) dataParts.push(line.slice(5).trim());
          }
          const dataStr = dataParts.join('\n');
          try {
            const data = dataStr ? JSON.parse(dataStr) : {};
            if (eventType.endsWith('-chunk')) onChunk(data);
            else if (eventType.endsWith('-complete')) onComplete(data);
            else if (eventType === 'business-profile' && handlers.onBusinessProfile) {
              console.log('📊 [API] business-profile event received, calling handler');
              handlers.onBusinessProfile(data);
            }
          } catch (e) { /* skip parse errors */ }
        }
      }
      clearTimeout(timeoutId);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        const timeoutErr = new Error('Narration stream timed out');
        if (handlers.onError) handlers.onError(timeoutErr);
        throw timeoutErr;
      }
      if (handlers.onError) handlers.onError(err);
      throw err;
    }
  }

  /**
   * Get discovered blog content for organization
   */
  async getBlogContent(organizationId) {
    console.log(`📖 Fetching blog content for organization: ${organizationId}`);
    
    try {
      const response = await this.makeRequest(`api/v1/analysis/blog-content/${organizationId}`, {
        method: 'GET'
      });
      
      if (response.success) {
        console.log('✅ Blog content retrieved:', response);
        return response;
      } else {
        console.error('❌ Blog content retrieval failed:', response);
        throw new Error(response.error || 'Failed to retrieve blog content');
      }
    } catch (error) {
      console.error('❌ Blog content request failed:', error);
      throw error;
    }
  }

  /**
   * Get CTA analysis results for organization
   */
  async getCTAAnalysis(organizationId) {
    console.log(`🎯 Fetching CTA analysis for organization: ${organizationId}`);
    
    try {
      const response = await this.makeRequest(`api/v1/analysis/cta-analysis/${organizationId}`, {
        method: 'GET'
      });
      
      if (response.success) {
        console.log('✅ CTA analysis retrieved:', response);
        return response;
      } else {
        console.error('❌ CTA analysis retrieval failed:', response);
        throw new Error(response.error || 'Failed to retrieve CTA analysis');
      }
    } catch (error) {
      console.error('❌ CTA analysis request failed:', error);
      throw error;
    }
  }

  /**
   * Get internal linking analysis for organization
   */
  async getInternalLinkingAnalysis(organizationId) {
    console.log(`🔗 Fetching internal linking analysis for organization: ${organizationId}`);
    
    try {
      const response = await this.makeRequest(`api/v1/analysis/internal-links/${organizationId}`, {
        method: 'GET'
      });
      
      if (response.success) {
        console.log('✅ Internal linking analysis retrieved:', response);
        return response;
      } else {
        console.error('❌ Internal linking analysis retrieval failed:', response);
        throw new Error(response.error || 'Failed to retrieve internal linking analysis');
      }
    } catch (error) {
      console.error('❌ Internal linking analysis request failed:', error);
      throw error;
    }
  }

  /**
   * Get visual design analysis for organization
   */
  async getVisualDesignAnalysis(organizationId) {
    console.log(`🎨 Fetching visual design analysis for organization: ${organizationId}`);
    
    try {
      const response = await this.makeRequest(`api/v1/analysis/visual-design/${organizationId}`, {
        method: 'GET'
      });
      
      if (response.success) {
        console.log('✅ Visual design analysis retrieved:', response);
        return response;
      } else {
        console.error('❌ Visual design analysis retrieval failed:', response);
        throw new Error(response.error || 'Failed to retrieve visual design analysis');
      }
    } catch (error) {
      console.error('❌ Visual design analysis request failed:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive analysis summary for organization
   */
  async getComprehensiveAnalysis(organizationId) {
    console.log(`📊 Fetching comprehensive analysis for organization: ${organizationId}`);
    
    try {
      const response = await this.makeRequest(`api/v1/analysis/comprehensive-summary/${organizationId}`, {
        method: 'GET'
      });
      
      if (response.success) {
        console.log('✅ Comprehensive analysis retrieved:', response);
        return response;
      } else {
        console.error('❌ Comprehensive analysis retrieval failed:', response);
        throw new Error(response.error || 'Failed to retrieve comprehensive analysis');
      }
    } catch (error) {
      console.error('❌ Comprehensive analysis request failed:', error);
      throw error;
    }
  }

  // ===== PHASE 1A: AUTHENTICATION ENDPOINTS =====

  /**
   * Register new user with organization
   */
  async register(userData) {
    console.log(`📝 Registering new user: ${userData.email}`);
    
    try {
      const response = await this.makeRequest('api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.success) {
        console.log('✅ Registration successful:', response);
        // Store tokens
        if (response.accessToken) {
          localStorage.setItem('accessToken', response.accessToken);
        }
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        return response;
      } else {
        console.error('❌ Registration failed:', response);
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration request failed:', error);
      throw error;
    }
  }

  /**
   * Login existing user
   */
  async login(email, password) {
    console.log(`🔐 Logging in user: ${email}`);
    
    try {
      const response = await this.makeRequest('api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.success) {
        console.log('✅ Login successful:', response);
        // Store tokens
        if (response.accessToken) {
          localStorage.setItem('accessToken', response.accessToken);
        }
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        return response;
      } else {
        console.error('❌ Login failed:', response);
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login request failed:', error);
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser() {
    console.log(`👤 Fetching current user profile`);
    
    try {
      const response = await this.makeRequest('api/v1/auth/me', {
        method: 'GET'
      });
      
      if (response.success) {
        console.log('✅ User profile retrieved:', response);
        return response;
      } else {
        console.error('❌ User profile retrieval failed:', response);
        throw new Error(response.error || 'Failed to retrieve user profile');
      }
    } catch (error) {
      console.error('❌ User profile request failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken() {
    console.log(`🔄 Refreshing access token`);
    
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await this.makeRequest('api/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.success) {
        console.log('✅ Token refresh successful');
        // Store new access token
        if (response.accessToken) {
          localStorage.setItem('accessToken', response.accessToken);
        }
        return response;
      } else {
        console.error('❌ Token refresh failed:', response);
        throw new Error(response.error || 'Token refresh failed');
      }
    } catch (error) {
      console.error('❌ Token refresh request failed:', error);
      throw error;
    }
  }

  /**
   * Logout user (client-side cleanup)
   */
  async logout() {
    console.log(`🚪 Logging out user`);
    
    try {
      // Call logout endpoint (for any server-side cleanup)
      await this.makeRequest('api/v1/auth/logout', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.warn('Logout endpoint call failed:', error);
      // Continue with client-side cleanup even if server call fails
    }
    
    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.clear();
    
    console.log('✅ Logout completed');
  }

  // ===== PHASE 1A: MANUAL CONTENT UPLOAD =====

  /**
   * Upload manually entered blog posts
   */
  async uploadManualPosts(organizationId, posts) {
    console.log(`📝 Uploading ${posts.length} manual posts for organization: ${organizationId}`);
    
    try {
      const response = await this.makeRequest('api/v1/content-upload/manual-posts', {
        method: 'POST',
        body: JSON.stringify({ organizationId, posts }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.success) {
        console.log('✅ Manual posts uploaded:', response);
        return response;
      } else {
        console.error('❌ Manual posts upload failed:', response);
        throw new Error(response.error || 'Failed to upload manual posts');
      }
    } catch (error) {
      console.error('❌ Manual posts upload request failed:', error);
      throw error;
    }
  }

  /**
   * Upload blog export files (WordPress, etc.)
   */
  async uploadBlogExports(organizationId, files) {
    console.log(`📁 Uploading ${files.length} blog export files for organization: ${organizationId}`);
    
    try {
      const formData = new FormData();
      formData.append('organizationId', organizationId);
      
      // Add each file to the form data
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      
      const response = await this.makeRequest('api/v1/content-upload/blog-export', {
        method: 'POST',
        body: formData
        // Note: Don't set Content-Type for FormData, let browser set it
      });
      
      if (response.success) {
        console.log('✅ Blog exports uploaded:', response);
        return response;
      } else {
        console.error('❌ Blog exports upload failed:', response);
        throw new Error(response.error || 'Failed to upload blog exports');
      }
    } catch (error) {
      console.error('❌ Blog exports upload request failed:', error);
      throw error;
    }
  }

  /**
   * Get content upload status and history
   */
  async getUploadStatus(organizationId) {
    console.log(`📋 Fetching upload status for organization: ${organizationId}`);
    
    try {
      const response = await this.makeRequest(`api/v1/content-upload/status/${organizationId}`, {
        method: 'GET'
      });
      
      if (response.success) {
        console.log('✅ Upload status retrieved:', response);
        return response;
      } else {
        console.error('❌ Upload status retrieval failed:', response);
        throw new Error(response.error || 'Failed to retrieve upload status');
      }
    } catch (error) {
      console.error('❌ Upload status request failed:', error);
      throw error;
    }
  }

  // ─── Voice samples (voice adaptation) ─────────────────────────────────────
  /** Allowed sourceType values for voice samples. */
  get VOICE_SAMPLE_SOURCE_TYPES() {
    return ['blog_post', 'whitepaper', 'email', 'newsletter', 'social_post', 'call_summary', 'other_document'];
  }

  /** Allowed file extensions for voice sample uploads. */
  get VOICE_SAMPLE_ALLOWED_EXTENSIONS() {
    return ['.txt', '.md', '.html', '.csv', '.pdf', '.docx', '.json', '.eml'];
  }

  /**
   * Upload voice samples (multipart/form-data).
   * @param {string} organizationId - UUID of the org
   * @param {string} sourceType - one of VOICE_SAMPLE_SOURCE_TYPES
   * @param {File[]} files - up to 10 files
   * @param {{ title?: string, weight?: number }} options - optional title and weight (0.1–5.0)
   * @returns {Promise<{ success: boolean, samples: Array }>}
   */
  async uploadVoiceSamples(organizationId, sourceType, files, options = {}) {
    if (!organizationId || !sourceType || !files?.length) {
      throw new Error('organizationId, sourceType, and at least one file are required');
    }
    if (files.length > 10) {
      throw new Error('Maximum 10 files per request');
    }
    const formData = new FormData();
    formData.append('organizationId', organizationId);
    formData.append('sourceType', sourceType);
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    if (options.title != null) formData.append('title', String(options.title));
    if (options.weight != null) formData.append('weight', Number(options.weight));

    const response = await this.makeRequest('api/v1/voice-samples/upload', {
      method: 'POST',
      body: formData
    });
    if (!response.success) throw new Error(response.message || response.error || 'Upload failed');
    return response;
  }

  /**
   * List voice samples for an organization.
   * @param {string} organizationId
   * @returns {Promise<{ success: boolean, samples: Array }>}
   */
  async listVoiceSamples(organizationId) {
    if (!organizationId) throw new Error('organizationId is required');
    const response = await this.makeRequest(`api/v1/voice-samples/${organizationId}`, { method: 'GET' });
    if (!response.success) throw new Error(response.message || response.error || 'Failed to list samples');
    return response;
  }

  /**
   * Get aggregated voice profile for an organization.
   * @param {string} organizationId
   * @returns {Promise<{ success: boolean, profile: object|null }>}
   */
  async getVoiceProfile(organizationId) {
    if (!organizationId) throw new Error('organizationId is required');
    const response = await this.makeRequest(`api/v1/voice-samples/${organizationId}/profile`, { method: 'GET' });
    if (!response.success) throw new Error(response.message || response.error || 'Failed to get profile');
    return response;
  }

  /**
   * Soft-delete a voice sample.
   * @param {string} sampleId
   */
  async deleteVoiceSample(sampleId) {
    if (!sampleId) throw new Error('sampleId is required');
    const response = await this.makeRequest(`api/v1/voice-samples/${sampleId}`, { method: 'DELETE' });
    if (!response.success) throw new Error(response.message || response.error || 'Failed to delete sample');
    return response;
  }

  /**
   * Reanalyze a voice sample (queues job, sample returns to pending).
   * @param {string} sampleId
   * @returns {Promise<{ success: boolean, jobId?: string }>}
   */
  async reanalyzeVoiceSample(sampleId) {
    if (!sampleId) throw new Error('sampleId is required');
    const response = await this.makeRequest(`api/v1/voice-samples/${sampleId}/reanalyze`, { method: 'POST' });
    if (!response.success) throw new Error(response.message || response.error || 'Reanalyze failed');
    return response;
  }

  /**
   * Test API connectivity
   */
  async healthCheck() {
    try {
      const response = await this.makeRequest('/health');
      return response;
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Get API information
   */
  async getAPIInfo() {
    try {
      const response = await this.makeRequest('/api');
      return response;
    } catch (error) {
      throw new Error(`Failed to get API info: ${error.message}`);
    }
  }

  /**
   * User authentication methods (DUPLICATE REMOVED - using Phase 1A version above)
   */

  // DUPLICATE register method removed - using Phase 1A version above

  async me() {
    try {
      const response = await this.makeRequest('/api/v1/auth/me');
      return response;
    } catch (error) {
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await this.makeRequest('/api/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      return response;
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Workflow persistence methods (Phase 1)
   * These methods provide silent background saving and resumption of workflow progress
   */

  /**
   * Save workflow progress to local storage (Phase 1 - before database integration)
   */
  async saveWorkflowProgress(stepData, currentStep, userId = null) {
    try {
      const progressKey = userId ? `workflow_progress_${userId}` : 'workflow_progress_anonymous';
      const progressData = {
        stepResults: stepData,
        currentStep: currentStep,
        lastSaved: new Date().toISOString(),
        userId: userId,
        sessionId: this.getSessionId()
      };

      localStorage.setItem(progressKey, JSON.stringify(progressData));
      
      // Also save to session storage as backup
      sessionStorage.setItem('workflow_backup', JSON.stringify(progressData));

      return { success: true, savedAt: progressData.lastSaved };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get saved workflow progress
   */
  async getWorkflowProgress(userId = null) {
    try {
      const progressKey = userId ? `workflow_progress_${userId}` : 'workflow_progress_anonymous';
      const savedProgress = localStorage.getItem(progressKey);
      
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        // Check if progress is less than 24 hours old
        const saveTime = new Date(parsed.lastSaved);
        const now = new Date();
        const hoursDiff = (now - saveTime) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          return { 
            success: true, 
            progress: parsed,
            canResume: true,
            hoursAgo: Math.floor(hoursDiff)
          };
        }
      }
      
      return { success: false, progress: null, canResume: false };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Clear saved workflow progress
   */
  async clearWorkflowProgress(userId = null) {
    try {
      const progressKey = userId ? `workflow_progress_${userId}` : 'workflow_progress_anonymous';
      localStorage.removeItem(progressKey);
      sessionStorage.removeItem('workflow_backup');
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Save website analysis as a project (Phase 1 - local storage)
   */
  async saveProjectFromAnalysis(analysisData, projectName) {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required to save projects');
      }

      const projectKey = 'saved_projects';
      const existingProjects = JSON.parse(localStorage.getItem(projectKey) || '[]');
      
      const newProject = {
        id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: projectName,
        websiteUrl: analysisData.websiteUrl || analysisData.url,
        analysisData: analysisData,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        userId: this.getCurrentUserId()
      };

      existingProjects.unshift(newProject); // Add to beginning
      
      // Keep only last 50 projects to prevent storage bloat
      if (existingProjects.length > 50) {
        existingProjects.splice(50);
      }

      localStorage.setItem(projectKey, JSON.stringify(existingProjects));
      
      return { success: true, project: newProject };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get user's saved projects
   */
  async getUserProjects(userId = null) {
    try {
      const projectKey = 'saved_projects';
      const projects = JSON.parse(localStorage.getItem(projectKey) || '[]');
      
      // Filter by user if specified
      const userProjects = userId 
        ? projects.filter(p => p.userId === userId)
        : projects;

      return { 
        success: true, 
        projects: userProjects.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
      };
    } catch (error) {
      return { success: false, message: error.message, projects: [] };
    }
  }

  /**
   * Save generated content with version tracking
   */
  async saveContentVersion(postData, version = 1, projectId = null) {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required to save content');
      }

      const contentKey = 'saved_posts';
      const existingPosts = JSON.parse(localStorage.getItem(contentKey) || '[]');
      
      const postId = postData.id || `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newPost = {
        id: postId,
        title: postData.title,
        content: postData.content,
        version: version,
        projectId: projectId,
        topicData: postData.topicData || null,
        strategy: postData.strategy || null,
        generationMetadata: postData.generationMetadata || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: this.getCurrentUserId(),
        exportCount: 0,
        status: 'draft'
      };

      // Check if this is a new version of existing post
      const existingPostIndex = existingPosts.findIndex(p => 
        p.id === postId || (p.title === postData.title && p.projectId === projectId)
      );

      if (existingPostIndex >= 0) {
        // Update existing post
        const existingPost = existingPosts[existingPostIndex];
        newPost.version = (existingPost.version || 1) + 1;
        newPost.createdAt = existingPost.createdAt; // Keep original creation date
        existingPosts[existingPostIndex] = newPost;
      } else {
        // Add new post
        existingPosts.unshift(newPost);
      }

      // Keep only last 100 posts
      if (existingPosts.length > 100) {
        existingPosts.splice(100);
      }

      localStorage.setItem(contentKey, JSON.stringify(existingPosts));
      
      return { success: true, post: newPost };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get user's blog posts
   */
  async getBlogPosts(userId = null, projectId = null) {
    try {
      const contentKey = 'saved_posts';
      let posts = JSON.parse(localStorage.getItem(contentKey) || '[]');
      
      // Filter by user if specified
      if (userId) {
        posts = posts.filter(p => p.userId === userId);
      }

      // Filter by project if specified
      if (projectId) {
        posts = posts.filter(p => p.projectId === projectId);
      }

      return { 
        success: true, 
        posts: posts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      };
    } catch (error) {
      return { success: false, message: error.message, posts: [] };
    }
  }

  /**
   * Track content export for analytics
   */
  async trackContentExport(postId, exportFormat) {
    try {
      const contentKey = 'saved_posts';
      const posts = JSON.parse(localStorage.getItem(contentKey) || '[]');
      const postIndex = posts.findIndex(p => p.id === postId);
      
      if (postIndex >= 0) {
        posts[postIndex].exportCount = (posts[postIndex].exportCount || 0) + 1;
        posts[postIndex].lastExportedAt = new Date().toISOString();
        posts[postIndex].lastExportFormat = exportFormat;
        
        localStorage.setItem(contentKey, JSON.stringify(posts));
      }

      // Track export analytics
      this.trackUserActivity('content_export', {
        postId: postId,
        format: exportFormat,
        exportCount: posts[postIndex]?.exportCount || 1
      });

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Track user activity for analytics (Phase 1 - local storage)
   */
  async trackUserActivity(eventType, eventData = {}) {
    try {
      const activityKey = 'user_activity';
      const activities = JSON.parse(localStorage.getItem(activityKey) || '[]');
      
      const activity = {
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventType: eventType,
        eventData: eventData,
        timestamp: new Date().toISOString(),
        sessionId: this.getSessionId(),
        userId: this.getCurrentUserId(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      activities.unshift(activity);

      // Keep only last 1000 activities to prevent storage bloat
      if (activities.length > 1000) {
        activities.splice(1000);
      }

      localStorage.setItem(activityKey, JSON.stringify(activities));
      
      return { success: true, activity: activity };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get recent user activities for dashboard
   */
  async getRecentActivities(limit = 20) {
    try {
      const activityKey = 'user_activity';
      const activities = JSON.parse(localStorage.getItem(activityKey) || '[]');
      
      return { 
        success: true, 
        activities: activities.slice(0, limit)
      };
    } catch (error) {
      return { success: false, message: error.message, activities: [] };
    }
  }

  /**
   * Utility methods
   */

  /**
   * Get or create session ID for anonymous tracking
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('autoblog_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('autoblog_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Admin API methods for user management and impersonation
   */
  
  // Get all users for admin management
  async getAdminUsers(options = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(options).forEach(key => {
        if (options[key] !== undefined && options[key] !== null) {
          queryParams.append(key, options[key]);
        }
      });
      
      const endpoint = queryParams.toString() 
        ? `/api/v1/admin/users?${queryParams.toString()}`
        : '/api/v1/admin/users';
      
      const response = await this.makeRequest(endpoint);
      return response;
    } catch (error) {
      throw new Error(`Failed to get admin users: ${error.message}`);
    }
  }

  // Get specific user details for admin
  async getAdminUserDetails(userId) {
    try {
      const response = await this.makeRequest(`/api/v1/admin/users/${userId}`);
      return response;
    } catch (error) {
      throw new Error(`Failed to get user details: ${error.message}`);
    }
  }

  // Start impersonation session
  async startImpersonation(userId) {
    try {
      const response = await this.makeRequest(`/api/v1/admin/impersonate/${userId}`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to start impersonation: ${error.message}`);
    }
  }

  // End impersonation session
  async endImpersonation() {
    try {
      const response = await this.makeRequest('/api/v1/admin/impersonate', {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to end impersonation: ${error.message}`);
    }
  }

  /**
   * Get usage statistics for dashboard
   */
  async getUsageStatistics() {
    try {
      const activities = JSON.parse(localStorage.getItem('user_activity') || '[]');
      const posts = JSON.parse(localStorage.getItem('saved_posts') || '[]');
      const projects = JSON.parse(localStorage.getItem('saved_projects') || '[]');

      const stats = {
        totalGenerations: activities.filter(a => a.eventType === 'content_generation').length,
        totalProjects: projects.length,
        totalPosts: posts.length,
        totalExports: posts.reduce((sum, p) => sum + (p.exportCount || 0), 0),
        recentActivity: activities.filter(a => {
          const activityDate = new Date(a.timestamp);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return activityDate > weekAgo;
        }).length
      };

      return { success: true, stats: stats };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * =========================================================================
   * REFERRAL SYSTEM API METHODS
   * =========================================================================
   */

  /**
   * Generate user's personal referral link
   */
  async generateReferralLink() {
    try {
      const response = await this.makeRequest('/api/v1/referrals/link', {
        method: 'GET',
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate referral link: ${error.message}`);
    }
  }

  /**
   * Send referral invitation for customer acquisition (with $15 rewards)
   */
  async sendReferralInvite(email, personalMessage = '') {
    try {
      const response = await this.makeRequest('/api/v1/referrals/invite', {
        method: 'POST',
        body: JSON.stringify({
          email,
          personalMessage,
        }),
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send referral invite: ${error.message}`);
    }
  }

  /**
   * Get comprehensive referral statistics and earnings
   */
  async getReferralStats() {
    try {
      const response = await this.makeRequest('/api/v1/referrals/stats', {
        method: 'GET',
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get referral stats: ${error.message}`);
    }
  }

  /**
   * =========================================================================
   * ORGANIZATION MANAGEMENT API METHODS  
   * =========================================================================
   */

  /**
   * Send organization team member invitation (no rewards)
   */
  async sendOrganizationInvite(email, role = 'member') {
    try {
      const response = await this.makeRequest('/api/v1/organization/invite', {
        method: 'POST',
        body: JSON.stringify({
          email,
          role,
        }),
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send organization invite: ${error.message}`);
    }
  }

  /**
   * Get organization members list with roles and details
   */
  async getOrganizationMembers() {
    try {
      const response = await this.makeRequest('/api/v1/organization/members', {
        method: 'GET',
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get organization members: ${error.message}`);
    }
  }

  /**
   * Remove organization member
   */
  async removeOrganizationMember(memberId) {
    try {
      const response = await this.makeRequest(`/api/v1/organization/members/${memberId}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to remove organization member: ${error.message}`);
    }
  }

  /**
   * Process referral signup and grant rewards (called during registration)
   */
  async processReferralSignup(userId, inviteCode) {
    try {
      const response = await this.makeRequest('/api/v1/referrals/process-signup', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          inviteCode,
        }),
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to process referral signup: ${error.message}`);
    }
  }

  /**
   * User Profile Management
   */
  async updateProfile(profileData) {
    try {
      const response = await this.makeRequest('/api/v1/user/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  }

  async changePassword(oldPassword, newPassword) {
    try {
      const response = await this.makeRequest('/api/v1/user/change-password', {
        method: 'POST',
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to change password: ${error.message}`);
    }
  }

  /**
   * Get user's most recent website analysis with smart caching
   * Only applies to logged-in users to prevent redundant API calls
   */
  async getRecentAnalysis() {
    const callId = `api-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const userId = this.getCurrentUserId();
    
    // Only log cache misses for debugging
    if (!userId) {
      console.log(`🚀 [${callId}] API: getRecentAnalysis (no caching - anonymous user)`);
    }
    
    // Only apply caching for logged-in users
    if (userId) {
      const cacheKey = `recentAnalysis_${userId}`;
      const requestKey = `getRecentAnalysis_${userId}`;
      
      // Check if request already in progress
      if (activeRequests.has(requestKey)) {
        // Request deduplication in progress - no logging needed
        return activeRequests.get(requestKey);
      }
      
      // Check sessionStorage cache
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const cachedData = JSON.parse(cached);
          // Return cached result silently
          return cachedData.response;
        }
      } catch (error) {
        console.warn(`⚠️ [${callId}] Failed to read cache, proceeding with API call:`, error);
      }
    }
    
    // Create the API request
    const makeAPIRequest = async () => {
      try {
        let response;

        try {
          response = await this.makeRequest('/api/v1/user/recent-analysis', {
            method: 'GET',
          });
        } catch (error) {
          // Handle 404 as normal response (user has no cached analysis)
          if (error.message.includes('404') || error.message.includes('HTTP 404')) {
            response = {
              success: false,
              analysis: null,
              message: 'No cached analysis found'
            };
          } else {
            // Re-throw other errors
            throw error;
          }
        }
        
        // Cache responses for logged-in users (including 404s as they indicate "no cached analysis")
        if (userId) {
          try {
            const cacheKey = `recentAnalysis_${userId}`;
            const cacheData = {
              response,
              timestamp: Date.now()
            };
            sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
          } catch (error) {
            console.warn('Failed to cache analysis response:', error);
          }
        }
        
        return response;
      } catch (error) {
        // Only log unexpected errors (not 404s which are normal)
        if (!error.message.includes('404')) {
          console.error('Recent analysis API error:', error.message);
        }
        
        throw new Error(`Failed to get recent analysis: ${error.message}`);
      }
    };
    
    // For logged-in users, deduplicate concurrent requests
    if (userId) {
      const requestKey = `getRecentAnalysis_${userId}`;
      const requestPromise = makeAPIRequest();
      
      // Track the request to prevent duplicates
      activeRequests.set(requestKey, requestPromise);
      
      // Clean up tracking when request completes (success or failure)
      requestPromise.finally(() => {
        activeRequests.delete(requestKey);
      });
      
      return requestPromise;
    } else {
      // For anonymous users, make direct API call without caching
      return makeAPIRequest();
    }
  }

  /**
   * Billing and Credits Management
   */
  async getUserCredits() {
    try {
      const response = await this.makeRequest('/api/v1/user/credits', {
        method: 'GET',
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get user credits: ${error.message}`);
    }
  }

  async applyPendingRewards() {
    try {
      const response = await this.makeRequest('/api/v1/user/apply-rewards', {
        method: 'POST',
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to apply rewards: ${error.message}`);
    }
  }

  /**
   * Subscription Management
   */
  async getUsageHistory(limit = 30) {
    try {
      const response = await this.makeRequest(`/api/v1/user/usage-history?limit=${limit}`, {
        method: 'GET',
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get usage history: ${error.message}`);
    }
  }

  async requestPlanChange(planType, reason = '') {
    try {
      const response = await this.makeRequest('/api/v1/user/request-plan-change', {
        method: 'POST',
        body: JSON.stringify({
          planType,
          reason,
        }),
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to request plan change: ${error.message}`);
    }
  }

  /**
   * Organization Management
   */
  async updateOrganization(organizationData) {
    try {
      const response = await this.makeRequest('/api/v1/organization/profile', {
        method: 'PUT',
        body: JSON.stringify(organizationData),
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to update organization: ${error.message}`);
    }
  }

  /**
   * Headers for social-handles endpoints: same as analysis/jobs — JWT when logged in,
   * otherwise x-session-id (getOrCreateSessionId so anonymous funnel always sends a session).
   * Without either the backend returns 401 "Provide Authorization header or x-session-id."
   */
  _getSocialHandlesHeaders() {
    const token = localStorage.getItem('accessToken');
    if (token) return {};
    const sessionId = this.getOrCreateSessionId();
    return { 'x-session-id': sessionId };
  }

  /**
   * Get social handles for an organization.
   * Auth: Bearer JWT (logged in) or x-session-id (anonymous funnel; org must be linked to session from website analysis).
   * @param {string} organizationId - Organization UUID
   * @returns {Promise<{ social_handles: Object }>}
   */
  async getSocialHandles(organizationId) {
    try {
      const response = await this.makeRequest(
        `/api/v1/organizations/${organizationId}/social-handles`,
        { method: 'GET', headers: this._getSocialHandlesHeaders() }
      );
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to get social handles');
    }
  }

  /**
   * Set social handles (full replace) for an organization.
   * @param {string} organizationId - Organization UUID
   * @param {Object} socialHandles - e.g. { twitter: ["@acme"], linkedin: ["company/acme"] }
   * @returns {Promise<{ social_handles: Object }>}
   */
  async updateSocialHandles(organizationId, socialHandles) {
    try {
      const response = await this.makeRequest(
        `/api/v1/organizations/${organizationId}/social-handles`,
        {
          method: 'PATCH',
          headers: this._getSocialHandlesHeaders(),
          body: JSON.stringify({ social_handles: socialHandles }),
        }
      );
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to update social handles');
    }
  }

  /**
   * Refresh social handles by re-scraping the organization's website.
   * Org must have website_url set.
   * @param {string} organizationId - Organization UUID
   * @returns {Promise<{ social_handles: Object, message?: string }>}
   */
  async refreshSocialVoice(organizationId) {
    try {
      const response = await this.makeRequest(
        `/api/v1/organizations/${organizationId}/refresh-social-voice`,
        { method: 'POST', headers: this._getSocialHandlesHeaders() }
      );
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to refresh social handles');
    }
  }

  /**
   * Billing Management
   */
  async getBillingHistory(limit = 50) {
    try {
      const response = await this.makeRequest(`/api/v1/user/billing-history?limit=${limit}`, {
        method: 'GET',
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get billing history: ${error.message}`);
    }
  }

  async updateBillingInfo(billingData) {
    try {
      const response = await this.makeRequest('/api/v1/user/billing-info', {
        method: 'PUT',
        body: JSON.stringify(billingData),
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update billing info: ${error.message}`);
    }
  }

  /**
   * Stripe Payment Integration
   */
  async createCheckoutSession(priceId, planType) {
    try {
      const response = await this.makeRequest('/api/v1/stripe/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          priceId,
          planType
        }),
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to create checkout session: ${error.message}`);
    }
  }

  /**
   * Get Stripe Checkout Session Status
   * Used to verify payment completion after embedded checkout
   */
  async getSessionStatus(sessionId) {
    try {
      const response = await this.makeRequest(`/api/v1/stripe/session-status?session_id=${sessionId}`, {
        method: 'GET'
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to get session status: ${error.message}`);
    }
  }

  /**
   * Website Lead Management (Super Admin Only)
   */
  async getLeads(options = {}) {
    try {
      console.log('🔍 API.getLeads called with options:', options);
      
      // Build query parameters
      const params = new URLSearchParams();
      
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);
      if (options.status && options.status !== 'all') params.append('status', options.status);
      if (options.source && options.source !== 'all') params.append('source', options.source);
      if (options.minScore !== undefined) params.append('minScore', options.minScore);
      if (options.maxScore !== undefined) params.append('maxScore', options.maxScore);
      if (options.dateRange && options.dateRange !== 'all') params.append('dateRange', options.dateRange);
      if (options.search) params.append('search', options.search);
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.sortOrder) params.append('sortOrder', options.sortOrder);
      
      const queryString = params.toString();
      const url = `/api/v1/admin/leads${queryString ? '?' + queryString : ''}`;
      
      console.log('📡 Making request to URL:', url);
      console.log('🔑 Auth token present:', !!localStorage.getItem('accessToken'));
      
      const response = await this.makeRequest(url);
      
      console.log('✅ API response received:', {
        responseType: typeof response,
        responseKeys: Object.keys(response || {}),
        response: response
      });
      
      return response;
    } catch (error) {
      console.error('❌ API.getLeads error:', {
        error: error,
        errorMessage: error.message,
        errorStack: error.stack
      });
      throw new Error(`Failed to get leads: ${error.message}`);
    }
  }

  async getLeadAnalytics(dateRange = 'month') {
    try {
      const response = await this.makeRequest(`/api/v1/admin/leads/analytics?dateRange=${dateRange}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get lead analytics: ${error.message}`);
    }
  }

  async getLeadDetails(leadId) {
    try {
      const response = await this.makeRequest(`/api/v1/admin/leads/${leadId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get lead details: ${error.message}`);
    }
  }

  async updateLeadStatus(leadId, status, notes = '') {
    try {
      const response = await this.makeRequest(`/api/v1/admin/leads/${leadId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, notes }),
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update lead status: ${error.message}`);
    }
  }

  /**
   * =========================================================================
   * AUDIENCE PERSISTENCE API METHODS
   * =========================================================================
   */

  /**
   * Get or create session ID for anonymous users
   */
  getOrCreateSessionId() {
    let sessionId = localStorage.getItem('audience_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('audience_session_id', sessionId);
      console.log('🆔 Created new audience session:', sessionId);
    }
    return sessionId;
  }

  /**
   * Create audience strategy (authenticated or anonymous)
   * When authenticated, sends Authorization: Bearer <token> so backend associates the audience with the user.
   */
  async createAudience(audienceData) {
    try {
      const sessionId = this.getOrCreateSessionId();
      const token = localStorage.getItem('accessToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        headers['x-session-id'] = sessionId;
      }

      const response = await this.makeRequest('/api/v1/audiences', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...audienceData,
          ...((!token) && { session_id: sessionId })
        }),
      });
      
      console.log('✅ Audience created:', response.audience?.id);
      return response;
    } catch (error) {
      throw new Error(`Failed to create audience: ${error.message}`);
    }
  }

  /**
   * Get user's audiences (authenticated or anonymous)
   */
  async getUserAudiences(options = {}) {
    try {
      const sessionId = this.getOrCreateSessionId();
      const headers = {};
      const token = localStorage.getItem('accessToken');
      
      // Always send session ID for debugging purposes (backend will prefer JWT)
      headers['x-session-id'] = sessionId;
      
      // Debug: Log what headers we're sending
      console.log('🔍 getUserAudiences headers debug:', {
        hasToken: !!token,
        headers: headers,
        sessionId: sessionId,
        authMode: token ? 'jwt_token_with_session_fallback' : 'session_id_only'
      });

      const params = new URLSearchParams();
      if (options.organization_intelligence_id) {
        params.append('organization_intelligence_id', options.organization_intelligence_id);
      }
      if (options.project_id) {
        params.append('project_id', options.project_id);
      }
      if (options.limit) {
        params.append('limit', options.limit);
      }
      if (options.offset) {
        params.append('offset', options.offset);
      }
      if (options.testbed) {
        params.append('testbed', '1');
      }

      const queryString = params.toString();
      const url = `/api/v1/audiences${queryString ? '?' + queryString : ''}`;

      const response = await this.makeRequest(url, { headers });
      const audiences = response?.audiences ?? response?.data?.audiences;
      const normalized = audiences !== undefined ? { ...response, audiences: Array.isArray(audiences) ? audiences : [] } : response;
      console.log('📋 Loaded audiences:', normalized.audiences?.length ?? 0);
      return normalized;
    } catch (error) {
      throw new Error(`Failed to get audiences: ${error.message}`);
    }
  }

  /**
   * Get specific audience with topics and keywords.
   * @param {string} audienceId
   * @param {{ testbed?: boolean }} options - When true, append ?testbed=1 (calendar testbed page)
   */
  async getAudience(audienceId, options = {}) {
    if (!audienceId || String(audienceId).trim() === '') {
      throw new Error('Audience ID is required');
    }
    try {
      const sessionId = this.getOrCreateSessionId();
      const headers = {};
      
      // Add session ID for anonymous users
      if (!localStorage.getItem('accessToken')) {
        headers['X-Session-ID'] = sessionId;
      }

      const query = options.testbed ? '?testbed=1' : '';
      const response = await this.makeRequest(`/api/v1/audiences/${encodeURIComponent(audienceId)}${query}`, { headers });
      // Normalize: some backends return { audience } or { data: { audience } }
      const audience = response?.audience ?? response?.data?.audience;
      return audience !== undefined ? { ...response, audience } : response;
    } catch (error) {
      throw new Error(`Failed to get audience: ${error.message}`);
    }
  }

  /**
   * Request content calendar generation for an audience.
   * Backend enqueues a content_calendar job; returns existing jobId if one is already queued/running (idempotent).
   * See docs/CONTENT_CALENDAR_BACKEND_RETURN_HANDOFF.md.
   * @param {string} audienceId - Audience UUID
   * @returns {Promise<{ success: boolean, jobId: string }>} 201 new job, 200 existing job
   */
  async requestContentCalendar(audienceId) {
    if (!audienceId || String(audienceId).trim() === '') {
      throw new Error('Audience ID is required');
    }
    const response = await this.makeRequest(
      `/api/v1/audiences/${encodeURIComponent(audienceId)}/request-content-calendar`,
      { method: 'POST', body: JSON.stringify({}) }
    );
    const jobId = response?.jobId;
    if (!jobId) {
      throw new Error(response?.message || response?.error || 'No jobId returned');
    }
    return { success: true, jobId };
  }

  /**
   * Get unified content calendar (all subscribed strategies).
   * Requires JWT. Returns strategies with contentIdeas (default first 7 days shown in UI).
   * @param {{ startDate?: string, endDate?: string, testbed?: boolean }} options - testbed: append ?testbed=1 for calendar testbed
   */
  async getContentCalendar(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);
      if (options.testbed) params.append('testbed', '1');
      const queryString = params.toString();
      const url = `/api/v1/strategies/content-calendar${queryString ? '?' + queryString : ''}`;
      const response = await this.makeRequest(url);
      return response;
    } catch (error) {
      throw new Error(`Failed to get content calendar: ${error.message}`);
    }
  }

  /**
   * Update audience strategy
   */
  async updateAudience(audienceId, updates) {
    try {
      const sessionId = this.getOrCreateSessionId();
      const headers = { 'Content-Type': 'application/json' };
      
      // Add session ID for anonymous users
      if (!localStorage.getItem('accessToken')) {
        headers['X-Session-ID'] = sessionId;
      }

      const response = await this.makeRequest(`/api/v1/audiences/${audienceId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });
      
      console.log('✅ Audience updated:', audienceId);
      return response;
    } catch (error) {
      throw new Error(`Failed to update audience: ${error.message}`);
    }
  }

  /**
   * Delete audience strategy
   */
  async deleteAudience(audienceId) {
    try {
      const sessionId = this.getOrCreateSessionId();
      const headers = {};
      const token = localStorage.getItem('accessToken');
      
      // Only send session ID if NOT authenticated
      if (!token) {
        headers['x-session-id'] = sessionId;
      }

      const response = await this.makeRequest(`/api/v1/audiences/${audienceId}`, {
        method: 'DELETE',
        headers,
      });
      
      console.log('🗑️ Audience deleted:', audienceId);
      return response;
    } catch (error) {
      throw new Error(`Failed to delete audience: ${error.message}`);
    }
  }

  /**
   * =========================================================================
   * KEYWORD MANAGEMENT API METHODS
   * =========================================================================
   */

  /**
   * Add keywords to audience
   */
  async createAudienceKeywords(audienceId, keywords) {
    try {
      const sessionId = this.getOrCreateSessionId();
      const headers = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('accessToken');
      
      // Only send session ID if NOT authenticated
      if (!token) {
        headers['x-session-id'] = sessionId;
      }

      const response = await this.makeRequest('/api/v1/keywords', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          audience_id: audienceId,
          keywords: keywords
        }),
      });
      
      console.log('🏷️ Keywords created for audience:', audienceId, keywords.length);
      return response;
    } catch (error) {
      throw new Error(`Failed to create keywords: ${error.message}`);
    }
  }

  /**
   * Get keywords for audience
   */
  async getAudienceKeywords(audienceId) {
    try {
      const sessionId = this.getOrCreateSessionId();
      const headers = {};
      
      // Add session ID for anonymous users
      if (!localStorage.getItem('accessToken')) {
        headers['X-Session-ID'] = sessionId;
      }

      const response = await this.makeRequest(`/api/v1/keywords?audience_id=${audienceId}`, {
        headers,
      });
      
      return response;
    } catch (error) {
      throw new Error(`Failed to get keywords: ${error.message}`);
    }
  }

  /**
   * Update keyword
   */
  async updateKeyword(keywordId, updates) {
    try {
      const sessionId = this.getOrCreateSessionId();
      const headers = { 'Content-Type': 'application/json' };
      
      // Add session ID for anonymous users
      if (!localStorage.getItem('accessToken')) {
        headers['X-Session-ID'] = sessionId;
      }

      const response = await this.makeRequest(`/api/v1/keywords/${keywordId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });
      
      console.log('🏷️ Keyword updated:', keywordId);
      return response;
    } catch (error) {
      throw new Error(`Failed to update keyword: ${error.message}`);
    }
  }

  /**
   * Delete keyword
   */
  async deleteKeyword(keywordId) {
    try {
      const sessionId = this.getOrCreateSessionId();
      const headers = {};
      
      // Add session ID for anonymous users
      if (!localStorage.getItem('accessToken')) {
        headers['X-Session-ID'] = sessionId;
      }

      const response = await this.makeRequest(`/api/v1/keywords/${keywordId}`, {
        method: 'DELETE',
        headers,
      });
      
      console.log('🗑️ Keyword deleted:', keywordId);
      return response;
    } catch (error) {
      throw new Error(`Failed to delete keyword: ${error.message}`);
    }
  }

  /**
   * =========================================================================
   * SESSION MANAGEMENT API METHODS  
   * =========================================================================
   */

  /**
   * Create anonymous session
   */
  async createAnonymousSession() {
    try {
      const response = await this.makeRequest('/api/v1/session/create', {
        method: 'POST',
      });
      
      // Store session ID locally
      if (response.session_id) {
        sessionStorage.setItem('audience_session_id', response.session_id);
        console.log('🆔 Anonymous session created:', response.session_id);
      }
      
      return response;
    } catch (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }
  }

  /**
   * Get session data with audiences, topics, and keywords
   */
  async getSessionData(sessionId = null) {
    try {
      const targetSessionId = sessionId || this.getOrCreateSessionId();
      
      const response = await this.makeRequest(`/api/v1/session/${targetSessionId}`);
      return response;
    } catch (error) {
      throw new Error(`Failed to get session data: ${error.message}`);
    }
  }

  /**
   * Transfer session data to user account upon registration/login
   */
  async adoptSession(sessionId) {
    try {
      const response = await this.makeRequest('/api/v1/users/adopt-session', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId }),
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to adopt session: ${error.message}`);
    }
  }

  /**
   * Organization Intelligence Management (Super Admin Only)
   */
  async getOrganizations(options = {}) {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);
      if (options.search) params.append('search', options.search);
      if (options.industry && options.industry !== 'all') params.append('industry', options.industry);
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.sortOrder) params.append('sortOrder', options.sortOrder);
      
      const queryString = params.toString();
      const url = `/api/v1/admin/organizations${queryString ? '?' + queryString : ''}`;
      
      const response = await this.makeRequest(url);
      return response;
    } catch (error) {
      throw new Error(`Failed to get organizations: ${error.message}`);
    }
  }

  async getOrganizationDetails(organizationId) {
    try {
      const response = await this.makeRequest(`/api/v1/admin/organizations/${organizationId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get organization details: ${error.message}`);
    }
  }

  /**
   * ======================================================================
   * POSTS API METHODS - Session Adoption Support
   * ======================================================================
   */

  /**
   * Create a new blog post (supports both authenticated and session-based creation)
   */
  async createPost(postData) {
    try {
      console.log('📝 Creating new blog post...');
      
      const sessionId = sessionStorage.getItem('audience_session_id');
      const token = localStorage.getItem('accessToken');
      
      const headers = {};
      
      // Apply proven header pattern from audiences fix
      if (!token && sessionId) {
        headers['x-session-id'] = sessionId;
        console.log('🔍 createPost: Using session ID for anonymous user');
      } else if (token) {
        console.log('🔍 createPost: Using authentication for logged-in user');
      }
      
      const response = await this.makeRequest('/api/v1/posts', {
        method: 'POST',
        headers,
        body: JSON.stringify(postData),
      });
      
      console.log('✅ Post created successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Post creation failed:', error);
      throw new Error(`Failed to create post: ${error.message}`);
    }
  }

  /**
   * Get user's blog posts (supports both authenticated and session-based retrieval)
   */
  async getPosts() {
    try {
      console.log('📖 Retrieving blog posts...');
      
      const sessionId = sessionStorage.getItem('audience_session_id');
      const token = localStorage.getItem('accessToken');
      
      const headers = {};
      
      // Apply proven header pattern from audiences fix
      if (!token && sessionId) {
        headers['x-session-id'] = sessionId;
        console.log('🔍 getPosts: Using session ID for anonymous user');
      } else if (token) {
        console.log('🔍 getPosts: Using authentication for logged-in user');
      }
      
      const response = await this.makeRequest('/api/v1/posts', {
        method: 'GET',
        headers,
      });
      
      console.log('✅ Posts retrieved successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Posts retrieval failed:', error);
      throw new Error(`Failed to retrieve posts: ${error.message}`);
    }
  }

  /**
   * Get a single blog post by ID
   */
  async getPost(postId) {
    try {
      console.log('📖 Retrieving single post:', postId);
      
      const sessionId = sessionStorage.getItem('audience_session_id');
      const token = localStorage.getItem('accessToken');
      
      const headers = {};
      
      if (!token && sessionId) {
        headers['x-session-id'] = sessionId;
      }
      
      const response = await this.makeRequest(`/api/v1/posts/${postId}`, {
        method: 'GET',
        headers,
      });
      
      console.log('✅ Post retrieved successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Post retrieval failed:', error);
      throw new Error(`Failed to retrieve post: ${error.message}`);
    }
  }

  /**
   * Update an existing blog post
   */
  async updatePost(postId, updateData) {
    try {
      console.log('✏️ Updating post:', postId);
      
      const sessionId = sessionStorage.getItem('audience_session_id');
      const token = localStorage.getItem('accessToken');
      
      const headers = {};
      
      if (!token && sessionId) {
        headers['x-session-id'] = sessionId;
      }
      
      const response = await this.makeRequest(`/api/v1/posts/${postId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData),
      });
      
      console.log('✅ Post updated successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Post update failed:', error);
      throw new Error(`Failed to update post: ${error.message}`);
    }
  }

  /**
   * Delete a blog post
   */
  async deletePost(postId) {
    try {
      console.log('🗑️ Deleting post:', postId);
      
      const sessionId = sessionStorage.getItem('audience_session_id');
      const token = localStorage.getItem('accessToken');
      
      const headers = {};
      
      if (!token && sessionId) {
        headers['x-session-id'] = sessionId;
      }
      
      const response = await this.makeRequest(`/api/v1/posts/${postId}`, {
        method: 'DELETE',
        headers,
      });
      
      console.log('✅ Post deleted successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Post deletion failed:', error);
      throw new Error(`Failed to delete post: ${error.message}`);
    }
  }

  /**
   * Re-analyze SEO for an existing blog post
   */
  async reanalyzeSEO(postId) {
    try {
      console.log('🔍 Re-analyzing SEO for post:', postId);

      const sessionId = sessionStorage.getItem('audience_session_id');
      const token = localStorage.getItem('accessToken');

      const headers = {};

      if (!token && sessionId) {
        headers['x-session-id'] = sessionId;
      }

      const response = await this.makeRequest(`/api/v1/posts/${postId}/reanalyze-seo`, {
        method: 'POST',
        headers,
      });

      console.log('✅ SEO re-analysis complete:', response);
      return response;
    } catch (error) {
      console.error('❌ SEO re-analysis failed:', error);
      throw new Error(`Failed to re-analyze SEO: ${error.message}`);
    }
  }

  /**
   * Adopt posts session - transfer posts from session to authenticated user
   * This method is called after login/registration to move anonymous posts to user account
   */
  async adoptPostsSession(sessionId) {
    try {
      console.log('🔄 Starting posts session adoption for sessionId:', sessionId);
      
      const response = await this.makeRequest('/api/v1/posts/adopt-session', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId }),
      });
      
      console.log('✅ Posts session adoption successful:', response);
      return response;
    } catch (error) {
      console.error('❌ Posts session adoption failed:', error);
      throw new Error(`Failed to adopt posts session: ${error.message}`);
    }
  }

  /**
   * Transfer website analysis session data to user account upon registration/login
   */
  async adoptAnalysisSession(sessionId) {
    try {
      console.log('🔄 Starting website analysis session adoption for sessionId:', sessionId);
      
      const response = await this.makeRequest('/api/v1/analysis/adopt-session', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId }),
      });
      
      console.log('✅ Website analysis session adoption successful:', response);
      return response;
    } catch (error) {
      console.error('❌ Website analysis session adoption failed:', error);
      throw new Error(`Failed to adopt website analysis session: ${error.message}`);
    }
  }

  /**
   * Update existing website analysis data for authenticated user
   */
  async updateAnalysis(analysisData) {
    try {
      console.log('💾 Updating website analysis data...', analysisData);
      
      const response = await this.makeRequest('/api/v1/analysis/update', {
        method: 'PUT',
        body: JSON.stringify(analysisData),
      });
      
      console.log('✅ Analysis updated successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to update analysis:', error);
      throw new Error(`Failed to update analysis: ${error.message}`);
    }
  }

  /**
   * Confirm analysis (and optionally persist edits). Step 2 of onboarding handoff.
   * @param {string} organizationId - Required (from analysis-result or complete).
   * @param {Object} body - analysisConfirmed, analysisEdited?, editedFields?, businessName?, targetAudience?, contentFocus?, etc.
   * @returns {Promise<{ success: boolean, message?: string, organizationId?: string }>}
   */
  async confirmAnalysis(organizationId, body) {
    const response = await this.makeRequest('/api/v1/analysis/confirm', {
      method: 'POST',
      body: JSON.stringify({ organizationId, ...body }),
    });
    return response;
  }

  /**
   * Get LLM-cleaned suggestion for user-edited analysis fields (Issue #261).
   * Backend returns { suggested: { businessName?, targetAudience?, contentFocus? } } per handoff.
   * @param {{ businessName: string, targetAudience: string, contentFocus: string }} editedFields
   * @returns {Promise<{ suggested?: object, suggestion?: object }>}
   */
  async getCleanedAnalysisSuggestion(editedFields) {
    const response = await this.makeRequest('/api/v1/analysis/cleaned-edit', {
      method: 'POST',
      body: JSON.stringify({ editedFields }),
    });
    return response;
  }

  /**
   * Generate comprehensive SEO analysis for content
   * Provides AI-powered educational analysis for solopreneurs
   */
  async generateComprehensiveAnalysis(content, context = {}, postId = null) {
    try {
      console.log('🔍 Starting comprehensive SEO analysis...', {
        contentLength: content?.length || 0,
        contextProvided: !!context,
        postId
      });

      if (!content || content.trim().length < 200) {
        throw new Error('Content must be at least 200 characters long for meaningful analysis');
      }

      // Use extended timeout for comprehensive analysis (3 minutes)
      const extendedTimeoutSignal = typeof AbortSignal.timeout === 'function' 
        ? AbortSignal.timeout(180000)  // 3 minutes for comprehensive analysis
        : undefined;

      const response = await this.makeRequest('/api/v1/seo-analysis', {
        method: 'POST',
        body: JSON.stringify({
          content: content.trim(),
          context: {
            businessType: context.businessType || 'Business',
            targetAudience: context.targetAudience || 'General audience',
            primaryKeywords: context.primaryKeywords || [],
            businessGoals: context.businessGoals || 'Generate more customers through content'
          },
          postId
        }),
        ...(extendedTimeoutSignal && { signal: extendedTimeoutSignal }),
      });

      console.log('✅ Comprehensive SEO analysis completed:', {
        analysisId: response.analysisId,
        overallScore: response.analysis?.overallScore,
        fromCache: false  // Always fresh analysis now
      });

      return {
        ...response,
        fromCache: false  // Always fresh analysis now
      };
    } catch (error) {
      console.error('❌ Comprehensive SEO analysis failed:', error);
      throw new Error(`Comprehensive SEO analysis failed: ${error.message}`);
    }
  }

  /**
   * Get comprehensive SEO analysis history for user
   */
  async getAnalysisHistory(limit = 10) {
    try {
      const response = await this.makeRequest(`/api/v1/seo-analysis/history?limit=${limit}`);
      return response;
    } catch (error) {
      console.error('❌ Failed to get analysis history:', error);
      throw new Error(`Failed to get analysis history: ${error.message}`);
    }
  }

  /**
   * Get specific comprehensive SEO analysis by ID (DUPLICATE REMOVED - using Phase 1A version above)
   */

  /**
   * Trigger comprehensive content discovery and analysis (forces fresh analysis)
   */
  async triggerComprehensiveAnalysis(websiteUrl) {
    console.log(`🔍 Triggering comprehensive content discovery for: ${websiteUrl}`);

    try {
      const response = await this.makeRequest('api/v1/analysis/discover-content', {
        method: 'POST',
        body: JSON.stringify({
          websiteUrl,
          forceRefresh: true
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.success) {
        console.log('✅ Comprehensive content discovery triggered:', response);
        return response;
      } else {
        console.error('❌ Comprehensive content discovery failed:', response);
        throw new Error(response.error || 'Failed to trigger comprehensive content discovery');
      }
    } catch (error) {
      console.error('❌ Comprehensive content discovery request failed:', error);
      throw error;
    }
  }

  /**
   * Get CTAs for an organization
   * Returns top CTAs ranked by conversion potential for use in topic preview and content generation
   */
  async getOrganizationCTAs(organizationId) {
    console.log(`📊 Fetching CTAs for organization: ${organizationId}`);

    try {
      const response = await this.makeRequest(`api/v1/organizations/${organizationId}/ctas`, {
        method: 'GET',
      });

      if (response.success) {
        console.log('✅ Retrieved organization CTAs:', {
          count: response.count,
          has_sufficient_ctas: response.has_sufficient_ctas
        });
        return response;
      } else {
        console.warn('⚠️ Get organization CTAs returned no data:', response.error || response.message);
        return { success: false, ctas: [], count: 0 };
      }
    } catch (error) {
      const msg = error?.message ?? String(error);
      const is304 = error?.status === 304 || /304|Not Modified/i.test(msg);
      if (is304) {
        console.debug('[CTAs] 304 Not Modified, using empty list');
      } else {
        console.warn('⚠️ Get organization CTAs request failed, using empty list:', msg);
      }
      return { success: false, ctas: [], count: 0 };
    }
  }

  /**
   * Manually add CTAs for an organization
   * Used when website scraping didn't find enough CTAs
   */
  async addManualCTAs(organizationId, ctas) {
    console.log(`✏️ Adding manual CTAs for organization: ${organizationId}`, { count: ctas.length });

    try {
      const response = await this.makeRequest(`api/v1/organizations/${organizationId}/ctas/manual`, {
        method: 'POST',
        body: JSON.stringify({ ctas }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.success) {
        console.log('✅ Manual CTAs added successfully:', {
          ctas_added: response.ctas_added,
          has_sufficient_ctas: response.has_sufficient_ctas
        });
        return response;
      } else {
        console.error('❌ Failed to add manual CTAs:', response);
        throw new Error(response.error || 'Failed to add manual CTAs');
      }
    } catch (error) {
      console.error('❌ Add manual CTAs request failed:', error);
      throw error;
    }
  }

  /**
   * ======================================================================
   * ANALYTICS API METHODS
   * ======================================================================
   */

  /**
   * Track a single event
   */
  async trackEvent(event) {
    try {
      const response = await this.makeRequest('/api/v1/analytics/track', {
        method: 'POST',
        body: JSON.stringify(event),
      });
      return response;
    } catch (error) {
      console.error('Failed to track event:', error);
      // Don't throw - analytics failures shouldn't break the app
      return null;
    }
  }

  /**
   * Track batch of events
   */
  async trackEventBatch(events) {
    try {
      const response = await this.makeRequest('/api/v1/analytics/track-batch', {
        method: 'POST',
        body: JSON.stringify({ events }),
      });
      return response;
    } catch (error) {
      console.error('Failed to track batch events:', error);
      // Don't throw - analytics failures shouldn't break the app
      return null;
    }
  }

  /**
   * Get funnel data (superadmin only)
   */
  async getFunnelData(startDate, endDate) {
    try {
      const response = await this.makeRequest(
        `/api/v1/analytics/funnel?startDate=${startDate}&endDate=${endDate}`
      );
      return response;
    } catch (error) {
      throw new Error(`Failed to get funnel data: ${error.message}`);
    }
  }

  /**
   * Get user journey (superadmin only)
   */
  async getUserJourney(userId, limit = 100) {
    try {
      const response = await this.makeRequest(
        `/api/v1/analytics/users/${userId}/journey?limit=${limit}`
      );
      return response;
    } catch (error) {
      throw new Error(`Failed to get user journey: ${error.message}`);
    }
  }

  /**
   * Get cohort analysis (superadmin only)
   */
  async getCohortAnalysis(startDate, endDate, groupBy = 'week') {
    try {
      const response = await this.makeRequest(
        `/api/v1/analytics/cohorts?startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`
      );
      return response;
    } catch (error) {
      throw new Error(`Failed to get cohort analysis: ${error.message}`);
    }
  }

  /**
   * Get session metrics (superadmin only)
   */
  async getSessionMetrics(startDate, endDate, userId = null) {
    try {
      const params = new URLSearchParams({ startDate, endDate });
      if (userId) params.append('userId', userId);
      const response = await this.makeRequest(
        `/api/v1/analytics/sessions?${params.toString()}`
      );
      return response;
    } catch (error) {
      throw new Error(`Failed to get session metrics: ${error.message}`);
    }
  }

  /**
   * Get platform metrics (superadmin only)
   */
  async getPlatformMetrics(period = '30d') {
    try {
      const response = await this.makeRequest(
        `/api/v1/analytics/platform?period=${period}`
      );
      return response;
    } catch (error) {
      throw new Error(`Failed to get platform metrics: ${error.message}`);
    }
  }

  /**
   * Get comprehensive analytics metrics (referrals, subscriptions, revenue breakdown)
   */
  async getComprehensiveMetrics(period = '30d') {
    try {
      const response = await this.makeRequest(
        `/api/v1/analytics/comprehensive-metrics?period=${period}`
      );
      return response;
    } catch (error) {
      throw new Error(`Failed to get comprehensive metrics: ${error.message}`);
    }
  }

  /**
   * Get active users for user journey analysis
   */
  async getActiveUsers() {
    try {
      const response = await this.makeRequest('/api/v1/analytics/active-users');
      return response;
    } catch (error) {
      throw new Error(`Failed to get active users: ${error.message}`);
    }
  }

  /**
   * Get user opportunities for actionable insights
   */
  async getUserOpportunities() {
    try {
      const response = await this.makeRequest('/api/v1/analytics/user-opportunities');
      return response;
    } catch (error) {
      throw new Error(`Failed to get user opportunities: ${error.message}`);
    }
  }

  /**
   * Get analytics insights from LLM (superadmin only)
   */
  async getAnalyticsInsights(context = 'funnel', period = '30d') {
    try {
      const response = await this.makeRequest(
        `/api/v1/analytics/insights?context=${context}&period=${period}`
      );
      return response;
    } catch (error) {
      throw new Error(`Failed to get analytics insights: ${error.message}`);
    }
  }

  /**
   * Get clicks over time for usage metrics
   */
  async getClicksOverTime(startDate, endDate, interval = 'day') {
    try {
      const start = startDate.toISOString();
      const end = endDate.toISOString();
      const response = await this.makeRequest(
        `/api/v1/analytics/usage-metrics/clicks-over-time?startDate=${start}&endDate=${end}&interval=${interval}`
      );
      return response;
    } catch (error) {
      throw new Error(`Failed to get clicks over time: ${error.message}`);
    }
  }

  /**
   * Get actions over time for usage metrics
   */
  async getActionsOverTime(startDate, endDate, interval = 'hour') {
    try {
      const start = startDate.toISOString();
      const end = endDate.toISOString();
      const response = await this.makeRequest(
        `/api/v1/analytics/usage-metrics/actions-over-time?startDate=${start}&endDate=${end}&interval=${interval}`
      );
      return response;
    } catch (error) {
      throw new Error(`Failed to get actions over time: ${error.message}`);
    }
  }

  /**
   * Get active users over time for usage metrics
   */
  async getActiveUsersOverTime(startDate, endDate, interval = 'day') {
    try {
      const start = startDate.toISOString();
      const end = endDate.toISOString();
      const response = await this.makeRequest(
        `/api/v1/analytics/usage-metrics/active-users-over-time?startDate=${start}&endDate=${end}&interval=${interval}`
      );
      return response;
    } catch (error) {
      throw new Error(`Failed to get active users over time: ${error.message}`);
    }
  }

  /**
   * Get clicks by page for usage metrics
   */
  async getClicksByPage(startDate, endDate) {
    try {
      const start = startDate.toISOString();
      const end = endDate.toISOString();
      const response = await this.makeRequest(
        `/api/v1/analytics/usage-metrics/clicks-by-page?startDate=${start}&endDate=${end}`
      );
      return response;
    } catch (error) {
      throw new Error(`Failed to get clicks by page: ${error.message}`);
    }
  }

  /**
   * Get revenue over time for revenue section visualization
   */
  async getRevenueOverTime(startDate, endDate, interval = 'day') {
    try {
      const start = startDate.toISOString();
      const end = endDate.toISOString();
      const response = await this.makeRequest(
        `/api/v1/analytics/revenue-over-time?startDate=${start}&endDate=${end}&interval=${interval}`
      );
      return response;
    } catch (error) {
      throw new Error(`Failed to get revenue over time: ${error.message}`);
    }
  }

  /**
   * Get users at a specific funnel stage
   */
  async getUsersAtFunnelStage(funnelStep, startDate, endDate, excludeAdvanced = false) {
    try {
      // Dates should be YYYY-MM-DD strings, not Date objects
      const response = await this.makeRequest(
        `/api/v1/analytics/funnel/stage/${funnelStep}/users?startDate=${startDate}&endDate=${endDate}&excludeAdvanced=${excludeAdvanced}`
      );
      return response;
    } catch (error) {
      throw new Error(`Failed to get users at funnel stage: ${error.message}`);
    }
  }

  async getLeadFunnelData(startDate, endDate) {
    try {
      const response = await this.makeRequest(
        `/api/v1/analytics/lead-funnel?startDate=${startDate}&endDate=${endDate}`
      );
      return response;
    } catch (error) {
      throw new Error(`Failed to get lead funnel data: ${error.message}`);
    }
  }

  /**
   * Track a conversion step for a lead
   * @param {string} step - Conversion step name (e.g., 'analysis_started', 'view_audiences_clicked')
   * @param {object} stepData - Additional data about the step
   * @param {string} leadId - Lead ID (optional if sessionId provided)
   * @param {string} sessionId - Session ID (optional if leadId provided)
   */
  async trackLeadConversion(step, stepData = {}, leadId = null, sessionId = null) {
    try {
      const response = await this.makeRequest('/api/v1/leads/track-conversion', {
        method: 'POST',
        body: JSON.stringify({
          step,
          stepData,
          leadId,
          sessionId: sessionId || this.getSessionId()
        })
      });
      return response;
    } catch (error) {
      // Don't throw - we don't want tracking failures to break the user experience
      console.error(`Failed to track lead conversion step ${step}:`, error);
      return { success: false, error: error.message };
    }
  }

  // ========================================================================
  // STRATEGY SUBSCRIPTION METHODS (Phase 2 - Dynamic Pricing)
  // ========================================================================

  /**
   * Get pricing for a specific strategy
   * @param {string} strategyId - Strategy ID
   * @returns {Promise<object>} Pricing details (monthly, annual, posts, projectedProfit, etc.)
   */
  async getStrategyPricing(strategyId) {
    try {
      const response = await this.makeRequest(`/api/v1/strategies/${strategyId}/pricing`);
      return response;
    } catch (error) {
      throw new Error(`Failed to get strategy pricing: ${error.message}`);
    }
  }

  /**
   * Subscribe to an individual strategy
   * @param {string} strategyId - Strategy ID
   * @param {string} billingInterval - 'monthly' or 'annual'
   * @returns {Promise<object>} Stripe checkout session URL
   */
  async subscribeToStrategy(strategyId, billingInterval) {
    try {
      const response = await this.makeRequest(`/api/v1/strategies/${strategyId}/subscribe`, {
        method: 'POST',
        body: JSON.stringify({ billingInterval })
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to subscribe to strategy: ${error.message}`);
    }
  }

  /**
   * Get user's subscribed strategies
   * @returns {Promise<Array>} Array of subscribed strategies with quota information
   */
  async getSubscribedStrategies() {
    try {
      const response = await this.makeRequest('/api/v1/strategies/subscribed');
      return response;
    } catch (error) {
      throw new Error(`Failed to get subscribed strategies: ${error.message}`);
    }
  }

  /**
   * Get subscription details for a specific strategy
   * @param {string} strategyId - Strategy ID
   * @returns {Promise<object>} Subscription details (posts remaining, billing info, etc.)
   */
  async getStrategySubscription(strategyId) {
    try {
      const response = await this.makeRequest(`/api/v1/strategies/${strategyId}/subscription`);
      return response;
    } catch (error) {
      throw new Error(`Failed to get strategy subscription: ${error.message}`);
    }
  }

  /**
   * Decrement post quota for a strategy (called after content generation)
   * @param {string} strategyId - Strategy ID
   * @returns {Promise<object>} Updated quota information
   */
  async decrementStrategyPosts(strategyId) {
    try {
      const response = await this.makeRequest(`/api/v1/strategies/${strategyId}/decrement`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to decrement strategy posts: ${error.message}`);
    }
  }

  /**
   * Calculate bundle pricing for all user's strategies
   * @returns {Promise<object>} Bundle pricing with discounts
   */
  async calculateBundlePrice() {
    try {
      const response = await this.makeRequest('/api/v1/strategies/bundle/calculate');
      return response;
    } catch (error) {
      throw new Error(`Failed to calculate bundle price: ${error.message}`);
    }
  }

  /**
   * Subscribe to all strategies bundle
   * @param {string} billingInterval - 'monthly' or 'annual'
   * @returns {Promise<object>} Stripe checkout session URL
   */
  async subscribeToAllStrategies(billingInterval) {
    try {
      const response = await this.makeRequest('/api/v1/strategies/bundle/subscribe', {
        method: 'POST',
        body: JSON.stringify({ billingInterval })
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to subscribe to all strategies bundle: ${error.message}`);
    }
  }

  /**
   * Get bundle subscription details
   * @returns {Promise<object>} Bundle subscription info
   */
  async getBundleSubscription() {
    try {
      const response = await this.makeRequest('/api/v1/strategies/bundle');
      return response;
    } catch (error) {
      throw new Error(`Failed to get bundle subscription: ${error.message}`);
    }
  }

  /**
   * Cancel bundle subscription
   * @returns {Promise<object>} Cancellation confirmation
   */
  async cancelBundleSubscription() {
    try {
      const response = await this.makeRequest('/api/v1/strategies/bundle', {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to cancel bundle subscription: ${error.message}`);
    }
  }

  /**
   * Check if user has access to a specific strategy
   * @param {string} strategyId - Strategy ID
   * @returns {Promise<object>} Access status and quota information
   */
  async   checkStrategyAccess(strategyId) {
    try {
      const response = await this.makeRequest(`/api/v1/strategies/${strategyId}/access`);
      return response;
    } catch (error) {
      throw new Error(`Failed to check strategy access: ${error.message}`);
    }
  }

  // Streaming (SSE): blog, audience, bundle streams; connect via connectToStream(connectionId, handlers)

  /** Headers for stream-start requests: x-session-id when anonymous, none when JWT (makeRequest adds Authorization). */
  _getStreamAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    if (token) return {};
    const sessionId = sessionStorage.getItem('audience_session_id');
    return sessionId ? { 'x-session-id': sessionId } : {};
  }

  /**
   * Build SSE stream URL. EventSource does not send headers; auth via query.
   * Supports both logged-in (token) and anonymous/session (sessionId).
   * Prefer using streamUrl from POST response when available.
   * @param {string} connectionId - Stream connection ID from start-stream endpoint
   * @returns {string} Full URL for EventSource (includes ?token= or ?sessionId=)
   */
  getStreamUrl(connectionId) {
    const path = `/api/v1/stream/${encodeURIComponent(connectionId)}`;
    const url = `${this.baseURL}${path}`;
    const token = localStorage.getItem('accessToken');
    if (token) {
      return `${url}?token=${encodeURIComponent(token)}`;
    }
    const sessionId = sessionStorage.getItem('audience_session_id');
    if (sessionId) {
      return `${url}?sessionId=${encodeURIComponent(sessionId)}`;
    }
    return url;
  }

  /**
   * Connect to an SSE stream and dispatch events to handlers.
   * @param {string} connectionId - From generateBlogStream / generateAudiencesStream / generateTopicsStream / etc.
   * @param {Object} handlers - { onChunk?, onComplete?, onError?, onConnected?, onAudienceComplete? }
   *   - onChunk(data) - content-chunk: { field?, content }
   *   - onComplete(data) - complete: final result
   *   - onError(data) - error: { message, code? } (backend may send { error, errorCode })
   *   - onConnected() - connected
   *   - onAudienceComplete(data) - audience-complete: { audience } (audience scenarios stream)
   *   - onTopicComplete(data) - topic-complete: { topic } (topic ideas stream)
   *   - onTopicImageStart(data) - topic-image-start: { index, total, topic }
   *   - onTopicImageComplete(data) - topic-image-complete: { index, topic } (topic has image URL)
   * @param {{ streamUrl?: string }} [options] - If streamUrl is provided, use it for EventSource (auth in query).
   * @returns {{ close: function }} - Call close() to stop listening and close EventSource
   */
  connectToStream(connectionId, handlers = {}, options = {}) {
    const url = options.streamUrl && typeof options.streamUrl === 'string' ? options.streamUrl : this.getStreamUrl(connectionId);
    const eventSource = new EventSource(url);

    const close = () => {
      eventSource.close();
    };

    const parseData = (event) => {
      try {
        return JSON.parse(event.data || '{}');
      } catch (err) {
        console.warn('[SSE] Parse error:', err);
        return {};
      }
    };

    /** For content-only streams: if event.data is a non-JSON string, pass it through as the payload. */
    const parseChunkOrContent = (event) => {
      const raw = event.data;
      if (typeof raw === 'string' && raw.trim() && !raw.trim().startsWith('{') && !raw.trim().startsWith('[')) {
        return raw;
      }
      return parseData(event);
    };

    // Backend may send named SSE events (event: content-chunk, event: complete, etc.) — only named listeners receive them
    eventSource.addEventListener('connected', (event) => {
      if (handlers.onConnected) handlers.onConnected(parseData(event));
    });
    eventSource.addEventListener('content-chunk', (event) => {
      const data = parseChunkOrContent(event);
      if (handlers.onChunk) handlers.onChunk(data);
    });
    eventSource.addEventListener('audience-complete', (event) => {
      const data = parseData(event);
      if (handlers.onAudienceComplete) handlers.onAudienceComplete(data);
    });
    eventSource.addEventListener('topic-complete', (event) => {
      const data = parseData(event);
      if (handlers.onTopicComplete) handlers.onTopicComplete(data);
    });
    eventSource.addEventListener('topic-image-start', (event) => {
      const data = parseData(event);
      if (handlers.onTopicImageStart) handlers.onTopicImageStart(data);
    });
    eventSource.addEventListener('topic-image-complete', (event) => {
      const data = parseData(event);
      if (handlers.onTopicImageComplete) handlers.onTopicImageComplete(data);
    });
    eventSource.addEventListener('queries-extracted', (event) => {
      const data = parseData(event);
      if (handlers.onQueriesExtracted) handlers.onQueriesExtracted(data);
    });
    eventSource.addEventListener('complete', (event) => {
      const data = parseChunkOrContent(event);
      if (handlers.onComplete) handlers.onComplete(data);
      close();
    });
    eventSource.addEventListener('error', (event) => {
      const data = parseData(event);
      const errPayload = { message: data?.error ?? data?.message ?? 'Stream error', code: data?.errorCode };
      if (handlers.onError) handlers.onError(errPayload);
      close();
    });

    // Fallback: generic 'message' events with payload { type, data } (e.g. single-event streams)
    eventSource.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data || '{}');
        const { type, data } = payload;
        const payloadData = data ?? payload;
        switch (type) {
          case 'connected':
            if (handlers.onConnected) handlers.onConnected(payloadData);
            break;
          case 'content-chunk':
            if (handlers.onChunk) handlers.onChunk(payloadData);
            break;
          case 'complete':
            if (handlers.onComplete) handlers.onComplete(payloadData);
            close();
            break;
          case 'audience-complete':
            if (handlers.onAudienceComplete) handlers.onAudienceComplete(payloadData);
            break;
          case 'topic-complete':
            if (handlers.onTopicComplete) handlers.onTopicComplete(payloadData);
            break;
          case 'topic-image-start':
            if (handlers.onTopicImageStart) handlers.onTopicImageStart(payloadData);
            break;
          case 'topic-image-complete':
            if (handlers.onTopicImageComplete) handlers.onTopicImageComplete(payloadData);
            break;
          case 'queries-extracted':
            if (handlers.onQueriesExtracted) handlers.onQueriesExtracted(payloadData);
            break;
          case 'error':
            if (handlers.onError) handlers.onError({ message: payloadData?.error ?? payloadData?.message ?? 'Stream error', code: payloadData?.errorCode });
            close();
            break;
          default:
            break;
        }
      } catch (err) {
        console.warn('[SSE] Parse error:', err);
      }
    });

    eventSource.onerror = () => {
      if (handlers.onError) {
        handlers.onError({ message: 'Stream connection failed or closed' });
      }
      close();
    };

    return { close };
  }

  /**
   * Start trending topics generation stream (same event contract as topics stream).
   * Use when generating topics from website analysis. Connect with connectToStream(connectionId, handlers).
   * Events: topic-complete, topic-image-start, topic-image-complete, complete, error.
   * @param {Object} payload - { businessType, targetAudience, contentFocus } (all required)
   * @returns {Promise<{ connectionId: string, streamUrl: string }>}
   */
  _handleGenerateStreamResponse(response) {
    if (response && response.success === false) {
      const text = response.message || response.error || 'Request failed';
      message.error(text);
      throw new Error(text);
    }
    return response;
  }

  /** Same as generateTopicsStream: caller must open EventSource(streamUrl) immediately after return. */
  async generateTrendingTopicsStream(payload) {
    const response = await this.makeRequest('/api/v1/trending-topics/stream', {
      method: 'POST',
      headers: this._getStreamAuthHeaders(),
      body: JSON.stringify({
        businessType: payload.businessType,
        targetAudience: payload.targetAudience,
        contentFocus: payload.contentFocus || 'Content',
      }),
    });
    this._handleGenerateStreamResponse(response);
    return {
      connectionId: response.connectionId,
      streamUrl: response.streamUrl || this.getStreamUrl(response.connectionId),
    };
  }

  /**
   * Start topic ideas generation stream. Caller must open the stream (connectToStream) immediately
   * after this returns—topic generation starts when the GET /api/v1/stream/:connectionId connection
   * is created. Order: POST → get connectionId/streamUrl → open EventSource(streamUrl) (no delay).
   * @param {Object} payload - { businessType, targetAudience, contentFocus }
   * @returns {Promise<{ connectionId: string, streamUrl: string }>}
   */
  async generateTopicsStream(payload) {
    const response = await this.makeRequest('/api/v1/topics/generate-stream', {
      method: 'POST',
      headers: this._getStreamAuthHeaders(),
      body: JSON.stringify({
        businessType: payload.businessType,
        targetAudience: payload.targetAudience,
        contentFocus: payload.contentFocus || 'Content',
      }),
    });
    this._handleGenerateStreamResponse(response);
    return {
      connectionId: response.connectionId,
      streamUrl: response.streamUrl || this.getStreamUrl(response.connectionId),
    };
  }

  /**
   * Start blog post generation stream. Connect with connectToStream(connectionId, handlers).
   * @param {Object} payload - { topic, businessInfo, organizationId, additionalInstructions?, tweets? }
   * @returns {Promise<{ connectionId: string, streamUrl?: string }>}
   */
  async generateBlogStream(payload) {
    const body = {
      topic: payload.topic,
      businessInfo: payload.businessInfo ?? {},
      organizationId: payload.organizationId,
      additionalInstructions: payload.additionalInstructions || '',
      ...(payload.tweets?.length ? { tweets: payload.tweets } : {}),
      ...(payload.options && typeof payload.options === 'object' ? { options: payload.options } : {}),
      ...(payload.ctas?.length ? { ctas: payload.ctas } : {})
    };
    const response = await this.makeRequest('/api/v1/blog/generate-stream', {
      method: 'POST',
      headers: this._getStreamAuthHeaders(),
      body: JSON.stringify(body)
    });
    this._handleGenerateStreamResponse(response);
    return {
      connectionId: response.connectionId,
      streamUrl: response.streamUrl || this.getStreamUrl(response.connectionId)
    };
  }

  /**
   * Start audience scenarios generation stream.
   * @param {Object} analysis - Website analysis object
   * @param {Array} [existingAudiences] - Existing audiences to avoid duplicates
   * @returns {Promise<{ connectionId: string }>}
   */
  async generateAudiencesStream(analysis, existingAudiences = []) {
    const response = await this.makeRequest('/api/v1/audiences/generate-stream', {
      method: 'POST',
      headers: this._getStreamAuthHeaders(),
      body: JSON.stringify({ analysis, existingAudiences })
    });
    this._handleGenerateStreamResponse(response);
    return { connectionId: response.connectionId };
  }

  /**
   * Start bundle overview stream. Returns connectionId; connect with connectToStream
   * for overview text chunks. Caller should still use calculateBundlePrice() for non-streaming
   * metrics or use complete event for full bundle payload.
   * @returns {Promise<{ connectionId: string }>}
   */
  async calculateBundlePriceStream() {
    const response = await this.makeRequest('/api/v1/strategies/bundle/calculate?stream=true', {
      headers: this._getStreamAuthHeaders(),
    });
    if (response.connectionId) {
      return {
        connectionId: response.connectionId,
        bundlePricing: response.bundlePricing,
        bundleOverview: response.bundleOverview
      };
    }
    throw new Error('Streaming not supported for bundle calculate');
  }
}

// Create singleton instance
const autoBlogAPI = new AutoBlogAPI();

export default autoBlogAPI;