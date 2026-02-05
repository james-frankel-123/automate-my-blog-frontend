/**
 * HTMLPreview: markdown rendering for streamed blog content
 * Ensures streamed plain text (markdown source) is parsed and rendered, not shown as raw text.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import HTMLPreview from '../HTMLPreview';

describe('HTMLPreview', () => {
  describe('streamed markdown rendering', () => {
    it('renders streamed prose as paragraphs (treat as markdown, not raw text)', () => {
      const streamedProse = ' director, you understand the importance of a well-designed environment';
      render(<HTMLPreview content={streamedProse} />);
      expect(screen.getByText(/director/)).toBeInTheDocument();
      expect(screen.getByText(/well-designed/)).toBeInTheDocument();
    });

    it('renders markdown headers when content starts with ##', () => {
      const markdown = '## Introduction\n\nAs a design director, you understand.';
      render(<HTMLPreview content={markdown} />);
      expect(screen.getByRole('heading', { level: 2, name: 'Introduction' })).toBeInTheDocument();
      expect(screen.getByText(/As a design director/)).toBeInTheDocument();
    });

    it('renders markdown headers when content does NOT start with # (streamed then heading)', () => {
      const streamed = 'First sentence.\n\n## Section Two\n\nMore text.';
      render(<HTMLPreview content={streamed} />);
      expect(screen.getByRole('heading', { level: 2, name: 'Section Two' })).toBeInTheDocument();
      expect(screen.getByText(/First sentence/)).toBeInTheDocument();
    });

    it('renders bold and italic markdown', () => {
      const markdown = 'This is **bold** and *italic* text.';
      render(<HTMLPreview content={markdown} />);
      expect(screen.getByText('bold')).toBeInTheDocument();
      expect(screen.getByText('italic')).toBeInTheDocument();
    });

    it('renders list items', () => {
      const markdown = '- Item one\n- Item two';
      render(<HTMLPreview content={markdown} />);
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getByText('Item one')).toBeInTheDocument();
      expect(screen.getByText('Item two')).toBeInTheDocument();
    });

    it('does not double-convert pre-rendered HTML', () => {
      const html = '<p>Already rendered</p><h2>Heading</h2>';
      render(<HTMLPreview content={html} />);
      expect(screen.getByText('Already rendered')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Heading' })).toBeInTheDocument();
    });

    it('shows empty state when content is empty or whitespace', () => {
      const { unmount: unmount1 } = render(<HTMLPreview content="" />);
      expect(screen.getByText(/No content to preview/i)).toBeInTheDocument();
      unmount1();
      const { unmount: unmount2 } = render(<HTMLPreview content="   " />);
      expect(screen.getByText(/No content to preview/i)).toBeInTheDocument();
      unmount2();
    });

    it('handles blockquote markdown', () => {
      const markdown = '> A notable quote here.';
      render(<HTMLPreview content={markdown} />);
      expect(screen.getByText(/notable quote/)).toBeInTheDocument();
    });
  });
});
