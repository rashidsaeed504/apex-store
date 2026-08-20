import React from 'react';
import { motion } from 'framer-motion';
import { Truck, ShieldCheck, Award, HeadphonesIcon } from 'lucide-react';

const WhyApex = () => {
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
    <section className="py-12 sm:py-16 bg-[#050505] border-y border-white/5 relative z-10">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 2x2 Grid on Mobile, 4-Column Grid on Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 sm:p-6 text-center hover:border-apex-red/50 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-apex-red/10 border border-apex-red/20 mb-3 sm:mb-4">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-apex-red" />
                </div>
                <h3 className="text-white text-xs sm:text-sm font-black tracking-wider uppercase mb-1 leading-tight">
                  {benefit.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-400 font-medium">
                  {benefit.subtitle}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyApex;
