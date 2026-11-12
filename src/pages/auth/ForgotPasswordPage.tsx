import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Por favor escribe tu correo electrónico.');
      return;
    }

    try {
      setLoading(true);
      const { error: resetError } = await resetPassword(email);
      if (resetError) {
        setError(resetError.message || 'Error al enviar el enlace de recuperación.');
        return;
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
          Recuperar Contraseña
        </h3>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          Te enviaremos un enlace seguro para restablecer tu acceso
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {submitted ? (
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-900/50">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
            Revisa tu bandeja de entrada
          </h4>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2 mb-6">
            Hemos enviado un enlace a <span className="font-semibold text-gray-700 dark:text-zinc-300">{email}</span> para actualizar tu contraseña.
          </p>
          <Link to="/login">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              Volver a Iniciar Sesión
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="tu@negocio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
            required
          />

          <Button
            type="submit"
            className="w-full mt-2"
            size="md"
            loading={loading}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Enviar Enlace de Recuperación
          </Button>

          <div className="text-center mt-4">
            <Link
              to="/login"
              className="text-xs text-gray-500 hover:text-emerald-600 font-medium inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Regresar al inicio de sesión</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};
