/**
 * Mock API responses for E2E complete workflow tests.
 * Intercepts fetch to the backend so tests run without a real API.
 *
 * Usage: call installWorkflowMocks(page) before navigation.
 */

function b64(str) {
  return Buffer.from(str, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Fake JWT for logged-in e2e user. Payload: { userId, id, sub } */
function fakeJWT() {
  const header = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64(JSON.stringify({
    userId: 'e2e-test-user-id',
    id: 'e2e-test-user-id',
    sub: 'e2e-test-user-id',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  }));
  const sig = b64('mock-signature');
  return `${header}.${payload}.${sig}`;
}

const MOCK_USER = {
  id: 'e2e-test-user-id',
  email: 'e2e@example.com',
  firstName: 'E2E',
  lastName: 'User',
  role: 'user',
  organizationId: 'org-e2e',
  organizationName: 'E2E Org',
  permissions: [],
};

/** Same as MOCK_USER but role super_admin for analytics e2e (UserAnalyticsTab, funnel stage users). */
const MOCK_USER_SUPERADMIN = { ...MOCK_USER, role: 'super_admin' };

const MOCK_ANALYSIS = {
  success: true,
  url: 'https://example.com',
  scrapedAt: new Date().toISOString(),
  analysis: {
    businessType: 'Technology',
    businessName: 'Example Inc',
    targetAudience: 'Developers and technical leads',
    decisionMakers: 'Developers and technical leads',
    endUsers: 'End users',
    contentFocus: 'Developer tools, APIs, and best practices',
    brandVoice: 'Professional, helpful',
    description: 'Example Inc provides developer tools.',
    brandColors: { primary: '#6B8CAE', secondary: '#F4E5D3', accent: '#8FBC8F' },
    scenarios: [],
    customerProblems: [],
    customerLanguage: [],
    keywords: [],
    contentIdeas: ['Getting started with APIs', 'Best practices for developers'],
    webSearchStatus: { businessResearchSuccess: true, keywordResearchSuccess: true, enhancementComplete: true },
  },
  metadata: {},
  ctas: [],
  ctaCount: 0,
  hasSufficientCTAs: false,
};

const MOCK_SCENARIOS = [
  {
    id: 'e2e-scenario-1',
    targetSegment: { demographics: 'Developers', searchBehavior: 'Technical search', customerProblem: 'Integration complexity' },
    customerProblem: 'Integration complexity',
    businessValue: 'Faster integration',
    seoKeywords: ['api', 'integration'],
    conversionPath: 'Trial signup',
    imageUrl: 'https://via.placeholder.com/400x200?text=Audience+1',
  },
  {
    id: 'e2e-scenario-2',
    targetSegment: { demographics: 'Technical leads', searchBehavior: 'Evaluation', customerProblem: 'Scalability' },
    customerProblem: 'Scalability',
    businessValue: 'Scale with confidence',
    seoKeywords: ['scale', 'performance'],
    conversionPath: 'Demo request',
    imageUrl: 'https://via.placeholder.com/400x200?text=Audience+2',
  },
];

const MOCK_TOPICS = [
  { id: 1, title: 'How to Get Started with Example API', subheader: 'A practical guide', category: 'Technology', image: '', scenario: null, whySuggested: "Trending in your niche" },
  { id: 2, title: 'Best Practices for Developer Integrations', subheader: 'Tips from the team', category: 'Technology', image: '', scenario: null, whySuggested: "Matches what you're already saying" },
];

const MOCK_CONTENT = `
<h2>How to Get Started with Example API</h2>
<p>This is mock AI-generated blog content for E2E testing. You can edit it in the rich text editor.</p>
<p>Key points include setup, authentication, and your first request.</p>
`.trim();

const MOCK_CONTENT_WITH_IMAGES = `
<h2>How to Get Started with Example API</h2>
<p><img src="https://via.placeholder.com/800x400?text=Hero" alt="Hero" /></p>
<p>This is mock AI-generated blog content for E2E testing. Images have been added.</p>
<p>Key points include setup, authentication, and your first request.</p>
`.trim();

/** Content with [TWEET:0] placeholder for E2E tweet-insertion tests */
const MOCK_CONTENT_WITH_TWEET_PLACEHOLDER = `
<h2>How to Get Started with Example API</h2>
<p>This is mock AI-generated blog content for E2E testing.</p>
<p>[TWEET:0]</p>
<p>Key points include setup, authentication, and your first request.</p>
`.trim();

/** Sample tweets for E2E (tweet search and placeholder replacement) */
const MOCK_TWEETS = [
  { text: 'E2E related tweet: streaming and placeholders work together.' },
];

/** Default credits payload (frontend receives this as response.data from GET /api/v1/user/credits) */
const DEFAULT_CREDITS = {
  availableCredits: 10,
  totalCredits: 10,
  usedCredits: 0,
  basePlan: 'Free',
  isUnlimited: false,
  breakdown: [],
};

/** Credits payloads for E2E (Content Topics button display tests) */
function creditsWithPosts(available = 5) {
  return { availableCredits: available, totalCredits: 10, usedCredits: 10 - available, basePlan: 'Free', isUnlimited: false, breakdown: [] };
}
function creditsZero() {
  return { availableCredits: 0, totalCredits: 1, usedCredits: 1, basePlan: 'Free', isUnlimited: false, breakdown: [] };
}
function creditsUnlimited() {
  return { availableCredits: 0, totalCredits: 0, usedCredits: 0, basePlan: 'Pro', isUnlimited: true, breakdown: [] };
}

/** JSON response helper */
function json(obj) {
  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj),
  };
}

/** Match request URL by path (works for any host) */
function pathMatch(url, path) {
  try {
    const u = new URL(url);
    return u.pathname === path || u.pathname === path.replace(/^\//, '');
  } catch {
    return url.includes(path);
  }
}

/** Match path prefix (e.g. /api/v1/posts for /api/v1/posts/123) */
function pathPrefixMatch(url, prefix) {
  try {
    const u = new URL(url);
    const p = prefix.startsWith('/') ? prefix : `/${prefix}`;
    return u.pathname === p || u.pathname.startsWith(p + '/');
  } catch {
    return url.includes(prefix);
  }
}

const MOCK_POST = {
  id: 'e2e-post-1',
  title: 'E2E Test Post',
  content: '<p>Test content</p>',
  slug: 'e2e-test-post',
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const E2E_JOB_CONTENT = 'e2e-job-content';
const E2E_JOB_ANALYSIS = 'e2e-job-analysis';

const MOCK_CONTENT_GENERATION_RESULT = {
  success: true,
  data: { content: MOCK_CONTENT, blogPost: { content: MOCK_CONTENT, title: MOCK_TOPICS[0].title } },
  savedPost: {
    ...MOCK_POST,
    content: MOCK_CONTENT,
    title: MOCK_TOPICS[0].title,
    created_at: MOCK_POST.createdAt,
  },
  imageGeneration: { needsImageGeneration: false },
};

/** Job result with image generation needed (for background image test) */
const MOCK_CONTENT_WITH_IMAGE_GEN = {
  ...MOCK_CONTENT_GENERATION_RESULT,
  imageGeneration: {
    needsImageGeneration: true,
    blogPostId: MOCK_POST.id,
    topic: MOCK_TOPICS[0],
    organizationId: MOCK_USER.organizationId,
  },
};

/**
 * Install mocks with optional behavior for worker queue tests.
 * @param {import('@playwright/test').Page} page
 * @param {{ progressiveJobStatus?: boolean, failFirstThenRetry?: boolean, imageGenerationInBackground?: boolean }} options
 *   - progressiveJobStatus: job status returns "running" on first poll, "succeeded" on second (shows progress UI)
 *   - failFirstThenRetry: job status returns "failed" on first poll, "succeeded" on subsequent (tests retry flow)
 *   - imageGenerationInBackground: job result includes needsImageGeneration; images API returns content with images (progressive UX)
 */
async function installWorkflowMocksWithOptions(page, options = {}) {
  const { progressiveJobStatus = false, failFirstThenRetry = false, imageGenerationInBackground = false, userCredits = null, analysisJobFails = false, analysisSyncFails = false, asSuperAdmin = false } = options;
  const pollCounts = {};

  await installWorkflowMocksBase(page, {
    imageGenerationInBackground,
    userCredits,
    analysisSyncFails,
    asSuperAdmin,
    jobsStatusHandler: (jobId) => {
      pollCounts[jobId] = (pollCounts[jobId] || 0) + 1;
      const pollNum = pollCounts[jobId];
      const isAnalysis = jobId === E2E_JOB_ANALYSIS;

      if (analysisJobFails && isAnalysis) {
        return {
          jobId,
          status: 'failed',
          progress: 0,
          error: 'Scraping failed',
          result: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      if (failFirstThenRetry && pollNum === 1) {
        return {
          jobId,
          status: 'failed',
          progress: 0,
          currentStep: 'Failed',
          error: 'Simulated failure for e2e retry test',
          errorCode: 'E2E_TEST_FAILURE',
          result: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      if (progressiveJobStatus && pollNum === 1) {
        return {
          jobId,
          status: 'running',
          progress: 50,
          currentStep: isAnalysis ? 'Analyzing website…' : 'Writing…',
          estimatedTimeRemaining: 30,
          error: null,
          errorCode: null,
          result: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      const result = isAnalysis
        ? { ...MOCK_ANALYSIS }
        : (imageGenerationInBackground ? MOCK_CONTENT_WITH_IMAGE_GEN : MOCK_CONTENT_GENERATION_RESULT);
      return {
        jobId,
        status: 'succeeded',
        progress: 100,
        currentStep: 'Complete',
        error: null,
        errorCode: null,
        result,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },
  });
}

/** Install route mocks for all workflow + auth + user APIs */
async function installWorkflowMocks(page) {
  return installWorkflowMocksBase(page, {});
}

const E2E_TWEET_STREAM_ID = 'e2e-tweet-stream';

/** Mock funnel steps and lead funnel for analytics e2e (PR #195 / #258). */
const MOCK_FUNNEL_STEPS = [
  { step: 'signup', name: 'Signup', count: 10, conversion_rate: 100 },
  { step: 'activated', name: 'Activated', count: 5, conversion_rate: 50 },
];
const MOCK_LEAD_FUNNEL_STEPS = [
  { step: 'visit', name: 'Visit', count: 100, conversion_rate: 100 },
  { step: 'lead', name: 'Lead', count: 20, conversion_rate: 20 },
];

async function installWorkflowMocksBase(page, options = {}) {
  const { jobsStatusHandler, imageGenerationInBackground = false, userCredits = null, analysisSyncFails = false, contentWithTweetPlaceholder = false, tweetsForTopic = null, tweetStreamResponds = false, asSuperAdmin = false } = options;
  const creditsPayload = userCredits != null ? userCredits : DEFAULT_CREDITS;
  const authUser = asSuperAdmin ? MOCK_USER_SUPERADMIN : MOCK_USER;
  const patterns = [
    { path: '/api/analyze-website', method: 'POST', body: () => (analysisSyncFails ? json({ success: false, error: 'Scraping failed' }) : json(MOCK_ANALYSIS)) },
    { path: '/api/generate-audiences', method: 'POST', body: () => json({ scenarios: MOCK_SCENARIOS }) },
    { path: '/api/generate-pitches', method: 'POST', body: () => json({ scenarios: MOCK_SCENARIOS }) },
    { path: '/api/generate-audience-images', method: 'POST', body: () => json({ scenarios: MOCK_SCENARIOS }) },
    { path: '/api/trending-topics', method: 'POST', body: () => json({ topics: MOCK_TOPICS }) },
    { path: '/api/tweets/search-for-topic', method: 'POST', body: () => json({ tweets: tweetsForTopic != null ? tweetsForTopic : [] }) },
    {
      path: '/api/generate-content',
      method: 'POST',
      body: () =>
        json({
          success: true,
          blogPost: { content: contentWithTweetPlaceholder ? MOCK_CONTENT_WITH_TWEET_PLACEHOLDER : MOCK_CONTENT, title: MOCK_TOPICS[0].title },
          content: contentWithTweetPlaceholder ? MOCK_CONTENT_WITH_TWEET_PLACEHOLDER : MOCK_CONTENT,
        }),
    },
    { path: '/api/export', method: 'POST', body: () => json({ success: true }) },
    { path: '/api/images/generate-for-blog', method: 'POST', body: () => json({ success: true, content: MOCK_CONTENT_WITH_IMAGES, blogPostId: MOCK_POST.id }) },
    { path: '/api/v1/jobs/content-generation', method: 'POST', body: () => ({ status: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId: E2E_JOB_CONTENT }) }) },
    { path: '/api/v1/jobs/website-analysis', method: 'POST', body: () => (analysisSyncFails ? { status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) } : { status: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId: E2E_JOB_ANALYSIS }) }) },
    { path: '/api/v1/session/create', method: 'POST', body: () => json({ session_id: 'e2e-session-id' }) },
    { path: '/api/v1/auth/me', method: 'GET', body: () => json({ success: true, user: authUser }) },
    { path: '/api/v1/auth/refresh', method: 'POST', body: () => json({ success: true, accessToken: fakeJWT(), refreshToken: fakeJWT() }) },
    { path: '/api/v1/auth/logout', method: 'POST', body: () => json({}) },
    { path: '/api/v1/user/credits', method: 'GET', body: () => json({ data: creditsPayload }) },
    { path: '/api/v1/audiences', method: 'GET', body: () => json({ success: true, audiences: [] }) },
    { path: '/api/v1/analytics/track', method: 'POST', body: () => json({}) },
    { path: '/api/v1/analytics/track-batch', method: 'POST', body: () => json({}) },
  ];

  await page.route('**/*', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (tweetStreamResponds && method === 'POST' && url.includes('tweets/search-for-topic-stream')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ connectionId: E2E_TWEET_STREAM_ID, streamUrl: `/api/v1/stream/${E2E_TWEET_STREAM_ID}` }),
      });
    }
    if (tweetStreamResponds && method === 'GET' && url.includes(`/api/v1/stream/${E2E_TWEET_STREAM_ID}`)) {
      const tweets = tweetsForTopic != null ? tweetsForTopic : MOCK_TWEETS;
      const sseBody = `event: complete\ndata: ${JSON.stringify({ tweets })}\n\n`;
      return route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: sseBody,
      });
    }

    for (const { path, method: m, body } of patterns) {
      const fullPath = path.startsWith('/') ? path : `/${path}`;
      if ((pathMatch(url, fullPath) || url.includes(path)) && m === method) {
        return route.fulfill(body());
      }
    }

    if (pathPrefixMatch(url, '/api/v1/posts') && method === 'GET') {
      try {
        const p = new URL(url).pathname;
        if (p === '/api/v1/posts' || p === 'api/v1/posts') {
          return route.fulfill(json({ posts: [] }));
        }
        const match = p.match(/\/api\/v1\/posts\/([^/]+)$/);
        if (match) {
          return route.fulfill(json({ ...MOCK_POST, id: match[1] }));
        }
      } catch (_) {}
    }
    if (pathPrefixMatch(url, '/api/v1/posts') && method === 'POST') {
      if (url.includes('/adopt-session')) return route.fulfill(json({ success: true }));
      return route.fulfill(json({ ...MOCK_POST }));
    }
    if (pathPrefixMatch(url, '/api/v1/posts') && (method === 'PUT' || method === 'PATCH')) {
      return route.fulfill(json({ ...MOCK_POST, updatedAt: new Date().toISOString() }));
    }
    if (pathPrefixMatch(url, '/api/v1/posts') && method === 'DELETE') {
      return route.fulfill(json({ success: true }));
    }

    const jobsStatusMatch = url.match(/\/api\/v1\/jobs\/([^/]+)\/status/);
    if (jobsStatusMatch && method === 'GET') {
      const jobId = jobsStatusMatch[1];
      const custom = jobsStatusHandler && jobsStatusHandler(jobId);
      if (custom) {
        return route.fulfill(json(custom));
      }
      const isAnalysis = jobId === E2E_JOB_ANALYSIS;
      const contentResult = imageGenerationInBackground ? MOCK_CONTENT_WITH_IMAGE_GEN : MOCK_CONTENT_GENERATION_RESULT;
      const result = isAnalysis ? { ...MOCK_ANALYSIS } : contentResult;
      return route.fulfill(json({
        jobId,
        status: 'succeeded',
        progress: 100,
        currentStep: 'Complete',
        error: null,
        errorCode: null,
        result,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    }
    if (pathPrefixMatch(url, '/api/v1/organizations') && method === 'GET' && url.includes('/ctas')) {
      return route.fulfill(json({ success: true, ctas: [], count: 0, has_sufficient_ctas: false }));
    }
    if (pathPrefixMatch(url, '/api/v1/jobs/') && method === 'POST' && url.includes('/retry')) {
      const jobIdMatch = url.match(/\/api\/v1\/jobs\/([^/]+)\/retry/);
      const jobId = jobIdMatch ? jobIdMatch[1] : E2E_JOB_CONTENT;
      return route.fulfill(json({ jobId }));
    }

    // Bundle: non-stream calculate (2+ strategies) returns pricing for E2E
    if (pathMatch(url, '/api/v1/strategies/bundle/calculate') && method === 'GET' && !url.includes('stream=true')) {
      return route.fulfill(json({
        bundlePricing: { strategyCount: 2, bundleMonthly: 25, savings: { monthlyDiscount: 5 }, postsPerStrategy: { recommended: 4, maximum: 8 } },
        bundleOverview: { title: 'Multi-Audience Content Strategy', overview: 'E2E mock bundle overview.', totalMonthlySearches: 50000, audienceCount: 2 },
      }));
    }

    // Stream endpoints return 404 so E2E exercises fallback paths (polling / non-stream).
    if (pathMatch(url, '/api/v1/blog/generate-stream') && method === 'POST') {
      return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
    }
    if (pathMatch(url, '/api/v1/audiences/generate-stream') && method === 'POST') {
      return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
    }
    if (pathMatch(url, '/api/v1/trending-topics/stream') && method === 'POST') {
      return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
    }
    if (pathMatch(url, '/api/v1/topics/generate-stream') && method === 'POST') {
      return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
    }
    if (url.includes('stream=true') && pathMatch(url, '/api/v1/strategies/bundle/calculate')) {
      return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
    }
    if (pathPrefixMatch(url, '/api/v1/stream/') && method === 'GET') {
      return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
    }
    if (url.match(/\/api\/v1\/jobs\/[^/]+\/stream/) && method === 'GET') {
      return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
    }

    // Analytics (superadmin): funnel, lead-funnel, stage users, metrics, cohorts, insights (PR #195 / #258)
    if (pathPrefixMatch(url, '/api/v1/analytics') && method === 'GET') {
      if (url.includes('/analytics/funnel?') && !url.includes('/funnel/stage/')) {
        return route.fulfill(json({ steps: MOCK_FUNNEL_STEPS }));
      }
      if (url.includes('/analytics/lead-funnel?')) {
        return route.fulfill(json({ steps: MOCK_LEAD_FUNNEL_STEPS }));
      }
      if (url.match(/\/api\/v1\/analytics\/funnel\/stage\/[^/]+\/users\?/)) {
        return route.fulfill(json({ users: [] }));
      }
      if (url.includes('/analytics/comprehensive-metrics?')) {
        return route.fulfill(json({ revenue: {}, referrals: {}, subscriptions: {} }));
      }
      if (url.includes('/analytics/cohorts?')) {
        return route.fulfill(json({ cohorts: [], summary: {} }));
      }
      if (url.includes('/analytics/insights?')) {
        return route.fulfill(json({ insights: [], sections: {} }));
      }
    }

    return route.continue();
  });
}

/** Minimal workflow state so App shows dashboard (not onboarding funnel) for E2E. */
function getE2ECompletedWorkflowState() {
  return {
    userId: MOCK_USER.id,
    isAuthenticated: true,
    mode: 'authenticated',
    currentWorkflowStep: 1,
    currentStep: 1,
    completedWorkflowSteps: ['home'],
    stepResults: {
      home: {
        websiteAnalysis: {
          businessType: 'Technology',
          businessName: 'Example Inc',
          targetAudience: 'Developers and technical leads',
          contentFocus: 'Developer tools, APIs, and best practices',
          brandVoice: 'Professional, helpful',
          description: 'Example Inc provides developer tools.',
          keywords: [],
          decisionMakers: '',
          endUsers: '',
          customerProblems: [],
          searchBehavior: '',
          customerLanguage: [],
          contentIdeas: ['Getting started with APIs', 'Best practices for developers'],
          connectionMessage: '',
          businessModel: '',
          websiteGoals: '',
          blogStrategy: '',
          scenarios: [],
          brandColors: { primary: '', secondary: '', accent: '' },
          websiteUrl: 'https://example.com'
        },
        webSearchInsights: { brandResearch: null, keywordResearch: null, researchQuality: 'basic' },
        analysisCompleted: true,
        ctas: [],
        ctaCount: 0,
        hasSufficientCTAs: false
      },
      audience: { customerStrategy: null, targetSegments: [] },
      content: { trendingTopics: [], selectedContent: null, finalContent: '' },
      analytics: { performance: null }
    },
    analysisCompleted: true,
    strategyCompleted: false,
    strategySelectionCompleted: false,
    websiteUrl: 'https://example.com',
    selectedTopic: null,
    generatedContent: '',
    savedAt: new Date().toISOString(),
    version: '1.1'
  };
}

/** Inject localStorage tokens and completed workflow state so app shows dashboard. Call before goto. */
async function injectLoggedInUser(page) {
  const token = fakeJWT();
  const workflowState = getE2ECompletedWorkflowState();
  await page.addInitScript((t, stateJson) => {
    localStorage.setItem('accessToken', t);
    localStorage.setItem('refreshToken', t);
    if (stateJson) {
      try {
        localStorage.setItem('automate-my-blog-workflow-state', stateJson);
      } catch (e) {
        // ignore
      }
    }
  }, token, JSON.stringify(workflowState));
}

module.exports = {
  installWorkflowMocks,
  installWorkflowMocksWithOptions,
  injectLoggedInUser,
  fakeJWT,
  MOCK_USER,
  MOCK_USER_SUPERADMIN,
  MOCK_FUNNEL_STEPS,
  MOCK_LEAD_FUNNEL_STEPS,
  MOCK_ANALYSIS,
  MOCK_TOPICS,
  MOCK_CONTENT,
  MOCK_CONTENT_WITH_TWEET_PLACEHOLDER,
  MOCK_TWEETS,
  MOCK_SCENARIOS,
  MOCK_POST,
  DEFAULT_CREDITS,
  creditsWithPosts,
  creditsZero,
  creditsUnlimited,
  E2E_JOB_ANALYSIS,
};
