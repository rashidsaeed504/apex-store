import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, HeadphonesIcon, Award, Package, Truck, RefreshCcw } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';

const About = () => {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      {/* Hero Section */}
      <section className="bg-apex-dark py-12 sm:py-20 border-b border-white/5">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black mb-4 sm:mb-6 tracking-tight"
          >
            ABOUT <span className="text-apex-red">APEX</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto"
          >
            Redefining how you experience technology.
          </motion.p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden border border-white/10 relative"
            >
              <div className="absolute inset-0 bg-apex-red/5 mix-blend-overlay"></div>
              <img 
                src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80" 
                alt="Tech Lifestyle" 
                className="w-full h-full object-cover"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="bg-apex-red/10 text-apex-red px-4 py-1 rounded-full text-sm font-bold tracking-wider mb-6 inline-block">
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
          <SectionHeader title="OUR MISSION" subtitle="Making premium technology accessible to everyone." centered />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
            {[
              { label: 'Products Sold', value: '10,000+' },
              { label: 'Happy Customers', value: '5,000+' },
              { label: 'Brands', value: '50+' },
              { label: 'Support', value: '24/7' }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center p-4 sm:p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-apex-red/30 transition-colors"
              >
                <div className="text-2xl sm:text-4xl md:text-5xl font-black text-apex-red mb-2 drop-shadow-[0_0_15px_rgba(220,38,38,0.2)]">{stat.value}</div>
                <div className="text-xs sm:text-sm text-gray-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <SectionHeader title="WHY CHOOSE US" subtitle="The APEX difference in every purchase." centered />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-12 sm:mt-16">
            {[
              { icon: <Shield className="w-8 h-8" />, title: 'Genuine Products', desc: '100% authentic tech gear guaranteed.' },
              { icon: <Zap className="w-8 h-8" />, title: 'Fast Delivery', desc: 'Express shipping nationwide across Pakistan.' },
              { icon: <HeadphonesIcon className="w-8 h-8" />, title: 'Expert Support', desc: 'Dedicated team to help you choose the right tech.' },
              { icon: <Award className="w-8 h-8" />, title: 'Quality Assured', desc: 'Every product is tested for peak performance.' }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-apex-dark border border-white/5 p-8 rounded-2xl hover:border-apex-red/30 hover:shadow-[0_0_20px_rgba(220,38,38,0.1)] transition-all"
              >
                <div className="bg-apex-red/10 text-apex-red w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mb-3 sm:mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-sm sm:text-xl font-bold mb-1 sm:mb-3">{feature.title}</h3>
                <p className="text-gray-400 text-xs sm:text-base">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Promise */}
      <section className="py-12 sm:py-20 bg-apex-charcoal/30 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6">
          <SectionHeader title="OUR PROMISE TO YOU" subtitle="We stand behind everything we sell." centered />
          
          <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
            {[
              { icon: <Truck className="w-6 h-6" />, title: 'Fast Delivery', desc: 'Get your orders quickly.' },
              { icon: <Package className="w-6 h-6" />, title: 'Genuine Products', desc: 'Sourced directly from brands.' },
              { icon: <RefreshCcw className="w-6 h-6" />, title: 'Easy Returns', desc: 'Hassle-free 7-day returns.' }
            ].map((promise, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center text-center p-4 sm:p-6 bg-white/[0.02] rounded-2xl border border-white/5"
              >
                <div className="text-apex-red mb-4">{promise.icon}</div>
                <h4 className="font-bold mb-2">{promise.title}</h4>
                <p className="text-gray-400 text-sm">{promise.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
