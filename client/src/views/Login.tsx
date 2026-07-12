import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { Leaf, Lock, Mail, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email, password });
      setAuth(data, data.token);
      toast.success(`Welcome back, ${data.name}!`);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-cyan-50 flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-100/40 blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-cyan-100/40 blur-3xl"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-slate-200/80 shadow-xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-200 mb-4">
            <Leaf size={24} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">EcoSphere</h1>
          <p className="text-slate-500 mt-2 text-sm">ERP-Integrated ESG Management Platform</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Corporate Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <Mail size={16} />
              </span>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <Lock size={16} />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-emerald-600/10 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Logging in...' : 'Sign In'}</span>
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider font-bold">
            <span className="bg-[#f8fafc] px-3 text-slate-400">Quick Login Demo Settings</span>
          </div>
        </div>

        {/* Quick Selections */}
        <div className="space-y-2">
          <button
            onClick={() => handleQuickLogin('admin@ecosphere.test')}
            className="w-full py-2.5 px-4 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between transition-colors shadow-sm cursor-pointer"
          >
            <span>Login as System Admin</span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">admin</span>
          </button>
          
          <button
            onClick={() => handleQuickLogin('alice@ecosphere.test')}
            className="w-full py-2.5 px-4 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between transition-colors shadow-sm cursor-pointer"
          >
            <span>Login as Employee (Alice)</span>
            <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 font-semibold border border-cyan-100">employee</span>
          </button>

          <button
            onClick={() => handleQuickLogin('bob@ecosphere.test')}
            className="w-full py-2.5 px-4 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between transition-colors shadow-sm cursor-pointer"
          >
            <span>Login as Employee (Bob)</span>
            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">employee</span>
          </button>
        </div>

      </div>
    </div>
  );
};
