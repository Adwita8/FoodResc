import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { HeartHandshake, Lock, Mail, ShieldAlert, Sparkles } from 'lucide-react';
import api from '../services/api';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, accessToken } = res.data.data;
      setAuth(user, accessToken);

      // Redirect to appropriate dashboard based on role
      switch (user.role) {
        case 'ADMIN': navigate('/admin'); break;
        case 'DONOR': navigate('/donor'); break;
        case 'NGO': navigate('/ngo'); break;
        case 'VOLUNTEER': navigate('/volunteer'); break;
        case 'BENEFICIARY': navigate('/beneficiary'); break;
        default: navigate('/'); break;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password@123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#072B2B] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden text-slate-100">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <HeartHandshake className="w-6 h-6" />
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-white tracking-tight">Sign In to FoodRescue</h2>
          <p className="text-xs text-slate-300">Access your role-specific dashboard and actions</p>
        </div>

        {/* Card */}
        <div className="bg-[#0A3333]/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@organization.org"
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full rounded-xl mt-2 font-semibold shadow-emerald-500/30"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Logins for Pair-Programming & Evaluation */}
          <div className="mt-6 pt-5 border-t border-emerald-600/20 space-y-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>One-Click Demo Accounts</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillQuickCredentials('admin@foodrescue.org')}
                className="p-2 rounded-xl bg-[#062626] hover:bg-[#083636] border border-emerald-700/40 text-left transition-all"
              >
                <span className="font-bold text-white block text-[11px]">Administrator</span>
                <span className="text-[10px] text-slate-400">Platform Control</span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickCredentials('donor.taj@foodrescue.org')}
                className="p-2 rounded-xl bg-[#062626] hover:bg-[#083636] border border-emerald-700/40 text-left transition-all"
              >
                <span className="font-bold text-white block text-[11px]">Food Donor</span>
                <span className="text-[10px] text-slate-400">Hotel & Banquet</span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickCredentials('ngo.ashajyothi@foodrescue.org')}
                className="p-2 rounded-xl bg-[#062626] hover:bg-[#083636] border border-emerald-700/40 text-left transition-all"
              >
                <span className="font-bold text-white block text-[11px]">NGO Shelter</span>
                <span className="text-[10px] text-slate-400">Claim & Distribute</span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickCredentials('volunteer.karthik@foodrescue.org')}
                className="p-2 rounded-xl bg-[#062626] hover:bg-[#083636] border border-emerald-700/40 text-left transition-all"
              >
                <span className="font-bold text-white block text-[11px]">Volunteer</span>
                <span className="text-[10px] text-slate-400">Pickup & OTP</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer link */}
        <p className="text-center text-xs text-slate-400">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-emerald-300 font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};
