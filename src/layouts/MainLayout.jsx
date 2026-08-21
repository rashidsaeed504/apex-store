import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '../lib/motion';
import PageTransition from '../lib/motion/components/PageTransition';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import CartDrawer from '../components/layout/CartDrawer';
import SearchOverlay from '../components/layout/SearchOverlay';
import WhatsAppButton from '../components/ui/WhatsAppButton';
import { useToast } from '../context/ToastContext';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useCart } from '../context/CartContext';

// ToastRenderer to display toasts from ToastContext positioned above the WhatsApp button
function ToastRenderer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-lg shadow-lg border text-sm font-medium w-80 backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : toast.type === 'error'
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function MainLayout() {
  const { isCartOpen, openCart, closeCart } = useCart();
  const location = useLocation();
  const navigationType = useNavigationType();
  const lenisRef = useRef(null);

  // Initialize Lenis Smooth Inertia Scrolling & GSAP ScrollTrigger Synchronization
  useEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      infinite: false,
    });

    lenisRef.current = lenis;

    // Sync Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    const updateTicker = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Global scroll-to-top on route change
  // PUSH / REPLACE navigation → always scroll to top
  // POP navigation (browser back/forward) → allow natural browser restoration
  useEffect(() => {
    if (navigationType === 'POP') {
      // Browser back/forward — let the browser handle scroll restoration naturally.
      // Still refresh ScrollTrigger so GSAP-animated elements recalculate positions.
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
      return;
    }

    // PUSH or REPLACE — new page navigation, scroll to top immediately.
    // 1. Force native scroll to top first (handles the real scrollbar)
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    // 2. Reset Lenis virtual scroll position so it doesn't fight the native scroll
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }

    // 3. Double-ensure after the frame paints (Lenis RAF loop can override between frames)
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      if (lenisRef.current) {
        lenisRef.current.scrollTo(0, { immediate: true });
      }
      ScrollTrigger.refresh();
    });
  }, [location.pathname, navigationType]);

  return (
    <div className="min-h-screen flex flex-col bg-apex-black text-white selection:bg-apex-red/30">
      <Navbar openCart={openCart} />
      
      <main className="flex-1 w-full min-w-0 overflow-x-hidden">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      
      <Footer />
      
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
      <SearchOverlay />
      <WhatsAppButton />
      <ToastRenderer />
    </div>
  );
}

