import React, { useState, useEffect, Component, useMemo } from 'react';
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
  Play, 
  Film
} from 'lucide-react';
import { motion } from 'framer-motion';
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
  autoplay_duration: 5500,
  animation_type: 'slide', // 'slide' | 'fade' | 'zoom' | 'kenburns'
  text_animation: 'fade_up', // 'fade_up' | 'stagger' | 'none'
  overlay_opacity: 40,
  start_date: '',
  end_date: '',
};

/**
 * Computes the real-time schedule status of a slide
 */
function getScheduleStatus(slide) {
  if (slide.is_active === false) {
    return { type: 'draft', label: 'Draft / Paused', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' };
  }

  const now = new Date();
  const hasStart = slide.start_date && !isNaN(new Date(slide.start_date).getTime());
  const hasEnd = slide.end_date && !isNaN(new Date(slide.end_date).getTime());

  if (hasEnd && new Date(slide.end_date) < now) {
    return { type: 'expired', label: 'Expired', color: 'bg-red-500/10 text-red-400 border-red-500/20' };
  }

  if (hasStart && new Date(slide.start_date) > now) {
    const startDateFormatted = new Date(slide.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return { type: 'scheduled', label: `Scheduled (${startDateFormatted})`, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
  }

  return { type: 'live', label: 'Live on Storefront', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
}

export default function AdminHeroSlider() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'live' | 'scheduled' | 'expired' | 'draft'

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewSlide, setPreviewSlide] = useState(null);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [previewAnimationKey, setPreviewAnimationKey] = useState(0);
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
      desktop_image_url: slide.desktop_image_url || slide.image_url || '',
      mobile_image_url: slide.mobile_image_url || '',
      features: Array.isArray(slide.features) ? slide.features.join(', ') : (slide.features || ''),
      promotional_badge: slide.promotional_badge || '',
      is_active: slide.is_active !== undefined ? slide.is_active : true,
      sort_order: slide.sort_order || 1,
      autoplay_duration: slide.autoplay_duration || 5500,
      animation_type: slide.animation_type || 'slide',
      text_animation: slide.text_animation || 'fade_up',
      overlay_opacity: slide.overlay_opacity !== undefined ? slide.overlay_opacity : 40,
      start_date: slide.start_date || '',
      end_date: slide.end_date || '',
    });
    setIsModalOpen(true);
  };

  const handlePreview = (slide) => {
    setPreviewSlide(slide);
    setPreviewDevice('desktop');
    setPreviewAnimationKey((prev) => prev + 1);
    setIsPreviewOpen(true);
  };

  const handleToggleStatus = async (slide) => {
    try {
      const newActive = !slide.is_active;
      await toggleHeroSlideStatus(slide.id, newActive);
      setSlides((prev) =>
        prev.map((s) => (String(s.id) === String(slide.id) ? { ...s, is_active: newActive } : s))
      );
      if (success) success(`Slide "${slide.title || 'Slide'}" is now ${newActive ? 'Active' : 'Draft'}.`);
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

  // Schedule Quick Preset Helpers
  const applySchedulePreset = (preset) => {
    const now = new Date();
    if (preset === 'always') {
      setFormData((prev) => ({ ...prev, start_date: '', end_date: '', is_active: true }));
      if (info) info('Slide set to run indefinitely.');
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
      if (info) info('Scheduled 24-hour flash campaign.');
    } else if (preset === '7d') {
      const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      setFormData((prev) => ({
        ...prev,
        start_date: formatForInput(now),
        end_date: formatForInput(end),
        is_active: true,
      }));
      if (info) info('Scheduled 7-day weekly campaign.');
    } else if (preset === 'weekend') {
      // Current or upcoming Friday 18:00 to Sunday 23:59
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
    if (!formData.title.trim()) {
      if (toastError) toastError('Headline title is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        features: formData.features
          ? formData.features.split(',').map((f) => f.trim()).filter(Boolean)
          : [],
      };

      await saveHeroSlide(payload);
      if (success) success(formData.id ? 'Hero slide updated successfully!' : 'New hero slide published!');
      setIsModalOpen(false);
      await loadSlides();
    } catch (err) {
      console.warn('Save hero slide error:', err);
      if (toastError) toastError(err.message || 'Failed to save slide.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter slides
  const filteredSlides = useMemo(() => {
    return slides.filter((slide) => {
      // Search text match
      const query = searchTerm.toLowerCase();
      const titleMatch = (slide.title || '').toLowerCase().includes(query);
      const highlightMatch = (slide.highlight_text || '').toLowerCase().includes(query);
      const descMatch = (slide.description || '').toLowerCase().includes(query);
      const badgeMatch = (slide.badge || '').toLowerCase().includes(query);
      const matchesSearch = !searchTerm || titleMatch || highlightMatch || descMatch || badgeMatch;

      if (!matchesSearch) return false;

      // Status Filter
      if (statusFilter === 'all') return true;
      const status = getScheduleStatus(slide).type;
      return status === statusFilter;
    });
  }, [slides, searchTerm, statusFilter]);

  return (
    <AdminErrorBoundary>
      <div className="space-y-6 text-left max-w-7xl mx-auto pb-16">
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
              Manage the homepage hero carousel, mobile previews, campaign scheduling windows, and animation presets.
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

        {/* Filter / Search Bar with Status Tabs */}
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

          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
            {[
              { id: 'all', label: 'All Slides' },
              { id: 'live', label: 'Live Now' },
              { id: 'scheduled', label: 'Scheduled' },
              { id: 'expired', label: 'Expired' },
              { id: 'draft', label: 'Drafts' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-apex-red text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {tab.label}
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
              <p className="text-xs text-gray-400 mt-1">Get started by creating your first homepage hero slide or clear filters.</p>
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
              const scheduleStatus = getScheduleStatus(slide);

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
                      <div className="w-full sm:w-40 h-28 bg-[#111] border border-white/10 rounded-2xl overflow-hidden shrink-0 relative group">
                        <img
                          src={slide.desktop_image_url || slide.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&fit=crop'}
                          alt={slide.title}
                          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                        />
                        {slide.promotional_badge && (
                          <span className="absolute top-2 left-2 bg-apex-red text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow">
                            {slide.promotional_badge}
                          </span>
                        )}
                        {slide.mobile_image_url && (
                          <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-gray-300 text-[9px] px-1.5 py-0.5 rounded border border-white/10 font-mono">
                            + Mobile Image
                          </span>
                        )}
                      </div>

                      {/* Content Info */}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-apex-red bg-apex-red/10 border border-apex-red/20 px-2 py-0.5 rounded-full font-bold">
                            Order #{slide.sort_order || index + 1}
                          </span>

                          {/* Dynamic Schedule Badge */}
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${scheduleStatus.color}`}>
                            {scheduleStatus.label}
                          </span>

                          {/* Animation Preset Badge */}
                          <span className="text-[10px] text-zinc-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full font-mono uppercase">
                            Transition: {slide.animation_type || 'slide'}
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

                        <div className="flex items-center gap-3 pt-1 text-[11px] text-gray-500 font-mono flex-wrap">
                          <span>CTA: <strong className="text-gray-300">{slide.primary_button_text}</strong> → {slide.primary_button_link}</span>
                          {slide.autoplay_duration && (
                            <span>• Autoplay: {(slide.autoplay_duration / 1000).toFixed(1)}s</span>
                          )}
                          {(slide.start_date || slide.end_date) && (
                            <span className="text-amber-400/90 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {slide.start_date ? new Date(slide.start_date).toLocaleDateString() : 'Now'} → {slide.end_date ? new Date(slide.end_date).toLocaleDateString() : 'Forever'}
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
                        disabled={index === filteredSlides.length - 1}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      {/* Responsive Live Preview Button */}
                      <button
                        onClick={() => handlePreview(slide)}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
                        title="Live Mobile & Desktop Preview"
                      >
                        <Eye className="w-4 h-4 text-apex-red" />
                        <span>Preview</span>
                      </button>

                      {/* Status Toggle */}
                      <button
                        onClick={() => handleToggleStatus(slide)}
                        className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
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
                        className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer"
                        title="Edit Slide"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      {deleteConfirmId === slide.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(slide.id)}
                            className="px-3 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="p-2 text-gray-400 hover:text-white cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(slide.id)}
                          className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
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

        {/* ========================================================================= */}
        {/* ADD / EDIT SLIDE MODAL (With Scheduling & Animation Controls)             */}
        {/* ========================================================================= */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-md" 
              onClick={() => !submitting && setIsModalOpen(false)}
            />

            <div className="relative z-10 w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-3xl p-5 sm:p-8 max-h-[92vh] overflow-y-auto shadow-2xl space-y-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-apex-red/10 border border-apex-red/30 text-apex-red flex items-center justify-center">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase text-white tracking-tight">
                      {formData.id ? 'Edit Hero Slide' : 'Create New Hero Slide'}
                    </h2>
                    <p className="text-xs text-gray-400">Configure slide media, typography, scheduling window, and animations.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Instant Live Preview from Modal */}
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
                    disabled={submitting}
                    className="p-2 text-gray-400 hover:text-white cursor-pointer rounded-xl bg-white/5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="space-y-6 text-left text-xs">
                {/* Section 1: Headline & Badge */}
                <div className="p-4 bg-[#111] border border-white/5 rounded-2xl space-y-4">
                  <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-apex-red" />
                    1. Headline & Copy
                  </h3>

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
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-apex-red outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold uppercase tracking-wider text-apex-red mb-1.5">
                        Highlighted Keyword (Red Glow)
                      </label>
                      <input
                        type="text"
                        value={formData.highlight_text}
                        onChange={(e) => setFormData({ ...formData, highlight_text: e.target.value })}
                        placeholder="e.g. LIMITS."
                        className="w-full bg-[#0a0a0a] border border-apex-red/30 rounded-xl px-4 py-2.5 text-white focus:border-apex-red outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        Eyebrow Badge (Small Tag)
                      </label>
                      <input
                        type="text"
                        value={formData.badge}
                        onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                        placeholder="e.g. PREMIUM TECH. PREMIUM YOU."
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-apex-red outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        Corner Promo Badge (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.promotional_badge}
                        onChange={(e) => setFormData({ ...formData, promotional_badge: e.target.value })}
                        placeholder="e.g. FLAGSHIP, NEW ARRIVAL, 50% OFF"
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-apex-red outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      Description Subtitle
                    </label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Short description highlighting the flagship features..."
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-apex-red outline-none leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      Bullet Feature Highlights (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.features}
                      onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                      placeholder="e.g. 100% Original, Free Delivery, 7 Days Return, 24/7 Support"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-apex-red outline-none"
                    />
                  </div>
                </div>

                {/* Section 2: Media & Mobile-Specific Graphic */}
                <div className="p-4 bg-[#111] border border-white/5 rounded-2xl space-y-4">
                  <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-blue-400" />
                    2. Media & Responsive Graphics
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Desktop Graphic */}
                    <div className="space-y-2 p-3 bg-[#0a0a0a] border border-white/5 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                          <Monitor className="w-3.5 h-3.5 text-gray-400" />
                          Desktop Graphic (16:9)
                        </span>
                        {uploadingDesktop && <Loader2 className="w-3.5 h-3.5 text-apex-red animate-spin" />}
                      </div>

                      <input
                        type="text"
                        value={formData.desktop_image_url}
                        onChange={(e) => setFormData({ ...formData, desktop_image_url: e.target.value })}
                        placeholder="Image URL https://..."
                        className="w-full bg-[#141416] border border-white/10 rounded-xl px-3 py-2 text-white focus:border-apex-red outline-none"
                      />

                      <label className="btn-secondary py-2 rounded-xl text-center cursor-pointer flex items-center justify-center gap-1.5 border border-white/10 hover:border-white/30 text-[11px] font-bold">
                        <Upload className="w-3.5 h-3.5" />
                        Upload Desktop Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleDesktopImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Mobile Graphic */}
                    <div className="space-y-2 p-3 bg-[#0a0a0a] border border-white/5 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                          Mobile Graphic (Optional)
                        </span>
                        {uploadingMobile && <Loader2 className="w-3.5 h-3.5 text-apex-red animate-spin" />}
                      </div>

                      <input
                        type="text"
                        value={formData.mobile_image_url}
                        onChange={(e) => setFormData({ ...formData, mobile_image_url: e.target.value })}
                        placeholder="Optional Mobile Image URL"
                        className="w-full bg-[#141416] border border-white/10 rounded-xl px-3 py-2 text-white focus:border-apex-red outline-none"
                      />

                      <label className="btn-secondary py-2 rounded-xl text-center cursor-pointer flex items-center justify-center gap-1.5 border border-white/10 hover:border-white/30 text-[11px] font-bold">
                        <Upload className="w-3.5 h-3.5" />
                        Upload Mobile Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleMobileImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Darkening Overlay Opacity */}
                  <div className="pt-2">
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

                {/* Section 3: Campaign Scheduling Window */}
                <div className="p-4 bg-[#111] border border-white/5 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      3. Campaign Scheduling Window
                    </h3>

                    {/* Quick Presets */}
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
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-apex-red outline-none"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">Leave empty to activate immediately.</p>
                    </div>

                    <div>
                      <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        End Date & Time (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.end_date || ''}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-apex-red outline-none"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">Leave empty to keep running forever.</p>
                    </div>
                  </div>
                </div>

                {/* Section 4: Animation & Timing Controls */}
                <div className="p-4 bg-[#111] border border-white/5 rounded-2xl space-y-4">
                  <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Film className="w-4 h-4 text-purple-400" />
                    4. Animation & Autoplay Controls
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        Transition Animation
                      </label>
                      <select
                        value={formData.animation_type || 'slide'}
                        onChange={(e) => setFormData({ ...formData, animation_type: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-apex-red outline-none"
                      >
                        <option value="slide">Slide (Horizontal Sweep)</option>
                        <option value="fade">Fade (Cinematic Dissolve)</option>
                        <option value="zoom">Zoom (Depth Zoom)</option>
                        <option value="kenburns">Ken Burns (Ambient Pan)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        Autoplay Duration
                      </label>
                      <select
                        value={formData.autoplay_duration || 5500}
                        onChange={(e) => setFormData({ ...formData, autoplay_duration: Number(e.target.value) })}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-apex-red outline-none"
                      >
                        <option value={3000}>3.0s (Fast Flash Sale)</option>
                        <option value={5500}>5.5s (Standard Recommended)</option>
                        <option value={8000}>8.0s (Relaxed Showcase)</option>
                        <option value={10000}>10.0s (Long Reading)</option>
                        <option value={0}>Manual Only (No Autoplay)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        Display Sort Order
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formData.sort_order}
                        onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-apex-red outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 5: CTA Action Buttons */}
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

                {/* Active Checkbox */}
                <div className="p-3 bg-[#111] border border-white/5 rounded-2xl flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="accent-apex-red w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="font-bold uppercase text-white text-xs">Enable Slide on Storefront</span>
                  </label>
                  <span className="text-[11px] text-gray-500">Uncheck to keep as a draft without deleting.</span>
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

        {/* ========================================================================= */}
        {/* RESPONSIVE MULTI-DEVICE LIVE PREVIEW MODAL                                */}
        {/* ========================================================================= */}
        {isPreviewOpen && previewSlide && (
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
                    Responsive Preview
                  </span>
                  <span className="text-gray-500 text-xs hidden sm:inline">•</span>
                  <span className="text-xs text-gray-400 truncate max-w-xs">{previewSlide.title}</span>
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
                  {/* Re-play Animation Button */}
                  <button
                    onClick={() => setPreviewAnimationKey((prev) => prev + 1)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    title="Re-play animation"
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Replay Animation</span>
                  </button>

                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="p-2 text-gray-400 hover:text-white rounded-xl bg-white/5 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Viewport Frame Container */}
              <div className="flex-1 overflow-y-auto flex items-center justify-center py-4 bg-[#080808] rounded-2xl border border-white/5">
                {/* 1. Mobile Phone Simulation Frame (375px) */}
                {previewDevice === 'mobile' ? (
                  <div className="w-[375px] max-w-full bg-[#000] border-4 border-[#222] rounded-[44px] shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden relative p-3 text-left">
                    {/* Phone Notch / Island */}
                    <div className="w-28 h-4 bg-[#1a1a1a] rounded-full mx-auto mb-3" />

                    {/* Mobile Slide Container */}
                    <motion.div
                      key={previewAnimationKey}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className="relative min-h-[480px] bg-[#0c0c0e] rounded-3xl p-5 flex flex-col justify-between overflow-hidden border border-white/10"
                    >
                      {/* Optional Overlay Tint */}
                      <div 
                        className="absolute inset-0 bg-black pointer-events-none" 
                        style={{ opacity: (previewSlide.overlay_opacity || 40) / 100 }}
                      />

                      {/* Content */}
                      <div className="relative z-10 space-y-3">
                        {previewSlide.badge && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-apex-red/15 border border-apex-red/30 text-apex-red text-[9px] font-bold uppercase tracking-wider">
                            {previewSlide.badge}
                          </span>
                        )}

                        <h2 className="text-2xl font-black uppercase text-white leading-tight">
                          {previewSlide.title}{' '}
                          {previewSlide.highlight_text && (
                            <span className="text-apex-red">{previewSlide.highlight_text}</span>
                          )}
                        </h2>

                        <p className="text-[11px] text-gray-400 line-clamp-3 leading-relaxed">
                          {previewSlide.description}
                        </p>
                      </div>

                      {/* Product Image (Uses Mobile Graphic if Available) */}
                      <div className="relative z-10 my-4 flex items-center justify-center h-44">
                        <img
                          src={previewSlide.mobile_image_url || previewSlide.desktop_image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&fit=crop'}
                          alt={previewSlide.title}
                          className="max-h-full object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]"
                        />
                      </div>

                      {/* Buttons */}
                      <div className="relative z-10 space-y-2 pt-2">
                        <span className="btn-primary w-full py-2.5 rounded-xl text-center text-xs font-bold uppercase tracking-wider block">
                          {previewSlide.primary_button_text || 'SHOP NOW'}
                        </span>
                        {previewSlide.secondary_button_text && (
                          <span className="w-full py-2.5 rounded-xl text-center text-xs font-bold uppercase tracking-wider block bg-white/5 border border-white/15 text-gray-300">
                            {previewSlide.secondary_button_text}
                          </span>
                        )}
                      </div>
                    </motion.div>

                    {/* Phone Home Bar */}
                    <div className="w-32 h-1 bg-white/30 rounded-full mx-auto mt-4 mb-1" />
                  </div>
                ) : (
                  /* 2. Desktop or Tablet Frame */
                  <div className={`transition-all duration-300 w-full ${previewDevice === 'tablet' ? 'max-w-2xl' : 'max-w-4xl'}`}>
                    <motion.div
                      key={previewAnimationKey}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45 }}
                      className="relative min-h-[400px] flex items-center bg-[#070707] border border-white/10 rounded-3xl p-8 sm:p-12 overflow-hidden text-left"
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-apex-red/20 blur-[120px] rounded-full pointer-events-none" />

                      {/* Optional Overlay Tint */}
                      <div 
                        className="absolute inset-0 bg-black pointer-events-none" 
                        style={{ opacity: (previewSlide.overlay_opacity || 40) / 100 }}
                      />

                      <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
                        <div className="w-full lg:w-1/2 text-left space-y-4">
                          {previewSlide.badge && (
                            <span className="inline-block px-3 py-1 rounded-full bg-apex-red/15 border border-apex-red/30 text-apex-red text-xs font-bold uppercase tracking-wider">
                              {previewSlide.badge}
                            </span>
                          )}

                          <h2 className="text-3xl sm:text-4xl font-black uppercase text-white leading-tight">
                            {previewSlide.title}{' '}
                            {previewSlide.highlight_text && (
                              <span className="text-apex-red">{previewSlide.highlight_text}</span>
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
                              <span className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider border border-white/20 bg-white/5 text-gray-300">
                                {previewSlide.secondary_button_text}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="w-full lg:w-1/2 flex items-center justify-center h-64 sm:h-72">
                          <img
                            src={previewSlide.desktop_image_url || previewSlide.image_url}
                            alt={previewSlide.title}
                            className="max-h-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)]"
                          />
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminErrorBoundary>
  );
}
