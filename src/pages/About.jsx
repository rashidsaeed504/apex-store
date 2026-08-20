import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, HeadphonesIcon, Award, Package, Truck, RefreshCcw } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';

const heroContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.08,
    },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const About = () => {
  return (
    <div className="pt-24 pb-16 min-h-screen bg-apex-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-apex-dark py-12 sm:py-20 border-b border-white/5">
        {/* Subtle Decorative Animated SVG Accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20">
          <motion.svg
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="w-[420px] h-[420px] sm:w-[540px] sm:h-[540px] text-apex-red"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.75"
              strokeDasharray="4 6"
            />
          </motion.svg>
        </div>

        <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
          <motion.div
            variants={heroContainer}
            initial="hidden"
            animate="visible"
            className="max-w-3xl mx-auto"
          >
            <motion.span 
              variants={heroItem}
              className="inline-block text-xs font-bold uppercase tracking-widest text-apex-red bg-apex-red/10 border border-apex-red/20 px-3.5 py-1 rounded-full mb-4"
            >
              The APEX Legacy
            </motion.span>
            <motion.h1 
              variants={heroItem}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black mb-4 sm:mb-6 tracking-tight"
            >
              ABOUT <span className="text-apex-red">APEX</span>
            </motion.h1>
            <motion.p 
              variants={heroItem}
              className="text-base sm:text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
            >
              Redefining how you experience technology with premium performance and authentic engineering.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl overflow-hidden border border-white/10 relative shadow-2xl"
            >
              <div className="absolute inset-0 bg-apex-red/5 mix-blend-overlay"></div>
              <img 
                src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80" 
                alt="Tech Lifestyle" 
                loading="lazy"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="bg-apex-red/10 text-apex-red px-4 py-1 rounded-full text-xs sm:text-sm font-bold tracking-wider mb-6 inline-block border border-apex-red/20">
                OUR STORY
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-6">FROM PASSION TO PURPOSE.</h2>
              <p className="text-gray-400 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 leading-relaxed">
                Founded with a deep passion for technology, APEX STORE was born out of a desire to bring the world's most premium and innovative electronic devices directly to tech enthusiasts in Pakistan.
              </p>
              <p className="text-gray-400 text-sm sm:text-base md:text-lg leading-relaxed">
                We believe that experiencing cutting-edge technology shouldn't be a hassle. That's why we've curated a selection of the best products, ensuring authenticity, quality, and a seamless shopping experience for every customer.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Mission & Stats */}
      <section className="py-12 sm:py-20 bg-apex-charcoal/30 border-y border-white/5">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <SectionHeader title="OUR MISSION" subtitle="Making premium technology accessible to everyone." centered />
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mt-12 sm:mt-16">
            {[
              { label: 'Products Sold', value: '10,000+' },
              { label: 'Happy Customers', value: '5,000+' },
              { label: 'Brands', value: '50+' },
              { label: 'Support', value: '24/7' }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: (idx % 6) * 0.07, ease: [0.22, 1, 0.36, 1] }}
                className="text-center p-4 sm:p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-apex-red/30 hover:-translate-y-1 transition-all duration-300 shadow-lg"
              >
                <div className="text-2xl sm:text-4xl md:text-5xl font-black text-apex-red mb-2 drop-shadow-[0_0_15px_rgba(220,38,38,0.2)] font-mono">{stat.value}</div>
                <div className="text-xs sm:text-sm text-gray-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <SectionHeader title="WHY CHOOSE US" subtitle="The APEX difference in every purchase." centered />
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-12 sm:mt-16">
            {[
              { icon: <Shield className="w-7 h-7 sm:w-8 sm:h-8" />, title: 'Genuine Products', desc: '100% authentic tech gear guaranteed.' },
              { icon: <Zap className="w-7 h-7 sm:w-8 sm:h-8" />, title: 'Fast Delivery', desc: 'Express shipping nationwide across Pakistan.' },
              { icon: <HeadphonesIcon className="w-7 h-7 sm:w-8 sm:h-8" />, title: 'Expert Support', desc: 'Dedicated team to help you choose the right tech.' },
              { icon: <Award className="w-7 h-7 sm:w-8 sm:h-8" />, title: 'Quality Assured', desc: 'Every product is tested for peak performance.' }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: (idx % 6) * 0.07, ease: [0.22, 1, 0.36, 1] }}
                className="bg-apex-dark border border-white/5 p-6 sm:p-8 rounded-2xl hover:border-apex-red/30 hover:shadow-[0_0_20px_rgba(220,38,38,0.1)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="bg-apex-red/10 text-apex-red w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mb-3 sm:mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-base sm:text-xl font-bold mb-1 sm:mb-3">{feature.title}</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Promise */}
      <section className="py-12 sm:py-20 bg-apex-charcoal/30 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <SectionHeader title="OUR PROMISE TO YOU" subtitle="We stand behind everything we sell." centered />
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16 max-w-4xl mx-auto">
            {[
              { icon: <Truck className="w-6 h-6" />, title: 'Fast Delivery', desc: 'Get your orders quickly.' },
              { icon: <Package className="w-6 h-6" />, title: 'Genuine Products', desc: 'Sourced directly from brands.' },
              { icon: <RefreshCcw className="w-6 h-6" />, title: 'Easy Returns', desc: 'Hassle-free 7-day returns.' }
            ].map((promise, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: (idx % 6) * 0.07, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center text-center p-6 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-white/10 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="text-apex-red mb-4 p-3 rounded-xl bg-apex-red/10">{promise.icon}</div>
                <h4 className="font-bold mb-2 text-base sm:text-lg">{promise.title}</h4>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{promise.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
