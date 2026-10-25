import React, { useState } from 'react';
import AnimatedIcon from '../common/AnimatedIcon';

const BENEFITS = [
  {
    id: 'cod',
    iconKey: 'truck',
    title: 'CASH ON DELIVERY',
    subtitle: 'Pay at your doorstep',
    description: 'Available across all cities in Pakistan.',
  },
  {
    id: 'delivery',
    iconKey: 'fast_delivery',
    title: 'FAST DELIVERY',
    subtitle: '2-4 Days nationwide',
    description: 'Quick dispatched via top courier partners.',
  },
  {
    id: 'warranty',
    iconKey: 'warranty',
    title: 'OFFICIAL WARRANTY',
    subtitle: '100% Genuine tech',
    description: 'Complete peace of mind with replacement check.',
  },
  {
    id: 'returns',
    iconKey: 'returns',
    title: 'EASY RETURNS',
    subtitle: '7-Day hassle-free',
    description: 'Simple and fast replacement policy.',
  },
];

export default function WhyApex() {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <section 
      aria-label="Trust and Guarantees" 
      className="py-8 sm:py-12 md:py-16 bg-[#050505] relative z-10 border-y border-white/5"
    >
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Unified Continuous Trust Band */}
        <div className="relative rounded-2xl sm:rounded-3xl bg-[#0a0a0a]/90 border border-white/10 backdrop-blur-md shadow-2xl overflow-hidden transition-colors duration-300">
          {/* Subtle Ambient Red Glow across the band */}
          <div 
            aria-hidden="true" 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-apex-red/5 to-transparent pointer-events-none blur-xl"
          />

          {/* 4 Columns on Desktop with Thin Dividers, 2x2 Grid on Mobile */}
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y divide-white/5 sm:divide-white/10 lg:divide-y-0 lg:divide-x">
            {BENEFITS.map((item, index) => {
              const isHovered = hoveredId === item.id;
              // Clean mobile 2x2 dividing border classes
              const mobileBorderClasses = 
                index % 2 === 0 ? 'border-r border-white/5 sm:border-white/10' : '';

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`
                    group relative p-4 sm:p-6 lg:p-7 
                    flex flex-col items-center text-center 
                    cursor-default 
                    transition-all duration-300 
                    hover:-translate-y-0.5 hover:bg-white/[0.02]
                    ${mobileBorderClasses}
                  `}
                >
                  {/* Subtle Red Highlight on Hover */}
                  <div 
                    aria-hidden="true"
                    className={`
                      absolute inset-0 bg-gradient-to-b from-apex-red/[0.04] to-transparent 
                      pointer-events-none transition-opacity duration-300
                      ${isHovered ? 'opacity-100' : 'opacity-0'}
                    `}
                  />

                  {/* Upgraded Phosphor Duotone Icon in 16px Rounded Square with Micro-animation */}
                  <AnimatedIcon
                    name={item.iconKey}
                    size={42}
                    weight="duotone"
                    isHovered={isHovered}
                    containerClassName="mb-3 sm:mb-4"
                  />

                  {/* Uniform Title Color (White) */}
                  <h3 className="text-white font-black text-xs sm:text-sm tracking-wider uppercase mb-1 leading-tight group-hover:text-white transition-colors">
                    {item.title}
                  </h3>

                  {/* Uniform Subtitle Color (Muted Gray) */}
                  <p className="text-[11px] sm:text-xs text-gray-400 font-medium leading-snug">
                    {item.subtitle}
                  </p>

                  {/* Subtext Description */}
                  <p className="text-[10px] sm:text-[11px] text-gray-500 leading-relaxed mt-1 max-w-[190px] hidden sm:block">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
