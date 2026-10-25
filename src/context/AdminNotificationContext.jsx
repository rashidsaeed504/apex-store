import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  fetchAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  deleteAdminNotification as apiDeleteNotification
} from '../services/api';
import { playNotificationChime } from '../utils/notificationSound';
import { useToast } from './ToastContext';

const AdminNotificationContext = createContext(null);

export function AdminNotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem('apex_admin_sound_muted') !== 'true';
    } catch (e) {
      return true;
    }
  });

  const { info, success } = useToast();

  const toggleSound = useCallback(() => {
    setIsSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('apex_admin_sound_muted', String(!next));
      } catch (e) {}
      if (next) {
        playNotificationChime();
        if (info) info('Notification sound enabled');
      } else {
        if (info) info('Notification sound muted');
      }
      return next;
    });
  }, [info]);

  // Load initial notifications from database / storage
  const loadNotifications = useCallback(async () => {
    try {
      const data = await fetchAdminNotifications(100);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load admin notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Real-time Supabase Subscription
  useEffect(() => {
    let channel = null;

    if (isSupabaseConfigured) {
      try {
        channel = supabase
          .channel('realtime:admin_notifications')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'admin_notifications' },
            (payload) => {
              const newNotification = payload.new;
              if (!newNotification) return;

              // 1. Add to top of notification list
              setNotifications((prev) => {
                if (prev.some((n) => n.id === newNotification.id)) return prev;
                return [newNotification, ...prev];
              });

              // 2. Play subtle chime if sound enabled
              if (isSoundEnabled) {
                playNotificationChime();
              }

              // 3. Show admin toast
              if (info) {
                info(newNotification.title || 'New Admin Notification');
              }
            }
          )
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'admin_notifications' },
            (payload) => {
              const updated = payload.new;
              if (!updated) return;
              setNotifications((prev) =>
                prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n))
              );
            }
          )
          .on(
            'postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'admin_notifications' },
            (payload) => {
              const deletedId = payload.old?.id;
              if (!deletedId) return;
              setNotifications((prev) => prev.filter((n) => n.id !== deletedId));
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Supabase Realtime subscription error:', err);
      }
    }

    // Local custom event listener for simulation & testing
    const handleLocalEvent = (e) => {
      const item = e.detail;
      if (!item) return;
      setNotifications((prev) => [item, ...prev]);
      if (isSoundEnabled) playNotificationChime();
      if (info) info(item.title || 'New notification');
    };

    window.addEventListener('apex_local_notification', handleLocalEvent);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('apex_local_notification', handleLocalEvent);
    };
  }, [isSoundEnabled, info]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (String(n.id) === String(id) ? { ...n, is_read: true } : n))
    );
    try {
      await markAdminNotificationRead(id);
    } catch (err) {
      console.warn('Failed to mark notification read:', err);
    }
  }, []);

  // Mark all unread notifications as read
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await markAllAdminNotificationsRead();
      if (success) success('All notifications marked as read.');
    } catch (err) {
      console.warn('Failed to mark all notifications read:', err);
    }
  }, [success]);

  // Delete notification
  const deleteNotification = useCallback(async (id) => {
    setNotifications((prev) => prev.filter((n) => String(n.id) !== String(id)));
    try {
      await apiDeleteNotification(id);
    } catch (err) {
      console.warn('Failed to delete notification:', err);
    }
  }, []);

  // Compute unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      isSoundEnabled,
      toggleSound,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      refetch: loadNotifications,
    }),
    [
      notifications,
      unreadCount,
      loading,
      isSoundEnabled,
      toggleSound,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      loadNotifications,
    ]
  );

  return (
    <AdminNotificationContext.Provider value={value}>
      {children}
    </AdminNotificationContext.Provider>
  );
}

export function useAdminNotifications() {
  const context = useContext(AdminNotificationContext);
  if (!context) {
    throw new Error('useAdminNotifications must be used within an AdminNotificationProvider');
  }
  return context;
}
