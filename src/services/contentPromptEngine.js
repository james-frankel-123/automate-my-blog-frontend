/**
 * Advanced Content Generation Prompt Engine
 * Comprehensive dynamic prompt system with multi-layered context
 */

/** Get a single display string from targetSegment (string or { demographics, psychographics, searchBehavior }). */
function targetSegmentToDisplayString(targetSegment) {
  if (targetSegment == null) return '';
  if (typeof targetSegment === 'string') return targetSegment.trim();
  if (typeof targetSegment === 'object')
    return (targetSegment.demographics ?? targetSegment.description ?? targetSegment.psychographics ?? targetSegment.searchBehavior ?? targetSegment.title ?? '').trim() || '';
  return '';
}

/**
 * Enhanced Prompt Context Builder
 * Creates comprehensive prompts beyond basic goal/voice/template/length
 */
export class ContentPromptEngine {
  constructor() {
    this.defaultValues = {
      goal: 'consideration',
      voice: 'expert',
      template: 'comprehensive',
      length: 'standard'
    };
  }

  /**
   * Build comprehensive content generation prompt
   */
  buildComprehensivePrompt(topic, analysisData, strategy = {}, enhancementOptions = {}) {
    const context = this.buildMultiLayeredContext(analysisData, strategy, enhancementOptions);
    const contentStrategy = this.buildContentStrategy(strategy, enhancementOptions);
    const seoInstructions = this.buildSEOInstructions(analysisData, strategy, enhancementOptions);
    const structuralGuidance = this.buildStructuralGuidance(strategy, enhancementOptions);
    
    return {
      businessContext: context.businessContext,
      audienceContext: context.audienceContext,
      competitiveContext: context.competitiveContext,
      contentStrategy: contentStrategy,
      seoInstructions: seoInstructions,
      structuralGuidance: structuralGuidance,
      topic: topic,
      additionalInstructions: this.buildAdditionalInstructions(enhancementOptions)
    };
  }

  /**
   * Multi-layered content generation context
   * Goes beyond goal/voice/template/length to include comprehensive business intelligence
   */
  buildMultiLayeredContext(analysisData, strategy = {}, _options = {}) {
    return {
      // Business Context Layer
      businessContext: {
        industryType: analysisData.businessType || 'Technology',
        businessName: analysisData.businessName || 'Your Business',
        brandPersonality: analysisData.brandVoice || 'Professional',
        businessObjectives: (strategy && strategy.conversionPath) || analysisData.websiteGoals || 'Generate leads and build authority',
        competitivePositioning: this.extractCompetitivePositioning(analysisData),
        businessModel: analysisData.businessModel || 'Service-based business',
        valueProposition: this.extractValueProposition(analysisData, strategy),
        brandTone: this.mapBrandVoiceToTone(analysisData.brandVoice)
      },

      // Audience Context Layer  
      audienceContext: {
        primarySegment: (strategy && targetSegmentToDisplayString(strategy.targetSegment)) || analysisData.decisionMakers || 'Business professionals',
        specificPainPoints: (strategy && strategy.customerProblem) || (analysisData.customerProblems && analysisData.customerProblems[0]) || 'Business challenges',
        customerLanguage: this.buildCustomerLanguage(analysisData, strategy),
        journeyStage: this.determineJourneyStage(strategy),
        searchBehavior: analysisData.searchBehavior || 'Seeking expert guidance and solutions',
        expertiseLevel: this.determineAudienceExpertise(analysisData, strategy),
        demographicContext: this.buildDemographicContext(analysisData)
      },

      // Competitive Context Layer
      competitiveContext: {
        marketPosition: this.extractMarketPosition(analysisData),
        contentDifferentiation: this.buildContentDifferentiation(analysisData, strategy),
        industryTrends: this.extractIndustryContext(analysisData),
        competitiveAdvantages: this.extractCompetitiveAdvantages(analysisData)
      }
    };
  }

  /**
   * Content Strategy Configuration
   * Enhanced beyond basic template selection
   */
  buildContentStrategy(strategy = {}, options = {}) {
    const goal = options.goal || (strategy && strategy.goal) || this.defaultValues.goal;
    const voice = options.voice || (strategy && strategy.voice) || this.defaultValues.voice;
    const template = options.template || (strategy && strategy.template) || this.defaultValues.template;
    const length = options.length || (strategy && strategy.length) || this.defaultValues.length;

    return {
      primaryGoal: this.mapGoalToStrategy(goal),
      voiceCharacteristics: this.buildVoiceCharacteristics(voice),
      contentStructure: this.buildContentStructure(template),
      lengthGuidance: this.buildLengthGuidance(length),
      engagementStrategy: this.buildEngagementStrategy(goal, voice),
      conversionElements: this.buildConversionElements(goal, strategy),
      contentDepth: this.determineContentDepth(template, length),
      interactivityLevel: this.determineInteractivityLevel(template, voice)
    };
  }

  /**
   * SEO Instructions with keyword integration
   */
  buildSEOInstructions(analysisData, strategy = {}, _options = {}) {
    const primaryKeywords = (strategy && strategy.seoKeywords) || analysisData.keywords || [];
    const secondaryKeywords = this.buildSecondaryKeywords(analysisData, strategy);
    
    return {
      primaryKeywords: primaryKeywords.slice(0, 3),
      secondaryKeywords: secondaryKeywords.slice(0, 5),
      keywordDensity: this.calculateOptimalDensity(primaryKeywords),
      semanticKeywords: this.buildSemanticKeywords(analysisData),
      titleOptimization: this.buildTitleGuidance(primaryKeywords),
      metaGuidance: this.buildMetaGuidance(primaryKeywords, analysisData),
      internalLinkingOpportunities: this.identifyLinkingOpportunities(analysisData),
      featuredSnippetOptimization: this.buildSnippetGuidance(primaryKeywords),
      localSeoConsiderations: this.buildLocalSEOGuidance(analysisData)
    };
  }

  /**
   * Structural Content Guidance
   */
  buildStructuralGuidance(strategy = {}, options = {}) {
    return {
      introductionStyle: this.determineIntroStyle(strategy),
      sectionStructure: this.buildSectionStructure(strategy, options),
      conclusionStrategy: this.buildConclusionStrategy(strategy),
      ctaPlacement: this.determineCTAPlacement(strategy),
      visualElements: this.suggestVisualElements(strategy),
      readabilityTargets: this.setReadabilityTargets(options),
      headingHierarchy: this.buildHeadingStrategy(options),
      listFormatting: this.determineListStrategy(strategy)
    };
  }

  /**
   * Helper Methods for Context Building
   */
  
  extractCompetitivePositioning(analysisData) {
    if (analysisData.webSearchStatus?.businessResearchSuccess) {
      return `Market-researched positioning with competitive insights`;
    }
    return `Established ${analysisData.businessType} with focus on ${analysisData.contentFocus}`;
  }

  extractValueProposition(analysisData, strategy) {
    if (strategy && strategy.businessValue) {
      return strategy.businessValue;
    }
    return analysisData.connectionMessage || `Expert ${analysisData.businessType} solutions`;
  }

  mapBrandVoiceToTone(brandVoice) {
    const toneMap = {
      'Professional': 'Authoritative yet approachable, industry-expert tone',
      'Friendly': 'Conversational and warm, building personal connection',
      'Expert': 'Thought-leadership voice with deep expertise demonstration',
      'Casual': 'Relaxed and accessible, breaking down complex topics'
    };
    return toneMap[brandVoice] || toneMap.Professional;
  }

  buildCustomerLanguage(analysisData, strategy) {
    const language = [];
    if (strategy && strategy.customerLanguage) {
      language.push(...strategy.customerLanguage);
    }
    if (analysisData.customerLanguage) {
      language.push(...analysisData.customerLanguage);
    }
    return language.length > 0 ? language : ['professional terminology', 'industry-specific language'];
  }

  determineJourneyStage(strategy) {
    if (strategy && strategy.conversionPath?.includes('lead')) return 'consideration';
    if (strategy && strategy.conversionPath?.includes('sale')) return 'decision';
    if (strategy && strategy.conversionPath?.includes('awareness')) return 'awareness';
    return 'consideration';
  }

  determineAudienceExpertise(analysisData, strategy) {
    if (analysisData.decisionMakers?.includes('executive') || analysisData.decisionMakers?.includes('manager')) {
      return 'experienced professional';
    }
    if ((strategy && strategy.customerProblem?.includes('beginner')) || (strategy && strategy.customerProblem?.includes('new to'))) {
      return 'beginner to intermediate';
    }
    return 'intermediate to advanced';
  }

  buildDemographicContext(analysisData) {
    return {
      primaryRole: analysisData.decisionMakers || 'Business decision maker',
      industryFamiliarity: 'High familiarity with industry challenges',
      technicalLevel: 'Professional-level technical understanding',
      contentPreference: 'In-depth, actionable content with clear implementation guidance'
    };
  }

  buildAdditionalInstructions(options = {}) {
    const instructions = [];
    
    if (options.includeCaseStudies) {
      instructions.push('Include relevant case studies or examples where appropriate');
    }
    
    if (options.emphasizeROI) {
      instructions.push('Emphasize ROI and business value throughout the content');
    }
    
    if (options.includeActionables) {
      instructions.push('Provide specific, actionable steps readers can implement immediately');
    }
    
    if (options.addStatistics) {
      instructions.push('Include relevant industry statistics to support key points');
    }
    
    if (options.competitiveComparison) {
      instructions.push('Include subtle competitive comparisons where relevant');
    }

    return instructions.join('. ');
  }

  /**
   * Content Strategy Mapping Methods
   */
  
  mapGoalToStrategy(goal) {
    const strategies = {
      awareness: 'Educational content that builds brand recognition and thought leadership',
      consideration: 'Solution-focused content that demonstrates expertise and builds trust',
      conversion: 'Compelling content that drives immediate action with clear value proposition', 
      retention: 'Value-added content that strengthens existing customer relationships'
    };
    return strategies[goal] || strategies.consideration;
  }

  buildVoiceCharacteristics(voice) {
    const characteristics = {
      expert: {
        tone: 'Authoritative and knowledgeable',
        approach: 'Data-driven insights with industry expertise',
        language: 'Professional terminology with clear explanations'
      },
      friendly: {
        tone: 'Approachable and personable', 
        approach: 'Conversational guidance with personal examples',
        language: 'Accessible language with relatable analogies'
      },
      insider: {
        tone: 'Exclusive and informed',
        approach: 'Behind-the-scenes insights and industry secrets',
        language: 'Insider terminology with expert-level depth'
      },
      storyteller: {
        tone: 'Engaging and narrative-driven',
        approach: 'Story-based content with compelling examples',
        language: 'Vivid descriptions with emotional connection'
      }
    };
    return characteristics[voice] || characteristics.expert;
  }

  buildContentStructure(template) {
    const structures = {
      'how-to': {
        format: 'Step-by-step instructional guide',
        sections: 'Introduction → Prerequisites → Steps → Conclusion → Next Actions',
        emphasis: 'Clear, actionable instructions with practical examples'
      },
      'problem-solution': {
        format: 'Problem identification and comprehensive solution framework',
        sections: 'Problem Definition → Impact Analysis → Solution Framework → Implementation → Results',
        emphasis: 'Clear problem-solution alignment with measurable outcomes'
      },
      'listicle': {
        format: 'Numbered list with detailed explanations',
        sections: 'Introduction → List Items (with subsections) → Summary → Action Items',
        emphasis: 'Scannable format with substantial detail for each point'
      },
      'case-study': {
        format: 'Detailed analysis of real-world implementation',
        sections: 'Background → Challenge → Solution → Implementation → Results → Lessons',
        emphasis: 'Specific details, metrics, and transferable insights'
      },
      'comprehensive': {
        format: 'In-depth guide covering all aspects of the topic',
        sections: 'Overview → Core Concepts → Advanced Strategies → Implementation → Optimization',
        emphasis: 'Thorough coverage with beginner-to-advanced progression'
      }
    };
    return structures[template] || structures.comprehensive;
  }

  buildLengthGuidance(length) {
    const guidance = {
      quick: {
        wordTarget: 500,
        focusArea: 'Single key concept with immediate actionability',
        depth: 'Surface-level with clear next steps'
      },
      standard: {
        wordTarget: 1000,
        focusArea: 'Comprehensive treatment of main topic with supporting details',
        depth: 'Moderate depth with practical examples and implementation guidance'
      },
      deep: {
        wordTarget: 2000,
        focusArea: 'Exhaustive coverage with multiple perspectives and advanced strategies',
        depth: 'Deep expertise with comprehensive examples, case studies, and advanced techniques'
      }
    };
    return guidance[length] || guidance.standard;
  }

  /**
   * Build section structure guidance
   */
  buildSectionStructure(strategy = {}, options = {}) {
    const template = options.template || (strategy && strategy.template) || 'comprehensive';
    const structures = {
      'how-to': 'Introduction → Prerequisites → Step-by-step instructions (numbered list) → Tips/Best practices → Conclusion',
      'problem-solution': 'Problem identification → Impact analysis → Solution framework → Implementation steps → Expected results',
      'listicle': 'Introduction → Main list items (with ## headings) → Supporting details → Summary',
      'case-study': 'Background → Challenge → Solution approach → Implementation details → Results and metrics',
      'comprehensive': 'Introduction → Core concepts (with ## headings) → Advanced strategies → Implementation guide → Optimization tips'
    };
    return structures[template] || structures.comprehensive;
  }

  /**
   * Build heading strategy for markdown formatting
   */
  buildHeadingStrategy(_options = {}) {
    return {
      primaryHeadings: 'Use ## for main section headings',
      secondaryHeadings: 'Use ### for subsections and key points',
      formatting: 'Ensure proper spacing around headings with blank lines',
      hierarchy: 'Maintain logical progression from ## to ### to ####'
    };
  }

  /**
   * Determine list formatting strategy
   */
  determineListStrategy(strategy = {}) {
    const template = (strategy && strategy.template) || 'comprehensive';
    const strategies = {
      'how-to': 'Use numbered lists (1., 2., 3.) for sequential steps',
      'problem-solution': 'Use bullet points (-) for problem lists and numbered lists for solutions',
      'listicle': 'Use numbered lists as primary structure with bullet points for sub-items',
      'case-study': 'Use bullet points for challenges and numbered lists for implementation steps',
      'comprehensive': 'Mix numbered lists for processes and bullet points for features/benefits'
    };
    return strategies[template] || strategies.comprehensive;
  }

  /**
   * Determine introduction style
   */
  determineIntroStyle(_strategy = {}) {
    return 'Engaging hook + problem identification + value proposition preview';
  }

  /**
   * Build conclusion strategy
   */
  buildConclusionStrategy(_strategy = {}) {
    return 'Summary of key points + actionable next steps + strategic CTA';
  }

  /**
   * Determine CTA placement
   */
  determineCTAPlacement(strategy = {}) {
    const goal = (strategy && strategy.goal) || 'consideration';
    const placements = {
      awareness: ['end-of-content'],
      consideration: ['mid-content', 'end-of-content'],
      conversion: ['early-content', 'end-of-content'],
      retention: ['end-of-content']
    };
    return placements[goal] || placements.consideration;
  }

  /**
   * Build engagement strategy based on goal and voice
   */
  buildEngagementStrategy(goal, voice) {
    const strategies = {
      awareness: {
        expert: 'Educational tone with data-driven insights and industry expertise',
        friendly: 'Approachable explanations with relatable examples and stories',
        insider: 'Insider knowledge sharing with behind-the-scenes insights',
        storyteller: 'Narrative-driven content that connects emotionally'
      },
      consideration: {
        expert: 'Comparative analysis and detailed explanations of solutions',
        friendly: 'Helpful guidance and supportive decision-making content',
        insider: 'Professional insights and industry best practices',
        storyteller: 'Success stories and transformation narratives'
      },
      conversion: {
        expert: 'Authority-based persuasion with strong value propositions',
        friendly: 'Trust-building content with clear benefits and next steps',
        insider: 'Professional recommendations and proven solutions',
        storyteller: 'Compelling case studies and transformation stories'
      },
      retention: {
        expert: 'Advanced tips and ongoing optimization strategies',
        friendly: 'Continued support and community-building content',
        insider: 'Exclusive insights and advanced techniques',
        storyteller: 'Long-term journey narratives and milestone celebrations'
      }
    };
    
    return strategies[goal]?.[voice] || strategies.consideration.expert;
  }

  /**
   * Build conversion elements based on goal and strategy
   */
  buildConversionElements(goal, strategy = null) {
    const elements = {
      awareness: {
        ctaType: 'Educational',
        urgencyLevel: 'Low',
        socialProof: 'Expertise indicators and credible sources',
        valueProps: 'Knowledge and insights',
        riskReduction: 'Free educational content'
      },
      consideration: {
        ctaType: 'Consultation',
        urgencyLevel: 'Medium',
        socialProof: 'Customer testimonials and case studies',
        valueProps: 'Personalized solutions and expert guidance',
        riskReduction: 'Risk-free consultation or trial'
      },
      conversion: {
        ctaType: 'Purchase/Sign-up',
        urgencyLevel: 'High',
        socialProof: 'Reviews, ratings, and success stories',
        valueProps: 'Clear ROI and immediate benefits',
        riskReduction: 'Guarantees and money-back policies'
      },
      retention: {
        ctaType: 'Engagement',
        urgencyLevel: 'Medium',
        socialProof: 'Community success and loyalty programs',
        valueProps: 'Exclusive content and advanced features',
        riskReduction: 'Continued support and upgrades'
      }
    };

    const baseElements = elements[goal] || elements.consideration;
    
    // Customize based on strategy if available
    if (strategy && strategy.conversionPath) {
      baseElements.customCTA = `Tailored for: ${strategy.conversionPath}`;
    }
    
    return baseElements;
  }

  /**
   * Calculate optimal keyword density
   */
  calculateOptimalDensity(keywords) {
    if (!keywords || keywords.length === 0) return '1-2%';
    
    // Adjust density based on number of keywords
    if (keywords.length <= 2) return '2-3%';
    if (keywords.length <= 4) return '1.5-2.5%';
    return '1-2%';
  }

  /**
   * Identify internal linking opportunities
   */
  identifyLinkingOpportunities(analysisData) {
    const businessType = analysisData.businessType || '';
    const contentFocus = analysisData.contentFocus || '';
    
    return [
      `Related ${businessType.toLowerCase()} resources`,
      `Additional ${contentFocus.toLowerCase()} guides`,
      'Service pages and product information',
      'About and contact page connections'
    ];
  }

  /**
   * Suggest visual elements
   */
  suggestVisualElements(_strategy = {}) {
    return 'Bold text for key points, italic for emphasis, code blocks for examples';
  }

  /**
   * Set readability targets
   */
  setReadabilityTargets(_options = {}) {
    return {
      paragraphLength: '2-4 sentences per paragraph',
      sentenceLength: '15-25 words average',
      transition: 'Use connecting words between paragraphs'
    };
  }

  /**
   * Extract market position from analysis data
   */
  extractMarketPosition(analysisData) {
    if (analysisData.webSearchStatus?.businessResearchSuccess) {
      return `Market-positioned ${analysisData.businessType} with competitive research insights`;
    }
    return `Established ${analysisData.businessType || 'business'} provider`;
  }

  /**
   * Build content differentiation strategy
   */
  buildContentDifferentiation(analysisData, _strategy) {
    const focus = analysisData.contentFocus || 'business solutions';
    const audience = analysisData.targetAudience || 'professionals';
    return `Unique ${focus} perspective tailored for ${audience}`;
  }

  /**
   * Extract industry context and trends
   */
  extractIndustryContext(analysisData) {
    return `${analysisData.businessType || 'Business'} industry trends and best practices`;
  }

  /**
   * Extract competitive advantages
   */
  extractCompetitiveAdvantages(analysisData) {
    const advantages = [];
    if (analysisData.brandVoice) {
      advantages.push(`Distinctive ${analysisData.brandVoice.toLowerCase()} brand voice`);
    }
    if (analysisData.contentFocus) {
      advantages.push(`Specialized focus on ${analysisData.contentFocus.toLowerCase()}`);
    }
    if (analysisData.webSearchStatus?.enhancementComplete) {
      advantages.push('Data-driven market insights');
    }
    return advantages.length > 0 ? advantages : ['Established expertise and industry knowledge'];
  }

  /**
   * Determine content depth based on template and length
   */
  determineContentDepth(template, length) {
    const depthMap = {
      'how-to': {
        brief: 'Step-by-step overview with key points',
        standard: 'Detailed step-by-step guide with examples',
        comprehensive: 'Complete tutorial with examples, tips, and troubleshooting'
      },
      'problem-solution': {
        brief: 'Problem identification and solution overview',
        standard: 'Problem analysis, solution explanation, and benefits',
        comprehensive: 'Comprehensive problem analysis, multiple solutions, comparison, and implementation'
      },
      'listicle': {
        brief: '5-7 items with brief explanations',
        standard: '8-12 items with detailed explanations',
        comprehensive: '15+ items with comprehensive analysis and examples'
      },
      'case-study': {
        brief: 'Key results and lesson summary',
        standard: 'Challenge, solution, and detailed results',
        comprehensive: 'Background, detailed process, results, and lessons learned'
      }
    };
    
    return depthMap[template]?.[length] || depthMap['problem-solution'].standard;
  }

  /**
   * Determine interactivity level based on template and voice
   */
  determineInteractivityLevel(template, voice) {
    const interactivityMap = {
      expert: {
        'how-to': 'Include actionable steps and professional tips',
        'problem-solution': 'Provide analysis frameworks and decision criteria',
        'listicle': 'Include expert insights and best practices',
        'case-study': 'Analyze strategies and methodologies'
      },
      friendly: {
        'how-to': 'Use conversational tone with encouragement',
        'problem-solution': 'Address reader concerns and provide reassurance',
        'listicle': 'Include personal anecdotes and relatable examples',
        'case-study': 'Share lessons learned and practical advice'
      },
      insider: {
        'how-to': 'Share industry secrets and advanced techniques',
        'problem-solution': 'Reveal behind-the-scenes insights and strategies',
        'listicle': 'Include insider knowledge and exclusive tips',
        'case-study': 'Expose detailed processes and insider perspectives'
      },
      storyteller: {
        'how-to': 'Frame steps within narrative context',
        'problem-solution': 'Use story arcs and character development',
        'listicle': 'Include mini-stories and emotional connections',
        'case-study': 'Focus on journey, transformation, and human elements'
      }
    };
    
    return interactivityMap[voice]?.[template] || interactivityMap.expert['problem-solution'];
  }

  /**
   * Build semantic keywords based on analysis data
   */
  buildSemanticKeywords(analysisData) {
    const businessType = analysisData.businessType || '';
    const contentFocus = analysisData.contentFocus || '';
    const targetAudience = analysisData.targetAudience || '';
    
    return [
      `${businessType.toLowerCase()} solutions`,
      `${contentFocus.toLowerCase()} strategies`,
      `${targetAudience.toLowerCase()} needs`,
      'best practices',
      'expert advice',
      'professional guidance'
    ].filter(keyword => keyword.trim());
  }

  /**
   * Build title optimization guidance
   */
  buildTitleGuidance(primaryKeywords) {
    if (!primaryKeywords || primaryKeywords.length === 0) {
      return 'Create compelling, descriptive title under 60 characters';
    }
    
    return `Include "${primaryKeywords[0]}" in title, keep under 60 characters, make it compelling and descriptive`;
  }

  /**
   * Build meta description guidance
   */
  buildMetaGuidance(primaryKeywords, analysisData) {
    const businessType = analysisData.businessType || 'business';
    const primaryKeyword = primaryKeywords?.[0] || 'solutions';
    
    return `Write 150-155 character meta description including "${primaryKeyword}" and emphasizing ${businessType.toLowerCase()} value proposition`;
  }

  /**
   * Build featured snippet optimization guidance
   */
  buildSnippetGuidance(primaryKeywords) {
    const primaryKeyword = primaryKeywords?.[0] || 'topic';
    
    return `Structure content to answer "what is ${primaryKeyword}", use bullet points and numbered lists for better snippet chances`;
  }

  /**
   * Build local SEO guidance
   */
  buildLocalSEOGuidance(analysisData) {
    const businessType = analysisData.businessType || 'business';
    
    return `Consider local ${businessType.toLowerCase()} needs, include location-relevant examples if applicable`;
  }

  /**
   * Build secondary keywords based on analysis data and strategy
   */
  buildSecondaryKeywords(analysisData, strategy = null) {
    const secondaryKeywords = [];
    
    // Add business-related keywords
    if (analysisData.businessType) {
      secondaryKeywords.push(
        `${analysisData.businessType.toLowerCase()} services`,
        `professional ${analysisData.businessType.toLowerCase()}`
      );
    }
    
    // Add content focus keywords
    if (analysisData.contentFocus) {
      secondaryKeywords.push(
        `${analysisData.contentFocus.toLowerCase()} tips`,
        `${analysisData.contentFocus.toLowerCase()} guide`
      );
    }
    
    // Add target audience keywords
    if (analysisData.targetAudience) {
      secondaryKeywords.push(
        `for ${analysisData.targetAudience.toLowerCase()}`,
        `${analysisData.targetAudience.toLowerCase()} solutions`
      );
    }
    
    // Add strategy-specific keywords if available
    if (strategy && strategy.keywords && strategy.keywords.length > 0) {
      secondaryKeywords.push(...strategy.keywords.slice(0, 3));
    }
    
    // Add generic secondary keywords
    secondaryKeywords.push(
      'best practices',
      'expert advice',
      'professional tips',
      'how to guide',
      'step by step'
    );
    
    return secondaryKeywords.filter(keyword => keyword && keyword.trim()).slice(0, 8);
  }
}

/**
 * Strategic CTA Builder
 * Creates contextually relevant calls-to-action based on content strategy
 */
export class StrategicCTABuilder {
  constructor() {
    this.ctaTemplates = {
      awareness: {
        primary: 'Learn more about our {solution}',
        secondary: 'Subscribe for expert insights',
        tertiary: 'Download our {industry} guide'
      },
      consideration: {
        primary: 'Get a free {consultation/audit}',
        secondary: 'Compare your options',
        tertiary: 'See how we help {audience}'
      },
      conversion: {
        primary: 'Start your {solution} today',
        secondary: 'Schedule your {demo/call}',
        tertiary: 'Get custom pricing'
      },
      retention: {
        primary: 'Upgrade your {service}',
        secondary: 'Explore advanced features',
        tertiary: 'Join our community'
      }
    };
  }

  buildStrategicCTAs(analysisData, strategy, contentGoal) {
    const goal = contentGoal || (strategy && strategy.goal) || 'consideration';
    const templates = this.ctaTemplates[goal] || this.ctaTemplates.consideration;
    
    return {
      primary: this.customizeCTA(templates.primary, analysisData, strategy),
      secondary: this.customizeCTA(templates.secondary, analysisData, strategy),
      tertiary: this.customizeCTA(templates.tertiary, analysisData, strategy),
      placement: this.determineCTAPlacement(goal),
      style: this.determineCTAStyle(goal, strategy)
    };
  }

  customizeCTA(template, analysisData, _strategy) {
    return template
      .replace('{solution}', analysisData.contentFocus || 'solutions')
      .replace('{industry}', analysisData.businessType || 'business')
      .replace('{audience}', analysisData.targetAudience || 'businesses')
      .replace('{consultation/audit}', (analysisData.businessType && analysisData.businessType.includes('Consulting')) ? 'consultation' : 'audit')
      .replace('{demo/call}', analysisData.businessModel?.includes('Software') ? 'demo' : 'call')
      .replace('{service}', analysisData.contentFocus || 'service');
  }

  determineCTAPlacement(goal) {
    const placements = {
      awareness: ['end-of-content', 'sidebar'],
      consideration: ['mid-content', 'end-of-content'],
      conversion: ['early-content', 'mid-content', 'end-of-content'],
      retention: ['mid-content', 'end-of-content']
    };
    return placements[goal] || placements.consideration;
  }

  determineCTAStyle(goal, _strategy) {
    const styles = {
      awareness: { urgency: 'low', tone: 'educational', format: 'soft-offer' },
      consideration: { urgency: 'medium', tone: 'solution-focused', format: 'value-offer' },
      conversion: { urgency: 'high', tone: 'action-oriented', format: 'direct-offer' },
      retention: { urgency: 'medium', tone: 'enhancement-focused', format: 'upgrade-offer' }
    };
    return styles[goal] || styles.consideration;
  }
}

export default ContentPromptEngine;