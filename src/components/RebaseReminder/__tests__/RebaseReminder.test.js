import React from 'react';
import { render, screen } from '@testing-library/react';
import RebaseReminder from '../RebaseReminder';

describe('RebaseReminder', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  it('renders nothing when not in development mode', () => {
    process.env.NODE_ENV = 'test';
    render(<RebaseReminder />);
    expect(screen.queryByTestId('rebase-reminder')).not.toBeInTheDocument();
  });

  it('renders nothing when NODE_ENV is production', () => {
    process.env.NODE_ENV = 'production';
    render(<RebaseReminder />);
    expect(screen.queryByTestId('rebase-reminder')).not.toBeInTheDocument();
  });

  it('renders banner when in development and behind staging', async () => {
    process.env.NODE_ENV = 'development';
    process.env.REACT_APP_GIT_COMMIT_SHA = 'abc123def456';

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ behind_by: 3, ahead_by: 1 }),
    });
    global.fetch = mockFetch;

    render(<RebaseReminder />);

    await screen.findByTestId('rebase-reminder');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/compare/staging...abc123def456'),
      expect.any(Object)
    );
    expect(screen.getByText(/staging has 3 new commits/)).toBeInTheDocument();
    expect(screen.getByText(/Copy-paste prompt for Claude Code/)).toBeInTheDocument();
    expect(screen.getByText(/If rebase does not work/)).toBeInTheDocument();
  });

  it('renders nothing when behind_by is 0', async () => {
    process.env.NODE_ENV = 'development';
    process.env.REACT_APP_GIT_COMMIT_SHA = 'abc123def456';

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ behind_by: 0, ahead_by: 2 }),
    });

    render(<RebaseReminder />);

    await new Promise((r) => setTimeout(r, 100));

    expect(screen.queryByTestId('rebase-reminder')).not.toBeInTheDocument();
  });

  it('renders nothing when REACT_APP_GIT_COMMIT_SHA is dev', async () => {
    process.env.NODE_ENV = 'development';
    process.env.REACT_APP_GIT_COMMIT_SHA = 'dev';

    const mockFetch = jest.fn();
    global.fetch = mockFetch;

    render(<RebaseReminder />);

    await new Promise((r) => setTimeout(r, 150));

    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.queryByTestId('rebase-reminder')).not.toBeInTheDocument();
  });
});
