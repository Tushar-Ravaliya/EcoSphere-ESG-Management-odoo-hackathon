import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { api } from '../services/api';
import { 
  Users, 
  Plus, 
  Check, 
  X, 
  Award, 
  Flame, 
  FileCheck, 
  Loader2,
  Calendar,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

interface Category {
  _id: string;
  name: string;
  type: string;
}

interface CSRActivity {
  _id: string;
  title: string;
  category: Category | string;
  description: string;
  status: string;
}

interface EmployeeParticipation {
  _id: string;
  employee: { _id: string; name: string };
  activity: { _id: string; title: string };
  proof: boolean;
  approvalStatus: string;
  pointsEarned?: number;
  completionDate?: string;
}

interface Challenge {
  _id: string;
  title: string;
  category: Category | string;
  description: string;
  xp: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  evidenceRequired: boolean;
  deadline?: string;
  status: string;
}

interface ChallengeParticipation {
  _id: string;
  challenge: { _id: string; title: string; xp: number };
  employee: { _id: string; name: string };
  progress: number;
  proof: boolean;
  approvalStatus: string;
  xpAwarded?: number;
}

export const Social: React.FC = () => {
  const { user } = useAuthStore();
  const { config } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<'challenges' | 'csr' | 'inbox'>('challenges');
  const [loading, setLoading] = useState(true);

  // Data lists
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [csrActivities, setCsrActivities] = useState<CSRActivity[]>([]);
  const [myChallenges, setMyChallenges] = useState<ChallengeParticipation[]>([]);
  const [myCsrParticipations, setMyCsrParticipations] = useState<EmployeeParticipation[]>([]);
  
  // Inbox lists (manager/admin only)
  const [pendingCsr, setPendingCsr] = useState<EmployeeParticipation[]>([]);
  const [pendingChallenges, setPendingChallenges] = useState<ChallengeParticipation[]>([]);
  
  // Form resources
  const [categories, setCategories] = useState<Category[]>([]);

  // Create Modals
  const [isCsrModalOpen, setIsCsrModalOpen] = useState(false);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [isSubmitProofModalOpen, setIsSubmitProofModalOpen] = useState(false);

  // Forms
  const [csrTitle, setCsrTitle] = useState('');
  const [csrCategory, setCsrCategory] = useState('');
  const [csrDesc, setCsrDesc] = useState('');

  
  const [chalTitle, setChalTitle] = useState('');
  const [chalCategory, setChalCategory] = useState('');
  const [chalDesc, setChalDesc] = useState('');
  const [chalXp, setChalXp] = useState('30');
  const [chalDiff, setChalDiff] = useState<'Easy'|'Medium'|'Hard'>('Easy');
  const [chalEvidence, setChalEvidence] = useState(false);
  const [chalDeadline, setChalDeadline] = useState('');
  
  // Submit Proof states
  const [selectedSubmitId, setSelectedSubmitId] = useState<string | null>(null);
  const [selectedSubmitType, setSelectedSubmitType] = useState<'csr' | 'challenge'>('csr');
  const [proofAttached, setProofAttached] = useState(false);
  const [mockFileName, setMockFileName] = useState('');

  const fetchSocialData = async () => {
    try {
      const [chals, csrs, myChals, myCsrs, cats] = await Promise.all([
        api.get('/challenges'),
        api.get('/csr-activities'),
        user ? api.get(`/challenge-participations?employee=${user._id}`) : Promise.resolve([]),
        user ? api.get(`/employee-participations?employee=${user._id}`) : Promise.resolve([]),
        api.get('/categories')
      ]);

      setChallenges(chals);
      setCsrActivities(csrs);
      setMyChallenges(myChals);
      setMyCsrParticipations(myCsrs);
      setCategories(cats);

      // Fetch inbox approvals if admin or manager
      if (user && (user.role === 'admin' || user.role === 'manager')) {
        const [pCsr, pChal] = await Promise.all([
          api.get('/employee-participations'),
          api.get('/challenge-participations')
        ]);
        setPendingCsr(pCsr.filter((p: any) => p.approvalStatus === 'Pending'));
        setPendingChallenges(pChal.filter((p: any) => p.approvalStatus === 'Pending'));
      }
    } catch (err) {
      console.error("Failed to fetch social metrics", err);
      toast.error('Failed to load social metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialData();
  }, [user]);

  const handleCreateCsr = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/csr-activities', {
        title: csrTitle,
        category: csrCategory,
        description: csrDesc,
        status: 'Active'
      });
      toast.success('CSR Activity created');
      setIsCsrModalOpen(false);
      // Reset
      setCsrTitle('');
      setCsrCategory('');
      setCsrDesc('');
      fetchSocialData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create activity');
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/challenges', {
        title: chalTitle,
        category: chalCategory,
        description: chalDesc,
        xp: parseInt(chalXp),
        difficulty: chalDiff,
        evidenceRequired: chalEvidence,
        deadline: chalDeadline ? new Date(chalDeadline) : undefined,
        status: 'Active'
      });
      toast.success('Challenge created');
      setIsChallengeModalOpen(false);
      // Reset
      setChalTitle('');
      setChalCategory('');
      setChalDesc('');
      setChalDeadline('');
      setChalEvidence(false);
      fetchSocialData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create challenge');
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) return;
    try {
      await api.post('/challenge-participations', {
        employee: user._id,
        challenge: challengeId
      });
      toast.success('Joined challenge! Complete objectives to earn XP.');
      fetchSocialData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to join challenge');
    }
  };

  const openProofSubmitModal = (id: string, type: 'csr' | 'challenge') => {
    setSelectedSubmitId(id);
    setSelectedSubmitType(type);
    setProofAttached(false);
    setMockFileName('');
    setIsSubmitProofModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setMockFileName(e.target.files[0].name);
      setProofAttached(true);
    }
  };

  const handleRegisterParticipation = async () => {
    if (!user || !selectedSubmitId) return;

    if (config.evidenceRequirement && !proofAttached) {
      toast.error('Proof of participation is required by system settings');
      return;
    }

    try {
      if (selectedSubmitType === 'csr') {
        await api.post('/employee-participations', {
          employee: user._id,
          activity: selectedSubmitId,
          proof: proofAttached
        });
        toast.success('Recorded participation request! Awaiting manager approval.');
      } else {
        // Challenge participation submit proof
        // Since challenge doesn't have a direct edit progress, let's set progress to 100 on submit proof
        await api.post('/challenge-participations', {
          employee: user._id,
          challenge: selectedSubmitId,
          progress: 100,
          proof: proofAttached
        });
        toast.success('Challenge completed & proof logged! Awaiting manager approval.');
      }
      setIsSubmitProofModalOpen(false);
      fetchSocialData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record participation');
    }
  };

  const handleApproveParticipation = async (id: string, type: 'csr' | 'challenge') => {
    try {
      const endpoint = type === 'csr' 
        ? `/employee-participations/${id}/approve`
        : `/challenge-participations/${id}/approve`;
        
      const res = await api.patch(endpoint);
      
      toast.success('Participation approved!');
      
      // If employee updated (e.g. they got points/XP and badge triggers)
      if (res.newBadges && res.newBadges.length > 0) {
        // Fire confetti for the demo!
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        res.newBadges.forEach((badge: any) => {
          toast(`Badge Unlocked: "${badge.name}"! ${badge.description}`, {
            icon: '🏆',
            duration: 8000
          });
        });
      }

      fetchSocialData();
    } catch (err: any) {
      toast.error(err.message || 'Approval failed');
    }
  };

  const handleRejectParticipation = async (id: string) => {
    try {
      await api.patch(`/employee-participations/${id}/reject`);
      toast.error('Participation rejected');
      fetchSocialData();
    } catch (err: any) {
      toast.error(err.message || 'Rejection failed');
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 size={40} className="text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-medium">Loading engagement modules...</p>
      </div>
    );
  }

  // Find if already participated in a CSR Activity
  const getCsrStatusText = (activityId: string) => {
    const part = myCsrParticipations.find(p => p.activity?._id === activityId);
    return part ? part.approvalStatus : null;
  };

  // Find if already joined a Challenge
  const getChallengeStatus = (challengeId: string) => {
    const part = myChallenges.find(p => p.challenge?._id === challengeId);
    return part ? part : null;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Social & Gamification</h1>
          <p className="text-slate-500 text-sm mt-1">Join active challenges, volunteer for CSR events, and earn credentials.</p>
        </div>
        
        {/* Admin additions buttons */}
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <div className="flex space-x-3">
            <button 
              onClick={() => setIsCsrModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>New CSR Drive</span>
            </button>
            <button 
              onClick={() => setIsChallengeModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-bold shadow-md shadow-cyan-600/10 transition-all cursor-pointer active:scale-95"
            >
              <Plus size={16} />
              <span>New Challenge</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('challenges')}
          className={`pb-4 px-6 text-sm font-bold transition-all relative ${
            activeTab === 'challenges' 
              ? 'text-cyan-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Active Challenges
          {activeTab === 'challenges' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500"></div>}
        </button>

        <button
          onClick={() => setActiveTab('csr')}
          className={`pb-4 px-6 text-sm font-bold transition-all relative ${
            activeTab === 'csr' 
              ? 'text-emerald-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          CSR Volunteering
          {activeTab === 'csr' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></div>}
        </button>

        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button
            onClick={() => setActiveTab('inbox')}
            className={`pb-4 px-6 text-sm font-bold transition-all relative flex items-center space-x-1.5 ${
              activeTab === 'inbox' 
                ? 'text-indigo-600' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Review Inbox</span>
            {(pendingCsr.length + pendingChallenges.length) > 0 && (
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center border border-indigo-200">
                {pendingCsr.length + pendingChallenges.length}
              </span>
            )}
            {activeTab === 'inbox' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>}
          </button>
        )}
      </div>

      {/* Content Renderers */}
      {activeTab === 'challenges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((chal) => {
            const statusObj = getChallengeStatus(chal._id);
            return (
              <div key={chal._id} className="glass-panel p-6 rounded-3xl shadow-sm flex flex-col justify-between border-l-4 border-l-cyan-500/80">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      chal.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      chal.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                      {chal.difficulty}
                    </span>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 flex items-center">
                      <Flame size={12} className="mr-1 fill-amber-500 text-amber-500" />
                      {chal.xp} XP
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">{chal.title}</h3>
                    <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">{chal.description}</p>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400 font-semibold flex items-center">
                    <Calendar size={12} className="mr-1" />
                    {chal.deadline ? `Ends: ${new Date(chal.deadline).toLocaleDateString()}` : 'No limit'}
                  </div>

                  {statusObj ? (
                    statusObj.approvalStatus === 'Approved' ? (
                      <span className="flex items-center space-x-1.5 text-emerald-600 text-xs font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                        <Check size={14} />
                        <span>Completed (+{chal.xp} XP)</span>
                      </span>
                    ) : statusObj.approvalStatus === 'Pending' ? (
                      <span className="text-amber-600 text-xs font-bold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                        Under Review
                      </span>
                    ) : (
                      <button 
                        onClick={() => openProofSubmitModal(statusObj._id, 'challenge')}
                        className="flex items-center space-x-1 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-cyan-600/10 cursor-pointer"
                      >
                        <Sparkles size={12} />
                        <span>Submit Proof</span>
                      </button>
                    )
                  ) : (
                    <button 
                      onClick={() => handleJoinChallenge(chal._id)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      Start Challenge
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {!challenges.length && (
            <div className="col-span-full py-16 text-center text-slate-400">No active sustainability challenges found.</div>
          )}
        </div>
      )}

      {activeTab === 'csr' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {csrActivities.map((act) => {
            const status = getCsrStatusText(act._id);
            return (
              <div key={act._id} className="glass-panel p-6 rounded-3xl shadow-sm flex flex-col justify-between border-l-4 border-l-emerald-500/80">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-slate-400 capitalize bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">
                      {typeof act.category === 'object' ? act.category.name : 'CSR Campaign'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase">
                      {act.status}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-base">{act.title}</h3>
                  <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">{act.description}</p>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400 font-semibold flex items-center">
                    <Award size={12} className="mr-1 text-emerald-500" />
                    Completing awards 10 Points
                  </div>

                  {status ? (
                    status === 'Approved' ? (
                      <span className="flex items-center space-x-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                        <Check size={14} />
                        <span>Volunteered (+10 Pts)</span>
                      </span>
                    ) : status === 'Rejected' ? (
                      <span className="text-red-600 text-xs font-bold bg-red-50 px-3 py-1.5 rounded-xl border border-red-100">
                        Rejected
                      </span>
                    ) : (
                      <span className="text-amber-600 text-xs font-bold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                        Pending Manager
                      </span>
                    )
                  ) : (
                    <button 
                      onClick={() => openProofSubmitModal(act._id, 'csr')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/10 cursor-pointer"
                    >
                      Volunteer Drive
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {!csrActivities.length && (
            <div className="col-span-full py-16 text-center text-slate-400">No active CSR activities found.</div>
          )}
        </div>
      )}

      {activeTab === 'inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CSR Inbox */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-700 text-sm flex items-center space-x-2">
              <Users size={16} className="text-emerald-500" />
              <span>CSR Activity Submissions</span>
            </h3>
            
            <div className="space-y-3">
              {pendingCsr.map((p) => (
                <div key={p._id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{p.activity?.title || 'CSR Drive'}</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">Submitted by: <span className="font-bold text-slate-600">{p.employee?.name}</span></p>
                    {p.proof && (
                      <div className="mt-2 flex items-center text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 w-max">
                        <FileCheck size={10} className="mr-1" />
                        <span>Evidence Attachment Checked</span>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleApproveParticipation(p._id, 'csr')}
                      className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-colors cursor-pointer"
                      title="Approve"
                    >
                      <Check size={16} />
                    </button>
                    <button 
                      onClick={() => handleRejectParticipation(p._id)}
                      className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors cursor-pointer"
                      title="Reject"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {!pendingCsr.length && (
                <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">No pending CSR submissions.</div>
              )}
            </div>
          </div>

          {/* Challenges Inbox */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-700 text-sm flex items-center space-x-2">
              <Award size={16} className="text-cyan-500" />
              <span>Challenge Submissions</span>
            </h3>
            
            <div className="space-y-3">
              {pendingChallenges.map((p) => (
                <div key={p._id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{p.challenge?.title || 'Challenge'}</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">Submitted by: <span className="font-bold text-slate-600">{p.employee?.name}</span></p>
                    <p className="text-amber-600 font-bold text-[10px] mt-2">+ {p.challenge?.xp || 30} XP Awardable</p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleApproveParticipation(p._id, 'challenge')}
                      className="p-2 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100 hover:bg-cyan-100 transition-colors cursor-pointer"
                      title="Approve Completion"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {!pendingChallenges.length && (
                <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">No pending challenge approvals.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSR Add Modal */}
      {isCsrModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-200 shadow-2xl animate-scale-up">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Create CSR Activity</h3>
            
            <form onSubmit={handleCreateCsr} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Campaign Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Office Recycling Drive"
                  value={csrTitle}
                  onChange={(e) => setCsrTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Category
                </label>
                <select
                  value={csrCategory}
                  onChange={(e) => setCsrCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.filter(c => c.type === 'CSR Activity').map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Campaign logistics and guidelines..."
                  value={csrDesc}
                  onChange={(e) => setCsrDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                ></textarea>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCsrModalOpen(false)}
                  className="w-1/2 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/10"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Challenge Add Modal */}
      {isChallengeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-200 shadow-2xl animate-scale-up">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Create Challenge</h3>
            
            <form onSubmit={handleCreateChallenge} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Challenge Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Turn off monitors after 6pm"
                  value={chalTitle}
                  onChange={(e) => setChalTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Category
                  </label>
                  <select
                    value={chalCategory}
                    onChange={(e) => setChalCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.filter(c => c.type === 'Challenge').map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Difficulty
                  </label>
                  <select
                    value={chalDiff}
                    onChange={(e) => setChalDiff(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    XP Reward
                  </label>
                  <input
                    type="number"
                    value={chalXp}
                    onChange={(e) => setChalXp(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Deadline Date
                  </label>
                  <input
                    type="date"
                    value={chalDeadline}
                    onChange={(e) => setChalDeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Task objectives and details..."
                  value={chalDesc}
                  onChange={(e) => setChalDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  required
                ></textarea>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="chalEvidence"
                  checked={chalEvidence}
                  onChange={(e) => setChalEvidence(e.target.checked)}
                  className="h-4 w-4 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500"
                />
                <label htmlFor="chalEvidence" className="ml-2 text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Proof File Required for approval
                </label>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChallengeModalOpen(false)}
                  className="w-1/2 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-bold shadow-md shadow-cyan-600/10"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Proof Modal */}
      {isSubmitProofModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 border border-slate-200 shadow-2xl animate-scale-up">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Submit Participation Evidence</h3>
            <p className="text-xs text-slate-400 mb-4">Upload a document or photo confirming you completed this task.</p>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-500 transition-colors relative cursor-pointer bg-slate-50">
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="space-y-1.5">
                  <FileCheck size={32} className="mx-auto text-slate-400" />
                  <p className="text-xs font-bold text-slate-600">
                    {mockFileName ? mockFileName : 'Select or drop evidence file'}
                  </p>
                  <p className="text-[10px] text-slate-400">PDF, PNG, JPG up to 10MB</p>
                </div>
              </div>

              {config.evidenceRequirement && (
                <div className="flex items-center space-x-2 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 p-2 rounded-lg">
                  <Flame size={12} className="flex-shrink-0" />
                  <span>Note: Proof is mandatory per organization settings.</span>
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setIsSubmitProofModalOpen(false)}
                  className="w-1/2 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegisterParticipation}
                  disabled={config.evidenceRequirement && !proofAttached}
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/10 flex items-center justify-center space-x-1"
                >
                  <span>Submit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
