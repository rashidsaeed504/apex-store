import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  Search,
  Eye,
  X,
  Clock,
  CheckCircle,
  Truck,
  Package,
  XCircle,
  Camera,
  ExternalLink,
  ShieldCheck,
  DollarSign,
  User,
  Phone,
  Mail,
  Calendar,
  Layers,
  Settings,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Video,
  FileVideo,
  Play,
  Info,
} from 'lucide-react';
import {
  fetchAdminReturns,
  fetchReturnSettings,
  saveReturnSettings,
  updateReturnStatus,
  approveReturnRefund,
} from '../../services/api';
import { formatPrice } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'requested', label: 'Requested' },
  { id: 'approved', label: 'Approved' },
  { id: 'pickup_scheduled', label: 'Pickup Scheduled' },
  { id: 'in_transit', label: 'In Transit' },
  { id: 'received', label: 'Received' },
  { id: 'inspection', label: 'Inspection' },
  { id: 'refund_processing', label: 'Refund Processing' },
  { id: 'refunded', label: 'Refunded' },
  { id: 'exchange_processing', label: 'Exchange' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function AdminReturns() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [searchParams] = useSearchParams();

  const [activeView, setActiveView] = useState('returns'); // 'returns' | 'settings'
  const [returns, setReturns] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReturn, setSelectedReturn] = useState(null);

  // Action Modal States
  const [adminNote, setAdminNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [courierName, setCourierName] = useState('TCS Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');

  // Refund Calculation States
  const [approvedAmount, setApprovedAmount] = useState(0);
  const [discountAdjustment, setDiscountAdjustment] = useState(0);
  const [shippingAdjustment, setShippingAdjustment] = useState(0);
  const [finalRefundAmount, setFinalRefundAmount] = useState(0);
  const [refundMethod, setRefundMethod] = useState('original');
  const [restockItem, setRestockItem] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [newReasonLabel, setNewReasonLabel] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [returnsData, settingsData] = await Promise.all([
        fetchAdminReturns(),
        fetchReturnSettings(),
      ]);
      setReturns(returnsData || []);
      setSettings(settingsData);
      setSettingsForm(settingsData);
    } catch (err) {
      console.warn('Failed to load admin returns data:', err);
      if (toastError) toastError('Failed to fetch returns data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('apex_returns_updated', handleUpdate);
    return () => window.removeEventListener('apex_returns_updated', handleUpdate);
  }, []);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  useEffect(() => {
    const q = (searchParams.get('search') || '').trim().toLowerCase();
    if (q && returns.length > 0 && !selectedReturn) {
      const match = returns.find(
        (r) =>
          String(r?.return_number || '').toLowerCase() === q ||
          String(r?.order_number || '').toLowerCase() === q ||
          String(r?.id || '').toLowerCase() === q
      );
      if (match) {
        openDetailModal(match);
      }
    }
  }, [searchParams, returns]);

  const openDetailModal = (ret) => {
    setSelectedReturn(ret);
    setAdminNote(ret.admin_note || '');
    setRejectionReason(ret.rejection_reason || '');
    setPickupDate(ret.pickup_date ? new Date(ret.pickup_date).toISOString().split('T')[0] : '');
    setCourierName(ret.courier_name || 'TCS Express');
    setTrackingNumber(ret.tracking_number || '');
    setPickupNotes(ret.pickup_notes || '');

    const reqAmt = Number(ret.requested_amount || 0);
    setApprovedAmount(Number(ret.approved_amount || reqAmt));
    setDiscountAdjustment(Number(ret.discount_adjustment || 0));
    setShippingAdjustment(Number(ret.shipping_adjustment || 0));
    setFinalRefundAmount(Number(ret.final_refund_amount || reqAmt));
    setRefundMethod(ret.refund_method || 'original');
    setRestockItem(true);
  };

  const handleStatusTransition = async (newStatus, customNote = '') => {
    if (!selectedReturn) return;
    setActionLoading(true);
    try {
      const noteToRecord = customNote || adminNote || `Status changed to ${newStatus.replace(/_/g, ' ')}`;
      const additionalFields = {};

      if (newStatus === 'rejected') {
        if (!rejectionReason.trim()) {
          toastError('Please provide a reason for rejecting this return request.');
          setActionLoading(false);
          return;
        }
        additionalFields.rejection_reason = rejectionReason.trim();
      }

      if (newStatus === 'pickup_scheduled') {
        additionalFields.pickup_date = pickupDate ? new Date(pickupDate).toISOString() : new Date().toISOString();
        additionalFields.courier_name = courierName;
        additionalFields.tracking_number = trackingNumber;
        additionalFields.pickup_notes = pickupNotes;
      }

      const updated = await updateReturnStatus(selectedReturn.id, newStatus, noteToRecord, additionalFields);
      toastSuccess(`Return #${selectedReturn.return_number} updated to "${newStatus.replace(/_/g, ' ').toUpperCase()}"`);
      setSelectedReturn(updated);
      loadData();
    } catch (err) {
      toastError(err.message || 'Failed to update return status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!selectedReturn) return;
    setActionLoading(true);
    try {
      const finalAmt = Number(finalRefundAmount || approvedAmount || selectedReturn.requested_amount || 0);
      const reqAmt = Number(selectedReturn.requested_amount || finalAmt);

      if (finalAmt > reqAmt) {
        toastError(`Refund amount (PKR ${finalAmt}) cannot exceed the customer paid amount (PKR ${reqAmt}).`);
        setActionLoading(false);
        return;
      }

      const updated = await approveReturnRefund(selectedReturn.id, {
        approved_amount: approvedAmount,
        discount_adjustment: discountAdjustment,
        shipping_adjustment: shippingAdjustment,
        final_refund_amount: finalAmt,
        refund_method: refundMethod,
        admin_note: adminNote || `Refund of PKR ${finalAmt} approved via ${refundMethod}.`,
        restock_item: restockItem,
      });

      toastSuccess(`Return #${selectedReturn.return_number} marked as REFUNDED! ${restockItem ? '(Item restocked)' : ''}`);
      setSelectedReturn(updated);
      loadData();
    } catch (err) {
      toastError(err.message || 'Failed to process refund.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!settingsForm) return;
    setSavingSettings(true);
    try {
      const updated = await saveReturnSettings(settingsForm);
      setSettings(updated);
      toastSuccess('Return & Refund settings updated successfully!');
    } catch (err) {
      toastError('Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddReason = () => {
    if (!newReasonLabel.trim() || !settingsForm) return;
    const currentReasons = settingsForm.return_reasons || [];
    const newReason = {
      id: `custom_${Date.now()}`,
      label: newReasonLabel.trim(),
      is_active: true,
      sort_order: currentReasons.length + 1,
    };
    setSettingsForm({ ...settingsForm, return_reasons: [...currentReasons, newReason] });
    setNewReasonLabel('');
  };

  const handleToggleReason = (id) => {
    if (!settingsForm) return;
    const currentReasons = settingsForm.return_reasons || [];
    const updated = currentReasons.map((r) => (r.id === id ? { ...r, is_active: !r.is_active } : r));
    setSettingsForm({ ...settingsForm, return_reasons: updated });
  };

  const handleDeleteReason = (id) => {
    if (!settingsForm) return;
    const currentReasons = settingsForm.return_reasons || [];
    const updated = currentReasons.filter((r) => r.id !== id);
    setSettingsForm({ ...settingsForm, return_reasons: updated });
  };

  const filteredReturns = (returns || []).filter((r) => {
    const q = (searchQuery || '').trim().toLowerCase();
    const retNum = String(r?.return_number || r?.id || '').toLowerCase();
    const orderNum = String(r?.order_number || '').toLowerCase();
    const custName = String(r?.customer_name || '').toLowerCase();
    const custEmail = String(r?.customer_email || '').toLowerCase();
    const items = Array.isArray(r.items) ? r.items : typeof r.items === 'string' ? JSON.parse(r.items || '[]') : [];
    const itemMatch = items.some((it) => (it.name || '').toLowerCase().includes(q));

    const matchesSearch = !q || retNum.includes(q) || orderNum.includes(q) || custName.includes(q) || custEmail.includes(q) || itemMatch;
    const matchesStatus = statusFilter === 'all' || String(r?.status || 'requested').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Metric Computations
  const totalCount = returns.length;
  const requestedCount = returns.filter((r) => r.status === 'requested').length;
  const inProgressCount = returns.filter((r) => ['approved', 'pickup_scheduled', 'in_transit', 'received', 'inspection', 'refund_processing', 'exchange_processing'].includes(r.status)).length;
  const refundedCount = returns.filter((r) => r.status === 'refunded').length;

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
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-white flex items-center gap-3">
            Returns & <span className="text-apex-red">Refunds</span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Authorize return claims, schedule pickups, inspect received units, and process refunds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('returns')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeView === 'returns'
                ? 'bg-apex-red text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]'
                : 'bg-[#111] text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            Manage Returns ({totalCount})
          </button>

          <button
            onClick={() => setActiveView('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'settings'
                ? 'bg-apex-red text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]'
                : 'bg-[#111] text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Policy Settings</span>
          </button>
        </div>
      </div>

      {activeView === 'returns' ? (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 bg-[#111] border border-white/5 rounded-2xl">
              <span className="text-xs font-bold uppercase text-gray-400 block">Total Requests</span>
              <p className="text-2xl font-mono font-black text-white mt-1">{totalCount}</p>
            </div>
            <div className="p-4 bg-[#111] border border-amber-500/20 rounded-2xl">
              <span className="text-xs font-bold uppercase text-amber-400 block">Action Required</span>
              <p className="text-2xl font-mono font-black text-amber-400 mt-1">{requestedCount}</p>
            </div>
            <div className="p-4 bg-[#111] border border-blue-500/20 rounded-2xl">
              <span className="text-xs font-bold uppercase text-blue-400 block">In Logistics / Review</span>
              <p className="text-2xl font-mono font-black text-blue-400 mt-1">{inProgressCount}</p>
            </div>
            <div className="p-4 bg-[#111] border border-emerald-500/20 rounded-2xl">
              <span className="text-xs font-bold uppercase text-emerald-400 block">Refunded & Closed</span>
              <p className="text-2xl font-mono font-black text-emerald-400 mt-1">{refundedCount}</p>
            </div>
          </div>

          {/* Filter Tabs & Search Bar */}
          <div className="p-4 bg-[#111] border border-white/5 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-apex-red text-white shadow-[0_0_12px_rgba(220,38,38,0.3)]'
                      : 'bg-[#181818] text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search return, order, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#181818] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-apex-red"
              />
            </div>
          </div>

          {/* Returns Table */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-20 bg-[#111] border border-white/5 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredReturns.length === 0 ? (
            <div className="p-12 text-center bg-[#111] border border-white/5 rounded-2xl">
              <RotateCcw className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold uppercase text-white">No Return Requests Found</h3>
              <p className="text-xs text-gray-400 mt-1">Try changing your search keywords or filter tab.</p>
            </div>
          ) : (
            <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#181818] text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Return #</th>
                      <th className="p-4">Order #</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Item & Reason</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Requested On</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredReturns.map((ret) => {
                      const items = Array.isArray(ret.items) ? ret.items : typeof ret.items === 'string' ? JSON.parse(ret.items || '[]') : [];
                      const item = items[0] || {};
                      const dateStr = ret.created_at
                        ? new Date(ret.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Recent';

                      return (
                        <tr key={ret.id || ret.return_number} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 font-mono font-bold text-white">#{ret.return_number}</td>
                          <td className="p-4 font-mono text-gray-300">#{ret.order_number}</td>
                          <td className="p-4">
                            <p className="font-bold text-white">{ret.customer_name || 'Customer'}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{ret.customer_email}</p>
                          </td>
                          <td className="p-4 max-w-xs">
                            <p className="font-bold text-white truncate">{item.name || 'APEX Item'}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                              Qty: {item.quantity || 1} • <span className="text-gray-300">{ret.reason}</span>
                            </p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              {ret.unboxing_video_url && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  <Video className="w-2.5 h-2.5" /> Video
                                </span>
                              )}
                              {Array.isArray(ret.evidence_urls) && ret.evidence_urls.length > 0 && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/10 text-gray-300 border border-white/10">
                                  <Camera className="w-2.5 h-2.5" /> {ret.evidence_urls.length} Photo{ret.evidence_urls.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-mono font-bold text-apex-red">
                            {formatPrice(ret.final_refund_amount || ret.approved_amount || ret.requested_amount || 0)}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(ret.status)}`}>
                              {String(ret.status || '').replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="p-4 text-gray-400">{dateStr}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => openDetailModal(ret)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-apex-red text-white rounded-lg font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Manage</span>
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
        </>
      ) : (
        /* Settings View */
        <form onSubmit={handleSaveSettings} className="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-6 max-w-3xl">
          <div>
            <h3 className="text-lg font-black uppercase text-white">Return & Refund Policy Configuration</h3>
            <p className="text-xs text-gray-400 mt-1">Configure global store rules, eligibility window days, and reason options.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                Return Window (Days After Delivery) <span className="text-apex-red">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={settingsForm?.return_window_days || 7}
                onChange={(e) => setSettingsForm({ ...settingsForm, return_window_days: Number(e.target.value) })}
                className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-apex-red"
                required
              />
              <span className="text-[10px] text-gray-500 mt-1 block">Calculated from the exact delivered timestamp.</span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                Shipping Fee Refund Policy
              </label>
              <select
                value={settingsForm?.shipping_refund_rule || 'non_refundable'}
                onChange={(e) => setSettingsForm({ ...settingsForm, shipping_refund_rule: e.target.value })}
                className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-apex-red"
              >
                <option value="non_refundable">Original shipping non-refundable</option>
                <option value="refundable_if_defective">Refundable only if item is defective / damaged</option>
                <option value="always_refundable">Always refund full shipping fee</option>
              </select>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/5">
            <label className="flex items-center gap-3 p-3 bg-[#181818] rounded-xl border border-white/5 cursor-pointer">
              <input
                type="checkbox"
                checked={settingsForm?.enabled !== false}
                onChange={(e) => setSettingsForm({ ...settingsForm, enabled: e.target.checked })}
                className="w-4 h-4 accent-apex-red rounded"
              />
              <span className="text-xs font-bold text-white">Enable Return System Storewide</span>
            </label>

            <label className="flex items-center gap-3 p-3 bg-[#181818] rounded-xl border border-white/5 cursor-pointer">
              <input
                type="checkbox"
                checked={settingsForm?.allow_exchange !== false}
                onChange={(e) => setSettingsForm({ ...settingsForm, allow_exchange: e.target.checked })}
                className="w-4 h-4 accent-apex-red rounded"
              />
              <span className="text-xs font-bold text-white">Allow Exchange / Replacement Option</span>
            </label>

            <label className="flex items-center gap-3 p-3 bg-[#181818] rounded-xl border border-white/5 cursor-pointer">
              <input
                type="checkbox"
                checked={settingsForm?.allow_cod_returns !== false}
                onChange={(e) => setSettingsForm({ ...settingsForm, allow_cod_returns: e.target.checked })}
                className="w-4 h-4 accent-apex-red rounded"
              />
              <span className="text-xs font-bold text-white">Allow COD Orders Return & Refund</span>
            </label>

            <label className="flex items-center gap-3 p-3 bg-[#181818] rounded-xl border border-white/5 cursor-pointer">
              <input
                type="checkbox"
                checked={settingsForm?.allow_online_returns !== false}
                onChange={(e) => setSettingsForm({ ...settingsForm, allow_online_returns: e.target.checked })}
                className="w-4 h-4 accent-apex-red rounded"
              />
              <span className="text-xs font-bold text-white">Allow Online Payment Returns</span>
            </label>
          </div>

          {/* Manage Return Reasons List */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">Configurable Return Reasons</h4>
            
            <div className="space-y-2">
              {(settingsForm?.return_reasons || []).map((reason) => (
                <div key={reason.id} className="flex items-center justify-between gap-3 p-2.5 bg-[#181818] rounded-xl border border-white/5 text-xs">
                  <span className={reason.is_active ? 'text-white' : 'text-gray-500 line-through'}>{reason.label}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleReason(reason.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${reason.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}
                    >
                      {reason.is_active ? 'Active' : 'Disabled'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteReason(reason.id)}
                      className="text-gray-500 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Add new return reason..."
                value={newReasonLabel}
                onChange={(e) => setNewReasonLabel(e.target.value)}
                className="flex-1 bg-[#181818] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-apex-red"
              />
              <button
                type="button"
                onClick={handleAddReason}
                className="px-4 py-2 bg-white/10 hover:bg-apex-red text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              <span>Save Policy Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* ADMIN RETURN DETAIL & ACTION DRAWER/MODAL */}
      {/* ========================================================= */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-4xl bg-[#0d0d0d] border border-white/15 rounded-3xl shadow-2xl overflow-hidden my-6 text-white"
          >
            {/* Header */}
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

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* 1. Customer & Order Profiles in 2 Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Profile */}
                <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 space-y-2 text-xs">
                  <h4 className="font-bold uppercase text-gray-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-apex-red" /> Customer Details
                  </h4>
                  <p><strong className="text-white">Name:</strong> {selectedReturn.customer_name || 'Customer'}</p>
                  <p><strong className="text-white">Email:</strong> {selectedReturn.customer_email || 'Not provided'}</p>
                  <p><strong className="text-white">Phone:</strong> {selectedReturn.customer_phone || 'Not provided'}</p>
                </div>

                {/* Order Details */}
                <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 space-y-2 text-xs">
                  <h4 className="font-bold uppercase text-gray-400 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-apex-red" /> Order Reference
                  </h4>
                  <p><strong className="text-white">Order #:</strong> #{selectedReturn.order_number}</p>
                  <p><strong className="text-white">Resolution:</strong> <span className="uppercase text-amber-400 font-bold">{selectedReturn.resolution || 'refund'}</span></p>
                  <p><strong className="text-white">Delivered Date:</strong> {selectedReturn.delivered_at ? new Date(selectedReturn.delivered_at).toLocaleDateString() : 'Delivered'}</p>
                </div>
              </div>

              {/* 2. Returned Product & Issue Details */}
              <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Claim Item & Reason</h4>

                {((Array.isArray(selectedReturn.items) ? selectedReturn.items : typeof selectedReturn.items === 'string' ? JSON.parse(selectedReturn.items || '[]') : [])).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 text-xs bg-[#161616] p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-[#1f1f1f] border border-white/10 overflow-hidden shrink-0">
                        <img src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop'} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{item.name}</p>
                        <p className="text-[11px] text-gray-400">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-white shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-white/5">
                  <div>
                    <span className="text-[10px] uppercase text-gray-500 font-bold block">Reason</span>
                    <p className="font-semibold text-white">{selectedReturn.reason}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-gray-500 font-bold block">Condition</span>
                    <p className="font-semibold text-white capitalize">{String(selectedReturn.condition || '').replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-gray-500 font-bold block">Packaging</span>
                    <p className="font-semibold text-white">{selectedReturn.packaging_available ? 'Available' : 'Missing'}</p>
                  </div>
                </div>

                {selectedReturn.description && (
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Customer Description</span>
                    <p className="text-xs text-gray-300 leading-relaxed bg-[#161616] p-3 rounded-xl border border-white/5">
                      {selectedReturn.description}
                    </p>
                  </div>
                )}
              </div>

              {/* 3. Evidence Review Section (Unboxing Video & Photos) */}
              <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-apex-red" />
                    Submitted Evidence & Verification
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    <span className={`px-2 py-0.5 rounded-full border ${selectedReturn.unboxing_video_url ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-white/5 text-gray-400 border-white/10'}`}>
                      Video: {selectedReturn.unboxing_video_url ? '✓ Available' : '— Not provided'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full border ${(selectedReturn.evidence_urls?.length || 0) > 0 ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-white/5 text-gray-400 border-white/10'}`}>
                      Photos: {(selectedReturn.evidence_urls?.length || 0) > 0 ? `✓ ${selectedReturn.evidence_urls.length}` : '— None'}
                    </span>
                  </div>
                </div>

                {/* Unboxing Video Viewer */}
                <div className="space-y-2">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-apex-red" /> Unboxing Video Evidence
                  </h5>

                  {selectedReturn.unboxing_video_url ? (
                    <div className="bg-[#161616] border border-amber-500/30 rounded-xl p-3 space-y-2.5">
                      <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-h-72 flex items-center justify-center border border-white/5">
                        <video
                          src={selectedReturn.unboxing_video_url}
                          controls
                          preload="metadata"
                          className="w-full h-full object-contain max-h-72"
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                        <span>
                          Uploaded: {selectedReturn.unboxing_video_uploaded_at || selectedReturn.created_at
                            ? new Date(selectedReturn.unboxing_video_uploaded_at || selectedReturn.created_at).toLocaleString()
                            : 'With request'}
                        </span>
                        <a
                          href={selectedReturn.unboxing_video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-apex-red hover:underline font-bold"
                        >
                          <ExternalLink className="w-3 h-3" /> Open in New Tab
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#161616] border border-white/5 rounded-xl text-xs text-gray-400 flex items-center justify-between">
                      <span>No unboxing video submitted by customer.</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAdminNote((prev) => (prev ? `${prev} | ` : '') + 'Requesting customer to provide continuous unboxing video for transit damage verification.');
                          toastSuccess('Prefilled admin note requesting unboxing video.');
                        }}
                        className="text-[10px] uppercase font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                      >
                        Request Video in Notes
                      </button>
                    </div>
                  )}
                </div>

                {/* Evidence Photos */}
                {Array.isArray(selectedReturn.evidence_urls) && selectedReturn.evidence_urls.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-apex-red" /> Customer Evidence Photos ({selectedReturn.evidence_urls.length})
                    </h5>
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

                {/* Admin Policy Guideline Alert */}
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-[11px] text-gray-400 flex items-start gap-2 leading-relaxed">
                  <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Admin Evidence Policy:</strong> Unboxing video is supporting evidence and does not automatically guarantee approval. Final return/refund decisions depend on eligibility, product condition, and evidence review.
                  </span>
                </div>
              </div>

              {/* 4. Courier Pickup Assignment Section */}
              <div className="bg-[#121212] border border-blue-500/30 rounded-2xl p-4 sm:p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Truck className="w-4 h-4" /> Courier Pickup Logistics
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Courier Partner</label>
                    <input
                      type="text"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      placeholder="e.g. TCS Express / Leopards"
                      className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Tracking Number</label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. 7729182390"
                      className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Pickup Date</label>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Financial & Refund Calculation Tool */}
              <div className="bg-[#121212] border border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" /> Refund Calculation & Inventory Restock Tool
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Item Paid Subtotal</label>
                    <input
                      type="number"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(Number(e.target.value))}
                      className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Discount Deduction (PKR)</label>
                    <input
                      type="number"
                      value={discountAdjustment}
                      onChange={(e) => setDiscountAdjustment(Number(e.target.value))}
                      className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Final Approved Refund</label>
                    <input
                      type="number"
                      value={finalRefundAmount}
                      onChange={(e) => setFinalRefundAmount(Number(e.target.value))}
                      className="w-full bg-[#181818] border border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Refund Method</label>
                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value)}
                      className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                    >
                      <option value="original">Original Payment Method</option>
                      <option value="bank_transfer">Bank Transfer (IBAN/Account)</option>
                      <option value="store_credit">Store Credit / Coupon</option>
                      <option value="manual">Manual Cash / Custom</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-4 sm:pt-6">
                    <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={restockItem}
                        onChange={(e) => setRestockItem(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500 rounded"
                      />
                      <span>Restock returned unit back to inventory</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 6. Admin Notes & Rejection Form */}
              <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Admin Notes & Reason</h4>
                <textarea
                  rows={2}
                  placeholder="Add private admin inspection notes, tracking updates, or resolution instructions..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-apex-red resize-none"
                />

                <div>
                  <label className="block text-[10px] uppercase font-bold text-red-400 mb-1">
                    Rejection Reason (Required only if rejecting)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Physical customer damage / Missing original retail accessories"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full bg-[#181818] border border-red-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* 7. Action Lifecycle Buttons */}
              <div className="p-4 bg-[#141414] border border-white/10 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Execute Lifecycle Transition</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusTransition('approved')}
                    disabled={actionLoading}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    1. Approve Request
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusTransition('pickup_scheduled')}
                    disabled={actionLoading}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    2. Schedule Pickup
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusTransition('in_transit')}
                    disabled={actionLoading}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    3. Mark In Transit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusTransition('received')}
                    disabled={actionLoading}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    4. Mark Received
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusTransition('inspection')}
                    disabled={actionLoading}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    5. Start Inspection
                  </button>

                  <button
                    type="button"
                    onClick={handleProcessRefund}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer"
                  >
                    6. Process Refund (PKR {finalRefundAmount || approvedAmount})
                  </button>

                  {selectedReturn.resolution === 'exchange' && (
                    <button
                      type="button"
                      onClick={() => handleStatusTransition('exchange_completed', 'Replacement unit dispatched to customer.')}
                      disabled={actionLoading}
                      className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Exchange Completed
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleStatusTransition('rejected')}
                    disabled={actionLoading}
                    className="px-3.5 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ml-auto"
                  >
                    Reject Claim
                  </button>
                </div>
              </div>

              {/* 8. Audit Trail / Status History Log */}
              {Array.isArray(selectedReturn.status_history) && selectedReturn.status_history.length > 0 && (
                <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-apex-red" /> Status History & Audit Trail
                  </h4>
                  <div className="space-y-2">
                    {selectedReturn.status_history.map((hist, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-3 text-xs bg-[#161616] p-2.5 rounded-xl border border-white/5">
                        <div>
                          <p className="font-bold text-white uppercase">{hist.status?.replace(/_/g, ' ') || 'Update'}</p>
                          {hist.note && <p className="text-gray-400 mt-0.5">{hist.note}</p>}
                        </div>
                        <div className="text-right shrink-0 text-[10px] text-gray-500">
                          <p>{hist.timestamp ? new Date(hist.timestamp).toLocaleString() : ''}</p>
                          <span className="text-apex-red font-bold">{hist.actor || 'System'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 bg-[#141414] border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedReturn(null)}
                className="px-6 py-2.5 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
