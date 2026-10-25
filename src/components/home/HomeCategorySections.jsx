import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { fetchProducts, fetchCategories } from '../../services/api';
import ProductCard from '../product/ProductCard';

export default function HomeCategorySections() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [allProducts, allCats] = await Promise.all([
          fetchProducts(),
          fetchCategories()
        ]);

        if (!isMounted) return;

        const validProducts = Array.isArray(allProducts) ? allProducts : [];
        const validCats = Array.isArray(allCats) ? allCats : [];

        // Build 4 distinct category product sections
        const categoryGroups = [];
        const usedProductIds = new Set();

        validCats.forEach((cat) => {
          const catName = cat.name || '';
          const catSlug = cat.slug || catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

          // Filter matching products
          const matching = validProducts.filter((p) => {
            if (!p) return false;
            const pCat = (p.category || '').toLowerCase();
            const targetCat = catName.toLowerCase();
            return pCat === targetCat || pCat.includes(targetCat) || targetCat.includes(pCat);
          });

          // Pick 4 distinct products
          const selected = [];
          for (const item of matching) {
            const id = item.id || item.slug;
            if (!usedProductIds.has(id) && selected.length < 4) {
              usedProductIds.add(id);
              selected.push(item);
            }
          }

          // If not enough unique, fallback to available in category
          if (selected.length < 4 && matching.length > 0) {
            for (const item of matching) {
              if (selected.length >= 4) break;
              if (!selected.some((s) => s.id === item.id)) {
                selected.push(item);
              }
            }
          }

          if (selected.length > 0) {
            categoryGroups.push({
              category: cat,
              name: catName,
              slug: catSlug,
              subtitle: cat.short_description || cat.description || `Explore ${catName} collection`,
              products: selected,
            });
          }
        });

        setSections(categoryGroups);
      } catch (err) {
        console.warn('HomeCategorySections load error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="py-8 sm:py-12 bg-[#050505]">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-6 w-36 bg-white/5 rounded-lg mb-4 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-[#0a0a0a] border border-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (sections.length === 0) return null;

  return (
    <div className="space-y-10 sm:space-y-16">
      {sections.map(({ category, name, slug, subtitle, products }, sectionIdx) => (
        <section
          key={category.id || slug || sectionIdx}
          className="py-8 sm:py-12 bg-[#050505] relative z-10 border-t border-white/5"
        >
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="flex items-end justify-between mb-4 sm:mb-6">
              <div>
                <div className="flex items-center gap-1.5 text-apex-red text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-1">
                  <Sparkles className="w-3 h-3 text-apex-red" />
                  <span>Category Showcase</span>
                </div>
                <h2 className="text-base sm:text-2xl md:text-3xl font-black text-white uppercase tracking-wider leading-tight">
                  {name}
                </h2>
              </div>

              {/* Desktop "View All" link */}
              <Link
                to={`/category/${slug}`}
                className="hidden md:flex text-xs sm:text-sm font-bold text-gray-400 hover:text-apex-red transition-colors uppercase tracking-wider items-center gap-1.5"
              >
                <span>VIEW ALL {name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Product Grid: 2-Column on Mobile, 4-Column on Desktop */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              {products.map((product, pIdx) => (
                <div key={product.id || pIdx} className="w-full">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {/* Mobile-Only Full-Width "View All" Button */}
            <div className="block md:hidden mt-4 pt-1">
              <Link
                to={`/category/${slug}`}
                className="w-full min-h-[44px] py-3 px-4 bg-[#0d0d0d] hover:bg-white/5 border border-white/10 hover:border-apex-red/50 rounded-xl text-center text-xs font-bold uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2 group shadow-sm active:scale-[0.99]"
              >
                <span>VIEW ALL {name}</span>
                <ArrowRight className="w-3.5 h-3.5 text-apex-red group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
