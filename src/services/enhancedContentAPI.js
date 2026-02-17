import autoBlogAPI from './api';
import jobsAPI from './jobsAPI';
import { ContentPromptEngine, StrategicCTABuilder } from './contentPromptEngine';
import { normalizeContentString } from '../utils/streamingUtils';

/**
 * Enhanced Content Generation API
 * Implements comprehensive OpenAI content enhancement system.
 * Uses worker queue (POST /api/v1/jobs/content-generation) for long-running tasks.
 */
export class EnhancedContentAPI {
  constructor() {
    this.promptEngine = new ContentPromptEngine();
    this.ctaBuilder = new StrategicCTABuilder();
  }

  /**
   * Build job payload matching backend /api/v1/jobs/content-generation expectations
   */
  _buildContentGenerationPayload(selectedTopic, analysisData, strategy, enhancementOptions) {
    const comprehensivePrompt = this.promptEngine.buildComprehensivePrompt(
      selectedTopic,
      analysisData,
      strategy,
      enhancementOptions
    );
    const strategicCTAs = this.ctaBuilder.buildStrategicCTAs(
      analysisData,
      strategy,
      enhancementOptions.goal
    );

    const preloadedTweets = enhancementOptions.preloadedTweets ?? enhancementOptions.tweets ?? [];
    const preloadedArticles = enhancementOptions.preloadedArticles ?? [];
    const preloadedVideos = enhancementOptions.preloadedVideos ?? [];
    const ctas = enhancementOptions.ctas ?? enhancementOptions.organizationCTAs ?? [];

    return {
      topic: selectedTopic,
      businessInfo: analysisData || {},
      organizationId: enhancementOptions.organizationId,
      ctas: Array.isArray(ctas) ? ctas : undefined,
      additionalInstructions: enhancementOptions.additionalInstructions || '',
      options: {
        autoSave: true,
        status: enhancementOptions.status || 'draft',
        includeVisuals: !!enhancementOptions.includeVisuals,
        preloadedTweets: Array.isArray(preloadedTweets) ? preloadedTweets : [],
        preloadedArticles: Array.isArray(preloadedArticles) ? preloadedArticles : [],
        preloadedVideos: Array.isArray(preloadedVideos) ? preloadedVideos : [],
        useVoiceProfile: enhancementOptions.useVoiceProfile !== false,
      },
      comprehensiveContext: comprehensivePrompt,
      strategicCTAs,
      enhancementOptions,
      requestEnhancedResponse: true,
      organizationName: enhancementOptions.organizationName,
      targetSEOScore: enhancementOptions.targetSEOScore,
      websiteAnalysis: analysisData || enhancementOptions.websiteAnalysis || enhancementOptions.comprehensiveContext?.websiteAnalysis,
      tweets: Array.isArray(preloadedTweets) ? preloadedTweets : []
    };
  }

  /**
   * Map job result (result.data, result.savedPost) to enhancedContentAPI response shape.
   * Normalizes content so fenced/raw JSON from the backend becomes displayable HTML/text only.
   */
  _mapResultToResponse(result, comprehensivePrompt, strategicCTAs, selectedTopic) {
    const data = result.data || {};
    const savedPost = result.savedPost;
    const blogPost = savedPost || data.blogPost || data;
    const rawContent = blogPost?.content || data.content || (typeof blogPost === 'string' ? blogPost : undefined);
    const content = typeof rawContent === 'string' ? normalizeContentString(rawContent) : rawContent;

    const ctas = (result.data && result.data.ctas) || result.ctas || data.ctas || [];
    const normalizedCtas = Array.isArray(ctas)
      ? ctas.map((c) => (typeof c === 'object' && c !== null ? { text: c.text ?? '', href: c.href, type: c.type, placement: c.placement } : { text: String(c) }))
      : [];

    return {
      success: true,
      content: content ?? '',
      ctas: normalizedCtas,
      visualSuggestions: data.visualSuggestions || [],
      enhancedMetadata: data.enhancedMetadata || {
        seoAnalysis: data.seoAnalysis,
        contentQuality: data.contentQuality,
        strategicElements: data.strategicElements,
        improvementSuggestions: data.improvementSuggestions,
        keywordOptimization: data.keywordOptimization,
        visualSuggestions: data.visualSuggestions || []
      },
      seoAnalysis: data.seoAnalysis,
      contentQuality: data.contentQuality,
      strategicElements: data.strategicElements,
      improvementSuggestions: data.improvementSuggestions,
      keywordOptimization: data.keywordOptimization,
      generationContext: comprehensivePrompt,
      strategicCTAs,
      selectedTopic,
      blogPost,
      imageGeneration: data.imageGeneration || result.imageGeneration,
      voiceAdaptationUsed: result.voiceAdaptationUsed ?? data.voiceAdaptationUsed,
      voiceProfileConfidence: result.voiceProfileConfidence ?? data.voiceProfileConfidence
    };
  }

  /**
   * Generate enhanced content via worker queue
   * POST /api/v1/jobs/content-generation → prefer job stream, fall back to poll until succeeded/failed
   */
  async generateEnhancedContent(selectedTopic, analysisData, strategy = null, enhancementOptions = {}) {
    const {
      onProgress,
      onContextResult,
      onBlogResult,
      onVisualsResult,
      onSeoResult,
      ...restOptions
    } = enhancementOptions;
    let comprehensivePrompt;
    let strategicCTAs;

    try {
      console.log('🔧 Enhanced content generation starting (worker queue):', {
        hasStrategy: !!strategy,
        strategyKeys: strategy ? Object.keys(strategy) : 'null',
        enhancementOptions
      });

      const payload = this._buildContentGenerationPayload(
        selectedTopic,
        analysisData,
        strategy,
        restOptions
      );
      comprehensivePrompt = payload.comprehensiveContext;
      strategicCTAs = payload.strategicCTAs;

      // 1. Create job
      let jobId;
      try {
        const createResponse = await jobsAPI.createContentGenerationJob(payload);
        jobId = createResponse.jobId;
      } catch (err) {
        if (err.status === 503) {
          return {
            success: false,
            error: 'Service temporarily unavailable. The content generation queue is not available. Please try again later.',
            queueUnavailable: true
          };
        }
        throw err;
      }

      console.log('📋 Content generation job created:', jobId);

      // 2. Prefer job stream for real-time progress; fall back to polling if stream unavailable
      let finalStatus = null;
      try {
        finalStatus = await jobsAPI.connectToJobStream(jobId, {
          onProgress: (data) => {
            if (onProgress) onProgress(data);
          },
          onContextResult: (data) => {
            if (onContextResult) onContextResult(data);
          },
          onBlogResult: (data) => {
            if (onBlogResult) onBlogResult(data);
          },
          onVisualsResult: (data) => {
            if (onVisualsResult) onVisualsResult(data);
          },
          onSeoResult: (data) => {
            if (onSeoResult) onSeoResult(data);
          }
        });
      } catch (streamErr) {
        console.warn('Content generation job stream not available, falling back to polling:', streamErr?.message);
        finalStatus = await jobsAPI.pollJobStatus(jobId, {
          onProgress,
          pollIntervalMs: 2500,
          maxAttempts: 120
        });
      }

      if (finalStatus.status === 'failed') {
        return {
          success: false,
          error: finalStatus.error || 'Content generation failed',
          errorCode: finalStatus.errorCode,
          jobId,
          retryable: finalStatus.retryable ?? true
        };
      }

      const result = finalStatus.result;
      if (!result) {
        return {
          success: false,
          error: 'No result received from job'
        };
      }

      // Map result (result.data, result.savedPost) to response shape
      const response = this._mapResultToResponse(
        result,
        comprehensivePrompt,
        strategicCTAs,
        selectedTopic
      );

      // 3. Generate images in background for progressive UX – return immediately with placeholders
      const imageGen = result.imageGeneration || result.data?.imageGeneration;
      if (imageGen?.needsImageGeneration && imageGen.blogPostId) {
        console.log('🎨 Triggering image generation in background...');
        response.imageGenerationPromise = autoBlogAPI
          .generateImagesForBlog(
            imageGen.blogPostId,
            response.content,
            imageGen.topic,
            imageGen.organizationId
          )
          .then((imageResult) => {
            if (imageResult.success) {
              return imageResult.content;
            }
            return response.content;
          })
          .catch((imageError) => {
            console.error('❌ Image generation error:', imageError.message);
            return response.content;
          });
      }

      return response;
    } catch (error) {
      console.error('Enhanced content generation error:', error);
      return {
        success: false,
        error: error.message,
        fallbackAvailable: true
      };
    }
  }

  /**
   * Retry a failed content generation job
   * POST /api/v1/jobs/:jobId/retry → prefer job stream, fall back to poll until succeeded/failed
   * @param {string} jobId - Job ID from failed response
   * @param {{ onProgress?: (status) => void }} options
   */
  async retryContentGenerationJob(jobId, options = {}) {
    const { onProgress, onContextResult, onBlogResult, onVisualsResult, onSeoResult } = options;
    try {
      await jobsAPI.retryJob(jobId);
      let finalStatus = null;
      try {
        finalStatus = await jobsAPI.connectToJobStream(jobId, {
          onProgress: (data) => {
            if (onProgress) onProgress(data);
          },
          onContextResult: (data) => {
            if (onContextResult) onContextResult(data);
          },
          onBlogResult: (data) => {
            if (onBlogResult) onBlogResult(data);
          },
          onVisualsResult: (data) => {
            if (onVisualsResult) onVisualsResult(data);
          },
          onSeoResult: (data) => {
            if (onSeoResult) onSeoResult(data);
          }
        });
      } catch (streamErr) {
        console.warn('Content generation job stream not available, falling back to polling:', streamErr?.message);
        finalStatus = await jobsAPI.pollJobStatus(jobId, {
          onProgress,
          pollIntervalMs: 2500,
          maxAttempts: 120
        });
      }
      if (finalStatus.status === 'failed') {
        return {
          success: false,
          error: finalStatus.error || 'Content generation failed',
          errorCode: finalStatus.errorCode,
          jobId,
          retryable: true
        };
      }
      const result = finalStatus.result;
      if (!result) {
        return { success: false, error: 'No result received from job' };
      }
      const data = result.data || {};
      const response = this._mapResultToResponse(
        result,
        data.generationContext || '',
        data.strategicCTAs || [],
        data.selectedTopic || {}
      );
      const imageGen = result.imageGeneration || result.data?.imageGeneration;
      if (imageGen?.needsImageGeneration && imageGen.blogPostId) {
        response.imageGenerationPromise = autoBlogAPI
          .generateImagesForBlog(
            imageGen.blogPostId,
            response.content,
            imageGen.topic,
            imageGen.organizationId
          )
          .then((imageResult) =>
            imageResult.success ? imageResult.content : response.content
          )
          .catch(() => response.content);
      }
      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        fallbackAvailable: true
      };
    }
  }

  /**
   * Generate content with AI feedback loop (for future implementation)
   */
  async generateWithFeedbackLoop(topic, analysisData, strategy, _previousVersions = []) {
    // This will be implemented in a future phase
    // For now, return standard generation
    return this.generateEnhancedContent(topic, analysisData, strategy);
  }

  /**
   * Analyze content changes and provide explanations (for future implementation)
   */
  async analyzeContentChanges(previousContent, newContent, userFeedback = '') {
    try {
      const changes = await autoBlogAPI.analyzeChanges(previousContent, newContent, userFeedback);
      return {
        success: true,
        changes: changes,
        explanations: this.buildChangeExplanations(changes),
        suggestions: this.buildImprovementSuggestions(changes)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build change explanations for user understanding
   */
  buildChangeExplanations(_changes) {
    // This will provide detailed explanations of why changes were made
    return {
      structuralChanges: 'Explanations of structural improvements',
      contentChanges: 'Explanations of content enhancements',
      seoChanges: 'Explanations of SEO optimizations'
    };
  }

  /**
   * Build improvement suggestions based on analysis
   */
  buildImprovementSuggestions(_changes) {
    return [
      'Suggested improvements based on content analysis',
      'SEO optimization recommendations',
      'Engagement enhancement suggestions'
    ];
  }
}

// Export singleton instance
export const enhancedContentAPI = new EnhancedContentAPI();
export default enhancedContentAPI;