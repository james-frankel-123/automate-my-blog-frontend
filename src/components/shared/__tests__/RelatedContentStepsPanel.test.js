import React from 'react';
import { render, screen } from '@testing-library/react';
import RelatedContentStepsPanel, { STATUS } from '../RelatedContentStepsPanel';

describe('RelatedContentStepsPanel', () => {
  it('renders nothing when steps is empty', () => {
    render(<RelatedContentStepsPanel steps={[]} />);
    expect(screen.queryByTestId('related-content-steps-panel')).not.toBeInTheDocument();
  });

  it('renders steps with correct labels for each status', () => {
    const steps = [
      { id: 'tweets', label: 'Fetching related tweets…', status: STATUS.RUNNING },
      { id: 'articles', label: 'Fetching related news articles…', status: STATUS.DONE, count: 5 },
      { id: 'videos', label: 'Fetching related videos…', status: STATUS.PENDING },
    ];
    render(<RelatedContentStepsPanel steps={steps} />);
    expect(screen.getByText(/Fetching related tweets/)).toBeInTheDocument();
    expect(screen.getByText(/Found 5/)).toBeInTheDocument();
    expect(screen.getByText(/Fetching related videos/)).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    const steps = [{ id: 'tweets', label: 'Fetching…', status: STATUS.PENDING }];
    render(<RelatedContentStepsPanel steps={steps} title="Preparing content" />);
    expect(screen.getByText('Preparing content')).toBeInTheDocument();
  });

  it('has data-testid for e2e', () => {
    const steps = [{ id: 'tweets', label: 'Fetching…', status: STATUS.PENDING }];
    render(<RelatedContentStepsPanel steps={steps} />);
    expect(screen.getByTestId('related-content-steps-panel')).toBeInTheDocument();
  });

  it('renders CTAs when ctas prop is provided', () => {
    const steps = [{ id: 'ctas', label: 'Fetching CTAs…', status: STATUS.DONE, count: 2 }];
    const ctas = [
      { text: 'Book a Demo', href: 'https://example.com/demo' },
      { text: 'Contact Us', href: '/contact' },
    ];
    render(<RelatedContentStepsPanel steps={steps} ctas={ctas} />);
    expect(screen.getByTestId('related-content-ctas')).toBeInTheDocument();
    expect(screen.getByText('Book a Demo')).toBeInTheDocument();
    expect(screen.getByText('Contact Us')).toBeInTheDocument();
  });
});
