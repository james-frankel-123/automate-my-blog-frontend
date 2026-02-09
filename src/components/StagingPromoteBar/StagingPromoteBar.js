/**
 * StagingPromoteBar - Shown only on staging deployments.
 * Displays a footer bar with a link to the open staging → main PR so users can promote to production.
 */
import React, { useState, useEffect } from 'react';

const GITHUB_API_BASE = 'https://api.github.com/repos';
const REPO = process.env.REACT_APP_GITHUB_REPO || 'Automate-My-Blog/automate-my-blog-frontend';
const REPO_OWNER = REPO.split('/')[0];

function deployedAgo(buildTimeSec, nowSec) {
  if (!buildTimeSec) return null;
  const diffSec = Math.max(0, (nowSec || Math.floor(Date.now() / 1000)) - buildTimeSec);
  if (diffSec < 60) return 'deployed just now';
  if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60);
    return `deployed ${m} minute${m === 1 ? '' : 's'} ago`;
  }
  const h = Math.floor(diffSec / 3600);
  return `deployed ${h} hour${h === 1 ? '' : 's'} ago`;
}

const StagingPromoteBar = () => {
  const isStaging = process.env.REACT_APP_STAGING === 'true';
  const [prUrl, setPrUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const buildTimeSec = process.env.REACT_APP_BUILD_TIME ? parseInt(process.env.REACT_APP_BUILD_TIME, 10) : null;
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    if (!buildTimeSec) return;
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 60_000);
    return () => clearInterval(id);
  }, [buildTimeSec]);

  // Reserve space at bottom so content isn't hidden behind the bar
  useEffect(() => {
    if (!isStaging || typeof document === 'undefined') return;
    const prev = document.body.style.paddingBottom;
    document.body.style.paddingBottom = '48px';
    return () => {
      document.body.style.paddingBottom = prev || '';
    };
  }, [isStaging]);

  useEffect(() => {
    if (!isStaging || typeof window === 'undefined') return;
    let cancelled = false;
    const fetchPr = async () => {
      try {
        const res = await fetch(
          `${GITHUB_API_BASE}/${REPO}/pulls?base=main&head=${REPO_OWNER}:staging&state=open`,
          { headers: { Accept: 'application/vnd.github.v3+json' } }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setPrUrl(data[0].html_url);
        }
      } catch (_) {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPr();
    return () => { cancelled = true; };
  }, [isStaging]);

  if (!isStaging) return null;

  const promoteUrl =
    prUrl ||
    `https://github.com/${REPO}/compare/main...staging`;
  const commitSha = process.env.REACT_APP_GIT_COMMIT_SHA || 'dev';
  const shortSha = commitSha === 'dev' ? 'dev' : commitSha.slice(0, 7);

  return (
    <div
      role="banner"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '8px 16px',
        background: 'var(--color-primary, #6366F1)',
        color: '#fff',
        fontSize: 14,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <span style={{ fontWeight: 600 }}>Staging</span>
      <span style={{ opacity: 0.9 }}>|</span>
      <span style={{ fontFamily: 'monospace', fontSize: 12 }} title={commitSha}>{shortSha}</span>
      <span style={{ opacity: 0.9 }}>|</span>
      {(() => {
        const ago = deployedAgo(buildTimeSec, now);
        return ago ? (
          <>
            <span style={{ opacity: 0.9 }}>{ago}</span>
            <span style={{ opacity: 0.9 }}>|</span>
          </>
        ) : null;
      })()}
      {loading ? (
        <span>Loading…</span>
      ) : (
        <a
          href={promoteUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#fff',
            fontWeight: 600,
            textDecoration: 'underline',
          }}
        >
          {prUrl ? 'Promote to production →' : 'Open staging → main PR'}
        </a>
      )}
    </div>
  );
};

export default StagingPromoteBar;
