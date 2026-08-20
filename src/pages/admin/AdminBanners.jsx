import React, { useState, useEffect, Component } from 'react';
import { 
  Image as ImageIcon, 
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
  EyeOff
} from 'lucide-react';
import { 
  fetchAdminBanners, 
  saveBanner, 
  deleteBanner, 
  toggleBannerStatus, 
  updateBannersOrder, 
  uploadImageToSupabase 
} from '../../services/api';
import { useToast } from '../../context/ToastContext';

// Error Boundary specifically to guarantee no black screen under any circumstance
class AdminErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AdminBanners caught error:', error, errorInfo);
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
            {this.state.error?.message || 'An unexpected rendering error occurred in the banner manager.'}
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

const DEFAULT_BANNER_FORM = {
  id: null,
  title: '',
  subtitle: '',
  badge_text: '',
  image_url: '',
  button_text: 'SHOP NOW',
  button_url: '/shop',
  open_in_new_tab: false,
  display_order: 1,
  is_active: true,
};

function AdminBannersContent() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageInputMethod, setImageInputMethod] = useState('url'); // 'url' | 'upload'
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState(DEFAULT_BANNER_FORM);

  const { success, error: toastError } = useToast();

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminBanners();
      if (Array.isArray(data)) {
        setBanners(data);
      } else {
        setBanners([]);
      }
    } catch (err) {
      console.warn('Failed to load banners:', err);
      if (toastError) toastError('Failed to fetch promotional banners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleOpenAdd = () => {
    try {
      const existingOrders = (banners || [])
        .map((b) => Number(b?.display_order))
        .filter((n) => !isNaN(n) && isFinite(n));

      const nextOrder = existingOrders.length > 0 ? Math.max(...existingOrders) + 1 : 1;

      setFormData({
        ...DEFAULT_BANNER_FORM,
        display_order: nextOrder,
      });
      setImageInputMethod('url');
      setIsModalOpen(true);
    } catch (e) {
      console.error('Error opening add modal:', e);
      setFormData({ ...DEFAULT_BANNER_FORM });
      setIsModalOpen(true);
    }
  };

  const handleOpenEdit = (banner) => {
    if (!banner) return;
    try {
      setFormData({
        id: banner.id ?? null,
        title: banner.title ?? '',
        subtitle: banner.subtitle ?? '',
        badge_text: banner.badge_text ?? '',
        image_url: banner.image_url ?? '',
        button_text: banner.button_text ?? '',
        button_url: banner.button_url ?? '',
        open_in_new_tab: Boolean(banner.open_in_new_tab),
        display_order: Number(banner.display_order) || 1,
        is_active: banner.is_active !== false,
      });
      const isDataUrl = typeof banner.image_url === 'string' && banner.image_url.startsWith('data:');
      setImageInputMethod(isDataUrl ? 'upload' : 'url');
      setIsModalOpen(true);
    } catch (e) {
      console.error('Error opening edit modal:', e);
      if (toastError) toastError('Failed to open banner editor.');
    }
  };

  const handleCloseModal = () => {
    if (saving) return;
    setIsModalOpen(false);
  };

  const handleImageFileUpload = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const uploadedUrl = await uploadImageToSupabase(file, 'banners');
      if (uploadedUrl) {
        setFormData((prev) => ({ ...prev, image_url: uploadedUrl }));
        if (success) success('Banner image uploaded successfully!');
      }
    } catch (err) {
      console.warn('Image upload error:', err);
      if (toastError) toastError(err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image_url?.trim() && !formData.title?.trim()) {
      if (toastError) toastError('Please provide a banner image URL or title.');
      return;
    }

    setSaving(true);
    try {
      await saveBanner(formData);
      if (success) success(formData.id ? 'Banner updated successfully!' : 'New banner published!');
      setIsModalOpen(false);
      await loadBanners();
    } catch (err) {
      console.warn('Save banner error:', err);
      if (toastError) toastError(err.message || 'Failed to save banner.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bannerId) => {
    if (!bannerId) return;
    if (window.confirm('Are you sure you want to delete this promotional banner?')) {
      try {
        await deleteBanner(bannerId);
        if (success) success('Banner deleted.');
        await loadBanners();
      } catch (err) {
        if (toastError) toastError('Failed to delete banner.');
      }
    }
  };

  const handleToggleActive = async (banner) => {
    if (!banner?.id) return;
    const updatedStatus = !banner.is_active;
    try {
      await toggleBannerStatus(banner.id, updatedStatus);
      if (success) success(`Banner ${updatedStatus ? 'enabled' : 'disabled'}.`);
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, is_active: updatedStatus } : b))
      );
    } catch (err) {
      if (toastError) toastError('Failed to update banner status.');
    }
  };

  const handleMoveOrder = async (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= banners.length) return;

    const newBanners = [...banners];
    const temp = newBanners[index];
    newBanners[index] = newBanners[newIndex];
    newBanners[newIndex] = temp;

    const reordered = newBanners.map((b, i) => ({ ...b, display_order: i + 1 }));
    setBanners(reordered);
    try {
      await updateBannersOrder(reordered);
      if (success) success('Banner order updated.');
    } catch (e) {
      console.warn('Failed to update order:', e);
    }
  };

  const filteredBanners = (banners || []).filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (b?.title || '').toLowerCase().includes(q) ||
      (b?.subtitle || '').toLowerCase().includes(q) ||
      (b?.badge_text || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header Banner Control Card */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-apex-red/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-apex-red/10 border border-apex-red/30 text-apex-red flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.25)] shrink-0">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2.5">
              Promotional <span className="text-apex-red">Banners</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Manage rotating homepage banners, official drops, and partnership collabs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={loadBanners}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/10 cursor-pointer"
            title="Refresh Banners"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="btn-primary inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.35)] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Banner
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      {banners.length > 0 && (
        <div className="flex items-center justify-between gap-4 bg-[#0a0a0a] p-4 rounded-2xl border border-white/5">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search banners by title, badge, or subtitle..."
              className="w-full bg-[#141414] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:border-apex-red outline-none"
            />
          </div>

          <div className="text-xs text-gray-400">
            Total Banners: <span className="font-bold text-white font-mono">{banners.length}</span> ({banners.filter((b) => b.is_active).length} Active)
          </div>
        </div>
      )}

      {/* Banners List / Grid */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-[#0a0a0a] border border-white/5 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-12 text-center">
          <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold uppercase text-white mb-1">
            {searchQuery ? 'No Matching Banners' : 'No Promotional Banners'}
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mb-6">
            {searchQuery 
              ? 'Try changing your search query.' 
              : 'Create an eye-catching banner carousel to spotlight sales, brand partnerships, and new product releases.'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleOpenAdd}
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add First Banner
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBanners.map((banner, index) => (
            <div
              key={banner.id || index}
              className={`bg-[#0a0a0a] border rounded-3xl p-5 sm:p-6 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl ${
                banner.is_active
                  ? 'border-white/10 hover:border-white/20'
                  : 'border-white/5 opacity-60 bg-[#080808]'
              }`}
            >
              {/* Left: Banner Thumbnail & Text */}
              <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                {/* Order Badge & Re-order Buttons */}
                <div className="flex flex-col items-center justify-center gap-1 shrink-0">
                  <button
                    onClick={() => handleMoveOrder(index, -1)}
                    disabled={index === 0}
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-bold text-xs text-gray-400">
                    #{banner.display_order || index + 1}
                  </span>
                  <button
                    onClick={() => handleMoveOrder(index, 1)}
                    disabled={index === filteredBanners.length - 1}
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Banner Thumbnail Preview */}
                <div className="w-28 h-16 sm:w-36 sm:h-20 rounded-2xl bg-[#141414] border border-white/10 overflow-hidden shrink-0 relative group">
                  {banner.image_url ? (
                    <img
                      src={banner.image_url}
                      alt={banner.title || 'Banner'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                  {banner.is_active && (
                    <span className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                  )}
                </div>

                {/* Banner Info */}
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {banner.badge_text && (
                      <span className="bg-apex-red/20 text-apex-red border border-apex-red/40 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                        {banner.badge_text}
                      </span>
                    )}
                    <h3 className="font-bold text-white text-sm sm:text-base truncate">
                      {banner.title || 'Untitled Banner'}
                    </h3>
                  </div>

                  {banner.subtitle && (
                    <p className="text-xs text-gray-400 truncate max-w-md">
                      {banner.subtitle}
                    </p>
                  )}

                  {banner.button_text && (
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 pt-0.5">
                      <span className="font-semibold text-gray-400">CTA:</span>
                      <span className="text-apex-red font-mono font-bold">{banner.button_text}</span>
                      <span>→</span>
                      <span className="truncate font-mono">{banner.button_url || '/shop'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Actions & Status Switch */}
              <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-white/5 shrink-0">
                {/* Active/Inactive Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(banner)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      banner.is_active ? 'bg-emerald-500' : 'bg-gray-800'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        banner.is_active ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-semibold text-gray-400">
                    {banner.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>

                {/* Edit & Delete Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(banner)}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer border border-white/10"
                    title="Edit Banner"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors cursor-pointer border border-white/10"
                    title="Delete Banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Banner Modal with Live Preview */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <div
            onClick={handleCloseModal}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm -z-10"
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-3xl bg-[#0c0c0c] border border-white/10 rounded-3xl p-6 sm:p-8 my-8 text-left space-y-6 max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(0,0,0,0.9)]">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 sticky top-0 bg-[#0c0c0c] z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-apex-red/10 border border-apex-red/20 text-apex-red flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-wider text-white">
                    {formData?.id ? 'Edit' : 'Create'} <span className="text-apex-red">Banner</span>
                  </h2>
                  <p className="text-xs text-gray-400">
                    Configure visuals, badge, title, and link URL.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* LIVE INTERACTIVE BANNER PREVIEW */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-apex-red" /> Live Storefront Preview
                </span>
                <span className="text-[11px] text-gray-500">Updates in real-time</span>
              </div>

              <div className="relative w-full h-[180px] sm:h-[220px] rounded-2xl border border-white/10 bg-[#080808] overflow-hidden flex items-center justify-between shadow-xl">
                {/* Background Image Preview */}
                {formData?.image_url ? (
                  <div className="absolute inset-0 w-full h-full">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover opacity-60"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-transparent" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-[#0a0a0a] to-[#161616]" />
                )}

                {/* Ambient Glow */}
                <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-48 h-48 bg-apex-red/20 blur-[60px] rounded-full pointer-events-none" />

                {/* Text Overlay */}
                <div className="relative z-10 px-6 sm:px-10 max-w-xl space-y-2">
                  {formData?.badge_text && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-apex-red text-white shadow-sm">
                      <Sparkles size={10} /> {formData.badge_text}
                    </span>
                  )}
                  <h3 className="text-base sm:text-2xl font-black uppercase tracking-tight text-white leading-tight">
                    {formData?.title || 'BANNER TITLE'}
                  </h3>
                  <p className="text-xs text-gray-300 line-clamp-2">
                    {formData?.subtitle || 'Banner description or promotional text...'}
                  </p>
                  {formData?.button_text && (
                    <div className="pt-1">
                      <span className="btn-primary inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {formData.button_text} <Sparkles className="w-3 h-3" />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Controls */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              {/* 1. Image Source (URL vs File Upload) */}
              <div className="bg-[#111] p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                    Banner Image *
                  </label>
                  <div className="flex bg-[#1a1a1a] p-1 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setImageInputMethod('url')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        imageInputMethod === 'url' ? 'bg-apex-red text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Image URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMethod('upload')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        imageInputMethod === 'upload' ? 'bg-apex-red text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Upload File
                    </button>
                  </div>
                </div>

                {imageInputMethod === 'url' ? (
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={formData.image_url || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://example.com/banner-graphic.jpg"
                      className="w-full bg-[#181818] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-apex-red outline-none"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <label className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer">
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" /> Choose Banner File
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFileUpload(e.target.files?.[0])}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                    <span className="text-xs text-gray-500 truncate">
                      {formData.image_url ? 'Image selected / uploaded' : 'PNG, JPG, WEBP up to 5MB'}
                    </span>
                  </div>
                )}
              </div>

              {/* 2. Badge & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Badge Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.badge_text || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, badge_text: e.target.value }))}
                    placeholder="e.g. OFFICIAL PARTNERSHIP / LIMITED DROP"
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-apex-red outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Banner Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. PUBG MOBILE × ZERO"
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-apex-red outline-none"
                  />
                </div>
              </div>

              {/* 3. Subtitle / Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Subtitle / Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.subtitle || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="e.g. ULTRA-LOW LATENCY WIRELESS EARBUDS FOR PRO ESPORTS"
                  className="w-full bg-[#161616] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-apex-red outline-none resize-y"
                />
              </div>

              {/* 4. Button Text & Link URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    CTA Button Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.button_text || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, button_text: e.target.value }))}
                    placeholder="e.g. SHOP NOW / LIVE NOW"
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-apex-red outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Button / Destination URL
                  </label>
                  <input
                    type="text"
                    value={formData.button_url || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, button_url: e.target.value }))}
                    placeholder="e.g. /shop, /deals, or https://..."
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-apex-red outline-none"
                  />
                </div>
              </div>

              {/* 5. Display Order, Open in new tab & Active Switch */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Display Order #
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.display_order || 1}
                    onChange={(e) => setFormData((prev) => ({ ...prev, display_order: Number(e.target.value) || 1 }))}
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-apex-red outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="newTabCheckbox"
                    checked={Boolean(formData.open_in_new_tab)}
                    onChange={(e) => setFormData((prev) => ({ ...prev, open_in_new_tab: e.target.checked }))}
                    className="accent-apex-red w-4 h-4 rounded cursor-pointer"
                  />
                  <label htmlFor="newTabCheckbox" className="text-xs text-gray-300 font-semibold cursor-pointer">
                    Open link in new tab
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="activeCheckbox"
                    checked={Boolean(formData.is_active)}
                    onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                    className="accent-apex-red w-4 h-4 rounded cursor-pointer"
                  />
                  <label htmlFor="activeCheckbox" className="text-xs text-gray-300 font-semibold cursor-pointer">
                    Active (Visible on homepage)
                  </label>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-gray-400 bg-white/5 hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.35)] cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {formData?.id ? 'Save Changes' : 'Publish Banner'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminBanners() {
  return (
    <AdminErrorBoundary>
      <AdminBannersContent />
    </AdminErrorBoundary>
  );
}
