import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Observer } from 'gsap/Observer';
import { useGSAP } from '@gsap/react';

// Register GSAP Plugins safely once
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, Observer, useGSAP);
  
  // Set default animation parameters
  gsap.defaults({
    ease: 'power3.out',
    duration: 0.6,
  });
}

// Helper: Check for prefers-reduced-motion
export const isReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Helper: Check if device is touch-primary (disable pointer-only effects like magnetics)
export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export { gsap, ScrollTrigger, Observer, useGSAP };
export * from './easing';
export * from './hooks/useScrollReveal';
export * from './hooks/useMagnetic';
export * from './hooks/useParallax';
export * from './hooks/useCartMotion';
