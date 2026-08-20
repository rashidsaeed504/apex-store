import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const SectionHeader = ({ title, highlight, linkText, linkTo, className = '' }) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 ${className}`}>
      <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-white">
        {title} {highlight && <span className="text-apex-red">{highlight}</span>}
      </h2>
      
      {linkText && linkTo && (
        <Link 
          to={linkTo}
          className="group inline-flex items-center text-sm font-semibold text-gray-400 hover:text-apex-red transition-colors uppercase tracking-widest"
        >
          {linkText}
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;
