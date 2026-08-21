import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Mail,
  MapPin,
  ShieldCheck,
  Clock,
  Truck,
  Package,
} from 'lucide-react';
import { fetchReturnSettings, DEFAULT_RETURN_SETTINGS } from '../services/api';

export default function RefundPolicy() {
  const [settings, setSettings] = useState(DEFAULT_RETURN_SETTINGS);

  useEffect(() => {
    document.title = "Refund & Return Policy | APEX Store";
    window.scrollTo(0, 0);

    async function loadSettings() {
      const cfg = await fetchReturnSettings();
      if (cfg) setSettings(cfg);
    }
    loadSettings();
  }, []);

  const windowDays = Number(settings.return_window_days || 7);

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
            <RotateCcw className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 uppercase tracking-wider text-white">
            Refund & <span className="text-apex-red">Return Policy</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
            {settings.policy_banner_text || `Every purchase is backed by our customer-first ${windowDays}-Day inspection guarantee.`}
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
              At <strong>APEX Store</strong>, customer confidence and satisfaction are central to our brand. If you encounter any functional defect, transit damage, or receive an incorrect item, we provide a streamlined return, replacement, or refund procedure under our <strong>7 Days Return</strong> policy.
            </p>
          </div>

          {/* Return Window Box */}
          <div className="p-5 bg-apex-red/10 border border-apex-red/25 rounded-xl space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-apex-red flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {windowDays}-Day Return Window
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              All return or replacement claims must be initiated within <strong>{windowDays} calendar days</strong> of package delivery. The return window is calculated based on the official courier delivered timestamp.
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
                <span className="text-xs text-gray-300">Unused condition with original retail packaging and protective seals intact.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-gray-300">Complete accessories (cables, manuals, extra ear tips, retail box).</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-gray-300">Valid Order ID (e.g. #APEX-XXXX) and registered customer account.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-gray-300">Both COD (Cash on Delivery) and Direct Payment orders are eligible.</span>
              </div>
            </div>
          </div>

          {/* Unboxing Video Requirement (NEW) */}
          <div className="p-6 bg-[#0f0f0f] border border-amber-500/30 rounded-2xl space-y-4">
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-amber-400 border-b border-white/10 pb-2 flex items-center gap-2">
              <span className="text-apex-red">03.</span> Unboxing Video Requirement
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              We strongly recommend that customers record a continuous, unedited video while opening their parcel at the time of delivery.
            </p>

            <div className="bg-black/50 p-4 rounded-xl border border-white/5 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-white">The video should clearly show:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-gray-300">
                <li>The sealed parcel with shipping label and order information visible</li>
                <li>The parcel condition before opening</li>
                <li>The complete, uninterrupted opening and unboxing process</li>
                <li>The product and all included accessories</li>
                <li>Any visible transit damage, missing item, wrong product, or physical defect</li>
              </ul>
            </div>

            <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
              <p>
                <strong>Supporting Evidence for Damage & Wrong-Item Claims:</strong> For claims involving a damaged product, wrong product received, missing item/accessory, parcel tampering, or product condition disputes, an unboxing video <strong>may be required</strong> as supporting evidence before a return, replacement, or refund can be approved.
              </p>
              <p>
                The video should be continuous and unedited, starting before the parcel is opened.
              </p>
              <p className="text-gray-400">
                If an unboxing video is not available, APEX STORE may request additional evidence (such as detailed photos of the packaging and product) and may not be able to verify certain delivery or transit damage claims.
              </p>
              <p>
                When returning a product, the customer may be asked to provide:
              </p>
              <ul className="list-disc pl-5 space-y-0.5 text-gray-400">
                <li>Original unboxing video</li>
                <li>Clear photos / videos of the product</li>
                <li>Photos / videos of the exterior and interior packaging</li>
              </ul>
              <p className="text-[11px] text-gray-400 italic pt-1">
                APEX STORE reserves the right to review submitted evidence before approving a return, replacement, or refund.
              </p>
            </div>
          </div>

          {/* Return Shipping Fees */}
          <div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
              <span className="text-apex-red">04.</span> Return Shipping & Logistics
            </h2>
            <div className="p-4 bg-[#121212] border border-white/10 rounded-xl space-y-2 text-xs text-gray-300">
              <p>
                <strong className="text-white">Return Shipping Terms:</strong> Return shipping is not provided as a free service. For customer-initiated returns (e.g. change of mind or personal preference), return courier charges are the responsibility of the customer.
              </p>
              <p className="text-gray-400">
                In cases of verified manufacturing defects or store fulfillment errors (e.g., incorrect item sent), APEX Store will facilitate package pickup through our contracted courier partners.
              </p>
            </div>
          </div>

          {/* Non-Returnable Items */}
          <div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
              <span className="text-apex-red">05.</span> Non-Returnable Conditions
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
              <span className="text-apex-red">06.</span> Refund Processing & Timelines
            </h2>
            <p>
              Once your returned package arrives at our inspection facility, our quality control team verifies its condition within <strong>24 to 48 hours</strong>. Upon approval, your refund will be disbursed within <strong>3 to 5 business days</strong> via:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-xs text-gray-400">
              <li>Direct Bank Transfer (IBFT across all Pakistani commercial banks)</li>
              <li>JazzCash, Easypaisa, or Original payment method</li>
            </ul>
          </div>

          {/* 4-Step Return Process */}
          <div className="p-6 bg-[#111] border border-white/10 rounded-xl space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-apex-red flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> 4 Simple Steps to Request a Return Online
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                <span className="text-apex-red font-mono font-bold">STEP 01</span>
                <p className="text-white font-medium mt-1">Open Your Order</p>
                <p className="text-gray-400 text-[11px] mt-0.5">Go to Customer Dashboard → My Orders → Click "Return / Exchange" on any delivered item.</p>
              </div>
              <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                <span className="text-apex-red font-mono font-bold">STEP 02</span>
                <p className="text-white font-medium mt-1">Select Reason & Video Evidence</p>
                <p className="text-gray-400 text-[11px] mt-0.5">Choose quantity, condition, and upload your unboxing video or photos of the defect.</p>
              </div>
              <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                <span className="text-apex-red font-mono font-bold">STEP 03</span>
                <p className="text-white font-medium mt-1">Courier Pickup & Inspection</p>
                <p className="text-gray-400 text-[11px] mt-0.5">Package is handed over to courier and inspected at our testing warehouse.</p>
              </div>
              <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                <span className="text-apex-red font-mono font-bold">STEP 04</span>
                <p className="text-white font-medium mt-1">Refund / Replacement</p>
                <p className="text-gray-400 text-[11px] mt-0.5">After technical inspection, the replacement is dispatched or refund credited to your account.</p>
              </div>
            </div>

            <div className="pt-2 text-center">
              <Link
                to="/account/orders"
                className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(220,38,38,0.35)]"
              >
                <Package className="w-4 h-4" />
                <span>Go to My Orders to Start a Return</span>
              </Link>
            </div>
          </div>

          {/* Contact Support */}
          <div className="p-6 bg-[#111] border border-white/10 rounded-xl space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-apex-red flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> Support & Inquiries
            </h2>
            <p className="text-xs text-gray-400">
              Need assistance with an active return claim or replacement?
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
