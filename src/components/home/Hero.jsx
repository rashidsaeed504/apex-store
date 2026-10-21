import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchHeroSlides, getInitialHeroSlides } from "../../services/api";

export default function Hero() {
  const [slides, setSlides] = useState(() => {
    const initial = getInitialHeroSlides();
    return Array.isArray(initial) && initial.length > 0 ? initial : [];
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const navigate = useNavigate();

  // Gesture & Drag tracking refs
  const containerRef = useRef(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalSwipe = useRef(null);
  const mouseStartX = useRef(0);
  const isMouseDown = useRef(false);
  const hasDragged = useRef(false);

  // Sync slides with API & Admin updates
  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await fetchHeroSlides(true);
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setSlides(data);
        }
      } catch (err) {
        console.warn("Failed to load hero slides:", err);
      }
    }

    load();

    const handleUpdate = () => {
      load();
    };

    window.addEventListener("apex_banners_updated", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("apex_banners_updated", handleUpdate);
    };
  }, []);

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (idx) => {
    setCurrentIndex(idx);
  };

  // ── Automatic Sliding (5.5s) ──
  // Pauses on hover, touch, drag, and when tab is hidden
  useEffect(() => {
    if (totalSlides <= 1 || isPaused || isDragging) return;

    const timer = setTimeout(() => {
      nextSlide();
    }, 5500);

    return () => clearTimeout(timer);
  }, [totalSlides, isPaused, isDragging, currentIndex, nextSlide]);

  // Handle Tab Visibility Change (pauses background timer when user switches tabs)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // ── Touch Gesture Handlers (Mobile / Tablets) ──
  // Uses angle threshold so horizontal swipe changes slide, while vertical scrolling is NEVER blocked
  const handleTouchStart = (e) => {
    if (totalSlides <= 1) return;
    setIsPaused(true);
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setDragOffset(0);
  };

  const handleTouchMove = (e) => {
    if (startX.current === 0 || totalSlides <= 1) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startX.current;
    const diffY = currentY - startY.current;

    // Detect gesture angle on initial 8px movement
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(diffX) > 8 && Math.abs(diffX) > Math.abs(diffY)) {
        isHorizontalSwipe.current = true;
      } else if (Math.abs(diffY) > 8) {
        isHorizontalSwipe.current = false;
      }
    }

    if (isHorizontalSwipe.current === true) {
      if (e.cancelable) e.preventDefault();
      setIsDragging(true);
      setDragOffset(diffX);
    }
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (isHorizontalSwipe.current === true) {
      if (dragOffset < -45) {
        nextSlide();
      } else if (dragOffset > 45) {
        prevSlide();
      }
    }
    startX.current = 0;
    startY.current = 0;
    isHorizontalSwipe.current = null;
    setIsDragging(false);
    setDragOffset(0);
  };

  // ── Mouse Drag Handlers (Desktop Swiping) ──
  const handleMouseDown = (e) => {
    if (e.button !== 0 || totalSlides <= 1) return; // Only primary mouse button
    mouseStartX.current = e.clientX;
    isMouseDown.current = true;
    hasDragged.current = false;
    setIsPaused(true);
    setDragOffset(0);
  };

  const handleMouseMove = (e) => {
    if (!isMouseDown.current || totalSlides <= 1) return;
    const diffX = e.clientX - mouseStartX.current;
    if (Math.abs(diffX) > 6) {
      hasDragged.current = true;
      setIsDragging(true);
      setDragOffset(diffX);
    }
  };

  const handleMouseUp = (e) => {
    if (!isMouseDown.current) return;
    isMouseDown.current = false;
    setIsPaused(false);

    if (hasDragged.current) {
      if (dragOffset < -50) {
        nextSlide();
      } else if (dragOffset > 50) {
        prevSlide();
      }
    } else {
      // Clean click (no drag) → Trigger destination link (unless clicking controls)
      if (!e.target.closest('[data-pagination]')) {
        const currentSlide = slides[currentIndex];
        handleSlideClick(currentSlide);
      }
    }

    hasDragged.current = false;
    setIsDragging(false);
    setDragOffset(0);
  };

  const handleMouseLeave = () => {
    if (isMouseDown.current) {
      isMouseDown.current = false;
      setIsDragging(false);
      setDragOffset(0);
    }
    setIsPaused(false);
  };

  // Destination URL click handler
  const handleSlideClick = (slide) => {
    if (!slide) return;
    const targetUrl = slide.primary_button_link || slide.button_url || "/shop";
    if (targetUrl.startsWith("http")) {
      window.open(targetUrl, slide.open_in_new_tab ? "_blank" : "_self", "noopener,noreferrer");
    } else {
      navigate(targetUrl);
    }
  };

  if (totalSlides === 0) {
    return null;
  }

  return (
    <section className="relative w-full bg-[#050505] bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.12),transparent_70%)] overflow-hidden pt-20 sm:pt-24 lg:pt-26 pb-6 sm:pb-8">
      <div className="container max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8">
        {/* ── Main Banner Slider Window ── */}
        <div
          ref={containerRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full aspect-[4/5] sm:aspect-[3/4] md:aspect-[2.5/1] lg:aspect-[2.62/1] rounded-[20px] sm:rounded-[22px] lg:rounded-3xl border border-white/10 hover:border-white/20 bg-[#080808] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] group select-none transition-colors duration-500 cursor-grab active:cursor-grabbing"
          style={{ touchAction: "pan-y" }}
          aria-label="Promotional Hero Banner Slider"
          role="region"
        >
          {/* Subtle Corner Vignette & Ambient Radial Accent */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/15 pointer-events-none z-10" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.15),transparent_70%)] pointer-events-none z-10" />

          {/* ── Slides Carousel Track ── */}
          <div className="relative w-full h-full">
            {slides.map((slide, index) => {
              let offset = index - currentIndex;
              const half = totalSlides / 2;
              if (offset > half) offset -= totalSlides;
              if (offset < -half) offset += totalSlides;

              const isActive = offset === 0;
              const isNear = Math.abs(offset) <= 1;

              // Slide Image Resolution
              const desktopImage =
                slide.desktop_image_url ||
                slide.image_url ||
                "/banners/thunder-pro-banner.png";
              const mobileImage = slide.mobile_image_url || "";

              // Calculate real-time drag translation
              const percentOffset = offset * 100;
              const dragPx = isActive || isNear ? dragOffset : 0;

              return (
                <div
                  key={slide.id || index}
                  className="absolute inset-0 w-full h-full overflow-hidden"
                  style={{
                    transform: `translate3d(calc(${percentOffset}% + ${dragPx}px), 0, 0)`,
                    transition: isDragging
                      ? "none"
                      : "transform 650ms cubic-bezier(0.22, 1, 0.36, 1)",
                    visibility: isNear ? "visible" : "hidden",
                    opacity: isActive ? 1 : isNear ? 0.3 : 0,
                  }}
                  aria-hidden={!isActive}
                >
                  {/* Ambient Blurred Backdrop for wide banners when rendered on portrait mobile */}
                  {!mobileImage && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none md:hidden">
                      <img
                        src={desktopImage}
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover blur-2xl opacity-35 scale-125 saturate-150"
                      />
                      <div className="absolute inset-0 bg-black/40" />
                    </div>
                  )}

                  {/* Main Banner Visual */}
                  <picture className="relative z-10 w-full h-full flex items-center justify-center">
                    {mobileImage && (
                      <source media="(max-width: 640px)" srcSet={mobileImage} />
                    )}
                    <img
                      src={desktopImage}
                      alt={slide.title || "APEX Store Promotional Banner"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      loading={index === 0 ? "eager" : "lazy"}
                      decoding={index === 0 ? "sync" : "async"}
                      draggable="false"
                      className={`w-full h-full select-none pointer-events-none transition-transform duration-700 ease-out group-hover:scale-[1.012] ${
                        mobileImage
                          ? "object-cover object-center"
                          : "object-contain md:object-cover object-center"
                      }`}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/banners/thunder-pro-banner.png";
                      }}
                    />
                  </picture>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Small, Subtle Pagination Dots Beneath the Banner (APEX Red for Active Slide) ── */}
        {totalSlides > 1 && (
          <div
            data-pagination="true"
            className="flex items-center justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4 pointer-events-auto"
          >
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => goToSlide(idx)}
                className={`rounded-full transition-all duration-300 cursor-pointer focus:outline-none ${
                  idx === currentIndex
                    ? "w-5 sm:w-7 h-1.5 bg-apex-red shadow-[0_0_10px_rgba(220,38,38,0.8)]"
                    : "w-1.5 h-1.5 bg-white/20 hover:bg-white/50"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
