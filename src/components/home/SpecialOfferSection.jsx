import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { fetchActiveSpecialOffer } from "../../services/api";
import { formatPrice, slugify } from "../../utils/helpers";
import Rating from "../ui/Rating";

import { supabase, isSupabaseConfigured } from "../../lib/supabase";

function CountdownTimer({ endTime }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!endTime) {
      setTimeLeft(null);
      return;
    }

    const target = new Date(endTime).getTime();
    if (isNaN(target)) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        days,
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (!timeLeft) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181818] border border-white/10 text-xs font-mono font-bold text-gray-300">
      <Clock className="w-3.5 h-3.5 text-apex-red" />
      <span>ENDS IN:</span>
      <span className="text-white">
        {timeLeft.days > 0 ? `${timeLeft.days}d ` : ""}
        {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
      </span>
    </div>
  );
}

export default function SpecialOfferSection() {
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadOffer() {
      try {
        const data = await fetchActiveSpecialOffer();
        if (isMounted) setOffer(data);
      } catch (err) {
        console.warn("SpecialOffer fetch error:", err);
        if (isMounted) setOffer(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadOffer();

    const handleUpdated = () => {
      loadOffer();
    };

    window.addEventListener("apex_special_offer_updated", handleUpdated);
    window.addEventListener("storage", handleUpdated);

    let channel = null;
    if (isSupabaseConfigured) {
      try {
        channel = supabase
          .channel("public:special_offer_sync")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "products" },
            () => loadOffer()
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "special_offers" },
            () => loadOffer()
          )
          .subscribe();
      } catch (e) {
        console.warn("Realtime special offer subscription warning:", e);
      }
    }

    return () => {
      isMounted = false;
      window.removeEventListener("apex_special_offer_updated", handleUpdated);
      window.removeEventListener("storage", handleUpdated);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  if (loading) {
    return (
      <section className="py-12 sm:py-16 md:py-20 bg-[#050505] border-t border-white/5">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#0a0a0a] rounded-2xl sm:rounded-3xl border border-white/10 p-8 sm:p-12 animate-pulse h-96 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-apex-red border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  // If disabled, expired, or no active offer: completely hide the section cleanly
  if (!offer || offer.isActive === false) return null;

  const productSlug =
    offer.slug || slugify(offer.name) || offer.productId || offer.id;
  const productImage =
    offer.image ||
    (Array.isArray(offer.images) && offer.images[0]) ||
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop";

  const discountPercent =
    Number(offer.discount) > 0
      ? Number(offer.discount)
      : offer.originalPrice &&
          offer.price &&
          Number(offer.originalPrice) > Number(offer.price)
        ? Math.round(
            ((Number(offer.originalPrice) - Number(offer.price)) /
              Number(offer.originalPrice)) *
              100,
          )
        : null;

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-[#050505] relative z-10 overflow-hidden border-t border-white/5">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative bg-gradient-to-br from-[#0c0c0c] via-[#080808] to-[#050505] rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.9)]"
        >
          {/* Ambient red spotlight aura */}
          {/* <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-80 h-80 sm:w-[500px] sm:h-[500px] bg-apex-red/15 blur-[120px] rounded-full pointer-events-none z-0" /> */}

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-center">
            {/* LEFT COLUMN: Large Product Visual Display */}
            <div className="lg:col-span-6 p-6 sm:p-10 lg:p-14 flex items-center justify-center relative">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="relative w-full max-w-md aspect-square rounded-2xl bg-[#080808]/90 border border-white/10 p-6 sm:p-8 flex items-center justify-center group overflow-hidden shadow-2xl"
              >
                {/* Discount Badge */}
                {discountPercent && (
                  <div className="absolute top-4 left-4 z-20 bg-apex-red text-white text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                    -{discountPercent}% OFF
                  </div>
                )}

                {/* Product Image */}
                <img
                  src={productImage}
                  alt={offer.name}
                  loading="lazy"
                  className="w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] group-hover:scale-105 transition-transform duration-500"
                />
              </motion.div>
            </div>

            {/* RIGHT COLUMN: Product Information & Call to Action */}
            <div className="lg:col-span-6 p-6 sm:p-10 lg:pr-14 lg:pl-4 flex flex-col justify-center text-left">
              {/* Badge & Urgency Pill & Optional Countdown */}
              <div className="flex items-center gap-2.5 flex-wrap mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-apex-red/15 text-apex-red text-[10px] sm:text-xs font-bold uppercase tracking-widest border border-apex-red/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-apex-red animate-ping" />
                  {offer.badgeText || "SPECIAL OFFER"}
                </span>

                <span className="inline-flex items-center gap-1 text-gray-400 text-xs font-medium">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  {offer.dealLabel || "Limited Time Deal"}
                </span>

                {/* Live Countdown Timer if configured */}
                <CountdownTimer endTime={offer.endAt || offer.ends_at || offer.end_time} />
              </div>

              {/* Product Category & Rating */}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs uppercase font-bold text-gray-500 tracking-wider">
                  {offer.category}
                </span>
                {offer.rating && (
                  <div className="flex items-center gap-1.5">
                    <Rating rating={offer.rating} size="sm" />
                    <span className="text-xs text-gray-400 font-mono">
                      ({offer.reviews || 48})
                    </span>
                  </div>
                )}
              </div>

              {/* Product Title */}
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight mb-3 sm:mb-4 leading-tight">
                {offer.name}
              </h2>

              {/* Product Description */}
              <p className="text-gray-400 text-xs sm:text-sm md:text-base mb-6 leading-relaxed line-clamp-3 max-w-xl">
                {offer.description ||
                  "Experience premium sound and high-performance engineering designed for champions."}
              </p>

              {/* Price Block */}
              <div className="flex items-baseline gap-3 sm:gap-4 mb-6 sm:mb-8 flex-wrap">
                <span className="text-2xl sm:text-3xl md:text-4xl font-black text-apex-red tracking-tight font-mono">
                  {formatPrice(offer.price)}
                </span>
                {offer.originalPrice &&
                  Number(offer.originalPrice) > Number(offer.price) && (
                    <span className="text-base sm:text-xl text-gray-500 line-through font-medium font-mono">
                      {formatPrice(offer.originalPrice)}
                    </span>
                  )}
                {discountPercent && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 uppercase tracking-wider">
                    Save {discountPercent}%
                  </span>
                )}
              </div>

              {/* Features List */}
              {Array.isArray(offer.features) && offer.features.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6 max-w-md">
                  {offer.features.slice(0, 4).map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs text-gray-300"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-apex-red shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <Link
                  to={`/product/${productSlug}`}
                  className="btn-primary group inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs sm:text-sm shadow-[0_0_25px_rgba(220,38,38,0.4)] hover:shadow-[0_0_40px_rgba(220,38,38,0.7)] transition-all"
                >
                  <span>{offer.primaryButtonText || "SHOP NOW"}</span>
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/deals"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 font-bold uppercase tracking-wider text-xs sm:text-sm transition-colors"
                >
                  {offer.secondaryButtonText || "VIEW ALL DEALS"}
                </Link>
              </div>

              {/* Security / Quality Trust */}
              <div className="mt-6 pt-6 border-t border-white/5 flex items-center gap-4 text-[11px] text-gray-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-apex-red" />{" "}
                  {offer.warrantyText || "Official 1-Year Warranty"}
                </span>
                <span>•</span>
                <span>
                  {offer.deliveryText || "Express Delivery Across Pakistan"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
