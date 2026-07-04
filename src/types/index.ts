export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorImage: string;
  title: string;
  subtitle?: string;
  content: string;
  images?: string[];
  mediaUrls?: string[];
  format: 'article' | 'micropost';
  privacy: 'public' | 'followers' | 'communities';
  communities?: string[];
  categories?: string[];
  readTime: number;
  words: number;
  createdAt: string;
  likes: number;
  upvotes?: number;
  downvotes?: number;
  comments: number;
  shares?: number;
  saves?: number;
  taggedUsers?: { id: string, name: string }[];
  location?: string;
  commentsEnabled: boolean;
  sharedPost?: {
    id: string;
    authorName: string;
    authorImage?: string;
    title?: string;
    content?: string;
    format: 'article' | 'micropost';
    image?: string;
  };
  poll?: {
    question: string;
    options: {
      id: string;
      text: string;
      votes: number;
    }[];
    voters?: { [userId: string]: string };
    expiresAt?: string;
  };
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorImage: string;
  text: string;
  createdAt: string;
  likes: number;
  upvotes?: number;
  downvotes?: number;
  replies: Comment[];
}

export type VoteType = 'up' | 'down' | null;
