import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Typography, Tag, Statistic, Space, message, Input, InputNumber, Carousel, Collapse } from 'antd';
import { UserOutlined, TeamOutlined, BulbOutlined, CheckOutlined, DatabaseOutlined, RocketOutlined, EditOutlined, SaveOutlined, CloseOutlined, PlusOutlined, DeleteOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTabMode } from '../../hooks/useTabMode';
import { useWorkflowMode } from '../../contexts/WorkflowModeContext';
import UnifiedWorkflowHeader from './UnifiedWorkflowHeader';
import { ComponentHelpers } from '../Workflow/interfaces/WorkflowComponentInterface';
import autoBlogAPI from '../../services/api';

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
  
  // Keyword editing state
  const [editingKeywords, setEditingKeywords] = useState(null); // Strategy ID being edited
  const [editedKeywords, setEditedKeywords] = useState([]); // Temporary keyword data during editing
  const [savingKeywords, setSavingKeywords] = useState(false);
  
  // Carousel navigation ref
  const carouselRef = React.useRef(null);
  
  
  // UI helpers from workflow components
  const responsive = ComponentHelpers.getResponsiveStyles();
  const defaultColors = ComponentHelpers.getDefaultColors();
  
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
      
      message.success(`Selected audience strategy: ${strategy.targetSegment.demographics.split(' ')[0]}...`);
    }
  };

  // Prepare step data for workflow progression
  const prepareStepData = () => {
    if (!selectedStrategy) return null;
    return {
      selectedCustomerStrategy: selectedStrategy,
      audienceSegment: selectedStrategy.targetSegment,
      businessValue: selectedStrategy.businessValue,
      timestamp: new Date().toISOString()
    };
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

  // Keyword editing functions
  const handleStartEditingKeywords = (strategy) => {
    setEditingKeywords(strategy.id);
    // Initialize edited keywords with current keywords or empty array
    const currentKeywords = strategy.keywords || [];
    setEditedKeywords(currentKeywords.map(kw => ({
      keyword: kw.keyword || kw,
      search_volume: kw.search_volume || null,
      relevance_score: kw.relevance_score || 0.8
    })));
  };

  const handleCancelEditingKeywords = () => {
    setEditingKeywords(null);
    setEditedKeywords([]);
  };

  const handleAddKeyword = () => {
    setEditedKeywords(prev => [...prev, { 
      keyword: '', 
      search_volume: null, 
      relevance_score: 0.8 
    }]);
  };

  const handleUpdateKeyword = (index, field, value) => {
    setEditedKeywords(prev => prev.map((kw, i) => 
      i === index ? { ...kw, [field]: value } : kw
    ));
  };

  const handleRemoveKeyword = (index) => {
    setEditedKeywords(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveKeywords = async (strategy) => {
    if (savingKeywords) return;
    
    setSavingKeywords(true);
    try {
      // Filter out empty keywords
      const validKeywords = editedKeywords.filter(kw => kw.keyword.trim() !== '');
      
      // Update keywords via API
      if (strategy.databaseId) {
        await autoBlogAPI.updateAudienceKeywords(strategy.databaseId, validKeywords);
        
        // Update local strategies state
        setStrategies(prev => prev.map(s => 
          s.id === strategy.id 
            ? { ...s, keywords: validKeywords }
            : s
        ));
        
        message.success(`Updated ${validKeywords.length} keywords successfully`);
      } else {
        message.error('Cannot save keywords - strategy not saved to database');
      }
      
      setEditingKeywords(null);
      setEditedKeywords([]);
      
    } catch (error) {
      console.error('Failed to save keywords:', error);
      message.error('Failed to save keywords. Please try again.');
    } finally {
      setSavingKeywords(false);
    }
  };

  // Render enhanced strategy card with business intelligence
  const renderStrategyCard = (strategy, index) => {
    console.log(`🎴 Rendering card ${index}:`, {
      id: strategy.id,
      demographics: strategy.targetSegment?.demographics,
      hasImageUrl: !!strategy.imageUrl,
      imageUrlPreview: strategy.imageUrl?.substring(0, 80) + '...'
    });

    const isSelected = selectedStrategy?.index === index;
    const isOthersSelected = selectedStrategy && !isSelected;

    return (
      <div key={strategy.id} style={{ padding: '0 8px' }}>
        <Card
          hoverable
          style={{
            border: isSelected ? `2px solid ${defaultColors.primary}` : '1px solid #f0f0f0',
            borderRadius: '12px',
            minHeight: '400px',
            cursor: 'pointer',
            opacity: isOthersSelected ? 0.5 : 1,
            transition: 'all 0.3s ease',
            margin: '0 auto',
            maxWidth: '600px'
          }}
          onClick={() => handleSelectStrategy(strategy, index)}
        >
          {/* Card Header - Audience Name */}
          <div style={{ marginBottom: '16px' }}>

            {/* Audience Image */}
            {strategy.imageUrl && (
              <div style={{
                marginBottom: '12px',
                width: '60%',
                aspectRatio: '1 / 1',
                backgroundColor: '#fafafa',
                borderRadius: '8px',
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
                    backgroundColor: '#ff4d4f',
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
                  fontSize: '16px'
                }} />
              )}
            </div>

            {/* Audience Name - Prominent */}
            <Title level={3} style={{
              margin: '8px 0 0 0',
              color: '#262626',
              fontSize: '18px',
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
                        color: '#1890ff',
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
                bordered={false}
                style={{
                  backgroundColor: '#f0f5ff',
                  borderLeft: '3px solid #1890ff',
                  borderRadius: '4px'
                }}
                items={[
                  {
                    key: '1',
                    label: (
                      <Text strong style={{
                        color: '#333',
                        fontSize: '14px'
                      }}>
                        {(() => {
                          // Extract revenue from Step 5 of pitch
                          const step5Match = strategy.pitch.match(/Step 5:[^\$]*\$([0-9,]+)-\$([0-9,]+)(?:\/month)?/);
                          if (step5Match) {
                            return `💰 Projected value: $${step5Match[1]}-$${step5Match[2]}/month`;
                          }
                          return '💡 Why This Audience';
                        })()}
                      </Text>
                    ),
                    children: (
                      <div style={{ padding: '0 12px 12px 12px' }}>
                        {/* Parse and format step-by-step pitch */}
                        {strategy.pitch.split(/\n/).map((line, index) => {
                          const stepMatch = line.match(/^(Step \d+:)\s*(.+)$/);
                          if (stepMatch) {
                            return (
                              <div key={index} style={{ marginBottom: index < strategy.pitch.split(/\n/).length - 1 ? '8px' : '0' }}>
                                <Text strong style={{ fontSize: '13px', color: '#1890ff' }}>
                                  {stepMatch[1]}
                                </Text>
                                <Text style={{ fontSize: '13px', color: '#262626', marginLeft: '6px' }}>
                                  {stepMatch[2]}
                                </Text>
                              </div>
                            );
                          }
                          return line ? (
                            <Text key={index} style={{ fontSize: '13px', lineHeight: '1.5', color: '#262626', display: 'block' }}>
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
        </Card>
      </div>
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
                <Card 
                  title={
                    <Space>
                      <TeamOutlined style={{ color: '#1890ff' }} />
                      Select Your Customer Strategy
                    </Space>
                  }
                  extra={<Tag color="blue">Required</Tag>}
                >
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <Title level={4}>Who is your ideal customer?</Title>
                    <Paragraph>
                      Choose the audience strategy that best describes your target market and business model.
                    </Paragraph>
                  </div>
                  
                  {/* Strategy Cards Grid */}
                  {!stepResults.home.analysisCompleted && forceWorkflowMode ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                      <Title level={4} style={{ color: '#fa8c16' }}>
                        Complete Website Analysis First
                      </Title>
                      <Text style={{ color: '#666', fontSize: '16px' }}>
                        Please complete the website analysis in Step 1 before selecting your target audience.
                        This helps us create personalized audience strategies based on your business.
                      </Text>
                    </div>
                  ) : generatingStrategies ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <div style={{ fontSize: '24px', marginBottom: '16px' }}>🎯</div>
                      <Title level={4} style={{ color: '#1890ff' }}>
                        Generating Audience Strategies...
                      </Title>
                      <Text style={{ color: '#666' }}>
                        Analyzing your website to create targeted customer strategies
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
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                              border: '1px solid #d9d9d9'
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
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                              border: '1px solid #d9d9d9'
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
                    <div style={{ marginTop: '24px', textAlign: 'center', padding: '16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px' }}>
                      <Text strong style={{ color: '#52c41a' }}>
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
                              backgroundColor: '#52c41a',
                              borderColor: '#52c41a'
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
                              backgroundColor: '#52c41a',
                              borderColor: '#52c41a'
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
          color: '#666',
          fontSize: responsive.fontSize.text
        }}>
          Select the audience you want to target with your content. These strategies are ranked by business opportunity and include enhanced targeting data.
        </Paragraph>
        
        {/* Enhanced ranking data indicator */}
        <div style={{
          textAlign: 'center',
          marginBottom: '24px',
          padding: '12px',
          backgroundColor: '#f6ffed',
          borderRadius: '6px',
          border: '1px solid #b7eb8f'
        }}>
          <Text style={{ fontSize: responsive.fontSize.small, color: '#389e0d' }}>
            🎯 Strategies ranked using search data: volumes, competitive analysis, and conversion potential
          </Text>
        </div>
        
        {/* Strategy Selection Cards */}
        {strategies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <DatabaseOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <Title level={4} style={{ color: '#999' }}>No Customer Strategies Found</Title>
            <Text style={{ marginBottom: '20px', color: '#666' }}>
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
                fontSize: '16px'
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
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      border: '1px solid #d9d9d9'
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
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      border: '1px solid #d9d9d9'
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