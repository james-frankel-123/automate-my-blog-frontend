/**
 * AnalysisSectionNav — granular in-page navigation for website analysis (Issue #168).
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalysisSectionNav, AnalysisSectionNavHorizontal } from '../AnalysisSectionNav';

const mockSections = [
  { id: 'analysis-narrative', label: 'Narrative' },
  { id: 'analysis-target-audience', label: 'Target Audience' },
  { id: 'analysis-business-model', label: 'Business Model' },
];

describe('AnalysisSectionNav', () => {
  beforeEach(() => {
    const mockScrollIntoView = jest.fn();
    jest.spyOn(document, 'getElementById').mockImplementation((id) => {
      const el = document.createElement('div');
      el.id = id;
      el.scrollIntoView = mockScrollIntoView;
      return el;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns null when sections is empty', () => {
    const { container } = render(<AnalysisSectionNav sections={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders section links with correct labels and testids', () => {
    render(<AnalysisSectionNav sections={mockSections} />);
    expect(screen.getByTestId('analysis-nav-analysis-narrative')).toHaveTextContent('Narrative');
    expect(screen.getByTestId('analysis-nav-analysis-target-audience')).toHaveTextContent('Target Audience');
    expect(screen.getByTestId('analysis-nav-analysis-business-model')).toHaveTextContent('Business Model');
  });

  it('has accessible navigation role and label', () => {
    render(<AnalysisSectionNav sections={mockSections} />);
    const nav = screen.getByRole('navigation', { name: 'Analysis sections' });
    expect(nav).toBeInTheDocument();
  });

  it('calls onSectionClick and scrollIntoView when a section is clicked', () => {
    const onSectionClick = jest.fn();
    render(<AnalysisSectionNav sections={mockSections} onSectionClick={onSectionClick} />);

    const targetAudienceBtn = screen.getByTestId('analysis-nav-analysis-target-audience');
    fireEvent.click(targetAudienceBtn);

    expect(onSectionClick).toHaveBeenCalledWith('analysis-target-audience');
    const el = document.getElementById('analysis-target-audience');
    expect(el).toBeTruthy();
    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });
});

describe('AnalysisSectionNavHorizontal', () => {
  beforeEach(() => {
    jest.spyOn(document, 'getElementById').mockImplementation((id) => {
      const el = document.createElement('div');
      el.id = id;
      el.scrollIntoView = jest.fn();
      return el;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns null when sections is empty', () => {
    const { container } = render(<AnalysisSectionNavHorizontal sections={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders horizontal nav with section buttons', () => {
    render(<AnalysisSectionNavHorizontal sections={mockSections} />);
    expect(screen.getByTestId('analysis-nav-analysis-narrative')).toHaveTextContent('Narrative');
    expect(screen.getByTestId('analysis-nav-analysis-business-model')).toHaveTextContent('Business Model');
  });

  it('calls onSectionClick when a section is clicked', () => {
    const onSectionClick = jest.fn();
    render(<AnalysisSectionNavHorizontal sections={mockSections} onSectionClick={onSectionClick} />);

    fireEvent.click(screen.getByTestId('analysis-nav-analysis-business-model'));

    expect(onSectionClick).toHaveBeenCalledWith('analysis-business-model');
  });
});
