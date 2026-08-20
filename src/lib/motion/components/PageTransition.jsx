import React, { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { EASING, DURATION } from '../easing';
import { isReducedMotion } from '../index';

export default function PageTransition({ children }) {
  const containerRef = useRef(null);
  const location = useLocation();

  useGSAP(
    () => {
      if (!containerRef.current || isReducedMotion()) return;

      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: DURATION.FAST,
          ease: EASING.POWER2_OUT,
          clearProps: 'transform',
        }
      );
    },
    { dependencies: [location.pathname], scope: containerRef }
  );

  return (
    <div ref={containerRef} className="w-full flex-1 flex flex-col">
      {children}
    </div>
  );
}
