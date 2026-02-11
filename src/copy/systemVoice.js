/**
 * System voice – one consistent voice across the app
 * For users who are not marketers: builders, small businesses, solopreneurs.
 * Plain language, no buzzwords or acronyms. Helpful, confident, a bit warm.
 * UX goal: feel like a live agent working for you, thinking at every step and surfacing those thoughts.
 *
 * See: docs/GITHUB_ISSUES_FROM_USABILITY_PROPOSAL.md (usability proposal, PR #47).
 */

export const systemVoice = {
  // ─── Header & step titles (UnifiedWorkflowHeader, progressive headers) ───
  header: {
    // Step 0: Start
    step0Title: "The new era of marketing has started.",
    step0Description: "Automate website content to get clicks without complication",
    // Split into phrases for sequential animation (just title, subtitle is static)
    step0Phrases: [
      "The new era of marketing has started."
    ],
    // Step 1: Analyzing
    step1Title: "Reading your site",
    step1Description: "We're learning about your business and audience so we can suggest content that fits.",
    // Step 2: Audience
    step2Title: "Choose your audience",
    step2Description: "Pick the group that best matches who you want to reach. We'll use this to shape your post.",
    // Step 3: Topics
    step3Title: "Pick topic ideas",
    step3Description: "We'll suggest topics that fit your audience and what you're already saying.",
    // Step 4: Create
    step4Title: "Create your post",
    step4Description: "We'll write a draft that sounds like you and fits your goals.",
    // Logged-in dashboard
    welcomeBack: "Welcome back",
    dashboardDescription: "Your dashboard is ready. Create posts, see what's working, and adjust as you go.",
    // Project just saved / new registration
    projectSavedTitle: "Project saved",
    projectSavedDescription: "Your project is saved. Go to Posts to reopen your content.",
    goToPosts: "Posts",
    newUserWelcome: "Welcome to Automate My Blog!",
    newUserSavePrompt: "Your account is set up. Save your project to access the full dashboard.",
    saveProject: "Save Project",
    // CTAs
    createNewPost: "Create New Post",
    continueProject: "Continue Project",
    startPost: "Start a post",
  },

  // ─── Progressive header step labels (ProgressiveHeaders) ───
  progressiveSteps: {
    website: "We know your site",
    strategy: "Audience locked in",
    topic: "Topic chosen",
    content: "Content ready",
    getWebsiteDescription: (domain, businessType) =>
      domain ? `${domain} • ${businessType || 'Business'}` : 'Site read and profile built',
    getStrategyDescription: (demographics) => demographics || 'Audience defined',
    getTopicDescription: (title) => title || 'Topic selected',
    getContentDescription: (wordCount) =>
      wordCount > 0 ? `${wordCount} words` : 'Post created',
    complete: "Complete",
    edit: "Edit",
  },

  // ─── Website analysis (WebsiteAnalysisStepStandalone) ───
  analysis: {
    title: "Analyze your site",
    inputPlaceholder: "Enter your website URL (e.g., https://example.com)",
    analyze: "Analyze",
    analyzing: "Reading your site…",
    startingAnalysis: "Starting analysis…",
    progress: [
      "Reading your pages…",
      "Checking what others in your space are doing…",
      "Gathering a sense of who you're talking to…",
      "Synthesizing…",
    ],
    // Detailed analysis steps for ChecklistProgress component
    steps: [
      "Fetching your website content",
      "Researching your brand & competitors",
      "Researching keywords & SEO",
      "Analyzing business from content",
      "Mapping customer psychology",
      "Checking existing audiences",
      "Identifying audience opportunities",
      "Creating customer scenarios",
      "Calculating revenue projections",
      "Generating conversion pitches",
    ],
    defaultProgress: "Reading your site and building your profile. I'll have this ready in about a minute.",
    loadingTitle: "Reading your site…",
    progressPreamble: "Right now:",
    progressLabel: "What we're doing:",
    workingForYou: "Working for you",
    // Toasts
    success: "We've got the full picture. Pick your audience next.",
    successLimited: "We've got a basic picture. You can continue or try a different URL.",
    updated: "Site profile updated and saved.",
    // Errors & validation
    enterUrl: "Please enter a website URL",
    analysisFailed: "We couldn't finish reading your site. Check the URL and try again?",
    saveFailed: "We couldn't save your changes. Try again in a moment.",
    // Narrative streaming (Issue #157); insight cards from narrative stream (4–6 cards)
    whatIDiscovered: "What I Discovered",
    insightCardsTitle: "Key insights",
    yourBestOpportunities: "Your Best Opportunities",
    audiencesIntro: "Based on what I learned, here are your highest-value audience segments:",
    analysisComplete: "Analysis Complete",
    // Empty states for failed or missing website analysis data (Issue #185)
    emptyStates: {
      scraping_failed: {
        heading: "Could not analyze website content",
        reasons: [
          "The site may block automated access or require login.",
          "The request may have timed out or the URL might be invalid.",
          "The server may be temporarily unavailable.",
        ],
        primaryAction: "Try again",
        secondaryAction: "Try a different URL",
      },
      business_model_failed: {
        heading: "Could not determine business model",
        reasons: [
          "Website content was unclear or the site is new or minimal.",
          "The business model may be unique or not clearly described.",
        ],
        primaryAction: "Enter manually",
      },
      target_audience_failed: {
        heading: "Could not identify target audience",
        reasons: [
          "Website copy may be generic or target multiple audiences.",
          "B2B2C or indirect audience models can be harder to detect.",
        ],
        primaryAction: "Enter manually",
      },
      keywords_failed: {
        heading: "Could not fetch keyword data",
        reasons: [
          "API rate limits, or the site is new or not yet indexed.",
          "We can still suggest topics from the rest of the analysis.",
        ],
        primaryAction: "Continue without keywords",
      },
      ctas_not_found: {
        heading: "Could not find call-to-action elements",
        reasons: [
          "CTAs may be non-standard or loaded dynamically (e.g. in a SPA).",
          "The site may be minimal or use images/buttons we don’t detect.",
        ],
        primaryAction: "Continue anyway",
      },
      brand_analysis_failed: {
        heading: "Could not analyze brand positioning",
        reasons: [
          "Insufficient or inconsistent messaging on the site.",
          "We’ll use a neutral brand voice unless you edit.",
        ],
        primaryAction: "Enter manually",
      },
      website_content_failed: {
        heading: "Could not analyze website content",
        reasons: [
          "We couldn’t extract a clear “what they do” from the page.",
          "You can describe the business yourself below.",
        ],
        primaryAction: "Enter manually",
      },
      content_focus_failed: {
        heading: "Could not determine content focus",
        reasons: ["Website content didn’t reveal a clear content focus. You can add it manually."],
        primaryAction: "Enter manually",
      },
      website_goals_failed: {
        heading: "Could not determine website goals",
        reasons: ["We couldn’t infer goals from the content. You can add them manually."],
        primaryAction: "Enter manually",
      },
      blog_strategy_failed: {
        heading: "Could not determine blog strategy",
        reasons: ["We couldn’t infer a blog strategy. You can add it manually."],
        primaryAction: "Enter manually",
      },
    },
  },

  // ─── Audience strategies (AudienceSegmentsTab) ───
  audience: {
    generatingStrategies: "Thinking about your audience…",
    generatingStrategiesWithTime: "Using your site to find who you're for. A few seconds.",
    audienceReady: "Audience strategies ready. Pick one to shape your post.",
  },

  // ─── Topic selection (PostsTab, etc.) ───
  topics: {
    ideasHeadline: (businessType) =>
      `Here's what we think will resonate with your audience right now${businessType ? ` (${businessType})` : ''}`,
    generateTopics: "Generate topic ideas",
    generatingTopics: "Thinking of topic ideas…",
    generatingTopicsWithTime: "Picking ideas that fit your audience. A few seconds.",
    topicsStreamingIn: (count) => count === 1 ? "One idea ready, thinking of more…" : `${count} ideas so far, adding more…`,
    topicsReady: "Topic ideas ready. Pick one and we'll draft it.",
  },

  // ─── Content generation ───
  content: {
    readyToGenerate: "Ready to create your post",
    generate: "Generate content",
    generating: "Drafting your post…",
    generatingWithTime: "Drafting your post. About a minute.",
    progressSteps: ["Outlining…", "Writing in your voice…", "Polishing…"],
    progressPreamble: "Right now:",
    progressLabel: "What we're doing:",
    workingForYou: "Working for you",
    imagesGenerating: "Adding images…",
    imagesReady: "Images added.",
    // Related content fetch steps (tweets, articles, videos before blog generation)
    fetchTweets: "Fetching related tweets…",
    fetchTweetsDone: (n) => `Found ${n} tweet${n !== 1 ? 's' : ''}`,
    fetchArticles: "Fetching related news articles…",
    fetchArticlesDone: (n) => `Found ${n} article${n !== 1 ? 's' : ''}`,
    fetchVideos: "Fetching related videos…",
    fetchVideosDone: (n) => `Found ${n} video${n !== 1 ? 's' : ''}`,
    fetchCTAs: "Fetching CTAs for your business…",
    fetchCTAsDone: (n) => `Found ${n} CTA${n !== 1 ? 's' : ''}`,
    fetchSkipped: "Skipped",
    fetchFailed: "Failed",
  },

  // ─── Toasts & messages (message.success / message.info / message.error) ───
  toasts: {
    analysisComplete: "We've got your site. Choose your audience next.",
    analysisFailed: "We couldn't read your site. Check the URL and try again?",
    strategySelected: "Audience locked in. Picking topics next.",
    topicSelected: "Topic chosen. Drafting your post…",
    contentGenerated: "Your draft is ready. Edit or export when you're set.",
    contentSaved: "Saved. Ready to export when you are.",
    contentExported: "Exported. You're all set.",
    signUpPrompt: "Sign up to save posts and manage everything in one place.",
  },

  // ─── Errors (friendly, human) ───
  errors: {
    generic: "Something went wrong on our side. Try again in a moment.",
    invalidUrl: "We couldn't read that URL. Check it and try again?",
  },

  // ─── Empty states & hints ───
  empty: {
    noTopicsYet: "We don't have topic ideas yet. Generate some from your audience.",
  },
  hint: {
    savedProgress: "We've saved your progress.",
    chooseAudienceNext: "We've got your site. Choose your audience next.",
  },

  // ─── Anticipatory suggestions ───
  suggestions: {
    afterAnalysis: (audienceOrType) =>
      audienceOrType
        ? `Ready to create something for ${audienceOrType}?`
        : "We've got your site. Pick your audience next.",
    afterAudience: (segmentName, count) =>
      segmentName
        ? `We've got ${count} topic idea${count !== 1 ? 's' : ''} that match "${segmentName}". Generate them?`
        : `We've got ${count} topic idea${count !== 1 ? 's' : ''}. Generate them?`,
    nextStepAudience: "Next: Choose your audience",
    whySuggested: {
      trending: "Trending in your niche",
      matchesGoals: "Matches what you're already saying",
      fitsAudience: "Fits your audience",
      default: "Picked for you based on your goals",
    },
    getWhySuggestedForTopic: (topic) =>
      topic?.whySuggested || topic?.reason || "Picked for you based on your goals",
    welcomeBackCached: (context) =>
      context
        ? `Welcome back. Last time you were working on ${context}. Continue or start something new?`
        : "Welcome back. Continue where you left off or start something new?",
  },
};

export default systemVoice;
