import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchNewArrivals } from '../services/api';
import ProductGrid from '../components/product/ProductGrid';

export default function NewArrivalsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchNewArrivals();
      setProducts(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="pt-24 pb-16 min-h-screen bg-[#050505]">
      {/* Hero */}
      <section className="bg-apex-dark py-12 md:py-16 border-b border-white/5">
        <div className="container max-w-7xl mx-auto px-4 text-center">
          <Link
            to="/shop"
            className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-apex-red transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to All Products
          </Link>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-white uppercase tracking-wider">
            <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-blue-400" />
            New <span className="text-apex-red">Arrivals</span>
          </h1>
          <p className="text-sm md:text-base text-gray-400 max-w-xl mx-auto">
            Explore our latest releases and cutting-edge tech additions.
          </p>
        </div>
      </section>

      {/* Product Section */}
      <section className="container max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-4 border-apex-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-400">Loading New Arrivals...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-400 bg-[#0a0a0a] rounded-2xl border border-white/5">
            No New Arrival products found.
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </section>
    </div>
  );
}
