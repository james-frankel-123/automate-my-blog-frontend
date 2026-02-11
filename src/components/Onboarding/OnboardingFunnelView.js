/**
 * OnboardingFunnelView — guided sequential funnel: website → analysis → audience → topic → signup (optional) → content.
 * Issue #261.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Typography, message, Empty, Spin, Button, Skeleton, Row, Col } from 'antd';
import { motion } from 'framer-motion';
import { useWorkflowMode } from '../../contexts/WorkflowModeContext';
import { analysisAPI, topicAPI } from '../../services/workflowAPI';
import autoBlogAPI from '../../services/api';
import workflowUtils from '../../utils/workflowUtils';
import { systemVoice } from '../../copy/systemVoice';
import UnifiedWorkflowHeader from '../Dashboard/UnifiedWorkflowHeader';
import WebsiteInputSection from './WebsiteInputSection';
import StreamingNarration from './StreamingNarration';
import CardCarousel from './CardCarousel';
import AnalysisCard from './AnalysisCard';
import AudienceCard from './AudienceCard';
import TopicCard from './TopicCard';
import SignupGateCard from './SignupGateCard';
import EditConfirmActions from './EditConfirmActions';
import AnalysisEditSection from './AnalysisEditSection';
import DashboardLayout from '../Dashboard/DashboardLayout';
import LoggedOutProgressHeader from '../Dashboard/LoggedOutProgressHeader';
import AuthModal from '../Auth/AuthModal';
import BusinessProfileSlide from '../Analysis/BusinessProfileSlide';

const { Title } = Typography;

const sectionTransition = { duration: 0.35, ease: [0.4, 0, 0.2, 1] };
const sectionInitial = { opacity: 0, y: 16 };
const sectionAnimate = { opacity: 1, y: 0 };
const cardStaggerMs = 80;
const cardTransition = (i) => ({ delay: i * (cardStaggerMs / 1000), duration: 0.28, ease: [0.4, 0, 0.2, 1] });
const cardInitial = { opacity: 0, y: 10 };
const cardAnimate = { opacity: 1, y: 0 };

/** Coerce a value to a string safe for narration API params / display (never "[object Object]"). */
function toNarrationParamString(val) {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    const s = val.title ?? val.topic ?? val.name ?? val.targetSegment ?? val.subheader ?? '';
    return typeof s === 'string' ? s : (s && typeof s === 'object' ? '' : String(s));
  }
  return String(val);
}

const DEFAULT_UNLOCKED = {
  analysisNarration: false,
  analysisOutput: false,
  audienceNarration: false,
  audienceOutput: false,
  topicNarration: false,
  topicOutput: false,
  signupGate: false,
  contentNarration: false,
};

function OnboardingFunnelView() {
  const {
    user,
    websiteUrl,
    setWebsiteUrl,
    stepResults,
    updateWebsiteAnalysis,
    updateAnalysisCompleted,
    updateCTAData,
    updateWebSearchInsights,
    webSearchInsights,
    setStepResults,
    addStickyWorkflowStep,
    updateStickyWorkflowStep,
    navigateToTab,
    saveWorkflowState,
    showAuthModal,
    setShowAuthModal,
    authContext,
    setAuthContext,
  } = useWorkflowMode();

  const [loading, setLoading] = useState(false);
  const [scanningMessage, setScanningMessage] = useState('');
  const [analysisProgress, setAnalysisProgress] = useState(null);
  const [analysisThoughts, setAnalysisThoughts] = useState([]);
  const [unlocked, setUnlocked] = useState(DEFAULT_UNLOCKED);
  const [selectedAudienceIndex, setSelectedAudienceIndex] = useState(null);
  const [selectedTopicIndex, setSelectedTopicIndex] = useState(null);
  const [analysisConfirmed, setAnalysisConfirmed] = useState(false);
  const [funnelComplete, setFunnelComplete] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [originalAnalysisSnapshot, setOriginalAnalysisSnapshot] = useState(null);
  const [fetchedTopicItems, setFetchedTopicItems] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [audiencePlaceholderVisible, setAudiencePlaceholderVisible] = useState(false);
  const [analysisNarrationContent, setAnalysisNarrationContent] = useState('');
  const [analysisNarrationStreaming, setAnalysisNarrationStreaming] = useState(false);
  const [analysisNarrationComplete, setAnalysisNarrationComplete] = useState(false);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [editedBusinessProfile, setEditedBusinessProfile] = useState(null);
  const [audienceNarrationContent, setAudienceNarrationContent] = useState('');
  const [audienceNarrationStreaming, setAudienceNarrationStreaming] = useState(false);
  const [topicNarrationContent, setTopicNarrationContent] = useState('');
  const [topicNarrationStreaming, setTopicNarrationStreaming] = useState(false);
  const [contentNarrationContent, setContentNarrationContent] = useState('');
  const [contentNarrationStreaming, setContentNarrationStreaming] = useState(false);
  const [headerAnimationComplete, setHeaderAnimationComplete] = useState(false);
  const [holdTightNarrationComplete, setHoldTightNarrationComplete] = useState(false);
  const [audienceNarrationComplete, setAudienceNarrationComplete] = useState(false);
  const [topicNarrationComplete, setTopicNarrationComplete] = useState(false);
  const sectionRefs = useRef({});
  const analysisNarrationStreamStartedRef = useRef(false);
  const audienceNarrationStreamStartedRef = useRef(false);
  const topicNarrationStreamStartedRef = useRef(false);
  const contentNarrationStreamStartedRef = useRef(false);
  const lastProgressAtRef = useRef(0);
  const reassuranceStepRef = useRef(0);
  const analysisInProgressRef = useRef(false);

  const analysis = stepResults?.home?.websiteAnalysis || {};
  const scenarios = analysis.scenarios || [];
  const contentIdeas = analysis.contentIdeas || [];
  const hasAnalysis = stepResults?.home?.analysisCompleted && analysis?.businessName;

  // When backend doesn't return audience scenarios, show one segment derived from analysis so the funnel can continue
  const fallbackScenarios = scenarios.length === 0 && (analysis.targetAudience || analysis.businessName)
    ? [
        {
          id: 'fallback-primary',
          targetSegment: analysis.targetAudience || analysis.businessName || 'Primary audience',
          customerProblem: 'Looking for solutions that match their goals',
          pitch: analysis.contentFocus || 'Content that resonates with this audience',
        },
      ]
    : [];
  const displayScenarios = scenarios.length > 0 ? scenarios : fallbackScenarios;

  // Log audience scenarios data
  useEffect(() => {
    if (scenarios.length > 0) {
      console.log(`🕐 [OnboardingFunnelView] Found ${scenarios.length} audience scenarios from backend:`, scenarios);
      console.log('🕐 [OnboardingFunnelView] displayScenarios:', displayScenarios);
    } else if (fallbackScenarios.length > 0) {
      console.log('🕐 [OnboardingFunnelView] Using fallback scenario:', fallbackScenarios);
    }
  }, [scenarios.length, fallbackScenarios.length]);

  const scrollTo = (key) => {
    const el = sectionRefs.current[key];
    if (!el) return;

    // Calculate target position with offset from top
    const elementRect = el.getBoundingClientRect();
    const absoluteElementTop = elementRect.top + window.pageYOffset;
    const offsetTop = 100; // 100px from top of viewport
    const targetScrollPosition = absoluteElementTop - offsetTop;

    window.scrollTo({
      top: targetScrollPosition,
      behavior: 'smooth'
    });
  };

  const prevUnlocked = useRef({ ...DEFAULT_UNLOCKED });

  // Log when analysisNarrationComplete changes
  useEffect(() => {
    if (analysisNarrationComplete) {
      console.log('🕐 [OnboardingFunnelView] analysisNarrationComplete = true - PowerPoint slide can now render');
    }
  }, [analysisNarrationComplete]);

  // Log when businessProfile loads
  useEffect(() => {
    if (businessProfile) {
      console.log('🕐 [OnboardingFunnelView] businessProfile loaded - Edit/Confirm buttons can now render');
    }
  }, [businessProfile]);

  // Log when analysis completes
  useEffect(() => {
    if (!loading && hasAnalysis) {
      console.log('🕐 [OnboardingFunnelView] Analysis completed - checklist will stay visible');
    }
  }, [loading, hasAnalysis]);

  // Log when analysisNarration unlocks
  useEffect(() => {
    if (unlocked.analysisNarration) {
      console.log('🕐 [OnboardingFunnelView] analysisNarration unlocked - narration section will render');
    }
  }, [unlocked.analysisNarration]);
  useEffect(() => {
    const keys = ['analysisNarration', 'analysisOutput', 'audienceNarration', 'audienceOutput', 'topicNarration', 'topicOutput', 'signupGate', 'contentNarration'];
    keys.forEach((key) => {
      if (unlocked[key] && !prevUnlocked.current[key]) {
        setTimeout(() => scrollTo(key), 150);
      }
    });
    prevUnlocked.current = { ...unlocked };
  }, [unlocked]);

  // Show audience placeholders briefly when section first appears, then reveal carousel
  useEffect(() => {
    if (!unlocked.audienceOutput) return;
    setAudiencePlaceholderVisible(true);
    const t = setTimeout(() => setAudiencePlaceholderVisible(false), 1800);
    return () => clearTimeout(t);
  }, [unlocked.audienceOutput]);

  // When analysis starts loading, scroll to "What I found" placeholders so they're visible
  const prevLoading = useRef(false);
  useEffect(() => {
    if (loading && !prevLoading.current) {
      setTimeout(() => scrollTo('analysisOutput'), 400);
      lastProgressAtRef.current = Date.now();
      reassuranceStepRef.current = 0;
    }
    prevLoading.current = loading;
  }, [loading]);

  // Reassurance rotation: if no progress update for a while, cycle through step messages so the user sees movement
  useEffect(() => {
    if (!loading) return;
    const steps = systemVoice.analysis?.progress || systemVoice.analysis?.steps || ['Reading your pages…', 'Understanding who you\'re for…', 'Almost there…'];
    if (steps.length === 0) return;
    const intervalMs = 10000;
    const stallThresholdMs = 8000;
    const tid = setInterval(() => {
      const elapsed = Date.now() - lastProgressAtRef.current;
      if (elapsed >= stallThresholdMs) {
        reassuranceStepRef.current = (reassuranceStepRef.current + 1) % steps.length;
        setScanningMessage(steps[reassuranceStepRef.current]);
      }
    }, intervalMs);
    return () => clearInterval(tid);
  }, [loading]);

  useEffect(() => {
    if (
      !unlocked.topicOutput ||
      contentIdeas.length > 0 ||
      fetchedTopicItems.length > 0 ||
      topicsLoading ||
      !hasAnalysis
    ) {
      return;
    }
    const selectedScenario = selectedAudienceIndex != null && displayScenarios[selectedAudienceIndex]
      ? displayScenarios[selectedAudienceIndex]
      : null;
    setTopicsLoading(true);
    topicAPI
      .generateTrendingTopics(analysis, selectedScenario, webSearchInsights || {}, {
        onTopicComplete: (topic) => {
          setFetchedTopicItems((prev) => [...prev, topic]);
        },
      })
      .then((result) => {
        if (result?.success && Array.isArray(result.topics) && result.topics.length > 0) {
          setFetchedTopicItems(result.topics);
        }
      })
      .catch((err) => {
        console.warn('Topic fetch failed:', err?.message);
        message.error(err?.message || 'Could not load topics.');
      })
      .finally(() => {
        setTopicsLoading(false);
      });
  }, [
    unlocked.topicOutput,
    contentIdeas.length,
    hasAnalysis,
    selectedAudienceIndex,
    analysis,
    webSearchInsights,
  ]);

  // Issue #303: fetch analysis narration from GET /api/v1/analysis/narration/analysis when section unlocks
  useEffect(() => {
    console.log('🎙️ [FRONTEND] Analysis narration useEffect triggered', {
      unlocked: unlocked.analysisNarration,
      hasOrgId: !!analysis?.organizationId,
      alreadyStarted: analysisNarrationStreamStartedRef.current
    });

    if (!unlocked.analysisNarration || !analysis?.organizationId || analysisNarrationStreamStartedRef.current) return;

    console.log('🚀 [FRONTEND] Starting analysis narration stream for orgId:', analysis.organizationId);
    analysisNarrationStreamStartedRef.current = true;
    setAnalysisNarrationStreaming(true);

    autoBlogAPI
      .connectNarrationStream(
        'analysis',
        { organizationId: analysis.organizationId },
        {
          onChunk: (data) => {
            const text = data?.text ?? data?.chunk ?? '';
            console.log('📝 [FRONTEND] Analysis chunk received:', text);
            if (text) setAnalysisNarrationContent((prev) => prev + text);
          },
          onComplete: (data) => {
            console.log('✅ [FRONTEND] Analysis narration complete');
            setAnalysisNarrationStreaming(false);
            if (data?.text) setAnalysisNarrationContent(data.text);
          },
          onBusinessProfile: (data) => {
            console.log('📊 [FRONTEND-FUNNEL] Business profile EVENT RECEIVED:', data);
            try {
              const profile = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
              console.log('📊 [FRONTEND-FUNNEL] Business profile parsed:', profile);
              setBusinessProfile(profile);
              console.log('📊 [FRONTEND-FUNNEL] Business profile state set');
            } catch (err) {
              console.error('❌ [FRONTEND-FUNNEL] Failed to parse business profile:', err);
            }
          },
          onError: (err) => {
            console.error('❌ [FRONTEND] Analysis narration error:', err);
            setAnalysisNarrationStreaming(false);
          },
        }
      )
      .catch((err) => {
        console.error('❌ [FRONTEND] Analysis narration catch:', err);
        setAnalysisNarrationStreaming(false);
      });
  }, [unlocked.analysisNarration, analysis?.organizationId]);

  // Issue #261: fetch audience narration from GET /api/v1/analysis/narration/audience when section unlocks
  useEffect(() => {
    console.log('👥 [FRONTEND] Audience narration useEffect triggered', {
      unlocked: unlocked.audienceNarration,
      hasOrgId: !!analysis?.organizationId,
      alreadyStarted: audienceNarrationStreamStartedRef.current
    });

    if (!unlocked.audienceNarration || !analysis?.organizationId || audienceNarrationStreamStartedRef.current) return;

    console.log('🚀 [FRONTEND] Starting audience narration stream for orgId:', analysis.organizationId);
    audienceNarrationStreamStartedRef.current = true;
    setAudienceNarrationStreaming(true);

    autoBlogAPI
      .connectNarrationStream(
        'audience',
        { organizationId: analysis.organizationId },
        {
          onChunk: (data) => {
            const text = data?.text ?? data?.chunk ?? '';
            console.log('📝 [FRONTEND] Audience chunk received:', text);
            if (text) setAudienceNarrationContent((prev) => prev + text);
          },
          onComplete: (data) => {
            console.log('✅ [FRONTEND] Audience narration complete');
            setAudienceNarrationStreaming(false);
            if (data?.text) setAudienceNarrationContent(data.text);
          },
          onError: (err) => {
            console.error('❌ [FRONTEND] Audience narration error:', err);
            setAudienceNarrationStreaming(false);
          },
        }
      )
      .catch((err) => {
        console.error('❌ [FRONTEND] Audience narration catch:', err);
        setAudienceNarrationStreaming(false);
      });
  }, [unlocked.audienceNarration, analysis?.organizationId]);

  // Issue #261: fetch topic narration when topic section unlocks (after user selects audience)
  useEffect(() => {
    console.log('📝 [FRONTEND] Topic narration useEffect triggered', {
      unlocked: unlocked.topicNarration,
      hasOrgId: !!analysis?.organizationId,
      selectedAudienceIndex,
      alreadyStarted: topicNarrationStreamStartedRef.current
    });

    if (!unlocked.topicNarration || !analysis?.organizationId || selectedAudienceIndex == null || topicNarrationStreamStartedRef.current) return;

    const raw = displayScenarios[selectedAudienceIndex]?.targetSegment ?? '';
    const selectedAudience = toNarrationParamString(raw);
    console.log('🚀 [FRONTEND] Starting topic narration stream', {
      orgId: analysis.organizationId,
      selectedAudience
    });

    topicNarrationStreamStartedRef.current = true;
    setTopicNarrationStreaming(true);

    autoBlogAPI
      .connectNarrationStream(
        'topic',
        { organizationId: analysis.organizationId, selectedAudience },
        {
          onChunk: (data) => {
            const text = data?.text ?? data?.chunk ?? '';
            console.log('📝 [FRONTEND] Topic chunk received:', text);
            if (text) setTopicNarrationContent((prev) => prev + text);
          },
          onComplete: (data) => {
            console.log('✅ [FRONTEND] Topic narration complete');
            setTopicNarrationStreaming(false);
            if (data?.text) setTopicNarrationContent(data.text);
          },
          onError: (err) => {
            console.error('❌ [FRONTEND] Topic narration error:', err);
            setTopicNarrationStreaming(false);
          },
        }
      )
      .catch((err) => {
        console.error('❌ [FRONTEND] Topic narration catch:', err);
        setTopicNarrationStreaming(false);
      });
  }, [unlocked.topicNarration, analysis?.organizationId, selectedAudienceIndex, displayScenarios]);

  // Issue #261: fetch content narration when content section unlocks (after user selects topic)
  useEffect(() => {
    if (!unlocked.contentNarration || !analysis?.organizationId || contentNarrationStreamStartedRef.current) return;
    const items =
      contentIdeas.length > 0
        ? contentIdeas.slice(0, 5).map((t) => ({
            title: typeof t === 'string' ? t : toNarrationParamString(t?.title ?? t?.topic ?? t),
          }))
        : fetchedTopicItems.map((t) => ({ title: toNarrationParamString(t?.title ?? t?.subheader ?? 'Topic') }));
    const rawTopic = items[selectedTopicIndex]?.title ?? items[selectedTopicIndex ?? 0]?.title ?? '';
    const selectedTopic = toNarrationParamString(rawTopic);
    contentNarrationStreamStartedRef.current = true;
    setContentNarrationStreaming(true);
    autoBlogAPI
      .connectNarrationStream(
        'content',
        { organizationId: analysis.organizationId, selectedTopic },
        {
          onChunk: (data) => {
            const text = data?.text ?? data?.chunk ?? '';
            if (text) setContentNarrationContent((prev) => prev + text);
          },
          onComplete: (data) => {
            setContentNarrationStreaming(false);
            if (data?.text) setContentNarrationContent(data.text);
          },
          onError: () => setContentNarrationStreaming(false),
        }
      )
      .catch(() => setContentNarrationStreaming(false));
  }, [unlocked.contentNarration, analysis?.organizationId, selectedTopicIndex, contentIdeas, fetchedTopicItems]);

  const handleAnalyze = useCallback(async (url) => {
    if (analysisInProgressRef.current) return;
    const validation = workflowUtils.urlUtils.validateWebsiteUrl(url);
    if (!validation.isValid) {
      message.error(validation.error);
      return;
    }
    analysisInProgressRef.current = true;
    setLoading(true);
    setScanningMessage(systemVoice.analysis.steps?.[0] || 'Reading your pages…');
    setAnalysisProgress(null);
    setAnalysisThoughts([]);
    setAudienceNarrationContent('');
    setTopicNarrationContent('');
    setContentNarrationContent('');
    audienceNarrationStreamStartedRef.current = false;
    topicNarrationStreamStartedRef.current = false;
    contentNarrationStreamStartedRef.current = false;
    addStickyWorkflowStep?.('websiteAnalysis', { websiteUrl: validation.formattedUrl, businessName: '', businessType: '' });

    const ANALYSIS_MAX_WAIT_MS = 6 * 60 * 1000;
    const safetyTimeoutId = setTimeout(() => {
      if (analysisInProgressRef.current) {
        analysisInProgressRef.current = false;
        setLoading(false);
        message.warning('Analysis is taking longer than expected. You can try again or use a different URL.');
      }
    }, ANALYSIS_MAX_WAIT_MS);

    try {
      const result = await analysisAPI.analyzeWebsite(validation.formattedUrl, {
        onJobCreated: () => {},
        onProgress: (stepOrStatus) => {
          if (typeof stepOrStatus !== 'object' || !stepOrStatus) return;
          const step = stepOrStatus.currentStep ?? stepOrStatus.current_step ?? '';
          const hasAny = step || stepOrStatus.progress != null || stepOrStatus.phase || stepOrStatus.detail || stepOrStatus.estimatedTimeRemaining != null;
          if (!hasAny) return;
          lastProgressAtRef.current = Date.now();
          if (step) setScanningMessage(step);
          setAnalysisProgress({
            progress: stepOrStatus.progress,
            currentStep: step || undefined,
            phase: stepOrStatus.phase,
            detail: stepOrStatus.detail,
            estimatedTimeRemaining: stepOrStatus.estimatedTimeRemaining ?? stepOrStatus.estimated_seconds_remaining ?? undefined,
          });
        },
        onScrapePhase: (data) => {
          if (data?.message) {
            setAnalysisThoughts((prev) => [...prev, { phase: data.phase, message: data.message, url: data.url }]);
          }
        },
        onAnalysisResult: (data) => {
          if (data?.analysis) {
            updateWebsiteAnalysis(data.analysis);
          }
        },
        onAudiencesResult: (data) => {
          if (data?.scenarios?.length) {
            updateWebsiteAnalysis({ scenarios: data.scenarios });
          }
        },
        onPitchesResult: (data) => {
          if (data?.scenarios?.length) {
            updateWebsiteAnalysis({ scenarios: data.scenarios });
          }
        },
        onScenariosResult: (data) => {
          if (data?.scenarios?.length) {
            updateWebsiteAnalysis({ scenarios: data.scenarios });
          }
        },
        onAudienceNarrationChunk: (data) => {
          const chunk = data?.text ?? data?.chunk ?? '';
          if (chunk) {
            setAudienceNarrationStreaming(true);
            setAudienceNarrationContent((prev) => prev + chunk);
          }
        },
        onAudienceNarrationComplete: (data) => {
          setAudienceNarrationStreaming(false);
          if (data?.text) setAudienceNarrationContent(data.text);
        },
        onTopicNarrationChunk: (data) => {
          const chunk = data?.text ?? data?.chunk ?? '';
          if (chunk) {
            setTopicNarrationStreaming(true);
            setTopicNarrationContent((prev) => prev + chunk);
          }
        },
        onTopicNarrationComplete: (data) => {
          setTopicNarrationStreaming(false);
          if (data?.text) setTopicNarrationContent(data.text);
        },
        onContentNarrationChunk: (data) => {
          const chunk = data?.text ?? data?.chunk ?? '';
          if (chunk) {
            setContentNarrationStreaming(true);
            setContentNarrationContent((prev) => prev + chunk);
          }
        },
        onContentNarrationComplete: (data) => {
          setContentNarrationStreaming(false);
          if (data?.text) setContentNarrationContent(data.text);
        },
      });
      if (result?.success && result.analysis) {
        setWebsiteUrl?.(validation.formattedUrl);
        updateWebsiteAnalysis(result.analysis);
        updateAnalysisCompleted(true);
        updateCTAData?.({ ctas: result.ctas, ctaCount: result.ctaCount, hasSufficientCTAs: result.hasSufficientCTAs });
        updateWebSearchInsights?.(result.webSearchInsights || {});
        updateStickyWorkflowStep?.('websiteAnalysis', { websiteUrl: validation.formattedUrl, businessName: result.analysis.businessName, businessType: result.analysis.businessType, ...result.analysis });
        setUnlocked((u) => ({ ...u, analysisNarration: true }));
      } else {
        message.error(result?.error || 'Analysis failed');
      }
    } catch (err) {
      message.error(err?.message || 'Analysis failed');
    } finally {
      clearTimeout(safetyTimeoutId);
      analysisInProgressRef.current = false;
      setLoading(false);
    }
  }, [setWebsiteUrl, updateWebsiteAnalysis, updateAnalysisCompleted, updateCTAData, updateWebSearchInsights, addStickyWorkflowStep, updateStickyWorkflowStep]);

  const unlockAnalysisOutput = useCallback(() => {
    console.log('🕐 [OnboardingFunnelView] Analysis narration complete - unlocking output');
    setAnalysisNarrationComplete(true);
    console.log('🕐 [OnboardingFunnelView] Waiting 300ms before showing PowerPoint slide');
    setTimeout(() => {
      console.log('🕐 [OnboardingFunnelView] Unlocking analysisOutput - slide will now appear');
      setUnlocked((u) => ({ ...u, analysisOutput: true }));
    }, 300); // Small delay before showing slide to create clear sequencing
  }, []);

  const handleConfirmAnalysis = useCallback(() => {
    setAnalysisConfirmed(true);
    setEditMode(false);
    setOriginalAnalysisSnapshot(null);
    setEditedBusinessProfile(null);
    setUnlocked((u) => ({ ...u, audienceNarration: true, audienceOutput: true }));
    saveWorkflowState?.();
  }, [saveWorkflowState]);

  const handleEditAnalysis = useCallback(() => {
    setOriginalAnalysisSnapshot(businessProfile);
    setEditedBusinessProfile(businessProfile);
    setEditMode(true);
  }, [businessProfile]);

  const handleApplyEdit = useCallback(() => {
    if (editedBusinessProfile) {
      setBusinessProfile(editedBusinessProfile);
      // Also update the analysis object with the edited fields
      updateWebsiteAnalysis({
        businessName: editedBusinessProfile.businessName,
        targetAudience: editedBusinessProfile.targetAudience,
        contentFocus: editedBusinessProfile.contentFocus,
      });
    }
    setEditMode(false);
    setOriginalAnalysisSnapshot(null);
    setEditedBusinessProfile(null);
  }, [editedBusinessProfile, updateWebsiteAnalysis]);

  const handleCancelEdit = useCallback(() => {
    setEditMode(false);
    setOriginalAnalysisSnapshot(null);
    setEditedBusinessProfile(null);
  }, []);

  const handleRequestSuggestion = useCallback(async (values, setFieldsValue) => {
    if (!values || typeof setFieldsValue !== 'function') return;
    try {
      const response = await autoBlogAPI.getCleanedAnalysisSuggestion({
        businessName: values.businessName ?? '',
        targetAudience: values.targetAudience ?? '',
        contentFocus: values.contentFocus ?? '',
      });
      const suggestion = response?.suggestion ?? response;
      if (suggestion && (suggestion.businessName != null || suggestion.targetAudience != null || suggestion.contentFocus != null)) {
        setFieldsValue({
          businessName: suggestion.businessName ?? values.businessName,
          targetAudience: suggestion.targetAudience ?? values.targetAudience,
          contentFocus: suggestion.contentFocus ?? values.contentFocus,
        });
        message.success('Suggestion applied.');
      } else {
        message.info('No suggestion returned.');
      }
    } catch (err) {
      if (err?.status === 404 || err?.message?.includes('404')) {
        message.info('Suggestion not available from the backend yet.');
      } else {
        message.error(err?.message || 'Could not get suggestion.');
      }
    }
  }, []);

  const unlockAudienceOutput = useCallback(() => {
    console.log('🕐 [OnboardingFunnelView] Audience narration complete - unlocking audience cards');
    setAudienceNarrationComplete(true);
    setTimeout(() => {
      setUnlocked((u) => ({ ...u, audienceOutput: true }));
    }, 300); // Small delay for visual sequencing
  }, []);

  const handleSelectAudience = useCallback((index) => {
    setSelectedAudienceIndex(index);
    setUnlocked((u) => ({ ...u, topicNarration: true, topicOutput: true }));
  }, []);

  const unlockTopicOutput = useCallback(() => {
    console.log('🕐 [OnboardingFunnelView] Topic narration complete - unlocking topic cards');
    setTopicNarrationComplete(true);
    setTimeout(() => {
      setUnlocked((u) => ({ ...u, topicOutput: true }));
    }, 300); // Small delay for visual sequencing
  }, []);

  const handleSelectTopic = useCallback((index) => {
    setSelectedTopicIndex(index);
    if (!user) {
      setUnlocked((u) => ({ ...u, signupGate: true }));
    } else {
      setUnlocked((u) => ({ ...u, contentNarration: true }));
    }
  }, [user]);

  const handleSignupSuccess = useCallback(() => {
    setUnlocked((u) => ({ ...u, contentNarration: true }));
  }, []);

  const handleContentNarrationComplete = useCallback(() => {
    setFunnelComplete(true);
    saveWorkflowState?.();
  }, [saveWorkflowState]);

  if (funnelComplete) {
    return (
      <DashboardLayout
        workflowContent={true}
        showDashboard={true}
        isMobile={false}
        onActiveTabChange={() => {}}
        forceWorkflowMode={false}
      />
    );
  }

  const iconUrls = analysis.iconUrls || analysis.cardIcons || {};
  const analysisCards = [
    { heading: 'Business', content: analysis.businessName || analysis.businessType, iconFallback: 'businessType', iconUrl: iconUrls.businessType || iconUrls.business },
    { heading: 'Target audience', content: analysis.targetAudience, iconFallback: 'targetAudience', iconUrl: iconUrls.targetAudience },
    { heading: 'Content focus', content: analysis.contentFocus, iconFallback: 'contentFocus', iconUrl: iconUrls.contentFocus },
    { heading: 'Keywords', content: Array.isArray(analysis.keywords) ? analysis.keywords.slice(0, 5).join(', ') : analysis.keywords, iconFallback: 'keywords', iconUrl: iconUrls.keywords },
  ].filter((c) => c.content);

  const contentIdeasAsTopics = contentIdeas.length
    ? contentIdeas.slice(0, 5).map((t) => ({
        title: typeof t === 'string' ? t : toNarrationParamString(t?.title ?? t?.topic ?? t),
        description: typeof t?.description === 'string' ? t.description : toNarrationParamString(t?.description ?? ''),
      }))
    : [];
  const fetchedAsTopics = fetchedTopicItems.map((t) => ({
    title: toNarrationParamString(t?.title ?? t?.subheader ?? 'Topic'),
    description: typeof t?.description === 'string' ? t.description : toNarrationParamString(t?.subheader ?? t?.description ?? ''),
    imageUrl: t?.image || undefined,
  }));
  const topicItems =
    contentIdeasAsTopics.length > 0
      ? contentIdeasAsTopics
      : fetchedAsTopics.length > 0
        ? fetchedAsTopics
        : [];

  return (
    <>
      {!user && (
        <LoggedOutProgressHeader
          showAuthModal={showAuthModal}
          setShowAuthModal={setShowAuthModal}
          authContext={authContext}
          setAuthContext={setAuthContext}
          user={user}
        />
      )}
      {!user && showAuthModal && authContext && (
        <AuthModal
          open={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            setAuthContext(null);
          }}
          context={authContext}
          defaultTab={authContext === 'register' ? 'register' : 'login'}
        />
      )}
      <div
        style={{
          padding: '24px 16px',
          paddingTop: user ? 24 : 88,
          maxWidth: '80vw',
          margin: '0 auto',
        }}
        data-testid="onboarding-funnel"
      >
      <UnifiedWorkflowHeader
        user={user}
        currentStep={0}
        enableSequentialAnimation={true}
        inputIsEditing={true}
        onSequenceComplete={() => setTimeout(() => setHeaderAnimationComplete(true), 500)}
      />

      <section ref={(el) => (sectionRefs.current.websiteInput = el)}>
        <WebsiteInputSection
          websiteUrl={websiteUrl}
          setWebsiteUrl={setWebsiteUrl}
          onAnalyze={handleAnalyze}
          loading={loading}
          scanningMessage={scanningMessage}
          analysisProgress={analysisProgress}
          analysisThoughts={analysisThoughts}
          analysisComplete={!loading && hasAnalysis}
          headerAnimationComplete={headerAnimationComplete}
          onHoldTightNarrationComplete={() => setHoldTightNarrationComplete(true)}
        />
      </section>

      {!loading && unlocked.analysisNarration && hasAnalysis && (
        <>
        {/* Phase 1: Narration (always shows) */}
        <section ref={(el) => (sectionRefs.current.analysisNarration = el)} style={{ marginTop: 32 }}>
          <motion.div initial={sectionInitial} animate={sectionAnimate} transition={sectionTransition}>
            <StreamingNarration
            content={analysisNarrationContent || `I analyzed ${analysis?.businessName || 'your website'} and found valuable insights. Here's what stands out.`}
            isStreaming={analysisNarrationStreaming}
            onComplete={unlockAnalysisOutput}
            dataTestId="analysis-narration"
            enableTypingEffect={true}
            fallbackText={`I analyzed ${analysis?.businessName || 'your website'} and found valuable insights. Here's what stands out.`}
            />
          </motion.div>
        </section>

          {/* Phase 2: Business Profile PowerPoint slide (only after narration completes) */}
          {analysisNarrationComplete && (
            businessProfile ? (
                <section style={{ marginTop: 32 }}>
                  <motion.div initial={sectionInitial} animate={sectionAnimate} transition={{ ...sectionTransition, delay: 0.3 }}>
                    <BusinessProfileSlide
                      profileData={editMode ? editedBusinessProfile : businessProfile}
                      editMode={editMode}
                      onUpdate={setEditedBusinessProfile}
                    />
                  </motion.div>
                </section>
            ) : (
                <section style={{ marginTop: 32 }}>
                  <div style={{
                  maxWidth: '1000px',
                  margin: '0 auto',
                  padding: '0 32px'
                }}>
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                    padding: window.innerWidth <= 768 ? '48px 28px' : '80px 64px'
                  }}>
                    <Skeleton active paragraph={{ rows: 8 }} title={{ width: '50%' }} />
                    <div style={{ marginTop: 48 }}>
                      <Skeleton active paragraph={{ rows: 3 }} title={{ width: '30%' }} />
                    </div>
                    <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '1fr 1fr', gap: 32 }}>
                      <Skeleton active paragraph={{ rows: 2 }} title={{ width: '60%' }} />
                      <Skeleton active paragraph={{ rows: 2 }} title={{ width: '60%' }} />
                    </div>
                  </div>
                </div>
              </section>
            )
          )}

          {/* Phase 3: Edit and Continue buttons (only after slide appears) */}
          {analysisNarrationComplete && businessProfile && (
            <section ref={(el) => (sectionRefs.current.analysisOutput = el)} style={{ marginTop: 32 }}>
              <motion.div initial={sectionInitial} animate={sectionAnimate} transition={{ ...sectionTransition, delay: 0.5 }}>
              <EditConfirmActions
                onEdit={handleEditAnalysis}
                onConfirm={handleConfirmAnalysis}
                onApply={handleApplyEdit}
                onCancel={handleCancelEdit}
                editMode={editMode}
                dataTestId="edit-confirm-analysis"
              />
              </motion.div>
            </section>
          )}
        </>
      )}

      {unlocked.analysisOutput && !(unlocked.analysisNarration && hasAnalysis) && (
        <section ref={(el) => (sectionRefs.current.analysisOutput = el)} style={{ marginTop: 32 }}>
          <motion.div initial={sectionInitial} animate={sectionAnimate} transition={sectionTransition}>
            <Title level={4}>What I found</Title>
            {analysisCards.length > 0 ? (
            <CardCarousel onAllCardsViewed={() => {}} dataTestId="analysis-carousel">
              {analysisCards.map((card, i) => (
                <motion.div key={i} initial={cardInitial} animate={cardAnimate} transition={cardTransition(i)} style={{ height: '100%' }}>
                  <AnalysisCard heading={card.heading} content={card.content} iconUrl={card.iconUrl} iconFallback={card.iconFallback} dataTestId={`analysis-card-${i}`} />
                </motion.div>
              ))}
            </CardCarousel>
          ) : (
            <div style={{ marginTop: 16 }} data-testid="analysis-results-loading">
              <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>Preparing your results…</Typography.Text>
              <div style={{ display: 'flex', gap: 16, overflow: 'hidden', paddingBottom: 8 }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      flex: '0 0 auto',
                      width: 'min(400px, 85vw)',
                      padding: 24,
                      background: 'var(--color-background-elevated)',
                      borderRadius: 'var(--radius-xl)',
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
                    <Skeleton active avatar={{ shape: 'square', size: 48 }} paragraph={{ rows: 2 }} title={false} />
                  </div>
                ))}
              </div>
            </div>
          )}
          <EditConfirmActions
            onEdit={handleEditAnalysis}
            onConfirm={handleConfirmAnalysis}
            onApply={handleApplyEdit}
            onCancel={handleCancelEdit}
            editMode={editMode}
            dataTestId="edit-confirm-analysis"
          />
          </motion.div>
        </section>
      )}

      {unlocked.audienceNarration && (
        <section ref={(el) => { sectionRefs.current.audienceNarration = el; sectionRefs.current.audienceOutput = el; }} style={{ marginTop: 32 }}>
          <motion.div initial={sectionInitial} animate={sectionAnimate} transition={sectionTransition}>
          <StreamingNarration
            content={audienceNarrationContent || "I identified audience segments that match your offering. Choose one to focus on."}
            isStreaming={audienceNarrationStreaming}
            onComplete={unlockAudienceOutput}
            dataTestId="audience-narration"
            enableTypingEffect={true}
          />
          {audienceNarrationComplete && (
            <>
              <Title level={4} style={{ marginTop: 24 }}>Choose your audience</Title>
              {audiencePlaceholderVisible ? (
            <div style={{ marginTop: 16 }} data-testid="audience-results-loading">
              <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>Loading audience segments…</Typography.Text>
              <div style={{ display: 'flex', gap: 16, overflow: 'hidden', paddingBottom: 8 }}>
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      flex: '0 0 auto',
                      width: 'min(400px, 85vw)',
                      background: 'var(--color-background-elevated)',
                      borderRadius: 'var(--radius-xl)',
                      boxShadow: 'var(--shadow-card)',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ height: 180, background: 'var(--color-background-container)' }}>
                      <Skeleton active paragraph={false} title={false} />
                    </div>
                    <div style={{ padding: 16 }}>
                      <Skeleton active paragraph={{ rows: 2 }} title={{ width: '60%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : displayScenarios.length > 0 ? (
            <>
              {fallbackScenarios.length > 0 && (
                <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                  Using your target audience from the analysis. You can select it to continue.
                </Typography.Text>
              )}
              <Row gutter={[16, 16]} style={{ marginTop: 16 }} data-testid="audience-carousel">
                {(() => {
                  console.log('🕐 [OnboardingFunnelView] Rendering audience cards:', displayScenarios.length, displayScenarios);
                  return displayScenarios.map((s, i) => (
                    <Col xs={24} sm={12} lg={8} key={s.id || i}>
                      <motion.div
                        initial={cardInitial}
                        animate={cardAnimate}
                        transition={cardTransition(i)}
                        style={{ height: '100%' }}
                      >
                        <AudienceCard
                          targetSegment={s.targetSegment}
                          customerProblem={s.customerProblem}
                          pitch={s.pitch}
                          imageUrl={s.imageUrl}
                          selected={selectedAudienceIndex === i}
                          onClick={() => handleSelectAudience(i)}
                          dataTestId={`audience-card-${i}`}
                        />
                      </motion.div>
                    </Col>
                  ));
                })()}
              </Row>
            </>
          ) : (
            <div style={{ marginTop: 16 }} data-testid="audience-results-loading">
              <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>Loading audience segments…</Typography.Text>
              <div style={{ display: 'flex', gap: 16, overflow: 'hidden', paddingBottom: 8 }}>
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      flex: '0 0 auto',
                      width: 'min(400px, 85vw)',
                      background: 'var(--color-background-elevated)',
                      borderRadius: 'var(--radius-xl)',
                      boxShadow: 'var(--shadow-card)',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ height: 180, background: 'var(--color-background-container)' }}>
                      <Skeleton active paragraph={false} title={false} />
                    </div>
                    <div style={{ padding: 16 }}>
                      <Skeleton active paragraph={{ rows: 2 }} title={{ width: '60%' }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24, padding: '24px 16px', background: 'var(--color-background-alt)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border-base)' }}>
                <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 12 }}>
                  If no segments appear above, you can continue to the next step.
                </Typography.Text>
                <div style={{ textAlign: 'center' }}>
                  <Button type="primary" onClick={() => { setSelectedAudienceIndex(0); setUnlocked((u) => ({ ...u, topicNarration: true, topicOutput: true })); }}>
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          )}
            </>
          )}
          </motion.div>
        </section>
      )}

      {unlocked.topicNarration && (
        <section ref={(el) => { sectionRefs.current.topicNarration = el; sectionRefs.current.topicOutput = el; }} style={{ marginTop: 32 }}>
          <motion.div initial={sectionInitial} animate={sectionAnimate} transition={sectionTransition}>
          <StreamingNarration
            content={topicNarrationContent || (topicsLoading ? "I'm looking for topics that will resonate with your audience…" : "Based on your audience, here are topics that will resonate. Pick one for your article.")}
            isStreaming={topicNarrationStreaming}
            onComplete={unlockTopicOutput}
            dataTestId="topic-narration"
            enableTypingEffect={true}
          />
          {topicNarrationComplete && (
            <>
              <Title level={4} style={{ marginTop: 24 }}>Choose a topic</Title>
              {topicsLoading ? (
            <div style={{ marginTop: 16 }} data-testid="topics-loading">
              <div style={{ display: 'flex', gap: 16, overflow: 'hidden', paddingBottom: 8 }}>
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      flex: '0 0 auto',
                      width: 'min(400px, 85vw)',
                      padding: 24,
                      background: 'var(--color-background-elevated)',
                      borderRadius: 'var(--radius-xl)',
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
                    <Skeleton active paragraph={{ rows: 2 }} title={{ width: '70%' }} />
                  </div>
                ))}
              </div>
            </div>
          ) : topicItems.length > 0 ? (
            <CardCarousel onAllCardsViewed={() => {}} dataTestId="topic-carousel">
              {topicItems.map((t, i) => (
                <motion.div key={i} initial={cardInitial} animate={cardAnimate} transition={cardTransition(i)} style={{ height: '100%' }}>
                  <TopicCard
                    title={t.title}
                    description={t.description}
                    imageUrl={t.imageUrl}
                    selected={selectedTopicIndex === i}
                    onClick={() => handleSelectTopic(i)}
                    dataTestId={`topic-card-${i}`}
                  />
                </motion.div>
              ))}
            </CardCarousel>
          ) : contentIdeas.length === 0 ? (
            <div style={{ padding: '32px 16px', marginTop: 16, background: 'var(--color-background-alt)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border-base)' }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    No topics could be generated right now. You can continue and we&apos;ll suggest a topic when creating your article.
                  </span>
                }
              />
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Button type="primary" onClick={() => { setUnlocked((u) => ({ ...u, signupGate: true })); }}>
                  Continue without selecting a topic
                </Button>
              </div>
            </div>
          ) : null}
            </>
          )}
          </motion.div>
        </section>
      )}

      {unlocked.signupGate && !user && (
        <section ref={(el) => (sectionRefs.current.signupGate = el)} style={{ marginTop: 32 }}>
          <motion.div initial={sectionInitial} animate={sectionAnimate} transition={sectionTransition}>
          <SignupGateCard onSuccess={handleSignupSuccess} />
          </motion.div>
        </section>
      )}

      {unlocked.contentNarration && (
        <section ref={(el) => (sectionRefs.current.contentNarration = el)} style={{ marginTop: 32 }}>
          <motion.div initial={sectionInitial} animate={sectionAnimate} transition={sectionTransition}>
          <StreamingNarration
            content={contentNarrationContent || "I'll create your article next. You can edit and export it when it's ready."}
            isStreaming={contentNarrationStreaming}
            onComplete={handleContentNarrationComplete}
            dataTestId="content-narration"
          />
          </motion.div>
        </section>
      )}
    </div>
    </>
  );
}

export default OnboardingFunnelView;
