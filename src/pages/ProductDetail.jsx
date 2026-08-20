import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Truck, ShieldCheck } from "lucide-react";
import { fetchProductBySlug, fetchProducts } from "../services/api";
import { formatPrice, getShortDescription } from "../utils/helpers";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "../context/ToastContext";
import ProductGallery from "../components/product/ProductGallery";
import ProductCarousel from "../components/product/ProductCarousel";
import ProductReviews from "../components/product/ProductReviews";
import QuantitySelector from "../components/ui/QuantitySelector";
import Rating from "../components/ui/Rating";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { triggerCartBadgePop, triggerButtonFeedback } from "../lib/motion/hooks/useCartMotion";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { success } = useToast();

  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(null);
  const [activeTab, setActiveTab] = useState("description");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchProductBySlug(slug);
      setProduct(data);
      if (data) {
        setSelectedColor(
          Array.isArray(data.colors) && data.colors.length > 0
            ? data.colors[0]
            : null,
        );
        const allProducts = await fetchProducts();
        if (Array.isArray(allProducts)) {
          const related = allProducts
            .filter(
              (p) =>
                p &&
                p.id !== data.id &&
                (p.category || "").toLowerCase() ===
                  (data.category || "").toLowerCase(),
            )
            .slice(0, 8);
          setRelatedProducts(related);
        }
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center pt-24">
        <div className="w-8 h-8 border-4 border-apex-red border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-apex-black text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold mb-4 uppercase tracking-wider">
          Product Not Found
        </h1>
        <p className="text-gray-400 mb-8">
          The product you are looking for could not be found or has been moved.
        </p>
        <Link
          to="/shop"
          className="btn-primary px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs"
        >
          Explore All Products
        </Link>
      </div>
    );
  }

  const isWishlisted = isInWishlist ? isInWishlist(product.id) : false;
  const isOutOfStock = product.stock <= 0 || product.status === "Out of Stock";
  const categoryName = product.category || "Shop";
  const productImages =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : [
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
          ];

  const handleAddToCart = (e) => {
    if (isOutOfStock) return;
    if (e?.currentTarget) triggerButtonFeedback(e.currentTarget);
    triggerCartBadgePop();
    if (addToCart) addToCart(product, quantity, true);
    if (success) success(`Added ${quantity > 1 ? `${quantity}x ` : ''}${product.name} to cart`);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    if (addToCart) addToCart(product, quantity, false);
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-apex-black text-white py-8 sm:py-12 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto mt-20 sm:mt-24 w-full min-w-0 overflow-x-hidden">
      {/* Breadcrumb */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="text-xs sm:text-sm text-gray-400 mb-6 sm:mb-8 flex items-center flex-wrap gap-1 sm:gap-2 w-full min-w-0 max-w-full"
      >
        <Link
          to="/"
          className="hover:text-white transition-colors whitespace-nowrap"
        >
          Home
        </Link>{" "}
        &gt;
        <Link
          to={`/shop?category=${encodeURIComponent(categoryName)}`}
          className="hover:text-white transition-colors whitespace-nowrap"
        >
          {categoryName}
        </Link>{" "}
        &gt;
        <span className="text-white break-words inline-block align-bottom max-w-full">
          {product.name}
        </span>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 mb-12 sm:mb-16 items-start w-full min-w-0 max-w-full">
        {/* Left: Gallery */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full min-w-0 max-w-full"
        >
          <ProductGallery images={productImages} productName={product.name} />
        </motion.div>

        {/* Right: Info */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col w-full min-w-0 max-w-full"
        >
          <div className="flex items-start justify-between mb-2 w-full min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold break-words whitespace-normal leading-tight text-white w-full max-w-full">
              {product.name}
            </h1>
          </div>

          <div className="flex items-center flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6 w-full min-w-0">
            <a 
              href="#customer-reviews" 
              className="group flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Rating rating={product.rating} reviews={product.reviews} />
              <span className="text-xs text-gray-400 group-hover:text-apex-red transition-colors underline decoration-white/20 underline-offset-4">
                View all reviews
              </span>
            </a>
          </div>

          <div className="flex items-baseline flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6 w-full min-w-0">
            <span className="text-xl sm:text-2xl font-bold text-apex-red">
              {formatPrice(product.price)}
            </span>
            {Number(product.originalPrice) > Number(product.price) && (
              <span className="text-base sm:text-lg text-gray-500 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            {Number(product.discount) > 0 && (
              <Badge variant="discount">-{product.discount}% OFF</Badge>
            )}
          </div>

          {/* Short Product Summary (2-3 lines max) */}
          <p className="text-sm sm:text-base text-gray-300/90 mb-6 sm:mb-8 leading-relaxed break-words whitespace-normal w-full max-w-full font-normal line-clamp-3">
            {product.short_description || product.shortDescription || getShortDescription(product.description || product.fullDescription, 160)}
          </p>

          {Array.isArray(product.colors) && product.colors.length > 0 && (
            <div className="mb-6 w-full min-w-0">
              <h3 className="text-sm font-medium mb-3">
                Color: <span className="text-gray-300">{selectedColor}</span>
              </h3>
              <div className="flex flex-wrap gap-2.5 sm:gap-3 w-full min-w-0">
                {product.colors.map((color) => (
                  <motion.button
                    key={color}
                    whileHover={{ scale: 1.18 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                      selectedColor === color
                        ? "border-apex-red scale-110"
                        : "border-transparent hover:border-gray-500"
                    }`}
                    style={{
                      backgroundColor: color
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, ""),
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mb-6 sm:mb-8 w-full min-w-0">
            <h3 className="text-sm font-medium mb-3">Quantity:</h3>
            <div className="flex items-center flex-wrap gap-3 sm:gap-4 w-full min-w-0">
              <QuantitySelector
                quantity={quantity}
                setQuantity={setQuantity}
                min={1}
                max={Math.max(1, Number(product.stock) || 99)}
              />
              <div
                className={`text-xs sm:text-sm font-medium ${product.stock > 10 ? "text-green-500" : "text-orange-500"}`}
              >
                {product.stock > 10
                  ? `In Stock (${product.stock} available)`
                  : `Low Stock (${product.stock} left)`}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 w-full max-w-full">
            <motion.button
              whileHover={!isOutOfStock ? { scale: 1.02, y: -1 } : {}}
              whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={`btn-primary w-full sm:flex-1 py-3.5 sm:py-3 px-4 text-xs sm:text-sm rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 box-border cursor-pointer ${isOutOfStock ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              <ShoppingBag size={18} />
              <span>{isOutOfStock ? "OUT OF STOCK" : "ADD TO CART"}</span>
            </motion.button>

            <div className="flex gap-3 w-full sm:flex-1 max-w-full">
              <motion.button
                whileHover={!isOutOfStock ? { scale: 1.02, y: -1 } : {}}
                whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={`btn-secondary flex-1 py-3.5 sm:py-3 px-4 text-xs sm:text-sm rounded-xl font-bold uppercase tracking-wider box-border cursor-pointer ${isOutOfStock ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={handleBuyNow}
                disabled={isOutOfStock}
              >
                BUY NOW
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={() => toggleWishlist && toggleWishlist(product)}
                className={`px-4 py-3.5 sm:p-4 rounded-xl border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                  isWishlisted
                    ? "border-apex-red text-apex-red bg-apex-red/10"
                    : "border-white/20 text-white hover:border-white/50"
                }`}
                aria-label="Wishlist"
              >
                <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
              </motion.button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4 border-t border-white/10 pt-6 sm:pt-8 w-full min-w-0">
            <div className="flex items-center gap-3 text-gray-400">
              <Truck size={18} className="text-apex-red shrink-0" />
              <span className="text-xs sm:text-sm">
                Free shipping over PKR 10,000
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <ShieldCheck size={18} className="text-apex-red shrink-0" />
              <span className="text-xs sm:text-sm">7-day return policy</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="mb-16 sm:mb-20 w-full min-w-0 max-w-full"
      >
        <div className="flex overflow-x-auto border-b border-white/10 mb-8 hide-scrollbar">
          {["description", "features", "specifications", "shipping"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium capitalize whitespace-nowrap transition-colors relative cursor-pointer ${
                  activeTab === tab
                    ? "text-apex-red font-bold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {tab === "shipping" ? "Shipping & Returns" : tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-apex-red"
                  />
                )}
              </button>
            ),
          )}
        </div>

        <div className="bg-apex-charcoal border border-white/5 rounded-2xl p-4 sm:p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === "description" && (
                <div className="prose prose-invert max-w-none text-gray-300 space-y-4">
                  <div className="whitespace-pre-line leading-relaxed text-sm sm:text-base text-gray-300">
                    {product.fullDescription || product.full_description || product.description || "No detailed description available for this product."}
                  </div>
                </div>
              )}
              {activeTab === "features" && (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.isArray(product.features) &&
                  product.features.length > 0 ? (
                    product.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-3 text-gray-300"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-apex-red shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-400 col-span-full">
                      No specific features listed for this product.
                    </li>
                  )}
                </ul>
              )}
              {activeTab === "specifications" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  {product.specifications &&
                  typeof product.specifications === "object" &&
                  !Array.isArray(product.specifications) &&
                  Object.keys(product.specifications).length > 0 ? (
                    Object.entries(product.specifications).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-white/10"
                        >
                          <span className="text-gray-400">{key}</span>
                          <span className="font-medium text-white">
                            {String(value)}
                          </span>
                        </div>
                      ),
                    )
                  ) : typeof product.specifications === "string" && product.specifications.trim() ? (
                    product.specifications.split('\n').map((s) => s.trim()).filter(Boolean).map((line, idx) => {
                      const colonIdx = line.indexOf(':');
                      const k = colonIdx !== -1 ? line.slice(0, colonIdx).trim() : `Spec #${idx + 1}`;
                      const v = colonIdx !== -1 ? line.slice(colonIdx + 1).trim() : line;
                      return (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-white/10"
                        >
                          <span className="text-gray-400">{k}</span>
                          <span className="font-medium text-white">{v}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-400 col-span-full">
                      No technical specifications listed for this product.
                    </p>
                  )}
                </div>
              )}
              {activeTab === "shipping" && (
                <div className="text-gray-300 space-y-4">
                  <p>
                    <strong>Shipping:</strong> Free shipping on orders over PKR
                    10,000. Standard delivery 3-5 business days.
                  </p>
                  <p>
                    <strong>Returns:</strong> 7-day return policy for unused
                    items. Please contact our support team for return
                    authorization.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Customer Reviews Section */}
      <motion.div 
        id="customer-reviews"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="w-full min-w-0 max-w-full mb-12 sm:mb-16"
      >
        <ProductReviews 
          productId={product.id} 
          productName={product.name} 
          onReviewsUpdated={async () => {
            const updated = await fetchProductBySlug(slug);
            if (updated) setProduct(updated);
          }}
        />
      </motion.div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 sm:mt-12 w-full min-w-0 max-w-full"
        >
          <ProductCarousel
            products={relatedProducts}
            title="YOU MAY ALSO"
            highlightTitle="LIKE"
          />
        </motion.div>
      )}
    </div>
  );
}
