import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Grid } from 'lucide-react';
import { fetchProducts, fetchCategories, fetchSubcategories } from '../services/api';
import ProductGrid from '../components/product/ProductGrid';

export default function CategoryPage() {
  const { categorySlug, subcategorySlug } = useParams();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [subcategory, setSubcategory] = useState(null);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [allProducts, allCats, allSubs] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchSubcategories()
      ]);

      const matchedCat = allCats.find(
        (c) => (c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) === (categorySlug || '').toLowerCase()
      );

      setCategory(matchedCat || { name: categorySlug?.toUpperCase() || 'CATEGORY' });

      let matchedSub = null;
      if (subcategorySlug) {
        matchedSub = allSubs.find(
          (s) => (s.slug || s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) === (subcategorySlug || '').toLowerCase()
        );
        setSubcategory(matchedSub || { name: subcategorySlug });
      } else {
        setSubcategory(null);
      }

      if (matchedCat) {
        const subsForCat = allSubs.filter(
          (s) => Number(s.category_id || s.categoryId) === Number(matchedCat.id)
        );
        setAllSubcategories(subsForCat);
      }

      // Filter products by category and subcategory
      const filtered = allProducts.filter((p) => {
        const catNameMatch = matchedCat 
          ? (p.category || '').toLowerCase() === (matchedCat.name || '').toLowerCase()
          : (p.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') === (categorySlug || '').toLowerCase();

        if (!catNameMatch) return false;

        if (subcategorySlug && matchedSub) {
          return (p.subcategory || '').toLowerCase() === (matchedSub.name || '').toLowerCase() ||
                 Number(p.subcategory_id) === Number(matchedSub.id);
        }

        return true;
      });

      setProducts(filtered);
      setLoading(false);
    }
    loadData();
  }, [categorySlug, subcategorySlug]);

  return (
    <div className="pt-24 pb-16 min-h-screen bg-[#050505]">
      {/* Hero */}
      <section className="bg-apex-dark py-12 md:py-16 border-b border-white/5">
        <div className="container max-w-7xl mx-auto px-4 text-center">
          <Link
            to="/shop"
            className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-apex-red transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Shop
          </Link>
          <h1 className="text-3xl md:text-5xl font-black mb-3 text-white uppercase tracking-wider">
            {category?.name} {subcategory && <span className="text-apex-red">/ {subcategory.name}</span>}
          </h1>
          <p className="text-sm text-gray-400 max-w-xl mx-auto">
            {category?.description || category?.short_description || `Explore ${category?.name} collection`}
          </p>

          {/* Subcategory Pills Navigation */}
          {allSubcategories.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
              <Link
                to={`/category/${categorySlug}`}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                  !subcategorySlug
                    ? 'bg-apex-red text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                All {category?.name}
              </Link>
              {allSubcategories.map((sub) => (
                <Link
                  key={sub.id}
                  to={`/category/${categorySlug}/${sub.slug || sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                    subcategorySlug === (sub.slug || sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
                      ? 'bg-apex-red text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Product Section */}
      <section className="container max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-4 border-apex-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-400">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-400 bg-[#0a0a0a] rounded-2xl border border-white/5">
            No products found in this category.
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </section>
    </div>
  );
}
