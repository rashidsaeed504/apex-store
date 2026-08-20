import React, { useRef } from 'react';
import { ArrowRight, ShoppingBag, Heart, Menu, X, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import { DURATION, EASING } from '../easing';
import { isReducedMotion } from '../index';

export function AnimatedArrow({ className = 'w-4 h-4 text-white', size = 16 }) {
  const iconRef = useRef(null);

  const handleMouseEnter = () => {
    if (!iconRef.current || isReducedMotion()) return;
    gsap.to(iconRef.current, { x: 4, duration: DURATION.MICRO, ease: 'power2.out' });
  };

  const handleMouseLeave = () => {
    if (!iconRef.current || isReducedMotion()) return;
    gsap.to(iconRef.current, { x: 0, duration: DURATION.FAST, ease: EASING.EXPO_OUT });
  };

  return (
    <span
      className="inline-flex items-center justify-center transition-transform"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <ArrowRight ref={iconRef} size={size} className={className} />
    </span>
  );
}

export function AnimatedCartIcon({ className = 'w-5 h-5 text-white', size = 20, isPopping = false }) {
  const iconRef = useRef(null);

  return (
    <span data-cart-icon className="inline-flex items-center justify-center">
      <ShoppingBag ref={iconRef} size={size} className={className} />
    </span>
  );
}

export function AnimatedHeartIcon({ isWishlisted = false, className = 'w-4 h-4', size = 16, onClick }) {
  const heartRef = useRef(null);

  const handleClick = (e) => {
    if (heartRef.current && !isReducedMotion()) {
      gsap.fromTo(
        heartRef.current,
        { scale: 0.7 },
        { scale: 1.25, duration: DURATION.MICRO, yoyo: true, repeat: 1, ease: 'back.out(3)' }
      );
    }
    if (onClick) onClick(e);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="p-1 sm:p-2 rounded-full focus:outline-none transition-colors"
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        ref={heartRef}
        size={size}
        className={`${className} transition-colors ${
          isWishlisted ? 'fill-apex-red text-apex-red' : 'text-gray-300 hover:text-white'
        }`}
      />
    </button>
  );
}
