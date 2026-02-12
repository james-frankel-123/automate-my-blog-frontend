/**
 * HTMLPreview: markdown rendering for streamed blog content
 * Ensures streamed plain text (markdown source) is parsed and rendered, not shown as raw text.
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import HTMLPreview from '../HTMLPreview';

jest.mock('react-tweet', () => ({
  Tweet: ({ id, fallback }) => (
    <div data-testid="react-tweet" data-tweet-id={id}>
      {fallback}
    </div>
  )
}));
jest.mock('react-tweet/theme.css', () => ({}));

/** Minimal 1x1 PNG data URL so hero image "loads" in JSDOM and placeholder can hide. */
const TINY_IMAGE_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

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

    it('does not turn run-on streamed line (no newlines) into one giant h1', () => {
      // When backend streams without newlines, whole blob can be one "line"; cap heading length so we don't render it all as h1.
      const runOn = '# How to Effectively Test Your Streaming API In today\'s digital landscape, streaming APIs are pivotal for businesses aiming to deliver real-time data efficiently. Testing these APIs is crucial to ensure reliability and performance. This guide provides a comprehensive approach.';
      render(<HTMLPreview content={runOn} forceMarkdown />);
      // Should not be a single h1 containing the long paragraph (heading cap prevents that)
      const h1 = screen.queryByRole('heading', { level: 1 });
      expect(h1?.textContent?.length ?? 0).toBeLessThanOrEqual(250);
      expect(screen.getByText(/streaming APIs are pivotal/)).toBeInTheDocument();
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

    it('when forceMarkdown is true, always parses as markdown (e.g. streamed blog content)', () => {
      const streamed = '# Title\n\nFirst line.\n\n## Section\n\nContent with **bold**.';
      render(<HTMLPreview content={streamed} forceMarkdown />);
      expect(screen.getByRole('heading', { level: 1, name: 'Title' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Section' })).toBeInTheDocument();
      expect(screen.getByText('bold')).toBeInTheDocument();
    });

    it('renders hero image (fallback when no URL) instead of raw markdown for ![IMAGE:hero_image:...] (fixes #337)', () => {
      const markdown = 'Text before ![IMAGE:hero_image:placeholder](ref) after.';
      render(<HTMLPreview content={markdown} forceMarkdown />);
      const img = screen.getByRole('img');
      expect(img).toHaveClass('hero-image');
      expect(screen.queryByText(/Hero image will appear here/)).not.toBeInTheDocument();
    });

    it('renders actual hero image when heroImageUrl is passed for ![IMAGE:hero_image:...]', () => {
      const markdown = 'Intro.\n\n![IMAGE:hero_image:Professional photograph of a team.]\n\nMore text.';
      const heroUrl = 'https://example.com/hero.jpg';
      render(<HTMLPreview content={markdown} forceMarkdown heroImageUrl={heroUrl} />);
      const img = screen.getByRole('img', { name: /IMAGE:hero_image/i });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', heroUrl);
      expect(img).toHaveClass('hero-image');
    });

    it('renders hero image (fallback) when heroImageUrl is not passed for standalone ![IMAGE:hero_image:...]', () => {
      const markdown = 'Text ![IMAGE:hero_image:description] end.';
      render(<HTMLPreview content={markdown} forceMarkdown />);
      const img = screen.getByRole('img', { name: /IMAGE:hero_image/i });
      expect(img).toBeInTheDocument();
      expect(img).toHaveClass('hero-image');
      expect(screen.queryByText(/Hero image will appear here/)).not.toBeInTheDocument();
    });

    it('renders hero image when backend streams [IMAGE:hero_image:...] without leading ! (normalization)', () => {
      const markdown = 'Intro.\n\n[IMAGE:hero_image:Professional photograph of a team.]\n\nMore text.';
      const heroUrl = 'https://example.com/hero.jpg';
      render(<HTMLPreview content={markdown} forceMarkdown heroImageUrl={heroUrl} />);
      const img = screen.getByRole('img', { name: /IMAGE:hero_image/i });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', heroUrl);
      expect(img).toHaveClass('hero-image');
    });

    it('renders hero image for [IMAGE:hero_image:...] with long description (no exclamation point)', () => {
      const markdown = '[IMAGE:hero_image:Professional photograph showing a diverse group of employees collaborating in a modern office setting, conveying teamwork and engagement]\n\nMore text.';
      const heroUrl = 'https://example.com/hero.jpg';
      render(<HTMLPreview content={markdown} forceMarkdown heroImageUrl={heroUrl} />);
      const img = screen.getByRole('img', { name: /IMAGE:hero_image/i });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', heroUrl);
    });

    it('hides hero placeholder once image has loaded and minimum display time has elapsed', async () => {
      jest.useFakeTimers();
      const markdown = 'Intro.\n\n![IMAGE:hero_image:Test.]\n\nMore.';
      render(<HTMLPreview content={markdown} forceMarkdown heroImageUrl={TINY_IMAGE_DATA_URL} />);
      expect(screen.getByText(/Waiting for image…/)).toBeInTheDocument();
      const img = screen.getByRole('img', { name: /IMAGE:hero_image/i });
      // Simulate image loaded (cached or onLoad); in JSDOM data URL may already be complete.
      await act(async () => {
        Object.defineProperty(img, 'complete', { value: true, configurable: true });
        Object.defineProperty(img, 'naturalWidth', { value: 1, configurable: true });
        img.dispatchEvent(new Event('load'));
      });
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });
      expect(screen.queryByText(/Waiting for image…/)).not.toBeInTheDocument();
      jest.useRealTimers();
    });

    it('replaces article placeholder token with loading UI when relatedArticles missing', () => {
      const content = 'Intro.\n\n__ARTICLE_PLACEHOLDER_0__\n\nMore.';
      render(<HTMLPreview content={content} forceMarkdown relatedArticles={[]} />);
      expect(screen.getByText(/Loading article…/)).toBeInTheDocument();
      expect(screen.getByText(/Intro\./)).toBeInTheDocument();
      expect(screen.getByText(/More\./)).toBeInTheDocument();
    });

    it('replaces video placeholder token with loading UI when relatedVideos missing', () => {
      const content = 'Intro.\n\n__VIDEO_PLACEHOLDER_0__\n\nMore.';
      render(<HTMLPreview content={content} forceMarkdown relatedVideos={[]} />);
      expect(screen.getByText(/Loading video…/)).toBeInTheDocument();
      expect(screen.getByText(/Intro\./)).toBeInTheDocument();
      expect(screen.getByText(/More\./)).toBeInTheDocument();
    });

    it('replaces article placeholder token with article card when relatedArticles provided', () => {
      const content = 'Before __ARTICLE_PLACEHOLDER_0__ after.';
      const relatedArticles = [
        { url: 'https://example.com/news', title: 'Test Article', sourceName: 'Test Source' },
      ];
      render(<HTMLPreview content={content} forceMarkdown relatedArticles={relatedArticles} />);
      expect(screen.getByText('Test Article')).toBeInTheDocument();
      expect(screen.getByText('Test Source')).toBeInTheDocument();
      const link = screen.getByRole('link', { name: /Test Article/i });
      expect(link).toHaveAttribute('href', 'https://example.com/news');
    });

    it('replaces video placeholder token with natural embed when relatedVideos provided', () => {
      const content = 'Before __VIDEO_PLACEHOLDER_0__ after.';
      const relatedVideos = [
        { url: 'https://www.youtube.com/watch?v=abc', videoId: 'abc', title: 'Test Video', channelTitle: 'Test Channel' },
      ];
      render(<HTMLPreview content={content} forceMarkdown relatedVideos={relatedVideos} />);
      expect(screen.getByText('Test Video')).toBeInTheDocument();
      expect(screen.getByText('Test Channel')).toBeInTheDocument();
      expect(screen.getByTestId('react-player-mock')).toHaveAttribute('data-url', 'https://www.youtube.com/watch?v=abc');
    });

    it('replaces tweet placeholder with loading state when relatedTweets missing (issue #338)', () => {
      const content = 'Intro.\n\n__TWEET_PLACEHOLDER_0__\n\nMore.';
      render(<HTMLPreview content={content} forceMarkdown relatedTweets={[]} />);
      expect(screen.getByText(/Loading tweet…/)).toBeInTheDocument();
      expect(screen.getByText(/Intro\./)).toBeInTheDocument();
      expect(screen.getByText(/More\./)).toBeInTheDocument();
    });

    it('replaces tweet placeholder with tweet-styled card when relatedTweets provided (issue #338)', () => {
      const content = 'Before __TWEET_PLACEHOLDER_0__ after.';
      const relatedTweets = [
        { text: 'Streaming content changes how we build products.', url: 'https://twitter.com/i/status/123' },
      ];
      render(<HTMLPreview content={content} forceMarkdown relatedTweets={relatedTweets} />);
      expect(screen.getByText(/Streaming content changes how we build products\./)).toBeInTheDocument();
      expect(screen.getByRole('article', { name: /Embedded post from X/i })).toBeInTheDocument();
      const link = screen.getByRole('link', { name: /View on X/i });
      expect(link).toHaveAttribute('href', 'https://twitter.com/i/status/123');
    });

    it('renders tweet card with author name and handle when provided (issue #338)', () => {
      const content = 'Post __TWEET_PLACEHOLDER_0__ end.';
      const relatedTweets = [
        { text: 'Great insight here.', authorName: 'Jane Dev', authorHandle: 'janedev', url: 'https://x.com/janedev/status/1' },
      ];
      render(<HTMLPreview content={content} forceMarkdown relatedTweets={relatedTweets} />);
      expect(screen.getByText('Jane Dev')).toBeInTheDocument();
      expect(screen.getByText('@janedev')).toBeInTheDocument();
      expect(screen.getByText(/Great insight here\./)).toBeInTheDocument();
    });
  });
});
