import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, ExternalLink, Zap } from 'lucide-react';
import { fetchBanners } from '../../services/api';

export default function PromotionalBanner() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(1); // 1 = right, -1 = left

  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchBanners(true);
        setBanners(data || []);
      } catch (err) {
        console.warn('Failed to load promotional banners:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Auto-rotation timer (4.5s)
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [banners.length, isPaused]);

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleDotClick = (idx) => {
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
  };

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 40;
    const isRightSwipe = distance < -40;

    if (isLeftSwipe && banners.length > 1) {
      handleNext();
    } else if (isRightSwipe && banners.length > 1) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (loading || banners.length === 0) {
    return null; // Gracefully hides if no banners exist
  }

  const currentBanner = banners[currentIndex] || banners[0];

  const variants = {
    enter: (dir) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.35 },
      },
    },
    exit: (dir) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.35 },
      },
    }),
  };

  return (
    <section className="py-6 sm:py-8 lg:py-10 bg-apex-black relative z-10 overflow-hidden">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner Card Container */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full h-[240px] sm:h-[300px] md:h-[360px] lg:h-[390px] rounded-2xl sm:rounded-3xl border border-white/10 bg-[#080808] overflow-hidden shadow-[0_15px_45px_rgba(0,0,0,0.85)] group select-none"
        >
          {/* Cyberpunk Ambient Red Glows */}
          {/* <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 h-72 bg-apex-red/20 blur-[90px] rounded-full pointer-events-none z-10" />
          <div className="absolute -bottom-10 right-10 w-60 h-60 bg-amber-500/15 blur-[80px] rounded-full pointer-events-none z-10" /> */}

          {/* Animated Carousel Slide */}
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentBanner.id || currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 w-full h-full flex items-center justify-between"
            >
              {/* Background Graphic Image */}
              {currentBanner.image_url && (
                <div className="absolute inset-0 w-full h-full">
                  <img
                    src={currentBanner.image_url}
                    alt={currentBanner.title || 'Promotional Banner'}
                    className="w-full h-full object-cover object-center opacity-60 group-hover:scale-105 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                  {/* Subtle Dark Vignette Gradients */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/40 sm:to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-black/40" />
                </div>
              )}

              {/* Decorative Tech Grid Lines & Sparks Accent */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.15),transparent_60%)] pointer-events-none" />

              {/* Banner Text & CTA Content */}
              <div className="relative z-20 w-full px-6 sm:px-10 md:px-16 lg:px-20 max-w-3xl flex flex-col justify-center h-full text-left">
                {/* Badge Tag */}
                {currentBanner.badge_text && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-2 sm:mb-3"
                  >
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest bg-apex-red text-white shadow-[0_0_15px_rgba(220,38,38,0.6)]">
                      <Sparkles size={11} /> {currentBanner.badge_text}
                    </span>
                  </motion.div>
                )}

                {/* Banner Main Title */}
                {currentBanner.title && (
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white leading-tight sm:leading-none mb-2 sm:mb-3 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
                  >
                    {currentBanner.title}
                  </motion.h2>
                )}

                {/* Subtitle / Description */}
                {currentBanner.subtitle && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xs sm:text-sm md:text-base text-gray-300 font-medium max-w-xl line-clamp-2 sm:line-clamp-3 mb-4 sm:mb-6 drop-shadow-md leading-relaxed"
                  >
                    {currentBanner.subtitle}
                  </motion.p>
                )}

                {/* CTA Action Button */}
                {currentBanner.button_text && currentBanner.button_url && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 }}
                  >
                    {currentBanner.button_url.startsWith('http') ? (
                      <a
                        href={currentBanner.button_url}
                        target={currentBanner.open_in_new_tab ? '_blank' : '_self'}
                        rel="noopener noreferrer"
                        className="btn-primary inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.7)] transition-all cursor-pointer w-fit"
                      >
                        {currentBanner.button_text}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <Link
                        to={currentBanner.button_url}
                        className="btn-primary inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.7)] transition-all cursor-pointer w-fit"
                      >
                        {currentBanner.button_text}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows (Desktop / Tablet only) */}
          {banners.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="hidden md:flex absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-apex-red text-white/80 hover:text-white border border-white/10 hover:border-apex-red backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg items-center justify-center"
                aria-label="Previous Banner"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleNext}
                className="hidden md:flex absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-apex-red text-white/80 hover:text-white border border-white/10 hover:border-apex-red backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg items-center justify-center"
                aria-label="Next Banner"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Bottom Dots Indicator */}
          {banners.length > 1 && (
            <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              {banners.map((b, idx) => (
                <button
                  key={b.id || idx}
                  onClick={() => handleDotClick(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentIndex
                      ? 'w-6 sm:w-8 bg-apex-red shadow-[0_0_8px_rgba(220,38,38,0.8)]'
                      : 'w-2 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
