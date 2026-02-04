import { extractStreamChunk, extractStreamCompleteContent } from '../streamingUtils';

describe('streamingUtils', () => {
  describe('extractStreamChunk', () => {
    it('extracts content from { content }', () => {
      expect(extractStreamChunk({ content: 'Hello world' })).toBe('Hello world');
    });

    it('extracts text from { text }', () => {
      expect(extractStreamChunk({ text: 'Hello world' })).toBe('Hello world');
    });

    it('extracts delta from { delta }', () => {
      expect(extractStreamChunk({ delta: 'Hello ' })).toBe('Hello ');
    });

    it('extracts from OpenAI-style choices[0].delta.content', () => {
      expect(
        extractStreamChunk({
          choices: [{ delta: { content: 'Hello ' }, index: 0 }],
        })
      ).toBe('Hello ');
    });

    it('does not append raw JSON when content is a JSON string', () => {
      const jsonContent = '{"type":"doc","content":[{"type":"paragraph"}]}';
      expect(extractStreamChunk({ content: jsonContent })).toBe('');
    });

    it('extracts nested content from JSON string', () => {
      const jsonWithContent = '{"content":"Hello from JSON"}';
      expect(extractStreamChunk({ content: jsonWithContent })).toBe(
        'Hello from JSON'
      );
    });

    it('returns plain text when given a non-JSON string', () => {
      expect(extractStreamChunk('Hello world')).toBe('Hello world');
    });

    it('returns empty for null or undefined', () => {
      expect(extractStreamChunk(null)).toBe('');
      expect(extractStreamChunk(undefined)).toBe('');
    });
  });

  describe('extractStreamCompleteContent', () => {
    it('extracts content', () => {
      expect(extractStreamCompleteContent({ content: 'Full post' })).toBe(
        'Full post'
      );
    });

    it('extracts from blogPost.content', () => {
      expect(
        extractStreamCompleteContent({
          blogPost: { content: 'Blog content', title: 'Title' },
        })
      ).toBe('Blog content');
    });

    it('extracts overview for bundle streams', () => {
      expect(extractStreamCompleteContent({ overview: 'Bundle overview' })).toBe(
        'Bundle overview'
      );
    });

    it('returns empty for payloads with no content', () => {
      expect(extractStreamCompleteContent({ status: 'ok' })).toBe('');
      expect(extractStreamCompleteContent(null)).toBe('');
    });

    it('does not return raw JSON when content is a JSON string (wrapper object)', () => {
      const payload = {
        content: '{"title":"My Post","content":"<p>Hello world</p>","metaDescription":"..."}'
      };
      expect(extractStreamCompleteContent(payload)).toBe('<p>Hello world</p>');
    });

    it('extracts text from ProseMirror doc when content is doc JSON', () => {
      const payload = {
        content: JSON.stringify({
          type: 'doc',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Hello ' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'world' }] }
          ]
        })
      };
      expect(extractStreamCompleteContent(payload)).toBe('Hello world');
    });

    it('returns plain HTML as-is when content does not look like JSON', () => {
      const html = '<p>Hello <strong>world</strong></p>';
      expect(extractStreamCompleteContent({ content: html })).toBe(html);
    });

    it('strips markdown code fences and extracts content when wrapped in ```', () => {
      const fenced = '```json\n{"title":"Post","content":"<p>Hello</p>"}\n```';
      expect(extractStreamCompleteContent({ content: fenced })).toBe(
        '<p>Hello</p>'
      );
    });

    it('strips code fences without language tag (``` ... ```)', () => {
      const fenced = '```\n{"content":"Inner text"}\n```';
      expect(extractStreamCompleteContent({ content: fenced })).toBe(
        'Inner text'
      );
    });

    it('returns only inner text when response is fenced plain text', () => {
      const fenced = '```\nJust plain text here\n```';
      expect(extractStreamCompleteContent({ content: fenced })).toBe(
        'Just plain text here'
      );
    });
  });

  describe('extractStreamChunk with code fences', () => {
    it('strips ``` and extracts content from fenced JSON chunk', () => {
      const chunk = '```json\n{"content":"Hello"}\n```';
      expect(extractStreamChunk(chunk)).toBe('Hello');
    });
  });
});
