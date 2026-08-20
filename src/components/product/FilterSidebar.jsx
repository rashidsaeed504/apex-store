import { useState, useEffect } from 'react';
import { fetchActiveCategoriesAndSubcategories } from '../../services/api';

export default function FilterSidebar({ 
  filters, 
  onFilterChange, 
  onReset,
  activeFilterCount = 0
}) {
  const [structureList, setStructureList] = useState([]);

  useEffect(() => {
    async function loadStructure() {
      const activeData = await fetchActiveCategoriesAndSubcategories();
      setStructureList(activeData);
    }
    loadStructure();
  }, []);

  const updateFilter = (key, value) => {
    onFilterChange(key, value);
  };

  const handleCategoryChange = (category) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.some((c) => c.toLowerCase() === category.toLowerCase())
      ? currentCategories.filter((c) => c.toLowerCase() !== category.toLowerCase())
      : [...currentCategories, category];
    updateFilter('categories', newCategories);
  };

  const handleSubcategoryChange = (subName) => {
    const currentSubcategories = filters.subcategories || [];
    const newSubcategories = currentSubcategories.some((s) => s.toLowerCase() === subName.toLowerCase())
      ? currentSubcategories.filter((s) => s.toLowerCase() !== subName.toLowerCase())
      : [...currentSubcategories, subName];
    updateFilter('subcategories', newSubcategories);
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 space-y-8 sticky top-24">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h2 className="text-base font-black uppercase tracking-wider text-white">
          FILTERS {activeFilterCount > 0 && <span className="text-apex-red">({activeFilterCount})</span>}
        </h2>
        {activeFilterCount > 0 && (
          <button
            onClick={onReset}
            className="text-xs text-gray-400 hover:text-apex-red transition-colors font-bold uppercase tracking-wider"
          >
            Reset All
          </button>
        )}
      </div>

      {/* Categories & Subcategories Filter */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
          CATEGORIES & SUBCATEGORIES
        </h3>
        <div className="space-y-4">
          {structureList.map((cat) => {
            const catName = cat.name;
            const isCatChecked = filters.categories?.some(
              (c) => c.toLowerCase() === catName.toLowerCase()
            );

            return (
              <div key={cat.id || catName} className="space-y-2">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={isCatChecked}
                      onChange={() => handleCategoryChange(catName)}
                    />
                    <div className="w-4 h-4 border-2 border-gray-600 rounded bg-transparent peer-checked:bg-apex-red peer-checked:border-apex-red transition-colors" />
                  </div>
                  <span className="ml-3 text-xs font-bold text-gray-300 group-hover:text-white transition-colors uppercase tracking-wider">
                    {catName}
                  </span>
                </label>

                {/* Subcategories list under category */}
                {Array.isArray(cat.subcategories) && cat.subcategories.length > 0 && (
                  <div className="pl-6 space-y-2 border-l border-white/10 my-1">
                    {cat.subcategories.map((sub) => {
                      const subName = sub.name;
                      const isSubChecked = filters.subcategories?.some(
                        (s) => s.toLowerCase() === subName.toLowerCase()
                      );
                      return (
                        <label key={sub.id || subName} className="flex items-center cursor-pointer group">
                          <div className="relative flex items-center">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={isSubChecked}
                              onChange={() => handleSubcategoryChange(subName)}
                            />
                            <div className="w-3.5 h-3.5 border-2 border-gray-600 rounded bg-transparent peer-checked:bg-apex-red peer-checked:border-apex-red transition-colors" />
                          </div>
                          <span className="ml-2.5 text-[11px] font-medium text-gray-400 group-hover:text-white transition-colors">
                            {subName}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rating Filter */}
      <div className="border-t border-white/10 pt-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
          MINIMUM RATING
        </h3>
        <div className="space-y-2">
          {[4, 3, 2].map((stars) => (
            <label key={stars} className="flex items-center cursor-pointer group">
              <input
                type="radio"
                name="rating"
                checked={filters.minRating === stars}
                onChange={() => updateFilter('minRating', filters.minRating === stars ? 0 : stars)}
                className="accent-apex-red mr-2 cursor-pointer"
              />
              <span className="text-xs text-gray-300 group-hover:text-white font-medium">
                {stars}★ & above
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
