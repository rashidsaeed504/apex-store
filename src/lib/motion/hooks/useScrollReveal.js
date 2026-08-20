import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { EASING, DURATION, STAGGER } from '../easing';
import { isReducedMotion } from '../index';

/**
 * useScrollReveal: Reusable GSAP ScrollTrigger hook for sections and grids
 *
 * @param {Object} options
 * @param {string} options.target - selector within container (default: '[data-reveal]')
 * @param {number} options.yOffset - initial y offset in px (default: 32)
 * @param {number} options.duration - animation duration in seconds (default: DURATION.STANDARD)
 * @param {number} options.stagger - stagger between elements (default: STAGGER.STANDARD)
 * @param {string} options.triggerStart - scrolltrigger start position (default: 'top 88%')
 * @param {boolean} options.once - whether trigger only runs once (default: true)
 */
export function useScrollReveal({
  target = '[data-reveal]',
  yOffset = 32,
  duration = DURATION.STANDARD,
  stagger = STAGGER.STANDARD,
  triggerStart = 'top 88%',
  once = true,
  scaleFrom = 0.98,
} = {}) {
  const containerRef = useRef(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      if (isReducedMotion()) {
        gsap.set(containerRef.current.querySelectorAll(target), { opacity: 1, y: 0, scale: 1 });
        return;
      }

      const elements = containerRef.current.querySelectorAll(target);
      if (!elements || elements.length === 0) return;

      gsap.fromTo(
        elements,
        {
          opacity: 0,
          y: yOffset,
          scale: scaleFrom,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration,
          stagger,
          ease: EASING.POWER3_OUT,
          scrollTrigger: {
            trigger: containerRef.current,
            start: triggerStart,
            toggleActions: once ? 'play none none none' : 'play reverse play reverse',
            once,
          },
        }
      );
    },
    { scope: containerRef }
  );

  return containerRef;
}
