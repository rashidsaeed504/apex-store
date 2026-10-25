import React, { useState, useEffect } from 'react';
import { fetchBestSellers } from '../../services/api';
import ProductCarousel from '../product/ProductCarousel';

const BestSellers = () => {
  const [bestSellers, setBestSellers] = useState([]);

  useEffect(() => {
    async function load() {
      const data = await fetchBestSellers();
      setBestSellers(data);
    }
    load();
  }, []);

  return (
    <section className="py-10 sm:py-16 md:py-24 bg-[#050505] relative z-10">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProductCarousel
          title="BEST"
          highlightTitle="SELLERS"
          showViewAll={true}
          viewAllLink="/best-sellers"
          products={bestSellers}
        />
      </div>
    </section>
  );
};

export default BestSellers;
