import { Article } from '../lib/feedData';
import { Post as LocalPost } from '../services/postService';

export type CombinedPost = (Article | LocalPost) & { isLocal?: boolean };

/**
 * Search Algorithm: Global Search & Filtering
 * 
 * Handles multi-criteria filtering including hashtags, topics, source, and time.
 */
export const filterSearchResults = (
  items: CombinedPost[],
  query: string,
  filters: {
    topics?: string[];
    sources?: string[];
    times?: string[];
  },
  parseHashtags: (text: string) => string[]
): CombinedPost[] => {
  const cleanQuery = query.toLowerCase().trim();
  const isHashtagSearch = cleanQuery.startsWith('#');

  return items.filter(item => {
    const itemTitle = 'title' in item ? item.title : '';
    const itemAuthor = 'author' in item ? item.author : ('authorName' in item ? item.authorName : '');
    const itemDesc = 'description' in item ? item.description : ('content' in item ? item.content : '');
    const itemTags = 'tags' in item ? item.tags : ('categories' in item ? item.categories : []) || [];
    const itemSource = 'source' in item ? item.source : 'community';

    // Search Query Logic
    let matchesSearch = true;
    if (cleanQuery) {
      const queryKeyword = cleanQuery.startsWith('#') ? cleanQuery.slice(1) : cleanQuery;

      const titleMatch = itemTitle.toLowerCase().includes(cleanQuery) || (queryKeyword ? itemTitle.toLowerCase().includes(queryKeyword) : false);
      const authorMatch = itemAuthor.toLowerCase().includes(cleanQuery) || (queryKeyword ? itemAuthor.toLowerCase().includes(queryKeyword) : false);
      const descMatch = itemDesc.toLowerCase().includes(cleanQuery) || (queryKeyword ? itemDesc.toLowerCase().includes(queryKeyword) : false);
      
      const hashtags = parseHashtags(itemDesc + ' ' + itemTitle);
      const hashMatch = hashtags.some(h => h === cleanQuery || h.includes(queryKeyword));

      matchesSearch = titleMatch || authorMatch || descMatch || hashMatch;
    }
    
    // Topic Filtering Logic
    const matchesTopic = !filters.topics || filters.topics.length === 0 || itemTags.some(tag => filters.topics!.includes(tag));
    
    // Source Filtering Logic
    const matchesSource = !filters.sources || filters.sources.length === 0 || filters.sources.includes(itemSource);

    // Time Filtering Logic (Read Time)
    const timeStr = 'readTime' in item ? item.readTime : 1;
    const time = typeof timeStr === 'string' ? parseInt(timeStr.split(' ')[0]) : timeStr;
    const matchesTime = !filters.times || filters.times.length === 0 || filters.times.some(range => {
      if (range === '< 5 min') return time < 5;
      if (range === '5-15 min') return time >= 5 && time <= 15;
      if (range === '15-25 min') return time > 15 && time <= 25;
      if (range === '25+ min') return time > 25;
      return false;
    });

    return matchesSearch && matchesTopic && matchesTime && matchesSource;
  });
};

/**
 * Search Algorithm: Relevance & Metadata Sorting
 * 
 * Handles sorting based on popularity (views), recency, and relevance.
 */
export const sortSearchResults = (
  items: CombinedPost[],
  sortBy: string,
  searchQuery: string
): CombinedPost[] => {
  const parseViews = (v: any) => {
    if (typeof v === 'number') return v;
    if (!v) return 0;
    if (String(v).endsWith('M')) return parseFloat(v) * 1000000;
    if (String(v).endsWith('K')) return parseFloat(v) * 1000;
    return parseFloat(v);
  };

  return [...items].sort((a, b) => {
    if (sortBy === 'Most Read' || sortBy === 'Views') {
      const viewsA = 'views' in a ? parseViews(a.views) : ('likes' in a ? a.likes * 10 : 0);
      const viewsB = 'views' in b ? parseViews(b.views) : ('likes' in b ? b.likes * 10 : 0);
      return viewsB - viewsA;
    }
    if (sortBy === 'Latest First') {
      const dateA = 'date' in a ? new Date(a.date).getTime() : ('createdAt' in a ? new Date(a.createdAt).getTime() : 0);
      const dateB = 'date' in b ? new Date(b.date).getTime() : ('createdAt' in b ? new Date(b.createdAt).getTime() : 0);
      return dateB - dateA;
    }
    if (sortBy === 'Relevance') {
      const titleA = 'title' in a ? a.title : '';
      const titleB = 'title' in b ? b.title : '';
      const searchA = titleA.toLowerCase().includes(searchQuery.toLowerCase()) ? 100 : 0;
      const searchB = titleB.toLowerCase().includes(searchQuery.toLowerCase()) ? 100 : 0;
      return searchB - searchA;
    }
    return 0;
  });
};
