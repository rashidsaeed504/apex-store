import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle2, Clock, ExternalLink, Star, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchMyOrders } from '../../services/api';
import { formatPrice } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';

export default function AccountOrders() {
  const { user } = useAuth();
  const { error: toastError } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchMyOrders();
      setOrders(data || []);
    } catch (err) {
      console.warn('Failed to load orders:', err);
      toastError('Failed to fetch your orders. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "My Orders | APEX Store";
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    // Status Filter
    if (activeFilter === 'delivered' && o.status !== 'Delivered') return false;
    if (activeFilter === 'active' && ['Delivered', 'Cancelled', 'Refunded'].includes(o.status)) return false;
    if (activeFilter === 'cancelled' && o.status !== 'Cancelled') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const numMatch = (o.order_number || '').toLowerCase().includes(q);
      const items = Array.isArray(o.items) ? o.items : typeof o.items === 'string' ? JSON.parse(o.items) : [];
      const itemMatch = items.some((it) => (it.name || '').toLowerCase().includes(q));
      if (!numMatch && !itemMatch) return false;
    }

    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'In Transit':
      case 'Shipped':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'Processing':
      case 'Confirmed':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Cancelled':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      default:
        return 'bg-white/10 text-gray-300 border-white/10';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#0D0D0D] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-apex-red/10 border border-apex-red/20 text-apex-red flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black uppercase tracking-tight text-white leading-tight">
                MY <span className="text-apex-red">ORDERS</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                Track real-time shipment status and review past purchases.
              </p>
            </div>
          </div>

          <button
            onClick={loadOrders}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: `All (${orders.length})` },
              { id: 'active', label: 'In-Transit' },
              { id: 'delivered', label: 'Delivered' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-apex-red text-white shadow-[0_0_15px_rgba(220,38,38,0.35)]'
                    : 'bg-[#121212] text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order # or product..."
              className="w-full sm:w-60 h-10 sm:h-9 bg-[#121212] border border-white/10 rounded-xl pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:border-apex-red outline-none"
            />
          </div>
        </div>
      </motion.div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-36 sm:h-44 bg-[#0D0D0D] border border-white/5 rounded-2xl sm:rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl sm:rounded-3xl p-8 sm:p-10 text-center">
          <Package className="w-10 h-10 text-gray-600 mx-auto mb-2.5" />
          <h3 className="text-sm font-bold uppercase text-white mb-1">
            {searchQuery || activeFilter !== 'all' ? 'No Matching Orders' : 'No Orders Found'}
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mb-5">
            {searchQuery || activeFilter !== 'all'
              ? 'Try changing your filter settings or search keywords.'
              : 'You have not placed any orders with this account yet.'}
          </p>
          <Link
            to="/shop"
            className="btn-primary inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
          >
            Explore Catalog
          </Link>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredOrders.map((order) => {
            const items = Array.isArray(order.items)
              ? order.items
              : typeof order.items === 'string'
              ? JSON.parse(order.items)
              : [];
            const dateStr = order.created_at
              ? new Date(order.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recent';

            return (
              <motion.div
                key={order.id || order.order_number}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0D0D0D] border border-white/10 hover:border-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-md transition-all"
              >
                {/* Top Card Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-white/10 gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className="font-mono font-black text-sm sm:text-base text-white">
                      #{order.order_number}
                    </span>
                    <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(order.status)}`}>
                      {order.status || 'Pending'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>Placed on <strong className="text-white">{dateStr}</strong></span>
                  </div>
                </div>

                {/* Items List */}
                <div className="py-3 sm:py-4 space-y-2 sm:space-y-3">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 text-xs text-gray-300 bg-[#121212] p-2.5 sm:p-3 rounded-xl border border-white/5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-apex-red font-bold text-xs shrink-0">
                          {item.quantity}×
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate text-xs sm:text-sm">
                            {item.name}
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-gray-400">
                            {formatPrice(item.price)} each
                          </p>
                        </div>
                      </div>

                      <div className="font-mono font-bold text-xs sm:text-sm text-white shrink-0">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Row: Address, Total & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 sm:pt-4 border-t border-white/10 gap-3">
                  <div className="text-[11px] sm:text-xs text-gray-400 space-y-0.5">
                    <p className="truncate max-w-xs sm:max-w-sm">
                      <strong className="text-gray-300">Ship to:</strong> {order.shipping_address}, {order.city}
                    </p>
                    <p>
                      <strong className="text-gray-300">Payment:</strong> {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Direct Payment'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[9px] uppercase text-gray-500 font-bold block">Total Amount</span>
                      <span className="font-mono font-black text-sm sm:text-base text-apex-red">
                        {formatPrice(order.total)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button
                        onClick={() => navigate('/orders')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors cursor-pointer"
                      >
                        Track <ExternalLink className="w-3 h-3" />
                      </button>

                      {order.status === 'Delivered' && (
                        <Link
                          to="/account/reviews"
                          className="inline-flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
                        >
                          <Star className="w-3 h-3 fill-amber-400" /> Review
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
