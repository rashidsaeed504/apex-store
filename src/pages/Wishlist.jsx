import React from "react";
import { motion } from "framer-motion";
import { Heart, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import ProductGrid from "../components/product/ProductGrid";

const Wishlist = () => {
  const { wishlistItems, wishlistCount, removeFromWishlist } = useWishlist();

  const handleClearWishlist = () => {
    wishlistItems.forEach((item) => removeFromWishlist(item.id));
  };

  return (
    <div className="pt-20 sm:pt-24 pb-10 sm:pb-16 min-h-screen">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex md:flex-row justify-between items-end mb-12 gap-4 mt-16"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
              MY WISHLIST
            </h1>
            <p className="text-gray-400">
              {wishlistCount} {wishlistCount === 1 ? "Item" : "Items"} in your
              wishlist
            </p>
          </div>

          {wishlistCount > 0 && (
            <button
              onClick={handleClearWishlist}
              className="text-gray-400 hover:text-apex-red transition-colors flex items-center gap-2 text-sm font-bold tracking-wider"
            >
              <Trash2 className="w-4 h-4" />
              CLEAR WISHLIST
            </button>
          )}
        </motion.div>

        {wishlistCount === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center justify-center py-24 text-center border border-white/5 rounded-2xl bg-white/[0.02]"
          >
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-4">
              Your wishlist is empty
            </h2>
            <p className="text-sm sm:text-base text-gray-400 mb-8 max-w-md">
              Save items you love to your wishlist. Review them anytime and
              easily move them to your cart.
            </p>
            <Link
              to="/shop"
              className="bg-apex-red text-white px-6 py-3 text-sm rounded-lg font-bold hover:bg-red-700 transition-colors tracking-wide"
            >
              EXPLORE PRODUCTS
            </Link>
          </motion.div>
        ) : (
          <ProductGrid products={wishlistItems} />
        )}
      </div>
    </div>
  );
};

export default Wishlist;
