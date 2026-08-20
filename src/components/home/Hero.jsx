import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Sparkles,
  Zap,
  Flame,
} from "lucide-react";
import { fetchHeroSlides, INITIAL_SEED_HERO_SLIDES } from "../../services/api";
import heroProductImg from "../../assets/download.png";

const AUTOPLAY_INTERVAL = 3000; // 3 seconds per slide

export default function Hero() {
  const [slides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  // Gesture & Timer refs
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const autoplayTimerRef = useRef(null);
  const resumeTimerRef = useRef(null);

  // Load hero slides from Supabase API (with resilient fallback)
  useEffect(() => {
    let isMounted = true;
    async function loadSlides() {
      try {
        const data = await fetchHeroSlides();
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            setSlides(data);
          } else {
            setSlides(INITIAL_SEED_HERO_SLIDES);
          }
        }
      } catch (err) {
        console.warn("Failed to load hero slides:", err);
        if (isMounted) setSlides(INITIAL_SEED_HERO_SLIDES);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSlides();
    return () => {
      isMounted = false;
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index) => {
    if (index === currentIndex) return;
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Autoplay Handler: 3000ms loop
  useEffect(() => {
    if (loading || totalSlides <= 1 || isPaused) return;

    autoplayTimerRef.current = setTimeout(() => {
      nextSlide();
    }, AUTOPLAY_INTERVAL);

    return () => {
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
    };
  }, [currentIndex, isPaused, loading, totalSlides, nextSlide]);

  // Touch Swipe Handlers (Mobile)
  const handleTouchStart = (e) => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchStartX.current - touchEndX;
    const deltaY = Math.abs(touchStartY.current - touchEndY);

    // Swipe left (next) or right (prev) if horizontal movement dominates (> 40px)
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > deltaY) {
      if (deltaX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;

    // Resume autoplay approximately 1 second after user releases touch
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 1000);
  };

  // Active slide data
  const currentSlide = slides[currentIndex] || INITIAL_SEED_HERO_SLIDES[0];

  // 700ms Smooth Horizontal Slide Animation Variants
  const slideVariants = {
    enter: (dir) => ({
      x: dir >= 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
        opacity: { duration: 0.5, ease: "easeInOut" },
        scale: { duration: 0.5, ease: "easeOut" },
      },
    },
    exit: (dir) => ({
      x: dir >= 0 ? "-100%" : "100%",
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
        opacity: { duration: 0.4, ease: "easeInOut" },
        scale: { duration: 0.4, ease: "easeIn" },
      },
    }),
  };

  // Features list normalization
  const featuresList = Array.isArray(currentSlide?.features)
    ? currentSlide.features
    : typeof currentSlide?.features === "string"
      ? JSON.parse(currentSlide.features || "[]")
      : [];

  const resolvedImage = currentSlide?.desktop_image_url || heroProductImg;

  // Icon mapping for feature badges
  const getFeatureIcon = (text) => {
    const lower = (text || "").toLowerCase();
    if (
      lower.includes("original") ||
      lower.includes("warranty") ||
      lower.includes("authentic")
    ) {
      return <ShieldCheck className="w-3.5 h-3.5 text-apex-red shrink-0" />;
    }
    if (lower.includes("delivery") || lower.includes("shipping")) {
      return <Truck className="w-3.5 h-3.5 text-apex-red shrink-0" />;
    }
    if (lower.includes("return") || lower.includes("refund")) {
      return <RotateCcw className="w-3.5 h-3.5 text-apex-red shrink-0" />;
    }
    if (
      lower.includes("support") ||
      lower.includes("24/7") ||
      lower.includes("help")
    ) {
      return <Headphones className="w-3.5 h-3.5 text-apex-red shrink-0" />;
    }
    if (
      lower.includes("battery") ||
      lower.includes("charge") ||
      lower.includes("anc")
    ) {
      return <Zap className="w-3.5 h-3.5 text-apex-red shrink-0" />;
    }
    return <Sparkles className="w-3.5 h-3.5 text-apex-red shrink-0" />;
  };

  return (
    <section
      className="relative min-h-[auto] sm:min-h-[85vh] lg:min-h-[92vh] flex items-center bg-[#050505] overflow-hidden pt-20 mt-12 sm:pt-28 pb-8 sm:pb-16 md:py-32 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ambient Background Gradient & Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-apex-red/20 via-[#0a0a0a] to-[#050505] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />

      {/* Floating Red Atmosphere Accents */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-apex-red/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-apex-red/15 blur-[150px] rounded-full pointer-events-none" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 md:px-8 relative z-10 w-full">
        {loading ? (
          <div className="w-full h-[450px] bg-[#0a0a0a] border border-white/5 rounded-3xl animate-pulse flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-apex-red border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="relative min-h-[auto] sm:min-h-[500px] md:min-h-[580px] lg:min-h-[620px] flex items-center">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentSlide?.id || currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-12"
              >
                {/* Left Content Column (Strict Left Alignment on Mobile) */}
                <div className="w-full lg:w-1/2 flex flex-col items-start text-left pt-2 lg:pt-0 z-10">
                  {/* 1. Eyebrow Badge & Promotional Tag */}
                  <div className="flex items-center gap-2 mb-3.5 sm:mb-5 flex-wrap justify-start">
                    {currentSlide?.badge && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-apex-red/10 border border-apex-red/30 backdrop-blur-md shadow-[0_0_12px_rgba(220,38,38,0.25)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-apex-red animate-pulse shrink-0" />
                        <span className="text-apex-red font-bold tracking-[0.12em] sm:tracking-[0.15em] text-[9px] sm:text-xs uppercase">
                          {currentSlide.badge}
                        </span>
                      </div>
                    )}

                    {currentSlide?.promotional_badge && (
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/10 border border-white/20 text-white font-black text-[9px] sm:text-[10px] uppercase tracking-wider shadow-sm">
                        <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-apex-red fill-apex-red shrink-0" />
                        {currentSlide.promotional_badge}
                      </div>
                    )}
                  </div>

                  {/* 2. Main Headline (Left Aligned, Balanced Clamp on Mobile) */}
                  <h1 className="text-[40px] sm:text-6xl md:text-7xl lg:text-[76px] xl:text-[84px] font-black uppercase tracking-tight leading-[0.94] sm:leading-[0.92] mb-3.5 sm:mb-6 text-white max-w-2xl text-left">
                    {currentSlide?.title}{" "}
                    {currentSlide?.highlight_text && (
                      <span className="text-gradient-red drop-shadow-[0_0_35px_rgba(220,38,38,0.4)] block sm:inline">
                        {currentSlide.highlight_text}
                      </span>
                    )}
                  </h1>

                  {/* 3. Description (Left Aligned, Max Width 320px on Mobile) */}
                  {currentSlide?.description && (
                    <p className="text-gray-400 text-[14px] sm:text-base md:text-lg max-w-[320px] sm:max-w-md lg:max-w-lg mb-5 sm:mb-8 font-normal leading-relaxed text-left">
                      {currentSlide.description}
                    </p>
                  )}

                  {/* 4. CTA Buttons (Compact, Left Aligned, Side-by-Side) */}
                  <div className="flex flex-row items-center justify-start gap-2.5 sm:gap-4 w-auto mb-6 sm:mb-8 lg:mb-10 flex-wrap">
                    {currentSlide?.primary_button_text && (
                      <Link
                        to={currentSlide.primary_button_link || "/shop"}
                        className="btn-primary group inline-flex items-center justify-center h-11 sm:h-12 px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-xl shadow-[0_0_18px_rgba(220,38,38,0.35)] hover:shadow-[0_0_35px_rgba(220,38,38,0.7)] hover:-translate-y-0.5 transition-all duration-300 text-xs sm:text-sm font-bold tracking-wider uppercase cursor-pointer shrink-0"
                      >
                        {currentSlide.primary_button_text}
                        <ArrowRight className="ml-1.5 sm:ml-2 w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    )}

                    {currentSlide?.secondary_button_text && (
                      <Link
                        to={currentSlide.secondary_button_link || "/deals"}
                        className="btn-secondary group inline-flex items-center justify-center h-11 sm:h-12 px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-xl border border-white/20 hover:border-white/60 hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-300 text-xs sm:text-sm font-bold tracking-wider uppercase cursor-pointer shrink-0"
                      >
                        {currentSlide.secondary_button_text}
                      </Link>
                    )}
                  </div>

                  {/* 5. Benefits / Trust Items (Clean 2x2 Grid on Mobile) */}
                  {featuresList.length > 0 && (
                    <div className="pt-4 sm:pt-5 border-t border-white/10 w-full">
                      {/* Mobile 2x2 Clean Grid */}
                      <div className="grid grid-cols-2 gap-2 sm:hidden w-full max-w-[340px]">
                        {featuresList.map((feat, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 p-2 px-2.5 rounded-xl bg-[#0f0f0f]/90 border border-white/10 text-[11px] text-gray-300 font-medium leading-none shadow-sm"
                          >
                            {getFeatureIcon(feat)}
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>

                      {/* Desktop / Tablet Row */}
                      <div className="hidden sm:flex flex-wrap items-center justify-start gap-4 sm:gap-5">
                        {featuresList.map((feat, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 text-xs text-gray-300 font-medium"
                          >
                            {getFeatureIcon(feat)}
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Product Visual Column */}
                <div className="w-full lg:w-1/2 relative flex items-center justify-center mt-4 sm:mt-6 lg:mt-0">
                  {/* Multi-layered Cinematic Rim-Light Glow */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 sm:w-80 sm:h-80 lg:w-[420px] lg:h-[420px] bg-apex-red/30 blur-[70px] sm:blur-[110px] lg:blur-[135px] rounded-full pointer-events-none" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-96 sm:h-96 lg:w-[520px] lg:h-[520px] bg-apex-red/10 blur-[90px] sm:blur-[140px] rounded-full pointer-events-none" />

                  {/* Product Showcase Container */}
                  <div className="relative z-10 w-full flex items-center justify-center h-[220px] sm:h-[320px] md:h-[400px] lg:h-[480px] xl:h-[520px]">
                    <picture className="max-h-full max-w-full flex items-center justify-center">
                      {currentSlide?.mobile_image_url && (
                        <source
                          media="(max-width: 640px)"
                          srcSet={currentSlide.mobile_image_url}
                        />
                      )}
                      <img
                        src={resolvedImage}
                        alt={currentSlide?.title || "APEX Store Feature"}
                        loading="eager"
                        className="max-h-[220px] sm:max-h-[320px] md:max-h-[400px] lg:max-h-[480px] xl:max-h-[520px] w-auto object-contain drop-shadow-[0_20px_45px_rgba(0,0,0,0.95)] filter select-none pointer-events-none animate-float"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = heroProductImg;
                        }}
                      />
                    </picture>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Slider Navigation Arrows (Desktop / Tablet) */}
            {totalSlides > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="hidden md:flex absolute -left-4 lg:-left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#0a0a0a]/80 hover:bg-apex-red border border-white/10 hover:border-apex-red text-gray-300 hover:text-white items-center justify-center backdrop-blur-md transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.8)] z-20 cursor-pointer"
                  aria-label="Previous Hero Slide"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={nextSlide}
                  className="hidden md:flex absolute -right-4 lg:-right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#0a0a0a]/80 hover:bg-apex-red border border-white/10 hover:border-apex-red text-gray-300 hover:text-white items-center justify-center backdrop-blur-md transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.8)] z-20 cursor-pointer"
                  aria-label="Next Hero Slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Bottom Slide Pagination Indicators */}
        {totalSlides > 1 && !loading && (
          <div className="flex items-center justify-center gap-2 mt-6 sm:mt-8 lg:mt-12 z-20 relative">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className="group p-1.5 cursor-pointer focus:outline-none"
                aria-label={`Go to slide ${index + 1}`}
              >
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "w-8 sm:w-10 bg-apex-red shadow-[0_0_12px_rgba(220,38,38,0.8)]"
                      : "w-2 sm:w-2.5 bg-white/20 group-hover:bg-white/40"
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
