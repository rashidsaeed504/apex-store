import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const SectionHeader = ({ title, highlight, linkText, linkTo }) => {
  return (
    <div className="flex flex-col sm:flex-row items-end justify-between mb-8 sm:mb-12 gap-4">
      <div>
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
          {title} <span className="text-apex-red">{highlight}</span>
        </h2>
      </div>
      {linkText && linkTo && (
        <Link 
          to={linkTo} 
          className="group flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors"
        >
          {linkText}
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;
