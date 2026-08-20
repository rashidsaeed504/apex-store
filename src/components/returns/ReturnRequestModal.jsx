import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  RotateCcw,
  Upload,
  Camera,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Package,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { formatPrice } from '../../utils/helpers';
import {
  fetchReturnSettings,
  submitReturnRequest,
  uploadReturnEvidence,
  checkOrderItemReturnEligibility,
} from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function ReturnRequestModal({
  isOpen,
  onClose,
  order,
  item,
  existingReturns = [],
  onReturnSubmitted,
}) {
  const { success: toastSuccess, error: toastError } = useToast();

  const [settings, setSettings] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [resolution, setResolution] = useState('refund'); // 'refund' | 'exchange'
  const [reason, setReason] = useState('defective');
  const [customReason, setCustomReason] = useState('');
  const [condition, setCondition] = useState('opened_unused');
  const [packagingAvailable, setPackagingAvailable] = useState(true);
  const [description, setDescription] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const cfg = await fetchReturnSettings();
      setSettings(cfg);
    }
    if (isOpen) {
      loadSettings();
      setQuantity(1);
      setResolution('refund');
      setReason('defective');
      setCustomReason('');
      setCondition('opened_unused');
      setPackagingAvailable(true);
      setDescription('');
      setEvidenceUrls([]);
    }
  }, [isOpen]);

  if (!isOpen || !order || !item) return null;

  const eligibility = checkOrderItemReturnEligibility(
    order,
    item,
    existingReturns,
    settings || undefined
  );

  const maxReturnQty = eligibility.remainingQuantity || 1;
  const unitPrice = Number(item.price || 0);
  const estimatedRefund = unitPrice * quantity;

  const reasonsList = settings?.return_reasons?.filter((r) => r.is_active !== false) || [
    { id: 'defective', label: 'Product is defective / not functioning' },
    { id: 'damaged', label: 'Product arrived damaged in transit' },
    { id: 'wrong_item', label: 'Received wrong item or model' },
    { id: 'missing_accessory', label: 'Missing parts or accessories' },
    { id: 'not_as_described', label: 'Product does not match website description' },
    { id: 'size_fit', label: 'Size / fit or comfort issue' },
    { id: 'changed_mind', label: 'Changed my mind / No longer needed' },
    { id: 'other', label: 'Other reason (specify in notes)' },
  ];

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (evidenceUrls.length + files.length > 5) {
      toastError('You can upload a maximum of 5 evidence photos.');
      return;
    }

    setUploadingPhotos(true);
    try {
      const uploadPromises = files.map((file) => uploadReturnEvidence(file));
      const urls = await Promise.all(uploadPromises);
      const validUrls = urls.filter(Boolean);
      setEvidenceUrls((prev) => [...prev, ...validUrls]);
      if (toastSuccess) toastSuccess(`${validUrls.length} photo(s) uploaded successfully!`);
    } catch (err) {
      console.warn('Evidence photo upload error:', err);
      if (toastError) toastError('Failed to upload some images. Please try again.');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    setEvidenceUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!eligibility.isEligible) {
      toastError(eligibility.reason || 'This item is not eligible for return.');
      return;
    }

    if (quantity < 1 || quantity > maxReturnQty) {
      toastError(`Please select a valid return quantity (between 1 and ${maxReturnQty}).`);
      return;
    }

    if (!description.trim()) {
      toastError('Please provide a brief description of the issue.');
      return;
    }

    if (reason === 'other' && !customReason.trim()) {
      toastError('Please specify the return reason.');
      return;
    }

    setSubmitting(true);
    try {
      const selectedReasonObj = reasonsList.find((r) => r.id === reason);
      const finalReasonLabel = reason === 'other' ? `Other: ${customReason.trim()}` : selectedReasonObj?.label || reason;

      const payload = {
        order_id: order.id,
        order_number: order.order_number,
        user_id: order.user_id || order.customer_id,
        customer_id: order.customer_id || order.user_id,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        item: {
          id: item.id || item.product_id,
          product_id: item.product_id || item.id,
          name: item.name || item.product_name,
          price: unitPrice,
          image: item.image || item.images?.[0] || '',
        },
        quantity,
        resolution,
        reason: finalReasonLabel,
        reason_details: customReason || finalReasonLabel,
        condition,
        packaging_available: packagingAvailable,
        description: description.trim(),
        evidence_urls: evidenceUrls,
        delivered_at: order.delivered_at || order.updated_at || order.created_at,
      };

      const result = await submitReturnRequest(payload);
      if (result) {
        if (toastSuccess) toastSuccess(`Return request #${result.return_number} submitted successfully!`);
        if (onReturnSubmitted) onReturnSubmitted(result);
        onClose();
      }
    } catch (err) {
      console.error('Submit return request error:', err);
      if (toastError) toastError(err.message || 'Failed to submit return request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl bg-[#0d0d0d] border border-white/15 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-6 text-white"
        >
          {/* Modal Header */}
          <div className="p-4 sm:p-6 bg-[#141414] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-apex-red/15 border border-apex-red/30 flex items-center justify-center text-apex-red shrink-0 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                  Request Return / Exchange
                </h2>
                <p className="text-[11px] sm:text-xs text-gray-400">
                  Order <span className="font-mono text-white font-bold">#{order.order_number}</span> • APEX 7-Day Guarantee
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={submitting}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Product Card Header Snapshot */}
            <div className="bg-[#121212] border border-white/10 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#1c1c1c] border border-white/10 overflow-hidden shrink-0">
                <img
                  src={item.image || item.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop'}
                  alt={item.name || 'Product'}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold text-white truncate">{item.name || 'APEX Product'}</p>
                <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1 flex-wrap">
                  <span>Unit Price: <strong className="text-white font-mono">{formatPrice(unitPrice)}</strong></span>
                  <span>Ordered: <strong className="text-white">{item.quantity}</strong></span>
                  {eligibility.alreadyReturnedQty > 0 && (
                    <span className="text-amber-400">Already Returned: <strong>{eligibility.alreadyReturnedQty}</strong></span>
                  )}
                </div>
              </div>
            </div>

            {/* Return Resolution (Refund vs Exchange) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                Requested Resolution <span className="text-apex-red">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setResolution('refund')}
                  className={`p-3.5 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    resolution === 'refund'
                      ? 'bg-apex-red/15 border-apex-red text-white shadow-[0_0_15px_rgba(220,38,38,0.25)]'
                      : 'bg-[#141414] border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <RotateCcw className="w-4 h-4 text-apex-red" />
                  <span>Refund Amount</span>
                </button>

                <button
                  type="button"
                  onClick={() => setResolution('exchange')}
                  className={`p-3.5 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    resolution === 'exchange'
                      ? 'bg-apex-red/15 border-apex-red text-white shadow-[0_0_15px_rgba(220,38,38,0.25)]'
                      : 'bg-[#141414] border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <RefreshCw className="w-4 h-4 text-apex-red" />
                  <span>Replacement / Exchange</span>
                </button>
              </div>
            </div>

            {/* Quantity Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Quantity to Return (Max: {maxReturnQty}) <span className="text-apex-red">*</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-10 h-10 rounded-xl bg-[#141414] border border-white/10 hover:border-white/30 text-white font-bold flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  -
                </button>

                <span className="w-12 text-center font-mono font-black text-base text-white">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(maxReturnQty, q + 1))}
                  disabled={quantity >= maxReturnQty}
                  className="w-10 h-10 rounded-xl bg-[#141414] border border-white/10 hover:border-white/30 text-white font-bold flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  +
                </button>

                <div className="ml-auto text-right">
                  <span className="text-[10px] uppercase text-gray-500 font-bold block">Estimated Value</span>
                  <span className="font-mono font-black text-sm text-apex-red">
                    {formatPrice(estimatedRefund)}
                  </span>
                </div>
              </div>
            </div>

            {/* Return Reason Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Reason for Return <span className="text-apex-red">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-apex-red transition-colors cursor-pointer"
              >
                {reasonsList.map((r) => (
                  <option key={r.id} value={r.id} className="bg-[#141414]">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Reason Text Input (if Other is selected) */}
            {reason === 'other' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Specify Custom Reason <span className="text-apex-red">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Defective left earbud channel"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-apex-red"
                  required
                />
              </div>
            )}

            {/* Product Condition & Packaging in 2 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Item Condition <span className="text-apex-red">*</span>
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-apex-red cursor-pointer"
                >
                  <option value="unopened">Unopened / Factory Sealed</option>
                  <option value="opened_unused">Opened but Unused</option>
                  <option value="used">Used / Tested</option>
                  <option value="damaged">Damaged / Defective</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Original Packaging Available?
                </label>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPackagingAvailable(true)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                      packagingAvailable
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-[#141414] border-white/10 text-gray-400'
                    }`}
                  >
                    Yes (Box Intact)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPackagingAvailable(false)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                      !packagingAvailable
                        ? 'bg-red-500/20 text-red-400 border-red-500/40'
                        : 'bg-[#141414] border-white/10 text-gray-400'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>

            {/* Description Textarea */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Detailed Issue Description <span className="text-apex-red">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Describe what went wrong with the item so our inspection team can process your request quickly..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-apex-red resize-none"
              />
            </div>

            {/* Photo Evidence Upload */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-apex-red" />
                  Evidence Photos (Max 5)
                </label>
                <span className="text-[10px] text-gray-500">{evidenceUrls.length}/5 uploaded</span>
              </div>

              {/* Upload Dropzone */}
              {evidenceUrls.length < 5 && (
                <div className="border border-dashed border-white/15 rounded-2xl p-4 text-center bg-[#121212] hover:border-apex-red/50 transition-colors mb-3">
                  <input
                    type="file"
                    id="evidence-file-upload"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingPhotos}
                  />
                  <label
                    htmlFor="evidence-file-upload"
                    className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                  >
                    {uploadingPhotos ? (
                      <>
                        <Loader2 className="w-6 h-6 text-apex-red animate-spin" />
                        <span className="text-xs text-gray-400">Uploading photos to Supabase Storage...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-apex-red" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Click to upload evidence photos
                        </span>
                        <span className="text-[10px] text-gray-500">JPG, PNG, WEBP (Max 5MB each)</span>
                      </>
                    )}
                  </label>
                </div>
              )}

              {/* Uploaded Thumbnails Preview */}
              {evidenceUrls.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  {evidenceUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-white/15 group bg-[#111]">
                      <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-red-600 rounded-md text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting || uploadingPhotos}
                className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.4)] cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Submit Return Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
