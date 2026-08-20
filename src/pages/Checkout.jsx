import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, MapPin, ShieldCheck, UserCheck, ArrowRight, Package } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../utils/helpers";
import { createOrder } from "../services/api";
import Button from "../components/ui/Button";

export default function Checkout() {
  const { cartItems, subtotal, shipping, total, clearCart } = useCart();
  const { user, profile, addresses } = useAuth();
  const navigate = useNavigate();

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
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Auto-populate when user or profile is available
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

  useEffect(() => {
    if (cartItems.length === 0 && !isPlaced) {
      navigate("/cart");
    }
  }, [cartItems.length, isPlaced, navigate]);

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
    if (validate()) {
      const orderPayload = {
        customer_name: formData.fullName,
        customer_email: formData.email,
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
    }
  };

  if (isPlaced) {
    const orderItems = placedOrder?.items || [];
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-[75vh] flex flex-col items-center justify-center p-4 text-center max-w-2xl mx-auto py-16 mt-24 sm:mt-24"
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
          <Button
            onClick={() => navigate("/orders")}
            variant="primary"
            className="px-6 py-3 text-xs uppercase font-bold tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.4)]"
          >
            TRACK THIS ORDER
          </Button>

          {user && (
            <Button
              onClick={() => navigate("/account/orders")}
              variant="outline"
              className="px-6 py-3 text-xs uppercase font-bold tracking-wider border-apex-red/40 text-apex-red hover:bg-apex-red hover:text-white"
            >
              VIEW IN MY ORDERS
            </Button>
          )}

          <Button
            onClick={() => navigate("/shop")}
            variant="outline"
            className="px-6 py-3 text-xs uppercase font-bold tracking-wider border-white/10 text-gray-300 hover:text-white"
          >
            CONTINUE SHOPPING
          </Button>
        </div>
      </motion.div>
    );
  }

  const inputClasses =
    "w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-sm text-white placeholder-gray-500 focus:border-apex-red transition-colors outline-none";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-[#050505] text-white py-10 sm:py-16 md:py-20 px-4 md:px-8 max-w-7xl mx-auto mt-16"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
            Secure <span className="text-apex-red">Checkout</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Fast dispatch across Pakistan with 7-Day inspection warranty.
          </p>
        </div>

        {user ? (
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs text-emerald-400 font-bold">
            <UserCheck size={14} /> Signed in as {user.email}
          </div>
        ) : (
          <div className="text-xs text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-apex-red font-bold hover:underline">
              Sign In
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Saved Addresses Picker for Logged In Customer */}
            {user && addresses.length > 0 && (
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
                    <div
                      key={addr.id}
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
                    </div>
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
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={inputClasses}
                    >
                      <option value="Lahore">Lahore</option>
                      <option value="Karachi">Karachi</option>
                      <option value="Islamabad">Islamabad</option>
                      <option value="Rawalpindi">Rawalpindi</option>
                      <option value="Faisalabad">Faisalabad</option>
                      <option value="Multan">Multan</option>
                      <option value="Peshawar">Peshawar</option>
                      <option value="Quetta">Quetta</option>
                      <option value="Sialkot">Sialkot</option>
                      <option value="Gujranwala">Gujranwala</option>
                      <option value="Other">Other City</option>
                    </select>
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
                      placeholder="e.g. 54000"
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
                <label className="flex items-start p-4 border border-apex-red rounded-xl bg-apex-red/5 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={formData.paymentMethod === "cod"}
                    onChange={handleChange}
                    className="mt-1 text-apex-red focus:ring-apex-red bg-transparent accent-apex-red"
                  />
                  <div className="ml-3">
                    <span className="block font-bold text-white text-sm">
                      Cash on Delivery (COD)
                    </span>
                    <span className="block text-xs text-gray-400 mt-0.5">
                      Pay cash to the courier upon safe package delivery.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.4)]"
            >
              PLACE ORDER ({formatPrice(total)})
            </Button>
          </form>
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-5">
          <div className="bg-[#0a0a0a] rounded-3xl border border-white/10 p-6 sticky top-24 shadow-2xl">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider mb-4 pb-3 border-b border-white/10">
              Order Summary
            </h2>

            <div className="space-y-3 mb-6 max-h-[360px] overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-[#111] p-3 rounded-xl border border-white/5">
                  <div className="relative flex-shrink-0 w-12 h-12 rounded-lg bg-[#1a1a1a] overflow-hidden border border-white/10">
                    <img
                      src={item.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute -top-1 -right-1 bg-apex-red text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                  <div className="text-xs font-mono font-bold text-white shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-4 space-y-2.5 text-xs text-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal</span>
                <span className="font-medium font-mono">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Shipping</span>
                <span className="font-medium font-mono">
                  {shipping === 0 ? "Free" : formatPrice(shipping)}
                </span>
              </div>
            </div>

            <div className="border-t border-white/10 mt-4 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-wider text-white">Total</span>
                <span className="text-xl sm:text-2xl font-black text-apex-red font-mono">
                  {formatPrice(total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
