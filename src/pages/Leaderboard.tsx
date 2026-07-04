import React, { useState, useEffect } from 'react';
import { TopBar } from '../components/TopBar';
import { Sidebar } from '../components/Sidebar';
import { useSidebar } from '../lib/SidebarContext';
import { 
  Trophy, 
  TrendingUp, 
  Search, 
  Users, 
  Medal,
  Award,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { userService } from '../services/userService';

// Mocked fallback data for 10k user simulation if DB is starting empty
const MOCK_LEADERBOARD_FALLBACK = [
  { id: '1', name: 'Dr. Sarah Chen', rank: 1, score: 12540, impact: 8420, avatar: 'SC', specialty: 'Neuroscience' },
  { id: '2', name: 'Alex Rivera', rank: 2, score: 11200, impact: 7100, avatar: 'AR', specialty: 'Data Ethics' },
  { id: '3', name: 'Elena Gilbert', rank: 3, score: 9850, impact: 6500, avatar: 'EG', specialty: 'Modern History' },
  { id: '4', name: 'Marcus Wright', rank: 4, score: 8400, impact: 5200, avatar: 'MW', specialty: 'Quantum Computing' },
  { id: '5', name: 'Sofia Rodriguez', rank: 5, score: 7900, impact: 4800, avatar: 'SR', specialty: 'Sustainable Energy' },
];

export default function Leaderboard() {
  const { isCollapsed } = useSidebar();
  const [activeMetric, setActiveMetric] = useState<'knowledge' | 'impact'>('knowledge');
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    
    const runUpdateAndSync = async () => {
      try {
        setLoading(true);
        // Execute continuous update and prioritisation algorithm
        const synced = await userService.syncAllUserRanksAndLeaderboard();
        if (active && synced && synced.length > 0) {
          setLeaders(synced);
        }
      } catch (err) {
        console.error("Leaderboard Sync error:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    runUpdateAndSync();

    // Continuous checking daemon: executes background checks and dynamic ranking recomputes every 25s
    const daemonInterval = setInterval(async () => {
      try {
        const synced = await userService.syncAllUserRanksAndLeaderboard();
        if (active && synced && synced.length > 0) {
          setLeaders(synced);
        }
      } catch (e) {
        console.error("Continuous score checking daemon error:", e);
      }
    }, 25000);

    return () => {
      active = false;
      clearInterval(daemonInterval);
    };
  }, []);

  // Merge Firestore live leaders with gorgeous fallbacks if DB is sparsely populated
  const mergedLeaders = [...leaders];
  while (mergedLeaders.length < 5) {
    const nextIdx = mergedLeaders.length;
    const fallbackUser = MOCK_LEADERBOARD_FALLBACK[nextIdx] || MOCK_LEADERBOARD_FALLBACK[0];
    mergedLeaders.push({
      uid: fallbackUser.id,
      fullName: fallbackUser.name,
      username: fallbackUser.name.toLowerCase().replace(/\s/g, ''),
      profileImage: '',
      specialty: fallbackUser.specialty,
      stats: {
        knowledgeScore: fallbackUser.score,
        eduImpact: fallbackUser.impact,
        globalRank: nextIdx + 1,
        contributorRank: fallbackUser.score > 5000 ? 'Elite Contributor' : 'Active Mentor',
        achievements: ['Community Pioneer']
      }
    });
  }

  // Get first letters of fullname for avatarfallback
  const getAvatarFallback = (fullName: string) => {
    if (!fullName) return '?';
    return fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-surface">
      <TopBar />
      <main className="mt-[70px] flex h-[calc(100vh-70px)] overflow-hidden">
        <aside className={cn(
          "hidden lg:block shrink-0 h-full overflow-y-auto no-scrollbar pt-6 pb-20 transition-all border-r border-outline-variant/10 bg-surface-container-lowest",
          isCollapsed ? "w-[80px]" : "w-[300px]"
        )}>
          <Sidebar />
        </aside>

        <section className="flex-1 overflow-y-auto pt-8 px-6 pb-20 no-scrollbar">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2 text-primary">
                  <Trophy className="w-5 h-5 text-amber-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Global Rankings</span>
                </div>
                <h1 className="text-4xl font-black font-manrope tracking-tight">World-Class Minds</h1>
                <p className="text-secondary font-medium text-sm">Join the top educators shaping the future of knowledge through continuous peer validation.</p>
              </div>

              {/* Metric Switcher */}
              <div className="flex p-1 bg-surface-container rounded-xl self-start md:self-end">
                <button 
                  onClick={() => setActiveMetric('knowledge')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer",
                    activeMetric === 'knowledge' ? "bg-surface-container-lowest shadow-sm text-primary" : "text-secondary hover:text-on-surface"
                  )}
                >
                  Knowledge Score
                </button>
                <button 
                  onClick={() => setActiveMetric('impact')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer",
                    activeMetric === 'impact' ? "bg-surface-container-lowest shadow-sm text-primary" : "text-secondary hover:text-on-surface"
                  )}
                >
                  Edu Impact
                </button>
              </div>
            </div>

            {/* Top 3 Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {[mergedLeaders[1], mergedLeaders[0], mergedLeaders[2]].map((user, idx) => {
                const rankPos = user.stats?.globalRank || (idx === 0 ? 2 : idx === 1 ? 1 : 3);
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={user.uid || idx}
                    className={cn(
                      "bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 relative overflow-hidden group hover:border-primary/30 transition-all",
                      rankPos === 1 ? "md:-mt-4 ring-2 ring-primary/20 md:pb-10" : "opacity-90 scale-95"
                    )}
                  >
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="relative">
                        {user.profileImage ? (
                          <img 
                            src={user.profileImage} 
                            referrerPolicy="no-referrer" 
                            className="w-20 h-20 rounded-2xl object-cover border border-outline-variant/10 group-hover:scale-105 transition-transform" 
                            alt={user.fullName}
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-black text-primary group-hover:scale-105 transition-transform">
                            {getAvatarFallback(user.fullName)}
                          </div>
                        )}
                        <div className={cn(
                          "absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-surface-container-lowest flex items-center justify-center text-xs font-black",
                          rankPos === 1 ? "bg-amber-400 text-amber-950" :
                          rankPos === 2 ? "bg-slate-350 text-slate-800 bg-slate-300" : "bg-amber-600 text-amber-100"
                        )}>
                          {rankPos}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-on-surface line-clamp-1">{user.fullName}</h3>
                        <p className="text-[10px] uppercase font-black tracking-widest text-secondary">
                          {user.specialty || user.stats?.contributorRank || 'Academic Learner'}
                        </p>
                      </div>
                      <div className="w-full h-px bg-outline-variant/10" />
                      <div className="flex flex-col">
                        <span className="text-2xl font-black text-primary">
                          {(activeMetric === 'knowledge' ? user.stats?.knowledgeScore : user.stats?.eduImpact)?.toLocaleString() || 0}
                        </span>
                        <span className="text-[9px] font-black uppercase text-secondary tracking-tighter">
                          {activeMetric === 'knowledge' ? 'Knowledge score' : 'Impact units'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* List View */}
            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 overflow-hidden text-left">
               <div className="p-4 border-b border-outline-variant/5 flex items-center justify-between bg-surface-container/30 px-8">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-secondary">
                    <Users className="w-4 h-4 text-primary" />
                    <span>Active Scholar Pipeline</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full select-none">
                    Continuous Sync Enabled
                  </div>
               </div>
               <div className="divide-y divide-outline-variant/5">
                 {mergedLeaders.map((user, idx) => {
                   const rPos = user.stats?.globalRank || (idx + 1);
                   return (
                     <div key={user.uid || idx} className="p-6 px-8 flex items-center justify-between hover:bg-surface-container/20 transition-colors">
                       <div className="flex items-center gap-6">
                          <span className="text-sm font-black text-secondary w-5">#{rPos}</span>
                          {user.profileImage ? (
                            <img 
                              src={user.profileImage} 
                              referrerPolicy="no-referrer" 
                              className="w-10 h-10 rounded-xl object-cover border border-outline-variant/10" 
                              alt={user.fullName}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-sm font-black text-primary">
                              {getAvatarFallback(user.fullName)}
                            </div>
                          )}
                          <div>
                            <p className="font-black text-sm text-on-surface">{user.fullName}</p>
                            <p className="text-[10px] text-secondary font-bold uppercase tracking-tight">
                              {user.specialty || user.stats?.contributorRank || 'Academic Learner'}
                            </p>
                          </div>
                       </div>
                       <div className="text-right flex items-center gap-8">
                          <div>
                             <p className="text-xs font-black text-primary">
                               {(activeMetric === 'knowledge' ? user.stats?.knowledgeScore : user.stats?.eduImpact)?.toLocaleString() || 0}
                             </p>
                             <p className="text-[8px] font-black text-secondary uppercase leading-tight">Score</p>
                          </div>
                       </div>
                     </div>
                   );
                 })}
               </div>
               <div className="p-6 text-center bg-surface-container/10">
                 <p className="text-[10px] font-black uppercase text-secondary tracking-wider">
                   All {mergedLeaders.length} active global peers calculated matching priority stand
                 </p>
               </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}
