import React from 'react';

export const TermsPrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#072B2B] text-slate-100 px-4 sm:px-8 py-16">
      <div className="max-w-3xl mx-auto space-y-8 bg-[#0A3333] border border-emerald-600/30 p-8 rounded-3xl">
        <h1 className="text-2xl font-bold text-white">Terms of Service & Food Safety Disclaimer</h1>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-emerald-300">1. Food Safety & Regulatory Compliance</h2>
            <p>
              FoodRescue enforces platform verification procedures, packaging standards, and safe consumption deadlines. However, platform verification does not replace professional on-site food inspection or statutory FSSAI compliance. Donors must certify that donated items were prepared, handled, and stored under sanitary conditions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-emerald-300">2. Expiration & Safe Deadlines</h2>
            <p>
              No item that has passed its designated safe consumption deadline may be redistributed under any circumstances. Automated system jobs strictly invalidate offers and revoke claims for expired batches.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-emerald-300">3. Privacy & Beneficiary Protection</h2>
            <p>
              Beneficiary identities, sensitive contact records, and household addresses are strictly confidential and shielded from public discovery.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
