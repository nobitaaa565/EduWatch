import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useBlocker } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { useSidebar } from '../lib/SidebarContext';
import { 
  Bold, 
  Italic, 
  Link as LinkIcon, 
  List, 
  ListOrdered, 
  Image as ImageIcon, 
  Code, 
  Eye, 
  Save, 
  Send, 
  ChevronLeft, 
  Settings, 
  MoreVertical, 
  Strikethrough, 
  Palette, 
  Heading1, 
  Heading2, 
  Heading3, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  Underline as UnderlineIcon, 
  PenLine, 
  Quote, 
  Sparkles, 
  Clock, 
  Calendar,
  X,
  Trash2,
  Share2,
  FileText,
  Download,
  Users,
  Target,
  Trophy,
  Shield,
  Layers,
  ChevronRight,
  Plus,
  Heart,
  MessageCircle,
  MapPin,
  BarChart2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Placeholder } from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { postService } from '../services/postService';
import { motion, AnimatePresence } from 'motion/react';

const isVideoUrl = (url: string) => {
  if (!url) return false;
  return url.startsWith('data:video/') || url.match(/\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i);
};

// Custom styles for Tiptap
const editorStyles = `
  .tiptap p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #adb5bd;
    pointer-events: none;
    height: 0;
  }
  .tiptap blockquote, .preview-content blockquote {
    border-left: 4px solid var(--primary);
    padding-left: 1.25rem;
    padding-top: 0.625rem;
    padding-bottom: 0.625rem;
    margin-top: 2rem;
    margin-bottom: 2rem;
    background-color: var(--surface-container-low);
    border-top-right-radius: 0.75rem;
    border-bottom-right-radius: 0.75rem;
    font-style: italic;
    font-size: 1rem;
    color: var(--secondary);
    text-align: left;
  }
  .preview-content blockquote p {
    margin: 0;
  }
  .tiptap {
    height: 100%;
  }
  .tiptap:focus {
    outline: none;
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .tiptap a, .preview-content a {
    color: var(--primary);
    text-decoration: underline;
    cursor: pointer;
  }
  .tiptap a:hover, .preview-content a:hover {
    color: var(--primary-container);
  }
`;

import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

// Custom Hashtag Extension for real-time coloring
const HashtagHighlight = Extension.create({
  name: 'hashtagHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        state: {
          init(_, { doc }) {
            return DecorationSet.create(doc, findHashtags(doc));
          },
          apply(tr, set) {
            set = set.map(tr.mapping, tr.doc);
            if (tr.docChanged) {
              return DecorationSet.create(tr.doc, findHashtags(tr.doc));
            }
            return set;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});

function findHashtags(doc: any) {
  const decorations: Decoration[] = [];
  doc.descendants((node: any, pos: number) => {
    if (node.isText) {
      const { text } = node;
      const regex = /#[a-z0-9_]+/gi;
      let match;
      while ((match = regex.exec(text))) {
        const start = pos + match.index;
        const end = start + match[0].length;
        decorations.push(
          Decoration.inline(start, end, {
            class: 'text-primary font-bold cursor-pointer',
            style: 'color: var(--primary); font-weight: bold;',
          })
        );
      }
    }
  });
  return decorations;
}

export default function Editor() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isCollapsed, setCollapsed } = useSidebar();

  const generateUniqueUntitledTitle = (): string => {
    try {
      const existingDraftsJson = localStorage.getItem('technical_ledger_drafts');
      const drafts = existingDraftsJson ? JSON.parse(existingDraftsJson) : [];
      let index = 1;
      while (true) {
        const candidate = `Untitled-${index}`;
        const exists = drafts.some((d: any) => d.title && d.title.trim().toLowerCase() === candidate.toLowerCase());
        if (!exists) {
          return candidate;
        }
        index++;
      }
    } catch (e) {
      return 'Untitled-1';
    }
  };

  const [title, setTitle] = useState(() => generateUniqueUntitledTitle());
  const [subtitle, setSubtitle] = useState('');
  const [initialTitle, setInitialTitle] = useState(() => {
    try {
      const existingDraftsJson = localStorage.getItem('technical_ledger_drafts');
      const drafts = existingDraftsJson ? JSON.parse(existingDraftsJson) : [];
      let index = 1;
      while (true) {
        const candidate = `Untitled-${index}`;
        const exists = drafts.some((d: any) => d.title && d.title.trim().toLowerCase() === candidate.toLowerCase());
        if (!exists) {
          return candidate;
        }
        index++;
      }
    } catch (e) {
      return 'Untitled-1';
    }
  });
  const [initialSubtitle, setInitialSubtitle] = useState('');
  const [initialContent, setInitialContent] = useState('');
  const [isNavigatingAllowed, setIsNavigatingAllowed] = useState(false);
  const bypassBlockerRef = useRef(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const [isPreview, setIsPreview] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [linkInput, setLinkInput] = useState<{ x: number, y: number, value: string } | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [stats, setStats] = useState({ words: 0, chars: 0 });
  const [editorFormat, setEditorFormat] = useState<'article' | 'micropost'>('micropost');
  const [micropostImages, setMicropostImages] = useState<string[]>([]);
  const [micropostPrivacy, setMicropostPrivacy] = useState<'public' | 'followers'>('public');
  const [showPrivacyMenu, setShowPrivacyMenu] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [taggedUsers, setTaggedUsers] = useState<{id: string, name: string}[]>([]);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [postLocation, setPostLocation] = useState<string>('');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [hasMicropostDraft, setHasMicropostDraft] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [editPostId, setEditPostId] = useState<string | null>(null);

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  // Check for micropost draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('eduwatch_micropost_draft');
    if (draft) {
      setHasMicropostDraft(true);
    }
  }, []);

  const handleSaveMicropostDraft = () => {
    if (!editor) return;
    const content = editor.getHTML();
    
    // Check if we are editing an existing draft
    const state = location.state as { draft: any, format?: string } | null;
    const draftId = state?.draft?.id || currentDraftId || `micropost-${Date.now()}`;

    const draftData = {
      id: draftId,
      content,
      images: micropostImages,
      taggedUsers,
      postLocation,
      privacy: micropostPrivacy,
      commentsEnabled,
      timestamp: new Date().toISOString()
    };
    
    const existing = localStorage.getItem('eduwatch_micropost_drafts');
    let drafts = existing ? JSON.parse(existing) : [];
    
    const index = drafts.findIndex((d: any) => d.id === draftId);
    if (index > -1) {
      drafts[index] = draftData;
    } else {
      drafts.push(draftData);
    }

    localStorage.setItem('eduwatch_micropost_drafts', JSON.stringify(drafts));
    localStorage.removeItem('eduwatch_micropost_draft'); // Clean the active unsaved draft cache so next session starts blank
    setHasMicropostDraft(false);
    showToast('Micropost draft saved!', 'success');

    setIsNavigatingAllowed(true);
    setTimeout(() => {
      navigate(-1);
    }, 500);
  };

  const handleAutoSaveMicropost = () => {
    if (!editor) return;
    const text = editor.getText().trim();
    if (!text && micropostImages.length === 0) return;

    const state = location.state as { draft: any, format?: string } | null;
    const draftId = state?.draft?.id || currentDraftId || `micropost-${Date.now()}`;
    if (!currentDraftId && !state?.draft?.id) {
      setCurrentDraftId(draftId);
    }

    const draftData = {
      id: draftId,
      content: editor.getHTML(),
      images: micropostImages,
      taggedUsers,
      postLocation,
      privacy: micropostPrivacy,
      commentsEnabled,
      timestamp: new Date().toISOString()
    };

    const existing = localStorage.getItem('eduwatch_micropost_drafts');
    let drafts = existing ? JSON.parse(existing) : [];

    const index = drafts.findIndex((d: any) => d.id === draftId);
    if (index > -1) {
      drafts[index] = draftData;
    } else {
      drafts.push(draftData);
    }

    localStorage.setItem('eduwatch_micropost_drafts', JSON.stringify(drafts));
    setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const handleRestoreMicropostDraft = () => {
    const draftJson = localStorage.getItem('eduwatch_micropost_draft');
    if (draftJson && editor) {
      const draft = JSON.parse(draftJson);
      editor.commands.setContent(draft.content || '');
      setMicropostImages(draft.images || []);
      setTaggedUsers(draft.taggedUsers || []);
      setPostLocation(draft.postLocation || '');
      setMicropostPrivacy(draft.privacy || 'public');
      setCommentsEnabled(draft.commentsEnabled ?? true);
      setHasMicropostDraft(false);
      showToast('Draft restored!', 'success');
    }
  };

  const handleDiscardMicropostDraft = () => {
    localStorage.removeItem('eduwatch_micropost_draft');
    setHasMicropostDraft(false);
    showToast('Draft discarded.', 'success');
  };
  
  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setLocationSuggestions([]);
      return;
    }
    setIsSearchingLocation(true);
    try {
      // Using OpenStreetMap Nominatim API (Free)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`OSM HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setLocationSuggestions(data);
      } else {
        const fallback = getStaticLocationFallback(query);
        setLocationSuggestions(fallback);
      }
    } catch (error) {
      console.warn('Location search failed, using local static fallback data:', error);
      const fallback = getStaticLocationFallback(query);
      setLocationSuggestions(fallback);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Static list for search fallback
  const getStaticLocationFallback = (query: string) => {
    const mainList = [
      "Dhaka, Bangladesh",
      "Chittagong, Bangladesh",
      "Sylhet, Bangladesh",
      "Khulna, Bangladesh",
      "Rajshahi, Bangladesh",
      "Barisal, Bangladesh",
      "Rangpur, Bangladesh",
      "Mymensingh, Bangladesh",
      "Comilla, Bangladesh",
      "Narayanganj, Bangladesh",
      "Gazipur, Bangladesh",
      "New York, United States",
      "London, United Kingdom",
      "Tokyo, Japan",
      "Paris, France",
      "Berlin, Germany",
      "Brussels, Europe",
      "Stamford, United Kingdom",
      "Oxford, United Kingdom",
      "Cambridge, United Kingdom",
      "San Francisco, United States",
      "Los Angeles, United States"
    ];
    const term = query.toLowerCase().trim();
    if (!term) return [];
    return mainList
      .filter(city => city.toLowerCase().includes(term))
      .slice(0, 5)
      .map(city => ({
        display_name: city,
        place_id: city
      }));
  };

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowTagMenu(false);
        setShowLocationInput(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (showLocationInput && postLocation) {
        searchLocation(postLocation);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [postLocation, showLocationInput]);
  
  const mockUsers = [
    { id: '1', name: 'Dr. Sarah Chen' },
    { id: '2', name: 'Marcus Rodriguez' },
    { id: '3', name: 'Emma Wilson' },
    { id: '4', name: 'Prof. David Miller' },
    { id: '5', name: 'Aisha Kahn' }
  ];

  const toggleTagUser = (user: {id: string, name: string}) => {
    setTaggedUsers(prev => 
      prev.find(u => u.id === user.id) 
        ? prev.filter(u => u.id !== user.id) 
        : [...prev, user]
    );
  };
  
  const availableCategories = [
    'Pedagogy', 'Educational Tech', 'Research', 'Curriculum', 
    'Assessment', 'Inclusion', 'Leadership', 'Science', 
    'Mathematics', 'Literacy', 'Art & Design', 'Physical Ed'
  ];

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setCollapsed(true);
  }, [setCollapsed]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const url = event.target?.result as string;
          if (editorFormat === 'article' && editor) {
            editor.chain().focus().setImage({ src: url }).run();
          } else {
            setMicropostImages(prev => [...prev, url]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: editorFormat === 'article' ? 'Start your technical journal here...' : `What's on your mind, ${user?.fullName?.split(' ')[0] || user?.username || ''}?`,
      }),
      CharacterCount,
      HashtagHighlight,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setStats({
        words: editor.storage.characterCount.words(),
        chars: editor.storage.characterCount.characters(),
      });
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm prose-slate max-w-none focus:outline-none text-on-surface',
          editorFormat === 'article' ? 'min-h-[500px]' : 'min-h-[200px]'
        ),
      },
    },
  });

  // Initial stats update
  useEffect(() => {
    setCollapsed(true);
    if (editor) {
      setStats({
        words: editor.storage.characterCount.words(),
        chars: editor.storage.characterCount.characters(),
      });
    }
  }, [editor]);

  // Update placeholder and class when format changes
  useEffect(() => {
    if (editor) {
      editor.setOptions({
        editorProps: {
          attributes: {
            class: cn(
              'prose prose-sm prose-slate max-w-none focus:outline-none text-on-surface',
              editorFormat === 'article' ? 'min-h-[500px]' : 'min-h-[200px]'
            ),
          },
        },
      });
    }
  }, [editorFormat, editor]);

  // Load draft from navigation state (when clicking from profile or drafts page)
  useEffect(() => {
    const state = location.state as { draft: any, editPost: any, format?: 'article' | 'micropost' } | null;
    if (state?.editPost && editor) {
      const post = state.editPost;
      setEditPostId(post.id);
      const postFormat = post.format || (post.title ? 'article' : 'micropost');
      setEditorFormat(postFormat);
      
      const cleanContent = (content: string) => {
        if (!content) return '';
        return content
          .replace(/<img[^>]*>/gi, '')
          .replace(/<video[^>]*>[\s\S]*?<\/video>/gi, '')
          .replace(/<video[^>]*>/gi, '');
      };
      
      const parsedContent = cleanContent(post.content || post.description || '');
      
      if (postFormat === 'micropost') {
        editor.commands.setContent(parsedContent);
        setMicropostImages(post.images || post.mediaUrls || []);
        setTaggedUsers(post.taggedUsers || []);
        setPostLocation(post.location || '');
        setMicropostPrivacy(post.privacy || 'public');
        setCommentsEnabled(post.commentsEnabled ?? true);
        setSelectedCategories(post.categories || []);
        
        if (post.poll) {
          setShowPoll(true);
          setPollOptions(post.poll.options?.map((o: any) => o.text) || ['', '']);
        } else {
          setShowPoll(false);
          setPollOptions(['', '']);
        }
        
        setInitialContent(parsedContent);
        setInitialTitle('');
        setInitialSubtitle('');
      } else {
        const loadedTitle = post.title || '';
        const loadedSubtitle = post.subtitle || post.description || '';
        setTitle(loadedTitle);
        setSubtitle(loadedSubtitle);
        editor.commands.setContent(parsedContent);
        setStats(prev => ({ ...prev, words: post.words || parsedContent.split(/\s+/).length || 0 }));
        setSelectedCategories(post.categories || []);
        setCommentsEnabled(post.commentsEnabled ?? true);
        
        setInitialContent(parsedContent);
        setInitialTitle(loadedTitle);
        setInitialSubtitle(loadedSubtitle);
      }
    } else if (state?.draft && editor) {
      if (state.format) setEditorFormat(state.format);
      setCurrentDraftId(state.draft.id);
      setEditPostId(null);
      
      if (state.format === 'micropost' || (state.draft.privacy && !state.draft.title)) {
        setEditorFormat('micropost');
        editor.commands.setContent(state.draft.content || '');
        setMicropostImages(state.draft.images || []);
        setTaggedUsers(state.draft.taggedUsers || []);
        setPostLocation(state.draft.postLocation || '');
        setMicropostPrivacy(state.draft.privacy || 'public');
        setCommentsEnabled(state.draft.commentsEnabled ?? true);
        setInitialContent(state.draft.content || '');
        setInitialTitle('');
        setInitialSubtitle('');
      } else {
        setEditorFormat('article');
        const loadedTitle = state.draft.title || '';
        const loadedSubtitle = state.draft.subtitle || '';
        setTitle(loadedTitle);
        setSubtitle(loadedSubtitle);
        editor.commands.setContent(state.draft.content || '');
        setStats(prev => ({ ...prev, words: state.draft.words || 0 }));
        setInitialContent(state.draft.content || '');
        setInitialTitle(loadedTitle);
        setInitialSubtitle(loadedSubtitle);
      }
      
      const savedTime = state.draft.updatedAt || state.draft.timestamp;
      if (savedTime) {
        setLastSaved(new Date(savedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } else if (editor) {
      // If navigating to writing composer blankly, start with a completely fresh list of states
      setEditorFormat('micropost');
      editor.commands.setContent('');
      const defaultTitle = generateUniqueUntitledTitle();
      setTitle(defaultTitle);
      setSubtitle('');
      setMicropostImages([]);
      setTaggedUsers([]);
      setPostLocation('');
      setMicropostPrivacy('public');
      setCommentsEnabled(true);
      setHasMicropostDraft(false);
      setCurrentDraftId(null);
      setEditPostId(null);
      setLastSaved(null);
      localStorage.removeItem('eduwatch_micropost_draft');
      localStorage.removeItem('editor_draft');
      setInitialContent('');
      setInitialTitle(defaultTitle);
      setInitialSubtitle('');
    }
  }, [location.state, editor]);
  const [confirmModal, setConfirmModal] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);

  // Dirty state tracking (excluding empty text states and initial placeholders)
  const currentContent = editor ? editor.getHTML() : '';
  const isDirty = !bypassBlockerRef.current && !isNavigatingAllowed && (
    (editorFormat === 'article' && (
      currentContent !== initialContent ||
      title !== initialTitle ||
      subtitle !== initialSubtitle
    )) ||
    (editorFormat === 'micropost' && (
      (currentContent !== initialContent && editor.getText().trim() !== '') ||
      micropostImages.length > 0
    ))
  );

  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  // Trigger dirty modal
  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowDiscardModal(true);
    } else {
      setShowDiscardModal(false);
    }
  }, [blocker.state]);

  // Tab close & reload browser event listener
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Handle saving and exiting from the blocker modal
  const handleBlockerSave = () => {
    if (editorFormat === 'article') {
      if (!title.trim()) {
        showToast('Please provide a title for your article draft before saving.', 'error');
        return;
      }
      const state = location.state as { draft: any, format?: string } | null;
      const draftId = state?.draft?.id || currentDraftId || `article-${Date.now()}`;
      const draft = {
        id: draftId,
        title,
        subtitle,
        content: editor.getHTML(),
        words: stats.words,
        updatedAt: new Date().toISOString()
      };
      const existingDraftsJson = localStorage.getItem('technical_ledger_drafts');
      let drafts = existingDraftsJson ? JSON.parse(existingDraftsJson) : [];
      const index = drafts.findIndex((d: any) => d.id === draft.id);
      if (index > -1) {
        drafts[index] = draft;
      } else {
        drafts.push(draft);
      }
      localStorage.setItem('technical_ledger_drafts', JSON.stringify(drafts));
    } else {
      const state = location.state as { draft: any, format?: string } | null;
      const draftId = state?.draft?.id || currentDraftId || `micropost-${Date.now()}`;
      const draftData = {
        id: draftId,
        content: editor.getHTML(),
        images: micropostImages,
        taggedUsers,
        postLocation,
        privacy: micropostPrivacy,
        commentsEnabled,
        timestamp: new Date().toISOString()
      };
      const existing = localStorage.getItem('eduwatch_micropost_drafts');
      let drafts = existing ? JSON.parse(existing) : [];
      const index = drafts.findIndex((d: any) => d.id === draftId);
      if (index > -1) {
        drafts[index] = draftData;
      } else {
        drafts.push(draftData);
      }
      localStorage.setItem('eduwatch_micropost_drafts', JSON.stringify(drafts));
    }
    setIsNavigatingAllowed(true);
    showToast('Draft saved successfully!');
    setTimeout(() => {
      blocker.proceed?.();
    }, 300);
  };

  const handleBlockerDiscard = () => {
    setIsNavigatingAllowed(true);
    setTimeout(() => {
      blocker.proceed?.();
    }, 100);
  };
  

  // Auto-save effect
  useEffect(() => {
    if (!editor) return;

    if (editorFormat === 'article') {
      if (!title.trim()) return;
      const timer = setTimeout(() => {
        handleSaveDraft(true);
      }, 3000); // Auto-save after 3 seconds of inactivity
      return () => clearTimeout(timer);
    } else {
      // micropost format autocomplete/auto-saves in editor
      const text = editor.getText().trim();
      if (!text && micropostImages.length === 0) return;
      const timer = setTimeout(() => {
        handleAutoSaveMicropost();
      }, 3000); // Auto-save after 3 seconds of inactivity
      return () => clearTimeout(timer);
    }
  }, [title, subtitle, stats.words, editor?.getText(), micropostImages, editorFormat]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const colors = [
    { name: 'Red', value: '#ef4444', bg: 'bg-red-500' },
    { name: 'Blue', value: '#3b82f6', bg: 'bg-blue-500' },
    { name: 'Green', value: '#22c55e', bg: 'bg-green-500' },
    { name: 'Purple', value: '#a855f7', bg: 'bg-purple-500' },
    { name: 'Orange', value: '#f97316', bg: 'bg-orange-500' },
    { name: 'Default', value: 'inherit', bg: 'bg-slate-500' },
  ];

  if (!editor) {
    return null;
  }

  const wordCount = stats.words;
  const charCount = stats.chars;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => setContextMenu(null);

  const openLinkInput = (x: number, y: number) => {
    const previousUrl = editor.getAttributes('link').href || '';
    setLinkInput({ x, y, value: previousUrl });
    setContextMenu(null);
  };

  const applyLink = () => {
    if (!linkInput) return;
    
    if (linkInput.value === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkInput.value }).run();
    }
    setLinkInput(null);
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    closeContextMenu();
  };

  const handleSaveDraft = (isAuto = false) => {
    if (!editor) return;
    if (!title.trim()) {
      if (!isAuto) {
        showToast('Please provide a title for your article draft before saving.', 'error');
      }
      return;
    }
    
    if (!isAuto) setIsSaving(true);
    
    // Check if we are editing an existing draft
    const state = location.state as { draft: any, format?: string } | null;
    const draftId = state?.draft?.id || currentDraftId || `article-${Date.now()}`;
    if (!currentDraftId && !state?.draft?.id) {
      setCurrentDraftId(draftId);
    }

    const draft = {
      id: draftId,
      title,
      subtitle,
      content: editor.getHTML(),
      words: stats.words,
      updatedAt: new Date().toISOString()
    };

    // Store in a list of drafts
    const existingDraftsJson = localStorage.getItem('technical_ledger_drafts');
    let drafts = existingDraftsJson ? JSON.parse(existingDraftsJson) : [];
    
    // Update or add
    const index = drafts.findIndex((d: any) => d.id === draft.id);
    if (index > -1) {
      drafts[index] = draft;
    } else {
      drafts.push(draft);
    }

    localStorage.setItem('technical_ledger_drafts', JSON.stringify(drafts));
    setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    
    if (!isAuto) {
      setIsNavigatingAllowed(true);
      setTimeout(() => {
        setIsSaving(false);
        showToast('Draft saved successfully!');
        // Navigate back to the immediate page the user came from
        navigate(-1);
      }, 500);
    }
  };

  const handleShareDraft = () => {
    const draftId = Math.random().toString(36).substring(7);
    const link = `${window.location.origin}/article/draft-${draftId}`;
    navigator.clipboard.writeText(link);
    showToast('Draft link copied to clipboard!');
  };

  const handleDeleteDraft = () => {
    const freshTitle = generateUniqueUntitledTitle();
    setTitle(freshTitle);
    setSubtitle('');
    editor.commands.setContent('');
    setInitialTitle(freshTitle);
    setInitialSubtitle('');
    setInitialContent('');
    localStorage.removeItem('editor_draft');
    showToast('Draft deleted.');
  };

  const handlePublish = async () => {
    if (selectedCategories.length === 0) {
      showToast('Please select at least one category before publishing.', 'error');
      return;
    }

    if (editorFormat === 'article' && !title.trim()) {
      showToast('Please enter a title before publishing.', 'error');
      return;
    }

    setIsPublishing(true);
    try {
      let pollData = undefined;
      if (editorFormat === 'micropost' && showPoll) {
        const activeOptions = pollOptions.map(opt => opt.trim()).filter(Boolean);
        if (activeOptions.length < 2) {
          showToast('A poll requires at least 2 non-empty options.', 'error');
          setIsPublishing(false);
          return;
        }
        pollData = {
          question: editor?.getText().trim() || 'Poll Question',
          options: activeOptions.map((opt, idx) => ({
            id: `opt_${Date.now()}_${idx}`,
            text: opt,
            votes: 0
          })),
          voters: {}
        };
      }

      const finalTitle = title.trim() || (editorFormat === 'micropost'
        ? (showPoll ? `Poll: ${editor?.getText().substring(0, 40) || 'Untitled Poll'}` : editor?.getText().split('\n')[0].substring(0, 50) || 'Micro-post')
        : '');
      const finalContent = editorFormat === 'micropost' && micropostImages.length > 0
        ? editor.getHTML() + micropostImages.map(img => isVideoUrl(img) ? `<video src="${img}" controls class="w-full rounded-xl mt-2 max-h-[400px]" style="max-height: 400px; max-width: 100%; display: block;"></video>` : `<img src="${img}" alt="Post image" />`).join('')
        : editor.getHTML();
      
      if (editPostId) {
        await postService.updatePost(editPostId, {
          title: finalTitle,
          subtitle: subtitle.trim(),
          content: finalContent,
          images: micropostImages,
          categories: selectedCategories,
          taggedUsers: taggedUsers,
          location: postLocation.trim() || undefined,
          commentsEnabled: commentsEnabled,
          privacy: editorFormat === 'micropost' ? micropostPrivacy : 'public',
        });
        showToast('Successfully updated!', 'success');
      } else {
        await postService.createPost({
          authorId: user?.id || 'anonymous',
          authorName: user?.fullName || user?.username || 'Anonymous',
          authorImage: user?.profileImage || '',
          title: finalTitle,
          subtitle: subtitle.trim(),
          content: finalContent,
          images: micropostImages,
          format: editorFormat,
          categories: selectedCategories,
          taggedUsers: taggedUsers,
          location: postLocation.trim() || undefined,
          commentsEnabled: commentsEnabled,
          privacy: editorFormat === 'micropost' ? micropostPrivacy : 'public',
          poll: pollData
        });
        showToast('Successfully published!', 'success');
      }
      
      // Clean up draft lists if this post was previously a draft
      const targetId = (location.state as any)?.draft?.id || currentDraftId;
      if (targetId) {
        if (editorFormat === 'micropost') {
          const existing = localStorage.getItem('eduwatch_micropost_drafts');
          if (existing) {
            const drafts = JSON.parse(existing).filter((d: any) => d.id !== targetId);
            localStorage.setItem('eduwatch_micropost_drafts', JSON.stringify(drafts));
          }
        } else {
          const existing = localStorage.getItem('technical_ledger_drafts');
          if (existing) {
            const drafts = JSON.parse(existing).filter((d: any) => d.id !== targetId);
            localStorage.setItem('technical_ledger_drafts', JSON.stringify(drafts));
          }
        }
      }

      // Clear working sessions
      localStorage.removeItem('eduwatch_micropost_draft');
      localStorage.removeItem('editor_draft');

      bypassBlockerRef.current = true;
      setIsNavigatingAllowed(true);
      sessionStorage.removeItem('feed_data');
      sessionStorage.removeItem('feed_scroll_pos');
      setTimeout(() => {
        // Go directly to the immediate page we came from
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate('/feed');
        }
      }, 800);
    } catch (error) {
      console.error('Failed to publish:', error);
      showToast('Failed to publish. Please try again.', 'error');
      setIsPublishing(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col" onClick={() => { 
      closeContextMenu(); 
      setLinkInput(null); 
      setShowMoreMenu(false); 
      setShowPrivacyMenu(false);
    }}>
      {/* Toasts */}
      {showDiscardModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[250]" onClick={(e) => e.stopPropagation()}>
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-2xl max-w-md w-full border border-outline-variant/10 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-black font-manrope text-on-surface mb-2">Unsaved Draft Changes</h3>
            <p className="text-xs text-secondary leading-relaxed mb-6">
              You are navigating away from this editor. Would you like to save your work as a draft, or discard your current changes?
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-3 font-manrope">
              <button 
                onClick={() => {
                  setShowDiscardModal(false);
                  blocker.reset?.();
                }} 
                className="px-4 py-2.5 text-secondary hover:text-on-surface hover:bg-surface-container rounded-xl font-bold text-xs transition-colors"
              >
                Keep Editing
              </button>
              <button 
                onClick={handleBlockerDiscard} 
                className="px-4 py-2.5 text-tertiary hover:bg-tertiary/10 border border-tertiary/30 hover:border-tertiary rounded-xl font-bold text-xs transition-colors"
              >
                Discard Changes
              </button>
              <button 
                onClick={handleBlockerSave} 
                className="px-5 py-2.5 bg-primary text-white hover:brightness-110 rounded-xl font-extrabold text-xs transition-all shadow-lg shadow-primary/20"
              >
                Save Draft & Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]" onClick={(e) => e.stopPropagation()}>
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">{confirmModal.title}</h3>
            <p className="text-sm text-secondary mb-6">{confirmModal.message}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmModal(null)} className="px-4 py-2 text-secondary font-bold text-xs hover:bg-surface-container rounded-md">Cancel</button>
              <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} className="px-4 py-2 bg-tertiary text-white font-bold text-xs rounded-md">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={cn(
            "px-6 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-3",
            toast.type === 'success' ? "bg-primary text-white" : "bg-tertiary text-white"
          )}>
            {toast.message}
          </div>
        </div>
      )}

      <style>{editorStyles}</style>
      {/* Editor Header */}
      <header className="h-[70px] border-b border-outline-variant/5 bg-surface/80 backdrop-blur-[20px] fixed top-0 z-50 w-full">
        <div className="w-full h-full px-6 md:px-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBack}
              className="p-2 hover:bg-surface-container rounded-xl transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-secondary" />
            </button>
            <div className="h-6 w-[1px] bg-outline-variant/30 mx-1"></div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded uppercase tracking-widest">
                {editPostId ? 'Update' : 'Draft'}
              </span>
              <h2 className="font-manrope font-black text-sm text-on-surface truncate max-w-[300px]">
                {title || (editPostId ? 'Edit Post' : 'Untitled Draft')}
              </h2>
            </div>
            {editorFormat === 'article' && (
              <div className="flex bg-surface-container-low p-1 rounded-xl ml-2">
                <button 
                  onClick={() => setIsPreview(false)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center gap-2",
                    !isPreview ? "bg-white text-primary shadow-sm" : "text-secondary hover:text-on-surface"
                  )}
                >
                  <PenLine className="w-4 h-4" /> Write
                </button>
                <button 
                  onClick={() => setIsPreview(true)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center gap-2",
                    isPreview ? "bg-white text-primary shadow-sm" : "text-secondary hover:text-on-surface"
                  )}
                >
                  <Eye className="w-4 h-4" /> Preview
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {!editPostId && (
              <div className="flex bg-surface-container-low p-1 rounded-xl">
                <button 
                  onClick={() => {
                    setEditorFormat('article');
                    setIsPreview(false);
                  }}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center gap-2",
                    editorFormat === 'article' ? "bg-white text-primary shadow-sm" : "text-secondary hover:text-on-surface"
                  )}
                  title="Long-form article structure"
                >
                  <FileText className="w-4 h-4" /> Article
                </button>
                <button 
                  onClick={() => {
                    setEditorFormat('micropost');
                    setIsPreview(false);
                  }}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center gap-2",
                    editorFormat === 'micropost' ? "bg-white text-primary shadow-sm" : "text-secondary hover:text-on-surface"
                  )}
                  title="Social-media style quick update"
                >
                  <Share2 className="w-4 h-4" /> Micro-post
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              {lastSaved && (
                <span className="text-[9px] font-bold text-secondary uppercase tracking-widest mr-2 opacity-60">
                  Last saved {lastSaved}
                </span>
              )}
              {!editPostId && (
                <button 
                  onClick={() => handleSaveDraft(false)}
                  disabled={isSaving}
                  className={cn(
                    "px-4 py-2 border border-outline-variant/30 text-secondary hover:text-on-surface hover:bg-surface-container rounded-xl font-black text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50",
                    isSaving && "animate-pulse"
                  )}
                  title="Save Draft (Ctrl+S)"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Draft</span>
                </button>
              )}
            </div>
            {editorFormat === 'article' && (
              <button 
                onClick={handlePublish}
                disabled={isPublishing}
                className="bg-primary text-white px-5 py-2 rounded-xl font-black text-xs flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-70"
              >
                {isPublishing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {editPostId ? 'Update' : 'Publish'}
              </button>
            )}
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowMoreMenu(!showMoreMenu); }}
                className="p-2 hover:bg-surface-container rounded-xl transition-all text-secondary"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              {showMoreMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-surface-container-lowest border border-outline-variant/10 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in duration-200">
                  <MenuAction icon={Share2} label="Share Draft Link" onClick={handleShareDraft} />
                  <div className="h-[1px] bg-outline-variant/10 my-1 mx-1"></div>
                  <MenuAction icon={Trash2} label="Delete Draft" onClick={() => { 
                    setConfirmModal({
                      title: 'Delete Draft',
                      message: 'Are you sure you want to delete this draft permanently?',
                      onConfirm: handleDeleteDraft
                    });
                  }} variant="danger" />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="mt-[70px] h-[calc(100vh-70px)] overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between gap-6 lg:gap-10 relative w-full h-full px-4 md:px-10 lg:px-10 transition-all duration-300 ease-in-out">
          {/* Left Navigation Sidebar */}
          <aside 
            className={cn(
              "hidden lg:block shrink-0 h-full overflow-y-auto no-scrollbar pt-6 pb-20 transition-all duration-300 ease-in-out",
              isCollapsed ? "w-[80px]" : "w-[350px]"
            )}
          >
            <Sidebar />
          </aside>

          {/* Main Editor Center Content */}
          <div className="w-full lg:flex-[1_1_740px] min-w-0 h-full pt-6 pb-6 overflow-y-auto no-scrollbar">
            <div className="bg-surface-container-lowest rounded-xl ambient-shadow h-full flex flex-col relative border border-outline-variant/5 overflow-hidden">
          {/* Editor Header Section (Fixed at top of this flex container) */}
          {!isPreview && editorFormat === 'article' && (
            <div className="bg-surface-container-lowest border-b border-outline-variant/5 shrink-0">
              <div className="p-10 pb-4">
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-4xl font-manrope font-black text-on-surface bg-transparent border-none focus:ring-0 placeholder:text-outline-variant mb-2"
                  placeholder="Enter your title..."
                />
                <input 
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full text-lg font-manrope font-bold text-secondary bg-transparent border-none focus:ring-0 placeholder:text-outline-variant/40 mb-6"
                  placeholder="Add a subtitle..."
                />
              </div>

              {/* Integrated Toolbar */}
              <div className="px-10 pb-4">
                <div className="flex items-center gap-0.5 bg-inverse-surface/95 backdrop-blur-md p-1 rounded-xl shadow-lg border border-white/10 w-fit max-w-full overflow-x-auto no-scrollbar">
                  <ToolbarButton 
                    icon={Heading1} 
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
                    active={editor.isActive('heading', { level: 1 })}
                  />
                  <ToolbarButton 
                    icon={Heading2} 
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
                    active={editor.isActive('heading', { level: 2 })}
                  />
                  <ToolbarButton 
                    icon={Heading3} 
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} 
                    active={editor.isActive('heading', { level: 3 })}
                  />
                  
                  <div className="w-[1px] h-3 bg-white/20 mx-1"></div>
                  
                  <ToolbarButton 
                    icon={Bold} 
                    onClick={() => editor.chain().focus().toggleBold().run()} 
                    active={editor.isActive('bold')}
                  />
                  <ToolbarButton 
                    icon={Italic} 
                    onClick={() => editor.chain().focus().toggleItalic().run()} 
                    active={editor.isActive('italic')}
                  />
                  <ToolbarButton 
                    icon={UnderlineIcon} 
                    onClick={() => editor.chain().focus().toggleUnderline().run()} 
                    active={editor.isActive('underline')}
                  />
                  <ToolbarButton 
                    icon={Strikethrough} 
                    onClick={() => editor.chain().focus().toggleStrike().run()} 
                    active={editor.isActive('strike')}
                  />
                  <ToolbarButton 
                    icon={Quote} 
                    onClick={() => editor.chain().focus().toggleBlockquote().run()} 
                    active={editor.isActive('blockquote')}
                  />
                  <ToolbarButton 
                    icon={Sparkles} 
                    onClick={() => {
                      editor.chain().focus().insertContent({
                        type: 'blockquote',
                        content: [
                          {
                            type: 'paragraph',
                            content: [
                              {
                                type: 'text',
                                text: '"Our goal as platform architects is to minimize extraneous load, manage intrinsic load, and maximize germane load through intentional scaffolding."',
                              },
                            ],
                          },
                        ],
                      }).run();
                    }}
                    title="Insert Architect Quote"
                  />
                  
                  <div className="w-[1px] h-3 bg-white/20 mx-1"></div>
    
                  <ToolbarButton 
                    icon={AlignLeft} 
                    onClick={() => editor.chain().focus().setTextAlign('left').run()} 
                    active={editor.isActive({ textAlign: 'left' })}
                  />
                  <ToolbarButton 
                    icon={AlignCenter} 
                    onClick={() => editor.chain().focus().setTextAlign('center').run()} 
                    active={editor.isActive({ textAlign: 'center' })}
                  />
                  <ToolbarButton 
                    icon={AlignRight} 
                    onClick={() => editor.chain().focus().setTextAlign('right').run()} 
                    active={editor.isActive({ textAlign: 'right' })}
                  />
                  <ToolbarButton 
                    icon={AlignJustify} 
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()} 
                    active={editor.isActive({ textAlign: 'justify' })}
                  />
    
                  <div className="w-[1px] h-3 bg-white/20 mx-1"></div>
                  
                  <ToolbarButton 
                    icon={LinkIcon} 
                    onClick={(e) => {
                      const rect = (e?.target as HTMLElement).getBoundingClientRect();
                      openLinkInput(rect.left, rect.bottom + 10);
                    }} 
                    active={editor.isActive('link')}
                  />
                  <ToolbarButton 
                    icon={ImageIcon} 
                    onClick={() => {
                      const url = window.prompt('Image URL');
                      if (url) editor.chain().focus().setImage({ src: url }).run();
                    }} 
                  />
                  <ToolbarButton 
                    icon={Code} 
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()} 
                    active={editor.isActive('codeBlock')}
                  />
                  
                  <div className="w-[1px] h-3 bg-white/20 mx-1"></div>
                  
                  <ToolbarButton 
                    icon={List} 
                    onClick={() => editor.chain().focus().toggleBulletList().run()} 
                    active={editor.isActive('bulletList')}
                  />
                  <ToolbarButton 
                    icon={ListOrdered} 
                    onClick={() => editor.chain().focus().toggleOrderedList().run()} 
                    active={editor.isActive('orderedList')}
                  />
                  
                  <div className="w-[1px] h-3 bg-white/20 mx-1"></div>
                  
                  <div className="relative">
                    <ToolbarButton 
                      icon={Palette} 
                      onClick={() => setShowColors(!showColors)} 
                      active={showColors}
                    />
                    {showColors && (
                      <div className="absolute top-full left-0 mt-2 bg-inverse-surface p-2 rounded-lg shadow-xl flex gap-2 border border-white/10 z-50">
                        {colors.map(color => (
                          <button
                            key={color.name}
                            onClick={() => {
                              editor.chain().focus().setColor(color.value).run();
                              setShowColors(false);
                            }}
                            className={cn(
                              "w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition-transform",
                              color.bg
                            )}
                            title={color.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-0">
            {isPreview ? (
              <div className="flex-1 overflow-y-auto no-scrollbar bg-surface min-h-full">
                {editorFormat === 'article' ? (
                  <>
                    {/* Article Header Preview */}
                    <header className="px-10 pt-10 mb-8 max-w-7xl mx-auto">
                      <div className="flex items-center gap-2.5 mb-5">
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest">
                          Pedagogy
                        </span>
                        <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                        <div className="flex items-center gap-1 text-secondary text-[9px] font-bold uppercase tracking-widest">
                          <Clock className="w-3 h-3" />
                          {Math.ceil(wordCount / 200)} min read
                        </div>
                        <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                        <div className="flex items-center gap-1 text-secondary text-[9px] font-bold uppercase tracking-widest">
                          <Calendar className="w-3 h-3" />
                          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>

                      <h1 className="text-4xl md:text-5xl font-black text-on-surface leading-[1.1] tracking-tighter mb-6 font-manrope">
                        {title}
                      </h1>
                      
                      {subtitle && (
                        <p className="text-lg text-secondary leading-relaxed font-medium mb-10">
                          {subtitle}
                        </p>
                      )}
                    </header>

                    {/* Hero Image Preview */}
                    <div className="mb-12 px-10 max-w-7xl mx-auto">
                      <div className="aspect-[21/9] rounded-[32px] overflow-hidden ambient-shadow">
                        <img 
                          src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1600" 
                          alt="Article Hero" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>

                    {/* Content Preview */}
                    <div className="max-w-7xl mx-auto px-10 pb-20">
                      <div className="grid grid-cols-12 gap-12">
                        <div className="col-span-12 lg:col-span-8">
                          <div className="preview-content prose prose-sm max-w-none text-on-surface/90 text-sm leading-[1.6] font-inter">
                            <div dangerouslySetInnerHTML={{ __html: editor.getHTML() }} />
                          </div>
                        </div>
                        
                        {/* Sidebar Preview */}
                        <div className="hidden lg:block lg:col-span-4">
                          <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/10 sticky top-24">
                            <h3 className="text-sm font-bold font-manrope mb-5">About the Author</h3>
                            <div className="flex items-center gap-3 mb-5">
                              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 bg-surface-container flex items-center justify-center">
                                {user?.profileImage ? (
                                  <img src={user.profileImage} alt="Author" referrerPolicy="no-referrer" />
                                ) : (
                                  <Users className="w-6 h-6 text-secondary" />
                                )}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold font-manrope">{user?.fullName || user?.username || 'EduWatch'}</h4>
                                <p className="text-[9px] text-primary font-bold uppercase tracking-widest">Follow</p>
                              </div>
                            </div>
                            <p className="text-[10px] text-secondary leading-relaxed mb-6">
                              {user?.bio || 'No bio provided yet.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Micropost Preview Style */
                  <div className="flex items-center justify-center min-h-[500px] p-6">
                    <div className="w-full max-w-xl bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-lg overflow-hidden">
                      <div className="p-5 border-b border-outline-variant/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container">
                            <img src={user?.profileImage || `https://i.pravatar.cc/100?u=${user?.username}`} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-on-surface">{user?.fullName || user?.username}</h4>
                            <p className="text-[10px] text-secondary font-medium">Just now • Educational Tip</p>
                          </div>
                        </div>
                        <MoreVertical className="w-4 h-4 text-secondary" />
                      </div>
                      <div className="p-5">
                        <div className="preview-content prose prose-sm max-w-none text-on-surface text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: editor.getHTML() }} />
                      </div>
                      <div className="px-5 py-3 border-t border-outline-variant/5 bg-surface-container-low flex items-center justify-between">
                        <div className="flex gap-4">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-secondary">
                            <Heart className="w-3.5 h-3.5" /> 0
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-secondary">
                            <MessageCircle className="w-3.5 h-3.5" /> 0
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-primary">
                          <Share2 className="w-3.5 h-3.5" /> EduWatch Feed
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              editorFormat === 'article' ? (
                <div className="flex-1 overflow-y-auto p-10 pt-6">
                  <div onContextMenu={handleContextMenu} className="min-h-full">
                    <EditorContent editor={editor} className="h-full" />
                  </div>
                </div>
              ) : (
                /* Micropost Editor Style - Faceook Like */
                  <div className="w-full flex items-center justify-center bg-surface-container-low/30 h-full p-4 overflow-hidden">
                    <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-fit max-h-full">
                      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-2xl overflow-hidden flex flex-col min-h-0">
                      {/* Modal Header */}
                      <div className="p-4 border-b border-outline-variant/5 flex items-center justify-center relative shrink-0">
                        <h3 className="text-base font-black text-on-surface">Create post</h3>
                        <button 
                          onClick={() => {
                            setEditorFormat('article');
                            setIsPreview(false);
                          }}
                          className="absolute right-4 p-2 hover:bg-surface-container rounded-full transition-colors"
                        >
                          <X className="w-5 h-5 text-secondary" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar">
                        {/* User Profile Info */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/10">
                            <img 
                              src={user?.profileImage || `https://i.pravatar.cc/100?u=${user?.username}`} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-on-surface">
                              {user?.fullName || user?.username}
                              {(taggedUsers.length > 0 || postLocation.trim()) && (
                                <span className="font-normal text-secondary ml-1">
                                  {taggedUsers.length > 0 && (
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
                                  {postLocation.trim() && (
                                    <>
                                      {taggedUsers.length > 0 ? ' at ' : ' is at '}
                                      <span className="font-bold text-on-surface">{postLocation}</span>
                                    </>
                                  )}
                                </span>
                              )}
                            </h4>
                            <div className="flex items-center gap-1 mt-0.5 relative">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setShowPrivacyMenu(!showPrivacyMenu); }}
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-[10px] font-bold text-secondary hover:bg-surface-container-high transition-colors"
                              >
                                {micropostPrivacy === 'public' ? <Users className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                {micropostPrivacy === 'public' ? 'Public' : 'Followers'} 
                                <ChevronRight className="w-3 h-3 rotate-90" />
                              </button>

                              {showPrivacyMenu && (
                                <div className="absolute top-full left-0 mt-1 w-32 bg-surface-container-lowest border border-outline-variant/10 rounded-lg shadow-xl p-1 z-[60] animate-in fade-in zoom-in duration-200">
                                  <button 
                                    onClick={() => { setMicropostPrivacy('public'); setShowPrivacyMenu(false); }}
                                    className={cn(
                                      "flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] font-bold w-full transition-colors",
                                      micropostPrivacy === 'public' ? "bg-primary/10 text-primary" : "text-secondary hover:bg-surface-container"
                                    )}
                                  >
                                    <Users className="w-3 h-3" /> Public
                                  </button>
                                  <button 
                                    onClick={() => { setMicropostPrivacy('followers'); setShowPrivacyMenu(false); }}
                                    className={cn(
                                      "flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] font-bold w-full transition-colors",
                                      micropostPrivacy === 'followers' ? "bg-primary/10 text-primary" : "text-secondary hover:bg-surface-container"
                                    )}
                                  >
                                    <Shield className="w-3 h-3" /> Followers
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Draft Notification */}
                        {!editPostId && hasMicropostDraft && (
                          <div className="mx-4 mb-4 p-3 bg-primary/5 border border-primary/10 rounded-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-primary" />
                              <span className="text-[11px] font-bold text-primary italic">You have an unsaved micropost draft</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={handleRestoreMicropostDraft}
                                className="px-3 py-1 bg-primary text-white rounded-lg text-[10px] font-bold hover:brightness-110"
                              >
                                Restore
                              </button>
                              <button 
                                onClick={handleDiscardMicropostDraft}
                                className="p-1 hover:bg-tertiary/10 text-tertiary rounded-lg"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Writing Area */}
                        <div onContextMenu={handleContextMenu} className="min-h-[120px] text-lg mb-4">
                          <EditorContent editor={editor} />
                        </div>

                        {/* Media Preview Area - Grid Layout */}
                        {micropostImages.length > 0 && (
                          <div className={cn(
                            "relative grid gap-1 rounded-xl border border-outline-variant/10 overflow-hidden bg-surface-container-low mb-4",
                            micropostImages.length === 1 ? "grid-cols-1" : "grid-cols-2"
                          )}>
                             {micropostImages.map((img, idx) => (
                               <div key={idx} className="relative group aspect-square">
                                 {isVideoUrl(img) ? (
                                   <video src={img} className="w-full h-full object-cover bg-black" />
                                 ) : (
                                   <img src={img} alt={`Post media ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                 )}
                                 <button 
                                    onClick={() => setMicropostImages(prev => prev.filter((_, i) => i !== idx))}
                                    className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-md rounded-full shadow-md text-secondary hover:text-tertiary transition-all opacity-0 group-hover:opacity-100"
                                 >
                                    <X className="w-4 h-4" />
                                 </button>
                               </div>
                             ))}
                          </div>
                        )}

                        {/* Interactive Poll Composer */}
                        {showPoll && (
                          <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/10 space-y-2.5 mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                                <BarChart2 className="w-4 h-4" /> Poll Options
                              </span>
                              <button
                                onClick={() => setShowPoll(false)}
                                className="text-[10px] font-black text-secondary hover:text-red-500 transition-colors uppercase"
                              >
                                Remove Poll
                              </button>
                            </div>

                            <div className="space-y-2">
                              {pollOptions.map((opt, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                                    placeholder={`Option ${idx + 1}`}
                                    maxLength={50}
                                    className="flex-1 bg-surface-container-lowest border border-outline-variant/15 hover:border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-1 focus:ring-primary/55"
                                  />
                                  {pollOptions.length > 2 && (
                                    <button
                                      onClick={() => handleRemovePollOption(idx)}
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
                                onClick={handleAddPollOption}
                                type="button"
                                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add option
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bottom Controls */}
                      <div className="px-4 pb-4 shrink-0 bg-surface-container-lowest pt-2">
                        <div className="px-4 py-2 border border-outline-variant/20 rounded-xl flex items-center justify-between mb-4">
                          <span className="text-sm font-bold text-on-surface opacity-80">Add to your post</span>
                          <div className="flex items-center gap-1" ref={menuRef}>
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              className="hidden" 
                              accept="image/*,video/*" 
                              multiple
                              onChange={handleImageUpload}
                            />
                            <button 
                              onClick={() => {
                                fileInputRef.current?.click();
                                setShowTagMenu(false);
                                setShowLocationInput(false);
                              }}
                              className="p-2 hover:bg-surface-container rounded-full group transition-colors"
                              title="Photo/video"
                            >
                              <ImageIcon className="w-6 h-6 text-green-500 transition-transform group-hover:scale-110" />
                            </button>
                            <div className="relative">
                              <button 
                                onClick={() => {
                                  setShowTagMenu(!showTagMenu);
                                  setShowLocationInput(false);
                                }}
                                className={cn(
                                  "p-2 hover:bg-surface-container rounded-full transition-colors",
                                  taggedUsers.length > 0 ? "text-blue-600 bg-blue-50" : "text-blue-500"
                                )}
                                title="Tag people"
                              >
                                <Users className="w-6 h-6" />
                              </button>
                              
                              {showTagMenu && (
                                <div className="absolute bottom-full right-0 mb-2 w-56 bg-surface-container-lowest border border-outline-variant/10 rounded-xl shadow-2xl p-2 z-[70] animate-in fade-in slide-in-from-bottom-2 duration-200">
                                  <div className="p-2 border-b border-outline-variant/5 mb-1">
                                    <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">Tag people</h4>
                                    <input 
                                      type="text"
                                      autoFocus
                                      placeholder="Search followers..."
                                      value={tagSearchQuery}
                                      onChange={(e) => setTagSearchQuery(e.target.value)}
                                      className="w-full bg-surface-container border-none rounded-lg text-xs py-1.5 px-3 focus:ring-1 focus:ring-primary"
                                    />
                                  </div>
                                  <div className="max-h-48 overflow-y-auto no-scrollbar">
                                    {mockUsers.filter(u => u.name.toLowerCase().includes(tagSearchQuery.toLowerCase())).map(u => (
                                      <button 
                                        key={u.id}
                                        onClick={() => toggleTagUser(u)}
                                        className={cn(
                                          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors",
                                          taggedUsers.find(tu => tu.id === u.id) ? "bg-primary/10 text-primary font-bold" : "text-secondary hover:bg-surface-container"
                                        )}
                                      >
                                        {u.name}
                                        {taggedUsers.find(tu => tu.id === u.id) && <Heart className="w-3 h-3 fill-current" />}
                                      </button>
                                    ))}
                                    {mockUsers.filter(u => u.name.toLowerCase().includes(tagSearchQuery.toLowerCase())).length === 0 && (
                                      <div className="p-4 text-center text-secondary text-xs opacity-50">No followers found</div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="relative">
                              <button 
                                onClick={() => {
                                  setShowLocationInput(!showLocationInput);
                                  setShowTagMenu(false);
                                }}
                                className={cn(
                                  "p-2 hover:bg-surface-container rounded-full transition-colors",
                                  postLocation.trim() ? "text-orange-600 bg-orange-50" : "text-orange-500"
                                )}
                                title="Add location"
                              >
                                <MapPin className="w-6 h-6" />
                              </button>
                              
                              {showLocationInput && (
                                <div className="absolute bottom-full right-0 mb-2 w-64 bg-surface-container-lowest border border-outline-variant/10 rounded-xl shadow-2xl p-3 z-[70] animate-in fade-in slide-in-from-bottom-2 duration-200">
                                  <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">Location</h4>
                                  <div className="flex gap-2 mb-2">
                                    <div className="relative flex-1">
                                      <input 
                                        type="text"
                                        autoFocus
                                        value={postLocation}
                                        onChange={(e) => setPostLocation(e.target.value)}
                                        className="w-full bg-surface-container border-none rounded-lg text-xs py-2 px-3 focus:ring-1 focus:ring-primary h-8"
                                        placeholder="Search places..."
                                      />
                                      {isSearchingLocation && (
                                        <div className="absolute right-2 top-2">
                                          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                        </div>
                                      )}
                                    </div>
                                    {postLocation && (
                                      <button 
                                        onClick={() => { setPostLocation(''); setLocationSuggestions([]); }}
                                        className="p-1 hover:bg-surface-container rounded-md text-secondary"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                  
                                  {locationSuggestions.length > 0 && (
                                    <div className="max-h-40 overflow-y-auto no-scrollbar border-t border-outline-variant/5 pt-2">
                                      {locationSuggestions.map((suggestion, idx) => (
                                        <button
                                          key={idx}
                                          onClick={() => {
                                            setPostLocation(suggestion.display_name.split(',')[0]);
                                            setLocationSuggestions([]);
                                            setShowLocationInput(false);
                                          }}
                                          className="w-full text-left px-2 py-2 rounded-lg hover:bg-surface-container text-[11px] text-secondary transition-colors line-clamp-2"
                                        >
                                          {suggestion.display_name}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <button 
                              onClick={() => {
                                setShowPoll(!showPoll);
                                setShowTagMenu(false);
                                setShowLocationInput(false);
                              }}
                              className={cn(
                                "p-2 hover:bg-surface-container rounded-full transition-colors",
                                showPoll ? "text-primary bg-primary/10" : "text-purple-500"
                              )}
                              title="Add Poll"
                            >
                              <BarChart2 className="w-6 h-6" />
                            </button>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          {!editPostId && (
                            <button 
                              onClick={handleSaveMicropostDraft}
                              disabled={isPublishing || (!editor.getText().trim() && micropostImages.length === 0)}
                              className="flex-[0_0_auto] px-4 py-2.5 rounded-lg border border-outline-variant/30 text-secondary font-bold text-sm hover:bg-surface-container transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Save Draft
                            </button>
                          )}
                          <button 
                            onClick={handlePublish}
                            disabled={isPublishing || (!editor.getText().trim() && micropostImages.length === 0)}
                            className="flex-1 py-2.5 rounded-lg bg-primary text-white font-bold text-sm disabled:bg-surface-container-low disabled:text-secondary disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                          >
                            {isPublishing ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              editPostId ? 'Update' : 'Post'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-center">
                      <p className="text-[9px] font-bold text-secondary uppercase tracking-widest opacity-40">
                        Shift + Enter for new line • Ctrl + Enter to Publish
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Context Menu */}
          {contextMenu && (
            <div 
              className="fixed z-[100] bg-inverse-surface/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-1.5 flex flex-col gap-0.5 min-w-[160px]"
              style={{ top: contextMenu.y, left: contextMenu.x }}
              onClick={(e) => e.stopPropagation()}
            >
              <ContextMenuItem 
                icon={Bold} 
                label="Bold" 
                onClick={() => { editor.chain().focus().toggleBold().run(); closeContextMenu(); }}
                active={editor.isActive('bold')}
              />
              <ContextMenuItem 
                icon={Italic} 
                label="Italic" 
                onClick={() => { editor.chain().focus().toggleItalic().run(); closeContextMenu(); }}
                active={editor.isActive('italic')}
              />
              <ContextMenuItem 
                icon={UnderlineIcon} 
                label="Underline" 
                onClick={() => { editor.chain().focus().toggleUnderline().run(); closeContextMenu(); }}
                active={editor.isActive('underline')}
              />
              <div className="h-[1px] bg-white/10 my-1 mx-1"></div>
              {editor.isActive('link') ? (
                <>
                  <ContextMenuItem 
                    icon={LinkIcon} 
                    label="Edit Link" 
                    onClick={() => contextMenu && openLinkInput(contextMenu.x, contextMenu.y)}
                  />
                  <ContextMenuItem 
                    icon={X} 
                    label="Convert to Text" 
                    onClick={removeLink}
                  />
                </>
              ) : (
                <ContextMenuItem 
                  icon={LinkIcon} 
                  label="Link" 
                  onClick={() => contextMenu && openLinkInput(contextMenu.x, contextMenu.y)}
                />
              )}
              <ContextMenuItem 
                icon={Quote} 
                label="Quote" 
                onClick={() => { editor.chain().focus().toggleBlockquote().run(); closeContextMenu(); }}
                active={editor.isActive('blockquote')}
              />
              <div className="h-[1px] bg-white/10 my-1 mx-1"></div>
              <ContextMenuItem 
                icon={AlignLeft} 
                label="Align Left" 
                onClick={() => { editor.chain().focus().setTextAlign('left').run(); closeContextMenu(); }}
                active={editor.isActive({ textAlign: 'left' })}
              />
              <ContextMenuItem 
                icon={AlignCenter} 
                label="Align Center" 
                onClick={() => { editor.chain().focus().setTextAlign('center').run(); closeContextMenu(); }}
                active={editor.isActive({ textAlign: 'center' })}
              />
            </div>
          )}

          {/* Link Input Popup */}
          {linkInput && (
            <div 
              className="fixed z-[110] bg-inverse-surface/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-2 flex items-center gap-2 min-w-[300px]"
              style={{ top: linkInput.y, left: linkInput.x }}
              onClick={(e) => e.stopPropagation()}
            >
              <input 
                autoFocus
                type="text"
                value={linkInput.value}
                onChange={(e) => setLinkInput({ ...linkInput, value: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && applyLink()}
                placeholder="Paste or type link URL..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary transition-colors"
              />
              <button 
                onClick={applyLink}
                className="bg-primary text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:brightness-110 transition-all"
              >
                Apply
              </button>
            </div>
          )}

          {/* Footer Info */}
          {editorFormat === 'article' && (
            <footer className="p-4 border-t border-outline-variant/5 flex items-center justify-between text-[10px] font-bold text-secondary uppercase tracking-widest bg-surface-container-lowest shrink-0">
              <div className="flex items-center gap-6">
                <span>Words: {stats.words}</span>
                <span>Chars: {stats.chars}</span>
                <span>Reading: {Math.ceil(stats.words / 200)} min</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  Editor active
                </span>
              </div>
            </footer>
          )}
        </div>
      </div>

        {/* Categories Section on the Right */}
        <aside className="hidden lg:block flex-[0_1_350px] min-w-0 h-full overflow-y-auto no-scrollbar pt-0 pb-20">
          <div className="space-y-6 pt-6">
            <div className="bg-surface-container-lowest rounded-2xl ambient-shadow p-6 flex flex-col border border-outline-variant/5">
            <h3 className="text-[11px] font-black font-manrope text-on-surface mb-4 uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                    selectedCategories.includes(cat) 
                      ? "bg-primary text-white border-primary shadow-sm shadow-primary/20" 
                      : "bg-surface-container-low text-secondary border-outline-variant/10 hover:border-primary/30"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            {selectedCategories.length > 0 && (
              <div className="mt-4 pt-4 border-t border-outline-variant/10">
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Selected: {selectedCategories.length}</p>
                <div className="flex flex-wrap gap-1">
                  {selectedCategories.map(cat => (
                    <span key={cat} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black uppercase">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 flex flex-col border border-outline-variant/10">
            <h3 className="text-[11px] font-black font-manrope text-on-surface mb-4 uppercase tracking-widest flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              Publish settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-secondary">Comments</span>
                <button 
                  onClick={() => setCommentsEnabled(!commentsEnabled)}
                  className={cn(
                    "w-9 h-5 rounded-full relative cursor-pointer flex items-center p-1 transition-colors duration-200",
                    commentsEnabled ? "bg-primary" : "bg-outline-variant/30"
                  )}
                >
                  <motion.div 
                    layout
                    className="w-3 h-3 bg-white rounded-full shadow-sm"
                    initial={false}
                    animate={{
                      x: commentsEnabled ? 16 : 0
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </main>
</div>
);
}


function MenuAction({ icon: Icon, label, onClick, variant = 'default' }: { icon: any, label: string, onClick: () => void, variant?: 'default' | 'danger' }) {
  return (
    <button 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all w-full text-left",
        variant === 'danger' ? "text-tertiary hover:bg-tertiary/10" : "text-on-surface/70 hover:text-on-surface hover:bg-surface-container"
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

function ToolbarButton({ icon: Icon, onClick, active, title }: { icon: any, onClick?: (e?: React.MouseEvent) => void, active?: boolean, title?: string }) {
  return (
    <button 
      onClick={(e) => onClick?.(e)}
      title={title}
      className={cn(
        "p-1.5 rounded-lg transition-all",
        active ? "bg-primary text-white" : "text-white/70 hover:text-white hover:bg-white/10"
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function ContextMenuItem({ icon: Icon, label, onClick, active }: { icon: any, label: string, onClick: () => void, active?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all w-full text-left",
        active ? "bg-primary text-white" : "text-white/70 hover:text-white hover:bg-white/10"
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
