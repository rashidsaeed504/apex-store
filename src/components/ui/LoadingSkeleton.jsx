import React from 'react';

export const ProductCardSkeleton = () => {
  return (
    <div className="bg-apex-charcoal rounded-xl overflow-hidden border border-white/5">
      <div className="w-full h-64 bg-white/5 animate-pulse"></div>
      <div className="p-5 space-y-4">
        <div className="flex justify-between">
          <div className="h-4 w-20 bg-white/5 rounded animate-pulse"></div>
          <div className="h-4 w-12 bg-white/5 rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="h-5 w-full bg-white/5 rounded animate-pulse"></div>
          <div className="h-5 w-2/3 bg-white/5 rounded animate-pulse"></div>
        </div>
        <div className="h-6 w-24 bg-white/5 rounded animate-pulse"></div>
        <div className="h-10 w-full bg-white/5 rounded-lg animate-pulse mt-4"></div>
      </div>
    </div>
  );
};

export const TextSkeleton = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <div 
          key={i} 
          className={`h-4 bg-white/5 rounded animate-pulse ${
            i === lines - 1 ? 'w-2/3' : 'w-full'
          }`}
        ></div>
      ))}
    </div>
  );
};

export const ImageSkeleton = ({ className = 'h-64 w-full' }) => {
  return (
    <div className={`bg-white/5 rounded-xl animate-pulse ${className}`}></div>
  );
};

export default {
  ProductCardSkeleton,
  TextSkeleton,
  ImageSkeleton
};
