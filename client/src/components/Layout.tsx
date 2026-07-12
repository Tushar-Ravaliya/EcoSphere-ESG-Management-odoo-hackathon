import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { 
  Leaf, 
  Users, 
  ShieldAlert, 
  Award, 
  Settings as SettingsIcon, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    // Fetch overdue compliance alerts for warning banner
    const fetchAlerts = async () => {
      try {
        const overdue = await api.get('/compliance-issues/alerts/overdue');
        setOverdueCount(overdue.length);
        if (overdue.length > 0) {
          toast(`You have ${overdue.length} overdue compliance issues requiring attention!`, {
            icon: '⚠️',
            duration: 6000,
            style: {
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fee2e2'
            }
          });
        }
      } catch (err) {
        console.error("Failed to fetch compliance alerts", err);
      }
    };

    if (user) {
      fetchAlerts();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Environmental', path: '/environmental', icon: Leaf },
    { name: 'Social', path: '/social', icon: Users },
    { name: 'Governance', path: '/governance', icon: ShieldAlert },
    { name: 'Gamification', path: '/rewards', icon: Award },
  ];

  // Only show settings page if user is Admin or Manager
  if (user && (user.role === 'admin' || user.role === 'manager')) {
    navItems.push({ name: 'System Settings', path: '/settings', icon: SettingsIcon });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200">
        {/* Brand Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <Leaf size={18} className="animate-pulse" />
            </div>
            <span className="font-bold text-lg text-slate-800 tracking-tight">EcoSphere</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-50/50' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-emerald-600' : 'text-slate-400'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        {user && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 m-4 rounded-2xl">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold border border-slate-300">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user.role}</p>
              </div>
            </div>
            
            {/* XP and Points display */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs mb-3 bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-sm">
              <div>
                <p className="text-slate-400 font-medium">XP</p>
                <p className="text-amber-600 font-bold">{user.xp}</p>
              </div>
              <div className="border-l border-slate-100">
                <p className="text-slate-400 font-medium">Points</p>
                <p className="text-cyan-600 font-bold">{user.points}</p>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-100 transition-colors"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Navbar */}
      <header className="md:hidden bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 z-20">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-md">
            <Leaf size={16} />
          </div>
          <span className="font-bold text-lg text-slate-800 tracking-tight">EcoSphere</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-10 pt-16 flex flex-col">
          <nav className="flex-1 px-6 py-8 space-y-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-4 px-5 py-4 rounded-2xl text-base font-semibold transition-all ${
                    isActive 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-emerald-600' : 'text-slate-400'} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          
          {user && (
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 m-6 rounded-2xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{user.role} | XP: {user.xp} | Points: {user.points}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center space-x-2 px-5 py-3.5 bg-red-50 rounded-2xl text-sm font-bold text-red-700 hover:bg-red-100 transition-colors"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* Global Warning Banner */}
        {overdueCount > 0 && (
          <div className="bg-red-50 border-b border-red-100 px-6 py-2.5 flex items-center justify-between text-xs font-semibold text-red-800">
            <div className="flex items-center space-x-2 min-w-0">
              <ShieldAlert size={14} className="text-red-600 flex-shrink-0" />
              <span className="truncate">Attention: {overdueCount} compliance audit issues are past their due dates. Check Governance page!</span>
            </div>
            <Link to="/governance" className="text-red-700 hover:underline flex-shrink-0 ml-4">
              View Issues &rarr;
            </Link>
          </div>
        )}

        {/* Content Wrapper */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

    </div>
  );
};
