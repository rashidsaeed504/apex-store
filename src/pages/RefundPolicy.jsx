import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ArrowLeft, CheckCircle2, AlertCircle, HelpCircle, Mail, MapPin, ShieldCheck, Clock, Truck } from 'lucide-react';

export default function RefundPolicy() {
  useEffect(() => {
    document.title = "Refund & Return Policy | APEX Store";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-24 pb-16 min-h-screen bg-[#050505] text-white">
      {/* Hero Section */}
      <section className="bg-apex-dark py-12 md:py-16 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-48 bg-apex-red/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="container max-w-4xl mx-auto px-4 text-center relative z-10">
          <Link
            to="/"
            className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-apex-red transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Store
          </Link>
          <div className="w-14 h-14 rounded-2xl bg-apex-red/10 border border-apex-red/25 text-apex-red flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_rgba(220,38,38,0.2)]">
            <RefreshCw className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 uppercase tracking-wider text-white">
            Refund & <span className="text-apex-red">Return Policy</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
            Effective Date: February 2026. Every purchase is backed by our customer-first 7-Day inspection guarantee.
          </p>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="container max-w-4xl mx-auto px-4 py-10 sm:py-14">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 sm:p-10 space-y-8 text-gray-300 text-sm leading-relaxed shadow-2xl">
          
          {/* Overview */}
          <div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
              <span className="text-apex-red">01.</span> Policy Overview & Guarantee
            </h2>
            <p>
              At <strong>APEX Store</strong>, customer confidence and satisfaction are central to our brand. If you encounter any functional defect, transit damage, or receive an incorrect item, we provide a streamlined return, replacement, or refund procedure.
            </p>
          </div>

          {/* Return Window Box */}
          <div className="p-5 bg-apex-red/10 border border-apex-red/25 rounded-xl space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-apex-red flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> 7-Day Hassle-Free Return Window
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              All return or replacement claims must be initiated within <strong>7 calendar days</strong> of receiving your parcel. Claims submitted beyond this 7-day period will not be eligible for returns or refunds.
            </p>
          </div>

          {/* Conditions for Returns */}
          <div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
              <span className="text-apex-red">02.</span> Eligibility Criteria
            </h2>
            <p className="mb-3">To qualify for a valid return or exchange, the returned unit must meet the following criteria:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-gray-300">Unused condition with original plastic seal / protective film intact.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-gray-300">Complete accessories (cables, manuals, extra ear tips, packaging box).</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-gray-300">Valid Order ID (e.g. #APEX-XXXX) and invoice verification.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-gray-300">Transit damage claims notified within 24 hours of package delivery.</span>
              </div>
            </div>
          </div>

          {/* Non-Returnable Items */}
          <div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
              <span className="text-apex-red">03.</span> Non-Returnable Conditions
            </h2>
            <p className="mb-2">We cannot accept returns or issue refunds in the following circumstances:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-400">
              <li>Physical or liquid damage resulting from customer drops, water exposure, or third-party electrical surges.</li>
              <li>Products with altered serial numbers or missing essential retail box items.</li>
              <li>Clearance promotional items explicitly labeled as Final Sale / Non-Returnable.</li>
            </ul>
          </div>

          {/* Refund Processing Timelines */}
          <div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
              <span className="text-apex-red">04.</span> Refund Processing & Timelines
            </h2>
            <p>
              Once your returned package arrives at our inspection center in Lahore, our quality control team verifies its condition within <strong>24 to 48 hours</strong>. Upon approval, your refund will be disbursed within <strong>3 to 5 business days</strong> via:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-xs text-gray-400">
              <li>Direct Bank Transfer (IBFT across all Pakistani banks)</li>
              <li>JazzCash or Easypaisa Mobile Wallets</li>
            </ul>
          </div>

          {/* 4-Step Return Process */}
          <div className="p-6 bg-[#111] border border-white/10 rounded-xl space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-apex-red flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> 4 Simple Steps to Request a Return
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                <span className="text-apex-red font-mono font-bold">STEP 01</span>
                <p className="text-white font-medium mt-1">Submit Request</p>
                <p className="text-gray-400 text-[11px] mt-0.5">Email apexstore530@gmail.com with your Order # and short unboxing clip or photo.</p>
              </div>
              <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                <span className="text-apex-red font-mono font-bold">STEP 02</span>
                <p className="text-white font-medium mt-1">Authorization</p>
                <p className="text-gray-400 text-[11px] mt-0.5">Our support team issues return authorization and courier dispatch instructions.</p>
              </div>
              <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                <span className="text-apex-red font-mono font-bold">STEP 03</span>
                <p className="text-white font-medium mt-1">Courier Inspection</p>
                <p className="text-gray-400 text-[11px] mt-0.5">Package is received and verified by our technical testing team.</p>
              </div>
              <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                <span className="text-apex-red font-mono font-bold">STEP 04</span>
                <p className="text-white font-medium mt-1">Instant Refund / Swap</p>
                <p className="text-gray-400 text-[11px] mt-0.5">Replacement dispatched or refund credited directly to your bank account.</p>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="p-6 bg-[#111] border border-white/10 rounded-xl space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-apex-red flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> Support & Inquiries
            </h2>
            <p className="text-xs text-gray-400">
              Need help starting a return or tracking a replacement package?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="flex items-center gap-2 text-gray-300">
                <Mail className="w-4 h-4 text-apex-red shrink-0" />
                <span>apexstore530@gmail.com</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <MapPin className="w-4 h-4 text-apex-red shrink-0" />
                <span>Lahore, Pakistan</span>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
