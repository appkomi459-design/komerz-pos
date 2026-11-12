import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/formatters';

interface Suggestion {
  id: string;
  subject: string | null;
  message: string;
  status: 'pendiente' | 'leido' | 'respondido';
  admin_reply: string | null;
  created_at: string;
}

export const SuggestionsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { activeBusiness } = useBusiness();

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchMySuggestions = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('suggestions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setSuggestions(data as Suggestion[]);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  };

  useEffect(() => {
    fetchMySuggestions();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    try {
      setLoading(true);
      const { error } = await supabase.from('suggestions').insert({
        user_id: user.id,
        business_id: activeBusiness?.id || null,
        user_name: profile?.full_name || user.email?.split('@')[0],
        user_email: user.email,
        subject: subject.trim() || 'Sugerencia de mejora',
        message: message.trim(),
        status: 'pendiente',
      });

      if (error) throw error;

      setMessage('');
      setSubject('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
      await fetchMySuggestions();
    } catch (err: any) {
      alert(`Error al enviar sugerencia: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-zinc-100 tracking-tight">
          Buzón y Chat de Sugerencias
        </h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          Envía sugerencias de mejora, dudas o peticiones de funciones directamente al Administrador
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>¡Tu mensaje ha sido enviado al Administrador con éxito! Te responderá a la brevedad.</span>
        </div>
      )}

      {/* Formulario de Nueva Sugerencia */}
      <Card>
        <CardHeader>
          <CardTitle>Enviar Mensaje al Administrador</CardTitle>
          <CardDescription>
            Tu opinión es clave para adaptar el sistema a las necesidades de tu negocio
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Asunto (Opcional)"
            placeholder="Ej. Me gustaría poder imprimir recibos en 80mm, duda con inventario..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-1.5">
              Tu Mensaje o Sugerencia *
            </label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe aquí con detalle tu propuesta, duda o sugerencia..."
              className="w-full bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 text-sm rounded-xl border border-gray-200 dark:border-zinc-800 p-3.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              loading={loading}
              icon={<Send className="w-4 h-4" />}
            >
              Enviar Sugerencia
            </Button>
          </div>
        </form>
      </Card>

      {/* Historial de mis sugerencias y respuestas del admin */}
      <div className="space-y-4 pt-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100">
          Mis Mensajes Enviados ({suggestions.length})
        </h3>

        {suggestions.length === 0 ? (
          <Card className="p-8 text-center text-gray-400 dark:text-zinc-500">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">Aún no has enviado sugerencias.</p>
            <p className="text-xs mt-1">Usa el formulario de arriba para comunicarte con el administrador.</p>
          </Card>
        ) : (
          suggestions.map((s) => (
            <Card key={s.id} className="p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-2.5">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-zinc-100">
                    {s.subject || 'Sugerencia'}
                  </h4>
                  <span className="text-[10px] text-gray-400">
                    Enviado el {formatDate(s.created_at)}
                  </span>
                </div>
                <Badge
                  variant={
                    s.status === 'respondido'
                      ? 'emerald'
                      : s.status === 'leido'
                      ? 'blue'
                      : 'amber'
                  }
                  size="sm"
                >
                  {s.status.toUpperCase()}
                </Badge>
              </div>

              <p className="text-xs text-gray-700 dark:text-zinc-300">
                {s.message}
              </p>

              {s.admin_reply && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs">
                  <p className="font-bold text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Respuesta del Administrador:
                  </p>
                  <p className="text-emerald-950 dark:text-emerald-200">{s.admin_reply}</p>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
