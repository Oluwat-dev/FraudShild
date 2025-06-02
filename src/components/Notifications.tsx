import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, ArrowDownLeft } from 'lucide-react';

interface Notification {
  id: string;
  amount: number;
  sender_email: string;
  created_at: string;
  read: boolean;
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>;

    async function fetchNotifications() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch recent P2P transfers where the current user is the recipient
        const { data: transfers } = await supabase
          .from('transactions')
          .select(`
            id,
            amount,
            created_at,
            email
          `)
          .eq('user_id', user.id)
          .eq('merchant', 'Money Received')
          .eq('transfer_type', 'p2p_transfer')
          .order('created_at', { ascending: false })
          .limit(10);

        if (!transfers) return;

        const notifications = transfers.map(transfer => ({
          id: transfer.id,
          amount: Number(transfer.amount),
          sender_email: transfer.email || 'Unknown',
          created_at: transfer.created_at,
          read: false
        }));

        setNotifications(notifications);
        setUnreadCount(notifications.length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    }

    fetchNotifications();

    // Subscribe to new transfers where the user is the recipient
    channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `merchant=eq.Money Received AND transfer_type=eq.p2p_transfer`
        },
        async (payload: any) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user || payload.new.user_id !== user.id) return;

          const newNotification = {
            id: payload.new.id,
            amount: Number(payload.new.amount),
            sender_email: payload.new.email || 'Unknown',
            created_at: payload.new.created_at,
            read: false
          };

          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <ArrowDownLeft className="w-5 h-5 text-green-500 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Received {formatAmount(notification.amount)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        From: {notification.sender_email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}