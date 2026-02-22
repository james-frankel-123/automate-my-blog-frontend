import React from 'react';
import { render, screen } from '@testing-library/react';
import RecommendationCard from '../RecommendationCard';

describe('RecommendationCard', () => {
  it('renders description', () => {
    render(<RecommendationCard description="Create content around this topic" />);
    expect(screen.getByText('Create content around this topic')).toBeInTheDocument();
  });

  it('renders impact tag when impact is provided', () => {
    render(
      <RecommendationCard
        description="Test"
        impact="high"
      />
    );
    expect(screen.getByText('HIGH IMPACT')).toBeInTheDocument();
  });

  it('renders action when provided', () => {
    render(
      <RecommendationCard
        description="Test"
        action="Write a blog post this week"
      />
    );
    expect(screen.getByText(/Recommended Action:/)).toBeInTheDocument();
    expect(screen.getByText(/Write a blog post this week/)).toBeInTheDocument();
  });

  it('renders result when provided', () => {
    render(
      <RecommendationCard
        description="Test"
        result="Increase organic traffic"
      />
    );
    expect(screen.getByText(/Expected Result:/)).toBeInTheDocument();
    expect(screen.getByText(/Increase organic traffic/)).toBeInTheDocument();
  });

  it('renders all sections when all props provided', () => {
    render(
      <RecommendationCard
        description="Topic is trending"
        impact="medium"
        action="Publish soon"
        result="Better rankings"
      />
    );
    expect(screen.getByText('Topic is trending')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM IMPACT')).toBeInTheDocument();
    expect(screen.getByText(/Publish soon/)).toBeInTheDocument();
    expect(screen.getByText(/Better rankings/)).toBeInTheDocument();
  });
});
