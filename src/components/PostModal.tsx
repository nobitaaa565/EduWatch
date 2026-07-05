import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ThumbsUp, MessageCircle, Share2, MoreHorizontal, Send, Globe, Shield, MapPin, Smile, Camera, Image as ImageIcon, Gift, StickyNote, CornerDownRight, ArrowBigUp, ArrowBigDown, Award, Link as LinkIcon, Check, UserCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { CombinedPost } from '../pages/Feed';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';
import { creators } from '../lib/feedData';
import { postService, Comment } from '../services/postService';
import { HashtagText } from './HashtagText';
import { formatElapsedTime } from '../lib/dateUtils';
import { PostImage } from './PostImage';
import { estimateReadTime, getTruncatedContent, convertHtmlToText } from '../algorithms/content';

interface PostModalProps {
  post: CombinedPost;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export const PostModal = ({ post, isOpen, onClose, onUpdate }: PostModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isDownvoted, setIsDownvoted] = useState(false);
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyingTo, setReplyingTo] = useState<{ id: string, name: string } | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const [isVoting, setIsVoting] = useState(false);
  const [localPoll, setLocalPoll] = useState((post as any).poll);

  // Custom Share Menu states
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareComment, setShareComment] = useState('');
  const [isSharePosting, setIsSharePosting] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const [selectedNestedPost, setSelectedNestedPost] = useState<any | null>(null);
  const [isPostContentExpanded, setIsPostContentExpanded] = useState(false);

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
    setLocalPoll((post as any).poll);
  }, [(post as any).poll]);

  const handleVote = async (optionId: string) => {
    if (!user) {
      alert("Please sign in to vote!");
      return;
    }
    setIsVoting(true);
    try {
      const updatedPoll = await postService.voteInPoll(post.id, optionId);
      if (updatedPoll) {
        setLocalPoll(updatedPoll);
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVoting(false);
    }
  };

  const loadData = async () => {
    if (!post) return;
    const liked = postService.isPostLiked(post.id);
    setIsLiked(liked);
    
    const postComments = postService.getComments(post.id);
    const extra = postService.getExtraInteractions(post.id);
    
    const baseUpvotes = 'upvotes' in post ? (post.upvotes || 0) : ('likes' in post ? (typeof post.likes === 'number' ? post.likes : 0) : 0);
    const baseDownvotes = (post as any).downvotes || 0;
    const baseComments = 'comments' in post ? (typeof post.comments === 'number' ? post.comments : 0) : 0;
    
    const resolvedUpvotes = Math.max(baseUpvotes, extra.upvotes || 0);
    const resolvedDownvotes = Math.max(baseDownvotes, extra.downvotes || 0);
    const resolvedComments = Math.max(baseComments, postComments.length, extra.comments || 0);

    setIsLiked(postService.isPostLiked(post.id));
    setIsDownvoted(postService.isPostDownvoted(post.id));
    setUpvotes(resolvedUpvotes);
    setDownvotes(resolvedDownvotes);
    setCommentsCount(resolvedComments);
    setComments(postComments);
  };

  useEffect(() => {
    if (isOpen && post) {
      loadData();
      setIsPostContentExpanded(false);
    }
  }, [isOpen, post]);

  if (!isOpen) return null;

  const isMicro = 'format' in post && post.format === 'micropost';
  const isReshare = !!(post as any).sharedPost;
  const authorName = 'authorName' in post ? post.authorName : (post as any).author || 'Unknown';
  
  const creator = creators.find(c => c.name === authorName);
  const authorImage = 'authorImage' in post ? post.authorImage : creator?.avatar || `https://ui-avatars.com/api/?name=${authorName}`;
  
  const content = 'content' in post ? post.content : post.description;
  const images = ('images' in post && post.images ? post.images : ('image' in post && post.image ? [post.image] : [])).filter(Boolean);
  const createdAtFormatted = formatElapsedTime('createdAt' in post ? post.createdAt : ('date' in post ? post.date : undefined));

  const handleToggleLike = async () => {
    const res = await postService.toggleLike(post.id);
    if (res) {
      setUpvotes(res.upvotes);
      setDownvotes(res.downvotes);
      setIsLiked(res.isLiked);
      setIsDownvoted(false);
    }
    if (onUpdate) onUpdate();
  };

  const handleToggleDownvote = async () => {
    const res = await postService.toggleDownvote(post.id);
    if (res) {
      setUpvotes(res.upvotes);
      setDownvotes(res.downvotes);
      setIsDownvoted(res.isDownvoted);
      setIsLiked(false);
    }
    if (onUpdate) onUpdate();
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    if (replyingTo) {
      await postService.addReply(post.id, replyingTo.id, {
        authorId: user?.id || 'guest',
        authorName: user?.fullName || "User",
        authorImage: user?.profileImage || `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}`,
        text: commentText
      });
      setReplyingTo(null);
    } else {
      await postService.addComment(post.id, {
        authorId: user?.id || 'guest',
        authorName: user?.fullName || "User",
        authorImage: user?.profileImage || `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}`,
        text: commentText
      });
    }
    
    setCommentText("");
    loadData();
    if (onUpdate) onUpdate();
  };

  const handleCommentLike = async (commentId: string) => {
    const result = postService.toggleCommentLike(post.id, commentId);
    if (result.comment) {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes: (result.comment as any).likes || 0 } : c));
    }
  };

  const handleReplyClick = (comment: Comment) => {
    setReplyingTo({ id: comment.id, name: comment.authorName });
    commentInputRef.current?.focus();
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => {
    const isLiked = postService.isCommentLiked(post.id, comment.id);
    
    return (
      <div className={cn("flex flex-col gap-1", isReply ? "ml-10 mt-2" : "mt-4")}
      >
        <div className="flex gap-2">
          <img 
            src={comment.authorImage} 
            className="w-8 h-8 rounded-full border border-outline-variant/10 object-cover shrink-0" 
            referrerPolicy="no-referrer"
          />
          <div className="flex-1">
            <div className="flex items-start gap-2 group">
              <div className="flex-1 bg-surface-container rounded-2xl px-3 py-2">
                <h4 className="text-[12px] font-bold text-on-surface">{comment.authorName}</h4>
                <p className="text-[13px] text-on-surface/90 font-normal leading-relaxed whitespace-pre-wrap">{comment.text}</p>
              </div>
              <motion.button 
                whileTap={{ scale: 0.85 }}
                onClick={() => handleCommentLike(comment.id)}
                className={cn(
                  "shrink-0 mt-2 flex items-center gap-1.5 p-1.5 rounded-xl transition-all",
                  isLiked 
                    ? "bg-primary/10 text-primary" 
                    : "text-secondary hover:bg-surface-container-high"
                )}
              >
                <ThumbsUp className={cn("w-3.5 h-3.5", isLiked && "fill-primary")} />
                {comment.likes > 0 && <span className="text-[11px] font-black">{comment.likes}</span>}
              </motion.button>
            </div>
            <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] font-bold text-secondary">
              <button 
                onClick={() => handleReplyClick(comment)}
                className="hover:underline transition-colors hover:text-primary"
              >
                Reply
              </button>
              <span className="font-medium text-outline-variant">
                {formatElapsedTime(comment.createdAt)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Render Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-2">
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8"
      >
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]"
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-outline-variant/10 shrink-0">
            <div className="flex-1 text-center">
              <h2 className="text-sm font-black text-on-surface uppercase tracking-widest leading-none">
                {authorName}'s Post
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:bg-surface-container-high transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Area (Scrollable) */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {/* Author Info */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex relative items-end">
                    <img 
                      src={authorImage} 
                      alt={authorName} 
                      className="w-10 h-10 rounded-full border border-outline-variant/10 object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-surface-container-lowest" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-on-surface leading-tight hover:underline cursor-pointer transition-all">{authorName}</h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-secondary font-medium">
                    <span>{createdAtFormatted}</span>
                    {!isReshare && !isMicro && (
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
                    <span>·</span>
                    <Globe className="w-3 h-3" />
                  </div>
                </div>
              </div>
              <button className="p-2 rounded-full hover:bg-surface-container transition-colors text-secondary">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Text Content */}
            <div className="px-4 pb-4">
              <div className="space-y-1.5 max-w-full">
                {(() => {
                  const contentText = convertHtmlToText(content);
                  const originallyTruncated = (isMicro || isReshare) && getTruncatedContent(contentText, false).isTruncated;
                  const { visibleText, isTruncated } = getTruncatedContent(contentText, isPostContentExpanded);

                  const lines = visibleText.split('\n');
                  return lines.map((line, idx) => {
                    const isLastLine = idx === lines.length - 1;
                    if (line === '' && !isLastLine) {
                      return <div key={idx} className="h-2" />;
                    }
                    return (
                      <div 
                        key={idx} 
                        className={cn(
                          "text-[14px] text-on-surface leading-relaxed break-words max-w-full unicode-bidi-isolate",
                          (isMicro && line.trim().length > 40) ? "text-justify" : "text-left"
                        )}
                      >
                        <HashtagText text={line} />
                        {isLastLine && isTruncated && (
                          <>
                            <span>... </span>
                            <button 
                              onClick={() => setIsPostContentExpanded(true)}
                              className="ml-1 text-primary font-bold hover:underline cursor-pointer inline-block"
                            >
                              see more
                            </button>
                          </>
                        )}
                        {isLastLine && !isTruncated && originallyTruncated && (
                          <button 
                            onClick={() => setIsPostContentExpanded(false)}
                            className="ml-2 text-primary font-bold hover:underline cursor-pointer inline-block"
                          >
                            show less
                          </button>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>


              {/* Interactive Poll Component */}
              {localPoll && (
                <div className="mt-4 p-4 bg-surface-container/50 border border-outline-variant/10 rounded-2xl space-y-3">
                  {localPoll.question && (
                    <h4 className="text-[13px] font-bold text-on-surface mb-2 leading-snug">{localPoll.question}</h4>
                  )}
                  
                  {(() => {
                    const currentUserId = user?.id || '';
                    const voters = localPoll.voters || {};
                    const userVotedOptionId = voters[currentUserId];
                    const hasVoted = !!userVotedOptionId;
                    const totalVotes = localPoll.options.reduce((sum: number, o: any) => sum + (o.votes || 0), 0);

                    return (
                      <div className="space-y-2.5">
                        {localPoll.options.map((opt: any) => {
                          const optionVotes = opt.votes || 0;
                          const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
                          const isUserChoice = userVotedOptionId === opt.id;

                          if (hasVoted) {
                            return (
                              <div key={opt.id} className="relative overflow-hidden rounded-xl border border-outline-variant/10 p-3 flex items-center justify-between text-[12px] bg-surface-container-low transition-all">
                                <div 
                                  className={cn(
                                    "absolute left-0 top-0 bottom-0 transition-all duration-500 ease-out z-0",
                                    isUserChoice ? "bg-primary/20" : "bg-outline-variant/10"
                                  )} 
                                  style={{ width: `${percentage}%` }}
                                />
                                <span className={cn(
                                  "relative z-10 font-medium text-on-surface pr-4 flex items-center gap-1.5",
                                  isUserChoice && "font-bold text-primary"
                                )}>
                                  {opt.text}
                                  {isUserChoice && <span className="text-[10px] font-black uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded leading-none">Your Choice</span>}
                                </span>
                                <span className="relative z-10 font-bold text-secondary text-right shrink-0">
                                  {percentage}% <span className="font-normal text-[11px] opacity-70">({optionVotes})</span>
                                </span>
                              </div>
                            );
                          } else {
                            return (
                              <button
                                key={opt.id}
                                disabled={isVoting}
                                onClick={() => handleVote(opt.id)}
                                className="w-full text-left rounded-xl border border-outline-variant/25 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.99] p-3 text-[12px] font-semibold text-on-surface hover:text-primary transition-all flex items-center justify-between cursor-pointer"
                              >
                                <span>{opt.text}</span>
                                <span className="text-[10px] font-black uppercase text-secondary group-hover:text-primary tracking-widest bg-outline-variant/10 px-1.5 py-0.5 rounded">Vote</span>
                              </button>
                            );
                          }
                        })}

                        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-secondary pt-1 mt-1 border-t border-outline-variant/5">
                          <span>{totalVotes} total {totalVotes === 1 ? 'vote' : 'votes'}</span>
                          {hasVoted && (
                            <span className="text-primary font-bold flex items-center gap-1">You've voted</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Reshared/Shared Post Preview Box */}
            {(post as any).sharedPost && (
              <div 
                className="mt-1 mx-4 p-4 border border-outline-variant/15 rounded-xl bg-surface-container-lowest/40 hover:bg-surface-container-lowest transition-all hover:border-primary/20 cursor-default text-left" 
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
                  <div className="text-[11px] text-secondary font-medium ml-8 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span>{formatElapsedTime((post as any).sharedPost.createdAt || (post as any).sharedPost.date)}</span>
                    {(!((post as any).sharedPost.format) || (post as any).sharedPost.format === 'article') && (
                      <>
                        <span>·</span>
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-1.5 py-0.5 rounded leading-none">Article</span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-[9px] text-secondary font-bold uppercase tracking-wider">
                          <Clock className="w-2.5 h-2.5 text-secondary/70 shrink-0" />
                          {estimateReadTime((post as any).sharedPost.content || '')} Min Read
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {((post as any).sharedPost.title) && (
                  <h4 
                    className="text-[16px] font-black leading-tight text-on-surface mb-2 hover:text-primary cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      const sharedObj = (post as any).sharedPost;
                      onClose();
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

            {/* Media */}
            {images && images.length > 0 && (
              <PostImage
                src={images[0]}
                alt="Post content"
                containerClassName="aspect-[16/9] w-full border-b border-outline-variant/10 cursor-default"
                aspectRatio={16 / 9}
              />
            )}

            {/* Actions - Reddit Style */}
            <div className={cn(
              "px-4 py-2 flex items-center gap-2 border-t border-b border-outline-variant/10 shrink-0 no-scrollbar",
              isShareOpen ? "overflow-visible" : "overflow-x-auto"
            )}>
              {/* Vote Controls */}
              <div className="flex items-center bg-surface-container rounded-full p-0.5">
                <motion.button 
                  whileTap={{ scale: 0.85 }}
                  onClick={handleToggleLike}
                  className={cn(
                    "p-1.5 rounded-full transition-all flex items-center gap-1",
                    isLiked ? "text-[#22c55e] bg-[#22c55e]/10" : "hover:bg-outline-variant/10 text-secondary"
                  )}
                >
                  <ArrowBigUp className={cn("w-5 h-5", isLiked && "fill-[#22c55e]")} />
                  <span className={cn(
                    "text-xs font-black min-w-[12px]",
                    isLiked ? "text-[#22c55e]" : "text-on-surface"
                  )}>
                    {upvotes}
                  </span>
                </motion.button>
                
                <motion.button 
                  whileTap={{ scale: 0.85 }}
                  onClick={handleToggleDownvote}
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
                    {downvotes}
                  </span>
                </motion.button>
              </div>

              {/* Comment Button */}
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => commentInputRef.current?.focus()}
                className="flex items-center gap-2 px-3 py-1.5 bg-surface-container hover:bg-outline-variant/10 rounded-full transition-all text-on-surface"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs font-black">{commentsCount}</span>
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
                    {((post as any).shares || 0) > 0 ? `Share (${(post as any).shares})` : 'Share'}
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
                        const postUrl = `${window.location.origin}/micro-post/${post.id}`;
                        navigator.clipboard.writeText(postUrl).then(() => {
                          setCopied(true);
                          setTimeout(() => {
                            setCopied(false);
                            setIsShareOpen(false);
                          }, 1200);
                        });
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
              {isShareModalOpen && createPortal(
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
                              <PostImage 
                                src={imageOfShared} 
                                alt="" 
                                containerClassName="mt-3.5 aspect-video w-full rounded-lg border border-outline-variant/10" 
                                aspectRatio={16 / 9}
                              />
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
                            try {
                              await postService.toggleRepost(post.id, '');
                              const intKey1 = `interactions_${post.id}`;
                              const current1 = JSON.parse(localStorage.getItem(intKey1) || '{"upvotes":0,"downvotes":0,"comments":0,"shares":0}');
                              current1.shares = (current1.shares || 0) + 1;
                              localStorage.setItem(intKey1, JSON.stringify(current1));
                            } catch (cErr) {
                              console.warn("Couldn't write share increment to DB, using fallback", cErr);
                            }

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
                            onClose(); // Close existing detail modal
                            if (onUpdate) {
                              onUpdate();
                            }
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

            {/* Comments Section */}
            <div className="p-4 space-y-2">
               {comments.length === 0 && (
                 <div className="py-10 text-center text-outline-variant">
                   <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-20" />
                 </div>
               )}
               {comments.map((comment) => (
                 <CommentItem key={comment.id} comment={comment} />
               ))}
            </div>
          </div>

          {/* Comment Input Footer */}
          <div className="px-4 py-3 border-t border-outline-variant/10 bg-surface-container-lowest shrink-0">
            {replyingTo && (
              <div className="flex items-center justify-between px-2 py-1 mb-2 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 text-[11px] font-bold text-primary">
                  <CornerDownRight className="w-3.5 h-3.5" />
                  Replying to {replyingTo.name}
                </div>
                <button 
                  onClick={() => setReplyingTo(null)}
                  className="text-[10px] font-black text-secondary hover:text-primary transition-colors"
                >
                  CANCEL
                </button>
              </div>
            )}
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-outline-variant/10">
                <img 
                  src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}`} 
                  alt="User" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 bg-surface-container rounded-2xl p-2 relative">
                <textarea 
                  ref={commentInputRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : `Comment as ${user?.fullName || 'User'}`}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm p-1.5 pr-10 resize-none h-10 no-scrollbar placeholder:text-outline-variant"
                />
                <div className="flex items-center justify-between mt-1 px-1">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 text-secondary hover:text-primary transition-colors">
                      <Smile className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-secondary hover:text-primary transition-colors">
                      <Camera className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-secondary hover:text-primary transition-colors">
                        <Gift className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-secondary hover:text-primary transition-colors">
                        <StickyNote className="w-4 h-4" />
                    </button>
                  </div>
                  <motion.button 
                    whileTap={commentText.trim() ? { scale: 0.85 } : {}}
                    whileHover={commentText.trim() ? { scale: 1.1 } : {}}
                    disabled={!commentText.trim()}
                    onClick={handleAddComment}
                    className={cn(
                        "p-1.5 transition-colors",
                        commentText.trim() ? "text-primary" : "text-outline-variant"
                    )}
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
      <AnimatePresence>
        {selectedNestedPost && (
          <PostModal 
            post={selectedNestedPost}
            isOpen={!!selectedNestedPost}
            onClose={() => setSelectedNestedPost(null)}
            onUpdate={onUpdate}
          />
        )}
      </AnimatePresence>
    </>
  );
};
