import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ProductGallery({ images = [], productName = 'Product' }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  if (!images || images.length === 0) return null;

  const currentImage = images[activeIndex] || images[0];

  const handleMouseMove = (e) => {
    // Only zoom on desktop devices with hover support
    if (typeof window !== 'undefined' && !window.matchMedia('(hover: hover)').matches) {
      return;
    }
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
    setMousePos({ x, y });
  };

  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
      setIsZoomed(true);
    }
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
    setMousePos({ x: 50, y: 50 });
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flex flex-col gap-3 sm:gap-4 w-full min-w-0 max-w-full overflow-hidden">
      {/* Main Image Viewport */}
      <div 
        className="relative w-full aspect-square max-h-[360px] sm:max-h-[440px] md:max-h-[500px] bg-[#0c0c0c] rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center group select-none"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full flex items-center justify-center p-4 sm:p-8"
          >
            {isZoomed ? (
              <div 
                className="w-full h-full cursor-zoom-in"
                style={{
                  backgroundImage: `url(${currentImage})`,
                  backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
                  backgroundSize: '220%',
                  backgroundRepeat: 'no-repeat',
                }}
              />
            ) : (
              <img 
                src={currentImage} 
                alt={`${productName} view ${activeIndex + 1}`}
                className="w-full h-full object-contain max-h-full drop-shadow-[0_15px_35px_rgba(0,0,0,0.6)]"
                loading="eager"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Prev / Next Arrows for Multi-image Products */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Previous product image"
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-apex-red text-white backdrop-blur-md border border-white/10 flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-105 active:scale-95 z-10 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next product image"
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-apex-red text-white backdrop-blur-md border border-white/10 flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-105 active:scale-95 z-10 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Image Counter Badge */}
            <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] sm:text-xs font-mono font-bold text-gray-300 pointer-events-none z-10">
              {activeIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-thin w-full min-w-0 max-w-full">
          {images.map((img, idx) => {
            const isActive = activeIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`View image ${idx + 1}`}
                className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#0c0c0c] border-2 transition-all cursor-pointer p-1.5 ${
                  isActive 
                    ? 'border-apex-red shadow-[0_0_15px_rgba(220,38,38,0.35)] scale-100' 
                    : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/20'
                }`}
              >
                <img 
                  src={img} 
                  alt={`${productName} thumbnail ${idx + 1}`}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
