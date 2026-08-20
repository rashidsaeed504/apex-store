import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EASING, DURATION } from '../easing';
import { isReducedMotion, isTouchDevice } from '../index';

/**
 * useMouseParallax: Subtle pointer-tracking parallax for hero and flagship visual assets
 *
 * @param {Object} options
 * @param {number} options.depth - depth multiplier (default: 12px max shift)
 * @param {boolean} options.invert - whether movement is inverted relative to cursor
 */
export function useMouseParallax({ depth = 12, invert = false } = {}) {
  const targetRef = useRef(null);

  useEffect(() => {
    const el = targetRef.current;
    if (!el || isTouchDevice() || isReducedMotion()) return;

    const handleMouseMove = (e) => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const mouseXRatio = (e.clientX / windowWidth - 0.5) * 2; // -1 to 1
      const mouseYRatio = (e.clientY / windowHeight - 0.5) * 2; // -1 to 1

      const factor = invert ? -1 : 1;
      const targetX = mouseXRatio * depth * factor;
      const targetY = mouseYRatio * depth * factor;

      gsap.to(el, {
        x: targetX,
        y: targetY,
        duration: 0.8,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: EASING.EXPO_OUT,
        overwrite: 'auto',
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      gsap.killTweensOf(el);
    };
  }, [depth, invert]);

  return targetRef;
}

/**
 * useScrollParallax: Subtle vertical depth shift as user scrolls
 */
export function useScrollParallax({ distance = 40, triggerRef = null } = {}) {
  const elementRef = useRef(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el || isReducedMotion()) return;

    const trigger = triggerRef?.current || el;

    const st = ScrollTrigger.create({
      trigger,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
      animation: gsap.fromTo(el, { y: -distance / 2 }, { y: distance / 2, ease: 'none' }),
    });

    return () => {
      st.kill();
    };
  }, [distance, triggerRef]);

  return elementRef;
}
