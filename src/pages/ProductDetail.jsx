import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Truck, ShieldCheck } from "lucide-react";
import { fetchProductBySlug, fetchProducts } from "../services/api";
import { formatPrice, WHATSAPP_NUMBER } from "../utils/helpers";
import { WhatsAppIcon } from "../components/ui/SocialIcons";
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

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    if (addToCart) addToCart(product, quantity, true);
    if (success) success(`Added ${quantity > 1 ? `${quantity}x ` : ''}${product.name} to cart`);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    if (addToCart) addToCart(product, quantity, false);
    navigate("/checkout");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-apex-black text-white py-12 px-4 md:px-8 max-w-7xl mx-auto mt-24"
    >
      <div className="text-xs sm:text-sm text-gray-400 mb-6 sm:mb-8 flex items-center flex-wrap gap-1 sm:gap-2">
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
        <span className="text-white truncate max-w-[150px] sm:max-w-none inline-block align-bottom">
          {product.name}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 mb-12 sm:mb-16">
        {/* Left: Gallery */}
        <div className="w-full rounded-xl overflow-hidden aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5]">
          <ProductGallery images={productImages} productName={product.name} />
        </div>

        {/* Right: Info */}
        <div className="flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              {product.name}
            </h1>
          </div>

          <div className="flex items-center gap-4 mb-6">
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

          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-xl sm:text-2xl font-bold text-apex-red">
              {formatPrice(product.price)}
            </span>
            {Number(product.originalPrice) > Number(product.price) && (
              <span className="text-lg text-gray-500 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            {Number(product.discount) > 0 && (
              <Badge variant="discount">-{product.discount}% OFF</Badge>
            )}
          </div>

          <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8 leading-relaxed line-clamp-3">
            {product.description || product.fullDescription}
          </p>

          {Array.isArray(product.colors) && product.colors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">
                Color: <span className="text-gray-300">{selectedColor}</span>
              </h3>
              <div className="flex gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color}
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

          <div className="mb-6 sm:mb-8">
            <h3 className="text-sm font-medium mb-3">Quantity:</h3>
            <div className="flex items-center gap-4">
              <QuantitySelector
                quantity={quantity}
                setQuantity={setQuantity}
                min={1}
                max={Math.max(1, Number(product.stock) || 99)}
              />
              <div
                className={`text-sm font-medium ${product.stock > 10 ? "text-green-500" : "text-orange-500"}`}
              >
                {product.stock > 10
                  ? `In Stock (${product.stock} available)`
                  : `Low Stock (${product.stock} left)`}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
            <Button
              variant="primary"
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 text-xs sm:text-sm cursor-pointer ${isOutOfStock ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              <ShoppingBag size={20} />{" "}
              {isOutOfStock ? "OUT OF STOCK" : "ADD TO CART"}
            </Button>
            <Button
              variant="secondary"
              className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm cursor-pointer ${isOutOfStock ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={handleBuyNow}
              disabled={isOutOfStock}
            >
              BUY NOW
            </Button>
            <button
              onClick={() => toggleWishlist && toggleWishlist(product)}
              className={`p-3 sm:p-4 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                isWishlisted
                  ? "border-apex-red text-apex-red bg-apex-red/10"
                  : "border-white/20 text-white hover:border-white/50"
              }`}
              aria-label="Wishlist"
            >
              <Heart size={24} fill={isWishlisted ? "currentColor" : "none"} />
            </button>
          </div>

          {/* WhatsApp Order Button */}
          {!isOutOfStock && (
            <button
              onClick={() => {
                const productUrl = `${window.location.origin}/product/${product.slug || slug}`;
                const message = `Hello APEX Store, I want to order:\n\nProduct: ${product.name}\n\nPrice: ${formatPrice(product.price)}\n\nProduct Link: ${productUrl}\n\nPlease confirm availability and delivery details.`;
                const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
                window.open(waUrl, '_blank', 'noopener,noreferrer');
              }}
              className="w-full py-3 sm:py-3.5 rounded-xl uppercase text-xs sm:text-sm font-bold tracking-wider transition-all bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white flex items-center justify-center gap-2 active:scale-[0.98] border border-[#25D366]/20 hover:border-[#25D366] mb-8 cursor-pointer"
            >
              <WhatsAppIcon className="w-5 h-5" />
              WHATSAPP ORDER
            </button>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 border-t border-white/10 pt-6 sm:pt-8">
            <div className="flex items-center gap-3 text-gray-400">
              <Truck size={20} className="text-apex-red" />
              <span className="text-xs sm:text-sm">
                Free shipping over PKR 10,000
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <ShieldCheck size={20} className="text-apex-red" />
              <span className="text-xs sm:text-sm">7-day return policy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-20">
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

        <div className="min-h-[200px] bg-apex-charcoal rounded-xl p-4 sm:p-6 border border-white/5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "description" && (
                <div className="text-gray-300 leading-relaxed whitespace-pre-line space-y-3">
                  <p>
                    {product.description ||
                      product.fullDescription ||
                      product.full_description ||
                      "No detailed description available for this product."}
                  </p>
                </div>
              )}
              {activeTab === "features" && (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.isArray(product.features) && product.features.length > 0 ? (
                    product.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-3 text-gray-300"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-apex-red shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))
                  ) : typeof product.features === "string" && product.features.trim() ? (
                    product.features.split('\n').map((s) => s.trim()).filter(Boolean).map((feature, idx) => (
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
      </div>

      {/* Customer Reviews Section */}
      <div id="customer-reviews">
        <ProductReviews 
          productId={product.id} 
          productName={product.name} 
          onReviewsUpdated={async () => {
            const updated = await fetchProductBySlug(slug);
            if (updated) setProduct(updated);
          }}
        />
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <ProductCarousel
            products={relatedProducts}
            title="YOU MAY ALSO"
            highlightTitle="LIKE"
          />
        </div>
      )}
    </motion.div>
  );
}
