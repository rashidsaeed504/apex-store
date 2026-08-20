import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { EASING, DURATION } from '../easing';
import { isReducedMotion, isTouchDevice } from '../index';

/**
 * useMagnetic: Subtle cursor-following magnetic pull for high-value CTA buttons
 *
 * @param {Object} options
 * @param {number} options.strength - magnetic pull multiplier (default: 0.28, approx 4-8px max offset)
 * @param {number} options.maxDistance - maximum cursor detection radius (default: 80)
 */
export function useMagnetic({ strength = 0.28, maxDistance = 80 } = {}) {
  const elementRef = useRef(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el || isTouchDevice() || isReducedMotion()) return;

    let bounds = el.getBoundingClientRect();

    const handleResize = () => {
      bounds = el.getBoundingClientRect();
    };

    const handleMouseMove = (e) => {
      bounds = el.getBoundingClientRect();
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const distance = Math.hypot(deltaX, deltaY);

      if (distance < maxDistance) {
        const pullX = deltaX * strength;
        const pullY = deltaY * strength;
        gsap.to(el, {
          x: pullX,
          y: pullY,
          duration: DURATION.MICRO + 0.1,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      } else {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: DURATION.FAST,
          ease: EASING.EXPO_OUT,
          overwrite: 'auto',
        });
      }
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: DURATION.FAST + 0.1,
        ease: 'elastic.out(1, 0.4)',
        overwrite: 'auto',
      });
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      gsap.killTweensOf(el);
    };
  }, [strength, maxDistance]);

  return elementRef;
}
