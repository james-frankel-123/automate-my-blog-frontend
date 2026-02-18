import React from 'react';
import { render, screen } from '@testing-library/react';
import InsightBadge from '../InsightBadge';

describe('InsightBadge', () => {
  it('renders label for known reason', () => {
    render(<InsightBadge reason="trending" detail="Rising search interest" />);
    expect(screen.getByText('Trending Now')).toBeInTheDocument();
  });

  it('renders fallback label for unknown reason', () => {
    render(<InsightBadge reason="unknown" detail="Some detail" />);
    expect(screen.getByText('Recommended')).toBeInTheDocument();
  });

  it('renders all reason labels correctly', () => {
    const { rerender } = render(<InsightBadge reason="search_opportunity" detail="" />);
    expect(screen.getByText('Search Opportunity')).toBeInTheDocument();
    rerender(<InsightBadge reason="high_converting" detail="" />);
    expect(screen.getByText('High Converting')).toBeInTheDocument();
    rerender(<InsightBadge reason="content_gap" detail="" />);
    expect(screen.getByText('Content Gap')).toBeInTheDocument();
    rerender(<InsightBadge reason="audience_match" detail="" />);
    expect(screen.getByText('Audience Match')).toBeInTheDocument();
  });

  it('renders with detail (tooltip content)', () => {
    render(<InsightBadge reason="trending" detail="Rising search interest" />);
    expect(screen.getByText('Trending Now')).toBeInTheDocument();
  });
});
