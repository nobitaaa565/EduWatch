import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocial } from '../lib/social';
import { useAuth } from '../lib/AuthContext';
import { useSidebar } from '../lib/SidebarContext';
import { useTheme } from '../lib/ThemeContext';
import { TopBar } from '../components/TopBar';
import { Sidebar } from '../components/Sidebar';
import { feed, creators } from '../lib/feedData';
import { postService, Post as LocalPost } from '../services/postService';
import { userService } from '../services/userService';
import { PostSkeleton, ProfileHeaderSkeleton } from '../components/Skeleton';
import { FeedItem } from '../components/FeedItem';
import { PostModal } from '../components/PostModal';
import { 
  MapPin, 
  ChevronLeft, 
  Users, 
  MessageSquare, 
  Sparkles, 
  Heart, 
  Share2, 
  Award, 
  Globe, 
  BookOpen, 
  Terminal, 
  Zap, 
  Lock, 
  Clock, 
  UserPlus, 
  UserCheck, 
  ShieldAlert,
  Send,
  ExternalLink,
  ChevronRight,
  Brain,
  ThumbsUp,
  Mail,
  Palette,
  Camera,
  TrendingUp,
  FileText,
  Bookmark,
  BellOff,
  Briefcase,
  GraduationCap,
  Info,
  Calendar,
  Link as LinkIcon,
  Plus,
  Shield,
  User as UserIcon,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AnimatePresence, motion } from 'motion/react';

const isVideoUrl = (url: string) => {
  if (!url) return false;
  return url.startsWith('data:video/') || url.match(/\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i);
};

export default function OtherProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { isCollapsed, setCollapsed } = useSidebar();
  const { theme } = useTheme();

  // Reset sidebars
  useEffect(() => {
    setCollapsed(true);
  }, [setCollapsed]);

  const { 
    registry, 
    following, 
    followers, 
    newFollowers, 
    toggleFollow, 
    getMutualFollows,
    checkRequireFollowApproval,
    pendingRequestsSent
  } = useSocial();

  const [targetUser, setTargetUser] = useState<any>(null);

  // Find user dynamically
  useEffect(() => {
    if (!username) return;
    
    // First find immediate static fallback
    let localUser = registry.find(r => r.username.toLowerCase() === username.toLowerCase());
    if (!localUser) {
      const c = creators.find(creator => 
        creator.name.toLowerCase().replace(/\s/g, '_') === username.toLowerCase() || 
        creator.name.toLowerCase().replace(/\s/g, '-') === username.toLowerCase() ||
        creator.name.toLowerCase().replace(/[\s\.]/g, '_') === username.toLowerCase()
      );
      if (c) {
        localUser = {
          id: c.id,
          username: c.name.toLowerCase().replace(/\s/g, '_'),
          name: c.name,
          role: c.role,
          img: c.avatar,
          bio: 'Recognized industry expert and top curator in academic and technical journals.',
          location: 'Global',
          joinedAt: Date.now() - 31536000000
        };
      }
    }
    
    setTargetUser(localUser);
    setIsInitialLoading(true);

    const loadDbUser = async () => {
      try {
        const dbProfile = await userService.getUserByUsername(username);
        if (dbProfile) {
          setTargetUser({
            id: dbProfile.uid,
            username: dbProfile.username,
            name: dbProfile.fullName,
            role: dbProfile.stats?.contributorRank || dbProfile.expertise?.[0] || 'Member',
            img: dbProfile.profileImage || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
            bio: dbProfile.bio || '',
            location: dbProfile.location || '',
            website: dbProfile.website || '',
            joinedDate: dbProfile.joinedDate || 'May 2025',
            stats: dbProfile.stats,
            expertise: dbProfile.expertise,
          });
        }
      } catch (err) {
        console.error("Error loading dB user:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadDbUser();
  }, [username, registry]);

  const statusMode = useMemo(() => {
    if (!targetUser) return 'active';
    if (targetUser.name === 'Alex Rivera') return 'away';
    if (targetUser.name === 'Prof. Liam Whitby') return 'dnd';
    return 'active';
  }, [targetUser]);

  const statusConfigs = {
    active: { color: 'text-green-500', bgColor: 'bg-green-500', label: 'Active', icon: Zap },
    away: { color: 'text-yellow-500', bgColor: 'bg-yellow-500', label: 'Away', icon: Clock },
    dnd: { color: 'text-red-500', bgColor: 'bg-red-500', label: 'Do Not Disturb', icon: BellOff }
  };

  const statusModeConfig = statusConfigs[statusMode];

  // Specific cover photos depending on curator theme
  const coverImage = useMemo(() => {
    if (!targetUser) return 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=2000';
    if (targetUser.name === 'Dr. Sarah Chen') {
      return 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=2000'; // Tech/Semiconductors
    }
    if (targetUser.name === 'Alex Rivera') {
      return 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&q=80&w=2000'; // Rust compiler code
    }
    if (targetUser.name === 'Prof. Liam Whitby') {
      return 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=2000'; // UX Workspace
    }
    return 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=2000'; // Study library
  }, [targetUser]);

  // Comprehensive User statistics loaded Reddit-Style
  const targetStats = useMemo(() => {
    if (!targetUser) return null;
    const c = creators.find(creator => creator.name === targetUser.name);
    const followersVal = targetUser.stats?.followersCount || c?.followers || 1480;
    const likesVal = targetUser.stats?.likes || c?.likes || 5200;
    const knowledgeScore = targetUser.stats?.knowledgeScore || Math.floor(likesVal * 1.5 + (followersVal * 0.8));
    const eduImpact = targetUser.stats?.eduImpact || Math.floor(likesVal * 2.1 + (c?.shares || 280) * 4.5);
    return {
      followers: followersVal,
      following: targetUser.stats?.followingCount || 120,
      likes: likesVal,
      shares: targetUser.stats?.shares || c?.shares || 280,
      knowledgeScore,
      eduImpact,
      platformAge: targetUser.stats?.platformAge || '1 y',
      contributorRank: targetUser.stats?.contributorRank || (knowledgeScore > 5000 ? 'Master Scholar' : 'Elite Creator'),
      certificatesCount: targetUser.stats?.certificatesCount || 14,
      joinedDate: targetUser.joinedDate || 'May 2025'
    };
  }, [targetUser]);

  // Synchronized view scroll handlers mimicking Profile.tsx
  const leftSidebarRef = useRef<HTMLElement>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleGlobalWheel = (e: WheelEvent) => {
      const target = e.target as Node;
      const isOverLeft = leftSidebarRef.current?.contains(target);
      const isOverMainScroll = mainScrollRef.current?.contains(target);

      if (!isOverLeft && !isOverMainScroll && pageContainerRef.current?.contains(target)) {
        if (mainScrollRef.current) {
          mainScrollRef.current.scrollTop += e.deltaY;
        }
      }
    };

    window.addEventListener('wheel', handleGlobalWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleGlobalWheel);
  }, []);

  // Post & Tab States
  const [activeTab, setActiveTab] = useState('overview');
  const [userPosts, setUserPosts] = useState<LocalPost[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [selectedPostModal, setSelectedPostModal] = useState<LocalPost | null>(null);

  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePostAction = (item: LocalPost, fromMedia = false) => {
    if ((item as any).sharedPost || item.format === 'micropost') {
      if (fromMedia) {
        navigate(`/micro-post/${item.id}`);
      } else {
        setSelectedPostModal(item);
      }
    } else {
      navigate(`/article/${item.id}`);
    }
  };

  // Preseed fallback posts for when they have no Firestore posts yet
  const fallbacksList = useMemo(() => {
    if (!targetUser) return [];
    
    // Fallback seed articles
    const seededArticles = feed.filter(f => f.author.toLowerCase() === targetUser.name.toLowerCase());
    
    // Fallback seed microposts
    const tMicro: LocalPost[] = [
      {
        id: `m_${targetUser.username}_1`,
        authorId: targetUser.id,
        authorName: targetUser.name,
        authorImage: targetUser.img,
        title: '',
        content: `Refining the cache invalidation bounds for distributed educational clusters. Even a 50ms propagation delay can trigger cascading session timeouts during exams. #architecture #distributed #scaling`,
        format: 'micropost',
        privacy: 'public',
        readTime: 1,
        words: 25,
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4h ago
        likes: 124,
        upvotes: 124,
        downvotes: 1,
        comments: 12,
        commentsEnabled: true
      },
      {
        id: `m_{targetUser.username}_2`,
        authorId: targetUser.id,
        authorName: targetUser.name,
        authorImage: targetUser.img,
        title: '',
        content: `Just published observations on structural cognitive load. Too much clutter actively inhibits core retention. Good pedagogy requires extreme simplicity in interface design. #uxdesign #mentalmodels #retention`,
        format: 'micropost',
        privacy: 'public',
        readTime: 1,
        words: 30,
        createdAt: new Date(Date.now() - 3600000 * 28).toISOString(), // Yesterday
        likes: 248,
        upvotes: 248,
        downvotes: 3,
        comments: 24,
        commentsEnabled: true
      }
    ];

    if (targetUser.name === 'Alex Rivera') {
      tMicro[0].content = `Memory footprint updates! Rewriting our high-concurrency ingestion loops in Rust cut memory spikes by 74%. Platform reliability is paramount for universal access. #rustlang #concurrency #backend`;
    } else if (targetUser.name === 'Dr. Sarah Chen') {
      tMicro[0].content = `Why distributed monoliths represent the silent disaster of online LMS platforms. Keep your services isolated if you want them to survive extreme exam week concurrency! #distributed #scaling #lms`;
    }

    const tArticles: LocalPost[] = seededArticles.map(art => ({
      id: art.id,
      authorId: targetUser.id,
      authorName: targetUser.name,
      authorImage: targetUser.img,
      title: art.title,
      subtitle: art.description,
      content: (art as any).markdown || art.description,
      images: [art.image],
      format: 'article',
      privacy: 'public',
      readTime: parseInt(art.readTime) || 3,
      words: 450,
      createdAt: new Date(art.date).toISOString(),
      likes: parseInt(art.views) ? Math.floor(parseInt(art.views) / 4) : 180,
      upvotes: parseInt(art.views) ? Math.floor(parseInt(art.views) / 4) : 180,
      downvotes: 4,
      comments: 15,
      commentsEnabled: true
    }));

    return [...tMicro, ...tArticles];
  }, [targetUser]);

  // Loading indicator matching Profile.tsx
  useEffect(() => {
    if (!targetUser) return;
    setIsInitialLoading(true);
    setIsContentLoading(true);

    const timer = setTimeout(() => {
      setIsInitialLoading(false);
      setIsContentLoading(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [targetUser]);

  // Load posts dynamically
  useEffect(() => {
    if (!targetUser) return;
    setIsContentLoading(true);

    const fetchPosts = async () => {
      try {
        const allPosts = await postService.getAllPosts();
        
        // Filter live posts made by this user
        const matchedLive = allPosts.filter(p => 
          p.authorId === targetUser.id || 
          p.authorName.toLowerCase() === targetUser.name.toLowerCase() ||
          (p as any).authorUsername?.toLowerCase() === targetUser.username.toLowerCase()
        );

        // Merge live posts with fallback seeds to guarantee rich profiles
        const merged = [...matchedLive];
        fallbacksList.forEach(fb => {
          if (!merged.some(m => m.id === fb.id || m.title === fb.title)) {
            merged.push(fb);
          }
        });

        // Filter by active tab
        let filtered: LocalPost[] = [];
        if (activeTab === 'microposts') {
          filtered = merged.filter(p => p.format === 'micropost');
        } else if (activeTab === 'articles') {
          filtered = merged.filter(p => p.format === 'article');
        } else if (activeTab === 'photos') {
          filtered = merged.filter(p => p.images && p.images.some(img => !isVideoUrl(img)));
        } else if (activeTab === 'videos') {
          filtered = merged.filter(p => p.images && p.images.some(img => isVideoUrl(img)));
        } else {
          filtered = merged;
        }

        // Sort chronologically
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setUserPosts(filtered);
      } catch (err) {
        console.error("Failed to load user posts", err);
        // On error, proceed with seeded fallbacks
        let fbFiltered = [...fallbacksList];
        if (activeTab === 'microposts') {
          fbFiltered = fallbacksList.filter(p => p.format === 'micropost');
        } else if (activeTab === 'articles') {
          fbFiltered = fallbacksList.filter(p => p.format === 'article');
        } else if (activeTab === 'photos') {
          fbFiltered = fallbacksList.filter(p => p.images && p.images.some(img => !isVideoUrl(img)));
        } else if (activeTab === 'videos') {
          fbFiltered = fallbacksList.filter(p => p.images && p.images.some(img => isVideoUrl(img)));
        }
        fbFiltered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setUserPosts(fbFiltered);
      } finally {
        setIsContentLoading(false);
      }
    };

    fetchPosts();
  }, [targetUser, activeTab, fallbacksList]);

  // Social actions
  const isCurrentlyFollowing = following.includes(targetUser?.username || '');
  const isCurrentlyPending = pendingRequestsSent.includes(targetUser?.username || '');
  const requiresApproval = checkRequireFollowApproval(targetUser?.username || '');
  const mutualConnections = getMutualFollows(targetUser?.username || '');

  const [connectionsSubTab, setConnectionsSubTab] = useState<'followers' | 'following'>('followers');

  const targetFollowersList = useMemo(() => {
    if (!targetUser) return [];
    const othersInRegistry = registry.filter(r => r.username.toLowerCase() !== targetUser.username.toLowerCase());
    const extraCreators = creators
      .filter(c => c.name !== targetUser.name)
      .map(c => ({
        id: c.id || `cre_${c.name.toLowerCase().replace(/\s/g, '_')}`,
        username: c.name.toLowerCase().replace(/\s/g, '_'),
        name: c.name,
        role: c.role || 'Member',
        img: c.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        bio: '',
        location: 'Global',
      }));

    const combined = [...othersInRegistry];
    for (const ext of extraCreators) {
      if (!combined.some(u => u.username.toLowerCase() === ext.username.toLowerCase())) {
        combined.push(ext);
      }
    }

    if (isCurrentlyFollowing && currentUser) {
      const cu = {
        id: currentUser.id || 'curr_user',
        username: currentUser.username || 'current_user',
        name: currentUser.fullName || currentUser.username || 'You',
        role: 'Curating Scholar',
        img: currentUser.profileImage || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        bio: currentUser.bio || '',
        location: 'Local',
      };
      if (!combined.some(u => u.username.toLowerCase() === cu.username.toLowerCase())) {
        combined.push(cu);
      }
    }

    return combined.slice(0, 5);
  }, [targetUser, registry, isCurrentlyFollowing, currentUser]);

  const targetFollowingList = useMemo(() => {
    if (!targetUser) return [];
    const othersInRegistry = registry.filter(r => r.username.toLowerCase() !== targetUser.username.toLowerCase());
    const extraCreators = creators
      .filter(c => c.name !== targetUser.name)
      .map(c => ({
        id: c.id || `cre_${c.name.toLowerCase().replace(/\s/g, '_')}`,
        username: c.name.toLowerCase().replace(/\s/g, '_'),
        name: c.name,
        role: c.role || 'Member',
        img: c.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        bio: '',
        location: 'Global',
      }));

    const combined = [...othersInRegistry];
    for (const ext of extraCreators) {
      if (!combined.some(u => u.username.toLowerCase() === ext.username.toLowerCase())) {
        combined.push(ext);
      }
    }

    return combined.reverse().slice(0, 4);
  }, [targetUser, registry]);

  const handleFollowClick = () => {
    if (targetUser) {
      toggleFollow(targetUser.username);
    }
  };

  const handleBackByHistory = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/find-people');
    }
  };

  // Review & Compliments Subsystem
  const [complimentText, setComplimentText] = useState('');
  const [receivedCompliments, setReceivedCompliments] = useState<Array<{ id: string; sender: string; text: string; date: string }>>([]);
  const [showComplimentModal, setShowComplimentModal] = useState(false);
  const [showAllComplimentsModal, setShowAllComplimentsModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (targetUser) {
      const saved = localStorage.getItem(`compliments_${targetUser.username}`);
      if (saved) {
        setReceivedCompliments(JSON.parse(saved));
      } else {
        const initial = [
          {
            id: 'c_init1',
            sender: 'Dr. Sarah Chen',
            text: 'Your deep-dive observations on structural pedagogics completely redesigned our software architecture! Highly recommended.',
            date: 'May 28, 2026'
          }
        ];
        if (targetUser.name === 'Alex Rivera') {
          initial[0].text = 'Outstanding contribution to our concurrency layers! Your Rust optimization insights prevented multiple server failures.';
        }
        setReceivedCompliments(initial);
      }
    }
  }, [targetUser]);

  const handleSendCompliment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complimentText.trim() || !targetUser) return;

    const newCompliment = {
      id: `compliment_${Date.now()}`,
      sender: currentUser?.fullName || currentUser?.username || 'EduWatch Scholar',
      text: complimentText.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    const updated = [newCompliment, ...receivedCompliments];
    setReceivedCompliments(updated);
    localStorage.setItem(`compliments_${targetUser.username}`, JSON.stringify(updated));
    setComplimentText('');
    setShowComplimentModal(false);
    
    // Trigger toast notification
    setToastMessage('Compliment sent successfully!');
    setTimeout(() => setToastMessage(''), 3500);
  };

  const tabsConfig = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'microposts', label: 'Micro-posts', icon: Terminal },
    { id: 'articles', label: 'Articles', icon: FileText },
    { id: 'photos', label: 'Photos', icon: Camera },
    { id: 'videos', label: 'Videos', icon: TrendingUp },
    { id: 'connections', label: 'Followers & Following', icon: Users },
  ];

  if (!targetUser && !isInitialLoading) {
    return (
      <div className="h-screen bg-surface overflow-hidden flex flex-col justify-between">
        <TopBar />
        <main className="flex-1 mt-[70px] flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-5 border border-amber-500/15">
            <ShieldAlert className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-black text-on-surface tracking-tight mb-1.5">Scholar Profile Not Found</h2>
          <p className="text-xs text-secondary max-w-xs mb-6 font-semibold">
            This account may have migrated, or has changed their credentials. Check the active directory!
          </p>
          <button 
            onClick={() => navigate('/find-people')}
            className="px-5 py-2.5 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md hover:brightness-115 transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Return to Directories</span>
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <TopBar />
      <main className="mt-[70px] h-[calc(100vh-70px)] overflow-hidden">
        <div 
          ref={pageContainerRef}
          className="flex flex-col lg:flex-row justify-between gap-6 lg:gap-10 relative w-full h-full px-4 md:px-10 lg:px-10 transition-all duration-300 ease-in-out"
        >
          
          {/* Permanent Sidebar (Left) */}
          <aside 
            ref={leftSidebarRef}
            className={cn(
              "hidden lg:block shrink-0 h-full overflow-y-auto no-scrollbar pt-6 pb-20 transition-all duration-300 ease-in-out",
              isCollapsed ? "w-[80px]" : "w-[350px]"
            )}
          >
            <Sidebar />
          </aside>

          {/* Scrolling Content Panel (Right / Main) */}
          <div 
            ref={mainScrollRef}
            className="w-full lg:flex-[1] min-w-0 h-full overflow-y-auto no-scrollbar pt-4 pb-40"
          >
            <div className="max-w-[1200px] mx-auto w-full space-y-4">
              
              {isInitialLoading ? (
                <ProfileHeaderSkeleton />
              ) : (
                <div className="space-y-0 relative">
                  
                  {/* OVERFLOWN COVER CARD AND AVATAR ROW */}
                  <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl overflow-hidden animate-in fade-in duration-500 shadow-sm">
                    {/* Cover Photo */}
                    <div className="relative h-[120px] md:h-[200px] w-full group mb-0 pb-[22px]">
                      <img 
                        src={coverImage} 
                        alt="Cover" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Profile Information Row */}
                    <div className="px-4 md:px-10 pb-5 max-w-[1240px] mx-auto">
                      <div className="relative flex flex-col md:flex-row items-end gap-5 -mt-10 md:-mt-16 mb-5">
                        
                        {/* Overlapping Avatar */}
                        <div className="relative group shrink-0">
                          <div className="w-20 h-20 md:w-32 md:h-32 rounded-2xl border-4 border-surface-container-lowest bg-surface-container overflow-hidden shadow-lg relative mt-[9px]">
                            <img 
                              src={targetUser.img} 
                              alt={targetUser.name} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer" 
                            />
                          </div>
                          
                          {/* Colored Status Orb */}
                          <div className="absolute bottom-1 right-1 z-10">
                            <div className={cn(
                              "w-5 h-5 md:w-6 md:h-6 rounded-full border-4 border-surface-container-lowest shadow-lg flex items-center justify-center bg-surface-container-lowest",
                              statusModeConfig.color
                            )}>
                              {React.createElement(statusModeConfig.icon, { className: "w-full h-full fill-current" })}
                            </div>
                          </div>
                        </div>

                        {/* Name and Direct follow control */}
                        <div className="flex-1 pb-1 text-center md:text-left flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                              <h1 className="text-xl md:text-3xl font-black font-manrope tracking-tight text-on-surface">
                                {targetUser.name}
                              </h1>
                              {requiresApproval && (
                                <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-500/10">
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>Private</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-black text-primary tracking-[0.14em] uppercase font-mono">{targetUser.role}</p>
                            <p className="text-secondary font-bold text-xs md:text-sm flex gap-2 justify-center md:justify-start">
                              <span 
                                onClick={() => {
                                  setConnectionsSubTab('followers');
                                  setActiveTab('connections');
                                }} 
                                className="hover:text-primary cursor-pointer transition-colors hover:underline"
                              >
                                {targetStats?.followers.toLocaleString()} followers
                              </span>
                              <span className="text-secondary/40 select-none">•</span>
                              <span 
                                onClick={() => {
                                  setConnectionsSubTab('following');
                                  setActiveTab('connections');
                                }} 
                                className="hover:text-primary cursor-pointer transition-colors hover:underline"
                              >
                                {targetStats?.following} following
                              </span>
                            </p>
                          </div>

                          {/* Quick interactions */}
                          <div className="flex items-center gap-2.5 justify-center shrink-0">
                            <button 
                              onClick={handleFollowClick}
                              className={cn(
                                "px-5 py-2 text-xs font-black uppercase tracking-wider rounded-full shadow-md transition-all duration-200 active:scale-95 cursor-pointer",
                                isCurrentlyFollowing
                                  ? "bg-surface-container-high text-secondary border border-outline-variant/10 hover:bg-surface-container"
                                  : isCurrentlyPending
                                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                  : "bg-primary text-white hover:brightness-110 shadow-primary/25"
                              )}
                            >
                              {isCurrentlyFollowing ? 'Following' : isCurrentlyPending ? 'Requested' : 'Follow'}
                            </button>
                            <button 
                              onClick={() => setShowComplimentModal(true)}
                              className="px-5 py-2 bg-surface-container hover:bg-outline-variant/15 text-on-surface font-black text-xs uppercase tracking-wider rounded-full active:scale-95 transition-all cursor-pointer"
                            >
                              Compliment
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>

                  {/* DOUBLE COLUMN STYLED REDDIT-STYLE LAYOUT */}
                  <div className="flex flex-col lg:flex-row-reverse gap-6 items-start mt-6">
                    
                    {/* RIGHT SIDEBAR COLUMN OF OTHER USER */}
                    <aside className="w-full lg:w-[340px] shrink-0 space-y-4 lg:sticky lg:top-4">
                      
                      {/* REDDIT-STYLE USER CARD */}
                      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm space-y-5 text-left">
                        <div className="space-y-1">
                          <h3 className="text-xl font-black font-manrope text-on-surface">{targetUser.name}</h3>
                          <p className="text-xs text-secondary font-medium italic">joined {targetUser.joinedDate || targetStats?.joinedDate}</p>
                        </div>

                        {/* Location / Web links */}
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center gap-3 text-xs text-secondary font-bold">
                            <MapPin className="w-4 h-4 text-primary shrink-0" />
                            <span>{targetUser.location || 'Global'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-secondary font-bold">
                            <Globe className="w-4 h-4 text-primary shrink-0" />
                            <span className="truncate">{targetUser.website || ('eduwatch.journal/' + targetUser.username)}</span>
                          </div>
                        </div>

                        {/* Interactive Metrics Grid matching Profile.tsx */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant/5">
                          <div>
                            <p className="text-[13px] font-black text-on-surface">{(targetStats?.knowledgeScore || 0).toLocaleString()}</p>
                            <p className="text-[10px] text-secondary font-medium uppercase tracking-wider">Knowledge Score</p>
                          </div>
                          <div>
                            <p className="text-[13px] font-black text-on-surface">{(targetStats?.eduImpact || 0).toLocaleString()}</p>
                            <p className="text-[10px] text-secondary font-medium uppercase tracking-wider">Edu Impact</p>
                          </div>
                          <div>
                            <p className="text-[13px] font-black text-on-surface">{targetStats?.platformAge}</p>
                            <p className="text-[10px] text-secondary font-medium uppercase tracking-wider">Platform Age</p>
                          </div>
                          <div>
                            <p className="text-[13px] font-black text-on-surface">{targetStats?.certificatesCount}</p>
                            <p className="text-[10px] text-secondary font-medium uppercase tracking-wider">Certificates</p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-outline-variant/5">
                          <p className="text-[12px] font-black text-on-surface">{targetStats?.contributorRank}</p>
                          <p className="text-[10px] text-secondary font-medium uppercase tracking-wider">Contributor Rank</p>
                        </div>

                        {/* Achievements Badge showcase */}
                        <div className="pt-4 border-t border-outline-variant/5 space-y-3">
                          <h4 className="text-[10px] font-black text-secondary tracking-widest uppercase">Achievements</h4>
                          <div className="flex items-center gap-3">
                            <div className="flex -space-x-1.5 shrink-0">
                              <div className="w-8 h-8 rounded-full bg-yellow-400/20 border-2 border-surface-container-lowest flex items-center justify-center" title="Top Contributor">
                                <Sparkles className="w-4 h-4 text-yellow-600" />
                              </div>
                              <div className="w-8 h-8 rounded-full bg-blue-400/20 border-2 border-surface-container-lowest flex items-center justify-center" title="Expert Publisher">
                                <GraduationCap className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="w-8 h-8 rounded-full bg-green-400/20 border-2 border-surface-container-lowest flex items-center justify-center" title="Verified Scholar">
                                <Shield className="w-4 h-4 text-green-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-on-surface truncate">Expert Curator, Peer Educator</p>
                            </div>
                          </div>
                        </div>
                      </div>



                    </aside>

                    {/* MAIN CONTENT WORKSPACE LEFT COLUMN */}
                    <div className="flex-1 min-w-0 w-full space-y-6">
                      
                      {/* Navigations tabs bar */}
                      <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl overflow-hidden mb-6">
                        <div className="flex items-center overflow-x-auto no-scrollbar">
                          {tabsConfig.map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={cn(
                                "flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer",
                                activeTab === tab.id 
                                  ? "text-primary border-primary bg-primary/5" 
                                  : "text-secondary border-transparent hover:text-on-surface hover:bg-surface-container/50"
                              )}
                            >
                              <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-primary" : "text-secondary")} />
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Content Area Rendering */}
                      {activeTab === 'overview' && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            
                            {/* Bio Description Details */}
                            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-sm space-y-5 text-left">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Info className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="text-lg font-black font-manrope">Description</h3>
                              </div>
                              <p className="text-[13px] text-on-surface leading-relaxed whitespace-pre-wrap font-medium">
                                {targetUser.bio || "No description provided yet."}
                              </p>
                              <div className="pt-3 border-t border-outline-variant/5">
                                <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-3">Interests & Expertise</h4>
                                <div className="flex flex-wrap gap-1.5">
                                  {(targetUser.name === 'Dr. Sarah Chen' 
                                    ? ['LMS Modularity', 'Distributed Engineering', 'System Concurrency', 'Concurrency Testing']
                                    : targetUser.name === 'Alex Rivera'
                                    ? ['Rust Compile Layer', 'Memory Footprint', 'Broker Ingestion', 'Backend Dev']
                                    : targetUser.name === 'Prof. Liam Whitby'
                                    ? ['UX Scaffolding', 'Cognitive Load Theory', 'User Centered Design', 'Pedagogy Interface']
                                    : ['Academic Research', 'Topic Curation', 'Social Mentorship', 'Scholarly Writing']
                                  ).map((skill, index) => (
                                    <span key={index} className="px-3 py-1 bg-surface-container-low text-on-surface text-xs font-bold rounded-full border border-outline-variant/5">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Contact Connections Cards */}
                            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm space-y-6 text-left">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center">
                                  <Mail className="w-5 h-5 text-tertiary" />
                                </div>
                                <h3 className="text-xl font-black font-manrope">Contact Info</h3>
                              </div>

                              <div className="space-y-5">
                                <div className="flex items-center gap-4 group">
                                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                                    <MapPin className="w-5 h-5 text-secondary group-hover:text-primary transition-colors" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-on-surface">Location</p>
                                    <p className="text-sm text-secondary font-medium">{targetUser.location || 'Global Operations'}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 group">
                                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                                    <Globe className="w-5 h-5 text-secondary group-hover:text-primary transition-colors" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-on-surface">Website</p>
                                    <a href={targetUser.website ? (targetUser.website.startsWith('http') ? targetUser.website : 'https://' + targetUser.website) : "https://eduwatch.org/" + targetUser.username} target="_blank" rel="noreferrer" className="text-sm text-primary font-bold hover:underline">
                                      {targetUser.website || ('eduwatch.journal/' + targetUser.username)}
                                    </a>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 group">
                                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                                    <Mail className="w-5 h-5 text-secondary group-hover:text-primary transition-colors" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-on-surface">Academic Inquiries</p>
                                    <p className="text-sm text-secondary font-semibold">{targetUser.username}@eduwatch.org</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                          </div>



                          {/* RECEIVED COMPLIMENTS SECTION (Overview Tab Highlight) */}
                          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm text-left space-y-4">
                            <div className="flex items-center justify-between gap-4">
                              <h3 className="text-lg font-black flex items-center gap-2 text-on-surface">
                                <Sparkles className="w-5 h-5 text-purple-500" />
                                Received Peer Notes & Compliments
                              </h3>
                              {receivedCompliments.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setShowAllComplimentsModal(true)}
                                  className="text-[10px] font-black uppercase tracking-wider text-primary hover:bg-primary/15 transition-all cursor-pointer bg-primary/10 px-3.5 py-1.5 rounded-full shrink-0"
                                >
                                  Show All
                                </button>
                              )}
                            </div>
                            
                            {receivedCompliments.length === 0 ? (
                              <p className="text-xs text-secondary italic font-semibold py-2">No peer notes received yet. Be the first to leave one!</p>
                            ) : receivedCompliments.length === 1 ? (
                              <div className="max-w-md">
                                <div className="bg-surface p-4 rounded-xl border border-outline-variant/10 flex flex-col justify-between relative overflow-hidden">
                                  <p className="text-xs leading-relaxed text-secondary italic font-semibold mb-3">
                                    "{receivedCompliments[0].text}"
                                  </p>
                                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider mt-1.5 border-t border-outline-variant/5 pt-2">
                                    <span className="text-primary">{receivedCompliments[0].sender}</span>
                                    <span className="text-outline-variant">{receivedCompliments[0].date}</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="relative w-full overflow-hidden py-1 select-none">
                                <style dangerouslySetInnerHTML={{ __html: `
                                  @keyframes profileMarquee {
                                    0% { transform: translate3d(0, 0, 0); }
                                    100% { transform: translate3d(-50%, 0, 0); }
                                  }
                                  .profile-marquee-container {
                                    display: flex;
                                    width: max-content;
                                    animation: profileMarquee 35s linear infinite;
                                  }
                                  .profile-marquee-container:hover {
                                    animation-play-state: paused;
                                  }
                                `}} />
                                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-surface-container-lowest to-transparent pointer-events-none z-10" />
                                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface-container-lowest to-transparent pointer-events-none z-10" />
                                
                                <div className="profile-marquee-container gap-4">
                                  {[...receivedCompliments, ...receivedCompliments].map((comp, idx) => (
                                    <div 
                                      key={`${comp.id}-${idx}`}
                                      className="bg-surface p-4 rounded-xl border border-outline-variant/10 flex flex-col justify-between relative overflow-hidden w-[280px] md:w-[320px] shrink-0 hover:border-primary/25 hover:shadow-sm transition-all duration-300"
                                    >
                                      <p className="text-xs leading-relaxed text-secondary italic font-semibold mb-3 whitespace-normal break-words">
                                        "{comp.text}"
                                      </p>
                                      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider mt-1.5 border-t border-outline-variant/5 pt-2">
                                        <span className="text-primary">{comp.sender}</span>
                                        <span className="text-outline-variant">{comp.date}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>



                        </div>
                      )}

                      {/* Connections (Followers & Following) Tab content */}
                      {activeTab === 'connections' && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm text-left">
                            <div className="flex border-b border-outline-variant/10 pb-0 mb-6 gap-6">
                              <button
                                onClick={() => setConnectionsSubTab('followers')}
                                className={cn(
                                  "pb-3 text-sm font-black uppercase tracking-wider border-b-2 cursor-pointer transition-colors",
                                  connectionsSubTab === 'followers' 
                                    ? "border-primary text-primary animate-in fade-in duration-200" 
                                    : "border-transparent text-secondary hover:text-on-surface"
                                )}
                              >
                                Followers ({targetFollowersList.length})
                              </button>
                              <button
                                onClick={() => setConnectionsSubTab('following')}
                                className={cn(
                                  "pb-3 text-sm font-black uppercase tracking-wider border-b-2 cursor-pointer transition-colors",
                                  connectionsSubTab === 'following' 
                                    ? "border-primary text-primary animate-in fade-in duration-200" 
                                    : "border-transparent text-secondary hover:text-on-surface"
                                )}
                              >
                                Following ({targetFollowingList.length})
                              </button>
                            </div>

                            {connectionsSubTab === 'followers' ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {targetFollowersList.length === 0 ? (
                                  <p className="text-xs text-secondary italic py-4">No followers found.</p>
                                ) : (
                                  targetFollowersList.map((usr) => (
                                    <div 
                                      key={usr.username}
                                      onClick={() => navigate(`/profile/${usr.username}`)}
                                      className="p-4 rounded-xl border border-outline-variant/10 hover:bg-surface-container flex items-center justify-between cursor-pointer transition-all group"
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-11 h-11 rounded-xl bg-surface-container overflow-hidden shrink-0 border border-outline-variant/5">
                                          <img src={usr.img} alt={usr.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                                        </div>
                                        <div className="min-w-0">
                                          <h4 className="text-sm font-black text-on-surface group-hover:text-primary transition-colors truncate">
                                            {usr.name}
                                          </h4>
                                          <p className="text-secondary text-[11px] font-semibold truncate">@{usr.username} • {usr.role}</p>
                                        </div>
                                      </div>
                                      {currentUser?.username?.toLowerCase() !== usr.username && (
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFollow(usr.username);
                                          }}
                                          className={cn(
                                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-150 active:scale-95 cursor-pointer",
                                            following.includes(usr.username)
                                              ? "bg-surface-container text-secondary border border-outline-variant/10 hover:bg-surface-container-high"
                                              : "bg-primary text-white hover:brightness-110"
                                          )}
                                        >
                                          {following.includes(usr.username) ? 'Following' : 'Follow'}
                                        </button>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {targetFollowingList.length === 0 ? (
                                  <p className="text-xs text-secondary italic py-4">No following accounts found.</p>
                                ) : (
                                  targetFollowingList.map((usr) => (
                                    <div 
                                      key={usr.username}
                                      onClick={() => navigate(`/profile/${usr.username}`)}
                                      className="p-4 rounded-xl border border-outline-variant/10 hover:bg-surface-container flex items-center justify-between cursor-pointer transition-all group"
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-11 h-11 rounded-xl bg-surface-container overflow-hidden shrink-0 border border-outline-variant/5">
                                          <img src={usr.img} alt={usr.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                                        </div>
                                        <div className="min-w-0">
                                          <h4 className="text-sm font-black text-on-surface group-hover:text-primary transition-colors truncate">
                                            {usr.name}
                                          </h4>
                                          <p className="text-secondary text-[11px] font-semibold truncate">@{usr.username} • {usr.role}</p>
                                        </div>
                                      </div>
                                      {currentUser?.username?.toLowerCase() !== usr.username && (
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFollow(usr.username);
                                          }}
                                          className={cn(
                                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-150 active:scale-95 cursor-pointer",
                                            following.includes(usr.username)
                                              ? "bg-surface-container text-secondary border border-outline-variant/10 hover:bg-surface-container-high"
                                              : "bg-primary text-white hover:brightness-110"
                                          )}
                                        >
                                          {following.includes(usr.username) ? 'Following' : 'Follow'}
                                        </button>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Display Postings lists if other tabs are active */}
                      {activeTab !== 'overview' && activeTab !== 'connections' && userPosts.length === 0 && !isContentLoading && (
                        <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 animate-in fade-in zoom-in duration-700 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 mt-4">
                          <div className="w-32 h-32 relative">
                            <img 
                              src={
                                activeTab === 'photos' 
                                  ? 'https://illustrations.popsy.co/white/abstract-art.svg' 
                                  : activeTab === 'videos'
                                  ? 'https://illustrations.popsy.co/white/video-call.svg'
                                  : 'https://illustrations.popsy.co/white/meditating-man.svg'
                              }
                              alt="Empty state" 
                              className="w-full h-full object-contain opacity-80"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <h2 className="text-lg font-black font-manrope tracking-tight text-on-surface">No {activeTab.replace('s', '')} items found</h2>
                            <p className="text-secondary font-semibold text-xs max-w-xs mx-auto">
                              Once this curator publishes {activeTab}, they will appear here in their profile timeline.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Render Post Items */}
                      {activeTab !== 'overview' && activeTab !== 'connections' && userPosts.length > 0 && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                          {isContentLoading ? (
                            Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)
                          ) : (
                            userPosts.map((post, i) => (
                              <FeedItem
                                key={post.id}
                                index={i}
                                item={post}
                                expandedPosts={expandedPosts}
                                toggleExpand={toggleExpand}
                                handlePostAction={(p, fromMedia) => handlePostAction(p as any, fromMedia)}
                                handleToggleLike={async (postId, e) => {
                                  e.stopPropagation();
                                  const res = await postService.toggleLike(postId);
                                  setUserPosts(userPosts.map(p => {
                                    if (p.id === postId) {
                                      return {
                                        ...p,
                                        upvotes: res.upvotes,
                                        downvotes: res.downvotes
                                      };
                                    }
                                    return p;
                                  }));
                                }}
                                handleToggleDownvote={async (postId, e) => {
                                  e.stopPropagation();
                                  const res = await postService.toggleDownvote(postId);
                                  setUserPosts(userPosts.map(p => {
                                    if (p.id === postId) {
                                      return {
                                        ...p,
                                        upvotes: res.upvotes,
                                        downvotes: res.downvotes
                                      };
                                    }
                                    return p;
                                  }));
                                }}
                                showMenu={false}
                              />
                            ))
                          )}
                        </div>
                      )}

                    </div>

                  </div>

                </div>
              )}

            </div>
          </div>

        </div>
      </main>

      {/* COMPLIMENT FORM SUBMISSION MODAL */}
      <AnimatePresence>
        {showComplimentModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-surface-container rounded-2xl border border-outline-variant/10 shadow-2xl p-6 max-w-sm w-full relative overflow-hidden"
            >
              <div className="text-center">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-5.5 h-5.5 text-primary" />
                </div>
                <h3 className="text-base font-black text-on-surface">Send a Professional Compliment</h3>
                <p className="text-xs text-secondary mt-1 font-semibold">Post a supportive curatorial record on @{targetUser.username}'s profile.</p>
              </div>

              <form onSubmit={handleSendCompliment} className="mt-5 space-y-4 text-left">
                <div>
                  <label className="text-[9px] font-black uppercase text-secondary tracking-widest block mb-1.5">Feedback Note</label>
                  <textarea 
                    rows={4}
                    required
                    value={complimentText}
                    onChange={(e) => setComplimentText(e.target.value)}
                    placeholder="E.g., Outstanding work on system modularity and academic caching guidelines! Really solved our scaling dilemma."
                    className="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-3 text-xs text-on-surface focus:ring-1 focus:ring-primary/20 focus:border-primary/45 transition-all font-semibold placeholder-secondary/50 outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button 
                    type="button" 
                    onClick={() => setShowComplimentModal(false)}
                    className="flex-1 py-2.5 rounded-full bg-surface border border-outline-variant/15 text-secondary text-xs font-black uppercase tracking-wider hover:bg-surface-container-low transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 rounded-full bg-primary text-white text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-95 cursor-pointer shadow-md shadow-primary/20 transition-transform"
                  >
                    Send
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SHOW ALL COMPLIMENTS MODAL */}
      <AnimatePresence>
        {showAllComplimentsModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-[200]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-surface-container rounded-2xl border border-outline-variant/10 shadow-2xl max-w-xl w-full relative overflow-hidden flex flex-col max-h-[80vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <h3 className="text-base font-black text-on-surface">All Received Compliments</h3>
                </div>
                <button 
                  onClick={() => setShowAllComplimentsModal(false)}
                  className="p-1.5 rounded-full hover:bg-surface-container-high text-secondary hover:text-on-surface cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* List */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {receivedCompliments.map((comp) => (
                  <div 
                    key={comp.id}
                    className="bg-surface p-4 rounded-xl border border-outline-variant/10 flex flex-col justify-between relative overflow-hidden"
                  >
                    <p className="text-xs leading-relaxed text-secondary italic font-semibold mb-3">
                      "{comp.text}"
                    </p>
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider mt-1.5 border-t border-outline-variant/5 pt-2">
                      <span className="text-primary">{comp.sender}</span>
                      <span className="text-outline-variant">{comp.date}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-outline-variant/10 flex justify-end">
                <button
                  onClick={() => setShowAllComplimentsModal(false)}
                  className="px-6 py-2 rounded-full bg-surface-container-high border border-outline-variant/10 text-secondary text-xs font-black uppercase tracking-wider hover:bg-surface-container-highest transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOAT SUCCESS TOAST */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-primary text-white px-5 py-3 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2.5 z-[300]"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SINGLE FEEDITEM MODAL POPUPS */}
      <AnimatePresence>
        {selectedPostModal && (
          <PostModal 
            isOpen={true} 
            post={selectedPostModal} 
            onClose={() => setSelectedPostModal(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
