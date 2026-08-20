import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  Search,
  ShoppingBag,
  Calendar,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  User,
  MapPin,
  Phone,
  ChevronDown,
  Eye,
  DollarSign,
  TrendingUp,
  RotateCcw,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  fetchMyOrders,
  fetchOrderByVerification,
  getCurrentUserId,
  fetchCustomerReturns,
  fetchReturnSettings,
  checkOrderItemReturnEligibility,
} from "../services/api";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { formatPrice } from "../utils/helpers";
import ReturnRequestModal from "../components/returns/ReturnRequestModal";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [returnSettings, setReturnSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchOrderNumber, setSearchOrderNumber] = useState("");
  const [searchVerification, setSearchVerification] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'active', 'past'
  const [searchedOrder, setSearchedOrder] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isAuthUser, setIsAuthUser] = useState(false);
  const [modalItemData, setModalItemData] = useState(null);

  const loadOrders = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const uid = await getCurrentUserId();
      setIsAuthUser(Boolean(uid));
      const [myOrders, customerReturns, settings] = await Promise.all([
        fetchMyOrders(),
        fetchCustomerReturns(),
        fetchReturnSettings(),
      ]);
      setOrders(myOrders || []);
      setReturns(customerReturns || []);
      setReturnSettings(settings);

      if (searchedOrder?.order_number) {
        const fresh = await fetchOrderByVerification({
          orderNumber: searchedOrder.order_number,
          token: searchVerification.trim(),
          phoneOrEmail: searchVerification.trim(),
        });
        if (fresh) setSearchedOrder(fresh);
      }
    } catch (err) {
      console.warn("Orders loading error:", err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(true);

    const handleFocus = () => {
      loadOrders(false);
    };
    window.addEventListener("focus", handleFocus);

    let channel = null;
    if (isSupabaseConfigured) {
      try {
        channel = supabase
          .channel("realtime-customer-orders-sync")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "orders" },
            (payload) => {
              console.log("[Supabase Realtime] Order update:", payload);
              loadOrders(false);
            }
          )
          .subscribe();
      } catch (err) {
        console.warn("Realtime subscription setup warning:", err);
      }
    }

    const interval = setInterval(() => {
      loadOrders(false);
    }, 15000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    const cleanNum = searchOrderNumber.trim().toUpperCase();
    if (!cleanNum) {
      setSearchError("Please enter an Order Number (e.g. APEX-8922).");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    try {
      const verifiedOrder = await fetchOrderByVerification({
        orderNumber: cleanNum,
        token: searchVerification.trim(),
        phoneOrEmail: searchVerification.trim(),
      });

      if (verifiedOrder) {
        setSearchedOrder(verifiedOrder);
      } else {
        setSearchedOrder(null);
        setSearchError(
          `Order "${cleanNum}" not found or unauthorized. For guest order lookups, please provide your registered phone number, email, or guest token.`,
        );
      }
    } catch (err) {
      setSearchError("Error verifying order. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchOrderNumber("");
    setSearchVerification("");
    setSearchedOrder(null);
    setSearchError("");
    loadOrders();
  };

  const scrollToOrderDetail = (orderId) => {
    const el = document.getElementById(`order-detail-${orderId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-apex-red");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-apex-red");
      }, 2500);
    }
  };

  const getOrderItems = (order) => {
    if (!order) return [];
    if (Array.isArray(order.items)) return order.items;
    if (typeof order.items === "string") {
      try {
        return JSON.parse(order.items);
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  // Filter Active vs Past Orders
  const activeOrders = orders.filter((o) => {
    const s = (o.status || "Pending").toLowerCase();
    return (
      s === "pending" ||
      s === "processing" ||
      s === "shipped" ||
      s === "in transit"
    );
  });

  const pastOrders = orders.filter((o) => {
    const s = (o.status || "").toLowerCase();
    return (
      s === "delivered" ||
      s === "completed" ||
      s === "cancelled" ||
      s === "refunded"
    );
  });

  const totalSpend = orders.reduce(
    (sum, o) =>
      sum + (o.status !== "Cancelled" ? Number(o.total || 0) : 0),
    0,
  );
  const activeCount = activeOrders.length;
  const completedCount = pastOrders.filter(
    (o) =>
      (o.status || "").toLowerCase() === "delivered" ||
      (o.status || "").toLowerCase() === "completed",
  ).length;

  const displayedOrders = searchedOrder
    ? [searchedOrder]
    : activeTab === "active"
      ? activeOrders
      : activeTab === "past"
        ? pastOrders
        : orders;

  const getStatusBadge = (status = "Pending") => {
    const s = status.toLowerCase();
    if (s === "delivered" || s === "completed") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
        </span>
      );
    }
    if (s === "shipped" || s === "in transit") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 whitespace-nowrap">
          <Truck className="w-3.5 h-3.5 animate-bounce" /> In Transit
        </span>
      );
    }
    if (s === "processing") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing
        </span>
      );
    }
    if (s === "cancelled" || s === "refunded") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 whitespace-nowrap">
          <AlertCircle className="w-3.5 h-3.5" /> Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5" /> Order Placed (Pending)
      </span>
    );
  };

  const getTimelineStep = (status = "Pending") => {
    const s = status.toLowerCase();
    if (s === "cancelled" || s === "refunded") return -1;
    if (s === "delivered" || s === "completed") return 4;
    if (s === "shipped" || s === "in transit") return 3;
    if (s === "processing") return 2;
    return 1;
  };

  return (
    <div className="min-h-screen bg-apex-black text-white py-12 px-4 md:px-8 max-w-7xl mx-auto mt-24">
      {/* Page Header */}
      <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-apex-red/15 text-apex-red text-xs font-bold uppercase tracking-wider mb-3 border border-apex-red/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Private Customer Order Summary
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-wider text-white">
            My <span className="text-apex-red">Orders & Summary</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base mt-2 max-w-xl">
            {isAuthUser
              ? "Viewing purchases and delivery tracking linked to your account."
              : "Viewing purchases and tracking for orders placed from this device."}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <button
            onClick={() => loadOrders(true)}
            title="Fetch latest status from database"
            className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-apex-red" : "text-gray-400"}`} />
            <span>Live Sync</span>
          </button>

          <Link
            to="/shop"
            className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.3)]"
          >
            <ShoppingBag className="w-4 h-4" /> Shop New Items
          </Link>
        </div>
      </div>

      {/* Secure Order Tracking Lookup Box */}
      <div className="mb-10 p-5 md:p-6 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-apex-red" />
            Track Specific Order
          </span>
          <span className="text-[11px] text-gray-500">
            Secure 2-Factor Verification
          </span>
        </div>

        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3"
        >
          <div className="sm:col-span-6 relative">
            <input
              type="text"
              value={searchOrderNumber}
              onChange={(e) => setSearchOrderNumber(e.target.value)}
              placeholder="Order # (e.g. APEX-8922) *"
              required
              className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-apex-red focus:outline-none transition-colors"
            />
          </div>

          <div className="sm:col-span-4 relative">
            <input
              type="text"
              value={searchVerification}
              onChange={(e) => setSearchVerification(e.target.value)}
              placeholder="Phone, Email, or Guest Token"
              className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-apex-red focus:outline-none transition-colors"
            />
          </div>

          <div className="sm:col-span-2 flex gap-2">
            <button
              type="submit"
              disabled={isSearching}
              className="btn-primary flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              {isSearching ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Track
            </button>
            {(searchOrderNumber || searchedOrder) && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-3 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </form>

        {searchError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {/* Summary KPI Cards Overview */}
      {!loading && orders.length > 0 && !searchedOrder && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 sm:p-5 bg-[#0a0a0a] border border-white/10 rounded-2xl flex flex-col justify-between shadow-lg">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Total Orders
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white">{orders.length}</div>
            <span className="text-[11px] text-gray-500 mt-1">Purchases recorded</span>
          </div>

          <div className="p-4 sm:p-5 bg-[#0a0a0a] border border-white/10 rounded-2xl flex flex-col justify-between shadow-lg">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Total Amount
            </span>
            <div className="text-2xl sm:text-3xl font-black text-apex-red font-mono">
              {formatPrice(totalSpend)}
            </div>
            <span className="text-[11px] text-gray-500 mt-1">Combined total</span>
          </div>

          <div className="p-4 sm:p-5 bg-[#0a0a0a] border border-white/10 rounded-2xl flex flex-col justify-between shadow-lg">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Active / In-Transit
            </span>
            <div className="text-2xl sm:text-3xl font-black text-purple-400">
              {activeCount}
            </div>
            <span className="text-[11px] text-gray-500 mt-1">Under fulfillment</span>
          </div>

          <div className="p-4 sm:p-5 bg-[#0a0a0a] border border-white/10 rounded-2xl flex flex-col justify-between shadow-lg">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Delivered
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">
              {completedCount}
            </div>
            <span className="text-[11px] text-gray-500 mt-1">Completed shipments</span>
          </div>
        </div>
      )}

      {/* --- RECENT ORDERS SUMMARY LIST SECTION --- */}
      {!loading && orders.length > 0 && !searchedOrder && (
        <div className="mb-12 bg-[#0c0c0c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 sm:p-6 bg-[#111] border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-apex-red" />
                <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                  Recent Orders Summary List
                </h3>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Quick itemized summary of your purchases with instant tracking jump.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-gray-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 self-start sm:self-auto">
              {displayedOrders.length} {displayedOrders.length === 1 ? "Order" : "Orders"}
            </span>
          </div>

          {/* Table on Desktop / Card List on Mobile */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#141414] text-xs uppercase tracking-wider text-gray-400 border-b border-white/5">
                <tr>
                  <th className="py-3.5 px-5">Order #</th>
                  <th className="py-3.5 px-5">Date</th>
                  <th className="py-3.5 px-5">Items Summary</th>
                  <th className="py-3.5 px-5">Total Paid</th>
                  <th className="py-3.5 px-5">Payment</th>
                  <th className="py-3.5 px-5">Live Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayedOrders.map((order) => {
                  const items = getOrderItems(order);
                  const firstItem = items[0];
                  const itemCount = items.reduce(
                    (acc, it) => acc + (Number(it.quantity) || 1),
                    0,
                  );
                  const formattedDate = order.created_at
                    ? new Date(order.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Recently";

                  return (
                    <tr
                      key={`summary-${order.id || order.order_number}`}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-4 px-5 font-mono font-bold text-white whitespace-nowrap">
                        #{order.order_number || `APEX-${order.id}`}
                      </td>
                      <td className="py-4 px-5 text-xs text-gray-400 whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="py-4 px-5 max-w-xs">
                        <div className="font-medium text-white truncate text-xs sm:text-sm">
                          {firstItem?.name || firstItem?.product_name || "APEX Tech Product"}
                          {items.length > 1 && (
                            <span className="ml-1.5 text-xs text-gray-500 font-normal">
                              +{items.length - 1} more
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-500">
                          {itemCount} {itemCount === 1 ? "item" : "items"} total
                        </span>
                      </td>
                      <td className="py-4 px-5 font-mono font-bold text-apex-red whitespace-nowrap">
                        {formatPrice(order.total)}
                      </td>
                      <td className="py-4 px-5 text-xs text-gray-400 uppercase font-semibold whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">
                          {order.payment_method === "cod"
                            ? "COD"
                            : order.payment_method || "COD"}
                        </span>
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <button
                          onClick={() =>
                            scrollToOrderDetail(
                              order.order_number || order.id,
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-apex-red hover:text-white text-gray-300 rounded-lg text-xs font-bold transition-all cursor-pointer border border-white/10"
                        >
                          <span>Track Order</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filter Tabs (Only shown when not displaying an explicit search result) */}
      {!searchedOrder && (
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 mb-8 border-b border-white/10">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-apex-red text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              All Orders ({orders.length})
            </button>

            <button
              onClick={() => setActiveTab("active")}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "active"
                  ? "bg-apex-red text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              Active & In Transit ({activeOrders.length})
            </button>

            <button
              onClick={() => setActiveTab("past")}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "past"
                  ? "bg-apex-red text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              Delivered & Past ({pastOrders.length})
            </button>
          </div>

          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Detailed Order Tracking & Invoices
          </h2>
        </div>
      )}

      {/* Orders List Content */}
      {loading ? (
        <div className="p-20 text-center bg-[#0a0a0a] rounded-2xl border border-white/5">
          <div className="w-8 h-8 border-4 border-apex-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">
            Loading your private orders...
          </p>
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="p-16 text-center bg-[#0a0a0a] rounded-2xl border border-white/5 flex flex-col items-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-500">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold uppercase tracking-wider text-white mb-2">
            No Orders Found
          </h3>
          <p className="text-gray-400 text-sm max-w-md mb-6 leading-relaxed">
            {activeTab === "active"
              ? "You have no active orders in transit."
              : "No orders are associated with your session. If you placed an order as a guest on another device, use the Track Order tool above with your Order Number and phone/email."}
          </p>
          <Link
            to="/shop"
            className="btn-primary px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-wider"
          >
            Explore All Products
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedOrders.map((order) => {
            const step = getTimelineStep(order.status);
            const formattedDate = order.created_at
              ? new Date(order.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Recently Placed";

            const whatsappMessage = encodeURIComponent(
              `Hello APEX Store Support! I am checking on my Order #${order.order_number || order.id}.`,
            );

            return (
              <motion.div
                key={order.id || order.order_number}
                id={`order-detail-${order.order_number || order.id}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0c0c0c] rounded-2xl border border-white/10 overflow-hidden shadow-2xl transition-all hover:border-white/20 scroll-mt-32"
              >
                {/* Order Top Header */}
                <div className="p-5 sm:p-6 bg-[#111] border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-base sm:text-lg font-black text-white tracking-wider">
                      #{order.order_number || `APEX-${order.id}`}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formattedDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Live Progress Tracker (if not cancelled) */}
                {step !== -1 && (
                  <div className="p-6 bg-[#080808] border-b border-white/5">
                    <div className="max-w-3xl mx-auto">
                      <div className="grid grid-cols-4 relative">
                        {/* Connecting Line */}
                        <div className="absolute top-4 left-6 right-6 h-0.5 bg-white/10 -z-0" />
                        <div
                          className="absolute top-4 left-6 h-0.5 bg-apex-red transition-all duration-500 -z-0"
                          style={{
                            width:
                              step === 1
                                ? "10%"
                                : step === 2
                                  ? "40%"
                                  : step === 3
                                    ? "75%"
                                    : "96%",
                          }}
                        />

                        {/* Step 1 */}
                        <div className="flex flex-col items-center text-center relative z-10">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              step >= 1
                                ? "bg-apex-red text-white shadow-[0_0_12px_rgba(220,38,38,0.6)]"
                                : "bg-[#1a1a1a] text-gray-500 border border-white/10"
                            }`}
                          >
                            1
                          </div>
                          <span className="text-[11px] sm:text-xs font-bold uppercase mt-2 text-white">
                            Placed
                          </span>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col items-center text-center relative z-10">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              step >= 2
                                ? "bg-apex-red text-white shadow-[0_0_12px_rgba(220,38,38,0.6)]"
                                : "bg-[#1a1a1a] text-gray-500 border border-white/10"
                            }`}
                          >
                            2
                          </div>
                          <span className="text-[11px] sm:text-xs font-bold uppercase mt-2 text-gray-300">
                            Processing
                          </span>
                        </div>

                        {/* Step 3 */}
                        <div className="flex flex-col items-center text-center relative z-10">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              step >= 3
                                ? "bg-apex-red text-white shadow-[0_0_12px_rgba(220,38,38,0.6)]"
                                : "bg-[#1a1a1a] text-gray-500 border border-white/10"
                            }`}
                          >
                            3
                          </div>
                          <span className="text-[11px] sm:text-xs font-bold uppercase mt-2 text-gray-300">
                            In Transit
                          </span>
                        </div>

                        {/* Step 4 */}
                        <div className="flex flex-col items-center text-center relative z-10">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              step >= 4
                                ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                                : "bg-[#1a1a1a] text-gray-500 border border-white/10"
                            }`}
                          >
                            4
                          </div>
                          <span className="text-[11px] sm:text-xs font-bold uppercase mt-2 text-gray-300">
                            Delivered
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Order Details Grid */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Itemized Product List */}
                  <div className="lg:col-span-7 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                      Ordered Items (
                      {Array.isArray(order.items) ? order.items.length : 1})
                    </h4>

                    <div className="space-y-3 divide-y divide-white/5">
                      {Array.isArray(order.items) && order.items.length > 0 ? (
                        order.items.map((item, idx) => {
                          const isDelivered = String(order.status || '').toLowerCase() === 'delivered';
                          const eligibility = checkOrderItemReturnEligibility(order, item, returns, returnSettings || undefined);

                          return (
                            <div
                              key={idx}
                              className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-black rounded-lg border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      alt={item.name || item.product_name}
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <Package className="w-6 h-6 text-gray-600" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-white leading-tight">
                                    {item.name ||
                                      item.product_name ||
                                      "APEX Tech Product"}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Qty: {item.quantity} ×{" "}
                                    {formatPrice(item.price)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end gap-3">
                                <div className="text-sm font-bold text-white text-right font-mono">
                                  {formatPrice(
                                    (item.price || 0) * (item.quantity || 1),
                                  )}
                                </div>

                                {isDelivered && (
                                  <div>
                                    {eligibility.isEligible ? (
                                      <button
                                        type="button"
                                        onClick={() => setModalItemData({ order, item })}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-apex-red/15 hover:bg-apex-red text-white border border-apex-red/30 transition-all cursor-pointer shadow-[0_0_12px_rgba(220,38,38,0.2)]"
                                      >
                                        <RotateCcw className="w-3 h-3 text-apex-red" />
                                        <span>Return / Exchange</span>
                                      </button>
                                    ) : eligibility.alreadyReturnedQty > 0 ? (
                                      <Link
                                        to="/account/returns"
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-colors"
                                      >
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>Return Requested</span>
                                      </Link>
                                    ) : eligibility.isExpired ? (
                                      <span className="text-[10px] text-gray-500 italic">
                                        Return expired
                                      </span>
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-300">
                            Standard APEX Tech Package
                          </span>
                          <span className="text-sm font-bold text-white font-mono">
                            {formatPrice(order.total)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Customer Info & Cost Breakdown */}
                  <div className="lg:col-span-5 bg-[#141414] rounded-xl p-5 border border-white/5 flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                        Shipping & Payment Info
                      </h4>
                      <div className="space-y-2 text-xs text-gray-300">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-apex-red shrink-0" />
                          <span className="font-semibold text-white">
                            {order.customer_name || "Customer"}
                          </span>
                        </div>
                        {order.customer_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-apex-red shrink-0" />
                            <span>{order.customer_phone}</span>
                          </div>
                        )}
                        {order.shipping_address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-apex-red shrink-0 mt-0.5" />
                            <span className="line-clamp-2">
                              {order.shipping_address},{" "}
                              {order.city || "Pakistan"}
                            </span>
                          </div>
                        )}
                        <div className="pt-2 text-gray-400">
                          Payment:{" "}
                          <span className="font-bold text-white uppercase">
                            {order.payment_method === "cod"
                              ? "Cash on Delivery"
                              : order.payment_method || "Cash on Delivery"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="pt-4 border-t border-white/10 space-y-1.5 text-xs">
                      <div className="flex justify-between text-gray-400">
                        <span>Subtotal:</span>
                        <span>
                          {formatPrice(order.subtotal || order.total)}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Shipping:</span>
                        <span>
                          {order.shipping === 0
                            ? "FREE"
                            : formatPrice(order.shipping || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-white/5">
                        <span>Total Paid:</span>
                        <span className="text-apex-red font-mono text-base">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 flex items-center gap-2">
                      <a
                        href={`https://wa.me/923238249692?text=${whatsappMessage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                        Support
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Return Request Modal */}
      {modalItemData && (
        <ReturnRequestModal
          isOpen={Boolean(modalItemData)}
          onClose={() => setModalItemData(null)}
          order={modalItemData.order}
          item={modalItemData.item}
          existingReturns={returns}
          onReturnSubmitted={() => {
            loadOrders(false);
          }}
        />
      )}
    </div>
  );
}
