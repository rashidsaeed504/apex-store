import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Clock,
} from "lucide-react";
import { fetchActiveSpecialOffer } from "../../services/api";
import { formatPrice, slugify } from "../../utils/helpers";
import Rating from "../ui/Rating";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { gsap, useGSAP, isReducedMotion } from "../../lib/motion";
import MagneticButton from "../../lib/motion/components/MagneticButton";
import TechBackground from "../../lib/motion/components/TechBackground";

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
  const sectionRef = useRef(null);

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
          .channel("public:special_offers_sync")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "special_offers" },
            () => loadOffer(),
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

  const discountPercent = useMemo(() => {
    if (!offer?.price || !offer?.originalPrice) return null;
    const orig = Number(offer.originalPrice);
    const curr = Number(offer.price);
    if (orig > curr && orig > 0) {
      return Math.round(((orig - curr) / orig) * 100);
    }
    return null;
  }, [offer]);

  useGSAP(
    () => {
      if (!offer || loading || isReducedMotion() || !sectionRef.current) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          once: true,
        },
        defaults: { ease: 'power3.out' },
      });

      tl.fromTo(
        '.special-offer-card',
        { opacity: 0, y: 40, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power4.out' }
      )
        .fromTo(
          '.offer-img-box',
          { opacity: 0, x: -30, scale: 0.94 },
          { opacity: 1, x: 0, scale: 1, duration: 0.8 },
          '-=0.5'
        )
        .fromTo(
          '.offer-info-col > *',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 },
          '-=0.6'
        );
    },
    { dependencies: [offer, loading], scope: sectionRef }
  );

  if (loading) {
    return (
      <div className="py-10 sm:py-16 bg-[#050505] relative z-10 border-t border-white/5">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-[380px] bg-[#0a0a0a] border border-white/5 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!offer || offer.is_active === false || offer.isActive === false) {
    return null;
  }

  const productSlug =
    offer.slug ||
    offer.product?.slug ||
    slugify(offer.name) ||
    `offer-${offer.id}`;
  const productImage =
    offer.image_url ||
    offer.image ||
    offer.product?.images?.[0] ||
    offer.product?.image ||
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop";

  return (
    <section
      ref={sectionRef}
      className="py-12 sm:py-16 md:py-24 bg-[#050505] relative z-10 overflow-hidden border-t border-white/5"
    >
      <TechBackground variant="crosshair" glowPosition="center" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="special-offer-card relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#111111] to-[#070707] overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.15)] group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-apex-red/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-0 items-center">
            <div className="lg:col-span-6 p-6 sm:p-10 lg:p-14 flex items-center justify-center relative">
              <div className="absolute w-64 h-64 sm:w-80 sm:h-80 bg-apex-red/25 rounded-full blur-[90px] pointer-events-none" />

              <div className="offer-img-box relative z-10 w-full max-w-[340px] sm:max-w-[420px] aspect-square flex items-center justify-center">
                <img
                  src={productImage}
                  alt={offer.name}
                  loading="lazy"
                  className="w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            <div className="offer-info-col lg:col-span-6 p-6 sm:p-10 lg:pr-14 lg:pl-4 flex flex-col justify-center text-left">
              <div className="flex items-center gap-2.5 flex-wrap mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-apex-red/15 text-apex-red text-[10px] sm:text-xs font-bold uppercase tracking-widest border border-apex-red/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-apex-red animate-ping" />
                  {offer.badgeText || "SPECIAL OFFER"}
                </span>

                <span className="inline-flex items-center gap-1 text-gray-400 text-xs font-medium">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  {offer.dealLabel || "Limited Time Deal"}
                </span>

                <CountdownTimer endTime={offer.endAt || offer.ends_at || offer.end_time} />
              </div>

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

              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight mb-3 sm:mb-4 leading-tight">
                {offer.name}
              </h2>

              <p className="text-gray-400 text-xs sm:text-sm md:text-base mb-6 leading-relaxed line-clamp-3 max-w-xl">
                {offer.description ||
                  "Experience premium sound and high-performance engineering designed for champions."}
              </p>

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

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <MagneticButton
                  to={`/product/${productSlug}`}
                  className="btn-primary inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs sm:text-sm shadow-[0_0_25px_rgba(220,38,38,0.4)] hover:shadow-[0_0_40px_rgba(220,38,38,0.7)] transition-all"
                >
                  <span>{offer.primaryButtonText || "SHOP NOW"}</span>
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </MagneticButton>

                <Link
                  to="/deals"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 font-bold uppercase tracking-wider text-xs sm:text-sm transition-colors"
                >
                  {offer.secondaryButtonText || "VIEW ALL DEALS"}
                </Link>
              </div>

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
        </div>
      </div>
    </section>
  );
}
