import React, { useRef, useEffect } from "react";
import { InstagramIcon } from "../ui/SocialIcons";

function MobileInstagramTrack({ images }) {
  const scrollContainerRef = useRef(null);
  const isInteractingRef = useRef(false);
  const resumeTimerRef = useRef(null);
  const animFrameRef = useRef(null);
  const accumulatedScrollRef = useRef(0);
  const lastTimestampRef = useRef(null);

  const SCROLL_SPEED = 24;

  const displayImages = [...images, ...images, ...images];

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
  }, [images]);

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
      className="flex items-center gap-3 py-1 overflow-x-auto select-none touch-pan-x hide-scrollbar w-full"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-x pan-y',
      }}
    >
      {displayImages.map((img, index) => (
        <a
          key={`mobile-insta-${index}`}
          href="https://www.instagram.com/apexstor.pk/"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 w-32 sm:w-44 relative group rounded-xl overflow-hidden aspect-square border border-white/10 block bg-[#0a0a0a]"
        >
          <img
            src={img}
            alt={`Instagram post ${(index % images.length) + 1}`}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop";
            }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <InstagramIcon className="w-6 h-6 text-white" />
          </div>
        </a>
      ))}
    </div>
  );
}

const InstagramFeed = () => {
  const baseImages = [
    "https://i.pinimg.com/736x/4e/b7/89/4eb789b7c3517d3b6919af5f298b19d9.jpg",
    "https://i.pinimg.com/736x/87/3e/60/873e6066bb1b22f18075278e9111b505.jpg",
    "https://i.pinimg.com/736x/dc/d1/83/dcd18343dc89c7f845a52db0f38d90c5.jpg",
    "https://i.pinimg.com/736x/59/db/4f/59db4f2dd6a94b124931caa92eb9a72f.jpg",
    "https://i.pinimg.com/736x/f4/ff/52/f4ff5250e2a14179e4647e51a6f4320c.jpg",
    "https://i.pinimg.com/736x/a0/a1/82/a0a182afc8d3c2206866d3eb91bbb096.jpg",
  ];

  return (
    <section className="py-12 sm:py-16 bg-[#050505] relative z-10 border-t border-white/5 overflow-hidden">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-wider text-white">
            FOLLOW THE APEX
          </h2>
          <a
            href="https://www.instagram.com/apexstor.pk/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white flex items-center transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <InstagramIcon className="w-4 h-4 mr-1.5 text-apex-red" />
            @APEXSTOR.PK
          </a>
        </div>

        {/* MOBILE ONLY (md:hidden): Native Horizontal Scroll with Auto-Scroll + Touch Swipe + Pause on Hold */}
        <div className="block md:hidden w-full overflow-hidden relative">
          <MobileInstagramTrack images={baseImages} />
        </div>

        {/* DESKTOP ONLY (hidden md:grid): Static Grid */}
        <div className="hidden md:grid md:grid-cols-6 gap-4">
          {baseImages.map((img, index) => (
            <a
              key={`desktop-insta-${index}`}
              href="https://www.instagram.com/apexstor.pk/"
              target="_blank"
              rel="noopener noreferrer"
              className="relative group rounded-xl overflow-hidden aspect-square border border-white/10 block bg-[#0a0a0a]"
            >
              <img
                src={img}
                alt={`Instagram post ${index + 1}`}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop";
                }}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <InstagramIcon className="w-6 h-6 text-white" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InstagramFeed;
