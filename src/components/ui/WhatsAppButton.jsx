import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WhatsAppIcon } from './SocialIcons';
import { WHATSAPP_NUMBER } from '../../utils/helpers';

export default function WhatsAppButton({ 
  phoneNumber = WHATSAPP_NUMBER, 
  defaultMessage = 'Hello APEX Store, I would like to inquire about your products.' 
}) {
  const [isHovered, setIsHovered] = useState(false);

  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center">
      {/* Floating Tooltip Label (Desktop hover) */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="hidden sm:block mr-3 bg-[#0a0a0a]/95 text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/10 shadow-2xl backdrop-blur-md whitespace-nowrap"
          >
            Chat with us on <span className="text-[#25D366] font-bold">WhatsApp</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button without glow animation */}
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
      >
        {/* WhatsApp Icon */}
        <WhatsAppIcon className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-current" />
      </motion.a>
    </div>
  );
}
