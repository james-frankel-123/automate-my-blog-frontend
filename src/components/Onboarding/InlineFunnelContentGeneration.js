/**
 * Inline content generation for the onboarding funnel.
 * After the user registers, we stay on the funnel and generate the blog here
 * using the same flow as StreamingTestbed: fetch related content, then stream the post.
 */
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Card, Typography, Alert, Button, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { getStreamChunkContentOnly } from '../../utils/streamingUtils';
import { extractStreamCompleteContent, normalizeContentString } from '../../utils/streamingUtils';
import api from '../../services/api';
import { contentAPI } from '../../services/workflowAPI';
import RelatedContentStepsPanel, { STATUS as RelatedContentStepStatus } from '../shared/RelatedContentStepsPanel';
import StreamingPreview from '../StreamingTestbed/StreamingPreview';
import { systemVoice } from '../../copy/systemVoice';

const { Title, Text } = Typography;

const ONBOARDING_ARTICLES_TIMEOUT_MS = 10000;

export default function InlineFunnelContentGeneration({ selectedTopic, analysis, organizationId, ctas: initialCtas }) {
  const [content, setContent] = useState('');
  const [liveStreaming, setLiveStreaming] = useState(false);
  const [liveStreamError, setLiveStreamError] = useState(null);
  const [relatedTweets, setRelatedTweets] = useState([]);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [relatedContentSteps, setRelatedContentSteps] = useState([]);
  const [organizationCTAs, setOrganizationCTAs] = useState(initialCtas || []);
  const [generationComplete, setGenerationComplete] = useState(false);
  const streamClosesRef = useRef([]);
  const articlesTimedOutRef = useRef(false);
  const startedRef = useRef(false);

  const websiteAnalysisData = useMemo(
    () =>
      analysis || {
        businessType: 'Business',
        businessName: 'Your Business',
        targetAudience: 'General Audience',
        contentFocus: 'Content',
        brandVoice: 'Professional',
        decisionMakers: 'General Audience',
      },
    [analysis]
  );

  const runFetchCTAs = useCallback(() => {
    if (!organizationId) return Promise.resolve([]);
    return api
      .getOrganizationCTAs(organizationId)
      .then((r) => {
        const ctas = r?.ctas || [];
        setOrganizationCTAs(ctas);
        setRelatedContentSteps((prev) =>
          prev.map((s) => (s.id === 'ctas' ? { ...s, status: RelatedContentStepStatus.DONE, count: ctas.length } : s))
        );
        return ctas;
      })
      .catch(() => {
        setRelatedContentSteps((prev) =>
          prev.map((s) => (s.id === 'ctas' ? { ...s, status: RelatedContentStepStatus.FAILED } : s))
        );
        return [];
      });
  }, [organizationId]);

  const runTweetsAndVideos = useCallback(() => {
    return api
      .fetchRelatedContent(selectedTopic, websiteAnalysisData, { maxTweets: 3, maxVideos: 5 })
      .then(({ tweets: tweetsData, videos: videosData }) => {
        const tweetsArr = Array.isArray(tweetsData) ? tweetsData : [];
        const videosArr = Array.isArray(videosData) ? videosData : [];
        setRelatedTweets(tweetsArr);
        setRelatedVideos(videosArr);
        setRelatedContentSteps((prev) =>
          prev.map((s) => {
            if (s.id === 'tweets') return { ...s, status: RelatedContentStepStatus.DONE, count: tweetsArr.length };
            if (s.id === 'videos') return { ...s, status: RelatedContentStepStatus.DONE, count: videosArr.length };
            return s;
          })
        );
        return [tweetsArr, videosArr];
      })
      .catch(() => {
        setRelatedContentSteps((prev) =>
          prev.map((s) =>
            s.id === 'tweets' || s.id === 'videos' ? { ...s, status: RelatedContentStepStatus.FAILED } : s
          )
        );
        return [[], []];
      });
  }, [selectedTopic, websiteAnalysisData]);

  const runArticleStream = useCallback(() => {
    return api.searchNewsArticlesForTopicStream(selectedTopic, websiteAnalysisData, 5).then(
      ({ connectionId, streamUrl }) =>
        new Promise((resolve) => {
          setRelatedContentSteps((prev) =>
            prev.map((s) => (s.id === 'articles' ? { ...s, status: RelatedContentStepStatus.RUNNING } : s))
          );
          const { close } = api.connectToStream(connectionId, {
            onComplete: (data) => {
              if (articlesTimedOutRef.current) return;
              const articles = data?.articles ?? data?.data?.articles ?? [];
              const arr = Array.isArray(articles) ? articles : [];
              setRelatedArticles(arr);
              setRelatedContentSteps((prev) =>
                prev.map((s) =>
                  s.id === 'articles' ? { ...s, status: RelatedContentStepStatus.DONE, count: arr.length } : s
                )
              );
              resolve(arr);
            },
            onError: () => {
              if (articlesTimedOutRef.current) return;
              setRelatedContentSteps((prev) =>
                prev.map((s) => (s.id === 'articles' ? { ...s, status: RelatedContentStepStatus.FAILED } : s))
              );
              resolve([]);
            },
          }, { streamUrl });
          streamClosesRef.current.push(close);
        })
    ).catch(() => {
      if (articlesTimedOutRef.current) return [];
      setRelatedContentSteps((prev) =>
        prev.map((s) => (s.id === 'articles' ? { ...s, status: RelatedContentStepStatus.FAILED } : s))
      );
      return [];
    });
  }, [selectedTopic, websiteAnalysisData]);

  const startGeneration = useCallback(async () => {
    if (!selectedTopic || !organizationId) return;
    setLiveStreamError(null);
    setContent('');
    setLiveStreaming(true);
    setGenerationComplete(false);
    setRelatedTweets([]);
    setRelatedArticles([]);
    setRelatedVideos([]);
    setOrganizationCTAs(initialCtas || []);
    streamClosesRef.current = [];
    articlesTimedOutRef.current = false;

    const fetchSteps = [
      { id: 'ctas', label: systemVoice.content.fetchCTAs, status: RelatedContentStepStatus.PENDING },
      { id: 'tweets', label: systemVoice.content.fetchTweets, status: RelatedContentStepStatus.PENDING },
      { id: 'articles', label: systemVoice.content.fetchArticles, status: RelatedContentStepStatus.PENDING },
      { id: 'videos', label: systemVoice.content.fetchVideos, status: RelatedContentStepStatus.PENDING },
    ];
    setRelatedContentSteps(fetchSteps);

    setRelatedContentSteps((prev) =>
      prev.map((s) =>
        s.id === 'tweets' || s.id === 'videos' ? { ...s, status: RelatedContentStepStatus.RUNNING } : s
      )
    );

    let tweetsArr = [];
    let videosArr = [];
    let articlesArr = [];
    let ctasArr = [];

    try {
      const runArticleWithTimeout = () => {
        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => {
            articlesTimedOutRef.current = true;
            setRelatedContentSteps((prev) =>
              prev.map((s) => (s.id === 'articles' ? { ...s, status: RelatedContentStepStatus.SKIPPED } : s))
            );
            resolve([]);
          }, ONBOARDING_ARTICLES_TIMEOUT_MS);
        });
        return Promise.race([runArticleStream(), timeoutPromise]);
      };

      const [ctas, tweetsVideosResult, articlesResult] = await Promise.all([
        runFetchCTAs(),
        runTweetsAndVideos(),
        runArticleWithTimeout(),
      ]);
      ctasArr = Array.isArray(ctas) ? ctas : (initialCtas && initialCtas.length) ? initialCtas : [];
      tweetsArr = Array.isArray(tweetsVideosResult?.[0]) ? tweetsVideosResult[0] : [];
      videosArr = Array.isArray(tweetsVideosResult?.[1]) ? tweetsVideosResult[1] : [];
      articlesArr = Array.isArray(articlesResult) ? articlesResult : [];
    } catch (_) {
      // One of the prep steps failed (e.g. network); continue with empty data so blog generation can still run
      ctasArr = (initialCtas && initialCtas.length) ? initialCtas : [];
      tweetsArr = [];
      videosArr = [];
      articlesArr = [];
    }

    try {
      const enhancementOptions = {
        organizationId,
        preloadedTweets: tweetsArr,
        preloadedArticles: articlesArr,
        preloadedVideos: videosArr,
        ctas: ctasArr.length ? ctasArr : (initialCtas || []),
      };

      const { connectionId } = await contentAPI.startBlogStream(
        selectedTopic,
        websiteAnalysisData,
        null,
        {},
        enhancementOptions
      );
      setRelatedContentSteps([]);

      const { close } = api.connectToStream(connectionId, {
        onChunk: (data) => {
          const chunk = getStreamChunkContentOnly(data);
          if (chunk) setContent((prev) => prev + chunk);
        },
        onComplete: (data) => {
          const full = extractStreamCompleteContent(data);
          if (full) setContent(full);
          setGenerationComplete(true);
          setLiveStreaming(false);
        },
        onError: (errData) => {
          setLiveStreamError(errData?.message || 'Stream error');
          setLiveStreaming(false);
        },
      });
      streamClosesRef.current.push(close);
    } catch (err) {
      setLiveStreamError(err?.message || 'Failed to start stream');
      setLiveStreaming(false);
      setRelatedContentSteps([]);
    }
  }, [
    selectedTopic,
    organizationId,
    websiteAnalysisData,
    initialCtas,
    runFetchCTAs,
    runTweetsAndVideos,
    runArticleStream,
  ]);

  useEffect(() => {
    if (!selectedTopic || !organizationId || startedRef.current) return;
    startedRef.current = true;
    startGeneration();
    return () => {
      streamClosesRef.current.forEach((close) => { if (typeof close === 'function') close(); });
      streamClosesRef.current = [];
    };
  }, [selectedTopic, organizationId, startGeneration]);

  const normalizedContent = normalizeContentString(content);

  const handleCopyPost = useCallback(async () => {
    const toCopy = normalizedContent || content || '';
    if (!toCopy.trim()) {
      message.info('Nothing to copy yet');
      return;
    }
    try {
      await navigator.clipboard.writeText(toCopy);
      message.success('Post copied to clipboard');
    } catch {
      message.error('Failed to copy to clipboard');
    }
  }, [normalizedContent, content]);

  return (
    <section style={{ marginTop: 48, marginBottom: 48 }}>
      <Title level={4} style={{ marginBottom: 16 }}>
        Generating your article
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        We're drafting your post based on "{selectedTopic?.title || 'your topic'}". You'll see it appear below as it's written.
      </Text>

      {liveStreaming && relatedContentSteps.length > 0 && (
        <RelatedContentStepsPanel
          steps={relatedContentSteps}
          title="Preparing related content"
          ctas={organizationCTAs}
        />
      )}

      {liveStreamError && (
        <Alert
          type="error"
          message={liveStreamError}
          closable
          onClose={() => setLiveStreamError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Card
        size="small"
        title="Your post"
        extra={
          (normalizedContent || content || '').trim() ? (
            <Button type="default" icon={<CopyOutlined />} onClick={handleCopyPost} size="small">
              Copy post
            </Button>
          ) : null
        }
        style={{ marginTop: 16 }}
      >
        <StreamingPreview
          content={normalizedContent || (liveStreaming ? 'Drafting your post…' : '')}
          relatedArticles={relatedArticles}
          relatedVideos={relatedVideos}
          relatedTweets={relatedTweets}
          heroImageUrl={selectedTopic?.image || undefined}
          ctas={organizationCTAs}
          generationComplete={generationComplete}
          style={{ minHeight: 120 }}
        />
      </Card>
    </section>
  );
}
