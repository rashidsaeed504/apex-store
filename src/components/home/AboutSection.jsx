import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useScrollReveal } from '../../lib/motion/hooks/useScrollReveal';
import TechBackground from '../../lib/motion/components/TechBackground';

const AboutSection = () => {
  const sectionRef = useScrollReveal({ target: '.about-reveal-item', yOffset: 28, stagger: 0.1 });

  return (
    <section ref={sectionRef} className="py-14 sm:py-20 md:py-24 bg-[#050505] relative z-10 overflow-hidden border-t border-white/5">
      <TechBackground variant="grid" glowPosition="bottom-left" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Left Content Column */}
          <div className="w-full lg:w-1/2">
            <div className="about-reveal-item">
              <div className="mb-4">
                <span className="text-apex-red font-bold tracking-[0.2em] text-xs uppercase">
                  OUR STORY
                </span>
              </div>

              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight mb-6 leading-[1.05] text-white">
                BUILT FOR <br />
                THE{" "}
                <span className="text-gradient-red drop-shadow-[0_0_25px_rgba(220,38,38,0.4)]">
                  NEXT
                </span>{" "}
                <br />
                GENERATION.
              </h2>

              <div className="space-y-4 text-gray-400 text-sm sm:text-base mb-8 font-normal leading-relaxed">
                <p>
                  At APEX, we believe that technology should empower, not
                  complicate. We curate and create premium electronics that
                  seamlessly integrate into your modern lifestyle.
                </p>
                <p className="hidden sm:block">
                  Every product in our collection is selected for its
                  exceptional design, innovative features, and uncompromising
                  quality.
                </p>
              </div>

              <Link
                to="/about"
                className="inline-flex items-center font-bold text-white hover:text-apex-red transition-colors uppercase tracking-wider text-xs sm:text-sm group"
              >
                <span>ABOUT APEX</span>
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform text-apex-red" />
              </Link>
            </div>
          </div>

          {/* Right Image Column (Stacked Vertically on Mobile) */}
          <div className="about-reveal-item w-full lg:w-1/2 relative mt-4 lg:mt-0">
            {/* Ambient Red Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-apex-red/15 blur-[90px] rounded-full pointer-events-none z-0" />

            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl z-10 group">
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-60 z-10" />
              <img
                src="/src/assets/our story.png"
                alt="About Apex Lifestyle"
                loading="lazy"
                width={800}
                height={600}
                className="w-full h-[280px] sm:h-[380px] md:h-[450px] object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute bottom-6 left-6 z-20">
                <p className="text-xs text-apex-red font-mono uppercase tracking-widest mb-1">EST. 2026</p>
                <h4 className="text-white text-lg font-black uppercase">Engineered for Performance</h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
