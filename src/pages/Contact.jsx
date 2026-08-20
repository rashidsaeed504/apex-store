import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, ChevronDown } from 'lucide-react';
import { useToast } from '../context/ToastContext';

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

const faqs = [
  { q: "What payment methods do you accept?", a: "Cash on Delivery (COD) across Pakistan, Bank Transfer, EasyPaisa, and JazzCash." },
  { q: "How long does delivery take?", a: "Express nationwide delivery within 3-5 business days." },
  { q: "What is your return policy?", a: "7-day inspection and return policy for unused, sealed items." },
  { q: "Do you offer warranty?", a: "Yes, official manufacturer warranty and APEX 7-day replacement warranty on all products." },
  { q: "How can I track my order?", a: "Track live status directly in Customer Dashboard > Orders or via WhatsApp support." }
];

const Contact = () => {
  const { success } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [openFaq, setOpenFaq] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    success('Message sent successfully! We will get back to you soon.');
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="pt-24 pb-16 min-h-screen bg-apex-black text-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-apex-dark py-16 border-b border-white/5">
        {/* Subtle Decorative Animated SVG Accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-15">
          <motion.svg
            animate={{ rotate: -360 }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            className="w-[450px] h-[450px] sm:w-[560px] sm:h-[560px] text-apex-red"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              strokeDasharray="5 7"
            />
          </motion.svg>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
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
              Get In Touch
            </motion.span>
            <motion.h1 
              variants={heroItem}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black mb-4 sm:mb-6 uppercase tracking-tight"
            >
              CONTACT <span className="text-apex-red">US</span>
            </motion.h1>
            <motion.p 
              variants={heroItem}
              className="text-sm sm:text-base md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
            >
              We'd love to hear from you. Reach out to our dedicated support and tech advisory team.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 max-w-6xl mx-auto items-start">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="bg-apex-charcoal/40 p-5 sm:p-8 rounded-3xl border border-white/5 shadow-2xl"
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-6 text-white uppercase tracking-tight">Send Us A Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Name</label>
                    <input 
                      type="text" required name="name" value={formData.name} onChange={handleChange}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-sm text-white focus:outline-none focus:border-apex-red transition-colors"
                      placeholder="Ahmed Khan"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Phone</label>
                    <input 
                      type="tel" name="phone" value={formData.phone} onChange={handleChange}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-sm text-white focus:outline-none focus:border-apex-red transition-colors"
                      placeholder="0300 1234567"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Email</label>
                  <input 
                    type="email" required name="email" value={formData.email} onChange={handleChange}
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-sm text-white focus:outline-none focus:border-apex-red transition-colors"
                    placeholder="ahmed@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Subject</label>
                  <select 
                    name="subject" value={formData.subject} onChange={handleChange} required
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-sm text-white focus:outline-none focus:border-apex-red transition-colors cursor-pointer"
                  >
                    <option value="" disabled>Select a subject</option>
                    <option value="support">Customer Support</option>
                    <option value="sales">Sales & Product Inquiry</option>
                    <option value="warranty">Warranty & Replacement Claim</option>
                    <option value="other">General Inquiry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Message</label>
                  <textarea 
                    required name="message" value={formData.message} onChange={handleChange} rows="4"
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-sm text-white focus:outline-none focus:border-apex-red transition-colors resize-none"
                    placeholder="How can our technical support team help you?"
                  ></textarea>
                </div>
                <motion.button 
                  type="submit"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="btn-primary w-full py-3.5 sm:py-4 rounded-xl flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-xs sm:text-sm shadow-[0_0_25px_rgba(220,38,38,0.3)] cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>SEND MESSAGE</span>
                </motion.button>
              </form>
            </motion.div>

            {/* Contact Info & FAQs */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-10 sm:space-y-12"
            >
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-6 text-white uppercase tracking-tight">Contact Information</h2>
                <div className="space-y-4">
                  {[
                    { icon: <Phone size={18} />, title: 'WhatsApp / Phone Support', desc: '+92 346 5539086' },
                    { icon: <Mail size={18} />, title: 'Official Email', desc: 'apexstore530@gmail.com' },
                    { icon: <MapPin size={18} />, title: 'Headquarters', desc: 'Lahore, Pakistan' },
                    { icon: <Clock size={18} />, title: 'Support Hours', desc: 'Mon - Sat: 10:00 AM - 8:00 PM' },
                  ].map((info, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, delay: (idx % 6) * 0.07, ease: [0.22, 1, 0.36, 1] }}
                      className="flex items-start gap-4 p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-colors"
                    >
                      <div className="bg-apex-red/10 p-2.5 rounded-xl text-apex-red border border-apex-red/20 shrink-0">
                        {info.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm sm:text-base text-white">{info.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-400 mt-0.5">{info.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t border-white/10">
                <h2 className="text-xl sm:text-2xl font-bold mb-6 text-white uppercase tracking-tight">Frequently Asked Questions</h2>
                <div className="space-y-3">
                  {faqs.map((faq, idx) => (
                    <div key={idx} className="bg-apex-charcoal/40 border border-white/5 rounded-xl overflow-hidden">
                      <button 
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        className="w-full px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between font-semibold text-xs sm:text-sm text-left hover:text-apex-red transition-colors cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 shrink-0 ml-2 ${openFaq === idx ? 'rotate-180 text-apex-red' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {openFaq === idx && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            className="px-4 sm:px-6 pb-4 text-gray-400 text-xs sm:text-sm leading-relaxed border-t border-white/5 pt-2"
                          >
                            {faq.a}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
