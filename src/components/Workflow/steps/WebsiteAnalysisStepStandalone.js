import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Row, Col, Typography, Input, Form, Space, Tag, Spin, message, Collapse } from 'antd';
import {
  GlobalOutlined,
  ScanOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { ComponentHelpers } from '../interfaces/WorkflowComponentInterface';
import { analysisAPI } from '../../../services/workflowAPI';
import workflowUtils from '../../../utils/workflowUtils';
import autoBlogAPI from '../../../services/api';
import jobsAPI from '../../../services/jobsAPI';
import { systemVoice } from '../../../copy/systemVoice';
import { useSystemHint } from '../../../contexts/SystemHintContext';
import { NarrativeAnalysisCard } from '../../Dashboard/NarrativeAnalysisCard';
import { NarrativeAnalysisDisplay } from '../../Dashboard/NarrativeAnalysisDisplay';
import BusinessProfileSlide from '../../Analysis/BusinessProfileSlide';
import AnalysisSectionNav from '../../Dashboard/AnalysisSectionNav';
import ChecklistProgress from '../../shared/ChecklistProgress';
import AnalysisEmptyState from '../../EmptyStates/AnalysisEmptyState';
import { notifyTabReady } from '../../../utils/tabReadyAlert';

const { Title, Text, Paragraph } = Typography;

/**
 * Standalone Website Analysis Step Component
 * Reusable component for website URL input, analysis, and results display
 * Can be used in Home tab, New Post workflow, and other locations
 */
const WebsiteAnalysisStepStandalone = ({
  // Core state
  websiteUrl,
  setWebsiteUrl,
  analysisResults,
  setAnalysisResults,
  webSearchInsights,
  setWebSearchInsights,

  // Loading states
  isLoading,
  setIsLoading,
  scanningMessage,
  setScanningMessage,
  analysisCompleted,
  setAnalysisCompleted,

  // User context
  user,
  requireAuth: _requireAuth,

  // Event handlers
  onAnalysisComplete,
  onStartOver,
  addStickyWorkflowStep,
  updateStickyWorkflowStep,
  onEditingStateChange,

  // Configuration
  embedded: _embedded = false,
  showTitle = true,
  autoAnalyze = false,

  // Animation props
  delayedReveal = false,
  showInput = true,

  // Style overrides
  cardStyle = {},
  className = '',

  // Default helpers
  getDefaultColors: _getDefaultColors = ComponentHelpers.getDefaultColors
}) => {
  
  // =============================================================================
  // LOCAL STATE AND HELPERS
  // =============================================================================
  
  const responsive = ComponentHelpers.getResponsiveStyles();

  // URL prepopulation logic for logged-in users
  const userOrganizationWebsite = user?.organizationWebsite;
  const [urlOverrideMode, setUrlOverrideMode] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [localScanningMessage, setLocalScanningMessage] = useState('');
  
  // Inline editing state
  const [editMode, setEditMode] = useState(false);
  const [editableResults, setEditableResults] = useState(null);

  // CTA state management
  const [organizationCTAs, setOrganizationCTAs] = useState([]);
  const [ctasLoading, setCtasLoading] = useState(false);

  // Success highlight when analysis result first appears
  const [showSuccessHighlight, setShowSuccessHighlight] = useState(false);

  // Job ID for narrative stream (Issue #157); cleared when loading ends
  const [analysisJobId, setAnalysisJobId] = useState(null);

  // Business profile for PowerPoint-style display
  const [businessProfile, setBusinessProfile] = useState(null);

  // Animation state for delayed reveal
  const [inputVisible, setInputVisible] = useState(!delayedReveal);
  const [showSparkle, setShowSparkle] = useState(false);

  // Input editing mode state (controls button/icon visibility)
  const [isEditing, setIsEditing] = useState(true);

  // Analysis progress from job stream (progress, currentStep, phase?, detail?, estimatedTimeRemaining)
  const [analysisProgress, setAnalysisProgress] = useState(null);
  // Scrape-phase "thoughts" from job stream (phase, message, url?) for step-by-step log
  const [analysisThoughts, setAnalysisThoughts] = useState([]);
  // Expand Technical Details collapse when nav links to a subsection (Issue #168)
  const [technicalDetailsExpanded, setTechnicalDetailsExpanded] = useState(false);
  // Ref to latest analysis results for per-item stream updates (audience-complete, pitch-complete, scenario-image-complete)
  const latestAnalysisRef = useRef(analysisResults);
  // Last analysis error for informative empty state (Issue #185)
  const [lastAnalysisError, setLastAnalysisError] = useState(null);

  // Use local state if parent doesn't provide state management
  const loading = isLoading !== undefined ? isLoading : localLoading;
  const currentScanningMessage = scanningMessage !== undefined ? scanningMessage : localScanningMessage;
  const { setHint } = useSystemHint();

  // Keep ref in sync with analysisResults so per-item callbacks read latest scenarios
  useEffect(() => {
    latestAnalysisRef.current = analysisResults;
  }, [analysisResults]);

  // Auto-populate websiteUrl on component mount if user has organization website and no URL is set
  useEffect(() => {
    if (userOrganizationWebsite && !websiteUrl && !urlOverrideMode) {
      setWebsiteUrl && setWebsiteUrl(userOrganizationWebsite);
    }
  }, [userOrganizationWebsite, websiteUrl, urlOverrideMode, setWebsiteUrl]);
  
  // Auto-analyze on mount if requested
  useEffect(() => {
    if (autoAnalyze && websiteUrl && !analysisCompleted && !loading) {
      handleWebsiteSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only when mount/url/state allow; handleWebsiteSubmit identity is not needed
  }, [autoAnalyze, websiteUrl, analysisCompleted, loading]);

  // Trigger success highlight when analysis result appears
  useEffect(() => {
    if (!loading && analysisResults) {
      setShowSuccessHighlight(true);
      const t = setTimeout(() => setShowSuccessHighlight(false), 600);
      return () => clearTimeout(t);
    }
  }, [loading, analysisResults]);

  // Narrative stream job ID is cleared only when stream completes (onNarrativeComplete), not when loading ends,
  // so the streaming UI stays visible until the narrative is persisted into analysisResults.

  // Poll for narrative when it's generating
  useEffect(() => {
    if (!analysisResults?.narrativeGenerating || !analysisResults?.organizationId) {
      return;
    }

    let pollCount = 0;
    const maxPolls = 120; // Max 2 minutes of polling (increased for queue processing)

    const pollInterval = setInterval(async () => {
      pollCount++;

      try {
        const data = await autoBlogAPI.makeRequest(
          `api/narrative/${analysisResults.organizationId}`
        );

        // Update UI with job status
        if (data.job) {
          setAnalysisResults(prev => ({
            ...prev,
            narrativeJobStatus: data.job.status,
            narrativeJobAttempts: data.job.attempts
          }));
        }

        if (data.ready && data.narrative) {
          clearInterval(pollInterval);

          // Update analysisResults with the narrative
          setAnalysisResults({
            ...analysisResults,
            narrative: data.narrative,
            narrativeConfidence: data.narrativeConfidence,
            keyInsights: data.keyInsights,
            narrativeGenerating: false,
            narrativeJobStatus: 'completed'
          });
        } else if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          // Mark as timeout
          setAnalysisResults(prev => ({
            ...prev,
            narrativeGenerating: false,
            narrativeJobStatus: 'timeout'
          }));
        }
      } catch (error) {
        console.error('❌ [NARRATIVE POLL] Error:', error);
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
        }
      }
    }, 1000); // Poll every second

    return () => clearInterval(pollInterval);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- poll keyed by narrative flags only; adding analysisResults/setAnalysisResults would restart poll on every update
  }, [analysisResults?.narrativeGenerating, analysisResults?.organizationId]);

  // Handle delayed reveal animation
  useEffect(() => {
    if (showInput && !inputVisible) {
      setInputVisible(true);
      // Start sparkle effect after input appears
      const sparkleTimeout = setTimeout(() => {
        setShowSparkle(true);
        // Remove sparkle after animation completes (3 cycles × 2s = 6s)
        const removeSparkleTimeout = setTimeout(() => {
          setShowSparkle(false);
        }, 6000);
        return () => clearTimeout(removeSparkleTimeout);
      }, 300);
      return () => clearTimeout(sparkleTimeout);
    }
  }, [showInput, inputVisible]);

  // Handle 0.5 second delay before hiding button/icon when loading starts
  useEffect(() => {
    if (loading && isEditing) {
      // Wait 0.5 seconds before hiding button/icon and centering text
      const timer = setTimeout(() => {
        setIsEditing(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [loading, isEditing]);

  // Notify parent when editing state changes (for header text fade)
  useEffect(() => {
    if (onEditingStateChange) {
      onEditingStateChange(isEditing);
    }
  }, [isEditing, onEditingStateChange]);

  // Listen for business profile event from narrative stream
  useEffect(() => {
    if (!analysisJobId) {
      setBusinessProfile(null);
      return;
    }

    const abortController = new AbortController();

    // Connect to narrative stream to listen for business-profile event
    jobsAPI
      .connectToNarrativeStream(
        analysisJobId,
        {
          onScrapingThought: () => {}, // Ignore these
          onTransition: () => {}, // Ignore these
          onAnalysisChunk: () => {}, // Ignore these
          onComplete: () => {}, // Ignore these
          onError: () => {}, // Ignore errors
          onBusinessProfile: (data) => {
            // Custom handler for business-profile event
            try {
              const profile = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
              console.log('📊 [FRONTEND] Business profile received:', profile);
              setBusinessProfile(profile);
            } catch (err) {
              console.error('❌ [FRONTEND] Failed to parse business profile:', err);
            }
          }
        },
        { signal: abortController.signal }
      )
      .catch((err) => {
        console.warn('Business profile stream connection failed:', err);
      });

    return () => {
      abortController.abort();
    };
  }, [analysisJobId]);

  // Remove sparkle on input focus or interaction, and restore editing mode
  const handleInputFocus = () => {
    // Restore button and icon when user clicks to edit URL
    setIsEditing(true);

    if (showSparkle) {
      setShowSparkle(false);
    }
  };
  
  // Load cached analysis for logged-in users when component mounts
  useEffect(() => {
    const loadCachedAnalysis = async () => {
      if (user && !analysisCompleted && !websiteUrl && !loading) {
        try {
          const response = await autoBlogAPI.getRecentAnalysis();
          
          if (response.success && response.analysis) {
            const cachedAnalysis = response.analysis;

            // Prevent flashing by loading all data simultaneously
            const updates = {};
            if (setWebsiteUrl) updates.websiteUrl = cachedAnalysis.websiteUrl;
            if (setAnalysisResults) updates.analysisResults = cachedAnalysis;
            if (setAnalysisCompleted) updates.analysisCompleted = true;
            
            // Apply all updates in a batch to prevent flashing
            setWebsiteUrl && setWebsiteUrl(cachedAnalysis.websiteUrl);
            setAnalysisResults && setAnalysisResults(cachedAnalysis);
            setAnalysisCompleted && setAnalysisCompleted(true);
            
            // Update sticky header with cached business information
            updateStickyWorkflowStep && updateStickyWorkflowStep('websiteAnalysis', {
              websiteUrl: cachedAnalysis.websiteUrl,
              businessName: cachedAnalysis.businessName || cachedAnalysis.name || '',
              businessType: cachedAnalysis.businessType || '',
              ...cachedAnalysis
            });
          }
        } catch (error) {
          // Silently fail - user can perform new analysis
          console.error('Failed to load cached analysis:', error);
        }
      }
    };
    
    loadCachedAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setters from props used inside
  }, [user, analysisCompleted, websiteUrl, loading]);

  // Fetch CTAs when organization ID is available in analysisResults
  useEffect(() => {
    const fetchCTAs = async () => {
      const orgId = analysisResults?.organizationId;
      if (!orgId) {
        setOrganizationCTAs([]);
        return;
      }

      setCtasLoading(true);
      try {
        const response = await autoBlogAPI.getOrganizationCTAs(orgId);
        setOrganizationCTAs(response.ctas || []);
      } catch (error) {
        console.error('Failed to fetch CTAs for analysis display:', error);
        setOrganizationCTAs([]);
      } finally {
        setCtasLoading(false);
      }
    };

    fetchCTAs();
  }, [analysisResults?.organizationId]);

  // Extract domain for display (reserved for future use)
  const _domain = websiteUrl ? 
    websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : 
    '';
  
  // Determine if input should be disabled
  // Disable when: 1) Analysis exists and not in edit mode, OR 2) Org website exists and not admin
  const isAdminUser = user?.role === 'admin' || user?.role === 'super_admin';
  const hasOrgWebsiteRestriction = !!(userOrganizationWebsite && !urlOverrideMode && !isAdminUser);
  const hasAnalysisRestriction = !!(analysisCompleted && analysisResults && !editMode);
  const shouldDisableInput = hasOrgWebsiteRestriction || hasAnalysisRestriction;
  
  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  
  /**
   * Handle website URL submission and analysis
   */
  const handleWebsiteSubmit = async () => {
    if (!websiteUrl?.trim()) {
      message.warning(systemVoice.analysis.enterUrl);
      return;
    }
    
    setLastAnalysisError(null);
    try {
      // Validate URL first
      const validation = workflowUtils.urlUtils.validateWebsiteUrl(websiteUrl);
      if (!validation.isValid) {
        message.error(validation.error);
        return false;
      }

      // Set loading state
      const updateLoading = setIsLoading || setLocalLoading;
      const updateScanningMessage = setScanningMessage || setLocalScanningMessage;

      updateLoading(true);

      // Track analysis started
      autoBlogAPI.trackLeadConversion('analysis_started', {
        website_url: validation.formattedUrl,
        timestamp: new Date().toISOString()
      }).catch(err => console.error('Failed to track analysis_started:', err));

      // Add to progressive sticky header immediately when analysis starts
      addStickyWorkflowStep && addStickyWorkflowStep('websiteAnalysis', {
        websiteUrl: validation.formattedUrl,
        businessName: '', // Will be updated after analysis completes
        businessType: '',
        timestamp: new Date().toISOString()
      });

      // Show step 1 message immediately; API will call onProgress(1–4) or job stream object (progress, currentStep, phase?, detail?)
      const steps = systemVoice.analysis.steps;
      updateScanningMessage(steps[0]);
      setAnalysisProgress(null);
      setAnalysisThoughts([]);

      const result = await analysisAPI.analyzeWebsite(validation.formattedUrl, {
        onJobCreated: (jobId) => setAnalysisJobId(jobId),
        onProgress: (stepOrStatus) => {
          if (typeof stepOrStatus === 'number') {
            if (stepOrStatus >= 1 && stepOrStatus <= steps.length) {
              const stepLabel = steps[stepOrStatus - 1];
              updateScanningMessage(stepLabel);
              setAnalysisProgress({ stepNumber: stepOrStatus, totalSteps: steps.length, progress: (stepOrStatus / steps.length) * 100, currentStep: stepLabel });
              setHint(stepLabel, 'hint', 0);
            } else if (stepOrStatus >= 0 && stepOrStatus <= 100) {
              setAnalysisProgress(prev => ({ ...prev, progress: stepOrStatus }));
            }
          } else if (typeof stepOrStatus === 'object' && stepOrStatus) {
            const stepLabel = stepOrStatus.currentStep || steps[0];
            const subLabel = stepOrStatus.phase || stepOrStatus.detail;
            const displayLabel = subLabel ? `${stepLabel} — ${subLabel}` : stepLabel;
            updateScanningMessage(displayLabel);
            setAnalysisProgress({
              progress: stepOrStatus.progress,
              currentStep: stepOrStatus.currentStep,
              phase: stepOrStatus.phase,
              detail: stepOrStatus.detail,
              estimatedTimeRemaining: stepOrStatus.estimatedTimeRemaining,
            });
            setHint(displayLabel, 'hint', 0);
          }
        },
        onScrapePhase: (data) => {
          if (data?.message) {
            setAnalysisThoughts(prev => [...prev, { phase: data.phase, message: data.message, url: data.url }]);
          }
        },
        onScrapeResult: (data) => {
          if (!data || !setAnalysisResults) return;
          setAnalysisResults({
            scrapePreview: {
              title: data.title,
              metaDescription: data.metaDescription,
              headings: data.headings || [],
              scrapedAt: data.scrapedAt
            }
          });
        },
        onAnalysisResult: (data) => {
          if (!data || !setAnalysisResults) return;
          const next = {
            ...(data.analysis || {}),
            metadata: data.metadata,
            ctas: data.ctas,
            ctaCount: data.ctaCount,
            hasSufficientCTAs: data.hasSufficientCTAs,
            organizationId: data.organizationId ?? data.analysis?.organizationId,
            url: data.url,
            scrapedAt: data.scrapedAt,
            scenarios: []
          };
          latestAnalysisRef.current = next;
          setAnalysisResults(next);
        },
        onAudienceComplete: (data) => {
          if (!data?.audience || !setAnalysisResults) return;
          const prev = latestAnalysisRef.current?.scenarios ?? [];
          const next = [...prev, data.audience];
          latestAnalysisRef.current = { ...latestAnalysisRef.current, scenarios: next };
          setAnalysisResults({ scenarios: next });
        },
        onAudiencesResult: (data) => {
          if (data?.scenarios && setAnalysisResults) {
            latestAnalysisRef.current = { ...latestAnalysisRef.current, scenarios: data.scenarios };
            setAnalysisResults({ scenarios: data.scenarios });
          }
        },
        onPitchComplete: (data) => {
          if (data?.scenario == null || !setAnalysisResults || typeof data.index !== 'number') return;
          const prev = latestAnalysisRef.current?.scenarios ?? [];
          const next = [...prev];
          if (data.index >= 0 && data.index < next.length) {
            next[data.index] = { ...next[data.index], ...data.scenario };
            latestAnalysisRef.current = { ...latestAnalysisRef.current, scenarios: next };
            setAnalysisResults({ scenarios: next });
          }
        },
        onPitchesResult: (data) => {
          if (data?.scenarios && setAnalysisResults) {
            latestAnalysisRef.current = { ...latestAnalysisRef.current, scenarios: data.scenarios };
            setAnalysisResults({ scenarios: data.scenarios });
          }
        },
        onScenarioImageComplete: (data) => {
          if (data?.scenario == null || !setAnalysisResults || typeof data.index !== 'number') return;
          const prev = latestAnalysisRef.current?.scenarios ?? [];
          const next = [...prev];
          if (data.index >= 0 && data.index < next.length) {
            next[data.index] = { ...next[data.index], ...data.scenario };
            latestAnalysisRef.current = { ...latestAnalysisRef.current, scenarios: next };
            setAnalysisResults({ scenarios: next });
          }
        },
        onScenariosResult: (data) => {
          if (data?.scenarios && setAnalysisResults) {
            latestAnalysisRef.current = { ...latestAnalysisRef.current, scenarios: data.scenarios };
            setAnalysisResults({ scenarios: data.scenarios });
          }
        }
      });

      if (result.success) {
        // Clear any existing cached analysis to prevent flashing
        autoBlogAPI.clearCachedAnalysis();

        // Update state with analysis results
        setAnalysisResults && setAnalysisResults(result.analysis);
        setWebSearchInsights && setWebSearchInsights(result.webSearchInsights);
        setAnalysisCompleted && setAnalysisCompleted(true);
        setWebsiteUrl && setWebsiteUrl(validation.formattedUrl);

        // Track analysis completed
        autoBlogAPI.trackLeadConversion('analysis_completed', {
          website_url: validation.formattedUrl,
          business_name: result.analysis?.businessName || result.analysis?.companyName,
          business_type: result.analysis?.businessType || result.analysis?.industry,
          timestamp: new Date().toISOString()
        }).catch(err => console.error('Failed to track analysis_completed:', err));

        // Track scrape_completed event
        autoBlogAPI.trackEvent({
          eventType: 'scrape_completed',
          eventData: {
            url: validation.formattedUrl,
            businessName: result.analysis?.businessName || result.analysis?.companyName,
            businessType: result.analysis?.businessType || result.analysis?.industry
          },
          userId: autoBlogAPI.getCurrentUserId(),
          pageUrl: window.location.href
        }).catch(err => console.error('Failed to track scrape_completed:', err));

        setLastAnalysisError(null);
        setHint(systemVoice.toasts.analysisComplete, 'success', 5000);
        message.success(systemVoice.analysis.success);

        // Update sticky header with business name after analysis completes
        updateStickyWorkflowStep && updateStickyWorkflowStep('websiteAnalysis', {
          websiteUrl: validation.formattedUrl,
          businessName: result.analysis?.businessName || result.analysis?.companyName || '',
          businessType: result.analysis?.businessType || result.analysis?.industry || '',
          ...result.analysis
        });

        // Notify parent component with CTAs included
        onAnalysisComplete && onAnalysisComplete({
          analysis: result.analysis,
          webSearchInsights: result.webSearchInsights,
          websiteUrl: validation.formattedUrl,
          ctas: result.ctas || [],
          ctaCount: result.ctaCount || 0,
          hasSufficientCTAs: result.hasSufficientCTAs || false
        });

        return true;
      } else {
        // API returned success: false — show informative empty state (Issue #185) instead of fallback
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Website analysis error:', error);
      setLastAnalysisError({ type: 'scraping_failed', message: error?.message || '' });
      setHint(systemVoice.toasts.analysisFailed, 'error', 8000);
      message.error(systemVoice.analysis.analysisFailed);
      
      // Track scrape_failed event
      autoBlogAPI.trackEvent({
        eventType: 'scrape_failed',
        eventData: {
          url: websiteUrl,
          error: error.message
        },
        userId: autoBlogAPI.getCurrentUserId(),
        pageUrl: window.location.href
      }).catch(err => console.error('Failed to track scrape_failed:', err));
      
      return false;
    } finally {
      const updateLoading = setIsLoading || setLocalLoading;
      updateLoading(false);
      setAnalysisProgress(null);
    }
  };
  
  /**
   * Handle starting over (reserved for future use)
   */
  const _handleStartOver = () => {
    setWebsiteUrl && setWebsiteUrl('');
    setAnalysisResults && setAnalysisResults(null);
    setAnalysisCompleted && setAnalysisCompleted(false);
    setWebSearchInsights && setWebSearchInsights({ researchQuality: 'basic' });
    setUrlOverrideMode(false);
    
    onStartOver && onStartOver();
  };
  
  /**
   * Handle URL override for organization users
   */
  const handleOverrideUrl = () => {
    setUrlOverrideMode(true);
    setWebsiteUrl && setWebsiteUrl('');
  };
  
  /**
   * Handle entering edit mode (reserved for future use)
   */
  const _handleEditMode = () => {
    if (!analysisResults) {
      console.error('No analysisResults available for editing');
      return;
    }

    const editData = {
      // Core business information - try multiple field names
      businessName: analysisResults.businessName || analysisResults.companyName || analysisResults.name || analysisResults.organizationName || '',
      businessType: analysisResults.businessType || analysisResults.industry || analysisResults.industryCategory || '',
      targetAudience: analysisResults.targetAudience || analysisResults.decisionMakers || '',
      brandVoice: analysisResults.brandVoice || '',
      contentFocus: analysisResults.contentFocus || '',
      description: analysisResults.description || '',
      
      // Extended business fields
      businessModel: analysisResults.businessModel || '',
      websiteGoals: analysisResults.websiteGoals || '',
      blogStrategy: analysisResults.blogStrategy || '',
      decisionMakers: analysisResults.decisionMakers || '',
      endUsers: analysisResults.endUsers || '',
      
      // Array fields (convert to strings for editing)
      keywords: Array.isArray(analysisResults.keywords) ? analysisResults.keywords.join(', ') : (analysisResults.keywords || ''),
      customerProblems: Array.isArray(analysisResults.customerProblems) ? analysisResults.customerProblems.join(', ') : (analysisResults.customerProblems || ''),
      customerLanguage: Array.isArray(analysisResults.customerLanguage) ? analysisResults.customerLanguage.join(', ') : (analysisResults.customerLanguage || ''),
      contentIdeas: Array.isArray(analysisResults.contentIdeas) ? analysisResults.contentIdeas.join(', ') : (analysisResults.contentIdeas || ''),
      
      // Additional fields
      searchBehavior: analysisResults.searchBehavior || '',
      connectionMessage: analysisResults.connectionMessage || ''
    };

    setEditableResults(editData);
    setEditMode(true);
  };
  
  /**
   * Handle saving edited values
   */
  const handleSaveEdit = async () => {
    if (!editableResults) return;
    
    try {
      // Show loading state
      setIsLoading && setIsLoading(true);
      
      // Convert string array fields back to arrays
      const processedResults = {
        ...editableResults,
        // Convert comma-separated strings back to arrays
        keywords: editableResults.keywords ? 
          editableResults.keywords.split(',').map(k => k.trim()).filter(k => k) : [],
        customerProblems: editableResults.customerProblems ? 
          editableResults.customerProblems.split(',').map(p => p.trim()).filter(p => p) : [],
        customerLanguage: editableResults.customerLanguage ? 
          editableResults.customerLanguage.split(',').map(l => l.trim()).filter(l => l) : [],
        contentIdeas: editableResults.contentIdeas ? 
          editableResults.contentIdeas.split(',').map(i => i.trim()).filter(i => i) : [],
        // Include website URL if it was edited
        websiteUrl: websiteUrl
      };

      // Call API to save changes
      const response = await autoBlogAPI.updateAnalysis(processedResults);
      
      if (response.success) {
        // Update analysis results with all edited values, preserving existing fields
        const updatedResults = {
          ...analysisResults,
          ...processedResults
        };
        
        // Update parent component state
        setAnalysisResults && setAnalysisResults(updatedResults);
        
        // Update sticky header with new data
        updateStickyWorkflowStep && updateStickyWorkflowStep('websiteAnalysis', {
          websiteUrl: websiteUrl,
          businessName: processedResults.businessName,
          businessType: processedResults.businessType,
          targetAudience: processedResults.targetAudience,
          contentFocus: processedResults.contentFocus,
          brandVoice: processedResults.brandVoice,
          description: processedResults.description,
          ...updatedResults
        });
        
        // Exit edit mode
        setEditMode(false);
        setEditableResults(null);
        
        // Show success message
        message.success(systemVoice.analysis.updated);
      } else {
        throw new Error(response.error || 'Failed to save analysis');
      }
      
    } catch (error) {
      console.error('❌ Error saving analysis:', error);
      message.error(systemVoice.analysis.saveFailed);
    } finally {
      setIsLoading && setIsLoading(false);
    }
  };
  
  /**
   * Handle canceling edit mode
   */
  const handleCancelEdit = () => {
    setEditMode(false);
    setEditableResults(null);
  };
  
  // =============================================================================
  // RENDER HELPERS
  // =============================================================================
  
  /**
   * Render URL input form
   */
  const renderUrlInput = () => (
    <div
      style={{
        transform: !isEditing ? 'translateY(-200px)' : 'translateY(0)',
        transition: 'all 1s ease'
      }}
    >
      <div
        style={{
          marginBottom: '30px',
          animation: delayedReveal && inputVisible ? 'fadeInInput 0.8s ease-out forwards' : 'none',
          opacity: delayedReveal && !inputVisible ? 0 : 1,
          position: 'relative'
        }}
      >
      {showTitle && (
        <Title level={3} style={{
          textAlign: 'center',
          marginBottom: '20px',
          fontSize: responsive.fontSize.title
        }}>
          <GlobalOutlined style={{ marginRight: '8px', color: 'var(--color-text-secondary)' }} />
          {systemVoice.header.step0Title}
        </Title>
      )}

      <Form onFinish={handleWebsiteSubmit} style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Space.Compact
          style={{
            width: '100%',
            position: 'relative',
            boxShadow: 'var(--shadow-focus)',
            borderRadius: '8px',
            transition: 'all 0.3s ease'
          }}
          size="large"
          className={showSparkle ? 'input-sparkle' : ''}
        >
          <Input
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl && setWebsiteUrl(e.target.value)}
            placeholder={systemVoice.analysis.inputPlaceholder}
            size="large"
            prefix={isEditing ? <GlobalOutlined style={{ color: 'var(--color-text-tertiary)' }} /> : null}
            disabled={shouldDisableInput || loading}
            onFocus={handleInputFocus}
            style={{
              borderRadius: isEditing ? '8px 0 0 8px' : '8px',
              borderRight: isEditing ? 'none' : undefined,
              fontSize: responsive.fontSize.text,
              backgroundColor: hasAnalysisRestriction ? 'var(--color-background-container)' : 'var(--color-background-elevated)',
              color: hasAnalysisRestriction ? 'var(--color-text-tertiary)' : undefined,
              textAlign: isEditing ? 'left' : 'center',
              transition: 'all 1s ease'
            }}
            onPressEnter={handleWebsiteSubmit}
          />
          <Button
            type="primary"
            size="large"
            onClick={handleWebsiteSubmit}
            loading={loading}
            disabled={!websiteUrl?.trim()}
            style={{
              borderRadius: '0 8px 8px 0',
              minWidth: isEditing ? '120px' : '0',
              maxWidth: isEditing ? '200px' : '0',
              fontSize: responsive.fontSize.text,
              opacity: isEditing ? 1 : 0,
              padding: isEditing ? undefined : '0',
              overflow: 'hidden',
              transition: 'all 1s ease',
              pointerEvents: isEditing ? 'auto' : 'none'
            }}
          >
            {loading ? systemVoice.analysis.analyzing : systemVoice.analysis.analyze}
          </Button>
        </Space.Compact>
      </Form>
      
      {/* Override option for admin users */}
      {userOrganizationWebsite && !urlOverrideMode && (
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Text style={{ color: 'var(--color-text-secondary)', fontSize: responsive.fontSize.small }}>
            Using organization website: <Text strong>{userOrganizationWebsite}</Text>
          </Text>
          {isAdminUser && (
            <Button 
              type="link" 
              size="small"
              onClick={handleOverrideUrl}
              style={{ marginLeft: '8px' }}
            >
              Use different URL
            </Button>
          )}
          {!isAdminUser && (
            <Text style={{ color: 'var(--color-text-tertiary)', fontSize: responsive.fontSize.small, marginLeft: '8px' }}>
              (Contact admin to change website URL)
            </Text>
          )}
        </div>
      )}
      </div>
    </div>
  );
  
  /**
   * Render fallback loading UX (ThinkingPanel) when narrative stream unavailable
   */
  const renderThinkingPanelFallback = () => (
    <Card style={{ marginBottom: '20px' }}>
      <div style={{ textAlign: 'center', padding: '24px 20px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Title level={4} style={{ color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            <ScanOutlined style={{ marginRight: '8px' }} />
            {systemVoice.analysis.loadingTitle}
          </Title>
          {!analysisProgress && (
            <Paragraph style={{ color: 'var(--color-text-secondary)', marginBottom: '12px', fontSize: responsive.fontSize.text }}>
              {systemVoice.analysis.defaultProgress}
            </Paragraph>
          )}
          {analysisResults?.scrapePreview?.title && (
            <Paragraph style={{ color: 'var(--color-text-secondary)', fontSize: responsive.fontSize.small, marginBottom: analysisProgress ? '12px' : '16px' }}>
              We found: <Text strong>{analysisResults.scrapePreview.title}</Text>
            </Paragraph>
          )}
        {analysisProgress && (
          <div style={{ margin: '0 auto 16px', maxWidth: '500px' }}>
            <ChecklistProgress
              steps={systemVoice.analysis.steps}
              currentStep={analysisProgress.currentStep || currentScanningMessage}
              phase={analysisProgress.phase}
              progress={analysisProgress.progress}
              estimatedTimeRemaining={analysisProgress.estimatedTimeRemaining}
              dataTestId="website-analysis-progress"
            />
          </div>
        )}
        </div>
        <div style={{ marginTop: '16px', textAlign: 'left', maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{ height: '12px', background: 'var(--color-gray-100)', borderRadius: '4px', marginBottom: '8px', width: '75%' }} />
          <div style={{ height: '12px', background: 'var(--color-gray-100)', borderRadius: '4px', width: '55%' }} />
        </div>
      </div>
    </Card>
  );

  /**
   * Persist streamed narrative into analysisResults when narrative stream completes, then clear jobId
   * so the results view (NarrativeAnalysisCard) shows the narrative instead of the streaming UI.
   */
  const handleNarrativeComplete = (analysisNarrative, _scrapingNarrative) => {
    if (analysisNarrative && setAnalysisResults) {
      setAnalysisResults({ narrative: analysisNarrative });
    }
    setAnalysisJobId(null);
    notifyTabReady();
  };

  /**
   * Render analysis loading state. Uses NarrativeAnalysisDisplay when jobId available (Issue #157);
   * falls back to ThinkingPanel when narrative stream unavailable. Display is shown whenever we have
   * analysisJobId (during and after loading) so streamed content does not disappear when the API returns.
   */
  const renderAnalysisLoading = () => {
    if (analysisJobId) {
      return (
        <>
          <NarrativeAnalysisDisplay
            jobId={analysisJobId}
            analysisResults={analysisResults}
            renderFallback={renderThinkingPanelFallback}
            onNarrativeComplete={handleNarrativeComplete}
            analysisProgress={analysisProgress}
            loading={loading}
            currentScanningMessage={currentScanningMessage}
            analysisThoughts={analysisThoughts}
          />
          {businessProfile && (
            <div style={{ marginTop: '32px' }}>
              <BusinessProfileSlide profileData={businessProfile} />
            </div>
          )}
        </>
      );
    }
    return renderThinkingPanelFallback();
  };
  
  /**
   * Render analysis results - Enhanced version matching WebsiteAnalysisStep-v2
   */
  const renderAnalysisResults = () => {
    if (!analysisResults) return null;

    const analysis = analysisResults;

    // Extract domain for display
    const domain = websiteUrl ?
      websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] :
      '';

    // Show narrative as primary display if available (hide when streaming UI is still showing same narrative)
    const hasNarrative = analysis.narrative && analysis.narrative.trim().length > 0 && !analysisJobId;

    // Helper function to get status message
    const getStatusMessage = (status, attempts) => {
      switch (status) {
        case 'pending':
          return {
            message: 'Your analysis is queued for processing...',
            icon: '⏳',
            color: 'var(--color-primary)'
          };
        case 'processing':
          return {
            message: `Generating your narrative analysis${attempts > 1 ? ` (attempt ${attempts})` : ''}...`,
            icon: '🤖',
            color: 'var(--color-success)'
          };
        case 'completed':
          return {
            message: 'Analysis complete!',
            icon: '✅',
            color: 'var(--color-success)'
          };
        case 'failed':
          return {
            message: 'Analysis generation failed. Please try again.',
            icon: '❌',
            color: 'var(--color-error)'
          };
        case 'timeout':
          return {
            message: 'Analysis is taking longer than expected. Please refresh to check status.',
            icon: '⏱️',
            color: 'var(--color-accent)'
          };
        default:
          return {
            message: 'Processing...',
            icon: '⏳',
            color: 'var(--color-primary)'
          };
      }
    };

    // Build granular nav sections for smooth scrolling (Issue #168); include all sections so empty states are reachable (Issue #185)
    const navSections = [];
    if (hasNarrative) navSections.push({ id: 'analysis-narrative', label: 'Narrative' });
    navSections.push({ id: 'analysis-what-they-do', label: 'What They Do' });
    navSections.push({ id: 'analysis-target-audience', label: 'Target Audience' });
    navSections.push({ id: 'analysis-brand-voice', label: 'Brand Voice' });
    navSections.push({ id: 'analysis-content-focus', label: 'Content Focus' });
    navSections.push({ id: 'analysis-ctas', label: 'Calls-to-Action' });
    navSections.push({ id: 'analysis-business-model', label: 'Business Model' });
    navSections.push({ id: 'analysis-website-goals', label: 'Website Goals' });
    navSections.push({ id: 'analysis-blog-strategy', label: 'Blog Strategy' });
    navSections.push({ id: 'analysis-keywords', label: 'Key Topics & Keywords' });

    const content = (
      <>
        {/* Narrative Job Status Indicator */}
        {analysis.narrativeGenerating && analysis.narrativeJobStatus && (
          <Card style={{ marginBottom: 16 }}>
            <Row align="middle" gutter={12}>
              <Col>
                <span style={{ fontSize: 24 }}>
                  {getStatusMessage(analysis.narrativeJobStatus, analysis.narrativeJobAttempts).icon}
                </span>
              </Col>
              <Col flex={1}>
                <Text style={{
                  color: getStatusMessage(analysis.narrativeJobStatus, analysis.narrativeJobAttempts).color,
                  fontWeight: 500
                }}>
                  {getStatusMessage(analysis.narrativeJobStatus, analysis.narrativeJobAttempts).message}
                </Text>
              </Col>
              {analysis.narrativeJobStatus === 'processing' && (
                <Col>
                  <Spin size="small" />
                </Col>
              )}
            </Row>
          </Card>
        )}

        {/* Narrative Analysis Card - Primary Display */}
        {hasNarrative && (
          <div id="analysis-narrative" style={{ scrollMarginTop: 100 }}>
            <NarrativeAnalysisCard
              narrative={analysis.narrative}
              confidence={analysis.narrativeConfidence}
              keyInsights={analysis.keyInsights}
            />
          </div>
        )}

        {/* Structured Data - Always show, but can be collapsed if narrative exists */}
        {hasNarrative ? (
          <Collapse
            ghost
            activeKey={technicalDetailsExpanded ? ['1'] : []}
            onChange={(keys) => setTechnicalDetailsExpanded(keys.includes('1'))}
            style={{ marginBottom: '20px' }}
            items={[
              {
                key: '1',
                label: (
                  <Text style={{
                    fontSize: responsive.fontSize.text,
                    color: 'var(--color-text-secondary)'
                  }}>
                    📋 Technical Details
                  </Text>
                ),
                children: renderStructuredAnalysis(analysis, domain)
              }
            ]}
          />
        ) : (
          renderStructuredAnalysis(analysis, domain)
        )}
      </>
    );

    const handleNavSectionClick = (sectionId) => {
      if (sectionId !== 'analysis-narrative') setTechnicalDetailsExpanded(true);
    };

    return navSections.length >= 2 ? (
      <Row gutter={[24, 0]} style={{ alignItems: 'flex-start' }}>
        <Col xs={0} md={6} style={{ position: 'sticky', top: 88, alignSelf: 'flex-start' }} data-testid="analysis-section-nav-sidebar">
          <AnalysisSectionNav sections={navSections} onSectionClick={handleNavSectionClick} />
        </Col>
        <Col xs={24} md={18}>{content}</Col>
      </Row>
    ) : content;
  };

  /**
   * Render structured analysis data (field-by-field).
   * Only show per-section "failed" empty states after loading/streaming has finished (Issue: empty states showing too early).
   */
  const renderStructuredAnalysis = (analysis, domain) => {
    const showSectionEmptyStates = !loading;
    return (
      <Card
        className={showSuccessHighlight ? 'success-highlight' : ''}
        style={{
          border: '1px solid var(--color-border-base)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-background-body)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '20px'
        }}
      >
        {/* Company Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ flex: 1, marginRight: '16px' }}>
            {editMode ? (
              <div>
                <Input
                  value={editableResults?.businessName || ''}
                  onChange={(e) => setEditableResults({ ...editableResults, businessName: e.target.value })}
                  placeholder="Business Name"
                  style={{ 
                    fontSize: responsive.fontSize.title,
                    fontWeight: 600,
                    marginBottom: '8px',
                    border: 'none',
                    boxShadow: 'none',
                    padding: '0',
                    background: 'transparent'
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Text style={{ fontSize: responsive.fontSize.text, color: 'var(--color-text-secondary)' }}>
                    {domain} •
                  </Text>
                  <Input
                    value={editableResults?.businessType || ''}
                    onChange={(e) => setEditableResults({ ...editableResults, businessType: e.target.value })}
                    placeholder="Business Type"
                    style={{ 
                      fontSize: responsive.fontSize.text,
                      color: 'var(--color-text-secondary)',
                      border: 'none',
                      boxShadow: 'none',
                      padding: '0',
                      background: 'transparent',
                      width: '200px'
                    }}
                  />
                </div>
              </div>
            ) : (
              <div>
                <Title
                  level={3}
                  style={{
                    margin: 0,
                    color: 'var(--color-text-primary)',
                    fontSize: responsive.fontSize.title,
                    fontWeight: 600,
                    marginBottom: '4px'
                  }}
                >
                  {analysis.businessName || 'Business Profile'}
                </Title>
                <Text style={{ fontSize: responsive.fontSize.text, color: 'var(--color-text-secondary)' }}>
                  {domain} • {analysis.businessType}
                </Text>
              </div>
            )}
          </div>
          {editMode && (
            <Space>
              <Button 
                type="primary"
                size="small"
                onClick={handleSaveEdit}
              >
                Save
              </Button>
              <Button 
                size="small"
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
            </Space>
          )}
        </div>

        {/* Web Search Research Quality Indicator */}
        {webSearchInsights?.researchQuality === 'basic' && (
          <div style={{
            padding: '16px',
            backgroundColor: 'var(--color-background-container)',
            border: '1px solid var(--color-border-base)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '20px'
          }}>
            <Text strong style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
              📊 Standard Analysis
            </Text>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Analysis based on website content. Upgrade for enhanced research with brand guidelines, competitor analysis, and real-time keyword data.
            </div>
          </div>
        )}


        {/* Business Overview Cards — show section with data or informative empty state (Issue #185) */}
        <Row gutter={responsive.gutter}>
          <Col xs={24} md={12}>
            <div id="analysis-what-they-do" style={{ scrollMarginTop: 100, padding: '16px', backgroundColor: 'var(--color-background-container)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-base)', height: '100%' }}>
              <Text strong style={{
                color: 'var(--color-text-primary)',
                fontSize: responsive.fontSize.text,
                marginBottom: '8px',
                display: 'block'
              }}>
                What They Do
              </Text>
              {editMode ? (
                <Input.TextArea
                  value={editableResults?.description || ''}
                  onChange={(e) => setEditableResults({ ...editableResults, description: e.target.value })}
                  rows={3}
                  placeholder="Describe what the business does..."
                  style={{ fontSize: responsive.fontSize.small, resize: 'none' }}
                />
              ) : (analysis.description && String(analysis.description).trim()) ? (
                <Text style={{ fontSize: responsive.fontSize.small, lineHeight: '1.5' }}>
                  {analysis.description}
                </Text>
              ) : showSectionEmptyStates ? (
                <AnalysisEmptyState
                  type="website_content_failed"
                  compact
                  dataTestId="empty-what-they-do"
                  actions={[{ label: systemVoice.analysis.emptyStates.website_content_failed.primaryAction, onClick: () => setEditMode(true), primary: true }]}
                />
              ) : (
                <Spin size="small" />
              )}
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div id="analysis-target-audience" style={{ scrollMarginTop: 100, padding: '16px', backgroundColor: 'var(--color-background-container)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-base)', height: '100%' }}>
              <Text strong style={{
                color: 'var(--color-text-primary)',
                fontSize: responsive.fontSize.text,
                marginBottom: '8px',
                display: 'block'
              }}>
                Target Audience
              </Text>
              {editMode ? (
                <Input
                  value={editableResults?.targetAudience || ''}
                  onChange={(e) => setEditableResults({ ...editableResults, targetAudience: e.target.value })}
                  placeholder="Who is your target audience?"
                  style={{ fontSize: responsive.fontSize.small }}
                />
              ) : (analysis.decisionMakers && String(analysis.decisionMakers).trim()) || (analysis.targetAudience && String(analysis.targetAudience).trim()) ? (
                <Text style={{ fontSize: responsive.fontSize.small, lineHeight: '1.5' }}>
                  {analysis.decisionMakers || analysis.targetAudience}
                </Text>
              ) : showSectionEmptyStates ? (
                <AnalysisEmptyState
                  type="target_audience_failed"
                  compact
                  dataTestId="empty-target-audience"
                  actions={[{ label: systemVoice.analysis.emptyStates.target_audience_failed.primaryAction, onClick: () => setEditMode(true), primary: true }]}
                />
              ) : (
                <Spin size="small" />
              )}
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div id="analysis-brand-voice" style={{ scrollMarginTop: 100, padding: '16px', backgroundColor: 'var(--color-background-container)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-base)', height: '100%' }}>
              <Text strong style={{
                color: 'var(--color-text-primary)',
                fontSize: responsive.fontSize.text,
                marginBottom: '8px',
                display: 'block'
              }}>
                Brand Voice
              </Text>
              {editMode ? (
                <Input
                  value={editableResults?.brandVoice || ''}
                  onChange={(e) => setEditableResults({ ...editableResults, brandVoice: e.target.value })}
                  placeholder="What's your brand voice?"
                  style={{ fontSize: responsive.fontSize.small }}
                />
              ) : (analysis.brandVoice && String(analysis.brandVoice).trim()) ? (
                <Text style={{ fontSize: responsive.fontSize.small, lineHeight: '1.5' }}>
                  {analysis.brandVoice}
                </Text>
              ) : showSectionEmptyStates ? (
                <AnalysisEmptyState
                  type="brand_analysis_failed"
                  compact
                  dataTestId="empty-brand-voice"
                  actions={[{ label: systemVoice.analysis.emptyStates.brand_analysis_failed.primaryAction, onClick: () => setEditMode(true), primary: true }]}
                />
              ) : (
                <Spin size="small" />
              )}
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div id="analysis-content-focus" style={{ scrollMarginTop: 100, padding: '16px', backgroundColor: 'var(--color-background-container)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-base)', height: '100%' }}>
              <Text strong style={{
                color: 'var(--color-text-primary)',
                fontSize: responsive.fontSize.text,
                marginBottom: '8px',
                display: 'block'
              }}>
                Content Focus
              </Text>
              {editMode ? (
                <Input
                  value={editableResults?.contentFocus || ''}
                  onChange={(e) => setEditableResults({ ...editableResults, contentFocus: e.target.value })}
                  placeholder="What type of content do you focus on?"
                  style={{ fontSize: responsive.fontSize.small }}
                />
              ) : (analysis.contentFocus && String(analysis.contentFocus).trim()) ? (
                <Text style={{ fontSize: responsive.fontSize.small, lineHeight: '1.5' }}>
                  {analysis.contentFocus}
                </Text>
              ) : showSectionEmptyStates ? (
                <AnalysisEmptyState
                  type="content_focus_failed"
                  compact
                  dataTestId="empty-content-focus"
                  actions={[{ label: systemVoice.analysis.emptyStates.content_focus_failed.primaryAction, onClick: () => setEditMode(true), primary: true }]}
                />
              ) : (
                <Spin size="small" />
              )}
            </div>
          </Col>
        </Row>

        {/* CTAs Section - show when CTAs found or informative empty state (Issue #185) */}
        <Row gutter={responsive.gutter} style={{ marginTop: '16px' }}>
          <Col xs={24}>
            <div id="analysis-ctas" style={{ scrollMarginTop: 100, padding: '16px', backgroundColor: 'var(--color-background-container)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-base)' }}>
              <Text strong style={{
                color: 'var(--color-text-primary)',
                fontSize: responsive.fontSize.text,
                marginBottom: '12px',
                display: 'block'
              }}>
                {organizationCTAs.length > 0 ? '🚀 Calls-to-Action Found' : 'Calls-to-Action'}
              </Text>
              {ctasLoading ? (
                <Spin size="small" />
              ) : organizationCTAs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {organizationCTAs.slice(0, 5).map((cta, index) => (
                      <div key={cta.id || index} style={{
                        padding: '12px',
                        backgroundColor: 'var(--color-background-body)',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border-light)'
                      }}>
                        {/* Prominent CTA text */}
                        <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '6px' }}>
                          {cta.text}
                        </Text>

                        {/* Link display with icon */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <LinkOutlined style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }} />
                          <a
                            href={cta.href.startsWith('http') ? cta.href : `https://${cta.href}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '14px', color: 'var(--color-primary)', wordBreak: 'break-all' }}
                          >
                            {cta.href.length > 50 ? cta.href.substring(0, 50) + '...' : cta.href}
                          </a>
                        </div>
                      </div>
                    ))}
                    {organizationCTAs.length > 5 && (
                      <Text style={{ fontSize: responsive.fontSize.small, color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                        ...and {organizationCTAs.length - 5} more CTAs
                      </Text>
                    )}
                  </div>
              ) : showSectionEmptyStates ? (
                <AnalysisEmptyState
                  type="ctas_not_found"
                  compact
                  dataTestId="empty-ctas"
                  actions={[{ label: systemVoice.analysis.emptyStates.ctas_not_found.primaryAction, onClick: () => {}, primary: true }]}
                />
              ) : (
                <Spin size="small" />
              )}
            </div>
          </Col>
        </Row>

        {/* Business Strategy - show sections with data or informative empty state (Issue #185) */}
        <Row gutter={responsive.gutter} style={{ marginTop: '16px' }}>
          <Col xs={24} lg={8}>
            <div id="analysis-business-model" style={{ scrollMarginTop: 100, padding: '16px', backgroundColor: 'var(--color-background-container)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-base)', height: '100%' }}>
              <Text strong style={{
                color: 'var(--color-text-primary)',
                fontSize: responsive.fontSize.text,
                marginBottom: '8px',
                display: 'block'
              }}>
                Business Model
              </Text>
              {editMode ? (
                <Input.TextArea
                  value={editableResults?.businessModel || ''}
                  onChange={(e) => setEditableResults({ ...editableResults, businessModel: e.target.value })}
                  rows={3}
                  placeholder="Describe the business model..."
                  style={{ fontSize: responsive.fontSize.small, resize: 'none' }}
                />
              ) : (analysis.businessModel && String(analysis.businessModel).trim()) ? (
                <Text style={{ fontSize: responsive.fontSize.small, lineHeight: '1.5' }}>
                  {analysis.businessModel}
                </Text>
              ) : showSectionEmptyStates ? (
                <AnalysisEmptyState
                  type="business_model_failed"
                  compact
                  dataTestId="empty-business-model"
                  actions={[{ label: systemVoice.analysis.emptyStates.business_model_failed.primaryAction, onClick: () => setEditMode(true), primary: true }]}
                />
              ) : (
                <Spin size="small" />
              )}
            </div>
          </Col>
          <Col xs={24} lg={8}>
            <div id="analysis-website-goals" style={{ scrollMarginTop: 100, padding: '16px', backgroundColor: 'var(--color-background-container)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-base)', height: '100%' }}>
              <Text strong style={{
                color: 'var(--color-text-primary)',
                fontSize: responsive.fontSize.text,
                marginBottom: '8px',
                display: 'block'
              }}>
                Website Goals
              </Text>
              {editMode ? (
                <Input.TextArea
                  value={editableResults?.websiteGoals || ''}
                  onChange={(e) => setEditableResults({ ...editableResults, websiteGoals: e.target.value })}
                  rows={3}
                  placeholder="What are the website goals?"
                  style={{ fontSize: responsive.fontSize.small, resize: 'none' }}
                />
              ) : (analysis.websiteGoals && String(analysis.websiteGoals).trim()) ? (
                <Text style={{ fontSize: responsive.fontSize.small, lineHeight: '1.5' }}>
                  {analysis.websiteGoals}
                </Text>
              ) : showSectionEmptyStates ? (
                <AnalysisEmptyState
                  type="website_goals_failed"
                  compact
                  dataTestId="empty-website-goals"
                  actions={[{ label: systemVoice.analysis.emptyStates.website_goals_failed.primaryAction, onClick: () => setEditMode(true), primary: true }]}
                />
              ) : (
                <Spin size="small" />
              )}
            </div>
          </Col>
          <Col xs={24} lg={8}>
            <div id="analysis-blog-strategy" style={{ scrollMarginTop: 100, padding: '16px', backgroundColor: 'var(--color-background-container)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-base)', height: '100%' }}>
              <Text strong style={{
                color: 'var(--color-text-primary)',
                fontSize: responsive.fontSize.text,
                marginBottom: '8px',
                display: 'block'
              }}>
                Blog Strategy
              </Text>
              {editMode ? (
                <Input.TextArea
                  value={editableResults?.blogStrategy || ''}
                  onChange={(e) => setEditableResults({ ...editableResults, blogStrategy: e.target.value })}
                  rows={3}
                  placeholder="Describe the blog strategy..."
                  style={{ fontSize: responsive.fontSize.small, resize: 'none' }}
                />
              ) : (analysis.blogStrategy && String(analysis.blogStrategy).trim()) ? (
                <Text style={{ fontSize: responsive.fontSize.small, lineHeight: '1.5' }}>
                  {analysis.blogStrategy}
                </Text>
              ) : showSectionEmptyStates ? (
                <AnalysisEmptyState
                  type="blog_strategy_failed"
                  compact
                  dataTestId="empty-blog-strategy"
                  actions={[{ label: systemVoice.analysis.emptyStates.blog_strategy_failed.primaryAction, onClick: () => setEditMode(true), primary: true }]}
                />
              ) : (
                <Spin size="small" />
              )}
            </div>
          </Col>
        </Row>

        {/* Keywords - show section with data or informative empty state (Issue #185) */}
        <div id="analysis-keywords" style={{ scrollMarginTop: 100, marginTop: '20px', padding: '16px', backgroundColor: 'var(--color-background-container)', borderRadius: '8px' }}>
          <Text strong style={{
            color: 'var(--color-text-primary)',
            fontSize: responsive.fontSize.text,
            marginBottom: '12px',
            display: 'block'
          }}>
            Key Topics & Keywords
          </Text>
          {editMode ? (
            <Input.TextArea
              value={editableResults?.keywords || ''}
              onChange={(e) => setEditableResults({ ...editableResults, keywords: e.target.value })}
              rows={2}
              placeholder="Enter keywords separated by commas (e.g., topic 1, topic 2, topic 3)"
              style={{ fontSize: responsive.fontSize.small, resize: 'none' }}
            />
          ) : (analysis.keywords && analysis.keywords.length > 0) ? (
            <Space wrap>
              {analysis.keywords.map((keyword, index) => (
                <Tag
                  key={index}
                  style={{
                    borderRadius: 'var(--radius-xl)',
                    fontSize: responsive.fontSize.small,
                    padding: '4px 8px'
                  }}
                >
                  {keyword}
                </Tag>
              ))}
            </Space>
          ) : showSectionEmptyStates ? (
            <AnalysisEmptyState
              type="keywords_failed"
              compact
              dataTestId="empty-keywords"
              actions={[{ label: systemVoice.analysis.emptyStates.keywords_failed.primaryAction, onClick: () => {}, primary: true }]}
            />
          ) : (
            <Spin size="small" />
          )}
        </div>

      </Card>
    );
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================
  
  return (
    <div className={className} style={{ width: '100%' }}>
      <Card style={{ ...cardStyle }}>
        {/* Always show URL input - greyed out when analysis exists and not in edit mode */}
        {renderUrlInput()}

        {/* Informative empty state when analysis failed (Issue #185) */}
        {lastAnalysisError && !loading && (
          <AnalysisEmptyState
            type={lastAnalysisError.type}
            dataTestId="analysis-failed-empty-state"
            actions={[
              { label: systemVoice.analysis.emptyStates.scraping_failed.primaryAction, onClick: () => { setLastAnalysisError(null); handleWebsiteSubmit(); }, primary: true },
              { label: systemVoice.analysis.emptyStates.scraping_failed.secondaryAction, onClick: () => { setLastAnalysisError(null); setWebsiteUrl && setWebsiteUrl(''); }, primary: false },
            ]}
          />
        )}

        {/* Show streaming UI when we have a narrative job (during and after API loading so streamed content persists) */}
        {(loading || analysisJobId) && renderAnalysisLoading()}

        {/* Show analysis results only after user has run analysis (loading or completed), not initial placeholder state */}
        {(analysisCompleted || loading) && analysisResults && renderAnalysisResults()}
      </Card>
    </div>
  );
};

export default WebsiteAnalysisStepStandalone;