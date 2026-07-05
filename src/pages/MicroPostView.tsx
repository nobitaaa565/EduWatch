import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { useAuth } from '../lib/AuthContext';
import { postService, Post } from '../services/postService';
import { useSocial } from '../lib/social';
import { Sidebar } from '../components/Sidebar';
import { useSidebar } from '../lib/SidebarContext';
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
  Lock,
  ArrowLeft,
  Shield,
  MapPin,
  X,
  ImageIcon,
  Paperclip,
  Send,
  ThumbsDown,
  Reply,
  Heart,
  ThumbsUp,
  Link as LinkIcon,
  Check,
  UserCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { HashtagText } from '../components/HashtagText';
import { PostModal } from '../components/PostModal';
import { formatElapsedTime } from '../lib/dateUtils';
import { PostImage } from '../components/PostImage';
import { convertHtmlToText } from '../algorithms/content';

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
  attachments?: { name: string, url: string, type: string }[];
}

export default function MicroPostView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { following, toggleFollow } = useSocial();
  const { isCollapsed } = useSidebar();
  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [selectedNestedPost, setSelectedNestedPost] = useState<any | null>(null);
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to map postService Comment to local state Comment structure
  const mapPostServiceComment = (c: any): Comment => ({
    id: c.id,
    author: {
      name: c.authorName || 'Anonymous',
      img: c.authorImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.authorName || 'Anonymous')}`
    },
    text: c.text,
    timestamp: c.createdAt ? formatElapsedTime(c.createdAt) : 'Just now',
    likes: c.likes || 0,
    dislikes: 0,
    replies: (c.replies || []).map(mapPostServiceComment)
  });

  // Custom Share Menu states
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareComment, setShareComment] = useState('');
  const [isSharePosting, setIsSharePosting] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(event.target as Node)) {
        setIsShareOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      if (id) {
        setLoading(true);
        const posts = await postService.getPosts();
        const found = posts.find(p => p.id === id);
        if (found) {
          setPost(found);
          setLikeCount(found.likes || 0);
          postService.initInteractions(found.id, found.likes || 0, (found as any).downvotes || 0);

          // Load and map existing comments
          const dbComments = postService.getComments(id);
          setComments(dbComments.map(mapPostServiceComment));
        }
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !id) return;
    try {
      const addedComments = await postService.addComment(id, {
        authorId: user?.id || 'anonymous',
        authorName: user?.fullName || user?.username || 'Anonymous',
        authorImage: user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Anonymous')}`,
        text: newComment
      });
      setComments(addedComments.map(mapPostServiceComment));
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-black mb-4 font-manrope">Post Not Found</h2>
          <button onClick={() => navigate('/feed')} className="bg-primary text-white px-6 py-2 rounded-xl font-bold">Return to Feed</button>
        </div>
      </div>
    );
  }

  const authorUsername = post.authorName.toLowerCase().replace(/\s/g, '_');
  const isFollowingAuthor = following.includes(authorUsername);

  return (
    <div className="h-screen bg-surface overflow-hidden">
      <TopBar />
      <main className="mt-[70px] h-[calc(100vh-70px)] overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between gap-6 lg:gap-10 relative w-full h-full px-4 md:px-10 lg:px-10 transition-all duration-300 ease-in-out">
          
          {/* Left Sidebar */}
          <aside className={cn(
            "hidden lg:block shrink-0 h-full overflow-y-auto no-scrollbar pt-6 pb-20 transition-all duration-300 ease-in-out",
            isCollapsed ? "w-[80px]" : "w-[350px]"
          )}>
            <Sidebar />
          </aside>

          {/* Main Focused Post View */}
          <div className="w-full lg:flex-[1] min-w-0 h-full overflow-y-auto no-scrollbar pt-6 pb-40">
            <div className="max-w-[740px] mx-auto">
              {/* Back Button */}
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-6 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-widest">Back</span>
              </button>

              <div className="bg-surface-container-lowest rounded-xl ambient-shadow border border-outline-variant/15 overflow-hidden">
                {/* Post Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/10 bg-surface-container flex items-center justify-center shrink-0">
                      <img src={post.authorImage || `https://i.pravatar.cc/100?u=${post.authorName}`} alt={post.authorName} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 leading-none">
                        <h3 className="text-[13px] font-bold text-on-surface hover:underline cursor-pointer transition-all">
                          {post.authorName}
                        </h3>
                        {post.taggedUsers && (post.taggedUsers || []).length > 0 && (
                          <span className="text-xs font-normal text-secondary">
                            is with <span className="font-bold text-on-surface">
                              {(post.taggedUsers || []).map(u => u.name).join(', ')}
                            </span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-secondary font-medium flex-wrap mt-1 leading-none">
                        <span>{formatElapsedTime(post.createdAt)}</span>
                        <span>·</span>
                        {post.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            <span>{post.location}</span>
                          </div>
                        )}
                        <span>·</span>
                        {post.privacy === 'followers' ? <Shield className="w-2.5 h-2.5 text-secondary" /> : <Globe className="w-2.5 h-2.5 text-secondary" />}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {!isFollowingAuthor && post.authorName !== user?.fullName && (
                      <button 
                        onClick={() => toggleFollow(authorUsername)}
                        className="text-xs font-bold text-primary px-4 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/5 transition-all"
                      >
                        Follow
                      </button>
                    )}
                    <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-secondary transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Post Content */}
                <div className="px-4 pb-3 text-left">
                  <div className="space-y-1.5 max-w-full mb-4">
                    {convertHtmlToText(post.content).split('\n').map((line, idx) => {
                      if (line === '') {
                        return <div key={idx} className="h-2" />;
                      }
                      return (
                        <div 
                          key={idx} 
                          className={cn("text-[14px] text-on-surface leading-relaxed break-words max-w-full unicode-bidi-isolate", line.trim().length > 40 ? "text-justify" : "text-left")}
                        >
                          <HashtagText text={line} />
                        </div>
                      );
                    })}
                  </div>

                  {/* Reshared/Shared Post Preview Box */}
                  {(post as any).sharedPost && (
                    <div 
                      className="mt-4 p-4 border border-outline-variant/15 rounded-xl bg-surface-container-lowest/40 hover:bg-surface-container-lowest transition-all hover:border-primary/20 cursor-default text-left" 
                      onClick={(e) => {
                        e.stopPropagation();
                        if ((post as any).sharedPost) {
                          setSelectedNestedPost((post as any).sharedPost);
                        }
                      }}
                    >
                      <div className="flex flex-col mb-2.5 pb-2 border-b border-outline-variant/5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-outline-variant/10">
                            {(post as any).sharedPost.authorImage ? (
                              <img src={(post as any).sharedPost.authorImage} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full bg-outline-variant/10 flex items-center justify-center">
                                <UserCircle className="w-4 h-4 text-secondary" />
                              </div>
                            )}
                          </div>
                          <span className="text-[14px] font-bold text-on-surface">{(post as any).sharedPost.authorName}</span>
                        </div>
                        <div className="text-[11px] text-secondary font-medium ml-8 mt-0.5">
                          {formatElapsedTime((post as any).sharedPost.createdAt || (post as any).sharedPost.date)}
                        </div>
                      </div>
                      {((post as any).sharedPost.title) && (
                        <h4 
                          className="text-[16px] font-black leading-tight text-on-surface mb-2 hover:text-primary cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            const sharedObj = (post as any).sharedPost;
                            if (sharedObj.format === 'article') {
                              navigate(`/article/${sharedObj.id}`);
                            } else {
                              navigate(`/micro-post/${sharedObj.id}`);
                            }
                          }}
                        >
                          {(post as any).sharedPost.title}
                        </h4>
                      )}
                      <p className="text-[14px] text-on-surface/90 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                        {convertHtmlToText((post as any).sharedPost.content || "")}
                      </p>
                      {(post as any).sharedPost.image && (
                        <PostImage
                          src={(post as any).sharedPost.image}
                          alt=""
                          containerClassName="mt-3 aspect-video w-full rounded-lg border border-outline-variant/10"
                          aspectRatio={16 / 9}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Post Media Gallery */}
                {post.images && (post.images || []).length > 0 && (
                  <div className="relative bg-black group/gallery">
                    <PostImage
                      src={(post.images || [])[currentImageIndex]}
                      alt="Post media"
                      containerClassName="aspect-[4/3] w-full"
                      aspectRatio={4 / 3}
                    />
                    
                    {(post.images || []).length > 1 && (
                      <>
                        <button 
                          onClick={() => setCurrentImageIndex(prev => (prev === 0 ? (post.images || []).length - 1 : prev - 1))}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover/gallery:opacity-100 transition-opacity"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button 
                          onClick={() => setCurrentImageIndex(prev => (prev === (post.images || []).length - 1 ? 0 : prev + 1))}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover/gallery:opacity-100 transition-opacity"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                        
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {(post.images || []).map((_, i) => (
                            <div 
                              key={i} 
                              className={cn(
                                "w-1.5 h-1.5 rounded-full transition-all",
                                currentImageIndex === i ? "bg-white w-4" : "bg-white/40"
                              )} 
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Post Actions - Reddit Style */}
                <div className={cn(
                  "px-4 py-2 flex items-center gap-2 no-scrollbar",
                  isShareOpen ? "overflow-visible" : "overflow-x-auto"
                )}>
                  {/* Vote Controls */}
                  <div className="flex items-center bg-surface-container rounded-full p-0.5">
                    <motion.button 
                      whileTap={{ scale: 0.85 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (post) postService.toggleLike(post.id).then(() => setPost({...post}));
                      }}
                      className={cn(
                        "p-1.5 rounded-full transition-all flex items-center gap-1",
                        postService.isPostLiked(post?.id || '') ? "text-[#ff4500] bg-[#ff4500]/10" : "hover:bg-outline-variant/10 text-secondary"
                      )}
                    >
                      <ArrowBigUp className={cn("w-5 h-5", postService.isPostLiked(post?.id || '') && "fill-[#ff4500]")} />
                      <span className={cn(
                        "text-xs font-black min-w-[12px]",
                        postService.isPostLiked(post?.id || '') ? "text-[#ff4500]" : "text-on-surface"
                      )}>
                        {postService.getExtraInteractions(post?.id || '').upvotes}
                      </span>
                    </motion.button>
                    
                    <motion.button 
                      whileTap={{ scale: 0.85 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (post) postService.toggleDownvote(post.id).then(() => setPost({...post}));
                      }}
                      className={cn(
                        "p-1.5 rounded-full transition-all flex items-center gap-1",
                        postService.isPostDownvoted(post?.id || '') ? "text-[#7193ff] bg-[#7193ff]/10" : "hover:bg-outline-variant/10 text-secondary"
                      )}
                    >
                      <ArrowBigDown className={cn("w-5 h-5", postService.isPostDownvoted(post?.id || '') && "fill-[#7193ff]")} />
                      <span className={cn(
                        "text-xs font-black min-w-[12px]",
                        postService.isPostDownvoted(post?.id || '') ? "text-[#7193ff]" : "text-on-surface"
                      )}>
                        {postService.getExtraInteractions(post?.id || '').downvotes}
                      </span>
                    </motion.button>
                  </div>

                  {/* Comment Button */}
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-surface-container hover:bg-outline-variant/10 rounded-full transition-all text-on-surface"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-xs font-black">
                      {(() => {
                        const extra = postService.getExtraInteractions(post?.id || '');
                        const baseComments = post && 'comments' in post ? (typeof post.comments === 'number' ? post.comments : 0) : 0;
                        return baseComments + (extra.comments || 0) + comments.length - 1; // Subtract 1 because we have 1 initial mock comment
                      })()}
                    </span>
                  </motion.button>

                  {/* Award Button */}
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    className="p-1.5 px-3 bg-surface-container hover:bg-outline-variant/10 rounded-full transition-all text-on-surface"
                  >
                    <Award className="w-5 h-5" />
                  </motion.button>

                  {/* Share Button containing relative dropdown options and portal modal */}
                  <div className="relative ml-auto" ref={shareRef}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsShareOpen(!isShareOpen);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-surface-container hover:bg-outline-variant/10 rounded-full transition-all text-on-surface hover:text-primary active:scale-95 cursor-pointer"
                      aria-label="Share options"
                    >
                      <Share2 className="w-5 h-5 text-secondary shrink-0" />
                      <span className="text-xs font-black">
                        {((post as any)?.shares || 0) > 0 ? `Share (${(post as any).shares})` : 'Share'}
                      </span>
                    </button>

                    {isShareOpen && (
                      <div className="absolute right-0 bottom-full mb-2 z-[100] w-48 bg-surface-container-lowest border border-outline-variant/15 shadow-xl rounded-xl p-1 animate-in fade-in slide-in-from-bottom-1 text-left" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            setIsShareOpen(false);
                            if (!user) {
                              alert("Please sign in to share to your timeline!");
                              return;
                            }
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
                            if (post) {
                              const postUrl = `${window.location.origin}/micro-post/${post.id}`;
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
                  {isShareModalOpen && post && createPortal(
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
                              placeholder="Say something about this post..." 
                              className="w-full h-32 bg-transparent text-[15px] leading-relaxed text-on-surface placeholder:text-outline-variant/80 font-medium resize-none border-none focus:ring-0 focus:outline-none p-0"
                            />
                          </div>

                          {/* Original Post Preview Box embedded nicely inside */}
                          {(() => {
                            const isReshare = !!(post as any).sharedPost;
                            const finalSharedPost = isReshare ? (post as any).sharedPost : post;
                            const authorOfShared = isReshare 
                              ? finalSharedPost.authorName 
                              : ('author' in finalSharedPost ? finalSharedPost.author : finalSharedPost.authorName);
                            const isArticle = ('format' in finalSharedPost ? finalSharedPost.format : 'article') === 'article';
                            const titleOfShared = finalSharedPost.title;
                            const contentOfShared = 'description' in finalSharedPost 
                              ? finalSharedPost.description 
                              : ('content' in finalSharedPost ? finalSharedPost.content : '');
                            const imageOfShared = 'image' in finalSharedPost ? finalSharedPost.image : ((finalSharedPost as any).images?.[0] || '');

                            return (
                              <div className="mx-6 mb-5 p-5 border border-outline-variant/20 rounded-xl bg-surface-container/30 text-left overflow-y-auto max-h-72 no-scrollbar">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-[11px] font-bold text-on-surface">{authorOfShared || 'Author'}</span>
                                  <span className="text-[10px] text-secondary">• {isArticle ? 'Article' : 'Micro-post'}</span>
                                </div>
                                {titleOfShared && <h5 className="text-[14px] font-bold text-on-surface mb-1.5">{titleOfShared}</h5>}
                                <p className="text-[13px] text-secondary line-clamp-3 leading-relaxed">
                                  {convertHtmlToText(contentOfShared || "")}
                                </p>
                                {imageOfShared && (
                                  <div className="mt-3.5 aspect-video w-full rounded-lg overflow-hidden bg-outline-variant/5 border border-outline-variant/10">
                                    <img 
                                      src={imageOfShared} 
                                      alt="" 
                                      className="w-full h-full object-cover" 
                                      referrerPolicy="no-referrer" 
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Share Footer */}
                        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-surface-container-low/50 border-t border-outline-variant/10 text-left shrink-0">
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
                                // 1. Increment shares in DB
                                await postService.toggleRepost(post.id, '');
                                const intKey1 = `interactions_${post.id}`;
                                const current1 = JSON.parse(localStorage.getItem(intKey1) || '{"upvotes":0,"downvotes":0,"comments":0,"shares":0}');
                                current1.shares = (current1.shares || 0) + 1;
                                localStorage.setItem(intKey1, JSON.stringify(current1));

                                // 2. Publish new shared post on usertimeline
                                const isReshare = !!(post as any).sharedPost;
                                const finalSharedPost = isReshare ? (post as any).sharedPost : post;
                                const authorOfShared = isReshare 
                                  ? finalSharedPost.authorName 
                                  : ('author' in finalSharedPost ? finalSharedPost.author : finalSharedPost.authorName);

                                await postService.createPost({
                                  authorId: user?.id || 'guest',
                                  authorName: user?.fullName || 'User',
                                  authorImage: user?.profileImage || '',
                                  title: '',
                                  content: shareComment || `Shared a post by ${authorOfShared}`,
                                  format: ('format' in post ? post.format : 'article') === 'article' ? 'article' : 'micropost',
                                  privacy: 'public',
                                  commentsEnabled: true,
                                  sharedPost: {
                                    id: finalSharedPost.id,
                                    authorName: authorOfShared,
                                    authorImage: isReshare 
                                      ? (finalSharedPost.authorImage || '') 
                                      : (('authorImage' in finalSharedPost && finalSharedPost.authorImage) ? finalSharedPost.authorImage : ''),
                                    title: finalSharedPost.title || '',
                                    content: 'description' in finalSharedPost ? finalSharedPost.description : (finalSharedPost.content || ''),
                                    format: 'format' in finalSharedPost ? finalSharedPost.format : 'article',
                                    image: 'image' in finalSharedPost ? finalSharedPost.image : ((finalSharedPost as any).images?.[0] || ''),
                                    createdAt: (finalSharedPost as any).createdAt || (finalSharedPost as any).date || new Date().toISOString()
                                  } as any
                                });

                                setIsShareModalOpen(false);
                                setShareComment('');
                                navigate('/'); // Return to feed to see the newly shared post!
                              } catch (shErr) {
                                console.error("Error publishing share post:", shErr);
                                alert("Failed to share post. Please try again.");
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

                {/* Post Footer/Comments Section */}
                <div className="bg-surface-container-low px-4 py-6">
                  <div className="flex gap-3 mb-8">
                    <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-outline-variant/10">
                      {user?.profileImage ? (
                        <img src={user.profileImage} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-surface-container flex items-center justify-center">
                          <Users className="w-5 h-5 text-secondary" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 relative">
                       <textarea 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-3 pr-24 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary resize-none h-[42px] overflow-hidden no-scrollbar"
                       />
                       <div className="absolute right-2 top-1.5 flex items-center gap-1">
                          <button className="p-1.5 text-secondary hover:text-primary transition-colors">
                            <ImageIcon className="w-4 h-4" />
                          </button>
                          <motion.button 
                            whileTap={newComment.trim() ? { scale: 0.85 } : {}}
                            whileHover={newComment.trim() ? { scale: 1.1 } : {}}
                            disabled={!newComment.trim()}
                            onClick={handleAddComment}
                            className="p-1.5 text-primary disabled:opacity-30 transition-colors"
                          >
                            <Send className="w-4 h-4" />
                          </motion.button>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {comments.map(comment => (
                      <CommentItem key={comment.id} comment={comment} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <AnimatePresence>
        {selectedNestedPost && (
          <PostModal 
            post={selectedNestedPost}
            isOpen={!!selectedNestedPost}
            onClose={() => setSelectedNestedPost(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  const [voteCount, setVoteCount] = useState(comment.likes);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

  const handleUpvote = () => {
    if (userVote === 'up') {
      setVoteCount(prev => prev - 1);
      setUserVote(null);
    } else {
      setVoteCount(prev => prev + (userVote === 'down' ? 2 : 1));
      setUserVote('up');
    }
  };

  const handleDownvote = () => {
    if (userVote === 'down') {
      setUserVote(null);
    } else {
      setVoteCount(prev => prev - (userVote === 'up' ? 2 : 1));
      setUserVote('down');
    }
  };

  return (
    <div className="flex gap-3">
      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-outline-variant/10">
        <img src={comment.author.img} alt={comment.author.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1">
        <div className="bg-surface-container-lowest px-4 py-2.5 rounded-2xl border border-outline-variant/5 shadow-sm">
          <h5 className="text-[12px] font-bold text-on-surface mb-0.5">{comment.author.name}</h5>
          <p className="text-[13px] text-on-surface/90 leading-relaxed font-normal whitespace-pre-wrap">{comment.text}</p>
        </div>
        <div className="flex items-center gap-3 mt-2 px-1">
          <div className="flex items-center gap-1">
            <motion.button 
              whileTap={{ scale: 0.85 }}
              onClick={handleUpvote}
              className={cn(
                "p-1 rounded-md transition-all hover:bg-outline-variant/10",
                userVote === 'up' ? "text-[#ff4500]" : "text-secondary"
              )}
            >
              <ArrowBigUp className={cn("w-4 h-4", userVote === 'up' && "fill-[#ff4500]")} />
            </motion.button>
            <span className={cn(
              "text-[12px] font-black min-w-[8px]",
              userVote === 'up' ? "text-[#ff4500]" : userVote === 'down' ? "text-[#7193ff]" : "text-on-surface"
            )}>
              {voteCount}
            </span>
            <motion.button 
              whileTap={{ scale: 0.85 }}
              onClick={handleDownvote}
              className={cn(
                "p-1 rounded-md transition-all hover:bg-outline-variant/10",
                userVote === 'down' ? "text-[#7193ff]" : "text-secondary"
              )}
            >
              <ArrowBigDown className={cn("w-4 h-4", userVote === 'down' && "fill-[#7193ff]")} />
            </motion.button>
          </div>
          <button className="text-[11px] font-black uppercase tracking-widest text-secondary hover:text-primary transition-colors flex items-center gap-1">
            <Reply className="w-3 h-3" />
            Reply
          </button>
          <span className="text-[10px] text-outline-variant uppercase font-black uppercase tracking-widest ml-auto">{comment.timestamp}</span>
        </div>
      </div>
    </div>
  );
}
