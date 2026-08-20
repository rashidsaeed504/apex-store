import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { fetchHeroSlides, invalidateBannersCache, INITIAL_SEED_HERO_SLIDES, INITIAL_SEED_HERO_BANNERS } from "../../services/api";
import heroProductImg from "../../assets/download.png";

const AUTOPLAY_INTERVAL = 3000; // 3 seconds per slide

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

export default function Hero() {
  const [slides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(null);
  const [direction, setDirection] = useState(1); // 1 = right to left (next), -1 = left to right (prev)
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  // Gesture & Timer refs
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const autoplayTimerRef = useRef(null);
  const resumeTimerRef = useRef(null);
  const animTimeoutRef = useRef(null);

  // Load hero slides from Supabase (with real-time sync)
  useEffect(() => {
    let isMounted = true;

    async function loadSlides() {
      try {
        const data = await fetchHeroSlides();
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            setSlides(data);
          } else {
            setSlides(INITIAL_SEED_HERO_SLIDES || INITIAL_SEED_HERO_BANNERS);
          }
        }
      } catch (err) {
        console.warn("Failed to load hero slides:", err);
        if (isMounted) setSlides(INITIAL_SEED_HERO_SLIDES || INITIAL_SEED_HERO_BANNERS);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSlides();

    // Listen for live banner updates from admin panel across components & tabs
    const handleBannersUpdated = () => {
      invalidateBannersCache();
      loadSlides();
    };

    window.addEventListener("apex_banners_updated", handleBannersUpdated);
    window.addEventListener("storage", handleBannersUpdated);

    // Supabase Realtime channel subscription
    let channel = null;
    if (isSupabaseConfigured) {
      try {
        channel = supabase
          .channel("public:banners_hero_sync")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "banners" },
            () => { invalidateBannersCache(); loadSlides(); }
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "hero_slides" },
            () => { invalidateBannersCache(); loadSlides(); }
          )
          .subscribe();
      } catch (e) {
        console.warn("Realtime hero slides subscription warning:", e);
      }
    }

    return () => {
      isMounted = false;
      window.removeEventListener("apex_banners_updated", handleBannersUpdated);
      window.removeEventListener("storage", handleBannersUpdated);
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    };
  }, []);

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    if (totalSlides <= 1 || isAnimating) return;
    setDirection(1);
    setPrevIndex(currentIndex);
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
    setIsAnimating(true);

    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    animTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
      setPrevIndex(null);
    }, 550);
  }, [totalSlides, currentIndex, isAnimating]);

  const prevSlide = useCallback(() => {
    if (totalSlides <= 1 || isAnimating) return;
    setDirection(-1);
    setPrevIndex(currentIndex);
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    setIsAnimating(true);

    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    animTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
      setPrevIndex(null);
    }, 550);
  }, [totalSlides, currentIndex, isAnimating]);

  const goToSlide = (targetIndex) => {
    if (targetIndex === currentIndex || isAnimating || totalSlides <= 1) return;
    setDirection(targetIndex > currentIndex ? 1 : -1);
    setPrevIndex(currentIndex);
    setCurrentIndex(targetIndex);
    setIsAnimating(true);

    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    animTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
      setPrevIndex(null);
    }, 550);
  };

  // Autoplay: single setTimeout, re-set on every index change
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

  // Pre-parse features for all slides once (memoized)
  const parsedSlides = useMemo(() => {
    return slides.map((slide) => {
      let features = [];
      if (Array.isArray(slide?.features)) {
        features = slide.features;
      } else if (typeof slide?.features === "string") {
        try { features = JSON.parse(slide.features || "[]"); } catch { features = []; }
      }
      return { ...slide, _parsedFeatures: features };
    });
  }, [slides]);

  return (
    <section
      className="hero-section group/hero relative min-h-[auto] sm:min-h-[85vh] lg:min-h-[92vh] flex items-center bg-[#050505] overflow-hidden pt-20 mt-12 sm:pt-28 pb-8 sm:pb-16 md:py-32 select-none"
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
          <div className="hero-slider group/slider relative w-full">
            {/* .slides-viewport: overflow-hidden strictly contains the sliding cards */}
            <div className="slides-viewport relative min-h-[580px] sm:min-h-[500px] md:min-h-[580px] lg:min-h-[620px] overflow-hidden w-full">
              {parsedSlides.map((slide, index) => {
                const isCurrent = index === currentIndex;
                const isPrev = index === prevIndex;
                if (!isCurrent && !isPrev) return null;

                let animationClass = "";
                if (isAnimating) {
                  if (isCurrent) {
                    animationClass = direction === 1 ? "hero-slide-in-right" : "hero-slide-in-left";
                  } else if (isPrev) {
                    animationClass = direction === 1 ? "hero-slide-out-left" : "hero-slide-out-right";
                  }
                }

                const slideImage = slide?.desktop_image_url || slide?.image_url || heroProductImg;
                const featuresList = slide._parsedFeatures;

                return (
                  <div
                    key={slide?.id || index}
                    className={`absolute inset-0 w-full flex items-center ${animationClass}`}
                    style={{
                      transform: isAnimating ? undefined : "translate3d(0, 0, 0)",
                      zIndex: isCurrent ? 10 : 5,
                    }}
                    aria-hidden={!isCurrent}
                  >
                    <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-12">
                      {/* Left Content Column */}
                      <div className="w-full lg:w-1/2 flex flex-col items-start text-left pt-2 lg:pt-0 z-10">
                        {/* 1. Eyebrow Badge & Promotional Tag */}
                        <div className="flex items-center gap-2 mb-3.5 sm:mb-5 flex-wrap justify-start">
                          {slide?.badge && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-apex-red/10 border border-apex-red/30 backdrop-blur-md shadow-[0_0_12px_rgba(220,38,38,0.25)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-apex-red animate-pulse shrink-0" />
                              <span className="text-apex-red font-bold tracking-[0.12em] sm:tracking-[0.15em] text-[9px] sm:text-xs uppercase">
                                {slide.badge}
                              </span>
                            </div>
                          )}

                          {slide?.promotional_badge && (
                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/10 border border-white/20 text-white font-black text-[9px] sm:text-[10px] uppercase tracking-wider shadow-sm">
                              <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-apex-red fill-apex-red shrink-0" />
                              {slide.promotional_badge}
                            </div>
                          )}
                        </div>

                        {/* 2. Main Headline */}
                        <h1 className="text-[40px] sm:text-6xl md:text-7xl lg:text-[76px] xl:text-[84px] font-black uppercase tracking-tight leading-[0.94] sm:leading-[0.92] mb-3.5 sm:mb-6 text-white max-w-2xl text-left">
                          {slide?.title}{" "}
                          {slide?.highlight_text && (
                            <span className="text-gradient-red drop-shadow-[0_0_35px_rgba(220,38,38,0.4)] block sm:inline">
                              {slide.highlight_text}
                            </span>
                          )}
                        </h1>

                        {/* 3. Description */}
                        {slide?.description && (
                          <p className="text-gray-400 text-[14px] sm:text-base md:text-lg max-w-[320px] sm:max-w-md lg:max-w-lg mb-5 sm:mb-8 font-normal leading-relaxed text-left">
                            {slide.description}
                          </p>
                        )}

                        {/* 4. CTA Buttons */}
                        <div className="flex flex-row items-center justify-start gap-2.5 sm:gap-4 w-auto mb-6 sm:mb-8 lg:mb-10 flex-wrap">
                          {slide?.primary_button_text && (
                            <Link
                              to={slide.primary_button_link || "/shop"}
                              className="btn-primary group inline-flex items-center justify-center h-11 sm:h-12 px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-xl shadow-[0_0_18px_rgba(220,38,38,0.35)] hover:shadow-[0_0_35px_rgba(220,38,38,0.7)] hover:-translate-y-0.5 transition-all duration-300 text-xs sm:text-sm font-bold tracking-wider uppercase cursor-pointer shrink-0"
                              tabIndex={isCurrent ? 0 : -1}
                            >
                              {slide.primary_button_text}
                              <ArrowRight className="ml-1.5 sm:ml-2 w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                          )}

                          {slide?.secondary_button_text && (
                            <Link
                              to={slide.secondary_button_link || "/deals"}
                              className="btn-secondary group inline-flex items-center justify-center h-11 sm:h-12 px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-xl border border-white/20 hover:border-white/60 hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-300 text-xs sm:text-sm font-bold tracking-wider uppercase cursor-pointer shrink-0"
                              tabIndex={isCurrent ? 0 : -1}
                            >
                              {slide.secondary_button_text}
                            </Link>
                          )}
                        </div>

                        {/* 5. Features / Trust Items */}
                        {featuresList.length > 0 && (
                          <div className="pt-4 sm:pt-5 border-t border-white/10 w-full">
                            {/* Mobile 2x2 Grid */}
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

                            {/* Desktop Row */}
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
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 sm:w-80 sm:h-80 lg:w-[420px] lg:h-[420px] bg-apex-red/30 blur-[70px] sm:blur-[110px] lg:blur-[135px] rounded-full pointer-events-none" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-96 sm:h-96 lg:w-[520px] lg:h-[520px] bg-apex-red/10 blur-[90px] sm:blur-[140px] rounded-full pointer-events-none" />

                        <div className="relative z-10 w-full flex items-center justify-center h-[220px] sm:h-[320px] md:h-[400px] lg:h-[480px] xl:h-[520px]">
                          <picture className="max-h-full max-w-full flex items-center justify-center">
                            {slide?.mobile_image_url && (
                              <source
                                media="(max-width: 640px)"
                                srcSet={slide.mobile_image_url}
                              />
                            )}
                            <img
                              src={slideImage}
                              alt={slide?.title || "APEX Store Feature"}
                              loading={index === 0 ? "eager" : "lazy"}
                              width={520}
                              height={520}
                              className="max-h-[220px] sm:max-h-[320px] md:max-h-[400px] lg:max-h-[480px] xl:max-h-[520px] w-auto object-contain drop-shadow-[0_20px_45px_rgba(0,0,0,0.95)] filter select-none pointer-events-none animate-float"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = heroProductImg;
                              }}
                            />
                          </picture>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* .hero-navigation: Overlay layer rendered OUTSIDE .slides-viewport so it is NEVER clipped */}
            {totalSlides > 1 && (
              <div className="hero-navigation hidden md:block absolute inset-0 pointer-events-none z-30">
                {/* Previous (Left) Arrow */}
                <button
                  type="button"
                  onClick={prevSlide}
                  className="previous-button hero-nav-arrow pointer-events-auto absolute left-3.5 lg:left-5 top-1/2 -translate-y-1/2 w-11 h-11 lg:w-12 lg:h-12 rounded-full bg-[#0a0a0a]/90 hover:bg-apex-red border border-white/15 hover:border-apex-red text-white flex items-center justify-center backdrop-blur-md transition-all duration-[220ms] shadow-[0_4px_25px_rgba(0,0,0,0.8)] hover:shadow-[0_0_25px_rgba(220,38,38,0.7)] cursor-pointer"
                  aria-label="Previous Hero Slide"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>

                {/* Next (Right) Arrow */}
                <button
                  type="button"
                  onClick={nextSlide}
                  className="next-button hero-nav-arrow pointer-events-auto absolute right-3.5 lg:right-5 top-1/2 -translate-y-1/2 w-11 h-11 lg:w-12 lg:h-12 rounded-full bg-[#0a0a0a]/90 hover:bg-apex-red border border-white/15 hover:border-apex-red text-white flex items-center justify-center backdrop-blur-md transition-all duration-[220ms] shadow-[0_4px_25px_rgba(0,0,0,0.8)] hover:shadow-[0_0_25px_rgba(220,38,38,0.7)] cursor-pointer"
                  aria-label="Next Hero Slide"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </div>
            )}

            {/* .pagination: Bottom Slide Pagination Indicators */}
            {totalSlides > 1 && (
              <div className="pagination flex items-center justify-center gap-2 mt-6 sm:mt-8 lg:mt-12 z-20 relative">
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
        )}
      </div>
    </section>
  );
}
