import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  ShieldCheck, 
  CheckCircle2, 
  MessageSquare, 
  ThumbsUp, 
  Filter, 
  X, 
  ArrowUpDown, 
  Clock, 
  Lock, 
  AlertCircle, 
  Sparkles, 
  Loader2,
  Camera,
  Trash2,
  Save
} from 'lucide-react';
import { 
  fetchProductReviews, 
  submitProductReview, 
  checkReviewEligibility,
  uploadReviewPhoto 
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function ProductReviews({ productId, productName, onReviewsUpdated }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [userEligibility, setUserEligibility] = useState(null);
  const [checkingUserStatus, setCheckingUserStatus] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const fileInputRef = useRef(null);

  const { user, profile } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    reviewText: '',
    photos: [],
    existingReviewId: null,
  });
  const [hoveredRating, setHoveredRating] = useState(0);

  // Filter & Sort State
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'highest' | 'lowest'
  const [filterStar, setFilterStar] = useState('all'); // 'all' | 5 | 4 | 3 | 2 | 1

  const loadReviews = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const data = await fetchProductReviews(productId);
      setReviews(data || []);
    } catch (err) {
      console.warn('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkUserStatus = async () => {
    if (!user) {
      setUserEligibility({
        orderStatus: 'not_logged_in',
        reason: 'Sign in to review after purchase.',
      });
      return;
    }

    setCheckingUserStatus(true);
    try {
      const res = await checkReviewEligibility({
        productId,
        productName,
        user,
      });
      setUserEligibility(res);
    } catch (err) {
      console.warn('Eligibility check warning:', err);
    } finally {
      setCheckingUserStatus(false);
    }
  };

  useEffect(() => {
    loadReviews();
    checkUserStatus();

    const handleUpdate = () => {
      loadReviews();
      checkUserStatus();
    };

    window.addEventListener('apex_reviews_updated', handleUpdate);
    window.addEventListener('apex_orders_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('apex_reviews_updated', handleUpdate);
      window.removeEventListener('apex_orders_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [productId, user]);

  // Rating Statistics & Breakdown
  const stats = useMemo(() => {
    const total = reviews.length;
    if (total === 0) {
      return {
        average: 5.0,
        total: 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    reviews.forEach((r) => {
      const star = Math.max(1, Math.min(5, Math.round(Number(r.rating || 5))));
      breakdown[star] = (breakdown[star] || 0) + 1;
      sum += Number(r.rating || 5);
    });

    const average = Math.round((sum / total) * 10) / 10;
    const percentages = {
      5: Math.round((breakdown[5] / total) * 100),
      4: Math.round((breakdown[4] / total) * 100),
      3: Math.round((breakdown[3] / total) * 100),
      2: Math.round((breakdown[2] / total) * 100),
      1: Math.round((breakdown[1] / total) * 100),
    };

    return { average, total, breakdown, percentages };
  }, [reviews]);

  // Filtered & Sorted Reviews
  const displayedReviews = useMemo(() => {
    let result = [...reviews];

    if (filterStar !== 'all') {
      result = result.filter((r) => Math.round(Number(r.rating || 5)) === Number(filterStar));
    }

    switch (sortBy) {
      case 'highest':
        result.sort((a, b) => Number(b.rating) - Number(a.rating));
        break;
      case 'lowest':
        result.sort((a, b) => Number(a.rating) - Number(b.rating));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
    }

    return result;
  }, [reviews, filterStar, sortBy]);

  const handleOpenReviewModal = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setCheckingEligibility(true);
    setIsModalOpen(true);
    setHasSubmitted(false);

    try {
      const check = await checkReviewEligibility({
        productId,
        productName,
        user,
      });

      setUserEligibility(check);

      if (check.eligible) {
        if (check.existingReview) {
          setFormData({
            rating: Number(check.existingReview.rating || 5),
            title: check.existingReview.title || '',
            reviewText: check.existingReview.review_text || '',
            photos: Array.isArray(check.existingReview.photos) ? check.existingReview.photos : [],
            existingReviewId: check.existingReview.id,
          });
        } else {
          setFormData({
            rating: 5,
            title: '',
            reviewText: '',
            photos: [],
            existingReviewId: null,
          });
        }
      }
    } catch (err) {
      console.warn('Eligibility check failed:', err);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (formData.photos.length + files.length > 5) {
      toastError('You can upload a maximum of 5 photos.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const uploadPromises = files.map((file) => uploadReviewPhoto(file));
      const urls = await Promise.all(uploadPromises);
      const validUrls = urls.filter(Boolean);

      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...validUrls],
      }));
      success(`${validUrls.length} photo(s) attached!`);
    } catch (err) {
      console.warn('Photo upload failed:', err);
      toastError('Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (idx) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!formData.reviewText.trim()) {
      toastError('Please enter your review feedback.');
      return;
    }

    setSubmitting(true);
    try {
      await submitProductReview({
        productId,
        productName,
        customerName: profile?.full_name || user?.user_metadata?.full_name || 'Verified Customer',
        customerEmail: user?.email,
        rating: formData.rating,
        title: formData.title,
        reviewText: formData.reviewText,
        photos: formData.photos,
        user,
        existingReviewId: formData.existingReviewId,
      });

      setHasSubmitted(true);
      success('Thank you! Your verified review has been published.');
      await loadReviews();
      await checkUserStatus();
      if (onReviewsUpdated) onReviewsUpdated();
    } catch (err) {
      toastError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingLabel = (star) => {
    switch (star) {
      case 5: return 'Excellent! Top Performance';
      case 4: return 'Very Good Product';
      case 3: return 'Average / Meets Expectations';
      case 2: return 'Below Expectations';
      case 1: return 'Poor Experience';
      default: return '';
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Recently';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="mt-12 sm:mt-16 border-t border-white/10 pt-10 sm:pt-14">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-2.5">
            Customer <span className="text-apex-red">Reviews</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Genuine ratings & feedback from verified APEX customers with delivered orders.
          </p>
        </div>

        {/* Contextual Action Button based on Purchase & Delivery Status */}
        {checkingUserStatus ? (
          <div className="flex items-center gap-2 text-xs text-gray-500 font-mono py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-apex-red" />
            <span>Checking verified purchase status...</span>
          </div>
        ) : !user ? (
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 hover:text-white transition-colors self-start sm:self-auto"
          >
            <Lock className="w-3.5 h-3.5 text-gray-400" />
            <span>Sign in to review after purchase</span>
          </Link>
        ) : userEligibility?.orderStatus === 'not_purchased' ? (
          <div className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 bg-[#121212] border border-white/5 self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-gray-500" />
            <span>Purchase this product to leave a verified review</span>
          </div>
        ) : userEligibility?.orderStatus === 'in_transit' ? (
          <div className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 self-start sm:self-auto">
            <Clock className="w-3.5 h-3.5" />
            <span>Review available after delivery</span>
          </div>
        ) : userEligibility?.isAlreadyReviewed ? (
          <button
            type="button"
            onClick={handleOpenReviewModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer shadow-sm self-start sm:self-auto"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Reviewed • Edit Review</span>
          </button>
        ) : userEligibility?.eligible ? (
          <button
            type="button"
            onClick={handleOpenReviewModal}
            className="btn-primary inline-flex items-center justify-center px-6 py-3 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] cursor-pointer self-start sm:self-auto shrink-0"
          >
            <MessageSquare className="w-4 h-4 mr-2" /> Write a Review
          </button>
        ) : null}
      </div>

      {/* Ratings Summary Card */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 sm:p-8 mb-8 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left: Overall Score */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 md:pr-6">
            <span className="text-5xl sm:text-6xl font-black text-white tracking-tight font-mono">
              {stats.total > 0 ? stats.average.toFixed(1) : '5.0'}
            </span>
            <div className="flex items-center gap-1 text-amber-500 my-2.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={20}
                  className={
                    star <= Math.round(stats.average)
                      ? 'fill-amber-500 text-amber-500'
                      : 'text-gray-700'
                  }
                />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-gray-400 font-medium">
              Based on <span className="text-white font-bold">{stats.total}</span> verified review{stats.total === 1 ? '' : 's'}
            </p>
          </div>

          {/* Right: Star Breakdown Progress Bars */}
          <div className="md:col-span-8 space-y-2.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const pct = stats.percentages[star] || 0;
              const count = stats.breakdown[star] || 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs sm:text-sm">
                  <button
                    onClick={() => setFilterStar(filterStar === star ? 'all' : star)}
                    className={`flex items-center gap-1 w-16 text-left font-medium transition-colors cursor-pointer ${
                      filterStar === star ? 'text-apex-red font-bold' : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <span>{star}</span>
                    <Star size={14} className="fill-amber-500 text-amber-500" />
                  </button>

                  {/* Progress Bar Container */}
                  <div 
                    onClick={() => setFilterStar(filterStar === star ? 'all' : star)}
                    className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-apex-red rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <span className="w-12 text-right text-xs text-gray-400 font-mono">
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter and Sorting Controls */}
      {reviews.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-[#0a0a0a] p-3 sm:p-4 rounded-2xl border border-white/5">
          {/* Star Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-gray-400 mr-1 hidden sm:inline">Filter:</span>
            {['all', 5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                onClick={() => setFilterStar(star)}
                className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  filterStar === star
                    ? 'bg-apex-red text-white shadow-sm'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {star === 'all' ? 'All' : `${star} Stars`}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown size={14} className="text-gray-400" />
            <span className="text-xs text-gray-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#141414] border border-white/10 text-xs text-white rounded-xl px-3 py-1.5 focus:border-apex-red outline-none cursor-pointer"
            >
              <option value="newest">Most Recent</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-white/10" />
                <div className="space-y-1.5">
                  <div className="w-24 h-3 bg-white/10 rounded" />
                  <div className="w-16 h-2.5 bg-white/5 rounded" />
                </div>
              </div>
              <div className="w-full h-4 bg-white/5 rounded mb-2" />
              <div className="w-2/3 h-4 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : displayedReviews.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12 sm:py-16 bg-[#0a0a0a] rounded-3xl border border-white/5 p-6">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3 text-gray-500">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 uppercase tracking-wider">
            {filterStar === 'all' ? 'No Reviews Yet' : `No ${filterStar}-Star Reviews`}
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto mb-6">
            {filterStar === 'all'
              ? 'Have you received this item? Be the first verified customer to share your experience!'
              : 'There are no reviews matching this specific star rating filter.'}
          </p>
          {userEligibility?.eligible && !userEligibility?.isAlreadyReviewed && (
            <button
              onClick={handleOpenReviewModal}
              className="btn-primary inline-flex items-center px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 mr-2" /> Write Verified Review
            </button>
          )}
        </div>
      ) : (
        /* Reviews Cards */
        <div className="space-y-4">
          {displayedReviews.map((review) => {
            const photos = Array.isArray(review.photos) ? review.photos : [];

            return (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-5 sm:p-6 hover:border-white/15 transition-all shadow-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  {/* User & Verified Badge */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-apex-red/30 to-amber-500/20 border border-white/10 flex items-center justify-center font-bold text-white text-xs uppercase shrink-0">
                      {(review.customer_name || 'A')[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">
                          {review.customer_name}
                        </span>
                        {review.verified_purchase && (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                            <ShieldCheck size={11} className="text-emerald-400" />
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-500 font-mono">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={15}
                        className={
                          star <= Number(review.rating)
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-gray-700'
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* Review Title */}
                {review.title && (
                  <h4 className="font-bold text-white text-sm mb-1">
                    {review.title}
                  </h4>
                )}

                {/* Review Text */}
                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                  {review.review_text}
                </p>

                {/* Attached Photos */}
                {photos.length > 0 && (
                  <div className="flex items-center gap-2 pt-3 flex-wrap">
                    {photos.map((photoUrl, pIdx) => (
                      <div key={pIdx} className="w-16 h-16 rounded-xl bg-[#1a1a1a] border border-white/10 overflow-hidden shrink-0">
                        <img src={photoUrl} alt="Review evidence" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Write / Edit Review Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              onClick={() => !submitting && setIsModalOpen(false)} 
              className="fixed inset-0 bg-black/80 backdrop-blur-md" 
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-[#0e0e0e] border border-white/10 rounded-3xl p-6 sm:p-8 z-10 text-left space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wider text-white">
                    {formData.existingReviewId ? 'Edit Your' : 'Write a'} <span className="text-apex-red">Review</span>
                  </h3>
                  <p className="text-xs text-gray-400 truncate max-w-xs sm:max-w-sm mt-0.5">
                    {productName || 'APEX Gear'}
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

              {checkingEligibility ? (
                /* Checking verification state */
                <div className="py-12 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-apex-red animate-spin mx-auto" />
                  <p className="text-xs uppercase tracking-widest text-gray-400 font-mono">
                    Verifying purchase delivery...
                  </p>
                </div>
              ) : userEligibility && !userEligibility.eligible ? (
                /* Ineligible or Login Prompt State */
                <div className="py-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-white uppercase tracking-wider">
                    {userEligibility.requiresAuth ? 'Account Login Required' : 'Verified Buyer Review Policy'}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
                    {userEligibility.reason}
                  </p>

                  <div className="pt-4 flex justify-center gap-3">
                    {userEligibility.requiresAuth ? (
                      <Link
                        to="/login"
                        onClick={() => setIsModalOpen(false)}
                        className="btn-primary inline-flex items-center px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Sign In Now
                      </Link>
                    ) : (
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="px-6 py-2.5 rounded-xl text-xs font-semibold text-gray-300 bg-white/10 hover:bg-white/15 cursor-pointer"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>
              ) : hasSubmitted ? (
                /* Success Message */
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-white uppercase tracking-wider">
                    Thank You for Your Review!
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
                    Your feedback has been verified and posted to the APEX community.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer mt-4"
                  >
                    Done
                  </button>
                </div>
              ) : (
                /* Verified Review Form */
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  {/* Verified Badge Header */}
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-400 font-bold">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Delivered Purchase Verified — Reviewing as {profile?.full_name || user?.email}</span>
                  </div>

                  {/* Star Rating Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                      Overall Rating *
                    </label>
                    <div className="flex items-center gap-2 py-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => setFormData({ ...formData, rating: star })}
                          className="p-1 text-amber-500 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                        >
                          <Star
                            size={28}
                            className={
                              star <= (hoveredRating || formData.rating)
                                ? 'fill-amber-500 text-amber-500'
                                : 'text-gray-700'
                            }
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-gray-300 ml-2 font-mono">
                        {getRatingLabel(hoveredRating || formData.rating)}
                      </span>
                    </div>
                  </div>

                  {/* Review Title */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                      Review Title <span className="text-gray-500 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Incredible spatial sound and long battery life"
                      className="w-full bg-[#161616] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-apex-red outline-none"
                    />
                  </div>

                  {/* Review Comments */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                      Your Comments *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.reviewText}
                      onChange={(e) => setFormData({ ...formData, reviewText: e.target.value })}
                      placeholder="How is the sound performance, build quality, comfort, or battery life?"
                      className="w-full bg-[#161616] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-apex-red outline-none leading-relaxed resize-y"
                    />
                  </div>

                  {/* Photo Upload Section */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                      Add Photos <span className="text-gray-500 font-normal">(Optional, max 5)</span>
                    </label>

                    <div className="flex items-center gap-3 flex-wrap">
                      {formData.photos.map((photoUrl, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-xl bg-[#161616] border border-white/10 overflow-hidden group">
                          <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 transition-opacity cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}

                      {formData.photos.length < 5 && (
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            disabled={uploadingPhoto || submitting}
                            onClick={() => fileInputRef.current?.click()}
                            className="w-16 h-16 rounded-xl bg-[#161616] hover:bg-[#202020] border border-dashed border-white/20 hover:border-apex-red text-gray-400 hover:text-white flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            {uploadingPhoto ? (
                              <Loader2 size={18} className="animate-spin text-apex-red" />
                            ) : (
                              <>
                                <Camera size={18} />
                                <span className="text-[9px] font-bold uppercase">Add</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex justify-end gap-3">
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
                      disabled={submitting || uploadingPhoto}
                      className="btn-primary px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        formData.existingReviewId ? 'Update Review' : 'Submit Review'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
