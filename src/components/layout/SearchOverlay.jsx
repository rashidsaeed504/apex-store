import { useEffect, useRef, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';
import { fetchProducts, fetchCategories } from '../../services/api';
import { formatPrice, slugify } from '../../utils/helpers';

export default function SearchOverlay() {
  const { 
    isSearchOpen, 
    closeSearch, 
    searchQuery, 
    setSearchQuery, 
    recentSearches, 
    addRecentSearch 
  } = useSearch();
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const [productsList, setProductsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      
      const handleEscape = (e) => {
        if (e.key === 'Escape') closeSearch();
      };
      window.addEventListener('keydown', handleEscape);

      // Load live products & categories from Supabase (same source as Shop page)
      async function loadLiveData() {
        setLoading(true);
        try {
          const [prods, cats] = await Promise.all([
            fetchProducts(),
            fetchCategories()
          ]);
          setProductsList(prods || []);
          setCategoriesList(cats || []);
        } catch (err) {
          console.warn('SearchOverlay live fetch error:', err);
        } finally {
          setLoading(false);
        }
      }
      loadLiveData();

      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isSearchOpen, closeSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery.trim());
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      closeSearch();
    }
  };

  const handleProductClick = (productName) => {
    addRecentSearch(searchQuery.trim() || productName);
    closeSearch();
  };

  // Filter live Supabase products dynamically
  const results = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return productsList.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const category = (p.category || '').toLowerCase();
      const subcategory = (p.subcategory || '').toLowerCase();
      const desc = (p.description || p.fullDescription || '').toLowerCase();
      const features = Array.isArray(p.features) ? p.features.join(' ').toLowerCase() : '';
      return (
        name.includes(q) ||
        category.includes(q) ||
        subcategory.includes(q) ||
        desc.includes(q) ||
        features.includes(q)
      );
    });
  }, [searchQuery, productsList]);
  
  const popularCategories = useMemo(() => {
    if (categoriesList && categoriesList.length > 0) {
      return categoriesList
        .filter((c) => c.is_active !== false && c.isActive !== false)
        .slice(0, 4)
        .map((c) => c.name);
    }
    return ['Audio', 'Smart Watches', 'Gaming', 'Accessories'];
  }, [categoriesList]);

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-apex-black/95 backdrop-blur-xl flex flex-col"
        >
          <div className="container mx-auto px-4 md:px-8 py-8 md:py-12 flex-1 flex flex-col">
            {/* Search Input Area */}
            <div className="relative mb-8 md:mb-16">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="absolute left-0 w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products, brands, or categories..."
                  className="w-full bg-transparent border-b border-white/10 text-xl md:text-3xl lg:text-4xl text-white font-medium pl-12 md:pl-16 pr-12 py-4 focus:outline-none focus:border-apex-red transition-colors placeholder:text-gray-600"
                />
                <button
                  type="button"
                  onClick={closeSearch}
                  className="absolute right-0 p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Close search"
                >
                  <X className="w-6 h-6 md:w-8 md:h-8" />
                </button>
              </form>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden pb-8">
              {loading && !productsList.length ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin text-apex-red mb-3" />
                  <p className="text-sm">Connecting to product database...</p>
                </div>
              ) : !searchQuery.trim() ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto w-full">
                  {recentSearches.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-6 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-apex-red" /> Recent Searches
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {recentSearches.map((term, i) => (
                          <button
                            key={i}
                            onClick={() => setSearchQuery(term)}
                            className="bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2 rounded-full text-sm transition-colors border border-white/5 cursor-pointer"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-6">Popular Categories</h3>
                    <div className="space-y-4">
                      {popularCategories.map((cat, i) => (
                        <Link
                          key={i}
                          to={`/shop?category=${encodeURIComponent(cat)}`}
                          onClick={closeSearch}
                          className="flex items-center text-lg text-gray-300 hover:text-apex-red transition-colors group"
                        >
                          {cat}
                          <ArrowRight className="w-5 h-5 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-6xl mx-auto w-full">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                      {results.length > 0 ? `Results for "${searchQuery}" (${results.length})` : 'No results found'}
                    </h3>
                  </div>
                  
                  {results.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {results.slice(0, 8).map((product) => {
                        const pSlug = product.slug || slugify(product.name) || product.id;
                        const pImage = (Array.isArray(product.images) && product.images[0]) || 
                                       product.image || 
                                       'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop';

                        return (
                          <Link
                            key={product.id}
                            to={`/product/${pSlug}`}
                            onClick={() => handleProductClick(product.name)}
                            className="group bg-[#0a0a0a] rounded-xl overflow-hidden border border-white/5 hover:border-apex-red/30 transition-all flex flex-row sm:flex-col shadow-lg"
                          >
                            <div className="w-1/3 sm:w-full aspect-square overflow-hidden bg-[#111] p-3 flex items-center justify-center">
                              <img 
                                src={pImage} 
                                alt={product.name} 
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                            <div className="p-4 w-2/3 sm:w-full flex flex-col justify-center sm:justify-start">
                              <p className="text-xs text-gray-500 mb-1 uppercase font-bold tracking-wider">{product.category}</p>
                              <h4 className="font-semibold text-white mb-2 line-clamp-1 group-hover:text-apex-red transition-colors">{product.name}</h4>
                              <p className="text-sm text-apex-red font-bold">{formatPrice(product.price)}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white/[0.02] rounded-2xl border border-white/5">
                      <p className="text-xl text-gray-400 mb-4">We couldn't find any products matching "{searchQuery}"</p>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="text-apex-red hover:text-red-400 font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer"
                      >
                        Clear search
                      </button>
                    </div>
                  )}
                  
                  {results.length > 8 && (
                    <div className="mt-8 text-center">
                      <Link 
                        to={`/shop?search=${encodeURIComponent(searchQuery.trim())}`}
                        onClick={closeSearch}
                        className="inline-flex items-center justify-center bg-apex-red hover:bg-[#b91c1c] text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all"
                      >
                        View all {results.length} results
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
