import React from 'react';
import { Card } from '../components/ui/Card';
import { ShieldCheck, HeartHandshake, Scale, Award } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#072B2B] text-slate-100 px-4 sm:px-8 py-16">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-[#0A3333] px-3 py-1 rounded-full border border-emerald-600/30">
            Our Mission & Core Philosophy
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white">About FoodRescue</h1>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto">
            "Every surplus meal should have the opportunity to reach someone who needs it before it goes to waste."
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0A3333]/90 border border-emerald-600/30 rounded-3xl p-6 sm:p-8 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Deterministic & Unbiased</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Food redistribution is too critical to leave to opaque black-box AI models or unverified heuristics. Every matching decision uses open, deterministic formulas balancing recipient capacity, travel distance, food safety windows, and proven reliability.
            </p>
          </div>

          <div className="bg-[#0A3333]/90 border border-emerald-600/30 rounded-3xl p-6 sm:p-8 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">FSSAI Safety Standards</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              We enforce strict compliance with food safety regulations. Perishable food that reaches its safe consumption deadline is automatically invalidated from distribution to safeguard public health.
            </p>
          </div>
        </div>

        <div className="bg-[#0D4F4F] border border-emerald-600/40 rounded-3xl p-8 space-y-4 text-center">
          <h2 className="text-2xl font-bold text-white">Zero Food Waste in Indian Metros</h2>
          <p className="text-xs text-slate-200 max-w-xl mx-auto leading-relaxed">
            Operating across major commercial hubs including Bangalore and Hyderabad, FoodRescue unites hospitality chains, neighborhood bakeries, and community organizations under one cohesive, verifiable network.
          </p>
        </div>
      </div>
    </div>
  );
};
