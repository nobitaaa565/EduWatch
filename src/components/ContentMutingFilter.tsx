import React, { useState, useEffect, useRef } from 'react';
import { EyeOff, Search, X, AlertTriangle, Plus } from 'lucide-react';

interface ContentMutingFilterProps {
  mutedKeywords: string[];
  onChange: (updated: string[]) => void;
}

// Admin-predefined approved categories for EduWatch
const ADMIN_APPROVED_CATEGORIES = [
  'Software Engineering',
  'Cloud & DevOps',
  'Data & AI',
  'Design & Product',
  'Business & Operations',
  'Research & Academia',
  'Artificial Intelligence',
  'Machine Learning',
  'Cybersecurity',
  'Blockchain & Web3',
  'Pedagogy & Classroom Technology',
  'EdTech Infrastructure',
  'Instructional Design',
  'Distributed Systems',
  'Product Management',
  'Technical Architecture',
  'Higher Education Research',
  'Curriculum Development',
  'E-Learning Platforms',
  'Human-Computer Interaction',
  'Academic Publishing',
  'Robotics & IoT',
  'Virtual & Augmented Reality',
  'Mobile Development',
  'Quantum Computing'
];

export const ContentMutingFilter: React.FC<ContentMutingFilterProps> = ({
  mutedKeywords,
  onChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [errorText, setErrorText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter candidates based on query & omit elements already muted
  const filteredSuggestions = ADMIN_APPROVED_CATEGORIES.filter(category => {
    const alreadyMuted = mutedKeywords.some(muted => muted.toLowerCase() === category.toLowerCase());
    if (alreadyMuted) return false;
    
    if (searchQuery.trim() === '') return true;
    return category.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectCategory = (categoryName: string) => {
    setErrorText('');
    
    if (mutedKeywords.length >= 10) {
      setErrorText('You can only mute up to 10 broad categories at once to optimize feed performance.');
      return;
    }

    onChange([...mutedKeywords, categoryName]);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const removeMutedCategory = (categoryName: string) => {
    setErrorText('');
    onChange(mutedKeywords.filter(item => item !== categoryName));
  };

  return (
    <div className="space-y-5" ref={containerRef}>
      <div>
        <p className="text-xs font-bold text-on-surface font-manrope">Content Muting & Filters</p>
        <p className="text-[10px] text-secondary mt-1 leading-relaxed">
          Silence specific educational disciplines or topics entirely. Type to search platform-approved categories and mute them from appearing in your discovery feeds.
        </p>
      </div>

      {/* Active Muted Categories List */}
      <div className="space-y-2">
        <label className="block text-[9px] font-black text-secondary uppercase tracking-widest">
          Currently Muted Categories
        </label>
        
        {mutedKeywords.length > 0 ? (
          <div className="flex flex-wrap gap-2 animate-in fade-in duration-300">
            {mutedKeywords.map((category) => (
              <div 
                key={category} 
                className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/40 px-3.5 py-1.5 rounded-full text-[10px] font-bold shadow-sm transition-all"
              >
                <EyeOff className="w-3.5 h-3.5 shrink-0" />
                <span>{category}</span>
                <button
                  type="button"
                  onClick={() => removeMutedCategory(category)}
                  className="hover:bg-red-500/10 active:scale-90 p-0.5 rounded-full transition-colors cursor-pointer text-red-600/70 hover:text-red-600 dark:text-red-400/70 dark:hover:text-red-400"
                  aria-label={`Unmute ${category}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-secondary/80 italic font-medium leading-relaxed">
            No categories muted. Your feed is fully organic and un-filtered.
          </p>
        )}
      </div>

      {/* Suggestion Search Input Container */}
      <div className="relative space-y-2">
        <label className="block text-[9px] font-black text-secondary uppercase tracking-widest">
          Add Muted Category
        </label>
        
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary/60">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setShowDropdown(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
              if (errorText) setErrorText('');
            }}
            className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary/25 font-medium transition-all"
            placeholder="Search approved platform categories..."
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setShowDropdown(false);
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary hover:text-on-surface cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Suggestion Dropdown floating box */}
        {showDropdown && (searchQuery.trim() !== '' || searchQuery === '') && (
          <div className="absolute z-50 w-full max-w-md mt-1.5 p-2 bg-surface-container-lowest border-2 border-outline-variant/60 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.15),0_10px_10px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_35px_-5px_rgba(0,0,0,0.4)] max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-outline scrollbar-track-transparent animate-in fade-in slide-in-from-top-1 duration-150">
            <p className="text-[9px] font-black text-secondary uppercase tracking-widest px-2.5 py-1.5 border-b border-outline-variant/5 mb-1.5">
              Available Platform Categories
            </p>
            {filteredSuggestions.length > 0 ? (
              <div className="space-y-0.5">
                {filteredSuggestions.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => selectCategory(category)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left text-xs font-bold text-on-surface hover:text-primary hover:bg-primary/5 rounded-lg transition-all cursor-pointer group"
                  >
                    <span>{category}</span>
                    <span className="text-[9px] uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transition-opacity font-black flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Mute
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-secondary italic text-center py-4 px-2">
                {searchQuery.trim() !== '' 
                  ? 'No matching approved categories found.' 
                  : 'All available categories are currently muted.'}
              </p>
            )}
            <p className="text-[8px] text-secondary/70 italic px-2.5 pt-2 mt-2 border-t border-outline-variant/5 text-center">
              Only admin-compiled curator categories can be muted.
            </p>
          </div>
        )}
      </div>

      {/* Validation State Inline Error Text */}
      {errorText && (
        <div className="flex items-start gap-2 text-red-500 bg-red-400/10 border border-red-500/10 p-3 rounded-xl max-w-md animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-[10px] font-bold leading-normal">{errorText}</p>
        </div>
      )}

      {/* General feed optimization status helper */}
      <div className="flex justify-between items-center text-[9px] text-secondary/80 font-medium">
        <span>Current Mute Quota: {mutedKeywords.length} / 10 limit</span>
        {mutedKeywords.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-tertiary hover:underline font-bold hover:scale-102 active:scale-98 transition-transform cursor-pointer"
          >
            Clear All Mutes
          </button>
        )}
      </div>
    </div>
  );
};
