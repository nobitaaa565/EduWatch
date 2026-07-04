export const SCORING_WEIGHTS = {
  // Knowledge Score Weights
  article: 10,
  microPost: 5,
  upvote: 2,
  comment: 3,
  
  // Educational Impact Weights
  view: 0.1,
  share: 5,
  bookmark: 10,
  
  // Priority Score Multipliers
  knowledgeAlpha: 0.6,
  impactBeta: 0.4
};

/**
 * Calculates the Knowledge Score (Baseline = 0)
 * Algorithm: Loops through published articles and micro-posts, matching 
 * each interaction with rigorous point increments.
 */
export const calculateKnowledgeScore = (userPosts: any[]): number => {
  if (!userPosts || userPosts.length === 0) return 0;

  return userPosts.reduce((score, post) => {
    // Determine content format/type
    const format = post.format || post.type || 'article';
    const isArticle = format === 'article';
    
    // Base points for content type
    const postScore = isArticle ? SCORING_WEIGHTS.article : SCORING_WEIGHTS.microPost;
    
    // Points for direct peer validation
    const upvotes = post.upvotes || post.likes || 0;
    const commentsCount = Array.isArray(post.comments) 
      ? post.comments.length 
      : (parseInt(String(post.comments || 0)) || 0);

    const upvoteScore = upvotes * SCORING_WEIGHTS.upvote;
    const commentScore = commentsCount * SCORING_WEIGHTS.comment;
    
    return score + postScore + upvoteScore + commentScore;
  }, 0);
};

/**
 * Calculates the Educational Impact (Baseline = 0)
 * Algorithm: Measures pedagogical content spread across high-leverage engagement vectors.
 */
export const calculateEducationalImpact = (userPosts: any[]): number => {
  if (!userPosts || userPosts.length === 0) return 0;

  return userPosts.reduce((impact, post) => {
    const views = parseInt(String(post.views || 0).replace(/[^0-9]/g, '')) || 0;
    const shares = post.shares || 0;
    const bookmarks = post.bookmarks || post.saves || 0;

    const viewImpact = views * SCORING_WEIGHTS.view;
    const shareImpact = shares * SCORING_WEIGHTS.share;
    const bookmarkImpact = bookmarks * SCORING_WEIGHTS.bookmark;
    
    return impact + viewImpact + shareImpact + bookmarkImpact;
  }, 0);
};

/**
 * Calculates the Weighted System Priority Score
 * Algorithm: Composite score representing volume of knowledge and ecosystem reach.
 * Used by the Leaderboard Daemon for global ranking.
 */
export const calculatePriorityScore = (knowledgeScore: number, eduImpact: number): number => {
  const ksWeighted = knowledgeScore * SCORING_WEIGHTS.knowledgeAlpha;
  const eiWeighted = eduImpact * SCORING_WEIGHTS.impactBeta;
  
  return Math.round(ksWeighted + eiWeighted);
};

/**
 * Leaderboard Ranking Daemon Evaluator
 * Algorithm: Evaluates and sorts all users by PriorityScore descending.
 */
export const generateGlobalLeaderboard = (allUsers: any[]): any[] => {
  const evaluatedUsers = allUsers.map(user => {
    const posts = user.posts || [];
    const ks = calculateKnowledgeScore(posts);
    const ei = calculateEducationalImpact(posts);
    const priority = calculatePriorityScore(ks, ei);
    
    return {
      ...user,
      knowledgeScore: ks,
      educationalImpact: ei,
      priorityScore: priority
    };
  });

  // Sort descending by Priority Score
  evaluatedUsers.sort((a, b) => b.priorityScore - a.priorityScore);

  // Assign Rank Designation
  return evaluatedUsers.map((user, index) => ({
    ...user,
    globalRank: index + 1
  }));
};
