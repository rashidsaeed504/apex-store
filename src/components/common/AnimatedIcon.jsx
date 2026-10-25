import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Truck,
  Lightning,
  ShieldCheck,
  ArrowCounterClockwise,
  CheckCircle,
  Star,
  Package,
} from '@phosphor-icons/react';

// Icon Registry mapping semantic keys to Phosphor duotone icons
const ICON_MAP = {
  truck: Truck,
  cod: Truck,
  delivery: Truck,
  fast_delivery: Lightning,
  lightning: Lightning,
  zap: Lightning,
  bolt: Lightning,
  warranty: ShieldCheck,
  shield: ShieldCheck,
  genuine: ShieldCheck,
  returns: ArrowCounterClockwise,
  return: ArrowCounterClockwise,
  refund: ArrowCounterClockwise,
  check: CheckCircle,
  star: Star,
  package: Package,
};

// Micro-animation variants tailored for each icon type (all under 600ms)
const getIconAnimation = (name, shouldReduceMotion) => {
  if (shouldReduceMotion) {
    return {
      idle: {},
      hover: {},
    };
  }

  const key = String(name || '').toLowerCase();

  if (key.includes('truck') || key.includes('cod') || key.includes('delivery')) {
    // Truck nudges forward and settles
    return {
      idle: { x: 0 },
      hover: {
        x: [0, 6, 0],
        transition: { duration: 0.42, ease: 'easeInOut' },
      },
    };
  }

  if (key.includes('lightning') || key.includes('zap') || key.includes('bolt') || key.includes('fast')) {
    // Bolt flashes with quick scale & opacity pulse
    return {
      idle: { scale: 1, opacity: 1 },
      hover: {
        scale: [1, 1.2, 0.95, 1],
        opacity: [1, 0.7, 1],
        transition: { duration: 0.38, ease: 'easeOut' },
      },
    };
  }

  if (key.includes('shield') || key.includes('warranty') || key.includes('genuine')) {
    // Shield tick draws/pulses with subtle elevation
    return {
      idle: { scale: 1, rotate: 0 },
      hover: {
        scale: [1, 1.15, 1],
        rotate: [0, -3, 3, 0],
        transition: { duration: 0.45, ease: 'easeOut' },
      },
    };
  }

  if (key.includes('return') || key.includes('refund') || key.includes('counter')) {
    // Return arrow rotates 180 degrees
    return {
      idle: { rotate: 0 },
      hover: {
        rotate: 180,
        transition: { duration: 0.52, ease: [0.34, 1.56, 0.64, 1] },
      },
    };
  }

  // Default subtle bounce
  return {
    idle: { scale: 1 },
    hover: {
      scale: 1.1,
      transition: { duration: 0.35, ease: 'easeOut' },
    },
  };
};

/**
 * Reusable AnimatedIcon Component
 * - Consistent Phosphor duotone weight at 40-48px
 * - Soft rounded-square (radius 16px) with subtle red-tinted background & 1px ring
 * - Scroll entrance: draws/fades in once when scrolled into view (whileInView)
 * - Micro-animation on hover (truck nudges, bolt flashes, shield tick draws, return rotates 180deg)
 * - Full prefers-reduced-motion support
 */
export default function AnimatedIcon({
  name = 'truck',
  icon: CustomIcon,
  size = 42,
  weight = 'duotone',
  className = '',
  containerClassName = '',
  iconClassName = '',
  isHovered = false,
}) {
  const shouldReduceMotion = useReducedMotion();
  const IconComponent = CustomIcon || ICON_MAP[String(name).toLowerCase()] || Truck;
  const animationVariants = getIconAnimation(name, shouldReduceMotion);

  // Scroll entrance animation (runs once when scrolled into view)
  const containerEntranceVariants = {
    initial: shouldReduceMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.88, y: 12 },
    whileInView: { opacity: 1, scale: 1, y: 0 },
  };

  return (
    <motion.div
      initial="initial"
      whileInView="whileInView"
      viewport={{ once: true, amount: 0.25 }}
      variants={containerEntranceVariants}
      transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
      className={`
        relative inline-flex items-center justify-center
        w-14 h-14 sm:w-16 sm:h-16
        rounded-[16px]
        bg-apex-red/10 
        ring-1 ring-apex-red/25
        border border-white/5
        shadow-[0_0_20px_rgba(220,38,38,0.12)]
        transition-all duration-300
        group-hover:ring-apex-red/45
        group-hover:bg-apex-red/[0.15]
        group-hover:shadow-[0_0_25px_rgba(220,38,38,0.24)]
        ${containerClassName}
      `}
    >
      {/* Subtle radial inner glow accent */}
      <div 
        aria-hidden="true"
        className="absolute inset-0 rounded-[16px] bg-gradient-to-br from-apex-red/15 via-transparent to-transparent pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity" 
      />

      {/* Animated Icon Glyph */}
      <motion.div
        aria-hidden="true"
        variants={animationVariants}
        animate={isHovered ? 'hover' : undefined}
        whileHover={!shouldReduceMotion ? 'hover' : undefined}
        className="relative z-10 flex items-center justify-center text-apex-red"
      >
        <IconComponent
          size={size}
          weight={weight}
          className={`text-apex-red transition-colors duration-300 ${iconClassName} ${className}`}
        />
      </motion.div>
    </motion.div>
  );
}
