import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, X, Search, Upload, Image as ImageIcon, Check, Filter, Palette, Link2 } from 'lucide-react';
import { 
  fetchProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  fetchCategories,
  fetchSubcategories,
  uploadImageToSupabase
} from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatPrice } from '../../utils/helpers.js';

const PRESET_COLORS = [
  { name: 'Black', hex: '#000000', border: true },
  { name: 'White', hex: '#ffffff', border: true },
  { name: 'Silver', hex: '#c0c0c0' },
  { name: 'Space Gray', hex: '#4b5563' },
  { name: 'Red', hex: '#dc2626' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Navy', hex: '#1e3a8a' },
  { name: 'Green', hex: '#16a34a' },
  { name: 'Gold', hex: '#eab308' },
  { name: 'Rose Gold', hex: '#b76e79' },
  { name: 'Purple', hex: '#9333ea' },
  { name: 'Orange', hex: '#ea580c' },
];

function formatSpecificationsToString(specs) {
  if (!specs) return '';
  if (typeof specs === 'string') return specs;
  if (typeof specs === 'object' && !Array.isArray(specs)) {
    return Object.entries(specs)
      .map(([key, val]) => `${key}: ${val}`)
      .join('\n');
  }
  if (Array.isArray(specs)) {
    return specs.join('\n');
  }
  return '';
}

function parseSpecificationsString(str) {
  if (!str || typeof str !== 'string') return typeof str === 'object' && str !== null ? str : {};
  const lines = str.split('\n').map((l) => l.trim()).filter(Boolean);
  const result = {};
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim();
      const val = line.slice(colonIndex + 1).trim();
      if (key) {
        result[key] = val;
      }
    } else {
      result[line] = 'Yes';
    }
  }
  return result;
}

function formatFeaturesToString(features) {
  if (!features) return '';
  if (Array.isArray(features)) {
    return features.join('\n');
  }
  if (typeof features === 'string') {
    if (features.includes('\n')) return features;
    if (features.includes(',')) {
      return features.split(',').map((s) => s.trim()).filter(Boolean).join('\n');
    }
    return features;
  }
  return '';
}

function parseFeaturesString(str) {
  if (!str) return [];
  if (Array.isArray(str)) return str;
  return str
    .split('\n')
    .map((s) => s.replace(/^[•\-\*]\s*/, '').trim())
    .filter(Boolean);
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [subcategoriesList, setSubcategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [contentTab, setContentTab] = useState('description'); // 'description' | 'features' | 'specifications'
  const [customColorInput, setCustomColorInput] = useState('');
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [galleryInputTab, setGalleryInputTab] = useState('url'); // 'url' | 'upload'

  const { success, info, error: toastError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    category: 'HEADSETS',
    subcategory: '',
    price: '',
    originalPrice: '',
    discount: '0',
    stock: '50',
    badge: '',
    colors: ['Black', 'White'],
    description: '',
    featuresText: '',
    specificationsText: '',
    mainImageUrl: '',
    galleryImages: [],
    status: 'Active',
    isFeatured: false,
    isTrending: false,
    isNewArrival: false,
    isBestSeller: false,
    isSpecialOffer: false,
    isOnSale: false,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [pData, cData, sData] = await Promise.all([
        fetchProducts(true),
        fetchCategories(),
        fetchSubcategories()
      ]);
      setProducts(pData);
      setCategoriesList(cData);
      setSubcategoriesList(sData);
    } catch (e) {
      toastError('Failed to load products and categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter subcategories dynamically based on chosen parent category
  const selectedCategoryObj = categoriesList.find(
    (c) => (c.name || '').toLowerCase() === (formData.category || '').toLowerCase()
  );

  const availableSubcategories = subcategoriesList.filter((s) =>
    selectedCategoryObj ? Number(s.category_id || s.categoryId) === Number(selectedCategoryObj.id) : true
  );

  const handleCategoryChange = (newCatName) => {
    setFormData((prev) => ({
      ...prev,
      category: newCatName,
      subcategory: '',
    }));
  };

  const handleMainImageUpload = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadImageToSupabase(file, 'products');
      if (url) {
        setFormData((prev) => ({ ...prev, mainImageUrl: url }));
        success('Main image uploaded successfully!');
      }
    } catch (err) {
      toastError(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGalleryUpload = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadImageToSupabase(file, 'products/gallery');
      if (url) {
        setFormData((prev) => ({
          ...prev,
          galleryImages: [...prev.galleryImages, url]
        }));
        success('Gallery image added!');
      }
    } catch (err) {
      toastError(err.message || 'Gallery image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddGalleryUrl = (e) => {
    if (e) e.preventDefault();
    const clean = galleryUrlInput.trim();
    if (!clean) return;
    if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('data:image/')) {
      toastError('Please enter a valid image URL (e.g. https://images.unsplash.com/...)');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      galleryImages: [...prev.galleryImages, clean]
    }));
    setGalleryUrlInput('');
    success('Gallery image URL added!');
  };

  const handleRemoveGalleryImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index)
    }));
  };

  const handleToggleColor = (colorName) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.colors) ? prev.colors : [];
      const exists = current.some((c) => c.toLowerCase() === colorName.toLowerCase());
      if (exists) {
        return {
          ...prev,
          colors: current.filter((c) => c.toLowerCase() !== colorName.toLowerCase())
        };
      } else {
        return {
          ...prev,
          colors: [...current, colorName]
        };
      }
    });
  };

  const handleAddCustomColor = (e) => {
    if (e) e.preventDefault();
    const clean = customColorInput.trim();
    if (!clean) return;
    setFormData((prev) => {
      const current = Array.isArray(prev.colors) ? prev.colors : [];
      if (current.some((c) => c.toLowerCase() === clean.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        colors: [...current, clean]
      };
    });
    setCustomColorInput('');
  };

  const handleRemoveColor = (colorToRemove) => {
    setFormData((prev) => ({
      ...prev,
      colors: (Array.isArray(prev.colors) ? prev.colors : []).filter(
        (c) => c.toLowerCase() !== colorToRemove.toLowerCase()
      )
    }));
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setCustomColorInput('');
    setGalleryUrlInput('');
    setContentTab('description');
    const defaultCat = categoriesList[0]?.name || 'HEADSETS';
    setFormData({
      name: '',
      category: defaultCat,
      subcategory: '',
      price: '',
      originalPrice: '',
      discount: '0',
      stock: '50',
      badge: '',
      colors: ['Black', 'White'],
      description: '',
      featuresText: '',
      specificationsText: '',
      mainImageUrl: '',
      galleryImages: [],
      status: 'Active',
      isFeatured: false,
      isTrending: false,
      isNewArrival: false,
      isBestSeller: false,
      isSpecialOffer: false,
      isOnSale: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setCustomColorInput('');
    setGalleryUrlInput('');
    setContentTab('description');
    const imagesList = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop'];

    setFormData({
      name: product.name,
      category: product.category || 'HEADSETS',
      subcategory: product.subcategory || '',
      price: product.price,
      originalPrice: product.originalPrice || '',
      discount: product.discount || '0',
      stock: product.stock,
      badge: product.badge || '',
      colors: Array.isArray(product.colors) ? product.colors : [],
      description: product.description || product.fullDescription || product.full_description || '',
      featuresText: formatFeaturesToString(product.features),
      specificationsText: formatSpecificationsToString(product.specifications),
      mainImageUrl: imagesList[0] || '',
      galleryImages: imagesList.slice(1),
      status: product.status || 'Active',
      isFeatured: Boolean(product.isFeatured),
      isTrending: Boolean(product.isTrending),
      isNewArrival: Boolean(product.isNewArrival),
      isBestSeller: Boolean(product.isBestSeller),
      isSpecialOffer: Boolean(product.isSpecialOffer || product.is_special_offer),
      isOnSale: Boolean(product.isOnSale),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      toastError('Please fill in product name and selling price.');
      return;
    }

    const matchedSub = subcategoriesList.find(
      (s) => (s.name || '').toLowerCase() === (formData.subcategory || '').toLowerCase()
    );

    const mainImg = formData.mainImageUrl.trim() || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop';
    const allImages = [mainImg, ...formData.galleryImages.filter(Boolean)];

    const parsedFeatures = parseFeaturesString(formData.featuresText);
    const parsedSpecs = parseSpecificationsString(formData.specificationsText);

    const payload = {
      name: formData.name,
      category: formData.category,
      subcategory: formData.subcategory,
      subcategory_id: matchedSub ? matchedSub.id : null,
      price: Number(formData.price),
      originalPrice: formData.originalPrice ? Number(formData.originalPrice) : Number(formData.price),
      discount: Number(formData.discount || 0),
      stock: Number(formData.stock || 0),
      badge: formData.badge || null,
      colors: Array.isArray(formData.colors) ? formData.colors : [],
      description: formData.description,
      fullDescription: formData.description,
      features: parsedFeatures,
      specifications: parsedSpecs,
      images: allImages,
      status: formData.status,
      isFeatured: formData.isFeatured,
      isTrending: formData.isTrending,
      isNewArrival: formData.isNewArrival,
      isBestSeller: formData.isBestSeller,
      isSpecialOffer: formData.isSpecialOffer,
      isOnSale: formData.isOnSale,
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        success(`Updated product "${formData.name}"`);
      } else {
        await createProduct(payload);
        success(`Created product "${formData.name}"`);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      toastError(err.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteProduct(id);
      success(`Deleted product "${name}"`);
      loadData();
    } catch (err) {
      toastError(err.message || 'Failed to delete product');
    }
  };

  // Advanced Filtering
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.subcategory && p.subcategory.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCat = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSub = selectedSubcategory === 'All' || (p.subcategory || '').toLowerCase() === selectedSubcategory.toLowerCase();
    const matchesStatus = selectedStatus === 'All' || (p.status || 'Active').toLowerCase() === selectedStatus.toLowerCase();
    
    let matchesSec = true;
    if (selectedSection === 'BestSeller') matchesSec = p.isBestSeller === true;
    if (selectedSection === 'Trending') matchesSec = p.isTrending === true;
    if (selectedSection === 'NewArrival') matchesSec = p.isNewArrival === true;
    if (selectedSection === 'SpecialOffer') matchesSec = (p.isSpecialOffer === true || p.is_special_offer === true);

    return matchesSearch && matchesCat && matchesSub && matchesStatus && matchesSec;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-white">
            Product <span className="text-apex-red">Management CMS</span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Create, edit, image uploads, colors, subcategories, active status & Best Seller / Trending / New Arrival sections.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="btn-primary inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] cursor-pointer"
        >
          <Plus className="w-5 h-5 mr-2" /> Add New Product
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-[#111] border border-white/5 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, category, subcategory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-apex-red outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSubcategory('All'); }}
              className="bg-[#1a1a1a] border border-white/10 text-xs text-white rounded-lg px-3 py-2 focus:border-apex-red outline-none"
            >
              <option value="All">All Categories</option>
              {categoriesList.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#1a1a1a] border border-white/10 text-xs text-white rounded-lg px-3 py-2 focus:border-apex-red outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Draft">Draft</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>

            {/* Section Filter */}
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="bg-[#1a1a1a] border border-white/10 text-xs text-white rounded-lg px-3 py-2 focus:border-apex-red outline-none"
            >
              <option value="All">All Sections</option>
              <option value="SpecialOffer">Special Offer</option>
              <option value="BestSeller">Best Seller</option>
              <option value="Trending">Trending Now</option>
              <option value="NewArrival">New Arrival</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-apex-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-400">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No products found matching your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#1a1a1a] text-xs uppercase tracking-wider text-gray-400 border-b border-white/5">
                <tr>
                  <th className="py-3.5 px-6">Product</th>
                  <th className="py-3.5 px-6">Category / Subcategory</th>
                  <th className="py-3.5 px-6">Price</th>
                  <th className="py-3.5 px-6">Colors</th>
                  <th className="py-3.5 px-6">Stock</th>
                  <th className="py-3.5 px-6">Sections</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-black rounded-lg overflow-hidden border border-white/10 shrink-0">
                          <img
                            src={product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop'}
                            alt={product.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-white leading-tight">{product.name}</p>
                          <p className="text-xs text-gray-500 font-mono">ID #{product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-white font-medium">{product.category}</div>
                      {product.subcategory && (
                        <div className="text-xs text-apex-red font-semibold">↳ {product.subcategory}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 font-bold text-apex-red">
                      {formatPrice(product.price)}
                      {product.originalPrice > product.price && (
                        <span className="block text-xs text-gray-500 line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {Array.isArray(product.colors) && product.colors.length > 0 ? (
                        <div className="flex items-center gap-1.5 flex-wrap max-w-[140px]">
                          {product.colors.map((color, idx) => (
                            <span 
                              key={idx}
                              className="w-3.5 h-3.5 rounded-full border border-white/20 inline-block shadow-sm"
                              style={{ backgroundColor: color.toLowerCase().replace(/[^a-z0-9]/g, '') }}
                              title={color}
                            />
                          ))}
                          <span className="text-[10px] text-gray-400 font-mono">({product.colors.length})</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">None</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        product.stock <= 0
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : product.stock <= 20
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {product.stock <= 0 ? 'Out of Stock' : `${product.stock} units`}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1">
                        {product.isSpecialOffer && (
                          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                            Special Offer
                          </span>
                        )}
                        {product.isBestSeller && (
                          <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">
                            Best Seller
                          </span>
                        )}
                        {product.isTrending && (
                          <span className="bg-apex-red/20 text-apex-red text-[10px] font-bold px-2 py-0.5 rounded border border-apex-red/30">
                            Trending
                          </span>
                        )}
                        {product.isNewArrival && (
                          <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/30">
                            New Arrival
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        product.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : product.status === 'Inactive'
                          ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {product.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-[#111] border border-white/10 rounded-2xl p-6 z-10 text-left space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 sticky top-0 bg-[#111] z-20">
                <h3 className="text-lg font-bold uppercase tracking-wider text-white">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Air 31 Noise Cancelling Earbuds"
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-apex-red outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-apex-red outline-none"
                    >
                      {categoriesList.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                      Subcategory
                    </label>
                    <select
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-apex-red outline-none"
                    >
                      <option value="">None / Select Subcategory</option>
                      {availableSubcategories.map((sub) => (
                        <option key={sub.id} value={sub.name}>{sub.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                      Selling Price (PKR) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="4999"
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-apex-red outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                      Original Price (PKR)
                    </label>
                    <input
                      type="number"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                      placeholder="6250"
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-apex-red outline-none"
                    />
                  </div>
                </div>

                {/* --- MAIN PRODUCT IMAGE SYSTEM (URL OR UPLOAD) --- */}
                <div className="p-4 bg-[#181818] border border-white/10 rounded-xl space-y-3">
                  <span className="block text-xs font-bold uppercase tracking-wider text-apex-red">
                    MAIN PRODUCT IMAGE
                  </span>
                  
                  <input
                    type="url"
                    value={formData.mainImageUrl}
                    onChange={(e) => setFormData({ ...formData, mainImageUrl: e.target.value })}
                    placeholder="Image URL: https://images.unsplash.com/..."
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-apex-red outline-none"
                  />

                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg text-xs font-bold text-gray-300 hover:text-white transition-colors inline-flex items-center">
                      <Upload className="w-4 h-4 mr-2 text-apex-red" />
                      {uploadingImage ? 'Uploading Image...' : 'Upload Image File'}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImage}
                        className="hidden"
                        onChange={(e) => handleMainImageUpload(e.target.files?.[0])}
                      />
                    </label>
                  </div>

                  {formData.mainImageUrl && (
                    <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden border border-white/10 bg-black">
                      <img src={formData.mainImageUrl} alt="Main Preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>

                {/* --- PRODUCT GALLERY IMAGES SYSTEM (IMAGE URL & FILE UPLOAD) --- */}
                <div className="p-4 bg-[#181818] border border-white/10 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-apex-red" />
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-200">
                        PRODUCT IMAGES GALLERY ({formData.galleryImages.length})
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400">Add via URL or Upload File</span>
                  </div>

                  {/* Method Selection Tabs: [ Image URL ] / [ Upload File ] */}
                  <div className="flex items-center gap-2 p-1 bg-[#111] rounded-lg border border-white/5 w-fit">
                    <button
                      type="button"
                      onClick={() => setGalleryInputTab('url')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                        galleryInputTab === 'url'
                          ? 'bg-apex-red text-white shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      Image URL
                    </button>

                    <button
                      type="button"
                      onClick={() => setGalleryInputTab('upload')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                        galleryInputTab === 'upload'
                          ? 'bg-apex-red text-white shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload File
                    </button>
                  </div>

                  {/* Tab 1: Image URL Input */}
                  {galleryInputTab === 'url' && (
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={galleryUrlInput}
                        onChange={(e) => setGalleryUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddGalleryUrl();
                          }
                        }}
                        placeholder="Paste image URL: https://images.unsplash.com/..."
                        className="flex-1 bg-[#111] border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:border-apex-red outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddGalleryUrl}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 inline mr-1 text-apex-red" /> Add Image
                      </button>
                    </div>
                  )}

                  {/* Tab 2: File Upload */}
                  {galleryInputTab === 'upload' && (
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-lg text-xs font-bold text-gray-300 hover:text-white transition-colors inline-flex items-center">
                        <Upload className="w-4 h-4 mr-2 text-apex-red" />
                        {uploadingImage ? 'Uploading Image to Storage...' : 'Choose Image File to Upload'}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingImage}
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleGalleryUpload(e.target.files[0]);
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                      <span className="text-[11px] text-gray-500">Supports JPG, PNG, WEBP (Max 5MB)</span>
                    </div>
                  )}

                  {/* Gallery Images Preview Grid */}
                  {formData.galleryImages.length > 0 ? (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                        Gallery Previews:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {formData.galleryImages.map((imgUrl, idx) => (
                          <div 
                            key={idx} 
                            className="relative aspect-square bg-black rounded-lg overflow-hidden border border-white/10 group p-1.5 flex items-center justify-center shadow-md"
                          >
                            <span className="absolute top-1 left-1 bg-black/80 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-white/10 z-10">
                              #{idx + 1}
                            </span>
                            <img 
                              src={imgUrl} 
                              alt={`Gallery ${idx + 1}`} 
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryImage(idx)}
                              className="absolute top-1 right-1 p-1 bg-red-600/90 hover:bg-red-600 text-white rounded-full transition-all cursor-pointer shadow-lg z-20"
                              title="Delete Image"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic pt-1">
                      No gallery images added yet. You can freely mix image URLs and uploaded files.
                    </p>
                  )}
                </div>

                {/* --- PRODUCT COLORS SECTION --- */}
                <div className="p-4 bg-[#181818] border border-white/10 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-apex-red" />
                      <span className="text-xs font-bold uppercase tracking-wider text-white">
                        PRODUCT COLORS & VARIANTS
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {formData.colors?.length || 0} color{formData.colors?.length === 1 ? '' : 's'} selected
                    </span>
                  </div>

                  {/* Preset Color Swatches */}
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1.5 font-medium">
                      Quick Preset Colors (Click to add / remove):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map((preset) => {
                        const isSelected = (formData.colors || []).some(
                          (c) => c.toLowerCase() === preset.name.toLowerCase()
                        );
                        return (
                          <button
                            type="button"
                            key={preset.name}
                            onClick={() => handleToggleColor(preset.name)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-apex-red/20 border-apex-red text-white border shadow-[0_0_10px_rgba(220,38,38,0.2)]'
                                : 'bg-[#111] border-white/10 text-gray-300 hover:text-white hover:bg-white/5 border'
                            }`}
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full inline-block shrink-0 border border-white/20"
                              style={{ backgroundColor: preset.hex }}
                            />
                            <span>{preset.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-apex-red ml-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Color Input */}
                  <div className="pt-2 border-t border-white/5">
                    <label className="block text-[11px] text-gray-400 mb-1.5 font-medium">
                      Add Custom Color Name:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customColorInput}
                        onChange={(e) => setCustomColorInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomColor();
                          }
                        }}
                        placeholder="e.g. Midnight Blue, Rose Gold, Matte Titanium..."
                        className="flex-1 bg-[#111] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:border-apex-red outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomColor}
                        disabled={!customColorInput.trim()}
                        className="px-4 py-2 bg-white/10 hover:bg-apex-red text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        + Add Color
                      </button>
                    </div>
                  </div>

                  {/* Active Selected Colors Tags */}
                  {Array.isArray(formData.colors) && formData.colors.length > 0 && (
                    <div className="pt-2">
                      <label className="block text-[11px] text-gray-400 mb-1.5 font-medium">
                        Active Colors on Product Page:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {formData.colors.map((color, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-[#111] border border-apex-red/40 text-white rounded-full text-xs font-medium shadow-sm"
                          >
                            <span
                              className="w-3 h-3 rounded-full inline-block border border-white/30"
                              style={{ backgroundColor: color.toLowerCase().replace(/[^a-z0-9]/g, '') }}
                            />
                            <span>{color}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveColor(color)}
                              className="text-gray-400 hover:text-red-400 transition-colors ml-1 cursor-pointer"
                              title={`Remove ${color}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-apex-red outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                      Product Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-apex-red outline-none"
                    >
                      <option value="Active">Active (Visible on Storefront)</option>
                      <option value="Inactive">Inactive (Hidden from Storefront)</option>
                      <option value="Draft">Draft</option>
                      <option value="Out of Stock">Out of Stock</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                      Badge Text
                    </label>
                    <input
                      type="text"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      placeholder="e.g. Best Seller, New"
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-apex-red outline-none"
                    />
                  </div>
                </div>

                {/* --- PRODUCT SECTIONS ASSIGNMENT --- */}
                <div className="p-4 bg-[#181818] border border-white/10 rounded-xl space-y-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-apex-red">
                    PRODUCT SECTIONS (DISPLAY ON HOMEPAGE & SECTION PAGES)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-gray-200 bg-[#111] p-2.5 rounded-lg border border-white/5 hover:border-amber-500/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.isBestSeller}
                        onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                        className="accent-amber-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Best Seller</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-gray-200 bg-[#111] p-2.5 rounded-lg border border-white/5 hover:border-apex-red/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.isTrending}
                        onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                        className="accent-apex-red w-4 h-4 cursor-pointer"
                      />
                      <span>Trending Now</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-gray-200 bg-[#111] p-2.5 rounded-lg border border-white/5 hover:border-blue-500/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.isNewArrival}
                        onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
                        className="accent-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <span>New Arrival</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-gray-200 bg-[#111] p-2.5 rounded-lg border border-white/5 hover:border-emerald-500/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.isSpecialOffer}
                        onChange={(e) => setFormData({ ...formData, isSpecialOffer: e.target.checked })}
                        className="accent-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Special Offer</span>
                    </label>
                  </div>
                </div>

                {/* --- PRODUCT CONTENT TABS (DESCRIPTION | FEATURES | SPECIFICATIONS) --- */}
                <div className="p-4 bg-[#181818] border border-white/10 rounded-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-apex-red">
                      PRODUCT CONTENT SECTIONS
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Matches customer-facing Product Page tabs
                    </span>
                  </div>

                  {/* Tab Navigation */}
                  <div className="flex items-center gap-1 sm:gap-2 p-1 bg-[#111] rounded-lg border border-white/5 w-fit">
                    {[
                      { id: 'description', label: 'Description' },
                      { id: 'features', label: 'Features' },
                      { id: 'specifications', label: 'Specifications' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setContentTab(tab.id)}
                        className={`px-3.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                          contentTab === tab.id
                            ? 'bg-apex-red text-white shadow-sm'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab 1: Description */}
                  {contentTab === 'description' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
                          Description
                        </label>
                        <span className="text-[10px] text-gray-500">Supports detailed multiple paragraphs</span>
                      </div>
                      <textarea
                        rows={5}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Write a detailed description of this product..."
                        className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-apex-red outline-none leading-relaxed resize-y"
                      />
                    </div>
                  )}

                  {/* Tab 2: Features */}
                  {contentTab === 'features' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
                          Features (One feature per line)
                        </label>
                        <span className="text-[10px] text-gray-500">Bullet points on product page</span>
                      </div>
                      <textarea
                        rows={5}
                        value={formData.featuresText}
                        onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
                        placeholder={`Active Noise Cancellation\nBluetooth 5.3\n30-hour battery life\nIPX5 water resistance`}
                        className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-xs sm:text-sm text-white focus:border-apex-red outline-none leading-relaxed resize-y font-mono"
                      />
                      <p className="text-[11px] text-gray-500">
                        Enter each feature on a new line (e.g. Active Noise Cancellation).
                      </p>
                    </div>
                  )}

                  {/* Tab 3: Specifications */}
                  {contentTab === 'specifications' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
                          Specifications (Key: Value)
                        </label>
                        <span className="text-[10px] text-gray-500">Technical spec properties</span>
                      </div>
                      <textarea
                        rows={5}
                        value={formData.specificationsText}
                        onChange={(e) => setFormData({ ...formData, specificationsText: e.target.value })}
                        placeholder={`Brand: APEX\nModel: BX-609\nConnectivity: Bluetooth 5.3\nBattery: 30 Hours\nWeight: 250g`}
                        className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-xs sm:text-sm text-white focus:border-apex-red outline-none leading-relaxed resize-y font-mono"
                      />
                      <p className="text-[11px] text-gray-500">
                        Enter key-value pairs formatted as &quot;Property: Value&quot; per line (e.g. Battery: 30 Hours).
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-400 bg-white/5 hover:bg-white/10 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    {editingProduct ? 'Save Changes' : 'Create Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
