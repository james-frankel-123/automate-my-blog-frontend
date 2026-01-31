/**
 * System voice – one consistent voice across the app
 * For users who are not marketers: builders, small businesses, solopreneurs.
 * Plain language, no buzzwords or acronyms. Helpful, confident, a bit warm.
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
    progress: [
      "Reading your pages…",
      "Checking what others in your space are doing…",
      "Gathering a sense of who you're talking to…",
      "Synthesizing…",
    ],
    // 1:1 with API steps (analyze-website, generate-audiences, generate-pitches, generate-audience-images)
    steps: [
      "Reading your pages…",
      "Understanding who you're for…",
      "Shaping conversion angles…",
      "Adding audience visuals…",
    ],
    defaultProgress: "Reading your site and building your profile. This usually takes 30–60 seconds.",
    loadingTitle: "Reading your site…",
    // Toasts
    success: "We've got the full picture. Pick your audience next.",
    successLimited: "We've got a basic picture. You can continue or try a different URL.",
    updated: "Site profile updated and saved.",
    // Errors & validation
    enterUrl: "Please enter a website URL",
    analysisFailed: "We couldn't finish reading your site. Check the URL and try again?",
    saveFailed: "We couldn't save your changes. Try again in a moment.",
  },

  // ─── Audience strategies (AudienceSegmentsTab) ───
  audience: {
    generatingStrategies: "Building audience strategies…",
    generatingStrategiesWithTime: "Using your site to create targeted customer strategies. This usually takes a few seconds.",
  },

  // ─── Topic selection (PostsTab, etc.) ───
  topics: {
    ideasHeadline: (businessType) =>
      `Here's what we think will resonate with your audience right now${businessType ? ` (${businessType})` : ''}`,
    generateTopics: "Generate topic ideas",
    generatingTopics: "Generating Topics…",
    generatingTopicsWithTime: "Creating topic ideas… This usually takes a few seconds.",
  },

  // ─── Content generation ───
  content: {
    readyToGenerate: "Ready to create your post",
    generate: "Generate content",
    generating: "Writing your post…",
    generatingWithTime: "Writing your post… This can take a minute.",
    progressSteps: ["Structuring the post", "Matching your voice", "Polishing"],
    progressLabel: "What we're doing:",
  },

  // ─── Toasts & messages (message.success / message.info / message.error) ───
  toasts: {
    analysisComplete: "We've got your site. Choose your audience next.",
    analysisFailed: "We couldn't read your site. Check the URL and try again?",
    strategySelected: "Audience locked in. Picking topics next.",
    topicSelected: "Topic chosen. Writing your post…",
    contentGenerated: "Post ready. You can edit or export.",
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
