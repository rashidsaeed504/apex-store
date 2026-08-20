import gsap from 'gsap';
import { EASING, DURATION } from '../easing';
import { isReducedMotion } from '../index';

/**
 * triggerCartBadgePop: Animates the navbar cart icon & count badge
 */
export function triggerCartBadgePop() {
  if (typeof document === 'undefined' || isReducedMotion()) return;

  const cartIcon = document.querySelector('[data-cart-icon]');
  const cartBadge = document.querySelector('[data-cart-badge]');

  if (cartIcon) {
    gsap.fromTo(
      cartIcon,
      { scale: 0.85, rotate: -12 },
      { scale: 1, rotate: 0, duration: DURATION.FAST, ease: 'back.out(2.5)', overwrite: 'auto' }
    );
  }

  if (cartBadge) {
    gsap.fromTo(
      cartBadge,
      { scale: 1.6, backgroundColor: '#ff4d4d', boxShadow: '0 0 15px rgba(220,38,38,0.9)' },
      { scale: 1, backgroundColor: '#dc2626', boxShadow: '0 0 0px rgba(220,38,38,0)', duration: DURATION.STANDARD, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' }
    );
  }
}

/**
 * triggerButtonSuccess: Visual ripple / sheen effect on action button
 */
export function triggerButtonFeedback(element) {
  if (!element || isReducedMotion()) return;

  gsap.timeline()
    .to(element, { scale: 0.96, duration: 0.08, ease: 'power2.in' })
    .to(element, { scale: 1.02, duration: 0.15, ease: 'back.out(2)' })
    .to(element, { scale: 1, duration: 0.15, ease: 'power2.out' });
}
