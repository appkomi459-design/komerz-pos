import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
  User,
  Building,
  AlertCircle,
  Search,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils/formatters';

interface Suggestion {
  id: string;
  user_name: string | null;
  user_email: string | null;
  business_id: string | null;
  subject: string | null;
  message: string;
  status: 'pendiente' | 'leido' | 'respondido';
  admin_reply: string | null;
  created_at: string;
}

export const SuperAdminSuggestionsPage: React.FC = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pendiente' | 'respondido'>('all');
  const [replyText, setReplyText] = useState<{ [id: string]: string }>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setSuggestions(data as Suggestion[]);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleSendReply = async (id: string) => {
    const reply = replyText[id];
    if (!reply || !reply.trim()) return;

    try {
      setSavingId(id);
      const { error } = await supabase
        .from('suggestions')
        .update({
          admin_reply: reply.trim(),
          status: 'respondido',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      await fetchSuggestions();
    } catch (err: any) {
      alert(`Error al guardar respuesta: ${err.message}`);
    } finally {
      setSavingId(null);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      setSavingId(id);
      await supabase
        .from('suggestions')
        .update({ status: 'leido', updated_at: new Date().toISOString() })
        .eq('id', id);
      await fetchSuggestions();
    } catch (err: any) {
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  const filtered = suggestions.filter((s) => {
    if (filter === 'pendiente') return s.status === 'pendiente';
    if (filter === 'respondido') return s.status === 'respondido';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-zinc-100 tracking-tight">
            Buzón y Chat de Sugerencias
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Mensajes, comentarios y peticiones enviadas por usuarios en prueba y clientes
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-gradient-to-r from-[#00b09b] to-[#96c93d] text-white shadow-md shadow-emerald-500/30'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
            }`}
          >
            Todas ({suggestions.length})
          </button>
          <button
            onClick={() => setFilter('pendiente')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              filter === 'pendiente'
                ? 'bg-gradient-to-r from-[#f2994a] to-[#f2c94c] text-white shadow-md shadow-amber-500/30'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
            }`}
          >
            Pendientes ({suggestions.filter((s) => s.status === 'pendiente').length})
          </button>
          <button
            onClick={() => setFilter('respondido')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              filter === 'respondido'
                ? 'bg-gradient-to-r from-[#2980b9] to-[#2c3e50] text-white shadow-md shadow-blue-500/30'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
            }`}
          >
            Respondidas ({suggestions.filter((s) => s.status === 'respondido').length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-gray-400">
          Cargando mensajes...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center text-gray-400 dark:text-zinc-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold">No hay sugerencias en esta bandeja.</p>
          <p className="text-xs mt-1">Cuando los usuarios o clientes envíen sugerencias desde su panel, aparecerán aquí.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#181615] rounded-3xl border-2 border-slate-900/90 dark:border-zinc-700 shadow-2xl overflow-hidden"
            >
              <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-slate-950">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-sm shadow-xs">
                    {item.user_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <span className="font-black text-white text-sm">
                      {item.user_name || 'Usuario'}
                    </span>
                    <span className="text-slate-300 text-xs font-bold font-mono ml-2">
                      ({item.user_email})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-xl shadow-xs ${
                      item.status === 'respondido'
                        ? 'bg-emerald-500 text-white'
                        : item.status === 'leido'
                        ? 'bg-blue-500 text-white'
                        : 'bg-amber-400 text-slate-950'
                    }`}
                  >
                    {item.status.toUpperCase()}
                  </span>
                  <span className="text-xs font-bold text-slate-300">
                    {formatDate(item.created_at)}
                  </span>
                </div>
              </div>

              {/* Cuerpo de la tarjeta */}
              <div className="p-6 space-y-4">

              {/* Contenido del mensaje */}
              <div>
                {item.subject && (
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-200 mb-2">
                    ASUNTO: {item.subject}
                  </h4>
                )}
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 bg-slate-100 dark:bg-zinc-800/60 p-4 rounded-2xl border-l-4 border-l-emerald-500 leading-relaxed shadow-xs">
                  {item.message}
                </p>
              </div>

              {/* Respuesta del Administrador */}
              {item.admin_reply ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-950 dark:text-emerald-200">
                  <p className="font-black flex items-center gap-1.5 mb-1.5 text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Tu Respuesta enviada al usuario:
                  </p>
                  <p className="font-bold text-slate-800 dark:text-zinc-200 leading-relaxed">{item.admin_reply}</p>
                </div>
              ) : (
                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    placeholder="Escribe una respuesta para este usuario o cliente..."
                    value={replyText[item.id] || ''}
                    onChange={(e) =>
                      setReplyText({ ...replyText, [item.id]: e.target.value })
                    }
                    className="flex-1 bg-slate-50 dark:bg-zinc-800 text-slate-950 dark:text-zinc-100 font-bold text-xs rounded-2xl border border-slate-300 dark:border-zinc-700 px-4 py-3 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                  <button
                    disabled={savingId === item.id}
                    onClick={() => handleSendReply(item.id)}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-md shadow-emerald-600/30 cursor-pointer flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span>{savingId === item.id ? 'Enviando...' : 'Responder'}</span>
                  </button>
                </div>
              )}</div>{/* /p-6 body */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
