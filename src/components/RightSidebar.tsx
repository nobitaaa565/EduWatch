import React, { useState, useEffect } from 'react';
import { Sparkles, Users as UsersIcon, History, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { type CombinedPost } from '../algorithms/search';
import { feed, type Creator } from '../lib/feedData';

interface RightSidebarProps {
  popularCreators: Creator[];
  following: string[];
  toggleFollow: (username: string) => void;
  handlePostAction: (item: CombinedPost) => void;
  navigate: (path: string) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  popularCreators,
  following,
  toggleFollow,
  handlePostAction,
  navigate
}) => {
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

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
  }, [isHistoryDrawerOpen]);

  return (
    <div className="space-y-6">
      {/* Recently Viewed Articles Section */}
      <section className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/15 shadow-sm space-y-4 font-sans">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            <h3 className="text-[10px] font-black text-secondary tracking-widest uppercase">Recently Viewed</h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full font-mono">
            {recentlyViewed.length}
          </span>
        </div>

        {recentlyViewed.length === 0 ? (
          <p className="text-xs text-secondary italic py-2">No recently viewed articles found.</p>
        ) : (
          <div className="space-y-3.5">
            {recentlyViewed.slice(0, 4).map((art, artIdx) => (
              <div 
                key={`sidebar-rv-${art.id}-${artIdx}`}
                onClick={() => navigate(`/article/${art.id}`)}
                className="group flex gap-3 cursor-pointer hover:bg-surface-container-low/40 p-1.5 rounded-xl transition-all"
              >
                <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 relative bg-surface-container border border-outline-variant/10">
                  <img 
                    src={art.image} 
                    alt={art.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <h4 className="text-[12px] font-bold leading-tight text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                    {art.title}
                  </h4>
                  <p className="text-[10px] text-secondary font-medium truncate">
                    {art.authorName} • {art.readTime}
                  </p>
                </div>
              </div>
            ))}

            {recentlyViewed.length > 4 && (
              <button 
                onClick={() => setIsHistoryDrawerOpen(true)}
                className="w-full py-2 text-[11px] font-black text-center text-primary bg-primary/5 hover:bg-primary/10 hover:text-primary rounded-xl transition-all uppercase tracking-wider cursor-pointer"
              >
                Show More
              </button>
            )}
          </div>
        )}
      </section>

      {/* Discovery Section */ }
      <section className="bg-surface-container-lowest p-6 rounded-3xl ambient-shadow border border-outline-variant/15">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-black text-on-surface tracking-widest uppercase">Popular Creators</h3>
          </div>
        </div>
        
        <div className="space-y-5">
          {popularCreators
            .filter(creator => !following.includes(creator.name.toLowerCase().replace(/\s/g, '_')))
            .slice(0, 5)
            .map((creator) => (
            <div key={creator.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-surface-container overflow-hidden border border-outline-variant/10 shrink-0">
                  <img src={creator.avatar} alt={creator.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold text-on-surface group-hover:text-primary transition-colors cursor-pointer truncate">{creator.name}</h4>
                  <p className="text-[9px] text-secondary font-medium truncate flex items-center gap-1">
                    <UsersIcon className="w-2.5 h-2.5" /> {(creator.followers / 1000).toFixed(1)}K followers
                  </p>
                </div>
              </div>
              <button 
                onClick={() => toggleFollow(creator.name.toLowerCase().replace(/\s/g, '_'))}
                className="bg-primary text-white border-primary hover:bg-primary-hover shadow-sm text-[9px] font-black uppercase tracking-tighter transition-all px-3 py-1.5 rounded-lg border"
              >
                Follow
              </button>
            </div>
          ))}
        </div>

        <button 
          onClick={() => navigate('/find-people?tab=suggestions&sort=popularity')}
          className="w-full mt-6 py-2.5 text-[10px] font-black text-primary hover:bg-primary/5 border border-primary/20 rounded-xl transition-all uppercase tracking-widest"
        >
          View top creators
        </button>
      </section>

      <div className="h-px bg-outline-variant/10 my-4" />

      <p className="px-6 text-[10px] text-outline-variant font-medium leading-relaxed pb-8">
        Privacy · Terms · Ads · Cookies · More · EduWatch © 2026
      </p>

      {/* Right Drawer slider for Recently Viewed articles of Feed */}
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
                      key={`drawer-rv-feed-${art.id}-${index}`}
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
  );
};
