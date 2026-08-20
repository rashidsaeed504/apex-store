import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchTrendingProducts } from '../../services/api';
import ProductCarousel from '../product/ProductCarousel';

const TrendingProducts = () => {
  const [trendingProducts, setTrendingProducts] = useState([]);

  useEffect(() => {
    async function load() {
      const data = await fetchTrendingProducts();
      setTrendingProducts(data);
    }
    load();
  }, []);

  return (
    <section className="py-10 sm:py-16 md:py-24 bg-[#050505] relative z-10 border-t border-white/5">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
        >
          <ProductCarousel 
            title="TRENDING"
            highlightTitle="NOW" 
            products={trendingProducts}
            showViewAll={true}
            viewAllLink="/trending"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default TrendingProducts;
