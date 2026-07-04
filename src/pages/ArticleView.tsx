import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { useAuth } from '../lib/AuthContext';
import { feed } from '../lib/feedData';
import { useInterests } from '../lib/useInterests';
import { postService } from '../services/postService';
import { useSocial } from '../lib/social';
import { userService } from '../services/userService';
import { Sidebar } from '../components/Sidebar';
import { useSidebar } from '../lib/SidebarContext';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, 
  Bookmark, 
  Share2, 
  Heart, 
  MessageSquare, 
  Clock, 
  Calendar,
  ChevronRight,
  MoreHorizontal,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  ThumbsUp,
  ThumbsDown,
  ArrowBigUp,
  ArrowBigDown,
  Reply,
  Paperclip,
  ImageIcon,
  Send,
  X,
  Users,
  Check,
  UserCircle
} from 'lucide-react';
import { motion, useScroll, useSpring, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { HashtagText } from '../components/HashtagText';
import { formatElapsedTime } from '../lib/dateUtils';
import { estimateReadTime } from '../algorithms/content';

const contentStyles = `
  .preview-content blockquote {
    border-left: 4px solid var(--primary);
    padding-left: 1.25rem;
    padding-top: 0.625rem;
    padding-bottom: 0.625rem;
    margin: 1.5rem 0;
    background-color: var(--surface-container-low);
    border-top-right-radius: 0.75rem;
    border-bottom-right-radius: 0.75rem;
    font-style: italic;
    font-size: 0.95rem;
    color: var(--secondary);
    text-align: left;
  }
  .preview-content blockquote p {
    margin: 0;
  }
  .preview-content a {
    color: var(--primary);
    text-decoration: underline;
    cursor: pointer;
  }
  .preview-content a:hover {
    color: var(--primary-container);
  }
  .preview-content img {
    border-radius: 0.75rem;
    max-width: 100%;
    height: auto;
    margin: 1.5rem auto;
    display: block;
  }
  .preview-content ul {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin: 1rem 0;
  }
  .preview-content ol {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin: 1rem 0;
  }
  .preview-content li {
    margin: 0.35rem 0;
  }
  .preview-content h1 {
    font-size: 1.5rem;
    font-weight: 800;
    margin: 2rem 0 1rem;
    font-family: inherit;
    line-height: 1.2;
    color: var(--on-surface);
  }
  .preview-content h2 {
    font-size: 1.25rem;
    font-weight: 800;
    margin: 1.75rem 0 0.85rem;
    font-family: inherit;
    line-height: 1.2;
    color: var(--on-surface);
  }
  .preview-content h3 {
    font-size: 1.1rem;
    font-weight: 700;
    margin: 1.5rem 0 0.75rem;
    font-family: inherit;
    line-height: 1.2;
    color: var(--on-surface);
  }
  .preview-content p {
    margin: 1rem 0;
    line-height: 1.6;
  }
`;

interface Attachment {
  name: string;
  url: string;
  type: string;
}

interface Comment {
  id: string;
  author: {
    name: string;
    img: string;
  };
  text: string;
  timestamp: string;
  likes: number;
  dislikes: number;
  replies: Comment[];
  attachments?: Attachment[];
}

export default function ArticleView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { trackInteraction } = useInterests();
  const { 
    following, 
    toggleFollow 
  } = useSocial();
  const { isCollapsed } = useSidebar();
  
  const staticFound = feed.find(item => item.id === id);
  // Find article in feed
  const [localArticle, setLocalArticle] = useState<any>(null);
  const articleData = staticFound || localArticle;
  const [isLoading, setIsLoading] = useState(!articleData);

  const authorNameLocal = articleData?.author || articleData?.authorName || 'Anonymous';
  const authorUsername = authorNameLocal.toLowerCase().replace(/\s/g, '_');
  const isFollowingAuthor = following.includes(authorUsername);
  const isSelf = user && (
    user.fullName?.toLowerCase().trim() === authorNameLocal.toLowerCase().trim() ||
    user.username?.toLowerCase().trim() === authorUsername.toLowerCase().trim()
  );

  const [dbAuthorProfile, setDbAuthorProfile] = useState<any>(null);

  useEffect(() => {
    if (!authorUsername) return;
    const fetchAuthorDbProfile = async () => {
      try {
        const profile = await userService.getUserByUsername(authorUsername);
        if (profile) {
          setDbAuthorProfile(profile);
        }
      } catch (err) {
        console.error("Error fetching author db profile", err);
      }
    };
    fetchAuthorDbProfile();
  }, [authorUsername]);

  const [comments, setComments] = useState<any[]>([]);

  const loadComments = () => {
    if (id) {
      const fetched = postService.getComments(id);
      setComments(fetched);
    }
  };

  useEffect(() => {
    if (!id) return;

    // Load initial counts / comments from local cache instantly
    const fetchLocal = async () => {
      try {
        const posts = await postService.getGlobalFeed();
        const found = posts.find(p => p.id === id);
        if (found) setLocalArticle(found);
        loadComments();
      } catch (err) {
        console.error("fetchLocal error", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLocal();

    // Subscribe to real-time post changes via Supabase
    const channel = supabase
      .channel(`post-${id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'posts', filter: `id=eq.${id}` },
        async () => {
          const { data } = await supabase.from('posts').select('*, users!inner(full_name, username, avatar_url)').eq('id', id).single();
          if (data) {
            const upvotesVal = 0;
            const downvotesVal = 0;

            const intKey = `interactions_${id}`;
            const commentsVal = data.comments || 0;
            const sharesVal = data.shares || 0;
            localStorage.setItem(intKey, JSON.stringify({ upvotes: upvotesVal, downvotes: downvotesVal, comments: commentsVal, shares: sharesVal }));

            setLocalArticle({
              id,
              authorId: data.author_id,
              authorName: data.users?.full_name || '',
              authorImage: data.users?.avatar_url || '',
              title: data.title || '',
              subtitle: data.subtitle || '',
              content: data.content || '',
              format: data.format,
              privacy: data.privacy,
              readTime: Math.max(1, Math.ceil((data.content || '').split(/\s+/).length / 200)),
              words: (data.content || '').split(/\s+/).length,
              createdAt: data.created_at,
              likes: upvotesVal,
              upvotes: upvotesVal,
              downvotes: downvotesVal,
              comments: commentsVal,
              shares: sharesVal,
              saves: 0,
              commentsEnabled: data.comments_enabled,
            } as any);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    if (articleData) {
      trackInteraction(articleData.id, articleData.tags, articleData.author);
      try {
        const stored = localStorage.getItem('recently_viewed_articles');
        let list: any[] = [];
        if (stored) {
          list = JSON.parse(stored);
        }
        if (!Array.isArray(list)) {
          list = [];
        }
        const calcReadTimeVal = estimateReadTime(articleData.content || articleData.description || '');
        const readTimeStr = `${calcReadTimeVal} Min Read`;
        list = list.filter((item: any) => item && item.id !== articleData.id);
        list.unshift({
          id: articleData.id,
          title: articleData.title || '',
          image: articleData.image || (articleData.images?.[0]) || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600',
          readTime: readTimeStr,
          authorName: articleData.author || articleData.authorName || 'Anonymous',
          date: articleData.date || 'Today'
        });
        list = list.slice(0, 10);
        localStorage.setItem('recently_viewed_articles', JSON.stringify(list));
      } catch (err) {
        console.error("Failed to update recently viewed articles", err);
      }
    }
  }, [id, articleData]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: scrollContainerRef });
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [isDownvoted, setIsDownvoted] = useState(false);

  useEffect(() => {
    if (id && articleData) {
      const liked = postService.isPostLiked(id);
      setIsLiked(liked);
      setIsDownvoted(postService.isPostDownvoted(id));
      
      if (id.startsWith('static')) {
        const extra = postService.getExtraInteractions(id);
        const baseUpvotes = 'likes' in articleData ? (typeof articleData.likes === 'number' ? articleData.likes : 0) : 0;
        setUpvotes(baseUpvotes + (extra.upvotes || 0));
        setDownvotes(extra.downvotes || 0);
      } else {
        setUpvotes(articleData.upvotes || 0);
        setDownvotes(articleData.downvotes || 0);
      }
    }
  }, [id, articleData]);

  const [newComment, setNewComment] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom Share Menu states
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isShareOpenMobile, setIsShareOpenMobile] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareComment, setShareComment] = useState('');
  const [isSharePosting, setIsSharePosting] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const shareMobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(event.target as Node)) {
        setIsShareOpen(false);
      }
      if (shareMobileRef.current && !shareMobileRef.current.contains(event.target as Node)) {
        setIsShareOpenMobile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLikeArticle = async () => {
    if (id) {
      const result = await postService.toggleLike(id);
      setIsLiked(result.isLiked);
      setIsDownvoted(false);
      setUpvotes(result.upvotes);
      setDownvotes(result.downvotes);
    }
  };

  const handleDownvoteArticle = async () => {
    if (id) {
      const result = await postService.toggleDownvote(id);
      setIsDownvoted(result.isDownvoted);
      setIsLiked(false);
      setUpvotes(result.upvotes);
      setDownvotes(result.downvotes);
    }
  };

  const handleAddComment = async (parentId?: string) => {
    if (!newComment.trim() && attachments.length === 0) return;
    if (!id) return;

    const commentData = {
      authorId: user?.id || 'guest',
      authorName: user?.fullName || user?.username || "EduWatch",
      authorImage: user?.profileImage || `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}`,
      text: newComment
    };

    if (parentId) {
      postService.addReply(id, parentId, commentData);
    } else {
      await postService.addComment(id, commentData);
    }

    setComments(postService.getComments(id));
    setNewComment("");
    setAttachments([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleBack = () => {
    navigate(-1);
  };

  const calculatedReadTimeVal = estimateReadTime(articleData?.content || articleData?.description || '');
  const article = articleData ? {
    title: articleData.title || '',
    subtitle: articleData.description || '',
    author: {
      name: dbAuthorProfile?.fullName || articleData.author || articleData.authorName || 'Anonymous',
      role: dbAuthorProfile?.stats?.contributorRank || "Platform Contributor",
      bio: dbAuthorProfile?.bio || "An industry recognized expert and top contributor to technical journals and academic research.",
      img: dbAuthorProfile?.profileImage || articleData.authorImage || `https://i.pravatar.cc/100?u=${articleData.author || articleData.authorName || 'anon'}`
    },
    date: articleData.date || 'Today',
    readTime: `${calculatedReadTimeVal} Min Read`,
    image: articleData.image || (articleData.images?.[0]) || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600',
    tags: articleData.tags || (articleData.categories || []),
    taggedUsers: articleData.taggedUsers || [],
    location: articleData.location || ''
  } : null;

  return (
    <div className="h-screen bg-surface overflow-hidden">
      {/* Reading Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-[60] origin-left"
        style={{ scaleX }}
      />
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

          {/* Main Content Area */}
          <div ref={scrollContainerRef} className="w-full lg:flex-[1] min-w-0 h-full overflow-y-auto no-scrollbar pt-6 pb-40">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
                <div className="w-10 h-10 border-4 border-primary/25 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-secondary text-sm font-bold uppercase tracking-widest animate-pulse">Loading technical article...</p>
              </div>
            ) : !article ? (
              <div className="text-center py-20 max-w-md mx-auto min-h-[400px] flex flex-col justify-center items-center">
                <h2 className="text-2xl font-black mb-4 font-manrope text-on-surface">Article Not Found</h2>
                <p className="text-secondary text-sm mb-6">The article you are looking for does not exist or may have been deleted.</p>
                <button onClick={() => navigate('/feed')} className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:brightness-110 active:scale-95 transition-all">Return Home</button>
              </div>
            ) : (
              <>
                {/* Article Header */}
                <header className="mb-12 max-w-5xl mx-auto">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-6 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Back</span>
          </button>

          <div className="flex items-center gap-2.5 mb-5">
            <div className="flex items-center gap-1 text-secondary text-[9px] font-bold uppercase tracking-widest">
              <Clock className="w-3 h-3" />
              {article.readTime}
            </div>
            <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
            <div className="flex items-center gap-1 text-secondary text-[9px] font-bold uppercase tracking-widest">
              <Calendar className="w-3 h-3" />
              {article.date}
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-on-surface leading-[1.1] tracking-tighter mb-6 font-manrope">
            {article.title}
          </h1>
          
          {(article.taggedUsers && article.taggedUsers.length > 0 || article.location) && (
            <p className="text-sm text-secondary font-bold mb-6">
              {article.taggedUsers && article.taggedUsers.length > 0 && (
                <>with <span className="text-on-surface">
                  {article.taggedUsers.length === 1 && article.taggedUsers[0].name}
                  {article.taggedUsers.length === 2 && `${article.taggedUsers[0].name} and ${article.taggedUsers[1].name}`}
                  {article.taggedUsers.length === 3 && `${article.taggedUsers[0].name}, ${article.taggedUsers[1].name} and ${article.taggedUsers[2].name}`}
                  {article.taggedUsers.length === 4 && `${article.taggedUsers[0].name}, ${article.taggedUsers[1].name}, ${article.taggedUsers[2].name} and ${article.taggedUsers[3].name}`}
                  {article.taggedUsers.length > 4 && `${article.taggedUsers[0].name}, ${article.taggedUsers[1].name}, ${article.taggedUsers[2].name}, ${article.taggedUsers[3].name} and ${article.taggedUsers.length - 4} ${article.taggedUsers.length - 4 === 1 ? 'other' : 'others'}`}
                </span></>
              )}
              {article.location && (
                <>{article.taggedUsers && article.taggedUsers.length > 0 ? ' at ' : 'is at '}<span className="text-on-surface">{article.location}</span></>
              )}
            </p>
          )}
          
          <p className="text-lg md:text-xl text-secondary leading-relaxed font-medium mb-10">
            {article.subtitle}
          </p>
        </header>

        {/* Hero Image */}
        <div className="mb-8 md:mb-16 max-w-5xl mx-auto">
          <div className="aspect-[21/9] rounded-[32px] overflow-hidden ambient-shadow">
            <img 
              src={article.image} 
              alt="Article Hero" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Mobile/Tablet Actions Panel */}
        <div className="lg:hidden flex items-center justify-between py-4 px-6 mb-8 bg-surface-container-low rounded-2xl border border-outline-variant/10 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 bg-surface-container rounded-full p-1 border border-outline-variant/10">
            <button 
              onClick={handleLikeArticle}
              className={cn(
                "p-2 rounded-full transition-all flex items-center gap-1.5",
                isLiked ? "text-[#22c55e] bg-[#22c55e]/10" : "text-secondary hover:text-[#22c55e] hover:bg-[#22c55e]/10"
              )}
            >
              <ArrowBigUp className={cn("w-5 h-5", isLiked && "fill-[#22c55e]")} />
              <span className={cn("text-[11px] font-black", isLiked ? "text-[#22c55e]" : "text-on-surface")}>
                {upvotes}
              </span>
            </button>
            <button 
              onClick={handleDownvoteArticle}
              className={cn(
                "p-2 rounded-full transition-all flex items-center gap-1.5",
                isDownvoted ? "text-[#ef4444] bg-[#ef4444]/10" : "text-secondary hover:text-[#ef4444] hover:bg-[#ef4444]/10"
              )}
            >
              <ArrowBigDown className={cn("w-5 h-5", isDownvoted && "fill-[#ef4444]")} />
              <span className={cn("text-[11px] font-black", isDownvoted ? "text-[#ef4444]" : "text-secondary")}>
                {downvotes}
              </span>
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            {articleData?.commentsEnabled !== false && (
              <button 
                onClick={() => {
                  const el = document.getElementById('comments-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="p-3 rounded-full bg-surface-container-normal text-secondary hover:text-primary transition-all border border-outline-variant/10 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={cn(
                "p-3 rounded-full transition-all border border-outline-variant/10 cursor-pointer",
                isBookmarked ? "bg-primary text-white" : "bg-surface-container-normal text-secondary hover:text-primary"
              )}
            >
              <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-white")} />
            </button>
            
            {/* Share Menu mobile inline */}
            <div className="relative" ref={shareMobileRef}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsShareOpenMobile(!isShareOpenMobile);
                }}
                className="p-3 rounded-full bg-surface-container-normal text-secondary hover:text-primary transition-all border border-outline-variant/10 cursor-pointer"
                aria-label="Share options"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {isShareOpenMobile && (
                <div className="absolute right-0 bottom-full mb-2 z-[100] w-48 bg-surface-container-lowest border border-outline-variant/15 shadow-xl rounded-xl p-1 animate-in fade-in slide-in-from-bottom-1 text-left" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsShareOpenMobile(false);
                      setIsShareModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container rounded-lg transition-all text-left cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-secondary shrink-0" />
                    <span>Share to Timeline</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (articleData) {
                        const postUrl = `${window.location.origin}/article/${articleData.id}`;
                        navigator.clipboard.writeText(postUrl).then(() => {
                          setCopied(true);
                          setTimeout(() => {
                              setCopied(false);
                              setIsShareOpenMobile(false);
                          }, 1200);
                        });
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container rounded-lg transition-all text-left cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-[#22c55e] shrink-0" />
                        <span className="text-[#22c55e]">✓ Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-4 h-4 text-secondary shrink-0" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="max-w-5xl mx-auto grid grid-cols-12 gap-12">
          {/* Left Sidebar - Social Share */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="flex flex-col gap-3 items-center sticky top-24">
              <div className="flex flex-col items-center bg-surface-container-low rounded-full p-1 border border-outline-variant/10">
                <button 
                  onClick={handleLikeArticle}
                  className={cn(
                    "p-2.5 rounded-full transition-all group",
                    isLiked ? "bg-[#22c55e] text-white" : "text-secondary hover:text-[#22c55e] hover:bg-[#22c55e]/10"
                  )}
                  title="Upvote"
                >
                  <ArrowBigUp className={cn("w-5 h-5", isLiked && "fill-white")} />
                </button>
                <span className={cn("text-[11px] font-black my-0.5", isLiked ? "text-[#22c55e]" : "text-on-surface")}>
                  {upvotes}
                </span>
                <span className={cn("text-[11px] font-black my-0.5", isDownvoted ? "text-[#ef4444]" : "text-secondary")}>
                  {downvotes}
                </span>
                <button 
                  onClick={handleDownvoteArticle}
                  className={cn(
                    "p-2.5 rounded-full transition-all group",
                    isDownvoted ? "bg-[#ef4444] text-white" : "text-secondary hover:text-[#ef4444] hover:bg-[#ef4444]/10"
                  )}
                  title="Downvote"
                >
                  <ArrowBigDown className={cn("w-5 h-5", isDownvoted && "fill-white")} />
                </button>
              </div>
              
              <div className="flex flex-col gap-2 items-center mt-2">
                {articleData?.commentsEnabled !== false && (
                  <button 
                    onClick={() => {
                      const el = document.getElementById('comments-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="p-3 rounded-full bg-surface-container-low text-secondary hover:text-primary transition-all border border-outline-variant/10"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className={cn(
                    "p-3 rounded-full transition-all border border-outline-variant/10",
                    isBookmarked ? "bg-primary text-white" : "bg-surface-container-low text-secondary hover:text-primary"
                  )}
                >
                  <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-white")} />
                </button>
                <div className="w-6 h-[1px] bg-outline-variant/20 my-1.5"></div>
                <button className="p-3 rounded-full bg-surface-container-low text-secondary hover:text-[#1DA1F2] transition-all border border-outline-variant/10">
                  <Twitter className="w-4 h-4" />
                </button>
                <button className="p-3 rounded-full bg-surface-container-low text-secondary hover:text-[#0A66C2] transition-all border border-outline-variant/10">
                  <Linkedin className="w-4 h-4" />
                </button>
                {/* Share Button containing relative dropdown options and portal modal */}
                <div className="relative" ref={shareRef}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsShareOpen(!isShareOpen);
                    }}
                    className="p-3 rounded-full bg-surface-container-low text-secondary hover:text-primary transition-all border border-outline-variant/10 cursor-pointer"
                    aria-label="Share options"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  {isShareOpen && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[100] w-48 bg-surface-container-lowest border border-outline-variant/15 shadow-xl rounded-xl p-1 animate-in fade-in slide-in-from-left-1 text-left" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsShareOpen(false);
                          setIsShareModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container rounded-lg transition-all text-left cursor-pointer"
                      >
                        <Share2 className="w-4 h-4 text-secondary shrink-0" />
                        <span>Share to Timeline</span>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (articleData) {
                            const postUrl = `${window.location.origin}/article/${articleData.id}`;
                            navigator.clipboard.writeText(postUrl).then(() => {
                              setCopied(true);
                              setTimeout(() => {
                                  setCopied(false);
                                  setIsShareOpen(false);
                              }, 1200);
                            });
                          }
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container rounded-lg transition-all text-left cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-[#22c55e] shrink-0" />
                            <span className="text-[#22c55e]">✓ Link Copied!</span>
                          </>
                        ) : (
                          <>
                            <LinkIcon className="w-4 h-4 text-secondary shrink-0" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Dynamic Share Modal Backdrop (Portal style) */}
                {isShareModalOpen && articleData && createPortal(
                  <div 
                    className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsShareModalOpen(false);
                    }}
                  >
                    <div 
                      className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl border border-outline-variant/15 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-left max-h-[90vh]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between px-6 py-4.5 border-b border-outline-variant/10">
                        <h3 className="text-base font-black tracking-tight text-on-surface text-left">Share to Timeline</h3>
                        <button 
                          onClick={() => setIsShareModalOpen(false)}
                          className="p-1 px-1.5 rounded-full hover:bg-outline-variant/10 text-secondary transition-all cursor-pointer"
                        >
                          <X className="w-5 h-5 text-on-surface" />
                        </button>
                      </div>

                      {/* Scrollable container for modal contents */}
                      <div className="flex-1 overflow-y-auto no-scrollbar pb-2">
                        {/* Author / Info row */}
                        <div className="flex items-center gap-3 px-6 pt-5 text-left">
                          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-outline-variant/10 bg-surface-container-low">
                            {user?.profileImage ? (
                              <img src={user.profileImage} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-secondary text-sm">
                                {user?.fullName?.substring(0, 1) || 'U'}
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-[14px] font-bold text-on-surface">{user?.fullName || 'User'}</h4>
                            <span className="text-[10px] text-primary/80 bg-primary/5 px-2 py-0.5 rounded font-black uppercase tracking-wider">Public Timeline</span>
                          </div>
                        </div>

                        {/* Input text comment */}
                        <div className="px-6 py-4 text-left">
                          <textarea 
                            value={shareComment} 
                            onChange={(e) => setShareComment(e.target.value)}
                            placeholder="Say something about this article..." 
                            className="w-full h-32 bg-transparent text-[15px] leading-relaxed text-on-surface placeholder:text-outline-variant/80 font-medium resize-none border-none focus:ring-0 focus:outline-none p-0"
                          />
                        </div>

                        {/* Original Post Preview Box embedded nicely inside */}
                        <div className="mx-6 mb-5 p-5 border border-outline-variant/20 rounded-xl bg-surface-container/30 text-left overflow-y-auto max-h-72 no-scrollbar">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[11px] font-bold text-on-surface">{((articleData as any).author || (articleData as any).authorName) || 'Author'}</span>
                            <span className="text-[10px] text-secondary">• {((articleData as any).format || 'article') === 'article' ? 'Article' : 'Micro-post'}</span>
                          </div>
                          {articleData.title && <h5 className="text-[14px] font-bold text-on-surface mb-1.5">{articleData.title}</h5>}
                          <p className="text-[13px] text-secondary line-clamp-3 leading-relaxed">
                            {(((articleData as any).description || (articleData as any).content || "") as string).replace(/<[^>]*>/g, '')}
                          </p>
                          {((articleData as any).image || ((articleData as any).images && (articleData as any).images.length > 0)) && (
                            <div className="mt-3.5 aspect-video w-full rounded-lg overflow-hidden bg-outline-variant/5 border border-outline-variant/10">
                              <img 
                                src={(articleData as any).image || (articleData as any).images?.[0]} 
                                alt="" 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer" 
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Share Footer */}
                      <div className="flex items-center justify-end gap-2 px-6 py-4 bg-surface-container-low/50 border-t border-outline-variant/10 text-left shrink-0 font-bold">
                        <button 
                          disabled={isSharePosting}
                          onClick={() => setIsShareModalOpen(false)}
                          className="px-4 py-2 text-xs font-black text-secondary hover:text-on-surface rounded-full hover:bg-outline-variant/10 transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          disabled={isSharePosting}
                          onClick={async () => {
                            setIsSharePosting(true);
                            try {
                              // 1. Record share in Supabase
                              try {
                                const { data: { user } } = await supabase.auth.getUser();
                                if (user) {
                                  const { data: userRow } = await supabase
                                    .from('users')
                                    .select('id')
                                    .eq('auth_id', user.id)
                                    .single();
                                  if (userRow) {
                                    await supabase
                                      .from('post_shares')
                                      .insert({ post_id: articleData.id, user_id: userRow.id });
                                  }
                                }
                              } catch (cErr) {
                                console.warn("Couldn't write share increment to DB, using fallback", cErr);
                              }

                              // 2. Publish new shared post on usertimeline
                              await postService.createPost({
                                authorId: user?.id || 'guest',
                                authorName: user?.fullName || 'User',
                                authorImage: user?.profileImage || '',
                                title: '',
                                content: shareComment || `Shared an article by ${((articleData as any).author || (articleData as any).authorName)}`,
                                format: 'article',
                                privacy: 'public',
                                commentsEnabled: true,
                                sharedPost: {
                                  id: articleData.id,
                                  authorName: (articleData as any).author || (articleData as any).authorName,
                                  authorImage: ('authorImage' in articleData && articleData.authorImage) ? articleData.authorImage : '',
                                  title: articleData.title,
                                  content: (articleData as any).description || (articleData as any).content,
                                  format: (articleData as any).format || 'article',
                                  image: (articleData as any).image || ((articleData as any).images?.[0] || ''),
                                  createdAt: (articleData as any).createdAt || (articleData as any).date || new Date().toISOString()
                                } as any
                              });

                              setIsShareModalOpen(false);
                              setShareComment('');
                              navigate('/'); // Return to feed to see the newly shared article!
                            } catch (shErr) {
                              console.error("Error publishing share post:", shErr);
                              alert("Failed to share article. Please try again.");
                            } finally {
                              setIsSharePosting(false);
                            }
                          }}
                          className="px-5 py-2.5 bg-primary text-white rounded-full text-xs font-black hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                        >
                          {isSharePosting ? 'Sharing...' : 'Share Now'}
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            </div>
          </aside>

          {/* Main Content Body */}
          <article className="col-span-12 lg:col-span-7 max-w-none text-left">
            <style>{contentStyles}</style>
            <div className="space-y-5 text-on-surface/90 text-[14px] leading-relaxed font-normal text-left">
              <div 
                className="preview-content editor-inner-content break-words max-w-full text-on-surface" 
                dangerouslySetInnerHTML={{ 
                  __html: articleData?.content || articleData?.description || '' 
                }} 
              />
            </div>

            {/* Article Content */}
            {articleData?.commentsEnabled !== false && (
              <section id="comments-section" className="mt-[47px] pt-0 border-t border-outline-variant/10">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black font-manrope tracking-tight">
                    Discussion <span className="text-secondary text-sm font-medium ml-1.5">({comments.length})</span>
                  </h3>
                </div>

                {/* Comment Input */}
                <div className="bg-surface-container-low rounded-2xl p-4 mb-8">
                  <div className="flex gap-2.5 mb-2.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-surface-container flex items-center justify-center">
                      {user?.profileImage ? (
                        <img src={user.profileImage} alt="User" referrerPolicy="no-referrer" />
                      ) : (
                        <Users className="w-5 h-5 text-secondary" />
                      )}
                    </div>
                    <textarea 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your technical perspective..."
                      className="flex-1 bg-transparent border-none focus:ring-0 text-xs placeholder:text-secondary resize-none min-h-[60px]"
                    />
                  </div>

                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2.5 ml-10">
                      {attachments.map((file, i) => (
                        <div key={i} className="relative group">
                          <div className="bg-surface-container-high px-2 py-1 rounded-xl flex items-center gap-1.5 border border-outline-variant/20">
                            {file.type.startsWith('image/') ? <ImageIcon className="w-3 h-3" /> : <Paperclip className="w-3 h-3" />}
                            <span className="text-[9px] font-medium max-w-[100px] truncate">{file.name}</span>
                            <button 
                              onClick={() => removeAttachment(i)}
                              className="p-0.5 hover:bg-surface-container-highest rounded-full"
                            >
                              <X className="w-2 h-2" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between ml-10 pt-2.5 border-t border-outline-variant/5">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 rounded-xl hover:bg-surface-container-high text-secondary transition-all"
                        title="Attach files"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 rounded-xl hover:bg-surface-container-high text-secondary transition-all"
                        title="Attach images"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        multiple 
                      />
                    </div>
                    <button 
                      onClick={() => handleAddComment()}
                      disabled={!newComment.trim() && attachments.length === 0}
                      className="bg-primary text-white px-4 py-1.5 rounded-xl font-bold text-[10px] flex items-center gap-1.5 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-3 h-3" />
                      Post Comment
                    </button>
                  </div>
                </div>

                {/* Comment List */}
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <CommentItem 
                      key={comment.id} 
                      comment={comment} 
                      onReply={(parentId, text) => {
                        // In a real app, this would call the API
                        // For now, we'll just use the handleAddComment logic
                        setNewComment(text);
                        handleAddComment(parentId);
                      }}
                    />
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* Right Sidebar - Author & Related */}
          <aside className="hidden lg:block lg:col-span-4 space-y-10">
            <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/10">
              <h3 className="text-base font-bold font-manrope mb-5">About the Author</h3>
              <div className="flex items-center gap-3 mb-5">
                <div 
                  onClick={() => {
                    if (isSelf) {
                      navigate('/profile');
                    } else if (authorUsername) {
                      navigate(`/profile/${authorUsername}`);
                    }
                  }}
                  className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/20 cursor-pointer hover:border-primary transition-all shrink-0"
                >
                  <img src={article.author.img} alt={article.author.name} referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h4 
                    onClick={() => {
                      if (isSelf) {
                        navigate('/profile');
                      } else if (authorUsername) {
                        navigate(`/profile/${authorUsername}`);
                      }
                    }}
                    className="text-sm font-bold font-manrope hover:text-primary hover:underline cursor-pointer transition-all"
                  >
                    {article.author.name}
                    {article.taggedUsers && article.taggedUsers.length > 0 && (
                      <span className="text-[10px] font-normal text-secondary block">
                        with {article.taggedUsers.length === 1 && article.taggedUsers[0].name}
                        {article.taggedUsers.length === 2 && `${article.taggedUsers[0].name} and ${article.taggedUsers[1].name}`}
                        {article.taggedUsers.length === 3 && `${article.taggedUsers[0].name}, ${article.taggedUsers[1].name} and ${article.taggedUsers[2].name}`}
                        {article.taggedUsers.length === 4 && `${article.taggedUsers[0].name}, ${article.taggedUsers[1].name}, ${article.taggedUsers[2].name} and ${article.taggedUsers[3].name}`}
                        {article.taggedUsers.length > 4 && `${article.taggedUsers[0].name}, ${article.taggedUsers[1].name}, ${article.taggedUsers[2].name}, ${article.taggedUsers[3].name} and ${article.taggedUsers.length - 4} ${article.taggedUsers.length - 4 === 1 ? 'other' : 'others'}`}
                      </span>
                    )}
                  </h4>
                  {!isSelf && (
                    <button 
                      onClick={() => authorUsername && toggleFollow(authorUsername)}
                      className={cn(
                        "mt-1.5 text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full transition-all border block text-center",
                        isFollowingAuthor 
                          ? "bg-transparent border-outline-variant/30 text-secondary hover:border-red-500/30 hover:text-red-500 hover:bg-red-500/5 cursor-pointer" 
                          : "bg-primary border-primary text-white hover:opacity-90 active:scale-95 cursor-pointer"
                      )}
                    >
                      {isFollowingAuthor ? 'Following' : 'Follow'}
                    </button>
                  )}
                  {isSelf && (
                    <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">You</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-secondary leading-relaxed mb-6">
                {article.author.bio}
              </p>
              <button 
                onClick={() => {
                  if (isSelf) {
                    navigate('/profile');
                  } else if (authorUsername) {
                    navigate(`/profile/${authorUsername}`);
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-on-surface text-surface font-bold text-xs hover:bg-primary hover:text-white transition-all cursor-pointer shadow-sm active:scale-98"
              >
                View Profile
              </button>
            </div>

            <div className="space-y-5">
              <h3 className="text-base font-bold font-manrope">Related Insights</h3>
              {[
                { title: "The Shift to Micro-Learning Architectures", time: "12 min read" },
                { title: "AI-Driven Feedback Loops at Scale", time: "8 min read" },
                { title: "Distributed Monoliths in EdTech", time: "15 min read" }
              ].map((item, i) => (
                <div key={i} className="group cursor-pointer">
                  <p className="text-[9px] text-tertiary font-bold uppercase tracking-widest mb-1.5">Insight {i + 1}</p>
                  <h4 className="text-xs font-bold font-manrope group-hover:text-primary transition-colors leading-snug mb-1.5">
                    {item.title}
                  </h4>
                  <span className="text-[9px] text-outline-variant font-medium uppercase tracking-widest">{item.time}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </>
    )}
  </div>
    </div>
  </main>
</div>
  );
}

function CommentItem({ comment, onReply, depth = 0 }: { comment: any; onReply: (id: string, text: string) => void; depth?: number }) {
  const { id: postId } = useParams();
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [likes, setLikes] = useState(comment.likes);
  const [isUpvoted, setIsUpvoted] = useState(postService.isCommentLiked(comment.id));
  const [isDownvoted, setIsDownvoted] = useState(postService.isCommentDownvoted(comment.id));

  const handleUpvote = () => {
    if (!postId) return;
    const result = postService.toggleCommentLike(postId, comment.id);
    if (result.comment) {
      setLikes(result.comment.likes);
      setIsUpvoted(result.isLiked);
      setIsDownvoted(postService.isCommentDownvoted(comment.id));
    }
  };

  const handleDownvote = () => {
    if (!postId) return;
    const result = postService.toggleCommentDownvote(postId, comment.id);
    if (result.comment) {
      setLikes(result.comment.likes);
      setIsDownvoted(result.isDownvoted);
      setIsUpvoted(postService.isCommentLiked(comment.id));
    }
  };

  return (
    <div className={cn("space-y-6", depth > 0 && "ml-12 pl-6 border-l-2 border-outline-variant/10")}>
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-outline-variant/10">
          <img src={comment.authorImage} alt={comment.authorName} referrerPolicy="no-referrer" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h5 className="text-sm font-bold text-on-surface font-manrope">{comment.authorName}</h5>
            <span className="text-[10px] text-secondary font-medium uppercase tracking-widest">
              {formatElapsedTime(comment.createdAt)}
            </span>
          </div>
          <div className="flex items-start gap-3 group">
            <div className="flex-1">
              <div className="text-on-surface/80 text-[16px] leading-relaxed mb-4 whitespace-pre-wrap">
                <HashtagText text={comment.text} />
              </div>
            </div>
            
            {/* Vote Controls */}
            <div className="shrink-0 flex items-center bg-surface-container rounded-full p-0.5">
              <button 
                onClick={handleUpvote}
                className={cn(
                  "p-1.5 rounded-full transition-all flex items-center gap-1",
                  isUpvoted ? "text-[#22c55e] bg-[#22c55e]/10" : "hover:bg-outline-variant/10 text-secondary"
                )}
              >
                <ArrowBigUp className={cn("w-5 h-5", isUpvoted && "fill-[#22c55e]")} />
                <span className={cn(
                  "text-xs font-black min-w-[12px]",
                  isUpvoted ? "text-[#22c55e]" : "text-on-surface"
                )}>
                  {comment.upvotes || comment.likes || 0}
                </span>
              </button>
              
              <button 
                onClick={handleDownvote}
                className={cn(
                  "p-1.5 rounded-full transition-all flex items-center gap-1",
                  isDownvoted ? "text-[#ef4444] bg-[#ef4444]/10" : "hover:bg-outline-variant/10 text-secondary"
                )}
              >
                <ArrowBigDown className={cn("w-5 h-5", isDownvoted && "fill-[#ef4444]")} />
                <span className={cn(
                  "text-xs font-black min-w-[12px]",
                  isDownvoted ? "text-[#ef4444]" : "text-on-surface"
                )}>
                  {comment.downvotes || 0}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center gap-1.5 text-xs font-bold text-secondary hover:text-primary transition-colors"
            >
              <Reply className="w-4 h-4" />
              Reply
            </button>
            <button className="text-secondary hover:text-primary transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          <AnimatePresence>
            {isReplying && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 overflow-hidden"
              >
                <div className="bg-surface-container-low rounded-2xl p-4 pt-2">
                  <textarea 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to ${comment.authorName.split(' ')[0]}...`}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm text-on-surface placeholder:text-secondary resize-none min-h-[80px]"
                  />
                  <div className="flex justify-end gap-3 mt-2">
                    <button 
                      onClick={() => setIsReplying(false)}
                      className="px-4 py-2 rounded-lg text-xs font-bold text-secondary hover:bg-surface-container-high transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        onReply(comment.id, replyText);
                        setReplyText("");
                        setIsReplying(false);
                      }}
                      className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold hover:brightness-110 transition-all"
                    >
                      Post Reply
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-6">
          {comment.replies.map((reply: any) => (
            <CommentItem key={reply.id} comment={reply} onReply={onReply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
