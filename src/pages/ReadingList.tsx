import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { Sidebar } from '../components/Sidebar';
import { useSidebar } from '../lib/SidebarContext';
import { ChevronDown, ChevronLeft, ChevronRight, Eye, Clock, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { feed } from '../lib/feedData';

const categories = ['All Topics', 'Educational Psychology', 'Curriculum Design', 'Instructional Technology'];

export default function ReadingList() {
  const [sortBy, setSortBy] = useState('Progress');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const { isCollapsed } = useSidebar();

  const navigate = useNavigate();
  const articles = feed.filter(item => item.progress > 0);

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

          {/* Main Content */}
          <div className="w-full lg:flex-[1] min-w-0 h-full overflow-y-auto no-scrollbar pt-6 pb-40 space-y-8">
            <div className="max-w-[1000px] mx-auto">
              <section className="mb-8 pt-0">
                <button 
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-6 group w-fit"
                >
                  <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                  <span className="text-[11px] font-black uppercase tracking-widest">Back</span>
                </button>
                <div className="flex flex-col gap-3 transition-all duration-300">
                  <h1 className="text-[41px] font-black text-on-surface tracking-tighter font-manrope">
                    Continue <span className="text-primary">Reading</span>
                  </h1>
                  <p className="text-secondary text-lg leading-relaxed max-w-2xl">
                    Pick up right where you left off. Your unfinished technical journals and journals.
                  </p>
                </div>
              </section>

              {/* Filter and Sort Section */}
              <section className="mb-6 flex items-center justify-between transition-all duration-300 flex-wrap gap-4">
                {/* Category Filter Chips */}
                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                  {categories.map((cat, i) => (
                    <button 
                      key={cat}
                      className={cn(
                        "px-6 py-2.5 rounded-full font-inter text-[11px] font-bold whitespace-nowrap active:scale-95 transition-all border border-outline-variant/10",
                        i === 0 ? "bg-primary text-white border-primary" : "bg-surface-container-low text-secondary hover:bg-surface-container-high"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Sort Section */}
                <div className="relative shrink-0">
                  <button 
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className="flex gap-2.5 items-center bg-surface-container-low p-1.5 rounded-xl border border-outline-variant/5 hover:bg-surface-container-high transition-all"
                  >
                    <span className="text-[10px] font-inter font-bold text-secondary ml-3 uppercase tracking-wider">Sort by:</span>
                    <div className="px-4 py-2 rounded-lg bg-surface-container-lowest text-primary font-manrope text-[11px] font-bold ambient-shadow flex items-center gap-2">
                      {sortBy}
                      <ChevronDown className={cn("w-3 h-3 transition-transform", isSortOpen && "rotate-180")} />
                    </div>
                  </button>

                  {isSortOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      {['Date Saved', 'Reading Time', 'Title', 'Progress'].map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setSortBy(option);
                            setIsSortOpen(false);
                          }}
                          className={cn(
                            "w-full px-4 py-3 text-left text-[11px] font-bold font-manrope transition-colors hover:bg-primary/5",
                            sortBy === option ? "text-primary bg-primary/5" : "text-secondary"
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 transition-all duration-300">
                {articles.length > 0 ? (
                  articles.map((article, index) => (
                    <div key={article.title} className="group flex gap-6 transition-all duration-300 bg-surface-container-lowest p-4 rounded-2xl ambient-shadow border border-outline-variant/5 hover:border-primary/20">
                      {/* Image Section */}
                      <div className="relative w-[120px] h-[160px] rounded-xl overflow-hidden shrink-0 ambient-shadow border border-outline-variant/5">
                        <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src={article.image} alt={article.title} referrerPolicy="no-referrer" />
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-container overflow-hidden">
                          <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${article.progress}%` }}></div>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 flex flex-col pt-1 min-w-0">
                        <h3 className="font-manrope text-[16px] font-black leading-tight group-hover:text-primary transition-colors line-clamp-2 mb-1">{article.title}</h3>
                        <p className="text-[13px] font-normal text-secondary mb-2 truncate">{article.author}</p>

                        <div className="flex items-center gap-4 mt-auto font-normal text-secondary">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span className="text-[10px] font-bold">{article.views}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] font-bold">{article.readTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full bg-surface-container-low/50 border-2 border-dashed border-outline-variant/20 rounded-3xl p-20 text-center">
                    <BookOpen className="w-12 h-12 text-outline-variant mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-on-surface mb-2">Your reading list is empty</h3>
                    <p className="text-sm text-secondary max-w-sm mx-auto">Articles you save for later or start reading will appear here.</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {articles.length > 0 && (
                <footer className="mt-10 flex items-center justify-between border-t border-surface-container pt-5">
                  <p className="text-[9px] font-medium text-outline-variant uppercase tracking-widest">Showing {articles.length} saved articles</p>
                  <div className="flex gap-1">
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-secondary disabled:opacity-30">
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white font-bold text-[9px] shadow-md shadow-primary/20">1</button>
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-secondary">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </footer>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
