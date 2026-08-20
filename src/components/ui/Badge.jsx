import React from 'react';

const Badge = ({ children, text, variant = 'new', className = '' }) => {
  const variants = {
    discount: 'bg-apex-red text-white',
    new: 'bg-green-600 text-white',
    hot: 'bg-orange-500 text-white',
    sale: 'bg-apex-red text-white',
    premium: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white',
    popular: 'bg-blue-600 text-white',
    gaming: 'bg-purple-600 text-white',
    value: 'bg-emerald-600 text-white'
  };

  const selectedVariant = variants[variant] || variants.new;

  return (
    <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${selectedVariant} ${className}`}>
      {children || text || variant}
    </span>
  );
};

export default Badge;
