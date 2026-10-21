import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchBanners, getInitialHeroSlides } from "../../services/api";

const FALLBACK_BANNERS = [
  {
    id: "banner-apex-campaign",
    title: "TECH FOR EVERY MOMENT",
    image_url: "/banners/apex-campaign-banner.png",
    desktop_image_url: "/banners/apex-campaign-banner.png",
    mobile_image_url: "/banners/apex-campaign-mobile.png",
    button_url: "/shop",
    primary_button_link: "/shop",
    is_active: true,
  },
  {
    id: "banner-thunder-pro",
    title: "THUNDER PRO - Pakistan's Loudest Speaker Box",
    image_url: "/banners/thunder-pro-banner.png",
    desktop_image_url: "/banners/thunder-pro-banner.png",
    mobile_image_url: "/banners/thunder-pro-banner.png",
    button_url: "/shop",
    primary_button_link: "/shop",
    is_active: true,
  },
];

export default function PromotionalBanner() {
  const [banners, setBanners] = useState(() => {
    const initial = getInitialHeroSlides();
    return Array.isArray(initial) && initial.length > 0 ? initial : FALLBACK_BANNERS;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const navigate = useNavigate();

  // Gesture & interaction tracking refs
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef(null);
  const mouseStartX = useRef(0);
  const isMouseDown = useRef(false);
  const hasDragged = useRef(false);

  // Load banners and subscribe to real-time updates from Admin / Supabase
  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await fetchBanners(true);
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setBanners(data);
        }
      } catch (err) {
        console.warn("Failed to load promotional banners:", err);
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

  const totalBanners = banners.length;

  const handleNext = useCallback(() => {
    if (totalBanners <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalBanners);
  }, [totalBanners]);

  const handlePrev = useCallback(() => {
    if (totalBanners <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + totalBanners) % totalBanners);
  }, [totalBanners]);

  const handleDotClick = (idx, e) => {
    if (e) e.stopPropagation();
    setCurrentIndex(idx);
  };

  // ── Auto-advance timer (5.5s), pauses on hover, touch, drag, or tab switch ──
  useEffect(() => {
    if (totalBanners <= 1 || isPaused || isDragging) return;

    const timer = setTimeout(() => {
      handleNext();
    }, 5500);

    return () => clearTimeout(timer);
  }, [totalBanners, isPaused, isDragging, currentIndex, handleNext]);

  // Handle Tab Visibility (pauses when user switches browser tab)
  useEffect(() => {
    const handleVisibility = () => {
      setIsPaused(document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // ── Touch Gesture Handlers (Mobile / Tablets) ──
  // Checks gesture angle so horizontal swipe slides smoothly without hijacking vertical scroll
  const handleTouchStart = (e) => {
    if (totalBanners <= 1) return;
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setDragOffset(0);
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === 0 || totalBanners <= 1) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;

    // Detect gesture angle on initial 8px threshold
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
      if (dragOffset < -40) {
        handleNext();
      } else if (dragOffset > 40) {
        handlePrev();
      }
    }
    touchStartX.current = 0;
    touchStartY.current = 0;
    isHorizontalSwipe.current = null;
    setIsDragging(false);
    setDragOffset(0);
  };

  // ── Mouse Drag & Click Handlers (Desktop) ──
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only main left mouse button
    mouseStartX.current = e.clientX;
    isMouseDown.current = true;
    hasDragged.current = false;
    setIsPaused(true);
    setDragOffset(0);
  };

  const handleMouseMove = (e) => {
    if (!isMouseDown.current || totalBanners <= 1) return;
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
      if (dragOffset < -45) {
        handleNext();
      } else if (dragOffset > 45) {
        handlePrev();
      }
    } else {
      // Clean click (no dragging) -> Navigate to banner destination
      if (!e.target.closest("[data-slider-control]")) {
        const currentBanner = banners[currentIndex];
        handleBannerClick(currentBanner);
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
  const handleBannerClick = (banner) => {
    if (!banner) return;
    const targetUrl =
      banner.button_url ||
      banner.primary_button_link ||
      banner.url ||
      "/shop";

    if (targetUrl.startsWith("http") || banner.open_in_new_tab) {
      window.open(targetUrl, banner.open_in_new_tab ? "_blank" : "_self", "noopener,noreferrer");
    } else {
      navigate(targetUrl);
    }
  };

  if (totalBanners === 0) {
    return null;
  }

  return (
    <section
      className="py-2.5 sm:py-3.5 md:py-4.5 bg-[#050505] relative z-10 select-none"
      aria-label="Promotional Campaign Banner"
    >
      <div className="container max-w-7xl mx-auto px-3.5 sm:px-4 md:px-6 lg:px-8">
        {/* ── Compact Horizontal Banner Window (4:1 to 5:1 ratio, 8-12px subtle border radius) ── */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full aspect-[4.2/1] sm:aspect-[4.4/1] md:aspect-[4.5/1] rounded-[10px] sm:rounded-xl border border-white/10 hover:border-white/20 bg-[#070709] overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.6)] group transition-all duration-300 cursor-pointer"
          style={{ touchAction: "pan-y" }}
          role="region"
          aria-label="Promotional campaign banner"
        >
          {/* Subtle Corner Vignette & Ambient Rim Glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none z-10" />

          {/* ── Slide Track ── */}
          <div className="relative w-full h-full">
            {banners.map((banner, index) => {
              let offset = index - currentIndex;
              const half = totalBanners / 2;
              if (offset > half) offset -= totalBanners;
              if (offset < -half) offset += totalBanners;

              const isActive = offset === 0;
              const isNear = Math.abs(offset) <= 1;

              const desktopImage =
                banner.desktop_image_url ||
                banner.image_url ||
                "/banners/apex-campaign-banner.png";
              const mobileImage = banner.mobile_image_url || "";

              const percentOffset = offset * 100;
              const dragPx = isActive || isNear ? dragOffset : 0;

              return (
                <div
                  key={banner.id || index}
                  className="absolute inset-0 w-full h-full overflow-hidden"
                  style={{
                    transform: `translate3d(calc(${percentOffset}% + ${dragPx}px), 0, 0)`,
                    transition: isDragging
                      ? "none"
                      : "transform 550ms cubic-bezier(0.22, 1, 0.36, 1)",
                    visibility: isNear ? "visible" : "hidden",
                    opacity: isActive ? 1 : isNear ? 0.3 : 0,
                  }}
                  aria-hidden={!isActive}
                >
                  {/* Clean Responsive Picture Presentation (No Cropping of Logos/Artwork) */}
                  <picture className="w-full h-full block">
                    {mobileImage && (
                      <source media="(max-width: 640px)" srcSet={mobileImage} />
                    )}
                    <img
                      src={desktopImage}
                      alt={banner.title || "APEX Store Promotional Campaign"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      loading={index === 0 ? "eager" : "lazy"}
                      decoding={index === 0 ? "sync" : "async"}
                      draggable="false"
                      className="w-full h-full object-cover object-center select-none pointer-events-none transition-transform duration-700 ease-out group-hover:scale-[1.01]"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/banners/apex-campaign-banner.png";
                      }}
                    />
                  </picture>
                </div>
              );
            })}
          </div>

          {/* ── Desktop & Tablet Navigation Arrows (Hidden on Mobile) ── */}
          {totalBanners > 1 && (
            <>
              <button
                type="button"
                data-slider-control="true"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="hidden md:flex absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-apex-red text-white/80 hover:text-white border border-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md items-center justify-center cursor-pointer pointer-events-auto"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                data-slider-control="true"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="hidden md:flex absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-apex-red text-white/80 hover:text-white border border-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md items-center justify-center cursor-pointer pointer-events-auto"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* ── Subtle Pagination Indicators Below Banner (Ensures Artwork Is Never Obscured) ── */}
        {totalBanners > 1 && (
          <div
            data-slider-control="true"
            className="flex items-center justify-center gap-1.5 mt-2 pointer-events-auto"
          >
            {banners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => handleDotClick(idx, e)}
                className={`rounded-full transition-all duration-300 cursor-pointer focus:outline-none ${
                  idx === currentIndex
                    ? "w-4 sm:w-6 h-1 bg-apex-red shadow-[0_0_8px_rgba(220,38,38,0.7)]"
                    : "w-1.5 h-1 bg-white/20 hover:bg-white/40"
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
