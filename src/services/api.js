// AutoBlog API Service
class AutoBlogAPI {
  constructor() {
    // Use environment variable for backend URL, fallback to local development
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  }

  /**
   * Make HTTP request to backend API
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const requestOptions = {
      ...defaultOptions,
      ...options,
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
      console.error('API request failed:', error);
      throw new Error(`API Error: ${error.message}`);
    }
  }

  /**
   * Analyze website content and extract business information
   */
  async analyzeWebsite(url) {
    try {
      console.log('Analyzing website:', url);
      console.log('Backend URL:', this.baseURL);
      
      const response = await this.makeRequest('/api/analyze-website', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });

      return response;
    } catch (error) {
      console.error('Website analysis failed:', error);
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
      console.error('Trending topics generation failed:', error);
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
      console.error('Content generation failed:', error);
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
      console.error('Export failed:', error);
      throw new Error(`Failed to export content: ${error.message}`);
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
      console.error('Health check failed:', error);
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
      console.error('API info request failed:', error);
      throw new Error(`Failed to get API info: ${error.message}`);
    }
  }
}

// Create singleton instance
const autoBlogAPI = new AutoBlogAPI();

export default autoBlogAPI;