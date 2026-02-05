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
/** Known keys that should not be appended as raw text when streamed (title, subtitle, content as labels). */
const STREAM_KEY_LABELS = /^(?:title|subtitle|content)\s*:?\s*$/i;

export function extractStreamChunk(data) {
  if (data == null) return '';

  // Direct string - extract content; never append bare "title", "subtitle", "content" as raw text
  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (STREAM_KEY_LABELS.test(trimmed)) return '';
    return tryExtractFromJsonString(data);
  }

  // Object: check common fields in order
  const content = data.content ?? data.text ?? data.delta;
  if (typeof content === 'string' && content.trim()) {
    const trimmed = content.trim();
    if (STREAM_KEY_LABELS.test(trimmed)) return '';
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

  // Backend may wrap payload in markdown code fences (``` or backtick-escaped \`\`\`); strip first.
  const normalized = stripMarkdownCodeFences(content).trim();
  const wasFenced = content.trim().startsWith('```') || content.trim().startsWith('\\`\\`\\`');

  // If content looks like JSON (e.g. full blog object or ProseMirror doc),
  // parse and extract inner content so we never show raw JSON in the editor.
  if (normalized.startsWith('{') || normalized.startsWith('[')) {
    return tryExtractFromJsonString(normalized);
  }
  // Key-value style (e.g. "title\n...\nsubtitle\n...\ncontent\n<p>...</p>"): show only content body
  const fromKeyValue = extractContentFromKeyValueText(normalized);
  if (fromKeyValue) return fromKeyValue;
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
 * Backend may send backtick-escaped JSON (e.g. \`\`\`json ... \`\`\` or literal ```).
 * We unwrap so we can parse and display only the .content field (title/subtitle/content structure).
 *
 * @param {string} str - Possibly fenced string (may use escaped backticks \`)
 * @returns {string} Inner content or original string if no fences
 */
function stripMarkdownCodeFences(str) {
  if (typeof str !== 'string' || !str.trim()) return str;
  const trimmed = str.trim();
  const openLiteral = '```';
  const openEscaped = '\\`\\`\\`'; // backslash-backtick repeated 3 times
  const isEscapedFence = trimmed.startsWith(openEscaped);
  const open = isEscapedFence ? openEscaped : openLiteral;
  if (!trimmed.startsWith(open)) return str;
  const afterOpen = trimmed.slice(open.length);
  const firstNewline = afterOpen.indexOf('\n');
  const body = firstNewline === -1 ? afterOpen : afterOpen.slice(firstNewline + 1);
  const closeIdx = body.indexOf(open);
  const inner = closeIdx === -1 ? body : body.slice(0, closeIdx);
  return inner.trim();
}

/**
 * Extract the "content" value from key-value style text (e.g. streamed markdown with
 * "title", "subtitle", "content" as literal keys). So "title\n...\ncontent\n<p>...</p>"
 * or "content:\n<p>...</p>" returns "<p>...</p>". Prevents "title", "subtitle", "content"
 * from rendering as raw text in the preview.
 *
 * @param {string} str - Key-value or markdown-style text
 * @returns {string} Extracted content section or empty if none found
 */
function extractContentFromKeyValueText(str) {
  if (typeof str !== 'string' || !str.trim()) return '';
  const s = str.trim();
  // Match line that is exactly "content" or "content:" (optional colon), then take rest
  const contentLineMatch = s.match(/\n(?:content|content:)\s*\n([\s\S]*)/i);
  if (contentLineMatch) return contentLineMatch[1].trim();
  // Or content at start: "content\n..." or "content:\n..."
  if (/^(?:content|content:)\s*\n/i.test(s)) return s.replace(/^(?:content|content:)\s*\n/i, '').trim();
  // JSON-style key "content": "value" (partial OK for streaming)
  const jsonContentMatch = s.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"?\s*[,}\s]*/);
  if (jsonContentMatch) return jsonContentMatch[1].replace(/\\"/g, '"').trim();
  return '';
}

/**
 * If a string looks like JSON, try to parse and extract content/text.
 * Prevents raw JSON from being appended to the editor.
 * Strips markdown code fences first if present (e.g. ```json ... ```).
 * When parse fails or string is key-value style, tries extractContentFromKeyValueText
 * so "title", "subtitle", "content" keys don't render as raw text.
 *
 * @param {string} str - Possibly JSON string (optionally wrapped in ```)
 * @returns {string} Extracted content or original string if not JSON / no content
 */
function tryExtractFromJsonString(str) {
  if (typeof str !== 'string' || !str.trim()) return '';

  str = stripMarkdownCodeFences(str);
  if (!str.trim()) return '';

  const trimmed = str.trim();
  const isJsonLike = trimmed.startsWith('{') || trimmed.startsWith('[');

  try {
    if (isJsonLike) {
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
    }
  } catch {
    // Not valid JSON (e.g. partial stream) - try key-value extraction below
  }

  // Key-value or partial JSON: extract "content" so title/subtitle/content don't show as raw text
  const fromKeyValue = extractContentFromKeyValueText(str);
  if (fromKeyValue) return fromKeyValue;

  if (!isJsonLike) return str; // Plain text, not JSON
  return ''; // JSON-like but unparseable and no content key - don't show raw
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
