import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { HeartHandshake, Menu, X, User as UserIcon, LogOut, LayoutDashboard, Bell } from 'lucide-react';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'ADMIN': return '/admin';
      case 'DONOR': return '/donor';
      case 'NGO': return '/ngo';
      case 'VOLUNTEER': return '/volunteer';
      case 'BENEFICIARY': return '/beneficiary';
      default: return '/';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-8 py-3.5 bg-[#0A2F2F]/85 backdrop-blur-xl border-b border-[#155D3B]/40 text-white shadow-glass transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo matching reference theme */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-emerald-400 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <HeartHandshake className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-primary-100 to-emerald-300 bg-clip-text text-transparent">
              FoodRescue
            </span>
            <span className="block text-[9px] font-semibold text-emerald-400 tracking-wider uppercase -mt-1">
              Zero Waste Platform
            </span>
          </div>
        </Link>

        {/* Central Nav Links (Pill Style from Reference UI) */}
        <nav className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#062626]/80 border border-[#155D3B]/50 shadow-inner">
          <Link
            to="/"
            className="px-4 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            Home
          </Link>
          <Link
            to="/how-it-works"
            className="px-4 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            How It Works
          </Link>
          <Link
            to="/impact"
            className="px-4 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            Impact
          </Link>
          <Link
            to="/about"
            className="px-4 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            About
          </Link>
        </nav>

        {/* Action Controls */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2.5">
              <Link to={getDashboardPath()}>
                <Button variant="primary" size="sm" className="rounded-full shadow-emerald-500/20">
                  <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
                  Dashboard ({user.role})
                </Button>
              </Link>
              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-2 rounded-full bg-white/10 hover:bg-rose-500/20 text-slate-200 hover:text-rose-400 border border-white/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 rounded-full">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm" className="rounded-full shadow-emerald-500/30">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-300 hover:text-white focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-4 pb-3 border-t border-[#155D3B]/40 mt-3 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm text-slate-200 hover:bg-white/10 rounded-xl"
          >
            Home
          </Link>
          <Link
            to="/how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm text-slate-200 hover:bg-white/10 rounded-xl"
          >
            How It Works
          </Link>
          <Link
            to="/impact"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm text-slate-200 hover:bg-white/10 rounded-xl"
          >
            Impact
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm text-slate-200 hover:bg-white/10 rounded-xl"
          >
            About
          </Link>
          <div className="pt-2 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <Link to={getDashboardPath()} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
                <Button variant="danger" size="sm" onClick={handleLogout} className="w-full">
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
