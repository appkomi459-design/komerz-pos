import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Users,
  UserCheck,
  Globe,
  CheckCircle2,
  Trash2,
  Megaphone,
  Clock,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/formatters';

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  target: 'all' | 'clients' | 'users';
  created_at: string;
}

const TARGET_LABELS: Record<string, { label: string; icon: React.FC<any>; color: string }> = {
  all:     { label: 'Todos',          icon: Globe,      color: 'blue' },
  clients: { label: 'Solo Clientes',  icon: UserCheck,  color: 'emerald' },
  users:   { label: 'Solo Usuarios',  icon: Users,      color: 'amber' },
};

export const SuperAdminNotificationsPage: React.FC = () => {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const [title, setTitle]   = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all' | 'clients' | 'users'>('all');

  const fetchNotifications = async () => {
    try {
      const { data } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setNotifications(data as AdminNotification[]);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  // Suscripción en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel('admin_notifs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    try {
      setSending(true);
      const { error } = await supabase.from('admin_notifications').insert({
        title: title.trim(),
        message: message.trim(),
        target,
        created_by: user?.id,
      });

      if (error) throw error;

      setTitle('');
      setMessage('');
      setTarget('all');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
      await fetchNotifications();
    } catch (err: any) {
      alert(`Error al enviar: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta notificación?')) return;
    await supabase.from('admin_notifications').delete().eq('id', id);
    await fetchNotifications();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-zinc-100 tracking-tight">
          Notificaciones a Usuarios
        </h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          Envía avisos, anuncios y recordatorios a tus usuarios o clientes. Aparecen en su panel de negocio.
        </p>
      </div>

      {/* Éxito */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-sm text-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          ¡Notificación enviada! Todos los destinatarios la verán la próxima vez que abran su panel.
        </div>
      )}

      {/* Formulario con Cabecera Oscura */}
      <div className="bg-white dark:bg-[#181615] rounded-3xl border-2 border-slate-900/90 dark:border-zinc-700 shadow-2xl overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-4.5 border-b-2 border-slate-950 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00b09b] to-[#96c93d] text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white tracking-tight">
              Nueva Notificación Masiva
            </h2>
            <p className="text-xs font-bold text-slate-300">
              El mensaje aparecerá en la campana de avisos del panel de cada usuario o cliente
            </p>
          </div>
        </div>

        <form onSubmit={handleSend} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-200 mb-2">
              Título del aviso *
            </label>
            <input
              type="text"
              placeholder="Ej. Mantenimiento programado el domingo, Nuevo plan disponible..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-zinc-800/80 text-slate-950 dark:text-zinc-100 text-sm font-bold rounded-2xl border border-slate-300 dark:border-zinc-700 p-3.5 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-200 mb-2">
              Mensaje del comunicado *
            </label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe el contenido detallado del aviso que leerán en su negocio..."
              className="w-full bg-slate-50 dark:bg-zinc-800/80 text-slate-950 dark:text-zinc-100 text-sm font-bold rounded-2xl border border-slate-300 dark:border-zinc-700 p-3.5 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 resize-none transition-all leading-relaxed"
            />
          </div>

          {/* Destinatarios */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-200 mb-2">
              Audiencia Destinataria
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['all', 'clients', 'users'] as const).map((t) => {
                const info = TARGET_LABELS[t];
                const Icon = info.icon;
                const isSelected = target === t;
                const activeGrad =
                  t === 'all'
                    ? 'bg-gradient-to-br from-[#00b09b] to-[#96c93d] text-white shadow-lg shadow-emerald-500/25 border-transparent'
                    : t === 'clients'
                    ? 'bg-gradient-to-br from-[#eb3349] to-[#f45c43] text-white shadow-lg shadow-rose-500/25 border-transparent'
                    : 'bg-gradient-to-br from-[#f2994a] to-[#f2c94c] text-white shadow-lg shadow-amber-500/25 border-transparent';

                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTarget(t)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer text-center font-black text-xs ${
                      isSelected
                        ? activeGrad
                        : 'border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-400 hover:border-slate-400 bg-slate-50 dark:bg-zinc-800/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{info.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Enviando comunicado...' : 'Enviar Notificación Ahora'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Historial de Avisos */}
      <div className="bg-white dark:bg-[#181615] rounded-3xl border-2 border-slate-900/90 dark:border-zinc-700 shadow-2xl overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center gap-2.5 border-b-2 border-slate-950">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2980b9] to-[#2c3e50] text-white flex items-center justify-center font-bold shadow-xs">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-white tracking-tight">
              Historial de Notificaciones Enviadas ({notifications.length})
            </h3>
            <p className="text-xs font-bold text-slate-300">
              Avisos activos mostrándose actualmente en los paneles de clientes
            </p>
          </div>
        </div>

        <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center text-slate-500 dark:text-zinc-400">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-black text-slate-800 dark:text-zinc-200">Aún no has enviado ninguna notificación.</p>
            <p className="text-xs font-bold mt-1">Usa el formulario de arriba para comunicarte con tus usuarios.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const targetInfo = TARGET_LABELS[n.target];
              const TargetIcon = targetInfo.icon;
              return (
                <div
                  key={n.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border-2 border-slate-200 dark:border-zinc-700 flex items-start justify-between gap-3 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="text-sm font-black text-slate-950 dark:text-zinc-100">
                          {n.title}
                        </h4>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg shadow-xs flex items-center gap-1 ${
                          n.target === 'all'
                            ? 'bg-blue-600 text-white'
                            : n.target === 'clients'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-500 text-slate-950'
                        }`}>
                          <TargetIcon className="w-2.5 h-2.5" />
                          {targetInfo.label}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                        {n.message}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-rose-500" />
                        Enviado el {formatDate(n.created_at)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors flex-shrink-0 cursor-pointer"
                    title="Eliminar notificación"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}</div>
      </div>
    </div>
  );
};
