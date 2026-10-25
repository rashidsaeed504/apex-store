import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';

export default function ProductCarousel({ 
  products = [], 
  title = '', 
  highlightTitle = '', 
  showViewAll = false, 
  viewAllLink = '/shop',
  mobileLimit = 6
}) {
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
              className="hidden md:flex text-xs sm:text-sm font-bold text-gray-400 hover:text-apex-red transition-colors uppercase tracking-wider items-center gap-1.5"
            >
              <span>VIEW ALL</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* MOBILE ONLY (md:hidden): 2-Column Grid with 4 or 6 products + Full-Width "View All" Button */}
      <div className="block md:hidden w-full">
        <div className="grid grid-cols-2 gap-3">
          {products.slice(0, mobileLimit).map((product, idx) => (
            <div key={`mobile-${product?.id || idx}`} className="w-full">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {showViewAll && (
          <div className="mt-4 pt-1 flex justify-center">
            <Link
              to={viewAllLink}
              className="w-full min-h-[44px] text-center text-xs font-bold uppercase tracking-wider text-white transition-all items-center flex justify-center gap-2 group shadow-sm "

            >
             <div className="flex gap-2 relative">
               <span className="hover:after:w-full  after:content-[''] after:absolute after:w-0 after:h-[1px] after:bg-apex-red after:bottom-0 after:left-0 after:transition-all after:duration-300 after:translate-x" >VIEW ALL {title} {highlightTitle}</span>
              <ArrowRight className="w-3.5 h-3.5 text-apex-red group-hover:translate-x-1 transition-transform" />
             </div>
            </Link>
          </div>
        )}
      </div>

      {/* DESKTOP ONLY (hidden md:block): Carousel with Navigation Arrows */}
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
