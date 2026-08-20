import React, { useState, useEffect, Component } from 'react';
import { 
  Camera, 
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
  Share2
} from 'lucide-react';
import { InstagramIcon } from '../../components/ui/SocialIcons';
import { 
  fetchAdminSocialGallery, 
  saveSocialGalleryItem, 
  deleteSocialGalleryItem, 
  toggleSocialGalleryStatus, 
  updateSocialGalleryOrder, 
  uploadSocialGalleryImage 
} from '../../services/api';
import { useToast } from '../../context/ToastContext';

// Error Boundary to ensure admin page never crashes
class AdminErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AdminSocialGallery error:', error, errorInfo);
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
            {this.state.error?.message || 'An unexpected rendering error occurred in the social gallery manager.'}
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

const DEFAULT_GALLERY_FORM = {
  id: null,
  image_url: '',
  alt_text: '',
  caption: '',
  link_url: 'https://www.instagram.com/apexstor.pk/',
  platform: 'Instagram',
  sort_order: 1,
  is_active: true,
};

function AdminSocialGalleryContent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageInputMethod, setImageInputMethod] = useState('url'); // 'url' | 'upload'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  const [formData, setFormData] = useState(DEFAULT_GALLERY_FORM);

  const { success, error: toastError } = useToast();

  const loadGallery = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminSocialGallery();
      if (Array.isArray(data)) {
        setItems(data);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.warn('Failed to load social gallery:', err);
      if (toastError) toastError('Failed to fetch social gallery items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const handleOpenAdd = () => {
    try {
      const existingOrders = (items || [])
        .map((b) => Number(b?.sort_order))
        .filter((n) => !isNaN(n) && isFinite(n));

      const nextOrder = existingOrders.length > 0 ? Math.max(...existingOrders) + 1 : 1;

      setFormData({
        ...DEFAULT_GALLERY_FORM,
        sort_order: nextOrder,
      });
      setImageInputMethod('url');
      setIsModalOpen(true);
    } catch (e) {
      console.error('Error opening add modal:', e);
      setFormData({ ...DEFAULT_GALLERY_FORM });
      setIsModalOpen(true);
    }
  };

  const handleOpenEdit = (item) => {
    if (!item) return;
    try {
      setFormData({
        id: item.id ?? null,
        image_url: item.image_url ?? '',
        alt_text: item.alt_text ?? '',
        caption: item.caption ?? '',
        link_url: item.link_url ?? 'https://www.instagram.com/apexstor.pk/',
        platform: item.platform ?? 'Instagram',
        sort_order: Number(item.sort_order ?? 1),
        is_active: item.is_active !== undefined ? Boolean(item.is_active) : true,
      });
      setImageInputMethod('url');
      setIsModalOpen(true);
    } catch (e) {
      console.error('Error opening edit modal:', e);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const uploadedUrl = await uploadSocialGalleryImage(file);
      if (uploadedUrl) {
        setFormData((prev) => ({ ...prev, image_url: uploadedUrl }));
        if (success) success('Image uploaded successfully!');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      if (toastError) toastError(err.message || 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image_url.trim()) {
      if (toastError) toastError('Please provide an image URL or upload an image file.');
      return;
    }

    setSaving(true);
    try {
      const saved = await saveSocialGalleryItem(formData);
      if (saved) {
        if (success) {
          success(formData.id ? 'Social post updated successfully!' : 'New social post published!');
        }
        setIsModalOpen(false);
        await loadGallery();
      }
    } catch (err) {
      console.error('Save failed:', err);
      if (toastError) toastError('Failed to save social post: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id, e) => {
    e?.stopPropagation();
    try {
      const newStatus = await toggleSocialGalleryStatus(id);
      setItems((prev) =>
        prev.map((b) => (b.id === id ? { ...b, is_active: newStatus } : b))
      );
      if (success) success(`Post is now ${newStatus ? 'ACTIVE' : 'INACTIVE'}`);
    } catch (err) {
      console.error('Toggle status error:', err);
      if (toastError) toastError('Failed to update status.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSocialGalleryItem(id);
      setItems((prev) => prev.filter((b) => b.id !== id));
      setDeleteConfirmId(null);
      if (success) success('Social post deleted successfully.');
    } catch (err) {
      console.error('Delete error:', err);
      if (toastError) toastError('Failed to delete social post.');
    }
  };

  const handleMoveOrder = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const reordered = newItems.map((item, idx) => ({
      ...item,
      sort_order: idx + 1,
    }));

    setItems(reordered);
    try {
      await updateSocialGalleryOrder(reordered);
      if (success) success('Display order updated!');
    } catch (err) {
      console.error('Order update error:', err);
      if (toastError) toastError('Failed to save new order.');
    }
  };

  // Filter items based on search and status
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      (item.alt_text || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.caption || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.link_url || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? item.is_active !== false
        : item.is_active === false;

    return matchesSearch && matchesStatus;
  });

  const activeCount = items.filter((b) => b.is_active !== false).length;
  const inactiveCount = items.filter((b) => b.is_active === false).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-apex-red/10 border border-apex-red/30 flex items-center justify-center text-apex-red shadow-[0_0_20px_rgba(220,38,38,0.2)] shrink-0">
            <InstagramIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2">
              Social Gallery
            </h1>
            <p className="text-xs sm:text-sm text-gray-400">
              Manage homepage &ldquo;FOLLOW THE APEX&rdquo; Instagram & social media cards
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadGallery}
            className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.4)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Social Image</span>
          </button>
        </div>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Total Posts</p>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{items.length}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
            <Camera className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#0f0f0f] border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider">Active</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">{activeCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Check className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#0f0f0f] border border-zinc-700/40 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Inactive</p>
            <p className="text-xl sm:text-2xl font-black text-gray-400 mt-0.5">{inactiveCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-gray-400">
            <EyeOff className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0a0a0a] border border-white/10 rounded-2xl p-3 sm:p-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by caption, alt text or link..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141414] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-apex-red/50"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto bg-[#141414] p-1 rounded-xl border border-white/5">
          {['all', 'active', 'inactive'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                statusFilter === filter
                  ? 'bg-apex-red text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-3 h-64 animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-12 text-center">
          <Camera className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white uppercase tracking-wider mb-1">No Social Images Found</h3>
          <p className="text-xs text-gray-400 mb-5">
            {searchQuery ? 'Try changing your search keywords or filter.' : 'Add your first social media gallery post to showcase on the homepage.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Social Image</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {filteredItems.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === filteredItems.length - 1;

            return (
              <div
                key={item.id}
                className={`group bg-[#0a0a0a] border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col justify-between ${
                  item.is_active !== false
                    ? 'border-white/10 hover:border-apex-red/50 shadow-lg'
                    : 'border-white/5 opacity-60'
                }`}
              >
                {/* Image Thumbnail with Overlay Badges */}
                <div className="relative aspect-square w-full bg-[#111] overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.alt_text || 'Social Post'}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop';
                    }}
                  />

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                    <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-[9px] font-black text-white uppercase tracking-wider">
                      #{item.sort_order || index + 1}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border backdrop-blur-md ${
                        item.is_active !== false
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-800/80 text-gray-400 border-zinc-700'
                      }`}
                    >
                      {item.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Reorder Buttons Overlay */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleMoveOrder(index, -1)}
                      disabled={isFirst}
                      className="w-7 h-7 rounded-lg bg-black/80 hover:bg-apex-red text-white flex items-center justify-center disabled:opacity-30 disabled:hover:bg-black/80 backdrop-blur-md transition-colors cursor-pointer"
                      title="Move Left / Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveOrder(index, 1)}
                      disabled={isLast}
                      className="w-7 h-7 rounded-lg bg-black/80 hover:bg-apex-red text-white flex items-center justify-center disabled:opacity-30 disabled:hover:bg-black/80 backdrop-blur-md transition-colors cursor-pointer"
                      title="Move Right / Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Info & Caption */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                      <span className="font-bold text-apex-red flex items-center gap-1">
                        <InstagramIcon className="w-3 h-3" />
                        {item.platform || 'Instagram'}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-white line-clamp-1 mb-0.5">
                      {item.alt_text || 'APEX Social Post'}
                    </p>

                    {item.caption && (
                      <p className="text-[10px] text-gray-400 line-clamp-2 leading-snug">
                        {item.caption}
                      </p>
                    )}
                  </div>

                  {/* Actions Toolbar */}
                  <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between gap-1">
                    <button
                      onClick={(e) => handleToggleStatus(item.id, e)}
                      className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                        item.is_active !== false
                          ? 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                          : 'border-zinc-700 text-gray-400 hover:bg-zinc-800'
                      }`}
                      title={item.is_active !== false ? 'Click to deactivate' : 'Click to activate'}
                    >
                      {item.is_active !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    {item.link_url && (
                      <a
                        href={item.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        title="Open target URL"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                      title="Edit post"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0f0f0f] border border-white/15 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-[#141414]">
              <div className="flex items-center gap-2.5">
                <InstagramIcon className="w-5 h-5 text-apex-red" />
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                  {formData.id ? 'Edit Social Media Post' : 'Add New Social Media Post'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
              {/* Live Preview Card */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Live Card Preview (As Seen on Homepage)
                </label>
                <div className="w-36 sm:w-44 aspect-square rounded-2xl overflow-hidden border border-white/15 relative bg-[#050505] shadow-lg group mx-auto sm:mx-0">
                  {formData.image_url ? (
                    <img
                      src={formData.image_url}
                      alt={formData.alt_text || 'Preview'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-1.5 p-4 text-center">
                      <Camera className="w-6 h-6" />
                      <span className="text-[10px]">No image selected</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <InstagramIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Image Input Method (Upload vs URL) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
                    Social Post Image <span className="text-apex-red">*</span>
                  </label>
                  <div className="flex items-center gap-1 bg-[#1a1a1a] p-0.5 rounded-lg border border-white/5">
                    <button
                      type="button"
                      onClick={() => setImageInputMethod('url')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        imageInputMethod === 'url' ? 'bg-apex-red text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Image URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMethod('upload')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        imageInputMethod === 'upload' ? 'bg-apex-red text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Upload File
                    </button>
                  </div>
                </div>

                {imageInputMethod === 'url' ? (
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or Supabase storage URL"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      required
                      className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-apex-red/50"
                    />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-white/15 rounded-2xl p-6 text-center hover:border-apex-red/50 transition-colors bg-[#141414]">
                    <input
                      type="file"
                      id="social-image-file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="social-image-file"
                      className="cursor-pointer flex flex-col items-center justify-center gap-2"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-8 h-8 text-apex-red animate-spin" />
                          <span className="text-xs font-bold text-gray-300">Uploading to Supabase Storage...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-apex-red" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Click to upload image file
                          </span>
                          <span className="text-[10px] text-gray-500">JPG, PNG, WEBP, GIF, AVIF (Max 5MB)</span>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>

              {/* Alt Text & Platform in 2 cols */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Alt Text / Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. APEX Titanium Wireless Audio"
                    value={formData.alt_text}
                    onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                    className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-apex-red/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Social Platform
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-apex-red/50"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Twitter">Twitter / X</option>
                    <option value="Pinterest">Pinterest</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Caption / Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Clean setup featuring our flagship mechanical keyboard."
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-apex-red/50 resize-none"
                />
              </div>

              {/* Social Link URL & Sort Order */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Target Link URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.instagram.com/apexstor.pk/ or product link"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-apex-red/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-apex-red/50"
                  />
                </div>
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center justify-between p-3.5 bg-[#141414] border border-white/10 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Publish on Homepage</p>
                  <p className="text-[11px] text-gray-400">Make this social media post visible on the live storefront</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-apex-red"></div>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.4)] cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Post</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-red-500/30 rounded-3xl p-6 max-w-md w-full text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black uppercase tracking-wider text-white mb-2">Delete Social Post?</h3>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Are you sure you want to delete this social media post? This action will remove it from the homepage gallery across all devices.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-wider text-gray-300 hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold uppercase tracking-wider text-white transition-colors cursor-pointer shadow-[0_0_15px_rgba(220,38,38,0.5)]"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSocialGallery() {
  return (
    <AdminErrorBoundary>
      <AdminSocialGalleryContent />
    </AdminErrorBoundary>
  );
}
