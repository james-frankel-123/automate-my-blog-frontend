/**
 * Simple Markdown to HTML converter for TipTap editor
 * Converts basic markdown syntax to HTML for rich text editing
 */

export function markdownToHtml(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  let html = markdown;

  // IMPORTANT: Preserve blockquote elements with data attributes (highlight boxes)
  // These should pass through unchanged to maintain their styling
  // Match: <blockquote ...data-attributes...>content</blockquote>
  // Don't convert these to regular blockquotes

  // Convert headings
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

  // Convert bold text
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Convert italic text
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Convert markdown links [text](url) to HTML anchor tags
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Convert numbered lists
  html = html.replace(/^\d+\.\s+(.*$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');

  // Convert bullet points
  html = html.replace(/^[-*]\s+(.*$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)(?!.*<\/ol>)/s, '<ul>$1</ul>');

  // Convert line breaks to paragraphs
  const paragraphs = html.split(/\n\s*\n/).filter(p => p.trim());
  html = paragraphs.map(p => {
    p = p.trim();
    // Don't wrap if already wrapped in block elements
    if (p.match(/^<(h[1-6]|ul|ol|li|div|blockquote)/)) {
      return p;
    }
    // Handle multiple lines within a paragraph
    const lines = p.split(/\n/).map(line => line.trim()).filter(line => line);
    if (lines.length === 0) return '';
    if (lines.length === 1) return `<p>${lines[0]}</p>`;
    return `<p>${lines.join('<br>')}</p>`;
  }).join('');

  // Clean up multiple consecutive tags
  html = html.replace(/<\/ol>\s*<ol>/g, '');
  html = html.replace(/<\/ul>\s*<ul>/g, '');
  
  return html;
}

export function htmlToMarkdown(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }

  let markdown = html;

  // IMPORTANT: Preserve blockquote elements with data attributes (highlight boxes)
  // These are NOT regular blockquotes, they're custom highlight boxes from TipTap
  // We need to keep them as HTML with all data attributes intact
  // Match pattern: <blockquote data-highlight-box ...>content</blockquote>
  const highlightBoxes = [];
  markdown = markdown.replace(/<blockquote([^>]*data-highlight[^>]*)>(.*?)<\/blockquote>/gs, (match) => {
    const placeholder = `__HIGHLIGHT_BOX_${highlightBoxes.length}__`;
    highlightBoxes.push(match);
    return placeholder;
  });

  // Convert headings
  markdown = markdown.replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n');
  markdown = markdown.replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n');
  markdown = markdown.replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n');

  // Convert bold
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**');

  // Convert italic
  markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*');

  // Convert anchor tags <a href="url">text</a> to markdown links [text](url)
  markdown = markdown.replace(/<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g, '[$2]($1)');

  // Convert lists
  markdown = markdown.replace(/<ol>(.*?)<\/ol>/gs, (match, content) => {
    const items = content.match(/<li>(.*?)<\/li>/g) || [];
    return items.map((item, index) => 
      `${index + 1}. ${item.replace(/<\/?li>/g, '')}`
    ).join('\n') + '\n\n';
  });

  markdown = markdown.replace(/<ul>(.*?)<\/ul>/gs, (match, content) => {
    const items = content.match(/<li>(.*?)<\/li>/g) || [];
    return items.map(item => 
      `- ${item.replace(/<\/?li>/g, '')}`
    ).join('\n') + '\n\n';
  });

  // Convert paragraphs
  markdown = markdown.replace(/<p>(.*?)<\/p>/gs, '$1\n\n');

  // Convert breaks
  markdown = markdown.replace(/<br\s*\/?>/g, '\n');

  // Clean up extra whitespace
  markdown = markdown.replace(/\n\s*\n\s*\n/g, '\n\n');
  markdown = markdown.trim();

  // Restore preserved highlight boxes (replace placeholders with original HTML)
  highlightBoxes.forEach((box, index) => {
    markdown = markdown.replace(`__HIGHLIGHT_BOX_${index}__`, box);
  });

  return markdown;
}

/**
 * Test function to verify round-trip preservation of highlight boxes
 * Call this during development to ensure data attributes are maintained
 */
export function testHighlightBoxRoundTrip() {
  const original = '<blockquote data-highlight-box="" data-highlight-type="statistic" data-width="100%" data-font-size="xlarge" data-layout="block">Test content with <strong>formatting</strong></blockquote>';

  console.log('Original HTML:', original);

  const markdown = htmlToMarkdown(original);
  console.log('Converted to Markdown:', markdown);

  const backToHtml = markdownToHtml(markdown);
  console.log('Back to HTML:', backToHtml);

  const preserved = backToHtml.includes('data-highlight-type') &&
                    backToHtml.includes('data-width') &&
                    backToHtml.includes('data-font-size');

  console.log('Data attributes preserved:', preserved ? '✓ YES' : '✗ NO');

  return preserved;
}