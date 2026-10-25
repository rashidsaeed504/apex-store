import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Star } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/helpers';
import { triggerCartBadgePop, triggerButtonFeedback } from '../../lib/motion/hooks/useCartMotion';

export default function ProductCard({ product, className = '', disableMotion = false, index = 0 }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { success } = useToast();
  const location = useLocation();

  if (!product) return null;

  const productId = product.id || product.slug || Math.random();
  const isWishlisted = isInWishlist ? isInWishlist(productId) : false;
  const isOutOfStock = product.stock <= 0 || product.status === 'Out of Stock';
  const productSlug = product.slug || (product.name ? product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'item');
  const productImage = (Array.isArray(product.images) && product.images.length > 0)
    ? product.images[0]
    : (product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop');

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    triggerButtonFeedback(e.currentTarget);
    triggerCartBadgePop();
    if (addToCart) addToCart(product);
    if (success) success(`${product.name || 'Product'} added to cart`);
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (toggleWishlist) toggleWishlist(product);
    if (success) {
      if (isWishlisted) {
        success(`${product.name || 'Product'} removed from wishlist`);
      } else {
        success(`${product.name || 'Product'} added to wishlist`);
      }
    }
  };

  const cardContent = (
    <>
      {/* Product Image Container — Square aspect-square on mobile, height-based on desktop */}
      <Link 
        to={`/product/${productSlug}`} 
        className="relative block w-full aspect-square sm:aspect-auto sm:h-56 md:h-64 lg:h-72 bg-[#0a0a0a] border-b border-white/5 overflow-hidden flex-shrink-0"
      >
        {/* Discount Badge */}
        {Number(product.discount) > 0 && !isOutOfStock && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 bg-apex-red text-white text-[9px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded shadow-md">
            -{product.discount}%
          </div>
        )}
        
        {/* Out of Stock Badge Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 z-20 bg-black/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-red-600 text-white font-black text-[9px] sm:text-xs uppercase tracking-widest px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg shadow-lg">
              OUT OF STOCK
            </span>
          </div>
        )}

        {/* Wishlist Button */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          onClick={handleToggleWishlist}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-1 sm:p-2 bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/10 rounded-full transition-all cursor-pointer"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart 
            className={`w-3 h-3 sm:w-4 sm:h-4 transition-colors ${isWishlisted ? 'fill-apex-red text-apex-red' : 'text-gray-300 hover:text-white'}`} 
          />
        </motion.button>

        {/* Product Image - Full Container Fill (object-cover) */}
        <img 
          src={productImage} 
          alt={product.name || 'APEX Product'} 
          loading="lazy"
          width={600}
          height={600}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop';
          }}
          className="w-full h-full object-cover object-center block group-hover:scale-105 transition-transform duration-500 text-transparent select-none"
        />
      </Link>

      {/* Product Info Section */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-grow">
        <Link to={`/product/${productSlug}`} className="flex flex-col flex-grow">
          {/* Category */}
          <span className="text-[9px] sm:text-xs text-gray-500 uppercase tracking-wider mb-0.5 font-medium truncate">
            {product.category || 'Tech Gear'}
          </span>
          {/* Product Name (line-clamp-2 for mobile clarity) */}
          <h3 className="text-[12px] sm:text-base text-white font-medium line-clamp-2 mb-1 group-hover:text-apex-red transition-colors leading-tight">
            {product.name || 'Apex Product'}
          </h3>
          
          {/* Rating (Stars + Number only on mobile) */}
          <div className="flex items-center gap-1 mb-1.5">
            <Star className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-yellow-500 text-yellow-500" />
            <span className="text-white text-[10px] sm:text-sm font-medium">{product.rating || '4.8'}</span>
            <span className="text-gray-500 text-[9px] sm:text-xs hidden sm:inline">({product.reviews || '24'})</span>
          </div>

          {/* Price Section */}
          <div className="mt-auto pt-0.5">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-apex-red text-[13px] sm:text-base font-bold">
                {formatPrice(product.price)}
              </span>
              {Number(product.originalPrice) > Number(product.price) && (
                <span className="text-gray-500 text-[10px] sm:text-xs line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Add to Cart Button */}
      <motion.button
        whileHover={!isOutOfStock ? { scale: 1.02, y: -1 } : {}}
        whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        className={`w-full min-h-[38px] sm:min-h-[44px] py-2 sm:py-3 border-t uppercase text-[10px] sm:text-sm font-semibold tracking-wider transition-colors mt-auto cursor-pointer flex items-center justify-center ${
          isOutOfStock
            ? 'bg-gray-800/80 text-gray-500 border-white/5 cursor-not-allowed'
            : 'bg-apex-gray/50 border-white/5 text-white hover:bg-apex-red hover:border-apex-red'
        }`}
      >
        {isOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}
      </motion.button>
    </>
  );

  const baseClasses = `group bg-[#111] border border-white/5 rounded-xl overflow-hidden hover:border-apex-red/30 hover:shadow-[0_0_20px_rgba(220,38,38,0.15)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full ${className}`;

  if (disableMotion) {
    return (
      <div className={baseClasses}>
        {cardContent}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: (index % 6) * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className={baseClasses}
    >
      {cardContent}
    </motion.div>
  );
}
