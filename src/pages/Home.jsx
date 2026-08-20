import React, { Suspense, lazy } from 'react';
import Hero from '../components/home/Hero';
import FeaturedCategories from '../components/home/FeaturedCategories';
import BestSellers from '../components/home/BestSellers';

// ── Progressive Loading: Below-the-fold sections load on demand ──
const PromotionalBanner = lazy(() => import('../components/home/PromotionalBanner'));
const TrendingProducts = lazy(() => import('../components/home/TrendingProducts'));
const SpecialOfferSection = lazy(() => import('../components/home/SpecialOfferSection'));
const NewArrivals = lazy(() => import('../components/home/NewArrivals'));
const AboutSection = lazy(() => import('../components/home/AboutSection'));
const WhyApex = lazy(() => import('../components/home/WhyApex'));
const InstagramFeed = lazy(() => import('../components/home/InstagramFeed'));
const Newsletter = lazy(() => import('../components/home/Newsletter'));

// Minimal skeleton for lazy-loaded sections
const SectionSkeleton = () => (
  <div className="py-10 sm:py-16 bg-[#050505]">
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="h-8 w-48 bg-white/5 rounded-lg mb-6 animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-[200px] bg-[#0a0a0a] border border-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

const Home = () => {
  return (
    <div className="min-h-screen bg-apex-black flex flex-col">
      {/* Above the fold — loads immediately */}
      <Hero />
      <FeaturedCategories />
      <BestSellers />

      {/* Below the fold — loads progressively */}
      <Suspense fallback={<SectionSkeleton />}>
        <PromotionalBanner />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <TrendingProducts />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <SpecialOfferSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <NewArrivals />
      </Suspense>
      <Suspense fallback={null}>
        <AboutSection />
      </Suspense>
      <Suspense fallback={null}>
        <WhyApex />
      </Suspense>
      <Suspense fallback={null}>
        <InstagramFeed />
      </Suspense>
      <Suspense fallback={null}>
        <Newsletter />
      </Suspense>
    </div>
  );
};

export default Home;
