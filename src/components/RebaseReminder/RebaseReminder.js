/**
 * RebaseReminder - Dev-only component that checks for new commits on main
 * and encourages users to rebase. Includes copy-paste prompts for Claude Code.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Button, Collapse, Typography } from 'antd';
import { BranchesOutlined, CopyOutlined } from '@ant-design/icons';

const GITHUB_API_BASE = 'https://api.github.com/repos';
const REPO = process.env.REACT_APP_GITHUB_REPO || 'Automate-My-Blog/automate-my-blog-frontend';
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const REBASE_PROMPT = `Please help me rebase my current branch onto the latest main from the GitHub repository. I want to:

1. Fetch the latest changes from origin: \`git fetch origin main\`
2. Rebase my current branch onto origin/main, applying my changes on top: \`git rebase origin/main\`
3. If there are conflicts, help me resolve them while preserving my intended changes
4. After a successful rebase, force-push if I've already pushed this branch: \`git push --force-with-lease\`

If the rebase fails or conflicts are too complex, suggest:
- Create a backup branch first: \`git branch backup-$(date +%Y%m%d-%H%M)\`
- Abort the rebase: \`git rebase --abort\`
- Merge main instead: \`git merge origin/main\`
- Resolve any merge conflicts, then commit`;

const DEMO_PARAM = 'demo=rebase';

const RebaseReminder = () => {
  const isDemo =
    process.env.NODE_ENV === 'development' &&
    typeof window !== 'undefined' &&
    window.location?.search?.includes(DEMO_PARAM);

  const [behindBy, setBehindBy] = useState(isDemo ? 3 : null);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  const checkForUpdates = useCallback(async () => {
    const demoMode =
      typeof window !== 'undefined' && window.location?.search?.includes(DEMO_PARAM);
    if (demoMode) return; // Keep demo state
    const currentSha = process.env.REACT_APP_GIT_COMMIT_SHA;
    if (!currentSha || currentSha === 'dev') {
      return;
    }
    try {
      const res = await fetch(
        `${GITHUB_API_BASE}/${REPO}/compare/main...${currentSha}`,
        { headers: { Accept: 'application/vnd.github.v3+json' } }
      );
      if (!res.ok) {
        if (res.status === 404) {
          return; // SHA not found (e.g. local-only commit), silently skip
        }
        throw new Error(`GitHub API ${res.status}`);
      }
      const data = await res.json();
      const behind = data.behind_by ?? 0;
      setBehindBy(behind > 0 ? behind : null);
    } catch {
      setBehindBy(null);
    }
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    checkForUpdates();
    const id = setInterval(checkForUpdates, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [checkForUpdates]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(REBASE_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (process.env.NODE_ENV !== 'development') return null;
  if (dismissed || !behindBy) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        maxWidth: 560,
        margin: '0 auto',
        zIndex: 999,
        boxShadow: 'var(--shadow-md)',
        backgroundColor: 'var(--color-bg-container)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
      data-testid="rebase-reminder"
    >
      <Alert
        type="warning"
        message={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BranchesOutlined />
            <strong>main has {behindBy} new commit{behindBy > 1 ? 's' : ''}</strong>
            — consider rebasing to stay up to date
          </span>
        }
        description={
          <div style={{ marginTop: 8 }}>
            <Typography.Paragraph style={{ marginBottom: 8, fontSize: 13 }}>
              Copy the prompt below and paste it into Claude Code (or another AI coding assistant)
              to rebase your branch onto main safely.
            </Typography.Paragraph>
            <Collapse
              size="small"
              items={[
                {
                  key: 'prompt',
                  label: 'Copy-paste prompt for Claude Code',
                  children: (
                    <pre
                      style={{
                        margin: 0,
                        padding: 12,
                        background: 'var(--color-secondary)',
                        borderRadius: 4,
                        fontSize: 12,
                        overflow: 'auto',
                        maxHeight: 240,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {REBASE_PROMPT}
                    </pre>
                  ),
                },
                {
                  key: 'fallback',
                  label: 'If rebase does not work',
                  children: (
                    <Typography.Paragraph style={{ marginBottom: 0, fontSize: 13 }}>
                      Create a backup branch, abort the rebase, then merge main instead: <code>git merge origin/main</code>.
                      Resolve conflicts manually and commit. You can always cherry-pick your changes onto a fresh branch if needed.
                    </Typography.Paragraph>
                  ),
                },
              ]}
              style={{ marginBottom: 8 }}
            />
            <Button
              type="primary"
              size="small"
              icon={<CopyOutlined />}
              onClick={handleCopy}
              style={{ marginTop: 4 }}
            >
              {copied ? 'Copied!' : 'Copy prompt'}
            </Button>
          </div>
        }
        closable
        onClose={() => setDismissed(true)}
        showIcon
      />
    </div>
  );
};

export default RebaseReminder;
