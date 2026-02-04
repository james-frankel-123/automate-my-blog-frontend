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
 * Extract final content from a complete event payload (object or raw string).
 * Handles nested structures like { blogPost: { content: "..." } } and when
 * the payload is a string (e.g. blogPost/result as the whole fenced JSON).
 * Normalizes content so raw JSON is never returned (e.g. backend sending
 * stringified blog object or ProseMirror doc); only displayable content is returned.
 *
 * @param {Object|string} data - Complete event payload or raw content string
 * @returns {string} Final content string, or empty if none found
 */
export function extractStreamCompleteContent(data) {
  if (data == null) return '';

  let content;
  if (typeof data === 'string') {
    content = data;
  } else {
    content =
      data.content ??
      data.text ??
      data.overview ??
      (typeof data.blogPost === 'string' ? data.blogPost : data.blogPost?.content) ??
      (typeof data.result === 'string' ? data.result : data.result?.content) ??
      data.data?.content;
    if (typeof content !== 'string') return '';
  }

  // Backend may wrap payload in markdown code fences (```json ... ```); strip first.
  const normalized = stripMarkdownCodeFences(content).trim();
  const wasFenced = content.trim().startsWith('```');

  // If content looks like JSON (e.g. full blog object or ProseMirror doc),
  // parse and extract inner content so we never show raw JSON in the editor.
  if (normalized.startsWith('{') || normalized.startsWith('[')) {
    return tryExtractFromJsonString(normalized);
  }
  return wasFenced ? normalized : content;
}

/**
 * Normalize a content string: strip code fences, parse JSON, return .content (or plain text).
 * Use when the backend returns a raw/fenced string (e.g. final job result.content).
 *
 * @param {string} str - Raw content (may be fenced JSON or plain HTML/text)
 * @returns {string} Displayable content, or str if not JSON/fenced
 */
export function normalizeContentString(str) {
  if (typeof str !== 'string' || !str.trim()) return str;
  const out = extractStreamCompleteContent({ content: str });
  return out !== '' ? out : str;
}


/**
 * Strip markdown code fences (``` or ```json etc.) from a string.
 * Backend may wrap JSON or content in code blocks; we unwrap so we can parse or display inner content.
 *
 * @param {string} str - Possibly fenced string
 * @returns {string} Inner content or original string if no fences
 */
function stripMarkdownCodeFences(str) {
  if (typeof str !== 'string' || !str.trim()) return str;
  const trimmed = str.trim();
  const open = '```';
  if (!trimmed.startsWith(open)) return str;
  const afterOpen = trimmed.slice(open.length);
  const firstNewline = afterOpen.indexOf('\n');
  const body = firstNewline === -1 ? afterOpen : afterOpen.slice(firstNewline + 1);
  const closeIdx = body.indexOf(open);
  const inner = closeIdx === -1 ? body : body.slice(0, closeIdx);
  return inner.trim();
}

/**
 * If a string looks like JSON, try to parse and extract content/text.
 * Prevents raw JSON from being appended to the editor.
 * Strips markdown code fences first if present (e.g. ```json ... ```).
 *
 * @param {string} str - Possibly JSON string (optionally wrapped in ```)
 * @returns {string} Extracted content or original string if not JSON / no content
 */
function tryExtractFromJsonString(str) {
  if (typeof str !== 'string' || !str.trim()) return '';

  str = stripMarkdownCodeFences(str);
  if (!str.trim()) return '';

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
      // ProseMirror/TipTap doc: extract text from content nodes so we never show raw JSON
      if (parsed.type === 'doc' && Array.isArray(parsed.content)) {
        return proseMirrorDocToText(parsed);
      }
      // Parsed JSON but no displayable content - don't append raw JSON
      return '';
    }
  } catch {
    // Not valid JSON, return as plain text
  }
  return str;
}

/**
 * Extract plain text from a ProseMirror/TipTap doc JSON.
 * Used when backend sends doc JSON so we show content, not raw JSON.
 *
 * @param {Object} doc - Parsed doc with type: "doc" and content: [ nodes ]
 * @returns {string} Concatenated text from text nodes
 */
function proseMirrorDocToText(doc) {
  if (!doc?.content || !Array.isArray(doc.content)) return '';
  const parts = [];
  function visit(node) {
    if (node.text) {
      parts.push(node.text);
      return;
    }
    if (Array.isArray(node.content)) {
      node.content.forEach(visit);
    }
  }
  doc.content.forEach(visit);
  return parts.join('');
}
