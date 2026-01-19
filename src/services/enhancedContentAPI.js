import autoBlogAPI from './api';
import { ContentPromptEngine, StrategicCTABuilder } from './contentPromptEngine';

/**
 * Enhanced Content Generation API
 * Implements comprehensive OpenAI content enhancement system
 */
export class EnhancedContentAPI {
  constructor() {
    this.promptEngine = new ContentPromptEngine();
    this.ctaBuilder = new StrategicCTABuilder();
  }

  /**
   * Generate enhanced content with comprehensive context
   * Implements the approved OpenAI enhancement plan
   */
  async generateEnhancedContent(selectedTopic, analysisData, strategy = null, enhancementOptions = {}) {
    try {
      console.log('🔧 Enhanced content generation starting:', { 
        hasStrategy: !!strategy, 
        strategyKeys: strategy ? Object.keys(strategy) : 'null',
        enhancementOptions 
      });
      
      // Build comprehensive prompt using new engine
      const comprehensivePrompt = this.promptEngine.buildComprehensivePrompt(
        selectedTopic, 
        analysisData, 
        strategy, 
        enhancementOptions
      );

      // Build strategic CTAs
      const strategicCTAs = this.ctaBuilder.buildStrategicCTAs(
        analysisData, 
        strategy, 
        enhancementOptions.goal
      );

      // Create enhanced payload for backend
      const enhancedPayload = {
        topic: selectedTopic,
        businessInfo: analysisData,
        comprehensiveContext: comprehensivePrompt,
        strategicCTAs: strategicCTAs,
        enhancementOptions: enhancementOptions,
        requestEnhancedResponse: true, // Flag for backend to return enhanced structure
        // Extract organization data from enhancementOptions for API detection
        organizationId: enhancementOptions.organizationId,
        organizationName: enhancementOptions.organizationName,
        targetSEOScore: enhancementOptions.targetSEOScore,
        includeVisuals: enhancementOptions.includeVisuals,
        // Pass website analysis for enhancement detection - try multiple possible sources
        websiteAnalysis: analysisData || enhancementOptions.websiteAnalysis || enhancementOptions.comprehensiveContext?.websiteAnalysis,
        // Pass tweets if provided
        tweets: enhancementOptions.tweets
      };

      // Call enhanced generation endpoint with rich metadata
      console.log('📊 Requesting enhanced content with comprehensive metadata...');
      const response = await autoBlogAPI.generateEnhancedContent(enhancedPayload);
      console.log('📈 Enhanced response received:', {
        hasContent: !!(response.blogPost || response.content),
        hasSEOAnalysis: !!response.seoAnalysis,
        hasQualityMetrics: !!response.contentQuality,
        hasImprovement: !!response.improvementSuggestions,
        needsImageGeneration: !!response.imageGeneration?.needsImageGeneration
      });

      // Step 2: Generate images if needed (after blog is saved)
      let content = response.blogPost?.content || response.content || response.blogPost;

      if (response.imageGeneration?.needsImageGeneration && response.imageGeneration.blogPostId) {
        console.log('🎨 Triggering image generation for blog post...');

        try {
          const imageResult = await autoBlogAPI.generateImagesForBlog(
            response.imageGeneration.blogPostId,
            content,
            response.imageGeneration.topic,
            response.imageGeneration.organizationId
          );

          if (imageResult.success) {
            console.log('✅ Images generated successfully, updating content');
            content = imageResult.content; // Update with content containing actual images
          } else {
            console.warn('⚠️ Image generation failed, keeping placeholders:', imageResult.error);
            // Continue with placeholder content
          }
        } catch (imageError) {
          console.error('❌ Image generation error:', imageError.message);
          // Continue with placeholder content
        }
      }

      if (response && (response.blogPost || response.content)) {
        
        return {
          success: true,
          content: content,
          visualSuggestions: response.visualSuggestions || [],
          enhancedMetadata: response.enhancedMetadata || {
            seoAnalysis: response.seoAnalysis,
            contentQuality: response.contentQuality,
            strategicElements: response.strategicElements,
            improvementSuggestions: response.improvementSuggestions,
            keywordOptimization: response.keywordOptimization,
            visualSuggestions: response.visualSuggestions || []
          },
          seoAnalysis: response.seoAnalysis,
          contentQuality: response.contentQuality,
          strategicElements: response.strategicElements,
          improvementSuggestions: response.improvementSuggestions,
          keywordOptimization: response.keywordOptimization,
          generationContext: comprehensivePrompt,
          strategicCTAs: strategicCTAs,
          selectedTopic: selectedTopic
        };
      } else {
        return {
          success: false,
          error: 'Enhanced content generation failed: No content received'
        };
      }
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
   * Generate content with AI feedback loop (for future implementation)
   */
  async generateWithFeedbackLoop(topic, analysisData, strategy, previousVersions = []) {
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
  buildChangeExplanations(changes) {
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
  buildImprovementSuggestions(changes) {
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