import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import {
  Truck,
  MapPin,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Navigation,
  Clock,
} from 'lucide-react';
import api from '../../services/api';

export const VolunteerDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // OTP Modal
  const [activePickup, setActivePickup] = useState<any>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/volunteers/tasks');
      setTasks(res.data?.data?.tasks || []);
    } catch (err) {
      console.error('Failed to load volunteer tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAcceptTask = async (pickupId: string) => {
    try {
      await api.post(`/pickups/${pickupId}/accept`);
      alert('Pickup assignment accepted! Please proceed to the donor dispatch location.');
      fetchTasks();
    } catch (err) {
      alert('Failed to accept task');
    }
  };

  const handleEnRoute = async (pickupId: string) => {
    try {
      await api.post(`/pickups/${pickupId}/en-route`);
      fetchTasks();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePickup) return;
    setIsVerifying(true);
    setOtpError(null);

    try {
      await api.post(`/pickups/${activePickup._id}/verify-otp`, {
        otp: enteredOtp,
      });
      setActivePickup(null);
      setEnteredOtp('');
      alert('OTP verified successfully! Food collected and marked in-transit.');
      fetchTasks();
    } catch (err: any) {
      setOtpError(err.response?.data?.message || 'Invalid verification OTP. Please verify with the donor.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return <Spinner size="lg" label="Loading Volunteer Dispatch Route..." />;
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-emerald-800/40">
        <h1 className="text-2xl font-bold text-white tracking-tight">Volunteer Logistics Hub</h1>
        <p className="text-xs text-slate-300">Food dispatch tasks, navigation routes, and OTP verification</p>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-[#0A3333] border border-emerald-700/30 rounded-3xl p-12 text-center text-slate-400">
          <Truck className="w-12 h-12 mx-auto text-emerald-500/40 mb-3" />
          <p className="text-base font-bold text-white">No active deliveries pending</p>
          <p className="text-xs text-slate-400 mt-1">You are on standby. New food collections will appear here in real-time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="bg-[#0A3333] border border-emerald-600/40 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">
                    Pickup Task #{task._id.slice(-6)}
                  </span>
                  <StatusBadge status={task.pickupStatus} />
                </div>

                <h3 className="text-lg font-bold text-white">{task.donationId?.foodName || 'Food Batch'}</h3>

                <div className="mt-4 space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start gap-2 bg-[#062626] p-3 rounded-2xl border border-emerald-800/40">
                    <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">From (Donor):</span>
                      <span>{task.donorId?.businessName} — {task.donorId?.address?.street || 'Bangalore'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-[#062626] p-3 rounded-2xl border border-emerald-800/40">
                    <Navigation className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">To (Recipient Shelter):</span>
                      <span>{task.ngoId?.organizationName} — {task.ngoId?.address?.street || 'Bangalore'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                {task.pickupStatus === 'PENDING' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAcceptTask(task._id)}
                    className="w-full rounded-xl"
                  >
                    Accept Pickup Assignment
                  </Button>
                ) : task.pickupStatus === 'ASSIGNED' || task.pickupStatus === 'ACCEPTED' ? (
                  <div className="flex gap-2">
                    <Button
                      variant="teal"
                      size="sm"
                      onClick={() => handleEnRoute(task._id)}
                      className="flex-1 rounded-xl"
                    >
                      En Route to Donor
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setActivePickup(task);
                        setEnteredOtp('');
                      }}
                      className="flex-1 rounded-xl shadow-emerald-500/25"
                    >
                      <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                      Verify Donor OTP
                    </Button>
                  </div>
                ) : task.pickupStatus === 'EN_ROUTE' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setActivePickup(task);
                      setEnteredOtp('');
                    }}
                    className="w-full rounded-xl shadow-emerald-500/30"
                  >
                    <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                    Reached Donor — Verify Handover OTP
                  </Button>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-center text-xs text-emerald-300 font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Food Collected & En Route to NGO Shelter
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OTP Verification Modal */}
      <Modal
        isOpen={Boolean(activePickup)}
        onClose={() => setActivePickup(null)}
        title="Verify Handover OTP"
        description="Ask the food donor for the 6-digit confirmation code shown on their dashboard."
      >
        {otpError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{otpError}</span>
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <Input
            label="6-Digit Handover OTP"
            type="text"
            value={enteredOtp}
            onChange={(e) => setEnteredOtp(e.target.value)}
            placeholder="e.g. 482910"
            maxLength={6}
            required
            className="text-center font-mono text-xl tracking-widest font-extrabold"
          />

          <p className="text-[11px] text-slate-400 text-center">
            Tip: For seeded demo batches, the pre-generated OTP is <strong className="text-emerald-300">482910</strong>.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setActivePickup(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isVerifying}>
              Confirm Handover
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
