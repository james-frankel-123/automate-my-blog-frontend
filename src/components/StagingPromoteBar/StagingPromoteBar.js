/**
 * StagingPromoteBar - Shown only on staging deployments.
 * Displays a footer bar with a link to the open staging → main PR so users can promote to production.
 */
import React, { useState, useEffect } from 'react';
import { Modal } from 'antd';

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

function formatCommitDate(isoDate) {
  if (!isoDate) return '';
  try {
    const d = new Date(isoDate);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    return d.toLocaleDateString();
  } catch {
    return isoDate;
  }
}

const StagingPromoteBar = () => {
  const isStaging = process.env.REACT_APP_STAGING === 'true';
  const [prUrl, setPrUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const buildTimeSec = process.env.REACT_APP_BUILD_TIME ? parseInt(process.env.REACT_APP_BUILD_TIME, 10) : null;
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [changesModalOpen, setChangesModalOpen] = useState(false);
  const [buildChanges, setBuildChanges] = useState([]);
  const [changesLoading, setChangesLoading] = useState(false);
  const [changesError, setChangesError] = useState(null);

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

  // Fetch commits in this build when "Show changes" modal is opened (main...commitSha or main...staging)
  useEffect(() => {
    if (!changesModalOpen || !isStaging || typeof window === 'undefined') return;
    const commitSha = process.env.REACT_APP_GIT_COMMIT_SHA || 'dev';
    const head = commitSha === 'dev' ? 'staging' : commitSha;
    let cancelled = false;
    setChangesLoading(true);
    setChangesError(null);
    const url = `${GITHUB_API_BASE}/${REPO}/compare/main...${head}`;
    fetch(url, { headers: { Accept: 'application/vnd.github.v3+json' } })
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Compare not found' : `HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const commits = (data.commits || []).map((c) => ({
          sha: c.sha,
          shortSha: (c.sha || '').slice(0, 7),
          message: (c.commit?.message || '').split('\n')[0].trim(),
          author: c.commit?.author?.name || 'Unknown',
          date: c.commit?.author?.date,
          url: c.html_url,
        }));
        setBuildChanges(commits);
      })
      .catch((err) => {
        if (!cancelled) setChangesError(err.message || 'Failed to load changes');
        setBuildChanges([]);
      })
      .finally(() => {
        if (!cancelled) setChangesLoading(false);
      });
    return () => { cancelled = true; };
  }, [changesModalOpen, isStaging]);

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
        color: 'var(--color-text-on-primary)',
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
      <button
        type="button"
        onClick={() => setChangesModalOpen(true)}
        style={{
          background: 'var(--color-overlay-on-primary)',
          border: '1px solid rgba(255,255,255,0.5)',
          borderRadius: 4,
          color: 'var(--color-text-on-primary)',
          cursor: 'pointer',
          fontSize: 13,
          padding: '4px 10px',
        }}
      >
        Show changes in this build
      </button>
      {loading ? (
        <span>Loading…</span>
      ) : (
        <a
          href={promoteUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--color-text-on-primary)',
            fontWeight: 600,
            textDecoration: 'underline',
          }}
        >
          {prUrl ? 'Promote to production →' : 'Open staging → main PR'}
        </a>
      )}
      <Modal
        title="Changes in this build"
        open={changesModalOpen}
        onCancel={() => setChangesModalOpen(false)}
        footer={null}
        width={560}
        styles={{ body: { maxHeight: '70vh', overflow: 'auto' } }}
      >
        {changesLoading && <p style={{ color: 'var(--color-text-secondary, #666)' }}>Loading changes…</p>}
        {changesError && (
          <p style={{ color: 'var(--color-error, #c00)' }}>
            {changesError}. The repo may be private or the compare range is not available.
          </p>
        )}
        {!changesLoading && !changesError && buildChanges.length === 0 && (
          <p style={{ color: 'var(--color-text-secondary, #666)' }}>No commits in this build (staging is even with main).</p>
        )}
        {!changesLoading && buildChanges.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {buildChanges.map((c) => (
              <li
                key={c.sha}
                style={{
                  borderBottom: '1px solid var(--color-border, #eee)',
                  padding: '10px 0',
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: 4 }}>{c.message || '(no message)'}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary, #666)' }}>
                  <code style={{ marginRight: 8 }}>{c.shortSha}</code>
                  {c.author}
                  {c.date && ` · ${formatCommitDate(c.date)}`}
                  {c.url && (
                    <>
                      {' · '}
                      <a href={c.url} target="_blank" rel="noopener noreferrer">
                        View commit
                      </a>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
};

export default StagingPromoteBar;
