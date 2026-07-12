import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { 
  Award, 
  Flame, 
  ShoppingBag, 
  Lock, 
  HelpCircle,
  Plus,
  Loader2,
  Gift
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Reward {
  _id: string;
  name: string;
  description: string;
  pointsRequired: number;
  stock: number;
  status: string;
}

interface Badge {
  _id: string;
  name: string;
  description: string;
  icon: string;
  unlockRule: {
    type: string;
    threshold: number;
  };
}

interface UnlockedBadge {
  _id: string;
  badge: Badge;
  unlockedAt: string;
}

interface LeaderboardUser {
  _id: string;
  name: string;
  xp: number;
  points: number;
  department?: {
    name: string;
  } | string;
}

export const Gamification: React.FC = () => {
  const { user, updateUserStats } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'rewards' | 'badges' | 'leaderboard'>('rewards');
  const [loading, setLoading] = useState(true);

  // Data states
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [unlockedBadges, setUnlockedBadges] = useState<UnlockedBadge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [reportSummary, setReportSummary] = useState<any>(null);

  // Modal
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [rewardName, setRewardName] = useState('');
  const [rewardDesc, setRewardDesc] = useState('');
  const [rewardPoints, setRewardPoints] = useState('50');
  const [rewardStock, setRewardStock] = useState('10');
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const fetchGamificationData = async () => {
    try {
      const [rewardsData, badgesData, lbData, reportData] = await Promise.all([
        api.get('/rewards'),
        api.get('/badges'),
        api.get('/employees/leaderboard'),
        api.get('/gamification-report/summary')
      ]);

      setRewards(rewardsData);
      setAllBadges(badgesData);
      setLeaderboard(lbData);
      setReportSummary(reportData);

      if (user) {
        const myBadges = await api.get(`/badges/employee/${user._id}`);
        setUnlockedBadges(myBadges);
      }
    } catch (err) {
      console.error("Gamification loading error", err);
      toast.error('Failed to load rewards program details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGamificationData();
  }, [user]);

  const handleRedeem = async (rewardId: string, cost: number) => {
    if (!user) return;
    if (user.points < cost) {
      toast.error('Insufficient points to redeem this reward!');
      return;
    }

    setRedeemingId(rewardId);
    try {
      const res = await api.post(`/rewards/${rewardId}/redeem`, { employeeId: user._id });
      
      // Update global user stats store with remaining points
      updateUserStats(user.xp, res.employeePointsRemaining);
      toast.success(`Success! Redeemed: ${res.reward.name}`);
      
      // Refresh reward listing stock
      fetchGamificationData();
    } catch (err: any) {
      toast.error(err.message || 'Redemption failed');
    } finally {
      setRedeemingId(null);
    }
  };

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/rewards', {
        name: rewardName,
        description: rewardDesc,
        pointsRequired: parseInt(rewardPoints),
        stock: parseInt(rewardStock),
        status: 'Active'
      });
      toast.success('New reward added to catalog');
      setIsRewardModalOpen(false);
      setRewardName('');
      setRewardDesc('');
      fetchGamificationData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add reward');
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 size={40} className="text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-medium">Opening rewards catalog and leaderboard...</p>
      </div>
    );
  }

  // Check if a badge is unlocked by ID
  const isBadgeUnlocked = (badgeId: string) => {
    return unlockedBadges.some(ub => ub.badge?._id === badgeId);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Eco-Reward Catalog</h1>
          <p className="text-slate-500 text-sm mt-1">Redeem your earned sustainability points for eco-friendly incentives and corporate awards.</p>
        </div>

        {/* User Balance highlights */}
        {user && (
          <div className="flex items-center space-x-6 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Available Points</p>
              <p className="text-xl font-black text-cyan-600 mt-0.5">{user.points}</p>
            </div>
            <div className="h-8 border-l border-slate-200"></div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Badges Unlocked</p>
              <p className="text-xl font-black text-amber-600 mt-0.5">{unlockedBadges.length} / {allBadges.length}</p>
            </div>
            {user.role === 'admin' && (
              <>
                <div className="h-8 border-l border-slate-200"></div>
                <button 
                  onClick={() => setIsRewardModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/10 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Incentive</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Gamification Stats Summary row */}
      {reportSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Average Employee XP</p>
            <p className="text-lg font-extrabold text-slate-800 mt-1">{reportSummary.xp?.average ?? 0} XP</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Highest: {reportSummary.xp?.highest ?? 0} XP</p>
          </div>
          
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Challenge Completion</p>
            <p className="text-lg font-extrabold text-slate-800 mt-1">{reportSummary.challenges?.participationRate ?? 0}%</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Approved: {reportSummary.challenges?.approved ?? 0} / {reportSummary.challenges?.participations ?? 0}</p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Badge Unlock Rate</p>
            <p className="text-lg font-extrabold text-slate-800 mt-1">{reportSummary.badges?.unlockRate ?? 0}%</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Unlocked: {reportSummary.badges?.unlocked ?? 0} total badges</p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Average Points Banked</p>
            <p className="text-lg font-extrabold text-slate-800 mt-1">{reportSummary.rewards?.avgPoints ?? 0} Pts</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Cumulative: {reportSummary.rewards?.totalPoints ?? 0} Pts</p>
          </div>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('rewards')}
          className={`pb-4 px-6 text-sm font-bold transition-all relative flex items-center space-x-2 ${
            activeTab === 'rewards' ? 'text-cyan-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Gift size={16} />
          <span>Redeem Catalog</span>
          {activeTab === 'rewards' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500"></div>}
        </button>

        <button
          onClick={() => setActiveTab('badges')}
          className={`pb-4 px-6 text-sm font-bold transition-all relative flex items-center space-x-2 ${
            activeTab === 'badges' ? 'text-amber-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award size={16} />
          <span>My Badges Locker</span>
          {activeTab === 'badges' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"></div>}
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-4 px-6 text-sm font-bold transition-all relative flex items-center space-x-2 ${
            activeTab === 'leaderboard' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Flame size={16} />
          <span>Leaderboard</span>
          {activeTab === 'leaderboard' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></div>}
        </button>
      </div>

      {/* Rendering tab contents */}
      {activeTab === 'rewards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <div key={reward._id} className="glass-panel p-6 rounded-3xl shadow-sm flex flex-col justify-between hover:border-cyan-200 transition-colors border-t-4 border-t-cyan-500/80">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    reward.stock > 0 ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' : 'bg-red-50 text-red-700 border border-red-100'
                  }`}>
                    {reward.stock > 0 ? `${reward.stock} in stock` : 'Out of stock'}
                  </span>
                  
                  <span className="text-sm font-extrabold text-cyan-600 bg-cyan-50 border border-cyan-100 px-2.5 py-1 rounded-xl">
                    {reward.pointsRequired} Pts
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-800 text-base">{reward.name}</h3>
                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">{reward.description}</p>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <button
                  disabled={reward.stock <= 0 || (user && user.points < reward.pointsRequired) || redeemingId === reward._id}
                  onClick={() => handleRedeem(reward._id, reward.pointsRequired)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    reward.stock <= 0 
                      ? 'bg-slate-100 text-slate-400 border border-slate-200' 
                      : user && user.points < reward.pointsRequired 
                        ? 'bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-600/10 active:scale-98'
                  }`}
                >
                  {redeemingId === reward._id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ShoppingBag size={14} />
                  )}
                  <span>{reward.stock <= 0 ? 'Out of Stock' : user && user.points < reward.pointsRequired ? 'Insufficient Points' : 'Redeem Incentive'}</span>
                </button>
              </div>
            </div>
          ))}
          {!rewards.length && (
            <div className="col-span-full py-16 text-center text-slate-400">No active incentives available. Check settings.</div>
          )}
        </div>
      )}

      {activeTab === 'badges' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {allBadges.map((badge) => {
            const unlocked = isBadgeUnlocked(badge._id);
            return (
              <div 
                key={badge._id} 
                className={`glass-panel p-6 rounded-3xl text-center flex flex-col items-center relative group transition-all duration-300 ${
                  unlocked 
                    ? 'border-amber-200 bg-amber-50/5 hover:bg-amber-50/10 shadow-md shadow-amber-50/10' 
                    : 'opacity-60 border-slate-200'
                }`}
              >
                
                {/* Lock icon overlay */}
                {!unlocked && (
                  <div className="absolute top-3.5 right-3.5 text-slate-400" title="Locked">
                    <Lock size={14} />
                  </div>
                )}

                {/* Badge Icon */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 border shadow-sm ${
                  unlocked 
                    ? 'bg-amber-100 border-amber-200 shadow-amber-100/50' 
                    : 'bg-slate-100 border-slate-200 text-slate-400 grayscale'
                }`}>
                  {badge.icon}
                </div>

                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">{badge.name}</h3>
                <p className="text-slate-400 text-[10px] mt-1 line-clamp-2 leading-relaxed">{badge.description}</p>
                
                {/* Rule tooltip trigger */}
                <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-center text-[10px] text-slate-400 font-semibold">
                  <HelpCircle size={12} className="mr-1 text-slate-400" />
                  <span>Rule: {badge.unlockRule?.type === 'xp' ? `${badge.unlockRule?.threshold} XP` : `${badge.unlockRule?.threshold} Challenges`}</span>
                </div>

              </div>
            );
          })}
          {!allBadges.length && (
            <div className="col-span-full py-16 text-center text-slate-400">No gamification achievements registered.</div>
          )}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="glass-panel p-6 rounded-3xl shadow-sm max-w-2xl mx-auto flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-slate-600 font-bold text-sm uppercase tracking-wider">Cumulated Employee Leaderboard</h2>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 flex items-center">
              <Flame size={12} className="mr-1 fill-amber-500 text-amber-500" />
              <span>Real-time rank updates</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                  <th className="pb-3 pl-2">Rank</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3 text-right">XP</th>
                  <th className="pb-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {leaderboard.map((emp, index) => (
                  <tr key={emp._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 pl-2">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                        index === 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        index === 1 ? 'bg-slate-200 text-slate-700 border border-slate-300' :
                        index === 2 ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                        'text-slate-500 bg-slate-100'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-4 font-bold text-slate-800">
                      <div>{emp.name}</div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {typeof emp.department === 'object' ? emp.department.name : emp.department || 'EcoSphere'}
                      </div>
                    </td>
                    <td className="py-4 text-right font-extrabold text-amber-600">{emp.xp}</td>
                    <td className="py-4 text-right font-extrabold text-cyan-600">{emp.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add reward modal */}
      {isRewardModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-200 shadow-2xl animate-scale-up">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <ShoppingBag className="text-cyan-500 mr-2" size={20} />
              <span>Publish Eco-Reward Incentive</span>
            </h3>
            
            <form onSubmit={handleCreateReward} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Reward Item Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Canvas Tote Bag"
                  value={rewardName}
                  onChange={(e) => setRewardName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Points Required
                  </label>
                  <input
                    type="number"
                    value={rewardPoints}
                    onChange={(e) => setRewardPoints(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Initial Stock Count
                  </label>
                  <input
                    type="number"
                    value={rewardStock}
                    onChange={(e) => setRewardStock(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Describe the incentive, dimensions, and redemption terms..."
                  value={rewardDesc}
                  onChange={(e) => setRewardDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  required
                ></textarea>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRewardModalOpen(false)}
                  className="w-1/2 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-bold shadow-md shadow-cyan-600/10"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
