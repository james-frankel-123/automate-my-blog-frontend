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
  const { progressiveJobStatus = false, failFirstThenRetry = false, imageGenerationInBackground = false } = options;
  const pollCounts = {};

  await installWorkflowMocksBase(page, {
    imageGenerationInBackground,
    jobsStatusHandler: (jobId) => {
      pollCounts[jobId] = (pollCounts[jobId] || 0) + 1;
      const pollNum = pollCounts[jobId];
      const isAnalysis = jobId === E2E_JOB_ANALYSIS;

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

async function installWorkflowMocksBase(page, options = {}) {
  const { jobsStatusHandler, imageGenerationInBackground = false } = options;
  const patterns = [
    { path: '/api/analyze-website', method: 'POST', body: () => json(MOCK_ANALYSIS) },
    { path: '/api/generate-audiences', method: 'POST', body: () => json({ scenarios: MOCK_SCENARIOS }) },
    { path: '/api/generate-pitches', method: 'POST', body: () => json({ scenarios: MOCK_SCENARIOS }) },
    { path: '/api/generate-audience-images', method: 'POST', body: () => json({ scenarios: MOCK_SCENARIOS }) },
    { path: '/api/trending-topics', method: 'POST', body: () => json({ topics: MOCK_TOPICS }) },
    { path: '/api/tweets/search-for-topic', method: 'POST', body: () => json({ tweets: [] }) },
    {
      path: '/api/generate-content',
      method: 'POST',
      body: () =>
        json({
          success: true,
          blogPost: { content: MOCK_CONTENT, title: MOCK_TOPICS[0].title },
          content: MOCK_CONTENT,
        }),
    },
    { path: '/api/export', method: 'POST', body: () => json({ success: true }) },
    { path: '/api/images/generate-for-blog', method: 'POST', body: () => json({ success: true, content: MOCK_CONTENT_WITH_IMAGES, blogPostId: MOCK_POST.id }) },
    { path: '/api/v1/jobs/content-generation', method: 'POST', body: () => ({ status: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId: E2E_JOB_CONTENT }) }) },
    { path: '/api/v1/jobs/website-analysis', method: 'POST', body: () => ({ status: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId: E2E_JOB_ANALYSIS }) }) },
    { path: '/api/v1/session/create', method: 'POST', body: () => json({ session_id: 'e2e-session-id' }) },
    { path: '/api/v1/auth/me', method: 'GET', body: () => json({ success: true, user: MOCK_USER }) },
    { path: '/api/v1/auth/refresh', method: 'POST', body: () => json({ success: true, accessToken: fakeJWT(), refreshToken: fakeJWT() }) },
    { path: '/api/v1/auth/logout', method: 'POST', body: () => json({}) },
    { path: '/api/v1/user/credits', method: 'GET', body: () => json({ data: { availableCredits: 10, totalCredits: 10, usedCredits: 0, basePlan: 'Free', isUnlimited: false, breakdown: [] } }) },
    { path: '/api/v1/audiences', method: 'GET', body: () => json({ success: true, audiences: [] }) },
    { path: '/api/v1/analytics/track', method: 'POST', body: () => json({}) },
    { path: '/api/v1/analytics/track-batch', method: 'POST', body: () => json({}) },
  ];

  await page.route('**/*', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

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

    return route.continue();
  });
}

/** Inject localStorage tokens so app treats user as logged in. Call before goto. */
async function injectLoggedInUser(page) {
  const token = fakeJWT();
  await page.addInitScript((t) => {
    localStorage.setItem('accessToken', t);
    localStorage.setItem('refreshToken', t);
  }, token);
}

module.exports = {
  installWorkflowMocks,
  installWorkflowMocksWithOptions,
  injectLoggedInUser,
  fakeJWT,
  MOCK_USER,
  MOCK_ANALYSIS,
  MOCK_TOPICS,
  MOCK_CONTENT,
  MOCK_SCENARIOS,
  MOCK_POST,
};
