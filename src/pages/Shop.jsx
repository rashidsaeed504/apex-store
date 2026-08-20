import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X } from "lucide-react";
import { fetchProducts } from "../services/api";
import ProductGrid from "../components/product/ProductGrid";
import FilterSidebar from "../components/product/FilterSidebar";
import SectionHeader from "../components/ui/SectionHeader";

export default function Shop() {
  const [searchParams] = useSearchParams();
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
    categories: searchParams.get("category")
      ? [searchParams.get("category")]
      : [],
    subcategories: searchParams.get("subcategory")
      ? [searchParams.get("subcategory")]
      : [],
    priceRange: [0, 20000],
    minRating: 0,
    sortBy: "newest",
    search: searchParams.get("search") || "",
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchProducts();
      setProductsList(data);
      setLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    const subcategoryParam = searchParams.get("subcategory");
    const searchParam = searchParams.get("search");

    setFilters((prev) => ({
      ...prev,
      categories: categoryParam ? [categoryParam] : prev.categories,
      subcategories: subcategoryParam ? [subcategoryParam] : prev.subcategories,
      search: searchParam !== null ? searchParam : prev.search,
    }));
  }, [searchParams]);

  const [visibleCount, setVisibleCount] = useState(8);

  const filteredProducts = useMemo(() => {
    let result = [...productsList];

    // Search filter
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(q)),
      );
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      result = result.filter((p) =>
        filters.categories.some((c) => {
          const catName = c.toLowerCase();
          const pCat = (p.category || "").toLowerCase();
          return (
            pCat === catName ||
            (catName === "headsets" &&
              (pCat === "audio" || pCat === "headsets")) ||
            (catName === "audio" && (pCat === "headsets" || pCat === "audio"))
          );
        }),
      );
    }

    // Subcategory filter
    if (filters.subcategories && filters.subcategories.length > 0) {
      result = result.filter((p) =>
        filters.subcategories.some(
          (sub) => (p.subcategory || "").toLowerCase() === sub.toLowerCase(),
        ),
      );
    }

    // Price filter
    result = result.filter(
      (p) =>
        p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1],
    );

    // Rating filter
    if (filters.minRating > 0) {
      result = result.filter((p) => p.rating >= filters.minRating);
    }

    // Sorting
    switch (filters.sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
      default:
        result.sort((a, b) => b.id - a.id);
        break;
    }

    return result;
  }, [filters, productsList]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setVisibleCount(8); // reset pagination on filter change
  };

  const handleResetFilters = () => {
    setFilters({
      categories: [],
      subcategories: [],
      priceRange: [0, 20000],
      minRating: 0,
      sortBy: "newest",
      search: "",
    });
    setVisibleCount(8);
  };

  const activeFilterCount =
    (filters.categories ? filters.categories.length : 0) +
    (filters.subcategories ? filters.subcategories.length : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 20000 ? 1 : 0);

  const activeCategoryTitle =
    filters.categories && filters.categories.length === 1
      ? filters.categories[0].toUpperCase()
      : filters.subcategories && filters.subcategories.length === 1
        ? filters.subcategories[0].toUpperCase()
        : "SHOP";

  return (
    <div className="min-h-screen bg-apex-black text-white py-12 px-4 md:px-8 max-w-7xl mx-auto mt-12">
      <motion.div 
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 mt-16"
      >
        <div className="text-xs sm:text-sm text-gray-400 mb-4">
          Home &gt; <span className="text-white">Shop</span>{" "}
          {activeCategoryTitle !== "SHOP" && (
            <>
              &gt;{" "}
              <span className="text-apex-red font-semibold">
                {activeCategoryTitle}
              </span>
            </>
          )}
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <SectionHeader title={activeCategoryTitle} />
          <div className="text-xs sm:text-sm text-gray-400 font-medium">
            Showing {displayedProducts.length} of {filteredProducts.length}{" "}
            products
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Mobile Filter Button */}
        <div className="md:hidden">
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex items-center gap-2 w-full justify-center bg-apex-charcoal border border-white/10 rounded-lg py-2.5 text-xs sm:text-sm font-medium hover:bg-apex-dark transition-colors cursor-pointer"
          >
            <Filter size={18} />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </motion.button>
        </div>

        {/* Desktop Sidebar */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="hidden md:block w-64 flex-shrink-0"
        >
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            activeFilterCount={activeFilterCount}
          />
        </motion.div>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileFilterOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-40 md:hidden"
                onClick={() => setIsMobileFilterOpen(false)}
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "tween" }}
                className="fixed inset-y-0 left-0 w-80 max-w-[calc(100vw-3rem)] bg-apex-black border-r border-white/10 p-6 z-50 overflow-y-auto md:hidden"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Filters</h2>
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </motion.button>
                </div>
                <FilterSidebar
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onReset={handleResetFilters}
                  activeFilterCount={activeFilterCount}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        <div className="flex-1 flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between bg-apex-charcoal border border-white/5 p-3 sm:p-4 rounded-xl"
          >
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="bg-[#111] border border-white/10 rounded-lg px-3 py-2.5 text-sm w-full sm:max-w-xs focus:ring-1 focus:ring-apex-red focus:border-apex-red outline-none placeholder:text-gray-500 transition-colors"
            />
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs sm:text-sm text-gray-400 whitespace-nowrap">
                Sort:
              </span>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="bg-apex-dark border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-apex-red focus:outline-none w-full sm:w-auto cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </motion.div>

          {loading ? (
            <ProductGrid loading={true} />
          ) : filteredProducts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="text-center py-20 bg-apex-charcoal rounded-xl border border-white/5"
            >
              <h3 className="text-xl font-bold mb-2">No products found</h3>
              <p className="text-gray-400 mb-6">
                Try adjusting your filters or search query.
              </p>
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={handleResetFilters}
                className="text-apex-red hover:text-white transition-colors underline font-semibold cursor-pointer"
              >
                Reset all filters
              </motion.button>
            </motion.div>
          ) : (
            <ProductGrid products={displayedProducts} />
          )}

          {visibleCount < filteredProducts.length && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="flex justify-center mt-8"
            >
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={() => setVisibleCount((prev) => prev + 8)}
                className="px-6 py-2.5 rounded-full border border-white/20 hover:bg-white/5 transition-colors font-medium text-xs sm:text-sm cursor-pointer"
              >
                Load More
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
