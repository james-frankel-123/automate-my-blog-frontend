import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import StrategyCarousel from './StrategyCarousel';
import StrategyDetailsView from './StrategyDetailsView';
import PostsTab from './PostsTab';
import autoBlogAPI from '../../services/api';

/**
 * ReturningUserDashboard - Strategy-first dashboard for returning users
 *
 * Layout:
 * - Top 25%: Horizontal strategy carousel
 * - Bottom 75%: Posts list (filtered) OR strategy details view
 *
 * Flow:
 * - Click subscribed strategy → Filter posts by that strategy
 * - Click unsubscribed strategy → Show LLM-generated pitch and pricing
 */
export default function ReturningUserDashboard() {
  const [strategies, setStrategies] = useState([]);
  const [subscribedStrategies, setSubscribedStrategies] = useState({});
  const [selectedStrategyId, setSelectedStrategyId] = useState(null);
  const [viewMode, setViewMode] = useState('posts'); // 'posts' | 'strategy-details'
  const [selectedStrategyForDetails, setSelectedStrategyForDetails] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Load all dashboard data on mount
   */
  async function loadDashboardData() {
    setLoading(true);
    try {
      await Promise.all([
        loadStrategies(),
        loadPosts()
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Load strategies and subscribed strategies
   */
  async function loadStrategies() {
    try {
      // Fetch all strategies (audiences)
      const audiencesResponse = await autoBlogAPI.getUserAudiences();

      // Transform audiences to strategy format
      const transformedStrategies = (audiencesResponse?.audiences || []).map((aud, idx) =>
        transformAudienceToStrategy(aud, idx)
      );

      setStrategies(transformedStrategies);

      // Fetch subscribed strategies
      const subscribedResponse = await autoBlogAPI.getSubscribedStrategies();

      // Handle response (could be array or object with subscriptions property)
      const subscriptionsList = Array.isArray(subscribedResponse)
        ? subscribedResponse
        : (subscribedResponse?.subscriptions || []);

      // Map subscribed strategies by ID for quick lookup
      const subscribedMap = {};
      subscriptionsList.forEach(sub => {
        subscribedMap[sub.strategy_id] = {
          ...sub,
          performanceMetrics: {
            drafts: sub.drafts_count || 0,
            published: sub.published_count || 0,
            upcoming: sub.scheduled_count || 0
          }
        };
      });

      setSubscribedStrategies(subscribedMap);

      console.log('📊 Loaded strategies:', {
        total: transformedStrategies.length,
        subscribed: Object.keys(subscribedMap).length
      });

    } catch (error) {
      console.error('Failed to load strategies:', error);
      message.error('Failed to load strategies');
    }
  }

  /**
   * Load posts (optionally filtered by strategy)
   */
  async function loadPosts(strategyId = null) {
    try {
      const response = await autoBlogAPI.getPosts();

      // If filtering by strategy, filter the posts
      let filteredPosts = response?.posts || [];
      if (strategyId) {
        filteredPosts = filteredPosts.filter(post => post.strategy_id === strategyId);
      }

      setPosts(filteredPosts);

      console.log('📝 Loaded posts:', {
        total: response?.posts?.length || 0,
        filtered: filteredPosts.length,
        strategyId
      });

    } catch (error) {
      console.error('Failed to load posts:', error);
      message.error('Failed to load posts');
    }
  }

  /**
   * Handle strategy selection for filtering
   */
  function handleStrategySelect(strategyId) {
    console.log('🎯 Strategy selected for filtering:', strategyId);
    setSelectedStrategyId(strategyId);
    setViewMode('posts');
    loadPosts(strategyId);
  }

  /**
   * Handle strategy card click (subscribed = filter, unsubscribed = details)
   */
  function handleStrategyClick(strategy) {
    const isSubscribed = !!subscribedStrategies[strategy.id];

    console.log('🖱️ Strategy clicked:', {
      strategyId: strategy.id,
      isSubscribed
    });

    if (isSubscribed) {
      // Subscribed: Select for filtering
      handleStrategySelect(strategy.id);
    } else {
      // Not subscribed: Show details view
      setSelectedStrategyForDetails(strategy);
      setViewMode('strategy-details');
    }
  }

  /**
   * Navigate back to posts view
   */
  function handleBackToPosts() {
    setViewMode('posts');
    setSelectedStrategyForDetails(null);
  }

  /**
   * Clear strategy filter
   */
  function handleClearFilter() {
    setSelectedStrategyId(null);
    loadPosts();
  }

  /**
   * Handle strategy subscription (navigate to Stripe checkout)
   */
  async function handleSubscribe(strategyId) {
    try {
      message.loading({ content: 'Starting checkout...', key: 'subscribe' });

      // Create Stripe checkout session
      const response = await autoBlogAPI.subscribeToStrategy(strategyId, 'monthly');

      if (response?.url) {
        message.success({ content: 'Redirecting to checkout...', key: 'subscribe', duration: 1 });
        setTimeout(() => {
          window.location.href = response.url;
        }, 500);
      } else {
        message.error({ content: 'Failed to start checkout.', key: 'subscribe' });
      }
    } catch (error) {
      console.error('Failed to start checkout:', error);
      message.error({ content: error.message || 'Failed to start checkout.', key: 'subscribe' });
    }
  }

  /**
   * Get strategy name by ID
   */
  function getStrategyName(strategyId) {
    const strategy = strategies.find(s => s.id === strategyId);
    return strategy?.targetSegment?.demographics ||
           strategy?.customerProblem ||
           'Unknown Strategy';
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Strategy Carousel: 25% viewport height */}
      <div style={{
        height: '25vh',
        minHeight: '200px',
        overflow: 'hidden',
        borderBottom: '1px solid #f0f0f0',
        backgroundColor: '#fafafa'
      }}>
        <StrategyCarousel
          strategies={strategies}
          subscribedStrategies={subscribedStrategies}
          selectedStrategyId={selectedStrategyId}
          onStrategySelect={handleStrategySelect}
          onStrategyClick={handleStrategyClick}
          loading={loading}
        />
      </div>

      {/* Content Section: 75% viewport height */}
      <div style={{
        height: '75vh',
        overflow: 'auto',
        padding: '24px',
        backgroundColor: '#ffffff'
      }}>
        {viewMode === 'posts' ? (
          <PostsTab
            posts={posts}
            filteredByStrategyId={selectedStrategyId}
            onClearFilter={handleClearFilter}
            getStrategyName={getStrategyName}
            subscribedStrategies={subscribedStrategies}
            // Note: PostsTab expects other props as well (user, etc.)
            // These will be passed through from DashboardLayout
          />
        ) : (
          <StrategyDetailsView
            strategy={selectedStrategyForDetails}
            visible={true}
            onBack={handleBackToPosts}
            onSubscribe={handleSubscribe}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Transform audience data to strategy format
 * (Similar to AudienceSegmentsTab transformation)
 */
function transformAudienceToStrategy(audience, index) {
  // Parse target_segment if it's a string
  let targetSegment = audience.target_segment;
  if (typeof targetSegment === 'string') {
    try {
      targetSegment = JSON.parse(targetSegment);
    } catch (e) {
      targetSegment = {
        demographics: audience.customer_problem || 'Unknown',
        psychographics: '',
        searchBehavior: ''
      };
    }
  }

  return {
    id: audience.id,
    pitch: audience.pitch || '',
    imageUrl: audience.image_url || audience.imageUrl || null,
    targetSegment: targetSegment || {
      demographics: audience.customer_problem || '',
      psychographics: '',
      searchBehavior: ''
    },
    customerProblem: audience.customer_problem || '',
    customerLanguage: audience.customer_language || audience.seo_keywords || [],
    conversionPath: audience.conversion_path || '',
    businessValue: audience.business_value || {
      searchVolume: audience.search_volume || '',
      conversionPotential: '',
      competition: audience.competition_level || '',
      priority: index + 1
    },
    contentIdeas: audience.content_ideas || [],
    seoKeywords: audience.seo_keywords || [],
    // Additional fields for pricing/metrics
    pricingMonthly: audience.pricing_monthly,
    pricingAnnual: audience.pricing_annual,
    postsRecommended: audience.posts_recommended,
    postsMaximum: audience.posts_maximum,
    projectedProfitLow: audience.projected_profit_low,
    projectedProfitHigh: audience.projected_profit_high,
    searchVolume: audience.search_volume,
    competitionLevel: audience.competition_level
  };
}
