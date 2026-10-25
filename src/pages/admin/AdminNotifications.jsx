import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  CheckCircle,
  Filter,
  ShoppingBag,
  RotateCcw,
  AlertTriangle,
  Star,
  User,
  Volume2,
  VolumeX,
  ArrowRight,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useAdminNotifications } from '../../context/AdminNotificationContext';
import {
  getNotificationBadge,
  getNotificationDestination,
} from '../../components/admin/NotificationDropdown';
import { formatRelativeTime } from '../../utils/helpers';

const TYPE_FILTERS = [
  { id: 'all', label: 'All Notifications', icon: Bell },
  { id: 'new_order', label: 'Orders', icon: ShoppingBag },
  { id: 'return_request', label: 'Returns', icon: RotateCcw },
  { id: 'low_stock', label: 'Stock Alerts', icon: AlertTriangle },
  { id: 'new_review', label: 'Reviews', icon: Star },
  { id: 'new_user', label: 'Customers', icon: User },
];

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    isSoundEnabled,
    toggleSound,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useAdminNotifications();

  // Filtered notifications list
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (unreadOnly && item.is_read) return false;
      if (selectedType !== 'all' && item.type !== selectedType) return false;
      return true;
    });
  }, [notifications, selectedType, unreadOnly]);

  const handleItemClick = async (item) => {
    if (!item.is_read) {
      await markAsRead(item.id);
    }
    const dest = getNotificationDestination(item);
    navigate(dest);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-apex-red/10 border border-apex-red/30 flex items-center justify-center text-apex-red">
              <Bell className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
              Notification <span className="text-apex-red">Center</span>
            </h1>
            {unreadCount > 0 && (
              <span className="text-xs font-mono font-bold bg-apex-red text-white px-2 py-0.5 rounded-full ml-2">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-400">
            Real-time activity feed for orders, returns, customer actions, and inventory alerts.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={toggleSound}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider transition-colors min-h-[44px] cursor-pointer"
            aria-label={isSoundEnabled ? 'Mute notification sound' : 'Enable notification sound'}
          >
            {isSoundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Sound On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-gray-500" />
                <span>Muted</span>
              </>
            )}
          </button>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-apex-red/15 hover:bg-apex-red/25 text-apex-red border border-apex-red/30 text-xs font-bold uppercase tracking-wider transition-colors min-h-[44px] cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0a0a0a] border border-white/5 p-3 rounded-2xl">
        {/* Type Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {TYPE_FILTERS.map((f) => {
            const Icon = f.icon;
            const isActive = selectedType === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setSelectedType(f.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap min-h-[40px] cursor-pointer ${
                  isActive
                    ? 'bg-apex-red text-white shadow-[0_0_15px_rgba(220,38,38,0.35)]'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>

        {/* Unread Only Toggle */}
        <div className="flex items-center gap-2 sm:border-l sm:border-white/10 sm:pl-4 shrink-0">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-300 cursor-pointer min-h-[40px]">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="w-4 h-4 rounded bg-[#111] border-white/20 text-apex-red focus:ring-apex-red focus:ring-offset-0 cursor-pointer"
            />
            <span>Unread Only</span>
          </label>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className="p-4 bg-[#0a0a0a] border border-white/5 rounded-2xl animate-pulse flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5" />
                <div className="space-y-2">
                  <div className="h-4 w-48 bg-white/5 rounded" />
                  <div className="h-3 w-72 bg-white/5 rounded" />
                </div>
              </div>
              <div className="h-4 w-16 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="p-12 text-center bg-[#0a0a0a] border border-white/5 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold uppercase tracking-wider text-white">
            No Notifications Found
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {unreadOnly
              ? 'You have caught up with all incoming notifications! Turn off the unread filter to see past events.'
              : 'There are no recorded notifications matching this criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((item) => {
            const badge = getNotificationBadge(item.type);
            const Icon = badge.icon;
            const isUnread = !item.is_read;

            return (
              <div
                key={item.id}
                className={`group p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isUnread
                    ? 'bg-[#0f0a0a] border-apex-red/30 hover:border-apex-red/60 shadow-[0_0_20px_rgba(220,38,38,0.06)]'
                    : 'bg-[#0a0a0a] border-white/5 hover:border-white/15'
                }`}
              >
                {/* Left: Icon + Text */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 rounded-xl border ${badge.bg} flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    <Icon className={`w-5 h-5 ${badge.color}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.bg} ${badge.color}`}
                      >
                        {badge.label}
                      </span>

                      <h3
                        className={`text-sm font-bold truncate ${
                          isUnread ? 'text-white' : 'text-gray-300'
                        }`}
                      >
                        {item.title}
                      </h3>

                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-apex-red shadow-[0_0_8px_rgba(220,38,38,0.9)] shrink-0" />
                      )}
                    </div>

                    {item.message && (
                      <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                        {item.message}
                      </p>
                    )}

                    <span className="text-[10px] font-mono text-gray-500 mt-1 inline-block">
                      {formatRelativeTime(item.created_at)}
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t border-white/5 sm:border-0 shrink-0">
                  {/* Mark as read toggle */}
                  {isUnread && (
                    <button
                      onClick={() => markAsRead(item.id)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors min-h-[44px] cursor-pointer"
                      title="Mark as read"
                    >
                      Mark Read
                    </button>
                  )}

                  {/* View Details Target Navigation */}
                  <button
                    onClick={() => handleItemClick(item)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-apex-red hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all min-h-[44px] cursor-pointer"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Notification Button */}
                  <button
                    onClick={() => deleteNotification(item.id)}
                    className="p-2.5 text-gray-500 hover:text-red-400 rounded-xl hover:bg-red-500/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                    title="Delete notification"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
