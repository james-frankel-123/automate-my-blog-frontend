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
    console.log(`🧹 Cleared cached analysis for user: ${targetUserId}`);
  }

  /**
   * Make HTTP request to backend API
   */
  async makeRequest(endpoint, options = {}) {
    // Normalize URL construction to prevent double slashes
    const normalizedEndpoint = endpoint.replace(/^\/+/, '');
    const url = `${this.baseURL}/${normalizedEndpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Add auth token if available
    const token = localStorage.getItem('accessToken');
    if (token) {
      defaultOptions.headers['Authorization'] = `Bearer ${token}`;
      console.log('🔍 makeRequest: Added Authorization header', { 
        endpoint: normalizedEndpoint,
        tokenStart: token.substring(0, 20) + '...'
      });
    } else {
      console.log('🔍 makeRequest: No token found', { endpoint: normalizedEndpoint });
    }

    // Add timeout with fallback for older browsers (60s for DALL-E generation)
    const timeoutSignal = typeof AbortSignal.timeout === 'function' 
      ? AbortSignal.timeout(60000) 
      : undefined;
    
    const requestOptions = {
      ...defaultOptions,
      ...options,
      ...(timeoutSignal && { signal: timeoutSignal }),
    };

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        // For file downloads, return the response directly
        return response;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      
      throw new Error(`API Error: ${error.message}`);
    }
  }

  /**
   * Analyze website content and extract business information
   */
  async analyzeWebsite(url) {
    try {
      const response = await this.makeRequest('/api/analyze-website', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });

      return response;
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
   * Generate blog post content
   */
  async generateContent(topic, businessInfo, additionalInstructions = '') {
    try {
      const response = await this.makeRequest('/api/generate-content', {
        method: 'POST',
        body: JSON.stringify({
          topic,
          businessInfo,
          additionalInstructions,
        }),
      });

      return response.blogPost;
    } catch (error) {
      throw new Error(`Failed to generate content: ${error.message}`);
    }
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
   * User authentication methods
   */
  async login(email, password) {
    try {
      const response = await this.makeRequest('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      return response;
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async register(userData) {
    try {
      const response = await this.makeRequest('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      return response;
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

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

  async logout() {
    try {
      await this.makeRequest('/api/v1/auth/logout', {
        method: 'POST',
      });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
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
   * Get current user ID from stored token
   */
  getCurrentUserId() {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return null;
      
      // Decode JWT token to get user ID (simple decode, not verification)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.sub;
    } catch (error) {
      return null;
    }
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
    const startTime = Date.now();
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
        let statusCode = 'unknown';
        
        try {
          response = await this.makeRequest('/api/v1/user/recent-analysis', {
            method: 'GET',
          });
          statusCode = response.statusCode || 'unknown';
        } catch (error) {
          // Handle 404 as normal response (user has no cached analysis)
          if (error.message.includes('404') || error.message.includes('HTTP 404')) {
            response = {
              success: false,
              analysis: null,
              message: 'No cached analysis found'
            };
            statusCode = '404';
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
    let sessionId = sessionStorage.getItem('audience_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('audience_session_id', sessionId);
      console.log('🆔 Created new audience session:', sessionId);
    }
    return sessionId;
  }

  /**
   * Create audience strategy (authenticated or anonymous)
   */
  async createAudience(audienceData) {
    try {
      const sessionId = this.getOrCreateSessionId();
      const headers = { 'Content-Type': 'application/json' };
      
      // ALWAYS send session ID as fallback (in case Authorization header gets stripped)
      headers['x-session-id'] = sessionId;

      const response = await this.makeRequest('/api/v1/audiences', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...audienceData,
          session_id: sessionId
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
      
      // ALWAYS send session ID as fallback (in case Authorization header gets stripped)
      headers['x-session-id'] = sessionId;
      
      // Debug: Log what headers we're sending
      console.log('🔍 getUserAudiences headers debug:', {
        hasToken: !!localStorage.getItem('accessToken'),
        headers: headers,
        sessionId: sessionId
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

      const queryString = params.toString();
      const url = `/api/v1/audiences${queryString ? '?' + queryString : ''}`;

      const response = await this.makeRequest(url, { headers });
      console.log('📋 Loaded audiences:', response.audiences?.length || 0);
      return response;
    } catch (error) {
      throw new Error(`Failed to get audiences: ${error.message}`);
    }
  }

  /**
   * Get specific audience with topics and keywords
   */
  async getAudience(audienceId) {
    try {
      const sessionId = this.getOrCreateSessionId();
      const headers = {};
      
      // Add session ID for anonymous users
      if (!localStorage.getItem('accessToken')) {
        headers['X-Session-ID'] = sessionId;
      }

      const response = await this.makeRequest(`/api/v1/audiences/${audienceId}`, { headers });
      return response;
    } catch (error) {
      throw new Error(`Failed to get audience: ${error.message}`);
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
      
      // ALWAYS send session ID as fallback (in case Authorization header gets stripped)
      headers['x-session-id'] = sessionId;

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
      
      // ALWAYS send session ID as fallback (in case Authorization header gets stripped)
      headers['x-session-id'] = sessionId;

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
      
      console.log('🔄 Session adopted:', response.transferred);
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
}

// Create singleton instance
const autoBlogAPI = new AutoBlogAPI();

export default autoBlogAPI;