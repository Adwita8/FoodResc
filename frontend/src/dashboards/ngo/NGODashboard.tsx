import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import {
  Bell,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Truck,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Search,
} from 'lucide-react';
import api from '../../services/api';

export const NGODashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'offers' | 'nearby' | 'pickups'>('offers');
  const [offers, setOffers] = useState<any[]>([]);
  const [nearbyDonations, setNearbyDonations] = useState<any[]>([]);
  const [pickups, setPickups] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Claim modal state
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [claimQuantity, setClaimQuantity] = useState('20');
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const fetchNGOData = async () => {
    setIsLoading(true);
    try {
      const [offersRes, nearbyRes, pickupsRes, analyticsRes] = await Promise.all([
        api.get('/allocations/offers'),
        api.get('/donations/nearby?latitude=12.9550&longitude=77.5990&maxDistance=15000'),
        api.get('/pickups'),
        api.get('/ngos/analytics'),
      ]);

      setOffers(offersRes.data?.data?.offers || []);
      setNearbyDonations(nearbyRes.data?.data || []);
      setPickups(pickupsRes.data?.data || []);
      setAnalytics(analyticsRes.data?.data?.analytics || null);
    } catch (err) {
      console.error('Failed to load NGO dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNGOData();
  }, []);

  const handleAcceptOffer = async (offerId: string) => {
    try {
      await api.post(`/allocations/${offerId}/accept`);
      alert('Offer accepted successfully! Pickup scheduling initiated.');
      fetchNGOData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept offer');
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    try {
      await api.post(`/allocations/${offerId}/reject`, { reason: 'Capacity temporarily reached' });
      alert('Offer declined. Donation will cascade to next eligible NGO.');
      fetchNGOData();
    } catch (err) {
      alert('Failed to decline offer');
    }
  };

  const handleManualClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonation) return;
    setIsClaiming(true);
    setClaimError(null);

    try {
      await api.post(`/donations/${selectedDonation._id}/claim`, {
        requestedQuantity: parseFloat(claimQuantity),
      });
      setSelectedDonation(null);
      alert('Donation claimed successfully! Pickup scheduled.');
      fetchNGOData();
    } catch (err: any) {
      setClaimError(err.response?.data?.message || 'Failed to claim donation');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleConfirmDelivery = async (pickupId: string) => {
    try {
      await api.post(`/pickups/${pickupId}/delivered`, {});
      alert('Food delivery received and confirmed! Added to beneficiary distribution records.');
      fetchNGOData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm receipt');
    }
  };

  if (isLoading && !analytics) {
    return <Spinner size="lg" label="Loading NGO Shelter Operations..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-800/40">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">NGO Operations Center</h1>
          <p className="text-xs text-slate-300">Intelligent offer acceptance, nearby food discovery, and distribution</p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[#062626] border border-emerald-700/40 rounded-2xl">
          <button
            onClick={() => setActiveTab('offers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'offers' ? 'bg-[#0D4F4F] text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Offers ({offers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('nearby')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'nearby' ? 'bg-[#0D4F4F] text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Nearby Food ({nearbyDonations.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('pickups')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'pickups' ? 'bg-[#0D4F4F] text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Pickups ({pickups.length})</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0A3333] border border-emerald-600/30 p-5 rounded-3xl">
          <p className="text-xs uppercase font-bold text-emerald-400">Total Food Received</p>
          <p className="text-3xl font-extrabold text-white font-mono mt-1">{analytics?.totalFoodReceived || 0}</p>
          <p className="text-[10px] text-slate-300 mt-1">Kilograms & Portions</p>
        </div>

        <div className="bg-[#0A3333] border border-emerald-600/30 p-5 rounded-3xl">
          <p className="text-xs uppercase font-bold text-emerald-400">Beneficiaries Fed</p>
          <p className="text-3xl font-extrabold text-emerald-300 font-mono mt-1">{analytics?.beneficiariesServed || 120}+</p>
          <p className="text-[10px] text-slate-300 mt-1">Direct community impact</p>
        </div>

        <div className="bg-[#0A3333] border border-emerald-600/30 p-5 rounded-3xl">
          <p className="text-xs uppercase font-bold text-emerald-400">Capacity Utilization</p>
          <p className="text-3xl font-extrabold text-white font-mono mt-1">{analytics?.capacityUtilization || 40}%</p>
          <p className="text-[10px] text-slate-300 mt-1">Shelter storage capacity</p>
        </div>

        <div className="bg-[#0A3333] border border-emerald-600/30 p-5 rounded-3xl">
          <p className="text-xs uppercase font-bold text-emerald-400">Reliability Score</p>
          <p className="text-3xl font-extrabold text-emerald-300 font-mono mt-1">{analytics?.reliabilityScore || 98}%</p>
          <p className="text-[10px] text-slate-300 mt-1">Pickup punctuality index</p>
        </div>
      </div>

      {/* OFFERS TAB */}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white">Intelligently Matched Allocation Offers</h3>
          {offers.length === 0 ? (
            <div className="bg-[#0A3333] border border-emerald-700/30 rounded-3xl p-12 text-center text-slate-400">
              <Sparkles className="w-10 h-10 mx-auto text-emerald-500/40 mb-2" />
              <p className="text-sm font-semibold text-white">No pending offers right now</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Our deterministic allocation engine will notify your dashboard in real-time as soon as matching surplus food is listed nearby.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers.map((offer) => (
                <div key={offer._id} className="bg-[#0D4F4F] border border-emerald-500/50 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono font-bold border border-emerald-700">
                        Score: {offer.score || 92} / 100
                      </span>
                      <span className="flex items-center gap-1 text-amber-300 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5" />
                        Expires: {new Date(offer.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-white">{offer.donationId?.foodName}</h4>
                    <p className="text-xs text-slate-200 mt-1 line-clamp-2">{offer.donationId?.description}</p>

                    <div className="mt-3 p-3 bg-[#062626]/80 rounded-2xl border border-emerald-800/40 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Offered Quantity:</span>
                        <span className="font-bold text-emerald-300 font-mono">{offer.offeredQuantity} {offer.donationId?.quantityUnit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Pickup Address:</span>
                        <span className="text-white text-right truncate max-w-[200px]">{offer.donationId?.pickupAddress}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="danger" size="sm" onClick={() => handleRejectOffer(offer._id)} className="flex-1 rounded-xl">
                      Decline
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => handleAcceptOffer(offer._id)} className="flex-1 rounded-xl shadow-emerald-500/30">
                      Accept Offer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NEARBY TAB */}
      {activeTab === 'nearby' && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white">Nearby Available Surplus Food</h3>
          {nearbyDonations.length === 0 ? (
            <p className="text-xs text-slate-400">No surplus food available nearby at this moment.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {nearbyDonations.map((d) => (
                <div key={d._id} className="bg-[#0A3333] border border-emerald-600/30 rounded-3xl p-5 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-emerald-400 font-semibold">{d.category}</span>
                      <StatusBadge status={d.status} />
                    </div>
                    <h4 className="font-bold text-white text-sm">{d.foodName}</h4>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">{d.description}</p>
                    <div className="mt-3 pt-3 border-t border-emerald-800/30 text-xs flex justify-between font-mono">
                      <span className="text-slate-400">Available:</span>
                      <span className="text-emerald-300 font-bold">{d.availableQuantity} {d.quantityUnit}</span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedDonation(d);
                      setClaimQuantity(String(Math.min(d.availableQuantity, 20)));
                    }}
                    className="w-full rounded-xl"
                  >
                    Claim Food Portions
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PICKUPS TAB */}
      {activeTab === 'pickups' && (
        <div className="bg-[#0A3333] border border-emerald-600/30 rounded-3xl p-6">
          <h3 className="text-base font-bold text-white mb-4">Assigned Pickups & Deliveries</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="border-b border-emerald-700/40 text-emerald-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Donor Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Confirmation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-800/30">
                {pickups.map((p) => (
                  <tr key={p._id} className="hover:bg-white/5">
                    <td className="py-3.5 px-4 font-semibold text-white">{p.donationId?.foodName || 'Food Batch'}</td>
                    <td className="py-3.5 px-4">{p.donorId?.businessName || 'Verified Donor'}</td>
                    <td className="py-3.5 px-4"><StatusBadge status={p.pickupStatus} /></td>
                    <td className="py-3.5 px-4 text-right">
                      {['PICKED_UP', 'IN_TRANSIT'].includes(p.pickupStatus) ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleConfirmDelivery(p._id)}
                          className="rounded-xl h-7 text-[10px]"
                        >
                          Confirm Receipt
                        </Button>
                      ) : p.pickupStatus === 'DELIVERED' ? (
                        <span className="text-emerald-400 text-xs font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">Awaiting Volunteer</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Claim Modal */}
      <Modal
        isOpen={Boolean(selectedDonation)}
        onClose={() => setSelectedDonation(null)}
        title="Claim Food Portion"
        description={selectedDonation ? `Available: ${selectedDonation.availableQuantity} ${selectedDonation.quantityUnit}` : ''}
      >
        {claimError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{claimError}</span>
          </div>
        )}

        <form onSubmit={handleManualClaim} className="space-y-4">
          <Input
            label="Portions / Quantity to Claim"
            type="number"
            value={claimQuantity}
            onChange={(e) => setClaimQuantity(e.target.value)}
            min="1"
            max={selectedDonation?.availableQuantity}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedDonation(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isClaiming}>
              Confirm Claim
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
