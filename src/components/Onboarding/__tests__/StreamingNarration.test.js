import React from 'react';
import { render, screen, act } from '@testing-library/react';
import StreamingNarration from '../StreamingNarration';

describe('StreamingNarration', () => {
  it('renders content', () => {
    render(<StreamingNarration content="I analyzed your site." isStreaming={false} />);
    expect(screen.getByText('I analyzed your site.')).toBeInTheDocument();
  });

  it('renders loading state when streaming and no content', () => {
    render(<StreamingNarration content="" isStreaming={true} />);
    expect(screen.getByTestId('narration-loading')).toBeInTheDocument();
    expect(screen.getByText(/Preparing your personalized message/)).toBeInTheDocument();
  });

  it('renders fallback when no content and not streaming', () => {
    render(<StreamingNarration content="" isStreaming={false} />);
    expect(screen.getByText(/Something went wrong loading/)).toBeInTheDocument();
  });

  it('calls onComplete when not streaming after min time', async () => {
    jest.useFakeTimers();
    const onComplete = jest.fn();
    render(
      <StreamingNarration
        content="Done."
        isStreaming={false}
        onComplete={onComplete}
        minimumDisplayTime={10}
      />
    );
    expect(onComplete).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(15);
    });
    expect(onComplete).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('has data-testid', () => {
    render(<StreamingNarration content="Hi" dataTestId="narration-1" />);
    expect(screen.getByTestId('narration-1')).toBeInTheDocument();
  });
});
