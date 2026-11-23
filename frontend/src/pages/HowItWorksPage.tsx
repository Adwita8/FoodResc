import React from 'react';
import { Card } from '../components/ui/Card';
import { Clock, Zap, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#072B2B] text-slate-100 px-4 sm:px-8 py-16">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-[#0A3333] px-3 py-1 rounded-full border border-emerald-600/30">
            Intelligent Allocation Architecture
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white">How FoodRescue Works</h1>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto">
            Discover the mathematics and logistics pipeline behind our smart redistribution platform.
          </p>
        </div>

        {/* Algorithm Breakdown Box */}
        <div className="bg-[#0D4F4F] border border-emerald-600/40 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-emerald-300" />
            <h2 className="text-xl font-bold text-white">Deterministic Scoring Formula</h2>
          </div>

          <div className="bg-[#062626] p-4 rounded-2xl font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed border border-emerald-800">
            Final Score = 0.30 × CapacitySuitability + 0.25 × UrgencySuitability + 0.20 × TransportationSuitability + 0.15 × DistanceSuitability + 0.10 × NGOReliability
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-200">
            <div className="p-3 bg-[#083636] rounded-xl border border-emerald-700/30">
              <span className="font-bold text-emerald-300 block mb-1">Capacity Suitability (30%)</span>
              Evaluates the percentage of food portions the NGO has immediate storage and volunteer distribution capacity to handle.
            </div>

            <div className="p-3 bg-[#083636] rounded-xl border border-emerald-700/30">
              <span className="font-bold text-emerald-300 block mb-1">Urgency Suitability (25%)</span>
              Prioritizes organizations positioned to pick up and distribute food well before the safe consumption threshold.
            </div>

            <div className="p-3 bg-[#083636] rounded-xl border border-emerald-700/30">
              <span className="font-bold text-emerald-300 block mb-1">Transportation Suitability (20%)</span>
              Favors NGOs with verified dedicated vehicles or nearby volunteer fleet readiness.
            </div>

            <div className="p-3 bg-[#083636] rounded-xl border border-emerald-700/30">
              <span className="font-bold text-emerald-300 block mb-1">Road Distance (15%)</span>
              Normalized scoring favoring closest geographic partners to minimize transit time.
            </div>
          </div>
        </div>

        {/* Partial Allocation & Concurrency safety */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0A3333] border border-emerald-600/30 p-6 rounded-3xl space-y-3">
            <h3 className="text-base font-bold text-white">Partial Allocation Division</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Large donations (e.g. 100 kg) can be distributed simultaneously among multiple smaller charities (30 kg to Shelter A, 40 kg to Food Bank B, 30 kg to Community C) without over-allocation risk.
            </p>
          </div>

          <div className="bg-[#0A3333] border border-emerald-600/30 p-6 rounded-3xl space-y-3">
            <h3 className="text-base font-bold text-white">Cryptographic OTP Verification</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Food handover requires a hashed, single-use 6-digit OTP provided by the donor at collection time. Only upon successful verification does the food move to in-transit status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
