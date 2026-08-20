import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center pt-10 sm:pt-20 pb-10 sm:pb-16">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <h1 className="text-6xl sm:text-8xl md:text-[150px] font-black text-apex-red leading-none mb-6 drop-shadow-[0_0_30px_rgba(220,38,38,0.3)]">
            404
          </h1>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black mb-6 tracking-tight">
            PAGE NOT FOUND
          </h2>
          <p className="text-base sm:text-xl text-gray-400 mb-12 max-w-lg mx-auto leading-relaxed">
            The page you're looking for doesn't exist, has been moved, or is temporarily unavailable.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              to="/"
              className="w-full sm:w-auto bg-apex-red text-white px-6 py-3 text-sm sm:text-base rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-3 tracking-wide"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
              BACK TO HOME
            </Link>
            <Link 
              to="/shop"
              className="w-full sm:w-auto bg-white/5 border border-white/10 text-white px-6 py-3 text-sm sm:text-base rounded-lg font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-3 tracking-wide"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              BROWSE SHOP
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
