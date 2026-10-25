import React, { useState, useEffect, Component, useMemo } from 'react';
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
  Sparkles, 
  Upload, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  EyeOff,
  Smartphone,
  Monitor,
  Tablet,
  Calendar,
  Clock,
  Layers,
  Tag,
  Play
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  fetchAdminBanners, 
  saveBanner, 
  deleteBanner, 
  toggleBannerStatus, 
  updateBannersOrder, 
  uploadImageToSupabase 
} from '../../services/api';
import { useToast } from '../../context/ToastContext';

// Error Boundary to prevent admin crashes
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
  mobile_image_url: '',
  button_text: 'SHOP NOW',
  button_url: '/shop',
  open_in_new_tab: false,
  display_order: 1,
  is_active: true,
  position: 'middle', // 'middle' | 'hero' | 'announcement' | 'bottom'
  start_date: '',
  end_date: '',
  overlay_opacity: 40,
  animation_type: 'slide',
};

const BANNER_POSITIONS = [
  { 
    id: 'middle', 
    label: 'Below Categories', 
    description: 'Promotional banner directly below Shop by Category section',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  },
  { 
    id: 'hero', 
    label: 'Hero Showcase', 
    description: 'Top hero carousel banner slider at page top',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  },
  { 
    id: 'announcement', 
    label: 'Top Announcement', 
    description: 'Header notification / promotion ribbon',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  },
  { 
    id: 'bottom', 
    label: 'Pre-Footer Banner', 
    description: 'Above footer promotion banner',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  },
];

/**
 * Computes schedule status for banner
 */
function getScheduleStatus(banner) {
  if (banner.is_active === false) {
    return { type: 'draft', label: 'Draft / Paused', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' };
  }

  const now = new Date();
  const hasStart = banner.start_date && !isNaN(new Date(banner.start_date).getTime());
  const hasEnd = banner.end_date && !isNaN(new Date(banner.end_date).getTime());

  if (hasEnd && new Date(banner.end_date) < now) {
    return { type: 'expired', label: 'Expired', color: 'bg-red-500/10 text-red-400 border-red-500/20' };
  }

  if (hasStart && new Date(banner.start_date) > now) {
    const startDateFormatted = new Date(banner.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return { type: 'scheduled', label: `Scheduled (${startDateFormatted})`, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
  }

  return { type: 'live', label: 'Live on Storefront', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
}

function AdminBannersContent() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewBanner, setPreviewBanner] = useState(null);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [previewAnimationKey, setPreviewAnimationKey] = useState(0);

  const [saving, setSaving] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('all'); // 'all' | 'middle' | 'hero' | 'announcement' | 'bottom'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'live' | 'scheduled' | 'expired' | 'draft'

  const [formData, setFormData] = useState(DEFAULT_BANNER_FORM);
  const { success, error: toastError, info } = useToast();

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminBanners();
      setBanners(Array.isArray(data) ? data : []);
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
    const existingOrders = (banners || [])
      .map((b) => Number(b?.display_order || b?.sort_order))
      .filter((n) => !isNaN(n) && isFinite(n));
    const nextOrder = existingOrders.length > 0 ? Math.max(...existingOrders) + 1 : 1;

    setFormData({
      ...DEFAULT_BANNER_FORM,
      display_order: nextOrder,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner) => {
    if (!banner) return;
    setFormData({
      id: banner.id ?? null,
      title: banner.title ?? '',
      subtitle: banner.subtitle ?? banner.description ?? '',
      badge_text: banner.badge_text ?? banner.badge ?? '',
      image_url: banner.image_url ?? banner.desktop_image_url ?? '',
      mobile_image_url: banner.mobile_image_url ?? '',
      button_text: banner.button_text ?? banner.primary_button_text ?? '',
      button_url: banner.button_url ?? banner.primary_button_link ?? '',
      open_in_new_tab: Boolean(banner.open_in_new_tab),
      display_order: Number(banner.display_order || banner.sort_order) || 1,
      is_active: banner.is_active !== false,
      position: banner.position || banner.placement || 'middle',
      start_date: banner.start_date || '',
      end_date: banner.end_date || '',
      overlay_opacity: banner.overlay_opacity !== undefined ? banner.overlay_opacity : 40,
      animation_type: banner.animation_type || 'slide',
    });
    setIsModalOpen(true);
  };

  const handlePreview = (banner) => {
    setPreviewBanner(banner);
    setPreviewDevice('desktop');
    setPreviewAnimationKey((prev) => prev + 1);
    setIsPreviewOpen(true);
  };

  const handleDesktopImageUpload = async (file) => {
    if (!file) return;
    setUploadingDesktop(true);
    try {
      const uploadedUrl = await uploadImageToSupabase(file, 'banners');
      if (uploadedUrl) {
        setFormData((prev) => ({ ...prev, image_url: uploadedUrl }));
        if (success) success('Desktop banner image uploaded!');
      }
    } catch (err) {
      console.warn('Image upload error:', err);
      if (toastError) toastError(err.message || 'Image upload failed.');
    } finally {
      setUploadingDesktop(false);
    }
  };

  const handleMobileImageUpload = async (file) => {
    if (!file) return;
    setUploadingMobile(true);
    try {
      const uploadedUrl = await uploadImageToSupabase(file, 'banners');
      if (uploadedUrl) {
        setFormData((prev) => ({ ...prev, mobile_image_url: uploadedUrl }));
        if (success) success('Mobile banner image uploaded!');
      }
    } catch (err) {
      console.warn('Image upload error:', err);
      if (toastError) toastError(err.message || 'Mobile image upload failed.');
    } finally {
      setUploadingMobile(false);
    }
  };

  // Schedule Quick Preset Helpers
  const applySchedulePreset = (preset) => {
    const now = new Date();
    if (preset === 'always') {
      setFormData((prev) => ({ ...prev, start_date: '', end_date: '', is_active: true }));
      if (info) info('Banner set to run indefinitely.');
      return;
    }

    const formatForInput = (date) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    if (preset === '24h') {
      const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      setFormData((prev) => ({
        ...prev,
        start_date: formatForInput(now),
        end_date: formatForInput(end),
        is_active: true,
      }));
      if (info) info('Scheduled 24-hour flash banner.');
    } else if (preset === '7d') {
      const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      setFormData((prev) => ({
        ...prev,
        start_date: formatForInput(now),
        end_date: formatForInput(end),
        is_active: true,
      }));
      if (info) info('Scheduled 7-day campaign banner.');
    } else if (preset === 'weekend') {
      const fri = new Date(now);
      const daysUntilFri = (5 - fri.getDay() + 7) % 7;
      fri.setDate(fri.getDate() + daysUntilFri);
      fri.setHours(18, 0, 0, 0);

      const sun = new Date(fri);
      sun.setDate(sun.getDate() + 2);
      sun.setHours(23, 59, 0, 0);

      setFormData((prev) => ({
        ...prev,
        start_date: formatForInput(fri),
        end_date: formatForInput(sun),
        is_active: true,
      }));
      if (info) info('Scheduled for upcoming weekend special.');
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

    const reordered = newBanners.map((b, i) => ({ ...b, display_order: i + 1, sort_order: i + 1 }));
    setBanners(reordered);

    try {
      await updateBannersOrder(reordered);
      if (info) info('Banner order updated.');
    } catch (err) {
      console.warn('Order update error:', err);
    }
  };

  // Filtered Banners calculation
  const filteredBanners = useMemo(() => {
    return banners.filter((b) => {
      // Search match
      const query = searchQuery.toLowerCase();
      const title = (b.title || '').toLowerCase();
      const sub = (b.subtitle || b.description || '').toLowerCase();
      const badge = (b.badge_text || b.badge || '').toLowerCase();
      const matchesSearch = !searchQuery || title.includes(query) || sub.includes(query) || badge.includes(query);

      if (!matchesSearch) return false;

      // Position filter
      if (positionFilter !== 'all') {
        const pos = b.position || b.placement || 'middle';
        if (pos !== positionFilter) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const status = getScheduleStatus(b).type;
        if (status !== statusFilter) return false;
      }

      return true;
    });
  }, [banners, searchQuery, positionFilter, statusFilter]);

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-16">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0a0a] border border-white/5 p-6 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-apex-red/10 blur-[100px] rounded-full pointer-events-none" />

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-apex-red/10 text-apex-red rounded-xl border border-apex-red/20 shadow-[0_0_12px_rgba(220,38,38,0.3)]">
              <ImageIcon className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              Promotional <span className="text-apex-red">Banners & Ads</span>
            </h1>
          </div>
          <p className="text-xs text-gray-400">
            Manage middle campaign banners, placement positions, scheduling, and multi-device mobile previews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadBanners}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Refresh Banners"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="btn-primary px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.35)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Banner
          </button>
        </div>
      </div>

      {/* Filter Bar: Position Tabs & Status Tabs */}
      <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search banners by title or badge..."
              className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:border-apex-red outline-none"
            />
          </div>

          {/* Position Selector Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-gray-500 font-mono uppercase mr-1">Position:</span>
            {[
              { id: 'all', label: 'All Placements' },
              { id: 'middle', label: 'Below Categories' },
              { id: 'hero', label: 'Hero Showcase' },
              { id: 'announcement', label: 'Top Announcement' },
              { id: 'bottom', label: 'Pre-Footer' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPositionFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  positionFilter === tab.id
                    ? 'bg-apex-red text-white shadow-[0_0_12px_rgba(220,38,38,0.4)]'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter Row */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-white/5 flex-wrap">
          <span className="text-[11px] text-gray-500 font-mono uppercase mr-1">Status:</span>
          {[
            { id: 'all', label: 'All Statuses' },
            { id: 'live', label: 'Live Now' },
            { id: 'scheduled', label: 'Scheduled' },
            { id: 'expired', label: 'Expired' },
            { id: 'draft', label: 'Drafts' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Banners List Area */}
      {loading ? (
        <div className="p-12 text-center bg-[#0a0a0a] border border-white/5 rounded-3xl">
          <Loader2 className="w-8 h-8 text-apex-red animate-spin mx-auto mb-3" />
          <p className="text-xs font-mono uppercase tracking-widest text-gray-400">Loading banners...</p>
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="p-12 text-center bg-[#0a0a0a] border border-white/5 rounded-3xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-500">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold uppercase text-white tracking-wider">No Banners Found</h3>
            <p className="text-xs text-gray-400 mt-1">Get started by creating your first promotional campaign banner.</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Banner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredBanners.map((banner, index) => {
            const scheduleStatus = getScheduleStatus(banner);
            const positionObj = BANNER_POSITIONS.find((p) => p.id === (banner.position || 'middle')) || BANNER_POSITIONS[0];

            return (
              <div
                key={banner.id || index}
                className={`bg-[#0a0a0a] border rounded-3xl p-5 sm:p-6 transition-all duration-300 relative overflow-hidden ${
                  banner.is_active ? 'border-white/10 hover:border-apex-red/40' : 'border-white/5 opacity-60'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  {/* Left: Thumbnail & Content */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full lg:w-auto">
                    {/* Banner Graphic Thumbnail */}
                    <div className="w-full sm:w-48 h-24 bg-[#111] border border-white/10 rounded-2xl overflow-hidden shrink-0 relative group">
                      <img
                        src={banner.image_url || banner.desktop_image_url || '/banners/apex-campaign-banner.png'}
                        alt={banner.title || 'Banner'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = '/banners/apex-campaign-banner.png';
                        }}
                      />
                      {banner.mobile_image_url && (
                        <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-gray-300 text-[9px] px-1.5 py-0.5 rounded border border-white/10 font-mono">
                          + Mobile
                        </span>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-apex-red bg-apex-red/10 border border-apex-red/20 px-2 py-0.5 rounded-full font-bold">
                          Order #{banner.display_order || banner.sort_order || index + 1}
                        </span>

                        {/* Position Badge */}
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${positionObj.badgeClass || 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                          {positionObj.label}
                        </span>

                        {/* Dynamic Schedule Badge */}
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${scheduleStatus.color}`}>
                          {scheduleStatus.label}
                        </span>

                        {banner.badge_text && (
                          <span className="text-[10px] text-gray-300 bg-white/5 px-2 py-0.5 rounded border border-white/10 font-semibold">
                            {banner.badge_text}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-tight truncate max-w-xl">
                        {banner.title || 'Untitled Banner'}
                      </h3>

                      <p className="text-xs text-gray-400 line-clamp-1 max-w-xl">
                        {banner.subtitle || banner.description || 'No subtitle provided.'}
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-[11px] text-gray-500 font-mono flex-wrap">
                        <span>Link: <strong className="text-gray-300">{banner.button_text || 'SHOP NOW'}</strong> → {banner.button_url || '/shop'}</span>
                        {(banner.start_date || banner.end_date) && (
                          <span className="text-amber-400/90 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {banner.start_date ? new Date(banner.start_date).toLocaleDateString() : 'Now'} → {banner.end_date ? new Date(banner.end_date).toLocaleDateString() : 'Forever'}
                          </span>
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
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleMoveOrder(index, 1)}
                      disabled={index === filteredBanners.length - 1}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    {/* Responsive Live Preview Button */}
                    <button
                      onClick={() => handlePreview(banner)}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
                      title="Live Desktop & Mobile Preview"
                    >
                      <Eye className="w-4 h-4 text-apex-red" />
                      <span>Preview</span>
                    </button>

                    {/* Status Toggle */}
                    <button
                      onClick={() => handleToggleActive(banner)}
                      className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                        banner.is_active
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-gray-500/10 border-gray-500/20 text-gray-400 hover:bg-gray-500/20'
                      }`}
                      title={banner.is_active ? 'Disable Banner' : 'Enable Banner'}
                    >
                      {banner.is_active ? <CheckCircle2 className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEdit(banner)}
                      className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer"
                      title="Edit Banner"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                      title="Delete Banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT BANNER MODAL                                                   */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md" 
            onClick={() => !saving && setIsModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-3xl p-5 sm:p-8 max-h-[92vh] overflow-y-auto shadow-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-apex-red/10 border border-apex-red/30 text-apex-red flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase text-white tracking-tight">
                    {formData.id ? 'Edit Promotional Banner' : 'Create Promotional Banner'}
                  </h2>
                  <p className="text-xs text-gray-400">Configure banner positioning, campaign scheduling, media, and CTAs.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePreview(formData)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-apex-red" />
                  Preview
                </button>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="p-2 text-gray-400 hover:text-white cursor-pointer rounded-xl bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6 text-left text-xs">
              {/* Placement & Position Selector */}
              <div className="p-4 bg-[#111] border border-white/5 rounded-2xl space-y-3">
                <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  1. Placement & Position
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {BANNER_POSITIONS.map((pos) => {
                    const isSelected = (formData.position || 'middle') === pos.id;
                    return (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, position: pos.id }))}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-apex-red/15 border-apex-red text-white shadow-[0_0_15px_rgba(220,38,38,0.25)]'
                            : 'bg-[#0a0a0a] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <span className={`block font-bold text-xs uppercase mb-1 ${isSelected ? 'text-apex-red' : 'text-gray-300'}`}>
                          {pos.label}
                        </span>
                        <span className="text-[10px] text-gray-400 leading-tight block">
                          {pos.description}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {(formData.position || 'middle') === 'middle' && (
                  <div className="mt-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-left">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-300/90 leading-relaxed">
                      <strong>Homepage Category Banner:</strong> This promotional banner will appear directly at the bottom of the &quot;Shop by Category&quot; section on the storefront homepage.
                    </p>
                  </div>
                )}
              </div>

              {/* Media & Responsive Images */}
              <div className="p-4 bg-[#111] border border-white/5 rounded-2xl space-y-4">
                <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  2. Banner Media & Graphics
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Desktop Banner Image */}
                  <div className="space-y-2 p-3 bg-[#0a0a0a] border border-white/5 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5 text-gray-400" />
                        Desktop Banner Graphic (Wide 4:1)
                      </span>
                      {uploadingDesktop && <Loader2 className="w-3.5 h-3.5 text-apex-red animate-spin" />}
                    </div>

                    <input
                      type="text"
                      value={formData.image_url}
                      onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
                      placeholder="e.g. /banners/apex-campaign-banner.png or https://..."
                      className="w-full bg-[#141416] border border-white/10 rounded-xl px-3 py-2 text-white focus:border-apex-red outline-none"
                    />

                    <label className="btn-secondary py-2 rounded-xl text-center cursor-pointer flex items-center justify-center gap-1.5 border border-white/10 hover:border-white/30 text-[11px] font-bold">
                      <Upload className="w-3.5 h-3.5" />
                      Upload Desktop Banner
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleDesktopImageUpload(e.target.files?.[0])}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Mobile Banner Image */}
                  <div className="space-y-2 p-3 bg-[#0a0a0a] border border-white/5 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                        Mobile Banner Graphic (Optional)
                      </span>
                      {uploadingMobile && <Loader2 className="w-3.5 h-3.5 text-apex-red animate-spin" />}
                    </div>

                    <input
                      type="text"
                      value={formData.mobile_image_url}
                      onChange={(e) => setFormData((prev) => ({ ...prev, mobile_image_url: e.target.value }))}
                      placeholder="e.g. /banners/apex-campaign-mobile.png"
                      className="w-full bg-[#141416] border border-white/10 rounded-xl px-3 py-2 text-white focus:border-apex-red outline-none"
                    />

                    <label className="btn-secondary py-2 rounded-xl text-center cursor-pointer flex items-center justify-center gap-1.5 border border-white/10 hover:border-white/30 text-[11px] font-bold">
                      <Upload className="w-3.5 h-3.5" />
                      Upload Mobile Banner
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleMobileImageUpload(e.target.files?.[0])}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Darkening Overlay Opacity */}
                <div className="pt-1">
                  <label className="block font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Background Darkening Tint: <span className="text-white font-mono">{formData.overlay_opacity}%</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {[0, 20, 40, 60, 80].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, overlay_opacity: val }))}
                        className={`flex-1 py-1.5 rounded-lg font-mono text-xs font-bold transition-colors ${
                          formData.overlay_opacity === val
                            ? 'bg-apex-red text-white'
                            : 'bg-white/5 hover:bg-white/10 text-gray-400'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Copy & Content */}
              <div className="p-4 bg-[#111] border border-white/5 rounded-2xl space-y-4">
                <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-400" />
                  3. Copy & Badges
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      Main Banner Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. TECH FOR EVERY MOMENT"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-apex-red outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      Badge Pill (e.g. LIMITED OFFER)
                    </label>
                    <input
                      type="text"
                      value={formData.badge_text}
                      onChange={(e) => setFormData((prev) => ({ ...prev, badge_text: e.target.value }))}
                      placeholder="e.g. FLASH SALE, 40% OFF"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-apex-red outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Subtitle / Promotional Details
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="e.g. Upgrade your wireless gear with exclusive nationwide warranty."
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-apex-red outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={formData.button_text}
                      onChange={(e) => setFormData((prev) => ({ ...prev, button_text: e.target.value }))}
                      placeholder="e.g. SHOP NOW"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-apex-red outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      Destination Link
                    </label>
                    <input
                      type="text"
                      value={formData.button_url}
                      onChange={(e) => setFormData((prev) => ({ ...prev, button_url: e.target.value }))}
                      placeholder="e.g. /shop or /deals"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-apex-red outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Campaign Scheduling Window */}
              <div className="p-4 bg-[#111] border border-white/5 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    4. Campaign Scheduling Window
                  </h3>

                  {/* Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => applySchedulePreset('always')}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase text-gray-300"
                    >
                      Always Active
                    </button>
                    <button
                      type="button"
                      onClick={() => applySchedulePreset('24h')}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase text-amber-400"
                    >
                      24h Flash
                    </button>
                    <button
                      type="button"
                      onClick={() => applySchedulePreset('weekend')}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase text-emerald-400"
                    >
                      This Weekend
                    </button>
                    <button
                      type="button"
                      onClick={() => applySchedulePreset('7d')}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase text-blue-400"
                    >
                      7 Days
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      Start Date & Time (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.start_date || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-apex-red outline-none"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Leave empty to display immediately.</p>
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      End Date & Time (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.end_date || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-apex-red outline-none"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Leave empty to run without expiration.</p>
                  </div>
                </div>
              </div>

              {/* Settings (Order, New Tab, Active) */}
              <div className="p-4 bg-[#111] border border-white/5 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Display Sort Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.display_order}
                    onChange={(e) => setFormData((prev) => ({ ...prev, display_order: Number(e.target.value) }))}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2 text-white focus:border-apex-red outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer select-none pt-4 sm:pt-0">
                    <input
                      type="checkbox"
                      checked={formData.open_in_new_tab}
                      onChange={(e) => setFormData((prev) => ({ ...prev, open_in_new_tab: e.target.checked }))}
                      className="accent-apex-red w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="font-bold uppercase text-gray-300 text-xs">Open Link in New Tab</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer select-none pt-2 sm:pt-0">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                      className="accent-apex-red w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="font-bold uppercase text-white text-xs">Active on Storefront</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary px-8 py-3 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.4)] cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Banner...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {formData.id ? 'Update Banner' : 'Publish Banner'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESPONSIVE MULTI-DEVICE LIVE BANNER PREVIEW MODAL                         */}
      {/* ========================================================================= */}
      {isPreviewOpen && previewBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <div 
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setIsPreviewOpen(false)} 
          />

          <div className="relative z-10 w-full max-w-5xl bg-[#050505] border border-white/15 rounded-3xl p-4 sm:p-6 shadow-2xl overflow-hidden space-y-4 max-h-[95vh] flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-apex-red font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Banner Preview
                </span>
                <span className="text-gray-500 text-xs hidden sm:inline">•</span>
                <span className="text-xs text-gray-400 truncate max-w-xs">{previewBanner.title || 'Promotional Banner'}</span>
              </div>

              {/* Device Switcher */}
              <div className="flex items-center gap-1 bg-[#111] p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    previewDevice === 'desktop' ? 'bg-apex-red text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>

                <button
                  onClick={() => setPreviewDevice('tablet')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    previewDevice === 'tablet' ? 'bg-apex-red text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tablet</span>
                </button>

                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    previewDevice === 'mobile' ? 'bg-apex-red text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mobile (375px)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewAnimationKey((prev) => prev + 1)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  title="Replay banner enter animation"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Replay</span>
                </button>

                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-xl bg-white/5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Viewport Frame */}
            <div className="flex-1 overflow-y-auto flex items-center justify-center py-6 bg-[#080808] rounded-2xl border border-white/5">
              {/* Mobile Phone Mockup */}
              {previewDevice === 'mobile' ? (
                <div className="w-[375px] max-w-full bg-[#000] border-4 border-[#222] rounded-[44px] shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden relative p-3 text-left">
                  <div className="w-28 h-4 bg-[#1a1a1a] rounded-full mx-auto mb-3" />

                  {/* Banner inside phone */}
                  <motion.div
                    key={previewAnimationKey}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35 }}
                    className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#111]"
                  >
                    <img
                      src={previewBanner.mobile_image_url || previewBanner.image_url || '/banners/apex-campaign-banner.png'}
                      alt={previewBanner.title}
                      className="w-full h-auto block object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/banners/apex-campaign-banner.png';
                      }}
                    />

                    {/* Content Overlay if Title Exists */}
                    {previewBanner.title && (
                      <div 
                        className="absolute inset-0 flex flex-col justify-end p-4 text-left"
                        style={{ backgroundColor: `rgba(0,0,0,${(previewBanner.overlay_opacity || 40) / 100})` }}
                      >
                        {previewBanner.badge_text && (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-apex-red text-white text-[9px] font-bold uppercase w-fit mb-1">
                            {previewBanner.badge_text}
                          </span>
                        )}
                        <h4 className="text-white font-black text-sm uppercase leading-tight line-clamp-2">
                          {previewBanner.title}
                        </h4>
                        {previewBanner.subtitle && (
                          <p className="text-gray-300 text-[10px] line-clamp-1 mt-0.5">
                            {previewBanner.subtitle}
                          </p>
                        )}
                        <div className="mt-2">
                          <span className="btn-primary px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-block">
                            {previewBanner.button_text || 'SHOP NOW'}
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  <div className="w-32 h-1 bg-white/30 rounded-full mx-auto mt-4 mb-1" />
                </div>
              ) : (
                /* Desktop or Tablet Banner Frame */
                <div className={`transition-all duration-300 w-full ${previewDevice === 'tablet' ? 'max-w-2xl' : 'max-w-4xl'}`}>
                  <motion.div
                    key={previewAnimationKey}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="relative w-full rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-[#111]"
                  >
                    <img
                      src={previewBanner.image_url || '/banners/apex-campaign-banner.png'}
                      alt={previewBanner.title}
                      className="w-full h-auto block object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/banners/apex-campaign-banner.png';
                      }}
                    />

                    {/* Content Overlay if Title Exists */}
                    {previewBanner.title && (
                      <div 
                        className="absolute inset-0 flex flex-col justify-center px-8 sm:px-12 text-left"
                        style={{ backgroundColor: `rgba(0,0,0,${(previewBanner.overlay_opacity || 40) / 100})` }}
                      >
                        {previewBanner.badge_text && (
                          <span className="inline-block px-3 py-1 rounded-full bg-apex-red text-white text-[11px] font-bold uppercase w-fit mb-2">
                            {previewBanner.badge_text}
                          </span>
                        )}
                        <h3 className="text-white font-black text-xl sm:text-3xl uppercase tracking-tight max-w-lg leading-tight">
                          {previewBanner.title}
                        </h3>
                        {previewBanner.subtitle && (
                          <p className="text-gray-300 text-xs sm:text-sm max-w-md mt-1 leading-relaxed">
                            {previewBanner.subtitle}
                          </p>
                        )}
                        <div className="mt-4">
                          <span className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider inline-block">
                            {previewBanner.button_text || 'SHOP NOW'}
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </div>
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
