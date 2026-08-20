import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, ChevronDown } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const faqs = [
  { q: "What payment methods do you accept?", a: "COD, EasyPaisa, JazzCash, Bank Transfer" },
  { q: "How long does delivery take?", a: "3-5 business days nationwide" },
  { q: "What is your return policy?", a: "7-day return for unused items" },
  { q: "Do you offer warranty?", a: "Yes, manufacturer warranty on all products" },
  { q: "How can I track my order?", a: "Track via WhatsApp or email" }
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
    <div className="pt-24 pb-16 min-h-screen">
      {/* Hero */}
      <section className="bg-apex-dark py-16 border-b border-white/5">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black mb-4 sm:mb-6"
          >
            CONTACT US
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base md:text-xl text-gray-400 max-w-2xl mx-auto"
          >
            We'd love to hear from you. Get in touch with our team.
          </motion.p>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 max-w-6xl mx-auto">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/[0.02] p-5 sm:p-8 rounded-2xl border border-white/5"
            >
              <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                    <input 
                      type="text" required name="name" value={formData.name} onChange={handleChange}
                      className="w-full bg-apex-charcoal border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-apex-red focus:ring-1 focus:ring-apex-red transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Phone</label>
                    <input 
                      type="tel" name="phone" value={formData.phone} onChange={handleChange}
                      className="w-full bg-apex-charcoal border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-apex-red focus:ring-1 focus:ring-apex-red transition-colors"
                      placeholder="+92 300 0000000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                  <input 
                    type="email" required name="email" value={formData.email} onChange={handleChange}
                    className="w-full bg-apex-charcoal border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-apex-red focus:ring-1 focus:ring-apex-red transition-colors"
                    placeholder="rashid@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Subject</label>
                  <select 
                    name="subject" value={formData.subject} onChange={handleChange} required
                    className="w-full bg-apex-charcoal border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-apex-red focus:ring-1 focus:ring-apex-red transition-colors appearance-none"
                  >
                    <option value="" disabled>Select a subject</option>
                    <option value="support">Customer Support</option>
                    <option value="sales">Sales Inquiry</option>
                    <option value="warranty">Warranty Claim</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Message</label>
                  <textarea 
                    required name="message" value={formData.message} onChange={handleChange} rows="5"
                    className="w-full bg-apex-charcoal border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-apex-red focus:ring-1 focus:ring-apex-red transition-colors resize-none"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-apex-red hover:bg-red-700 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Send className="w-5 h-5" />
                  SEND MESSAGE
                </button>
              </form>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-12"
            >
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">Contact Information</h2>
                <div className="space-y-6">
                  {[
                    { icon: <Phone />, title: 'WhatsApp / Phone', desc: '+92 3465539086' },
                    { icon: <Mail />, title: 'Email', desc: 'apexstore530@gmail.com' },
                    { icon: <MapPin />, title: 'Address', desc: 'Lahore, Pakistan' },
                    { icon: <Clock />, title: 'Working Hours', desc: 'Mon-Sat, 10am-8pm' },
                  ].map((info, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="bg-apex-red/10 p-2 sm:p-3 rounded-lg text-apex-red border border-apex-red/20">
                        {info.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-base sm:text-lg">{info.title}</h4>
                        <p className="text-sm sm:text-base text-gray-400">{info.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-10 border-t border-white/10">
                <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">FREQUENTLY ASKED QUESTIONS</h2>
                <div className="space-y-4">
                  {faqs.map((faq, idx) => (
                    <div key={idx} className="bg-apex-charcoal border border-white/10 rounded-lg overflow-hidden">
                      <button 
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between font-medium text-sm sm:text-base text-left hover:text-apex-red transition-colors"
                      >
                        {faq.q}
                        <ChevronDown className={`w-5 h-5 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {openFaq === idx && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-6 pb-4 text-gray-400"
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
