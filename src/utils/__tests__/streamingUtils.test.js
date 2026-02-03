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
  });
});
