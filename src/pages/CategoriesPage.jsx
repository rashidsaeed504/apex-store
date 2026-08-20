import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, LayoutGrid, ArrowUpRight } from 'lucide-react';
import { fetchCategories } from '../services/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      setLoading(true);
      try {
        const data = await fetchCategories();
        const activeCategories = (data || []).filter(
          (c) => c.is_active !== false && c.isActive !== false
        );
        setCategories(activeCategories);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  return (
    <div className="pt-24 pb-16 min-h-screen bg-[#050505]">
      {/* Hero Section */}
      <section className="bg-apex-dark py-12 md:py-16 border-b border-white/5 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-apex-red/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container max-w-7xl mx-auto px-4 relative z-10 text-center">
          {/* Breadcrumb / Back Link */}
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-400 mb-6 uppercase tracking-wider">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            <span className="text-apex-red font-bold">Categories</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-apex-red text-xs font-mono font-bold uppercase tracking-widest bg-apex-red/10 px-3.5 py-1.5 rounded-full border border-apex-red/20 inline-block mb-4 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
              PREMIUM CATALOG
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white mb-4">
              Explore <span className="text-apex-red">Categories</span>
            </h1>
            <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto font-normal leading-relaxed">
              Explore our complete ecosystem of next-generation audio, precision smartwatches, studio creator gear, and high-performance gaming hardware.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Grid Content */}
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {loading ? (
          /* Skeleton Loader */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="h-[180px] sm:h-[235px] md:h-[240px] bg-[#0a0a0a] border border-white/5 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : categories.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center text-gray-400 bg-[#0a0a0a] rounded-2xl border border-white/5 max-w-lg mx-auto">
            <LayoutGrid className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-2 uppercase tracking-wider">
              No Categories Found
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              There are currently no active categories available. Check back soon.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center px-5 py-2.5 bg-apex-red text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-red-700 transition-colors shadow-[0_0_15px_rgba(220,38,38,0.3)]"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Browse All Products
            </Link>
          </div>
        ) : (
          /* Premium Categories Grid */
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6"
          >
            {categories.map((category, index) => {
              const slug =
                category.slug ||
                category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              const catImage =
                category.image ||
                category.image_url ||
                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop';
              const subtitle =
                category.short_description ||
                category.shortDescription ||
                category.description ||
                'Explore collection';

              return (
                <motion.div
                  key={category.id || slug || index}
                  variants={itemVariants}
                >
                  <Link
                    to={`/category/${slug}`}
                    className="group relative h-[180px] sm:h-[235px] md:h-[240px] w-full rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/10 hover:border-apex-red/60 hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] hover:-translate-y-1 transition-all duration-300 block cursor-pointer"
                  >
                    {/* Background Category Image */}
                    <img
                      src={catImage}
                      alt={category.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out opacity-90 group-hover:opacity-100"
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop';
                      }}
                    />

                    {/* Dark Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent pointer-events-none transition-opacity duration-300 group-hover:from-black/90" />

                    {/* Top-Right Floating Explore Badge */}
                    <div className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-105 group-hover:bg-apex-red group-hover:border-apex-red text-white transition-all duration-300 z-10 shadow-lg">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>

                    {/* Category Name & Subtitle at Left-Bottom with Breathing Room */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 pb-4 sm:pb-6 flex flex-col justify-end z-10 transform group-hover:-translate-y-0.5 transition-transform duration-300 text-left">
                      <h3 className="text-sm sm:text-base md:text-lg font-black uppercase tracking-wider text-white group-hover:text-apex-red transition-colors leading-tight line-clamp-1">
                        {category.name}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-gray-300/90 font-medium mt-1 line-clamp-1 leading-snug">
                        {subtitle}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
