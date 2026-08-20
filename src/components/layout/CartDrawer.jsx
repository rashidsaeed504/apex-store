import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  Plus, 
  Minus, 
  ArrowRight, 
  Truck, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/helpers';

export default function CartDrawer({ isOpen: propIsOpen, onClose: propOnClose }) {
  const { 
    cartItems, 
    isCartOpen: contextIsOpen, 
    closeCart: contextCloseCart, 
    removeFromCart, 
    updateQuantity, 
    subtotal, 
    shipping, 
    total, 
    cartCount 
  } = useCart();

  const navigate = useNavigate();

  // Use props if provided, otherwise fallback to context state
  const isOpen = propIsOpen !== undefined ? propIsOpen : contextIsOpen;
  const handleClose = propOnClose || contextCloseCart;

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const FREE_SHIPPING_THRESHOLD = 10000;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  const handleCheckoutClick = () => {
    handleClose();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay with Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 cursor-pointer"
          />

          {/* Cart Drawer Panel (Smooth right slide on desktop & mobile) */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[440px] md:w-[480px] bg-[#0a0a0a] border-l border-white/10 z-50 flex flex-col shadow-[-15px_0_40px_rgba(0,0,0,0.9)] overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-white/10 bg-[#070707] relative shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-apex-red/15 border border-apex-red/30 flex items-center justify-center text-apex-red shadow-[0_0_12px_rgba(220,38,38,0.3)]">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                      Your Cart
                    </h2>
                    <p className="text-[11px] text-gray-400 font-mono">
                      {cartCount} {cartCount === 1 ? 'item' : 'items'} selected
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close cart drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Free Shipping Progress Indicator */}
              <div className="mt-4 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <Truck className="w-3.5 h-3.5 text-apex-red" />
                    {remainingForFreeShipping > 0 ? (
                      <span>
                        Add <strong className="text-apex-red">{formatPrice(remainingForFreeShipping)}</strong> for <strong className="text-white">FREE DELIVERY</strong>
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        🎉 Free Delivery Unlocked!
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">
                    {freeShippingProgress}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${freeShippingProgress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      freeShippingProgress >= 100 
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' 
                        : 'bg-gradient-to-r from-red-600 to-apex-red shadow-[0_0_8px_rgba(220,38,38,0.5)]'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Cart Items List Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5">
                  <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 shadow-inner">
                    <ShoppingBag className="w-10 h-10 opacity-30" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-1">
                      Your Cart is Empty
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 max-w-xs leading-relaxed">
                      Discover our high-performance earbuds, smartwatches, and gaming gear.
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="btn-primary px-8 py-3 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.35)] cursor-pointer"
                  >
                    Start Shopping
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                cartItems.map((item) => {
                  const resolvedImage = Array.isArray(item.images) && item.images.length > 0
                    ? item.images[0]
                    : (item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop');

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-3 sm:p-4 bg-[#111111] border border-white/5 hover:border-white/15 rounded-2xl flex gap-3.5 sm:gap-4 transition-colors"
                    >
                      {/* Product Thumbnail */}
                      <Link
                        to={`/product/${item.slug}`}
                        onClick={handleClose}
                        className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl bg-[#050505] border border-white/10 overflow-hidden shrink-0 group block"
                      >
                        <img
                          src={resolvedImage}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop';
                          }}
                        />
                      </Link>

                      {/* Item Details */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={`/product/${item.slug}`}
                            onClick={handleClose}
                            className="text-xs sm:text-sm font-bold text-white hover:text-apex-red transition-colors line-clamp-2 leading-snug"
                          >
                            {item.name}
                          </Link>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-500 hover:text-red-400 p-1 -mt-1 -mr-1 transition-colors cursor-pointer shrink-0"
                            title="Remove item"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Price & Quantity Bar */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                          <div className="flex items-center bg-[#070707] border border-white/10 rounded-lg p-0.5">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-mono font-bold text-white w-7 text-center select-none">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-right">
                            <div className="text-xs sm:text-sm font-bold text-white font-mono">
                              {formatPrice(item.price * item.quantity)}
                            </div>
                            {item.quantity > 1 && (
                              <div className="text-[10px] text-gray-500 font-mono">
                                {formatPrice(item.price)} each
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer Summary & Checkout Actions */}
            {cartItems.length > 0 && (
              <div className="p-4 sm:p-6 bg-[#070707] border-t border-white/10 space-y-4 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
                {/* Cost Breakdown */}
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span className="text-white font-mono">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Estimated Shipping</span>
                    <span className="font-mono">
                      {shipping === 0 ? (
                        <span className="text-emerald-400 font-bold uppercase">Free</span>
                      ) : (
                        <span className="text-white">{formatPrice(shipping)}</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-base sm:text-lg font-black text-white pt-2.5 border-t border-white/10">
                    <span>Total Amount</span>
                    <span className="text-apex-red font-mono">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Primary & Secondary Action Buttons */}
                <div className="space-y-2.5 pt-1">
                  <button
                    onClick={handleCheckoutClick}
                    className="w-full btn-primary py-3.5 sm:py-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.7)] transition-all cursor-pointer"
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleClose}
                      className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors cursor-pointer text-center"
                    >
                      Continue Shopping
                    </button>

                    <Link
                      to="/cart"
                      onClick={handleClose}
                      className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                    >
                      View Cart
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </Link>
                  </div>
                </div>

                {/* Security trust badge */}
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-widest pt-1 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Secure 256-Bit SSL Checkout • COD Available</span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
