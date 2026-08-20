import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const PromoSection = () => {
  return (
    <section className="py-12 sm:py-20 md:py-28 bg-[#050505] relative z-10 overflow-hidden border-t border-white/5">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0a0a0a] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 relative flex flex-col lg:flex-row items-center shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          {/* Subtle ambient red spotlight */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-apex-red/20 blur-[100px] sm:blur-[130px] rounded-full pointer-events-none z-0" />

          {/* Left Content */}
          <div className="w-full lg:w-1/2 p-6 sm:p-10 lg:p-16 xl:p-20 relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-apex-red/15 text-apex-red text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6 border border-apex-red/30">
                <span className="w-1.5 h-1.5 rounded-full bg-apex-red animate-pulse" />
                Special Offer
              </div>

              <h2 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-black uppercase tracking-tight mb-4 sm:mb-6 leading-[1.05] text-white">
                LEVEL UP <br />
                <span className="text-gradient-red drop-shadow-[0_0_25px_rgba(220,38,38,0.4)]">
                  YOUR EVERYDAY.
                </span>
              </h2>

              <p className="text-gray-400 text-xs sm:text-base mb-6 sm:mb-8 max-w-md font-normal leading-relaxed">
                Discover powerful tech, smarter accessories and products built
                for your lifestyle.
              </p>

              <Link
                to="/shop"
                className="btn-primary group inline-flex items-center justify-center px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-full shadow-[0_0_25px_rgba(220,38,38,0.35)] hover:shadow-[0_0_40px_rgba(220,38,38,0.75)] hover:-translate-y-1 transition-all duration-300 text-xs sm:text-sm font-bold tracking-wider uppercase"
              >
                EXPLORE APEX{" "}
                <ArrowRight className="ml-1.5 w-3.5 h-3.5 sm:ml-2 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {/* Right Image */}
          <div className="w-full lg:w-1/2 h-48 sm:h-80 lg:h-auto lg:absolute lg:top-0 lg:right-0 lg:bottom-0">
            <motion.div
              initial={{ opacity: 0, scale: 1.05 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="w-full h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent hidden lg:block z-10" />
              <img
                src="https://i.pinimg.com/736x/de/8f/a7/de8fa75149156c8335177a56deec3573.jpg"
                alt="Premium Tech Lifestyle"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoSection;
