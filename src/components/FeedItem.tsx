import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Shield, 
  Globe, 
  MoreHorizontal, 
  ArrowBigUp, 
  ArrowBigDown, 
  MessageCircle, 
  Award, 
  Bookmark,
  Share2,
  UserCircle,
  Users,
  Edit3,
  BarChart2,
  Trash2,
  Link as LinkIcon,
  Copy,
  Check,
  X,
  Clock,
  EyeOff,
  Flag,
  ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { postService, Comment } from '../services/postService';
import { HashtagText } from './HashtagText';
import { type CombinedPost } from '../algorithms/search';
import { useAuth } from '../lib/AuthContext';
import { motion } from 'motion/react';
import { formatElapsedTime } from '../lib/dateUtils';
import { PostImage } from './PostImage';
import { estimateReadTime, getTruncatedContent, convertHtmlToText } from '../algorithms/content';

interface TaggedUser {
  id: string;
  name: string;
}

interface FeedItemProps {
  item: CombinedPost;
  index?: number;
  expandedPosts: Set<string>;
  toggleExpand: (id: string, e: React.MouseEvent) => void;
  handlePostAction: (item: CombinedPost, fromMedia?: boolean) => void;
  handleToggleLike: (postId: string, e: React.MouseEvent) => void;
  handleToggleDownvote: (postId: string, e: React.MouseEvent) => void;
  viewMode?: 'list' | 'grid';
  showMenu?: boolean;
  onMenuEdit?: (item: CombinedPost) => void;
  onMenuDelete?: (item: CombinedPost) => void;
  onMenuStats?: (item: CombinedPost) => void;
  onMenuPrivacyChange?: (item: CombinedPost, privacy: 'public' | 'followers' | 'communities') => void;
  onMenuHide?: (item: CombinedPost) => void;
  onMenuReport?: (item: CombinedPost) => void;
  onShareSuccess?: () => void;
}

export const FeedItem: React.FC<FeedItemProps> = ({
  item,
  index,
  expandedPosts,
  toggleExpand,
  handlePostAction,
  handleToggleLike,
  handleToggleDownvote,
  viewMode = 'list',
  showMenu = true,
  onMenuEdit,
  onMenuDelete,
  onMenuStats,
  onMenuPrivacyChange,
  onMenuHide,
  onMenuReport,
  onShareSuccess
}) => {
  const { user } = useAuth();
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const [isVoting, setIsVoting] = React.useState(false);
  const [localPoll, setLocalPoll] = React.useState((item as any).poll);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPrivacyExpanded, setIsPrivacyExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Custom Share Menu states
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareComment, setShareComment] = useState('');
  const [isSharePosting, setIsSharePosting] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  // Quick commenting states
  const [commentInput, setCommentInput] = useState('');
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(postService.isBookmarked(item.id));

  useEffect(() => {
    setCommentsList(postService.getComments(item.id));
    setIsBookmarked(postService.isBookmarked(item.id));
  }, [item.id]);

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSaved = postService.toggleBookmark(item.id);
    setIsBookmarked(nextSaved);
  };

  const handleQuickCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !user) return;
    
    const textToWrite = commentInput;
    setCommentInput(''); // clear instantly
    setIsSubmittingComment(true);
    
    // Create optimistic comment
    const optimisticComment: Comment = {
      id: `temp_${Date.now()}`,
      authorId: user.id || 'guest',
      authorName: user.fullName || 'User',
      authorImage: user.profileImage || '',
      text: textToWrite,
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: []
    };
    
    // Instantly add comment to list
    setCommentsList(prev => [...prev, optimisticComment]);
    
    try {
      const updated = await postService.addComment(item.id, {
        authorId: user.id || 'guest',
        authorName: user.fullName || 'User',
        authorImage: user.profileImage || '',
        text: textToWrite
      });
      if (updated && updated.length > 0) {
        setCommentsList(updated);
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
      // Remove optimistic comment on fail
      setCommentsList(prev => prev.filter(c => c.id !== optimisticComment.id));
    } finally {
      setIsSubmittingComment(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setIsPrivacyExpanded(false);
      }
      if (shareRef.current && !shareRef.current.contains(event.target as Node)) {
        setIsShareOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  React.useEffect(() => {
    setLocalPoll((item as any).poll);
  }, [(item as any).poll]);

  const handleVote = async (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      alert("Please sign in to vote!");
      return;
    }
    setIsVoting(true);
    try {
      const updatedPoll = await postService.voteInPoll(item.id, optionId);
      if (updatedPoll) {
        setLocalPoll(updatedPoll);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVoting(false);
    }
  };

  const authorName = 'author' in item ? item.author : item.authorName;
  const authorImg = ('authorImage' in item && item.authorImage) 
    ? item.authorImage 
    : `https://i.pravatar.cc/100?u=${authorName}`;
    
  const isOwnPost = !!user && (
    (item as any).authorId === user.id ||
    ('author' in item && item.author === user.fullName) ||
    ('authorName' in item && item.authorName === user.fullName)
  );
    
  const postDate = formatElapsedTime('createdAt' in item ? item.createdAt : ('date' in item ? item.date : undefined));
  const textContent = 'description' in item ? item.description : convertHtmlToText(item.content);
  const isMicro = 'format' in item && item.format === 'micropost';
  const isResharePost = !!(item as any).sharedPost;
  const isExpanded = expandedPosts.has(item.id);
  const originallyTruncated = (isMicro || isResharePost) && getTruncatedContent(textContent, false).isTruncated;
  const { visibleText, isTruncated } = getTruncatedContent(textContent, isExpanded);

  const taggedUsers = ('taggedUsers' in item && Array.isArray(item.taggedUsers)) ? (item.taggedUsers as TaggedUser[]) : [];
  const locationName = 'location' in item ? (item.location as string) : '';

  const localExtra = postService.getExtraInteractions(item.id);
  const localCommentsCount = commentsList.length;

  const resolvedUpvotes = Math.max(
    'upvotes' in item ? (item.upvotes || 0) : ('likes' in item ? (item.likes || 0) : 0),
    localExtra.upvotes || 0
  );

  const resolvedDownvotes = Math.max(
    (item as any).downvotes || 0,
    localExtra.downvotes || 0
  );

  const resolvedCommentsCount = Math.max(
    'comments' in item ? (typeof item.comments === 'number' ? item.comments : 0) : 0,
    localExtra.comments || 0,
    localCommentsCount
  );

  const resolvedShares = Math.max(
    (item as any).shares || 0,
    localExtra.shares || 0
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.45, 
        delay: typeof index === 'number' ? Math.min(index * 0.05, 0.4) : 0, 
        ease: [0.215, 0.61, 0.355, 1] 
      }}
      className={cn(
        "feed-item-card bg-surface-container-lowest rounded-xl ambient-shadow border border-outline-variant/15 overflow-visible group transition-all",
        (isShareOpen || isMenuOpen) ? "relative z-[60]" : "relative z-0"
      )}
    >
      {/* Post Header */}
      <div className="p-4 feed-item-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/10 bg-surface-container flex items-center justify-center">
            <img 
              src={authorImg} 
              alt={authorName} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer" 
            />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-on-surface hover:underline cursor-pointer transition-all">
              {authorName}
              {item.isLocal && ((taggedUsers && taggedUsers.length > 0) || locationName) && (
                <span className="font-normal text-secondary ml-1">
                  {taggedUsers && taggedUsers.length > 0 && (
                    <>
                      is with <span className="font-bold text-on-surface">
                        {taggedUsers.length === 1 && taggedUsers[0].name}
                        {taggedUsers.length === 2 && `${taggedUsers[0].name} and ${taggedUsers[1].name}`}
                        {taggedUsers.length === 3 && `${taggedUsers[0].name}, ${taggedUsers[1].name} and ${taggedUsers[2].name}`}
                        {taggedUsers.length === 4 && `${taggedUsers[0].name}, ${taggedUsers[1].name}, ${taggedUsers[2].name} and ${taggedUsers[3].name}`}
                        {taggedUsers.length > 4 && `${taggedUsers[0].name}, ${taggedUsers[1].name}, ${taggedUsers[2].name}, ${taggedUsers[3].name} and ${taggedUsers.length - 4} ${taggedUsers.length - 4 === 1 ? 'other' : 'others'}`}
                      </span>
                    </>
                  )}
                  {locationName && (
                    <>
                      {taggedUsers && taggedUsers.length > 0 ? ' at ' : ' is at '}
                      <span className="font-bold text-on-surface">{locationName}</span>
                    </>
                  )}
                </span>
              )}
            </h4>
            <div className="flex items-center gap-1.5 text-[11px] text-secondary font-medium flex-wrap">
              <span>{postDate}</span>
              {!((item as any).sharedPost) && (!('format' in item) || (item as any).format === 'article') && (
                <>
                  <span>·</span>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-1.5 py-0.5 rounded leading-none">Article</span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-[10px] text-secondary font-bold uppercase tracking-wider">
                    <Clock className="w-3 h-3 text-secondary/70 shrink-0" />
                    {estimateReadTime('content' in item ? (item.content || '') : ('description' in item ? (item.description || '') : ''))} Min Read
                  </span>
                </>
              )}
              <span>·</span>
              {'privacy' in item && item.privacy === 'followers' ? <Shield className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
            </div>
          </div>
        </div>
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-secondary transition-colors" 
            aria-label="More options"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 z-[100] w-48 bg-surface-container-lowest border border-outline-variant/15 shadow-xl rounded-xl p-1 animate-in fade-in slide-in-from-top-1 text-left">
              {isOwnPost ? (
                <>
                  {onMenuEdit && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onMenuEdit(item);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container rounded-lg transition-all text-left cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 text-secondary" />
                      <span>Edit Content</span>
                    </button>
                  )}

                  {onMenuPrivacyChange && (() => {
                    const currentPrivacy = (item as any).privacy || 'public';
                    const privacyOptions = [
                      { id: 'public', label: 'Public', icon: Globe },
                      { id: 'followers', label: 'Followers Only', icon: Users },
                      { id: 'communities', label: 'Communities Only', icon: Shield }
                    ];
                    const currentOption = privacyOptions.find(o => o.id === currentPrivacy) || privacyOptions[0];
                    
                    return (
                      <>
                        <div className="border-t border-outline-variant/10 my-1"></div>
                        <div className="px-3 py-1 text-[10px] font-black text-secondary uppercase tracking-wider">Change Privacy</div>
                        
                        <div 
                          className="px-1 relative"
                          onMouseEnter={() => setIsPrivacyExpanded(true)}
                          onMouseLeave={() => setIsPrivacyExpanded(false)}
                        >
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsPrivacyExpanded(!isPrivacyExpanded);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all text-left cursor-pointer",
                              isPrivacyExpanded ? "bg-surface-container text-on-surface" : "text-primary bg-primary/5 hover:bg-primary/10"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <currentOption.icon className="w-3.5 h-3.5" />
                              <span>{currentOption.label}</span>
                            </div>
                            <ChevronDown className={cn("w-3 h-3 transition-transform duration-200 shrink-0", isPrivacyExpanded && "rotate-180")} />
                          </button>

                          {isPrivacyExpanded && (
                            <div className="absolute right-full top-0 mr-1.5 z-[110] w-44 bg-surface-container-lowest border border-outline-variant/15 shadow-xl rounded-xl p-1.5 space-y-0.5 animate-in fade-in slide-in-from-right-1 duration-150">
                              {privacyOptions.map((opt) => (
                                <button 
                                  key={opt.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMenuPrivacyChange(item, opt.id as any);
                                    setIsMenuOpen(false);
                                    setIsPrivacyExpanded(false);
                                  }}
                                  className={cn(
                                    "w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all text-left cursor-pointer",
                                    currentPrivacy === opt.id ? "text-primary bg-primary/10 font-bold" : "text-on-surface hover:bg-surface-container"
                                  )}
                                >
                                  <opt.icon className="w-3.5 h-3.5" />
                                  <span>{opt.label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}

                  {onMenuStats && (
                    <>
                      <div className="border-t border-outline-variant/10 my-1"></div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onMenuStats(item);
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container rounded-lg transition-all text-left cursor-pointer"
                      >
                        <BarChart2 className="w-4 h-4 text-secondary" />
                        <span>View Statistics</span>
                      </button>
                    </>
                  )}

                  {onMenuDelete && (
                    <>
                      <div className="border-t border-outline-variant/10 my-1"></div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onMenuDelete(item);
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-all text-left cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                        <span>Delete Post</span>
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  {onMenuHide ? (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onMenuHide(item);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container rounded-lg transition-all text-left cursor-pointer"
                    >
                      <EyeOff className="w-4 h-4 text-secondary" />
                      <span>Hide Post</span>
                    </button>
                  ) : (
                    <div className="px-3 py-2 text-xs font-medium text-secondary italic">No actions available</div>
                  )}

                  {onMenuReport && (
                    <>
                      <div className="border-t border-outline-variant/10 my-1 font-semibold"></div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onMenuReport(item);
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-all text-left cursor-pointer"
                      >
                        <Flag className="w-4 h-4 text-red-500" />
                        <span>Report Post</span>
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Body */}
      <div className="px-4 pb-3 feed-item-body">
        {!((item as any).sharedPost) && item.title && !isMicro && (
          <h3 
            className={cn(
              "text-[16px] font-black font-manrope leading-tight text-on-surface mb-2 transition-colors cursor-pointer",
              isMicro 
                ? "px-2 py-1 -ml-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 hover:text-primary" 
                : "group-hover:text-primary"
            )}
            onClick={() => handlePostAction(item, false)}
          >
            {item.title}
          </h3>
        )}
        <div className="space-y-1.5 mb-4">
          {(() => {
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
                    isMicro && line.trim().length > 40 ? "text-justify" : "text-left"
                  )}
                >
                  <HashtagText text={line} />
                  {isLastLine && isTruncated && (
                    <>
                      <span>... </span>
                      <button 
                        onClick={(e) => toggleExpand(item.id, e)}
                        className="ml-1 text-primary font-bold hover:underline cursor-pointer inline-block"
                      >
                        see more
                      </button>
                    </>
                  )}
                  {isLastLine && !isTruncated && originallyTruncated && (
                    <button 
                      onClick={(e) => toggleExpand(item.id, e)}
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

        {/* Interactive Poll Widget */}
        {localPoll && (
          <div className="mt-3 p-4 bg-surface-container/50 border border-outline-variant/10 rounded-2xl space-y-3" onClick={(e) => e.stopPropagation()}>
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
                          {/* Animated Progress Background Bar */}
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
                          onClick={(e) => handleVote(opt.id, e)}
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

        {/* Reshared/Shared Post Preview Box */}
        {(item as any).sharedPost && (
          <div 
            className="mt-3 p-4 border border-outline-variant/15 rounded-xl bg-surface-container-lowest/40 hover:bg-surface-container-lowest transition-all hover:border-primary/20 text-left cursor-default" 
            onClick={(e) => {
              e.stopPropagation();
              // Clicking non-title areas shows the parent post's pop-up view screen
              handlePostAction(item, false);
            }}
          >
            <div className="flex flex-col mb-2.5 pb-2 border-b border-outline-variant/5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-outline-variant/10">
                  {(item as any).sharedPost.authorImage ? (
                    <img src={(item as any).sharedPost.authorImage} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-outline-variant/10 flex items-center justify-center">
                      <UserCircle className="w-4 h-4 text-secondary" />
                    </div>
                  )}
                </div>
                <span className="text-[14px] font-bold text-on-surface">{(item as any).sharedPost.authorName}</span>
              </div>
              <div className="text-[11px] text-secondary font-medium ml-8 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>{formatElapsedTime((item as any).sharedPost.createdAt || (item as any).sharedPost.date)}</span>
                {(!((item as any).sharedPost.format) || (item as any).sharedPost.format === 'article') && (
                  <>
                    <span>·</span>
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-1.5 py-0.5 rounded leading-none">Article</span>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-[9px] text-secondary font-bold uppercase tracking-wider">
                      <Clock className="w-2.5 h-2.5 text-secondary/70 shrink-0" />
                      {estimateReadTime((item as any).sharedPost.content || '')} Min Read
                    </span>
                  </>
                )}
              </div>
            </div>
            {((item as any).sharedPost.title) && (
              <h4 
                className="text-[16px] font-black leading-tight text-on-surface mb-2 hover:text-primary cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  const sharedObj = (item as any).sharedPost;
                  if (sharedObj.format === 'article') {
                    const simulatedPost = { ...sharedObj, id: sharedObj.id, title: sharedObj.title, content: sharedObj.content, isLocal: true };
                    handlePostAction(simulatedPost as any, false);
                  } else {
                    handlePostAction(sharedObj as any, false);
                  }
                }}
              >
                {(item as any).sharedPost.title}
              </h4>
            )}
            <p className="text-[14px] text-on-surface/90 line-clamp-3 leading-relaxed whitespace-pre-wrap">
              {convertHtmlToText((item as any).sharedPost.content || "")}
            </p>
            {(item as any).sharedPost.image && (
              <PostImage
                src={(item as any).sharedPost.image}
                alt=""
                containerClassName="mt-3 aspect-video w-full rounded-lg border border-outline-variant/10"
                aspectRatio={16 / 9}
              />
            )}
          </div>
        )}
      </div>

      {/* Post Image with gradual layout loading skeleton */}
      {((('image' in item) && item.image) || ((item as any).images && (item as any).images.length > 0 && (item as any).images[0])) && (
        <PostImage
          src={(('image' in item) && item.image) ? item.image : ((item as any).images?.[0] || null)}
          alt={item.title}
          containerClassName="aspect-[16/9] w-full border-y border-outline-variant/10 cursor-pointer"
          className="group-hover:scale-105 duration-700"
          aspectRatio={16 / 9}
        />
      )}

      <div className="mx-4 h-px bg-outline-variant/10" />

      {/* Post Actions - Reddit Style */}
      <div className={cn(
        "px-4 py-2 feed-item-footer flex items-center gap-2 no-scrollbar",
        isShareOpen ? "overflow-visible" : "overflow-x-auto"
      )}>
            {/* Vote Controls */}
            <div className="flex items-center bg-surface-container rounded-full p-0.5">
              <button 
                onClick={(e) => handleToggleLike(item.id, e)}
                className={cn(
                  "p-1.5 rounded-full transition-all flex items-center gap-1",
                  postService.isPostLiked(item.id) ? "text-[#22c55e] bg-[#22c55e]/10" : "hover:bg-outline-variant/10 text-secondary"
                )}
                aria-label="Upvote"
              >
                <ArrowBigUp className={cn("w-5 h-5", postService.isPostLiked(item.id) && "fill-[#22c55e]")} />
                <span className={cn(
                  "text-xs font-black min-w-[12px]",
                  postService.isPostLiked(item.id) ? "text-[#22c55e]" : "text-on-surface"
                )}>
                  {resolvedUpvotes}
                </span>
              </button>
              
              <button 
                onClick={(e) => handleToggleDownvote(item.id, e)}
                className={cn(
                  "p-1.5 rounded-full transition-all flex items-center gap-1",
                  postService.isPostDownvoted(item.id) ? "text-[#ef4444] bg-[#ef4444]/10" : "hover:bg-outline-variant/10 text-secondary"
                )}
                aria-label="Downvote"
              >
                <ArrowBigDown className={cn("w-5 h-5", postService.isPostDownvoted(item.id) && "fill-[#ef4444]")} />
                <span className={cn(
                  "text-xs font-black min-w-[12px]",
                  postService.isPostDownvoted(item.id) ? "text-[#ef4444]" : "text-on-surface"
                )}>
                  {resolvedDownvotes}
                </span>
              </button>
            </div>

            {/* Comment Button */}
            {(item as any).commentsEnabled !== false && (
              <button 
                onClick={() => handlePostAction(item, false)}
                className="flex items-center gap-2 px-3 py-1.5 bg-surface-container hover:bg-outline-variant/10 rounded-full transition-all text-on-surface"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs font-black">
                  {resolvedCommentsCount}
                </span>
              </button>
            )}

            {/* Bookmark Button */}
            <button 
              onClick={handleToggleBookmark}
              className={cn(
                "p-1.5 rounded-full transition-all flex items-center cursor-pointer",
                isBookmarked ? "text-primary bg-primary/10" : "bg-surface-container hover:bg-outline-variant/10 text-on-surface"
              )}
              aria-label="Bookmark post"
              title={isBookmarked ? "Remove from bookmarks" : "Save to bookmarks"}
            >
              <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-primary")} />
            </button>

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
                  {resolvedShares > 0 ? `Share (${resolvedShares})` : 'Share'}
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
                  const postUrl = `${window.location.origin}/micro-post/${item.id}`;
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
      </div>

      {/* Instant Comment Option under Every Post Card */}
      {(item as any).commentsEnabled !== false && (
        <div className="border-t border-outline-variant/10 bg-surface-container-low/30 px-4 py-3 text-left">
          {user ? (
            <form onSubmit={handleQuickCommentSubmit} className="flex gap-2 items-center">
              <div className="w-7 h-7 rounded-full overflow-hidden border border-outline-variant/10 shrink-0 bg-surface-container">
                {user.profileImage ? (
                  <img src={user.profileImage} alt={user.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary">
                    {user.fullName?.substring(0, 1) || 'U'}
                  </div>
                )}
              </div>
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-surface-container hover:bg-surface-container-high focus:bg-surface-container border border-outline-variant/10 rounded-full px-3.5 py-1.5 text-xs font-semibold text-on-surface placeholder:text-secondary outline-none focus:ring-1 focus:ring-primary/40 transition-all"
              />
              <button
                type="submit"
                disabled={!commentInput.trim() || isSubmittingComment}
                className="px-4 py-1.5 bg-primary hover:bg-primary/95 text-white rounded-full text-[11px] font-black transition-all disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isSubmittingComment ? 'Sending...' : 'Reply'}
              </button>
            </form>
          ) : (
            <div className="text-[11px] font-semibold text-secondary text-center py-1 bg-outline-variant/5 rounded-lg border border-outline-variant/10">
              Sign in to write a comment on this post.
            </div>
          )}

          {/* Inline List of Instant Comments */}
          {commentsList.length > 0 && (
            <div className="mt-3 space-y-2.5 max-h-56 overflow-y-auto no-scrollbar pt-2.5 border-t border-outline-variant/5 animate-in fade-in duration-200">
              {commentsList.map((c) => (
                <div key={c.id || c.createdAt} className="flex gap-2.5 text-left p-1.5 hover:bg-surface-container/10 rounded-lg transition-all">
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-outline-variant/10 shrink-0 bg-surface-container">
                    {c.authorImage ? (
                      <img src={c.authorImage} alt={c.authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-outline-variant/10 flex items-center justify-center font-bold text-[9px] text-secondary">
                        {c.authorName?.substring(0, 1) || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-on-surface">{c.authorName}</span>
                      <span className="text-[9px] text-secondary">{formatElapsedTime(c.createdAt)}</span>
                    </div>
                    <p className="text-[12px] font-medium text-secondary leading-snug whitespace-pre-wrap">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
              className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl border border-outline-variant/15 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4.5 border-b border-outline-variant/10">
                <h3 className="text-base font-black tracking-tight text-on-surface">Share to Timeline</h3>
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
                <div className="flex items-center gap-3 px-6 pt-5">
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
                <div className="px-6 py-4">
                  <textarea 
                    value={shareComment} 
                    onChange={(e) => setShareComment(e.target.value)}
                    placeholder="Say something about this post..." 
                    className="w-full h-32 bg-transparent text-[15px] leading-relaxed text-on-surface placeholder:text-outline-variant/80 font-medium resize-none border-none focus:ring-0 focus:outline-none p-0"
                  />
                </div>

                {/* Original Post Preview Box embedded nicely inside */}
                {(() => {
                  const isReshare = !!(item as any).sharedPost;
                  const finalSharedPost = isReshare ? (item as any).sharedPost : item;
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
              <div className="flex items-center justify-end gap-2 px-6 py-4 bg-surface-container-low/50 border-t border-outline-variant/10 shrink-0">
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
                        await postService.toggleRepost(item.id, '');
                        const intKey1 = `interactions_${item.id}`;
                        const current1 = JSON.parse(localStorage.getItem(intKey1) || '{"upvotes":0,"downvotes":0,"comments":0,"shares":0}');
                        current1.shares = (current1.shares || 0) + 1;
                        localStorage.setItem(intKey1, JSON.stringify(current1));
                      } catch (cErr) {
                        console.warn("Couldn't write share increment to DB, using fallback", cErr);
                      }

                      // 2. Publish new shared post on usertimeline
                      const isReshare = !!(item as any).sharedPost;
                      const finalSharedPost = isReshare ? (item as any).sharedPost : item;
                      const authorOfShared = isReshare 
                        ? finalSharedPost.authorName 
                        : ('author' in finalSharedPost ? finalSharedPost.author : finalSharedPost.authorName);

                      await postService.createPost({
                        authorId: user?.id || 'guest',
                        authorName: user?.fullName || 'User',
                        authorImage: user?.profileImage || '',
                        title: '',
                        content: shareComment || `Shared a post by ${authorOfShared}`,
                        format: ('format' in item ? item.format : 'article') === 'article' ? 'article' : 'micropost',
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
                      if (onShareSuccess) {
                        onShareSuccess();
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
      </motion.div>
  );
};
