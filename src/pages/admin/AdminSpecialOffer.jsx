import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Search, 
  Save, 
  Eye, 
  Clock, 
  Check, 
  Plus, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Flame,
  CheckCircle2
} from 'lucide-react';
import { fetchProducts, fetchAdminSpecialOffer, saveSpecialOffer } from '../../services/api';
import { formatPrice } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';

export default function AdminSpecialOffer() {
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [newFeatureInput, setNewFeatureInput] = useState('');

  const { success, error: toastError } = useToast();

  const [formData, setFormData] = useState({
    id: null,
    productId: '',
    isActive: true,
    badgeText: 'SPECIAL OFFER',
    dealLabel: 'Limited Time Deal',
    customTitle: '',
    customDescription: '',
    salePrice: '',
    originalPrice: '',
    discountPercentage: '',
    features: ['Official 1-Year Warranty', 'Premium Quality Audio', 'Express Shipping'],
    warrantyText: 'Official 1-Year Warranty',
    deliveryText: 'Express Delivery Across Pakistan',
    primaryButtonText: 'SHOP NOW',
    secondaryButtonText: 'VIEW ALL DEALS',
    startAt: '',
    endAt: '',
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [allProds, existingOffer] = await Promise.all([
          fetchProducts(),
          fetchAdminSpecialOffer()
        ]);

        setProductsList(allProds || []);

        if (existingOffer) {
          const matchedProd = (allProds || []).find((p) => p.id === existingOffer.productId) || existingOffer.product || allProds[0];
          
          setFormData({
            id: existingOffer.id || null,
            productId: matchedProd?.id || '',
            isActive: existingOffer.isActive !== false,
            badgeText: existingOffer.badgeText || 'SPECIAL OFFER',
            dealLabel: existingOffer.dealLabel || 'Limited Time Deal',
            customTitle: existingOffer.customTitle || '',
            customDescription: existingOffer.customDescription || '',
            salePrice: existingOffer.salePrice !== undefined && existingOffer.salePrice !== null ? String(existingOffer.salePrice) : (matchedProd ? String(matchedProd.price) : ''),
            originalPrice: existingOffer.originalPrice !== undefined && existingOffer.originalPrice !== null ? String(existingOffer.originalPrice) : (matchedProd ? String(matchedProd.originalPrice || matchedProd.price) : ''),
            discountPercentage: existingOffer.discountPercentage !== undefined && existingOffer.discountPercentage !== null ? String(existingOffer.discountPercentage) : '',
            features: Array.isArray(existingOffer.features) && existingOffer.features.length > 0 ? existingOffer.features : (matchedProd?.features || ['Official 1-Year Warranty', 'Express Delivery']),
            warrantyText: existingOffer.warrantyText || 'Official 1-Year Warranty',
            deliveryText: existingOffer.deliveryText || 'Express Delivery Across Pakistan',
            primaryButtonText: existingOffer.primaryButtonText || 'SHOP NOW',
            secondaryButtonText: existingOffer.secondaryButtonText || 'VIEW ALL DEALS',
            startAt: existingOffer.startAt ? new Date(existingOffer.startAt).toISOString().slice(0, 16) : '',
            endAt: existingOffer.endAt ? new Date(existingOffer.endAt).toISOString().slice(0, 16) : '',
          });
        }
      } catch (err) {
        console.warn('Failed to load Special Offer config:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Currently selected product object
  const selectedProduct = useMemo(() => {
    return productsList.find((p) => p.id === Number(formData.productId)) || productsList[0] || null;
  }, [productsList, formData.productId]);

  // Filter products for search selector
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return productsList.slice(0, 8);
    const q = productSearch.toLowerCase();
    return productsList.filter((p) => 
      p.name.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [productsList, productSearch]);

  const handleSelectProduct = (product) => {
    const saleP = product.price;
    const origP = product.originalPrice || Math.round(product.price * 1.25);
    const autoDiscount = origP > saleP ? Math.round(((origP - saleP) / origP) * 100) : 0;

    setFormData((prev) => ({
      ...prev,
      productId: product.id,
      salePrice: String(saleP),
      originalPrice: String(origP),
      discountPercentage: String(autoDiscount),
      features: Array.isArray(product.features) && product.features.length > 0 ? product.features : prev.features,
      customTitle: '',
    }));
    setIsProductDropdownOpen(false);
    setProductSearch('');
  };

  // Auto-calculate discount percentage when prices change
  const handlePriceChange = (field, value) => {
    const nextForm = { ...formData, [field]: value };
    const sale = Number(field === 'salePrice' ? value : nextForm.salePrice);
    const orig = Number(field === 'originalPrice' ? value : nextForm.originalPrice);

    if (sale && orig && orig > sale) {
      nextForm.discountPercentage = String(Math.round(((orig - sale) / orig) * 100));
    }
    setFormData(nextForm);
  };

  const handleAddFeature = (e) => {
    if (e) e.preventDefault();
    if (!newFeatureInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, newFeatureInput.trim()]
    }));
    setNewFeatureInput('');
  };

  const handleRemoveFeature = (index) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.productId) {
      toastError('Please select a product for the Special Offer.');
      return;
    }

    setSaving(true);
    try {
      await saveSpecialOffer({
        ...formData,
        startAt: formData.startAt ? new Date(formData.startAt).toISOString() : null,
        endAt: formData.endAt ? new Date(formData.endAt).toISOString() : null,
      });
      success('Special Offer configured and published successfully!');
    } catch (err) {
      toastError(err.message || 'Failed to save special offer.');
    } finally {
      setSaving(false);
    }
  };

  // Offer Status calculation
  const offerStatus = useMemo(() => {
    if (!formData.isActive) return { text: 'INACTIVE', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
    const now = new Date();
    if (formData.startAt && new Date(formData.startAt) > now) {
      return { text: 'SCHEDULED', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    }
    if (formData.endAt && new Date(formData.endAt) < now) {
      return { text: 'EXPIRED', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
    }
    return { text: 'LIVE & ACTIVE', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  }, [formData.isActive, formData.startAt, formData.endAt]);

  const previewTitle = formData.customTitle || selectedProduct?.name || 'APEX Mechanical Keyboard K65';
  const previewDesc = formData.customDescription || selectedProduct?.description || 'Experience ultra-fast tactile response, custom sound dampening, and per-key RGB backlighting.';
  const previewSalePrice = formData.salePrice ? Number(formData.salePrice) : (selectedProduct?.price || 5999);
  const previewOriginalPrice = formData.originalPrice ? Number(formData.originalPrice) : (selectedProduct?.originalPrice || 7499);
  const previewDiscount = formData.discountPercentage ? Number(formData.discountPercentage) : (previewOriginalPrice > previewSalePrice ? Math.round(((previewOriginalPrice - previewSalePrice) / previewOriginalPrice) * 100) : 20);
  const previewImage = selectedProduct?.images?.[0] || selectedProduct?.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop';

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-4 border-apex-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-400">Loading Special Offer configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-white">
              Special Offer <span className="text-apex-red">Manager</span>
            </h2>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${offerStatus.color}`}>
              {offerStatus.text}
            </span>
          </div>
          <p className="text-sm text-gray-400">
            Control the single promotional deal featured on the APEX Store homepage in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider border border-white/10 transition-colors"
          >
            <Eye className="w-4 h-4" /> View Storefront
          </a>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] cursor-pointer"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save & Publish
          </button>
        </div>
      </div>

      {/* Main Grid: Form Controls (Left) + Interactive Live Preview (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Configuration Form */}
        <form onSubmit={handleSubmit} className="xl:col-span-6 space-y-6">
          
          {/* Status & Master Toggle */}
          <div className="p-5 bg-[#111] border border-white/10 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-white block">Enable Special Offer Section</span>
              <span className="text-xs text-gray-400">
                When turned off, the Special Offer section is cleanly hidden from the homepage.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                formData.isActive ? 'bg-apex-red' : 'bg-[#222]'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                  formData.isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Product Selector */}
          <div className="p-5 bg-[#111] border border-white/10 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-apex-red flex items-center gap-1.5">
                <Flame className="w-4 h-4" /> Select Featured Product *
              </label>
              <span className="text-[11px] text-gray-500">From live products database</span>
            </div>

            {/* Selected Product Pill */}
            {selectedProduct && (
              <div className="flex items-center gap-3 p-3 bg-[#181818] border border-white/10 rounded-xl">
                <div className="w-12 h-12 bg-black rounded-lg border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                  <img src={previewImage} alt={selectedProduct.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-apex-red">{selectedProduct.category}</span>
                  <p className="text-sm font-bold text-white truncate">{selectedProduct.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{formatPrice(selectedProduct.price)}</p>
                </div>
              </div>
            )}

            {/* Search Dropdown Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products to feature..."
                value={productSearch}
                onFocus={() => setIsProductDropdownOpen(true)}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setIsProductDropdownOpen(true);
                }}
                className="w-full bg-[#181818] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-apex-red outline-none"
              />

              {isProductDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#181818] border border-white/10 rounded-xl shadow-2xl z-30 max-h-56 overflow-y-auto divide-y divide-white/5">
                  {filteredProducts.length === 0 ? (
                    <div className="p-3 text-xs text-gray-500 text-center">No products found</div>
                  ) : (
                    filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProduct(p)}
                        className="w-full text-left p-3 hover:bg-white/5 flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        <div className="w-8 h-8 bg-black rounded border border-white/10 overflow-hidden shrink-0">
                          <img src={p.images?.[0] || p.image} alt={p.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{p.name}</p>
                          <p className="text-[10px] text-gray-400">{p.category} • {formatPrice(p.price)}</p>
                        </div>
                        {selectedProduct?.id === p.id && (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pricing & Discounts */}
          <div className="p-5 bg-[#111] border border-white/10 rounded-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300 block">
              Pricing & Deal Discount
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">
                  Sale Price (PKR) *
                </label>
                <input
                  type="number"
                  value={formData.salePrice}
                  onChange={(e) => handlePriceChange('salePrice', e.target.value)}
                  placeholder="e.g. 5999"
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-apex-red outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">
                  Original Price (PKR)
                </label>
                <input
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => handlePriceChange('originalPrice', e.target.value)}
                  placeholder="e.g. 7499"
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-apex-red outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">
                  Discount % (Auto)
                </label>
                <input
                  type="number"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                  placeholder="e.g. 20"
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-sm text-emerald-400 font-mono font-bold focus:border-apex-red outline-none"
                />
              </div>
            </div>
          </div>

          {/* Copy Overrides */}
          <div className="p-5 bg-[#111] border border-white/10 rounded-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300 block">
              Labels & Headline Overrides
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Badge Text</label>
                <input
                  type="text"
                  value={formData.badgeText}
                  onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                  placeholder="SPECIAL OFFER"
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-apex-red outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Deal Label</label>
                <input
                  type="text"
                  value={formData.dealLabel}
                  onChange={(e) => setFormData({ ...formData, dealLabel: e.target.value })}
                  placeholder="Limited Time Deal"
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-apex-red outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">
                Custom Headline Title <span className="text-gray-500 font-normal">(Leave blank to use product name)</span>
              </label>
              <input
                type="text"
                value={formData.customTitle}
                onChange={(e) => setFormData({ ...formData, customTitle: e.target.value })}
                placeholder={selectedProduct?.name || "e.g. APEX Pro Mechanical Keyboard K65"}
                className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-apex-red outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">
                Custom Description <span className="text-gray-500 font-normal">(Leave blank to use product summary)</span>
              </label>
              <textarea
                rows={2}
                value={formData.customDescription}
                onChange={(e) => setFormData({ ...formData, customDescription: e.target.value })}
                placeholder={selectedProduct?.description || "Special promo description..."}
                className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-apex-red outline-none"
              />
            </div>
          </div>

          {/* Features Highlights */}
          <div className="p-5 bg-[#111] border border-white/10 rounded-2xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300 block">
              Feature Highlights Checklist
            </span>

            <div className="flex gap-2">
              <input
                type="text"
                value={newFeatureInput}
                onChange={(e) => setNewFeatureInput(e.target.value)}
                placeholder="e.g. Hot-Swappable Switches"
                className="flex-1 bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-apex-red outline-none"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 inline mr-1" /> Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {formData.features.map((feat, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#181818] border border-white/10 text-gray-300 rounded-full text-xs"
                >
                  <CheckCircle2 className="w-3 h-3 text-apex-red" />
                  <span>{feat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="text-gray-500 hover:text-red-400 cursor-pointer ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Buttons & Trust Info */}
          <div className="p-5 bg-[#111] border border-white/10 rounded-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300 block">
              Action Buttons & Trust Badges
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Primary CTA Button</label>
                <input
                  type="text"
                  value={formData.primaryButtonText}
                  onChange={(e) => setFormData({ ...formData, primaryButtonText: e.target.value })}
                  placeholder="SHOP NOW"
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-apex-red outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Secondary Button</label>
                <input
                  type="text"
                  value={formData.secondaryButtonText}
                  onChange={(e) => setFormData({ ...formData, secondaryButtonText: e.target.value })}
                  placeholder="VIEW ALL DEALS"
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-apex-red outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Warranty Text</label>
                <input
                  type="text"
                  value={formData.warrantyText}
                  onChange={(e) => setFormData({ ...formData, warrantyText: e.target.value })}
                  placeholder="Official 1-Year Warranty"
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-apex-red outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Delivery Text</label>
                <input
                  type="text"
                  value={formData.deliveryText}
                  onChange={(e) => setFormData({ ...formData, deliveryText: e.target.value })}
                  placeholder="Express Delivery Across Pakistan"
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-apex-red outline-none"
                />
              </div>
            </div>
          </div>

          {/* Schedule Start / End Dates */}
          <div className="p-5 bg-[#111] border border-white/10 rounded-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300 block">
              Offer Schedule & Auto-Expiration (Optional)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Offer Start Date/Time</label>
                <input
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-apex-red outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Offer End Date/Time</label>
                <input
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-apex-red outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-[0_0_25px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save & Publish Special Offer
          </button>
        </form>

        {/* RIGHT COLUMN: Interactive Live Preview */}
        <div className="xl:col-span-6 xl:sticky xl:top-24 space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-apex-red" />
              Live Homepage Preview
            </span>
            <span className="text-[11px] text-gray-500">Updates live as you edit</span>
          </div>

          {/* Preview Canvas */}
          <div className="bg-[#050505] p-4 sm:p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
            {/* Ambient Aura */}
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-48 h-48 bg-apex-red/20 blur-[80px] rounded-full pointer-events-none" />

            <div className="relative z-10 bg-gradient-to-br from-[#0c0c0c] via-[#080808] to-[#050505] rounded-2xl border border-white/10 p-6 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* Product Visual */}
                <div className="md:col-span-5 flex items-center justify-center">
                  <div className="relative w-full aspect-square bg-[#080808] rounded-xl border border-white/10 p-4 flex items-center justify-center overflow-hidden">
                    {previewDiscount > 0 && (
                      <span className="absolute top-2 left-2 z-10 bg-apex-red text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                        -{previewDiscount}% OFF
                      </span>
                    )}
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                    />
                  </div>
                </div>

                {/* Product Copy & Price */}
                <div className="md:col-span-7 space-y-3">
                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-apex-red/15 text-apex-red text-[10px] font-bold uppercase tracking-widest border border-apex-red/30">
                      <span className="w-1 h-1 rounded-full bg-apex-red animate-ping" />
                      {formData.badgeText || 'SPECIAL OFFER'}
                    </span>
                    <span className="text-gray-400 text-[11px] flex items-center gap-1 font-medium">
                      <Zap className="w-3 h-3 text-amber-400" />
                      {formData.dealLabel || 'Limited Time Deal'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight leading-tight line-clamp-2">
                    {previewTitle}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
                    {previewDesc}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <span className="text-xl sm:text-2xl font-black text-apex-red font-mono">
                      {formatPrice(previewSalePrice)}
                    </span>
                    {previewOriginalPrice > previewSalePrice && (
                      <span className="text-xs text-gray-500 line-through font-mono">
                        {formatPrice(previewOriginalPrice)}
                      </span>
                    )}
                    {previewDiscount > 0 && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                        Save {previewDiscount}%
                      </span>
                    )}
                  </div>

                  {/* Features */}
                  {formData.features.length > 0 && (
                    <div className="grid grid-cols-2 gap-1 pt-1">
                      {formData.features.slice(0, 4).map((f, i) => (
                        <div key={i} className="text-[10px] text-gray-300 flex items-center gap-1 truncate">
                          <Sparkles className="w-2.5 h-2.5 text-apex-red shrink-0" />
                          <span className="truncate">{f}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-2 pt-2">
                    <span className="btn-primary py-2 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-default">
                      {formData.primaryButtonText || 'SHOP NOW'} <ArrowRight className="w-3 h-3" />
                    </span>
                    <span className="py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase text-gray-300 cursor-default">
                      {formData.secondaryButtonText || 'VIEW ALL DEALS'}
                    </span>
                  </div>

                  {/* Trust Footer */}
                  <div className="pt-2 border-t border-white/5 text-[10px] text-gray-500 flex items-center gap-2">
                    <span>{formData.warrantyText || 'Official 1-Year Warranty'}</span>
                    <span>•</span>
                    <span className="truncate">{formData.deliveryText || 'Express Delivery'}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
