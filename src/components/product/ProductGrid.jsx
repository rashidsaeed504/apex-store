import { motion } from 'framer-motion';
import ProductCard from './ProductCard';

export function ProductCardSkeleton() {
  return (
    <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden flex flex-col h-full animate-pulse">
      <div className="aspect-square bg-gray-800 w-full"></div>
      <div className="p-3 sm:p-4 flex flex-col flex-grow space-y-3">
        <div className="h-3 bg-gray-800 rounded w-1/3"></div>
        <div className="h-4 bg-gray-800 rounded w-3/4"></div>
        <div className="h-3 bg-gray-800 rounded w-1/4"></div>
        <div className="mt-auto pt-2 h-5 bg-gray-800 rounded w-1/2"></div>
      </div>
      <div className="h-9 sm:h-12 bg-gray-800 border-t border-white/5 mt-auto"></div>
    </div>
  );
}

export default function ProductGrid({ products = [], loading = false, columns, className = '' }) {
  const gridClasses = columns 
    ? `grid-cols-2 sm:grid-cols-2 lg:grid-cols-${columns}` 
    : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  if (loading) {
    return (
      <div className={`grid ${gridClasses} gap-3 sm:gap-6 ${className}`}>
        {[...Array(8)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="py-20 text-center bg-[#111] border border-white/5 rounded-xl">
        <h3 className="text-xl text-white font-medium mb-2">No products found</h3>
        <p className="text-gray-400">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className={`grid ${gridClasses} gap-3 sm:gap-6 ${className}`}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </motion.div>
  );
}
