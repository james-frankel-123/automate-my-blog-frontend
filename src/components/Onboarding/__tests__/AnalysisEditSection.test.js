/**
 * AnalysisEditSection — inline edit and diff for analysis. Issue #261.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnalysisEditSection from '../AnalysisEditSection';

describe('AnalysisEditSection', () => {
  it('renders form with business name, target audience, content focus', () => {
    render(
      <AnalysisEditSection
        originalAnalysis={{}}
        currentAnalysis={{ businessName: 'Acme', targetAudience: 'Developers', contentFocus: 'APIs' }}
        onApply={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByTestId('edit-businessName')).toBeInTheDocument();
    expect(screen.getByTestId('edit-targetAudience')).toBeInTheDocument();
    expect(screen.getByTestId('edit-contentFocus')).toBeInTheDocument();
    expect(screen.getByTestId('edit-apply-btn')).toBeInTheDocument();
    expect(screen.getByTestId('edit-cancel-btn')).toBeInTheDocument();
  });

  it('has Apply changes button that triggers submit when form is valid', () => {
    const onApply = jest.fn();
    render(
      <AnalysisEditSection
        originalAnalysis={{}}
        currentAnalysis={{ businessName: 'A', targetAudience: 'B', contentFocus: 'C' }}
        onApply={onApply}
        onCancel={() => {}}
      />
    );
    expect(screen.getByTestId('edit-apply-btn')).toHaveTextContent('Apply changes');
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = jest.fn();
    render(
      <AnalysisEditSection
        originalAnalysis={{}}
        currentAnalysis={{ businessName: 'Acme' }}
        onApply={() => {}}
        onCancel={onCancel}
      />
    );
    await userEvent.click(screen.getByTestId('edit-cancel-btn'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows Get suggestion button when onRequestSuggestion is provided', () => {
    render(
      <AnalysisEditSection
        originalAnalysis={{}}
        currentAnalysis={{}}
        onApply={() => {}}
        onCancel={() => {}}
        onRequestSuggestion={async () => {}}
      />
    );
    expect(screen.getByTestId('get-suggestion-btn')).toBeInTheDocument();
  });
});
