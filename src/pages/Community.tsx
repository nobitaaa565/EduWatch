import React, { useRef, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { Sidebar } from '../components/Sidebar';
import { 
  MessageSquare, 
  Users, 
  ChevronLeft,
  Calendar, 
  TrendingUp, 
  Plus, 
  ArrowBigUp,
  ArrowBigDown,
  Award,
  MoreHorizontal, 
  MessageCircle, 
  Share2,
  ChevronRight,
  Globe,
  Lock
} from 'lucide-react';
import { postService } from '../services/postService';
import { cn } from '../lib/utils';
import { useSidebar } from '../lib/SidebarContext';
import { PostSkeleton } from '../components/Skeleton';
import { motion, AnimatePresence } from 'motion/react';

const discussions = [
  {
    id: 1,
    title: "Scaling Microservices: Is gRPC the only way?",
    author: "Alex Rivera",
    authorImg: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80",
    category: "Architecture",
    replies: 42,
    likes: 156,
    time: "2h ago",
    tags: ["gRPC", "Microservices", "Performance"]
  },
  {
    id: 2,
    title: "The future of EdTech: VR vs. Traditional Digital Learning",
    author: "Sarah Chen, Ph.D.",
    authorImg: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80",
    category: "Pedagogy",
    replies: 89,
    likes: 312,
    time: "5h ago",
    tags: ["VR", "Pedagogy", "Future"]
  },
  {
    id: 3,
    title: "Rust in Production: Lessons learned after 1 year",
    author: "Liam Whitby",
    authorImg: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80",
    category: "Engineering",
    replies: 67,
    likes: 245,
    time: "1d ago",
    tags: ["Rust", "Production", "Backend"]
  }
];

const groups = [
  { name: "Distributed Systems", members: "12.4k", icon: Globe, type: "Public" },
  { name: "EdTech Innovators", members: "8.2k", icon: Users, type: "Public" },
  { name: "Senior Architects", members: "2.1k", icon: Lock, type: "Private" },
  { name: "Frontend Performance", members: "5.6k", icon: TrendingUp, type: "Public" }
];

const events = [
  { title: "Architecting for Resilience", date: "Oct 12, 2024", time: "10:00 AM PST", type: "Workshop", attendees: 450 },
  { title: "The Future of Learning Analytics", date: "Oct 15, 2024", time: "2:00 PM PST", type: "Webinar", attendees: 1200 }
];

const contributors = [
  { name: "Dr. Elena Rodriguez", role: "Inclusive Design", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80", points: "12.4k" },
  { name: "Prof. Liam Whitby", role: "Learning Analytics", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80", points: "10.1k" },
  { name: "Sophia J. Vance", role: "Platform Strategy", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80", points: "9.8k" }
];

const favorites: any[] = [];

export default function Community() {
  const navigate = useNavigate();
  const { isCollapsed, setCollapsed } = useSidebar();
  const [isLoading, setIsLoading] = React.useState(() => {
    return !sessionStorage.getItem('community_loaded');
  });
  const hasRestoredScroll = useRef(false);
  const mountTime = useRef(Date.now());

  const leftSidebarRef = useRef<HTMLElement>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // Restore scroll position instantly
    if (!isLoading && mainScrollRef.current && !hasRestoredScroll.current) {
      const savedScroll = sessionStorage.getItem('community_scroll_pos');
      if (savedScroll) {
        const scrollTarget = parseInt(savedScroll);
        
        // Instant restoration
        mainScrollRef.current.scrollTop = scrollTarget;
        
        // More aggressive retries
        const retries = [10, 50, 150, 300, 500];
        const timeoutIds = retries.map(ms => setTimeout(() => {
          if (mainScrollRef.current) {
            mainScrollRef.current.scrollTop = scrollTarget;
          }
        }, ms));
        
        hasRestoredScroll.current = true;
        return () => timeoutIds.forEach(clearTimeout);
      } else {
        hasRestoredScroll.current = true;
      }
    }
  }, [isLoading]);

  // Save scroll position periodically or on navigation
  useEffect(() => {
    const scrollContainer = mainScrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      sessionStorage.setItem('community_scroll_pos', scrollContainer.scrollTop.toString());
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Automatically expand sidebar on mount
  React.useEffect(() => {
    setCollapsed(false);
    
    // Simulate loading only if not already loaded in this session
    if (!sessionStorage.getItem('community_loaded')) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        sessionStorage.setItem('community_loaded', 'true');
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [setCollapsed]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/feed');
    }
  };

  return (
    <div className="min-h-screen bg-surface overflow-hidden">
      <TopBar />
      <main className="mt-[70px] h-[calc(100vh-70px)] overflow-hidden">
        <div 
          ref={pageContainerRef}
          className="flex flex-col lg:flex-row justify-between gap-6 lg:gap-10 relative w-full h-full px-4 md:px-10 lg:px-10 transition-all duration-300 ease-in-out"
        >
          
          {/* Left Navigation Sidebar */}
          <aside 
            ref={leftSidebarRef}
            className={cn(
            "hidden lg:block shrink-0 h-full overflow-y-auto no-scrollbar pt-6 pb-20 transition-all duration-300 ease-in-out",
            isCollapsed ? "w-[80px]" : "w-[350px]"
          )}>
            <Sidebar />
          </aside>

          {/* Main Content: Discussions */}
          <div 
            ref={mainScrollRef}
            className="w-full lg:flex-[1] min-w-0 h-full overflow-y-auto no-scrollbar pb-40 space-y-8"
          >
            <div className="max-w-[740px] mx-auto pt-6">
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-4 group"
              >
                <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[11px] font-black uppercase tracking-widest">Back</span>
              </button>
              
              <section className="mb-8">
                <div className="flex flex-col gap-3">
                  <h1 className="text-[41px] font-black text-on-surface tracking-tighter font-manrope">
                    Community <span className="text-primary">Hub</span>
                  </h1>
                  <p className="text-secondary text-lg leading-relaxed max-w-2xl">
                    Connect with fellow engineers, technical writers, and EdTech innovators.
                  </p>
                </div>
              </section>

              <div className="sticky -top-[1px] z-20 bg-surface flex items-end justify-between mb-8 border-b border-surface-container/50 pt-2 shadow-[0_-8px_0_0px_var(--color-surface)]">
                <div className="flex gap-8 px-1">
                  <button className="pb-4 border-b-2 border-primary text-primary font-black text-[11px] uppercase tracking-widest">Trending</button>
                  <button className="pb-4 border-b-2 border-transparent text-secondary font-black text-[11px] uppercase tracking-widest hover:text-primary transition-colors">Latest</button>
                  <button className="pb-4 border-b-2 border-transparent text-secondary font-black text-[11px] uppercase tracking-widest hover:text-primary transition-colors">Following</button>
                </div>
                <button className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-primary/20 mb-3">
                  <Plus className="w-4 h-4" /> Start Discussion
                </button>
              </div>

              <div className="space-y-6">
                {isLoading ? (
                  <div className="space-y-6">
                    {Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {discussions.map((post) => (
                        <div key={post.id} className="bg-surface-container-lowest p-6 rounded-2xl ambient-shadow border border-outline-variant/10 group hover:border-primary/20 transition-all mb-6">
                          <div className="flex items-start gap-4">
                            <img src={post.authorImg} alt={post.author} className="w-10 h-10 rounded-full shrink-0 border border-outline-variant/10" referrerPolicy="no-referrer" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-bold text-on-surface">{post.author}</span>
                                  <span className="text-[10px] text-outline-variant uppercase tracking-widest font-black">• {post.time}</span>
                                </div>
                                <button className="text-secondary hover:text-primary p-1.5 rounded-xl transition-colors">
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </div>
                              <h3 className="text-[19px] font-bold font-manrope mb-3 group-hover:text-primary transition-colors cursor-pointer leading-tight">{post.title}</h3>
                              <div className="flex items-center gap-2 pt-4 border-t border-surface-container overflow-x-auto no-scrollbar">
                                {/* Vote Controls (Simplified for Discussion items) */}
                                <div className="flex items-center bg-surface-container rounded-full p-0.5">
                                  <button 
                                    className="p-1.5 rounded-full hover:bg-outline-variant/10 text-secondary transition-all flex items-center gap-1"
                                  >
                                    <ArrowBigUp className="w-5 h-5" />
                                    <span className="text-xs font-black min-w-[12px] text-on-surface">
                                      {post.likes}
                                    </span>
                                  </button>
                                  <button 
                                    className="p-1.5 rounded-full hover:bg-outline-variant/10 text-secondary transition-all flex items-center gap-1"
                                  >
                                    <ArrowBigDown className="w-5 h-5" />
                                    <span className="text-xs font-black min-w-[12px] text-on-surface">
                                      0
                                    </span>
                                  </button>
                                </div>

                                {/* Comment Button */}
                                <button className="flex items-center gap-2 px-3 py-1.5 bg-surface-container hover:bg-outline-variant/10 rounded-full transition-all text-on-surface text-xs font-black">
                                  <MessageCircle className="w-5 h-5" />
                                  {post.replies}
                                </button>

                                {/* Award Button */}
                                <button className="p-1.5 px-3 bg-surface-container hover:bg-outline-variant/10 rounded-full transition-all text-on-surface">
                                  <Award className="w-5 h-5" />
                                </button>

                                {/* Share Button */}
                                <button className="flex items-center gap-2 px-3 py-1.5 bg-surface-container hover:bg-outline-variant/10 rounded-full transition-all text-on-surface ml-auto text-xs font-black">
                                  <Share2 className="w-5 h-5" />
                                  Share
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="hidden lg:block flex-[0_1_350px] min-w-0 h-full overflow-y-auto no-scrollbar pt-6 pb-20">
            <div className="space-y-6">
              {/* Active Groups */}
              <section className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/5">
                <h3 className="text-[11px] font-black text-secondary tracking-widest uppercase mb-6">Active Groups</h3>
                <div className="space-y-4">
                  {groups.map((group) => (
                    <div key={group.name} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                          <group.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{group.name}</h4>
                          <p className="text-[11px] text-secondary">{group.members} members</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-outline-variant">{group.type}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-8 py-2.5 rounded-xl border border-primary/20 text-primary font-bold text-xs hover:bg-primary hover:text-white transition-all">
                  Discover Groups
                </button>
              </section>

              {/* Upcoming Events */}
              <section className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 ambient-shadow">
                <h3 className="text-[11px] font-black text-secondary tracking-widest uppercase mb-6">Upcoming Events</h3>
                <div className="space-y-6">
                  {events.map((event) => (
                    <div key={event.title} className="flex gap-4 group cursor-pointer">
                      <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-primary/5 text-primary border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all">
                        <span className="text-[10px] font-black uppercase tracking-tighter">{event.date.split(' ')[0]}</span>
                        <span className="text-lg font-black leading-none">{event.date.split(' ')[1].replace(',', '')}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors leading-tight mb-1">{event.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-secondary font-bold uppercase tracking-widest">
                          <Calendar className="w-3 h-3" />
                          {event.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
