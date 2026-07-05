import { supabase } from '../lib/supabase';
import { Post } from '../types';
import { OperationType } from './postService';
import { CombinedPost } from '../algorithms/search';
import {
  calculateKnowledgeScore as engCalculateKnowledgeScore,
  calculateEducationalImpact as engCalculateEducationalImpact,
  calculatePriorityScore as engCalculatePriorityScore
} from '../utils/scoringEngine';

export interface UserStats {
  knowledgeScore: number;
  eduImpact: number;
  platformAge: string;
  certificatesCount: number;
  contributorRank: string;
  achievements: string[];
  followersCount?: number;
  followingCount?: number;
}

export interface UserProfile {
  uid: string;
  username: string;
  fullName: string;
  email?: string;
  profileImage?: string;
  bio?: string;
  stats: UserStats;
  location?: string;
  website?: string;
  joinedDate?: string;
  expertise?: string[];
}

const SEED_CREATORS: UserProfile[] = [
  {
    uid: '00000000-0000-0000-0000-000000000001',
    username: 'dr_sarah_chen',
    fullName: 'Dr. Sarah Chen',
    email: 'sarah.chen@eduwatch.org',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    bio: 'Associate Professor of Computer Science at Stamford Academic Hub. Specializes in distributed compilers.',
    location: 'Stamford Academic Hub',
    website: 'stamford.edu/sarah_chen',
    joinedDate: 'September 2023',
    expertise: ['LMS Modularity', 'Distributed Engineering', 'System Concurrency', 'Concurrency Testing'],
    stats: {
      knowledgeScore: 14200,
      eduImpact: 9800,
      platformAge: '2.5 y',
      certificatesCount: 22,
      contributorRank: 'Elite Creator',
      achievements: ['Ecosystem Impact Champion'],
      followersCount: 18900,
      followingCount: 210
    }
  },
  {
    uid: '00000000-0000-0000-0000-000000000002',
    username: 'prof_liam_whitby',
    fullName: 'Prof. Liam Whitby',
    email: 'liam.whitby@eduwatch.org',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    bio: 'Distinguished Professor of Cognitive Philosophy. Reconstructing human interface paradigms.',
    location: 'Oxford Science Park',
    website: 'oxford.edu/liam_whitby',
    joinedDate: 'January 2024',
    expertise: ['UX Scaffolding', 'Cognitive Load Theory', 'User Centered Design', 'Pedagogy Interface'],
    stats: {
      knowledgeScore: 9200,
      eduImpact: 6400,
      platformAge: '2 y',
      certificatesCount: 11,
      contributorRank: 'Elite Scholar',
      achievements: ['Ecosystem Impact Champion'],
      followersCount: 12400,
      followingCount: 95
    }
  },
  {
    uid: '00000000-0000-0000-0000-000000000003',
    username: 'alex_rivera',
    fullName: 'Alex Rivera',
    email: 'alex_rivera@eduwatch.org',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    bio: 'Recognized industry expert and top curator in academic and technical journals.',
    location: 'Global',
    website: 'eduwatch.journal/alex_rivera',
    joinedDate: 'May 2025',
    expertise: ['Rust Compile Layer', 'Memory Footprint', 'Broker Ingestion', 'Backend Dev'],
    stats: {
      knowledgeScore: 11200,
      eduImpact: 7100,
      platformAge: '1 y',
      certificatesCount: 14,
      contributorRank: 'Master Scholar',
      achievements: ['Expert Pedagogue', 'Publishing Titan'],
      followersCount: 15600,
      followingCount: 120
    }
  }
];

function mapDbRowToProfile(row: any): UserProfile {
  return {
    uid: row.auth_id || row.uid,
    username: row.username,
    fullName: row.full_name || row.fullName,
    email: row.email,
    profileImage: row.avatar_url || row.profileImage,
    bio: row.bio || '',
    location: row.location || '',
    website: row.website || '',
    joinedDate: row.joined_date || row.joinedDate || '',
    expertise: row.expertise || [],
    stats: row.stats || {
      knowledgeScore: 0,
      eduImpact: 0,
      platformAge: '0 d',
      certificatesCount: 0,
      contributorRank: 'Rising Learner',
      achievements: ['Learning Peer'],
    },
  };
}

export class UserService {
  async getUserByUsername(username: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('username', username.trim())
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) return mapDbRowToProfile(data);

      const matchedSeed = SEED_CREATORS.find(
        sc => sc.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (matchedSeed) return matchedSeed;
      return null;
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return null;
    }
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', uid)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) return mapDbRowToProfile(data);

      const matchedSeed = SEED_CREATORS.find(sc => sc.uid === uid);
      if (matchedSeed) return matchedSeed;
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  async syncProfile(profile: Partial<UserProfile>): Promise<void> {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Not authenticated');

    try {
      const existing = await this.getUserProfile(authUser.id);

      const dbProfile: any = {
        auth_id: authUser.id,
        username: profile.username || authUser.email?.split('@')[0] || 'user',
        full_name: profile.fullName || authUser.user_metadata?.full_name || 'User',
        email: profile.email || authUser.email || '',
        avatar_url: profile.profileImage || authUser.user_metadata?.avatar_url || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        expertise: profile.expertise || [],
        joined_date: profile.joinedDate || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      };

      const { error } = await supabase.from('users').upsert(dbProfile, {
        onConflict: 'auth_id',
        ignoreDuplicates: false,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error syncing profile:', error);
    }
  }

  async recordActivity(uid: string, points: number): Promise<void> {
    // Will be handled by the scoring RPC function
  }

  calculatePlatformAge(joinedDateStr?: string): string {
    if (!joinedDateStr) return '0 d';
    try {
      const joinedTime = new Date(joinedDateStr).getTime();
      if (!isNaN(joinedTime)) {
        const diffMs = Date.now() - joinedTime;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) return '0 d';
        if (diffDays < 7) return `${diffDays} d`;
        const diffWeeks = Math.floor(diffDays / 7);
        if (diffWeeks < 4) return `${diffWeeks} w`;
        const diffMonths = Math.floor(diffDays / 30.4);
        if (diffMonths < 12) return `${diffMonths} m`;
        const diffYears = Math.floor(diffDays / 365);
        return `${diffYears} y`;
      }
    } catch (e) {
      console.error('Error calculating platform age:', e);
    }
    return '0 d';
  }

  calculateKnowledgeScore(posts: (Post | CombinedPost)[]): number {
    return engCalculateKnowledgeScore(posts);
  }

  calculateEduImpact(posts: (Post | CombinedPost)[]): number {
    return engCalculateEducationalImpact(posts);
  }

  calculateCertificatesCount(posts: (Post | CombinedPost)[], knowledgeScore: number, eduImpact: number): number {
    let count = 0;
    if (posts.length === 0) return 0;

    const postCount = posts.length;
    const hasLongForm = posts.some(p => ('format' in p ? p.format : 'article') === 'article');

    if (hasLongForm) count += 1;
    if (postCount >= 5) count += 1;

    const hasHighEngagement = posts.some(p => {
      const likes = 'likes' in p ? (p.likes || 0) : ('upvotes' in p ? (p.upvotes as number || 0) : 0);
      const views = 'views' in p ? (parseInt(String(p.views).replace(/[^0-9]/g, '')) || 0) : 0;
      return likes >= 5 || views >= 100;
    });
    if (hasHighEngagement) count += 1;
    if (knowledgeScore >= 100) count += 1;
    if (eduImpact >= 100) count += 1;

    return count;
  }

  getContributorRank(score: number): string {
    if (score >= 5000) return 'Elite Contributor';
    if (score >= 1500) return 'Top 1% Curator';
    if (score >= 500) return 'Active Mentor';
    if (score >= 100) return 'Active Contributor';
    return 'Rising Learner';
  }

  async syncCalculatedStats(
    uid: string,
    posts: any[],
    joinedDate?: string,
    followersList: string[] = [],
    followingList: string[] = []
  ): Promise<UserStats> {
    const platformAge = this.calculatePlatformAge(joinedDate);
    const knowledgeScore = this.calculateKnowledgeScore(posts);
    const eduImpact = this.calculateEduImpact(posts);
    const certificatesCount = this.calculateCertificatesCount(posts, knowledgeScore, eduImpact);
    const contributorRank = this.getContributorRank(knowledgeScore);
    const followersCount = followersList.length;
    const followingCount = followingList.length;

    const achievements: string[] = [];
    if (knowledgeScore >= 500) achievements.push('Expert Pedagogue');
    if (eduImpact >= 250) achievements.push('Ecosystem Impact Champion');
    if (posts.length >= 10) achievements.push('Publishing Titan');
    if (achievements.length === 0) achievements.push('Learning Peer');

    const stats: UserStats = {
      knowledgeScore,
      eduImpact,
      platformAge,
      certificatesCount,
      contributorRank,
      achievements,
      followersCount,
      followingCount
    };

    try {
      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', uid)
        .single();

      if (userRow) {
        await supabase.from('user_stats').upsert({
          user_id: userRow.id,
          knowledge_score: knowledgeScore,
          edu_impact: eduImpact,
          priority_score: engCalculatePriorityScore(knowledgeScore, eduImpact),
          contributor_rank: contributorRank,
          follower_count: followersCount,
          following_count: followingCount,
          post_count: posts.length,
        });
      }
    } catch (error) {
      console.warn("Failed to write updated stats:", error);
    }

    return stats;
  }

  async syncAllUserRanksAndLeaderboard(): Promise<any[]> {
    try {
      const { data: users } = await supabase.from('users').select('*');
      const { data: allPosts } = await supabase.from('posts').select('*');

      if (!users) return [];

      const usersCalculated = users.map(user => {
        const userPosts = (allPosts || []).filter((post: any) => post.author_id === user.id);
        const knowledgeScore = this.calculateKnowledgeScore(userPosts as any);
        const eduImpact = this.calculateEduImpact(userPosts as any);
        const priorityScore = engCalculatePriorityScore(knowledgeScore, eduImpact);

        return {
          ...user,
          knowledgeScore,
          eduImpact,
          priorityScore,
        };
      });

      usersCalculated.sort((a, b) => b.priorityScore - a.priorityScore);
      return usersCalculated.map((user, index) => ({
        ...user,
        globalRank: index + 1,
      }));
    } catch (e) {
      console.error('Error in syncAllUserRanksAndLeaderboard:', e);
      return [];
    }
  }

  getInitialStats(): UserStats {
    return {
      knowledgeScore: 0,
      eduImpact: 0,
      platformAge: '0 d',
      certificatesCount: 0,
      contributorRank: 'Rising Learner',
      achievements: ['Learning Peer'],
      followersCount: 0,
      followingCount: 0
    };
  }
}

export const userService = new UserService();
