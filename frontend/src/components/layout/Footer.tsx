import React from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake, ShieldCheck, Mail, MapPin, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#062626] border-t border-[#155D3B]/40 text-slate-300 py-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-white">FoodRescue</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Smart, deterministic surplus food redistribution platform connecting verified donors with NGOs and communities in real-time.
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>FSSAI Compliant Food Safety Protocols</span>
          </div>
        </div>

        {/* Roles */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Join The Network</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/register?role=DONOR" className="hover:text-emerald-400 transition-colors">Restaurants & Food Donors</Link></li>
            <li><Link to="/register?role=NGO" className="hover:text-emerald-400 transition-colors">Charities & Food Banks (NGOs)</Link></li>
            <li><Link to="/register?role=VOLUNTEER" className="hover:text-emerald-400 transition-colors">Volunteer Logistics Partners</Link></li>
            <li><Link to="/register?role=BENEFICIARY" className="hover:text-emerald-400 transition-colors">Individual Food Access</Link></li>
          </ul>
        </div>

        {/* Platform Links */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Resources</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/how-it-works" className="hover:text-emerald-400 transition-colors">Redistribution Algorithm</Link></li>
            <li><Link to="/impact" className="hover:text-emerald-400 transition-colors">Real-time Impact Metrics</Link></li>
            <li><Link to="/about" className="hover:text-emerald-400 transition-colors">About Mission & Food Safety</Link></li>
            <li><Link to="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service & Privacy</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="space-y-2.5 text-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Support Hub</h4>
          <div className="flex items-center gap-2 text-slate-400">
            <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Bangalore / Hyderabad Regional Centers, India</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>support@foodrescue.org</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>+91 (080) 2345-6789 (24/7 Helpline)</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
        <p>&copy; {new Date().getFullYear()} FoodRescue Platform. All rights reserved.</p>
        <p>Built with deterministic rule-based algorithms. Zero food waste initiative.</p>
      </div>
    </footer>
  );
};
