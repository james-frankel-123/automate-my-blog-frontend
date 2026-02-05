import { extractStreamChunk, extractStreamCompleteContent, normalizeContentString } from '../streamingUtils';

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

    it('does not append bare "title", "subtitle", "content" key labels as raw text', () => {
      expect(extractStreamChunk('title')).toBe('');
      expect(extractStreamChunk('subtitle')).toBe('');
      expect(extractStreamChunk('content')).toBe('');
      expect(extractStreamChunk({ content: 'title' })).toBe('');
      expect(extractStreamChunk({ content: 'content:' })).toBe('');
    });

    it('extracts .content from content-chunk payloads (field + content)', () => {
      // Backend sends content-chunk events: { "field": "content", "content": "," } etc.
      expect(extractStreamChunk({ field: 'content', content: ',' })).toBe(',');
      expect(extractStreamChunk({ field: 'content', content: ' selecting' })).toBe(' selecting');
      expect(extractStreamChunk({ field: 'content', content: ' the' })).toBe(' the');
      expect(extractStreamChunk({ field: 'content', content: ' right' })).toBe(' right');
      expect(extractStreamChunk({ field: 'content', content: ' AI' })).toBe(' AI');
    });

    it('accumulates content-chunk stream into full text', () => {
      const chunks = [
        { field: 'content', content: ',' },
        { field: 'content', content: ' selecting' },
        { field: 'content', content: ' the' },
        { field: 'content', content: ' right' },
        { field: 'content', content: ' AI' },
        { field: 'content', content: ' consulting' },
        { field: 'content', content: ' service' },
        { field: 'content', content: ' is' },
        { field: 'content', content: ' crucial' }
      ];
      const accumulated = chunks.map((data) => extractStreamChunk(data)).join('');
      expect(accumulated).toBe(', selecting the right AI consulting service is crucial');
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

    it('accepts raw string payload (e.g. event.data as string)', () => {
      const fenced = '```json\n{"content":"<p>From string</p>"}\n```';
      expect(extractStreamCompleteContent(fenced)).toBe('<p>From string</p>');
    });

    it('extracts content when blogPost is the fenced string', () => {
      const payload = { blogPost: '```json\n{"content":"<p>Blog</p>"}\n```' };
      expect(extractStreamCompleteContent(payload)).toBe('<p>Blog</p>');
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

    it('extracts content body from key-value style text (title/subtitle/content as raw keys)', () => {
      const keyValue = 'title\nMy Post\nsubtitle\nA subtitle\ncontent\n<p>Hello world</p>';
      expect(extractStreamCompleteContent({ content: keyValue })).toBe(
        '<p>Hello world</p>'
      );
    });

    it('extracts content when key-value has "content:" line', () => {
      const keyValue = 'title\nPost\ncontent:\n<p>Body</p>';
      expect(extractStreamCompleteContent({ content: keyValue })).toBe(
        '<p>Body</p>'
      );
    });

    it('strips backtick-escaped fences and returns only .content (title/subtitle/content JSON)', () => {
      // Backend sends \`\`\`json\n{...}\n\`\`\` (backslash-backtick escaped)
      const escapedFence = '\\`\\`\\`json\n{"title":"My Post","subtitle":"A sub","content":"<p>Body</p>"}\n\\`\\`\\`';
      expect(extractStreamCompleteContent({ content: escapedFence })).toBe(
        '<p>Body</p>'
      );
    });

    it('extracts .content from backtick-wrapped JSON with title, subtitle, content keys', () => {
      const fenced = '```json\n{"title":"T","subtitle":"S","content":"<p>Only this</p>"}\n```';
      expect(extractStreamCompleteContent({ content: fenced })).toBe(
        '<p>Only this</p>'
      );
    });
  });

  describe('extractStreamChunk with code fences', () => {
    it('strips ``` and extracts content from fenced JSON chunk', () => {
      const chunk = '```json\n{"content":"Hello"}\n```';
      expect(extractStreamChunk(chunk)).toBe('Hello');
    });
  });

  describe('extractStreamChunk / tryExtractFromJsonString: never show raw key-value text', () => {
    it('extracts only content from JSON fragment (key-value string without outer braces)', () => {
      const fragment = '"title": "Discover platforms", "metaDescription": "Explore resources.", "content": "# Top10 Interactive AI Learning"';
      expect(extractStreamChunk(fragment)).toBe('# Top10 Interactive AI Learning');
    });
    it('returns empty for key-value fragment with no content key (never show raw keys)', () => {
      const fragment = '"title": "Discover platforms", "metaDescription": "Explore resources."';
      expect(extractStreamChunk(fragment)).toBe('');
    });
  });

  describe('normalizeContentString', () => {
    it('returns displayable content for fenced JSON (e.g. final result.content)', () => {
      const raw = '```json\n{"title":"Post","content":"<p>Hi</p>"}\n```';
      expect(normalizeContentString(raw)).toBe('<p>Hi</p>');
    });
    it('returns plain HTML as-is', () => {
      const html = '<p>Hello</p>';
      expect(normalizeContentString(html)).toBe(html);
    });
    it('returns empty string as-is', () => {
      expect(normalizeContentString('')).toBe('');
    });
    it('extracts content body from key-value style (so title/subtitle/content not shown as raw)', () => {
      const raw = 'title\nMy Post\nsubtitle\nSub\ncontent\n<p>Only this</p>';
      expect(normalizeContentString(raw)).toBe('<p>Only this</p>');
    });
    it('extracts .content from streamed ```json\\n{ "title", "content" }``` (backend format)', () => {
      const fenced = '```json\n{\n  "title": "Example Title",\n  "content": "<p>Body to display</p>"\n}\n```';
      expect(normalizeContentString(fenced)).toBe('<p>Body to display</p>');
    });
    it('strips leading "": " and trailing "} from chunk-boundary noise in extracted content', () => {
      const withNoise = '"": "\n\nThis is the body to display in the Rendered preview.\n\n"}';
      expect(normalizeContentString(withNoise)).toBe('This is the body to display in the Rendered preview.');
    });
    it('extracts partial content during streaming (no closing quote yet)', () => {
      const partial = '```json\n{\n  "title": "Example",\n  "content": "# Example\n\nThis is the **body**';
      expect(normalizeContentString(partial)).toBe('# Example\n\nThis is the **body**');
    });
  });
});
