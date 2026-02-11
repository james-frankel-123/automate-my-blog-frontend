/**
 * Utilities for handling streamed content in blog generation and other SSE flows.
 * Normalizes various backend formats so raw JSON never appears in the editor.
 * Issue: Streamed content was being appended as JSON into the content editor.
 *
 * Blog-generation stream: backend now streams only the content (markdown). Use
 * getStreamChunkContentOnly / getStreamCompleteContentOnly for that path; no stripping.
 */

/**
 * For content-only streams (e.g. blog-generation): return the chunk exactly as sent.
 * Backend streams raw markdown; no JSON parsing or strip-formatting.
 * @param {Object|string} data - Parsed event data (string or { content: string })
 * @returns {string} The chunk to append, or empty string
 */
export function getStreamChunkContentOnly(data) {
  if (data == null) return '';
  if (typeof data === 'string') return data;
  const c = data.content ?? data.text;
  return typeof c === 'string' ? c : '';
}

/**
 * For content-only streams: return the complete content exactly as sent.
 * @param {Object|string} data - Complete event payload
 * @returns {string} The full content string, or empty string
 */
export function getStreamCompleteContentOnly(data) {
  if (data == null) return '';
  if (typeof data === 'string') return data;
  const c = data.content ?? data.text;
  return typeof c === 'string' ? c : '';
}

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

/** Backend may send { field: "title", content: "..." } or { field: "content", content: "..." }. Only append when field is "content" or missing. */
const STREAM_FIELD_BODY_ONLY = /^(?:content|text|body)$/i;
const STREAM_FIELD_META = /^(?:title|metaDescription|subtitle|description)$/i;

/** True if string looks like JSON key-value pairs (so we never show it as raw text). */
function looksLikeJsonKeyValue(str) {
  if (typeof str !== 'string' || str.length < 5) return false;
  return /"[^"]*"\s*:\s*"/.test(str) || /"[^"]*"\s*:\s*\[/.test(str);
}

/** Chunks that are only JSON structure/punctuation (backend sometimes streams wrapper JSON as content-chunk). */
const JSON_STRUCTURE_ONLY = /^[\s[\]{}\]:,"\\\n\r`]+$/;
/** Single tokens that are likely wrapper keys streamed as content (e.g. ctaSuggestions, seoOptimizationScore). */
const STREAMED_JSON_KEY_TOKENS = new Set(['cta', 'seo', 'suggestions', 'optimization', 'score', 'json', 'metadescription']);
/** Return false if chunk should not be appended (JSON structure streamed as "content" instead of body). */
function isAppendableContentChunk(chunk) {
  if (typeof chunk !== 'string' || !chunk.length) return false;
  if (/^[\s\r\n]+$/.test(chunk)) return true;
  const t = chunk.trim();
  if (!t.length) return false;
  if (t === ',' || t === ' ' || t === '.') return true;
  if (JSON_STRUCTURE_ONLY.test(t)) return false;
  if (t.length <= 20 && STREAMED_JSON_KEY_TOKENS.has(t.toLowerCase())) return false;
  if (t === 'metaDescription') return false;
  if (/^#\s|^[-*>\d.]\s/m.test(t)) return true;
  if (!t.includes('\n') && t.length >= 15 && t.length <= 95 && !t.includes('.')) {
    const caps = t.split(/\s+/).filter((w) => /^[A-Z]/.test(w)).length;
    if (caps >= 3) return false;
  }
  return true;
}

export function extractStreamChunk(data) {
  if (data == null) return '';

  // Direct string - extract content; never append bare "title", "subtitle", "content" as raw text
  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (STREAM_KEY_LABELS.test(trimmed)) return '';
    return tryExtractFromJsonString(data);
  }

  // Object: if backend sends field-scoped chunks, only append body (content/text/body), not title/metaDescription/etc.
  const field = data.field;
  if (typeof field === 'string' && field.trim()) {
    const f = field.trim();
    if (STREAM_FIELD_META.test(f)) return '';
    if (!STREAM_FIELD_BODY_ONLY.test(f)) return '';
  }

  // Object: check common fields in order (allow whitespace-only chunks so newlines are appended)
  const content = data.content ?? data.text ?? data.delta ?? (typeof data.blogPost === 'object' && data.blogPost !== null ? data.blogPost.content : undefined);
  if (typeof content === 'string' && content.length > 0) {
    const trimmed = content.trim();
    if (trimmed && STREAM_KEY_LABELS.test(trimmed)) return '';
    // Content may be a JSON string (e.g. full blog object) - extract displayable text, never append raw JSON
    const extracted = tryExtractFromJsonString(content);
    const out = extracted !== '' ? extracted : content.startsWith('{') || looksLikeJsonKeyValue(content) ? '' : content;
    if (out && !isAppendableContentChunk(out)) return '';
    return out ? unescapeNewlinesAndTabs(out) : '';
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

  let out = '';
  if (normalized.startsWith('{') || normalized.startsWith('[')) {
    out = tryExtractFromJsonString(normalized) || '';
  } else {
    const fromKeyValue = extractContentFromKeyValueText(normalized);
    out = fromKeyValue ? fromKeyValue : (wasFenced ? normalized : content);
  }
  return out ? unescapeNewlinesAndTabs(out) : out;
}

/**
 * Strip leading/trailing JSON-structure fragments that can slip into extracted content
 * when the stream is chunked (e.g. leading "": " or trailing "}\n).
 */
function stripContentFragmentNoise(str) {
  if (typeof str !== 'string' || !str.trim()) return str;
  let s = str.trim();
  // Leading: "": " or ": " (quote-colon-quote from chunk boundary)
  s = s.replace(/^"\s*"\s*:\s*"\s*/, '').trim();
  s = s.replace(/^"\s*:\s*"\s*/, '').trim();
  // Trailing: "}\n or "}\r\n or "} (quote + closing brace from chunk boundary)
  s = s.replace(/"\s*}\s*\r?\n?\s*$/, '').trim();
  return s;
}

/**
 * Ensure literal backslash-n and backslash-t in string become real newlines/tabs.
 * JSON.parse already turns "\n" into newline; this handles double-encoded or raw strings.
 */
function unescapeNewlinesAndTabs(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
}

/**
 * Normalize a content string: strip code fences, parse JSON, return .content (or plain text).
 * Use when the backend returns a raw/fenced string (e.g. final job result.content).
 * Also unescapes literal \n and \t so newlines render correctly in the preview.
 *
 * @param {string} str - Raw content (may be fenced JSON or plain HTML/text)
 * @returns {string} Displayable content, or str if not JSON/fenced
 */
export function normalizeContentString(str) {
  if (typeof str !== 'string' || !str.trim()) return str;
  const out = extractStreamCompleteContent({ content: str });
  if (out === '') return str;
  return unescapeNewlinesAndTabs(stripContentFragmentNoise(out));
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
  // Partial stream: "content": " is present but value not closed yet; take rest as display value
  // so we can render markdown during streaming instead of showing raw accumulated string
  const contentKeyStart = s.indexOf('"content"');
  if (contentKeyStart !== -1) {
    const afterKey = s.slice(contentKeyStart + 9); // after "content"
    const valueStartMatch = afterKey.match(/\s*:\s*"/);
    if (valueStartMatch) {
      const valueStart = contentKeyStart + 9 + valueStartMatch.index + valueStartMatch[0].length;
      let partial = s.slice(valueStart).replace(/\\"/g, '"');
      partial = partial.replace(/"\s*[}\],]\s*\r?\n?\s*$/, '').trim();
      if (partial.length > 0) return partial;
    }
  }
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

  // Key-value or partial JSON: extract "content" so title/metaDescription don't show as raw text
  const fromKeyValue = extractContentFromKeyValueText(str);
  if (fromKeyValue) return fromKeyValue;

  // Fragment that looks like JSON key-value but missing outer braces (our parsing strips keys;
  // if we ever output key-value text, it must not be shown). Try wrapping in {} and parse.
  if (!isJsonLike && looksLikeJsonKeyValue(str)) {
    try {
      const wrapped = str.trim();
      const toParse = (wrapped.startsWith('{') ? wrapped : `{${wrapped}}`);
      const parsed = JSON.parse(toParse);
      if (parsed && typeof parsed === 'object') {
        const extracted = parsed.content ?? parsed.text ?? parsed.delta ?? parsed.message;
        if (typeof extracted === 'string') return extracted;
      }
    } catch {
      // Unparseable fragment: never show raw key-value text
    }
    return '';
  }
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
