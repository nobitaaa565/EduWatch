import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useBlocker, useSearchParams } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../lib/AuthContext';
import { useSidebar } from '../lib/SidebarContext';
import { useTheme } from '../lib/ThemeContext';
import { 
  MapPin, 
  Link as LinkIcon, 
  Calendar, 
  Edit3, 
  Share2, 
  MoreHorizontal,
  Trash2,
  FileText,
  Bookmark,
  Users,
  Star,
  Clock,
  X,
  Save,
  LayoutDashboard,
  Heart,
  Settings as SettingsIcon,
  User as UserIcon,
  Briefcase,
  Compass,
  LogOut,
  Bell,
  BellOff,
  Shield,
  Palette,
  Plus,
  Camera,
  Check,
  Lock,
  Github,
  Sun,
  Moon,
  AlertTriangle,
  BookOpen,
  TrendingUp,
  MinusCircle,
  CheckCircle2,
  Zap,
  Circle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PenLine,
  History,
  Bolt,
  Sparkles,
  Terminal,
  Cloud,
  Brain,
  BarChart2,
  ThumbsUp,
  MessageCircle,
  UserCircle,
  Globe,
  Instagram,
  GraduationCap,
  Info,
  Search,
  ArrowBigUp,
  ArrowBigDown,
  Award,
  Medal
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { cn } from '../lib/utils';
import { AnimatePresence, motion } from 'motion/react';

import { feed } from '../lib/feedData';
import { useSocial } from '../lib/social';
import { postService, Post as LocalPost } from '../services/postService';
import { userService, UserStats } from '../services/userService';
import { PostSkeleton, ProfileHeaderSkeleton } from '../components/Skeleton';
import { HashtagText } from '../components/HashtagText';
import { FeedItem } from '../components/FeedItem';
import { PostModal } from '../components/PostModal';
import { PostImage } from '../components/PostImage';

const works = [
  { title: 'The Future of AI in Education', date: 'Oct 12, 2023', views: '1.2k', color: 'bg-primary' },
  { title: 'Modern Pedagogy Patterns', date: 'Sep 28, 2023', views: '840', color: 'bg-tertiary' },
  { title: 'Data Architecture for Schools', date: 'Aug 15, 2023', views: '2.1k', color: 'bg-blue-500' },
];

const analyticsData = [
  { name: 'Mon', hours: 4.5 },
  { name: 'Tue', hours: 3.2 },
  { name: 'Wed', hours: 6.1 },
  { name: 'Thu', hours: 2.8 },
  { name: 'Fri', hours: 5.4 },
  { name: 'Sat', hours: 1.5 },
  { name: 'Sun', hours: 2.2 },
];

const analyticsCategories = [
  { name: 'AI & Machine Learning', progress: 85, color: 'bg-primary' },
  { name: 'Data Science', progress: 65, color: 'bg-tertiary' },
  { name: 'UI/UX Design', progress: 45, color: 'bg-blue-500' },
];

const analyticsMilestones = [
  { title: 'LLM Architect', category: 'AI & ML', icon: Brain },
  { title: 'Visual Specialist', category: 'Design', icon: Palette },
  { title: 'Technical Writer', category: 'Documentation', icon: Terminal },
];

const isVideoUrl = (url: string) => {
  if (!url) return false;
  return url.startsWith('data:video/') || url.match(/\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i);
};

export default function Profile() {
  const { theme, toggleTheme } = useTheme();
  const { user, updateProfile, logout } = useAuth();
  const { isCollapsed, setCollapsed } = useSidebar();
  const { followers, following, registry, toggleFollow, removeFollower } = useSocial();

  const followersCount = followers ? followers.length : 0;
  const followingCount = following ? following.length : 0;

  const myFollowersList = useMemo(() => {
    const resolved = (followers || []).map(fStr => registry.find(r => r.username.toLowerCase() === fStr.toLowerCase()))
      .filter((u): u is typeof registry[0] => !!u);
    if (resolved.length === 0) {
      return registry.filter(r => r.username !== user?.username).slice(0, 5);
    }
    return resolved;
  }, [followers, registry, user?.username]);

  const myFollowingList = useMemo(() => {
    const resolved = (following || []).map(fStr => registry.find(r => r.username.toLowerCase() === fStr.toLowerCase()))
      .filter((u): u is typeof registry[0] => !!u);
    if (resolved.length === 0) {
      return registry.filter(r => r.username !== user?.username).reverse().slice(0, 4);
    }
    return resolved;
  }, [following, registry, user?.username]);

  useEffect(() => {
    setCollapsed(true);
  }, [setCollapsed]);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'microposts';
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [connectionsSubTab, setConnectionsSubTab] = useState<'followers' | 'following'>('followers');
  const [userPosts, setUserPosts] = useState<LocalPost[]>([]);
  const [selectedPostModal, setSelectedPostModal] = useState<LocalPost | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isContentLoading, setIsContentLoading] = useState(false);

  const [userPhotos, setUserPhotos] = useState<string[]>([]);
  const [userVideos, setUserVideos] = useState<string[]>([]);
  const [repostTrigger, setRepostTrigger] = useState(0);
  const [profileData, setProfileData] = useState<{
    ownPosts: LocalPost[];
    allGlobalPosts: LocalPost[];
    combinedTimeline: LocalPost[];
  } | null>(null);

  const [statusMode, setStatusMode] = useState<'active' | 'away' | 'dnd'>('active');
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const [activePostMenuId, setActivePostMenuId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<LocalPost | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editPoll, setEditPoll] = useState<LocalPost['poll'] | null>(null);
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const [editTaggedUsers, setEditTaggedUsers] = useState<{ id: string; name: string }[]>([]);
  const [editLocation, setEditLocation] = useState('');
  const [editPrivacy, setEditPrivacy] = useState<'public' | 'followers' | 'communities'>('public');
  const [editCommentsEnabled, setEditCommentsEnabled] = useState(true);
  const [viewingStatsPost, setViewingStatsPost] = useState<LocalPost | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'knowledgeScore' | 'eduImpact' | 'platformAge' | 'certificatesCount' | 'contributorRank' | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [tempBio, setTempBio] = useState(user?.bio || '');
  const [coverImage, setCoverImage] = useState<string>(() => localStorage.getItem('profile_cover_image') || "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=2000");

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCoverImage(reader.result);
          localStorage.setItem('profile_cover_image', reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (user?.bio) {
      setTempBio(user.bio);
    }
  }, [user?.bio]);

  useEffect(() => {
    const fetchRecentlyViewed = () => {
      try {
        const stored = localStorage.getItem('recently_viewed_articles');
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) {
            setRecentlyViewed(list);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to load recently viewed articles", e);
      }
      setRecentlyViewed([]);
    };
    fetchRecentlyViewed();
  }, [activeTab, isHistoryDrawerOpen]);

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

  const statusConfigs = {
    active: { color: 'text-green-500', bgColor: 'bg-green-500', label: 'Active', icon: Zap },
    away: { color: 'text-yellow-500', bgColor: 'bg-yellow-500', label: 'Away', icon: Clock },
    dnd: { color: 'text-red-500', bgColor: 'bg-red-500', label: 'Do Not Disturb', icon: BellOff }
  };

  useEffect(() => {
    if (!user) return;
    setIsInitialLoading(true);
    setIsContentLoading(true);

    let isSubscribed = true;
    let unsubscribe: (() => void) | undefined;

    const initSubscription = async () => {
      try {
        const allGlobalPosts = await postService.getAllPosts();
        if (!isSubscribed) return;

        unsubscribe = postService.subscribeUserTimeline(user.id, (ownPosts) => {
          if (!isSubscribed) return;
          const repostedIds: string[] = JSON.parse(localStorage.getItem(`reposted_${user.username}`) || '[]');
          
          // Filter out reposts by other authors that the user has reposted
          const repostedPosts = allGlobalPosts.filter(p => repostedIds.includes(p.id) && p.authorId !== user.id);
          const markedReposted = repostedPosts.map(p => ({ ...p, isRepost: true }));
          
          const combinedTimeline = [...ownPosts, ...markedReposted].sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          
          setProfileData({
            ownPosts,
            allGlobalPosts,
            combinedTimeline
          });
          setIsContentLoading(false);
          setIsInitialLoading(false);
        }, (err) => {
          console.error("Error with real-time subscription:", err);
          setIsContentLoading(false);
          setIsInitialLoading(false);
        });
      } catch (err) {
        console.error("Error setting up real-time subscribe:", err);
        setIsContentLoading(false);
        setIsInitialLoading(false);
      }
    };

    initSubscription();

    return () => {
      isSubscribed = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, repostTrigger]);

  useEffect(() => {
    if (!profileData) return;
    
    const { ownPosts, allGlobalPosts, combinedTimeline } = profileData;
    let posts: LocalPost[] = [];
    
    if (activeTab === 'microposts') {
      posts = combinedTimeline.filter(p => p.format === 'micropost');
    } else if (activeTab === 'articles') {
      posts = combinedTimeline.filter(p => p.format === 'article');
    } else if (activeTab === 'photos') {
      const photosList: string[] = [];
      ownPosts.forEach(p => {
        if (p.images) {
          p.images.forEach(img => {
            if (!isVideoUrl(img)) {
              photosList.push(img);
            }
          });
        }
      });
      setUserPhotos(photosList);
      posts = ownPosts.filter(p => p.images && p.images.some(img => !isVideoUrl(img)));
    } else if (activeTab === 'videos') {
      const videosList: string[] = [];
      ownPosts.forEach(p => {
        if (p.images) {
          p.images.forEach(img => {
            if (isVideoUrl(img)) {
              videosList.push(img);
            }
          });
        }
      });
      setUserVideos(videosList);
      posts = ownPosts.filter(p => p.images && p.images.some(img => isVideoUrl(img)));
    } else if (activeTab === 'bookmarks') {
      posts = allGlobalPosts.filter(p => postService.isBookmarked(p.id));
    } else if (activeTab === 'upvoted' || activeTab === 'all') {
      posts = allGlobalPosts.filter(p => postService.isPostLiked(p.id));
    } else if (activeTab === 'posts') {
      posts = combinedTimeline;
    } else if (activeTab === 'overview') {
      posts = combinedTimeline;
    } else if (activeTab === 'downvoted') {
      posts = allGlobalPosts.filter(p => postService.isPostDownvoted(p.id));
    } else {
      posts = combinedTimeline;
    }

    setUserPosts(posts);
  }, [activeTab, profileData]);

  const tabParam = searchParams.get('tab');
  useEffect(() => {
    if (tabParam === 'bookmarks') {
      navigate('/bookmarks', { replace: true });
    } else if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, navigate, activeTab]);

  const handleTabChange = (tabId: string) => {
    if (tabId === 'bookmarks') {
      navigate('/bookmarks');
      return;
    }
    setActiveTab(tabId);
  };

  const navigatePost = (item: LocalPost) => {
    if (item.format === 'micropost') {
      navigate(`/micro-post/${item.id}`);
    } else {
      navigate(`/article/${item.id}`);
    }
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

  const handleLocalUpdate = (postId: string) => {
    setUserPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return { ...post };
      }
      return post;
    }));
  };

  const articleStats = [
    { label: 'Published', value: userPosts.length.toString(), icon: FileText },
    { label: 'Bookmarks', value: '45', icon: Bookmark },
    { label: 'Followers', value: '1.2k', icon: Users },
    { label: 'Impact Score', value: (userPosts.length * 7 + 84).toString(), icon: Star },
  ];

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    expertise: user?.expertise?.join(', ') || ''
  });

  // Settings Logic
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('userSettings');
    const defaultSettings = {
      displayName: user?.fullName || user?.username || '',
      bio: user?.bio || '',
      emailAlerts: true,
      platformNotifications: true,
      weeklyDigest: false,
      fontSize: 14,
      skills: user?.expertise || [],
      photoUrl: user?.profileImage || '',
      requireFollowApproval: false
    };
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const [tempSettings, setTempSettings] = useState(settings);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [workTab, setWorkTab] = useState<'published' | 'drafts'>('published');
  const [localDrafts, setLocalDrafts] = useState<any[]>([]);

  useEffect(() => {
    // Load Article Drafts
    const articleDraftsJson = localStorage.getItem('technical_ledger_drafts');
    const articleDrafts = articleDraftsJson ? JSON.parse(articleDraftsJson) : [];

    // Load Micropost Drafts
    const micropostDraftsJson = localStorage.getItem('eduwatch_micropost_drafts');
    const micropostDrafts = micropostDraftsJson ? JSON.parse(micropostDraftsJson) : [];
    
    setLocalDrafts([...articleDrafts, ...micropostDrafts]);
  }, [workTab]);

  const isSettingsDirty = JSON.stringify(tempSettings) !== JSON.stringify(settings);

  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    isSettingsDirty && currentLocation.pathname !== nextLocation.pathname && activeTab === 'settings'
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      setShowDiscardModal(true);
    }
  }, [blocker.state]);

  const handleSettingsSave = () => {
    setSettings(tempSettings);
    localStorage.setItem('userSettings', JSON.stringify(tempSettings));
    
    // Also store settings under the current username for other users to reference
    if (user?.username) {
      try {
        const savedSettingsByUsername = JSON.parse(localStorage.getItem('curator_user_settings_by_username') || '{}');
        savedSettingsByUsername[user.username] = tempSettings;
        localStorage.setItem('curator_user_settings_by_username', JSON.stringify(savedSettingsByUsername));
      } catch (e) {
        console.error("Failed to map user settings by username", e);
      }
    }
    
    // Sync with AuthContext
    updateProfile({
      fullName: tempSettings.displayName,
      bio: tempSettings.bio,
      expertise: tempSettings.skills,
      profileImage: tempSettings.photoUrl
    });

    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const handleSettingsDiscard = () => {
    setTempSettings(settings);
    setShowDiscardModal(false);
    if (blocker.state === "blocked") {
      blocker.proceed();
    }
  };

  const addSkill = () => {
    if (newSkill && !tempSettings.skills.includes(newSkill)) {
      setTempSettings({...tempSettings, skills: [...tempSettings.skills, newSkill]});
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setTempSettings({...tempSettings, skills: tempSettings.skills.filter((s: string) => s !== skillToRemove)});
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setTempSettings({...tempSettings, photoUrl: event.target?.result as string});
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSave = () => {
    updateProfile({
      fullName: formData.fullName,
      bio: formData.bio,
      location: formData.location,
      website: formData.website,
      expertise: formData.expertise.split(',').map(s => s.trim()).filter(s => s !== '')
    });
    setIsEditing(false);
  };

  const [postLayout, setPostLayout] = useState<'list' | 'grid'>('list');

  // Dynamic Platform Age calculation
  const calculatedPlatformAge = React.useMemo(() => {
    return userService.calculatePlatformAge(user?.joinedDate);
  }, [user?.joinedDate]);

  // Dynamic Stats Calculation
  const userStats: UserStats = React.useMemo(() => {
    const ownPublications = profileData?.ownPosts || [];
    const kScore = userService.calculateKnowledgeScore(ownPublications);
    const eImpact = userService.calculateEduImpact(ownPublications);
    const certCount = userService.calculateCertificatesCount(ownPublications, kScore, eImpact);
    return {
      knowledgeScore: kScore,
      eduImpact: eImpact,
      platformAge: calculatedPlatformAge,
      certificatesCount: certCount,
      contributorRank: userService.getContributorRank(kScore),
      achievements: ['Community Pioneer', 'Knowledge Sharer']
    };
  }, [profileData?.ownPosts, calculatedPlatformAge]);

  // Synchronize stats dynamically with Firestore database so they are never lost
  useEffect(() => {
    if (!user?.id || !profileData?.ownPosts) return;
    const syncDatabaseStats = async () => {
      try {
        await userService.syncCalculatedStats(
          user.id,
          profileData.ownPosts,
          user.joinedDate,
          followers || [],
          following || []
        );
      } catch (err) {
        console.error("Error updating stats in Firestore:", err);
      }
    };
    syncDatabaseStats();
  }, [
    user?.id,
    userStats.knowledgeScore,
    userStats.eduImpact,
    userStats.platformAge,
    userStats.certificatesCount,
    followers.length,
    following.length
  ]);

  const tabs = [
    { id: 'microposts', label: 'Micro-posts', icon: Edit3 },
    { id: 'articles', label: 'Articles', icon: FileText },
    { id: 'photos', label: 'Photos', icon: Camera },
    { id: 'videos', label: 'Videos', icon: TrendingUp },
    { id: 'connections', label: 'Followers & Following', icon: Users },
  ];

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/feed');
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Discard Changes Modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[250]">
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">Discard Changes?</h3>
            <p className="text-sm text-secondary mb-6">You have unsaved changes. Are you sure you want to discard them?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowDiscardModal(false); blocker.reset(); }} className="px-4 py-2 text-secondary font-bold text-xs hover:bg-surface-container rounded-md">Cancel</button>
              <button onClick={handleSettingsDiscard} className="px-4 py-2 bg-tertiary text-white font-bold text-xs rounded-md">Discard</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSaveSuccess && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[250] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-primary text-white px-6 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              <Plus className="w-3 h-3 rotate-45" />
            </div>
            Settings saved successfully!
          </div>
        </div>
      )}

      <TopBar />
      <main className="mt-[70px] h-[calc(100vh-70px)] overflow-hidden">
        <div 
          ref={pageContainerRef}
          className="flex flex-col lg:flex-row justify-between gap-6 lg:gap-10 relative w-full h-full px-4 md:px-10 lg:px-10 transition-all duration-300 ease-in-out"
        >
          <aside 
            ref={leftSidebarRef}
            className={cn(
            "hidden lg:block shrink-0 h-full overflow-y-auto no-scrollbar pt-6 pb-20 transition-all duration-300 ease-in-out",
            isCollapsed ? "w-[80px]" : "w-[350px]"
          )}>
            <Sidebar />
          </aside>
          <div 
            ref={mainScrollRef}
            className="w-full lg:flex-[1] min-w-0 h-full overflow-y-auto no-scrollbar pt-0 pb-40"
          >
            <div className="max-w-[1200px] mx-auto w-full">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column (Main pane) - 8/12 span */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                  
                  {/* LinkedIn-Style Profile Card or Skeleton */}
                  {isInitialLoading ? (
                    <ProfileHeaderSkeleton />
                  ) : (
                    <>
                      <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl overflow-hidden shadow-sm relative animate-in fade-in duration-500">
                        {/* Cover Photo */}
                        <div className="relative h-[155px] md:h-[200px] w-full bg-gradient-to-r from-teal-500/20 to-indigo-500/10">
                          <img 
                            src={coverImage} 
                            alt="Cover" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <label 
                            className="absolute top-4 right-4 bg-slate-900/90 dark:bg-slate-950/90 border border-slate-700/50 dark:border-slate-800 hover:bg-slate-800 dark:hover:bg-slate-900 text-white p-2.5 rounded-full shadow-lg transition-all cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95"
                            title="Upload cover photo"
                          >
                            <Camera className="w-4 h-4 text-white" />
                            <input 
                              type="file" 
                              className="hidden" 
                              onChange={handleCoverUpload} 
                              accept="image/*" 
                            />
                          </label>
                        </div>

                        {/* Content Section */}
                        <div className="px-6 pb-6 relative">
                          {/* Overlapping Avatar circles */}
                          <div className="relative -mt-[65px] md:-mt-[85px] mb-5 w-28 h-28 md:w-36 md:h-36 ml-4">
                            <div className="relative w-full h-full rounded-full border-[5px] border-surface-container-lowest bg-surface-container-lowest overflow-visible shadow-xl">
                              
                              {/* #OPENTOWORK Decorative Ribbon Ring */}
                              <div className="absolute -inset-[3px] rounded-full border-[2.5px] border-emerald-500 bg-surface-container-lowest z-10 p-0.5 flex items-center justify-center">
                                {/* Glowing spinning TextPath loop */}
                                <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '40s' }} viewBox="0 0 100 100">
                                  <defs>
                                    <path id="openToWorkPath" d="M 50, 50 m -43.5, 0 a 43.5,43.5 0 1,1 87,0 a 43.5,43.5 0 1,1 -87,0" />
                                  </defs>
                                  <text className="text-[6.2px] fill-emerald-600 dark:fill-emerald-400 font-extrabold tracking-[0.27em] uppercase">
                                    <textPath href="#openToWorkPath" startOffset="0%">
                                      #OPENTOWORK • #OPENTOWORK • #OPENTOWORK • 
                                    </textPath>
                                  </text>
                                </svg>
                                
                                {/* Avatar inside */}
                                <div className="w-full h-full rounded-full overflow-hidden relative z-20">
                                  {user?.profileImage ? (
                                    <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                      <UserIcon className="w-12 h-12 text-primary" />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Status Pill Indicator */}
                              <div className="absolute bottom-1 right-1 z-30">
                                <button 
                                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                                  className={cn(
                                    "w-6 h-6 rounded-full border-2 border-surface-container-lowest shadow-md transition-all hover:scale-115 flex items-center justify-center bg-surface-container-lowest cursor-pointer",
                                    statusConfigs[statusMode].color
                                  )}
                                  title={`Status: ${statusConfigs[statusMode].label}`}
                                >
                                  {React.createElement(statusConfigs[statusMode].icon, { className: "w-3.5 h-3.5 fill-current" })}
                                </button>
                                
                                {showStatusMenu && (
                                  <div className="absolute bottom-full mb-2 left-0 bg-surface-container-lowest border border-outline-variant/10 rounded-xl shadow-2xl p-1.5 min-w-[160px] animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
                                    <div className="text-[9px] font-black text-secondary uppercase tracking-widest px-2.5 py-1 mb-1">Set Status</div>
                                    {(Object.entries(statusConfigs) as [keyof typeof statusConfigs, typeof statusConfigs['active']][]).map(([key, config]) => (
                                      <button
                                        key={key}
                                        onClick={() => {
                                          setStatusMode(key);
                                          setShowStatusMenu(false);
                                        }}
                                        className={cn(
                                          "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                                          statusMode === key ? "bg-primary/10 text-primary" : "hover:bg-surface-container text-on-surface"
                                        )}
                                      >
                                        <div className={cn("w-3.5 h-3.5 flex items-center justify-center", config.color)}>
                                          {React.createElement(config.icon, { className: "w-full h-full fill-current" })}
                                        </div>
                                        {config.label}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                            </div>
                          </div>



                          {/* Name and Professional details section */}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                            <div className="md:col-span-8 space-y-2">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <h1 className="text-2xl md:text-3xl font-black font-manrope tracking-tight text-on-surface">
                                  {user?.fullName || user?.username || 'Tanvir Fuad Sunny'}
                                </h1>
                              </div>

                              {/* Headline */}
                              <p className="text-[14px] text-on-surface leading-normal font-sans tracking-wide">
                                {user?.bio || 'Not so worthy for doing a office work. But can make ideas for your work | Wanna connect?'}
                              </p>

                              {/* Location & Links */}
                              <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-xs text-secondary font-medium font-sans">
                                <span>{user?.location || 'Dhaka, Bangladesh'}</span>
                              </div>

                              {/* Connections Counts */}
                              <p className="text-xs font-bold text-primary hover:underline cursor-pointer select-none mt-1 flex items-center gap-1.5">
                                <span 
                                  onClick={() => {
                                    setConnectionsSubTab('followers');
                                    setActiveTab('connections');
                                  }} 
                                >
                                  {followers.length > 0 ? followers.length : 6} Followers
                                </span>
                                <span className="text-secondary/40 font-normal">•</span>
                                <span 
                                  onClick={() => {
                                    setConnectionsSubTab('following');
                                    setActiveTab('connections');
                                  }} 
                                >
                                  {following.length > 0 ? following.length : 8} Following
                                </span>
                              </p>
                            </div>

                            {/* University School block (Align right on desktop) */}
                            <div className="md:col-span-4 flex items-start gap-2 pt-1 md:justify-end">
                              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0 mt-0.5 font-sans">
                                <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <span className="text-xs font-bold text-on-surface leading-tight text-left md:text-right max-w-[200px] font-sans">
                                Bangabandhu Sheikh Mujibur Rahman Digital University ...
                              </span>
                            </div>
                          </div>

                        </div>
                      </div>
                    </>
                  )}

                  {/* Main Profile Tabs Content Container (Left Column Nested) */}
                  <div className="space-y-6">
              {/* Profile Navigation Bar */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-1.5 font-bold text-xs rounded-full transition-all whitespace-nowrap cursor-pointer",
                      activeTab === tab.id 
                        ? "bg-primary hover:bg-primary-dark text-white shadow hover:shadow-md" 
                        : "border border-primary text-primary hover:bg-primary/5"
                    )}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content handling */}
              {!isInitialLoading && (
                (activeTab === 'photos' && userPhotos.length === 0) ||
                (activeTab === 'videos' && userVideos.length === 0) ||
                (activeTab !== 'connections' && activeTab !== 'photos' && activeTab !== 'videos' && userPosts.length === 0)
              ) && (
                <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 animate-in fade-in zoom-in duration-700 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 mt-4">
                  <div className="w-40 h-40 relative">
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
                    <h2 className="text-xl font-black font-manrope tracking-tight text-on-surface">No {activeTab.replace('s', '')} Content Found</h2>
                    <p className="text-secondary font-medium text-[13px] max-w-sm mx-auto">
                      Once you share {activeTab}, they will appear here in your profile timeline.
                    </p>
                  </div>
                </div>
              )}

              {/* Content Timeline */}
              {userPosts.length > 0 && activeTab !== 'photos' && activeTab !== 'videos' && activeTab !== 'connections' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                   <div className="space-y-4">
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
                          onShareSuccess={() => setRepostTrigger(prev => prev + 1)}
                          handlePostAction={(p, fromMedia) => handlePostAction(p as any, fromMedia)}
                          handleToggleLike={(postId, e) => {
                            e.stopPropagation();
                            postService.toggleLike(postId);
                            setUserPosts(userPosts.map(p => p.id === postId ? { ...p } : p));
                          }}
                          handleToggleDownvote={(postId, e) => {
                            e.stopPropagation();
                            postService.toggleDownvote(postId);
                            setUserPosts(userPosts.map(p => p.id === postId ? { ...p } : p));
                          }}
                          showMenu={true}
                          onMenuEdit={(item) => {
                            navigate('/write-article', { state: { editPost: item } });
                          }}
                          onMenuDelete={(item) => {
                            setDeletingPostId(item.id);
                          }}
                          onMenuStats={(item) => {
                            setViewingStatsPost(item as any);
                          }}
                          onMenuPrivacyChange={async (item, privacy) => {
                            await postService.updatePostPrivacy(item.id, privacy);
                            setUserPosts(userPosts.map(p => p.id === item.id ? { ...p, privacy } : p));
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Overview Tab Content */}
              {activeTab === 'overview' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* About Summary */}
                    <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-sm space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <Info className="w-4.5 h-4.5 text-primary" />
                          </div>
                          <h3 className="text-lg font-black font-manrope">Description</h3>
                        </div>
                        {isEditingBio ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setIsEditingBio(false);
                                setTempBio(user?.bio || '');
                              }}
                              className="text-[10px] font-black uppercase tracking-wider text-secondary hover:text-on-surface cursor-pointer bg-surface-container-low px-2.5 py-1 rounded-md"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                updateProfile({
                                  bio: tempBio,
                                });
                                setFormData(prev => ({ ...prev, bio: tempBio }));
                                setIsEditingBio(false);
                              }}
                              className="text-[10px] font-black uppercase tracking-wider text-primary hover:text-primary/80 cursor-pointer bg-primary/10 px-2.5 py-1 rounded-md"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setTempBio(user?.bio || '');
                              setIsEditingBio(true);
                            }}
                            className="text-[10px] font-black uppercase tracking-wider text-primary hover:bg-primary/15 transition-all cursor-pointer bg-primary/10 px-2.5 py-1 rounded-md"
                          >
                            Edit
                          </button>
                        )}
                      </div>

                      {isEditingBio ? (
                        <textarea
                          value={tempBio}
                          onChange={(e) => setTempBio(e.target.value)}
                          className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4.5 py-3 text-xs leading-relaxed text-on-surface focus:ring-1 focus:ring-primary/20 outline-none min-h-[100px] resize-none font-medium"
                          placeholder="Tell us about yourself..."
                        />
                      ) : (
                        <p className="text-[13px] text-on-surface leading-relaxed whitespace-pre-wrap">
                          {user?.bio || "No description provided yet. Add a bio to let people know more about you."}
                        </p>
                      )}

                      <div className="pt-3 border-t border-outline-variant/5">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest">Interests & Expertise</h4>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(user?.expertise || ['Education', 'Technology', 'Community']).map((skill, index) => (
                            <span key={index} className="px-3 py-1 bg-surface-container-low text-on-surface text-xs font-bold rounded-full border border-outline-variant/5">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Contact & Social Info */}
                    <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center">
                          <Compass className="w-5 h-5 text-tertiary" />
                        </div>
                        <h3 className="text-xl font-black font-manrope">Contact Info</h3>
                      </div>
                      
                      <div className="space-y-5">
                        <div className="flex items-center gap-4 group">
                          <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                            <MapPin className="w-5 h-5 text-secondary group-hover:text-primary transition-colors" />
                          </div>
                          <div>
                            <p className="text-sm font-black">Location</p>
                            <p className="text-sm text-secondary font-medium">{user?.location || 'Dhaka, Bangladesh'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 group">
                          <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                            <LinkIcon className="w-5 h-5 text-secondary group-hover:text-primary transition-colors" />
                          </div>
                          <div>
                            <p className="text-sm font-black">Website</p>
                            {user?.website ? (
                              <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary font-bold hover:underline">
                                {user.website.replace(/^https?:\/\//, '')}
                              </a>
                            ) : (
                              <p className="text-sm text-secondary font-medium">None linked</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 group">
                          <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                            <Instagram className="w-5 h-5 text-secondary group-hover:text-primary transition-colors" />
                          </div>
                          <div>
                            <p className="text-sm font-black">Instagram</p>
                            <p className="text-sm text-primary font-bold hover:underline cursor-pointer">@booba_tea_565</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-outline-variant/5">
                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-primary" />
                            <span className="text-sm font-bold">Joined May 2024</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Highlights section */}
                  <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
                    <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                       <Sparkles className="w-5 h-5 text-yellow-500" />
                       Recent Activity Highlights
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { label: 'Total Posts', value: userPosts.length, color: 'text-primary' },
                        { label: 'Karma Points', value: '1,240', color: 'text-orange-500' },
                        { label: 'Followers', value: '1.2k', color: 'text-tertiary' }
                      ].map((stat, i) => (
                        <div key={i} className="p-4 bg-surface-container rounded-xl text-center">
                          <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                          <p className="text-xs font-bold text-secondary uppercase tracking-wider">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Other Tabs Placeholders */}
              {['reshared', 'saved', 'bookmarks', 'upvoted', 'downvoted'].includes(activeTab) && userPosts.length === 0 && !isContentLoading && (
                <div className="bg-surface-container-lowest p-12 text-center rounded-xl border border-outline-variant/10 animate-in fade-in slide-in-from-bottom-2">
                  <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                    {activeTab === 'bookmarks' ? <Bookmark className="w-10 h-10 text-secondary" /> : activeTab === 'reshared' ? <Share2 className="w-10 h-10 text-secondary" /> : <History className="w-10 h-10 text-secondary" />}
                  </div>
                  <h3 className="text-xl font-black text-on-surface uppercase tracking-tight">No {activeTab} yet</h3>
                  <p className="text-sm text-secondary mt-2 max-w-sm mx-auto">Items you {activeTab === 'bookmarks' || activeTab === 'saved' ? 'bookmark' : activeTab === 'reshared' ? 'reshare from others' : activeTab === 'upvoted' ? 'upvote' : 'interact with'} will appear here.</p>
                </div>
              )}

              {/* About Section */}
              {activeTab === 'about' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/5 shadow-sm">
                    <h3 className="text-xl font-bold font-manrope mb-6">About</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-6">
                          <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-secondary" />
                            <div>
                              <p className="text-[15px]">Lives in <span className="font-bold">Dhaka, Bangladesh</span></p>
                              <p className="text-xs text-secondary font-medium">Home Town</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Briefcase className="w-5 h-5 text-secondary" />
                            <div>
                              <p className="text-[15px]">Works at <span className="font-bold">Titumir University Knowledge and Intelligence TUKAI</span></p>
                              <p className="text-xs text-secondary font-medium">Occupation</p>
                            </div>
                          </div>
                       </div>
                       <div className="space-y-6">
                          <div className="flex items-center gap-3">
                            <GraduationCap className="w-5 h-5 text-secondary" />
                            <div>
                              <p className="text-[15px]">University of Frontier Technology, Bangladesh - UFTB</p>
                              <p className="text-xs text-secondary font-medium">Education</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Instagram className="w-5 h-5 text-secondary" />
                            <div>
                              <p className="text-[15px] font-bold text-primary">booba_tea_565</p>
                              <p className="text-xs text-secondary font-medium">Social Link</p>
                            </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Connections (Followers & Following) Tab content */}
              {activeTab === 'connections' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/5 shadow-sm text-left">
                    <div className="flex border-b border-outline-variant/10 pb-0 mb-5 gap-6">
                      <button
                        onClick={() => setConnectionsSubTab('followers')}
                        className={cn(
                          "pb-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors",
                          connectionsSubTab === 'followers' 
                            ? "border-primary text-primary animate-in fade-in duration-200" 
                            : "border-transparent text-secondary hover:text-on-surface"
                        )}
                      >
                        Followers ({myFollowersList.length})
                      </button>
                      <button
                        onClick={() => setConnectionsSubTab('following')}
                        className={cn(
                          "pb-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors",
                          connectionsSubTab === 'following' 
                            ? "border-primary text-primary animate-in fade-in duration-200" 
                            : "border-transparent text-secondary hover:text-on-surface"
                        )}
                      >
                        Following ({myFollowingList.length})
                      </button>
                    </div>

                    {connectionsSubTab === 'followers' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {myFollowersList.length === 0 ? (
                          <div className="col-span-2 text-center py-8 text-xs text-secondary italic font-semibold">No followers found yet. Connect with scholars in find page!</div>
                        ) : (
                          myFollowersList.map((usr) => (
                            <div 
                              key={usr.username}
                              onClick={() => navigate(`/profile/${usr.username}`)}
                              className="p-3.5 rounded-xl border border-outline-variant/10 hover:bg-surface-container flex items-center justify-between cursor-pointer transition-all group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-surface-container overflow-hidden shrink-0 border border-outline-variant/5">
                                  <img src={usr.img} alt={usr.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-black text-on-surface group-hover:text-primary transition-colors truncate">
                                    {usr.name}
                                  </h4>
                                  <p className="text-secondary text-[10px] font-semibold truncate">@{usr.username} • {usr.role}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFollower(usr.username);
                                  }}
                                  className="px-3 py-1 text-[9px] bg-surface-container hover:bg-surface-container-high border border-outline-variant/10 text-secondary font-black uppercase rounded-full cursor-pointer transition-all"
                                  title="Remove follower"
                                >
                                  Remove
                                </button>
                                {following.includes(usr.username) ? (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFollow(usr.username);
                                    }}
                                    className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-surface-container text-secondary border border-outline-variant/10 hover:bg-surface-container-high cursor-pointer transition-all"
                                  >
                                    Following
                                  </button>
                                ) : (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFollow(usr.username);
                                    }}
                                    className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-primary text-white hover:brightness-110 cursor-pointer transition-all"
                                  >
                                    Follow back
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {myFollowingList.length === 0 ? (
                          <div className="col-span-2 text-center py-8 text-xs text-secondary italic font-semibold">You are not following any other scholars.</div>
                        ) : (
                          myFollowingList.map((usr) => (
                            <div 
                              key={usr.username}
                              onClick={() => navigate(`/profile/${usr.username}`)}
                              className="p-3.5 rounded-xl border border-outline-variant/10 hover:bg-surface-container flex items-center justify-between cursor-pointer transition-all group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-surface-container overflow-hidden shrink-0 border border-outline-variant/5">
                                  <img src={usr.img} alt={usr.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-black text-on-surface group-hover:text-primary transition-colors truncate">
                                    {usr.name}
                                  </h4>
                                  <p className="text-secondary text-[10px] font-semibold truncate">@{usr.username} • {usr.role}</p>
                                </div>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFollow(usr.username);
                                }}
                                className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-surface-container text-secondary border border-outline-variant/10 hover:bg-surface-container-high cursor-pointer transition-all shrink-0"
                              >
                                Unfollow
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Photos Section */}
              {activeTab === 'photos' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/5 shadow-sm">
                    <h3 className="text-lg font-bold font-manrope mb-5">Photos</h3>
                    {userPhotos.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {userPhotos.map((url, idx) => (
                          <PostImage
                            key={idx}
                            src={url}
                            alt={`Photo ${idx}`}
                            containerClassName="aspect-square bg-surface-container rounded-lg overflow-hidden cursor-pointer border border-outline-variant/5"
                            className="group-hover:scale-105 duration-500"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-secondary text-sm font-medium">
                        No photos found in your microposts or articles.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Videos Section */}
              {activeTab === 'videos' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/5 shadow-sm">
                    <h3 className="text-lg font-bold font-manrope mb-5">Videos</h3>
                    {userVideos.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {userVideos.map((url, idx) => (
                          <PostImage
                            key={idx}
                            src={url}
                            containerClassName="aspect-video rounded-lg overflow-hidden relative border border-outline-variant/5"
                            aspectRatio={16 / 9}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-secondary text-sm font-medium">
                        No videos found in your microposts or articles.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reels Placeholder */}
              {(activeTab === 'reels' || activeTab === 'more') && (
                <div className="bg-surface-container-lowest p-8 text-center rounded-xl border border-outline-variant/5 animate-in fade-in slide-in-from-bottom-2">
                  <div className="w-14 h-14 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-3">
                    {activeTab === 'reels' ? <Camera className="w-6 h-6 text-secondary" /> : <LayoutDashboard className="w-6 h-6 text-secondary" />}
                  </div>
                  <h3 className="text-base font-bold text-on-surface">No {activeTab} to show</h3>
                  <p className="text-xs text-secondary mt-1.5">Check back later for updates.</p>
                </div>
              )}

            {activeTab === 'settings' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="max-w-7xl mx-auto space-y-4">
                  {/* Account & Profile */}
                  <section className="bg-surface-container-lowest p-5 rounded-2xl ambient-shadow border border-outline-variant/5">
                    <div className="flex items-center gap-2.5 mb-5">
                      <UserIcon className="w-4.5 h-4.5 text-primary" />
                      <h2 className="text-lg font-bold tracking-tight font-manrope">Account & Profile</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-5">
                        <div>
                          <label className="block text-[10px] font-black text-secondary mb-1.5 uppercase tracking-widest">Display Name</label>
                          <input 
                            className="w-full bg-surface-container-low border-none rounded-xl px-3.5 py-2 text-xs text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all" 
                            type="text" 
                            value={tempSettings.displayName}
                            onChange={(e) => setTempSettings({...tempSettings, displayName: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-secondary mb-1.5 uppercase tracking-widest">Bio</label>
                          <textarea 
                            className="w-full bg-surface-container-low border-none rounded-xl px-3.5 py-2 text-xs text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all" 
                            rows={3} 
                            value={tempSettings.bio}
                            onChange={(e) => setTempSettings({...tempSettings, bio: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-xs font-black text-secondary mb-3 uppercase tracking-widest">Technical Expertise Tags</label>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {tempSettings.skills.map((tag: string) => (
                              <div key={tag} className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-lg text-[11px] font-bold">
                                {tag}
                                <X className="w-3 h-3 cursor-pointer" onClick={() => removeSkill(tag)} />
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={newSkill} 
                              onChange={(e) => setNewSkill(e.target.value)}
                              className="flex-1 bg-surface-container-low border-none rounded-xl px-4 py-2 text-sm"
                              placeholder="New skill..."
                            />
                            <button onClick={addSkill} className="bg-surface-container-highest text-primary px-4 py-2 rounded-xl text-xs font-bold hover:bg-surface-container transition-colors">
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-black text-secondary mb-2 uppercase tracking-widest">Profile Photo</label>
                          <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-container relative group shadow-lg flex items-center justify-center">
                              {tempSettings.photoUrl ? (
                                <img className="w-full h-full object-cover" src={tempSettings.photoUrl} alt="Profile" referrerPolicy="no-referrer" />
                              ) : (
                                <UserIcon className="w-10 h-10 text-secondary" />
                              )}
                              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Camera className="w-6 h-6 text-white" />
                                <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                              </label>
                            </div>
                            <label className="text-xs font-black text-primary px-4 py-2 bg-surface-container-highest rounded-xl hover:bg-surface-container transition-all cursor-pointer">
                              Change Avatar
                              <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Notification Preferences */}
                  <section className="bg-surface-container-lowest p-5 rounded-2xl ambient-shadow border border-outline-variant/5">
                    <div className="flex items-center gap-2.5 mb-5">
                      <Bell className="w-4.5 h-4.5 text-primary" />
                      <h2 className="text-lg font-bold tracking-tight font-manrope">Notification Preferences</h2>
                    </div>
                    <div className="space-y-4">
                      {[
                        { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive real-time notifications for comments and mentions via email.' },
                        { key: 'platformNotifications', label: 'Platform Notifications', desc: 'Show notification dots and banners within the dashboard UI.' },
                        { key: 'weeklyDigest', label: 'Weekly Digest Summaries', desc: 'A curated summary of the top articles and community discussions from your feed.' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between py-1.5">
                          <div>
                            <p className="text-xs font-bold text-on-surface">{item.label}</p>
                            <p className="text-[10px] text-secondary mt-0.5">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={(tempSettings as any)[item.key]}
                              onChange={(e) => setTempSettings({...tempSettings, [item.key]: e.target.checked})}
                            />
                            <div className="relative w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Security & Privacy */}
                    <section className="bg-surface-container-lowest p-8 rounded-3xl ambient-shadow border border-outline-variant/5">
                      <div className="flex items-center gap-3 mb-6">
                        <Shield className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-bold tracking-tight font-manrope">Security & Privacy</h2>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-surface-container-low/40 rounded-xl border border-outline-variant/10">
                          <div className="pr-4">
                            <p className="text-xs font-bold text-on-surface">Require Follow Approval</p>
                            <p className="text-[10px] text-secondary mt-1">If enabled, other users must request to follow you before they can see your posts.</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={!!(tempSettings as any).requireFollowApproval}
                              onChange={(e) => setTempSettings({...tempSettings, requireFollowApproval: e.target.checked})}
                            />
                            <div className="relative w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                        <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low transition-colors text-left group">
                          <div className="flex items-center gap-3">
                            <Lock className="w-4 h-4 text-secondary" />
                            <span className="text-sm font-bold">Change Password</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-secondary group-hover:translate-x-1 transition-transform" />
                        </button>
                        <div className="pt-2">
                          <label className="block text-xs font-bold text-secondary mb-3 uppercase tracking-widest">Connected Accounts</label>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
                              <div className="flex items-center gap-3">
                                <Github className="w-4 h-4 text-on-surface" />
                                <span className="text-sm font-bold">GitHub</span>
                              </div>
                              <span className="text-[10px] uppercase font-bold text-secondary bg-surface-container px-2 py-0.5 rounded-lg">Not Connected</span>
                            </div>
                            <button className="w-full flex items-center gap-3 p-3 border-2 border-dashed border-outline-variant/30 rounded-xl hover:bg-surface-container-low transition-colors text-sm font-bold text-secondary">
                              <LinkIcon className="w-4 h-4" />
                              Connect Google
                            </button>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Display */}
                    <section className="bg-surface-container-lowest p-8 rounded-3xl ambient-shadow border border-outline-variant/5">
                      <div className="flex items-center gap-3 mb-6">
                        <Palette className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-bold tracking-tight font-manrope">Display</h2>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-xs font-bold text-secondary mb-3 uppercase tracking-widest">Appearance</label>
                          <div className="grid grid-cols-2 gap-3">
                            <button 
                              onClick={theme === 'dark' ? toggleTheme : undefined}
                              className={cn("flex flex-col items-center gap-2 p-4 border-2 rounded-2xl transition-all", theme === 'light' ? "border-primary bg-primary/5" : "border-transparent bg-surface-container-low hover:bg-surface-container")}
                            >
                              <Sun className={cn("w-5 h-5", theme === 'light' ? "text-primary" : "text-secondary")} />
                              <span className={cn("text-xs font-bold", theme === 'light' ? "text-primary" : "text-secondary")}>Light</span>
                            </button>
                            <button 
                              onClick={theme === 'light' ? toggleTheme : undefined}
                              className={cn("flex flex-col items-center gap-2 p-4 border-2 rounded-2xl transition-all", theme === 'dark' ? "border-primary bg-primary/5" : "border-transparent bg-surface-container-low hover:bg-surface-container")}
                            >
                              <Moon className={cn("w-5 h-5", theme === 'dark' ? "text-primary" : "text-secondary")} />
                              <span className={cn("text-xs font-bold", theme === 'dark' ? "text-primary" : "text-secondary")}>Dark</span>
                            </button>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <label className="block text-xs font-bold text-secondary uppercase tracking-widest">Font Size</label>
                            <span className="text-xs font-bold text-primary">Medium ({tempSettings.fontSize}px)</span>
                          </div>
                          <input 
                            className="w-full cursor-pointer py-2 focus:outline-none" 
                            type="range" 
                            min="12" 
                            max="18" 
                            value={tempSettings.fontSize}
                            onChange={(e) => setTempSettings({...tempSettings, fontSize: parseInt(e.target.value)})}
                          />
                          <div className="flex justify-between mt-2 text-[10px] font-bold text-outline-variant uppercase tracking-widest">
                            <span>Small</span>
                            <span>Medium</span>
                            <span>Large</span>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-end gap-4 pt-8">
                    <button onClick={handleSettingsDiscard} className="px-6 py-3 text-secondary font-bold text-xs hover:bg-surface-container rounded-xl transition-colors">Discard Changes</button>
                    <button onClick={handleSettingsSave} className="px-8 py-3 bg-primary text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-transform">Save Changes</button>
                  </div>

                  {/* Danger Zone */}
                  <div className="mt-8 p-8 border border-tertiary/20 rounded-3xl bg-tertiary/5">
                    <div className="flex items-center gap-2 text-tertiary font-bold mb-2">
                      <AlertTriangle className="w-5 h-5" />
                      <h3 className="text-sm">Danger Zone</h3>
                    </div>
                    <p className="text-xs text-secondary mb-4">Deleting your account is permanent and cannot be undone. All your articles and bookmarks will be lost.</p>
                    <button 
                      onClick={() => {
                        logout();
                        navigate("/");
                      }}
                      className="text-xs font-bold text-tertiary border border-tertiary/40 px-4 py-2 rounded-xl hover:bg-tertiary hover:text-white transition-all"
                    >
                          Deactivate Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div> {/* end of inner tabs space-y-6 */}
         </div> {/* end of Left Column col-span-12 lg:col-span-8 */}

          {/* Right Column - 4/12 span */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* 1. User details card */}
            <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-tertiary to-emerald-500" />
              
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-lg font-black font-manrope text-on-surface">
                    {user?.fullName || 'Tanvir Fuad Sunny'}
                  </h2>
                  <p className="text-xs font-semibold text-secondary font-mono">
                    @{user?.username || 'sunny'}
                  </p>
                </div>
                
                <button 
                  onClick={() => {
                    const profileUrl = `${window.location.origin}/profile/${user?.username || 'sunny'}`;
                    navigator.clipboard.writeText(profileUrl);
                    alert("Profile link copied to clipboard!");
                  }}
                  className="p-2 hover:bg-surface-container rounded-full text-secondary hover:text-on-surface transition-all cursor-pointer border border-outline-variant/10"
                  title="Share Profile"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-4 text-xs font-bold text-secondary">
                <div>
                  <span className="text-on-surface font-black">{(followers || []).length > 0 ? (followers || []).length : 6}</span> Followers
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-secondary/30" />
                <div>
                  <span className="text-on-surface font-black">{(following || []).length > 0 ? (following || []).length : 8}</span> Following
                </div>
              </div>
            </div>

            {/* 2. Unified Metrics, Achievements & Settings Card */}
            <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6 shadow-sm space-y-6">
              {/* Metrics Section */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-on-surface font-manrope">Metrics & stats</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Knowledge Score */}
                  <button 
                    onClick={() => setSelectedMetric('knowledgeScore')}
                    className="p-3.5 bg-surface-container-low hover:bg-surface-container hover:-translate-y-0.5 transition-all text-left rounded-2xl border border-outline-variant/5 flex flex-col justify-between h-[84px] cursor-pointer group"
                  >
                    <span className="text-lg font-bold text-on-surface leading-none block">
                      {userStats.knowledgeScore.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] font-bold text-secondary">Knowledge score</span>
                      <Info className="w-3 h-3 text-secondary/60 group-hover:text-primary transition-colors shrink-0" />
                    </div>
                  </button>

                  {/* Edu Impact */}
                  <button 
                    onClick={() => setSelectedMetric('eduImpact')}
                    className="p-3.5 bg-surface-container-low hover:bg-surface-container hover:-translate-y-0.5 transition-all text-left rounded-2xl border border-outline-variant/5 flex flex-col justify-between h-[84px] cursor-pointer group"
                  >
                    <span className="text-lg font-bold text-on-surface leading-none block">
                      {userStats.eduImpact.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] font-bold text-secondary">Edu impact</span>
                      <Info className="w-3 h-3 text-secondary/60 group-hover:text-primary transition-colors shrink-0" />
                    </div>
                  </button>

                  {/* Platform Age */}
                  <button 
                    onClick={() => setSelectedMetric('platformAge')}
                    className="p-3.5 bg-surface-container-low hover:bg-surface-container hover:-translate-y-0.5 transition-all text-left rounded-2xl border border-outline-variant/5 flex flex-col justify-between h-[84px] cursor-pointer group"
                  >
                    <span className="text-lg font-bold text-on-surface leading-none block truncate">
                      {userStats.platformAge}
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] font-bold text-secondary">Platform age</span>
                      <Info className="w-3 h-3 text-secondary/60 group-hover:text-primary transition-colors shrink-0" />
                    </div>
                  </button>

                  {/* Certificates Count */}
                  <button 
                    onClick={() => setSelectedMetric('certificatesCount')}
                    className="p-3.5 bg-surface-container-low hover:bg-surface-container hover:-translate-y-0.5 transition-all text-left rounded-2xl border border-outline-variant/5 flex flex-col justify-between h-[84px] cursor-pointer group"
                  >
                    <span className="text-lg font-bold text-on-surface leading-none block">
                      {userStats.certificatesCount}
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] font-bold text-secondary">Certificates</span>
                      <ChevronRight className="w-3 h-3 text-secondary/60 group-hover:text-primary transition-colors shrink-0" />
                    </div>
                  </button>

                  {/* Contributor Rank */}
                  <button 
                    onClick={() => setSelectedMetric('contributorRank')}
                    className="p-3.5 bg-surface-container-low hover:bg-surface-container hover:-translate-y-0.5 transition-all text-left rounded-2xl border border-outline-variant/5 flex items-center justify-between col-span-2 h-[76px] cursor-pointer group"
                  >
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-secondary block">Contributor rank</span>
                      <span className="text-base font-bold text-on-surface leading-tight block animate-pulse">
                        {userStats.contributorRank}
                      </span>
                    </div>
                    <Info className="w-4.5 h-4.5 text-secondary/60 group-hover:text-primary transition-colors shrink-0" />
                  </button>
                </div>
              </div>

              {/* Achievements Section */}
              <div className="space-y-4 pt-2">
                <h3 className="text-base font-bold text-on-surface font-manrope">Platform achievements</h3>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 z-30 shadow-sm">
                      <Sparkles className="w-4 h-4 fill-current animate-pulse" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 -ml-2.5 z-20 shadow-sm">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 -ml-2.5 z-10 shadow-sm">
                      <Shield className="w-4 h-4" />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-on-surface truncate">
                    Early Bird, Top Contributor...
                  </span>
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-1">
                  <span className="text-xs font-semibold text-secondary">3 unlocked</span>
                  <button 
                    onClick={() => setActiveTab('about')}
                    className="px-4 py-1.5 bg-surface-container hover:bg-surface-container-high text-xs font-bold rounded-full transition-all cursor-pointer"
                  >
                    View All
                  </button>
                </div>
              </div>

              {/* Settings Section */}
              <div className="space-y-4 pt-2">
                <h3 className="text-base font-bold text-on-surface font-manrope">Settings</h3>
                
                <div className="divide-y divide-outline-variant/5">
                  {/* Profile row */}
                  <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full bg-[#ffebe5] text-[#ff5a36] flex items-center justify-center shrink-0">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-on-surface">Profile</span>
                        <span className="text-xs text-secondary font-medium">Customize profile</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleTabChange('settings')}
                      className="px-4 py-1.5 bg-surface-container hover:bg-surface-container-high text-xs font-bold rounded-full transition-all cursor-pointer shrink-0"
                    >
                      Update
                    </button>
                  </div>

                  {/* Curate profile row */}
                  <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center shrink-0">
                        <Compass className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-on-surface">Curate profile</span>
                        <span className="text-xs text-secondary font-medium">Manage visibility</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleTabChange('settings')}
                      className="px-4 py-1.5 bg-surface-container hover:bg-surface-container-high text-xs font-bold rounded-full transition-all cursor-pointer shrink-0"
                    >
                      Update
                    </button>
                  </div>

                  {/* Avatar row */}
                  <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full bg-[#ebeeec] text-[#4f6057] flex items-center justify-center shrink-0">
                        <UserCircle className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-on-surface">Avatar</span>
                        <span className="text-xs text-secondary font-medium">Style avatar</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleTabChange('settings')}
                      className="px-4 py-1.5 bg-surface-container hover:bg-surface-container-high text-xs font-bold rounded-full transition-all cursor-pointer shrink-0"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Recently Viewed Links */}
            <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-secondary" />
                  <h3 className="text-xs font-black text-secondary uppercase tracking-[0.2em] font-manrope">Recently Viewed</h3>
                </div>
                {recentlyViewed.length > 0 && (
                  <button 
                    onClick={() => setIsHistoryDrawerOpen(true)}
                    className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                {recentlyViewed.slice(0, 3).map((art, index) => (
                  <div 
                    key={`sidebar-rv-${art.id}-${index}`}
                    onClick={() => navigate(`/article/${art.id}`)}
                    className="flex gap-3 p-2 hover:bg-surface-container-low rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 relative bg-surface-container border border-outline-variant/10">
                      <img 
                        src={art.image} 
                        alt={art.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <h4 className="text-[11px] font-black leading-tight text-on-surface group-hover:text-primary transition-colors line-clamp-2 font-manrope">
                        {art.title}
                      </h4>
                      <p className="text-[9px] text-secondary font-medium">
                        By {art.authorName}
                      </p>
                    </div>
                  </div>
                ))}
                {recentlyViewed.length === 0 && (
                  <div className="text-center py-4 text-[11px] text-secondary font-medium italic">
                    No articles visited yet.
                  </div>
                )}
              </div>
            </div>
          </div> 

        </div> {/* end of top level Grid wrapper */}
       </div> {/* end of max-w-1200 w-full */}

        {editingPost && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl shadow-2xl max-w-3xl w-full h-[90vh] max-h-[850px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="h-[74px] px-6 border-b border-outline-variant/10 flex items-center justify-between shrink-0 bg-surface-container-lowest">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setEditingPost(null)}
                    className="p-1.5 hover:bg-surface-container rounded-xl transition-all text-secondary"
                    aria-label="Back"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="h-6 w-[1px] bg-outline-variant/30" />
                  <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded uppercase tracking-widest animate-pulse">
                    {editingPost.format === 'article' ? 'Journal / Article' : 'Micro-post'}
                  </span>
                  <div className="h-4 w-px bg-outline-variant/30 hidden sm:block" />
                  <h3 className="font-manrope font-black text-sm text-on-surface hidden sm:block">
                    {editingPost.format === 'article' ? 'Edit Journal Draft' : 'Edit Quick Post'}
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-[10px] font-bold text-secondary uppercase tracking-widest hidden sm:inline opacity-60">
                    {editContent.length} chars • {editContent.trim() ? editContent.trim().split(/\s+/).length : 0} words
                  </div>
                  <button 
                    onClick={() => setEditingPost(null)}
                    className="p-1.5 hover:bg-surface-container rounded-full transition-all text-secondary"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 no-scrollbar">
                
                {/* 1. ARTICLE FORMAT EDITING LAYOUT */}
                {editingPost.format === 'article' ? (
                  <div className="space-y-6 max-w-2xl mx-auto">
                    {/* Header: Title and subtitle */}
                    <div className="space-y-3 pb-4 border-b border-outline-variant/10">
                      <input 
                        type="text" 
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-transparent border-none text-2xl md:text-3xl font-manrope font-black text-on-surface placeholder:text-outline-variant/60 focus:ring-0 outline-none p-0 tracking-tight"
                        placeholder="Title of your journal/article..."
                      />
                      <input 
                        type="text" 
                        value={editSubtitle}
                        onChange={(e) => setEditSubtitle(e.target.value)}
                        className="w-full bg-transparent border-none text-sm font-bold text-secondary placeholder:text-outline-variant/40 focus:ring-0 outline-none p-0"
                        placeholder="Enter sub-title or abstract summary..."
                      />
                    </div>

                    {/* Editor Space Controls - Toolbar */}
                    <div className="flex items-center gap-1 bg-inverse-surface/95 dark:bg-inverse-surface/85 p-1 rounded-xl shadow-md border border-white/5 w-fit max-w-full overflow-x-auto no-scrollbar shrink-0">
                      <button 
                        type="button" 
                        onClick={() => {
                          const textarea = document.getElementById('edit-content-textarea') as HTMLTextAreaElement;
                          if (!textarea) return;
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = textarea.value;
                          const selected = text.substring(start, end);
                          const replacement = `**${selected}**`;
                          setEditContent(text.substring(0, start) + replacement + text.substring(end));
                        }} 
                        className="p-1.5 px-3 hover:bg-white/10 text-white rounded font-bold text-[11px] transition-colors"
                        title="Bold (Ctrl+B)"
                      >
                        Bold
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          const textarea = document.getElementById('edit-content-textarea') as HTMLTextAreaElement;
                          if (!textarea) return;
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = textarea.value;
                          const selected = text.substring(start, end);
                          const replacement = `*${selected}*`;
                          setEditContent(text.substring(0, start) + replacement + text.substring(end));
                        }} 
                        className="p-1.5 px-3 hover:bg-white/10 text-white rounded italic text-[11px] transition-colors"
                        title="Italic (Ctrl+I)"
                      >
                        Italic
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          const textarea = document.getElementById('edit-content-textarea') as HTMLTextAreaElement;
                          if (!textarea) return;
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = textarea.value;
                          const selected = text.substring(start, end);
                          const replacement = `\`${selected}\``;
                          setEditContent(text.substring(0, start) + replacement + text.substring(end));
                        }} 
                        className="p-1.5 px-3 hover:bg-white/10 text-white rounded font-mono text-[11px] transition-colors"
                        title="Code snippet"
                      >
                        Code
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          const textarea = document.getElementById('edit-content-textarea') as HTMLTextAreaElement;
                          if (!textarea) return;
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = textarea.value;
                          const selected = text.substring(start, end);
                          const replacement = `\n> ${selected}\n`;
                          setEditContent(text.substring(0, start) + replacement + text.substring(end));
                        }} 
                        className="p-1.5 px-3 hover:bg-white/10 text-white rounded text-[11px] transition-colors"
                        title="Blockquote"
                      >
                        Quote
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          const textarea = document.getElementById('edit-content-textarea') as HTMLTextAreaElement;
                          if (!textarea) return;
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = textarea.value;
                          const selected = text.substring(start, end);
                          const replacement = `\n- ${selected}`;
                          setEditContent(text.substring(0, start) + replacement + text.substring(end));
                        }} 
                        className="p-1.5 px-3 hover:bg-white/10 text-white rounded text-[11px] transition-colors"
                        title="List item"
                      >
                        List
                      </button>
                    </div>

                    {/* Main clean borderless text area for Article */}
                    <textarea 
                      id="edit-content-textarea"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={14}
                      className="w-full bg-transparent border-none text-sm font-semibold text-on-surface focus:ring-0 outline-none resize-none leading-relaxed min-h-[300px] p-0"
                      placeholder="Write your article core content here..."
                    />
                  </div>
                ) : (
                  /* 2. MICROPOST FORMAT EDITING LAYOUT */
                  <div className="space-y-6 max-w-2xl mx-auto">
                    {/* Simulated FeedComposer container */}
                    <div className="flex gap-4 items-start pb-4 border-b border-outline-variant/10">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/10 flex items-center justify-center bg-surface-container shrink-0">
                        {user?.profileImage ? (
                          <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <UserCircle className="w-6 h-6 text-secondary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <textarea 
                          id="edit-content-textarea"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={6}
                          className="w-full bg-transparent border-none focus:ring-0 outline-none text-[14px] leading-relaxed resize-none p-0 min-h-[120px]"
                          placeholder="What's on your mind? Use #hashtags to categorize."
                        />
                      </div>
                    </div>

                    {/* Inline formatting option for quick posts if desired (kept minimal and responsive) */}
                    <div className="flex justify-end opacity-40 hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-secondary font-bold font-mono">
                        Markdown styling is supported
                      </span>
                    </div>
                  </div>
                )}

                {/* Meta details divider and section */}
                <div className="max-w-2xl mx-auto pt-4 border-t border-outline-variant/10 space-y-6">
                  <h4 className="text-[10px] font-black text-secondary tracking-[0.25em] uppercase">
                    Publishing details & metadata
                  </h4>

                  {/* Media uploads (applicable to both formats) */}
                  <div className="bg-surface-container-low/40 p-5 rounded-2xl border border-outline-variant/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-tertiary" /> Media attachments
                      </span>
                      <span className="text-[10px] text-secondary font-bold uppercase tracking-widest">
                        {editImages.length} attached
                      </span>
                    </div>

                    {editImages.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {editImages.map((mediaUrl, idx) => {
                          const isVid = isVideoUrl(mediaUrl);
                          return (
                            <div key={idx} className="relative aspect-video rounded-xl bg-surface-container border border-outline-variant/15 overflow-hidden group">
                              {isVid ? (
                                <video src={mediaUrl} className="w-full h-full object-cover bg-black" controls />
                              ) : (
                                <img src={mediaUrl} alt="Payload" className="w-full h-full object-cover" />
                              )}
                              <button 
                                type="button"
                                onClick={() => setEditImages(editImages.filter((_, i) => i !== idx))}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full text-white shadow transition-all opacity-0 group-hover:opacity-100"
                                title="Delete media"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="space-y-2 pt-2 border-t border-outline-variant/5">
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="Paste image or video URL..."
                          id="new-edit-media-url"
                          className="flex-1 bg-surface-container border border-outline-variant/10 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-primary/20 outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = (e.target as HTMLInputElement).value.trim();
                              if (val) {
                                setEditImages([...editImages, val]);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('new-edit-media-url') as HTMLInputElement;
                            const val = input?.value.trim();
                            if (val) {
                              setEditImages([...editImages, val]);
                              input.value = '';
                            }
                          }}
                          className="px-4 py-2.5 bg-primary text-white text-xs font-black rounded-xl hover:brightness-110 shrink-0"
                        >
                          Add URL
                        </button>
                      </div>

                      <div className="flex items-center justify-center border border-dashed border-outline-variant/30 rounded-xl p-4 hover:bg-primary/5 transition-all relative">
                        <input 
                          type="file"
                          accept="image/*,video/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const url = event.target?.result as string;
                                if (url) {
                                  setEditImages([...editImages, url]);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                          <Plus className="w-4 h-4" /> Upload Local Image/Video File (Base64)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Poll creation/editor (Only if format is micropost, or active poll exists) */}
                  {(editingPost.format !== 'article' || editPoll) && (
                    <div className="bg-surface-container-low/40 p-5 rounded-2xl border border-outline-variant/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-1.5">
                          <BarChart2 className="w-4 h-4 text-primary" /> Poll questions & choices
                        </span>
                        {editPoll ? (
                          <button
                            type="button"
                            onClick={() => setEditPoll(null)}
                            className="text-[10px] font-black text-red-500 hover:underline uppercase tracking-wider"
                          >
                            Remove Poll Widget
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditPoll({ question: '', options: [{ id: 'opt_1', text: '', votes: 0 }, { id: 'opt_2', text: '', votes: 0 }] })}
                            className="text-[10px] font-black text-primary hover:underline uppercase tracking-wider flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Attach Poll
                          </button>
                        )}
                      </div>

                      {editPoll && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Question</label>
                            <input 
                              type="text"
                              value={editPoll.question}
                              onChange={(e) => setEditPoll({ ...editPoll, question: e.target.value })}
                              className="w-full bg-surface-container border border-outline-variant/10 rounded-xl px-4 py-3 text-xs font-semibold focus:ring-1 focus:ring-primary/20 outline-none"
                              placeholder="Type poll question..."
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Choices</label>
                            {editPoll.options.map((opt: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2">
                                <input 
                                  type="text"
                                  value={opt.text}
                                  onChange={(e) => {
                                    const updatedOpts = [...editPoll.options];
                                    updatedOpts[idx] = { ...opt, text: e.target.value };
                                    setEditPoll({ ...editPoll, options: updatedOpts });
                                  }}
                                  className="flex-1 bg-surface-container border border-outline-variant/10 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-primary/20 outline-none"
                                  placeholder={`Choice option ${idx + 1}`}
                                />
                                {editPoll.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedOpts = editPoll.options.filter((_: any, i: number) => i !== idx);
                                      setEditPoll({ ...editPoll, options: updatedOpts });
                                    }}
                                    className="p-2 text-secondary hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          {editPoll.options.length < 4 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updatedOpts = [...editPoll.options, { id: `opt_${Date.now()}_${editPoll.options.length}`, text: '', votes: 0 }];
                                setEditPoll({ ...editPoll, options: updatedOpts });
                              }}
                              className="text-[11px] font-black text-primary hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                            >
                              <Plus className="w-4 h-4" /> Add option choice
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Category selections (applicable to both formats) */}
                  <div className="bg-surface-container-low/40 p-5 rounded-2xl border border-outline-variant/10 space-y-3">
                    <span className="text-[10px] font-black text-secondary tracking-[0.2em] uppercase block">
                      Category Tags
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {['Pedagogy', 'Educational Tech', 'Research', 'Curriculum', 'Assessment', 'Inclusion', 'Leadership', 'Science', 'Mathematics', 'Literacy'].map((cat) => {
                        const isSelected = editCategories.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setEditCategories(editCategories.filter(c => c !== cat));
                              } else {
                                setEditCategories([...editCategories, cat]);
                              }
                            }}
                            className={cn(
                              "px-3.5 py-1.5 rounded-full text-[10px] font-black transition-all cursor-pointer",
                              isSelected 
                                ? "bg-primary text-white shadow-sm" 
                                : "bg-surface-container text-secondary hover:bg-surface-container-high"
                            )}
                          >
                            {isSelected ? '✓ ' : ''}{cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Location & Tagged Colleagues (applicable to both formats) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-surface-container-low/40 p-5 rounded-2xl border border-outline-variant/10">
                    <div>
                      <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-1.5 block">Update Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary bg-primary/10 rounded-full p-0.5" />
                        <input 
                          type="text"
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                          className="w-full bg-surface-container border border-outline-variant/10 rounded-xl pl-11 pr-4 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-primary/20 outline-none"
                          placeholder="Search or enter place..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-1.5 block">Tagged Colleagues</label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {editTaggedUsers.map((u, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-extrabold shadow-sm">
                            {u.name}
                            <button 
                              type="button" 
                              onClick={() => setEditTaggedUsers(editTaggedUsers.filter(user => user.id !== u.id))}
                              className="hover:text-red-500 font-extrabold text-[12px] opacity-75 shrink-0"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                      
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) return;
                          const [uid, name] = val.split(':');
                          if (!editTaggedUsers.some(u => u.id === uid)) {
                            setEditTaggedUsers([...editTaggedUsers, { id: uid, name }]);
                          }
                          e.target.value = '';
                        }}
                        className="w-full bg-surface-container border border-outline-variant/10 rounded-xl px-3 py-2.5 text-xs font-semibold text-secondary focus:ring-1 focus:ring-primary/20 outline-none"
                      >
                        <option value="">Tag professional contacts...</option>
                        <option value="1:Dr. Sarah Chen">Dr. Sarah Chen</option>
                        <option value="2:Marcus Rodriguez">Marcus Rodriguez</option>
                        <option value="3:Emma Wilson">Emma Wilson</option>
                        <option value="4:Prof. David Miller">Prof. David Miller</option>
                        <option value="5:Aisha Kahn">Aisha Kahn</option>
                      </select>
                    </div>
                  </div>

                  {/* Privacy & Comments selections (applicable to both formats) */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-between bg-surface-container-low/40 p-5 rounded-2xl border border-outline-variant/10 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Post Privacy:</span>
                      <select
                        value={editPrivacy}
                        onChange={(e) => setEditPrivacy(e.target.value as any)}
                        className="bg-surface-container hover:bg-surface-container-high transition-colors font-extrabold border-none rounded-xl p-2 px-3 focus:ring-0 outline-none text-xs text-on-surface cursor-pointer"
                      >
                        <option value="public">🌍 Public (Community)</option>
                        <option value="followers">👥 Followers & Connections</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Comments Section:</span>
                      <select
                        value={editCommentsEnabled ? 'enabled' : 'disabled'}
                        onChange={(e) => setEditCommentsEnabled(e.target.value === 'enabled')}
                        className="bg-surface-container hover:bg-surface-container-high transition-colors font-extrabold border-none rounded-xl p-2 px-3 focus:ring-0 outline-none text-xs text-on-surface cursor-pointer"
                      >
                        <option value="enabled">💬 Allowed </option>
                        <option value="disabled">🚫 Disabled </option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer Controls */}
              <div className="p-6 bg-surface-container border-t border-outline-variant/5 flex justify-end gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="px-5 py-3 rounded-xl font-bold text-xs text-secondary hover:bg-surface-container-high transition-all uppercase tracking-wider cursor-pointer"
                >
                  Discard
                </button>
                <button 
                  type="button"
                  onClick={async () => {
                    const updates = { 
                      title: editTitle, 
                      content: editContent,
                      subtitle: editSubtitle || undefined,
                      images: editImages,
                      poll: editPoll || undefined,
                      categories: editCategories,
                      taggedUsers: editTaggedUsers,
                      location: editLocation || undefined,
                      privacy: editPrivacy,
                      commentsEnabled: editCommentsEnabled
                    };
                    await postService.updatePost(editingPost.id, updates);
                    setUserPosts(userPosts.map(p => {
                      if (p.id === editingPost.id) {
                        return {
                          ...p,
                          ...updates,
                          words: editContent.split(/\s+/).length,
                          readTime: Math.ceil(editContent.split(/\s+/).length / 200)
                        };
                      }
                      return p;
                    }));
                    setEditingPost(null);
                  }}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-extrabold text-xs shadow-md shadow-primary/15 hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Post Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Post Modal */}
        <AnimatePresence>
          {deletingPostId && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden p-6 space-y-4"
              >
                <div className="flex items-center gap-3 text-red-500">
                  <AlertTriangle className="w-6 h-6 shrink-0" />
                  <h3 className="text-base font-black">Delete Post</h3>
                </div>
                <p className="text-xs font-semibold text-secondary leading-normal">
                  Are you absolutely sure you want to delete this post? This action is permanent and cannot be undone.
                </p>
                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setDeletingPostId(null)}
                    className="px-4 py-2 rounded-xl font-bold text-xs text-secondary hover:bg-surface-container transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      const idToDelete = deletingPostId;
                      setDeletingPostId(null);
                      
                      // Optimistic Updates
                      if (profileData) {
                        setProfileData(prev => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            ownPosts: prev.ownPosts.filter(p => p.id !== idToDelete),
                            combinedTimeline: prev.combinedTimeline.filter(p => p.id !== idToDelete)
                          };
                        });
                      }
                      setUserPosts(prev => prev.filter(p => p.id !== idToDelete));
                      
                      // Show Toast
                      setShowDeleteSuccess(true);
                      setTimeout(() => setShowDeleteSuccess(false), 3000);

                      // Background Firestore Delete
                      postService.deletePost(idToDelete).catch(err => {
                        console.error("Background delete failed:", err);
                      });
                    }}
                    className="px-5 py-2 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-all shadow-md shadow-red-500/10 cursor-pointer"
                  >
                    Delete Post
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Success Toast */}
        {showDeleteSuccess && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[250] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-surface-container-highest border border-outline-variant/20 px-6 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-xs font-bold text-on-surface">Post deleted successfully.</span>
            </div>
          </div>
        )}

        {/* View Statistics Modal */}
        {viewingStatsPost && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
              <div className="p-4 border-b border-outline-variant/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-black text-on-surface">Post Statistics</h3>
                </div>
                <button 
                  onClick={() => setViewingStatsPost(null)}
                  className="p-1.5 hover:bg-surface-container rounded-full transition-all text-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-black text-secondary uppercase tracking-[0.2em] mb-2">engagement metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-outline-variant/10 bg-surface-container-low">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#22c55e] mb-1">
                        <ArrowBigUp className="w-4.5 h-4.5 fill-[#22c55e]" />
                        <span>Upvotes</span>
                      </div>
                      <span className="text-2xl font-black text-on-surface">
                        {('upvotes' in viewingStatsPost ? (viewingStatsPost.upvotes || 0) : ('likes' in viewingStatsPost ? (viewingStatsPost.likes || 0) : 0))}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border border-outline-variant/10 bg-surface-container-low">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#ef4444] mb-1">
                        <ArrowBigDown className="w-4.5 h-4.5 fill-[#ef4444]" />
                        <span>Downvotes</span>
                      </div>
                      <span className="text-2xl font-black text-on-surface">
                        {(viewingStatsPost as any).downvotes || 0}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border border-outline-variant/10 bg-surface-container-low">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-secondary mb-1">
                        <MessageCircle className="w-4.5 h-4.5 text-secondary" />
                        <span>Comments</span>
                      </div>
                      <span className="text-2xl font-black text-on-surface">
                        {viewingStatsPost.comments || 0}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border border-outline-variant/10 bg-surface-container-low">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-secondary mb-1">
                        <Share2 className="w-4.5 h-4.5 text-secondary" />
                        <span>Shares</span>
                      </div>
                      <span className="text-2xl font-black text-on-surface">
                        {(viewingStatsPost as any).shares || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-secondary uppercase tracking-[0.2em] mb-2">content metadata</h4>
                  <div className="space-y-3 bg-surface-container-low border border-outline-variant/10 rounded-xl p-4">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-secondary">Read Time</span>
                      <span className="text-on-surface font-black">{viewingStatsPost.readTime || 1} min read</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-secondary">Word Count</span>
                      <span className="text-on-surface font-black">{viewingStatsPost.words || 0} words</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-secondary">Characters</span>
                      <span className="text-on-surface font-black">{(viewingStatsPost.content || '').length} letters</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-secondary">Privacy Standard</span>
                      <span className="text-on-surface capitalize font-black">{viewingStatsPost.privacy || 'public'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-surface-container-low border-t border-outline-variant/5 flex justify-end">
                <button 
                  onClick={() => setViewingStatsPost(null)}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-md shadow-primary/15 hover:brightness-110 transition-all"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {selectedMetric && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[300] p-4 backdrop-blur-xs">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low/50">
                  <div className="flex items-center gap-2.5 bg-transparent border-0 outline-none">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Star className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-bold font-manrope text-on-surface">
                        {
                          selectedMetric === 'knowledgeScore' ? 'Knowledge score measurement' :
                          selectedMetric === 'eduImpact' ? 'Edu impact measurement' :
                          selectedMetric === 'platformAge' ? 'Platform age measurement' :
                          selectedMetric === 'certificatesCount' ? 'Verified certificates details' :
                          'Contributor standing & rank'
                        }
                      </h3>
                      <p className="text-[10px] text-secondary font-semibold">Metrics explainer</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedMetric(null)}
                    className="p-1.5 hover:bg-surface-container rounded-lg transition-colors cursor-pointer text-secondary hover:text-on-surface"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto no-scrollbar text-left">
                  {/* Current Rating */}
                  {selectedMetric !== 'contributorRank' && (
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between">
                      <div>
                        <p className="text-secondary font-bold text-[10px] cursor-default">your current score</p>
                        <p className="text-lg font-bold text-on-surface mt-0.5">
                          {
                            selectedMetric === 'knowledgeScore' ? userStats.knowledgeScore.toLocaleString() :
                            selectedMetric === 'eduImpact' ? userStats.eduImpact.toLocaleString() :
                            selectedMetric === 'platformAge' ? userStats.platformAge :
                            selectedMetric === 'certificatesCount' ? userStats.certificatesCount :
                            userStats.contributorRank
                          }
                        </p>
                      </div>
                      <span className="text-[10px] font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
                        dynamic metrics
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  {selectedMetric !== 'contributorRank' && (
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-bold text-secondary cursor-default">measurement philosophy</h4>
                      <p className="text-xs text-on-surface font-medium leading-relaxed">
                        {
                          selectedMetric === 'knowledgeScore' ? "The knowledge score acts as a dynamic academic coordinate index. Points are awarded in real-time as you publish long-form articles or micro-posts, modified by community peer interactions (upvotes/likes and views)." :
                          selectedMetric === 'eduImpact' ? "Your edu impact represents how frequently your contributions are saved, bookmarked, and reshared across the ecosystem, indicating high authority and educational value." :
                          selectedMetric === 'platformAge' ? `Measures your tenure and continuous dedication as a learning peer on EduWatch. Calculated dynamically based on your registered account history.` :
                          "EduWatch issues verifiable educational certifications indicating expert pedagogy, course design proficiency, and compiler/computational security expertise."
                        }
                      </p>
                    </div>
                  )}

                  {/* Checkpoint Linear Flow or Score Multipliers */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-secondary cursor-default">
                      {selectedMetric === 'contributorRank' ? 'contributor tiers & status' : 'score multipliers & guides'}
                    </h4>
                    
                    {selectedMetric === 'contributorRank' ? (
                      (() => {
                        const currentScore = userStats.knowledgeScore;
                        let activeIndex = 0;
                        if (currentScore <= 100) activeIndex = 0;
                        else if (currentScore <= 500) activeIndex = 1;
                        else if (currentScore <= 1000) activeIndex = 2;
                        else if (currentScore <= 1500) activeIndex = 3;
                        else activeIndex = 4;

                        const contributorTiersList = [
                          { rank: "Rising learner", range: "0 - 100" },
                          { rank: "Active mentor", range: "101 - 500" },
                          { rank: "Top specialist", range: "501 - 1000" },
                          { rank: "Top 1% curator", range: "1001 - 1500" },
                          { rank: "Elite contributor", range: "> 1500" }
                        ];

                        return (
                          <div className="relative w-full py-4 mt-2">
                            {/* Horizontal background track line */}
                            <div className="absolute top-[30px] left-[10%] right-[10%] h-0.5 bg-outline-variant/20 z-0" />
                            
                            <div className="flex justify-between items-start w-full relative z-10">
                              {contributorTiersList.map((tier, idx) => {
                                const isCompleted = idx < activeIndex;
                                const isActive = idx === activeIndex;

                                return (
                                  <div key={idx} className="flex flex-col items-center w-[20%] text-center px-0.5">
                                    {/* Bullet indicator */}
                                    <div className={cn(
                                      "w-7 h-7 rounded-full flex items-center justify-center border-2 shadow-sm transition-all duration-300",
                                      isCompleted ? "bg-emerald-500 border-emerald-500 text-white" :
                                      isActive ? "bg-primary border-primary ring-4 ring-primary/20 scale-110" :
                                      "bg-surface-container border-outline-variant/60 text-secondary"
                                    )}>
                                      {isCompleted ? (
                                        <Check className="w-4 h-4 stroke-[3]" />
                                      ) : isActive ? (
                                        <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                                      ) : (
                                        <div className="w-1.5 h-1.5 rounded-full bg-secondary/50" />
                                      )}
                                    </div>

                                    {/* Labels */}
                                    <span className={cn(
                                      "text-xs font-bold leading-tight mt-3.5 block truncate max-w-full font-manrope",
                                      isActive ? "text-primary font-black" : "text-on-surface/80"
                                    )} title={tier.rank}>
                                      {tier.rank}
                                    </span>
                                    
                                    <span className="text-[10px] text-secondary font-bold font-mono mt-1 block whitespace-nowrap">
                                      {tier.range}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {/* Current status description below horizontal timeline */}
                            <div className="mt-8 p-5 bg-primary/5 rounded-xl border border-primary/10 text-center">
                              <p className="text-sm font-medium text-on-surface leading-normal">
                                your current score is <span className="font-bold text-primary">{currentScore.toLocaleString()}</span> points. you are currently active in the <span className="font-bold text-primary">{contributorTiersList[activeIndex].rank}</span> checkpoint.
                              </p>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="space-y-2.5">
                        {
                          selectedMetric === 'knowledgeScore' ? [
                            { label: "Article publications", multiplier: "+10 pts", desc: "Long-form editorial articles containing extensive scholarly materials." },
                            { label: "Micro-post updates", multiplier: "+5 pts", desc: "Shorter peer insights, status updates, and interactive community statements." },
                            { label: "Likes & upvotes received", multiplier: "+2 pts", desc: "Validation and endorsement of your work by other community scholars." },
                            { label: "Comments received", multiplier: "+3 pts", desc: "Rich feedback and interactive classroom discussions under your posts." }
                          ].map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start text-xs border-b border-outline-variant/5 pb-2">
                              <div className="max-w-[70%]">
                                <p className="font-bold text-on-surface">{item.label}</p>
                                <p className="text-[10px] text-secondary font-medium mt-0.5">{item.desc}</p>
                              </div>
                              <span className="font-sans font-bold bg-emerald-500/10 text-emerald-600 rounded-lg px-2 py-0.5 text-[10px] font-mono whitespace-nowrap">{item.multiplier}</span>
                            </div>
                          )) :
                          selectedMetric === 'eduImpact' ? [
                            { label: "Article / post reshares", multiplier: "+5 pts", desc: "When another educator reshares your publication to their timeline." },
                            { label: "Bookmarks & saves", multiplier: "+10 pts", desc: "When scholars save your work into their personal reference libraries." },
                            { label: "Ecosystem reads & views", multiplier: "+0.1 pts", desc: "Broad academic views driving general knowledge impact." }
                          ].map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start text-xs border-b border-outline-variant/5 pb-2">
                              <div className="max-w-[70%]">
                                <p className="font-bold text-on-surface">{item.label}</p>
                                <p className="text-[10px] text-secondary font-medium mt-0.5">{item.desc}</p>
                              </div>
                              <span className="font-sans font-bold bg-indigo-500/10 text-indigo-600 rounded-lg px-2 py-0.5 text-[10px] font-mono whitespace-nowrap">{item.multiplier}</span>
                            </div>
                          )) :
                          selectedMetric === 'platformAge' ? [
                            { label: "Joined date reference", multiplier: "Dynamic Date", desc: `Official registration records.` },
                            { label: "Units of measure", multiplier: "Automatic scale", desc: "Display increments adjust smoothly: d (days), w (weeks), m (months), y (years)." }
                          ].map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start text-xs border-b border-outline-variant/5 pb-2">
                              <div className="max-w-[70%]">
                                <p className="font-bold text-on-surface">{item.label}</p>
                                <p className="text-[10px] text-secondary font-medium mt-0.5">{item.desc}</p>
                              </div>
                              <span className="font-sans font-bold bg-blue-500/10 text-blue-600 rounded-lg px-2 py-0.5 text-[10px] font-mono whitespace-nowrap">{item.multiplier}</span>
                            </div>
                          )) :
                          [
                            { label: "12 baseline certificates", multiplier: "+12 certifications", desc: "Pedagogic Frameworks, Learning Design, Universal UX Accessibility Guidelines." },
                            { label: "Active publication bonus", multiplier: "+1 per post", desc: "Continuous scholarly publishing unlocks verified community research tiers." }
                          ].map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start text-xs border-b border-outline-variant/5 pb-2">
                              <div className="max-w-[70%]">
                                <p className="font-bold text-on-surface">{item.label}</p>
                                <p className="text-[10px] text-secondary font-medium mt-0.5">{item.desc}</p>
                              </div>
                              <span className="font-sans font-bold bg-purple-500/10 text-purple-600 rounded-lg px-2 py-0.5 text-[10px] font-mono whitespace-nowrap">{item.multiplier}</span>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedPostModal && (
            <PostModal 
              post={selectedPostModal}
              isOpen={!!selectedPostModal}
              onClose={() => setSelectedPostModal(null)}
              onUpdate={() => handleLocalUpdate(selectedPostModal.id)}
            />
          )}
        </AnimatePresence>

        {/* Right Slider Drawer for Recently Viewed Articles */}
        <AnimatePresence>
          {isHistoryDrawerOpen && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="fixed inset-0 bg-black/50 z-[999] backdrop-blur-xs"
              />
               {/* Drawer */}
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-full max-w-[420px] bg-surface-container-lowest border-l border-outline-variant/10 z-[1000] shadow-2xl flex flex-col"
              >
                <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <History className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-on-surface">Recently Viewed Articles</h3>
                      <p className="text-xs text-secondary font-medium">Your last 10 visited articles</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsHistoryDrawerOpen(false)}
                    className="p-2 hover:bg-surface-container rounded-full text-secondary hover:text-on-surface transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                  {recentlyViewed.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="w-12 h-12 text-secondary/30 mx-auto mb-3" />
                      <p className="text-sm font-bold text-secondary">No articles visited yet.</p>
                    </div>
                  ) : (
                    recentlyViewed.map((art, index) => (
                      <div 
                        key={`drawer-rv-${art.id}-${index}`}
                        onClick={() => {
                          setIsHistoryDrawerOpen(false);
                          navigate(`/article/${art.id}`);
                        }}
                        className="group flex gap-4 p-3 hover:bg-surface-container-low/60 rounded-2xl border border-outline-variant/5 hover:border-outline-variant/15 transition-all cursor-pointer"
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative bg-surface-container border border-outline-variant/10">
                          <img 
                            src={art.image} 
                            alt={art.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div className="space-y-1">
                            <h4 className="text-xs font-black leading-tight text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                              {art.title}
                            </h4>
                            <p className="text-[10px] text-secondary font-bold">
                              By {art.authorName}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[9px] text-secondary font-bold uppercase tracking-wider">
                            <span>{art.date}</span>
                            <span>{art.readTime}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-outline-variant/10 bg-surface-container-low/30 flex items-center justify-between">
                  <span className="text-xs text-secondary font-bold">Showing {recentlyViewed.length} entries</span>
                  <button 
                    onClick={() => {
                      if (window.confirm("Are you sure you want to clear your reading history?")) {
                        localStorage.removeItem('recently_viewed_articles');
                        setRecentlyViewed([]);
                      }
                    }}
                    className="text-xs text-[#ef4444] font-bold hover:underline cursor-pointer"
                  >
                    Clear History
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  </main>
</div>
);
}
