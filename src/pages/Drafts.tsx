import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { 
  FileText, 
  Clock, 
  ChevronRight, 
  PenLine, 
  Plus, 
  History,
  Share2,
  Sparkles,
  ArrowLeft,
  Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useSidebar } from '../lib/SidebarContext';

export default function Drafts() {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const [activeDraftTab, setActiveDraftTab] = useState<'articles' | 'microposts'>('articles');
  const [articleDrafts, setArticleDrafts] = useState<any[]>([]);
  const [micropostDrafts, setMicropostDrafts] = useState<any[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; type: 'article' | 'micropost'; index?: number } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const confirmAndDeleteDraft = () => {
    if (!confirmDelete) return;

    if (confirmDelete.type === 'article') {
      const updated = articleDrafts.filter(d => d.id !== confirmDelete.id);
      setArticleDrafts(updated);
      localStorage.setItem('technical_ledger_drafts', JSON.stringify(updated));
      showToast('Article draft deleted successfully!');
    } else {
      const updated = micropostDrafts.filter((d, idx) => {
        if (confirmDelete.id) {
          return d.id !== confirmDelete.id;
        }
        return idx !== confirmDelete.index;
      });
      setMicropostDrafts(updated);
      localStorage.setItem('eduwatch_micropost_drafts', JSON.stringify(updated));
      
      // Clear current draft if it matches
      const singleDraftJson = localStorage.getItem('eduwatch_micropost_draft');
      if (singleDraftJson) {
        const singleDraft = JSON.parse(singleDraftJson);
        if (singleDraft.id === confirmDelete.id) {
          localStorage.removeItem('eduwatch_micropost_draft');
        }
      }
      showToast('Micropost draft deleted successfully!');
    }

    setConfirmDelete(null);
  };

  useEffect(() => {
    // Load Article Drafts
    const articleDraftsJson = localStorage.getItem('technical_ledger_drafts');
    if (articleDraftsJson) {
      setArticleDrafts(JSON.parse(articleDraftsJson));
    }

    // Load Micropost Drafts
    const micropostDraftsJson = localStorage.getItem('eduwatch_micropost_drafts');
    if (micropostDraftsJson) {
      setMicropostDrafts(JSON.parse(micropostDraftsJson));
    } else {
      const singleDraft = localStorage.getItem('eduwatch_micropost_draft');
      if (singleDraft) {
        setMicropostDrafts([JSON.parse(singleDraft)]);
      }
    }
  }, []);

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
          <div className="w-full lg:flex-[1] min-w-0 h-full overflow-y-auto no-scrollbar pt-6 pb-40">
            <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-surface-container rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-black font-manrope tracking-tight">Drafts</h1>
                <p className="text-sm text-secondary font-medium mt-1">Pick up where you left off</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/write-article')}
              className="px-6 py-2.5 bg-primary text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create New
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 border-b border-outline-variant/10 mb-8">
            <button 
              onClick={() => setActiveDraftTab('articles')}
              className={cn(
                "pb-4 text-sm font-bold transition-all relative",
                activeDraftTab === 'articles' ? "text-primary" : "text-secondary hover:text-on-surface"
              )}
            >
              Articles
              {activeDraftTab === 'articles' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
            <button 
              onClick={() => setActiveDraftTab('microposts')}
              className={cn(
                "pb-4 text-sm font-bold transition-all relative",
                activeDraftTab === 'microposts' ? "text-primary" : "text-secondary hover:text-on-surface"
              )}
            >
              Microposts
              {activeDraftTab === 'microposts' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          </div>

          {/* Content */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {activeDraftTab === 'articles' ? (
              <div className="space-y-3">
                {articleDrafts.length > 0 ? (
                  articleDrafts.map((draft) => (
                    <div 
                      key={draft.id} 
                      onClick={() => navigate('/write-article', { state: { draft, format: 'article' } })}
                      className="flex items-center justify-between p-5 bg-surface-container-low rounded-2xl hover:bg-surface-container transition-all group cursor-pointer border border-outline-variant/5 hover:border-primary/20"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors truncate">{draft.title || 'Untitled Draft'}</h3>
                          <p className="text-xs text-secondary mt-1 font-medium flex items-center gap-2">
                            <Clock className="w-3 h-3" /> Last edited {draft.updatedAt ? new Date(draft.updatedAt).toLocaleDateString() : 'recently'} • {draft.words || 0} words
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className="text-[10px] font-black text-secondary bg-surface-container px-2.5 py-1 rounded-full uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Resume Editing</span>
                        <ChevronRight className="w-4 h-4 text-outline-variant group-hover:translate-x-1 transition-transform" />
                        <button
                          id={`delete-article-draft-${draft.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete({ id: draft.id, type: 'article' });
                          }}
                          className="p-2 text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                          title="Delete Draft"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState 
                    title="No article drafts" 
                    description="Your unsaved articles and long-form technical guides will appear here."
                  />
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {micropostDrafts.length > 0 ? (
                  micropostDrafts.map((draft, idx) => (
                    <div 
                      key={draft.id || idx} 
                      onClick={() => navigate('/write-article', { state: { draft, format: 'micropost' } })}
                      className="flex items-center justify-between p-5 bg-surface-container-low rounded-2xl hover:bg-surface-container transition-all group cursor-pointer border border-outline-variant/5 hover:border-primary/20"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center shrink-0">
                          <Share2 className="w-5 h-5 text-tertiary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-on-surface line-clamp-1 mb-1 group-hover:text-primary transition-colors" dangerouslySetInnerHTML={{ __html: draft.content || 'Empty draft' }}></div>
                          <p className="text-[10px] text-secondary font-medium flex items-center gap-2">
                            <Clock className="w-3 h-3" /> {new Date(draft.timestamp || draft.updatedAt || Date.now()).toLocaleDateString()} • {draft.images?.length || 0} images
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className="text-[10px] font-black text-secondary bg-surface-container px-2.5 py-1 rounded-full uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Resume</span>
                        <ChevronRight className="w-4 h-4 text-outline-variant group-hover:translate-x-1 transition-transform" />
                        <button
                          id={`delete-micropost-draft-${draft.id || idx}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete({ id: draft.id, type: 'micropost', index: idx });
                          }}
                          className="p-2 text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                          title="Delete Draft"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState 
                    title="No micropost drafts" 
                    description="Short updates and quick shares that you started are stored here."
                  />
                )}
              </div>
            )}
            </div>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest max-w-sm w-full rounded-3xl p-6 border border-outline-variant/10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-error/10 text-error flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 animate-bounce" />
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">Delete Draft</h3>
            <p className="text-sm text-secondary font-medium leading-relaxed mb-6">
              Are you sure you want to delete this draft permanently? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                id="cancel-delete-draft"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-transparent text-secondary hover:bg-surface-container rounded-xl font-bold text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-draft"
                onClick={confirmAndDeleteDraft}
                className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white hover:brightness-110 rounded-xl font-black text-sm shadow-lg shadow-red-500/20 active:scale-95 transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[110] bg-surface-container-highest border border-outline-variant/10 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className={cn(
            "w-2.5 h-2.5 rounded-full shrink-0",
            toast.type === 'success' ? "bg-primary animate-pulse" : "bg-error animate-pulse"
          )} />
          <span className="text-xs font-bold text-on-surface">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, description }: { title: string, description: string }) {
  const navigate = useNavigate();
  return (
    <div className="bg-surface-container-low/30 border-2 border-dashed border-outline-variant/10 rounded-3xl p-16 text-center">
      <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-6">
        <History className="w-8 h-8 text-outline-variant opacity-50" />
      </div>
      <h4 className="text-lg font-bold text-on-surface mb-2">{title}</h4>
      <p className="text-sm text-secondary font-medium max-w-sm mx-auto">{description}</p>
      <button onClick={() => navigate('/write-article')} className="mt-8 px-6 py-2.5 bg-primary text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95 flex items-center gap-2 mx-auto">
        <Plus className="w-4 h-4" /> Start Writing
      </button>
    </div>
  );
}
