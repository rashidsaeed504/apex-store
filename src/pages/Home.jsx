import React, { Suspense, lazy } from 'react';
import Hero from '../components/home/Hero';
import FeaturedCategories from '../components/home/FeaturedCategories';
import BestSellers from '../components/home/BestSellers';

// ── Progressive Loading: Below-the-fold sections load on demand ──
const PromotionalBanner = lazy(() => import('../components/home/PromotionalBanner'));
const NewArrivals = lazy(() => import('../components/home/NewArrivals'));
const HomeCategorySections = lazy(() => import('../components/home/HomeCategorySections'));
const WhyApex = lazy(() => import('../components/home/WhyApex'));
const HomeReviews = lazy(() => import('../components/home/HomeReviews'));
const HomeFAQ = lazy(() => import('../components/home/HomeFAQ'));
const Newsletter = lazy(() => import('../components/home/Newsletter'));

// Minimal skeleton for lazy-loaded sections (aspect-square cards to prevent layout shift)
const SectionSkeleton = () => (
  <div className="py-8 sm:py-16 bg-[#050505]">
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="h-7 w-44 bg-white/5 rounded-lg mb-4 sm:mb-6 animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="aspect-square bg-[#0a0a0a] border border-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

// Slim skeleton matching the compact horizontal campaign banner
const BannerSkeleton = () => (
  <div className="py-2.5 sm:py-3.5 md:py-4.5 bg-[#050505]">
    <div className="container max-w-7xl mx-auto px-3.5 sm:px-4 md:px-6 lg:px-8">
      <div className="w-full aspect-[4.2/1] sm:aspect-[4.4/1] md:aspect-[4.5/1] rounded-[10px] sm:rounded-xl bg-white/[0.03] border border-white/5 animate-pulse" />
    </div>
  </div>
);

const Home = () => {
  return (
    <div className="min-h-screen bg-apex-black flex flex-col overflow-x-hidden">
      {/* 3. Existing Image Slider: Hero (Protected — untouched) */}
      <Hero />

      {/* 4. Shop by Category */}
      <FeaturedCategories />

      {/* Promotional Banner (Directly at bottom of categories section) */}
      <Suspense fallback={<BannerSkeleton />}>
        <PromotionalBanner position="middle" />
      </Suspense>

      {/* 5. Best Sellers (2-column grid on mobile with View All button) */}
      <BestSellers />

      {/* Optional Pre-Footer / Secondary Banner (if configured in Admin) */}
      <Suspense fallback={null}>
        <PromotionalBanner position="bottom" />
      </Suspense>

      {/* 7. New Arrivals (2-column grid on mobile with View All button) */}
      <Suspense fallback={<SectionSkeleton />}>
        <NewArrivals />
      </Suspense>

      {/* 8. Category Sections (Earbuds, Smartwatches, Gaming, Mobile Gear in 2x2 grid on mobile) */}
      <Suspense fallback={<SectionSkeleton />}>
        <HomeCategorySections />
      </Suspense>

      {/* 9. Why Choose Us (2x2 grid: Cash on Delivery, Fast Delivery, Warranty, Easy Returns) */}
      <Suspense fallback={null}>
        <WhyApex />
      </Suspense>

      {/* 10. Customer Reviews (3 verified review cards) */}
      <Suspense fallback={null}>
        <HomeReviews />
      </Suspense>

      {/* 11. FAQ (Accordion with 4 questions about delivery, payment, warranty, returns) */}
      <Suspense fallback={null}>
        <HomeFAQ />
      </Suspense>

      {/* Newsletter
      <Suspense fallback={null}>
        <Newsletter />
      </Suspense> */}
    </div>
  );
};

export default Home;
