import React from 'react';

/**
 * TechBackground: Subtle APEX dark cyberpunk / high-performance technical SVG grid accents
 */
export default function TechBackground({
  className = '',
  variant = 'grid', // 'grid' | 'crosshair' | 'nodes' | 'ambient'
  glowPosition = 'center', // 'center' | 'top-right' | 'bottom-left'
}) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}
    >
      {/* 1. Subtle Ambient Red Glow Orb */}
      {glowPosition === 'center' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] sm:w-[650px] h-[480px] sm:h-[650px] bg-apex-red/8 rounded-full blur-[120px] pointer-events-none" />
      )}
      {glowPosition === 'top-right' && (
        <div className="absolute -top-24 -right-24 w-[400px] sm:w-[550px] h-[400px] sm:h-[550px] bg-apex-red/8 rounded-full blur-[100px] pointer-events-none" />
      )}
      {glowPosition === 'bottom-left' && (
        <div className="absolute -bottom-24 -left-24 w-[400px] sm:w-[550px] h-[400px] sm:h-[550px] bg-apex-red/8 rounded-full blur-[100px] pointer-events-none" />
      )}

      {/* 2. Technical SVG Wireframe & Reticles */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.04] text-white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={`tech-grid-${variant}`}
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
            />
            <circle cx="0" cy="0" r="1.5" fill="#dc2626" opacity="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#tech-grid-${variant})`} />
      </svg>

      {/* 3. High-Precision Corner Crosshairs & Tech Markers */}
      <div className="absolute top-4 left-4 flex items-center gap-1.5 opacity-20 font-mono text-[9px] text-gray-500 uppercase tracking-widest">
        <span className="w-1.5 h-1.5 bg-apex-red rounded-full animate-pulse" />
        <span>SYS.APEX_CORE</span>
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-15 font-mono text-[9px] text-gray-500">
        <span>+ // 45ms_LATENCY</span>
      </div>
    </div>
  );
}
