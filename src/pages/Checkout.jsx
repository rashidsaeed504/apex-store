import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  CheckCircle, 
  MapPin, 
  ShieldCheck, 
  UserCheck, 
  ArrowRight, 
  Package, 
  Lock, 
  Loader2, 
  AlertCircle,
  ShoppingBag,
  ArrowLeft
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatPrice } from "../utils/helpers";
import { createOrder } from "../services/api";
import Button from "../components/ui/Button";

// High-fidelity Google SVG Icon
const GoogleIcon = () => (
  <svg className="w-4 h-4 mr-2.5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export default function Checkout() {
  const { cartItems, subtotal, shipping, total, clearCart } = useCart();
  const { user, profile, addresses, loading: authLoading, signInWithGoogle } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "Lahore",
    postalCode: "54000",
    paymentMethod: "cod",
  });

  const [errors, setErrors] = useState({});
  const [isPlaced, setIsPlaced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Auto-populate when authenticated user or profile becomes available
  useEffect(() => {
    if (user || profile) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        setFormData((prev) => ({
          ...prev,
          fullName: defaultAddr.fullName || profile?.full_name || user?.user_metadata?.full_name || prev.fullName,
          phone: defaultAddr.phone || profile?.phone || user?.user_metadata?.phone || prev.phone,
          email: user?.email || prev.email,
          address: defaultAddr.address || profile?.shipping_address || prev.address,
          city: defaultAddr.city || profile?.city || prev.city,
          postalCode: defaultAddr.postalCode || prev.postalCode,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          fullName: profile?.full_name || user?.user_metadata?.full_name || prev.fullName,
          phone: profile?.phone || user?.user_metadata?.phone || prev.phone,
          email: user?.email || prev.email,
          address: profile?.shipping_address || prev.address,
          city: profile?.city || prev.city,
        }));
      }
    }
  }, [user, profile, addresses]);

  // Redirect to cart if empty and not placed
  useEffect(() => {
    if (cartItems.length === 0 && !isPlaced && !authLoading) {
      navigate("/cart");
    }
  }, [cartItems.length, isPlaced, authLoading, navigate]);

  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setFormData((prev) => ({
      ...prev,
      fullName: addr.fullName,
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      postalCode: addr.postalCode || prev.postalCode,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9+\-\s()]{10,15}$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number format";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.address.trim()) newErrors.address = "Address is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [placedOrder, setPlacedOrder] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toastError("Please sign in to your APEX account to place an order.");
      return;
    }

    if (validate()) {
      setSubmitting(true);
      try {
        const orderPayload = {
          customer_id: user.id,
          user_id: user.id,
          customer_name: formData.fullName,
          customer_email: user.email || formData.email,
          customer_phone: formData.phone,
          shipping_address: formData.address,
          city: formData.city,
          postal_code: formData.postalCode,
          payment_method: formData.paymentMethod,
          subtotal,
          shipping,
          total,
          items: cartItems.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.images?.[0] || '',
          })),
        };

        const created = await createOrder(orderPayload);
        setPlacedOrder(created);
        setIsPlaced(true);
        clearCart();
      } catch (err) {
        console.error("Order creation error:", err);
        toastError(err.message || "Failed to place order. Please try again.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle('/checkout');
    } catch (err) {
      console.warn("Google sign in error at checkout:", err);
      toastError(err.message || "Failed to start Google sign-in.");
      setGoogleLoading(false);
    }
  };

  // =========================================================
  // 1. Loading State
  // =========================================================
  if (authLoading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-4 mt-20">
        <div className="w-12 h-12 rounded-full border-2 border-apex-red border-t-transparent animate-spin mb-4" />
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Verifying customer session...</p>
      </div>
    );
  }

  // =========================================================
  // 2. Unauthenticated Checkout: Require Auth Gateway
  // =========================================================
  if (!user && !authLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 py-16 mt-24 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl"
        >
          {/* Header Icon */}
          <div className="w-16 h-16 bg-apex-red/10 border border-apex-red/20 text-apex-red rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(220,38,38,0.2)]">
            <Lock size={32} />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              Account <span className="text-apex-red">Required</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1.5 leading-relaxed">
              Please sign in or create an APEX account to complete your checkout. Your order and live delivery tracking will be connected to your account.
            </p>
          </div>

          {/* Cart Quick Summary */}
          <div className="p-3.5 bg-[#121212] border border-white/5 rounded-2xl flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-apex-red">
                <ShoppingBag size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider">Cart Total</p>
                <p className="text-[11px] text-gray-400">{cartItems.length} {cartItems.length === 1 ? 'product' : 'products'} in cart</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono font-black text-apex-red text-base sm:text-lg">{formatPrice(total)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {/* 1. Continue with Google */}
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center py-3.5 px-4 bg-white text-gray-900 hover:bg-gray-100 font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin text-gray-900" />
              ) : (
                <GoogleIcon />
              )}
              <span>Continue with Google</span>
            </motion.button>

            {/* 2. Login with Existing Account */}
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={() => {
                try {
                  sessionStorage.setItem('apex_auth_redirect', '/checkout');
                } catch (e) {}
                navigate('/login', { state: { from: '/checkout' } });
              }}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.35)] cursor-pointer"
            >
              <UserCheck size={16} />
              <span>Login to Existing Account</span>
            </motion.button>

            {/* 3. Create Account */}
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={() => {
                try {
                  sessionStorage.setItem('apex_auth_redirect', '/checkout');
                } catch (e) {}
                navigate('/signup', { state: { from: '/checkout' } });
              }}
              className="w-full flex items-center justify-center gap-2 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-300 hover:text-white bg-[#161616] hover:bg-[#202020] border border-white/10 rounded-xl transition-all cursor-pointer"
            >
              <span>Create New Account</span>
            </motion.button>
          </div>

          {/* Return link */}
          <div className="pt-2">
            <Link to="/cart" className="text-xs text-gray-500 hover:text-gray-300 transition-colors inline-flex items-center gap-1">
              <ArrowLeft size={13} /> Back to Shopping Cart
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // =========================================================
  // 3. Order Placed Successfully Screen
  // =========================================================
  if (isPlaced) {
    const orderItems = placedOrder?.items || [];
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-4 text-center max-w-2xl mx-auto py-16 mt-24 sm:mt-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <CheckCircle size={44} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-gray-400 mb-8 text-sm max-w-md">
            Thank you for choosing APEX. Your order has been placed and is now being prepared for shipping.
          </p>

          {/* Itemized Order Confirmation Card */}
          <div className="w-full bg-[#0c0c0c] border border-white/10 rounded-3xl p-6 sm:p-8 mb-8 text-left space-y-4 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-2">
              <div>
                <span className="text-[11px] uppercase text-gray-500 font-bold block">Order Reference</span>
                <span className="font-mono text-lg sm:text-xl font-black text-white">
                  #{placedOrder?.order_number || "APEX-8922"}
                </span>
              </div>
              <div className="sm:text-right">
                <span className="text-[11px] uppercase text-gray-500 font-bold block">Status</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Order Placed (Pending)
                </span>
              </div>
            </div>

            {/* Purchased Items */}
            {orderItems.length > 0 && (
              <div className="py-2 border-b border-white/5 space-y-2">
                <span className="text-[11px] uppercase text-gray-500 font-bold block">Purchased Items</span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {orderItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-gray-300">
                      <span className="truncate pr-2 font-medium">{item.name} × {item.quantity}</span>
                      <span className="font-mono font-bold text-white shrink-0">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery & Payment Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 text-xs text-gray-300">
              <div>
                <span className="text-[11px] uppercase text-gray-500 font-bold block mb-1">Customer & Delivery</span>
                <p className="font-semibold text-white">{formData.fullName}</p>
                <p className="text-gray-400">{formData.phone}</p>
                <p className="text-gray-400 truncate">{formData.address}, {formData.city}</p>
              </div>
              <div>
                <span className="text-[11px] uppercase text-gray-500 font-bold block mb-1">Payment Method</span>
                <p className="font-semibold text-white uppercase">Cash on Delivery (COD)</p>
                <p className="text-gray-400">Pay upon courier inspection & receipt</p>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <span className="text-sm font-bold text-white">Total Amount:</span>
              <span className="text-xl sm:text-2xl font-black text-apex-red font-mono">
                {formatPrice(placedOrder?.total || total)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={() => navigate("/orders")}
              className="btn-primary px-6 py-3 text-xs uppercase font-bold tracking-wider rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] cursor-pointer"
            >
              TRACK THIS ORDER
            </motion.button>

            {user && (
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={() => navigate("/account/orders")}
                className="px-6 py-3 text-xs uppercase font-bold tracking-wider rounded-xl border border-apex-red/40 text-apex-red hover:bg-apex-red hover:text-white transition-all cursor-pointer"
              >
                VIEW IN MY ORDERS
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={() => navigate("/shop")}
              className="px-6 py-3 text-xs uppercase font-bold tracking-wider rounded-xl border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
            >
              CONTINUE SHOPPING
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // =========================================================
  // 4. Authenticated Checkout Form
  // =========================================================
  const inputClasses =
    "w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-sm text-white placeholder-gray-500 focus:border-apex-red transition-colors outline-none";

  return (
    <div className="min-h-screen bg-[#050505] text-white py-10 sm:py-16 md:py-20 px-4 md:px-8 max-w-7xl mx-auto mt-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
            Secure <span className="text-apex-red">Checkout</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Fast dispatch across Pakistan with 7-Day inspection warranty.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs text-emerald-400 font-bold">
          <UserCheck size={14} /> Signed in as {user.email}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: Form */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-7"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Saved Addresses Picker for Logged In Customer */}
            {addresses.length > 0 && (
              <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-4 sm:p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-apex-red" /> Choose From Saved Addresses
                  </span>
                  <Link to="/account/addresses" className="text-xs text-apex-red font-bold hover:underline">
                    Manage Addresses
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addresses.map((addr) => (
                    <motion.div
                      key={addr.id}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      onClick={() => handleSelectSavedAddress(addr)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        selectedAddressId === addr.id
                          ? 'border-apex-red bg-apex-red/10 shadow-[0_0_15px_rgba(220,38,38,0.2)]'
                          : 'border-white/10 bg-[#111] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-white mb-1">
                        <span className="truncate">{addr.fullName}</span>
                        {addr.isDefault && (
                          <span className="text-[9px] bg-apex-red/20 text-apex-red px-1.5 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 truncate">{addr.address}</p>
                      <p className="text-gray-500">{addr.city}, {addr.phone}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Info */}
            <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-4 sm:p-6">
              <h2 className="text-sm sm:text-base font-bold mb-4 uppercase tracking-wider text-white">
                1. Customer Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`${inputClasses} ${errors.fullName ? "border-red-500" : ""}`}
                    placeholder="e.g. Ahmed Khan"
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`${inputClasses} ${errors.phone ? "border-red-500" : ""}`}
                      placeholder="0300 1234567"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`${inputClasses} ${errors.email ? "border-red-500" : ""}`}
                      placeholder="ahmed@example.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-4 sm:p-6">
              <h2 className="text-sm sm:text-base font-bold mb-4 uppercase tracking-wider text-white">
                2. Shipping Address
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Street Address & House/Flat # *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`${inputClasses} ${errors.address ? "border-red-500" : ""}`}
                    placeholder="House/Apt #, Street, Block, Area, Landmark"
                  />
                  {errors.address && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.address}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={inputClasses}
                      placeholder="Lahore, Karachi, Islamabad, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      className={inputClasses}
                      placeholder="54000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-4 sm:p-6">
              <h2 className="text-sm sm:text-base font-bold mb-4 uppercase tracking-wider text-white">
                3. Payment Method
              </h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3.5 bg-[#111] border border-apex-red/40 rounded-xl cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={formData.paymentMethod === "cod"}
                    onChange={handleChange}
                    className="accent-apex-red"
                  />
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Cash on Delivery (COD)</p>
                    <p className="text-[11px] text-gray-400">Pay safely in cash upon package inspection at your doorstep</p>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-apex-red bg-apex-red/10 px-2 py-0.5 rounded border border-apex-red/20">
                    Recommended
                  </span>
                </label>
              </div>
            </div>

            {/* Trust & Guarantee Banner */}
            <div className="bg-[#111] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-apex-red shrink-0" />
              <p className="text-xs text-gray-400">
                <span className="text-white font-bold">APEX Guarantee:</span> 100% Genuine Tech Gear, 7-Day Replacement Warranty, and Secure Fast Courier Dispatch.
              </p>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              disabled={submitting}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl shadow-[0_0_25px_rgba(220,38,38,0.4)] cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Placing Order...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Place Order • {formatPrice(total)}</span>
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Right: Order Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-5"
        >
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-4 sm:p-6 sticky top-24 space-y-6 shadow-xl">
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white border-b border-white/10 pb-3 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs text-gray-400 font-normal">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
              </span>
            </h2>

            {/* Cart Items List */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-2 border-b border-white/5">
                  <div className="w-12 h-12 rounded-xl bg-[#111] border border-white/10 overflow-hidden shrink-0">
                    <img
                      src={item.images?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.name}</p>
                    <p className="text-[11px] text-gray-400">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-xs text-white">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing Calculations */}
            <div className="space-y-2.5 text-xs text-gray-400 pt-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono text-white font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-mono text-white font-medium">
                  {shipping === 0 ? <span className="text-emerald-400 font-bold">FREE</span> : formatPrice(shipping)}
                </span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                <span className="text-sm font-bold text-white uppercase tracking-wider">Total</span>
                <span className="text-xl sm:text-2xl font-black text-apex-red font-mono">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {/* Back to Cart */}
            <div className="pt-2 border-t border-white/5 text-center">
              <Link to="/cart" className="text-xs text-gray-400 hover:text-white transition-colors">
                ← Modify Cart Items
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
