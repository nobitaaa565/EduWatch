import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { Sidebar } from '../components/Sidebar';
import { useSidebar } from '../lib/SidebarContext';
import { 
  ChevronLeft, 
  Bookmark, 
  Trash2, 
  GripVertical, 
  ArrowUp, 
  ArrowDown, 
  ExternalLink,
  BookOpen,
  Calendar,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { cn } from '../lib/utils';
import { postService, Post } from '../services/postService';

// Fallback high-resolution cover images list for bookmarks that don't have a direct cover image
const FALLBACK_COVERS = [
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800', // Blue digital globe
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800', // Green cybersecurity grid
  'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=800', // Code on screen
  'https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&q=80&w=800', // Tech circuit abstract
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800', // Laptop with code
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800', // Modern developer workspace
];

// Helper to deterministically assign a fallback cover image based on post info
const getDeterministicCover = (post: Post): string => {
  if (post.images && post.images.length > 0 && post.images[0]) {
    return post.images[0];
  }
  if (post.sharedPost?.image) {
    return post.sharedPost.image;
  }
  // Try to use a static image if it's an article from our static mock feed
  if ('image' in post && (post as any).image) {
    return (post as any).image;
  }

  // Fallback hash logic
  const stringToHash = post.title || post.content || post.id || '';
  let hash = 0;
  for (let i = 0; i < stringToHash.length; i++) {
    hash = stringToHash.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % FALLBACK_COVERS.length;
  return FALLBACK_COVERS[index];
};

export default function Bookmarks() {
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Drag and drop tracking states
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Load bookmarked posts on mount
  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        setLoading(true);
        // Get all articles + microposts
        const allPosts = await postService.getAllPosts();
        
        // Filter by bookmarked IDs
        const bookmarkedIds = postService.getBookmarkedPostIds();
        const bookmarkedPosts = allPosts.filter(p => bookmarkedIds.includes(p.id));

        // Load custom priority order list from localStorage
        const savedOrder = JSON.parse(localStorage.getItem('bookmarks_order') || '[]');
        
        // Arrange bookmarks based on savedOrder indexes
        const sortedBookmarks = [...bookmarkedPosts].sort((a, b) => {
          const indexA = savedOrder.indexOf(a.id);
          const indexB = savedOrder.indexOf(b.id);
          
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;  // Unordered files go to the end
          if (indexB === -1) return -1;
          return indexA - indexB;
        });

        setBookmarks(sortedBookmarks);

        // Keep the latest ordered synced saved back in case of some new additions
        const initialOrder = sortedBookmarks.map(b => b.id);
        localStorage.setItem('bookmarks_order', JSON.stringify(initialOrder));
      } catch (err) {
        console.error('Error fetching bookmarks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, []);

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    // Standard visual feedback for HTML5 Drag & Drop
    e.dataTransfer.effectAllowed = 'move';
    // Small browser trick to help customize drag representation
    const tempDiv = document.createElement('div');
    tempDiv.style.opacity = '0';
    document.body.appendChild(tempDiv);
    e.dataTransfer.setDragImage(tempDiv, 0, 0);
    setTimeout(() => document.body.removeChild(tempDiv), 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    reorderItems(draggedIndex, targetIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Reordering function
  const reorderItems = (fromIndex: number, toIndex: number) => {
    const updated = [...bookmarks];
    const [draggedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, draggedItem);
    
    setBookmarks(updated);
    
    // Persist new order
    const newOrder = updated.map(b => b.id);
    localStorage.setItem('bookmarks_order', JSON.stringify(newOrder));
  };

  // Move priority up or down programmatically (great for mobile and accessibility)
  const movePriority = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= bookmarks.length) return;
    reorderItems(index, targetIndex);
  };

  // Remove a bookmark
  const handleRemoveBookmark = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation(); // Avoid triggering navigation clicks
    postService.toggleBookmark(postId);
    const updated = bookmarks.filter(b => b.id !== postId);
    setBookmarks(updated);

    // Save synced order
    const newOrder = updated.map(b => b.id);
    localStorage.setItem('bookmarks_order', JSON.stringify(newOrder));
  };

  // Truncate logic for beautiful grid card presentation
  const truncateText = (text: string, length: number) => {
    if (!text) return '';
    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    if (cleanText.length <= length) return cleanText;
    return cleanText.substring(0, length) + '...';
  };

  const navigateToPost = (post: Post) => {
    if (post.format === 'micropost') {
      navigate(`/micro-post/${post.id}`);
    } else {
      navigate(`/article/${post.id}`);
    }
  };

  return (
    <div id="bookmarks-root" className="h-screen bg-surface overflow-hidden flex flex-col">
      <TopBar />
      <main id="bookmarks-main" className="mt-[70px] flex-1 overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between gap-6 lg:gap-10 relative w-full h-full px-4 md:px-10 lg:px-10 transition-all duration-300 ease-in-out">
          
          {/* Left Navigation Sidebar */}
          <aside className={cn(
            "hidden lg:block shrink-0 h-full overflow-y-auto no-scrollbar pt-6 pb-20 transition-all duration-300 ease-in-out",
            isCollapsed ? "w-[80px]" : "w-[340px]"
          )}>
            <Sidebar />
          </aside>

          {/* Main Content Area */}
          <div className="w-full lg:flex-[1] min-w-0 h-full overflow-y-auto no-scrollbar pt-6 pb-40 space-y-6">
            <div className="max-w-[1200px] mx-auto">
              
              {/* Back Button and Page Heading */}
              <section className="mb-6 pt-0">
                <button 
                  id="btn-bookmarks-back"
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-4 group w-fit"
                  title="Go Back"
                >
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="text-[11px] font-black uppercase tracking-widest">Back</span>
                </button>
                <div className="flex flex-col gap-2 transition-all duration-300">
                  <h1 className="text-2xl font-black text-on-surface tracking-tighter font-manrope flex items-center gap-3">
                    <Bookmark className="w-6 h-6 text-primary" />
                    <span>My <span className="text-primary">Bookmarks</span></span>
                  </h1>
                  <p className="text-secondary text-[13px] font-medium max-w-2xl">
                    Organize your high-priority posts. Drag-and-drop cards to rank their study priority or click the helper arrows on the side.
                  </p>
                </div>
              </section>

              {/* Grid content container */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl h-[330px] animate-pulse p-4 flex flex-col gap-4">
                      <div className="aspect-[16/10] bg-outline-variant/15 w-full rounded-xl shrink-0" />
                      <div className="h-4 bg-outline-variant/15 w-3/4 rounded" />
                      <div className="h-3 bg-outline-variant/15 w-1/2 rounded" />
                      <div className="mt-auto h-8 bg-outline-variant/15 w-full rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : bookmarks.length > 0 ? (
                <div 
                  id="bookmarks-grid"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 select-none"
                >
                  {bookmarks.map((bookmark, index) => {
                    const coverImg = getDeterministicCover(bookmark);
                    const showTitle = bookmark.title ? bookmark.title : `Micro-post by ${bookmark.authorName}`;
                    const isDragged = draggedIndex === index;
                    const isOver = dragOverIndex === index;

                    return (
                      <div 
                        key={bookmark.id}
                        id={`bookmark-card-${bookmark.id}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={() => setDragOverIndex(null)}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, index)}
                        className={cn(
                          "group animate-in fade-in slide-in-from-bottom-3 duration-200 cursor-grab flex flex-col bg-surface-container-lowest rounded-2xl border transition-all relative overflow-hidden",
                          isDragged ? "opacity-35 scale-[0.98] border-primary/40 rotate-[1deg]" : "hover:shadow-md hover:-translate-y-0.5",
                          isOver ? "border-primary/80 border-dashed bg-primary/5 ring-2 ring-primary/20 scale-[1.02]" : "border-outline-variant/10",
                          "h-[350px]"
                        )}
                        onClick={() => navigateToPost(bookmark)}
                      >
                        {/* Priority Badge */}
                        <div className="absolute top-3 left-3 z-10 font-manrope font-black text-[9px] uppercase tracking-widest text-white px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md flex items-center gap-1">
                          <span className="text-primary font-bold">#</span>{index + 1}
                        </div>

                        {/* Top action buttons overlaying the cover */}
                        <div className="absolute top-3 right-3 z-10 flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
                          {/* Reorder Arrows for Mobile/Touch Access */}
                          <div className="flex bg-black/60 backdrop-blur-md rounded-full overflow-hidden border border-white/10">
                            <button
                              id={`btn-priority-up-${bookmark.id}`}
                              disabled={index === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                movePriority(index, 'up');
                              }}
                              className="p-1.5 text-white hover:text-primary transition-colors disabled:opacity-30 disabled:hover:text-white"
                              title="Increase Priority (Move Up)"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              id={`btn-priority-down-${bookmark.id}`}
                              disabled={index === bookmarks.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                movePriority(index, 'down');
                              }}
                              className="p-1.5 text-white hover:text-primary transition-colors disabled:opacity-30 disabled:hover:text-white border-l border-white/5"
                              title="Decrease Priority (Move Down)"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Quick delete bookmark button */}
                          <button
                            id={`btn-remove-bookmark-${bookmark.id}`}
                            onClick={(e) => handleRemoveBookmark(e, bookmark.id)}
                            className="p-1.5 rounded-full bg-black/60 shadow hover:bg-tertiary text-white transition-colors border border-white/10"
                            title="Remove Bookmark"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Card Cover Image */}
                        <div className="relative aspect-[16/10] overflow-hidden bg-surface-container-high border-b border-outline-variant/5">
                          <img 
                            src={coverImg} 
                            alt={showTitle} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                          {/* Drag Overlay visual indicator */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                          
                          {/* Format Indicator Badge */}
                          <div className="absolute bottom-2.5 left-3 text-[8.5px] font-black uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-md backdrop-blur-sm border border-primary/25">
                            {bookmark.format === 'micropost' ? 'Micro-post' : 'Article'}
                          </div>
                        </div>

                        {/* Card Details/Metadata Section */}
                        <div className="flex-1 p-4 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            {/* Author Row */}
                            <div className="flex items-center gap-1.5 text-secondary text-[11px] font-bold">
                              <span>by</span>
                              <span className="text-on-surface hover:underline line-clamp-1 truncate font-black">{bookmark.authorName}</span>
                            </div>

                            {/* Post title */}
                            <h3 className="text-sm font-black text-on-surface line-clamp-2 leading-tight font-manrope group-hover:text-primary transition-colors">
                              {truncateText(showTitle, 55)}
                            </h3>

                            {/* Extra description or content preview snippet */}
                            <p className="text-[11.5px] font-medium text-secondary line-clamp-2 leading-relaxed">
                              {truncateText(bookmark.subtitle || bookmark.content, 90)}
                            </p>
                          </div>

                          {/* Bottom Row Statistics and Drag handle info */}
                          <div className="flex items-center justify-between border-t border-outline-variant/10 pt-2.5 mt-2">
                            <div className="flex items-center gap-3 text-[10px] font-bold text-secondary">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{bookmark.createdAt ? bookmark.createdAt.split('T')[0] : 'May 2024'}</span>
                              </span>
                              {bookmark.readTime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{typeof bookmark.readTime === 'number' ? `${bookmark.readTime} min` : String(bookmark.readTime).replace(' Read', '')}</span>
                                </span>
                              )}
                            </div>

                            {/* Tiny drag indicator icon for layout honesty */}
                            <div 
                              className="flex items-center text-secondary/60 group-hover:text-primary/80 transition-colors"
                              title="Drag card to prioritize"
                            >
                              <GripVertical className="w-4 h-4 cursor-grab active:cursor-grabbing" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div id="bookmarks-empty-box" className="bg-surface-container-low/50 border-2 border-dashed border-outline-variant/15 rounded-3xl p-16 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <LayoutGrid className="w-12 h-12 text-outline-variant mx-auto mb-4 opacity-40 animate-pulse" />
                  <h3 className="text-lg font-black text-on-surface mb-2 font-manrope">Your Reading Bookmarks are Empty</h3>
                  <p className="text-[13px] text-secondary max-w-sm mx-auto leading-relaxed">
                    Once you start starring interesting technical articles or educational micro-posts from your feed, they will appear in this list.
                  </p>
                  <button 
                    id="btn-bookmarks-explore"
                    onClick={() => navigate('/feed')}
                    className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:brightness-110 active:scale-95 text-white font-black text-xs uppercase tracking-widest rounded-full shadow-lg shadow-primary/15 transition-all"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Explore Feed</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
