import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Spinner } from '../../components/ui/Spinner';
import { Utensils, CheckCircle, Clock, MapPin, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

export const BeneficiaryDashboard: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [nearbyDonations, setNearbyDonations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBeneficiaryData = async () => {
    setIsLoading(true);
    try {
      const [requestsRes, donationsRes] = await Promise.all([
        api.get('/beneficiaries/requests'),
        api.get('/donations/nearby?latitude=12.9716&longitude=77.5946&maxDistance=10000'),
      ]);
      setRequests(requestsRes.data?.data?.requests || []);
      setNearbyDonations(donationsRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load beneficiary data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaryData();
  }, []);

  const handleRequestPortion = async (donationId: string) => {
    try {
      await api.post('/beneficiaries/request', {
        donationId,
        requestedQuantity: 2,
        requestedCategory: 'COOKED_MEALS',
      });
      alert('Food portion requested successfully! Please view pickup instructions below.');
      fetchBeneficiaryData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to request portion');
    }
  };

  if (isLoading) {
    return <Spinner size="lg" label="Finding Community Food Portions..." />;
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-emerald-800/40">
        <h1 className="text-2xl font-bold text-white tracking-tight">Community Food Access</h1>
        <p className="text-xs text-slate-300">Discover fresh surplus meals prepared by verified community donors</p>
      </div>

      {/* Available food nearby */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white">Available Food Near You</h3>
        {nearbyDonations.length === 0 ? (
          <p className="text-xs text-slate-400">No surplus portions listed currently in your neighborhood.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {nearbyDonations.map((d) => (
              <div key={d._id} className="bg-[#0A3333] border border-emerald-600/30 rounded-3xl p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    {d.category}
                  </span>
                  <h4 className="font-bold text-white text-base mt-1">{d.foodName}</h4>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">{d.description}</p>
                  <div className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="truncate">{d.pickupAddress}</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleRequestPortion(d._id)}
                  className="w-full rounded-xl mt-2"
                >
                  Request Portion (Free)
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Requests History */}
      <div className="bg-[#0A3333] border border-emerald-600/30 rounded-3xl p-6">
        <h3 className="text-base font-bold text-white mb-4">My Requests & Pickup Instructions</h3>
        {requests.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No requests made yet.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r._id} className="p-4 bg-[#062626] rounded-2xl border border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-white text-sm block">{r.requestedCategory}</span>
                  <p className="text-slate-300 mt-0.5">{r.pickupInstructions}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Requested on: {new Date(r.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-emerald-300">{r.requestedQuantity} portions</span>
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
