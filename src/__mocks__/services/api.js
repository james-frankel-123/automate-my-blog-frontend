// Mock API service for testing
const autoBlogAPI = {
  // Auth methods
  login: jest.fn().mockResolvedValue({
    success: true,
    user: {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      permissions: [],
    },
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  }),
  
  register: jest.fn().mockResolvedValue({
    success: true,
    user: {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      permissions: [],
      organization: {
        id: 'org-123',
        name: 'Test Organization',
        role: 'owner',
      },
    },
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  }),
  
  logout: jest.fn().mockResolvedValue({ success: true }),
  
  getCurrentUser: jest.fn().mockResolvedValue({
    success: true,
    user: {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      permissions: [],
    },
  }),
  
  // User credits
  getUserCredits: jest.fn().mockResolvedValue({
    totalCredits: 10,
    usedCredits: 3,
    availableCredits: 7,
    basePlan: 'Free',
    isUnlimited: false,
    breakdown: [],
  }),
  
  // Website analysis
  analyzeWebsite: jest.fn().mockResolvedValue({
    success: true,
    analysis: {
      businessName: 'Test Business',
      businessType: 'Technology',
      targetAudience: 'Developers',
      contentFocus: 'Technical tutorials',
      brandVoice: 'Professional',
      description: 'A test business',
      keywords: ['testing', 'development'],
    },
    webSearchInsights: {
      researchQuality: 'basic',
    },
  }),
  
  getRecentAnalysis: jest.fn().mockResolvedValue({
    success: true,
    analysis: {
      websiteUrl: 'https://example.com',
      businessName: 'Test Business',
      businessType: 'Technology',
      targetAudience: 'Developers',
      contentFocus: 'Technical tutorials',
      brandVoice: 'Professional',
    },
  }),
  
  // Audience management
  getAudiences: jest.fn().mockResolvedValue({
    success: true,
    audiences: [],
  }),
  
  createAudience: jest.fn().mockResolvedValue({
    success: true,
    audience: {
      id: 'audience-123',
      name: 'Test Audience',
    },
  }),
  
  // Session management
  initializeSession: jest.fn().mockResolvedValue({
    success: true,
    sessionId: 'session-123',
  }),
  
  adoptSession: jest.fn().mockResolvedValue({
    success: true,
    adoptedCount: 1,
  }),
  
  adoptPostsSession: jest.fn().mockResolvedValue({
    success: true,
    adoptedCount: 0,
  }),
  
  adoptAnalysisSession: jest.fn().mockResolvedValue({
    success: true,
    adoptedCount: 1,
  }),
  
  // Voice samples (for dashboard feature tiles)
  listVoiceSamples: jest.fn().mockResolvedValue({
    samples: [],
  }),

  // Posts
  getPosts: jest.fn().mockResolvedValue({
    success: true,
    posts: [],
  }),
  
  createPost: jest.fn().mockResolvedValue({
    success: true,
    post: {
      id: 'post-123',
      title: 'Test Post',
      content: 'Test content',
    },
  }),
  
  // Content generation
  generateContent: jest.fn().mockResolvedValue({
    success: true,
    content: 'Generated content for testing',
  }),

  searchTweetsForTopic: jest.fn().mockResolvedValue({
    tweets: [],
    searchTermsUsed: [],
    success: true,
  }),

  searchTweetsForTopicStream: jest.fn().mockResolvedValue({
    connectionId: 'mock-connection-id',
    streamUrl: 'https://api.example.com/api/v1/stream/mock-connection-id?token=mock',
  }),

  fetchRelatedContent: jest.fn().mockResolvedValue({ tweets: [], videos: [], searchTermsUsed: {} }),

  searchNewsArticlesForTopicStream: jest.fn().mockResolvedValue({
    connectionId: 'mock-news-connection-id',
    streamUrl: 'https://api.example.com/api/v1/stream/mock-news-connection-id?token=mock',
  }),
  searchYouTubeVideosForTopicStream: jest.fn().mockResolvedValue({
    connectionId: 'mock-youtube-connection-id',
    streamUrl: 'https://api.example.com/api/v1/stream/mock-youtube-connection-id?token=mock',
  }),

  getTrendingTopics: jest.fn().mockResolvedValue([]),
  generateTrendingTopicsStream: jest.fn().mockRejectedValue(new Error('Not available')),
  generateTopicsStream: jest.fn().mockRejectedValue(new Error('Not available')),

  connectToStream: jest.fn().mockReturnValue({ close: jest.fn() }),
  
  // Lead tracking
  trackLeadConversion: jest.fn().mockResolvedValue({
    success: true,
  }),
  
  // Referral processing
  processReferralSignup: jest.fn().mockResolvedValue({
    success: true,
    type: 'referral',
    rewardValue: 10,
  }),
  
  // Impersonation
  endImpersonation: jest.fn().mockResolvedValue({
    success: true,
  }),
  
  // Analytics
  trackEvent: jest.fn().mockResolvedValue({ success: true }),
  trackPageView: jest.fn().mockResolvedValue({ success: true }),
};

export default autoBlogAPI;
