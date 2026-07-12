import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { api } from '../services/api';
import { 
  ResponsiveContainer, 
  LineChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  Leaf, 
  Plus, 
  Trash2, 
  FileText,
  Loader2,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Department {
  _id: string;
  name: string;
  code: string;
}

interface EmissionFactor {
  _id: string;
  name: string;
  unit: string;
  co2PerUnit: number;
  sourceType: string;
}

interface CarbonTransaction {
  _id: string;
  department: Department;
  emissionFactor: EmissionFactor;
  quantity: number;
  calculatedCO2: number;
  date: string;
  notes?: string;
}

interface Goal {
  _id: string;
  title: string;
  targetCO2: number;
  currentCO2: number;
  startDate: string;
  endDate: string;
  status: string;
  progressPct: number;
  onTrack: boolean;
  department?: Department;
}

interface Summary {
  totalCO2: number;
  transactionCount: number;
  byDepartment: any[];
  bySourceType: any[];
  monthlyTrend: any[];
}

export const Environmental: React.FC = () => {
  const { user } = useAuthStore();
  const { config } = useSettingsStore();
  
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<CarbonTransaction[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [factors, setFactors] = useState<EmissionFactor[]>([]);

  // Filter states
  const [deptFilter, setDeptFilter] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDept, setNewDept] = useState('');
  const [newFactor, setNewFactor] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchEnvironmentalData = async () => {
    try {
      const deptQuery = deptFilter ? `?department=${deptFilter}` : '';
      const [sumData, goalsData, txsData, deptsData, factorsData] = await Promise.all([
        api.get(`/environmental-report/summary${deptQuery}`),
        api.get(`/environmental-report/goals${deptQuery}`),
        api.get(`/carbon-transactions${deptQuery}`),
        api.get('/departments'),
        api.get('/emission-factors')
      ]);

      setSummary(sumData);
      setGoals(goalsData);
      setTransactions(txsData);
      setDepartments(deptsData);
      setFactors(factorsData);
    } catch (err: any) {
      console.error("Failed to load environmental data", err);
      toast.error('Failed to load environmental data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvironmentalData();
  }, [deptFilter]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept || !newFactor || !newQty) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/carbon-transactions', {
        department: newDept,
        emissionFactor: newFactor,
        quantity: parseFloat(newQty),
        notes: newNotes,
        date: new Date()
      });
      toast.success('Carbon transaction logged successfully');
      setIsModalOpen(false);
      // Reset form
      setNewDept('');
      setNewFactor('');
      setNewQty('');
      setNewNotes('');
      // Reload details
      fetchEnvironmentalData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to log carbon transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this carbon transaction? This will adjust goal progresses.')) return;
    try {
      await api.delete(`/carbon-transactions/${id}`);
      toast.success('Carbon transaction deleted');
      fetchEnvironmentalData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete transaction');
    }
  };

  // Mock report download (frontend side mock)
  const handleExportCSV = () => {
    if (!transactions.length) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Department,Source Type,Emission Factor,Quantity,Unit,Calculated CO2 (kg),Notes\r\n";
    transactions.forEach((tx) => {
      const dateStr = new Date(tx.date).toLocaleDateString();
      csvContent += `"${dateStr}","${tx.department.name}","${tx.emissionFactor.sourceType}","${tx.emissionFactor.name}",${tx.quantity},"${tx.emissionFactor.unit}",${tx.calculatedCO2},"${tx.notes || ''}"\r\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EcoSphere_CarbonReport_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Report generated and downloaded!');
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 size={40} className="text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-medium">Gathering carbon accounting records...</p>
      </div>
    );
  }

  // Pie chart colors
  const COLORS = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Environmental Accounting</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor carbon transactions, configure emission factors, and track carbon offsets.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Department Filter dropdown */}
          <select 
            value={deptFilter} 
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
            ))}
          </select>

          {/* Export Report */}
          <button 
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
          >
            <FileText size={16} />
            <span>Export CSV</span>
          </button>

          {/* Log button for managers/admins */}
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/15 cursor-pointer active:scale-95 transition-all"
            >
              <Plus size={16} />
              <span>Log Emission</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-3xl shadow-sm">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Carbon Footprint</p>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-extrabold text-slate-800">{Math.round(summary.totalCO2).toLocaleString()}</span>
              <span className="text-sm font-bold text-slate-500">kg CO₂e</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Calculated from {summary.transactionCount} transactions.</p>
          </div>

          <div className="glass-panel p-6 rounded-3xl shadow-sm">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Goals Tracked</p>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-extrabold text-slate-800">
                {goals.filter(g => g.status === 'Active').length}
              </span>
              <span className="text-sm font-bold text-slate-500">goals active</span>
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-2">
              {goals.filter(g => g.status === 'Active' && g.onTrack).length} goals currently on track.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl shadow-sm">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Auto Calc Mode</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className={`w-2.5 h-2.5 rounded-full ${config.autoEmissionCalculation ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <span className="text-lg font-bold text-slate-700">
                {config.autoEmissionCalculation ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Emission factors matched on write.</p>
          </div>
        </div>
      )}

      {/* Charts section */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Trend */}
          <div className="glass-panel p-6 rounded-3xl lg:col-span-2 shadow-sm flex flex-col">
            <h2 className="text-slate-600 font-bold text-sm uppercase tracking-wider mb-6">Carbon Emission Trend</h2>
            <div className="flex-1 min-h-[220px]">
              {summary.monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={summary.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    <Line type="monotone" name="Calculated CO2 (kg)" dataKey="totalCO2" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">No emission trends log found for this department.</div>
              )}
            </div>
          </div>

          {/* Emissions by Source Type */}
          <div className="glass-panel p-6 rounded-3xl shadow-sm flex flex-col">
            <h2 className="text-slate-600 font-bold text-sm uppercase tracking-wider mb-6">Emissions by Source</h2>
            <div className="flex-1 min-h-[220px] flex items-center justify-center relative">
              {summary.bySourceType.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.bySourceType}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="totalCO2"
                      nameKey="sourceType"
                    >
                      {summary.bySourceType.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400">No source breakdown logs.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid: Goals & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Environmental Goals */}
        <div className="glass-panel p-6 rounded-3xl shadow-sm lg:col-span-1 flex flex-col space-y-4">
          <h2 className="text-slate-600 font-bold text-sm uppercase tracking-wider">Active Goals</h2>
          
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[350px] pr-1">
            {goals.length > 0 ? (
              goals.map((goal) => (
                <div key={goal._id} className="p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:border-slate-300 transition-colors">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{goal.title}</h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      goal.onTrack ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                      {goal.onTrack ? 'On Track' : 'Exceeded'}
                    </span>
                  </div>
                  <div className="mt-3.5 space-y-1">
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${goal.onTrack ? 'bg-emerald-500' : 'bg-red-500'}`} 
                        style={{ width: `${goal.progressPct}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-500">
                      <span>{Math.round(goal.currentCO2).toLocaleString()} kg CO2</span>
                      <span>Target: {Math.round(goal.targetCO2).toLocaleString()} kg</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 font-semibold border-t border-slate-50 pt-2.5">
                    <span className="flex items-center"><Calendar size={12} className="mr-1" /> Ends: {new Date(goal.endDate).toLocaleDateString()}</span>
                    {goal.department && <span className="capitalize bg-slate-100 px-1.5 py-0.5 rounded text-[9px]">{goal.department.name}</span>}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">No active environmental goals listed.</div>
            )}
          </div>
        </div>

        {/* Transaction Log Table */}
        <div className="glass-panel p-6 rounded-3xl shadow-sm lg:col-span-2 flex flex-col">
          <h2 className="text-slate-600 font-bold text-sm uppercase tracking-wider mb-6">Carbon Transaction Registry</h2>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3">Factor</th>
                  <th className="pb-3 text-right">Quantity</th>
                  <th className="pb-3 text-right">Calculated CO2</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 font-semibold text-slate-500">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="py-3 font-bold text-slate-800">{tx.department?.name || 'Unknown'}</td>
                    <td className="py-3">
                      <div>{tx.emissionFactor?.name || 'Unknown'}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{tx.emissionFactor?.sourceType}</div>
                    </td>
                    <td className="py-3 text-right font-medium">{tx.quantity} {tx.emissionFactor?.unit}</td>
                    <td className="py-3 text-right font-extrabold text-emerald-600">{Math.round(tx.calculatedCO2).toLocaleString()} kg</td>
                    <td className="py-3 text-right">
                      {user?.role === 'admin' ? (
                        <button 
                          onClick={() => handleDeleteTransaction(tx._id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete Transaction"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No action</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!transactions.length && (
              <div className="text-center py-12 text-slate-400">No carbon transactions recorded. Click Log Emission to add.</div>
            )}
          </div>
        </div>

      </div>

      {/* Log Emission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-200 shadow-2xl animate-scale-up">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <Leaf className="text-emerald-500 mr-2" size={20} />
              <span>Log Carbon Transaction</span>
            </h3>
            
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Department
                </label>
                <select
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Emission Factor
                </label>
                <select
                  value={newFactor}
                  onChange={(e) => setNewFactor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                >
                  <option value="">Select Factor Source</option>
                  {factors.map((f) => (
                    <option key={f._id} value={f._id}>{f.name} ({f.co2PerUnit} kg CO2/{f.unit})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Quantity
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 150"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Notes
                </label>
                <textarea
                  placeholder="Additional context or receipts notes..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                ></textarea>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-600/10 flex items-center justify-center space-x-1"
                >
                  {submitting && <Loader2 size={14} className="animate-spin mr-1" />}
                  <span>Save Record</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
