import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/helpers';
import QuantitySelector from '../components/ui/QuantitySelector';

const MotionLink = motion(Link);

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, subtotal, shipping, total } = useCart();
  const navigate = useNavigate();

  const freeShippingThreshold = 10000;
  const progressToFreeShipping = Math.min((subtotal / freeShippingThreshold) * 100, 100);
  const amountNeededForFreeShipping = freeShippingThreshold - subtotal;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center max-w-md"
        >
          <div className="w-24 h-24 rounded-full bg-apex-charcoal border border-white/5 flex items-center justify-center mb-6 text-gray-500 shadow-xl">
            <ShoppingBag size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
          <p className="text-gray-400 mb-8 text-center text-sm">
            Looks like you haven't added anything to your cart yet. Browse our premium collection to find something you'll love.
          </p>
          <motion.button 
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={() => navigate('/shop')} 
            className="btn-primary px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-wider cursor-pointer"
          >
            CONTINUE SHOPPING
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-apex-black text-white py-10 sm:py-16 md:py-20 px-4 md:px-8 max-w-7xl mx-auto">
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="text-2xl md:text-3xl font-bold mb-8 uppercase tracking-tight"
      >
        YOUR CART ({cartItems.length})
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Cart Items */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-2"
        >
          <div className="bg-apex-charcoal rounded-xl border border-white/5 overflow-hidden shadow-xl">
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-sm font-medium text-gray-400 uppercase">
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-center">Price</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            <AnimatePresence>
              {cartItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.35, delay: (index % 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-6 p-4 items-center border-b border-white/5 last:border-0"
                >
                  <div className="col-span-1 md:col-span-6 flex items-center gap-4">
                    <img 
                      src={item.images[0]} 
                      alt={item.name} 
                      className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg bg-apex-dark shrink-0" 
                    />
                    <div>
                      <Link to={`/product/${item.slug}`} className="font-bold hover:text-apex-red transition-colors line-clamp-2 text-sm sm:text-base">
                        {item.name}
                      </Link>
                      <div className="text-xs text-gray-400 mt-1">{item.category}</div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        onClick={() => removeFromCart(item.id)}
                        className="text-xs text-red-400 hover:text-red-300 mt-2 flex items-center gap-1 md:hidden cursor-pointer"
                      >
                        <Trash2 size={12} /> Remove
                      </motion.button>
                    </div>
                  </div>
                  
                  <div className="col-span-1 md:col-span-2 text-left md:text-center font-medium text-sm md:text-base">
                    <span className="md:hidden text-gray-400 text-sm mr-2">Price:</span>
                    {formatPrice(item.price)}
                  </div>
                  
                  <div className="col-span-1 md:col-span-2 flex justify-start md:justify-center">
                    <QuantitySelector 
                      quantity={item.quantity} 
                      setQuantity={(qty) => updateQuantity(item.id, qty)} 
                      min={1} 
                      max={item.stock}
                    />
                  </div>
                  
                  <div className="col-span-1 md:col-span-2 flex justify-between items-center md:justify-end font-bold text-apex-red text-sm md:text-base">
                    <span className="md:hidden text-gray-400 text-sm">Total:</span>
                    {formatPrice(item.price * item.quantity)}
                    <motion.button
                      whileHover={{ scale: 1.18 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      onClick={() => removeFromCart(item.id)}
                      className="hidden md:flex text-gray-500 hover:text-red-500 transition-colors ml-4 p-2 cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 size={18} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Right: Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-1"
        >
          <div className="bg-apex-charcoal rounded-xl border border-white/5 p-4 sm:p-6 sticky top-24 shadow-xl">
            <h2 className="text-lg sm:text-xl font-bold mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Shipping</span>
                <span className="font-medium">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
              </div>
            </div>
            
            <div className="border-t border-white/10 pt-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-bold text-apex-red font-mono">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Free shipping progress */}
            <div className="mb-8 bg-apex-dark p-4 rounded-lg border border-white/5">
              {amountNeededForFreeShipping > 0 ? (
                <>
                  <p className="text-xs sm:text-sm text-center mb-3">
                    Add <span className="font-bold text-apex-red">{formatPrice(amountNeededForFreeShipping)}</span> more to get free shipping!
                  </p>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-apex-red transition-all duration-500 ease-out"
                      style={{ width: `${progressToFreeShipping}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-xs sm:text-sm text-center text-green-400 font-medium">
                  You've unlocked free shipping!
                </p>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={() => navigate('/checkout')}
              className="btn-primary w-full flex justify-center items-center gap-2 mb-4 px-6 py-3 text-sm font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow-[0_0_20px_rgba(220,38,38,0.3)]"
            >
              PROCEED TO CHECKOUT <ArrowRight size={18} />
            </motion.button>
            
            <MotionLink 
              to="/shop" 
              whileHover={{ y: -1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="block text-center text-sm text-gray-400 hover:text-white transition-colors"
            >
              Continue Shopping
            </MotionLink>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
