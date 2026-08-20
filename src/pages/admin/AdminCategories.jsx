import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, X, ChevronRight, Layers, Upload, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { 
  fetchCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  fetchSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  uploadImageToSupabase,
  fetchProducts
} from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catFormData, setCatFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    image: '',
    isActive: true,
    sortOrder: 0,
  });

  // Subcategory Modal State
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [subFormData, setSubFormData] = useState({
    categoryId: '',
    name: '',
    description: '',
    image: '',
    isActive: true,
    sortOrder: 0,
  });

  // Confirm Delete State
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: 'category', // 'category' | 'subcategory'
    id: null,
    name: '',
    affectedProductsCount: 0,
    affectedSubcategoriesCount: 0,
  });

  const { success, error: toastError } = useToast();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [cats, subs, prods] = await Promise.all([
        fetchCategories(),
        fetchSubcategories(),
        fetchProducts(true)
      ]);
      setCategories(cats);
      setSubcategories(subs);
      setProducts(prods);
    } catch (e) {
      toastError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Image Upload Handlers
  const handleFileUpload = async (file, target, currentFormData, setFormState) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const uploadedUrl = await uploadImageToSupabase(file, target);
      if (uploadedUrl) {
        setFormState({ ...currentFormData, image: uploadedUrl });
        success('Image uploaded successfully!');
      }
    } catch (err) {
      toastError(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  // --- Category Handlers ---
  const handleOpenAddCatModal = () => {
    setEditingCategory(null);
    setCatFormData({
      name: '',
      description: '',
      shortDescription: '',
      image: '',
      isActive: true,
      sortOrder: categories.length + 1,
    });
    setIsCatModalOpen(true);
  };

  const handleOpenEditCatModal = (cat) => {
    setEditingCategory(cat);
    setCatFormData({
      name: cat.name,
      description: cat.description || '',
      shortDescription: cat.shortDescription || cat.short_description || '',
      image: cat.image || '',
      isActive: cat.isActive !== undefined ? cat.isActive : (cat.is_active !== undefined ? cat.is_active : true),
      sortOrder: cat.sortOrder !== undefined ? cat.sortOrder : (cat.sort_order !== undefined ? cat.sort_order : 0),
    });
    setIsCatModalOpen(true);
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    if (!catFormData.name.trim()) {
      toastError('Category name is required.');
      return;
    }

    const payload = {
      name: catFormData.name,
      slug: catFormData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      description: catFormData.description,
      short_description: catFormData.shortDescription,
      image: catFormData.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop',
      is_active: catFormData.isActive,
      sort_order: Number(catFormData.sortOrder || 0),
    };

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
        success(`Updated category "${catFormData.name}"`);
      } else {
        await createCategory(payload);
        success(`Created category "${catFormData.name}"`);
      }

      setIsCatModalOpen(false);
      loadAll();
    } catch (err) {
      toastError(err.message || 'Failed to save category');
    }
  };

  // --- Subcategory Handlers ---
  const handleOpenAddSubModal = (parentCatId) => {
    setEditingSubcategory(null);
    setSubFormData({
      categoryId: parentCatId || (categories[0]?.id || ''),
      name: '',
      description: '',
      image: '',
      isActive: true,
      sortOrder: 0,
    });
    setIsSubModalOpen(true);
  };

  const handleOpenEditSubModal = (sub) => {
    setEditingSubcategory(sub);
    setSubFormData({
      categoryId: sub.category_id || sub.categoryId,
      name: sub.name,
      description: sub.description || '',
      image: sub.image || '',
      isActive: sub.isActive !== undefined ? sub.isActive : (sub.is_active !== undefined ? sub.is_active : true),
      sortOrder: sub.sortOrder !== undefined ? sub.sortOrder : (sub.sort_order !== undefined ? sub.sort_order : 0),
    });
    setIsSubModalOpen(true);
  };

  const handleSubSubmit = async (e) => {
    e.preventDefault();
    if (!subFormData.name.trim() || !subFormData.categoryId) {
      toastError('Subcategory name and parent category are required.');
      return;
    }

    const payload = {
      category_id: Number(subFormData.categoryId),
      name: subFormData.name,
      slug: subFormData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      description: subFormData.description,
      image: subFormData.image || '',
      is_active: subFormData.isActive,
      sort_order: Number(subFormData.sortOrder || 0),
    };

    try {
      if (editingSubcategory) {
        await updateSubcategory(editingSubcategory.id, payload);
        success(`Updated subcategory "${subFormData.name}"`);
      } else {
        await createSubcategory(payload);
        success(`Created subcategory "${subFormData.name}"`);
      }

      setIsSubModalOpen(false);
      loadAll();
    } catch (err) {
      toastError(err.message || 'Failed to save subcategory');
    }
  };

  // --- Destructive Delete Trigger with Safety Audit ---
  const triggerDeleteConfirm = (type, id, name) => {
    let affectedProds = 0;
    let affectedSubs = 0;

    if (type === 'category') {
      const targetCat = categories.find((c) => c.id === id);
      affectedProds = products.filter((p) => 
        (p.category || '').toLowerCase() === (targetCat?.name || '').toLowerCase()
      ).length;
      affectedSubs = subcategories.filter((s) => Number(s.category_id || s.categoryId) === Number(id)).length;
    } else {
      const targetSub = subcategories.find((s) => s.id === id);
      affectedProds = products.filter((p) => 
        (p.subcategory || '').toLowerCase() === (targetSub?.name || '').toLowerCase() ||
        Number(p.subcategory_id) === Number(id)
      ).length;
    }

    setDeleteConfirm({
      isOpen: true,
      type,
      id,
      name,
      affectedProductsCount: affectedProds,
      affectedSubcategoriesCount: affectedSubs,
    });
  };

  const executeDelete = async () => {
    const { type, id, name } = deleteConfirm;
    setDeleteConfirm({ isOpen: false, type: 'category', id: null, name: '', affectedProductsCount: 0, affectedSubcategoriesCount: 0 });

    try {
      if (type === 'category') {
        await deleteCategory(id);
        success(`Deleted category "${name}"`);
      } else {
        await deleteSubcategory(id);
        success(`Deleted subcategory "${name}"`);
      }
      loadAll();
    } catch (err) {
      toastError(err.message || `Failed to delete ${type}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-white">
            Category & Subcategory <span className="text-apex-red">CMS</span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Dynamic parent categories, nested subcategories, image uploads, and active status control.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenAddSubModal()}
            className="px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-1.5 text-apex-red" /> Add Subcategory
          </button>
          <button
            onClick={handleOpenAddCatModal}
            className="btn-primary inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.3)]"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Category
          </button>
        </div>
      </div>

      {/* Category Hierarchy List */}
      <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden p-4 sm:p-6 space-y-6">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-apex-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-400">Loading category hierarchy...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-white/10 rounded-xl">
            <Layers className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-white font-bold text-lg mb-1">No Categories Found</p>
            <p className="text-xs text-gray-400 mb-4">Create your first parent category to get started.</p>
            <button
              onClick={handleOpenAddCatModal}
              className="btn-primary px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider"
            >
              + Create Category
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((cat) => {
              const catSubcategories = subcategories.filter(
                (s) => Number(s.category_id || s.categoryId) === Number(cat.id)
              );

              return (
                <div
                  key={cat.id}
                  className="bg-[#181818] border border-white/10 rounded-xl overflow-hidden transition-all duration-200"
                >
                  {/* Category Header Row */}
                  <div className="p-4 bg-[#1f1f1f] flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <img
                        src={cat.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop'}
                        alt={cat.name}
                        className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-white uppercase tracking-wider text-sm sm:text-base">
                            {cat.name}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            (cat.is_active !== false && cat.isActive !== false)
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {(cat.is_active !== false && cat.isActive !== false) ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 font-mono">
                          /category/{cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenAddSubModal(cat.id)}
                        className="px-3 py-1.5 bg-apex-red/10 hover:bg-apex-red/20 text-apex-red border border-apex-red/20 rounded-lg text-xs font-bold transition-colors inline-flex items-center"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Subcategory
                      </button>
                      <button
                        onClick={() => handleOpenEditCatModal(cat)}
                        className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors"
                        title="Edit Category"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => triggerDeleteConfirm('category', cat.id, cat.name)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Subcategories Tree Section */}
                  <div className="p-4 bg-[#141414]">
                    {catSubcategories.length === 0 ? (
                      <p className="text-xs text-gray-500 italic pl-4">
                        No subcategories under {cat.name}. Click "+ Add Subcategory" to add one.
                      </p>
                    ) : (
                      <div className="space-y-2 pl-2 sm:pl-4 border-l-2 border-apex-red/30">
                        {catSubcategories.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-[#1c1c1c] border border-white/5 hover:border-white/10 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <ChevronRight className="w-3.5 h-3.5 text-apex-red shrink-0" />
                              {sub.image && (
                                <img src={sub.image} alt={sub.name} className="w-6 h-6 rounded object-cover border border-white/10" />
                              )}
                              <div>
                                <span className="font-bold text-xs text-gray-200 uppercase tracking-wider">
                                  {sub.name}
                                </span>
                                <span className="ml-2 font-mono text-[10px] text-gray-500">
                                  /category/{cat.slug || cat.name.toLowerCase()}/{sub.slug || sub.name.toLowerCase()}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditSubModal(sub)}
                                className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-white rounded transition-colors"
                                title="Edit Subcategory"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => triggerDeleteConfirm('subcategory', sub.id, sub.name)}
                                className="p-1.5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded transition-colors"
                                title="Delete Subcategory"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- ADD / EDIT CATEGORY MODAL --- */}
      <AnimatePresence>
        {isCatModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setIsCatModalOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-6 z-10 text-left space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-lg font-bold uppercase tracking-wider text-white">
                  {editingCategory ? 'Edit Parent Category' : 'Add Parent Category'}
                </h3>
                <button onClick={() => setIsCatModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCatSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={catFormData.name}
                    onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
                    placeholder="e.g. HEADSETS, SMART WATCHES"
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-apex-red outline-none"
                  />
                </div>

                {/* Image Upload / URL Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Category Image (URL or Upload)
                  </label>
                  <input
                    type="url"
                    value={catFormData.image}
                    onChange={(e) => setCatFormData({ ...catFormData, image: e.target.value })}
                    placeholder="Image URL: https://images.unsplash.com/..."
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-apex-red outline-none mb-2"
                  />
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg text-xs font-bold text-gray-300 hover:text-white transition-colors inline-flex items-center">
                      <Upload className="w-4 h-4 mr-2 text-apex-red" />
                      {uploadingImage ? 'Uploading...' : 'Upload Image File'}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImage}
                        className="hidden"
                        onChange={(e) => handleFileUpload(e.target.files?.[0], 'categories', catFormData, setCatFormData)}
                      />
                    </label>
                  </div>

                  {catFormData.image && (
                    <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden border border-white/10 bg-black">
                      <img src={catFormData.image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={catFormData.shortDescription}
                    onChange={(e) => setCatFormData({ ...catFormData, shortDescription: e.target.value })}
                    placeholder="Earbuds, AirPods & Headphones."
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-apex-red outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                      Sort Order Position
                    </label>
                    <input
                      type="number"
                      value={catFormData.sortOrder}
                      onChange={(e) => setCatFormData({ ...catFormData, sortOrder: Number(e.target.value) })}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-apex-red outline-none"
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-300">
                      <input
                        type="checkbox"
                        checked={catFormData.isActive}
                        onChange={(e) => setCatFormData({ ...catFormData, isActive: e.target.checked })}
                        className="accent-apex-red w-4 h-4"
                      />
                      Active (Visible on Storefront)
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCatModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-400 bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider"
                  >
                    {editingCategory ? 'Save Changes' : 'Create Category'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ADD / EDIT SUBCATEGORY MODAL --- */}
      <AnimatePresence>
        {isSubModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setIsSubModalOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-6 z-10 text-left space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-lg font-bold uppercase tracking-wider text-white">
                  {editingSubcategory ? 'Edit Subcategory' : 'Add Subcategory'}
                </h3>
                <button onClick={() => setIsSubModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Parent Category *
                  </label>
                  <select
                    required
                    value={subFormData.categoryId}
                    onChange={(e) => setSubFormData({ ...subFormData, categoryId: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-apex-red outline-none"
                  >
                    <option value="">Select Parent Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Subcategory Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={subFormData.name}
                    onChange={(e) => setSubFormData({ ...subFormData, name: e.target.value })}
                    placeholder="e.g. Wireless Earbuds, Fitness Bands"
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-apex-red outline-none"
                  />
                </div>

                {/* Subcategory Image Upload / URL */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Subcategory Image (URL or Upload)
                  </label>
                  <input
                    type="url"
                    value={subFormData.image}
                    onChange={(e) => setSubFormData({ ...subFormData, image: e.target.value })}
                    placeholder="Image URL: https://..."
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-apex-red outline-none mb-2"
                  />
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg text-xs font-bold text-gray-300 hover:text-white transition-colors inline-flex items-center">
                      <Upload className="w-4 h-4 mr-2 text-apex-red" />
                      {uploadingImage ? 'Uploading...' : 'Upload Image File'}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImage}
                        className="hidden"
                        onChange={(e) => handleFileUpload(e.target.files?.[0], 'subcategories', subFormData, setSubFormData)}
                      />
                    </label>
                  </div>

                  {subFormData.image && (
                    <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-black">
                      <img src={subFormData.image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="flex items-center pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-300">
                    <input
                      type="checkbox"
                      checked={subFormData.isActive}
                      onChange={(e) => setSubFormData({ ...subFormData, isActive: e.target.checked })}
                      className="accent-apex-red w-4 h-4"
                    />
                    Active (Visible in Navbar & Filters)
                  </label>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSubModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-400 bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider"
                  >
                    {editingSubcategory ? 'Save Changes' : 'Create Subcategory'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CONFIRM DELETE SAFETY DIALOG --- */}
      <AnimatePresence>
        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })} className="fixed inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-6 z-10 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                  Delete {deleteConfirm.type}?
                </h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Are you sure you want to delete <span className="font-bold text-white">"{deleteConfirm.name}"</span>?
                </p>
                
                {(deleteConfirm.affectedSubcategoriesCount > 0 || deleteConfirm.affectedProductsCount > 0) && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 text-left space-y-1">
                    <p className="font-bold">Safety Audit Impact Warning:</p>
                    {deleteConfirm.affectedSubcategoriesCount > 0 && (
                      <p>• {deleteConfirm.affectedSubcategoriesCount} subcategory(ies) belong to this category.</p>
                    )}
                    {deleteConfirm.affectedProductsCount > 0 && (
                      <p>• {deleteConfirm.affectedProductsCount} product(s) are assigned to this {deleteConfirm.type}.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-400 bg-white/5 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  className="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
