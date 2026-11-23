import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  HeartHandshake,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  Building2,
  Utensils,
  Truck,
  Users,
  Bell,
  Home,
} from 'lucide-react';
import { Button } from '../ui/Button';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'ADMIN': return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'DONOR': return <Utensils className="w-4 h-4 text-emerald-400" />;
      case 'NGO': return <Building2 className="w-4 h-4 text-emerald-400" />;
      case 'VOLUNTEER': return <Truck className="w-4 h-4 text-emerald-400" />;
      case 'BENEFICIARY': return <Users className="w-4 h-4 text-emerald-400" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#072B2B] text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full px-4 sm:px-8 py-3 bg-[#0A2F2F]/90 backdrop-blur-xl border-b border-[#155D3B]/40 text-white shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-emerald-400 flex items-center justify-center text-white shadow-md">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-white">FoodRescue</span>
            </Link>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#062626] border border-emerald-600/30 text-xs font-semibold text-emerald-300">
              {getRoleIcon()}
              <span>{user?.role} Portal</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-slate-300 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors">
              <Home className="w-3.5 h-3.5" />
              <span>Public Site</span>
            </Link>

            <div className="flex items-center gap-2 pl-2 border-l border-emerald-800/40">
              <span className="text-xs font-semibold text-white hidden md:inline">
                {user?.name}
              </span>
              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-full transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        <Outlet />
      </main>

      {/* Footer bar */}
      <footer className="w-full py-4 text-center text-[11px] text-slate-500 border-t border-[#155D3B]/20">
        FoodRescue Platform &copy; {new Date().getFullYear()} — Secure Real-time Session
      </footer>
    </div>
  );
};
