import React from 'react';
import { Truck, ShieldCheck, Award, HeadphonesIcon } from 'lucide-react';
import { useScrollReveal } from '../../lib/motion/hooks/useScrollReveal';

const WhyApex = () => {
  const sectionRef = useScrollReveal({ target: '.benefit-card', yOffset: 24, stagger: 0.08 });

  const benefits = [
    {
      icon: Truck,
      title: 'FAST DELIVERY',
      subtitle: 'At your doorstep',
      description: 'Get your orders delivered quickly and safely.'
    },
    {
      icon: ShieldCheck,
      title: 'SECURE PAYMENTS',
      subtitle: '100% Protected',
      description: 'Safe and reliable payment experience.'
    },
    {
      icon: Award,
      title: 'PREMIUM QUALITY',
      subtitle: 'Built to last',
      description: 'Carefully selected products you can trust.'
    },
    {
      icon: HeadphonesIcon,
      title: 'CUSTOMER SUPPORT',
      subtitle: "We're here for you",
      description: "We're here whenever you need us."
    }
  ];

  return (
    <section ref={sectionRef} className="py-12 sm:py-16 bg-[#050505] border-y border-white/5 relative z-10">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 2x2 Grid on Mobile, 4-Column Grid on Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="benefit-card group bg-[#0a0a0a] border border-white/10 rounded-xl p-4 sm:p-6 text-center hover:border-apex-red/50 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(220,38,38,0.2)] transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-apex-red/10 border border-apex-red/20 mb-3 sm:mb-4 group-hover:scale-110 group-hover:bg-apex-red/20 group-hover:border-apex-red/40 transition-all duration-300">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-apex-red" />
                </div>
                <h3 className="text-white text-xs sm:text-sm font-black tracking-wider uppercase mb-1 leading-tight group-hover:text-apex-red transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-400 font-medium">
                  {benefit.subtitle}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyApex;
