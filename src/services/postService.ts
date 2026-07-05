import { supabase } from '../lib/supabase';
import { Post, Comment } from '../types';
import { extractHashtags, estimateReadTime } from '../algorithms/content';
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';

// Re-export for backward compatibility
export type { Post, Comment };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export const getISOStringFromTimestamp = (ts: any): string => {
  if (!ts) return new Date().toISOString();
  if (typeof ts === 'string') return ts;
  if (ts instanceof Date) return ts.toISOString();
  return new Date().toISOString();
};

export const externalizeMedia = (text: string): { text: string } => {
  if (!text) return { text };
  let result = text;
  const dataUrlRegex = /data:(image|video)\/[^;]+;base64,[A-Za-z0-9+/=]+/g;
  const matches = text.match(dataUrlRegex);
  if (matches) {
    matches.forEach(dataUrl => {
      const mediaId = `media_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
      try {
        localStorage.setItem(mediaId, dataUrl);
        result = result.replaceAll(dataUrl, `localstorage://${mediaId}`);
      } catch (err) {
        console.warn("localStorage quota exceeded:", err);
      }
    });
  }
  return { text: result };
};

export const internalizeMedia = (text: string): string => {
  if (!text) return text;
  let result = text;
  const localRefRegex = /localstorage:\/\/media_[A-Za-z0-9_]+/g;
  const matches = text.match(localRefRegex);
  if (matches) {
    matches.forEach(ref => {
      const mediaId = ref.replace('localstorage://', '');
      const dataUrl = localStorage.getItem(mediaId);
      if (dataUrl) {
        result = result.replaceAll(ref, dataUrl);
      }
    });
  }
  return result;
};

interface PostRow {
  id: string;
  author_id: string;
  title: string;
  subtitle: string | null;
  content: string;
  format: string;
  privacy: string;
  media_urls: string[];
  communities: string[];
  categories: string[];
  location: string | null;
  comments_enabled: boolean;
  created_at: string;
  users?: { full_name: string; username: string; avatar_url: string };
}

function mapRowToPost(row: PostRow): Post {
  const upvotes = 0;
  const downvotes = 0;
  const comments = 0;
  const shares = 0;
  const saves = 0;

  const intKey = `interactions_${row.id}`;
  try {
    const cached = localStorage.getItem(intKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        id: row.id,
        authorId: row.author_id,
        authorName: row.users?.full_name || '',
        authorImage: row.users?.avatar_url || '',
        title: row.title || '',
        subtitle: row.subtitle || undefined,
        content: internalizeMedia(row.content || ''),
        images: row.media_urls.length > 0 ? row.media_urls : undefined,
        mediaUrls: row.media_urls,
        format: row.format as 'article' | 'micropost',
        privacy: row.privacy as 'public' | 'followers' | 'communities',
        communities: row.communities,
        categories: row.categories,
        readTime: Math.max(1, Math.ceil((row.content || '').split(/\s+/).length / 200)),
        words: (row.content || '').split(/\s+/).length,
        createdAt: row.created_at,
        likes: parsed.upvotes || 0,
        upvotes: parsed.upvotes || 0,
        downvotes: parsed.downvotes || 0,
        comments: parsed.comments || 0,
        shares: parsed.shares || 0,
        saves: parsed.saves || 0,
        location: row.location || undefined,
        commentsEnabled: row.comments_enabled,
      };
    }
  } catch {}

  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.users?.full_name || '',
    authorImage: row.users?.avatar_url || '',
    title: row.title || '',
    subtitle: row.subtitle || undefined,
    content: internalizeMedia(row.content || ''),
    images: row.media_urls.length > 0 ? row.media_urls : undefined,
    mediaUrls: row.media_urls,
    format: row.format as 'article' | 'micropost',
    privacy: row.privacy as 'public' | 'followers' | 'communities',
    communities: row.communities,
    categories: row.categories,
    readTime: Math.max(1, Math.ceil((row.content || '').split(/\s+/).length / 200)),
    words: (row.content || '').split(/\s+/).length,
    createdAt: row.created_at,
    likes: upvotes,
    upvotes,
    downvotes,
    comments,
    shares,
    saves,
    location: row.location || undefined,
    commentsEnabled: row.comments_enabled,
  };
}

export const postService = {
  getPosts: async (): Promise<Post[]> => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, users!posts_author_id_fkey!inner(full_name, username, avatar_url)')
        .eq('privacy', 'public')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []).map((row: any) => mapRowToPost(row));
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  },

  createPost: async (postData: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments' | 'readTime' | 'words'>, files?: File[]): Promise<Post> => {
    try {
      const words = postData.content.split(/\s+/).length;
      const readTime = estimateReadTime(postData.content);

      const cleanContent = externalizeMedia(postData.content).text;
      const cleanImages = postData.images ? postData.images.map(img => {
        if (img.startsWith('data:')) {
          const mediaId = `media_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
          localStorage.setItem(mediaId, img);
          return `localstorage://${mediaId}`;
        }
        return img;
      }) : [];

      let finalMediaUrls = postData.mediaUrls || cleanImages;
      if (files && files.length > 0) {
        const { storageService } = await import('./storageService');
        const uploadPromises = files.map(file => storageService.uploadFile(file));
        const uploadedUrls = await Promise.all(uploadPromises);
        finalMediaUrls = [...finalMediaUrls, ...uploadedUrls];
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Not authenticated');

      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

      if (!userRow) throw new Error('User profile not found');

      const { data, error } = await supabase
        .from('posts')
        .insert({
          author_id: userRow.id,
          title: postData.title,
          subtitle: postData.subtitle || null,
          content: cleanContent,
          format: postData.format,
          privacy: postData.privacy || 'public',
          communities: postData.communities || [],
          categories: postData.categories || [],
          media_urls: finalMediaUrls,
          location: postData.location || null,
          comments_enabled: postData.commentsEnabled ?? true,
          tagged_users: [],
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...postData,
        id: data.id,
        createdAt: data.created_at,
        likes: 0,
        comments: 0,
        readTime,
        words,
        content: internalizeMedia(cleanContent),
        images: cleanImages,
      } as Post;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  getGlobalFeed: async (): Promise<Post[]> => {
    return postService.getPosts();
  },

  getUserTimeline: async (uid: string): Promise<Post[]> => {
    try {
      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', uid)
        .single();

      if (!userRow) return [];

      const { data, error } = await supabase
        .from('posts')
        .select('*, users!posts_author_id_fkey!inner(full_name, username, avatar_url)')
        .eq('author_id', userRow.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((row: any) => mapRowToPost(row));
    } catch (error) {
      console.error('Error fetching user timeline:', error);
      return [];
    }
  },

  voteInPoll: async (postId: string, optionId: string): Promise<any> => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return null;

      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

      if (!userRow) return null;

      const { data: existingVote } = await supabase
        .from('poll_votes')
        .select('*')
        .eq('user_id', userRow.id)
        .eq('option_id', optionId)
        .single();

      if (existingVote) return null;

      await supabase
        .from('poll_votes')
        .insert({ user_id: userRow.id, option_id: optionId });

      const { data: poll } = await supabase
        .from('polls')
        .select('*, poll_options(*)')
        .eq('post_id', postId)
        .single();

      return poll;
    } catch (error) {
      console.error('Error voting in poll:', error);
      return null;
    }
  },

  deletePost: async (postId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  },

  updatePostPrivacy: async (postId: string, privacy: 'public' | 'followers' | 'communities'): Promise<void> => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ privacy })
        .eq('id', postId);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating post privacy:', error);
    }
  },

  updatePost: async (postId: string, updates: Partial<Post>): Promise<void> => {
    try {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.content !== undefined) {
        dbUpdates.content = externalizeMedia(updates.content).text;
      }
      if (updates.privacy !== undefined) dbUpdates.privacy = updates.privacy;
      if (updates.categories !== undefined) dbUpdates.categories = updates.categories;

      const { error } = await supabase
        .from('posts')
        .update(dbUpdates)
        .eq('id', postId);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating post:', error);
    }
  },

  toggleLike: async (postId: string): Promise<{ upvotes: number, downvotes: number, isLiked: boolean }> => {
    const likedPosts: string[] = JSON.parse(localStorage.getItem('liked_posts') || '[]');
    const downvotedPosts: string[] = JSON.parse(localStorage.getItem('downvoted_posts') || '[]');
    const wasLiked = likedPosts.includes(postId);
    const wasDownvoted = downvotedPosts.includes(postId);
    const nowLiked = !wasLiked;

    const oldInter = JSON.parse(localStorage.getItem(`interactions_${postId}`) || '{"upvotes":0,"downvotes":0}');

    localStorage.setItem('liked_posts', JSON.stringify(
      wasLiked ? likedPosts.filter(id => id !== postId) : [...likedPosts, postId]
    ));
    if (wasDownvoted) {
      localStorage.setItem('downvoted_posts', JSON.stringify(
        downvotedPosts.filter(id => id !== postId)
      ));
    }

    localStorage.setItem(`interactions_${postId}`, JSON.stringify({
      upvotes: Math.max(0, oldInter.upvotes + (nowLiked ? 1 : -1)),
      downvotes: wasDownvoted ? Math.max(0, oldInter.downvotes - 1) : oldInter.downvotes,
    }));

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      const cached = JSON.parse(localStorage.getItem(`interactions_${postId}`) || '{"upvotes":0,"downvotes":0}');
      return { upvotes: cached.upvotes || 0, downvotes: cached.downvotes || 0, isLiked: nowLiked };
    }

    const { data: userRow } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .single();

    if (!userRow) return { upvotes: 0, downvotes: 0, isLiked: nowLiked };

    const { data: existing } = await supabase
      .from('post_votes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userRow.id)
      .single();

    let isLiked = false;
    if (existing) {
      if (existing.vote_type === 'up') {
        await supabase.from('post_votes').delete().eq('post_id', postId).eq('user_id', userRow.id);
      } else {
        await supabase.from('post_votes').update({ vote_type: 'up' }).eq('post_id', postId).eq('user_id', userRow.id);
        isLiked = true;
      }
    } else {
      await supabase.from('post_votes').insert({ post_id: postId, user_id: userRow.id, vote_type: 'up' });
      isLiked = true;
    }

    const { data: counts } = await supabase
      .rpc('get_vote_counts', { p_post_id: postId });

    const upvotes = counts?.upvotes || 0;
    const downvotes = counts?.downvotes || 0;
    localStorage.setItem(`interactions_${postId}`, JSON.stringify({ upvotes, downvotes }));

    const likedFinal: string[] = JSON.parse(localStorage.getItem('liked_posts') || '[]');
    const downvotedFinal: string[] = JSON.parse(localStorage.getItem('downvoted_posts') || '[]');
    const filteredLiked = likedFinal.filter(id => id !== postId);
    const filteredDownvoted = downvotedFinal.filter(id => id !== postId);
    if (isLiked) filteredLiked.push(postId);
    localStorage.setItem('liked_posts', JSON.stringify(filteredLiked));
    localStorage.setItem('downvoted_posts', JSON.stringify(filteredDownvoted));

    return { upvotes, downvotes, isLiked };
  },

  toggleDownvote: async (postId: string): Promise<{ upvotes: number, downvotes: number, isDownvoted: boolean }> => {
    const likedPosts: string[] = JSON.parse(localStorage.getItem('liked_posts') || '[]');
    const downvotedPosts: string[] = JSON.parse(localStorage.getItem('downvoted_posts') || '[]');
    const wasDownvoted = downvotedPosts.includes(postId);
    const wasLiked = likedPosts.includes(postId);
    const nowDownvoted = !wasDownvoted;

    const oldInter = JSON.parse(localStorage.getItem(`interactions_${postId}`) || '{"upvotes":0,"downvotes":0}');

    localStorage.setItem('downvoted_posts', JSON.stringify(
      wasDownvoted ? downvotedPosts.filter(id => id !== postId) : [...downvotedPosts, postId]
    ));
    if (wasLiked) {
      localStorage.setItem('liked_posts', JSON.stringify(
        likedPosts.filter(id => id !== postId)
      ));
    }

    localStorage.setItem(`interactions_${postId}`, JSON.stringify({
      upvotes: wasLiked ? Math.max(0, oldInter.upvotes - 1) : oldInter.upvotes,
      downvotes: Math.max(0, oldInter.downvotes + (nowDownvoted ? 1 : -1)),
    }));

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { upvotes: 0, downvotes: 0, isDownvoted: nowDownvoted };

    const { data: userRow } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .single();

    if (!userRow) return { upvotes: 0, downvotes: 0, isDownvoted: nowDownvoted };

    const { data: existing } = await supabase
      .from('post_votes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userRow.id)
      .single();

    let isDownvoted = false;
    if (existing) {
      if (existing.vote_type === 'down') {
        await supabase.from('post_votes').delete().eq('post_id', postId).eq('user_id', userRow.id);
      } else {
        await supabase.from('post_votes').update({ vote_type: 'down' }).eq('post_id', postId).eq('user_id', userRow.id);
        isDownvoted = true;
      }
    } else {
      await supabase.from('post_votes').insert({ post_id: postId, user_id: userRow.id, vote_type: 'down' });
      isDownvoted = true;
    }

    const { data: counts } = await supabase
      .rpc('get_vote_counts', { p_post_id: postId });

    const upvotes = counts?.upvotes || 0;
    const downvotes = counts?.downvotes || 0;
    localStorage.setItem(`interactions_${postId}`, JSON.stringify({ upvotes, downvotes }));

    const likedFinal: string[] = JSON.parse(localStorage.getItem('liked_posts') || '[]');
    const downvotedFinal: string[] = JSON.parse(localStorage.getItem('downvoted_posts') || '[]');
    const filteredLiked = likedFinal.filter(id => id !== postId);
    const filteredDownvoted = downvotedFinal.filter(id => id !== postId);
    if (isDownvoted) filteredDownvoted.push(postId);
    localStorage.setItem('liked_posts', JSON.stringify(filteredLiked));
    localStorage.setItem('downvoted_posts', JSON.stringify(filteredDownvoted));

    return { upvotes, downvotes, isDownvoted };
  },

  isPostLiked: (postId: string): boolean => {
    const liked = JSON.parse(localStorage.getItem('liked_posts') || '[]');
    return liked.includes(postId);
  },

  isPostDownvoted: (postId: string): boolean => {
    const downvoted = JSON.parse(localStorage.getItem('downvoted_posts') || '[]');
    return downvoted.includes(postId);
  },

  isPostReposted: (postId: string, username: string): boolean => {
    const reposted = JSON.parse(localStorage.getItem(`reposted_${username}`) || '[]');
    return reposted.includes(postId);
  },

  toggleRepost: async (postId: string, username: string): Promise<boolean> => {
    const key = `reposted_${username}`;
    const reposted = JSON.parse(localStorage.getItem(key) || '[]');
    const index = reposted.indexOf(postId);
    let isReposted = false;

    if (index >= 0) {
      reposted.splice(index, 1);
    } else {
      reposted.push(postId);
      isReposted = true;
    }
    localStorage.setItem(key, JSON.stringify(reposted));

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

      if (userRow) {
        if (isReposted) {
          await supabase.from('post_shares').insert({ post_id: postId, user_id: userRow.id });
        } else {
          await supabase.from('post_shares').delete().eq('post_id', postId).eq('user_id', userRow.id);
        }
      }
    }

    return isReposted;
  },

  getExtraInteractions: (postId: string): { upvotes: number, downvotes: number, comments: number, shares: number } => {
    const key = `interactions_${postId}`;
    const value = localStorage.getItem(key);
    if (value) {
      return JSON.parse(value);
    }
    return { upvotes: 0, downvotes: 0, comments: 0, shares: 0 };
  },

  getAllPosts: async (): Promise<Post[]> => {
    const firestorePosts = await postService.getPosts();
    const { feed } = await import('../lib/feedData');

    const staticPosts: Post[] = feed.map(item => {
      const postId = item.id;
      const upvotes = 'likes' in item ? (item as any).likes : 0;
      const downvotes = 'downvotes' in item ? (item as any).downvotes : 0;

      const intKey = `interactions_${postId}`;
      if (!localStorage.getItem(intKey)) {
        const comments = 'comments' in item ? (item as any).comments : 0;
        const shares = 'shares' in item ? (item as any).shares : 0;
        localStorage.setItem(intKey, JSON.stringify({ upvotes, downvotes, comments, shares }));
      }

      return {
        id: postId,
        authorId: 'static',
        authorName: item.author,
        authorImage: `https://i.pravatar.cc/100?u=${item.author}`,
        title: item.title,
        subtitle: item.description,
        content: '',
        format: (item as any).format || 'article' as 'article' | 'micropost',
        privacy: 'public',
        readTime: parseInt(String(item.readTime)) || 5,
        words: 0,
        createdAt: item.date,
        likes: upvotes,
        comments: 'comments' in item ? (item as any).comments : 0,
        commentsEnabled: true,
      } as Post;
    });

    return [...firestorePosts, ...staticPosts];
  },

  parseHashtags: (text: string): string[] => extractHashtags(text),

  searchPosts: async (query: string): Promise<Post[]> => {
    const allPosts = await postService.getAllPosts();
    const { filterSearchResults } = await import('../algorithms/search');
    return filterSearchResults(allPosts, query, {}, extractHashtags) as Post[];
  },

  getComments: (postId: string): Comment[] => {
    const key = `comments_${postId}`;
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : [];
  },

  addComment: async (postId: string, commentData: { authorId: string, authorName: string, authorImage: string, text: string }): Promise<Comment[]> => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return [];

      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

      if (!userRow) return [];

      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        author_id: userRow.id,
        content: commentData.text,
      });

      if (error) throw error;

      const comments = postService.getComments(postId);
      const newComment: Comment = {
        id: `tmp_${Date.now()}`,
        authorId: commentData.authorId,
        authorName: commentData.authorName,
        authorImage: commentData.authorImage,
        text: commentData.text,
        createdAt: new Date().toISOString(),
        likes: 0,
        replies: [],
      };

      const updated = [...comments, newComment];
      localStorage.setItem(`comments_${postId}`, JSON.stringify(updated));

      return updated;
    } catch (error) {
      console.error('Error adding comment:', error);
      return [];
    }
  },

  toggleCommentLike: (postId: string, commentId: string): { comment: Comment | null, isLiked: boolean } => {
    const key = `comment_likes_${postId}`;
    const liked: string[] = JSON.parse(localStorage.getItem(key) || '[]');
    const wasLiked = liked.includes(commentId);
    const updated = wasLiked ? liked.filter(id => id !== commentId) : [...liked, commentId];
    localStorage.setItem(key, JSON.stringify(updated));

    const commentsKey = `comments_${postId}`;
    const comments = JSON.parse(localStorage.getItem(commentsKey) || '[]');
    const updatedComments = comments.map((c: any) => {
      if (c.id === commentId) {
        return { ...c, likes: Math.max(0, (c.likes || 0) + (wasLiked ? -1 : 1)) };
      }
      return c;
    });
    localStorage.setItem(commentsKey, JSON.stringify(updatedComments));

    const comment = updatedComments.find((c: any) => c.id === commentId) || null;
    return { comment, isLiked: !wasLiked };
  },

  toggleCommentDownvote: (postId: string, commentId: string): { comment: Comment | null, isDownvoted: boolean } => {
    const key = `comment_downvotes_${postId}`;
    const downvoted: string[] = JSON.parse(localStorage.getItem(key) || '[]');
    const wasDownvoted = downvoted.includes(commentId);
    const updated = wasDownvoted ? downvoted.filter(id => id !== commentId) : [...downvoted, commentId];
    localStorage.setItem(key, JSON.stringify(updated));
    return { comment: null, isDownvoted: !wasDownvoted };
  },

  isCommentLiked: (postId: string, commentId: string): boolean => {
    const liked: string[] = JSON.parse(localStorage.getItem(`comment_likes_${postId}`) || '[]');
    return liked.includes(commentId);
  },
  isCommentDownvoted: (postId: string, commentId: string): boolean => {
    const downvoted: string[] = JSON.parse(localStorage.getItem(`comment_downvotes_${postId}`) || '[]');
    return downvoted.includes(commentId);
  },

  addReply: (postId: string, parentCommentId: string, replyData: { authorId: string, authorName: string, authorImage: string, text: string }): Comment[] => {
    try {
      const comments = postService.getComments(postId);
      const updated = comments.map(comment => {
        if (comment.id === parentCommentId) {
          const replies = comment.replies || [];
          const newReply: Comment = {
            id: `reply_${Date.now()}`,
            authorId: replyData.authorId,
            authorName: replyData.authorName,
            authorImage: replyData.authorImage,
            text: replyData.text,
            createdAt: new Date().toISOString(),
            likes: 0,
            replies: [],
          };
          return { ...comment, replies: [...replies, newReply] };
        }
        return comment;
      });
      localStorage.setItem(`comments_${postId}`, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  toggleBookmark: (postId: string): boolean => {
    const key = 'bookmarked_posts';
    const bookmarked = JSON.parse(localStorage.getItem(key) || '[]');
    const index = bookmarked.indexOf(postId);
    let isBookmarked = false;
    if (index >= 0) {
      bookmarked.splice(index, 1);
    } else {
      bookmarked.push(postId);
      isBookmarked = true;
    }
    localStorage.setItem(key, JSON.stringify(bookmarked));
    return isBookmarked;
  },

  isBookmarked: (postId: string): boolean => {
    const key = 'bookmarked_posts';
    const bookmarked = JSON.parse(localStorage.getItem(key) || '[]');
    return bookmarked.includes(postId);
  },

  getBookmarkedPostIds: (): string[] => {
    const key = 'bookmarked_posts';
    return JSON.parse(localStorage.getItem(key) || '[]');
  },

  getFollowersFeed: async (currentUsername: string): Promise<Post[]> => {
    try {
      const followingKey = 'curator_following_map';
      const followingMap = JSON.parse(localStorage.getItem(followingKey) || '{}');
      const followedUsernames: string[] = followingMap[currentUsername] || [];

      if (followedUsernames.length === 0) return [];

      const { data: users } = await supabase
        .from('users')
        .select('id, username')
        .in('username', followedUsernames.map(u => u.toLowerCase()));

      if (!users) return [];

      const followedIds = users.map(u => u.id);

      const { data: posts, error } = await supabase
        .from('posts')
        .select('*, users!posts_author_id_fkey!inner(full_name, username, avatar_url)')
        .in('author_id', followedIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (posts || []).map((row: any) => mapRowToPost(row));
    } catch (error) {
      console.error('Error fetching followers feed:', error);
      return [];
    }
  },

  getCommunityFeed: async (communityName: string): Promise<Post[]> => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, users!posts_author_id_fkey!inner(full_name, username, avatar_url)')
        .contains('communities', [communityName])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((row: any) => mapRowToPost(row));
    } catch (error) {
      console.error('Error fetching community feed:', error);
      return [];
    }
  },

  subscribeGlobalFeed: (onUpdate: (posts: Post[]) => void, onError?: (err: any) => void) => {
    const subscription = supabase
      .channel('global-feed')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'posts', filter: 'privacy=eq.public' },
        async () => {
          try {
            const posts = await postService.getPosts();
            onUpdate(posts);
          } catch (err) {
            if (onError) onError(err);
          }
        }
      )
      .subscribe(async (status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          try {
            const posts = await postService.getPosts();
            onUpdate(posts);
          } catch (err) {
            if (onError) onError(err);
          }
        } else if (onError) {
          onError(new Error(`Subscription status: ${status}`));
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  },

  subscribeUserTimeline: (uid: string, onUpdate: (posts: Post[]) => void, onError?: (err: any) => void) => {
    const subscription = supabase
      .channel(`timeline-${uid}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        async () => {
          try {
            const posts = await postService.getUserTimeline(uid);
            onUpdate(posts);
          } catch (err) {
            if (onError) onError(err);
          }
        }
      )
      .subscribe(async (status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          try {
            const posts = await postService.getUserTimeline(uid);
            onUpdate(posts);
          } catch (err) {
            if (onError) onError(err);
          }
        } else if (onError) {
          onError(new Error(`Subscription status: ${status}`));
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  },
};
