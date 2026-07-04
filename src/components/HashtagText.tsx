import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HashtagTextProps {
  text: string;
  className?: string;
}

interface FormattedSegment {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
}

export function parseFormatting(html: string): FormattedSegment[] {
  const result: FormattedSegment[] = [];
  const tagRegex = /<(strong|b|em|i|u|s|strike|\/strong|\/b|\/em|\/i|\/u|\/s|\/strike)>/gi;
  
  let match;
  let lastIndex = 0;
  
  let bold = false;
  let italic = false;
  let underline = false;
  let strike = false;
  
  while ((match = tagRegex.exec(html)) !== null) {
    const textBefore = html.substring(lastIndex, match.index);
    if (textBefore) {
      result.push({
        text: textBefore,
        bold,
        italic,
        underline,
        strike
      });
    }
    
    const tagName = match[1].toLowerCase();
    if (tagName === 'strong' || tagName === 'b') {
      bold = true;
    } else if (tagName === '/strong' || tagName === '/b') {
      bold = false;
    } else if (tagName === 'em' || tagName === 'i') {
      italic = true;
    } else if (tagName === '/em' || tagName === '/i') {
      italic = false;
    } else if (tagName === 'u') {
      underline = true;
    } else if (tagName === '/u') {
      underline = false;
    } else if (tagName === 's' || tagName === 'strike') {
      strike = true;
    } else if (tagName === '/s' || tagName === '/strike') {
      strike = false;
    }
    
    lastIndex = tagRegex.lastIndex;
  }
  
  const textAfter = html.substring(lastIndex);
  if (textAfter) {
    result.push({
      text: textAfter,
      bold,
      italic,
      underline,
      strike
    });
  }
  
  return result;
}

export const HashtagText: React.FC<HashtagTextProps> = ({ text, className }) => {
  const navigate = useNavigate();

  const handleHashtagClick = (e: React.MouseEvent, hashtag: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Redirect to search results with query params
    navigate(`/search?q=${encodeURIComponent(hashtag)}`);
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    // Avoid double triggering post clicks
    e.stopPropagation();
  };

  if (!text) return null;

  // Parse formatting tags on the input text
  const segments = parseFormatting(text);

  return (
    <span className={className}>
      {segments.map((segment, segIdx) => {
        // Split text by URLs (starting with http/https or www) and hashtags
        const parts = segment.text.split(/(https?:\/\/[^\s]+|www\.[^\s]+|#[a-zA-Z0-9_]+)/gi);
        
        const renderElements = parts.map((part, partIdx) => {
          if (!part) return null;

          const key = `seg-${segIdx}-part-${partIdx}`;

          if (part.startsWith('#')) {
            return (
              <span
                key={key}
                onClick={(e) => handleHashtagClick(e, part)}
                className="text-primary hover:underline cursor-pointer font-bold inline"
              >
                {part}
              </span>
            );
          }

          const isUrl = part.toLowerCase().startsWith('http://') || 
                        part.toLowerCase().startsWith('https://') || 
                        part.toLowerCase().startsWith('www.');

          if (isUrl) {
            const href = part.toLowerCase().startsWith('www.') ? `https://${part}` : part;
            return (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleLinkClick}
                className="text-primary hover:underline font-semibold break-all inline"
              >
                {part}
              </a>
            );
          }

          return part;
        });

        // Wrap current segment elements in the appropriate styling tags
        let contentNode = <>{renderElements}</>;
        if (segment.bold) {
          contentNode = <strong className="font-bold">{contentNode}</strong>;
        }
        if (segment.italic) {
          contentNode = <em className="italic">{contentNode}</em>;
        }
        if (segment.underline) {
          contentNode = <u className="underline">{contentNode}</u>;
        }
        if (segment.strike) {
          contentNode = <s className="line-through">{contentNode}</s>;
        }

        return <span key={segIdx}>{contentNode}</span>;
      })}
    </span>
  );
};

