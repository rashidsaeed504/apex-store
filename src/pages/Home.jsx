import React from 'react';
import Hero from '../components/home/Hero';
import FeaturedCategories from '../components/home/FeaturedCategories';
import PromotionalBanner from '../components/home/PromotionalBanner';
import BestSellers from '../components/home/BestSellers';
import TrendingProducts from '../components/home/TrendingProducts';
import NewArrivals from '../components/home/NewArrivals';
import SpecialOfferSection from '../components/home/SpecialOfferSection';
import WhyApex from '../components/home/WhyApex';
import AboutSection from '../components/home/AboutSection';
import InstagramFeed from '../components/home/InstagramFeed';
import Newsletter from '../components/home/Newsletter';

const Home = () => {
  return (
    <div className="min-h-screen bg-apex-black flex flex-col">
      <Hero />
      <FeaturedCategories />
      <BestSellers />
      <PromotionalBanner />
      <TrendingProducts />
      <SpecialOfferSection />
      <NewArrivals />
      <AboutSection />
      <WhyApex />
      <InstagramFeed />
      <Newsletter />
    </div>
  );
};

export default Home;
