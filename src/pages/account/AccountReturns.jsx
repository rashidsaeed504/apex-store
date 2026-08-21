import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  RefreshCw,
  AlertCircle,
  X,
  Camera,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  ArrowLeft,
  XCircle,
  Video,
  FileVideo,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchCustomerReturns } from '../../services/api';
import { formatPrice, safeParseItems } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';

// Lifecycle status step definitions for visual timeline
const LIFECYCLE_STEPS = [
  { key: 'requested', label: 'Requested', desc: 'Return request submitted' },
  { key: 'approved', label: 'Approved', desc: 'Request authorized by store' },
  { key: 'pickup_scheduled', label: 'Pickup Scheduled', desc: 'Courier dispatch assigned' },
  { key: 'in_transit', label: 'In Transit', desc: 'Package on the way to warehouse' },
  { key: 'received', label: 'Received', desc: 'Parcel arrived at facility' },
  { key: 'inspection', label: 'Inspection', desc: 'Technical quality check' },
  { key: 'refunded', label: 'Completed', desc: 'Refund / Exchange finalized' },
];

const getStatusStepIndex = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'requested') return 0;
  if (s === 'approved') return 1;
  if (s === 'pickup_scheduled') return 2;
  if (s === 'in_transit') return 3;
  if (s === 'received') return 4;
  if (s === 'inspection' || s === 'approved_for_refund' || s === 'refund_processing' || s === 'exchange_processing') return 5;
  if (s === 'refunded' || s === 'exchange_completed') return 6;
  if (s === 'rejected' || s === 'cancelled') return -1;
  return 0;
};

export default function AccountReturns() {
  const { user } = useAuth();
  const { error: toastError } = useToast();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const navigate = useNavigate();

  const loadReturns = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomerReturns();
      setReturns(data || []);
    } catch (err) {
      console.warn('Failed to load returns:', err);
      if (toastError) toastError('Failed to fetch your return requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'My Returns & Refunds | APEX Store';
    loadReturns();

    const handleUpdate = () => loadReturns();
    window.addEventListener('apex_returns_updated', handleUpdate);
    return () => window.removeEventListener('apex_returns_updated', handleUpdate);
  }, []);

  const filteredReturns = (Array.isArray(returns) ? returns : []).filter((r) => {
    if (!r) return false;
    const s = String(r.status || '').toLowerCase();
    if (activeFilter === 'active' && ['refunded', 'exchange_completed', 'rejected', 'cancelled'].includes(s)) return false;
    if (activeFilter === 'completed' && !['refunded', 'exchange_completed'].includes(s)) return false;
    if (activeFilter === 'rejected' && !['rejected', 'cancelled'].includes(s)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const numMatch = String(r.return_number || '').toLowerCase().includes(q);
      const orderMatch = String(r.order_number || '').toLowerCase().includes(q);
      const items = safeParseItems(r.items);
      const itemMatch = items.some((it) => (it?.name || '').toLowerCase().includes(q));
      if (!numMatch && !orderMatch && !itemMatch) return false;
    }

    return true;
  });

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'refunded':
      case 'exchange_completed':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'approved':
      case 'pickup_scheduled':
      case 'in_transit':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'inspection':
      case 'received':
      case 'refund_processing':
      case 'exchange_processing':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'requested':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'rejected':
      case 'cancelled':
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
            <div className="w-10 h-10 rounded-xl bg-apex-red/10 border border-apex-red/20 text-apex-red flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(220,38,38,0.25)]">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black uppercase tracking-tight text-white leading-tight">
                MY <span className="text-apex-red">RETURNS & REFUNDS</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                Track return status, pickup logistics, and refund inspection progress.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadReturns}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <Link
              to="/account/orders"
              className="btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(220,38,38,0.35)]"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Orders</span>
            </Link>
          </div>
        </div>

        {/* Filter Pills & Search Box */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: `All (${returns.length})` },
              { id: 'active', label: 'In Progress' },
              { id: 'completed', label: 'Completed / Refunded' },
              { id: 'rejected', label: 'Rejected' },
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

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search return # or product..."
              className="w-full sm:w-60 h-10 sm:h-9 bg-[#121212] border border-white/10 rounded-xl pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:border-apex-red outline-none"
            />
          </div>
        </div>
      </motion.div>

      {/* Returns List */}
      {loading ? (
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-36 sm:h-44 bg-[#0D0D0D] border border-white/5 rounded-2xl sm:rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredReturns.length === 0 ? (
        <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center">
          <RotateCcw className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-sm sm:text-base font-bold uppercase text-white mb-1">
            {searchQuery || activeFilter !== 'all' ? 'No Matching Returns' : 'No Return Requests Found'}
          </h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">
            {searchQuery || activeFilter !== 'all'
              ? 'Try changing your filter settings or search keywords.'
              : 'You have not submitted any return or refund claims yet. You can request a return directly from delivered orders in My Orders.'}
          </p>
          <Link
            to="/account/orders"
            className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.35)]"
          >
            <Package className="w-4 h-4" />
            <span>View My Orders</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredReturns.map((ret) => {
            if (!ret) return null;
            const items = safeParseItems(ret.items);
            const primaryItem = items[0] || {};
            const dateStr = ret.created_at
              ? new Date(ret.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recent';

            return (
              <motion.div
                key={ret.id || ret.return_number}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0D0D0D] border border-white/10 hover:border-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-md transition-all cursor-pointer group"
                onClick={() => setSelectedReturn(ret)}
              >
                {/* Top Card Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-white/10 gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className="font-mono font-black text-sm sm:text-base text-white group-hover:text-apex-red transition-colors">
                      #{ret.return_number}
                    </span>
                    <span className="text-xs text-gray-400">
                      for Order <strong className="text-white font-mono">#{ret.order_number}</strong>
                    </span>
                    <span className={`text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadge(ret.status)}`}>
                      {String(ret.status || 'requested').replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-xs text-gray-400">
                    <span>Requested on <strong className="text-white">{dateStr}</strong></span>
                  </div>
                </div>

                {/* Return Item Row */}
                <div className="py-3 sm:py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#141414] border border-white/10 overflow-hidden shrink-0">
                      <img
                        src={primaryItem.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop'}
                        alt={primaryItem.name || 'Product'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-white truncate">{primaryItem.name || 'APEX Product'}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Qty to Return: <strong className="text-white">{primaryItem.quantity || ret.quantity || 1}</strong> • Reason: <span className="text-gray-300">{ret.reason}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase text-gray-500 font-bold block">
                      {ret.status === 'refunded' ? 'Refunded Amount' : 'Requested Value'}
                    </span>
                    <span className="font-mono font-black text-sm sm:text-base text-apex-red">
                      {formatPrice(ret.final_refund_amount || ret.approved_amount || ret.requested_amount || 0)}
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Actions & Resolution */}
                <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] uppercase font-bold text-gray-300">
                      Resolution: {ret.resolution === 'exchange' ? 'Exchange / Replacement' : 'Refund'}
                    </span>
                    {ret.tracking_number && (
                      <span className="text-[11px] text-blue-400 flex items-center gap-1 font-mono">
                        <Truck className="w-3 h-3" /> {ret.courier_name || 'Courier'}: {ret.tracking_number}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-apex-red font-bold text-xs group-hover:translate-x-1 transition-transform">
                    <span>View Timeline & Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* RETURN DETAILS & STATUS TIMELINE MODAL */}
      {/* ========================================================= */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-3xl bg-[#0d0d0d] border border-white/15 rounded-3xl shadow-2xl overflow-hidden my-6 text-white"
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-[#141414] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-apex-red/15 border border-apex-red/30 flex items-center justify-center text-apex-red shrink-0 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-xl font-black uppercase tracking-tight text-white">
                      Return #{selectedReturn.return_number}
                    </h2>
                    <span className={`text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadge(selectedReturn.status)}`}>
                      {String(selectedReturn.status || '').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Order Reference: <strong className="text-white font-mono">#{selectedReturn.order_number}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedReturn(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* 1. Interactive Step-by-Step Visual Lifecycle Timeline */}
              {selectedReturn.status !== 'rejected' && selectedReturn.status !== 'cancelled' ? (
                <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 sm:p-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-apex-red" /> Return Lifecycle Status Progress
                  </h3>

                  {/* Desktop Step Sequence */}
                  <div className="hidden sm:grid grid-cols-7 gap-2 relative">
                    {LIFECYCLE_STEPS.map((step, idx) => {
                      const currentIdx = getStatusStepIndex(selectedReturn.status);
                      const isComplete = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div key={step.key} className="flex flex-col items-center text-center relative">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border mb-2 transition-all ${
                              isComplete
                                ? 'bg-apex-red text-white border-apex-red shadow-[0_0_12px_rgba(220,38,38,0.5)]'
                                : 'bg-[#1a1a1a] text-gray-500 border-white/10'
                            }`}
                          >
                            {isComplete ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                          <span className={`text-[10px] font-bold uppercase leading-tight ${isCurrent ? 'text-white' : isComplete ? 'text-gray-300' : 'text-gray-500'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mobile Vertical Timeline */}
                  <div className="sm:hidden space-y-3">
                    {LIFECYCLE_STEPS.map((step, idx) => {
                      const currentIdx = getStatusStepIndex(selectedReturn.status);
                      const isComplete = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div key={step.key} className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border shrink-0 ${
                              isComplete
                                ? 'bg-apex-red text-white border-apex-red shadow-sm'
                                : 'bg-[#1a1a1a] text-gray-500 border-white/10'
                            }`}
                          >
                            {isComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                          </div>
                          <div>
                            <p className={`text-xs font-bold uppercase ${isCurrent ? 'text-apex-red' : isComplete ? 'text-white' : 'text-gray-500'}`}>
                              {step.label}
                            </p>
                            <p className="text-[10px] text-gray-500">{step.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-400">
                  <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">Return Request Rejected</h4>
                    <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                      {selectedReturn.rejection_reason || selectedReturn.admin_note || 'This return request does not meet our return policy conditions.'}
                    </p>
                  </div>
                </div>
              )}

              {/* 2. Pickup & Courier Details (If Assigned) */}
              {selectedReturn.tracking_number && (
                <div className="bg-[#121212] border border-blue-500/30 rounded-2xl p-4 sm:p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2 flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Return Pickup & Tracking Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-300">
                    <div>
                      <span className="text-[10px] uppercase text-gray-500 font-bold block">Courier Partner</span>
                      <p className="font-semibold text-white">{selectedReturn.courier_name || 'Standard Courier'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-gray-500 font-bold block">Tracking Number</span>
                      <p className="font-mono font-bold text-white">{selectedReturn.tracking_number}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-gray-500 font-bold block">Pickup Status / Date</span>
                      <p className="font-semibold text-white">
                        {selectedReturn.pickup_date ? new Date(selectedReturn.pickup_date).toLocaleDateString() : 'Scheduled'}
                      </p>
                    </div>
                  </div>
                  {selectedReturn.pickup_notes && (
                    <p className="text-xs text-gray-400 mt-3 pt-2.5 border-t border-white/5">
                      <strong className="text-gray-300">Instructions:</strong> {selectedReturn.pickup_notes}
                    </p>
                  )}
                </div>
              )}

              {/* 3. Returned Item & Financial Breakdown */}
              <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">Returned Item & Value</h3>
                
                {safeParseItems(selectedReturn.items).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 text-xs bg-[#161616] p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-[#1f1f1f] border border-white/10 overflow-hidden shrink-0">
                        <img src={item?.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop'} alt={item?.name || 'Product'} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{item?.name || 'APEX Item'}</p>
                        <p className="text-[11px] text-gray-400">{item?.quantity || 1} unit(s) × {formatPrice(item?.price || 0)}</p>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-white shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}

                <div className="pt-2 border-t border-white/5 space-y-2 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>Reason for Return</span>
                    <span className="text-white font-medium">{selectedReturn.reason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Condition</span>
                    <span className="text-white font-medium capitalize">{String(selectedReturn.condition || '').replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Original Packaging</span>
                    <span className="text-white font-medium">{selectedReturn.packaging_available ? 'Available (Intact)' : 'Not available'}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/5">
                    <span className="font-bold text-white">
                      {selectedReturn.status === 'refunded' ? 'Final Refund Amount' : 'Estimated Refund'}
                    </span>
                    <span className="font-mono font-black text-sm text-apex-red">
                      {formatPrice(selectedReturn.final_refund_amount || selectedReturn.approved_amount || selectedReturn.requested_amount || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Customer Description */}
              {selectedReturn.description && (
                <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 sm:p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Customer Description</h3>
                  <p className="text-xs text-gray-300 leading-relaxed bg-[#161616] p-3 rounded-xl border border-white/5">
                    {selectedReturn.description}
                  </p>
                </div>
              )}

              {/* 5. Unboxing Video Evidence */}
              <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-apex-red" /> Unboxing Video Evidence
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${selectedReturn.unboxing_video_url ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-gray-400 border-white/10'}`}>
                    {selectedReturn.unboxing_video_url ? '✓ Submitted' : 'No unboxing video submitted'}
                  </span>
                </div>

                {selectedReturn.unboxing_video_url ? (
                  <div className="space-y-2 pt-1">
                    <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-64 flex items-center justify-center border border-white/5">
                      <video
                        src={selectedReturn.unboxing_video_url}
                        controls
                        preload="metadata"
                        className="w-full h-full object-contain max-h-64"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    {selectedReturn.unboxing_video_uploaded_at && (
                      <p className="text-[10px] text-gray-500">
                        Uploaded: {new Date(selectedReturn.unboxing_video_uploaded_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">
                    No unboxing video was submitted with this return request.
                  </p>
                )}
              </div>

              {/* 6. Uploaded Photo Evidence */}
              {Array.isArray(selectedReturn.evidence_urls) && selectedReturn.evidence_urls.length > 0 && (
                <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 sm:p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-apex-red" /> Uploaded Evidence Photos
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                    {selectedReturn.evidence_urls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-apex-red block group relative bg-[#181818]"
                      >
                        <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <ExternalLink className="w-4 h-4" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 bg-[#141414] border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => setSelectedReturn(null)}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                onClick={() => {
                  setSelectedReturn(null);
                  navigate('/orders');
                }}
                className="inline-flex items-center gap-1.5 text-xs text-apex-red hover:underline font-bold uppercase tracking-wider cursor-pointer"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Track Original Order</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
