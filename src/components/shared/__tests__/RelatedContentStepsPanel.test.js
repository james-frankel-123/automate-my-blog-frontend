import React from 'react';
import { render, screen } from '@testing-library/react';
import RelatedContentStepsPanel, { STATUS } from '../RelatedContentStepsPanel';

describe('RelatedContentStepsPanel', () => {
  it('renders nothing when steps is empty', () => {
    const { container } = render(<RelatedContentStepsPanel steps={[]} />);
    expect(container.firstChild).toBeNull();
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
});
