import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const SectionHeader = ({ title, highlight, linkText, linkTo }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-6 sm:mb-10 gap-3 sm:gap-4">
      <div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-white">
          {title} {highlight && <span className="text-gradient-red drop-shadow-[0_0_20px_rgba(220,38,38,0.35)]">{highlight}</span>}
        </h2>
      </div>
      {linkText && linkTo && (
        <Link 
          to={linkTo} 
          className="group inline-flex items-center text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
        >
          <span>{linkText}</span>
          <ArrowRight className="w-4 h-4 ml-1.5 sm:ml-2 group-hover:translate-x-1.5 transition-transform text-apex-red" />
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;
