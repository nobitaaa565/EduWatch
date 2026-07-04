/**
 * Content Algorithm: Hashtag Extraction
 * 
 * Logic: Uses regex to find all instances of #word and converts to lowercase.
 */
export const extractHashtags = (text: string): string[] => {
  const hashtags = text.match(/#[a-z0-9_]+/gi);
  return hashtags ? hashtags.map(h => h.toLowerCase()) : [];
};

/**
 * Content Algorithm: Metric Normalization
 * 
 * Logic: Normalizes different view/engagement formats (e.g., 277K vs 1.2M) into numbers.
 */
export const normalizeMetric = (value: string | number): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const clean = String(value).toUpperCase().trim();
  if (clean.endsWith('M')) return parseFloat(clean) * 1000000;
  if (clean.endsWith('K')) return parseFloat(clean) * 1000;
  return parseFloat(clean) || 0;
};

/**
 * Content Algorithm: Read Time Estimation
 * 
 * Logic: Assumes 200 words per minute.
 */
export const estimateReadTime = (content: string): number => {
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / 200) || 1;
};

/**
 * Converts rich text HTML content to plain text, optionally preserving inline formatting tags.
 */
export const convertHtmlToText = (html: string, preserveFormatting: boolean = true): string => {
  if (!html) return '';
  // Convert <br> tags to newlines
  let text = html.replace(/<br\s*\/?>/gi, '\n');
  // Convert closing paragraph/headings/lists/div tags to a newline
  text = text.replace(/<\/(p|div|h[1-6]|li)>/gi, '\n');
  
  if (preserveFormatting) {
    // Strip all remaining HTML tags except our allowed formatting tags
    text = text.replace(/<(?!(\/?(strong|b|em|i|u|s|strike)\b))[^>]*>/gi, '');
  } else {
    // Strip all HTML tags
    text = text.replace(/<[^>]*>/g, '');
  }
  
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Normalize consecutive newlines to at most a double newline
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
};

/**
 * Content Algorithm: Smart line-based Truncation
 * Limit text to 3 visual/simulated lines.
 * It respects newline entry completely and estimates wrapping on standard width layout.
 */
export const getTruncatedContent = (text: string, isExpanded: boolean): { visibleText: string; isTruncated: boolean } => {
  if (!text) return { visibleText: '', isTruncated: false };
  if (isExpanded) return { visibleText: text, isTruncated: false };

  const physicalLines = text.split('\n');
  const MAX_CHAR_PER_LINE = 100; // estimated line width on normal screen
  
  // Calculate simulated line counts
  const simulatedLines: string[] = [];
  for (const line of physicalLines) {
    if (line.length <= MAX_CHAR_PER_LINE) {
      simulatedLines.push(line);
    } else {
      let start = 0;
      while (start < line.length) {
        simulatedLines.push(line.substring(start, start + MAX_CHAR_PER_LINE));
        start += MAX_CHAR_PER_LINE;
      }
    }
  }

  // If we shouldn't truncate (under 3 lines)
  if (simulatedLines.length <= 3) {
    return { visibleText: text, isTruncated: false };
  }

  // We need to truncate to fit exactly 3 simulated lines, and append "..."
  let visibleText = '';
  let simLineCount = 0;
  let index = 0;

  while (index < physicalLines.length && simLineCount < 3) {
    const line = physicalLines[index];
    const lineSimCount = Math.max(1, Math.ceil(line.length / MAX_CHAR_PER_LINE));

    if (simLineCount + lineSimCount <= 3) {
      visibleText += (index > 0 ? '\n' : '') + line;
      simLineCount += lineSimCount;
      index++;
    } else {
      const allowedSimLines = 3 - simLineCount;
      if (allowedSimLines > 0) {
        const allowedChars = allowedSimLines * MAX_CHAR_PER_LINE;
        visibleText += (index > 0 ? '\n' : '') + line.substring(0, allowedChars);
      }
      break;
    }
  }

  return { visibleText: visibleText.trimEnd(), isTruncated: true };
};

/**
 * Content Algorithm: Engagement Rate
 * 
 * Logic: (Likes + Comments + Shares) / Reach
 */
export const calculateEngagementRate = (stats: {
  likes: number;
  comments: number;
  shares: number;
  reach: number;
}): number => {
  if (stats.reach === 0) return 0;
  return ((stats.likes + stats.comments + stats.shares) / stats.reach) * 100;
};
