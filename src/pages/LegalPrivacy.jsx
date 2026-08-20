import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Lock, Eye, Database, HelpCircle, Mail, MapPin } from 'lucide-react';

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy | APEX Store";
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
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 uppercase tracking-wider text-white">
            Privacy <span className="text-apex-red">Policy</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
            Effective Date: February 2026. This policy outlines how APEX Store collects, encrypts, and safeguards your customer information.
          </p>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="container max-w-4xl mx-auto px-4 py-10 sm:py-14">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 sm:p-10 space-y-8 text-gray-300 text-sm leading-relaxed shadow-2xl">
          
          {/* 1. Introduction */}
          <div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
              <span className="text-apex-red">01.</span> Commitment to Data Privacy
            </h2>
            <p>
              At <strong>APEX Store</strong> ("we", "our", or "us"), we prioritize your privacy. We are committed to transparency in how we collect, store, and utilize your personal information when you shop with us, access our tracking portal, or interact with our support staff.
            </p>
          </div>

          {/* 2. Information We Collect */}
          <div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
              <span className="text-apex-red">02.</span> Information We Collect
            </h2>
            <p className="mb-2">We collect the necessary information required to process and fulfill your orders seamlessly:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-400">
              <li><strong className="text-white">Contact & Delivery Information:</strong> Customer name, shipping address, city, phone number, and email address.</li>
              <li><strong className="text-white">Order Details:</strong> Purchased items, SKU selections, quantities, order totals, and live delivery status.</li>
              <li><strong className="text-white">Technical & Usage Logs:</strong> Device type, browser type, and anonymous session tokens for cart persistence.</li>
            </ul>
          </div>

          {/* 3. How We Use Your Information */}
          <div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
              <span className="text-apex-red">03.</span> How We Use Your Data
            </h2>
            <p className="mb-2">Your information is used strictly for operational and customer service purposes:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-400">
              <li>Dispatching packages with verified logistics couriers across Pakistan.</li>
              <li>Sending automated order confirmations and SMS/WhatsApp status updates.</li>
              <li>Preventing fraudulent orders and duplicate submissions.</li>
              <li>Providing real-time tracking on your private order history portal.</li>
            </ul>
          </div>

          {/* 4. Data Security */}
          <div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
              <span className="text-apex-red">04.</span> Data Security & Encryption
            </h2>
            <p>
              We implement industry-standard 256-bit SSL encryption across all store transactions. Customer database records are safeguarded via secure Row Level Security (RLS) policies on Supabase cloud infrastructure, ensuring customers only ever access their own authenticated order receipts.
            </p>
          </div>

          {/* 5. Sharing of Information */}
          <div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
              <span className="text-apex-red">05.</span> Non-Disclosure to Third Parties
            </h2>
            <p>
              <strong>We never sell, rent, or trade your personal data.</strong> Information is shared exclusively with necessary operational partners (e.g. licensed courier services delivering your parcel) solely to complete fulfillment.
            </p>
          </div>

          {/* 6. Cookies Policy */}
          <div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
              <span className="text-apex-red">06.</span> Cookies & Local Storage
            </h2>
            <p>
              We use secure browser cookies and local storage tokens to retain items in your cart, store wishlist preferences, and enable frictionless one-click order tracking for guest shoppers.
            </p>
          </div>

          {/* 7. Your Privacy Rights */}
          <div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
              <span className="text-apex-red">07.</span> Your Rights & Data Requests
            </h2>
            <p>
              You have full rights to request a copy of your stored order information, update delivery contact details, or request account data removal at any time by emailing our privacy team.
            </p>
          </div>

          {/* Contact Us */}
          <div className="p-6 bg-[#111] border border-white/10 rounded-xl space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-apex-red flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> Privacy Inquiries
            </h2>
            <p className="text-xs text-gray-400">
              If you have any questions regarding your data privacy or wish to request data updates, please contact us:
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
