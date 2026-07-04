import React, { useState } from 'react';
import { Search, Bell, Settings, Moon, Sun, Edit3, Compass, Users, LogOut, ArrowRight, Menu, X, Globe, Trophy, LayoutGrid, UserPlus, Heart, Bookmark, FileText, BarChart2, UserCircle, Sparkles, PlusCircle, Clock, Video } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../lib/ThemeContext';
import { useAuth } from '../lib/AuthContext';
import { cn } from '../lib/utils';
import { NotificationDropdown } from './NotificationDropdown';
import { NotificationSlider } from './NotificationSlider';
import { feed, creators } from '../lib/feedData';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect } from 'react';

const navItems = [
  { icon: Compass, label: 'Feed', path: '/feed' },
  { icon: Users, label: 'Community', path: '/community' },
  { icon: Search, label: 'Find People', path: '/find-people' },
];

export function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [showResults, setShowResults] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isSearchHovered, setIsSearchHovered] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        setRecentSearches([]);
      }
    }
  }, []);

  const addToRecentSearches = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 5);
      localStorage.setItem('recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const isSearchExpanded = isSearchHovered || isSearchFocused || searchQuery.trim().length > 0;

  const navigationItems = [
    { icon: Globe, label: 'Feed', path: '/feed', active: location.pathname === '/feed' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard', active: location.pathname === '/leaderboard' },
    { icon: LayoutGrid, label: 'My Communities', path: '/community?tab=my', active: location.pathname === '/community' && searchParams.get('tab') === 'my' },
    { icon: UserPlus, label: 'Find People', path: '/find-people', active: location.pathname === '/find-people' && !searchParams.get('tab') },
  ];

  const personalItems = [
    { icon: Bookmark, label: 'Bookmarks', path: '/bookmarks', active: location.pathname === '/bookmarks' },
    { icon: FileText, label: 'Drafts', path: '/drafts', active: location.pathname === '/drafts' },
    { icon: BarChart2, label: 'Analytics', path: '/profile?tab=analytics', active: searchParams.get('tab') === 'analytics' },
  ];

  const profileDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  const queryParam = searchParams.get('q');
  useEffect(() => {
    if (queryParam) {
      setSearchQuery(queryParam);
    }
  }, [queryParam]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const filteredArticles = searchQuery.trim() 
    ? feed.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 3)
    : [];

  const filteredCreators = searchQuery.trim()
    ? creators.filter(creator => 
        creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        creator.role.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 2)
    : [];

  const handleSearch = (e?: React.FormEvent | React.MouseEvent, overrideQuery?: string) => {
    e?.preventDefault();
    const query = (overrideQuery !== undefined ? overrideQuery : searchQuery).trim();
    if (query) {
      addToRecentSearches(query);
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setShowResults(false);
      setIsSearchFocused(false);
    } else {
      navigate('/search');
      setShowResults(false);
      setIsSearchFocused(false);
    }
  };

  const handleFilterClick = (categoryName: string) => {
    const query = searchQuery.trim();
    if (query) {
      addToRecentSearches(query);
    }
    navigate(`/search?q=${encodeURIComponent(query)}&category=${categoryName}`);
    setShowResults(false);
    setIsSearchFocused(false);
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (location.pathname === '/feed') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('refresh-page-content', { detail: { path: '/feed' } }));
    }
  };

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-[20px] border-b border-outline-variant/5 transition-all duration-300 ease-in-out flex flex-col"
      )}
    >
      {/* Top Row */}
      <div className="h-[70px] w-full px-6 md:px-10 flex justify-between items-center border-b border-outline-variant/5 relative">
        <div className="flex items-center gap-4 sm:gap-8 z-10">
          {/* Mobile Sidebar Toggle Button */}
          <button 
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="lg:hidden p-2 -ml-2 rounded-xl text-on-surface hover:bg-surface-container-high transition-colors active:scale-95"
            aria-label="Toggle mobile navigation"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/feed" onClick={handleLogoClick} className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <Edit3 className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <h2 className="font-manrope font-black text-on-surface leading-tight text-base tracking-tighter">EduWatch</h2>
              <p className="text-[9px] uppercase tracking-[0.2em] text-secondary font-bold">Educational Hub</p>
            </div>
          </Link>
        </div>

        {/* Center portion: perfectly centered, interactive, animated search bar with pop animation */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center z-20">
          <form onSubmit={handleSearch} className="relative">
            <motion.div
              initial={false}
              animate={{
                width: isSearchExpanded ? 320 : 40,
                scale: isSearchHovered ? 1.05 : 1,
              }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 18,
                mass: 0.8
              }}
              onMouseEnter={() => setIsSearchHovered(true)}
              onMouseLeave={() => setIsSearchHovered(false)}
              onClick={() => {
                searchInputRef.current?.focus();
              }}
              className={cn(
                "flex items-center h-10 rounded-full cursor-pointer relative overflow-hidden border transition-colors duration-300 ease-out",
                isSearchExpanded 
                  ? "bg-surface-container-lowest border-primary/30 shadow-md shadow-primary/5 text-on-surface ring-2 ring-primary/30" 
                  : "bg-gradient-to-r from-primary via-primary/75 to-primary-container text-white border-transparent shadow-lg shadow-primary/35 hover:brightness-110 ring-2 ring-primary/20 animate-gradient"
              )}
            >
              {!isSearchExpanded && (
                <div className="absolute inset-0 w-full h-full overflow-hidden rounded-full pointer-events-none z-10">
                  <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shine" />
                </div>
              )}
              <div className="flex items-center justify-center shrink-0 w-10 h-full">
                <Search className={cn("w-4 h-4 transition-colors duration-300", isSearchExpanded ? "text-secondary" : "text-white")} />
              </div>
              <motion.input 
                ref={searchInputRef}
                className={cn(
                  "bg-transparent border-none focus:ring-0 focus:outline-none focus-visible:outline-none text-[13px] placeholder:text-outline-variant font-medium min-w-0 transition-all duration-300",
                  isSearchExpanded ? "w-full ml-1 pr-5 pb-0.5" : "w-0 p-0 m-0 opacity-0 pointer-events-none"
                )}
                placeholder="Search journals, authors, or topics..." 
                type="text" 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => {
                  setIsSearchFocused(true);
                  setShowResults(true);
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setIsSearchFocused(false);
                  }, 220);
                }}
                animate={{
                  opacity: isSearchExpanded ? 1 : 0,
                  x: isSearchExpanded ? 0 : -10,
                  pointerEvents: isSearchExpanded ? "auto" : "none"
                }}
                transition={{ duration: 0.2 }}
              />
              <button type="submit" className="hidden" aria-hidden="true" />
            </motion.div>

            <AnimatePresence>
              {showResults && (isSearchFocused || searchQuery.trim()) && (
                <>
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest border border-outline-variant/10 rounded-xl shadow-2xl overflow-hidden z-[60] w-[320px]"
                  >
                    <div className="p-2 max-h-[420px] overflow-y-auto no-scrollbar">
                      
                      {/* 1. Quick Filters Section */}
                      <div className="mb-2 pt-1">
                        <div className="px-3 py-1 text-[9px] font-black text-secondary tracking-widest uppercase mb-1.5">
                          Quick Filters
                        </div>
                        <div className="flex flex-wrap gap-1.5 px-3">
                          <button
                            type="button"
                            onMouseDown={() => {
                              handleFilterClick('Posts');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold rounded-full transition-colors cursor-pointer"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Articles</span>
                          </button>
                          <button
                            type="button"
                            onMouseDown={() => {
                              handleFilterClick('Media');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold rounded-full transition-colors cursor-pointer"
                          >
                            <Video className="w-3 h-3" />
                            <span>Videos</span>
                          </button>
                          <button
                            type="button"
                            onMouseDown={() => {
                              handleFilterClick('Communities');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold rounded-full transition-colors cursor-pointer"
                          >
                            <Users className="w-3 h-3" />
                            <span>Community</span>
                          </button>
                        </div>
                      </div>

                      {/* Divider separator */}
                      <div className="h-px bg-outline-variant/5 my-2 mx-3" />

                      {/* 2. Recent Searches (if query is empty) */}
                      {!searchQuery.trim() ? (
                        <div>
                          <div className="px-3 py-1 text-[9px] font-black text-secondary tracking-widest uppercase mb-1.5">
                            Recent Searches
                          </div>
                          {recentSearches.length > 0 ? (
                            <div className="space-y-0.5">
                              {recentSearches.map((term, i) => (
                                <div
                                  key={term + i}
                                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-surface-container rounded-lg group transition-colors"
                                >
                                  <button
                                    type="button"
                                    onMouseDown={() => {
                                      setSearchQuery(term);
                                      handleSearch(undefined, term);
                                    }}
                                    className="flex-1 flex items-center gap-2 text-left text-[11px] text-on-surface font-medium cursor-pointer"
                                  >
                                    <Clock className="w-3.5 h-3.5 text-secondary group-hover:text-primary transition-colors shrink-0" />
                                    <span className="truncate group-hover:text-primary transition-colors">{term}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      setRecentSearches(prev => {
                                        const updated = prev.filter(item => item !== term);
                                        localStorage.setItem('recent_searches', JSON.stringify(updated));
                                        return updated;
                                      });
                                    }}
                                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-outline-variant/20 transition-all cursor-pointer"
                                  >
                                    <X className="w-3 h-3 text-secondary" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="px-3 py-4 text-center">
                              <p className="text-[10px] text-secondary italic">No recent searches</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        // 3. Search matched options
                        <>
                          {/* Articles Section */}
                          {filteredArticles.length > 0 && (
                            <div className="mb-2">
                              <div className="px-3 py-1.5 text-[9px] font-black text-secondary uppercase tracking-widest border-b border-outline-variant/5 mb-1">
                                Matching Articles
                              </div>
                              {filteredArticles.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onMouseDown={() => {
                                    addToRecentSearches(searchQuery);
                                    navigate(`/article/${item.id}`);
                                    setShowResults(false);
                                    setIsSearchFocused(false);
                                  }}
                                  className="w-full flex items-center gap-3 p-2 hover:bg-surface-container rounded-lg transition-colors text-left group cursor-pointer"
                                >
                                  <div className="w-8 h-8 rounded overflow-hidden shrink-0">
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-[11px] font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">{item.title}</h4>
                                    <p className="text-[9px] text-secondary">{item.author}</p>
                                  </div>
                                  <ArrowRight className="w-3 h-3 text-outline-variant group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Creators Section */}
                          {filteredCreators.length > 0 && (
                            <div className="mb-2">
                              <div className="px-3 py-1.5 text-[9px] font-black text-secondary uppercase tracking-widest border-b border-outline-variant/5 mb-1">
                                Matching People
                              </div>
                              {filteredCreators.map((creator) => (
                                <button
                                  key={creator.id}
                                  type="button"
                                  onMouseDown={() => {
                                    addToRecentSearches(searchQuery);
                                    navigate(`/profile/${creator.name.toLowerCase().replace(/\s+/g, '_')}`);
                                    setShowResults(false);
                                    setIsSearchFocused(false);
                                  }}
                                  className="w-full flex items-center gap-3 p-2 hover:bg-surface-container rounded-lg transition-colors text-left group cursor-pointer"
                                >
                                  <div className="w-8 h-8 rounded-full bg-surface-container overflow-hidden shrink-0 border border-outline-variant/10">
                                    <img src={creator.avatar} alt={creator.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-[11px] font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">{creator.name}</h4>
                                    <p className="text-[9px] text-secondary">{creator.role}</p>
                                  </div>
                                  <Users className="w-3 h-3 text-outline-variant group-hover:text-primary transition-all" />
                                </button>
                              ))}
                            </div>
                          )}

                          {filteredArticles.length === 0 && filteredCreators.length === 0 && (
                            <div className="px-3 py-4 text-center">
                              <p className="text-[10px] text-secondary italic">No matching results found</p>
                            </div>
                          )}
                          
                          <button
                            type="button"
                            onMouseDown={() => {
                              handleSearch();
                            }}
                            className="w-full p-2 text-[10px] font-black text-primary hover:bg-primary/5 transition-colors border-t border-outline-variant/5 flex items-center justify-center gap-2 mt-1 cursor-pointer"
                          >
                            View all results in search list <PlusCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                  <div 
                    className="fixed inset-0 z-[55]" 
                    onMouseDown={() => {
                      setShowResults(false);
                      setIsSearchFocused(false);
                    }}
                  />
                </>
              )}
            </AnimatePresence>
          </form>
        </div>

        <div className="flex items-center gap-4 z-10">
          <Link 
            to="/write-article"
            className="bg-primary text-white px-4 py-2 rounded-lg font-manrope font-bold text-[11px] uppercase tracking-widest shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-2 mr-2"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="inline-flex"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current text-white" />
            </motion.div>
            <span className="hidden sm:inline">Share Insight</span>
          </Link>

          <button 
            onClick={toggleTheme}
            className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-surface-container transition-colors"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-on-surface" />
            ) : (
              <Sun className="w-4 h-4 text-on-surface" />
            )}
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-surface-container transition-colors relative"
            >
              <Bell className="w-4 h-4 text-on-surface" />
              {/* Only show dot if there are unread notifications - currently none */}
              {false && <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 bg-tertiary rounded-full border border-surface"></span>}
            </button>
            {showNotifications && (
              <NotificationDropdown 
                onClose={() => setShowNotifications(false)} 
                onViewAll={() => { setShowNotifications(false); setShowSlider(true); }} 
              />
            )}
          </div>
          <div 
            ref={profileDropdownRef}
            className="relative"
          >
            {authLoading ? (
              <div className="h-10 w-10 rounded-md bg-outline-variant/15 animate-pulse border border-outline-variant/10 shrink-0" />
            ) : (
              <button 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="h-10 w-10 rounded-md overflow-hidden border border-outline-variant/20 hover:border-primary/50 transition-colors bg-surface-container flex items-center justify-center block cursor-pointer"
                aria-label="User profile menu"
              >
                {user?.profileImage ? (
                  <img 
                    alt="User profile" 
                    className="w-full h-full object-cover" 
                    src={user.profileImage} 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Users className="w-5 h-5 text-secondary" />
                )}
              </button>
            )}

            <AnimatePresence>
              {showProfileDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full pt-2 z-[60] w-48"
                >
                  <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl shadow-2xl overflow-hidden p-1.5 flex flex-col gap-0.5">
                    <Link 
                      to="/profile"
                      onClick={() => setShowProfileDropdown(false)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[12px] font-semibold text-on-surface hover:bg-primary/5 hover:text-primary transition-colors group"
                    >
                      <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                        <UserCircle className="w-3.5 h-3.5" />
                      </div>
                      Profile
                    </Link>

                    <Link 
                      to="/settings"
                      onClick={() => setShowProfileDropdown(false)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[12px] font-semibold text-on-surface hover:bg-primary/5 hover:text-primary transition-colors group"
                    >
                      <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                        <Settings className="w-3.5 h-3.5" />
                      </div>
                      Settings
                    </Link>
                    
                    <div className="h-px bg-outline-variant/5 my-1" />
                    
                    <button 
                      onClick={() => {
                        setShowProfileDropdown(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[12px] font-semibold text-on-surface hover:bg-red-500/5 hover:text-red-500 transition-colors group"
                    >
                      <div className="h-7 w-7 rounded-md bg-red-500/10 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                        <LogOut className="w-3.5 h-3.5" />
                      </div>
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {showSlider && <NotificationSlider onClose={() => setShowSlider(false)} />}

      <AnimatePresence>
        {isMobileNavOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileNavOpen(false)}
              className="fixed inset-0 top-[70px] z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />

            {/* Slide-out Sidebar list */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-[70px] bottom-0 w-[280px] sm:w-[320px] bg-surface-container-lowest border-r border-outline-variant/15 z-50 overflow-y-auto no-scrollbar lg:hidden flex flex-col pt-4 pb-12 shadow-2xl"
            >
              <div className="px-4 py-2">
                <button 
                  onClick={() => {
                    navigate('/profile');
                    setIsMobileNavOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-container-high transition-colors group text-left border border-outline-variant/5 bg-surface-container-low"
                >
                  <div className="w-9 h-9 rounded-full bg-surface-container-low border border-outline-variant/10 overflow-hidden flex items-center justify-center shrink-0">
                    {authLoading ? (
                      <div className="w-full h-full bg-outline-variant/15 animate-pulse" />
                    ) : user?.profileImage ? (
                      <img src={user.profileImage} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <UserCircle className="w-5 h-5 text-secondary" />
                    )}
                  </div>
                  <div>
                    {authLoading ? (
                      <div className="h-3.5 w-24 bg-outline-variant/15 animate-pulse rounded mb-1" />
                    ) : (
                      <span className="block text-[13px] font-bold text-on-surface line-clamp-1">{user?.fullName || 'User Profile'}</span>
                    )}
                    <span className="block text-[10px] text-secondary font-medium">View your profile</span>
                  </div>
                </button>
              </div>

              {/* Mobile Search inside drawer */}
              <div className="px-4 py-3 md:hidden">
                <form onSubmit={(e) => { e.preventDefault(); handleSearch(e); setIsMobileNavOpen(false); }} className="relative">
                  <div className="flex items-center bg-surface-container-low px-3 h-10 rounded-xl focus-within:bg-surface-container-lowest transition-colors border border-outline-variant/10 text-on-surface">
                    <Search className="w-4 h-4 text-secondary shrink-0" />
                    <input 
                      className="bg-transparent border-none focus:ring-0 focus:outline-none focus-visible:outline-none text-[12px] w-full placeholder:text-outline-variant ml-2 font-medium" 
                      placeholder="Search journals, authors..." 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </form>
              </div>

              <div className="px-2 py-2 space-y-1">
                <div className="px-3 py-1 mb-1">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Navigation</h3>
                </div>
                {navigationItems.map((item) => (
                  <button 
                    key={item.label}
                    onClick={() => {
                      if (item.active && item.path === '/feed') {
                        window.dispatchEvent(new CustomEvent('refresh-page-content', { detail: { path: '/feed' } }));
                      } else {
                        navigate(item.path);
                      }
                      setIsMobileNavOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-colors group text-left",
                      item.active ? "bg-primary/10 text-primary font-bold" : "hover:bg-surface-container-high text-secondary hover:text-on-surface"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5 shrink-0", item.active ? "text-primary" : "text-secondary group-hover:text-primary transition-colors")} />
                    <span className="text-[13px] font-bold">{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="h-px bg-outline-variant/10 my-2 mx-4" />

              <div className="px-2 py-2 space-y-1">
                <div className="px-3 py-1 mb-1 animate-in fade-in duration-300">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Personal Space</h3>
                </div>
                {personalItems.map((item) => (
                  <button 
                    key={item.label}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileNavOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-colors group text-left",
                      item.active ? "bg-primary/10 text-primary font-bold" : "hover:bg-surface-container-high text-secondary hover:text-on-surface"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5 shrink-0", item.active ? "text-primary" : "text-secondary group-hover:text-primary transition-colors")} />
                    <span className="text-[13px] font-bold">{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-auto px-4 pt-4 border-t border-outline-variant/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-secondary">Dark Mode</span>
                  <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 transition-colors"
                  >
                    {theme === 'light' ? <Moon className="w-4 h-4 text-on-surface" /> : <Sun className="w-4 h-4 text-on-surface" />}
                  </button>
                </div>
                <button 
                  onClick={() => {
                    handleLogout();
                    setIsMobileNavOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-xl transition-all font-bold text-xs"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
