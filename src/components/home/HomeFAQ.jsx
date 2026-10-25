import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: 'How long does delivery take across Pakistan?',
    a: 'Orders are dispatched within 24 hours. Delivery takes 2 to 4 business days for major cities including Lahore, Karachi, Islamabad, and Rawalpindi, and 3 to 5 business days for other regional areas.',
  },
  {
    q: 'Can I pay using Cash on Delivery (COD)?',
    a: 'Yes, absolutely! We offer Cash on Delivery (COD) nationwide so you can inspect your package and pay only when it arrives at your doorstep. We also accept secure online card payments.',
  },
  {
    q: 'What is your return & exchange policy?',
    a: 'We offer a simple 7-day return and exchange policy. If an item arrives damaged or defective, you can file a return request online.',
  },
];

export default function HomeFAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-10 sm:py-16 md:py-20 bg-[#050505] relative z-10 border-t border-white/5">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-apex-red/10 border border-apex-red/20 text-apex-red text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">
            <HelpCircle className="w-3 h-3" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-wider mb-2">
            FREQUENTLY ASKED <span className="text-apex-red">QUESTIONS</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Quick answers about shipping, payments, warranty, and returns
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full min-h-[50px] p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer hover:bg-white/[0.02] transition-colors focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-xs sm:text-sm md:text-base font-bold text-white pr-4">
                    {faq.q}
                  </span>
                  <div className={`w-7 h-7 rounded-full bg-white/5 flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-apex-red/20 text-apex-red' : 'text-gray-400'}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 text-xs sm:text-sm text-gray-400 leading-relaxed border-t border-white/5">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
