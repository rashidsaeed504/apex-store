import React, { useState, useEffect } from 'react';
import { Clock, Tag } from 'lucide-react';
import { fetchProducts, fetchCategories } from '../services/api';
import ProductGrid from '../components/product/ProductGrid';

const Deals = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [productsList, setProductsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState(['All']);

  useEffect(() => {
    fetchProducts().then(data => {
      setProductsList(data);
    });
    fetchCategories().then(data => {
      const active = data.filter((c) => c.is_active !== false && c.isActive !== false).map((c) => c.name);
      setCategoriesList(['All', ...active]);
    });
  }, []);

  const saleProducts = productsList.filter(p => p.discount > 0 || p.isOnSale === true).sort((a, b) => b.discount - a.discount);
  
  const filteredProducts = activeCategory === 'All' 
    ? saleProducts 
    : saleProducts.filter(p => (p.category || '').toLowerCase() === activeCategory.toLowerCase());

  return (
    <div className="pt-24 pb-16 min-h-screen">
      {/* Hero */}
      <section className="bg-apex-dark py-16 border-b border-white/5">
        <div className="container mx-auto px-4 text-center">
          <h1 
            className="text-4xl md:text-6xl font-black mb-6 flex flex-col md:flex-row items-center justify-center gap-4"
          >
            <Tag className="w-10 h-10 md:w-12 md:h-12 text-apex-red" />
            DEALS & OFFERS
          </h1>
          <p 
            className="text-xl text-gray-400 max-w-2xl mx-auto"
          >
            Limited time offers on premium tech. Don't miss out!
          </p>
        </div>
      </section>

      {/* Flash Deals Banner */}
      <section className="bg-apex-red py-10 shadow-[0_0_30px_rgba(220,38,38,0.3)]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6 text-white">
              <Clock className="w-12 h-12 animate-pulse" />
              <div>
                <h2 className="text-3xl font-black tracking-widest mb-1">FLASH DEALS</h2>
                <p className="text-white/90 font-medium">Grab these incredible discounts before time runs out!</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-black/20 backdrop-blur-sm px-5 py-3 rounded-xl text-center min-w-[80px]">
                <div className="text-4xl font-black">12</div>
                <div className="text-xs font-bold tracking-widest text-white/70 mt-1">HOURS</div>
              </div>
              <div className="text-3xl font-black text-white">:</div>
              <div className="bg-black/20 backdrop-blur-sm px-5 py-3 rounded-xl text-center min-w-[80px]">
                <div className="text-4xl font-black">45</div>
                <div className="text-xs font-bold tracking-widest text-white/70 mt-1">MINS</div>
              </div>
              <div className="text-3xl font-black text-white">:</div>
              <div className="bg-black/20 backdrop-blur-sm px-5 py-3 rounded-xl text-center min-w-[80px]">
                <div className="text-4xl font-black">30</div>
                <div className="text-xs font-bold tracking-widest text-white/70 mt-1">SECS</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deals Filter & Products */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-b border-white/10 pb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black">ON SALE NOW</h2>
            <p className="text-gray-400 text-sm mt-1">Showing {filteredProducts.length} discounted items</p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {categoriesList.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  activeCategory === category
                    ? 'bg-apex-red text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] scale-105'
                    : 'bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <ProductGrid products={filteredProducts} />
      </section>
    </div>
  );
};

export default Deals;
