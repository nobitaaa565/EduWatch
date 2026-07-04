import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { Sidebar } from '../components/Sidebar';
import { 
  Search, 
  UserPlus, 
  UserCheck, 
  Users, 
  MapPin, 
  UserCircle,
  Zap,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronLeft,
  BarChart2,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useSocial, SocialUser } from '../lib/social';
import { useAuth } from '../lib/AuthContext';
import { useSidebar } from '../lib/SidebarContext';
import { feed, creators, calculatePopularityScore } from '../lib/feedData';

const sidebarOptions = [
  { id: 'suggestions', label: 'Suggestions', icon: Zap },
  { id: 'following', label: 'Following', icon: UserCheck },
  { id: 'followers', label: 'All Followers', icon: Users },
  { id: 'requests', label: 'Follow Requests', icon: UserPlus },
];

const sortOptions = [
  { id: 'recent', label: 'Recent First', icon: Clock },
  { id: 'popularity', label: 'Popularity', icon: BarChart2 },
];

export default function FindPeople() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const { isCollapsed, setCollapsed } = useSidebar();

  const leftSidebarRef = useRef<HTMLElement>(null);
  const filterSidebarRef = useRef<HTMLElement>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleGlobalWheel = (e: WheelEvent) => {
      const target = e.target as Node;
      const isOverLeft = leftSidebarRef.current?.contains(target);
      const isOverFilter = filterSidebarRef.current?.contains(target);
      const isOverMain = mainScrollRef.current?.contains(target);

      if (!isOverLeft && !isOverFilter && !isOverMain && pageContainerRef.current?.contains(target)) {
        if (mainScrollRef.current) {
          mainScrollRef.current.scrollTop += e.deltaY;
        }
      }
    };

    window.addEventListener('wheel', handleGlobalWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleGlobalWheel);
  }, []);

  const { 
    registry, 
    following, 
    followers, 
    newFollowers, 
    incomingRequests,
    pendingRequestsSent,
    toggleFollow, 
    clearNewFollowers,
    getMutualFollows,
    acceptFollowRequest,
    declineFollowRequest,
    removeFollower,
    checkRequireFollowApproval
  } = useSocial();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'suggestions');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [displayUsernames, setDisplayUsernames] = useState<string[]>([]);

  const [interactedUsers, setInteractedUsers] = useState<Record<string, 'following' | 'requested' | 'unfollowed' | 'accepted' | 'declined' | 'removed'>>({});

  // Reset local state overrides on tab change or search queries to let lists properly settle
  useEffect(() => {
    setInteractedUsers({});
  }, [activeTab, searchQuery]);

  // Automatically collapse sidebar on mount to provide more space for discovery
  useEffect(() => {
    setCollapsed(true);
  }, []);

  // Handle URL parameter sync
  useEffect(() => {
    const tab = searchParams.get('tab');
    const sort = searchParams.get('sort');
    if (tab && tab !== activeTab) setActiveTab(tab);
    if (sort && sort !== sortBy) setSortBy(sort);
  }, [searchParams]);

  // Calculation of active list on tab/sort/search/registry updates only (relationship changes won't cause moves)
  useEffect(() => {
    if (registry.length === 0) return;

    // 1. Start with registry
    let list = [...registry];

    // Merge creators from feedData into list if they don't exist
    (creators || []).forEach(c => {
      if (!list.find(u => u.name === c.name)) {
        list.push({
          id: c.id,
          username: c.name.toLowerCase().replace(/\s/g, '_'),
          name: c.name,
          role: c.role,
          img: c.avatar,
          bio: 'Recognized industry expert and top creator in academic and technical journals.',
          location: 'Global',
          followersCount: c.followers,
          likesCount: c.likes,
          sharesCount: c.shares,
          commentsCount: c.comments,
          reachCount: c.reach,
          joinedAt: Date.now() - (Math.random() * 1000000000) // Mock join date in the past
        } as any);
      } else {
        // Enforce stats for existing registry users if they match creators
        const existing = list.find(u => u.name === c.name);
        if (existing) {
          Object.assign(existing, {
            followersCount: c.followers,
            likesCount: c.likes,
            sharesCount: c.shares,
            commentsCount: c.comments,
            reachCount: c.reach
          });
        }
      }
    });

    // 2. Remove current user from lists
    list = list.filter(p => p.username !== currentUser?.username);

    // 3. Apply Tab Filtering (snapshot state when entering tab / query changes)
    if (activeTab === 'following') {
      list = list.filter(p => following.includes(p.username));
    } else if (activeTab === 'followers') {
      list = list.filter(p => followers.includes(p.username));
    } else if (activeTab === 'requests') {
      list = list.filter(p => incomingRequests.includes(p.username));
    } else if (activeTab === 'suggestions') {
      // Suggest everyone who is not currently followed (or requested/pending)
      list = list.filter(p => !following.includes(p.username) && !pendingRequestsSent.includes(p.username));
    }

    // 4. Sort the list
    if (activeTab === 'followers') {
      // Show new followers at the top of the All Followers section
      list.sort((a, b) => {
        const isNewA = newFollowers.includes(a.username) ? 1 : 0;
        const isNewB = newFollowers.includes(b.username) ? 1 : 0;
        if (isNewA !== isNewB) {
          return isNewB - isNewA;
        }
        if (sortBy === 'popularity') {
          const mutualsA = getMutualFollows(a.username).length;
          const creatorA = creators.find(c => c.name === a.name);
          const popA = creatorA ? calculatePopularityScore(creatorA) : (mutualsA * 10);

          const mutualsB = getMutualFollows(b.username).length;
          const creatorB = creators.find(c => c.name === b.name);
          const popB = creatorB ? calculatePopularityScore(creatorB) : (mutualsB * 10);
          return popB - popA;
        }
        return ((b as any).joinedAt || 0) - ((a as any).joinedAt || 0);
      });
    } else {
      list = list.map(p => {
        const mutuals = getMutualFollows(p.username);
        const creatorData = creators.find(c => c.name === p.name);
        const popScore = creatorData ? calculatePopularityScore(creatorData) : (mutuals.length * 10);
        return {
          ...p,
          mutualCount: mutuals.length,
          popularityScore: popScore,
          followersCount: (p as any).followersCount || 1200
        };
      });

      if (sortBy === 'popularity') {
        list.sort((a, b) => (b as any).popularityScore - (a as any).popularityScore);
      } else if (sortBy === 'recent') {
        if (activeTab === 'following') {
          list.sort((a, b) => {
            const indexA = following.indexOf(a.username);
            const indexB = following.indexOf(b.username);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          });
        } else {
          list.sort((a, b) => ((b as any).joinedAt || 0) - ((a as any).joinedAt || 0));
        }
      }
    }

    // 5. Search Filter
    if (searchQuery.trim()) {
      list = list.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.role.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setDisplayUsernames(list.map(p => p.username));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchQuery, sortBy, registry.length]);

  const displayPeople = useMemo(() => {
    return displayUsernames.map(username => {
      let p = registry.find(r => r.username === username);
      if (!p) {
        // Find in creators
        const c = (creators || []).find(creator => creator.name.toLowerCase().replace(/\s/g, '_') === username);
        if (c) {
          p = {
            id: c.id,
            username: c.name.toLowerCase().replace(/\s/g, '_'),
            name: c.name,
            role: c.role,
            img: c.avatar,
            bio: 'Recognized industry expert and top creator in academic and technical journals.',
            location: 'Global',
            followersCount: c.followers,
            likesCount: c.likes,
            sharesCount: c.shares,
            commentsCount: c.comments,
            reachCount: c.reach,
            joinedAt: Date.now()
          } as any;
        }
      }

      if (!p) return null;

      const mutuals = getMutualFollows(p.username);
      return {
        ...p,
        mutualCount: mutuals.length,
        followersCount: (p as any).followersCount || 1200
      };
    }).filter(Boolean) as any[];
  }, [displayUsernames, registry, getMutualFollows]);

  return (
    <div className="h-screen bg-surface overflow-hidden">
      <TopBar />
      <main className="mt-[70px] h-[calc(100vh-70px)] overflow-hidden">
        <div 
          ref={pageContainerRef}
          className="flex flex-col lg:flex-row justify-between gap-6 lg:gap-10 relative w-full h-full px-4 md:px-10 lg:px-10 transition-all duration-300 ease-in-out"
        >
          
          {/* Global Sidebar - Matches Explore Layout */}
          <aside 
            ref={leftSidebarRef}
            className={cn(
            "hidden lg:block shrink-0 h-full overflow-y-auto no-scrollbar pt-6 pb-20 transition-all duration-300 ease-in-out",
            isCollapsed ? "w-[80px]" : "w-[350px]"
          )}>
            <Sidebar />
          </aside>
  
          {/* Content Area - Split into sub-columns */}
          <div className="flex-1 h-full overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 h-full w-full">
              
              {/* Left Column - People Filters */}
              <aside 
                ref={filterSidebarRef}
                className="hidden xl:block w-[260px] shrink-0 h-full overflow-y-auto no-scrollbar pt-6 pb-20"
              >
                <section className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/5">
                  <div className="flex items-center gap-3 mb-5 px-1">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-secondary">Directories</h3>
                  </div>
                  <div className="space-y-1">
                    {sidebarOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setActiveTab(option.id);
                          setSearchParams({ tab: option.id, sort: sortBy });
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group text-left border",
                          activeTab === option.id 
                            ? "bg-primary/5 text-primary border-primary/20" 
                            : "bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/5 text-secondary hover:text-on-surface"
                        )}
                      >
                        <option.icon className={cn("w-4 h-4 transition-transform duration-300", activeTab === option.id ? "text-primary" : "group-hover:text-primary")} />
                        <span className={cn("text-[13px] tracking-tight", activeTab === option.id ? "font-black" : "font-bold")}>{option.label}</span>
                        {option.id === 'requests' && incomingRequests.length > 0 && (
                            <span className="ml-auto bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full ring-2 ring-amber-500/15">
                                {incomingRequests.length}
                            </span>
                        )}
                        {option.id === 'followers' && newFollowers.length > 0 && (
                            <span className="ml-auto bg-tertiary text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-tertiary/10">
                                {newFollowers.length} new
                            </span>
                        )}
                      </button>
                    ))}
                  </div>
                </section>
              </aside>

              {/* Main Listing Area */}
              <div 
                ref={mainScrollRef}
                className="flex-1 min-w-0 h-full overflow-y-auto no-scrollbar pb-40"
              >
                <div className="max-w-[1240px] mx-auto pt-6">
                  
                  {/* Enhanced Header Controls (Sticky) */}
                  <div className="sticky -top-[1px] z-20 bg-surface/95 backdrop-blur-md pt-2 pb-6 mb-12 flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-outline-variant/5 shadow-[0_-8px_0_0px_var(--color-surface)]">
                    <div className="relative w-full sm:max-w-[360px] group">
                      <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-outline-variant group-focus-within:text-primary transition-colors" />
                      <input 
                        type="text"
                        placeholder="Search collective expertise..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="relative w-full bg-surface-container-lowest border border-outline-variant/10 rounded-2xl pl-12 pr-5 py-4 text-[14px] focus:ring-0 focus:border-primary/30 transition-all font-medium ambient-shadow"
                      />
                    </div>
                    
                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <span className="text-[11px] font-black text-outline-variant uppercase tracking-[0.2em] whitespace-nowrap">Sort By</span>
                      <div className="relative">
                        <button 
                          onClick={() => setIsSortOpen(!isSortOpen)}
                          className="bg-surface-container-lowest px-6 py-4 rounded-2xl border border-outline-variant/10 text-[11px] font-black text-on-surface flex items-center gap-4 hover:bg-surface-container transition-all min-w-[180px] justify-between uppercase tracking-tight ambient-shadow"
                        >
                          <div className="flex items-center gap-3">
                            {sortOptions.find(o => o.id === sortBy)?.icon && React.createElement(sortOptions.find(o => o.id === sortBy)!.icon, { className: "w-4 h-4 text-primary" })}
                            {sortOptions.find(o => o.id === sortBy)?.label}
                          </div>
                          <ChevronDown className={cn("w-4 h-4 transition-transform duration-500 text-outline-variant", isSortOpen && "rotate-180 text-primary")} />
                        </button>

                      <AnimatePresence>
                        {isSortOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-3 w-[200px] bg-surface-container-lowest rounded-2xl ambient-shadow border border-outline-variant/10 p-2.5 z-50 overflow-hidden"
                          >
                            {sortOptions.map(opt => (
                              <button
                                key={opt.id}
                                onClick={() => {
                                  setSortBy(opt.id);
                                  setSearchParams({ tab: activeTab, sort: opt.id });
                                  setIsSortOpen(false);
                                }}
                                className={cn(
                                  "w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all",
                                  sortBy === opt.id 
                                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                                    : "text-secondary hover:bg-surface-container-low hover:text-on-surface"
                                )}
                              >
                                <opt.icon className={cn("w-4 h-4", sortBy === opt.id ? "text-white" : "text-outline-variant")} />
                                {opt.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {activeTab === 'followers' && newFollowers.length > 0 && (
                  <div className="mb-6 bg-primary/5 border border-primary/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black text-on-surface">You have {newFollowers.length} new follower{newFollowers.length > 1 ? 's' : ''}!</p>
                        <p className="text-[10px] text-secondary font-bold">They are highlighted in purple with a badge at the top of your list.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => clearNewFollowers()}
                      className="text-[10px] px-3.5 py-2 rounded-xl bg-primary text-white font-black uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 cursor-pointer transition-all duration-200"
                    >
                      Dismiss highlights
                    </button>
                  </div>
                )}

                {/* People Grid - Optimized Responsive Columns */}
                {displayPeople.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                    {displayPeople.map((person) => {
                      const requiresApproval = checkRequireFollowApproval(person.username);
                      const isCurrentlyFollowing = following.includes(person.username);
                      const isCurrentlyPending = pendingRequestsSent.includes(person.username);
                      const isCurrentlyFollower = followers.includes(person.username);
                      const isCurrentlyIncomingRequest = incomingRequests.includes(person.username);

                      const localInteractionState = interactedUsers[person.username];

                      const renderActionButtons = () => {
                        if (localInteractionState === 'accepted') {
                          return (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2 }}
                              className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl py-3 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>Request Accepted</span>
                            </motion.div>
                          );
                        }

                        if (localInteractionState === 'declined') {
                          return (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2 }}
                              className="w-full bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl py-3 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                            >
                              <span>Request Deleted</span>
                            </motion.div>
                          );
                        }

                        if (localInteractionState === 'removed') {
                          return (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2 }}
                              className="w-full bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl py-3 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                            >
                              <span>Follower Removed</span>
                            </motion.div>
                          );
                        }

                        if (activeTab === 'requests' && isCurrentlyIncomingRequest && !localInteractionState) {
                          return (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                              className="flex gap-2.5 w-full"
                            >
                              <button 
                                onClick={() => {
                                  acceptFollowRequest(person.username);
                                  setInteractedUsers(prev => ({ ...prev, [person.username]: 'accepted' }));
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-primary text-white border border-primary text-xs font-black uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 cursor-pointer transition-transform duration-200"
                              >
                                Accept
                              </button>
                              <button 
                                onClick={() => {
                                  declineFollowRequest(person.username);
                                  setInteractedUsers(prev => ({ ...prev, [person.username]: 'declined' }));
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-surface-container-high text-secondary border border-outline-variant/10 text-xs font-black uppercase tracking-wider hover:bg-surface-container hover:text-on-surface active:scale-95 cursor-pointer transition-colors duration-200"
                              >
                                Delete
                              </button>
                            </motion.div>
                          );
                        }

                        const showDeleteFollowerOption = (activeTab === 'followers' || isCurrentlyFollower) && !isCurrentlyFollowing;

                        // Directly read actual hook states as source of truth for the primary button representation
                        const isFollowingBtn = isCurrentlyFollowing;
                        const isRequestedBtn = isCurrentlyPending;

                        const handleButtonClick = () => {
                          if (isFollowingBtn || isRequestedBtn) {
                            toggleFollow(person.username);
                            setInteractedUsers(prev => ({ ...prev, [person.username]: 'unfollowed' }));
                          } else {
                            toggleFollow(person.username);
                            if (requiresApproval) {
                              setInteractedUsers(prev => ({ ...prev, [person.username]: 'requested' }));
                            } else {
                              setInteractedUsers(prev => ({ ...prev, [person.username]: 'following' }));
                            }
                          }
                        };

                        return (
                          <div className="flex flex-col gap-2.5 w-full">
                            <button 
                              onClick={handleButtonClick}
                              className={cn(
                                "w-full py-3 rounded-xl transition-all duration-300 shadow-md font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 cursor-pointer border overflow-hidden relative",
                                isFollowingBtn
                                  ? "bg-surface-container-high text-secondary border-outline-variant/10 hover:bg-surface-container"
                                  : isRequestedBtn
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/15"
                                  : "bg-primary text-white border-primary shadow-lg shadow-primary/20 hover:brightness-110"
                              )}
                            >
                              <AnimatePresence mode="wait" initial={false}>
                                {isFollowingBtn ? (
                                  <motion.div
                                    key="following"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex items-center justify-center gap-2"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                    <span>Following</span>
                                  </motion.div>
                                ) : isRequestedBtn ? (
                                  <motion.div
                                    key="requested"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex items-center justify-center gap-2"
                                  >
                                    <Clock className="w-4 h-4" />
                                    <span>Requested</span>
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="follow"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex items-center justify-center gap-2"
                                  >
                                    <UserPlus className="w-4 h-4" />
                                    <span>Follow</span>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </button>

                            {showDeleteFollowerOption && (
                              <button 
                                onClick={() => {
                                  removeFollower(person.username);
                                  setInteractedUsers(prev => ({ ...prev, [person.username]: 'removed' }));
                                }}
                                className="w-full py-2 rounded-xl bg-transparent text-secondary border border-outline-variant/15 text-[10px] font-black uppercase tracking-wider hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/20 active:scale-95 cursor-pointer transition-all duration-300"
                              >
                                Delete Follower
                              </button>
                            )}
                          </div>
                        );
                      };

                      const isNewFollower = activeTab === 'followers' && newFollowers.includes(person.username);

                      return (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={person.username} 
                        className={cn(
                          "bg-surface-container-lowest rounded-[28px] overflow-hidden ambient-shadow border group flex flex-col hover:shadow-2xl transition-all duration-300 max-w-[325px] mx-auto w-full p-5 text-center justify-between min-h-[300px]",
                          isNewFollower 
                            ? "border-primary/50 shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.12)] bg-primary/[0.02]" 
                            : "border-outline-variant/5 hover:border-primary/20 hover:shadow-primary/5"
                        )}
                      >
                        <div className="flex flex-col items-center">
                          {/* Profile Picture */}
                          <div 
                            className={cn(
                              "w-28 h-28 rounded-[32px] overflow-hidden border-4 bg-surface hover:scale-105 transition-all duration-500 shadow-md cursor-pointer mb-3 transition-colors duration-300",
                              isNewFollower 
                                ? "border-primary/45 ring-2 ring-primary/25" 
                                : requiresApproval 
                                ? "border-amber-500/60 ring-2 ring-amber-500/20" 
                                : "border-surface-container"
                            )}
                            onClick={() => navigate(`/profile/${person.username}`)}
                            title={requiresApproval ? "Profile is private (Requires follow approval)" : undefined}
                          >
                            <img 
                              src={person.img} 
                              alt={person.name} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer" 
                            />
                          </div>
                          
                          {/* Name with custom request requirement badge */}
                          <div className="flex items-center justify-center gap-1.5 max-w-full">
                            {isNewFollower && (
                              <span className="bg-primary text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md tracking-wider shadow-sm animate-pulse shrink-0">New</span>
                            )}
                            <h3 
                              className="text-base font-black font-manrope text-on-surface hover:text-primary transition-colors cursor-pointer truncate tracking-tight"
                              onClick={() => navigate(`/profile/${person.username}`)}
                            >
                              {person.name}
                            </h3>
                          </div>
                          
                          {/* Designation */}
                          <p className="text-[10px] font-black text-primary tracking-[0.12em] uppercase truncate mt-0.5 max-w-full">
                            {person.role}
                          </p>
                        </div>

                        {/* Stats: Followers & Mutuals */}
                        <div className="flex items-center justify-around bg-surface-container-low/10 py-2.5 px-4 rounded-2xl border border-outline-variant/15 my-3">
                          <div className="text-center px-2">
                            <p className="text-sm font-black text-on-surface">
                              {(person as any).followersCount >= 1000 
                                ? `${((person as any).followersCount / 1000).toFixed(1)}k` 
                                : (person as any).followersCount}
                            </p>
                            <p className="text-[8px] font-black text-outline-variant uppercase tracking-[0.15em]">Followers</p>
                          </div>
                          <div className="h-5 w-px bg-outline-variant/20" />
                          <div className="text-center px-2">
                            <p className="text-sm font-black text-on-surface">
                              {(person as any).mutualCount || 0}
                            </p>
                            <p className="text-[8px] font-black text-outline-variant uppercase tracking-[0.15em]">Mutuals</p>
                          </div>
                        </div>

                        {/* Action buttons render */}
                        {renderActionButtons()}
                      </motion.div>
                    );
                    })}
                  </div>
                ) : (
                  <div className="bg-surface-container-lowest p-20 rounded-[48px] text-center border border-dashed border-outline-variant/20 ambient-shadow">
                    <div className="w-20 h-20 rounded-[32px] bg-surface-container-low flex items-center justify-center mx-auto mb-6">
                      <Users className="w-10 h-10 text-outline-variant/50" />
                    </div>
                    <h3 className="text-2xl font-black text-on-surface mb-3 tracking-tight">Expand your horizon</h3>
                    <p className="text-sm text-secondary max-w-[320px] mx-auto font-medium leading-relaxed">
                      We couldn't find matches for this query. Try exploring broader interests or different directories.
                    </p>
                  </div>
                )}
                </div>
              </div>

              {/* Right Column - Removed Popular Creators Side Panel as requested */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
