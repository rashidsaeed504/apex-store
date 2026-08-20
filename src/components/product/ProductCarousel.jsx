import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';

// Mobile Native Scroll Container with Smooth Auto-Scroll, Press & Hold Pause, and Left/Right Touch Swiping
function MobileCarouselTrack({ products }) {
  const scrollContainerRef = useRef(null);
  const isInteractingRef = useRef(false);
  const resumeTimerRef = useRef(null);
  const animFrameRef = useRef(null);
  const accumulatedScrollRef = useRef(0);
  const lastTimestampRef = useRef(null);

  // Speed in pixels per second: ~24px/sec (~16-18s per full 2-card pass)
  const SCROLL_SPEED = 24;

  // Duplicate product list to create a seamless wrap-around loop
  let baseList = [...products];
  while (baseList.length < 8 && products.length > 0) {
    baseList = [...baseList, ...products];
  }
  const displayProducts = [...baseList, ...baseList];

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let isMounted = true;

    const step = (timestamp) => {
      if (!isMounted) return;

      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }
      const deltaSeconds = Math.min((timestamp - lastTimestampRef.current) / 1000, 0.1);
      lastTimestampRef.current = timestamp;

      if (!isInteractingRef.current && container) {
        const halfWidth = container.scrollWidth / 2;
        if (halfWidth > 0) {
          accumulatedScrollRef.current += SCROLL_SPEED * deltaSeconds;
          
          if (accumulatedScrollRef.current >= halfWidth) {
            accumulatedScrollRef.current -= halfWidth;
          } else if (accumulatedScrollRef.current < 0) {
            accumulatedScrollRef.current += halfWidth;
          }

          container.scrollLeft = accumulatedScrollRef.current;
        }
      }

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      lastTimestampRef.current = null;
    };
  }, [products]);

  // Keep accumulator in sync when user scrolls natively
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth } = scrollContainerRef.current;
      const halfWidth = scrollWidth / 2;
      
      if (halfWidth > 0) {
        if (scrollLeft >= halfWidth * 1.5) {
          scrollContainerRef.current.scrollLeft = scrollLeft - halfWidth;
        } else if (scrollLeft <= 5) {
          scrollContainerRef.current.scrollLeft = scrollLeft + halfWidth;
        }
      }

      accumulatedScrollRef.current = scrollContainerRef.current.scrollLeft;
    }
  };

  const handlePointerDown = () => {
    isInteractingRef.current = true;
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    if (scrollContainerRef.current) {
      accumulatedScrollRef.current = scrollContainerRef.current.scrollLeft;
    }
  };

  const handlePointerUp = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    // Smoothly resume auto-scroll after a short settling delay
    resumeTimerRef.current = setTimeout(() => {
      if (scrollContainerRef.current) {
        accumulatedScrollRef.current = scrollContainerRef.current.scrollLeft;
      }
      isInteractingRef.current = false;
      lastTimestampRef.current = null;
    }, 700);
  };

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
      onTouchCancel={handlePointerUp}
      className="flex items-center gap-3 py-2 overflow-x-auto select-none touch-pan-x hide-scrollbar w-full"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-x pan-y',
      }}
    >
      {displayProducts.map((product, idx) => (
        <div
          key={`mobile-${product?.id || idx}-${idx}`}
          className="shrink-0 w-[calc(50vw-18px)]"
        >
          <ProductCard product={product} disableMotion={true} />
        </div>
      ))}
    </div>
  );
}

export default function ProductCarousel({ products = [], title = '', highlightTitle = '', showViewAll = false, viewAllLink = '/shop' }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(Math.ceil(scrollLeft) < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [products]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth / 1.5 : clientWidth / 1.5;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!Array.isArray(products) || products.length === 0) return null;

  return (
    <div className="w-full relative">
      {/* Header Bar */}
      {(title || showViewAll) && (
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <h2 className="text-base sm:text-2xl md:text-3xl font-black text-white uppercase tracking-wider">
            {title} {highlightTitle && <span className="text-apex-red">{highlightTitle}</span>}
          </h2>

          {showViewAll && (
            <Link
              to={viewAllLink}
              className="text-xs sm:text-sm font-bold text-gray-400 hover:text-apex-red transition-colors uppercase tracking-wider flex items-center gap-1.5"
            >
              <span>VIEW ALL</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* MOBILE ONLY (md:hidden): Native Horizontal Scroll with Auto-Scroll + Touch Swipe + Pause on Hold */}
      <div className="block md:hidden w-full overflow-hidden relative">
        <MobileCarouselTrack products={products} />
      </div>

      {/* DESKTOP ONLY (hidden md:block): Carousel with Vertically Centered Left/Right Navigation Arrows Beside Cards */}
      <div className="hidden md:block relative group/carousel">
        {/* Previous (Left) Arrow Button */}
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className={`absolute -left-4 lg:-left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-md text-white hover:bg-apex-red hover:border-apex-red hover:scale-110 shadow-[0_4px_20px_rgba(0,0,0,0.8)] transition-all duration-300 flex items-center justify-center cursor-pointer ${
            !canScrollLeft ? 'opacity-0 pointer-events-none' : 'opacity-90 hover:opacity-100'
          }`}
          aria-label="Previous products"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Products Scrollable Row */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex overflow-x-auto gap-6 pb-4 hide-scrollbar touch-pan-x scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product, idx) => (
            <div
              key={`desktop-${product?.id || idx}`}
              className="shrink-0 sm:w-[280px] lg:w-[290px]"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Next (Right) Arrow Button */}
        <button
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className={`absolute -right-4 lg:-right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-md text-white hover:bg-apex-red hover:border-apex-red hover:scale-110 shadow-[0_4px_20px_rgba(0,0,0,0.8)] transition-all duration-300 flex items-center justify-center cursor-pointer ${
            !canScrollRight ? 'opacity-0 pointer-events-none' : 'opacity-90 hover:opacity-100'
          }`}
          aria-label="Next products"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
