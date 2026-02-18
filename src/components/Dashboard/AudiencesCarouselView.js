import React, { useState, useEffect } from 'react';
import { message, Typography } from 'antd';
import StrategyCarousel from './StrategyCarousel';
import StrategyDetailsView from './StrategyDetailsView';
import autoBlogAPI from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkflowMode } from '../../contexts/WorkflowModeContext';
import { useSystemHint } from '../../contexts/SystemHintContext';
import { systemVoice } from '../../copy/systemVoice';

const { Title } = Typography;

// Module-level cache for generated strategies (persists across component remounts)
const generatedStrategiesCache = new Set();

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
 * AudiencesCarouselView - Strategy carousel for logged-in users
 *
 * Shows:
 * - Carousel of all strategies (subscribed and unsubscribed)
 * - Click subscribed strategy: Just highlights it
 * - Click unsubscribed strategy: Shows StrategyDetailsView with pricing
 *
 * Data sources (priority order):
 * 1. stepResults.home.websiteAnalysis.scenarios (fresh analysis)
 * 2. Database via getUserAudiences API
 */
export default function AudiencesCarouselView() {
  const { user } = useAuth();
  const { stepResults } = useWorkflowMode();
  const { setHint } = useSystemHint();

  const [strategies, setStrategies] = useState([]);
  const [subscribedStrategies, setSubscribedStrategies] = useState({});
  const [selectedStrategyId, setSelectedStrategyId] = useState(null);
  const [viewMode, setViewMode] = useState('carousel'); // 'carousel' | 'details'
  const [selectedStrategyForDetails, setSelectedStrategyForDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingStrategies, setGeneratingStrategies] = useState(false);

  console.log('🎨 AudiencesCarouselView mounted', {
    viewMode,
    strategiesCount: strategies.length,
    loading,
    user: !!user,
    stepResults: {
      hasHome: !!stepResults?.home,
      hasAnalysis: !!stepResults?.home?.websiteAnalysis,
      scenariosLength: stepResults?.home?.websiteAnalysis?.scenarios?.length || 0,
      analysisCompleted: stepResults?.home?.analysisCompleted
    }
  });

  // Load persistent audience strategies (same logic as AudienceSegmentsTab)
  useEffect(() => {
    console.log('🔄 Carousel loading useEffect triggered', { user: !!user, scenariosLength: stepResults.home?.websiteAnalysis?.scenarios?.length });
    const loadPersistentAudiences = async () => {
      console.log('🔍 Carousel: Checking for audiences...', {
        stepResults: {
          hasHome: !!stepResults?.home,
          hasAnalysis: !!stepResults?.home?.websiteAnalysis,
          scenariosLength: stepResults?.home?.websiteAnalysis?.scenarios?.length || 0,
          analysisCompleted: stepResults?.home?.analysisCompleted
        },
        strategiesLength: strategies.length
      });

      // PRIORITY 1: Check for fresh analysis FIRST - this should take precedence over everything
      const hasFreshAnalysisWithScenarios = stepResults?.home?.websiteAnalysis?.scenarios?.length > 0;

      console.log('🔍 Carousel: Has fresh analysis with scenarios?', hasFreshAnalysisWithScenarios);
      console.log('🔍 Carousel: stepResults.home exists?', !!stepResults?.home);

      if (hasFreshAnalysisWithScenarios) {
        console.log('🔍 Carousel: Entering scenarios branch (PRIORITY 1)');
        const analysis = stepResults?.home?.websiteAnalysis;
        const generationKey = analysis
          ? `${analysis.businessName || 'unknown'}_${analysis.targetAudience || 'unknown'}_${analysis.contentFocus || 'unknown'}`
          : null;
        const sessionStorageKey = generationKey ? `audienceStrategiesGenerated_${generationKey}` : null;
        const alreadyGenerated = sessionStorageKey && sessionStorage.getItem(sessionStorageKey) === 'true';
        const alreadyGeneratedInModule = generationKey && generatedStrategiesCache.has(generationKey);

        // If strategies already in state for this analysis, keep them (no clear)
        if (strategies.length > 0 && (alreadyGenerated || alreadyGeneratedInModule)) {
          return;
        }

        // Populate strategies from scenarios immediately
        const scenarios = analysis?.scenarios || [];
        if (scenarios.length > 0) {
          const openAIStrategies = scenarios.map((scenario, index) => {
            const seg = scenario.targetSegment || scenario.target_segment;
            const demographics = seg?.demographics ?? scenario.customerProblem ?? scenario.customer_problem ?? '';
            return {
              id: `openai-scenario-${index}`,
              pitch: scenario.pitch || '',
              imageUrl: scenario.imageUrl ?? scenario.image_url ?? null,
              targetSegment: seg ? {
                demographics: seg.demographics ?? demographics,
                psychographics: seg.psychographics ?? '',
                searchBehavior: seg.searchBehavior ?? seg.search_behavior ?? ''
              } : { demographics, psychographics: '', searchBehavior: '' },
              customerProblem: scenario.customerProblem || scenario.customer_problem || '',
              customerLanguage: scenario.customerLanguage || scenario.customer_language || scenario.seoKeywords || scenario.seo_keywords || [],
              conversionPath: scenario.conversionPath || scenario.conversion_path || '',
              businessValue: scenario.businessValue || scenario.business_value || {
                searchVolume: '',
                conversionPotential: '',
                priority: index + 1,
                competition: ''
              },
              contentIdeas: scenario.contentIdeas || scenario.content_ideas || [],
              seoKeywords: scenario.seoKeywords || scenario.seo_keywords || []
            };
          });
          openAIStrategies.sort((a, b) => (a.businessValue.priority || 999) - (b.businessValue.priority || 999));
          setStrategies(openAIStrategies);
          setLoading(false);
          if (generationKey) {
            generatedStrategiesCache.add(generationKey);
            if (sessionStorageKey) sessionStorage.setItem(sessionStorageKey, 'true');
          }
        } else {
          // No scenarios: clear so database load can run
          if (strategies.length > 0) {
            setStrategies([]);
            if (generationKey) {
              generatedStrategiesCache.delete(generationKey);
              if (sessionStorageKey) sessionStorage.removeItem(sessionStorageKey);
            }
          }
        }
        return;
      }

      // PRIORITY 2: Skip if strategies already loaded
      console.log('🔍 Carousel: Checking PRIORITY 2 - strategies.length:', strategies.length);
      if (strategies.length > 0) {
        console.log('🔍 Carousel: Skipping - strategies already loaded');
        return;
      }

      // PRIORITY 3: Load from database
      console.log('🔍 Carousel: Starting PRIORITY 3 - Load from database');
      try {
        const response = await autoBlogAPI.getUserAudiences({
          limit: 20 // Load up to 20 recent audience strategies
        });

        console.log('🔍 Carousel: Database response:', response);

        if (response.success && response.audiences && response.audiences.length > 0) {
          // Transform database audiences to component format
          const persistentStrategies = response.audiences.map((audience, index) => ({
            id: audience.id,
            databaseId: audience.id,
            pitch: audience.pitch || '',
            imageUrl: audience.image_url || null,
            targetSegment: audience.target_segment || {
              demographics: '',
              psychographics: '',
              searchBehavior: ''
            },
            customerProblem: audience.customer_problem || '',
            customerLanguage: audience.customer_language || [],
            conversionPath: audience.conversion_path || '',
            businessValue: audience.business_value || {
              searchVolume: '',
              conversionPotential: '',
              priority: audience.priority || index + 1,
              competition: ''
            },
            keywords: audience.keywords || [],
            topics: audience.topics || [],
            priority: audience.priority || index + 1,
            created_at: audience.created_at
          }));

          // Sort by priority and creation date
          persistentStrategies.sort((a, b) => {
            const priorityDiff = (a.priority || 999) - (b.priority || 999);
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(b.created_at) - new Date(a.created_at);
          });

          setStrategies(persistentStrategies);
          setLoading(false);

          if (user) {
            message.success(`Loaded ${persistentStrategies.length} saved audience strategies`);
          }
        } else {
          console.log('🔍 Carousel: Database returned no audiences or unsuccessful response');
          // Don't clear existing strategies when API returns empty during state transitions
          if (strategies.length === 0) {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('❌ Carousel: Failed to load persistent audiences:', error);
        setLoading(false);
      }
    };

    loadPersistentAudiences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, stepResults.home?.websiteAnalysis?.scenarios?.length]);

  // Generate audiences if analysis is complete but no strategies exist
  useEffect(() => {
    console.log('🔄 Carousel generation useEffect triggered', {
      analysisCompleted: stepResults.home?.analysisCompleted,
      hasWebsiteAnalysis: !!stepResults.home?.websiteAnalysis,
      strategiesLength: strategies.length,
      generatingStrategies,
      loading
    });

    const hasAnalysisData = stepResults.home?.websiteAnalysis &&
                           (stepResults.home.websiteAnalysis.targetAudience ||
                            stepResults.home.websiteAnalysis.businessName !== 'None');

    console.log('🔄 Carousel generation check:', {
      'stepResults.home?.analysisCompleted': stepResults.home?.analysisCompleted,
      'stepResults.home?.websiteAnalysis': !!stepResults.home?.websiteAnalysis,
      'hasAnalysisData': hasAnalysisData,
      'strategies.length === 0': strategies.length === 0,
      '!generatingStrategies': !generatingStrategies,
      '!loading': !loading,
      'WILL_GENERATE': hasAnalysisData &&
                      strategies.length === 0 &&
                      !generatingStrategies &&
                      !loading
    });

    // Only generate if:
    // 1. Has analysis data (focus mode - doesn't require analysisCompleted)
    // 2. No strategies exist yet
    // 3. Not currently generating
    // 4. Not currently loading
    // Note: Carousel is for logged-in users in focus mode, so we don't require analysisCompleted
    if (hasAnalysisData &&
        strategies.length === 0 &&
        !generatingStrategies &&
        !loading) {

      const analysis = stepResults.home.websiteAnalysis;

      // Create unique generation key based on analysis data
      const generationKey = `${analysis.businessName || 'unknown'}_${analysis.targetAudience || 'unknown'}_${analysis.contentFocus || 'unknown'}`;
      const sessionStorageKey = `audienceStrategiesGenerated_${generationKey}`;

      // Check if strategies have already been generated for this analysis (session-level)
      const alreadyGenerated = sessionStorage.getItem(sessionStorageKey) === 'true';
      // Check if strategies have been generated in this module instance
      const alreadyGeneratedInModule = generatedStrategiesCache.has(generationKey);

      if (alreadyGenerated || alreadyGeneratedInModule) {
        return;
      }

      // Only mark as "already generated" after we've actually set strategies (see end of each branch)
      setGeneratingStrategies(true);
      setHint(systemVoice.audience.generatingStrategies, 'hint', 0);

      // PRIMARY: Use OpenAI-generated scenarios if available
      if (analysis.scenarios && analysis.scenarios.length > 0) {

        // Transform OpenAI scenarios to component format (accept camelCase or snake_case from backend)
        const openAIStrategies = analysis.scenarios.map((scenario, index) => {
          const seg = scenario.targetSegment || scenario.target_segment;
          const demographics = seg?.demographics ?? scenario.customerProblem ?? scenario.customer_problem ?? '';
          return {
            id: `openai-scenario-${index}`,
            pitch: scenario.pitch || '',
            imageUrl: scenario.imageUrl ?? scenario.image_url ?? null,
            targetSegment: seg ? {
              demographics: seg.demographics ?? demographics,
              psychographics: seg.psychographics ?? '',
              searchBehavior: seg.searchBehavior ?? seg.search_behavior ?? ''
            } : { demographics, psychographics: '', searchBehavior: '' },
            customerProblem: scenario.customerProblem || scenario.customer_problem || '',
            customerLanguage: scenario.customerLanguage || scenario.customer_language || scenario.seoKeywords || scenario.seo_keywords || [],
            conversionPath: scenario.conversionPath || scenario.conversion_path || '',
            businessValue: scenario.businessValue || scenario.business_value || {
              searchVolume: '',
              conversionPotential: '',
              priority: index + 1,
              competition: ''
            },
            contentIdeas: scenario.contentIdeas || scenario.content_ideas || [],
            seoKeywords: scenario.seoKeywords || scenario.seo_keywords || []
          };
        });

        // Sort by business value priority
        openAIStrategies.sort((a, b) => (a.businessValue.priority || 999) - (b.businessValue.priority || 999));

        setTimeout(async () => {
          setStrategies(openAIStrategies);
          generatedStrategiesCache.add(generationKey);
          sessionStorage.setItem(sessionStorageKey, 'true');
          setGeneratingStrategies(false);

          // Track previews viewed (user sees audience options)
          autoBlogAPI.trackLeadConversion('previews_viewed', {
            scenario_count: openAIStrategies.length,
            business_name: analysis.businessName,
            timestamp: new Date().toISOString()
          }).catch(err => console.error('Failed to track previews_viewed:', err));

          // Save generated strategies to database for persistence
          try {
            const savedStrategies = await Promise.all(
              openAIStrategies.map(async (strategy) => {
                const audienceData = {
                  pitch: strategy.pitch, // OpenAI-generated agency pitch
                  image_url: strategy.imageUrl, // DALL-E generated image URL
                  target_segment: strategy.targetSegment,
                  customer_problem: strategy.customerProblem,
                  customer_language: strategy.customerLanguage,
                  conversion_path: strategy.conversionPath,
                  business_value: strategy.businessValue,
                  priority: strategy.businessValue?.priority || 1
                };

                const response = await autoBlogAPI.createAudience(audienceData);

                // Save keywords if they exist
                if (strategy.seoKeywords && strategy.seoKeywords.length > 0) {
                  const keywords = strategy.seoKeywords.map(keyword => ({
                    keyword: typeof keyword === 'string' ? keyword : keyword.term,
                    search_volume: keyword.searchVolume || null,
                    competition: keyword.competition || 'medium',
                    relevance_score: keyword.relevance || 0.8
                  }));

                  await autoBlogAPI.createAudienceKeywords(response.audience.id, keywords);
                }

                return {
                  ...strategy,
                  databaseId: response.audience.id,
                  id: response.audience.id
                };
              })
            );

            // Update strategies with database IDs
            setStrategies(savedStrategies);

          } catch (error) {
            console.error('⚠️ Failed to save some strategies to database:', error);
            // Don't show error to user - strategies are still functional
          }

          // Only show success message if strategies were actually loaded (not on remounts)
          if (openAIStrategies.length > 0) {
            setHint(systemVoice.audience.audienceReady, 'success', 5000);
            message.success(`Generated ${openAIStrategies.length} AI-powered audience strategies with real business intelligence`);
          }
        }, 800); // Shorter delay since we're not generating

      } else {
        // Issue #65: Try audience streaming first when no scenarios in analysis
        const runFallback = () => {
          const fallbackStrategies = [
          {
            id: 'primary-target',
            targetSegment: {
              demographics: analysis.targetAudience || 'Primary target audience',
              psychographics: analysis.customerProblems?.length > 0
                ? `Individuals seeking solutions for ${analysis.customerProblems[0]?.toLowerCase()}`
                : 'Value-driven customers focused on quality solutions',
              searchBehavior: analysis.searchBehavior || 'Active researchers seeking expert guidance and practical solutions'
            },
            customerProblem: analysis.customerProblems?.[0] || 'Finding reliable solutions and expert guidance in their field of interest',
            customerLanguage: analysis.customerLanguage?.slice(0, 4) || analysis.keywords?.slice(0, 4) || [
              `${analysis.businessName?.toLowerCase() || 'professional'} services`,
              `${analysis.businessType?.toLowerCase() || 'expert'} consultation`,
              'trusted solutions',
              'reliable advice'
            ],
            conversionPath: `Educational ${analysis.contentFocus || 'industry-focused'} content leading to consultation and service inquiries`,
            businessValue: {
              searchVolume: '15K+ monthly searches (estimated)',
              conversionPotential: 'High',
              priority: 1,
              competition: 'Medium'
            }
          },
          {
            id: 'secondary-segment',
            targetSegment: {
              demographics: analysis.endUsers || 'Secondary audience segment',
              psychographics: 'Early-stage decision makers researching options and building understanding',
              searchBehavior: 'Consume educational content and compare different approaches before making decisions'
            },
            customerProblem: analysis.customerProblems?.[1] || 'Understanding available options and making informed decisions',
            customerLanguage: analysis.customerLanguage?.slice(2, 6) || analysis.keywords?.slice(2, 6) || [
              `how to choose ${analysis.businessType?.toLowerCase() || 'services'}`,
              `best ${analysis.contentFocus?.split(',')[0]?.toLowerCase() || 'solutions'}`,
              'comparison guide',
              'expert recommendations'
            ],
            conversionPath: 'Comparison guides and educational resources leading to consultation bookings',
            businessValue: {
              searchVolume: '8K+ monthly searches (estimated)',
              conversionPotential: 'Medium',
              priority: 2,
              competition: 'Low'
            }
          }
        ];

        setTimeout(async () => {
          setStrategies(fallbackStrategies);
          generatedStrategiesCache.add(generationKey);
          sessionStorage.setItem(sessionStorageKey, 'true');
          setGeneratingStrategies(false);
          setHint(systemVoice.audience.audienceReady, 'success', 5000);

          // Save fallback strategies to database for persistence
          try {
            const savedStrategies = await Promise.all(
              fallbackStrategies.map(async (strategy) => {
                const audienceData = {
                  pitch: strategy.pitch || '', // OpenAI-generated agency pitch (empty for fallback)
                  image_url: strategy.imageUrl || null, // DALL-E generated image URL (null for fallback)
                  target_segment: strategy.targetSegment,
                  customer_problem: strategy.customerProblem,
                  customer_language: strategy.customerLanguage,
                  conversion_path: strategy.conversionPath,
                  business_value: strategy.businessValue,
                  priority: strategy.businessValue?.priority || 1
                };

                const response = await autoBlogAPI.createAudience(audienceData);

                // Save template keywords
                if (strategy.customerLanguage && strategy.customerLanguage.length > 0) {
                  const keywords = strategy.customerLanguage.map(keyword => ({
                    keyword: keyword,
                    search_volume: null,
                    competition: 'medium',
                    relevance_score: 0.7
                  }));

                  await autoBlogAPI.createAudienceKeywords(response.audience.id, keywords);
                }

                return {
                  ...strategy,
                  databaseId: response.audience.id,
                  id: response.audience.id
                };
              })
            );

            // Update strategies with database IDs
            setStrategies(savedStrategies);

          } catch (error) {
            console.error('⚠️ Failed to save fallback strategies to database:', error);
            // Don't show error to user - strategies are still functional
          }

          // Only show info message if fallback strategies were actually generated (not on remounts)
          if (fallbackStrategies.length > 0) {
            message.info(`Generated ${fallbackStrategies.length} template strategies (AI scenarios not available)`);
          }
        }, 1200);
        };

        const tryStreaming = async () => {
          let streamTimeoutId = null;
          try {
            const { connectionId } = await autoBlogAPI.generateAudiencesStream(analysis, []);
            setStrategies([]);
            const streamHandle = autoBlogAPI.connectToStream(connectionId, {
              onAudienceComplete: (data) => {
                const audience = data?.audience;
                if (!audience) return;
                setStrategies(prev => {
                  const transformed = transformAudienceToStrategy(audience, prev.length);
                  return [...prev, transformed];
                });
              },
              onComplete: () => {
                if (streamTimeoutId) clearTimeout(streamTimeoutId);
                setGeneratingStrategies(false);
                setHint(systemVoice.audience.audienceReady, 'success', 5000);
              },
              onError: () => {
                if (streamTimeoutId) clearTimeout(streamTimeoutId);
                setGeneratingStrategies(false);
                runFallback();
              }
            });
            // If stream never sends complete/error (e.g. connection closes without event), stop "Thinking about your audience" and show fallback
            const AUDIENCE_STREAM_TIMEOUT_MS = 12000;
            streamTimeoutId = setTimeout(() => {
              streamTimeoutId = null;
              setGeneratingStrategies(false);
              runFallback();
              if (streamHandle && typeof streamHandle.close === 'function') streamHandle.close();
            }, AUDIENCE_STREAM_TIMEOUT_MS);
          } catch (e) {
            console.warn('Audience stream not available, using template strategies:', e?.message);
            runFallback();
          }
        };
        tryStreaming();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    stepResults.home?.analysisCompleted,
    stepResults.home?.websiteAnalysis,
    strategies.length,
    generatingStrategies,
    loading
  ]);

  // Load subscriptions separately
  useEffect(() => {
    loadSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Load strategy subscriptions only
   */
  async function loadSubscriptions() {
    try {
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
      console.error('Failed to load subscriptions:', error);
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
  async function handleSubscribe(_strategyId) {
    try {
      // Subscription is handled by StrategyDetailsView (Stripe checkout)
      // After successful return, reload subscriptions
      await loadSubscriptions();
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
