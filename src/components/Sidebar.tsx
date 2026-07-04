import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Globe, 
  LayoutGrid, 
  UserPlus, 
  Bookmark, 
  BarChart2, 
  Settings as SettingsIcon,
  UserCircle,
  Menu,
  FileText,
  Trophy
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';
import { useSidebar } from '../lib/SidebarContext';

interface SidebarProps {
  className?: string;
  children?: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ className, children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { isCollapsed, toggleSidebar, setCollapsed } = useSidebar();

  React.useEffect(() => {
    if (location.pathname === '/settings') {
      setCollapsed(true);
    }
  }, [location.pathname, setCollapsed]);

  const isFeed = location.pathname === '/feed';
  const isFindPeople = location.pathname === '/find-people';
  const isCommunity = location.pathname === '/community';
  
  const queryParams = new URLSearchParams(location.search);
  const tab = queryParams.get('tab');

  const handleNavClick = (path: string, isActive: boolean) => {
    if (isActive && path === '/feed') {
      window.dispatchEvent(new CustomEvent('refresh-page-content', { detail: { path: '/feed' } }));
    } else {
      navigate(path);
    }
  };

  const navigationItems = [
    { icon: Globe, label: 'Feed', path: '/feed', active: isFeed },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard', active: location.pathname === '/leaderboard' },
    { icon: LayoutGrid, label: 'My Communities', path: '/community?tab=my', active: isCommunity && tab === 'my' },
    { icon: UserPlus, label: 'Find People', path: '/find-people', active: isFindPeople && !tab },
  ];

  const personalItems = [
    { icon: Bookmark, label: 'Bookmarks', path: '/bookmarks', active: location.pathname === '/bookmarks' },
    { icon: FileText, label: 'Drafts', path: '/drafts', active: location.pathname === '/drafts' },
    { icon: BarChart2, label: 'Analytics', path: '/profile?tab=analytics', active: tab === 'analytics' },
  ];

  return (
    <div className={cn(
      "hidden lg:block w-full h-fit border-r border-outline-variant/15 transition-all duration-300",
      isCollapsed ? "pr-0" : "pr-6",
      className
    )}>
      <div className="flex justify-end mb-4 px-2">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-secondary hover:text-primary active:scale-95 border border-transparent hover:border-outline-variant/10"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-1">
        {authLoading ? (
          <div className={cn(
            "w-full flex items-center gap-3 p-2 rounded-xl text-left animate-pulse bg-outline-variant/5 border border-outline-variant/10",
            isCollapsed && "justify-center px-2"
          )}>
            <div className="w-9 h-9 rounded-full bg-outline-variant/15 shrink-0" />
            {!isCollapsed && (
              <div className="h-3 w-28 bg-outline-variant/15 rounded" />
            )}
          </div>
        ) : (
          <button 
            onClick={() => navigate('/profile')}
            className={cn(
              "w-full flex items-center gap-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group text-left",
              isCollapsed && "justify-center px-2"
            )}
          >
            <div className="w-9 h-9 rounded-full bg-surface-container-low border border-outline-variant/10 overflow-hidden flex items-center justify-center shrink-0">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <UserCircle className="w-5 h-5 text-secondary" />
              )}
            </div>
            {!isCollapsed && (
              <span className="text-[13px] font-bold text-on-surface line-clamp-1 animate-in fade-in duration-300">{user?.fullName || 'User Profile'}</span>
            )}
          </button>
        )}

        <div className="py-2">
          {navigationItems.map((item) => (
            <button 
              key={item.label}
              onClick={() => handleNavClick(item.path, item.active)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-colors group text-left",
                isCollapsed && "justify-center px-3",
                item.active ? "bg-primary/5 text-primary" : "hover:bg-black/5 dark:hover:bg-white/5 text-secondary hover:text-on-surface"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", item.active ? "text-primary" : "text-secondary group-hover:text-primary transition-colors")} />
              {!isCollapsed && (
                <span className="text-[13px] font-bold animate-in fade-in duration-300">{item.label}</span>
              )}
            </button>
          ))}
        </div>

        <div className="h-px bg-outline-variant/10 my-1" />

        <div className="py-2">
          {!isCollapsed && (
            <div className="px-3 mb-2 pt-2 animate-in fade-in duration-300">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Personal Space</h3>
            </div>
          )}
          {personalItems.map((item) => (
            <button 
              key={item.label}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-colors group text-left",
                isCollapsed && "justify-center px-3",
                item.active ? "bg-primary/5 text-primary" : "hover:bg-black/5 dark:hover:bg-white/5 text-secondary hover:text-on-surface"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", item.active ? "text-primary" : "text-secondary group-hover:text-primary transition-colors")} />
              {!isCollapsed && (
                <span className="text-[13px] font-bold animate-in fade-in duration-300">{item.label}</span>
              )}
            </button>
          ))}
        </div>

        {children && (
          <>
            {!isCollapsed && <div className="h-px bg-outline-variant/10 my-4" />}
            <div className={cn("transition-all duration-300", isCollapsed ? "opacity-0 pointer-events-none mt-0 h-0 overflow-hidden" : "opacity-100")}>
              {children}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
