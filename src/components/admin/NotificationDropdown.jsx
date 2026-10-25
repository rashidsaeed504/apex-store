import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ShoppingBag,
  RotateCcw,
  AlertTriangle,
  Star,
  User,
  Volume2,
  VolumeX,
  X,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useAdminNotifications } from '../../context/AdminNotificationContext';
import { formatRelativeTime } from '../../utils/helpers';

// Helper to resolve icon & color accent based on notification type
export function getNotificationBadge(type) {
  switch (type) {
    case 'new_order':
      return {
        icon: ShoppingBag,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        label: 'Order',
      };
    case 'return_request':
      return {
        icon: RotateCcw,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/30',
        label: 'Return',
      };
    case 'low_stock':
      return {
        icon: AlertTriangle,
        color: 'text-orange-400',
        bg: 'bg-orange-500/10 border-orange-500/30',
        label: 'Inventory',
      };
    case 'new_review':
      return {
        icon: Star,
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10 border-yellow-500/30',
        label: 'Review',
      };
    case 'new_user':
      return {
        icon: User,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10 border-blue-500/30',
        label: 'Customer',
      };
    default:
      return {
        icon: Bell,
        color: 'text-gray-400',
        bg: 'bg-gray-500/10 border-gray-500/30',
        label: 'Notice',
      };
  }
}

// Helper to determine destination route by ref_table
export function getNotificationDestination(notification) {
  const { ref_table, ref_id } = notification || {};
  const queryParam = ref_id ? `?search=${encodeURIComponent(ref_id)}` : '';

  switch (ref_table) {
    case 'orders':
      return `/admin/orders${queryParam}`;
    case 'returns':
      return `/admin/returns${queryParam}`;
    case 'products':
      return `/admin/products${queryParam}`;
    case 'reviews':
      return `/admin/reviews`;
    case 'customers':
      return `/admin/customers${queryParam}`;
    default:
      return '/admin/notifications';
  }
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    isSoundEnabled,
    toggleSound,
    markAsRead,
    markAllAsRead,
  } = useAdminNotifications();

  // Close dropdown on outside click or escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const latest20 = notifications.slice(0, 20);

  const handleItemClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);
    const dest = getNotificationDestination(notification);
    navigate(dest);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors focus:outline-none cursor-pointer flex items-center justify-center min-h-[44px] min-w-[44px]"
        aria-label={`Admin notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />

        {/* Red Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-apex-red text-white text-[10px] font-black font-mono min-w-[18px] h-4.5 px-1 rounded-full flex items-center justify-center border-2 border-[#0a0a0a] shadow-[0_0_8px_rgba(220,38,38,0.7)] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Backdrop overlay for mobile bottom sheet */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Notification Panel: Dropdown on desktop, Bottom Sheet on mobile */}
      {isOpen && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 w-full md:w-96 max-h-[85vh] md:max-h-[540px] bg-[#0d0d0d] border-t md:border border-white/10 rounded-t-3xl md:rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden backdrop-blur-2xl"
          role="region"
          aria-label="Notifications Panel"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#111] shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-apex-red text-white px-2 py-0.5 rounded-full font-bold font-mono">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                title={isSoundEnabled ? 'Mute notification sound' : 'Enable notification sound'}
                aria-label={isSoundEnabled ? 'Mute notification sound' : 'Enable notification sound'}
              >
                {isSoundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {/* Mark All Read */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-semibold text-apex-red hover:underline flex items-center gap-1 cursor-pointer px-1 py-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}

              {/* Close button on mobile */}
              <button
                onClick={() => setIsOpen(false)}
                className="md:hidden p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer ml-1"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List (scrollable) */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5 select-none">
            {latest20.length === 0 ? (
              <div className="p-8 text-center text-gray-500 space-y-2">
                <Bell className="w-8 h-8 mx-auto opacity-30 text-gray-400" />
                <p className="text-xs uppercase tracking-wider font-bold text-gray-400">
                  No notifications yet
                </p>
                <p className="text-[11px] text-gray-500">
                  Orders, return requests, and alerts will appear here in real time.
                </p>
              </div>
            ) : (
              latest20.map((item) => {
                const badge = getNotificationBadge(item.type);
                const Icon = badge.icon;
                const isUnread = !item.is_read;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-3.5 sm:p-4 flex items-start gap-3 transition-colors cursor-pointer group ${
                      isUnread
                        ? 'bg-apex-red/[0.04] hover:bg-apex-red/[0.08]'
                        : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    {/* Type Icon Badge */}
                    <div
                      className={`w-8 h-8 rounded-xl border ${badge.bg} flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform`}
                    >
                      <Icon className={`w-4 h-4 ${badge.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h4
                          className={`text-xs font-bold truncate ${
                            isUnread ? 'text-white' : 'text-gray-300'
                          }`}
                        >
                          {item.title}
                        </h4>
                        {/* Red Dot if unread */}
                        {isUnread && (
                          <span
                            className="w-2 h-2 rounded-full bg-apex-red shrink-0 shadow-[0_0_6px_rgba(220,38,38,0.8)]"
                            title="Unread"
                          />
                        )}
                      </div>

                      {item.message && (
                        <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed mb-1">
                          {item.message}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-gray-500">
                          {formatRelativeTime(item.created_at)}
                        </span>
                        <span className="text-[10px] text-apex-red font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                          View details <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer View All Action */}
          <div className="p-3 bg-[#111] border-t border-white/10 shrink-0">
            <Link
              to="/admin/notifications"
              onClick={() => setIsOpen(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-center text-xs font-bold uppercase tracking-wider text-white transition-all flex items-center justify-center gap-1.5 group min-h-[44px]"
            >
              <span>View All Notifications</span>
              <ExternalLink className="w-3.5 h-3.5 text-apex-red group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
