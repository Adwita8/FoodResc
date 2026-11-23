import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import {
  PlusCircle,
  Utensils,
  CheckCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import api from '../../services/api';

export const DonorDashboard: React.FC = () => {
  const [donations, setDonations] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [foodName, setFoodName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('COOKED_MEALS');
  const [totalQuantity, setTotalQuantity] = useState('50');
  const [quantityUnit, setQuantityUnit] = useState('PORTIONS');
  const [safeHours, setSafeHours] = useState('6');
  const [pickupHours, setPickupHours] = useState('3');
  const [pickupAddress, setPickupAddress] = useState('MG Road Dispatch Bay, Bangalore');
  const [storageRequirements, setStorageRequirements] = useState('Keep warm above 65°C');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchDonorData = async () => {
    setIsLoading(true);
    try {
      const [donationsRes, analyticsRes] = await Promise.all([
        api.get('/donors/donations'),
        api.get('/donors/analytics'),
      ]);
      setDonations(donationsRes.data?.data?.donations || []);
      setAnalytics(analyticsRes.data?.data?.analytics || null);
    } catch (err) {
      console.error('Failed to fetch donor data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDonorData();
  }, []);

  const handleCreateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const now = new Date();
      const safeDeadline = new Date(now.getTime() + parseInt(safeHours) * 60 * 60 * 1000);
      const pickupDeadline = new Date(now.getTime() + parseInt(pickupHours) * 60 * 60 * 1000);

      await api.post('/donations', {
        foodName,
        description,
        category,
        totalQuantity: parseFloat(totalQuantity),
        quantityUnit,
        numberOfPortions: parseInt(totalQuantity),
        preparationTime: now.toISOString(),
        safeConsumptionDeadline: safeDeadline.toISOString(),
        pickupDeadline: pickupDeadline.toISOString(),
        storageRequirements,
        pickupAddress,
        latitude: 12.9750,
        longitude: 77.6080,
      });

      setShowAddModal(false);
      setFoodName('');
      setDescription('');
      fetchDonorData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to publish donation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !analytics) {
    return <Spinner size="lg" label="Loading Donor Portal..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header with CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-800/40">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Food Donor Portal</h1>
          <p className="text-xs text-slate-300">Manage surplus food, schedule handovers, and track impact</p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowAddModal(true)}
          className="rounded-2xl shadow-emerald-500/30"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          List Surplus Food
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0A3333] border border-emerald-600/30 p-5 rounded-3xl">
          <p className="text-xs uppercase font-bold text-emerald-400">Total Donated</p>
          <p className="text-3xl font-extrabold text-white font-mono mt-1">
            {analytics?.totalFoodDonated || 0}
          </p>
          <p className="text-[10px] text-slate-300 mt-1">Total portions & kg</p>
        </div>

        <div className="bg-[#0A3333] border border-emerald-600/30 p-5 rounded-3xl">
          <p className="text-xs uppercase font-bold text-emerald-400">Successfully Redistributed</p>
          <p className="text-3xl font-extrabold text-emerald-300 font-mono mt-1">
            {analytics?.totalRedistributed || 0}
          </p>
          <p className="text-[10px] text-slate-300 mt-1">Delivered to shelters</p>
        </div>

        <div className="bg-[#0A3333] border border-emerald-600/30 p-5 rounded-3xl">
          <p className="text-xs uppercase font-bold text-emerald-400">Active Listings</p>
          <p className="text-3xl font-extrabold text-white font-mono mt-1">
            {analytics?.activeDonations || 0}
          </p>
          <p className="text-[10px] text-slate-300 mt-1">Currently matching or assigned</p>
        </div>

        <div className="bg-[#0A3333] border border-emerald-600/30 p-5 rounded-3xl">
          <p className="text-xs uppercase font-bold text-emerald-400">Reliability Score</p>
          <p className="text-3xl font-extrabold text-emerald-300 font-mono mt-1">
            {analytics?.reliabilityScore || 95}%
          </p>
          <p className="text-[10px] text-slate-300 mt-1">On-time handover rating</p>
        </div>
      </div>

      {/* Active & Listed Donations Table */}
      <div className="bg-[#0A3333] border border-emerald-600/30 rounded-3xl p-6">
        <h3 className="text-base font-bold text-white mb-4">My Food Donations</h3>
        {donations.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Utensils className="w-10 h-10 mx-auto text-emerald-500/40 mb-2" />
            <p className="text-sm">No donations listed yet.</p>
            <p className="text-xs text-slate-500 mt-1">Click "List Surplus Food" above to create your first donation batch.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="border-b border-emerald-700/40 text-emerald-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Total / Available</th>
                  <th className="py-3 px-4">Pickup Deadline</th>
                  <th className="py-3 px-4">Safe Expiry</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Handover OTP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-800/30">
                {donations.map((d) => (
                  <tr key={d._id} className="hover:bg-white/5">
                    <td className="py-3.5 px-4 font-semibold text-white">{d.foodName}</td>
                    <td className="py-3.5 px-4">{d.category}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-300">
                      {d.availableQuantity} / {d.totalQuantity} {d.quantityUnit}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {new Date(d.pickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {new Date(d.safeConsumptionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {d.status === 'PICKUP_SCHEDULED' ? (
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-amber-950 text-amber-300 px-2.5 py-1 rounded-xl border border-amber-700">
                          <KeyRound className="w-3.5 h-3.5" />
                          482910
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Donation Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="List Surplus Food Donation"
        description="Provide food safety details and distribution deadlines"
        maxWidth="lg"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateDonation} className="space-y-4 text-xs">
          <Input
            label="Food Item Name"
            type="text"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            placeholder="e.g. Vegetarian Pulao & Dal Buffet Surplus"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Food Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#062626] border border-emerald-700/60 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <option value="COOKED_MEALS">Cooked Meals</option>
                <option value="RAW_VEGETABLES">Raw Vegetables</option>
                <option value="FRUITS">Fruits</option>
                <option value="BAKERY">Bakery Products</option>
                <option value="DAIRY">Dairy Products</option>
                <option value="PACKAGED">Packaged Food</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Quantity"
                type="number"
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(e.target.value)}
                required
                min="1"
              />
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Unit
                </label>
                <select
                  value={quantityUnit}
                  onChange={(e) => setQuantityUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#062626] border border-emerald-700/60 rounded-xl text-white focus:outline-none"
                >
                  <option value="PORTIONS">Portions</option>
                  <option value="PACKETS">Packets</option>
                  <option value="KILOGRAMS">Kilograms</option>
                  <option value="LITRES">Litres</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Safe Hours Buffer (from now)"
              type="number"
              value={safeHours}
              onChange={(e) => setSafeHours(e.target.value)}
              helperText="Safe consumption window"
              min="2"
              max="72"
              required
            />
            <Input
              label="Pickup Deadline (hours from now)"
              type="number"
              value={pickupHours}
              onChange={(e) => setPickupHours(e.target.value)}
              helperText="Must be earlier than safe window"
              min="1"
              max="24"
              required
            />
          </div>

          <Input
            label="Pickup Address / Dispatch Bay"
            type="text"
            value={pickupAddress}
            onChange={(e) => setPickupAddress(e.target.value)}
            required
          />

          <Input
            label="Storage & Handling Instructions"
            type="text"
            value={storageRequirements}
            onChange={(e) => setStorageRequirements(e.target.value)}
            placeholder="e.g. Keep refrigerated below 5°C"
          />

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Publish Donation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
