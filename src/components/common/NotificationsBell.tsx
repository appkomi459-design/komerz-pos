import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Megaphone, Clock, X, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatDate } from '@/utils/formatters';

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  target: 'all' | 'clients' | 'users';
  created_at: string;
}

export const NotificationsBell: React.FC = () => {
  const { subscription } = useBusiness();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadIds, setUnreadIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determinar tipo de cuenta (cliente de pago vs usuario de prueba/free)
  const isPaying = subscription && subscription.status === 'active' && subscription.plan?.code !== 'free';

  // Leer IDs ya leídos del localStorage
  const getReadIds = (): string[] => {
    try {
      const stored = localStorage.getItem('komi_read_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveReadIds = (ids: string[]) => {
    try {
      localStorage.setItem('komi_read_notifications', JSON.stringify(ids));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data) {
        // Filtrar según el target (all, clients, users)
        const relevant = (data as AdminNotification[]).filter((n) => {
          if (n.target === 'all') return true;
          if (n.target === 'clients' && isPaying) return true;
          if (n.target === 'users' && !isPaying) return true;
          return false;
        });

        setNotifications(relevant);

        const read = getReadIds();
        const unread = relevant.map((n) => n.id).filter((id) => !read.includes(id));
        setUnreadIds(unread);
      }
    } catch (err) {
      console.error('Error fetching admin notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Suscripción en tiempo real
    const channel = supabase
      .channel('client_admin_notifs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isPaying]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    const existing = getReadIds();
    const updated = Array.from(new Set([...existing, ...allIds]));
    saveReadIds(updated);
    setUnreadIds([]);
  };

  const markAsRead = (id: string) => {
    const existing = getReadIds();
    if (!existing.includes(id)) {
      const updated = [...existing, id];
      saveReadIds(updated);
      setUnreadIds((prev) => prev.filter((item) => item !== id));
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        title="Notificaciones y avisos"
        aria-label="Notificaciones"
      >
        <Bell className="w-4 h-4" />
        {unreadIds.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-sm">
            {unreadIds.length > 9 ? '9+' : unreadIds.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-2xl z-50 overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
                Avisos de Komi
              </h3>
            </div>
            {unreadIds.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Marcar leídas</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Info className="w-8 h-8 text-gray-300 dark:text-zinc-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400">
                  No hay avisos pendientes
                </p>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                  Los comunicados del administrador aparecerán aquí
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const isUnread = unreadIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => markAsRead(item.id)}
                    className={`p-4 transition-colors cursor-pointer ${
                      isUnread
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                        )}
                        <h4
                          className={`text-xs ${
                            isUnread
                              ? 'font-bold text-gray-950 dark:text-zinc-50'
                              : 'font-semibold text-gray-700 dark:text-zinc-300'
                          }`}
                        >
                          {item.title}
                        </h4>
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-zinc-500 flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-zinc-400 whitespace-pre-line leading-relaxed pl-4">
                      {item.message}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
