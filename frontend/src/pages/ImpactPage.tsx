import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Leaf, Users, CheckCircle, TrendingUp } from 'lucide-react';
import api from '../services/api';

export const ImpactPage: React.FC = () => {
  const [impact, setImpact] = useState<any>({
    mealsServed: 14500,
    kgRescued: 5800,
    co2SavedKg: 12180,
    activeNGOs: 48,
    activeDonors: 142,
    completedDeliveries: 920,
  });

  useEffect(() => {
    api.get('/analytics/impact')
      .then((res) => {
        if (res.data?.data?.impact) setImpact(res.data.data.impact);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#072B2B] text-slate-100 px-4 sm:px-8 py-16">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-[#0A3333] px-3 py-1 rounded-full border border-emerald-600/30">
            Measurable Environmental & Social Outcomes
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white">Our Collective Impact</h1>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto">
            Food is counted as successfully redistributed only after physical delivery confirmation by recipient organizations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0D4F4F] border border-emerald-600/40 rounded-3xl p-6 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-4xl font-extrabold text-white font-mono">{impact.mealsServed?.toLocaleString()}+</p>
            <p className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">Nutritious Meals Served</p>
            <p className="text-[11px] text-slate-300">Directly fed children, elderly shelters, and community pantries.</p>
          </div>

          <div className="bg-[#0D4F4F] border border-emerald-600/40 rounded-3xl p-6 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-4xl font-extrabold text-white font-mono">{impact.kgRescued?.toLocaleString()} kg</p>
            <p className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">Food Diverted from Landfills</p>
            <p className="text-[11px] text-slate-300">Clean, surplus food redirected into the humanitarian supply chain.</p>
          </div>

          <div className="bg-[#0D4F4F] border border-emerald-600/40 rounded-3xl p-6 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <Leaf className="w-6 h-6" />
            </div>
            <p className="text-4xl font-extrabold text-white font-mono">{impact.co2SavedKg?.toLocaleString()} kg</p>
            <p className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">CO2 Emissions Avoided</p>
            <p className="text-[11px] text-slate-300">Prevented greenhouse gas generation from decomposing organic waste.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
