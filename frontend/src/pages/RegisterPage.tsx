import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { HeartHandshake, ShieldAlert, Utensils, Building2, Truck, Users } from 'lucide-react';
import api from '../services/api';

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'DONOR';

  const [role, setRole] = useState<'DONOR' | 'NGO' | 'VOLUNTEER' | 'BENEFICIARY'>(
    ['DONOR', 'NGO', 'VOLUNTEER', 'BENEFICIARY'].includes(initialRole)
      ? (initialRole as any)
      : 'DONOR'
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [businessOrOrgName, setBusinessOrOrgName] = useState('');
  const [city, setCity] = useState('Bangalore');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const payload: any = {
        name,
        email,
        phone,
        password,
        role,
        address: { city, country: 'India' },
        latitude: 12.9716, // Bangalore default coordinates
        longitude: 77.5946,
      };

      if (role === 'DONOR') {
        payload.businessName = businessOrOrgName || name;
        payload.donorType = 'RESTAURANT';
      } else if (role === 'NGO') {
        payload.organizationName = businessOrOrgName || name;
        payload.registrationNumber = 'NGO-REG-' + Math.floor(1000 + Math.random() * 9000);
      }

      const res = await api.post('/auth/register', payload);
      const { user, accessToken } = res.data.data;
      setAuth(user, accessToken);

      switch (user.role) {
        case 'DONOR': navigate('/donor'); break;
        case 'NGO': navigate('/ngo'); break;
        case 'VOLUNTEER': navigate('/volunteer'); break;
        case 'BENEFICIARY': navigate('/beneficiary'); break;
        default: navigate('/'); break;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please check inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#072B2B] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden text-slate-100">
      <div className="w-full max-w-lg z-10 space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <HeartHandshake className="w-6 h-6" />
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create an Account</h2>
          <p className="text-xs text-slate-300">Select your role to join the food redistribution network</p>
        </div>

        {/* Role Selector Tabs (Reference Curved Pill style) */}
        <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-[#052121] border border-emerald-700/40 rounded-2xl">
          <button
            type="button"
            onClick={() => setRole('DONOR')}
            className={`py-2 px-1 text-center rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
              role === 'DONOR' ? 'bg-[#0D4F4F] text-emerald-300 border border-emerald-500/50 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Donor</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('NGO')}
            className={`py-2 px-1 text-center rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
              role === 'NGO' ? 'bg-[#0D4F4F] text-emerald-300 border border-emerald-500/50 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>NGO</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('VOLUNTEER')}
            className={`py-2 px-1 text-center rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
              role === 'VOLUNTEER' ? 'bg-[#0D4F4F] text-emerald-300 border border-emerald-500/50 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Volunteer</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('BENEFICIARY')}
            className={`py-2 px-1 text-center rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
              role === 'BENEFICIARY' ? 'bg-[#0D4F4F] text-emerald-300 border border-emerald-500/50 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Individual</span>
          </button>
        </div>

        {/* Form Container */}
        <div className="bg-[#0A3333]/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Contact Person Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rajesh Kumar"
              required
            />

            {(role === 'DONOR' || role === 'NGO') && (
              <Input
                label={role === 'DONOR' ? 'Business / Restaurant Name' : 'Organization Name'}
                type="text"
                value={businessOrOrgName}
                onChange={(e) => setBusinessOrOrgName(e.target.value)}
                placeholder={role === 'DONOR' ? 'e.g. Royal Banquet Hall' : 'e.g. Hope Food Bank'}
                required
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@org.org"
                required
              />

              <Input
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="City / Region"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Bangalore"
                required
              />

              <Input
                label="Password (min 8 chars)"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 chars, 1 uppercase, 1 symbol"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full rounded-xl mt-4 font-semibold shadow-emerald-500/30"
              isLoading={isLoading}
            >
              Complete Registration as {role}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-emerald-300 font-semibold hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};
