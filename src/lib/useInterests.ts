import { useState, useEffect } from 'react';
import { calculateRelevanceScore } from '../algorithms/interests';

export interface InterestProfile {
  tags: Record<string, number>;
  authors: Record<string, number>;
  viewedPostIds: string[];
  lastUpdated: string;
}

export function useInterests() {
  const [profile, setProfile] = useState<InterestProfile>(() => {
    const saved = localStorage.getItem('user_interests');
    const defaultProfile: InterestProfile = {
      tags: {},
      authors: {},
      viewedPostIds: [],
      lastUpdated: new Date().toISOString(),
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with defaults to handle schema migrations for existing users
        return {
          ...defaultProfile,
          ...parsed,
          tags: parsed.tags || {},
          authors: parsed.authors || {},
          viewedPostIds: parsed.viewedPostIds || []
        };
      } catch (e) {
        return defaultProfile;
      }
    }
    return defaultProfile;
  });

  useEffect(() => {
    localStorage.setItem('user_interests', JSON.stringify(profile));
  }, [profile]);

  // "Learn" from an action (viewing an article)
  const trackInteraction = (postId: string, tags: string[] = [], author: string) => {
    setProfile(prev => {
      const newTags = { ...(prev.tags || {}) };
      (tags || []).forEach(tag => {
        newTags[tag] = (newTags[tag] || 0) + 1;
      });

      const newAuthors = { ...(prev.authors || {}) };
      newAuthors[author] = (newAuthors[author] || 0) + 2; // Following the author is a stronger signal

      // Add to viewed list if not already there
      const currentViewed = prev.viewedPostIds || [];
      const newViewed = currentViewed.includes(postId) 
        ? currentViewed 
        : [...currentViewed, postId];

      return {
        tags: newTags,
        authors: newAuthors,
        viewedPostIds: newViewed,
        lastUpdated: new Date().toISOString(),
      };
    });
  };

  // Get a relevance score for a piece of content
  const getRelevanceScore = (contentId: string, contentTags: string[] = [], contentAuthor: string, isFollowed: boolean) => {
    return calculateRelevanceScore(contentId, contentTags, contentAuthor, isFollowed, profile);
  };

  return { profile, trackInteraction, getRelevanceScore };
}
