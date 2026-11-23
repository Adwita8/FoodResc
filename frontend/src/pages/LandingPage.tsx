import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  Utensils,
  Building2,
  Truck,
  Heart,
  ShieldCheck,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import api from '../services/api';

export const LandingPage: React.FC = () => {
  const [impactData, setImpactData] = useState({
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
        if (res.data?.data?.impact) {
          setImpactData(res.data.data.impact);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#072B2B] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* ================= HERO SECTION (Matches Reference Teal/Glassmorphic Style) ================= */}
      <section className="relative px-4 sm:px-8 pt-12 pb-20 max-w-7xl mx-auto w-full">
        {/* Glow backdrop spots */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-32 right-1/4 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
          {/* Reference pill tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0D4F4F]/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide uppercase shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Smart Redistribution Engine Active
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Rescue Food. <br />
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-green-400 bg-clip-text text-transparent">
              Reduce Waste. Feed Communities.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Connecting surplus food with verified NGOs, charitable kitchens, and shelters through deterministic, time-sensitive matching. Every surplus meal reaches someone in need before it goes to waste.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/register?role=DONOR">
              <Button variant="primary" size="lg" className="rounded-2xl shadow-lg shadow-emerald-500/25">
                Donate Surplus Food
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/register?role=NGO">
              <Button variant="teal" size="lg" className="rounded-2xl border-emerald-500/40">
                Register as an NGO
              </Button>
            </Link>
          </div>
        </div>

        {/* Floating Reference Container (Dual Box from the Reference Design) */}
        <div className="mt-14 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          {/* Main Teal Dashboard Box */}
          <div className="md:col-span-7 bg-[#0D4F4F] border border-[#1E7A4D]/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-300 bg-[#062626]/60 px-3 py-1 rounded-full">
                Deterministic Allocation
              </span>
              <span className="text-xs text-slate-300 font-mono">Formula: 5-Metric Balance</span>
            </div>

            <div className="my-4 space-y-3">
              <h3 className="text-2xl font-bold text-white tracking-wide">
                Intelligent Matching Engine
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed">
                When a donor publishes surplus food, our rule-based scoring engine computes scores based on Capacity Suitability (30%), Urgency (25%), Transportation (20%), Road Distance (15%), and NGO Reliability (10%).
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-emerald-600/30 text-center">
              <div className="bg-[#083636] p-2.5 rounded-xl border border-emerald-600/20">
                <p className="text-lg font-extrabold text-emerald-300">100%</p>
                <p className="text-[10px] text-slate-300 uppercase">Rule-Based</p>
              </div>
              <div className="bg-[#083636] p-2.5 rounded-xl border border-emerald-600/20">
                <p className="text-lg font-extrabold text-emerald-300">&lt; 30m</p>
                <p className="text-[10px] text-slate-300 uppercase">Offer Window</p>
              </div>
              <div className="bg-[#083636] p-2.5 rounded-xl border border-emerald-600/20">
                <p className="text-lg font-extrabold text-emerald-300">Atomic</p>
                <p className="text-[10px] text-slate-300 uppercase">Lock Claim</p>
              </div>
            </div>
          </div>

          {/* Floating White Frosted Box (Matches the reference overlay card) */}
          <div className="md:col-span-5 bg-white/95 dark:bg-[#0E3A3A] text-slate-900 dark:text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/40 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold mb-2">Food Safety First</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Strict separation between safe consumption deadline and pickup deadlines ensures food reaches tables with ample preparation and distribution buffers.
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50 dark:bg-[#072424] rounded-2xl border border-emerald-200 dark:border-emerald-800/50">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <span>OTP Handover</span>
                <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 px-2 py-0.5 rounded-full">Secure</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Unique encrypted 6-digit verification code guarantees physical collection accuracy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= LIVE PLATFORM IMPACT NUMBERS ================= */}
      <section className="px-4 sm:px-8 py-12 bg-[#062626] border-y border-[#155D3B]/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400">Verified Platform Impact</h2>
            <p className="text-xl font-bold text-white mt-1">Real-time Verified Redistribution Statistics</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-[#0A3333] border border-emerald-600/30 p-5 rounded-2xl text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-300 font-mono">
                {impactData.mealsServed.toLocaleString()}+
              </p>
              <p className="text-xs text-slate-300 mt-1 font-medium">Meals Served to People</p>
            </div>

            <div className="bg-[#0A3333] border border-emerald-600/30 p-5 rounded-2xl text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-300 font-mono">
                {impactData.kgRescued.toLocaleString()} kg
              </p>
              <p className="text-xs text-slate-300 mt-1 font-medium">Surplus Food Rescued</p>
            </div>

            <div className="bg-[#0A3333] border border-emerald-600/30 p-5 rounded-2xl text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-300 font-mono">
                {impactData.co2SavedKg.toLocaleString()} kg
              </p>
              <p className="text-xs text-slate-300 mt-1 font-medium">CO2 Emissions Prevented</p>
            </div>

            <div className="bg-[#0A3333] border border-emerald-600/30 p-5 rounded-2xl text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-300 font-mono">
                {impactData.activeNGOs} + {impactData.activeDonors}
              </p>
              <p className="text-xs text-slate-300 mt-1 font-medium">Active NGOs & Donors</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= STEP-BY-STEP REDISTRIBUTION WORKFLOW ================= */}
      <section className="px-4 sm:px-8 py-20 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800">
            How FoodRescue Operates
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
            From Surplus Kitchen to Warm Meal
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2">
            A transparent four-step cycle that turns potential wastage into timely relief.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-[#0A3333]/90 border border-emerald-500/30 rounded-3xl p-6 relative">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-base mb-4">
              01
            </div>
            <h4 className="text-base font-bold text-white mb-2">1. List Surplus</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Donors specify food category, preparation time, safe consumption deadline, pickup window, and portion quantities.
            </p>
          </div>

          <div className="bg-[#0A3333]/90 border border-emerald-500/30 rounded-3xl p-6 relative">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-base mb-4">
              02
            </div>
            <h4 className="text-base font-bold text-white mb-2">2. Smart Matching</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Geospatial queries filter verified NGOs. The deterministic engine ranks suitability and dispatches timed offers to the best match.
            </p>
          </div>

          <div className="bg-[#0A3333]/90 border border-emerald-500/30 rounded-3xl p-6 relative">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-base mb-4">
              03
            </div>
            <h4 className="text-base font-bold text-white mb-2">3. OTP Handover</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Volunteers navigate to donor dispatch. The donor issues a single-use OTP verified on the spot before food changes hands.
            </p>
          </div>

          <div className="bg-[#0A3333]/90 border border-emerald-500/30 rounded-3xl p-6 relative">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-base mb-4">
              04
            </div>
            <h4 className="text-base font-bold text-white mb-2">4. Distribution Confirmed</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              The NGO confirms food receipt and serves meals to beneficiaries. Impact logs and reliability scores update automatically.
            </p>
          </div>
        </div>
      </section>

      {/* ================= CTA BANNER ================= */}
      <section className="px-4 sm:px-8 py-16 bg-gradient-to-b from-[#0A2F2F] to-[#062626] border-t border-[#155D3B]/40">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Ready to Prevent Food Wastage in Your City?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Join restaurants, supermarkets, and certified NGOs committed to zero hunger and zero waste.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/register">
              <Button variant="primary" size="lg" className="rounded-2xl shadow-emerald-500/20">
                Join the Network Today
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="teal" size="lg" className="rounded-2xl">
                Explore Demo Portals
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
