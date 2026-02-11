import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WebsiteInputSection from '../WebsiteInputSection';

jest.mock('../../../copy/systemVoice', () => ({
  systemVoice: {
    analysis: {
      inputPlaceholder: 'Enter website URL',
      analyzing: 'Analyzing…',
      analyze: 'Analyze',
      workingForYou: 'Working for you',
      progressPreamble: 'Right now:',
      progressLabel: 'Progress',
      defaultProgress: 'Reading your site…',
    },
  },
}));

jest.mock('../../shared/ThinkingPanel', () => function MockThinkingPanel() {
  return <div data-testid="thinking-panel-mock">Thinking</div>;
});

describe('WebsiteInputSection', () => {
  it('renders URL input and analyze button', () => {
    render(
      <WebsiteInputSection
        websiteUrl=""
        setWebsiteUrl={() => {}}
        onAnalyze={() => {}}
        headerAnimationComplete
      />
    );
    expect(screen.getByTestId('website-url-input')).toBeInTheDocument();
    expect(screen.getByTestId('analyze-button')).toBeInTheDocument();
  });

  it('disables button when URL is empty', () => {
    render(
      <WebsiteInputSection
        websiteUrl=""
        setWebsiteUrl={() => {}}
        onAnalyze={() => {}}
        headerAnimationComplete
      />
    );
    expect(screen.getByTestId('analyze-button')).toBeDisabled();
  });

  it('calls onAnalyze when form is submitted with URL', async () => {
    const onAnalyze = jest.fn();
    render(
      <WebsiteInputSection
        websiteUrl="https://example.com"
        setWebsiteUrl={() => {}}
        onAnalyze={onAnalyze}
        headerAnimationComplete
      />
    );
    await userEvent.click(screen.getByTestId('analyze-button'));
    expect(onAnalyze).toHaveBeenCalledWith('https://example.com');
  });
});
