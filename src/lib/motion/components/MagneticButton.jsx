import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useMagnetic } from '../hooks/useMagnetic';
import gsap from 'gsap';
import { EASING, DURATION } from '../easing';

export default function MagneticButton({
  children,
  className = '',
  onClick,
  strength = 0.22,
  as: Component = 'button',
  to,
  href,
  target,
  rel,
  type = 'button',
  disabled = false,
  ...props
}) {
  const buttonRef = useMagnetic({ strength, maxDistance: 70 });
  const sheenRef = useRef(null);

  const handleMouseEnter = () => {
    if (!sheenRef.current) return;
    gsap.fromTo(
      sheenRef.current,
      { x: '-100%', opacity: 0.4 },
      { x: '100%', opacity: 0, duration: 0.6, ease: EASING.EXPO_OUT }
    );
  };

  const handleMouseDown = () => {
    if (!buttonRef.current) return;
    gsap.to(buttonRef.current, { scale: 0.97, duration: DURATION.MICRO, ease: 'power2.out' });
  };

  const handleMouseUp = () => {
    if (!buttonRef.current) return;
    gsap.to(buttonRef.current, { scale: 1, duration: DURATION.FAST, ease: 'back.out(2)' });
  };

  const commonProps = {
    ref: buttonRef,
    className: `relative overflow-hidden group select-none transition-shadow ${className}`,
    onMouseEnter: handleMouseEnter,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onClick,
    disabled,
    ...props,
  };

  if (to) {
    return (
      <Link to={to} {...commonProps}>
        <span className="relative z-10 flex items-center justify-center gap-2 w-full h-full">
          {children}
        </span>
        {/* Subtle Light Sweep Overlay */}
        <span
          ref={sheenRef}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full"
        />
      </Link>
    );
  }

  return (
    <Component
      type={Component === 'button' ? type : undefined}
      href={href}
      target={target}
      rel={rel}
      {...commonProps}
    >
      <span className="relative z-10 flex items-center justify-center gap-2 w-full h-full">
        {children}
      </span>
      {/* Subtle Light Sweep Overlay */}
      <span
        ref={sheenRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full"
      />
    </Component>
  );
}
