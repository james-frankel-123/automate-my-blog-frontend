/**
 * OnboardingFunnelView — guided sequential funnel: website → analysis → audience → topic → signup (optional) → content.
 * Issue #261.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Typography, message, Empty, Spin, Button, Skeleton } from 'antd';
import { useWorkflowMode } from '../../contexts/WorkflowModeContext';
import { analysisAPI, topicAPI } from '../../services/workflowAPI';
import autoBlogAPI from '../../services/api';
import workflowUtils from '../../utils/workflowUtils';
import { systemVoice } from '../../copy/systemVoice';
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

const { Title } = Typography;

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
  const sectionRefs = useRef({});

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

  const scrollTo = (key) => {
    const el = sectionRefs.current[key];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const prevUnlocked = useRef({ ...DEFAULT_UNLOCKED });
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
    }
    prevLoading.current = loading;
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
      .generateTrendingTopics(analysis, selectedScenario, webSearchInsights || {})
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

  const handleAnalyze = useCallback(async (url) => {
    const validation = workflowUtils.urlUtils.validateWebsiteUrl(url);
    if (!validation.isValid) {
      message.error(validation.error);
      return;
    }
    setLoading(true);
    setScanningMessage(systemVoice.analysis.steps?.[0] || 'Reading your pages…');
    setAnalysisProgress(null);
    setAnalysisThoughts([]);
    addStickyWorkflowStep?.('websiteAnalysis', { websiteUrl: validation.formattedUrl, businessName: '', businessType: '' });
    try {
      const result = await analysisAPI.analyzeWebsite(validation.formattedUrl, {
        onJobCreated: () => {},
        onProgress: (stepOrStatus) => {
          if (typeof stepOrStatus === 'object' && stepOrStatus?.currentStep) {
            setScanningMessage(stepOrStatus.currentStep);
            setAnalysisProgress({
              progress: stepOrStatus.progress,
              currentStep: stepOrStatus.currentStep,
              phase: stepOrStatus.phase,
              detail: stepOrStatus.detail,
            });
          }
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
      setLoading(false);
    }
  }, [setWebsiteUrl, updateWebsiteAnalysis, updateAnalysisCompleted, updateCTAData, updateWebSearchInsights, addStickyWorkflowStep, updateStickyWorkflowStep]);

  const unlockAnalysisOutput = useCallback(() => {
    setUnlocked((u) => ({ ...u, analysisOutput: true }));
  }, []);

  const handleConfirmAnalysis = useCallback(() => {
    setAnalysisConfirmed(true);
    setEditMode(false);
    setOriginalAnalysisSnapshot(null);
    setUnlocked((u) => ({ ...u, audienceNarration: true }));
    saveWorkflowState?.();
  }, [saveWorkflowState]);

  const handleEditAnalysis = useCallback(() => {
    setOriginalAnalysisSnapshot({
      businessName: analysis.businessName ?? '',
      targetAudience: analysis.targetAudience ?? '',
      contentFocus: analysis.contentFocus ?? '',
    });
    setEditMode(true);
  }, [analysis.businessName, analysis.targetAudience, analysis.contentFocus]);

  const handleApplyEdit = useCallback(
    (edited) => {
      updateWebsiteAnalysis(edited);
      setEditMode(false);
      setOriginalAnalysisSnapshot(null);
    },
    [updateWebsiteAnalysis]
  );

  const handleCancelEdit = useCallback(() => {
    setEditMode(false);
    setOriginalAnalysisSnapshot(null);
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
    setUnlocked((u) => ({ ...u, audienceOutput: true }));
  }, []);

  const handleSelectAudience = useCallback((index) => {
    setSelectedAudienceIndex(index);
    setUnlocked((u) => ({ ...u, topicNarration: true }));
  }, []);

  const unlockTopicOutput = useCallback(() => {
    setUnlocked((u) => ({ ...u, topicOutput: true }));
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

  const analysisCards = [
    { heading: 'Business', content: analysis.businessName || analysis.businessType, iconFallback: 'businessType' },
    { heading: 'Target audience', content: analysis.targetAudience, iconFallback: 'targetAudience' },
    { heading: 'Content focus', content: analysis.contentFocus, iconFallback: 'contentFocus' },
    { heading: 'Keywords', content: Array.isArray(analysis.keywords) ? analysis.keywords.slice(0, 5).join(', ') : analysis.keywords, iconFallback: 'keywords' },
  ].filter((c) => c.content);

  const contentIdeasAsTopics = contentIdeas.length
    ? contentIdeas.slice(0, 5).map((t, i) =>
        typeof t === 'string' ? { title: t, description: '' } : { title: t?.title || t?.topic || String(t), description: t?.description || '' }
      )
    : [];
  const fetchedAsTopics = fetchedTopicItems.map((t) => ({
    title: t.title || t.subheader || 'Topic',
    description: t.subheader || t.description || '',
  }));
  const topicItems =
    contentIdeasAsTopics.length > 0
      ? contentIdeasAsTopics
      : fetchedAsTopics.length > 0
        ? fetchedAsTopics
        : [];

  return (
    <div style={{ padding: '24px 16px', maxWidth: 800, margin: '0 auto' }} data-testid="onboarding-funnel">
      <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
        {systemVoice.analysis?.title || 'Analyze your site'}
      </Title>

      <section ref={(el) => (sectionRefs.current.websiteInput = el)}>
        <WebsiteInputSection
          websiteUrl={websiteUrl}
          setWebsiteUrl={setWebsiteUrl}
          onAnalyze={handleAnalyze}
          loading={loading}
          scanningMessage={scanningMessage}
          analysisProgress={analysisProgress}
          analysisThoughts={analysisThoughts}
        />
      </section>

      {loading && (
        <section ref={(el) => (sectionRefs.current.analysisOutput = el)} style={{ marginTop: 32 }} data-testid="analysis-results-loading">
          <Title level={4}>What I found</Title>
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>Preparing your results…</Typography.Text>
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
        </section>
      )}

      {!loading && unlocked.analysisNarration && hasAnalysis && (
        <>
        <section ref={(el) => (sectionRefs.current.analysisNarration = el)} style={{ marginTop: 32 }}>
          <StreamingNarration
            content="I analyzed your website and found a clear focus. Here’s what stands out."
            isStreaming={false}
            onComplete={unlockAnalysisOutput}
            dataTestId="analysis-narration"
          />
        </section>

          {/* What I found + placeholders shown with narration so placeholders are visible during load */}
          <section ref={(el) => (sectionRefs.current.analysisOutput = el)} style={{ marginTop: 32 }}>
            <Title level={4}>What I found</Title>
            {analysisCards.length > 0 ? (
            <CardCarousel onAllCardsViewed={() => {}} dataTestId="analysis-carousel">
              {analysisCards.map((card, i) => (
                <AnalysisCard key={i} heading={card.heading} content={card.content} iconFallback={card.iconFallback} dataTestId={`analysis-card-${i}`} />
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
            {editMode && (
              <AnalysisEditSection
                originalAnalysis={originalAnalysisSnapshot ?? {}}
                currentAnalysis={analysis}
                onApply={handleApplyEdit}
                onCancel={handleCancelEdit}
                onRequestSuggestion={handleRequestSuggestion}
                dataTestId="analysis-edit-section"
              />
            )}
            <EditConfirmActions
              onEdit={handleEditAnalysis}
              onConfirm={handleConfirmAnalysis}
              editMode={editMode}
              dataTestId="edit-confirm-analysis"
            />
          </section>
        </>
      )}

      {unlocked.analysisOutput && !(unlocked.analysisNarration && hasAnalysis) && (
        <section ref={(el) => (sectionRefs.current.analysisOutput = el)} style={{ marginTop: 32 }}>
          <Title level={4}>What I found</Title>
          {analysisCards.length > 0 ? (
            <CardCarousel onAllCardsViewed={() => {}} dataTestId="analysis-carousel">
              {analysisCards.map((card, i) => (
                <AnalysisCard key={i} heading={card.heading} content={card.content} iconFallback={card.iconFallback} dataTestId={`analysis-card-${i}`} />
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
          {editMode && (
            <AnalysisEditSection
              originalAnalysis={originalAnalysisSnapshot ?? {}}
              currentAnalysis={analysis}
              onApply={handleApplyEdit}
              onCancel={handleCancelEdit}
              onRequestSuggestion={handleRequestSuggestion}
              dataTestId="analysis-edit-section"
            />
          )}
          <EditConfirmActions
            onEdit={handleEditAnalysis}
            onConfirm={handleConfirmAnalysis}
            editMode={editMode}
            dataTestId="edit-confirm-analysis"
          />
        </section>
      )}

      {unlocked.audienceNarration && (
        <section ref={(el) => (sectionRefs.current.audienceNarration = el)} style={{ marginTop: 32 }}>
          <StreamingNarration
            content="I identified audience segments that match your offering. Choose one to focus on."
            isStreaming={false}
            onComplete={unlockAudienceOutput}
            dataTestId="audience-narration"
          />
        </section>
      )}

      {unlocked.audienceOutput && (
        <section ref={(el) => (sectionRefs.current.audienceOutput = el)} style={{ marginTop: 32 }}>
          <Title level={4}>Choose your audience</Title>
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
              <CardCarousel onAllCardsViewed={() => {}} dataTestId="audience-carousel">
                {displayScenarios.map((s, i) => (
                  <AudienceCard
                    key={s.id || i}
                    targetSegment={s.targetSegment}
                    customerProblem={s.customerProblem}
                    pitch={s.pitch}
                    imageUrl={s.imageUrl}
                    selected={selectedAudienceIndex === i}
                    onClick={() => handleSelectAudience(i)}
                    dataTestId={`audience-card-${i}`}
                  />
                ))}
              </CardCarousel>
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
                  <Button type="primary" onClick={() => { setSelectedAudienceIndex(0); setUnlocked((u) => ({ ...u, topicNarration: true })); }}>
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {unlocked.topicNarration && (
        <section ref={(el) => (sectionRefs.current.topicNarration = el)} style={{ marginTop: 32 }}>
          <StreamingNarration
            content="Based on your audience, here are topics that will resonate. Pick one for your article."
            isStreaming={false}
            onComplete={unlockTopicOutput}
            dataTestId="topic-narration"
          />
        </section>
      )}

      {unlocked.topicOutput && (
        <section ref={(el) => (sectionRefs.current.topicOutput = el)} style={{ marginTop: 32 }}>
          <Title level={4}>Choose a topic</Title>
          {topicsLoading && (
            <div style={{ padding: '48px 24px', marginTop: 16, background: 'var(--color-background-alt)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }} data-testid="topics-loading">
              <Spin size="large" tip="Generating topics for your audience…" />
            </div>
          )}
          {!topicsLoading && topicItems.length > 0 && (
            <CardCarousel onAllCardsViewed={() => {}} dataTestId="topic-carousel">
              {topicItems.map((t, i) => (
                <TopicCard
                  key={i}
                  title={t.title}
                  description={t.description}
                  selected={selectedTopicIndex === i}
                  onClick={() => handleSelectTopic(i)}
                  dataTestId={`topic-card-${i}`}
                />
              ))}
            </CardCarousel>
          )}
          {!topicsLoading && topicItems.length === 0 && contentIdeas.length === 0 && (
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
          )}
        </section>
      )}

      {unlocked.signupGate && !user && (
        <section ref={(el) => (sectionRefs.current.signupGate = el)} style={{ marginTop: 32 }}>
          <SignupGateCard onSuccess={handleSignupSuccess} />
        </section>
      )}

      {unlocked.contentNarration && (
        <section ref={(el) => (sectionRefs.current.contentNarration = el)} style={{ marginTop: 32 }}>
          <StreamingNarration
            content="I’ll create your article next. You can edit and export it when it’s ready."
            isStreaming={false}
            onComplete={handleContentNarrationComplete}
            dataTestId="content-narration"
          />
        </section>
      )}
    </div>
  );
}

export default OnboardingFunnelView;
