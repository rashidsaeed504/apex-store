import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  Star,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  User,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fetchMyOrders } from "../../services/api";
import { formatPrice, safeParseItems } from "../../utils/helpers";

export default function AccountDashboard() {
  const { user, profile, addresses } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Account Dashboard | APEX Store";
    async function loadOrders() {
      setLoading(true);
      try {
        const data = await fetchMyOrders();
        setOrders(data || []);
      } catch (err) {
        console.warn("Failed to load dashboard orders:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const totalOrders = orders.length;
  const inTransitOrders = orders.filter((o) =>
    ["Processing", "In Transit", "Pending", "Confirmed", "Shipped"].includes(
      o.status,
    ),
  ).length;
  const deliveredOrders = orders.filter((o) => o.status === "Delivered").length;
  const totalSpent = orders.reduce(
    (sum, o) => sum + (o.status !== "Cancelled" ? Number(o.total || 0) : 0),
    0,
  );

  const recentOrders = orders.slice(0, 3);
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];

  const getStatusBadge = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "In Transit":
      case "Shipped":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "Processing":
      case "Confirmed":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "Cancelled":
        return "bg-red-500/15 text-red-400 border-red-500/30";
      default:
        return "bg-white/10 text-gray-300 border-white/10";
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Account Summary Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4"
      >
        {/* Total Orders */}
        <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Orders
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-apex-red/10 border border-apex-red/20 text-apex-red flex items-center justify-center shrink-0">
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <span className="text-xl sm:text-3xl font-black text-white font-mono leading-none">
            {loading ? "-" : totalOrders}
          </span>
          <p className="text-[10px] text-gray-500 mt-1 truncate">
            Lifetime purchases
          </p>
        </div>

        {/* Active / In Transit */}
        <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-400">
              In Transit
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <span className="text-xl sm:text-3xl font-black text-white font-mono leading-none">
            {loading ? "-" : inTransitOrders}
          </span>
          <p className="text-[10px] text-gray-500 mt-1 truncate">
            Active shipments
          </p>
        </div>

        {/* Delivered */}
        <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Delivered
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <span className="text-xl sm:text-3xl font-black text-white font-mono leading-none">
            {loading ? "-" : deliveredOrders}
          </span>
          <p className="text-[10px] text-gray-500 mt-1 truncate">Completed</p>
        </div>

        {/* Total Spent */}
        <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Spent
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <span className="text-base sm:text-2xl font-black text-apex-red font-mono truncate block leading-none">
            {loading ? "-" : formatPrice(totalSpent)}
          </span>
          <p className="text-[10px] text-gray-500 mt-1 truncate">
            Verified total
          </p>
        </div>
      </motion.div>

      {/* 2. Recent Orders Section Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-[#0D0D0D] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8"
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-base sm:text-xl font-black uppercase tracking-tight text-white">
              Recent <span className="text-apex-red">Orders</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
              Live status and tracking for your latest purchases.
            </p>
          </div>
          <Link
            to="/account/orders"
            className="text-xs font-bold uppercase tracking-wider text-apex-red hover:text-white transition-colors flex items-center gap-1 shrink-0"
          >
            All ({totalOrders}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-20 bg-white/5 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-8 bg-[#121212] rounded-2xl border border-white/5 p-5">
            <Package className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <h3 className="text-xs font-bold uppercase text-white mb-1">
              No Orders Yet
            </h3>
            <p className="text-[11px] text-gray-400 max-w-sm mx-auto mb-4">
              Explore the APEX catalog to discover high-performance audio, smart
              wearables, and gaming gear.
            </p>
            <Link
              to="/shop"
              className="btn-primary inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {recentOrders.map((order) => {
              if (!order) return null;
              const items = safeParseItems(order.items);
              const dateStr = order.created_at
                ? new Date(order.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Recent";

              return (
                <div
                  key={order.id || order.order_number}
                  className="bg-[#121212] border border-white/5 hover:border-white/15 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-xs sm:text-sm text-white">
                        #{order.order_number || String(order.id || 'N/A')}
                      </span>
                      <span
                        className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(order.status)}`}
                      >
                        {order.status || "Pending"}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      {items.length} item{items.length === 1 ? "" : "s"} •{" "}
                      {dateStr}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate max-w-xs sm:max-w-md">
                      {items.map((it) => it?.name || 'Product').join(", ")}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-white/5">
                    <div className="text-left sm:text-right">
                      <span className="text-[9px] uppercase text-gray-500 block">
                        Total
                      </span>
                      <span className="font-mono font-bold text-xs sm:text-sm text-apex-red">
                        {formatPrice(order.total)}
                      </span>
                    </div>

                    <button
                      onClick={() => navigate("/orders")}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-apex-red text-white transition-all cursor-pointer"
                    >
                      Track <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* 3. Quick Actions & Default Address Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Default Shipping Address */}
        <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-apex-red" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                Default Address
              </h3>
            </div>
            <Link
              to="/account/addresses"
              className="text-xs font-semibold text-apex-red hover:underline"
            >
              Manage
            </Link>
          </div>

          {defaultAddress ? (
            <div className="bg-[#121212] border border-white/5 rounded-xl p-3.5 text-xs text-gray-300 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs sm:text-sm">
                  {defaultAddress.fullName}
                </span>
                <span className="bg-apex-red/15 text-apex-red text-[9px] font-bold px-1.5 py-0.5 rounded">
                  Default
                </span>
              </div>
              <p className="text-gray-400 text-[11px]">
                {defaultAddress.phone}
              </p>
              <p className="text-gray-300 text-[11px] line-clamp-2">
                {defaultAddress.address}
              </p>
              <p className="text-gray-400 text-[11px]">
                {defaultAddress.city}, {defaultAddress.province || "Punjab"}{" "}
                {defaultAddress.postalCode}
              </p>
            </div>
          ) : (
            <div className="text-center py-5 bg-[#121212] rounded-xl border border-white/5">
              <p className="text-xs text-gray-400 mb-2.5">
                No saved addresses yet.
              </p>
              <Link
                to="/account/addresses"
                className="btn-primary inline-flex px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase"
              >
                Add Address
              </Link>
            </div>
          )}
        </div>

        {/* Quick Member Actions */}
        <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-2.5">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white mb-2">
            Quick Actions
          </h3>

          <Link
            to="/account/orders"
            className="flex items-center justify-between p-3 bg-[#121212] hover:bg-white/5 border border-white/5 rounded-xl text-xs text-gray-300 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-apex-red shrink-0">
                <Package className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-white text-xs">Order History</p>
                <p className="text-[10px] text-gray-500">
                  Track and view invoices
                </p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
          </Link>

          <Link
            to="/account/returns"
            className="flex items-center justify-between p-3 bg-[#121212] hover:bg-white/5 border border-white/5 rounded-xl text-xs text-gray-300 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-purple-400 shrink-0">
                <RotateCcw className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-white text-xs">Returns & Refunds</p>
                <p className="text-[10px] text-gray-500">Track claim lifecycle</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
          </Link>

          <Link
            to="/account/reviews"
            className="flex items-center justify-between p-3 bg-[#121212] hover:bg-white/5 border border-white/5 rounded-xl text-xs text-gray-300 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-amber-400 shrink-0">
                <Star className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-white text-xs">Product Reviews</p>
                <p className="text-[10px] text-gray-500">Leave buyer reviews</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
          </Link>

          <Link
            to="/account/profile"
            className="flex items-center justify-between p-3 bg-[#121212] hover:bg-white/5 border border-white/5 rounded-xl text-xs text-gray-300 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-blue-400 shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-white text-xs">Profile Settings</p>
                <p className="text-[10px] text-gray-500">Update credentials</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
          </Link>
        </div>
      </div>
    </div>
  );
}
