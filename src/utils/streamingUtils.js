/**
 * Utilities for handling streamed content in blog generation and other SSE flows.
 * Normalizes various backend formats so raw JSON never appears in the editor.
 * Issue: Streamed content was being appended as JSON into the content editor.
 */

/**
 * Extract displayable text from a streaming chunk.
 * Handles multiple backend formats:
 * - { content: "..." } or { text: "..." } - standard
 * - { delta: "..." } - generic delta
 * - { choices: [{ delta: { content: "..." } }] } - OpenAI-style
 * - Raw string that looks like JSON - parse and extract content/text
 *
 * @param {Object|string} data - Parsed event data or raw string
 * @returns {string} Extracted text chunk, or empty string if none found
 */
export function extractStreamChunk(data) {
  if (data == null) return '';

  // Direct string - return as-is (plain text chunk)
  if (typeof data === 'string') {
    return tryExtractFromJsonString(data);
  }

  // Object: check common fields in order
  const content = data.content ?? data.text ?? data.delta;
  if (typeof content === 'string' && content.trim()) {
    // Content may be a JSON string (e.g. ProseMirror doc) - extract displayable text, never append raw JSON
    const extracted = tryExtractFromJsonString(content);
    return extracted !== '' ? extracted : content.startsWith('{') ? '' : content;
  }

  // OpenAI-style: choices[0].delta.content
  const choices = data.choices;
  if (Array.isArray(choices) && choices[0]?.delta?.content) {
    const c = choices[0].delta.content;
    return typeof c === 'string' ? c : '';
  }

  return '';
}

/**
 * Extract final content from a complete event payload.
 * Handles nested structures like { blogPost: { content: "..." } }.
 *
 * @param {Object} data - Complete event payload
 * @returns {string} Final content string, or empty if none found
 */
export function extractStreamCompleteContent(data) {
  if (data == null) return '';

  const content =
    data.content ??
    data.text ??
    data.overview ??
    data.blogPost?.content ??
    data.result?.content ??
    data.data?.content;
  if (typeof content === 'string') return content;

  return '';
}

/**
 * If a string looks like JSON, try to parse and extract content/text.
 * Prevents raw JSON from being appended to the editor.
 *
 * @param {string} str - Possibly JSON string
 * @returns {string} Extracted content or original string if not JSON / no content
 */
function tryExtractFromJsonString(str) {
  if (typeof str !== 'string' || !str.trim()) return '';

  const trimmed = str.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return str; // Plain text, not JSON
  }

  try {
    const parsed = JSON.parse(str);
    if (parsed && typeof parsed === 'object') {
      const extracted =
        parsed.content ?? parsed.text ?? parsed.delta ?? parsed.message;
      if (typeof extracted === 'string') return extracted;
      if (Array.isArray(parsed.choices)?.[0]?.delta?.content) {
        return String(parsed.choices[0].delta.content);
      }
      // Parsed JSON but no displayable content - don't append raw JSON
      return '';
    }
  } catch {
    // Not valid JSON, return as plain text
  }
  return str;
}
