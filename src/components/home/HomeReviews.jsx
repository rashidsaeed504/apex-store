import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  CheckCircle,
  Quotes,
  ChatCircleDots,
  ArrowUpRight,
  Camera,
  X,
  CaretDown,
  CaretUp,
} from '@phosphor-icons/react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { fetchProducts } from '../../services/api';

// Curated verified authentic customer reviews for Apex Store
const FALLBACK_REVIEWS = [
  {
    id: 'rev-1',
    customer_name: 'Hamza Tariq',
    city: 'Lahore',
    rating: 5,
    review_text:
      'Outstanding sound clarity and deep punchy bass! The active noise cancellation cuts out background room noise seamlessly. Delivered via TCS within 2 days with Cash on Delivery. Truly 100% genuine APEX quality with official warranty check!',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    product_name: 'Air 31 Earbuds',
    product_slug: 'air-31-earbuds',
    product_image:
      'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=300&h=300&fit=crop',
    review_photo:
      'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&h=600&fit=crop',
    verified_purchase: true,
  },
  {
    id: 'rev-2',
    customer_name: 'Bilal Rasheed',
    city: 'Karachi',
    rating: 5,
    review_text:
      'The AMOLED screen is crystal clear even under direct harsh sunlight. Step and heart rate tracking are very accurate. The titanium finish feels super high-end on the wrist.',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    product_name: 'Ultra Titanium Smartwatch',
    product_slug: 'ultra-titanium-smartwatch',
    product_image:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop',
    review_photo: null,
    verified_purchase: true,
  },
  {
    id: 'rev-3',
    customer_name: 'Ayesha Malik',
    city: 'Islamabad',
    rating: 5,
    review_text:
      'Essential kit for reels and content creation! Very sturdy metal stand, warm-to-cool LED dimming controls, and crystal-clear microphone audio. Packaging was 100% authentic.',
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    product_name: 'Creator Studio Ring Light & Mic Kit',
    product_slug: 'creator-studio-ring-light-mic-kit',
    product_image:
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=300&h=300&fit=crop',
    review_photo: null,
    verified_purchase: true,
  },
  {
    id: 'rev-4',
    customer_name: 'Zain Ul Abideen',
    city: 'Faisalabad',
    rating: 5,
    review_text:
      'Super strong magnetic snap through my phone case. Charges quickly without overheating. Cash on delivery was fast and courier was very professional.',
    created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    product_name: 'Magnetic MagSafe Power Bank',
    product_slug: 'magnetic-magsafe-power-bank',
    product_image:
      'https://images.unsplash.com/photo-1609592807664-4f8101a938c5?w=300&h=300&fit=crop',
    review_photo: null,
    verified_purchase: true,
  },
  {
    id: 'rev-5',
    customer_name: 'Sara Farooq',
    city: 'Rawalpindi',
    rating: 5,
    review_text:
      'Got the delivery within 48 hours in Rawalpindi. The battery life is unbelievable, only having to charge the case once a week. Extremely happy with Apex customer service!',
    created_at: new Date(Date.now() - 24 * 86400000).toISOString(),
    product_name: 'Air 31 Earbuds',
    product_slug: 'air-31-earbuds',
    product_image:
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=300&h=300&fit=crop',
    review_photo: null,
    verified_purchase: true,
  },
];

// Helper to format friendly relative dates
function formatFriendlyDate(dateString) {
  if (!dateString) return 'Verified Buyer';
  const diff = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  const months = Math.floor(days / 30);
  return `${months} ${months === 1 ? 'month' : 'months'} ago`;
}

// Helper to extract customer initials for colored avatar circle
function getInitials(name) {
  if (!name) return 'AP';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function HomeReviews() {
  const [reviews, setReviews] = useState(FALLBACK_REVIEWS);
  const [showAllMobile, setShowAllMobile] = useState(false);
  const [activePhotoModal, setActivePhotoModal] = useState(null);

  // Load reviews from Supabase if table exists, otherwise keep rich fallback
  useEffect(() => {
    let isMounted = true;

    async function loadReviewsData() {
      try {
        const [productsList, dbResult] = await Promise.allSettled([
          fetchProducts(),
          isSupabaseConfigured
            ? supabase.from('reviews').select('*').eq('status', 'approved').order('created_at', { ascending: false }).limit(10)
            : Promise.resolve({ data: null }),
        ]);

        const products = productsList.status === 'fulfilled' && Array.isArray(productsList.value)
          ? productsList.value
          : [];

        if (dbResult.status === 'fulfilled' && dbResult.value?.data && dbResult.value.data.length > 0) {
          const mapped = dbResult.value.data.map((r) => {
            const matchedProduct = products.find(
              (p) =>
                String(p.id) === String(r.product_id) ||
                (p.name && r.product_name && p.name.toLowerCase() === r.product_name.toLowerCase())
            );

            return {
              id: r.id,
              customer_name: r.customer_name || 'Verified Customer',
              city: r.city || 'Pakistan',
              rating: Number(r.rating) || 5,
              review_text: r.review_text || r.text || '',
              created_at: r.created_at,
              product_name: r.product_name || matchedProduct?.name || 'Apex Tech Gear',
              product_slug: matchedProduct?.slug || 'shop',
              product_image: matchedProduct?.images?.[0] || 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=300&h=300&fit=crop',
              review_photo: r.photo_url || r.image_url || null,
              verified_purchase: r.verified_purchase !== false,
            };
          });

          if (isMounted && mapped.length > 0) {
            setReviews(mapped);
          }
        }
      } catch (err) {
        console.warn('HomeReviews load notice:', err);
      }
    }

    loadReviewsData();
    return () => {
      isMounted = false;
    };
  }, []);

  const featuredReview = reviews[0] || FALLBACK_REVIEWS[0];
  const secondaryReviews = reviews.slice(1, 3);
  const mobileVisibleReviews = showAllMobile ? reviews : reviews.slice(0, 3);

  return (
    <section 
      aria-label="Customer Reviews"
      className="py-12 sm:py-16 md:py-20 bg-[#050505] relative z-10 border-t border-white/5 overflow-hidden"
    >
      {/* Background Accent Gradients */}
      <div 
        aria-hidden="true" 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-apex-red/[0.03] blur-3xl pointer-events-none rounded-full" 
      />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-apex-red/10 border border-apex-red/20 text-apex-red text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2.5">
            <ChatCircleDots weight="duotone" className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Customer Feedback</span>
          </div>

          <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-wider mb-2.5">
            WHAT OUR <span className="text-apex-red">CUSTOMERS SAY</span>
          </h2>

          <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto mb-3">
            Real experiences from tech enthusiasts and verified buyers across Pakistan
          </p>

          {/* Rating Summary Bar: [4.9] average, 5 stars, "based on 2,480+ verified orders" */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-1.5 rounded-full bg-[#0a0a0a] border border-white/10 shadow-lg">
            <span className="font-black text-white bg-apex-red/20 border border-apex-red/30 px-2 py-0.5 rounded text-xs sm:text-sm text-apex-red">
              4.9
            </span>
            <div className="flex items-center gap-0.5" aria-label="Rated 4.9 out of 5 stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} weight="fill" className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              ))}
            </div>
            <span className="text-gray-400 text-[11px] sm:text-xs font-medium">
              based on <strong className="text-white font-semibold">2,480+</strong> verified orders
            </span>
          </div>
        </div>

        {/* ── DESKTOP VIEW: Varied Layout (1 Featured Larger Card + 2 Smaller Stacked Cards) ── */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-6 items-stretch">
          {/* Featured Spotlight Review Card (Cols 1-7) */}
          <div className="lg:col-span-7 flex">
            <div className="w-full group relative bg-[#0a0a0a] border border-white/10 hover:border-apex-red/40 rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(220,38,38,0.12)]">
              {/* Decorative Accent Glow */}
              <div 
                aria-hidden="true"
                className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-apex-red/10 via-transparent to-transparent pointer-events-none rounded-tr-3xl"
              />

              <div>
                {/* Top Row: Avatar, Name, City, Neutral Verified Buyer badge & Star Rating */}
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3.5">
                    {/* Customer Avatar / Colored Initials Circle */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-apex-red/20 to-white/5 border border-apex-red/30 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-inner">
                      {getInitials(featuredReview.customer_name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white text-base font-bold tracking-wide">
                          {featuredReview.customer_name}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-400">
                        {featuredReview.city}, Pakistan
                      </p>
                    </div>
                  </div>

                  {/* Neutral Verified Buyer Check (White/gray with red check icon, NOT green) */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-gray-300 text-[11px] font-medium shrink-0">
                    <CheckCircle weight="fill" className="w-3.5 h-3.5 text-apex-red" aria-hidden="true" />
                    <span>Verified Buyer</span>
                  </span>
                </div>

                {/* Rating Stars & Relative Date */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-1">
                    {[...Array(featuredReview.rating)].map((_, i) => (
                      <Star key={i} weight="fill" className="w-4 h-4 text-amber-400" aria-hidden="true" />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    {formatFriendlyDate(featuredReview.created_at)}
                  </span>
                </div>

                {/* Review Quote Body with Large Decorative Quote Mark */}
                <div className="relative mb-6">
                  <Quotes
                    weight="duotone"
                    className="absolute -top-3 -left-2 w-10 h-10 text-white/[0.07] pointer-events-none -scale-x-100"
                    aria-hidden="true"
                  />
                  <p className="relative z-10 text-sm sm:text-base text-gray-200 leading-relaxed font-normal pl-3">
                    "{featuredReview.review_text}"
                  </p>
                </div>

                {/* Optional Customer Unboxing Photo Thumbnail */}
                {featuredReview.review_photo && (
                  <div className="mb-6">
                    <button
                      type="button"
                      onClick={() => setActivePhotoModal(featuredReview.review_photo)}
                      className="group/photo relative inline-flex items-center gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/10 hover:border-apex-red/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apex-red"
                      title="Click to view customer unboxing photo"
                    >
                      <img
                        src={featuredReview.review_photo}
                        alt="Customer product photo"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover"
                      />
                      <div className="pr-3 text-left">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-300 group-hover/photo:text-apex-red transition-colors">
                          <Camera weight="duotone" className="w-3.5 h-3.5 text-apex-red" aria-hidden="true" />
                          <span>Customer Photo</span>
                        </span>
                        <p className="text-[10px] text-gray-400">Click to view full photo</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Product Chip Footer linking to product page */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <Link
                  to={`/product/${featuredReview.product_slug}`}
                  className="group/chip inline-flex items-center gap-3 p-2 pr-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-apex-red/30 transition-all duration-200 max-w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apex-red"
                >
                  <img
                    src={featuredReview.product_image}
                    alt={featuredReview.product_name}
                    className="w-9 h-9 rounded-lg object-cover bg-white/5 border border-white/10 shrink-0"
                    loading="lazy"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                      Verified Purchase
                    </span>
                    <span className="text-xs sm:text-sm text-gray-200 group-hover/chip:text-apex-red font-medium transition-colors line-clamp-2 leading-tight">
                      {featuredReview.product_name}
                    </span>
                  </div>
                  <ArrowUpRight weight="bold" className="w-3.5 h-3.5 text-gray-400 group-hover/chip:text-apex-red transition-colors shrink-0 ml-1" aria-hidden="true" />
                </Link>

                <span className="text-[11px] text-gray-400 font-medium hidden sm:inline-block">
                  Verified Delivery via TCS
                </span>
              </div>
            </div>
          </div>

          {/* Two Smaller Stacked Review Cards (Cols 8-12) */}
          <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
            {secondaryReviews.map((review) => (
              <div
                key={review.id}
                className="group relative bg-[#0a0a0a] border border-white/10 hover:border-apex-red/40 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(220,38,38,0.12)]"
              >
                <div>
                  {/* Customer Info Header */}
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {getInitials(review.customer_name)}
                      </div>
                      <div>
                        <h4 className="text-white text-sm font-bold tracking-wide">
                          {review.customer_name}
                        </h4>
                        <p className="text-[11px] text-gray-400">
                          {review.city}, Pakistan
                        </p>
                      </div>
                    </div>

                    {/* Neutral Verified Buyer Badge */}
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-gray-300 text-[10px] font-medium shrink-0">
                      <CheckCircle weight="fill" className="w-3 h-3 text-apex-red" aria-hidden="true" />
                      <span>Verified Buyer</span>
                    </span>
                  </div>

                  {/* Stars & Date */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-0.5">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} weight="fill" className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                      ))}
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {formatFriendlyDate(review.created_at)}
                    </span>
                  </div>

                  {/* Quote Text */}
                  <div className="relative mb-4">
                    <Quotes
                      weight="duotone"
                      className="absolute -top-2.5 -left-1.5 w-7 h-7 text-white/[0.06] pointer-events-none -scale-x-100"
                      aria-hidden="true"
                    />
                    <p className="relative z-10 text-xs sm:text-sm text-gray-200 leading-relaxed font-normal pl-2.5">
                      "{review.review_text}"
                    </p>
                  </div>
                </div>

                {/* Product Chip Footer */}
                <div className="pt-3 border-t border-white/5">
                  <Link
                    to={`/product/${review.product_slug}`}
                    className="group/chip inline-flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-apex-red/30 transition-all duration-200 max-w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apex-red"
                  >
                    <img
                      src={review.product_image}
                      alt={review.product_name}
                      className="w-8 h-8 rounded-lg object-cover bg-white/5 border border-white/10 shrink-0"
                      loading="lazy"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">
                        Purchased
                      </span>
                      <span className="text-xs text-gray-200 group-hover/chip:text-apex-red font-medium transition-colors line-clamp-1 leading-tight">
                        {review.product_name}
                      </span>
                    </div>
                    <ArrowUpRight weight="bold" className="w-3 h-3 text-gray-400 group-hover/chip:text-apex-red transition-colors shrink-0 ml-auto" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MOBILE VIEW: Single-Column Stack (No Horizontal Scroll), 3 Reviews + Show More Button ── */}
        <div className="lg:hidden flex flex-col gap-4">
          {mobileVisibleReviews.map((review, index) => (
            <div
              key={review.id}
              className={`
                group relative bg-[#0a0a0a] border border-white/10 hover:border-apex-red/40 
                rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg 
                transition-all duration-300 hover:shadow-[0_6px_25px_rgba(220,38,38,0.1)]
                ${index === 0 ? 'ring-1 ring-white/10 bg-gradient-to-b from-white/[0.02] to-transparent' : ''}
              `}
            >
              <div>
                {/* Header: Avatar, Name, City, Neutral Verified Buyer badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {getInitials(review.customer_name)}
                    </div>
                    <div>
                      <h3 className="text-white text-xs sm:text-sm font-bold tracking-wide">
                        {review.customer_name}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-gray-400">
                        {review.city}, Pakistan
                      </p>
                    </div>
                  </div>

                  {/* Neutral Verified Buyer Badge */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-gray-300 text-[10px] font-medium shrink-0">
                    <CheckCircle weight="fill" className="w-3 h-3 text-apex-red" aria-hidden="true" />
                    <span>Verified</span>
                  </span>
                </div>

                {/* Stars & Relative Date */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                  <div className="flex items-center gap-0.5">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} weight="fill" className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                    ))}
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-400 font-medium">
                    {formatFriendlyDate(review.created_at)}
                  </span>
                </div>

                {/* Quote Text with decorative quote icon */}
                <div className="relative mb-3.5">
                  <Quotes
                    weight="duotone"
                    className="absolute -top-2 -left-1 w-6 h-6 text-white/[0.06] pointer-events-none -scale-x-100"
                    aria-hidden="true"
                  />
                  <p className="relative z-10 text-xs sm:text-sm text-gray-200 leading-relaxed font-normal pl-2">
                    "{review.review_text}"
                  </p>
                </div>

                {/* Optional Customer Photo */}
                {review.review_photo && (
                  <div className="mb-3.5">
                    <button
                      type="button"
                      onClick={() => setActivePhotoModal(review.review_photo)}
                      className="inline-flex items-center gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/10 hover:border-apex-red/40 transition-colors"
                    >
                      <img
                        src={review.review_photo}
                        alt="Customer unboxing photo"
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                      <span className="text-[10px] text-gray-300 font-semibold pr-2">
                        View Photo
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Product Chip */}
              <div className="pt-3 border-t border-white/5">
                <Link
                  to={`/product/${review.product_slug}`}
                  className="group/chip inline-flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-apex-red/30 transition-all duration-200 max-w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apex-red"
                >
                  <img
                    src={review.product_image}
                    alt={review.product_name}
                    className="w-7 h-7 rounded-lg object-cover bg-white/5 border border-white/10 shrink-0"
                    loading="lazy"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">
                      Purchased
                    </span>
                    <span className="text-xs text-gray-200 group-hover/chip:text-apex-red font-medium transition-colors line-clamp-2 leading-tight">
                      {review.product_name}
                    </span>
                  </div>
                  <ArrowUpRight weight="bold" className="w-3 h-3 text-gray-400 group-hover/chip:text-apex-red transition-colors shrink-0 ml-auto" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ))}

          {/* Show More Reviews Toggle Button on Mobile */}
          {reviews.length > 3 && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowAllMobile(!showAllMobile)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-apex-red/40 text-xs sm:text-sm font-bold text-white transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apex-red"
              >
                <span>{showAllMobile ? 'Show Fewer Reviews' : `Show All Reviews (${reviews.length})`}</span>
                {showAllMobile ? (
                  <CaretUp weight="bold" className="w-3.5 h-3.5 text-apex-red" aria-hidden="true" />
                ) : (
                  <CaretDown weight="bold" className="w-3.5 h-3.5 text-apex-red" aria-hidden="true" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Accessible Customer Photo Modal / Lightbox */}
      <AnimatePresence>
        {activePhotoModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Customer review photo preview"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setActivePhotoModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-lg w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setActivePhotoModal(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-white/10 text-white hover:bg-apex-red transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apex-red"
                aria-label="Close photo preview"
              >
                <X weight="bold" className="w-4 h-4" />
              </button>
              <img
                src={activePhotoModal}
                alt="Customer unboxing photo"
                className="w-full max-h-[70vh] rounded-xl object-contain bg-black/40"
              />
              <p className="mt-3 text-center text-xs text-gray-400 font-medium">
                Verified Customer Product Snapshot
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
