import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Search, 
  Filter, 
  MessageSquare, 
  Clock, 
  Check, 
  X,
  ExternalLink,
  Package
} from 'lucide-react';
import { 
  fetchAdminReviews, 
  updateReviewStatus, 
  deleteReview, 
  fetchProducts 
} from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [ratingFilter, setRatingFilter] = useState('all'); // 'all' | 5 | 4 | 3 | 2 | 1
  const [productFilter, setProductFilter] = useState('all'); // 'all' | productId
  const [verifiedFilter, setVerifiedFilter] = useState('all'); // 'all' | 'verified' | 'unverified'

  const { success, error: toastError } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [revData, prodData] = await Promise.all([
        fetchAdminReviews(),
        fetchProducts(true)
      ]);
      setReviews(revData || []);
      setProducts(prodData || []);
    } catch (err) {
      toastError('Failed to load reviews data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('apex_reviews_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('apex_reviews_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter((r) => r.status === 'pending').length;
    const approved = reviews.filter((r) => r.status === 'approved').length;
    const rejected = reviews.filter((r) => r.status === 'rejected').length;
    return { total, pending, approved, rejected };
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // Status filter
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;

      // Rating filter
      if (ratingFilter !== 'all' && Math.round(Number(r.rating || 5)) !== Number(ratingFilter)) return false;

      // Product filter
      if (productFilter !== 'all' && Number(r.product_id) !== Number(productFilter)) return false;

      // Verified filter
      if (verifiedFilter === 'verified' && !r.verified_purchase) return false;
      if (verifiedFilter === 'unverified' && r.verified_purchase) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (r.customer_name || '').toLowerCase().includes(q);
        const emailMatch = (r.customer_email || '').toLowerCase().includes(q);
        const productMatch = (r.product_name || '').toLowerCase().includes(q);
        const textMatch = (r.review_text || '').toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !productMatch && !textMatch) return false;
      }

      return true;
    });
  }, [reviews, statusFilter, ratingFilter, productFilter, verifiedFilter, searchQuery]);

  const handleUpdateStatus = async (reviewId, newStatus) => {
    setProcessingId(reviewId);
    try {
      await updateReviewStatus(reviewId, newStatus);
      success(`Review ${newStatus === 'approved' ? 'approved & published!' : 'marked as rejected.'}`);
      await loadData();
    } catch (err) {
      toastError(err.message || 'Failed to update review status');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (reviewId, customerName) => {
    if (!window.confirm(`Are you sure you want to delete this review by "${customerName}"?`)) return;
    setProcessingId(reviewId);
    try {
      await deleteReview(reviewId);
      success('Review deleted permanently.');
      await loadData();
    } catch (err) {
      toastError(err.message || 'Failed to delete review');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-white flex items-center gap-3">
            Reviews <span className="text-apex-red">Moderation CMS</span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Approve, reject, or delete customer reviews. Approved reviews automatically calculate public product ratings.
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Reviews */}
        <div className="bg-[#111] border border-white/5 rounded-xl p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Reviews</p>
            <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">{stats.total}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-gray-300">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Reviews */}
        <div 
          onClick={() => setStatusFilter('pending')}
          className={`border rounded-xl p-4 sm:p-5 flex items-center justify-between transition-all cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-500/15 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
              : 'bg-[#111] border-white/5 hover:border-amber-500/30'
          }`}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              {stats.pending > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
              Pending Approval
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">{stats.pending}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Approved Reviews */}
        <div 
          onClick={() => setStatusFilter('approved')}
          className={`border rounded-xl p-4 sm:p-5 flex items-center justify-between transition-all cursor-pointer ${
            statusFilter === 'approved'
              ? 'bg-emerald-500/15 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
              : 'bg-[#111] border-white/5 hover:border-emerald-500/30'
          }`}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Approved Public</p>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">{stats.approved}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Rejected Reviews */}
        <div 
          onClick={() => setStatusFilter('rejected')}
          className={`border rounded-xl p-4 sm:p-5 flex items-center justify-between transition-all cursor-pointer ${
            statusFilter === 'rejected'
              ? 'bg-red-500/15 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
              : 'bg-[#111] border-white/5 hover:border-red-500/30'
          }`}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-red-400">Rejected</p>
            <h3 className="text-2xl sm:text-3xl font-black text-red-400 mt-1">{stats.rejected}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-[#111] border border-white/5 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer, email, text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-apex-red outline-none"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#1a1a1a] border border-white/10 text-xs text-white rounded-lg px-3 py-2 focus:border-apex-red outline-none cursor-pointer"
            >
              <option value="all">All Statuses ({stats.total})</option>
              <option value="pending">Pending Approval ({stats.pending})</option>
              <option value="approved">Approved Public ({stats.approved})</option>
              <option value="rejected">Rejected ({stats.rejected})</option>
            </select>

            {/* Rating Filter */}
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="bg-[#1a1a1a] border border-white/10 text-xs text-white rounded-lg px-3 py-2 focus:border-apex-red outline-none cursor-pointer"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars ★★★★★</option>
              <option value="4">4 Stars ★★★★☆</option>
              <option value="3">3 Stars ★★★☆☆</option>
              <option value="2">2 Stars ★★☆☆☆</option>
              <option value="1">1 Star ★☆☆☆☆</option>
            </select>

            {/* Product Filter */}
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="bg-[#1a1a1a] border border-white/10 text-xs text-white rounded-lg px-3 py-2 focus:border-apex-red outline-none cursor-pointer max-w-[200px] truncate"
            >
              <option value="all">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Verified Filter */}
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
              className="bg-[#1a1a1a] border border-white/10 text-xs text-white rounded-lg px-3 py-2 focus:border-apex-red outline-none cursor-pointer"
            >
              <option value="all">All Purchases</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>

            {(statusFilter !== 'all' || ratingFilter !== 'all' || productFilter !== 'all' || verifiedFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setRatingFilter('all');
                  setProductFilter('all');
                  setVerifiedFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs text-apex-red hover:underline font-semibold px-2 py-1 cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-apex-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-400">Loading reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No customer reviews found matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#1a1a1a] text-xs uppercase tracking-wider text-gray-400 border-b border-white/5">
                <tr>
                  <th className="py-3.5 px-6">Product</th>
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Rating</th>
                  <th className="py-3.5 px-6 max-w-xs">Review Details</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredReviews.map((review) => {
                  const isProcessing = processingId === review.id;
                  return (
                    <tr key={review.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Product */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded bg-black border border-white/10 flex items-center justify-center text-gray-400 shrink-0">
                            <Package size={15} />
                          </div>
                          <div>
                            <p className="font-bold text-white leading-tight text-xs sm:text-sm truncate max-w-[180px]">
                              {review.product_name || `Product #${review.product_id}`}
                            </p>
                            <span className="text-[10px] text-gray-500 font-mono">ID #{review.product_id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <p className="font-bold text-white text-xs sm:text-sm">{review.customer_name}</p>
                          <p className="text-[11px] text-gray-400 font-mono">{review.customer_email}</p>
                          {review.order_id && (
                            <p className="text-[10px] text-gray-400 font-mono">
                              Order: <strong className="text-white font-mono">{review.order_id}</strong>
                            </p>
                          )}
                          {review.verified_purchase ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              <ShieldCheck size={10} /> Verified Purchase
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] text-gray-500">Unverified</span>
                          )}
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1 text-amber-500">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={13}
                              className={s <= Number(review.rating) ? 'fill-amber-500 text-amber-500' : 'text-gray-700'}
                            />
                          ))}
                          <span className="text-xs text-white font-bold ml-1 font-mono">{review.rating}★</span>
                        </div>
                      </td>

                      {/* Review Details (Title, Text & Photos) */}
                      <td className="py-4 px-6 max-w-sm">
                        <div className="space-y-1">
                          {review.title && (
                            <h5 className="font-bold text-white text-xs leading-tight">
                              {review.title}
                            </h5>
                          )}
                          <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed whitespace-pre-line">
                            {review.review_text}
                          </p>
                          {Array.isArray(review.photos) && review.photos.length > 0 && (
                            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                              {review.photos.map((pUrl, pI) => (
                                <div key={pI} className="w-8 h-8 rounded-lg bg-black border border-white/10 overflow-hidden shrink-0">
                                  <img src={pUrl} alt="Review pic" className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 ${
                          review.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : review.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {review.status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                          <span className="capitalize">{review.status}</span>
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-6 text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(review.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approve Button */}
                          {review.status !== 'approved' && (
                            <button
                              onClick={() => handleUpdateStatus(review.id, 'approved')}
                              disabled={isProcessing}
                              className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Approve Review (Publish Publicly)"
                            >
                              <Check size={13} /> Approve
                            </button>
                          )}

                          {/* Reject Button */}
                          {review.status !== 'rejected' && (
                            <button
                              onClick={() => handleUpdateStatus(review.id, 'rejected')}
                              disabled={isProcessing}
                              className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Reject Review (Hide from Public)"
                            >
                              <X size={13} /> Reject
                            </button>
                          )}

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(review.id, review.customer_name)}
                            disabled={isProcessing}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete Permanently"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
