import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { 
  ShieldAlert, 
  Plus, 
  Check, 
  Clock, 
  FileText,
  User,
  Users,
  Send,
  Loader2,
  Calendar,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Employee {
  _id: string;
  name: string;
  email: string;
}

interface Policy {
  _id: string;
  title: string;
  description: string;
  status: string;
}

interface ComplianceIssue {
  _id: string;
  auditTitle: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  owner: Employee;
  dueDate: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  isOverdue?: boolean;
}

export const Governance: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // Core records
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [issues, setIssues] = useState<ComplianceIssue[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [myAcknowledgements, setMyAcknowledgements] = useState<string[]>([]); // policy IDs acknowledged by current user
  
  // Pending acknowledgement details
  const [pendingPolicyDetail, setPendingPolicyDetail] = useState<Policy | null>(null);
  const [pendingEmployees, setPendingEmployees] = useState<Employee[]>([]);

  // Modals
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

  // Forms
  const [issueAuditTitle, setIssueAuditTitle] = useState('');
  const [issueSeverity, setIssueSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [issueDesc, setIssueDesc] = useState('');
  const [issueOwner, setIssueOwner] = useState('');
  const [issueDueDate, setIssueDueDate] = useState('');

  const [policyTitle, setPolicyTitle] = useState('');
  const [policyDesc, setPolicyDesc] = useState('');

  const fetchGovernanceData = async () => {
    try {
      const [policiesData, issuesData, empsData] = await Promise.all([
        api.get('/policies'),
        api.get('/compliance-issues'),
        api.get('/employees')
      ]);

      setPolicies(policiesData);
      setIssues(issuesData);
      setEmployees(empsData);

      // Check current user acknowledgments
      // Since there isn't a direct "my acknowledgements" endpoint, let's derive it or fetch
      // For a demo we can query policy by policy or keep it in mock storage if need be.
      // Wait! We can check who is pending acknowledgment for each policy to see if the current user is in that list!
      // This is a brilliant workaround! If current user is NOT in the pending acknowledgment list for a policy, they have acknowledged it!
      if (user) {
        const userAcks: string[] = [];
        for (const policy of policiesData) {
          const pending = await api.get(`/policies/${policy._id}/pending`);
          const isPending = pending.some((e: any) => e.email === user.email);
          if (!isPending) {
            userAcks.push(policy._id);
          }
        }
        setMyAcknowledgements(userAcks);
      }

    } catch (err) {
      console.error("Governance fetch error", err);
      toast.error('Failed to load compliance audits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGovernanceData();
  }, [user]);

  const handleAcknowledge = async (policyId: string) => {
    if (!user) return;
    try {
      await api.post(`/policies/${policyId}/acknowledge`, { employeeId: user._id });
      toast.success('Policy acknowledged. Thank you for maintaining compliance.');
      setMyAcknowledgements([...myAcknowledgements, policyId]);
      fetchGovernanceData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to acknowledge policy');
    }
  };

  const handleShowPendingEmployees = async (policy: Policy) => {
    try {
      const pending = await api.get(`/policies/${policy._id}/pending`);
      setPendingPolicyDetail(policy);
      setPendingEmployees(pending);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load policy readers');
    }
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/policies', {
        title: policyTitle,
        description: policyDesc,
        status: 'Active'
      });
      toast.success('Corporate policy published');
      setIsPolicyModalOpen(false);
      setPolicyTitle('');
      setPolicyDesc('');
      fetchGovernanceData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish policy');
    }
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueAuditTitle || !issueOwner || !issueDueDate) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      await api.post('/compliance-issues', {
        auditTitle: issueAuditTitle,
        severity: issueSeverity,
        description: issueDesc,
        owner: issueOwner,
        dueDate: new Date(issueDueDate)
      });
      toast.success('Compliance issue registered');
      setIsIssueModalOpen(false);
      setIssueAuditTitle('');
      setIssueDesc('');
      setIssueOwner('');
      setIssueDueDate('');
      fetchGovernanceData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to register issue');
    }
  };

  const handleResolveIssue = async (issueId: string) => {
    try {
      await api.patch(`/compliance-issues/${issueId}`, { status: 'Resolved' });
      toast.success('Compliance issue resolved');
      fetchGovernanceData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve issue');
    }
  };



  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 size={40} className="text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-medium">Auditing compliance violations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Governance & Compliance</h1>
          <p className="text-slate-500 text-sm mt-1">Review organizational policies, audit compliance status, and resolve issues.</p>
        </div>
        
        {/* Actions for Manager/Admin */}
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <div className="flex space-x-3">
            <button 
              onClick={() => setIsPolicyModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Create Policy</span>
            </button>
            <button 
              onClick={() => setIsIssueModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/10 transition-all cursor-pointer active:scale-95"
            >
              <Plus size={16} />
              <span>Log Incident</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid: Compliance Incidents & Policies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Compliance Issues Column */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-slate-600 font-bold text-sm uppercase tracking-wider">Compliance Incident Log</h2>
          
          <div className="space-y-4">
            {issues.map((issue) => {
              const isOverdue = issue.status !== 'Resolved' && new Date(issue.dueDate) < new Date();
              return (
                <div key={issue._id} className={`p-5 bg-white border rounded-3xl shadow-sm hover:border-slate-300 transition-colors ${
                  isOverdue ? 'border-red-200 bg-red-50/5' : 'border-slate-200'
                }`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center flex-wrap gap-2">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          issue.severity === 'Critical' ? 'bg-red-100 text-red-800 border border-red-200' :
                          issue.severity === 'High' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                          issue.severity === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {issue.severity} Severity
                        </span>
                        
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          issue.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          issue.status === 'In Progress' ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' :
                          'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {issue.status}
                        </span>

                        {isOverdue && (
                          <span className="flex items-center text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                            <Clock size={10} className="mr-1" />
                            Overdue
                          </span>
                        )}
                      </div>
                      
                      <h3 className="font-extrabold text-slate-800 text-base mt-2">{issue.auditTitle}</h3>
                      <p className="text-slate-500 text-xs mt-1 leading-relaxed">{issue.description}</p>
                    </div>

                    <div className="flex items-center space-x-4 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                      <div className="text-[11px] text-slate-400 font-semibold space-y-1">
                        <div className="flex items-center">
                          <User size={12} className="mr-1.5" />
                          <span>Owner: <strong className="text-slate-700">{issue.owner?.name || 'Unassigned'}</strong></span>
                        </div>
                        <div className="flex items-center">
                          <Calendar size={12} className="mr-1.5" />
                          <span>Due: <strong className={isOverdue ? 'text-red-600' : 'text-slate-700'}>{new Date(issue.dueDate).toLocaleDateString()}</strong></span>
                        </div>
                      </div>

                      {issue.status !== 'Resolved' && (user?.role === 'admin' || user?.role === 'manager' || user?.email === issue.owner?.email) && (
                        <button
                          onClick={() => handleResolveIssue(issue._id)}
                          className="flex items-center space-x-1 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/10 cursor-pointer"
                        >
                          <Check size={12} />
                          <span>Resolve</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {!issues.length && (
              <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">No compliance incidents logged.</div>
            )}
          </div>
        </div>

        {/* Corporate Policies Column */}
        <div className="space-y-4">
          <h2 className="text-slate-600 font-bold text-sm uppercase tracking-wider">Corporate Policies</h2>
          
          <div className="space-y-4">
            {policies.map((policy) => {
              const isAcknowledged = myAcknowledgements.includes(policy._id);
              return (
                <div key={policy._id} className="p-4 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm flex items-center">
                      <FileText size={16} className="text-indigo-500 mr-1.5" />
                      {policy.title}
                    </h3>
                    <p className="text-slate-500 text-[11px] mt-1.5 leading-relaxed">{policy.description}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                    {isAcknowledged ? (
                      <span className="flex items-center space-x-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
                        <Check size={12} />
                        <span>Acknowledged</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAcknowledge(policy._id)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-600/10 cursor-pointer"
                      >
                        Acknowledge
                      </button>
                    )}

                    {(user?.role === 'admin' || user?.role === 'manager') && (
                      <button
                        onClick={() => handleShowPendingEmployees(policy)}
                        className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center"
                      >
                        <Users size={12} className="mr-1" />
                        Audits Pending
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {!policies.length && (
              <div className="text-center py-8 text-xs text-slate-400">No published policies.</div>
            )}
          </div>
        </div>

      </div>

      {/* Pending Acknowledgments Detail Sidebar/Modal */}
      {pendingPolicyDetail && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 border border-slate-200 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Pending Policy Sign-offs</h3>
                <p className="text-xs text-slate-400 mt-0.5">{pendingPolicyDetail.title}</p>
              </div>
              <button 
                onClick={() => setPendingPolicyDetail(null)}
                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 mb-4">
              {pendingEmployees.map((emp) => (
                <div key={emp.email} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <p className="font-bold text-slate-700">{emp.name}</p>
                    <p className="text-[10px] text-slate-400">{emp.email}</p>
                  </div>
                  {/* Mock reminder trigger */}
                  <button 
                    onClick={() => {
                      toast.success(`Compliance alert notification sent to ${emp.name}`);
                    }}
                    className="p-1 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-100 hover:text-slate-800"
                    title="Send Email Alert"
                  >
                    <Send size={12} />
                  </button>
                </div>
              ))}
              {!pendingEmployees.length && (
                <p className="text-xs text-emerald-600 font-bold text-center py-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  100% Compliance achieved! All employees acknowledged.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Log incident modal */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-200 shadow-2xl animate-scale-up">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <ShieldAlert className="text-indigo-500 mr-2" size={20} />
              <span>Log Compliance Incident</span>
            </h3>
            
            <form onSubmit={handleCreateIssue} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Audit/Incident Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Environmental Inspection"
                  value={issueAuditTitle}
                  onChange={(e) => setIssueAuditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Severity
                  </label>
                  <select
                    value={issueSeverity}
                    onChange={(e) => setIssueSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={issueDueDate}
                    onChange={(e) => setIssueDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Assigned Owner
                </label>
                <select
                  value={issueOwner}
                  onChange={(e) => setIssueOwner(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((e) => (
                    <option key={e._id} value={e._id}>{e.name} ({e.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Detail the infraction, missing files, or needed fixes..."
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="w-1/2 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/10"
                >
                  Save Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Policy Modal */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-200 shadow-2xl animate-scale-up">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Publish Corporate Policy</h3>
            
            <form onSubmit={handleCreatePolicy} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Policy Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. ESG Sustainability Mandate 2026"
                  value={policyTitle}
                  onChange={(e) => setPolicyTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Description / Content Summary
                </label>
                <textarea
                  placeholder="Briefly describe the policy contents and signoff mandates..."
                  value={policyDesc}
                  onChange={(e) => setPolicyDesc(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                ></textarea>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPolicyModalOpen(false)}
                  className="w-1/2 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/10"
                >
                  Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
