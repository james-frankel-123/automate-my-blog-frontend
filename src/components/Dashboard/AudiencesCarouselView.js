import React, { useState, useEffect } from 'react';
import { message, Typography } from 'antd';
import StrategyCarousel from './StrategyCarousel';
import StrategyDetailsView from './StrategyDetailsView';
import autoBlogAPI from '../../services/api';

const { Title } = Typography;

/**
 * Transform audience data to strategy format
 */
function transformAudienceToStrategy(audience, index) {
  return {
    id: audience.id || `strategy-${index}`,
    pitch: audience.pitch || '',
    imageUrl: audience.imageUrl || audience.image_url || null,
    targetSegment: audience.targetSegment || audience.target_segment || {
      demographics: audience.customerProblem || '',
      psychographics: '',
      searchBehavior: ''
    },
    customerProblem: audience.customerProblem || audience.customer_problem || '',
    customerLanguage: audience.customerLanguage || audience.customer_language || [],
    conversionPath: audience.conversionPath || audience.conversion_path || '',
    businessValue: audience.businessValue || audience.business_value || {
      searchVolume: '',
      conversionPotential: '',
      priority: index + 1,
      competition: ''
    },
    contentIdeas: audience.contentIdeas || audience.content_ideas || [],
    seoKeywords: audience.seoKeywords || audience.seo_keywords || []
  };
}

/**
 * AudiencesCarouselView - Just the strategy carousel for logged-in users
 *
 * Shows:
 * - Carousel of all strategies (subscribed and unsubscribed)
 * - Click subscribed strategy: Just highlights it
 * - Click unsubscribed strategy: Shows StrategyDetailsView with pricing
 */
export default function AudiencesCarouselView() {
  const [strategies, setStrategies] = useState([]);
  const [subscribedStrategies, setSubscribedStrategies] = useState({});
  const [selectedStrategyId, setSelectedStrategyId] = useState(null);
  const [viewMode, setViewMode] = useState('carousel'); // 'carousel' | 'details'
  const [selectedStrategyForDetails, setSelectedStrategyForDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log('🎨 AudiencesCarouselView mounted', {
    viewMode,
    strategiesCount: strategies.length,
    loading
  });

  useEffect(() => {
    loadStrategies();
  }, []);

  // Reload strategies when user returns from Stripe checkout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const success = urlParams.get('success');

    if (sessionId || success) {
      console.log('🔄 Detected return from checkout, reloading strategies...');
      setTimeout(() => {
        loadStrategies();
      }, 2000);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Add tab visibility detection for post-checkout scenarios
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Load strategies and subscriptions
   */
  async function loadStrategies() {
    setLoading(true);
    try {
      // Fetch all strategies (audiences)
      const audiencesResponse = await autoBlogAPI.getUserAudiences();

      console.log('📊 Raw audiences response:', audiencesResponse);
      console.log('📊 Audiences count:', audiencesResponse?.audiences?.length || 0);
      console.log('📊 First 3 audience IDs:',
        (audiencesResponse?.audiences || []).slice(0, 3).map(a => a.id)
      );

      // Transform audiences to strategy format
      const transformedStrategies = (audiencesResponse?.audiences || []).map((aud, idx) =>
        transformAudienceToStrategy(aud, idx)
      );

      console.log('📊 Transformed strategies count:', transformedStrategies.length);
      console.log('📊 Transformed strategy IDs:', transformedStrategies.map(s => s.id));

      setStrategies(transformedStrategies);

      // Fetch strategy subscriptions
      const subscriptionsResponse = await autoBlogAPI.getSubscribedStrategies();

      console.log('📊 Raw subscriptions response:', subscriptionsResponse);

      // Handle response (could be array or object with subscriptions property)
      const subscriptionsList = Array.isArray(subscriptionsResponse)
        ? subscriptionsResponse
        : (subscriptionsResponse?.subscriptions || []);

      console.log('📊 Subscriptions list:', subscriptionsList);

      // Convert array to map for quick lookup
      const subsMap = {};
      subscriptionsList.forEach(sub => {
        const strategyId = sub.strategy_id || sub.strategyId;
        console.log('📊 Processing subscription:', { sub, strategyId });
        subsMap[strategyId] = {
          id: sub.id,
          strategyId: strategyId,
          status: sub.status,
          postsRemaining: sub.posts_remaining || sub.postsRemaining || 0,
          postsPerMonth: sub.posts_per_month || sub.postsPerMonth || 0
        };
      });

      console.log('📊 Final subscribed map:', subsMap);
      setSubscribedStrategies(subsMap);
    } catch (error) {
      console.error('Failed to load strategies:', error);
      message.error('Failed to load strategies');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handle strategy click
   */
  function handleStrategyClick(strategy) {
    const isSubscribed = !!subscribedStrategies[strategy.id];

    if (isSubscribed) {
      // Just highlight the strategy
      setSelectedStrategyId(strategy.id);
    } else {
      // Show pricing and details
      setSelectedStrategyForDetails(strategy);
      setViewMode('details');
    }
  }

  /**
   * Handle back from details view
   */
  function handleBack() {
    setViewMode('carousel');
    setSelectedStrategyForDetails(null);
  }

  /**
   * Handle subscription
   */
  async function handleSubscribe(strategyId) {
    try {
      // Subscription is handled by StrategyDetailsView (Stripe checkout)
      // After successful return, loadStrategies() will be called via useEffect
      await loadStrategies();
      setViewMode('carousel');
      message.success('Successfully subscribed to strategy!');
    } catch (error) {
      console.error('Failed to refresh after subscription:', error);
      message.error('Failed to refresh strategies');
    }
  }

  // Render
  if (viewMode === 'details') {
    return (
      <div style={{ padding: '24px' }}>
        <StrategyDetailsView
          strategy={selectedStrategyForDetails}
          onBack={handleBack}
          onSubscribe={handleSubscribe}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        Your Audience Strategies
      </Title>

      <StrategyCarousel
        strategies={strategies}
        subscribedStrategies={subscribedStrategies}
        selectedStrategyId={selectedStrategyId}
        onStrategyClick={handleStrategyClick}
        loading={loading}
      />
    </div>
  );
}
