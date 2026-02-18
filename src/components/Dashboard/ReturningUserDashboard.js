import React, { useState, useEffect } from 'react';
import { message, Card, Typography } from 'antd';
import StrategyCarousel from './StrategyCarousel';
import StrategyDetailsView from './StrategyDetailsView';
import PostsTab from './PostsTab';
import autoBlogAPI from '../../services/api';

const { Title, Paragraph } = Typography;

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
  const [strategyOverview, setStrategyOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    loadStrategyOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload strategies when user returns from Stripe checkout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const success = urlParams.get('success');

    if (sessionId || success) {
      console.log('🔄 Detected return from checkout, reloading strategies...');

      // Wait a moment for webhooks to process, then reload
      setTimeout(() => {
        loadStrategies();
      }, 2000);

      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload strategies when user returns to the tab (visibility change)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Tab became visible, reloading strategies...');
        loadStrategies();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
   * Load personalized strategy overview from backend
   */
  async function loadStrategyOverview() {
    try {
      setOverviewLoading(true);
      const response = await autoBlogAPI.getStrategyOverview();
      setStrategyOverview(response);
      console.log('📖 Loaded personalized strategy overview:', response);
    } catch (error) {
      console.error('Failed to load strategy overview:', error);
      setStrategyOverview(null);
    } finally {
      setOverviewLoading(false);
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

      console.log('📊 Raw subscribed response:', subscribedResponse);

      // Handle response (could be array or object with subscriptions property)
      const subscriptionsList = Array.isArray(subscribedResponse)
        ? subscribedResponse
        : (subscribedResponse?.subscriptions || []);

      console.log('📊 Subscriptions list:', subscriptionsList);

      // Map subscribed strategies by ID for quick lookup
      const subscribedMap = {};
      subscriptionsList.forEach(sub => {
        const strategyId = sub.strategy_id || sub.strategyId;
        subscribedMap[strategyId] = {
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

      console.log('📊 Strategy IDs from audiences:', transformedStrategies.map(s => s.id));
      console.log('📊 Subscribed strategy IDs:', Object.keys(subscribedMap));
      console.log('📊 Subscribed map:', subscribedMap);

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
  function handleSubscribe(strategyId) {
    // Redirect to Stripe checkout endpoint
    window.location.href = `/api/v1/strategies/${strategyId}/subscribe`;
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
          <>
            {posts.length === 0 && (
              <Card
                title={<h2 className="heading-section" style={{ marginBottom: 0 }}>Understanding Audience Strategies</h2>}
                style={{ marginBottom: '24px' }}
                loading={overviewLoading}
              >
                {strategyOverview?.overview?.sections ? (
                  <div style={{ padding: '20px 0' }}>
                    <Title level={4}>What is an Audience Strategy?</Title>
                    <Paragraph style={{ fontSize: '16px', lineHeight: '1.6' }}>
                      {strategyOverview.overview.sections.whatIsStrategy}
                    </Paragraph>

                    <Title level={4} style={{ marginTop: '32px' }}>How We Use Audiences</Title>
                    <ul style={{ fontSize: '16px', lineHeight: '1.8', paddingLeft: '24px' }}>
                      {strategyOverview.overview.sections.howWeUse.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>

                    <Title level={4} style={{ marginTop: '32px' }}>Outcome-Aligned Pricing</Title>
                    {strategyOverview.overview.sections.pricing.split('\n\n').map((para, idx) => (
                      <Paragraph key={idx} style={{ fontSize: '16px', lineHeight: '1.6' }}>
                        {para}
                      </Paragraph>
                    ))}

                    {strategyOverview.overview.sections.googleIntegrations && (
                      <>
                        <Title level={4} style={{ marginTop: '32px' }}>
                          {strategyOverview.overview.sections.googleIntegrations.heading}
                        </Title>
                        <Paragraph style={{ fontSize: '16px', lineHeight: '1.6' }}>
                          {strategyOverview.overview.sections.googleIntegrations.message}
                        </Paragraph>

                        {strategyOverview.integrationStatus && (
                          <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {!strategyOverview.integrationStatus.googleTrends?.connected && (
                              <button
                                type="button"
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: '#1890ff',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}
                                onClick={() => message.info('Google Trends connection coming soon!')}
                              >
                                Connect Google Trends
                              </button>
                            )}
                            {!strategyOverview.integrationStatus.searchConsole?.connected && (
                              <button
                                type="button"
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: '#1890ff',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}
                                onClick={() => message.info('Search Console connection coming soon!')}
                              >
                                Connect Search Console
                              </button>
                            )}
                            {!strategyOverview.integrationStatus.analytics?.connected && (
                              <button
                                type="button"
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: '#1890ff',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}
                                onClick={() => message.info('Analytics connection coming soon!')}
                              >
                                Connect Analytics
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    <div style={{
                      marginTop: '32px',
                      padding: '16px 20px',
                      backgroundColor: '#f0f7ff',
                      borderLeft: '4px solid #1890ff',
                      borderRadius: '4px'
                    }}>
                      <Paragraph style={{ marginBottom: 0, fontSize: '16px', lineHeight: '1.6' }}>
                        <strong>Ready to start?</strong> Select an audience strategy above to see pricing and subscribe.
                        Your content generation will begin immediately, building a content library that drives qualified traffic to your business.
                      </Paragraph>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '20px 0' }}>
                    <Title level={4}>What is an Audience Strategy?</Title>
                    <Paragraph style={{ fontSize: '16px', lineHeight: '1.6' }}>
                      An <strong>audience strategy</strong> represents a specific segment of your target market with unique needs, pain points, and search behaviors.
                      Each strategy is carefully crafted to attract and convert a particular type of customer through highly-targeted content.
                    </Paragraph>

                    <Title level={4} style={{ marginTop: '32px' }}>How We Use Audiences</Title>
                    <Paragraph style={{ fontSize: '16px', lineHeight: '1.6' }}>
                      When you subscribe to an audience strategy, our AI generates a continuous stream of blog posts specifically designed to:
                    </Paragraph>
                    <ul style={{ fontSize: '16px', lineHeight: '1.8', paddingLeft: '24px' }}>
                      <li>Rank for keywords your target audience is searching for</li>
                      <li>Address their specific problems and questions</li>
                      <li>Guide them naturally toward your products or services</li>
                      <li>Build long-term organic traffic and conversions</li>
                    </ul>

                    <Title level={4} style={{ marginTop: '32px' }}>Outcome-Aligned Pricing</Title>
                    <Paragraph style={{ fontSize: '16px', lineHeight: '1.6' }}>
                      We price based on <strong>value delivered, not effort required</strong>. When you subscribe to an audience strategy,
                      you pay a fixed monthly price for a set number of high-quality posts—regardless of how much work our system does behind the scenes.
                    </Paragraph>
                    <Paragraph style={{ fontSize: '16px', lineHeight: '1.6' }}>
                      This aligns our incentives with yours: we're invested in making our AI smarter and more efficient, so we can deliver
                      better results while keeping your costs predictable. Whether a post takes 10 minutes or 2 hours to perfect,
                      your price stays the same. We win by driving outcomes, not by billing hours.
                    </Paragraph>

                    <div style={{
                      marginTop: '32px',
                      padding: '16px 20px',
                      backgroundColor: '#f0f7ff',
                      borderLeft: '4px solid #1890ff',
                      borderRadius: '4px'
                    }}>
                      <Paragraph style={{ marginBottom: 0, fontSize: '16px', lineHeight: '1.6' }}>
                        <strong>Ready to start?</strong> Select an audience strategy above to see pricing and subscribe.
                        Your content generation will begin immediately, building a content library that drives qualified traffic to your business.
                      </Paragraph>
                    </div>
                  </div>
                )}
              </Card>
            )}
            <PostsTab
              posts={posts}
              filteredByStrategyId={selectedStrategyId}
              onClearFilter={handleClearFilter}
              getStrategyName={getStrategyName}
              // Note: PostsTab expects other props as well (user, etc.)
              // These will be passed through from DashboardLayout
            />
          </>
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
    hasContentCalendar: audience.has_content_calendar === true,
    contentCalendarGeneratedAt: audience.content_calendar_generated_at || null,
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
