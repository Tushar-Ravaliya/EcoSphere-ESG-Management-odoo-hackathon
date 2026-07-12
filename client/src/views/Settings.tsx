import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { 
  Settings as SettingsIcon, 
  ToggleLeft, 
  ToggleRight, 
  Building2, 
  FolderPlus, 
  Plus, 
  Loader2,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Department {
  _id: string;
  name: string;
  code: string;
  employeeCount: number;
}

interface Category {
  _id: string;
  name: string;
  type: string;
  status: string;
}

export const Settings: React.FC = () => {
  const { config, setToggle } = useSettingsStore();

  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Modals & Form states
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptCount, setDeptCount] = useState('1');

  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'CSR Activity' | 'Challenge'>('CSR Activity');
 
  // Report states
  const [reportFormat, setReportFormat] = useState('pdf');
  const [reportModule, setReportModule] = useState('all');
  const [reportFrom, setReportFrom] = useState('');
  const [reportTo, setReportTo] = useState('');
  const [reportDept, setReportDept] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleExportReport = async () => {
    setExporting(true);
    try {
      const token = useAuthStore.getState().token;
      
      const params = new URLSearchParams();
      params.append('format', reportFormat);
      params.append('module', reportModule);
      if (reportFrom) params.append('from', reportFrom);
      if (reportTo) params.append('to', reportTo);
      if (reportDept) params.append('department', reportDept);

      const response = await fetch(`http://localhost:5000/api/reports/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EcoSphere_ESG_Report_${reportModule}_${new Date().toISOString().split('T')[0]}.${reportFormat === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`${reportFormat.toUpperCase()} Report downloaded!`);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const fetchSettingsData = async () => {
    try {
      const [depts, cats] = await Promise.all([
        api.get('/departments'),
        api.get('/categories')
      ]);
      setDepartments(depts);
      setCategories(cats);
    } catch (err) {
      console.error("Failed to load settings options", err);
      toast.error('Failed to load settings details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName || !deptCode) return;
    try {
      await api.post('/departments', {
        name: deptName,
        code: deptCode,
        employeeCount: parseInt(deptCount)
      });
      toast.success('Department created successfully');
      setDeptName('');
      setDeptCode('');
      setDeptCount('1');
      fetchSettingsData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create department');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;
    try {
      await api.post('/categories', {
        name: catName,
        type: catType,
        status: 'Active'
      });
      toast.success('Shared category value created');
      setCatName('');
      fetchSettingsData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create category');
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 size={40} className="text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-medium">Opening master configuration panel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">System Settings & Admin</h1>
        <p className="text-slate-500 text-sm mt-1">Configure business rules, manage corporate departments, and establish categorizations.</p>
      </div>

      {/* Rules Toggles Section */}
      <div className="glass-panel p-6 rounded-3xl shadow-sm space-y-6">
        <h2 className="text-slate-600 font-bold text-sm uppercase tracking-wider mb-4 flex items-center">
          <SettingsIcon size={18} className="mr-2 text-indigo-500" />
          <span>ESG Business Configuration Rules</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Toggle 1: Evidence */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-start justify-between">
            <div className="space-y-1 pr-4">
              <h4 className="font-bold text-slate-800 text-sm">Evidence Requirement</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">Require employees to attach a proof document before CSR participations can be approved.</p>
            </div>
            <button 
              onClick={() => setToggle('evidenceRequirement', !config.evidenceRequirement)}
              className="text-slate-600 hover:text-slate-900 focus:outline-none"
            >
              {config.evidenceRequirement ? (
                <ToggleRight size={38} className="text-emerald-600 fill-emerald-50" />
              ) : (
                <ToggleLeft size={38} className="text-slate-300" />
              )}
            </button>
          </div>

          {/* Toggle 2: Badge Auto Award */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-start justify-between">
            <div className="space-y-1 pr-4">
              <h4 className="font-bold text-slate-800 text-sm">Badge Auto-Award</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">Automatically assign employee badges when XP thresholds or challenge counts are unlocked.</p>
            </div>
            <button 
              onClick={() => setToggle('badgeAutoAward', !config.badgeAutoAward)}
              className="text-slate-600 hover:text-slate-900 focus:outline-none"
            >
              {config.badgeAutoAward ? (
                <ToggleRight size={38} className="text-emerald-600 fill-emerald-50" />
              ) : (
                <ToggleLeft size={38} className="text-slate-300" />
              )}
            </button>
          </div>

          {/* Toggle 3: Auto Carbon Calculation */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-start justify-between">
            <div className="space-y-1 pr-4">
              <h4 className="font-bold text-slate-800 text-sm">Auto Carbon Multiplier</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed"> Derives carbon footprint calculatedCO2 automatically based on factors during logging.</p>
            </div>
            <button 
              onClick={() => setToggle('autoEmissionCalculation', !config.autoEmissionCalculation)}
              className="text-slate-600 hover:text-slate-900 focus:outline-none"
            >
              {config.autoEmissionCalculation ? (
                <ToggleRight size={38} className="text-emerald-600 fill-emerald-50" />
              ) : (
                <ToggleLeft size={38} className="text-slate-300" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Grid: Departments and Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Departments Panel */}
        <div className="glass-panel p-6 rounded-3xl shadow-sm flex flex-col space-y-6">
          <h2 className="text-slate-600 font-bold text-sm uppercase tracking-wider flex items-center">
            <Building2 size={18} className="mr-2 text-emerald-500" />
            <span>Company Departments Hierarchy</span>
          </h2>

          {/* Add form */}
          <form onSubmit={handleCreateDept} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex flex-col md:flex-row items-end gap-3">
            <div className="flex-1 space-y-2">
              <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Dept Name</label>
              <input 
                type="text" 
                placeholder="e.g. Sales" 
                value={deptName} 
                onChange={(e) => setDeptName(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                required
              />
            </div>
            
            <div className="w-24 space-y-2">
              <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Code</label>
              <input 
                type="text" 
                placeholder="e.g. SLS" 
                value={deptCode} 
                onChange={(e) => setDeptCode(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                required
              />
            </div>

            <div className="w-24 space-y-2">
              <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Count</label>
              <input 
                type="number" 
                value={deptCount} 
                onChange={(e) => setDeptCount(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                required
              />
            </div>

            <button 
              type="submit" 
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer h-[34px]"
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          </form>

          {/* List */}
          <div className="flex-1 overflow-y-auto max-h-[300px] divide-y divide-slate-100 pr-1">
            {departments.map((dept) => (
              <div key={dept._id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-extrabold text-slate-800">{dept.name}</span>
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500 uppercase">{dept.code}</span>
                </div>
                <span className="text-xs text-slate-400 font-semibold">{dept.employeeCount} headcount</span>
              </div>
            ))}
          </div>

        </div>

        {/* Categories Panel */}
        <div className="glass-panel p-6 rounded-3xl shadow-sm flex flex-col space-y-6">
          <h2 className="text-slate-600 font-bold text-sm uppercase tracking-wider flex items-center">
            <FolderPlus size={18} className="mr-2 text-cyan-500" />
            <span>Shared Module Categories</span>
          </h2>

          {/* Add form */}
          <form onSubmit={handleCreateCategory} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex flex-col md:flex-row items-end gap-3">
            <div className="flex-1 space-y-2">
              <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Category Name</label>
              <input 
                type="text" 
                placeholder="e.g. Carbon Offsetting" 
                value={catName} 
                onChange={(e) => setCatName(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                required
              />
            </div>

            <div className="w-40 space-y-2">
              <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Usage Type</label>
              <select
                value={catType}
                onChange={(e) => setCatType(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
              >
                <option value="CSR Activity">CSR Activity</option>
                <option value="Challenge">Challenge</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer h-[34px]"
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          </form>

          {/* List */}
          <div className="flex-1 overflow-y-auto max-h-[300px] divide-y divide-slate-100 pr-1">
            {categories.map((cat) => (
              <div key={cat._id} className="py-3 flex items-center justify-between text-sm">
                <span className="font-extrabold text-slate-800">{cat.name}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  cat.type === 'Challenge' ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}>
                  {cat.type}
                </span>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Unified ESG Report Exporter */}
      <div className="glass-panel p-6 rounded-3xl shadow-sm space-y-6">
        <h2 className="text-slate-600 font-bold text-sm uppercase tracking-wider mb-4 flex items-center">
          <FileText size={18} className="mr-2 text-indigo-500" />
          <span>Unified ESG & Gamification Report Exporter</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Module Scope</label>
            <select
              value={reportModule}
              onChange={(e) => setReportModule(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Modules</option>
              <option value="environmental">Environmental Only</option>
              <option value="social">Social Only</option>
              <option value="governance">Governance Only</option>
              <option value="gamification">Gamification Only</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Format</label>
            <select
              value={reportFormat}
              onChange={(e) => setReportFormat(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="pdf">PDF Document</option>
              <option value="excel">Excel Spreadsheet</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Department Filter</label>
            <select
              value={reportDept}
              onChange={(e) => setReportDept(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Date From</label>
            <input
              type="date"
              value={reportFrom}
              onChange={(e) => setReportFrom(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Date To</label>
            <input
              type="date"
              value={reportTo}
              onChange={(e) => setReportTo(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <button
              onClick={handleExportReport}
              disabled={exporting}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 flex items-center justify-center space-x-1.5 cursor-pointer h-[34px] disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <FileText size={14} />
                  <span>Export Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
