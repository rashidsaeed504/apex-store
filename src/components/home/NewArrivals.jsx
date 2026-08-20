import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchNewArrivals } from '../../services/api';
import ProductCarousel from '../product/ProductCarousel';

const NewArrivals = () => {
  const [newArrivals, setNewArrivals] = useState([]);

  useEffect(() => {
    async function load() {
      const data = await fetchNewArrivals();
      setNewArrivals(data);
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
            title="NEW"
            highlightTitle="ARRIVALS" 
            products={newArrivals}
            showViewAll={true}
            viewAllLink="/new-arrivals"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default NewArrivals;
