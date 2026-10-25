import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useAdminNotifications } from '../../context/AdminNotificationContext';
import {
  getNotificationBadge,
  getNotificationDestination,
} from './NotificationDropdown';
import { formatRelativeTime } from '../../utils/helpers';

export default function DashboardUnreadNotifications() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useAdminNotifications();

  const unreadList = notifications.filter((n) => !n.is_read);

  const handleView = async (item) => {
    await markAsRead(item.id);
    const dest = getNotificationDestination(item);
    navigate(dest);
  };

  if (unreadList.length === 0) {
    return (
      <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              All Caught Up
            </p>
            <p className="text-[11px] text-gray-400">
              No pending unread orders, return requests, or inventory alerts.
            </p>
          </div>
        </div>

        <Link
          to="/admin/notifications"
          className="text-xs font-semibold text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 shrink-0 px-2 py-1"
        >
          <span>History</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#0f0a0a] border border-apex-red/30 rounded-2xl p-4 sm:p-6 shadow-[0_0_30px_rgba(220,38,38,0.08)] relative overflow-hidden">
      {/* Subtle Ambient Red Spotlight */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-apex-red/10 blur-[80px] rounded-full pointer-events-none" />

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-apex-red text-white flex items-center justify-center shadow-[0_0_12px_rgba(220,38,38,0.5)] shrink-0">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                Pending Attention
              </h3>
              <span className="text-[10px] font-mono font-bold bg-apex-red text-white px-2 py-0.5 rounded-full">
                {unreadCount} UNREAD
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              New events waiting for administrator review and processing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>

          <Link
            to="/admin/notifications"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-apex-red hover:underline"
          >
            <span>View All</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Unread Items List */}
      <div className="space-y-2.5 relative z-10">
        {unreadList.slice(0, 6).map((item) => {
          const badge = getNotificationBadge(item.type);
          const Icon = badge.icon;

          return (
            <div
              key={item.id}
              className="bg-[#141010] hover:bg-[#191212] border border-white/10 hover:border-apex-red/40 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors group"
            >
              {/* Info */}
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={`w-8 h-8 rounded-lg border ${badge.bg} flex items-center justify-center shrink-0 mt-0.5`}
                >
                  <Icon className={`w-4 h-4 ${badge.color}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${badge.bg} ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                      {item.title}
                    </h4>
                    <span className="w-1.5 h-1.5 rounded-full bg-apex-red shadow-[0_0_6px_rgba(220,38,38,0.8)]" />
                  </div>

                  {item.message && (
                    <p className="text-xs text-gray-300 line-clamp-1">
                      {item.message}
                    </p>
                  )}
                  <span className="text-[10px] font-mono text-gray-500 mt-0.5 block">
                    {formatRelativeTime(item.created_at)}
                  </span>
                </div>
              </div>

              {/* View Action Button */}
              <div className="flex items-center justify-end shrink-0">
                <button
                  onClick={() => handleView(item)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-apex-red hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(220,38,38,0.35)] transition-all min-h-[40px] cursor-pointer"
                >
                  <span>View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {unreadList.length > 6 && (
        <div className="text-center pt-3 border-t border-white/5 mt-3 relative z-10">
          <Link
            to="/admin/notifications"
            className="text-xs font-bold text-apex-red hover:underline"
          >
            + {unreadList.length - 6} more unread notifications in Center →
          </Link>
        </div>
      )}
    </div>
  );
}
