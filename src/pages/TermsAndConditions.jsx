import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, ShieldCheck, HelpCircle, Mail, MapPin } from 'lucide-react';

export default function TermsAndConditions() {
  useEffect(() => {
    document.title = "Terms & Conditions | APEX Store";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-24 pb-16 min-h-screen bg-[#050505] text-white">
      {/* Hero Header */}
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
            <FileText className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 uppercase tracking-wider text-white">
            Terms & <span className="text-apex-red">Conditions</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
            Effective Date: February 2026. Please read these terms carefully before placing an order or using the APEX Store platform.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="container max-w-4xl mx-auto px-4 py-10 sm:py-14">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 sm:p-10 space-y-8 text-gray-300 text-sm leading-relaxed shadow-2xl">
          
          {/* 1. Introduction */}
          <div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
              <span className="text-apex-red">01.</span> Introduction & Agreement
            </h2>
            <p>
              Welcome to <strong>APEX Store</strong> ("we", "our", or "us"). By accessing or using our website (<span className="text-gray-200">apexstore.pk</span>), browsing products, or submitting orders, you agree to be bound by these Terms and Conditions and our associated policies. If you do not agree with any part of these terms, please discontinue use of our site.
            </p>
          </div>

          {/* 2. Eligibility */}
          <div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
              <span className="text-apex-red">02.</span> User Eligibility
            </h2>
            <p>
              By placing an order on APEX Store, you confirm that you are at least 18 years of age or possess legal parental/guardian consent to enter into commercial transactions in your jurisdiction.
            </p>
          </div>

          {/* 3. Intellectual Property */}
          <div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
              <span className="text-apex-red">03.</span> Intellectual Property Rights
            </h2>
            <p>
              All trademarks, product graphics, UI assets, logos, and custom copy on this storefront are the intellectual property of APEX Store. Unauthorized reproduction, modification, or commercial re-distribution of any material without written consent is strictly prohibited.
            </p>
          </div>

          {/* 4. Product Information & Pricing */}
          <div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
              <span className="text-apex-red">04.</span> Product Information & Pricing
            </h2>
            <p className="mb-2">
              We make every effort to display accurate product descriptions, high-resolution imagery, and current pricing. However:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-400">
              <li>All prices are denominated in <strong>Pakistani Rupees (PKR)</strong> and are inclusive of standard applicable costs unless stated otherwise.</li>
              <li>We reserve the right to correct typographical or pricing errors prior to dispatching your order.</li>
              <li>Actual product color finishes may slightly vary due to individual monitor calibration and studio lighting.</li>
            </ul>
          </div>

          {/* 5. Orders & Verification */}
          <div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
              <span className="text-apex-red">05.</span> Order Placement & Verification
            </h2>
            <p>
              When you place an order, you will receive an automatic confirmation with a unique Order Number (e.g. <span className="font-mono text-apex-red font-bold">#APEX-XXXX</span>). For Cash on Delivery (COD) orders, our verification team may contact you via phone or WhatsApp to confirm your shipping details prior to courier handover.
            </p>
          </div>

          {/* 6. Payment Methods */}
          <div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
              <span className="text-apex-red">06.</span> Payment Terms
            </h2>
            <p>
              We support convenient payment channels including <strong>Cash on Delivery (COD)</strong>, direct Online Bank Transfers, and mobile wallets (JazzCash & Easypaisa). Payment must be made in full at the time of delivery for COD parcels.
            </p>
          </div>

          {/* 7. Shipping & Delivery */}
          <div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
              <span className="text-apex-red">07.</span> Shipping & Delivery Timelines
            </h2>
            <p>
              Standard courier delivery time across Pakistan is <strong>2 to 4 business days</strong> for major cities (Lahore, Karachi, Islamabad, Rawalpindi) and <strong>3 to 5 business days</strong> for remote regions. APEX Store is not liable for minor courier transit delays caused by extreme weather, public holidays, or incorrect recipient addresses.
            </p>
          </div>

          {/* 8. Return & Exchange Policy */}
          <div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
              <span className="text-apex-red">08.</span> Returns & Warranty Claims
            </h2>
            <p>
              All purchases are backed by our <strong>7-Day Return & Replacement Policy</strong>. For detailed criteria, defect inspection procedures, and refund timelines, please review our official <Link to="/refund-policy" className="text-apex-red hover:underline font-medium">Refund & Return Policy</Link>.
            </p>
          </div>

          {/* 9. Limitation of Liability */}
          <div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
              <span className="text-apex-red">09.</span> Limitation of Liability
            </h2>
            <p>
              Under no circumstances shall APEX Store, its executives, or staff be held liable for indirect, incidental, or consequential damages resulting from product misuse or unauthorized modifications. Our maximum liability is strictly limited to the purchase price of the product.
            </p>
          </div>

          {/* 10. Governing Law */}
          <div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
              <span className="text-apex-red">10.</span> Governing Law
            </h2>
            <p>
              These Terms and Conditions and any separate agreements shall be governed by and construed in accordance with the applicable laws and consumer regulations of the Islamic Republic of Pakistan.
            </p>
          </div>

          {/* Contact Support Box */}
          <div className="p-6 bg-[#111] border border-white/10 rounded-xl space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-apex-red flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> Need Assistance?
            </h2>
            <p className="text-xs text-gray-400">
              For questions regarding our terms or an existing order, please contact our support team:
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
