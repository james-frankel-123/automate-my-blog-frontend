/**
 * useNarrativeStream — Hook for narrative-driven website analysis streaming (Issue #157, #261).
 * Connects to GET /api/v1/jobs/:jobId/narrative-stream and accumulates
 * analysis status updates (analysis-status-update; legacy: scraping-thought), short opening (analysis-chunk),
 * insight cards (insight-card, 4–6 total), then narrative-complete and complete for 3-moment UX.
 *
 * @param {string|null} jobId - Job ID from website analysis job
 * @returns {{ scrapingNarrative: string, analysisNarrative: string, insightCards: Array<{ title?: string, content?: string, text?: string }>, currentMoment: string, isStreaming: boolean, narrativeAvailable: boolean }}
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import jobsAPI from '../services/jobsAPI';

const MOMENTS = {
  SCRAPING: 'scraping',
  TRANSITION: 'transition',
  ANALYSIS: 'analysis',
  AUDIENCES: 'audiences',
};

export function useNarrativeStream(jobId) {
  const [scrapingNarrative, setScrapingNarrative] = useState('');
  const [analysisNarrative, setAnalysisNarrative] = useState('');
  const [insightCards, setInsightCards] = useState([]);
  const [currentMoment, setCurrentMoment] = useState(MOMENTS.SCRAPING);
  const [isStreaming, setIsStreaming] = useState(false);
  const [narrativeAvailable, setNarrativeAvailable] = useState(true);
  const abortRef = useRef(null);
  const startedRef = useRef(false);

  const startStream = useCallback(() => {
    if (!jobId || startedRef.current) return;
    startedRef.current = true;
    setScrapingNarrative('');
    setAnalysisNarrative('');
    setInsightCards([]);
    setCurrentMoment(MOMENTS.SCRAPING);
    setIsStreaming(true);
    setNarrativeAvailable(true);

    abortRef.current = new AbortController();

    jobsAPI
      .connectToNarrativeStream(
        jobId,
        {
          onScrapingThought: (data) => {
            const content = data.content ?? data.message ?? '';
            if (content) {
              setScrapingNarrative((prev) => prev + content + (content.endsWith(' ') ? '' : ' '));
            }
            setCurrentMoment(MOMENTS.SCRAPING);
          },
          onTransition: () => {
            setCurrentMoment(MOMENTS.TRANSITION);
            setTimeout(() => setCurrentMoment(MOMENTS.ANALYSIS), 500);
          },
          onAnalysisChunk: (data) => {
            const content = data.content ?? data.message ?? data.text ?? '';
            if (content) {
              setAnalysisNarrative((prev) => prev + content);
            }
            setCurrentMoment(MOMENTS.ANALYSIS);
          },
          onInsightCard: (data) => {
            const card = {
              title: data.title ?? data.heading ?? '',
              content: data.content ?? data.text ?? data.body ?? '',
            };
            if (card.title || card.content) {
              setInsightCards((prev) => [...prev, card]);
            }
            setCurrentMoment(MOMENTS.ANALYSIS);
          },
          onNarrativeComplete: () => {
            setCurrentMoment(MOMENTS.ANALYSIS);
          },
          onComplete: () => {
            setIsStreaming(false);
            setCurrentMoment(MOMENTS.AUDIENCES);
          },
          onError: () => {
            setNarrativeAvailable(false);
          },
        },
        { signal: abortRef.current?.signal }
      )
      .then(({ available }) => {
        setNarrativeAvailable(available);
        setIsStreaming(false);
        if (available) {
          setCurrentMoment(MOMENTS.AUDIENCES);
        }
      })
      .catch(() => {
        setNarrativeAvailable(false);
        setIsStreaming(false);
      })
      .finally(() => {
        startedRef.current = false;
      });
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;
    startStream();
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [jobId, startStream]);

  return {
    scrapingNarrative,
    analysisNarrative,
    insightCards,
    currentMoment,
    isStreaming,
    narrativeAvailable,
  };
}

export { MOMENTS };
