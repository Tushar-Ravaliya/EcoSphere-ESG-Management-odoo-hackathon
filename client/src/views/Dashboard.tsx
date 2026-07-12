import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Bar, 
  Legend
} from 'recharts';
import { 
  TrendingDown, 
  Users, 
  Scale, 
  Flame, 
  Loader2, 
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DepartmentScore {
  department: string;
  departmentId: string;
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  totalScore: number;
}

interface DashboardScores {
  departments: DepartmentScore[];
  overallScore: number;
  weights: {
    environmental: number;
    social: number;
    governance: number;
  };
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

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scoreData, setScoreData] = useState<DashboardScores | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [scores, lb] = await Promise.all([
          api.get('/dashboard/scores'),
          api.get('/employees/leaderboard')
        ]);
        setScoreData(scores);
        setLeaderboard(lb);
      } catch (err: any) {
        console.error("Dashboard load failed", err);
        setError(err.message || 'Failed to load dashboard metrics');
        toast.error('Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 size={40} className="text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Calculating real-time ESG metrics...</p>
      </div>
    );
  }

  if (error || !scoreData) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-4 max-w-md mx-auto text-center">
        <AlertCircle size={48} className="text-red-500" />
        <h3 className="text-lg font-bold text-slate-800">Operational Aggregator Error</h3>
        <p className="text-slate-500 text-sm">{error || "Ensure backend server is running and seeded."}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/10"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Radar chart data: average Environmental, Social, and Governance scores
  const totalDeps = scoreData.departments.length || 1;
  const avgEnv = Math.round(scoreData.departments.reduce((s, d) => s + d.environmentalScore, 0) / totalDeps);
  const avgSoc = Math.round(scoreData.departments.reduce((s, d) => s + d.socialScore, 0) / totalDeps);
  const avgGov = Math.round(scoreData.departments.reduce((s, d) => s + d.governanceScore, 0) / totalDeps);

  const radarData = [
    { subject: 'Environmental', value: avgEnv, fullMark: 100 },
    { subject: 'Social', value: avgSoc, fullMark: 100 },
    { subject: 'Governance', value: avgGov, fullMark: 100 },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Banner Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">EcoSphere ESG Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time organizational compliance and sustainability scoring.</p>
        </div>
        <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl border border-emerald-100 text-sm font-semibold shadow-sm shadow-emerald-50">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>Live calculations synced</span>
        </div>
      </div>

      {/* Summary Score Metrics Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Overall Score Circle Widget */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-center text-center shadow-sm">
          <h2 className="text-slate-600 font-bold text-sm uppercase tracking-wider mb-6">Overall ESG Score</h2>
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* SVG circular track */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="68"
                className="stroke-slate-100"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r="68"
                className="stroke-emerald-500 transition-all duration-1000 ease-out"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 68}
                strokeDashoffset={2 * Math.PI * 68 * (1 - scoreData.overallScore / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-5xl font-extrabold text-slate-800">{scoreData.overallScore}</span>
              <span className="text-xs text-slate-400 font-semibold uppercase mt-0.5">Index Rating</span>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-slate-500 justify-center">
            <span className="px-3 py-1 bg-slate-100/80 rounded-full border border-slate-200/50">Env Weight: {scoreData.weights.environmental * 100}%</span>
            <span className="px-3 py-1 bg-slate-100/80 rounded-full border border-slate-200/50">Soc Weight: {scoreData.weights.social * 100}%</span>
            <span className="px-3 py-1 bg-slate-100/80 rounded-full border border-slate-200/50">Gov Weight: {scoreData.weights.governance * 100}%</span>
          </div>
        </div>

        {/* ESG Radar Chart breakdown */}
        <div className="glass-panel p-6 rounded-3xl lg:col-span-2 shadow-sm flex flex-col">
          <h2 className="text-slate-600 font-bold text-sm uppercase tracking-wider mb-4">ESG Alignment Breakdown</h2>
          <div className="flex-1 min-h-[220px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                <Radar 
                  name="Organization Index" 
                  dataKey="value" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.15} 
                />
                <Tooltip 
                  contentStyle={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', color: '#0f172a' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Pillar Breakdown Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Environmental pillar summary */}
        <div className="glass-panel p-6 rounded-3xl accent-border-env shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Environmental</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">Carbon Management</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100">
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="my-5">
            <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
              <span>Average Pillar Index</span>
              <span className="text-slate-800 font-bold">{avgEnv}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${avgEnv}%` }}></div>
            </div>
          </div>
          <p className="text-xs text-slate-400">Emission factors calculations and carbon transaction auditing active.</p>
        </div>

        {/* Social pillar summary */}
        <div className="glass-panel p-6 rounded-3xl accent-border-social shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-cyan-600 uppercase tracking-wider">Social Responsibility</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">Community & Action</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-500 flex items-center justify-center border border-cyan-100">
              <Users size={18} />
            </div>
          </div>
          <div className="my-5">
            <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
              <span>Average Pillar Index</span>
              <span className="text-slate-800 font-bold">{avgSoc}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${avgSoc}%` }}></div>
            </div>
          </div>
          <p className="text-xs text-slate-400">Employee CSR campaigns and sustainability challenges track record.</p>
        </div>

        {/* Governance pillar summary */}
        <div className="glass-panel p-6 rounded-3xl accent-border-gov shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Governance</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">Compliance Control</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center border border-indigo-100">
              <Scale size={18} />
            </div>
          </div>
          <div className="my-5">
            <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
              <span>Average Pillar Index</span>
              <span className="text-slate-800 font-bold">{avgGov}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${avgGov}%` }}></div>
            </div>
          </div>
          <p className="text-xs text-slate-400">Audit violations tracking, overdue alarms, and corporate policies logging.</p>
        </div>

      </div>

      {/* Grid: Department Scores vs Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Department bar chart */}
        <div className="glass-panel p-6 rounded-3xl shadow-sm flex flex-col">
          <h2 className="text-slate-600 font-bold text-sm uppercase tracking-wider mb-6">Department ESG Indices</h2>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreData.departments} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="department" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                />
                <Legend iconType="circle" />
                <Bar name="Overall Score" dataKey="totalScore" fill="#10b981" radius={[8, 8, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Employee Leaderboard Table */}
        <div className="glass-panel p-6 rounded-3xl shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-slate-600 font-bold text-sm uppercase tracking-wider">Employee Leaderboard</h2>
            <div className="flex items-center space-x-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
              <Flame size={12} className="fill-amber-500 text-amber-500" />
              <span>Top Achievers</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                  <th className="pb-3 pl-2">Rank</th>
                  <th className="pb-3">Employee</th>
                  <th className="pb-3 text-right">XP</th>
                  <th className="pb-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.map((emp, index) => (
                  <tr key={emp._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 pl-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        index === 1 ? 'bg-slate-200 text-slate-700 border border-slate-300' :
                        index === 2 ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                        'text-slate-500'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <div className="font-semibold text-slate-800">{emp.name}</div>
                      <div className="text-xs text-slate-400 capitalize">
                        {typeof emp.department === 'object' ? emp.department.name : emp.department || 'EcoSphere'}
                      </div>
                    </td>
                    <td className="py-3.5 text-right font-bold text-amber-600">{emp.xp}</td>
                    <td className="py-3.5 text-right font-bold text-cyan-600">{emp.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
