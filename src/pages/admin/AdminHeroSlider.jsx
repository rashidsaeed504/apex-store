import React, { useState, useEffect, Component } from 'react';
import { 
  Tv, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Save, 
  X, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  Sparkles, 
  Link as LinkIcon, 
  Upload, 
  Loader2, 
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Search,
  EyeOff,
  Flame,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Zap
} from 'lucide-react';
import { 
  fetchAdminHeroSlides, 
  saveHeroSlide, 
  deleteHeroSlide, 
  toggleHeroSlideStatus, 
  updateHeroSlidesOrder, 
  uploadImageToSupabase 
} from '../../services/api';
import { useToast } from '../../context/ToastContext';

// Error boundary to prevent admin crashes
class AdminErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AdminHeroSlider caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#0f0f0f] border border-red-500/30 rounded-3xl p-8 text-center max-w-xl mx-auto my-12 text-white">
          <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black uppercase tracking-wider mb-2">Something went wrong</h2>
          <p className="text-xs text-gray-400 mb-6">
            {this.state.error?.message || 'An unexpected rendering error occurred in the hero slider manager.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const DEFAULT_SLIDE_FORM = {
  id: null,
  badge: 'PREMIUM TECH. PREMIUM YOU.',
  title: 'TECH WITHOUT',
  highlight_text: 'LIMITS.',
  description: 'Discover next-generation spatial audio, noise-canceling headphones and wireless gear engineered for uncompromising performance.',
  primary_button_text: 'SHOP NOW',
  primary_button_link: '/shop',
  secondary_button_text: 'EXPLORE DEALS',
  secondary_button_link: '/deals',
  desktop_image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop&q=80',
  mobile_image_url: '',
  features: '100% Original, Free Delivery, 7 Days Return, 24/7 Support',
  promotional_badge: 'FLAGSHIP',
  is_active: true,
  sort_order: 1,
  autoplay_duration: 6000,
};

export default function AdminHeroSlider() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewSlide, setPreviewSlide] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_SLIDE_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const { success, error: toastError, info } = useToast();

  const loadSlides = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminHeroSlides();
      setSlides(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Error loading admin hero slides:', err);
      if (toastError) toastError('Failed to load hero slides.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Hero Slider Manager | APEX Admin';
    loadSlides();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      ...DEFAULT_SLIDE_FORM,
      id: null,
      sort_order: slides.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (slide) => {
    setFormData({
      id: slide.id,
      badge: slide.badge || '',
      title: slide.title || '',
      highlight_text: slide.highlight_text || '',
      description: slide.description || '',
      primary_button_text: slide.primary_button_text || 'SHOP NOW',
      primary_button_link: slide.primary_button_link || '/shop',
      secondary_button_text: slide.secondary_button_text || 'EXPLORE DEALS',
      secondary_button_link: slide.secondary_button_link || '/deals',
      desktop_image_url: slide.desktop_image_url || '',
      mobile_image_url: slide.mobile_image_url || '',
      features: Array.isArray(slide.features) ? slide.features.join(', ') : (slide.features || ''),
      promotional_badge: slide.promotional_badge || '',
      is_active: slide.is_active !== undefined ? slide.is_active : true,
      sort_order: slide.sort_order || 1,
      autoplay_duration: slide.autoplay_duration || 6000,
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (slide) => {
    try {
      const updated = await toggleHeroSlideStatus(slide.id, !slide.is_active);
      setSlides((prev) =>
        prev.map((s) => (String(s.id) === String(slide.id) ? { ...s, is_active: !slide.is_active } : s))
      );
      if (success) success(`Slide "${slide.title || 'Slide'}" is now ${!slide.is_active ? 'Active' : 'Draft'}.`);
    } catch (err) {
      if (toastError) toastError('Failed to update slide status.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteHeroSlide(id);
      setSlides((prev) => prev.filter((s) => String(s.id) !== String(id)));
      setDeleteConfirmId(null);
      if (success) success('Hero slide deleted successfully.');
    } catch (err) {
      if (toastError) toastError('Failed to delete hero slide.');
    }
  };

  const handleMoveOrder = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const newSlides = [...slides];
    const [moved] = newSlides.splice(index, 1);
    newSlides.splice(targetIndex, 0, moved);

    const reordered = newSlides.map((s, idx) => ({ ...s, sort_order: idx + 1 }));
    setSlides(reordered);

    try {
      await updateHeroSlidesOrder(reordered);
      if (info) info('Slide order updated.');
    } catch (err) {
      console.warn('Failed to persist order:', err);
    }
  };

  const handleDesktopImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDesktop(true);
    try {
      const url = await uploadImageToSupabase(file, 'hero-slides');
      if (url) {
        setFormData((prev) => ({ ...prev, desktop_image_url: url }));
        if (success) success('Desktop image uploaded successfully.');
      }
    } catch (err) {
      console.warn('Image upload error:', err);
      if (toastError) toastError(err.message || 'Image upload failed.');
    } finally {
      setUploadingDesktop(false);
    }
  };

  const handleMobileImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMobile(true);
    try {
      const url = await uploadImageToSupabase(file, 'hero-slides');
      if (url) {
        setFormData((prev) => ({ ...prev, mobile_image_url: url }));
        if (success) success('Mobile image uploaded successfully.');
      }
    } catch (err) {
      console.warn('Mobile image upload error:', err);
      if (toastError) toastError(err.message || 'Mobile image upload failed.');
    } finally {
      setUploadingMobile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      if (toastError) toastError('Please provide a slide title.');
      return;
    }

    setSubmitting(true);
    try {
      const parsedFeatures = typeof formData.features === 'string'
        ? formData.features.split(',').map((f) => f.trim()).filter(Boolean)
        : (Array.isArray(formData.features) ? formData.features : []);

      const payload = {
        ...formData,
        features: parsedFeatures,
      };

      const saved = await saveHeroSlide(payload);
      if (saved) {
        await loadSlides();
        setIsModalOpen(false);
        if (success) success(formData.id ? 'Hero slide updated successfully!' : 'New hero slide published!');
      }
    } catch (err) {
      console.warn('Save hero slide error:', err);
      if (toastError) toastError('Failed to save hero slide.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreview = (slide) => {
    setPreviewSlide(slide);
    setIsPreviewOpen(true);
  };

  const filteredSlides = slides.filter((slide) => {
    const matchSearch =
      (slide.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (slide.highlight_text || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (slide.badge || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (slide.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'active') return matchSearch && slide.is_active;
    if (statusFilter === 'draft') return matchSearch && !slide.is_active;
    return matchSearch;
  });

  return (
    <AdminErrorBoundary>
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0a0a] border border-white/5 p-6 rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-apex-red/10 blur-[100px] rounded-full pointer-events-none" />

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-apex-red/10 text-apex-red rounded-xl border border-apex-red/20 shadow-[0_0_12px_rgba(220,38,38,0.3)]">
                <Tv className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                Hero <span className="text-apex-red">Slider Manager</span>
              </h1>
            </div>
            <p className="text-xs text-gray-400">
              Manage the full-width homepage hero carousel slides, CTAs, images, badges, and autoplay intervals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadSlides}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Refresh slides"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleOpenAdd}
              className="btn-primary px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.35)] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Hero Slide
            </button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0a0a0a] border border-white/5 p-4 rounded-2xl">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search hero slides..."
              className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:border-apex-red outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {['all', 'active', 'draft'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-apex-red text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Slides List Area */}
        {loading ? (
          <div className="p-12 text-center bg-[#0a0a0a] border border-white/5 rounded-3xl">
            <Loader2 className="w-8 h-8 text-apex-red animate-spin mx-auto mb-3" />
            <p className="text-xs font-mono uppercase tracking-widest text-gray-400">Loading hero slides...</p>
          </div>
        ) : filteredSlides.length === 0 ? (
          <div className="p-12 text-center bg-[#0a0a0a] border border-white/5 rounded-3xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-500">
              <Tv className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold uppercase text-white tracking-wider">No Hero Slides Found</h3>
              <p className="text-xs text-gray-400 mt-1">Get started by creating your first homepage hero slide.</p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Slide
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredSlides.map((slide, index) => {
              const features = Array.isArray(slide.features)
                ? slide.features
                : (typeof slide.features === 'string' ? JSON.parse(slide.features || '[]') : []);

              return (
                <div
                  key={slide.id || index}
                  className={`bg-[#0a0a0a] border rounded-3xl p-5 sm:p-6 transition-all duration-300 relative overflow-hidden ${
                    slide.is_active ? 'border-white/10 hover:border-apex-red/40' : 'border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    {/* Left: Thumbnail & Details */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full lg:w-auto">
                      {/* Image Thumbnail */}
                      <div className="w-full sm:w-36 h-28 bg-[#111] border border-white/10 rounded-2xl overflow-hidden shrink-0 relative group">
                        <img
                          src={slide.desktop_image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&fit=crop'}
                          alt={slide.title}
                          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                        />
                        {slide.promotional_badge && (
                          <span className="absolute top-2 left-2 bg-apex-red text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow">
                            {slide.promotional_badge}
                          </span>
                        )}
                      </div>

                      {/* Content Info */}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-apex-red bg-apex-red/10 border border-apex-red/20 px-2 py-0.5 rounded-full font-bold">
                            Order #{slide.sort_order || index + 1}
                          </span>

                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              slide.is_active
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                            }`}
                          >
                            {slide.is_active ? 'Active on Homepage' : 'Draft / Inactive'}
                          </span>

                          {slide.badge && (
                            <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5 font-semibold">
                              {slide.badge}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-tight">
                          {slide.title}{' '}
                          {slide.highlight_text && <span className="text-apex-red">{slide.highlight_text}</span>}
                        </h3>

                        <p className="text-xs text-gray-400 line-clamp-1 max-w-xl">
                          {slide.description || 'No description provided.'}
                        </p>

                        <div className="flex items-center gap-3 pt-1 text-[11px] text-gray-500 font-mono">
                          <span>CTA: <strong className="text-gray-300">{slide.primary_button_text}</strong> → {slide.primary_button_link}</span>
                          {slide.autoplay_duration && (
                            <span>• Autoplay: {(slide.autoplay_duration / 1000).toFixed(1)}s</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      {/* Move Up / Down Buttons */}
                      <button
                        onClick={() => handleMoveOrder(index, -1)}
                        disabled={index === 0}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleMoveOrder(index, 1)}
                        disabled={index === filteredSlides.length - 1}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      {/* Preview Button */}
                      <button
                        onClick={() => handlePreview(slide)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                        title="Preview Slide"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Status Toggle */}
                      <button
                        onClick={() => handleToggleStatus(slide)}
                        className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                          slide.is_active
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-gray-500/10 border-gray-500/20 text-gray-400 hover:bg-gray-500/20'
                        }`}
                        title={slide.is_active ? 'Deactivate Slide' : 'Activate Slide'}
                      >
                        {slide.is_active ? <CheckCircle2 className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEdit(slide)}
                        className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer"
                        title="Edit Slide"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      {deleteConfirmId === slide.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(slide.id)}
                            className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="p-1.5 text-gray-400 hover:text-white cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(slide.id)}
                          className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                          title="Delete Slide"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add / Edit Slide Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-md" 
              onClick={() => !submitting && setIsModalOpen(false)}
            />

            <div className="relative z-10 w-full max-w-3xl bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-apex-red/10 border border-apex-red/30 text-apex-red flex items-center justify-center">
                    <Tv className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase text-white tracking-tight">
                      {formData.id ? 'Edit Hero Slide' : 'Create New Hero Slide'}
                    </h2>
                    <p className="text-xs text-gray-400">Configure slide typography, banners, links, and highlights.</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="p-2 text-gray-400 hover:text-white cursor-pointer rounded-xl bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="space-y-5 text-left text-xs">
                {/* 1. Headline & Highlight */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      Headline Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. TECH WITHOUT"
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-apex-red outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-apex-red mb-1.5">
                      Highlighted Text (Red Glow)
                    </label>
                    <input
                      type="text"
                      value={formData.highlight_text}
                      onChange={(e) => setFormData({ ...formData, highlight_text: e.target.value })}
                      placeholder="e.g. LIMITS."
                      className="w-full bg-[#111] border border-apex-red/30 rounded-xl px-4 py-2.5 text-white focus:border-apex-red outline-none"
                    />
                  </div>
                </div>

                {/* 2. Eyebrow Badge & Promotional Tag */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      Eyebrow / Badge Text
                    </label>
                    <input
                      type="text"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      placeholder="e.g. PREMIUM TECH. PREMIUM YOU."
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-apex-red outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      Promotional Tag (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.promotional_badge}
                      onChange={(e) => setFormData({ ...formData, promotional_badge: e.target.value })}
                      placeholder="e.g. FLAGSHIP, NEW ARRIVAL, 50% OFF"
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-apex-red outline-none"
                    />
                  </div>
                </div>

                {/* 3. Description */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Description Text
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Short description highlighting product features..."
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-apex-red outline-none leading-relaxed"
                  />
                </div>

                {/* 4. CTA Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#111] border border-white/5 rounded-2xl">
                  {/* Primary CTA */}
                  <div className="space-y-3">
                    <span className="font-bold text-white uppercase text-[11px] block">Primary Button</span>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Button Text</label>
                      <input
                        type="text"
                        value={formData.primary_button_text}
                        onChange={(e) => setFormData({ ...formData, primary_button_text: e.target.value })}
                        placeholder="e.g. SHOP NOW"
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2 text-white focus:border-apex-red outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Button Link</label>
                      <input
                        type="text"
                        value={formData.primary_button_link}
                        onChange={(e) => setFormData({ ...formData, primary_button_link: e.target.value })}
                        placeholder="e.g. /shop"
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2 text-white focus:border-apex-red outline-none"
                      />
                    </div>
                  </div>

                  {/* Secondary CTA */}
                  <div className="space-y-3">
                    <span className="font-bold text-white uppercase text-[11px] block">Secondary Button (Optional)</span>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Button Text</label>
                      <input
                        type="text"
                        value={formData.secondary_button_text}
                        onChange={(e) => setFormData({ ...formData, secondary_button_text: e.target.value })}
                        placeholder="e.g. EXPLORE DEALS"
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2 text-white focus:border-apex-red outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Button Link</label>
                      <input
                        type="text"
                        value={formData.secondary_button_link}
                        onChange={(e) => setFormData({ ...formData, secondary_button_link: e.target.value })}
                        placeholder="e.g. /deals"
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2 text-white focus:border-apex-red outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Images (Desktop & Mobile) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Desktop Banner Image */}
                  <div className="p-4 bg-[#111] border border-white/5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white uppercase text-[11px]">Desktop Banner Image</span>
                      {uploadingDesktop && <Loader2 className="w-3.5 h-3.5 text-apex-red animate-spin" />}
                    </div>

                    <input
                      type="text"
                      value={formData.desktop_image_url}
                      onChange={(e) => setFormData({ ...formData, desktop_image_url: e.target.value })}
                      placeholder="Image URL https://..."
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2 text-white focus:border-apex-red outline-none"
                    />

                    <div className="flex items-center gap-2">
                      <label className="flex-1 btn-secondary py-2 rounded-xl text-center cursor-pointer flex items-center justify-center gap-1.5 border border-white/10 hover:border-white/30 text-[11px] font-bold">
                        <Upload className="w-3.5 h-3.5" />
                        Upload File
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleDesktopImageUpload}
                          className="hidden"
                        />
                      </label>
                      {formData.desktop_image_url && (
                        <a
                          href={formData.desktop_image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-white/5 rounded-xl text-gray-400 hover:text-white"
                          title="Open Image Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Mobile Banner Image */}
                  <div className="p-4 bg-[#111] border border-white/5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white uppercase text-[11px]">Mobile Banner Image (Optional)</span>
                      {uploadingMobile && <Loader2 className="w-3.5 h-3.5 text-apex-red animate-spin" />}
                    </div>

                    <input
                      type="text"
                      value={formData.mobile_image_url}
                      onChange={(e) => setFormData({ ...formData, mobile_image_url: e.target.value })}
                      placeholder="Optional Mobile Image URL"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2 text-white focus:border-apex-red outline-none"
                    />

                    <div className="flex items-center gap-2">
                      <label className="flex-1 btn-secondary py-2 rounded-xl text-center cursor-pointer flex items-center justify-center gap-1.5 border border-white/10 hover:border-white/30 text-[11px] font-bold">
                        <Upload className="w-3.5 h-3.5" />
                        Upload File
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleMobileImageUpload}
                          className="hidden"
                        />
                      </label>
                      {formData.mobile_image_url && (
                        <a
                          href={formData.mobile_image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-white/5 rounded-xl text-gray-400 hover:text-white"
                          title="Open Image Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* 6. Feature Highlights */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Feature Highlights (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    placeholder="e.g. 100% Original, Free Delivery, 7 Days Return, 24/7 Support"
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-apex-red outline-none"
                  />
                </div>

                {/* 7. Settings (Order, Autoplay, Active Status) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      Display Sort Order
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-apex-red outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      Autoplay Duration (ms)
                    </label>
                    <input
                      type="number"
                      min={2000}
                      step={500}
                      value={formData.autoplay_duration}
                      onChange={(e) => setFormData({ ...formData, autoplay_duration: Number(e.target.value) })}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-apex-red outline-none"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 p-3 bg-[#111] border border-white/10 rounded-xl cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="accent-apex-red w-4 h-4 rounded cursor-pointer"
                      />
                      <span className="font-bold uppercase text-white text-xs">Active on Site</span>
                    </label>
                  </div>
                </div>

                {/* Submit Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={submitting}
                    className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary px-8 py-3 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.4)] cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving Slide...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {formData.id ? 'Update Hero Slide' : 'Publish Hero Slide'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Live Preview Modal */}
        {isPreviewOpen && previewSlide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
              onClick={() => setIsPreviewOpen(false)} 
            />

            <div className="relative z-10 w-full max-w-5xl bg-[#050505] border border-white/15 rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <span className="text-xs font-mono uppercase tracking-widest text-apex-red font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Hero Slide Live Storefront Preview
                </span>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-xl bg-white/5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preview Banner Container */}
              <div className="relative min-h-[400px] flex items-center bg-[#070707] border border-white/10 rounded-3xl p-8 sm:p-12 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-apex-red/25 blur-[120px] rounded-full pointer-events-none" />

                <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
                  <div className="w-full lg:w-1/2 text-left space-y-4">
                    {previewSlide.badge && (
                      <span className="inline-block px-3 py-1 rounded-full bg-apex-red/15 border border-apex-red/30 text-apex-red text-xs font-bold uppercase tracking-wider">
                        {previewSlide.badge}
                      </span>
                    )}

                    <h2 className="text-3xl sm:text-5xl font-black uppercase text-white leading-tight">
                      {previewSlide.title}{' '}
                      {previewSlide.highlight_text && (
                        <span className="text-gradient-red">{previewSlide.highlight_text}</span>
                      )}
                    </h2>

                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                      {previewSlide.description}
                    </p>

                    <div className="flex items-center gap-3 pt-2">
                      <span className="btn-primary px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider">
                        {previewSlide.primary_button_text || 'SHOP NOW'}
                      </span>
                      {previewSlide.secondary_button_text && (
                        <span className="btn-secondary px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider border border-white/20">
                          {previewSlide.secondary_button_text}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full lg:w-1/2 flex items-center justify-center h-64 sm:h-80">
                    <img
                      src={previewSlide.desktop_image_url}
                      alt={previewSlide.title}
                      className="max-h-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminErrorBoundary>
  );
}
