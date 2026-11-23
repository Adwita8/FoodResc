import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Spinner } from '../../components/ui/Spinner';
import {
  Users,
  Building2,
  Utensils,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  ShieldCheck,
  XCircle,
  Truck,
} from 'lucide-react';
import api from '../../services/api';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'verifications' | 'donations' | 'logs'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [donors, setDonors] = useState<any[]>([]);
  const [ngos, setNgos] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, donorsRes, ngosRes, donationsRes, logsRes] = await Promise.all([
        api.get('/analytics/admin'),
        api.get('/admin/donors'),
        api.get('/admin/ngos'),
        api.get('/donations?limit=30'),
        api.get('/admin/audit-logs'),
      ]);

      setStats(statsRes.data?.data?.stats || {});
      setDonors(donorsRes.data?.data?.donors || []);
      setNgos(ngosRes.data?.data?.ngos || []);
      setDonations(donationsRes.data?.data || []);
      setLogs(logsRes.data?.data?.logs || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleVerifyDonor = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/donors/${id}/verify`, { status, notes: `Admin verification: ${status}` });
      fetchDashboardData();
    } catch (err) {
      alert('Failed to update verification status');
    }
  };

  const handleVerifyNGO = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/ngos/${id}/verify`, { status, notes: `Admin verification: ${status}` });
      fetchDashboardData();
    } catch (err) {
      alert('Failed to update verification status');
    }
  };

  if (isLoading && !stats) {
    return <Spinner size="lg" label="Loading Administrative Overview..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-800/40">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Oversight Hub</h1>
          <p className="text-xs text-slate-300">Platform-wide verification, real-time analytics, and logs</p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[#062626] border border-emerald-700/40 rounded-2xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'overview' ? 'bg-[#0D4F4F] text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('verifications')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'verifications' ? 'bg-[#0D4F4F] text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Verifications
          </button>
          <button
            onClick={() => setActiveTab('donations')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'donations' ? 'bg-[#0D4F4F] text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Donations
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'logs' ? 'bg-[#0D4F4F] text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Audit Logs
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0A3333] border border-emerald-600/30 p-5 rounded-3xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs uppercase font-bold text-emerald-400">Total Food Donated</span>
                <Utensils className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                {stats?.totalFoodDonated?.toLocaleString() || 0}
              </p>
              <p className="text-[11px] text-slate-300 mt-1">Kilograms & Portions</p>
            </div>

            <div className="bg-[#0A3333] border border-emerald-600/30 p-5 rounded-3xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs uppercase font-bold text-emerald-400">Redistributed Food</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-300 font-mono">
                {stats?.totalFoodRedistributed?.toLocaleString() || 0}
              </p>
              <p className="text-[11px] text-slate-300 mt-1">Delivered to Beneficiaries</p>
            </div>

            <div className="bg-[#0A3333] border border-emerald-600/30 p-5 rounded-3xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs uppercase font-bold text-emerald-400">Success Rate</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-300 font-mono">
                {stats?.successRate || 95}%
              </p>
              <p className="text-[11px] text-slate-300 mt-1">Successful Pickups & Deliveries</p>
            </div>

            <div className="bg-[#0A3333] border border-emerald-600/30 p-5 rounded-3xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs uppercase font-bold text-emerald-400">Beneficiaries Fed</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                {stats?.totalBeneficiariesServed?.toLocaleString() || 1200}+
              </p>
              <p className="text-[11px] text-slate-300 mt-1">Direct community impact</p>
            </div>
          </div>

          {/* Quick Platform Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#0A3333] border border-emerald-700/30 rounded-3xl p-6">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-400" />
                Verified Donors
              </h3>
              <p className="text-2xl font-bold text-emerald-300">{stats?.totalDonors || donors.length}</p>
              <p className="text-xs text-slate-400 mt-1">Restaurants, hotels, & bakeries</p>
            </div>

            <div className="bg-[#0A3333] border border-emerald-700/30 rounded-3xl p-6">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Certified NGOs
              </h3>
              <p className="text-2xl font-bold text-emerald-300">{stats?.totalNGOs || ngos.length}</p>
              <p className="text-xs text-slate-400 mt-1">Community shelters & food banks</p>
            </div>

            <div className="bg-[#0A3333] border border-emerald-700/30 rounded-3xl p-6">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                Completed Pickups
              </h3>
              <p className="text-2xl font-bold text-emerald-300">{stats?.completedPickups || 12}</p>
              <p className="text-xs text-slate-400 mt-1">Verified OTP handovers</p>
            </div>
          </div>
        </div>
      )}

      {/* VERIFICATIONS TAB */}
      {activeTab === 'verifications' && (
        <div className="space-y-6">
          <div className="bg-[#0A3333] border border-emerald-600/30 rounded-3xl p-6">
            <h3 className="text-base font-bold text-white mb-4">Pending & Registered Donors</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="border-b border-emerald-700/40 text-emerald-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Business</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Reliability</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-800/30">
                  {donors.map((d) => (
                    <tr key={d._id} className="hover:bg-white/5">
                      <td className="py-3.5 px-4 font-semibold text-white">{d.businessName}</td>
                      <td className="py-3.5 px-4">{d.donorType}</td>
                      <td className="py-3.5 px-4">{d.address?.city || 'Bangalore'}</td>
                      <td className="py-3.5 px-4 font-mono">{d.reliabilityScore || 85}%</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          d.verificationStatus === 'APPROVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-amber-950 text-amber-300 border border-amber-700'
                        }`}>
                          {d.verificationStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {d.verificationStatus !== 'APPROVED' && (
                          <Button size="sm" variant="primary" onClick={() => handleVerifyDonor(d._id, 'APPROVED')} className="h-7 text-[10px]">
                            Approve
                          </Button>
                        )}
                        {d.verificationStatus !== 'REJECTED' && (
                          <Button size="sm" variant="danger" onClick={() => handleVerifyDonor(d._id, 'REJECTED')} className="h-7 text-[10px]">
                            Reject
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-[#0A3333] border border-emerald-600/30 rounded-3xl p-6">
            <h3 className="text-base font-bold text-white mb-4">NGO Organizations</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="border-b border-emerald-700/40 text-emerald-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Organization</th>
                    <th className="py-3 px-4">Reg #</th>
                    <th className="py-3 px-4">Capacity</th>
                    <th className="py-3 px-4">Beneficiaries</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-800/30">
                  {ngos.map((ngo) => (
                    <tr key={ngo._id} className="hover:bg-white/5">
                      <td className="py-3.5 px-4 font-semibold text-white">{ngo.organizationName}</td>
                      <td className="py-3.5 px-4 font-mono">{ngo.registrationNumber || 'N/A'}</td>
                      <td className="py-3.5 px-4 font-mono">{ngo.maximumCapacity} portions</td>
                      <td className="py-3.5 px-4 font-mono">{ngo.beneficiaryCount || 50}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          ngo.verificationStatus === 'APPROVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-amber-950 text-amber-300 border border-amber-700'
                        }`}>
                          {ngo.verificationStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {ngo.verificationStatus !== 'APPROVED' && (
                          <Button size="sm" variant="primary" onClick={() => handleVerifyNGO(ngo._id, 'APPROVED')} className="h-7 text-[10px]">
                            Approve
                          </Button>
                        )}
                        {ngo.verificationStatus !== 'REJECTED' && (
                          <Button size="sm" variant="danger" onClick={() => handleVerifyNGO(ngo._id, 'REJECTED')} className="h-7 text-[10px]">
                            Reject
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DONATIONS TAB */}
      {activeTab === 'donations' && (
        <div className="bg-[#0A3333] border border-emerald-600/30 rounded-3xl p-6">
          <h3 className="text-base font-bold text-white mb-4">Platform Donations Registry</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="border-b border-emerald-700/40 text-emerald-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Food Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Safe Expiry</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-800/30">
                {donations.map((d) => (
                  <tr key={d._id} className="hover:bg-white/5">
                    <td className="py-3.5 px-4 font-semibold text-white">{d.foodName}</td>
                    <td className="py-3.5 px-4">{d.category}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-300">{d.totalQuantity} {d.quantityUnit}</td>
                    <td className="py-3.5 px-4 text-slate-300">{new Date(d.safeConsumptionDeadline).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4"><StatusBadge status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AUDIT LOGS TAB */}
      {activeTab === 'logs' && (
        <div className="bg-[#0A3333] border border-emerald-600/30 rounded-3xl p-6">
          <h3 className="text-base font-bold text-white mb-4">Security & Event Audit Trail</h3>
          <div className="space-y-2 font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-slate-400">No audit events recorded yet.</p>
            ) : (
              logs.map((log) => (
                <div key={log._id} className="p-3 bg-[#062626] rounded-xl border border-emerald-800/40 flex items-center justify-between">
                  <div>
                    <span className="text-emerald-400 font-bold mr-2">[{log.action}]</span>
                    <span className="text-slate-200">{log.entityType} ID: {log.entityId}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
