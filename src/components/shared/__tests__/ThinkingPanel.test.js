/**
 * ThinkingPanel — shared "thinking" UX for analysis and content generation.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ThinkingPanel from '../ThinkingPanel';

const defaultLabels = {
  workingForYouLabel: 'Working for you',
  progressPreamble: 'Right now:',
  progressLabel: "What we're doing:",
};

describe('ThinkingPanel', () => {
  it('returns null when not active and no progress/thoughts', () => {
    render(<ThinkingPanel {...defaultLabels} />);
    expect(screen.queryByTestId('thinking-panel')).not.toBeInTheDocument();
  });

  it('renders when isActive is true with fallback step', () => {
    render(
      <ThinkingPanel
        {...defaultLabels}
        isActive
        fallbackStep="Drafting your post…"
      />
    );
    expect(screen.getByTestId('thinking-panel')).toBeInTheDocument();
    expect(screen.getByText(/Right now:.*Drafting your post…/)).toBeInTheDocument();
    expect(screen.getByText('Working for you')).toBeInTheDocument();
  });

  it('renders current step, progress bar, and ETA', () => {
    render(
      <ThinkingPanel
        {...defaultLabels}
        isActive
        currentStep="Reading your pages…"
        progress={45}
        estimatedTimeRemaining={30}
      />
    );
    expect(screen.getByText(/Right now:.*Reading your pages…/)).toBeInTheDocument();
    expect(screen.getByText(/~30 seconds remaining/)).toBeInTheDocument();
  });

  it('renders thought list when thoughts and progressLabel provided', () => {
    const thoughts = [
      { message: 'Fetching homepage' },
      { message: 'Parsing content' },
    ];
    render(
      <ThinkingPanel
        {...defaultLabels}
        isActive
        currentStep="Analyzing…"
        progress={50}
        thoughts={thoughts}
      />
    );
    expect(screen.getByText("What we're doing:")).toBeInTheDocument();
    expect(screen.getByText('Fetching homepage')).toBeInTheDocument();
    expect(screen.getByText('Parsing content')).toBeInTheDocument();
  });

  it('uses dataTestId when provided', () => {
    render(
      <ThinkingPanel
        {...defaultLabels}
        isActive
        fallbackStep="…"
        dataTestId="website-analysis-progress"
      />
    );
    expect(screen.getByTestId('website-analysis-progress')).toBeInTheDocument();
  });

  it('appends phase/detail to step line when provided', () => {
    render(
      <ThinkingPanel
        {...defaultLabels}
        isActive
        currentStep="Reading your pages…"
        phase="scraping"
      />
    );
    expect(screen.getByText(/— scraping/)).toBeInTheDocument();
  });
});
