import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { fetchCategories } from "../../services/api";
import SectionHeader from "./SectionHeader";

const FeaturedCategories = () => {
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Desktop / Tablet Scroll State
  const desktopScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Mobile 2x2 Carousel State (MANUAL swipe only — no autoplay)
  const [currentMobilePage, setCurrentMobilePage] = useState(0);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const touchEndX = useRef(null);
  const touchEndY = useRef(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await fetchCategories();
        const activeOnly = (data || []).filter(
          (c) => c.is_active !== false && c.isActive !== false,
        );
        setCategoriesList(activeOnly);
      } catch (err) {
        console.warn("Failed to load categories:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Chunk categories into groups of 4 for Mobile 2-column x 2-row layout
  const mobilePages = useMemo(() => {
    const pages = [];
    for (let i = 0; i < categoriesList.length; i += 4) {
      pages.push(categoriesList.slice(i, i + 4));
    }
    return pages;
  }, [categoriesList]);

  // Desktop scroll checkers
  const checkDesktopScrollability = () => {
    const el = desktopScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  };

  useEffect(() => {
    if (!loading && categoriesList.length > 0) {
      const timer = setTimeout(checkDesktopScrollability, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, categoriesList]);

  useEffect(() => {
    const el = desktopScrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkDesktopScrollability, { passive: true });
    window.addEventListener("resize", checkDesktopScrollability);
    return () => {
      el.removeEventListener("scroll", checkDesktopScrollability);
      window.removeEventListener("resize", checkDesktopScrollability);
    };
  }, [loading]);

  const desktopScroll = (direction) => {
    const el = desktopScrollRef.current;
    if (!el) return;
    const cardWidth =
      el.querySelector(".category-carousel-card")?.offsetWidth || 280;
    const gap = 20;
    const amount =
      direction === "left" ? -(cardWidth + gap) * 2 : (cardWidth + gap) * 2;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  // Mobile Touch Handlers (manual swipe only)
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const deltaX = touchStartX.current - touchEndX.current;
      const deltaY =
        touchStartY.current !== null && touchEndY.current !== null
          ? Math.abs(touchStartY.current - touchEndY.current)
          : 0;

      // Only trigger if horizontal movement is dominant
      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > deltaY) {
        if (deltaX > 0) {
          // Swiped Left -> Next page
          setCurrentMobilePage((prev) => (prev + 1) % mobilePages.length);
        } else {
          // Swiped Right -> Prev page
          setCurrentMobilePage(
            (prev) => (prev - 1 + mobilePages.length) % mobilePages.length,
          );
        }
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  return (
    <section className="py-10 sm:py-16 md:py-20 bg-[#050505] relative z-10 border-t border-white/5">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="TOP"
          highlight="CATEGORIES"
          linkText="VIEW ALL CATEGORIES"
          linkTo="/categories"
        />

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-[180px] sm:h-[235px] bg-[#0a0a0a] border border-white/5 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            {/* ========================================================= */}
            {/* MOBILE VIEW: 2-Column Responsive Cards with Swipe Carousel */}
            {/* ========================================================= */}
            <div
              className="block sm:hidden relative"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="overflow-hidden">
                <div
                  className="flex items-start"
                  style={{
                    transform: `translate3d(-${currentMobilePage * 100}%, 0, 0)`,
                    transition: 'transform 400ms cubic-bezier(0.25, 1, 0.5, 1)',
                  }}
                >
                  {mobilePages.map((page, pageIndex) => (
                    <div
                      key={pageIndex}
                      className="w-full flex-shrink-0 grid grid-cols-2 gap-3 items-start content-start"
                    >
                      {page.map((category, catIndex) => {
                        const slug =
                          category.slug ||
                          category.name
                            ?.toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-");
                        const catImage =
                          category.image ||
                          category.image_url ||
                          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop";
                        const subtitle =
                          category.short_description ||
                          category.shortDescription ||
                          category.description ||
                          "Explore collection";

                        return (
                          <Link
                            key={category.id || slug || catIndex}
                            to={`/category/${slug}`}
                            className="group relative h-[180px] w-full rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/10 active:border-apex-red/60 active:scale-[0.98] transition-all duration-200 block shadow-lg"
                          >
                            {/* Full Card Background Image */}
                            <img
                              src={catImage}
                              alt={category.name}
                              loading="lazy"
                              width={400}
                              height={300}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop";
                              }}
                            />

                            {/* Top Right Mini Red Arrow Indicator */}
                            <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 group-hover:text-apex-red group-hover:border-apex-red/50 transition-colors">
                              <ArrowUpRight className="w-3 h-3" />
                            </div>

                            {/* Category Name & Subtitle at Left-Bottom */}
                            <div className="absolute bottom-0 left-0 right-0 p-3.5 pb-4 flex flex-col justify-end z-10 text-left">
                              <h3 className="text-xs font-black uppercase tracking-wider text-white group-hover:text-apex-red transition-colors leading-tight line-clamp-1">
                                {category.name}
                              </h3>
                              <p className="text-[10px] text-gray-300 font-medium leading-tight line-clamp-1 mt-1 opacity-90">
                                {subtitle}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Pagination Indicator Dots */}
              {mobilePages.length > 1 && (
                <div className="flex justify-center items-center gap-1.5 mt-4">
                  {mobilePages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentMobilePage(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        i === currentMobilePage
                          ? "w-5 bg-apex-red shadow-[0_0_8px_rgba(220,38,38,0.7)]"
                          : "w-1.5 bg-white/20 hover:bg-white/40"
                      }`}
                      aria-label={`Go to category page ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* DESKTOP & TABLET: Premium Horizontal Row with Controls */}
            {/* ========================================================= */}
            <div className="hidden sm:block relative group/carousel">
              {/* Left Arrow */}
              {canScrollLeft && (
                <button
                  onClick={() => desktopScroll("left")}
                  className="flex absolute -left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full bg-[#0a0a0a]/90 border border-white/15 text-white hover:bg-apex-red hover:border-apex-red transition-all duration-200 shadow-[0_4px_25px_rgba(0,0,0,0.8)] backdrop-blur-md cursor-pointer"
                  aria-label="Scroll categories left"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Right Arrow */}
              {canScrollRight && (
                <button
                  onClick={() => desktopScroll("right")}
                  className="flex absolute -right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full bg-[#0a0a0a]/90 border border-white/15 text-white hover:bg-apex-red hover:border-apex-red transition-all duration-200 shadow-[0_4px_25px_rgba(0,0,0,0.8)] backdrop-blur-md cursor-pointer"
                  aria-label="Scroll categories right"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {/* Horizontal Scrollable Container */}
              <div
                ref={desktopScrollRef}
                className="flex gap-4 sm:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar py-2"
                style={{
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {categoriesList.map((category, index) => {
                  const slug =
                    category.slug ||
                    category.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                  const catImage =
                    category.image ||
                    category.image_url ||
                    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop";
                  const subtitle =
                    category.short_description ||
                    category.shortDescription ||
                    category.description ||
                    "Explore collection";

                  return (
                    <div
                      key={category.id || slug || index}
                      className="category-carousel-card flex-shrink-0 snap-start"
                    >
                      <Link
                        to={`/category/${slug}`}
                        className="group relative h-[230px] sm:h-[235px] md:h-[240px] w-full rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/10 hover:border-apex-red/60 hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] hover:-translate-y-1 transition-all duration-300 block cursor-pointer"
                      >
                        {/* Background Category Image */}
                        <img
                          src={catImage}
                          alt={category.name}
                          loading="lazy"
                          width={400}
                          height={300}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out opacity-90 group-hover:opacity-100"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop";
                          }}
                        />

                        {/* Top-Right Floating Explore Badge */}
                        <div className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-105 group-hover:bg-apex-red group-hover:border-apex-red text-white transition-all duration-300 z-10 shadow-lg">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>

                        {/* Category Name & Subtitle at Left-Bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 pb-5 sm:pb-6 flex flex-col justify-end z-10 transform group-hover:-translate-y-0.5 transition-transform duration-300 text-left">
                          <h3 className="text-sm sm:text-base md:text-lg font-black uppercase tracking-wider text-white group-hover:text-apex-red transition-colors leading-tight line-clamp-1">
                            {category.name}
                          </h3>
                          <p className="text-[11px] sm:text-xs text-gray-300/90 font-medium mt-1.5 line-clamp-1 leading-snug">
                            {subtitle}
                          </p>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hide scrollbar & define responsive desktop card widths */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @media (min-width: 640px) {
          .category-carousel-card {
            width: calc((100% - 1.25rem) / 2) !important;
          }
        }
        @media (min-width: 768px) {
          .category-carousel-card {
            width: calc((100% - 2.5rem) / 3) !important;
          }
        }
        @media (min-width: 1024px) {
          .category-carousel-card {
            width: calc((100% - 3.75rem) / 4) !important;
          }
        }
      `}</style>
    </section>
  );
};

export default FeaturedCategories;
