import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { Sidebar } from '../components/Sidebar';
import { FeedItem } from '../components/FeedItem';
import { FeedComposer } from '../components/FeedComposer';
import { RightSidebar } from '../components/RightSidebar';
import { 
  Loader2,
  AlertTriangle,
  Trash2,
  X,
  Globe,
  Users,
  Shield,
  BarChart2,
  Save,
  EyeOff,
  Flag,
  CheckCircle,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { feed, getPopularCreators, Creator, Article as StaticArticle } from '../lib/feedData';
import { useAuth } from '../lib/AuthContext';
import { useSidebar } from '../lib/SidebarContext';
import { useSocial } from '../lib/social';
import { useInterests } from '../lib/useInterests';
import { postService, Post as LocalPost } from '../services/postService';
import { PostModal } from '../components/PostModal';
import { PostSkeleton } from '../components/Skeleton';
import { filterSearchResults, sortSearchResults, type CombinedPost } from '../algorithms/search';
export type { CombinedPost };
import { extractHashtags } from '../algorithms/content';
import { calculateRelevanceScore, calculateGravityRelevanceScore } from '../algorithms/interests';

const topics = [
  'Learning Resources', 'Research', 'Observations', 'Assessment', 'Curriculum', 'Professional Dev'
];

const articleTypes = ['Case Study', 'Research', 'Tutorial', 'Editorial', 'Whitepaper', 'Benchmark'];

export default function Feed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  // Action Modals & Menus states
  const [editingPost, setEditingPost] = useState<CombinedPost | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editPoll, setEditPoll] = useState<any | null>(null);
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const [editTaggedUsers, setEditTaggedUsers] = useState<{ id: string; name: string }[]>([]);
  const [editLocation, setEditLocation] = useState('');
  const [editPrivacy, setEditPrivacy] = useState<'public' | 'followers' | 'communities'>('public');
  const [editCommentsEnabled, setEditCommentsEnabled] = useState(true);

  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [viewingStatsPost, setViewingStatsPost] = useState<CombinedPost | null>(null);
  
  const [reportingPost, setReportingPost] = useState<CombinedPost | null>(null);
  const [reportReason, setReportReason] = useState('Spam');
  const [reportDetails, setReportDetails] = useState('');

  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });

  // Persistent hide state
  const [hiddenPostIds, setHiddenPostIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('eduwatch_hidden_posts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const triggerToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };
  const { isCollapsed, setCollapsed } = useSidebar();
  const { following, toggleFollow } = useSocial();
  const { getRelevanceScore } = useInterests();
  
  // Automatically expand sidebar on mount for better navigation on the feed
  useEffect(() => {
    setCollapsed(false);
  }, []);
  
  const popularCreators = getPopularCreators();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState('Relevance');

  const queryParam = searchParams.get('q');
  useEffect(() => {
    if (queryParam) {
      setSearchQuery(queryParam);
    }
  }, [queryParam]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(() => {
    const saved = sessionStorage.getItem('feed_visible_count');
    return saved ? parseInt(saved) : 10;
  });

  useEffect(() => {
    sessionStorage.setItem('feed_visible_count', visibleCount.toString());
  }, [visibleCount]);

  const [isNewBatchLoading, setIsNewBatchLoading] = useState(false);

  const handleLoadMore = () => {
    if (isNewBatchLoading) return;
    setIsNewBatchLoading(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 10);
      setIsNewBatchLoading(false);
    }, 650);
  };

  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedPostModal, setSelectedPostModal] = useState<CombinedPost | null>(null);
  
  const [displayFeed, setDisplayFeed] = useState<CombinedPost[]>(() => {
    const saved = sessionStorage.getItem('feed_data');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(!sessionStorage.getItem('feed_data'));
  const hasRestoredScroll = useRef(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (authLoading) return; // Wait until top div (Topbar/Sidebar/Composer auth state) finishes loading

    const savedData = sessionStorage.getItem('feed_data');
    if (!savedData) {
      setIsLoading(true);
    }

    // Subscribe to global feed in real-time
    const unsubscribe = postService.subscribeGlobalFeed((dbPosts) => {
      const allLocal = dbPosts.map(p => ({ ...p, isLocal: true }));
      
      // De-duplicate local posts
      const uniqueLocal = allLocal.filter((p, index, self) => 
        index === self.findIndex((t) => t.id === p.id)
      );
      
      const combined = [...uniqueLocal, ...feed];
      const newFeed = combined as CombinedPost[];
      
      setDisplayFeed(newFeed);
      sessionStorage.setItem('feed_data', JSON.stringify(newFeed));
      setIsLoading(false);
    }, (error) => {
      console.error("Failed to subscribe to global live feed:", error);
      setIsLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, refreshKey, authLoading]);

  useLayoutEffect(() => {
    // Restore scroll position instantly on mount if data exists
    if (!isLoading && centerFeedRef.current && !hasRestoredScroll.current) {
      const savedScroll = sessionStorage.getItem('feed_scroll_pos');
      if (savedScroll && displayFeed.length > 0) {
        const scrollTarget = parseInt(savedScroll);
        
        // Instant restoration
        centerFeedRef.current.scrollTop = scrollTarget;
        
        // More aggressive retries to handle layout shifts
        const retries = [10, 50, 150, 300, 500];
        const timeoutIds = retries.map(ms => setTimeout(() => {
          if (centerFeedRef.current) {
            centerFeedRef.current.scrollTop = scrollTarget;
          }
        }, ms));
        
        hasRestoredScroll.current = true;
        return () => timeoutIds.forEach(clearTimeout);
      } else if (displayFeed.length > 0) {
        hasRestoredScroll.current = true;
      }
    }
  }, [isLoading, displayFeed.length]);



  const leftSidebarRef = useRef<HTMLDivElement>(null);
  const centerFeedRef = useRef<HTMLDivElement>(null);
  const rightSidebarRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  const [liveStats, setLiveStats] = useState({
    activeNow: 942,
    totalJournals: 12840,
    weeklyReach: 320400
  });

  useEffect(() => {
    const handleGlobalWheel = (e: WheelEvent) => {
      // Find if we are scrolling over any specific scrollable area
      const target = e.target as Node;
      const isOverLeft = leftSidebarRef.current?.contains(target);
      const isOverRight = rightSidebarRef.current?.contains(target);
      const isOverCenter = centerFeedRef.current?.contains(target);

      // If we are not specifically over the sidebars but we are over the main container (including gaps)
      if (!isOverLeft && !isOverRight && !isOverCenter && mainContainerRef.current?.contains(target)) {
        if (centerFeedRef.current) {
          centerFeedRef.current.scrollTop += e.deltaY;
        }
      }
    };

    window.addEventListener('wheel', handleGlobalWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleGlobalWheel);
  }, []);

  useEffect(() => {
    const handleRefresh = (event: any) => {
      if (event.detail?.path === '/feed') {
        // Clear caches for manual refresh
        sessionStorage.removeItem('feed_data');
        sessionStorage.removeItem('feed_scroll_pos');
        
        // Reset states to "refresh" content
        setVisibleCount(10);
        setSortBy('Relevance');
        setSearchQuery('');
        setSelectedTopics([]);
        setSelectedTypes([]);
        setSelectedTimes([]);
        setSelectedSources([]);
        
        // Trigger a real data fetch
        setIsLoading(true);
        setRefreshKey(prev => prev + 1);
        
        // Scroll to top instantly
        leftSidebarRef.current?.scrollTo({ top: 0 });
        centerFeedRef.current?.scrollTo({ top: 0 });
        rightSidebarRef.current?.scrollTo({ top: 0 });
      }
    };

    window.addEventListener('refresh-page-content', handleRefresh);
    return () => window.removeEventListener('refresh-page-content', handleRefresh);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        activeNow: Math.max(700, prev.activeNow + Math.floor(Math.random() * 15) - 7),
        totalJournals: prev.totalJournals + (Math.random() > 0.95 ? 1 : 0),
        weeklyReach: prev.weeklyReach + Math.floor(Math.random() * 3)
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const isFilterMount = useRef(true);
  const mountTime = useRef(Date.now());
  // Reset visibleCount and scroll to top when filters change
  useEffect(() => {
    // If we've just mounted (within 500ms), don't trigger filter-based resets
    // as initial state sync might cause false positives
    if (isFilterMount.current || (Date.now() - mountTime.current < 500)) {
      isFilterMount.current = false;
      return;
    }
    setVisibleCount(10);
    centerFeedRef.current?.scrollTo({ top: 0 });
  }, [searchQuery, sortBy, selectedTypes, selectedTimes, selectedTopics, selectedSources, itemsPerPage]);

  const filteredFeed = filterSearchResults(
    displayFeed.filter(p => !hiddenPostIds.includes(p.id)),
    searchQuery,
    {
      topics: selectedTopics,
      sources: selectedSources,
      times: selectedTimes
    },
    extractHashtags
  );

  const sortedFeed = [...filteredFeed].sort((a, b) => {
    // 1. Get base relevance scores from interests algorithm
    const profile = JSON.parse(localStorage.getItem('user_interests') || '{}');
    // Ensure profile matches the expected structure
    const safeProfile = {
      tags: profile.tags || {},
      authors: profile.authors || {},
      viewedPostIds: profile.viewedPostIds || []
    };

    const authorA = 'author' in a ? a.author : ('authorName' in a ? a.authorName : '');
    const authorB = 'author' in b ? b.author : ('authorName' in b ? b.authorName : '');
    const tagsA = 'tags' in a ? a.tags : ('categories' in a ? a.categories : []) || [];
    const tagsB = 'tags' in b ? b.tags : ('categories' in b ? b.categories : []) || [];

    const interestA = calculateRelevanceScore(a.id, tagsA, authorA, following.includes(authorA), safeProfile as any);
    const interestB = calculateRelevanceScore(b.id, tagsB, authorB, following.includes(authorB), safeProfile as any);

    const scoreA = calculateGravityRelevanceScore(a, following.includes(authorA), interestA);
    const scoreB = calculateGravityRelevanceScore(b, following.includes(authorB), interestB);

    const dateA = 'date' in a ? new Date(a.date).getTime() : ('createdAt' in a ? new Date(a.createdAt).getTime() : 0);
    const dateB = 'date' in b ? new Date(b.date).getTime() : ('createdAt' in b ? new Date(b.createdAt).getTime() : 0);

    // 2. Apply sorting modes
    if (sortBy === 'Most Read' || sortBy === 'Views') {
      const viewsA = 'views' in a ? parseInt(String(a.views).replace(/[^0-9]/g, '')) : ('likes' in a ? a.likes * 10 : 0);
      const viewsB = 'views' in b ? parseInt(String(b.views).replace(/[^0-9]/g, '')) : ('likes' in b ? b.likes * 10 : 0);
      return viewsB - viewsA;
    }

    if (sortBy === 'Latest First') {
      return dateB - dateA;
    }

    // Default: Smart Relevance Sorting
    if (sortBy === 'Relevance') {
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();
      const query = searchQuery.toLowerCase();
      const searchBonusA = query && titleA.includes(query) ? 500 : 0;
      const searchBonusB = query && titleB.includes(query) ? 500 : 0;

      const totalA = scoreA + searchBonusA;
      const totalB = scoreB + searchBonusB;
      
      if (totalA !== totalB) {
        return totalB - totalA;
      }
      return dateB - dateA; // Date tie-breaker
    }

    return scoreB - scoreA;
  });

  const visibleFeed = sortedFeed.slice(0, visibleCount);

  // Save scroll position + auto-load more when reaching bottom of feed list
  useEffect(() => {
    const feedContainer = centerFeedRef.current;
    if (!feedContainer) return;

    const handleScroll = () => {
      sessionStorage.setItem('feed_scroll_pos', feedContainer.scrollTop.toString());

      const threshold = 220; // threshold of 220px from bottom for smooth seamless fetching
      const totalScrollHeight = feedContainer.scrollHeight;
      const currentScrollTop = feedContainer.scrollTop;
      const containerHeight = feedContainer.clientHeight;

      if (totalScrollHeight - currentScrollTop - containerHeight <= threshold) {
        if (!isNewBatchLoading && visibleCount < sortedFeed.length) {
          setIsNewBatchLoading(true);
          setTimeout(() => {
            setVisibleCount(prev => prev + 10);
            setIsNewBatchLoading(false);
          }, 650);
        }
      }
    };

    feedContainer.addEventListener('scroll', handleScroll);
    return () => feedContainer.removeEventListener('scroll', handleScroll);
  }, [isNewBatchLoading, visibleCount, sortedFeed.length]);

  const handlePostAction = (item: CombinedPost, fromMedia = false) => {
    if ((item as any).sharedPost || ('format' in item && item.format === 'micropost')) {
      if (fromMedia) {
        navigate(`/micro-post/${item.id}`);
      } else {
        setSelectedPostModal(item);
      }
    } else {
      navigate(`/article/${item.id}`);
    }
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleLike = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    postService.toggleLike(postId);
    setDisplayFeed(prev => prev.map(post =>
      post.id === postId ? { ...post } : post
    ));
  };

  const handleToggleDownvote = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    postService.toggleDownvote(postId);
    setDisplayFeed(prev => prev.map(post =>
      post.id === postId ? { ...post } : post
    ));
  };

  return (
    <div className="h-screen bg-surface flex flex-col overflow-hidden">
      <TopBar />
      <main className="mt-[70px] flex-1 flex overflow-hidden">
        <div 
          ref={mainContainerRef}
          className="flex-1 h-full flex flex-col lg:flex-row justify-between gap-6 lg:gap-10 relative w-full px-4 md:px-10 lg:px-10"
        >
          
          {/* Left Navigation Sidebar (FB Style) */}
          <aside 
            ref={leftSidebarRef}
            className={cn(
              "hidden lg:block shrink-0 h-full overflow-y-auto no-scrollbar pt-6 pb-20 transition-all duration-300 ease-in-out",
              isCollapsed ? "w-[80px]" : "w-[350px]"
            )}
          >
            <Sidebar />
          </aside>

          {/* Main Feed Content (Center) */}
          <div 
            ref={centerFeedRef}
            className="flex-1 max-w-[740px] mx-auto overflow-y-auto no-scrollbar pt-6 pb-20 space-y-6"
          >
            
            {/* Post Composer Box */}
            <FeedComposer user={user} navigate={navigate} onPostCreated={() => setRefreshKey(prev => prev + 1)} />

            {/* The Social Feed - adjusted margin */}
            <div
              className={cn(
                "space-y-5",
                viewMode === 'grid' && "grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6 space-y-0"
              )}
            >
              {(authLoading || isLoading) ? (
                <div className="space-y-5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <motion.div
                      key={`post-skeleton-${i}`}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        duration: 0.5, 
                        delay: 0.1 + i * 0.15, 
                        ease: [0.215, 0.61, 0.355, 1] 
                      }}
                    >
                      <PostSkeleton />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35 }}
                  className={cn(
                    "space-y-5",
                    viewMode === 'grid' && "grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6 space-y-0"
                  )}
                >
                  {visibleFeed.map((item, index) => (
                    <FeedItem 
                      key={item.id}
                      index={index}
                      item={item}
                      expandedPosts={expandedPosts}
                      toggleExpand={toggleExpand}
                      handlePostAction={handlePostAction}
                      handleToggleLike={handleToggleLike}
                      handleToggleDownvote={handleToggleDownvote}
                      viewMode={viewMode}
                      onShareSuccess={() => setRefreshKey(prev => prev + 1)}
                      onMenuHide={(post) => {
                        const updated = [...hiddenPostIds, post.id];
                        setHiddenPostIds(updated);
                        localStorage.setItem('eduwatch_hidden_posts', JSON.stringify(updated));
                        triggerToast("Post hidden successfully. You won't see it again.");
                      }}
                      onMenuReport={(post) => {
                        setReportingPost(post);
                        setReportReason('Spam & Self-Promotion');
                        setReportDetails('');
                      }}
                      onMenuEdit={(post) => {
                        navigate('/write-article', { state: { editPost: post } });
                      }}
                      onMenuDelete={(post) => {
                        setDeletingPostId(post.id);
                      }}
                      onMenuStats={(post) => {
                        setViewingStatsPost(post);
                      }}
                      onMenuPrivacyChange={async (post, privacy) => {
                        try {
                          await postService.updatePostPrivacy(post.id, privacy);
                          setDisplayFeed(prev => prev.map(p => p.id === post.id ? { ...p, privacy } : p));
                          triggerToast(`Post privacy updated to ${privacy}.`);
                        } catch (err) {
                          console.error("Failed to update privacy:", err);
                        }
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </div>

            {/* Infinite Scroll / Load More Status */}
            <div className="flex flex-col items-center justify-center py-8">
              {isNewBatchLoading ? (
                <div id="feed-loader" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-container border border-outline-variant/10 text-xs font-bold text-secondary animate-pulse">
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  <span>Loading more content...</span>
                </div>
              ) : visibleCount < sortedFeed.length ? (
                <button
                  id="btn-load-more"
                  onClick={handleLoadMore}
                  className="px-6 py-3 rounded-full bg-surface-container-low hover:bg-surface-container pointer border border-outline-variant/10 hover:border-outline-variant/30 text-xs font-bold text-on-surface hover:text-primary shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Loader2 className="h-3 w-3 text-secondary" />
                  <span>Load More Posts</span>
                </button>
              ) : (
                <div id="feed-caught-up" className="text-[10px] font-black tracking-widest text-[#22c55e]/70 uppercase py-4">
                  🎉 You are completely caught up!
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar (Filter Section) */}
          <aside 
            ref={rightSidebarRef}
            className="hidden xl:block w-[350px] shrink-0 h-full overflow-y-auto no-scrollbar pt-6 pb-20 transition-all duration-300 ease-in-out"
          >
            <RightSidebar 
              popularCreators={popularCreators}
              following={following}
              toggleFollow={toggleFollow}
              handlePostAction={handlePostAction}
              navigate={navigate}
            />
          </aside>
        </div>
      </main>

      <AnimatePresence>
        {selectedPostModal && (
          <PostModal 
            post={selectedPostModal}
            isOpen={!!selectedPostModal}
            onClose={() => setSelectedPostModal(null)}
            onUpdate={() => setDisplayFeed(prev => prev.map(p => p.id === selectedPostModal.id ? { ...p } : p))}
          />
        )}
      </AnimatePresence>

      {/* Delete Post Modal */}
      <AnimatePresence>
        {deletingPostId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 text-left"
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
                <h3 className="text-base font-black text-on-surface">Delete Post</h3>
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
                    // Instant optimistic removal from feed UI
                    setDisplayFeed(prev => prev.filter(p => p.id !== idToDelete));
                    triggerToast("Post deleted successfully.");
                    // Background deletion
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

      {/* View Statistics Modal */}
      {viewingStatsPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 text-left">
            <div className="p-4 border-b border-outline-variant/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-primary" />
                <h3 className="text-base font-black text-on-surface">Post Statistics</h3>
              </div>
              <button 
                onClick={() => setViewingStatsPost(null)}
                className="p-1.5 hover:bg-surface-container rounded-full transition-all text-secondary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container p-4 rounded-xl text-center space-y-1">
                  <span className="text-[10px] font-black uppercase text-secondary tracking-wider">Upvotes</span>
                  <p className="text-xl font-black text-on-surface">
                    {'upvotes' in viewingStatsPost ? (viewingStatsPost.upvotes || 0) : ('likes' in viewingStatsPost ? (viewingStatsPost.likes || 0) : 0)}
                  </p>
                </div>
                <div className="bg-surface-container p-4 rounded-xl text-center space-y-1">
                  <span className="text-[10px] font-black uppercase text-secondary tracking-wider">Comments</span>
                  <p className="text-xl font-black text-on-surface">
                    {(() => {
                      const localComments = postService.getComments(viewingStatsPost.id).length;
                      const extra = postService.getExtraInteractions(viewingStatsPost.id).comments || 0;
                      const base = 'comments' in viewingStatsPost ? (typeof viewingStatsPost.comments === 'number' ? viewingStatsPost.comments : 0) : 0;
                      return Math.max(localComments, extra, base);
                    })()}
                  </p>
                </div>
                <div className="bg-surface-container p-4 rounded-xl text-center space-y-1">
                  <span className="text-[10px] font-black uppercase text-secondary tracking-wider">Shares</span>
                  <p className="text-xl font-black text-on-surface">{(viewingStatsPost as any).shares || 0}</p>
                </div>
                <div className="bg-surface-container p-4 rounded-xl text-center space-y-1">
                  <span className="text-[10px] font-black uppercase text-secondary tracking-wider">Downvotes</span>
                  <p className="text-xl font-black text-on-surface">{(viewingStatsPost as any).downvotes || 0}</p>
                </div>
              </div>
              <div className="bg-surface-container-low p-4 rounded-xl text-xs text-secondary leading-relaxed font-semibold">
                These statistics reflect live interactions and engagements on this post from other users, synced in real-time.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Post Modal */}
      {reportingPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 p-6 space-y-4 text-left">
            <div className="flex items-center gap-3 text-red-500">
              <Flag className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black text-on-surface">Report Post</h3>
            </div>
            <p className="text-xs font-semibold text-secondary leading-normal">
              Help us keep our educational community safe and high-quality. Please select the primary reason for reporting this post:
            </p>
            
            <div className="space-y-2">
              {['Spam & Self-Promotion', 'Inappropriate Content', 'Harassment or Hate Speech', 'Misinformation', 'Copyright Violation', 'Other'].map((reason) => (
                <label 
                  key={reason} 
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-outline-variant/10 hover:bg-surface-container-low transition-all cursor-pointer text-xs font-bold text-on-surface"
                >
                  <input 
                    type="radio" 
                    name="reportReason" 
                    value={reason} 
                    checked={reportReason === reason} 
                    onChange={(e) => setReportReason(e.target.value)}
                    className="accent-primary"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-secondary">Optional: Additional Details</label>
              <textarea 
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide more context..."
                className="w-full text-xs font-bold text-on-surface bg-surface-container p-3 rounded-xl border border-outline-variant/10 outline-none focus:ring-1 focus:ring-primary h-20 resize-none placeholder:text-outline-variant/70"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setReportingPost(null)}
                className="px-4 py-2 rounded-xl font-bold text-xs text-secondary hover:bg-surface-container transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const updated = [...hiddenPostIds, reportingPost.id];
                  setHiddenPostIds(updated);
                  localStorage.setItem('eduwatch_hidden_posts', JSON.stringify(updated));
                  
                  try {
                    const reportsList = JSON.parse(localStorage.getItem('eduwatch_reported_logs') || '[]');
                    reportsList.push({
                      postId: reportingPost.id,
                      reason: reportReason,
                      details: reportDetails,
                      timestamp: new Date().toISOString()
                    });
                    localStorage.setItem('eduwatch_reported_logs', JSON.stringify(reportsList));
                  } catch (e) {
                    console.error(e);
                  }

                  setReportingPost(null);
                  triggerToast("Thank you for your report! This post has been reported and hidden from your feed.");
                }}
                className="px-5 py-2 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-all shadow-md shadow-red-500/10 cursor-pointer"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl shadow-2xl max-w-2xl w-full h-[90vh] max-h-[600px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-lowest">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setEditingPost(null)}
                  className="p-1 px-1.5 rounded-full hover:bg-outline-variant/10 text-secondary transition-all cursor-pointer"
                >
                  <X className="w-5 h-5 text-on-surface" />
                </button>
                <div className="h-6 w-[1px] bg-outline-variant/30" />
                <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded uppercase tracking-widest leading-none">
                  {(editingPost as any).format === 'article' ? 'Journal / Article' : 'Micro-post'}
                </span>
                <h3 className="font-manrope font-black text-sm text-on-surface hidden sm:block leading-none">
                  Edit Content
                </h3>
              </div>
              
              <button 
                onClick={async () => {
                  try {
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
                    setDisplayFeed(prev => prev.map(p => {
                      if (p.id === editingPost.id) {
                        return {
                          ...p,
                          ...updates,
                          description: editContent
                        };
                      }
                      return p;
                    }));
                    setEditingPost(null);
                    triggerToast("Post updated successfully.");
                  } catch (err) {
                    console.error("Failed to update post:", err);
                  }
                }}
                className="px-4 py-2 bg-primary text-white rounded-full font-extrabold text-xs shadow-md shadow-primary/15 hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
              {(editingPost as any).format === 'article' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-secondary tracking-wider">Title</label>
                  <input 
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-base font-black text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors p-3 rounded-xl border border-outline-variant/10 focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Draft title"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-secondary tracking-wider">Content Description</label>
                <textarea 
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-48 text-xs font-semibold text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors p-3 rounded-xl border border-outline-variant/10 focus:ring-1 focus:ring-primary outline-none resize-none"
                  placeholder="Write post content..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-secondary tracking-wider">Location</label>
                  <input 
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full text-xs font-bold text-on-surface bg-surface-container p-2.5 rounded-xl border border-outline-variant/10 outline-none"
                    placeholder="e.g. Harvard Library"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-secondary tracking-wider">Comments Setting</label>
                  <select
                    value={editCommentsEnabled ? 'enabled' : 'disabled'}
                    onChange={(e) => setEditCommentsEnabled(e.target.value === 'enabled')}
                    className="w-full text-xs font-bold text-on-surface bg-surface-container p-2.5 rounded-xl border border-outline-variant/10 outline-none cursor-pointer"
                  >
                    <option value="enabled">💬 Comments Allowed </option>
                    <option value="disabled">🚫 Comments Disabled </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-5 left-5 z-[1000] flex items-center gap-3 bg-surface-container-highest border border-outline-variant/20 p-4 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xs font-bold text-on-surface">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
