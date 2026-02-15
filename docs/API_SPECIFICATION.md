# AutoBlog API Specification

## 📋 API Overview

AutoBlog provides a comprehensive RESTful API for managing automated blog content generation. The API follows standard HTTP conventions and returns JSON responses, enabling seamless integration with websites, CMSes, and custom applications.

**Base URL**: `https://api.autoblog.com/v1`  
**Authentication**: Bearer token (JWT)  
**Rate Limiting**: 1000 requests/hour per API key  
**Response Format**: JSON with consistent error handling

## 🔐 Authentication

### API Key Authentication
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.autoblog.com/v1/content/pipelines
```

### JWT Token Structure
```json
{
  "tenant_id": "uuid-4",
  "user_id": "uuid-4",
  "permissions": ["read:content", "write:content", "admin:settings"],
  "exp": 1640995200,
  "iat": 1640908800
}
```

## 🏢 Tenant Management

### Get Tenant Information
```http
GET /v1/tenant/profile
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Lumibears",
    "domain": "lumibears.com",
    "status": "active",
    "subscription_tier": "growth",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-12-15T14:20:00Z"
  },
  "meta": {
    "api_version": "1.0",
    "response_time_ms": 45
  }
}
```

### Update Tenant Settings
```http
PATCH /v1/tenant/settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "webhook_url": "https://lumibears.com/api/content-webhook",
  "auto_publish": false,
  "notification_email": "content@lumibears.com"
}
```

## 🎨 Brand Configuration

### Get Brand Configuration
```http
GET /v1/brand/config
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": {
    "voice_tone": {
      "warmth": 8,
      "expertise": 9,
      "formality": 4,
      "enthusiasm": 7
    },
    "topics": [
      "child wellness",
      "emotional support",
      "parenting guidance",
      "screen-free technology"
    ],
    "visual_style": {
      "color_palette": ["#6B8CAE", "#F4E5D3", "#8FBC8F"],
      "image_style": "warm, family-focused, professional",
      "avoid_elements": ["stark lighting", "corporate settings"]
    },
    "seo_strategy": {
      "primary_keywords": ["emotional support bears", "child wellness"],
      "content_length": "800-1200",
      "target_audience": "parents of children 2-12",
      "content_style": "guides, research-backed, personal stories"
    },
    "publishing_config": {
      "frequency": "3x/week",
      "preferred_days": ["Tuesday", "Thursday", "Saturday"],
      "time_zone": "America/New_York",
      "auto_publish": false
    }
  }
}
```

### Update Brand Configuration
```http
PUT /v1/brand/config
Authorization: Bearer {token}
Content-Type: application/json

{
  "voice_tone": {
    "warmth": 9,
    "expertise": 8,
    "formality": 3,
    "enthusiasm": 8
  },
  "topics": [
    "child emotional development",
    "mindful parenting",
    "wellness technology"
  ],
  "seo_strategy": {
    "primary_keywords": ["mindful parenting", "child emotional intelligence"],
    "content_length": "1000-1500"
  }
}
```

## 📝 Content Pipeline Management

### List Content Pipelines
```http
GET /v1/content/pipelines?status=ready&limit=10&offset=0
Authorization: Bearer {token}
```

**Query Parameters:**
- `status`: Filter by pipeline status (`inspiration`, `planning`, `generating`, `ready`, `published`)
- `limit`: Number of results (1-100, default: 20)
- `offset`: Pagination offset
- `date_range`: Filter by creation date (`7d`, `30d`, `90d`)

**Response:**
```json
{
  "data": [
    {
      "id": "pipeline-uuid-1",
      "status": "ready",
      "topic": "Building Emotional Intelligence in Toddlers",
      "inspiration_source": "trending_research",
      "content_brief": {
        "title": "5 Simple Ways to Build Emotional Intelligence in Toddlers",
        "target_keywords": ["toddler emotional intelligence", "emotional development"],
        "content_type": "guide",
        "estimated_word_count": 1200
      },
      "quality_scores": {
        "brand_alignment": 94,
        "seo_optimization": 87,
        "readability": 92,
        "originality": 96
      },
      "created_at": "2024-12-15T10:00:00Z",
      "ready_at": "2024-12-15T10:45:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 10,
    "offset": 0,
    "has_next": true
  }
}
```

### Get Pipeline Details
```http
GET /v1/content/pipelines/{pipeline_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": {
    "id": "pipeline-uuid-1",
    "status": "ready",
    "inspiration_data": {
      "discovered_trends": [
        {
          "topic": "emotional intelligence research",
          "relevance_score": 94,
          "trending_keywords": ["EQ development", "toddler emotions"],
          "source_urls": ["https://pediatricjournal.com/eq-study-2024"]
        }
      ],
      "content_gap_analysis": "Limited practical guides for parents of toddlers"
    },
    "content_brief": {
      "title": "5 Simple Ways to Build Emotional Intelligence in Toddlers",
      "meta_description": "Discover practical, research-backed strategies to help your toddler develop emotional intelligence. Expert tips that work in real family life.",
      "outline": [
        "Why Emotional Intelligence Matters for Toddlers",
        "Strategy 1: Name and Validate Emotions",
        "Strategy 2: Create Emotion-Rich Conversations",
        "Strategy 3: Use Books and Stories",
        "Strategy 4: Model Emotional Regulation",
        "Strategy 5: Practice Empathy Together"
      ],
      "target_keywords": ["toddler emotional intelligence", "emotional development"],
      "content_type": "practical_guide",
      "estimated_reading_time": "8 minutes"
    },
    "generated_content": {
      "title": "5 Simple Ways to Build Emotional Intelligence in Toddlers",
      "content": "# 5 Simple Ways to Build Emotional Intelligence in Toddlers\n\nEvery parent wants their child to grow up emotionally healthy and resilient...",
      "word_count": 1247,
      "readability_score": 92,
      "seo_score": 87
    },
    "visual_assets": [
      {
        "type": "hero_image",
        "url": "https://cdn.autoblog.com/clients/lumibears/content-123-hero.jpg",
        "alt_text": "Parent and toddler sitting together, engaged in emotional conversation",
        "dimensions": {"width": 1200, "height": 800}
      }
    ],
    "quality_report": {
      "brand_alignment": 94,
      "seo_optimization": 87,
      "readability": 92,
      "originality": 96,
      "fact_checking": 91,
      "recommendations": [
        "Consider adding more specific age ranges for each strategy",
        "Include expert quote to strengthen credibility"
      ]
    }
  }
}
```

### Start Content Generation
```http
POST /v1/content/pipelines
Authorization: Bearer {token}
Content-Type: application/json

{
  "topic": "Screen time alternatives for preschoolers",
  "content_type": "guide",
  "priority": "high",
  "custom_requirements": {
    "include_product_mention": true,
    "target_length": 1000,
    "include_expert_quotes": true
  }
}
```

**Response:**
```json
{
  "data": {
    "pipeline_id": "new-pipeline-uuid",
    "status": "inspiration",
    "estimated_completion": "2024-12-15T11:30:00Z",
    "webhook_url": "https://lumibears.com/api/content-webhook"
  }
}
```

### Approve Content for Publishing
```http
POST /v1/content/pipelines/{pipeline_id}/approve
Authorization: Bearer {token}
Content-Type: application/json

{
  "approve": true,
  "modifications": {
    "title": "Custom title override",
    "meta_description": "Custom meta description"
  },
  "publish_immediately": false,
  "scheduled_publish_date": "2024-12-16T09:00:00Z"
}
```

### Reject Content (Request Regeneration)
```http
POST /v1/content/pipelines/{pipeline_id}/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "feedback": "Content tone too formal, needs more warmth and personal anecdotes",
  "regenerate_sections": ["introduction", "conclusion"],
  "priority": "high"
}
```

## 🔍 Analytics & Performance

### Get Content Performance
```http
GET /v1/analytics/performance?date_range=30d&metrics=traffic,engagement
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": {
    "summary": {
      "total_posts": 24,
      "total_traffic": 15420,
      "average_engagement": 4.2,
      "top_performing_topics": ["emotional support", "parenting guidance"]
    },
    "posts": [
      {
        "pipeline_id": "pipeline-uuid-1",
        "title": "5 Simple Ways to Build Emotional Intelligence in Toddlers",
        "published_date": "2024-11-15T09:00:00Z",
        "metrics": {
          "page_views": 2450,
          "time_on_page": 285,
          "social_shares": 67,
          "organic_traffic_change": "+45%"
        },
        "seo_rankings": [
          {
            "keyword": "toddler emotional intelligence",
            "position": 8,
            "change": "+12"
          }
        ]
      }
    ],
    "trends": {
      "traffic_growth": "+23% vs previous 30 days",
      "engagement_improvement": "+15% vs previous 30 days"
    }
  }
}
```

### Get Trending Topics
```http
GET /v1/analytics/trending?industry=parenting&time_range=7d
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": [
    {
      "topic": "AI tools for parents",
      "trend_score": 94,
      "search_volume_change": "+156%",
      "competition_level": "medium",
      "content_gap_opportunity": "high",
      "recommended_angles": [
        "AI safety for children",
        "Educational AI tools review",
        "Balancing tech and human connection"
      ]
    },
    {
      "topic": "winter wellness activities",
      "trend_score": 87,
      "seasonal_relevance": "high",
      "content_gap_opportunity": "medium"
    }
  ]
}
```

## 🎯 Content Optimization

### A/B Testing
```http
POST /v1/content/ab-test
Authorization: Bearer {token}
Content-Type: application/json

{
  "pipeline_id": "pipeline-uuid-1",
  "test_elements": ["title", "meta_description"],
  "variants": {
    "title_b": "Transform Your Toddler's Emotional Intelligence with 5 Simple Strategies",
    "meta_description_b": "Help your toddler thrive emotionally with research-backed strategies that work."
  },
  "test_duration_days": 14,
  "traffic_split": 50
}
```

### SEO Recommendations
```http
GET /v1/content/seo-recommendations/{pipeline_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": {
    "current_score": 87,
    "recommendations": [
      {
        "type": "keyword_optimization",
        "priority": "high",
        "suggestion": "Include 'emotional intelligence activities' in H2 headings",
        "impact": "Could improve ranking for secondary keywords"
      },
      {
        "type": "internal_linking",
        "priority": "medium", 
        "suggestion": "Link to related emotional support product pages",
        "impact": "Improved site authority and user engagement"
      }
    ],
    "competitor_analysis": [
      {
        "url": "competitor-article-url",
        "title": "Competitor Title",
        "strengths": ["More specific age ranges", "Expert interviews"],
        "opportunities": ["Less actionable advice", "No visual guides"]
      }
    ]
  }
}
```

## 🔔 Webhooks

### Content Ready Webhook
**Endpoint**: Client-configured webhook URL  
**Method**: POST  
**Content-Type**: application/json

```json
{
  "event": "content.ready",
  "pipeline_id": "pipeline-uuid-1",
  "tenant_id": "tenant-uuid",
  "data": {
    "title": "5 Simple Ways to Build Emotional Intelligence in Toddlers",
    "slug": "build-emotional-intelligence-toddlers",
    "content": "Full blog post content here...",
    "meta_description": "Discover practical, research-backed strategies...",
    "tags": ["toddler development", "emotional intelligence", "parenting"],
    "featured_image": {
      "url": "https://cdn.autoblog.com/clients/lumibears/content-123-hero.jpg",
      "alt_text": "Parent and toddler in emotional conversation"
    },
    "seo_score": 87,
    "quality_scores": {
      "brand_alignment": 94,
      "readability": 92,
      "originality": 96
    }
  },
  "timestamp": "2024-12-15T10:45:00Z"
}
```

### Webhook Verification
```http
POST /v1/webhooks/verify
Authorization: Bearer {token}
Content-Type: application/json

{
  "url": "https://lumibears.com/api/content-webhook",
  "events": ["content.ready", "content.published"]
}
```

## 📅 Content Calendar (30-day)

When users subscribe to a strategy, the backend generates a 30-day content calendar (blog post ideas). All endpoints require **JWT** (`Authorization: Bearer <token>`). Full request/response shapes and frontend behavior are in [docs/CONTENT_CALENDAR_FRONTEND_HANDOFF.md](CONTENT_CALENDAR_FRONTEND_HANDOFF.md).

| Purpose | Method | Endpoint |
|--------|--------|----------|
| All subscribed strategies + calendars | GET | `/api/v1/strategies/content-calendar` |
| Single strategy/audience (by ID) | GET | `/api/v1/audiences/:id` |
| List audiences (+ `has_content_calendar`) | GET | `/api/v1/audiences` |

- **401** if not authenticated. **404** if audience/strategy not found.

## 🚨 Error Handling

### Standard Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Brand configuration missing required fields",
    "details": {
      "missing_fields": ["voice_tone", "primary_topics"],
      "field_errors": {
        "content_length": "Must be between 300-3000 words"
      }
    },
    "request_id": "req-uuid-123",
    "timestamp": "2024-12-15T10:00:00Z"
  }
}
```

### HTTP Status Codes
- `200 OK` - Request successful
- `201 Created` - Resource created successfully  
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Invalid or missing authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Common Error Codes
- `INVALID_TOKEN` - Authentication token invalid or expired
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `RATE_LIMIT_EXCEEDED` - API rate limit hit
- `VALIDATION_ERROR` - Request data validation failed
- `PIPELINE_NOT_FOUND` - Content pipeline doesn't exist
- `GENERATION_FAILED` - AI content generation error
- `WEBHOOK_DELIVERY_FAILED` - Webhook endpoint unreachable

## 📊 Rate Limiting

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 750
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 3600
```

### Rate Limit Tiers
- **Starter**: 500 requests/hour
- **Growth**: 2,000 requests/hour  
- **Enterprise**: 10,000 requests/hour

## 🔧 SDK Examples

### JavaScript/Node.js
```javascript
import { AutoBlogClient } from '@autoblog/client';

const client = new AutoBlogClient({
  apiKey: process.env.AUTOBLOG_API_KEY,
  baseURL: 'https://api.autoblog.com/v1'
});

// Start content generation
const pipeline = await client.content.create({
  topic: 'Screen time alternatives for preschoolers',
  contentType: 'guide',
  priority: 'high'
});

// Get ready content
const readyContent = await client.content.list({
  status: 'ready',
  limit: 10
});

// Approve and publish
await client.content.approve(pipeline.id, {
  publishImmediately: true
});
```

### Python
```python
from autoblog_client import AutoBlogClient

client = AutoBlogClient(
    api_key=os.environ['AUTOBLOG_API_KEY'],
    base_url='https://api.autoblog.com/v1'
)

# Start content generation  
pipeline = client.content.create(
    topic='Screen time alternatives for preschoolers',
    content_type='guide',
    priority='high'
)

# Get pipeline status
status = client.content.get_status(pipeline['id'])

# Webhook handling with Flask
@app.route('/webhook/autoblog', methods=['POST'])
def handle_autoblog_webhook():
    event = request.json
    if event['event'] == 'content.ready':
        # Process ready content
        content = event['data']
        publish_to_cms(content)
    return '', 200
```

This API specification provides comprehensive documentation for integrating with the AutoBlog platform, enabling seamless automation of content generation workflows.