import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { Sidebar } from '../components/Sidebar';
import { 
  Search,
  Eye,
  Clock,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Settings as SettingsIcon,
  Sparkles,
  Users as UsersIcon,
  Plus,
  ChevronDown,
  ArrowBigUp,
  MessageSquare
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';
import { useSidebar } from '../lib/SidebarContext';
import { feed, getPopularCreators, Article } from '../lib/feedData';
import { useSocial } from '../lib/social';
import { postService, Post as LocalPost } from '../services/postService';
import { filterSearchResults, sortSearchResults, CombinedPost } from '../algorithms/search';
import { extractHashtags, estimateReadTime, convertHtmlToText, getTruncatedContent } from '../algorithms/content';
import { getSuggestedCommunities, getSuggestedPeople } from '../algorithms/recommendations';
import { formatElapsedTime } from '../lib/dateUtils';
import { HashtagText } from '../components/HashtagText';

const topics = [
  'Pedagogy', 'Infrastructure', 'AI Ethics', 'System Arch', 'Backend', 'Frontend', 'DevOps', 'Security', 'Data Science', 'UX Design', 'Curriculum', 'Performance', 'Accessibility', 'No-Code', 'Simulation', 'Mentorship', 'Remote Work', 'Connectivity', 'Open Source', 'Leadership'
];

const articleTypes = ['Case Study', 'Research', 'Tutorial', 'Editorial', 'Whitepaper', 'Benchmark'];

export default function SearchResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { following, toggleFollow, registry } = useSocial();
  const popularCreators = getPopularCreators();
  const queryFromUrl = searchParams.get('q') || '';
  const categoryFromUrl = searchParams.get('category') || '';
  const initialCategory = ['All', 'Posts', 'Communities', 'Comments', 'Media', 'People'].includes(categoryFromUrl) 
    ? categoryFromUrl as 'All' | 'Posts' | 'Communities' | 'Comments' | 'Media' | 'People' 
    : 'All';
  
  const [searchQuery, setSearchQuery] = useState(queryFromUrl);
  const [searchCategory, setSearchCategory] = useState<'All' | 'Posts' | 'Communities' | 'Comments' | 'Media' | 'People'>(initialCategory);
  const [sortBy, setSortBy] = useState('Relevance');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const centerFeedRef = useRef<HTMLDivElement>(null);

  const categoryParam = searchParams.get('category');
  // Update local query and category state if URL changes
  useEffect(() => {
    setSearchQuery(queryFromUrl);
    if (categoryParam && ['All', 'Posts', 'Communities', 'Comments', 'Media', 'People'].includes(categoryParam)) {
      setSearchCategory(categoryParam as any);
    } else if (!categoryParam) {
      setSearchCategory('All');
    }
  }, [queryFromUrl, categoryParam]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    centerFeedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchQuery, sortBy, selectedTypes, selectedTimes, selectedTopics, selectedSources, itemsPerPage]);

  const [displayFeed, setDisplayFeed] = useState<CombinedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Trigger search transitions smoothly
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setIsSearching(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, searchCategory, sortBy, selectedTypes, selectedTimes, selectedTopics, selectedSources]);

  useEffect(() => {
    const fetchLocalPosts = async () => {
      setIsLoading(true);
      const [localGlobal, localFollowers] = await Promise.all([
        postService.getGlobalFeed(),
        user ? postService.getFollowersFeed(user.username) : Promise.resolve([])
      ]);
      
      const allLocal = [...localGlobal, ...localFollowers].map(p => ({ ...p, isLocal: true }));
      const uniqueLocal = allLocal.filter((p, index, self) => 
        index === self.findIndex((t) => t.id === p.id)
      );
      
      const combined = [...uniqueLocal, ...feed];
      setDisplayFeed(combined as CombinedPost[]);
      setIsLoading(false);
    };

    fetchLocalPosts();
  }, [user]);

  const filteredFeed = filterSearchResults(
    displayFeed,
    searchQuery,
    {
      topics: selectedTopics,
      sources: selectedSources,
      times: selectedTimes
    },
    extractHashtags
  );

  const sortedFeed = sortSearchResults(filteredFeed, sortBy, searchQuery);

  const totalPages = Math.ceil(sortedFeed.length / itemsPerPage);
  const paginatedFeed = sortedFeed.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="h-screen bg-surface overflow-hidden">
      <TopBar />
      <main className="mt-[70px] h-[calc(100vh-70px)] overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between gap-6 lg:gap-10 relative w-full h-full px-4 md:px-10 lg:px-10 transition-all duration-300 ease-in-out">
          
          {/* Left Navigation Sidebar */}
          <aside className={cn(
            "hidden lg:block shrink-0 h-full overflow-y-auto no-scrollbar pt-6 pb-20 transition-all duration-300 ease-in-out",
            isCollapsed ? "w-[80px]" : "w-[350px]"
          )}>
            <Sidebar />
          </aside>

          {/* Results List (Middle) */}
          <div 
            ref={centerFeedRef}
            className="w-full lg:flex-[1] min-w-0 h-full overflow-y-auto no-scrollbar pt-6 pb-40 space-y-8"
          >
            <div className="max-w-[740px] mx-auto">
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-6 group w-fit"
              >
                <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[11px] font-black uppercase tracking-widest">Back</span>
              </button>
              
              <div className="flex flex-col gap-1 items-start mb-6">
                <h1 className="text-[14px] font-black text-on-surface tracking-tight font-manrope">
                  Results for: <span className="text-primary italic">"{searchQuery || 'All'}"</span>
                </h1>
              </div>

              {/* Consolidated Tabs & Filters Bar */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-2 pt-1 border-b border-outline-variant/5 mb-8">
                {/* Tabs on Left */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
                  {['All', 'Posts', 'Communities', 'Comments', 'Media', 'People'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSearchCategory(cat as any)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 cursor-pointer",
                        searchCategory === cat 
                          ? "bg-primary/10 text-primary font-bold" 
                          : "text-secondary hover:bg-outline-variant/10"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Dropdown Filters on Right */}
                <div className="flex items-center gap-4 shrink-0 sm:ml-auto">
                  <button className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-secondary hover:text-on-surface transition-colors">
                    {sortBy} <ChevronDown className="w-3 h-3 text-secondary" />
                  </button>
                  <div className="w-px h-3 bg-outline-variant/20" />
                  <button className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-secondary hover:text-on-surface transition-colors">
                    All time <ChevronDown className="w-3 h-3 text-secondary" />
                  </button>
                </div>
              </div>

              {/* Category Specific Content */}
              {isSearching || isLoading ? (
                <div className="space-y-8 animate-fade-in">
                  {searchCategory === 'All' ? (
                    <div className="flex flex-col gap-10">
                      {/* Posts Skeleton Section */}
                      <section>
                        <div className="flex items-center justify-between mb-4">
                          <div className="h-4 w-24 bg-outline-variant/15 rounded animate-pulse" />
                          <div className="h-3 w-16 bg-outline-variant/10 rounded animate-pulse" />
                        </div>
                        <div className="space-y-4">
                          <PostItemSkeleton viewMode="list" />
                          <PostItemSkeleton viewMode="list" />
                        </div>
                      </section>

                      {/* People Skeleton Section */}
                      <section>
                        <div className="flex items-center justify-between mb-4">
                          <div className="h-4 w-20 bg-outline-variant/15 rounded animate-pulse" />
                          <div className="h-3 w-16 bg-outline-variant/10 rounded animate-pulse" />
                        </div>
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 font-manrope">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-[160px] shrink-0 p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 text-center animate-pulse">
                              <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-outline-variant/20" />
                              <div className="h-3 w-2/3 bg-outline-variant/25 rounded mx-auto mb-1.5" />
                              <div className="h-2 w-1/2 bg-outline-variant/15 rounded mx-auto mb-3" />
                              <div className="h-7 w-full bg-outline-variant/20 rounded-lg" />
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  ) : searchCategory === 'Media' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="relative aspect-square rounded-2xl bg-outline-variant/15 mb-2" />
                          <div className="h-3 w-3/4 bg-outline-variant/20 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : searchCategory === 'People' ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 animate-pulse">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-outline-variant/20" />
                            <div className="space-y-1.5">
                              <div className="h-3.5 w-24 bg-outline-variant/25 rounded" />
                              <div className="h-2 w-16 bg-outline-variant/15 rounded" />
                            </div>
                          </div>
                          <div className="h-7 w-16 bg-outline-variant/20 rounded-lg" />
                        </div>
                      ))}
                    </div>
                  ) : searchCategory === 'Communities' ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 animate-pulse">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-outline-variant/20 shrink-0" />
                            <div className="space-y-1.5">
                              <div className="h-3.5 w-24 bg-outline-variant/25 rounded" />
                              <div className="h-2 w-16 bg-outline-variant/15 rounded" />
                            </div>
                          </div>
                          <div className="h-7 w-16 bg-outline-variant/20 rounded-lg" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={cn(
                      "transition-all duration-300",
                      viewMode === 'list' ? "space-y-6" : "grid grid-cols-1 md:grid-cols-2 gap-6"
                    )}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <PostItemSkeleton key={i} viewMode={viewMode} />
                      ))}
                    </div>
                  )}
                </div>
              ) : searchCategory === 'All' ? (
                <div className="flex flex-col gap-10">
                  {/* Unified Posts Section */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-bold text-gray-400 tracking-wider uppercase">Posts</h2>
                      <button 
                        onClick={() => setSearchCategory('Posts')}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        See more <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    {sortedFeed.length > 0 ? (
                      <div className="space-y-4">
                        {sortedFeed.slice(0, 5).map((item) => (
                          <PostItem key={item.id} item={item} navigate={navigate} viewMode="list" />
                        ))}
                      </div>
                    ) : (
                      <div className="w-full p-8 border border-dashed border-outline-variant/10 bg-surface-container-lowest/50 rounded-2xl text-center text-secondary text-sm">
                        No posts found matching your search.
                      </div>
                    )}
                  </section>

                  {/* People Section (Slider/Tile Slide) */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-bold text-gray-400 tracking-wider uppercase">PEOPLE</h2>
                      <button 
                        onClick={() => setSearchCategory('People')}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        See more <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    {(() => {
                      const filteredCreators = popularCreators.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
                      if (filteredCreators.length > 0) {
                        return (
                          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 font-manrope">
                            {filteredCreators.map(creator => (
                              <div 
                                key={creator.id}
                                className="w-[160px] shrink-0 p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm text-center group cursor-pointer hover:border-primary/30 hover:shadow-md transition-all duration-300"
                                onClick={() => navigate(`/profile/${creator.name.toLowerCase().replace(/\s+/g, '-')}`)}
                              >
                                <img 
                                  src={creator.avatar} 
                                  className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-2 border-primary/10 group-hover:border-primary transition-all duration-300 animate-fade-in" 
                                  alt={creator.name} 
                                  referrerPolicy="no-referrer"
                                />
                                <h4 className="text-[11px] font-black text-on-surface truncate">{creator.name}</h4>
                                <p className="text-[9px] text-secondary font-medium mb-3">{(creator.followers/1000).toFixed(1)}k followers</p>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFollow(creator.name);
                                  }}
                                  className={cn(
                                    "w-full py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer duration-200",
                                    following.includes(creator.name)
                                      ? "bg-surface-container text-secondary border-transparent"
                                      : "bg-primary text-white border-primary shadow-sm hover:bg-primary/90"
                                  )}
                                >
                                  {following.includes(creator.name) ? 'Following' : 'Follow'}
                                </button>
                              </div>
                            ))}
                          </div>
                        );
                      } else {
                        return (
                          <div className="w-full p-6 border border-dashed border-outline-variant/10 rounded-2xl text-center text-secondary text-sm bg-surface-container-lowest/50">
                            No immediate results found. Click See More to expand search.
                          </div>
                        );
                      }
                    })()}
                  </section>

                  {/* Top Communities Section */}
                  {!searchQuery && (
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-gray-400 tracking-wider uppercase">TOP COMMUNITIES</h2>
                        <button 
                          onClick={() => setSearchCategory('Communities')}
                          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          See more <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {['Engineering', 'Designers', 'OpenSource', 'Research', 'DevOps', 'Security'].map((comm, idx) => (
                          <div 
                            key={comm} 
                            className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 cursor-pointer"
                            onClick={() => navigate(`/community/${comm.toLowerCase()}`)}
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border border-primary/15 uppercase">
                              r/{comm[0].toLowerCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-on-surface text-sm truncate leading-none">r/{comm}</h4>
                              <p className="text-xs text-secondary mt-1">{(14.2 + idx * 7.5).toFixed(1)}k members</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              ) : searchCategory === 'Media' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {sortedFeed
                    .filter(item => ('image' in item && item.image) || ((item as any).images && (item as any).images.length > 0 && (item as any).images[0]))
                    .map(item => (
                      <div 
                        key={item.id}
                        onClick={() => navigate('format' in item && item.format === 'micropost' ? `/micro-post/${item.id}` : `/article/${item.id}`)}
                        className="group cursor-pointer"
                      >
                        <div className="relative aspect-square rounded-2xl overflow-hidden mb-2 border border-outline-variant/5">
                          <img 
                            src={('image' in item && item.image) ? item.image : ((item as any).images?.[0] || null)} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                            alt={item.title}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <h4 className="text-[11px] font-bold truncate group-hover:text-primary transition-colors">{item.title}</h4>
                      </div>
                    ))}
                </div>
              ) : searchCategory === 'People' ? (
                <div className="space-y-4">
                  {popularCreators
                    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(creator => (
                      <div key={creator.id} className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/5 shadow-sm">
                        <div className="flex items-center gap-3">
                          <img src={creator.avatar} className="w-12 h-12 rounded-full object-cover" alt={creator.name} referrerPolicy="no-referrer" />
                          <div>
                            <h4 className="text-sm font-black text-on-surface">{creator.name}</h4>
                            <p className="text-[10px] text-secondary font-medium">{(creator.followers/1000).toFixed(1)}k followers</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => toggleFollow(creator.name)}
                          className={cn(
                            "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all",
                            following.includes(creator.name)
                              ? "bg-surface-container text-secondary border-transparent"
                              : "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                          )}
                        >
                          {following.includes(creator.name) ? 'Following' : 'Follow'}
                        </button>
                      </div>
                    ))}
                </div>
              ) : searchCategory === 'Communities' ? (
                <div className="space-y-4">
                  {['Engineering', 'Designers', 'OpenSource', 'Research', 'DevOps', 'Security', 'AI-Ethics', 'Frontend-Talk', 'Backend-Masters'].map((comm, idx) => (
                    <div 
                      key={comm} 
                      className="flex items-center justify-between p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer"
                      onClick={() => navigate(`/community/${comm.toLowerCase()}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center font-bold text-primary text-sm uppercase shrink-0">
                          {comm[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface text-sm">r/{comm}</h4>
                          <p className="text-xs text-secondary mt-1">{(14.2 + idx * 11.5).toFixed(1)}k members</p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle join action
                        }}
                        className="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-primary text-white hover:bg-primary/90 shadow-sm cursor-pointer transition-colors"
                      >
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                /* Standard List View for Posts and others */
                <div className={cn(
                  "transition-all duration-300",
                  viewMode === 'list' ? "space-y-6" : "grid grid-cols-1 md:grid-cols-2 gap-6"
                )}>
                  {paginatedFeed.length > 0 ? (
                    paginatedFeed.map((item) => (
                      <PostItem 
                        key={item.id} 
                        item={item} 
                        viewMode={viewMode} 
                        navigate={navigate} 
                      />
                    ))
                  ) : (
                    <div className="py-20 text-center bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/20 col-span-full">
                      <Search className="w-12 h-12 text-outline-variant mx-auto mb-4 opacity-20" />
                      <h3 className="text-xl font-black text-on-surface mb-2">No matches found</h3>
                      <button 
                        onClick={() => {
                          setSearchQuery('');
                          setSearchCategory('All');
                        }}
                        className="mt-6 text-[10px] font-black text-primary uppercase tracking-widest border border-primary/20 px-6 py-2 rounded-xl hover:bg-primary/5 transition-all"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-between pt-8 border-t border-outline-variant/10">
                  <p className="text-[10px] font-black text-secondary uppercase tracking-widest">
                     {sortedFeed.length} Results
                  </p>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg hover:bg-surface-container transition-colors disabled:opacity-30"
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className="p-1.5 rounded-lg hover:bg-surface-container transition-colors disabled:opacity-30"
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar (Search Results for Communities & People) */}
          <aside className="hidden lg:block flex-[0_1_350px] min-w-0 sticky top-0 h-[calc(100vh-70px)] overflow-y-auto pt-6 pb-20 space-y-2">
            <div className="bg-surface-container-lowest/50 rounded-3xl p-6 border border-outline-variant/5">
              {/* Communities Section */}
              <section className="mb-8">
                <h3 className="text-[13px] font-bold text-on-surface mb-6">Communities</h3>
                <div className="space-y-6">
                  {(() => {
                    const communityData = [
                      { name: 'caramellangel_', desc: 'hhhhjgtgvb', visitors: 72 },
                      { name: 'caramelbooty', desc: 'Active community', visitors: 39 },
                      { name: 'caramelldansen', desc: 'caramelldansen', visitors: 66 },
                      { name: 'caramelcandid', desc: 'community for the Japanese roc...', visitors: 11 },
                      { name: 'Anticaramelcult', desc: "we hate caramel and that's it....", visitors: 1 }
                    ];
                    
                    const { items: itemsToDisplay, hasMatches } = getSuggestedCommunities(searchQuery, communityData);

                    return (
                      <>
                        {!hasMatches && searchQuery && (
                          <p className="text-[11px] text-secondary mb-4 italic">No matches found with "{searchQuery}". Here are some popular communities:</p>
                        )}
                        {itemsToDisplay.map((comm, idx) => (
                          <div 
                            key={comm.name} 
                            className="flex items-start gap-3 cursor-pointer group"
                            onClick={() => navigate(`/community/${comm.name.toLowerCase()}`)}
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-full shrink-0 flex items-center justify-center",
                              idx < 3 ? "bg-[#0079D3] text-white" : "bg-surface-container overflow-hidden"
                            )}>
                              {idx < 3 ? (
                                <span className="font-bold text-sm">r/</span>
                              ) : (
                                <img 
                                  src={comm.name === 'Anticaramelcult' 
                                    ? "https://api.dicebear.com/7.x/identicon/svg?seed=anti" 
                                    : `https://api.dicebear.com/7.x/shapes/svg?seed=${comm.name}`} 
                                  alt={comm.name} 
                                  className="w-full h-full object-cover" 
                                />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-[14px] font-bold text-on-surface leading-tight hover:underline">r/{comm.name}</h4>
                              <p className="text-[12px] text-secondary line-clamp-1 mt-0.5">
                                {comm.desc}
                              </p>
                              <div className="flex flex-col text-[11px] text-secondary mt-1">
                                <span>{comm.visitors} weekly visitors ·</span>
                                <span>0 weekly contributions</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    );
                  })()}
                </div>
                <button 
                  onClick={() => setSearchCategory('Communities')}
                  className="mt-8 text-[13px] font-bold text-primary hover:underline"
                >
                  See more communities
                </button>
              </section>

              <div className="h-px bg-outline-variant/10 my-8" />

              {/* People Section */}
              <section>
                <h3 className="text-[13px] font-bold text-on-surface mb-6">People</h3>
                <div className="space-y-6">
                  {(() => {
                    const { items: itemsToDisplay, hasMatches } = getSuggestedPeople(searchQuery, popularCreators);

                    return (
                      <>
                        {!hasMatches && searchQuery && (
                          <p className="text-[11px] text-secondary mb-4 italic">No matches found with "{searchQuery}". You might like these people:</p>
                        )}
                        {itemsToDisplay.map((creator, idx) => (
                          <div 
                            key={creator.id} 
                            className="flex items-start gap-3 cursor-pointer group"
                            onClick={() => navigate(`/profile/${creator.name.toLowerCase().replace(/\s+/g, '-')}`)}
                          >
                            <img 
                              src={creator.avatar} 
                              className="w-10 h-10 rounded-full shrink-0 object-cover" 
                              alt={creator.name} 
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                              <h4 className="text-[14px] font-bold text-on-surface leading-tight hover:underline">u/{creator.name.toLowerCase().replace(/\s+/g, '')}</h4>
                              <p className="text-[12px] text-secondary line-clamp-1 mt-0.5">
                                {idx === 0 ? 'Simply lovely' : 'Active contributor'}
                              </p>
                              <p className="text-[11px] text-secondary mt-1 font-medium">
                                {idx === 0 ? '181K karma' : `${(creator.followers / 10).toFixed(1)}K karma`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </>
                    );
                  })()}
                </div>
                <button 
                  onClick={() => setSearchCategory('People')}
                  className="mt-8 text-[13px] font-bold text-primary hover:underline"
                >
                  See more people
                </button>
              </section>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function PostItem({ 
  item, 
  navigate, 
  viewMode = 'list'
}: { 
  item: CombinedPost; 
  viewMode?: 'list' | 'grid'; 
  navigate: any; 
}) {
  const isLocal = 'isLocal' in item && item.isLocal;
  const authorName = 'author' in item ? item.author : item.authorName;
  const content = 'description' in item ? item.description : item.content;
  const title = item.title;
  const image = 'image' in item ? item.image : (item.images?.[0] || null);

  const format = 'format' in item ? item.format : 'article';
  const isArticle = format === 'article';
  const isMicro = format === 'micropost';

  const upvotesCount = 'views' in item 
    ? (parseInt(item.views) / 10).toFixed(0) 
    : postService.getExtraInteractions(item.id).upvotes;

  const commentsCount = 'comments' in item 
    ? (typeof item.comments === 'number' ? item.comments : 12) 
    : postService.getComments(item.id).length;

  const authorImg = ('authorImage' in item && item.authorImage) 
    ? item.authorImage 
    : `https://i.pravatar.cc/100?u=${authorName}`;

  const postDate = formatElapsedTime('createdAt' in item ? item.createdAt : ('date' in item ? item.date : undefined));

  const tagBg = isArticle 
    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/15' 
    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15';
  
  const tagLabel = isArticle ? 'Article' : 'Micro-post';

  return (
    <div 
      className={cn(
        "group bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-5 hover:border-primary/30 hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden cursor-pointer",
        viewMode === 'list' ? "md:flex-row gap-5" : "h-full gap-4"
      )}
      onClick={() => {
        if ('format' in item && item.format === 'micropost') {
          navigate(`/micro-post/${item.id}`);
        } else {
          navigate(`/article/${item.id}`);
        }
      }}
    >
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {/* Metadata Top Bar styled exactly like Feed post header */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/10 bg-surface-container flex items-center justify-center shrink-0">
                <img 
                  src={authorImg} 
                  alt={authorName} 
                  className="w-full h-full object-cover animate-fade-in" 
                  referrerPolicy="no-referrer" 
                />
              </div>
              <div className="flex flex-col">
                <h4 className="text-[13px] font-bold text-on-surface hover:underline cursor-pointer transition-all">
                  {authorName}
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] text-secondary font-medium flex-wrap leading-none mt-0.5">
                  <span>{postDate}</span>
                  {isArticle && (
                    <>
                      <span>·</span>
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-1.5 py-0.5 rounded leading-none">Article</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-[10px] text-secondary font-bold uppercase tracking-wider">
                        <Clock className="w-3 h-3 text-secondary/70 shrink-0" />
                        {estimateReadTime(content)} Min Read
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0", tagBg)}>
              {tagLabel}
            </span>
          </div>

          {/* Title styled like Feed post */}
          {title && !isMicro && (
            <h3 className="text-[16px] font-black font-manrope leading-tight text-on-surface mb-2 transition-colors group-hover:text-primary">
              {title}
            </h3>
          )}

          {/* Content lines styled exactly like in feed containing live rich hashtags */}
          <div className="space-y-1.5 mb-4">
            {(() => {
              const cleanedText = convertHtmlToText(content);
              const { visibleText, isTruncated } = getTruncatedContent(cleanedText, false); // Truncated to 3 lines
              const lines = visibleText.split('\n');
              return lines.map((line, idx) => {
                const isLastLine = idx === lines.length - 1;
                if (line === '' && !isLastLine) {
                  return <div key={idx} className="h-2" />;
                }
                return (
                  <div 
                    key={idx} 
                    className="text-[14px] text-on-surface leading-relaxed break-words max-w-full text-left font-normal"
                  >
                    <HashtagText text={line} />
                    {isLastLine && isTruncated && (
                      <span className="text-primary font-bold ml-1 hover:underline">... see more</span>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Footer Metrics - remains minimal and clean search style */}
        <div className="flex items-center justify-between mt-4 border-t border-outline-variant/5 pt-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 py-1 text-secondary">
              <ArrowBigUp className="w-4 h-4 text-secondary/80" />
              <span className="text-[11px] font-black">{upvotesCount}</span>
            </div>
            <div className="flex items-center gap-1 py-1 text-secondary">
              <MessageSquare className="w-4 h-4 text-secondary/80" />
              <span className="text-[11px] font-black">{commentsCount} comments</span>
            </div>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transform translate-x-1 group-hover:translate-x-0 transition-all duration-350">
            Read <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {image && (
        <div className={cn(
          "rounded-xl overflow-hidden shrink-0 border border-outline-variant/10 relative shadow-inner bg-surface",
          viewMode === 'list' 
            ? "w-full md:w-[150px] h-[100px]" 
            : "w-full h-[140px] order-first"
        )}>
          <img 
            src={image} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 animate-fade-in" 
            alt={title || "Post thumbnail"}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
      )}
    </div>
  );
}

function PostItemSkeleton({ viewMode = 'list' }: { viewMode?: 'list' | 'grid' }) {
  return (
    <div 
      className={cn(
        "animate-pulse bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden",
        viewMode === 'list' ? "md:flex-row gap-5" : "h-full gap-4"
      )}
    >
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {/* Metadata Top Bar */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-outline-variant/20 shrink-0" />
              <div className="flex flex-col gap-1.5 justify-center">
                <div className="h-3 w-20 bg-outline-variant/20 rounded" />
                <div className="h-2 w-12 bg-outline-variant/10 rounded mt-0.5" />
              </div>
            </div>
            <div className="h-4 w-16 bg-outline-variant/15 rounded-full" />
          </div>

          {/* Title */}
          <div className="h-4 w-3/4 bg-outline-variant/25 rounded mb-2 pt-1" />
          <div className="h-3.5 w-1/2 bg-outline-variant/20 rounded mb-4" />

          {/* Snippet */}
          <div className="space-y-2 mt-3">
            <div className="h-3 w-full bg-outline-variant/10 rounded" />
            <div className="h-3 w-full bg-outline-variant/10 rounded" />
            <div className="h-3 w-4/5 bg-outline-variant/10 rounded" />
          </div>
        </div>

        {/* Footer Metrics */}
        <div className="flex items-center justify-between mt-6 border-t border-outline-variant/5 pt-3">
          <div className="flex items-center gap-4">
            <div className="h-4 w-8 bg-outline-variant/15 rounded" />
            <div className="h-4 w-16 bg-outline-variant/15 rounded" />
          </div>
          <div className="h-4 w-12 bg-outline-variant/20 rounded animate-pulse" />
        </div>
      </div>

      <div className={cn(
        "rounded-xl bg-outline-variant/15 shrink-0 animate-pulse",
        viewMode === 'list' 
          ? "w-full md:w-[150px] h-[100px]" 
          : "w-full h-[140px] order-first"
      )} />
    </div>
  );
}

