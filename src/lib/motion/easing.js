// APEX STORE — Standardized Brand Motion Curves & Timings

export const EASING = {
  // Primary brand curves (smooth, technological, premium)
  EXPO_OUT: 'expo.out',
  POWER2_OUT: 'power2.out',
  POWER3_OUT: 'power3.out',
  POWER4_OUT: 'power4.out',
  CIRC_OUT: 'circ.out',
  
  // Custom cubic-bezier strings for CSS / Lenis alignment
  TECH_SMOOTH: 'cubic-bezier(0.22, 1, 0.36, 1)',
  SNAP_OUT: 'cubic-bezier(0.16, 1, 0.3, 1)',
  GENTLE_OUT: 'cubic-bezier(0.33, 1, 0.68, 1)',
};

export const DURATION = {
  MICRO: 0.2,       // Button taps, icon shifts, badge pops
  FAST: 0.35,       // Dropdowns, hover lifts, cart drawer slide
  STANDARD: 0.6,   // Section reveals, card staggered entrances
  REVEAL: 0.85,    // Hero headline text reveals, masked image reveals
  CINEMATIC: 1.2,  // Special offer spotlight, hero ambient glow expansion
};

export const STAGGER = {
  TIGHT: 0.05,     // List items, filter pills, thumbnails
  STANDARD: 0.08,  // Product card grids, category cards
  REVEAL: 0.12,    // Hero lines, feature benefits
};
