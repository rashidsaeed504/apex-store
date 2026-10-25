import React, { useState, useEffect } from 'react';
import { X, Truck, Zap } from 'lucide-react';

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('apex_announcement_dismissed');
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('apex_announcement_dismissed', 'true');
    setTimeout(() => {
      window.dispatchEvent(new Event('apex_announcement_toggled'));
    }, 50);
  };

  if (!isVisible) return null;

  return (
    <div 
      role="region" 
      aria-label="Store Announcement"
      className="w-full bg-[#0a0a0a] border-b border-apex-red/30 text-white relative z-50 text-center select-none"
    >
      <div className="container max-w-7xl mx-auto px-4 py-1.5 sm:py-2 flex items-center justify-between min-h-[36px]">
        {/* Spacer for symmetry on desktop */}
        <div className="hidden sm:block w-8" aria-hidden="true" />

        {/* Message Content */}
        <div className="flex-1 flex items-center justify-center gap-2 text-[11px] sm:text-xs font-bold tracking-wider uppercase text-gray-200">
          <Truck className="w-3.5 h-3.5 text-apex-red shrink-0" />
          <span className="truncate">
            <span className="text-white">Cash on Delivery</span>
            <span className="mx-1.5 text-apex-red/80">|</span>
            <span className="text-gray-300">Fast Delivery across Pakistan</span>
          </span>
          <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-apex-red bg-apex-red/10 border border-apex-red/30 px-1.5 py-0.2 rounded font-mono ml-2">
            <Zap className="w-2.5 h-2.5" /> 2-4 DAYS
          </span>
        </div>

        {/* Dismiss Button — 44px minimum tap target */}
        <button
          onClick={handleDismiss}
          className="w-8 h-8 -mr-1 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/10 focus:outline-none"
          aria-label="Dismiss announcement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
