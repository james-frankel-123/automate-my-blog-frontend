import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Typography, Tag, message, Carousel, Collapse, Space } from 'antd';
import { BulbOutlined, CheckOutlined, DatabaseOutlined, RocketOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useTabMode } from '../../hooks/useTabMode';
import { useWorkflowMode } from '../../contexts/WorkflowModeContext';
import UnifiedWorkflowHeader from './UnifiedWorkflowHeader';
import { ComponentHelpers } from '../Workflow/interfaces/WorkflowComponentInterface';
import autoBlogAPI from '../../services/api';
import { systemVoice } from '../../copy/systemVoice';

const { Title, Text, Paragraph } = Typography;

// Module-level tracking to prevent duplicate generation across component mounts
const generatedStrategiesCache = new Set();

// Helper function to clear generation cache (call this when new website analysis is performed)
export const clearAudienceStrategiesCache = () => {
  generatedStrategiesCache.clear();
  // Clear all audience strategy session storage keys
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('audienceStrategiesGenerated_')) {
      sessionStorage.removeItem(key);
    }
  });
  console.log('🧹 Cleared audience strategies generation cache');
};

const AudienceSegmentsTab = ({ forceWorkflowMode = false, onNextStep, onEnterProjectMode }) => {
  const { user } = useAuth();
  const tabMode = useTabMode('audience-segments');
  const { 
    setSelectedCustomerStrategy,
    updateCustomerStrategy,
    stepResults,
    addStickyWorkflowStep 
  } = useWorkflowMode();
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [strategies, setStrategies] = useState([]);
  const [generatingStrategies, setGeneratingStrategies] = useState(false);

  // Strategy pricing state (Phase 2 - Dynamic Pricing)
  const [strategyPricing, setStrategyPricing] = useState({}); // Map of strategyId -> pricing data
  const [loadingPricing, setLoadingPricing] = useState(false);

  // Strategy subscription state (Phase 2 - Track subscribed strategies)
  const [subscribedStrategies, setSubscribedStrategies] = useState({}); // Map of strategyId -> subscription data
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);

  // Bundle pricing state
  const [bundlePricing, setBundlePricing] = useState(null);
  const [bundleOverview, setBundleOverview] = useState(null);
  const [loadingBundlePricing, setLoadingBundlePricing] = useState(false);
  const [hasBundleSubscription, setHasBundleSubscription] = useState(false);

  // Carousel navigation ref
  const carouselRef = React.useRef(null);
  
  
  // UI helpers from workflow components
  const responsive = ComponentHelpers.getResponsiveStyles();
  const defaultColors = ComponentHelpers.getDefaultColors();
  const theme = ComponentHelpers.getTheme();
  
  // Load persistent audience strategies when component mounts  
  useEffect(() => {
    const loadPersistentAudiences = async () => {
      // PRIORITY 1: Check for fresh analysis FIRST - this should take precedence over everything
      const hasFreshAnalysisWithScenarios = stepResults?.home?.websiteAnalysis?.scenarios?.length > 0;
      console.log('🔍 Persistence Loader - Fresh Analysis Check (PRIORITY):', {
        hasWebsiteAnalysis: !!stepResults?.home?.websiteAnalysis,
        scenariosCount: stepResults?.home?.websiteAnalysis?.scenarios?.length || 0,
        hasFreshAnalysis: hasFreshAnalysisWithScenarios,
        currentStrategiesCount: strategies.length,
        willSkip: hasFreshAnalysisWithScenarios
      });

      if (hasFreshAnalysisWithScenarios) {
        console.log('🚫 Skipping persistence load - fresh analysis with scenarios available');
        // If we already loaded old strategies, clear them so main generator can run
        if (strategies.length > 0) {
          console.log('🧹 Clearing old persisted strategies to make room for fresh analysis');
          setStrategies([]);
        }

        // Clear both sessionStorage and module cache to allow main generator to process fresh analysis
        const analysis = stepResults?.home?.websiteAnalysis;
        if (analysis) {
          const generationKey = `${analysis.businessName || 'unknown'}_${analysis.targetAudience || 'unknown'}_${analysis.contentFocus || 'unknown'}`;
          const sessionStorageKey = `audienceStrategiesGenerated_${generationKey}`;
          console.log('🧹 Clearing sessionStorage and module cache for fresh analysis:', {
            sessionStorageKey,
            generationKey
          });
          sessionStorage.removeItem(sessionStorageKey);
          generatedStrategiesCache.delete(generationKey);
        }

        return;
      }

      // PRIORITY 2: Skip if strategies already loaded or currently generating
      if (strategies.length > 0 || generatingStrategies) {
        console.log('🚫 Skipping audience load - strategies exist or generating');
        return;
      }

      console.log('🔍 AudienceSegmentsTab Persistence Loader Debug:', {
        user: !!user,
        tabMode: tabMode.mode,
        forceWorkflowMode,
        strategiesLength: strategies.length
      });
      
      try {
        // Load audiences from database/session
        const response = await autoBlogAPI.getUserAudiences({
          limit: 10 // Load up to 10 recent audience strategies
        });
        
        console.log('🔍 Persistence Loader Response:', {
          success: response.success,
          audiencesCount: response.audiences?.length || 0,
          audiences: response.audiences
        });
        
        if (response.success && response.audiences && response.audiences.length > 0) {
          // Transform database audiences to component format
          const persistentStrategies = response.audiences.map((audience, index) => ({
            id: audience.id, // Use actual database ID
            databaseId: audience.id, // Store for updates
            pitch: audience.pitch || '', // OpenAI-generated agency pitch
            imageUrl: audience.image_url || null, // DALL-E generated image URL
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
            keywords: audience.keywords || [], // Keywords from database
            topics: audience.topics || [], // Topics from database
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
          console.log('✅ Loaded Persistent Strategies:', persistentStrategies.length);
          
          if (user) {
            message.success(`Loaded ${persistentStrategies.length} saved audience strategies`);
          } else {
            message.success(`Restored ${persistentStrategies.length} audience strategies from your session`);
          }
        } else {
          console.log('📝 No persistent audiences found - will generate new ones if analysis exists');
          // IMPORTANT: Don't clear existing strategies when API returns empty during state transitions
          // Only proceed if we currently have no strategies
          if (strategies.length === 0) {
            console.log('💭 No existing strategies, continuing with empty state');
          } else {
            console.log('🛡️ Preserving existing strategies during state transition');
            return; // Don't overwrite existing data
          }
        }
      } catch (error) {
        console.error('❌ Failed to load persistent audiences:', error);
        // Don't show error to user - will fall back to generation
      }
    };
    
    loadPersistentAudiences();
  }, [user, tabMode.mode, stepResults.home.websiteAnalysis?.scenarios?.length]); // Re-check when scenarios are added

  // Fetch pricing for strategies (Phase 2 - Dynamic Pricing) — only when logged in (backend returns 401 without token)
  useEffect(() => {
    if (!user) return;

    const fetchStrategyPricing = async () => {
      if (strategies.length === 0 || loadingPricing) return;

      setLoadingPricing(true);

      try {
        // Helper to check if ID is a valid UUID (database ID)
        const isValidDatabaseId = (id) => {
          if (!id) return false;
          return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        };

        // Filter strategies to only fetch pricing for those with database IDs
        const strategiesWithDbIds = strategies.filter(s => isValidDatabaseId(s.id || s.databaseId));

        // Fetch pricing for each strategy with a database ID
        const pricingPromises = strategiesWithDbIds.map(async (strategy) => {
          try {
            const pricing = await autoBlogAPI.getStrategyPricing(strategy.id || strategy.databaseId);
            return { strategyId: strategy.id || strategy.databaseId, pricing: pricing.pricing };
          } catch (error) {
            // Silently skip strategies without valid pricing data
            return null;
          }
        });

        const pricingResults = await Promise.all(pricingPromises);

        // Build pricing map
        const pricingMap = {};
        pricingResults.forEach(result => {
          if (result) {
            pricingMap[result.strategyId] = result.pricing;
          }
        });

        setStrategyPricing(pricingMap);
      } catch (error) {
        console.error('Failed to fetch strategy pricing:', error);
      } finally {
        setLoadingPricing(false);
      }
    };

    fetchStrategyPricing();
  }, [user, strategies.length, strategies.map(s => s.id || s.databaseId).join(',')]); // Re-fetch when user or strategies change (including ID changes)

  // Fetch subscribed strategies to show subscription status
  useEffect(() => {
    if (!user || loadingSubscriptions) return;

    const fetchSubscribedStrategies = async () => {
      setLoadingSubscriptions(true);

      try {
        const response = await autoBlogAPI.getSubscribedStrategies();

        // Build map of strategyId -> subscription data
        const subscriptionsMap = {};
        response.subscriptions?.forEach(sub => {
          subscriptionsMap[sub.strategyId] = {
            postsRemaining: sub.postsRemaining,
            postsMaximum: sub.postsMaximum,
            billingInterval: sub.billingInterval,
            nextBillingDate: sub.nextBillingDate,
            status: sub.status
          };
        });

        setSubscribedStrategies(subscriptionsMap);
      } catch (error) {
        console.error('Failed to fetch subscriptions:', error);
      } finally {
        setLoadingSubscriptions(false);
      }
    };

    fetchSubscribedStrategies();
  }, [user]); // Re-fetch when user changes

  // Handle successful subscription redirect from Stripe
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const strategySubscribed = urlParams.get('strategy_subscribed');

    if (strategySubscribed) {
      message.success('Subscription successful! Processing...', 3);

      // Re-fetch subscriptions with retry logic (webhooks can take a few seconds)
      if (user && !loadingSubscriptions) {
        const refetchWithRetry = async (attempt = 1, maxAttempts = 5) => {
          try {
            const response = await autoBlogAPI.getSubscribedStrategies();

            const subscriptionsMap = {};
            response.subscriptions?.forEach(sub => {
              subscriptionsMap[sub.strategyId] = {
                postsRemaining: sub.postsRemaining,
                postsMaximum: sub.postsMaximum,
                billingInterval: sub.billingInterval,
                nextBillingDate: sub.nextBillingDate,
                status: sub.status
              };
            });

            // Check if the newly subscribed strategy is in the response
            const foundNewSubscription = subscriptionsMap[strategySubscribed];

            if (foundNewSubscription) {
              setSubscribedStrategies(subscriptionsMap);
              message.success('Subscription activated! You can now generate content.', 4);

              // Switch to focus mode to show saved strategies
              if (tabMode.mode !== 'focus') {
                tabMode.enterFocusMode();
              }
            } else if (attempt < maxAttempts) {
              // Webhook hasn't processed yet, retry after delay
              setTimeout(() => refetchWithRetry(attempt + 1, maxAttempts), attempt * 2000);
            } else {
              // Max retries reached
              setSubscribedStrategies(subscriptionsMap);
              message.warning('Subscription is processing. Refresh the page in a moment if it doesn\'t appear.', 6);
            }
          } catch (error) {
            if (attempt < maxAttempts) {
              setTimeout(() => refetchWithRetry(attempt + 1, maxAttempts), attempt * 2000);
            }
          }
        };

        refetchWithRetry();
      }

      // Clean up URL by removing the query parameter
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [user]); // Run when user changes or on mount

  // Fetch bundle pricing when strategies are loaded (2+ strategies required)
  useEffect(() => {
    console.log('🎁 Bundle pricing effect:', {
      hasUser: !!user,
      strategiesLength: strategies.length,
      shouldFetch: user && strategies.length >= 2
    });

    if (!user || strategies.length < 2) {
      setBundlePricing(null);
      return;
    }

    const fetchBundlePricing = async () => {
      setLoadingBundlePricing(true);
      try {
        console.log('🎁 Fetching bundle pricing...');
        const response = await autoBlogAPI.calculateBundlePrice();
        console.log('🎁 Bundle pricing response:', response);
        setBundlePricing(response.bundlePricing);
        setBundleOverview(response.bundleOverview);

        // Check if user has a bundle subscription
        const subscriptionsResponse = await autoBlogAPI.getBundleSubscription();
        console.log('🎁 Bundle subscription response:', subscriptionsResponse);
        setHasBundleSubscription(!!subscriptionsResponse.bundleSubscription);
      } catch (error) {
        console.error('❌ Failed to fetch bundle pricing:', error);
        setBundlePricing(null);
        setBundleOverview(null);
      } finally {
        setLoadingBundlePricing(false);
      }
    };

    fetchBundlePricing();
  }, [user, strategies.length]);

  // Load audience strategies based on OpenAI analysis when entering workflow mode or when analysis data exists
  useEffect(() => {
    // DEBUG: Log current state for troubleshooting
    console.log('🔍 AudienceSegmentsTab Main Generator Debug:', {
      strategiesLength: strategies.length,
      generatingStrategies,
      tabMode: tabMode.mode,
      forceWorkflowMode,
      hasWebsiteAnalysis: !!stepResults.home.websiteAnalysis,
      scenariosCount: stepResults.home.websiteAnalysis?.scenarios?.length || 0,
      hasAnalysisData: stepResults.home.websiteAnalysis &&
                      (stepResults.home.websiteAnalysis.targetAudience ||
                       stepResults.home.websiteAnalysis.businessName !== 'None'),
      analysisCompleted: stepResults.home.analysisCompleted
    });

    // Prevent duplicate strategy generation if strategies already exist or generating
    if (strategies.length > 0 || generatingStrategies) {
      console.log('🚫 Skipping main generator - strategies exist or generating');
      return;
    }

    const hasAnalysisData = stepResults.home.websiteAnalysis &&
                           (stepResults.home.websiteAnalysis.targetAudience ||
                            stepResults.home.websiteAnalysis.businessName !== 'None');

    console.log('🔍 Main Generator Condition Check:', {
      condition1: (tabMode.mode === 'workflow' || forceWorkflowMode) && stepResults.home.analysisCompleted && stepResults.home.websiteAnalysis,
      condition2: hasAnalysisData && tabMode.mode === 'focus' && !forceWorkflowMode,
      willExecute: ((tabMode.mode === 'workflow' || forceWorkflowMode) && stepResults.home.analysisCompleted && stepResults.home.websiteAnalysis) ||
                   (hasAnalysisData && tabMode.mode === 'focus' && !forceWorkflowMode)
    });

    if (((tabMode.mode === 'workflow' || forceWorkflowMode) && stepResults.home.analysisCompleted && stepResults.home.websiteAnalysis) ||
        (hasAnalysisData && tabMode.mode === 'focus' && !forceWorkflowMode)) {
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

      // Mark this analysis as being processed to prevent duplicate generation
      generatedStrategiesCache.add(generationKey);
      sessionStorage.setItem(sessionStorageKey, 'true');
      
      setGeneratingStrategies(true);
      
      // PRIMARY: Use OpenAI-generated scenarios if available
      if (analysis.scenarios && analysis.scenarios.length > 0) {
        
        // Transform OpenAI scenarios to component format
        const openAIStrategies = analysis.scenarios.map((scenario, index) => ({
          id: `openai-scenario-${index}`,
          pitch: scenario.pitch || '', // OpenAI-generated agency pitch
          imageUrl: scenario.imageUrl || null, // DALL-E generated image URL
          targetSegment: scenario.targetSegment || {
            demographics: scenario.customerProblem || '',
            psychographics: '',
            searchBehavior: ''
          },
          customerProblem: scenario.customerProblem || '',
          customerLanguage: scenario.customerLanguage || scenario.seoKeywords || [],
          conversionPath: scenario.conversionPath || '',
          businessValue: scenario.businessValue || {
            searchVolume: '',
            conversionPotential: '',
            priority: index + 1,
            competition: ''
          },
          contentIdeas: scenario.contentIdeas || [],
          seoKeywords: scenario.seoKeywords || []
        }));

        console.log('🎨 Transformed strategies with images:', openAIStrategies.map(s => ({
          id: s.id,
          demographics: s.targetSegment?.demographics,
          hasImage: !!s.imageUrl,
          imageUrl: s.imageUrl?.substring(0, 100) + '...'
        })));

        console.log('📍 About to set strategies with count:', openAIStrategies.length);

        // Sort by business value priority
        openAIStrategies.sort((a, b) => (a.businessValue.priority || 999) - (b.businessValue.priority || 999));
        
        setTimeout(async () => {
          console.log('✅ Setting strategies in state:', openAIStrategies.length);
          setStrategies(openAIStrategies);
          setGeneratingStrategies(false);
          console.log('✅ Strategies set in state');

          // Track previews viewed (user sees audience options)
          autoBlogAPI.trackLeadConversion('previews_viewed', {
            scenario_count: openAIStrategies.length,
            business_name: analysis.businessName,
            timestamp: new Date().toISOString()
          }).catch(err => console.error('Failed to track previews_viewed:', err));

          // Save generated strategies to database for persistence
          try {
            console.log('💾 Saving strategies to database with images:', openAIStrategies.map(s => ({
              demographics: s.targetSegment?.demographics,
              hasImageUrl: !!s.imageUrl,
              imageUrl: s.imageUrl
            })));

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

                console.log('💾 Saving audience with image_url:', {
                  demographics: strategy.targetSegment?.demographics,
                  image_url: audienceData.image_url
                });

                const response = await autoBlogAPI.createAudience(audienceData);

                console.log('✅ Saved audience response:', {
                  id: response.audience?.id,
                  has_image_url: !!response.audience?.image_url,
                  image_url: response.audience?.image_url
                });
                
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
            console.log('✅ Saved generated strategies to database:', savedStrategies.length);
            
          } catch (error) {
            console.error('⚠️ Failed to save some strategies to database:', error);
            // Don't show error to user - strategies are still functional
          }
          
          // Only show success message if strategies were actually loaded (not on remounts)
          if (openAIStrategies.length > 0) {
            message.success(`Generated ${openAIStrategies.length} AI-powered audience strategies with real business intelligence`);
          }
        }, 800); // Shorter delay since we're not generating
        
      } else {
        
        // FALLBACK: Generate template strategies only if no OpenAI scenarios
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
          setGeneratingStrategies(false);
          
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
            console.log('✅ Saved fallback strategies to database:', savedStrategies.length);
            
          } catch (error) {
            console.error('⚠️ Failed to save fallback strategies to database:', error);
            // Don't show error to user - strategies are still functional
          }
          
          // Only show info message if fallback strategies were actually generated (not on remounts)
          if (fallbackStrategies.length > 0) {
            message.info(`Generated ${fallbackStrategies.length} template strategies (AI scenarios not available)`);
          }
        }, 1200);
      }
    }
  }, [tabMode.mode, stepResults.home.analysisCompleted, stepResults.home.websiteAnalysis, strategies.length, generatingStrategies, forceWorkflowMode]);

  // Handle strategy selection in workflow mode
  const handleSelectStrategy = (strategy, index) => {
    const enhancedStrategy = {
      ...strategy,
      index: index
    };

    setSelectedStrategy(enhancedStrategy);

    if (tabMode.mode === 'workflow' || forceWorkflowMode) {
      // Update unified workflow state
      setSelectedCustomerStrategy(enhancedStrategy);
      updateCustomerStrategy(enhancedStrategy);

      // Add to progressive sticky header
      addStickyWorkflowStep('audienceSelection', {
        audienceName: strategy.targetSegment?.demographics?.split(' ').slice(0, 4).join(' ') + '...' || 'Selected Audience',
        targetSegment: strategy.targetSegment,
        customerProblem: strategy.customerProblem,
        businessValue: strategy.businessValue,
        timestamp: new Date().toISOString()
      });

      // Track audience selected
      autoBlogAPI.trackLeadConversion('audience_selected', {
        customer_problem: strategy.customerProblem,
        target_audience: strategy.targetSegment?.demographics,
        strategy_index: index,
        timestamp: new Date().toISOString()
      }).catch(err => console.error('Failed to track audience_selected:', err));

      message.success(`Selected audience strategy: ${strategy.targetSegment.demographics.split(' ')[0]}...`);
    }
  };

  // Navigate to dashboard and scroll to website analysis
  const handleRunAnalysis = () => {
    console.log('🚀 Navigate to website analysis triggered from audience tab');
    
    // Switch to dashboard tab
    if (tabMode.mode !== 'focus') {
      tabMode.enterFocusMode();
    }
    
    // Use setTimeout to ensure tab switch completes before scrolling
    setTimeout(() => {
      // Try to find the dashboard tab button and click it
      const dashboardButton = document.querySelector('[data-testid="dashboard-tab"], .ant-tabs-tab:first-child, .ant-menu-item:first-child');
      if (dashboardButton) {
        console.log('✅ Found dashboard tab, clicking...');
        dashboardButton.click();
        
        // Wait for tab content to load, then scroll to analysis
        setTimeout(() => {
          scrollToAnalysis();
        }, 300);
      } else {
        // Fallback: just scroll to analysis in current context
        scrollToAnalysis();
      }
    }, 100);
  };

  const scrollToAnalysis = () => {
    // Try multiple selectors to find the website analysis section
    const analysisSelectors = [
      '[data-testid="website-analysis"]',
      '.website-analysis-section',
      'input[placeholder*="website"], input[placeholder*="URL"]',
      'input[type="url"]',
      '.ant-input[placeholder*="lumibears"], .ant-input[placeholder*="website"]'
    ];
    
    let analysisElement = null;
    for (const selector of analysisSelectors) {
      analysisElement = document.querySelector(selector);
      if (analysisElement) break;
    }
    
    if (analysisElement) {
      console.log('✅ Found analysis element, scrolling and focusing...');
      
      // Scroll to the element
      analysisElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Focus the input if it's an input element
      setTimeout(() => {
        if (analysisElement.tagName === 'INPUT') {
          analysisElement.focus();
          message.success('Ready to analyze your website! Enter your URL above.');
        } else {
          // If it's a container, try to find input inside
          const input = analysisElement.querySelector('input');
          if (input) {
            input.focus();
            message.success('Ready to analyze your website! Enter your URL above.');
          } else {
            message.info('Scrolled to website analysis section');
          }
        }
      }, 600);
    } else {
      console.warn('❌ Could not find website analysis element');
      message.info('Please go to the Home tab to run website analysis');
    }
  };

  // Strategy subscription handler (Phase 2 - Dynamic Pricing)
  const handleSubscribeToStrategy = async (strategy, billingInterval) => {
    try {
      message.loading({ content: 'Redirecting to checkout...', key: 'subscribe' });

      const strategyId = strategy.id || strategy.databaseId;
      const response = await autoBlogAPI.subscribeToStrategy(strategyId, billingInterval);

      if (response.url || response.sessionUrl) {
        // Redirect to Stripe checkout
        window.location.href = response.url || response.sessionUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Failed to subscribe to strategy:', error);
      message.error({
        content: `Failed to start checkout: ${error.message}`,
        key: 'subscribe'
      });
    }
  };

  // Bundle subscription handler
  const handleSubscribeToBundle = async (billingInterval) => {
    try {
      message.loading({ content: 'Redirecting to checkout...', key: 'bundle-subscribe' });

      const response = await autoBlogAPI.subscribeToAllStrategies(billingInterval);

      if (response.url || response.sessionUrl) {
        // Redirect to Stripe checkout
        window.location.href = response.url || response.sessionUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Failed to subscribe to bundle:', error);
      message.error({
        content: `Failed to start checkout: ${error.message}`,
        key: 'bundle-subscribe'
      });
    }
  };

  // Render enhanced strategy card with business intelligence
  const renderStrategyCard = (strategy, index) => {
    const isSelected = selectedStrategy?.index === index;
    const isOthersSelected = selectedStrategy && !isSelected;

    // Get pricing for this strategy (Phase 2 - Dynamic Pricing)
    const strategyId = strategy.id || strategy.databaseId;
    const pricing = strategyPricing[strategyId];
    const hasPricing = !!pricing;
    const subscription = subscribedStrategies[strategyId];
    const isSubscribed = !!subscription;

    return (
      <motion.div
        key={strategy.id}
        style={{ padding: '0 8px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: index * 0.1,
          duration: 0.4,
          ease: [0.4, 0, 0.2, 1]
        }}
      >
        <Card
          hoverable
          style={{
            border: isSubscribed
              ? '2px solid var(--color-success)'
              : isSelected
                ? `2px solid ${defaultColors.primary}`
                : '1px solid var(--color-border-base)',
            borderRadius: 'var(--radius-lg)',
            minHeight: '400px',
            cursor: 'pointer',
            opacity: isOthersSelected ? 0.5 : 1,
            transition: 'all 0.3s ease',
            margin: '0 auto',
            maxWidth: '600px',
            position: 'relative',
            boxShadow: isSubscribed ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'var(--shadow-card)',
            backgroundColor: isSubscribed ? 'var(--color-success-bg)' : 'white'
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = isSubscribed ? '0 6px 16px rgba(16, 185, 129, 0.2)' : 'var(--shadow-elevated)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = isSubscribed ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'var(--shadow-card)'}
          onClick={() => handleSelectStrategy(strategy, index)}
        >
          {/* Subscribed Badge or Pricing Badge (Top-Right Corner) */}
          {isSubscribed ? (
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              backgroundColor: 'var(--color-success)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CheckOutlined style={{ fontSize: '14px' }} />
              <span>Active</span>
            </div>
          ) : hasPricing && (
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              lineHeight: 1.3
            }}>
              <div>${pricing.monthly}/mo</div>
              <div style={{ fontSize: '11px', opacity: 0.9 }}>
                or ${pricing.annual}/yr
              </div>
            </div>
          )}
          {/* Card Header - Audience Name */}
          <div style={{ marginBottom: '16px' }}>

            {/* Audience Image */}
            {strategy.imageUrl && (
              <div style={{
                marginBottom: '12px',
                width: '60%',
                aspectRatio: '1 / 1',
                backgroundColor: 'var(--color-background-alt)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                margin: '0 auto 12px auto'
              }}>
                <img
                  src={strategy.imageUrl}
                  alt={strategy.targetSegment?.demographics || 'Audience'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    console.error('Image failed to load:', strategy.imageUrl);
                    // Fallback if image fails to load
                    e.target.style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully:', strategy.imageUrl);
                  }}
                />
              </div>
            )}
            {!strategy.imageUrl && console.log('No imageUrl for strategy:', strategy.id)}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <Tag color={defaultColors.primary} style={{ marginBottom: '8px' }}>
                  Strategy {index + 1}
                </Tag>
                {strategy.businessValue?.priority === 1 && (
                  <span style={{
                    backgroundColor: 'var(--color-error)',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    marginLeft: '8px'
                  }}>
                    RECOMMENDED
                  </span>
                )}
              </div>
              {isSelected && (
                <CheckOutlined style={{
                  color: defaultColors.primary,
                  fontSize: 'var(--font-size-base)'
                }} />
              )}
            </div>

            {/* Audience Name - Prominent */}
            <Title level={3} style={{
              margin: '8px 0 0 0',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-lg)',
              fontWeight: 600,
              lineHeight: 1.3
            }}>
              {strategy.targetSegment?.demographics || 'Target Audience'}
              {(() => {
                // Use primary SEO keyword (first in array) for consistency across title, Step 1, and SEO section
                const primaryKeyword = strategy.seoKeywords?.[0] ||
                                      strategy.keywords?.[0]?.keyword ||
                                      strategy.customerLanguage?.[0];

                if (primaryKeyword) {
                  return (
                    <>
                      {' searching for '}
                      <span style={{
                        color: 'var(--color-primary)',
                        fontStyle: 'italic',
                        fontWeight: 500
                      }}>
                        "{primaryKeyword}"
                      </span>
                    </>
                  );
                }
                return null;
              })()}
            </Title>
          </div>

          {/* Why This Audience Section - Collapsible */}
          {strategy.pitch && (
            <div style={{ marginBottom: '16px' }}>
              <Collapse
                defaultActiveKey={[]}
                bordered={false}
                style={{
                  backgroundColor: 'var(--color-primary-50)',
                  borderLeft: '3px solid var(--color-primary)',
                  borderRadius: '4px'
                }}
                items={[
                  {
                    key: '1',
                    label: (
                      <Text strong style={{
                        color: 'var(--color-text-primary)',
                        fontSize: 'var(--font-size-sm)'
                      }}>
                        {(() => {
                          // Extract consultation price
                          const priceMatch = strategy.pitch.match(/\$(\d+(?:,\d{3})*)\/consultation/);
                          const consultationPrice = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : null;

                          // Extract monthly revenue range
                          const step5Match = strategy.pitch.match(/Step 5:[^$]*\$([0-9,]+)-\$([0-9,]+)(?:\/month)?/);

                          // Calculate ROI multiple
                          const annualFee = 240;
                          const roiMultiple = consultationPrice ? Math.floor(consultationPrice / annualFee) : null;

                          if (consultationPrice && roiMultiple) {
                            return `✅ Just 1 deal/year at $${consultationPrice.toLocaleString()} = ${roiMultiple}x your annual fees back. What's the risk?`;
                          }
                          // Fallback if extraction fails
                          if (step5Match) {
                            return `💡 Potential: $${step5Match[1]}-$${step5Match[2]}/month`;
                          }
                          return '💡 Why This Audience';
                        })()}
                      </Text>
                    ),
                    children: (
                      <div style={{ padding: '0 12px 12px 12px' }}>
                        {/* SEO Range Context Box */}
                        {(() => {
                          const step5Match = strategy.pitch.match(/Step 5:[^$]*\$([0-9,]+)-\$([0-9,]+)(?:\/month)?/);
                          if (step5Match) {
                            const lowRevenue = step5Match[1];
                            const highRevenue = step5Match[2];
                            return (
                              <div style={{
                                padding: '12px',
                                backgroundColor: 'var(--color-background-container)',
                                borderRadius: 'var(--radius-sm)',
                                marginBottom: '12px',
                                borderLeft: '3px solid var(--color-border-base)'
                              }}>
                                <Text strong style={{
                                  fontSize: '13px',
                                  color: 'var(--color-text-primary)',
                                  display: 'block',
                                  marginBottom: '4px'
                                }}>
                                  📊 With a solid SEO strategy:
                                </Text>
                                <Text style={{
                                  fontSize: '14px',
                                  color: 'var(--color-text-primary)',
                                  fontWeight: 600
                                }}>
                                  ${lowRevenue}-${highRevenue}/month potential
                                </Text>
                                <Text style={{
                                  fontSize: '12px',
                                  color: 'var(--color-text-secondary)',
                                  display: 'block',
                                  marginTop: '4px'
                                }}>
                                  Here's how we calculated this range:
                                </Text>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Parse and format step-by-step pitch */}
                        {strategy.pitch.split(/\n/).map((line, index) => {
                          const stepMatch = line.match(/^(Step \d+:)\s*(.+)$/);
                          if (stepMatch) {
                            return (
                              <div key={index} style={{ marginBottom: index < strategy.pitch.split(/\n/).length - 1 ? '8px' : '0' }}>
                                <Text strong style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                                  {stepMatch[1]}
                                </Text>
                                <Text style={{ fontSize: '13px', color: 'var(--color-text-primary)', marginLeft: '6px' }}>
                                  {stepMatch[2]}
                                </Text>
                              </div>
                            );
                          }
                          return line ? (
                            <Text key={index} style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--color-text-primary)', display: 'block' }}>
                              {line}
                            </Text>
                          ) : null;
                        })}
                      </div>
                    )
                  }
                ]}
              />
            </div>
          )}

          {/* Subscribe Buttons / Subscription Status (Phase 2 - Dynamic Pricing) */}
          {hasPricing && (() => {
            if (isSubscribed) {
              // Show generate content button for subscribed strategies
              return (
                <Button
                  type="primary"
                  block
                  size="large"
                  style={{
                    marginTop: '20px',
                    height: '48px',
                    fontWeight: 600,
                    fontSize: '15px'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectStrategy(strategy, index);
                  }}
                >
                  Generate Content
                </Button>
              );
            }

            // Show subscribe buttons if not subscribed
            return (
              <div style={{
                marginTop: '20px',
                padding: '16px',
                backgroundColor: 'var(--color-primary-50)',
                borderRadius: 'var(--radius-md)',
                borderTop: '2px solid var(--color-primary)'
              }}
                onClick={(e) => e.stopPropagation()} // Prevent card selection when clicking buttons
              >
                <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                  <Text strong style={{
                    fontSize: '14px',
                    color: 'var(--color-primary)',
                    display: 'block',
                    marginBottom: '4px'
                  }}>
                    💰 Projected Profit: ${pricing.projectedLow?.toLocaleString()}-${pricing.projectedHigh?.toLocaleString()}/month
                  </Text>
                  <Text style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    Subscribe for ${pricing.monthly}/month ({pricing.percentage.monthly}% of your projected profit)
                  </Text>
                </div>

                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <Button
                    type="primary"
                    block
                    size="large"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubscribeToStrategy(strategy, 'monthly');
                    }}
                    style={{
                      fontWeight: 600,
                      height: '44px'
                    }}
                  >
                    Subscribe - ${pricing.monthly}/month
                  </Button>
                  <Button
                    block
                    size="large"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubscribeToStrategy(strategy, 'annual');
                    }}
                    style={{
                      height: '40px',
                      borderColor: 'var(--color-primary)',
                      color: 'var(--color-primary)'
                    }}
                  >
                    Pay Annually - ${pricing.annual}/year
                    <Tag color="green" style={{ marginLeft: '8px' }}>
                      Save ${pricing.savings.annualSavingsDollars}
                    </Tag>
                  </Button>
                  <Text style={{
                    fontSize: '11px',
                    color: 'var(--color-text-secondary)',
                    display: 'block',
                    textAlign: 'center',
                    marginTop: '8px'
                  }}>
                    {pricing.posts.recommended} posts/month recommended • Up to {pricing.posts.maximum} posts available
                  </Text>
                </Space>
              </div>
            );
          })()}
        </Card>
      </motion.div>
    );
  };

  return (
    <div>
      
      <div style={{ padding: '24px' }}>
        {/* Unified Header - Consistent styling with other tabs */}
        <UnifiedWorkflowHeader
          user={user}
          onCreateNewPost={() => {
            // Switch to workflow mode
            tabMode.enterWorkflowMode();
            
            // Check if website analysis is completed
            const isAnalysisCompleted = stepResults.home?.analysisCompleted;
            
            setTimeout(() => {
              if (!isAnalysisCompleted) {
                // Navigate to Home section for analysis first
                const homeSection = document.getElementById('home');
                if (homeSection) {
                  homeSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                  });
                }
              } else {
                // Navigate to audience section (normal flow)
                const audienceSection = document.getElementById('audience-segments');
                if (audienceSection) {
                  audienceSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                  });
                }
              }
            }, 100);
          }}
          forceWorkflowMode={forceWorkflowMode}
          currentStep={2}
          analysisCompleted={stepResults.home.analysisCompleted}
        />

        {/* WORKFLOW MODE: Customer Strategy Selection Step */}
        {(tabMode.mode === 'workflow' || forceWorkflowMode) && (
          <>

            {/* Strategy Selection Cards - Core workflow step */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col span={24}>
                <Card>
                  <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <Title level={3} style={{ marginBottom: '8px' }}>Choose Your SEO Strategy</Title>
                    <Text style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-base)' }}>
                      Get comprehensive coverage or pick specific audiences that match your business goals
                    </Text>
                  </div>

                  {/* Bundle Option - Comprehensive SEO Plan */}
                  {bundlePricing && strategies.length >= 2 && !loadingBundlePricing && (
                    <div style={{ marginBottom: '32px' }}>
                      <Card
                        style={{
                          background: 'var(--gradient-primary)',
                          border: 'none',
                          borderRadius: 'var(--radius-lg)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Best Value Badge */}
                        <div style={{
                          position: 'absolute',
                          top: '16px',
                          right: '16px',
                          background: 'var(--color-success)',
                          color: 'white',
                          padding: '6px 16px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '12px',
                          fontWeight: 600,
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                          zIndex: 1
                        }}>
                          BEST VALUE
                        </div>

                        <div style={{ padding: '8px' }}>
                          <Row gutter={24} align="middle">
                            <Col xs={24} md={12}>
                              <div style={{ color: 'white' }}>
                                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🎯</div>
                                <Title level={3} style={{ color: 'white', marginBottom: '12px' }}>
                                  Comprehensive SEO Plan
                                </Title>

                                {/* AI-Generated Outcome-Focused Overview */}
                                {bundleOverview ? (
                                  <>
                                    <Text style={{
                                      color: 'rgba(255,255,255,0.95)',
                                      fontSize: '15px',
                                      display: 'block',
                                      marginBottom: '20px',
                                      lineHeight: '1.6'
                                    }}>
                                      {bundleOverview.overview}
                                    </Text>

                                    {/* Key Metrics */}
                                    <div style={{
                                      background: 'rgba(255,255,255,0.15)',
                                      backdropFilter: 'blur(10px)',
                                      padding: '16px',
                                      borderRadius: 'var(--radius-md)',
                                      marginBottom: '16px'
                                    }}>
                                      {bundleOverview.totalMonthlySearches && (
                                        <Text style={{ color: 'white', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                                          📊 <strong>{bundleOverview.totalMonthlySearches.toLocaleString()}</strong> monthly searches targeted
                                        </Text>
                                      )}
                                      {bundleOverview.projectedMonthlyProfit && (
                                        <Text style={{ color: 'white', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                                          💰 <strong>${bundleOverview.projectedMonthlyProfit.low?.toLocaleString() || 'N/A'}-${bundleOverview.projectedMonthlyProfit.high?.toLocaleString() || 'N/A'}</strong> projected monthly profit
                                        </Text>
                                      )}
                                      <Text style={{ color: 'white', fontSize: '13px', display: 'block' }}>
                                        🎯 <strong>{bundlePricing.strategyCount}</strong> audience segments covered
                                      </Text>
                                    </div>

                                    {/* Key Benefits */}
                                    {bundleOverview.keyBenefits && bundleOverview.keyBenefits.length > 0 && (
                                      <div style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        backdropFilter: 'blur(10px)',
                                        padding: '16px',
                                        borderRadius: 'var(--radius-md)',
                                        marginBottom: '16px'
                                      }}>
                                        {bundleOverview.keyBenefits.map((benefit, idx) => (
                                          <Text key={idx} style={{ color: 'white', fontSize: '13px', display: 'block', marginBottom: idx < bundleOverview.keyBenefits.length - 1 ? '8px' : '0' }}>
                                            ✓ {benefit}
                                          </Text>
                                        ))}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  // Fallback to basic display while AI overview loads
                                  <>
                                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '15px', display: 'block', marginBottom: '16px' }}>
                                      Get all {bundlePricing.strategyCount} audience strategies with one subscription
                                    </Text>

                                    <div style={{
                                      background: 'rgba(255,255,255,0.1)',
                                      backdropFilter: 'blur(10px)',
                                      padding: '16px',
                                      borderRadius: 'var(--radius-md)',
                                      marginBottom: '16px'
                                    }}>
                                      <Text style={{ color: 'white', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                                        ✓ {bundlePricing.strategyCount} targeted audience strategies
                                      </Text>
                                      <Text style={{ color: 'white', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                                        ✓ {bundlePricing.strategyCount * bundlePricing.postsPerStrategy.recommended} posts/month total (up to {bundlePricing.strategyCount * bundlePricing.postsPerStrategy.maximum})
                                      </Text>
                                      <Text style={{ color: 'white', fontSize: '13px', display: 'block' }}>
                                        ✓ Save ${bundlePricing.savings.monthlyDiscount.toFixed(0)}/month compared to individual subscriptions
                                      </Text>
                                    </div>
                                  </>
                                )}
                              </div>
                            </Col>

                            <Col xs={24} md={12}>
                              <div style={{
                                background: 'white',
                                padding: '24px',
                                borderRadius: 'var(--radius-md)',
                                textAlign: 'center'
                              }}>
                                {hasBundleSubscription ? (
                                  <>
                                    <div style={{ marginBottom: '16px' }}>
                                      <CheckOutlined style={{
                                        fontSize: '32px',
                                        color: 'var(--color-success)',
                                        marginBottom: '8px'
                                      }} />
                                      <Title level={4} style={{ color: 'var(--color-success)', margin: 0 }}>
                                        Active Subscription
                                      </Title>
                                    </div>
                                    <Text style={{ color: 'var(--color-text-secondary)', display: 'block', marginBottom: '16px' }}>
                                      You have full access to all {bundlePricing.strategyCount} strategies
                                    </Text>
                                  </>
                                ) : (
                                  <>
                                    <div style={{ marginBottom: '16px' }}>
                                      <div style={{
                                        fontSize: '36px',
                                        fontWeight: 700,
                                        color: 'var(--color-primary)',
                                        lineHeight: 1
                                      }}>
                                        ${bundlePricing.bundleMonthly.toFixed(0)}
                                        <span style={{ fontSize: '16px', fontWeight: 400 }}>/mo</span>
                                      </div>
                                      <Text style={{ color: 'var(--color-text-tertiary)', fontSize: '13px' }}>
                                        Regular price: ${bundlePricing.individualMonthlyTotal.toFixed(0)}/mo
                                      </Text>
                                    </div>

                                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                                      <Button
                                        type="primary"
                                        size="large"
                                        block
                                        onClick={() => handleSubscribeToBundle('monthly')}
                                        style={{
                                          height: '48px',
                                          fontSize: '16px',
                                          fontWeight: 600
                                        }}
                                      >
                                        Subscribe Monthly
                                      </Button>
                                      <Button
                                        size="large"
                                        block
                                        onClick={() => handleSubscribeToBundle('annual')}
                                        style={{
                                          height: '44px',
                                          fontSize: '15px'
                                        }}
                                      >
                                        Pay Annually - ${bundlePricing.bundleAnnual.toFixed(0)}
                                        <Tag color="green" style={{ marginLeft: '8px' }}>
                                          Save ${bundlePricing.savings.totalAnnualSavings.toFixed(0)}
                                        </Tag>
                                      </Button>
                                    </Space>

                                    <Text style={{
                                      color: 'var(--color-text-tertiary)',
                                      fontSize: '11px',
                                      display: 'block',
                                      marginTop: '12px'
                                    }}>
                                      Cancel anytime • Secure checkout powered by Stripe
                                    </Text>
                                  </>
                                )}
                              </div>
                            </Col>
                          </Row>
                        </div>
                      </Card>

                      {/* Or Divider */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        margin: '32px 0',
                        gap: '16px'
                      }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--color-border-base)' }} />
                        <Text style={{ color: 'var(--color-text-tertiary)', fontSize: '13px', fontWeight: 500 }}>
                          OR CHOOSE INDIVIDUAL STRATEGIES
                        </Text>
                        <div style={{ flex: 1, height: '1px', background: 'var(--color-border-base)' }} />
                      </div>
                    </div>
                  )}

                  {/* Strategy Cards Grid */}
                  {!stepResults.home.analysisCompleted && forceWorkflowMode ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                      <Title level={4} style={{ color: 'var(--color-warning)' }}>
                        Complete Website Analysis First
                      </Title>
                      <Text style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-base)' }}>
                        Please complete the website analysis in Step 1 before selecting your target audience.
                        This helps us create personalized audience strategies based on your business.
                      </Text>
                    </div>
                  ) : generatingStrategies ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <div style={{ fontSize: '24px', marginBottom: '16px' }}>🎯</div>
                      <Title level={4} style={{ color: 'var(--color-primary)' }}>
                        {systemVoice.audience.generatingStrategies}
                      </Title>
                      <Text style={{ color: 'var(--color-text-secondary)' }}>
                        {systemVoice.audience.generatingStrategiesWithTime}
                      </Text>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      {/* Navigation Arrows */}
                      {strategies.length > 2 && (
                        <>
                          <Button
                            type="text"
                            icon={<LeftOutlined />}
                            onClick={() => carouselRef.current?.prev()}
                            style={{
                              position: 'absolute',
                              left: '-10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              zIndex: 10,
                              backgroundColor: 'white',
                              boxShadow: 'var(--shadow-sm)',
                              border: '1px solid var(--color-border-light)'
                            }}
                          />
                          <Button
                            type="text"
                            icon={<RightOutlined />}
                            onClick={() => carouselRef.current?.next()}
                            style={{
                              position: 'absolute',
                              right: '-10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              zIndex: 10,
                              backgroundColor: 'white',
                              boxShadow: 'var(--shadow-sm)',
                              border: '1px solid var(--color-border-light)'
                            }}
                          />
                        </>
                      )}
                      
                      <Carousel
                        ref={carouselRef}
                        dots={strategies.length > 1}
                        infinite={strategies.length > 1}
                        slidesToShow={1}
                        slidesToScroll={1}
                        style={{ padding: '0 20px' }}
                      >
                        {strategies.map((strategy, index) => renderStrategyCard(strategy, index))}
                      </Carousel>
                    </div>
                  )}
                  
                  {selectedStrategy && (
                    <div style={{ marginTop: '24px', textAlign: 'center', padding: '16px', background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', borderRadius: '6px' }}>
                      <Text strong style={{ color: 'var(--color-success)' }}>
                        ✅ Selected: {selectedStrategy.targetSegment?.demographics.split(' ').slice(0, 4).join(' ')}...
                      </Text>
                      <div style={{ marginTop: '16px' }}>
                        {onNextStep ? (
                          <Button
                            type="primary"
                            size="large"
                            onClick={onNextStep}
                            style={{
                              minWidth: '200px',
                              backgroundColor: 'var(--color-success)',
                              borderColor: 'var(--color-success)'
                            }}
                            icon={<BulbOutlined />}
                          >
                            Next Step: Generate Content
                          </Button>
                        ) : user && (
                          <Button
                            type="primary"
                            size="large"
                            onClick={() => {
                              // Set the selected customer strategy in workflow context
                              if (selectedStrategy) {
                                setSelectedCustomerStrategy(selectedStrategy);
                                console.log('🎯 Setting selected customer strategy for content generation:', selectedStrategy);
                              }
                              
                              if (onEnterProjectMode) {
                                onEnterProjectMode();
                              } else {
                                tabMode.enterWorkflowMode();
                              }
                              
                              // Navigate to Posts section for content generation
                              setTimeout(() => {
                                const postsSection = document.getElementById('posts');
                                if (postsSection) {
                                  postsSection.scrollIntoView({ 
                                    behavior: 'smooth', 
                                    block: 'start' 
                                  });
                                }
                              }, 100);
                              
                              message.success('Moving to content creation...');
                            }}
                            style={{
                              minWidth: '200px',
                              backgroundColor: 'var(--color-success)',
                              borderColor: 'var(--color-success)'
                            }}
                            icon={<BulbOutlined />}
                          >
                            Continue to Content
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </>
        )}

        {/* FOCUS MODE: Full Audience Management Features (Premium) */}
        {tabMode.mode === 'focus' && !forceWorkflowMode && (
          <>

      {/* Main Content */}
      <Card style={{ marginBottom: '20px' }}>
        <Title level={3} style={{ 
          textAlign: 'center', 
          marginBottom: '20px',
          fontSize: responsive.fontSize.title
        }}>
          🎯 Choose Your Target Strategy
        </Title>
        
        <Paragraph style={{
          textAlign: 'center',
          marginBottom: '20px',
          color: 'var(--color-text-secondary)',
          fontSize: responsive.fontSize.text
        }}>
          Select the audience you want to target with your content. These strategies are ranked by business opportunity and include enhanced targeting data.
        </Paragraph>
        
        {/* Enhanced ranking data indicator */}
        <div style={{
          textAlign: 'center',
          marginBottom: '24px',
          padding: '12px',
          backgroundColor: 'var(--color-success-bg)',
          borderRadius: '6px',
          border: '1px solid var(--color-success-border)'
        }}>
          <Text style={{ fontSize: responsive.fontSize.small, color: 'var(--color-success-dark)' }}>
            🎯 Strategies ranked using search data: volumes, competitive analysis, and conversion potential
          </Text>
        </div>

        {/* Bundle Option - Comprehensive SEO Plan (FOCUS MODE) */}
        {bundlePricing && strategies.length >= 2 && !loadingBundlePricing && (
          <div style={{ marginBottom: '32px' }}>
            <Card
              style={{
                background: 'var(--gradient-primary)',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Best Value Badge */}
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'var(--color-success)',
                color: 'white',
                padding: '6px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                zIndex: 1
              }}>
                BEST VALUE
              </div>

              <div style={{ padding: '8px' }}>
                <Row gutter={24} align="middle">
                  <Col xs={24} md={12}>
                    <div style={{ color: 'white' }}>
                      <div style={{ fontSize: '28px', marginBottom: '12px' }}>🎯</div>
                      <Title level={3} style={{ color: 'white', marginBottom: '12px' }}>
                        Comprehensive SEO Plan
                      </Title>

                      {/* AI-Generated Outcome-Focused Overview */}
                      {bundleOverview ? (
                        <>
                          <Text style={{
                            color: 'rgba(255,255,255,0.95)',
                            fontSize: '15px',
                            display: 'block',
                            marginBottom: '20px',
                            lineHeight: '1.6'
                          }}>
                            {bundleOverview.overview}
                          </Text>

                          {/* Key Metrics */}
                          <div style={{
                            background: 'rgba(255,255,255,0.15)',
                            backdropFilter: 'blur(10px)',
                            padding: '16px',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '16px'
                          }}>
                            {bundleOverview.totalMonthlySearches && (
                              <Text style={{ color: 'white', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                                📊 <strong>{bundleOverview.totalMonthlySearches.toLocaleString()}</strong> monthly searches targeted
                              </Text>
                            )}
                            {bundleOverview.projectedMonthlyProfit && (
                              <Text style={{ color: 'white', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                                💰 <strong>${bundleOverview.projectedMonthlyProfit.low?.toLocaleString() || 'N/A'}-${bundleOverview.projectedMonthlyProfit.high?.toLocaleString() || 'N/A'}</strong> projected monthly profit
                              </Text>
                            )}
                            <Text style={{ color: 'white', fontSize: '13px', display: 'block' }}>
                              🎯 <strong>{bundlePricing.strategyCount}</strong> audience segments covered
                            </Text>
                          </div>

                          {/* Key Benefits */}
                          {bundleOverview.keyBenefits && bundleOverview.keyBenefits.length > 0 && (
                            <div style={{
                              background: 'rgba(255,255,255,0.1)',
                              backdropFilter: 'blur(10px)',
                              padding: '16px',
                              borderRadius: 'var(--radius-md)',
                              marginBottom: '16px'
                            }}>
                              {bundleOverview.keyBenefits.map((benefit, idx) => (
                                <Text key={idx} style={{ color: 'white', fontSize: '13px', display: 'block', marginBottom: idx < bundleOverview.keyBenefits.length - 1 ? '8px' : '0' }}>
                                  ✓ {benefit}
                                </Text>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        // Fallback to basic display while AI overview loads
                        <>
                          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '15px', display: 'block', marginBottom: '16px' }}>
                            Get all {bundlePricing.strategyCount} audience strategies with one subscription
                          </Text>

                          <div style={{
                            background: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)',
                            padding: '16px',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '16px'
                          }}>
                            <Text style={{ color: 'white', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                              ✓ {bundlePricing.strategyCount} targeted audience strategies
                            </Text>
                            <Text style={{ color: 'white', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                              ✓ {bundlePricing.strategyCount * bundlePricing.postsPerStrategy.recommended} posts/month total (up to {bundlePricing.strategyCount * bundlePricing.postsPerStrategy.maximum})
                            </Text>
                            <Text style={{ color: 'white', fontSize: '13px', display: 'block' }}>
                              ✓ Save ${bundlePricing.savings.monthlyDiscount.toFixed(0)}/month compared to individual subscriptions
                            </Text>
                          </div>
                        </>
                      )}
                    </div>
                  </Col>

                  <Col xs={24} md={12}>
                    <div style={{
                      background: 'white',
                      padding: '24px',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center'
                    }}>
                      {hasBundleSubscription ? (
                        <>
                          <div style={{ marginBottom: '16px' }}>
                            <CheckOutlined style={{
                              fontSize: '32px',
                              color: 'var(--color-success)',
                              marginBottom: '8px'
                            }} />
                            <Title level={4} style={{ color: 'var(--color-success)', margin: 0 }}>
                              Active Subscription
                            </Title>
                          </div>
                          <Text style={{ color: 'var(--color-text-secondary)', display: 'block', marginBottom: '16px' }}>
                            You have full access to all {bundlePricing.strategyCount} strategies
                          </Text>
                        </>
                      ) : (
                        <>
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{
                              fontSize: '36px',
                              fontWeight: 700,
                              color: 'var(--color-primary)',
                              lineHeight: 1
                            }}>
                              ${bundlePricing.bundleMonthly.toFixed(0)}
                              <span style={{ fontSize: '16px', fontWeight: 400 }}>/mo</span>
                            </div>
                            <Text style={{ color: 'var(--color-text-tertiary)', fontSize: '13px' }}>
                              Regular price: ${bundlePricing.individualMonthlyTotal.toFixed(0)}/mo
                            </Text>
                          </div>

                          <Space direction="vertical" style={{ width: '100%' }} size="small">
                            <Button
                              type="primary"
                              size="large"
                              block
                              onClick={() => handleSubscribeToBundle('monthly')}
                              style={{
                                height: '48px',
                                fontSize: '16px',
                                fontWeight: 600
                              }}
                            >
                              Subscribe Monthly
                            </Button>
                            <Button
                              size="large"
                              block
                              onClick={() => handleSubscribeToBundle('annual')}
                              style={{
                                height: '44px',
                                fontSize: '15px'
                              }}
                            >
                              Pay Annually - ${bundlePricing.bundleAnnual.toFixed(0)}
                              <Tag color="green" style={{ marginLeft: '8px' }}>
                                Save ${bundlePricing.savings.totalAnnualSavings.toFixed(0)}
                              </Tag>
                            </Button>
                          </Space>

                          <Text style={{
                            color: 'var(--color-text-tertiary)',
                            fontSize: '11px',
                            display: 'block',
                            marginTop: '12px'
                          }}>
                            Cancel anytime • Secure checkout powered by Stripe
                          </Text>
                        </>
                      )}
                    </div>
                  </Col>
                </Row>
              </div>
            </Card>

            {/* Or Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '32px 0',
              gap: '16px'
            }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--color-border-base)' }} />
              <Text style={{ color: 'var(--color-text-tertiary)', fontSize: '13px', fontWeight: 500 }}>
                OR CHOOSE INDIVIDUAL STRATEGIES
              </Text>
              <div style={{ flex: 1, height: '1px', background: 'var(--color-border-base)' }} />
            </div>
          </div>
        )}

        {/* Strategy Selection Cards */}
        {strategies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
            <DatabaseOutlined style={{ fontSize: '48px', color: 'var(--color-gray-300)', marginBottom: '16px' }} />
            <Title level={4} style={{ color: 'var(--color-text-tertiary)' }}>No Customer Strategies Found</Title>
            <Text style={{ marginBottom: '20px', color: 'var(--color-text-secondary)' }}>
              Run website analysis to generate personalized customer strategies based on your business.
            </Text>
            <Button 
              type="primary" 
              size="large"
              icon={<RocketOutlined />}
              onClick={handleRunAnalysis}
              style={{ 
                marginTop: '8px',
                minWidth: '200px',
                height: '40px',
                fontSize: 'var(--font-size-base)'
              }}
            >
              Run Website Analysis
            </Button>
          </div>
        ) : (
          <div>
            <div style={{ position: 'relative' }}>
              {/* Navigation Arrows */}
              {strategies.length > 2 && (
                <>
                  <Button
                    type="text"
                    icon={<LeftOutlined />}
                    onClick={() => carouselRef.current?.prev()}
                    style={{
                      position: 'absolute',
                      left: '-10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      backgroundColor: 'white',
                      boxShadow: theme.shadows.sm,
                      border: '1px solid var(--color-gray-300)'
                    }}
                  />
                  <Button
                    type="text"
                    icon={<RightOutlined />}
                    onClick={() => carouselRef.current?.next()}
                    style={{
                      position: 'absolute',
                      right: '-10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      backgroundColor: 'white',
                      boxShadow: theme.shadows.sm,
                      border: '1px solid var(--color-gray-300)'
                    }}
                  />
                </>
              )}
              
              <Carousel
                ref={carouselRef}
                dots={strategies.length > 1}
                infinite={strategies.length > 1}
                slidesToShow={1}
                slidesToScroll={1}
                style={{ padding: '0 20px' }}
              >
                {strategies.map((strategy, index) => renderStrategyCard(strategy, index))}
              </Carousel>
            </div>
            
            {/* Continue Button */}
            {selectedStrategy && tabMode.mode === 'workflow' && (
              <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => {
                    // Save the selected customer strategy to workflow context
                    setSelectedCustomerStrategy(selectedStrategy);
                    updateCustomerStrategy(selectedStrategy);
                    
                    // Update workflow data for content tab
                    tabMode.continueToNextStep({
                      selectedCustomerStrategy: selectedStrategy,
                      selectedAudience: selectedStrategy.targetSegment?.demographics || 'Target Audience'
                    });
                    
                    message.success('Moving to content creation...');
                  }}
                  style={{
                    backgroundColor: defaultColors.primary,
                    borderColor: defaultColors.primary,
                    minWidth: '200px'
                  }}
                  icon={<BulbOutlined />}
                >
                  Generate Content Ideas
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

          </>
        )}
      </div>
    </div>
  );
};

export default AudienceSegmentsTab;