import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShieldCheck, MessageSquare, Edit2, CheckCircle2, Package, Sparkles, X, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchCustomerReviews, fetchEligibleUnreviewedItems, submitProductReview } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/helpers';

export default function AccountReviews() {
  const { user, profile } = useAuth();
  const { success, error: toastError } = useToast();

  const [reviews, setReviews] = useState([]);
  const [unreviewedItems, setUnreviewedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('written'); // 'written' | 'pending'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [modalForm, setModalForm] = useState({
    productId: null,
    productName: '',
    rating: 5,
    reviewText: '',
    existingReviewId: null,
  });

  const [hoveredRating, setHoveredRating] = useState(0);

  const loadReviewData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [written, unreviewed] = await Promise.all([
        fetchCustomerReviews(user.id, user.email),
        fetchEligibleUnreviewedItems(user),
      ]);
      setReviews(written || []);
      setUnreviewedItems(unreviewed || []);
    } catch (err) {
      console.warn('Failed to load customer reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "My Product Reviews | APEX Store";
    loadReviewData();
  }, [user]);

  const handleOpenWriteModal = (item) => {
    setModalForm({
      productId: item.productId,
      productName: item.productName,
      rating: 5,
      reviewText: '',
      existingReviewId: null,
    });
    setHoveredRating(0);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (review) => {
    setModalForm({
      productId: review.product_id,
      productName: review.product_name,
      rating: Number(review.rating || 5),
      reviewText: review.review_text || '',
      existingReviewId: review.id,
    });
    setHoveredRating(0);
    setIsModalOpen(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!modalForm.reviewText.trim()) {
      toastError('Please enter your review comments.');
      return;
    }

    setSubmitting(true);
    try {
      await submitProductReview({
        productId: modalForm.productId,
        productName: modalForm.productName,
        customerName: profile?.full_name || user?.user_metadata?.full_name || 'Verified Customer',
        customerEmail: user?.email,
        rating: modalForm.rating,
        reviewText: modalForm.reviewText,
        user,
        existingReviewId: modalForm.existingReviewId,
      });

      success(modalForm.existingReviewId ? 'Review updated successfully!' : 'Verified review published!');
      setIsModalOpen(false);
      await loadReviewData();
    } catch (err) {
      console.warn('Review submission error:', err);
      toastError(err.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#0D0D0D] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black uppercase tracking-tight text-white leading-tight">
                PRODUCT <span className="text-apex-red">REVIEWS</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                Manage your feedback and share verified insights on delivered gear.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2.5 py-1 rounded-full text-[11px] font-bold self-start sm:self-auto">
            <ShieldCheck size={13} /> Verified Buyer Status
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 pt-3 sm:pt-4 border-t border-white/10">
          <button
            onClick={() => setActiveTab('written')}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'written'
                ? 'bg-apex-red text-white shadow-[0_0_15px_rgba(220,38,38,0.35)]'
                : 'bg-[#121212] text-gray-400 hover:text-white'
            }`}
          >
            My Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-apex-red text-white shadow-[0_0_15px_rgba(220,38,38,0.35)]'
                : 'bg-[#121212] text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles size={13} className="text-amber-400" />
            To Review ({unreviewedItems.length})
          </button>
        </div>
      </motion.div>

      {/* Tab 1: Written Reviews */}
      {activeTab === 'written' && (
        <div className="space-y-3 sm:space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-[#0D0D0D] border border-white/5 rounded-2xl sm:rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl sm:rounded-3xl p-8 sm:p-10 text-center">
              <MessageSquare className="w-10 h-10 text-gray-600 mx-auto mb-2.5" />
              <h3 className="text-sm font-bold uppercase text-white mb-1">No Reviews Written Yet</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto mb-5">
                When your purchases are delivered, you will be invited to write genuine customer reviews here.
              </p>
              {unreviewedItems.length > 0 && (
                <button
                  onClick={() => setActiveTab('pending')}
                  className="btn-primary inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Review Delivered Items ({unreviewedItems.length})
                </button>
              )}
            </div>
          ) : (
            reviews.map((review) => {
              const dateStr = review.created_at
                ? new Date(review.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Recently';

              return (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0D0D0D] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3 hover:border-white/20 transition-all shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-2">
                    <div>
                      <h4 className="font-bold text-white text-base">
                        {review.product_name || 'APEX Gear'}
                      </h4>
                      <span className="text-[11px] text-gray-500 font-mono">
                        Reviewed on {dateStr}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={15}
                            className={
                              s <= Number(review.rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-700'
                            }
                          />
                        ))}
                      </div>

                      <button
                        onClick={() => handleOpenEditModal(review)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                        title="Edit Review"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                    {review.review_text}
                  </p>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <ShieldCheck size={11} /> Verified Customer Purchase
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                      Status: {review.status || 'Approved'}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Delivered Items to Review */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {unreviewedItems.length === 0 ? (
            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-10 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold uppercase text-white mb-1">All Caught Up!</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                You have reviewed all delivered items from your orders. Thank you for contributing to the APEX community!
              </p>
            </div>
          ) : (
            unreviewedItems.map((item) => (
              <div
                key={item.productId}
                className="bg-[#0a0a0a] border border-white/10 hover:border-white/20 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#141414] border border-white/10 flex items-center justify-center text-apex-red font-bold shrink-0 overflow-hidden">
                    {item.productImage ? (
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm sm:text-base">
                      {item.productName}
                    </h4>
                    <p className="text-xs text-gray-400">
                      Delivered under Order <span className="font-mono text-white font-bold">#{item.orderNumber}</span>
                    </p>
                    {item.price && (
                      <p className="text-xs text-apex-red font-mono font-bold mt-0.5">
                        {formatPrice(item.price)}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleOpenWriteModal(item)}
                  className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.3)] cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <Star className="w-3.5 h-3.5 fill-current" /> Write Review
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Review Modal (Add / Edit) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              onClick={() => !submitting && setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-[#0e0e0e] border border-white/10 rounded-3xl p-6 sm:p-8 z-10 text-left space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wider text-white">
                    {modalForm.existingReviewId ? 'Edit' : 'Write'} <span className="text-apex-red">Review</span>
                  </h3>
                  <p className="text-xs text-gray-400 truncate max-w-xs sm:max-w-sm mt-0.5">
                    {modalForm.productName}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Rating Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                    Your Rating *
                  </label>
                  <div className="flex items-center gap-2 py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => setModalForm({ ...modalForm, rating: star })}
                        className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                      >
                        <Star
                          size={28}
                          className={
                            star <= (hoveredRating || modalForm.rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-700'
                          }
                        />
                      </button>
                    ))}
                    <span className="text-xs font-mono font-bold text-gray-300 ml-2">
                      {modalForm.rating} / 5 Stars
                    </span>
                  </div>
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Your Feedback *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={modalForm.reviewText}
                    onChange={(e) => setModalForm({ ...modalForm, reviewText: e.target.value })}
                    placeholder="Describe build quality, acoustics, performance, comfort, or value..."
                    className="w-full bg-[#161616] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-apex-red outline-none resize-y"
                  />
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                    <ShieldCheck size={12} /> Verified Buyer Review
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      disabled={submitting}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 bg-white/5 hover:bg-white/10 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {submitting ? 'Saving...' : modalForm.existingReviewId ? 'Update Review' : 'Post Review'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
