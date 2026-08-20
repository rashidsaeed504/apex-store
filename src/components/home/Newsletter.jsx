import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const { success } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    success('Thank you for subscribing to APEX updates!');
    setEmail('');
  };

  return (
    <section className="py-14 sm:py-20 md:py-24 bg-[#050505] border-t border-white/5 relative z-10">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0a0a0a] rounded-2xl p-6 sm:p-10 md:p-12 border border-white/10 relative overflow-hidden shadow-2xl">
          
          {/* Subtle red lighting */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-apex-red/10 blur-[90px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-apex-red/5 blur-[90px] rounded-full pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 relative z-10">
            <div className="w-full md:w-1/2 text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center mb-3">
                  <Mail className="w-6 h-6 text-apex-red mr-3" />
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                    STAY AHEAD.
                  </h2>
                </div>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  Get updates about new products, exclusive deals and the latest tech.
                </p>
              </motion.div>
            </div>
            
            <div className="w-full md:w-1/2">
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 }}
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3 w-full"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                  className="w-full bg-[#111] border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-apex-red focus:ring-1 focus:ring-apex-red transition-all"
                />
                <button
                  type="submit"
                  className="btn-primary w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs sm:text-sm whitespace-nowrap shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)]"
                >
                  JOIN APEX
                </button>
              </motion.form>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
