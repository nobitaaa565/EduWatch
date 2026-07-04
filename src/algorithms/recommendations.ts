import { Creator } from '../lib/feedData';

/**
 * Recommendation Algorithm: Creator Popularity
 * 
 * Logic:
 * Weighted score calculated based on:
 * - Followers: (base weight)
 * - Reach: 5% weight
 * - Engagement (Likes + Comments + Shares): 2x weight
 */
export const calculatePopularityScore = (creator: Creator): number => {
  const engagement = (creator.likes || 0) + (creator.comments || 0) * 5 + (creator.shares || 0) * 10;
  const reachBonus = (creator.reach || 0) * 0.05;
  const followerWeight = (creator.followers || 0);

  return followerWeight + engagement + reachBonus;
};

/**
 * Creator Ranking Algorithm
 * Sorts creators based on their popularity score
 */
export const rankCreatorsByPopularity = (creators: Creator[]): Creator[] => {
  return [...creators].sort((a, b) => {
    return calculatePopularityScore(b) - calculatePopularityScore(a);
  });
};

/**
 * Generic Suggestion Algorithm
 * Used for both Communities and People (Creators)
 */
export const getSuggestions = <T extends { name: string }>(
  query: string,
  items: T[],
  limit: number = 5
): { items: T[], hasMatches: boolean } => {
  const cleanQuery = query.toLowerCase().trim();
  
  if (!cleanQuery) {
    return { items: items.slice(0, limit), hasMatches: true };
  }

  const filtered = items.filter(item => 
    item.name.toLowerCase().includes(cleanQuery)
  );

  const hasMatches = filtered.length > 0;
  const itemsToDisplay = hasMatches ? filtered.slice(0, limit) : items.slice(0, limit);

  return { items: itemsToDisplay, hasMatches };
};

/**
 * Community Suggestion Algorithm
 * Provides a fallback list of popular communities if search fails
 */
export const getSuggestedCommunities = (query: string, communities: any[]) => {
  return getSuggestions(query, communities);
};

export const getSuggestedPeople = (query: string, creators: Creator[]) => {
  return getSuggestions(query, creators, 3);
};
