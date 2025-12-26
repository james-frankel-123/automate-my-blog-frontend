// Automate My Blog API Service
class AutoBlogAPI {
  constructor() {
    // Use environment variable for backend URL and ensure no trailing slash
    this.baseURL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
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
}

// Create singleton instance
const autoBlogAPI = new AutoBlogAPI();

export default autoBlogAPI;