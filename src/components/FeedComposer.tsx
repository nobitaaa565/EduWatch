import React, { useState } from 'react';
import { Plus, Users, UserCircle, Trash2, X, BarChart2, Shield, Globe, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { postService } from '../services/postService';

interface FeedComposerProps {
  user: any;
  navigate: (path: string) => void;
  onPostCreated?: () => void;
}

export const FeedComposer: React.FC<FeedComposerProps> = ({ user, navigate, onPostCreated }) => {
  const { loading: authLoading } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [privacy, setPrivacy] = useState<'public' | 'followers'>('public');
  const [isPosting, setIsPosting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAddOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  const handlePost = async () => {
    if (!content.trim()) return;

    let pollData = undefined;
    if (showPoll) {
      const activeOptions = pollOptions.map(opt => opt.trim()).filter(Boolean);
      if (activeOptions.length < 2) {
        setErrorMessage('A poll requires at least 2 non-empty options.');
        return;
      }
      pollData = {
        question: content.trim(),
        options: activeOptions.map((opt, idx) => ({
          id: `opt_${Date.now()}_${idx}`,
          text: opt,
          votes: 0
        })),
        voters: {}
      };
    }

    setIsPosting(true);
    setErrorMessage('');

    try {
      await postService.createPost({
        authorId: user?.id || 'guest',
        authorName: user?.fullName || 'User',
        authorImage: user?.profileImage || '',
        title: showPoll ? `Poll: ${content.substring(0, 40)}${content.length > 40 ? '...' : ''}` : content.split('\n')[0].substring(0, 50),
        content: content,
        format: 'micropost',
        privacy: privacy,
        commentsEnabled: true,
        poll: pollData
      });

      // Success Reset
      setContent('');
      setShowPoll(false);
      setPollOptions(['', '']);
      setIsExpanded(false);
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to create micro-post.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="feed-composer-card bg-surface-container-lowest p-4 rounded-xl ambient-shadow border border-outline-variant/15">
      <AnimatePresence initial={false}>
        {!isExpanded ? (
          <motion.div 
            key="collapsed"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-4">
              {authLoading ? (
                <div className="w-10 h-10 rounded-full bg-outline-variant/15 animate-pulse border border-outline-variant/10 shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-surface-container-low border border-outline-variant/10 overflow-hidden flex items-center justify-center shrink-0">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt="User avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <UserCircle className="w-6 h-6 text-secondary" />
                  )}
                </div>
              )}
              
              {authLoading ? (
                <div className="flex-1 h-10 bg-outline-variant/10 animate-pulse rounded-full" />
              ) : (
                <button 
                  onClick={() => setIsExpanded(true)}
                  className="flex-1 bg-surface-container hover:bg-surface-container-high transition-colors px-4 py-2.5 rounded-full text-left text-[14px] text-secondary font-medium"
                >
                  What's on your mind, {user?.fullName?.split(' ')[0] || 'User'}?
                </button>
              )}
            </div>
            <div className="h-px bg-outline-variant/10 mb-2" />
            <div className="flex items-center justify-between px-2 pt-1">
              <button 
                onClick={() => navigate('/write-article')} 
                className="flex items-center gap-2 py-2 px-6 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-secondary font-bold text-[12px] transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-tertiary" /> Write Journal
              </button>
              <button 
                onClick={() => navigate('/community')} 
                className="flex items-center gap-2 py-2 px-6 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-secondary font-bold text-[12px] transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4 text-primary" /> Community Feed
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="expanded"
            initial={{ opacity: 0, height: 'auto' }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col text-on-surface"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10 mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-secondary">
                Compose Micro-post
              </span>
              <button 
                onClick={() => {
                  setIsExpanded(false);
                  setErrorMessage('');
                }}
                className="p-1 rounded-full hover:bg-surface-container text-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main input */}
            <div className="flex gap-3 items-start mb-3">
              <div className="w-9 h-9 rounded-full bg-surface-container-low overflow-hidden border border-outline-variant/10 flex items-center justify-center shrink-0">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="User Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserCircle className="w-5.5 h-5.5 text-secondary" />
                )}
              </div>
              <div className="flex-1">
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoFocus
                  placeholder={showPoll ? "Type your poll question..." : "What's on your mind? Use #hashtags to categorize."}
                  className="w-full bg-transparent border-none outline-none focus:ring-0 text-[14px] leading-relaxed resize-none p-0 max-h-[160px] min-h-[60px]"
                />
              </div>
            </div>

            {/* Poll Creation Widget */}
            <AnimatePresence>
              {showPoll && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 bg-surface-container rounded-xl border border-outline-variant/10 space-y-2.5"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <BarChart2 className="w-3.5 h-3.5" /> Poll Options
                    </span>
                    <button
                      onClick={() => {
                        setShowPoll(false);
                        setErrorMessage('');
                      }}
                      className="text-[10px] font-black text-secondary hover:text-red-500 transition-colors uppercase"
                    >
                      Delete Poll
                    </button>
                  </div>

                  <div className="space-y-2">
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          placeholder={`Option ${idx + 1}`}
                          maxLength={50}
                          className="flex-1 bg-surface-container-lowest border border-outline-variant/15 hover:border-outline-variant/30 rounded-lg px-3 py-1.5 text-[12px] text-on-surface placeholder:text-outline-variant"
                        />
                        {pollOptions.length > 2 && (
                          <button
                            onClick={() => handleRemoveOption(idx)}
                            type="button"
                            className="p-1.5 text-secondary hover:text-red-500 rounded-lg hover:bg-red-500/5 transition-all"
                            aria-label={`Remove option ${idx + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {pollOptions.length < 4 && (
                    <button
                      onClick={handleAddOption}
                      type="button"
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add option
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-3 px-3 py-2 bg-red-500/5 border border-red-500/10 text-red-500 text-[11px] font-semibold rounded-lg">
                {errorMessage}
              </div>
            )}

            {/* Footer Toolbar */}
            <div className="flex items-center justify-between pt-2.5 border-t border-outline-variant/5">
              <div className="flex items-center gap-2.5">
                {/* Create Poll Toggle Button */}
                <button
                  onClick={() => {
                    setShowPoll(!showPoll);
                    setErrorMessage('');
                  }}
                  type="button"
                  className={`p-2 rounded-xl transition-all flex items-center gap-1.5 font-bold text-[11px] cursor-pointer ${
                    showPoll 
                      ? 'bg-primary/15 text-primary' 
                      : 'text-secondary hover:bg-surface-container hover:text-primary'
                  }`}
                  aria-label="Create poll"
                >
                  <BarChart2 className="w-4 h-4" />
                  {showPoll ? 'Poll Active' : 'Create Poll'}
                </button>

                {/* Privacy Selector dropdown/toggle */}
                <div className="h-4 w-px bg-outline-variant/10" />

                <button
                  type="button"
                  onClick={() => setPrivacy(prev => prev === 'public' ? 'followers' : 'public')}
                  className="p-2 rounded-xl text-secondary hover:bg-surface-container hover:text-primary transition-all flex items-center gap-1.5 font-bold text-[11px] cursor-pointer"
                >
                  {privacy === 'public' ? <Globe className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                  <span className="capitalize">{privacy}</span>
                </button>
              </div>

              {/* Submit Post Button */}
              <button
                onClick={handlePost}
                disabled={isPosting || !content.trim()}
                className={`px-4 py-2 rounded-full font-bold text-[12px] flex items-center gap-1.5 transition-all cursor-pointer ${
                  content.trim() 
                    ? 'bg-primary text-white hover:bg-primary/95 shadow-md active:scale-95' 
                    : 'bg-outline-variant/20 text-secondary cursor-not-allowed'
                }`}
              >
                {isPosting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Post
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
