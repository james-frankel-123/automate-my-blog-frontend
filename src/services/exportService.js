import { fileUtils, postUtils } from '../utils/workflowUtils';
import { message } from 'antd';

/**
 * Export Service
 * Handles all blog post export functionality extracted from App.js
 */

/**
 * Export Service Class
 * Manages different export formats and post state
 */
class ExportService {
  /**
   * Export post as Markdown format
   * EXTRACTED FROM: App.js exportAsMarkdown() function
   */
  static exportAsMarkdown(selectedTopic, generatedContent, stepResults, websiteUrl, setPostState, setPreviewMode) {
    const post = postUtils.createPostObject(selectedTopic, generatedContent, stepResults, websiteUrl);
    
    if (!post) {
      message.error('No blog post data available for export');
      return false;
    }

    const markdown = fileUtils.createMarkdownContent(post);
    fileUtils.downloadFile(markdown, `${post.slug}.md`, 'text/markdown');
    
    // Lock the post after export
    setPostState('exported');
    setPreviewMode(true); // Force to preview mode
    message.success('Post exported and locked. Generate a new post to make further changes.');
    
    return true;
  }

  /**
   * Export post as HTML format
   * EXTRACTED FROM: App.js exportAsHTML() function
   */
  static exportAsHTML(selectedTopic, generatedContent, stepResults, websiteUrl, setPostState, setPreviewMode) {
    const post = postUtils.createPostObject(selectedTopic, generatedContent, stepResults, websiteUrl);
    
    if (!post) {
      message.error('No blog post data available for export');
      return false;
    }

    const html = fileUtils.createHTMLContent(post);
    fileUtils.downloadFile(html, `${post.slug}.html`, 'text/html');
    
    // Lock the post after export
    setPostState('exported');
    setPreviewMode(true); // Force to preview mode
    message.success('Post exported and locked. Generate a new post to make further changes.');
    
    return true;
  }

  /**
   * Export post as JSON format
   * EXTRACTED FROM: App.js exportAsJSON() function
   */
  static exportAsJSON(selectedTopic, generatedContent, stepResults, websiteUrl, setPostState, setPreviewMode) {
    const post = postUtils.createPostObject(selectedTopic, generatedContent, stepResults, websiteUrl);
    
    if (!post) {
      message.error('No blog post data available for export');
      return false;
    }

    const jsonData = fileUtils.createJSONContent(post);
    fileUtils.downloadFile(jsonData, `${post.slug}.json`, 'application/json');
    
    // Lock the post after export
    setPostState('exported');
    setPreviewMode(true); // Force to preview mode
    message.success('Post exported and locked. Generate a new post to make further changes.');
    
    return true;
  }

  /**
   * Export complete package (all formats in ZIP)
   * EXTRACTED FROM: App.js exportCompletePackage() function (placeholder)
   */
  static exportCompletePackage(selectedTopic, generatedContent, stepResults, websiteUrl, setPostState, setPreviewMode) {
    const post = postUtils.createPostObject(selectedTopic, generatedContent, stepResults, websiteUrl);
    
    if (!post) {
      message.error('No blog post data available for export');
      return false;
    }

    // For now, this is a placeholder - full ZIP implementation would require additional libraries
    message.info('Complete package export is not yet implemented. Please use individual formats.');
    return false;
  }

  /**
   * Get export formats available for current post
   */
  static getAvailableFormats() {
    return [
      {
        key: 'markdown',
        name: 'Markdown',
        description: 'Perfect for Jekyll, Hugo, or GitHub Pages',
        icon: 'FileMarkdownOutlined',
        mimeType: 'text/markdown',
        extension: '.md',
        color: 'var(--color-primary)'
      },
      {
        key: 'html',
        name: 'HTML',
        description: 'Copy-paste ready for any CMS',
        icon: 'FileTextOutlined',
        mimeType: 'text/html',
        extension: '.html',
        color: 'var(--color-success)'
      },
      {
        key: 'json',
        name: 'JSON',
        description: 'For developers and API integrations',
        icon: 'DatabaseOutlined',
        mimeType: 'application/json',
        extension: '.json',
        color: 'var(--color-success)'
      },
      {
        key: 'package',
        name: 'Complete Package',
        description: 'All formats + metadata in one ZIP',
        icon: 'FileZipOutlined',
        mimeType: 'application/zip',
        extension: '.zip',
        color: 'var(--color-warning)',
        disabled: true // Not yet implemented
      }
    ];
  }

  /**
   * Check if post can be exported
   */
  static canExport(selectedTopic, generatedContent, stepResults) {
    if (!selectedTopic || !generatedContent || !stepResults) {
      return {
        canExport: false,
        reason: 'Missing required data for export'
      };
    }

    const post = postUtils.createPostObject(selectedTopic, generatedContent, stepResults);
    
    if (!post) {
      return {
        canExport: false,
        reason: 'Unable to create post metadata'
      };
    }

    if (post.content.length < 100) {
      return {
        canExport: false,
        reason: 'Content too short for export'
      };
    }

    return {
      canExport: true,
      reason: 'Ready for export'
    };
  }

  /**
   * Get post export preview
   */
  static getExportPreview(selectedTopic, generatedContent, stepResults, websiteUrl) {
    const post = postUtils.createPostObject(selectedTopic, generatedContent, stepResults, websiteUrl);
    
    if (!post) {
      return null;
    }

    return {
      title: post.title,
      wordCount: post.wordCount,
      readingTime: post.readingTime,
      category: post.category,
      tags: post.tags,
      brandColors: post.brandColors,
      businessName: post.businessName,
      slug: post.slug
    };
  }
}

/**
 * CMS Integration Service
 * Handles CMS-specific export and integration logic
 */
class CMSIntegrationService {
  /**
   * Generate CMS-specific integration code
   * EXTRACTED FROM: App.js generateCMSCode() function
   */
  static generateIntegrationCode(cmsId, websiteUrl) {
    const codeExamples = {
      wordpress: `// WordPress Integration
add_action('wp_ajax_autoblog_webhook', 'handle_autoblog_post');
add_action('wp_ajax_nopriv_autoblog_webhook', 'handle_autoblog_post');

function handle_autoblog_post() {
  $data = json_decode(file_get_contents('php://input'), true);
  
  $post_data = array(
    'post_title' => sanitize_text_field($data['title']),
    'post_content' => wp_kses_post($data['content']),
    'post_status' => 'draft',
    'post_type' => 'post',
    'meta_input' => array(
      'autoblog_generated' => true,
      'source_website' => '${websiteUrl}'
    )
  );
  
  wp_insert_post($post_data);
  wp_send_json_success();
}

// Webhook URL: ${websiteUrl}/wp-admin/admin-ajax.php?action=autoblog_webhook`,

      shopify: `// Shopify Blog API Integration
const shopifyAPI = require('shopify-api-node');

const shopify = new shopifyAPI({
  shopName: 'your-shop-name',
  apiKey: process.env.SHOPIFY_API_KEY,
  password: process.env.SHOPIFY_PASSWORD
});

// Create blog post
const blogPost = await shopify.article.create(BLOG_ID, {
  title: data.title,
  body_html: data.content,
  tags: data.tags.join(','),
  published: false
});

// Webhook endpoint: ${websiteUrl}/api/autoblog-webhook`,

      ghost: `// Ghost Admin API Integration
const GhostAdminAPI = require('@tryghost/admin-api');

const api = new GhostAdminAPI({
  url: '${websiteUrl}',
  key: process.env.GHOST_ADMIN_API_KEY,
  version: 'v4'
});

// Webhook endpoint: ${websiteUrl}/ghost/api/v4/webhooks/autoblog/`,

      webflow: `// Webflow CMS Integration
const webflow = new WebflowAPI({
  token: process.env.WEBFLOW_API_TOKEN
});

// Collection ID: your-blog-collection-id
// Webhook: ${websiteUrl}/api/autoblog-webhook
// Content published to: ${websiteUrl}/blog`,

      custom: `// Custom CMS Integration
app.post('/api/autoblog-webhook', async (req, res) => {
  const { title, content, meta_description, tags } = req.body.data;
  
  // Your custom CMS logic here
  await yourCMS.createPost({
    title,
    content,
    description: meta_description,
    tags,
    status: 'published'
  });
  
  res.status(200).send('OK');
});`
    };

    return codeExamples[cmsId] || '// Integration code will be generated based on your selection';
  }

  /**
   * Get CMS-specific export format
   */
  static getCMSExportFormat(cmsId, post) {
    switch (cmsId) {
      case 'wordpress':
        return this.generateWordPressXML(post);
      case 'ghost':
        return this.generateGhostJSON(post);
      case 'shopify':
        return this.generateShopifyJSON(post);
      default:
        return fileUtils.createJSONContent(post);
    }
  }

  /**
   * Generate WordPress XML export format
   */
  static generateWordPressXML(post) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.excerpt}]]></description>
      <content:encoded><![CDATA[${post.content}]]></content:encoded>
      <wp:post_type>post</wp:post_type>
      <wp:status>draft</wp:status>
      <category><![CDATA[${post.category}]]></category>
      ${post.tags.map(tag => `<category domain="post_tag"><![CDATA[${tag}]]></category>`).join('\n      ')}
    </item>
  </channel>
</rss>`;
  }

  /**
   * Generate Ghost JSON export format
   */
  static generateGhostJSON(post) {
    return JSON.stringify({
      posts: [{
        title: post.title,
        slug: post.slug,
        html: post.content.replace(/\n/g, '<br>'),
        status: 'draft',
        tags: post.tags.map(tag => ({ name: tag })),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]
    }, null, 2);
  }

  /**
   * Generate Shopify JSON export format
   */
  static generateShopifyJSON(post) {
    return JSON.stringify({
      article: {
        title: post.title,
        body_html: post.content.replace(/\n/g, '<br>'),
        tags: post.tags.join(','),
        published: false,
        summary: post.excerpt
      }
    }, null, 2);
  }
}

export {
  ExportService,
  CMSIntegrationService
};

export default ExportService;